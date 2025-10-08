# API Auth & Token Generation

This document explains the auth options for local development and test tokens.

## Secrets used by the API

- `AGENT_RUN_SECRET` — a simple shared secret used by legacy endpoints (kept for compatibility). Place in your environment for local runs. Example: `export AGENT_RUN_SECRET=test-secret`.
- `AGENT_JWT_SECRET` — HMAC secret used to sign dev JWT tokens. Example: `export AGENT_JWT_SECRET=dev-secret`.
- `AGENT_SECRETS_PROVIDER` — choose `local` or `aws` (default: `local`).

## Generating a test token (dev)

A helper script is included: `apps/api/scripts/generate-token.js`.

Example:

```bash
AGENT_JWT_SECRET=dev-secret pnpm -C apps/api run gen-token
```

This prints a bearer token that can be used in requests:

```
Authorization: Bearer <token>
```

The token payload contains `roles` and `exp`.

## Running Playwright E2E locally

Start the web app and API in separate terminals (or use the dev-compose):

```bash
# terminal 1
pnpm -C apps/api start:dev

# terminal 2
pnpm -C apps/web dev
```

Run Playwright tests:

```bash
pnpm e2e
```

## Secrets provider

By default the `SecretsService` uses a local file provider. To switch providers set the `AGENT_SECRETS_PROVIDER` env var to `aws` and configure credentials accordingly. The AWS provider is scaffolded as a placeholder and requires implementation and AWS SDK credentials to function.

## Production recommendation

- Replace HMAC-signed tokens with RS256 JWT issued by a trusted identity provider.
- Use a secrets manager (AWS Secrets Manager, HashiCorp Vault) for production secrets.

