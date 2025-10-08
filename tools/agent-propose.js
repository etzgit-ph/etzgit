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
const ISSUE_NUMBER = process.env.ISSUE_NUMBER || process.env.GITHUB_ISSUE_NUMBER || null;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null;
const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || null;
const DRY_RUN = (process.env.DRY_RUN || 'false').toLowerCase() === 'true';

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
  // Stricter prompt: require a fenced JSON code block and at least one proposal.
  const system = 'You are a safe code-review assistant. Return ONLY a single fenced JSON block (```json ... ```). The JSON must be an array with at least one object. Each object must follow UpgradeProposalDTO: {"filePath": string, "proposedContent": string, "rationale": string}. Do NOT include any extra text, commentary, or markdown outside the fenced JSON.';
  const user = `Please propose at least one small, harmless change. File: ${filePath}\nGoal: ${goal}\nCurrent content:\n${currentContent}`;

  const url = 'https://api.openai.com/v1/chat/completions';
  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_tokens: 1500,
    temperature: 0.1,
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

// Fallback: ask the LLM for a single, harmless proposal when earlier attempts returned no proposals
async function askForSingleProposal(filePath, goal, currentContent) {
  const system = 'You are a strict assistant. Return ONLY a single-element JSON array (```json [ { ... } ] ```). The object must follow UpgradeProposalDTO and be harmless: one-line or small textual edits only.';
  const user = `Please return exactly one harmless proposal for file ${filePath} and goal: ${goal}. Current content:\n${currentContent}`;
  const url = 'https://api.openai.com/v1/chat/completions';
  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_tokens: 800,
    temperature: 0.0,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const j = await res.json();
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

async function listIssueComments(issueNumber) {
  return await githubRequest(`/repos/${owner}/${repo}/issues/${issueNumber}/comments`);
}

// Try to find the most recent comment containing 'Proposals:' or created by the actions bot
async function fetchProposalFromComments(issueNumber) {
  try {
    const comments = await listIssueComments(issueNumber);
    if (!Array.isArray(comments)) return null;
    // look for a comment that includes the marker 'Proposals:' (from dry-run)
    for (let i = comments.length - 1; i >= 0; i--) {
      const c = comments[i];
      if (c.body && c.body.includes('Proposals:')) return c.body;
    }
    return null;
  } catch (e) {
    return null;
  }
}

function repairJsonString(s) {
  if (!s || typeof s !== 'string') return s;
  let t = s.replace(/\r/g, '');
  // remove control chars
  t = t.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  // replace smart quotes
  t = t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  // remove trailing commas before ] or }
  t = t.replace(/,\s*(\]|\})/g, '$1');
  // try to wrap object in array if it looks like an object
  const firstChar = t.trim()[0];
  if (firstChar === '{') t = `[${t}]`;
  return t;
}

