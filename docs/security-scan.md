# Security scanning in CI

This repository runs a Trivy filesystem scan during CI to catch HIGH/CRITICAL vulnerabilities in dependencies and container images.

What the CI step does:
- Installs Trivy (Debian/Ubuntu runner) and runs `trivy fs` against the repository root.
- The scan is configured to exit with non-zero when HIGH or CRITICAL vulnerabilities are found (CI will surface that failure).

Notes:
- Trivy installation happens during the CI job; for speed you can cache or pre-install Trivy in custom runners.
- For scanning container images, replace `trivy fs` with `trivy image <image>` and ensure the image is present.
- You can add exemptions or a CVE whitelist if needed.
