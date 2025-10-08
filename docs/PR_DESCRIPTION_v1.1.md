# ETZGIT v1.1 — Release PR Description

This PR contains the changes for ETZGIT v1.1 focusing on authentication hardening, pluggable secrets providers, developer tooling, and E2E coverage for the structured-command human-in-the-loop flow.

Summary of Changes
------------------
- Implemented a hybrid `AuthGuard` that accepts either the legacy agent run secret or JWTs (verified via `jsonwebtoken`).
- Introduced a pluggable `SecretsProvider` pattern with a `LocalFileSecretsProvider` (default) and an `AwsSecretsProvider` scaffold.
- Refactored `SecretsService` to delegate to the provider abstraction; added a provider factory controlled by `AGENT_SECRETS_PROVIDER`.
- Added `apps/api/scripts/generate-token.js` and `gen-token` script for developer token generation.
- Added a Playwright E2E spec: `tests/e2e/structured-command.spec.ts` to exercise the proposal/approval UI flow.

Files of interest
-----------------
- apps/api/src/common/guards/auth.guard.ts
- apps/api/src/secrets/providers/local-file.provider.ts
- apps/api/src/secrets/secrets.service.ts
- apps/api/scripts/generate-token.js
- tests/e2e/structured-command.spec.ts
- docs/ETZGIT_v1.1_changes.txt

Testing
-------
1. Run backend tests:
   pnpm -C apps/api test

2. Generate a dev token:
   AGENT_JWT_SECRET=dev-secret pnpm -C apps/api run gen-token

3. Start API and web dev servers and run the Playwright spec:
   npx playwright test tests/e2e/structured-command.spec.ts

Security and migration notes
---------------------------
- Dev tokens use HS256 for convenience. For production, migrate to RS256 and use an issuer/PKI.
- The LocalFileSecretsProvider is local-first only. Do not use for production secrets; configure `AGENT_SECRETS_PROVIDER=aws` and implement credentials for AWS Secrets Manager.

Open items / TODO for follow-up
------------------------------
- Implement `AwsSecretsProvider` with the AWS SDK and configured IAM role or credentials.
- Add OS-native secure store integration for developer machines (keytar/electron safeStorage).
- Add CI tasks to run Playwright tests against ephemeral environments.

If you'd like, I can:
- Open the PR from this branch and request reviewers
- Implement RS256 token verification and key management
- Implement the AWS provider and add documentation on how to configure it
