# etzgit

etzgit is a small monorepo that demonstrates a secure, testable autonomous-agent flow implemented with a NestJS backend and a set of shared utility packages. The project focuses on guarded edit workflows (safe git operations, test-run rollback, PR creation) and robust LLM output parsing for producing deterministic patch proposals.

This README explains how to develop, test, and run the project locally and how to contribute safely.

## Contents
- apps/api — NestJS application that exposes agent orchestration and services (LLM integration, Git client, GitHub PR creation).
- packages/config — shared TypeScript configuration used by workspace packages.
- packages/* — shared helper packages (types, constants, utils).
- docs/ — documentation and architecture decision records (ADRs).

## Quick start (local)

Prerequisites
- Node.js (recommended 18+)
- pnpm (the repo is a pnpm workspace)
- Git (for branch/PR workflow)

Install dependencies

```bash
pnpm install
```

Run tests for the whole workspace

```bash
pnpm -w test
```

Run and develop the API (apps/api)

```bash
pnpm --filter ./apps/api start:dev
```

Run only the API tests (Jest + a small Vitest smoke test)

```bash
pnpm --filter ./apps/api test
```

Build

```bash
pnpm -w build
```

## Project highlights

- Safe Git operations: the repo includes a `GitClientService` that enforces a whitelist of modifiable paths and provides commit/branch helpers.
- LLM integration: `LLMService` parses model outputs defensively and validates them with Zod schemas before applying changes.
- Executor & Planner: the agent pipeline is intentionally conservative — protected paths block automated edits and changes finalize through PRs for human review.
- Tests: unit tests cover the LLM parsing, git safety checks and the orchestration flow in `apps/api`.

## Development workflow

1. Create a feature branch from `main`.
2. Implement changes and add unit tests. Keep new tests under `apps/api/src` (Jest) or `apps/api/test` (Vitest smoke test).
3. Run the workspace type-check and tests locally: `pnpm -w tsc --noEmit && pnpm -w test`.
4. Push your branch and open a Pull Request targeting `main`. The repository enforces PR reviews and passing checks before merge.

Notes on commit hooks and CI
- The repository uses Husky hooks configured in the root. In CI and some dev environments you may need to run `pnpm install` so Husky is installed properly. If pre-commit hooks fail because `lint-staged` isn't configured locally, you can bypass with `--no-verify` (not recommended for production commits).

## Security & safe-op patterns

- Protected paths: critical files and infra configs are marked as protected and the executor will refuse to edit them automatically.
- Test-run rollback: the executor writes proposed changes, runs the test suite locally, and if tests fail it will roll back staged changes.
- PR for review: successful proposals are committed to a branch and a pull request is created for human review before merge.

See `SECURITY.md` for responsible disclosure and security reporting.

## Contributing

- Follow the monorepo conventions (pnpm workspace). See `CONTRIBUTING.md` for detailed contributor guidance.
- Keep the change small and provide unit tests for behavior changes.

## Troubleshooting

- If `pnpm -w tsc --noEmit` fails, ensure `pnpm install` has completed and that you are using a Node version compatible with the repo (>= 18). The repo expects `@types/node` and `@types/jest` to be available for workspace-level type-checks.

## License

This repository is licensed under the terms in the `LICENSE` file.

