# Security policy and responsible disclosure

This repository contains experimental code for an autonomous-agent workflow. Security is a first-class concern — especially because the agent can produce changes to repository files and interact with external services (LLMs, GitHub API).

If you discover a vulnerability in this repository (code, dependency, CI configuration, or the agent behavior), please follow the responsible disclosure process below.

Reporting
- Preferred: Open a private GitHub Security Advisory on this repository and request triage.
- Alternate: Send an email to the maintainers (use the repo's primary contact on the GitHub profile) with a clear, reproducible report. Do not post exploit details publicly.

What to include
- A concise title and summary of the vulnerability.
- Step-by-step reproduction steps or a minimal PoC repository/archive.
- The affected branch or commit (if known) and the scope (which files, endpoints or modules are affected).
- Severity assessment and suggested remediation (if you have a recommended fix).

Response & timeline
- Acknowledgement: within 48 hours.
- Triage: we will assess impact, identify affected versions, prepare a patch or mitigation, and coordinate disclosure.
- Fix timeline: varies with severity. Critical issues will be prioritized and fixed as soon as possible.

Security precautions in this repo
- Protected paths: the executor rejects automated changes to a short list of protected files (infra, CI, and repo-level configs).
- Test-run rollback: proposed changes are validated by running the test-suite before finalizing a PR; the system will attempt to roll back automatically on failures.
- PR-only finalization: all accepted changes are pushed behind a Pull Request for human review before merge.

Disclosure
- Once a patch is ready and an embargo agreed, we will coordinate public disclosure and release notes.

Thank you for responsibly disclosing vulnerabilities and helping keep this project secure.

