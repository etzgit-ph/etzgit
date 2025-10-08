#!/usr/bin/env node
const jwt = require('jsonwebtoken');
const args = require('minimist')(process.argv.slice(2));

function usage() {
  console.log('Usage: generate-token.js [--secret SECRET] [--roles role1,role2] [--exp seconds-from-now]');
  console.log('If --secret is not provided, AGENT_JWT_SECRET env var will be used.');
}

if (args.h || args.help) {
  usage();
  process.exit(0);
}

const secret = args.secret || process.env.AGENT_JWT_SECRET;
if (!secret) {
  console.error('Missing secret: provide --secret or set AGENT_JWT_SECRET');
  process.exit(2);
}

const roles = (args.roles || 'agent').split(/[,\s]+/).filter(Boolean);
const expSeconds = parseInt(args.exp || '3600', 10);

const payload = { roles };
const token = jwt.sign(payload, secret, { expiresIn: expSeconds });
console.log(token);
