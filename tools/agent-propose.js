#!/usr/bin/env node
/*
 Simple CLI used by GitHub Actions to call the OpenAI API, parse proposals, and
 create a draft PR with proposed file changes. Designed to be self-contained
 (no external npm deps) so the workflow can run fast.

 Usage (Action sets env vars):
  COMMENT_BODY - the comment body that triggered the action
  GITHUB_REPOSITORY - owner/repo
  GITHUB_TOKEN - token with repo permissions
  OPENAI_API_KEY - OpenAI key

 The comment body should contain `/agent propose` and may include `file=` and `goal=`
 e.g.
   /agent propose file=README.md goal="Make a one-line clarification"
*/

const fs = require('fs');
const path = require('path');

const COMMENT = process.env.COMMENT_BODY || process.argv.slice(2).join(' ') || '';
const REPO = process.env.GITHUB_REPOSITORY || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;

if (!REPO) {
  console.error('GITHUB_REPOSITORY not set');
  process.exit(1);
}
if (!GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN not set');
  process.exit(1);
}
if (!OPENAI_KEY) {
  console.error('OPENAI_API_KEY not set');
  process.exit(1);
}

const [owner, repo] = REPO.split('/');

function parseComment(comment) {
  // simple parser for `file=...` and `goal="..."` tokens
  const fileMatch = comment.match(/file=([^\s]+)/i);
  const goalMatch = comment.match(/goal=(?:"([^"]+)"|'([^']+)'|([^\n]+))/i);
  const file = fileMatch ? fileMatch[1].trim() : 'README.md';
  const goal = goalMatch ? (goalMatch[1] || goalMatch[2] || goalMatch[3]).trim() : 'Make a small, safe improvement';
  return { file, goal };
}

async function callOpenAI(filePath, goal, currentContent) {
  const system = 'You are a safe code-review assistant. Respond ONLY with a JSON array matching UpgradeProposalDTO: [{"filePath":string, "proposedContent":string, "rationale":string}]';
  const user = `File: ${filePath}\nGoal: ${goal}\nCurrent content:\n${currentContent}`;

  const url = 'https://api.openai.com/v1/chat/completions';
  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_tokens: 1500,
    temperature: 0.2,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${txt}`);
  }

  const j = await res.json();
  // defensive extraction
  const content = j?.choices?.[0]?.message?.content || j?.choices?.[0]?.text || '';
  return extractJson(content);
}

function extractJson(text) {
  if (!text) return '';
  const fence = /```(?:json)?\s*([\s\S]*?)\s*```/i.exec(text);
  if (fence) return fence[1].trim();
  const inline = /`([^`]+)`/.exec(text);
  if (inline) return inline[1].trim();
  const firstArray = text.indexOf('[');
  const firstObj = text.indexOf('{');
  if (firstArray !== -1) {
    const lastArray = text.lastIndexOf(']');
    if (lastArray > firstArray) return text.slice(firstArray, lastArray + 1).trim();
  }
  if (firstObj !== -1) {
    const lastObj = text.lastIndexOf('}');
    if (lastObj > firstObj) return text.slice(firstObj, lastObj + 1).trim();
  }
  return text.trim();
}

async function githubRequest(path, method = 'GET', body = null) {
  const url = `https://api.github.com${path}`;
  const opts = { method, headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'agent-bot' } };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const txt = await res.text();
  let json;
  try { json = txt ? JSON.parse(txt) : {}; } catch (e) { json = { text: txt }; }
  if (!res.ok) {
    const err = new Error(`GitHub ${method} ${path} failed: ${res.status} ${JSON.stringify(json)}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

function simpleSecretScan(text) {
  if (!text) return false;
  const patterns = [/AKIA[0-9A-Z]{16}/i, /-----BEGIN PRIVATE KEY-----/i, /sk-[A-Za-z0-9_-]{16,}/i];
  return patterns.some((p) => p.test(text));
}

async function run() {
  const { file, goal } = parseComment(COMMENT);

  // read current content from disk if present (the Action checks out repo), otherwise empty
  let current = '';
  try { current = fs.readFileSync(path.join(process.cwd(), file), 'utf8'); } catch (e) { current = ''; }

  console.log(`Proposing changes for ${file} — goal: ${goal}`);

  const cleaned = await callOpenAI(file, goal, current);
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse JSON from LLM output');
    console.error(cleaned);
    throw e;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('LLM did not return a non-empty array of proposals');
  }

  // simple validation and secret scan
  for (const p of parsed) {
    if (!p.filePath || !('proposedContent' in p) || !p.rationale) throw new Error('Proposal missing required fields');
    if (simpleSecretScan(p.proposedContent)) throw new Error('Secret detected in proposed content — aborting');
  }

  // create a branch
  const timestamp = Date.now();
  const branch = `agent/proposal-${timestamp}`;
  console.log('Creating branch', branch);

  // get reference of main branch
  const baseRef = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/main`);
  const baseSha = baseRef?.object?.sha;
  if (!baseSha) throw new Error('Could not get base sha for main');

  await githubRequest(`/repos/${owner}/${repo}/git/refs`, 'POST', { ref: `refs/heads/${branch}`, sha: baseSha });

  // for each proposal, create/update the file on the new branch
  for (const p of parsed) {
    const targetPath = p.filePath;
    const content = Buffer.from(p.proposedContent, 'utf8').toString('base64');

    // check if file exists to include sha for update
    let existing;
    try {
      existing = await githubRequest(`/repos/${owner}/${repo}/contents/${encodeURIComponent(targetPath)}?ref=${branch}`);
    } catch (e) {
      existing = null;
    }

    const message = `agent: propose changes to ${targetPath} — ${p.rationale}`;
    const payload = {
      message,
      content,
      branch,
    };
    if (existing && existing.sha) payload.sha = existing.sha;

    console.log(`Uploading ${targetPath} to branch ${branch}`);
    await githubRequest(`/repos/${owner}/${repo}/contents/${encodeURIComponent(targetPath)}`, 'PUT', payload);
  }

  // create a draft PR
  const title = `agent: proposed changes ${new Date(timestamp).toISOString()}`;
  const body = `This PR was created by the autonomous agent based on comment:\n\n${COMMENT}\n\nProposals:\n${JSON.stringify(parsed, null, 2)}`;
  const pr = await githubRequest(`/repos/${owner}/${repo}/pulls`, 'POST', { title, head: branch, base: 'main', body, draft: true });

  console.log('Created draft PR:', pr.html_url);
  // Optionally comment on the original issue/comment - Actions workflow can do that too; we'll print the URL
  console.log(pr.html_url);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
