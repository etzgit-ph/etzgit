#!/usr/bin/env node
/* eslint-env node */
/* global fetch, process, console, require */
const fs = require('fs');

async function main() {
  const url = process.argv[2] || 'http://localhost:3000/llm/demo';
  const secret = process.env.AGENT_RUN_SECRET || 'secret';
  const payloadPath = process.argv[3] || null;
  let body = {
    filePath: 'README.md',
    currentContent: 'Old',
    goal: 'Improve',
  };
  if (payloadPath && fs.existsSync(payloadPath)) {
    body = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-agent-secret-key': secret,
    },
    body: JSON.stringify(body),
  });

  const txt = await res.text();
  console.log('Status:', res.status);
  console.log(txt);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
