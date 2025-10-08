#!/usr/bin/env node
/* eslint-disable */
import jwt from 'jsonwebtoken';
import minimist from 'minimist';

function usage() {
  console.log(
    'Usage: generate-token.js [--secret SECRET] [--roles role1,role2] [--exp seconds-from-now]',
  );
  console.log('If --secret is not provided, AGENT_JWT_SECRET env var will be used.');
}

export function main(argv = process.argv.slice(2)) {
  const args = minimist(argv);

  if (args.h || args.help) {
    usage();
    return 0;
  }

  const secret = args.secret || process.env.AGENT_JWT_SECRET;
  if (!secret) {
    console.error('Missing secret: provide --secret or set AGENT_JWT_SECRET');
    return 2;
  }

  const roles = (args.roles || 'agent').split(/[,\s]+/).filter(Boolean);
  const expSeconds = parseInt(args.exp || '3600', 10);

  const payload = { roles };
  const token = jwt.sign(payload, secret, { expiresIn: expSeconds });
  console.log(token);

  return 0;
}

if (process.argv[1] && process.argv[1].endsWith('generate-token.js')) {
  // Called as CLI
  process.exit(main(process.argv.slice(2)));
}
