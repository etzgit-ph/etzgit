#!/usr/bin/env node
/* eslint-env node */
/* global process, console */
// Simple helper to parse terraform output JSON from stdin and print GitHub Actions masked outputs.
// Usage: node set-output.js <key>  (reads JSON from stdin)

function main() {
  const key = process.argv[2];
  if (!key) {
    console.error('Usage: set-output.js <tf_output_key>');
    process.exit(2);
  }
  let raw = '';
  process.stdin.on('data', (chunk) => {
    raw += chunk;
  });
  process.stdin.on('end', () => {
    try {
      const tf = JSON.parse(raw || '{}');
      const val = tf[key] && tf[key].value ? tf[key].value : '';
      if (val) {
        // Masking for logs
        console.log(`::add-mask::${val}`);
        // Emit GitHub Actions output
        console.log(`::set-output name=${key}::${val}`);
      }
    } catch (err) {
      console.error('Failed to parse terraform output JSON:', err.message);
      process.exit(1);
    }
  });
}

main();
