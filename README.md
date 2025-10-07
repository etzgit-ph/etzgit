# etzgit

## Quick Start (Codespaces)
1. Open this repository in GitHub Codespaces.
2. The environment will auto-install dependencies and set up the devcontainer.
3. All code changes must be made via Pull Request (PR) and require review.

## Architecture Summary
- **Agent:** Modular NestJS app (apps/api)
- **Config:** Shared TypeScript config (packages/config)
- **Monorepo:** Managed by pnpm
- **CI/CD:** GitHub Actions for test, build, and PR checks

## Governance Model (PR-Only)
- All changes to `main` require a PR, review, and passing status checks.
- No direct pushes to `main` are allowed.
- Security and compliance are enforced via branch protection and audit logs.

## How to Audit the Agent's Changes
- Review PRs for code, security, and compliance.
- Check GitHub Actions status and audit logs.

---

For more details, see `SECURITY.md`, `CONTRIBUTING.md`, and `docs/adr/`.
