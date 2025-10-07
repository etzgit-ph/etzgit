# STRIDE Threat Model v1

## Spoofing
- Mitigation: Use GitHub token authentication and CI/CD pipeline secrets.

## Tampering
- Mitigation: Branch protection, PR review, and status checks.

## Repudiation
- Mitigation: Audit logs, structured logging, and PR history.

## Information Disclosure
- Mitigation: .env and secret management, never commit secrets.

## Denial of Service
- Mitigation: Rate limiting, resource quotas, and monitoring.

## Elevation of Privilege
- Mitigation: Least privilege tokens, protected paths, and CI/CD controls.
