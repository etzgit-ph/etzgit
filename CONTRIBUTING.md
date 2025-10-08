
# Contributing to etzgit

Thank you for your interest in contributing! This project uses a pnpm monorepo structure. Please follow these guidelines to ensure a smooth experience for all contributors.

## Monorepo Workflow

- Install dependencies at the root:
	```bash
	pnpm install
	```
- To run backend (NestJS API):
	```bash
	pnpm run dev:backend
	# or
	pnpm --filter ./apps/api dev
	```
- To run frontend (Next.js web):
	```bash
	pnpm run dev:web
	# or
	pnpm --filter ./apps/web dev
	```
- To run all tests:
	```bash
	pnpm test
	```
- To run e2e tests:
	```bash
	pnpm e2e
	```

## Docker Compose Setup

For local development, use Docker Compose to provision PostgreSQL and Redis:
```bash
docker-compose up -d
```
Credentials are managed securely in the compose file and not exposed via environment variables.

## Pull Request Workflow

- All changes (human or agent) must be submitted via Pull Request (PR).
- Every PR requires at least one approval and must pass all status checks before merging.
- No direct pushes to `main` are allowed.

## Code Reviews

- Reviewers must verify code quality, security, and compliance.
- Use the provided linting and test tools before approving.

## Pre-Commit Hooks

- Husky and lint-staged are used to enforce linting, formatting, and vulnerability checks (`pnpm audit`) before code is committed.
- If you encounter issues with pre-commit hooks, ensure all dev dependencies are installed and your environment matches the `.devcontainer` config (if present).

## Overriding/Disabling the Agent

- If the autonomous agent must be paused or overridden, document the reason in the PR and notify the maintainers.

---

For more details, see `SECURITY.md` and `docs/adr/`.
