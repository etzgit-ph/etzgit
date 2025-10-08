# Governance and Auditability for Autonomous Agent Upgrades

## Overview
This repository implements a secure, auditable workflow for AI-generated code upgrades using a Human-in-the-Loop (HIL) approval process. All changes proposed by the agent are subject to human review, atomic commit/push, and automated CI/CD validation.

## Governance Principles
- **Human Oversight:** No AI-generated change is merged without explicit human approval.
- **Protected Paths:** Critical files (CI, infra, security configs) are protected from automated modification.
- **Audit Trail:** All proposals, approvals, commits, and PRs are logged and traceable.
- **Responsible Disclosure:** Vulnerabilities must be reported privately (see SECURITY.md).

## Auditability Features
- **Atomic Approval Flow:** File writes, commits, branch pushes, and PR creation are performed as a single atomic operation.
- **CI/CD Enforcement:** All AI-generated branches are validated by automated workflows before merge.
- **Frontend Feedback:** Users receive clear feedback and links to PRs/branches after approval.
- **Secret Scanning:** All proposed changes are scanned for secrets before commit.

## References
- [ADR: Secure HIL Approval](./adr/0003-secure-hil-approval.md)
- [Security Policy](../SECURITY.md)
- [.github/workflows/ai-branch-validation.yml](../../.github/workflows/ai-branch-validation.yml)

## Maintainers
- See repository profile for contact information and responsible disclosure process.