async function reaskForJson(originalContent, attempt = 1) {
  const system = 'You are a strict assistant: return ONLY a JSON array matching UpgradeProposalDTO with no extra text or markdown. If you previously returned text, extract and return only the valid JSON array.';
  const user = `Previous content:\n${originalContent}`;
  const url = 'https://api.openai.com/v1/chat/completions';
  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_tokens: 1500,
    temperature: 0.0,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const j = await res.json();
  const content = j?.choices?.[0]?.message?.content || j?.choices?.[0]?.text || '';
  return content;
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
    console.error('Failed to parse JSON from LLM output; attempting repair/retry...', e);
    // Attempt heuristic repair
    const repaired = repairJsonString(cleaned);
    try {
      parsed = JSON.parse(repaired);
      console.log('Recovered JSON via heuristics');
    } catch (e2) {
      console.log('Heuristic repair failed; reasking LLM for JSON-only reply (1)');
      const retry1 = await reaskForJson(cleaned, 1);
      const repaired2 = repairJsonString(retry1);
      try {
        parsed = JSON.parse(repaired2);
        console.log('Recovered JSON from LLM re-prompt attempt 1');
      } catch (e3) {
        console.log('Re-prompt 1 failed; reasking LLM a second time (2)');
        const retry2 = await reaskForJson(retry1, 2);
        const repaired3 = repairJsonString(retry2);
        try {
          parsed = JSON.parse(repaired3);
          console.log('Recovered JSON from LLM re-prompt attempt 2');
        } catch (e4) {
          console.error('All repair attempts failed; will post raw output for human review');
          // Post raw extracted content as a comment for human review (if issue available)
          if (ISSUE_NUMBER && GITHUB_TOKEN) {
            const body = `Agent attempted to propose changes but failed to produce valid JSON.\n\nExtracted content:\n\n\`\`\`\n${cleaned}\n\`\`\`\n\nPlease review and provide corrected JSON or run the agent again.`;
            if (!DRY_RUN) {
              await githubRequest(`/repos/${owner}/${repo}/issues/${ISSUE_NUMBER}/comments`, 'POST', { body });
            } else {
              console.log('[DRY_RUN] Would post comment to issue with extracted content for review');
            }
          }
          throw new Error('Failed to obtain valid JSON from LLM after retries');
        }
      }
    }
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    console.log('Parsed proposals empty; attempting single-proposal fallback');
    // try single-proposal fallback
    let singleRaw = null;
    try {
      singleRaw = await askForSingleProposal(file, goal, current);
      const singleRepaired = repairJsonString(singleRaw);
      const singleParsed = JSON.parse(singleRepaired);
      if (Array.isArray(singleParsed) && singleParsed.length > 0) {
        parsed = singleParsed;
        console.log('Recovered single proposal from fallback');
      }
    } catch (e) {
      console.log('Single-proposal fallback failed', e);
    }

    // if still empty, ask for a plain one-line suggestion (no JSON) and post for human review
    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.log('Attempting plain-text one-line suggestion fallback');
      try {
        const system = 'You are a concise assistant. Return EXACTLY one short sentence suggesting a harmless improvement to the file content.';
        const user = `File: ${file}\nGoal: ${goal}\nCurrent content:\n${current}`;
        const url = 'https://api.openai.com/v1/chat/completions';
        const body = {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          max_tokens: 100,
          temperature: 0.0,
        };
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify(body),
        });
        const j = await res.json();
        const suggestion = j?.choices?.[0]?.message?.content || j?.choices?.[0]?.text || '';
        const commentBody = `Agent could not produce structured proposals automatically. Plain suggestion:\n\n${suggestion}`;
        if (ISSUE_NUMBER && GITHUB_TOKEN) {
          if (!DRY_RUN) await githubRequest(`/repos/${owner}/${repo}/issues/${ISSUE_NUMBER}/comments`, 'POST', { body: commentBody });
          else console.log('[DRY_RUN] Would post plain suggestion to issue:', commentBody);
        } else {
          console.log('No ISSUE_NUMBER or GITHUB_TOKEN; plain suggestion:\n', suggestion);
        }
      } catch (e) {
        console.log('Plain-text fallback also failed', e);
      }

      throw new Error('LLM did not return a non-empty array of proposals after fallbacks');
    }
  }

  // stricter validation and secret scan
  for (const [i, p] of parsed.entries()) {
    if (typeof p !== 'object' || p === null) throw new Error(`Proposal[${i}] is not an object`);
    if (!p.filePath || typeof p.filePath !== 'string') throw new Error(`Proposal[${i}].filePath must be a string`);
    if (!('proposedContent' in p) || typeof p.proposedContent !== 'string') throw new Error(`Proposal[${i}].proposedContent must be a string`);
    if (!p.rationale || typeof p.rationale !== 'string') throw new Error(`Proposal[${i}].rationale must be a string`);
    if (simpleSecretScan(p.proposedContent)) throw new Error(`Secret detected in proposed content for ${p.filePath} — aborting`);
  }

  // create a branch
  const timestamp = Date.now();
  const branch = `agent/proposal-${timestamp}`;
  console.log('Creating branch', branch);

  // get reference of main branch
  const baseRef = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/main`);
  const baseSha = baseRef?.object?.sha;
  if (!baseSha) throw new Error('Could not get base sha for main');

  if (!DRY_RUN) {
    await githubRequest(`/repos/${owner}/${repo}/git/refs`, 'POST', { ref: `refs/heads/${branch}`, sha: baseSha });
  } else {
    console.log('[DRY_RUN] Skipping branch creation');
  }

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
    if (!DRY_RUN) {
      await githubRequest(`/repos/${owner}/${repo}/contents/${encodeURIComponent(targetPath)}`, 'PUT', payload);
    } else {
      console.log(`[DRY_RUN] Would upload ${targetPath} with commit message: ${message}`);
    }
  }

  // create a draft PR
  const title = `agent: proposed changes ${new Date(timestamp).toISOString()}`;
  const body = `This PR was created by the autonomous agent based on comment:\n\n${COMMENT}\n\nProposals:\n${JSON.stringify(parsed, null, 2)}`;
  let pr = null;
  if (!DRY_RUN) {
    pr = await githubRequest(`/repos/${owner}/${repo}/pulls`, 'POST', { title, head: branch, base: 'main', body, draft: true });
    console.log('Created draft PR:', pr.html_url);
  } else {
    console.log('[DRY_RUN] Would create draft PR with title:', title);
  }

  // Post a comment back to the triggering issue/PR when possible
  if (ISSUE_NUMBER && GITHUB_TOKEN) {
    if (DRY_RUN) {
      // Post proposals back to the issue for human review
      const body = `Agent DRY-RUN proposals for comment:\n\n${COMMENT}\n\nProposals:\n\n\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
      await githubRequest(`/repos/${owner}/${repo}/issues/${ISSUE_NUMBER}/comments`, 'POST', { body });
      console.log('[DRY_RUN] Posted proposals to issue number', ISSUE_NUMBER);
    } else {
      const commentBody = pr ? `Agent created draft PR: ${pr.html_url}` : `Agent would create draft PR. See proposals above.`;
      await githubRequest(`/repos/${owner}/${repo}/issues/${ISSUE_NUMBER}/comments`, 'POST', { body: commentBody });
      console.log('Posted comment to issue number', ISSUE_NUMBER);
    }
  } else {
    console.log('No ISSUE_NUMBER or GITHUB_TOKEN available: skipping issue comment');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
