# Branch Protection Policy (main)

Required rules for the `main` branch:

1. Require at least 1 approval for pull requests.
2. Require status checks to pass: CI, SAST, Coverage.
3. Require linear history (no merge commits).
4. Restrict who can push directly (no direct pushes allowed).

These rules must be enforced in the repository settings by an admin and audited regularly.
