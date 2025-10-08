#!/usr/bin/env node
/* eslint-env node */
/* global require, process, console */
const fs = require('fs');
const path = require('path');

const COVERAGE_JSON = path.resolve(process.cwd(), 'coverage', 'coverage-final.json');
const thresholds = { lines: 80, functions: 80, branches: 80 };

function fail(msg) {
  console.error(msg);
  process.exit(2);
}

if (!fs.existsSync(COVERAGE_JSON)) {
  fail(`coverage report not found at ${COVERAGE_JSON}`);
}

const raw = fs.readFileSync(COVERAGE_JSON, 'utf8');
let parsed;
try {
  parsed = JSON.parse(raw);
} catch (err) {
  fail('Failed to parse coverage-final.json: ' + err.message);
}

// coverage-final.json usually maps filenames to coverage data; compute aggregated percentages
let totals = { lines: { total: 0, covered: 0 }, functions: { total: 0, covered: 0 }, branches: { total: 0, covered: 0 } };
for (const file of Object.values(parsed)) {
  if (!file || typeof file !== 'object') continue;
  if (file.lines) {
    totals.lines.total += file.lines.total || 0;
    totals.lines.covered += file.lines.covered || 0;
  }
  if (file.functions) {
    totals.functions.total += file.functions.total || 0;
    totals.functions.covered += file.functions.covered || 0;
  }
  if (file.branches) {
    totals.branches.total += file.branches.total || 0;
    totals.branches.covered += file.branches.covered || 0;
  }
}

function pct(covered, total) {
  if (total === 0) return 100;
  return (covered / total) * 100;
}

const results = {
  lines: pct(totals.lines.covered, totals.lines.total),
  functions: pct(totals.functions.covered, totals.functions.total),
  branches: pct(totals.branches.covered, totals.branches.total),
};

console.log('Coverage results (aggregated):', results);

for (const k of Object.keys(thresholds)) {
  if (results[k] < thresholds[k]) {
    fail(`Coverage threshold not met for ${k}: ${results[k].toFixed(2)}% < ${thresholds[k]}%`);
  }
}

console.log('Coverage thresholds met.');
process.exit(0);
