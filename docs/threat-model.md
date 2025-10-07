# STRIDE Threat Model: Autonomous Code Agent (ACA)

## Spoofing
- Mitigation: Use GitHub Actions OIDC and PAT with least privilege for agent authentication.

## Tampering
- Mitigation: All code changes require PR review and status checks before merge.

## Repudiation
- Mitigation: All agent actions are logged via GitHub audit logs and commit history.

## Information Disclosure
- Mitigation: Secrets are managed via GitHub Secrets; no secrets in code or logs.

## Denial of Service
- Mitigation: Resource limits on Codespaces and CI runners; PR-only workflow prevents direct merges.

## Elevation of Privilege
- Mitigation: PAT scopes are restricted; agent only has access to necessary repo actions.

---

This document will be updated as the agent evolves and new threat vectors are identified.
