# Architecture Decision Record 001: Autonomous Code Agent (ACA) as a NestJS Monoservice on GitHub-Native Infrastructure

## Context
The project aims to build a secure, autonomous code agent capable of self-upgrading, governed by human-in-the-loop PR workflows. The agent is designed to operate natively within the GitHub/Codespaces ecosystem.

## Decision
- Use **TypeScript** on **Node.js LTS (v20+)** for strict typing and modern features.
- Structure the backend as a **NestJS** monoservice for modularity, testability, and maintainability.
- Rely on **GitHub-native services** (Codespaces, Actions, Secrets) for CI/CD, scheduling, and secret management.
- Use **Git** as the source of truth and audit log; no external database required.
- Integrate with **OpenAI API** for LLM-driven code generation and patching.

## Consequences
- All code changes must go through PRs with human review and status checks.
- The agent is modular and can be extended or upgraded safely.
- Security and compliance are enforced through GitHub-native controls and strict TypeScript settings.

## Rationale
This architecture maximizes security, auditability, and developer experience by leveraging proven frameworks and GitHub's native capabilities.
