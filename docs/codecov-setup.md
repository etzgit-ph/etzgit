# Codecov setup

This project uploads coverage to Codecov in CI. To enable full uploads for private repositories, add the Codecov token to GitHub Secrets.

1. Go to your repository Settings → Secrets → Actions and add a secret named `CODECOV_TOKEN` with the token value from Codecov.
2. The CI workflow (`.github/workflows/ci.yml`) will automatically pick up `${{ secrets.CODECOV_TOKEN }}` and pass it to the Codecov action.
3. Locally you can run the test + collect flow and inspect the `coverage/` directory:

```bash
pnpm -w run test:unit
pnpm run collect-coverage
node ./scripts/enforce-coverage.js   # optional: validate thresholds locally
```

Notes:
- The CI uploads `coverage/lcov.info`. If you add more packages with tests, the collector will merge lcov files and aggregate `coverage-final.json` for threshold enforcement.
- If your repo is public you can leave `CODECOV_TOKEN` empty; the Codecov action will still run but may be subject to public upload policy.
