# apps/api — LLM demo & local setup

This app contains a guarded demo endpoint for the LLM integration and a small CLI tool for local testing.

Environment

- Set `OPENAI_API_KEY` (or `LLM_API_KEY`) in `apps/api/.env.local` or as environment variables when running the server.
- The demo endpoint is feature-gated by `LLM_DEMO_ENABLED=false` by default. Set it to `true` to enable the demo endpoint.
- The demo endpoint also requires the secret header `x-agent-secret-key` (match `API_SECRET_KEY` from your env).

Demo CLI

A small CLI exists at `tools/llm-cli.js` which posts to `POST /llm/demo` and sends the secret header automatically from `AGENT_RUN_SECRET` env. Example usage (from repo root):

```bash
# set env variables (example)
export OPENAI_API_KEY=sk-...yourkey
export AGENT_RUN_SECRET=replace_with_a_secure_secret
export LLM_DEMO_ENABLED=true

# start the API (e.g., pnpm --filter ./apps/api -C apps/api start:dev)
# then run the CLI (it expects the API at http://localhost:3000 by default)
node tools/llm-cli.js --file README.md --goal "Make a tiny harmless one-line suggestion"
```

Integration test

A gated integration test `test/integration/llm.integration.spec.ts` exists but is skipped unless `OPENAI_API_KEY` or `LLM_API_KEY` is provided in the environment. This prevents accidental real API calls during CI or local runs.

Security

- Avoid committing your real API keys to the repo. Use environment variables or CI secrets.
- This demo endpoint is intentionally read-only (returns proposals only) and is guarded by a secret header and feature flag.
