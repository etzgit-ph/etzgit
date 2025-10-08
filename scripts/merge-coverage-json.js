#!/usr/bin/env node
/* eslint-env node */
/* global require, process, console */
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(process.cwd(), 'coverage', 'coverage-final.json');
let aggregate = {};

function mergeFile(fp) {
  try {
    const raw = fs.readFileSync(fp, 'utf8');
    const parsed = JSON.parse(raw);
    for (const [k, v] of Object.entries(parsed)) {
      aggregate[k] = v;
    }
  } catch (err) {
    console.error('Failed to merge', fp, err.message);
  }
}

// find coverage-final.json files (excluding node_modules)
const entries = [];
const { execSync } = require('child_process');
try {
  const out = execSync("find . -path './node_modules' -prune -o -name 'coverage-final.json' -print", { encoding: 'utf8' });
  out.split('\n').map(s => s.trim()).filter(Boolean).forEach(p => entries.push(p));
} catch (err) {
  // fallback: check common paths
  ['apps/api/src/apps/api/coverage/jest/coverage-final.json','apps/api/coverage/coverage-final.json'].forEach(p => {
    if (fs.existsSync(p)) entries.push(p);
  });
}

if (entries.length === 0) {
  console.log('No coverage-final.json files found');
  process.exit(0);
}

for (const e of entries) mergeFile(e);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(aggregate, null, 2), 'utf8');
console.log('Wrote aggregated coverage to', OUT);