# @etzgit/ci-utils

Small utilities used by CI workflows.

## set-output.js

Reads a Terraform `terraform output -json` result from stdin, masks the secret for CI logs, and emits a GitHub Actions output variable.

Usage example:

```bash
terraform output -json | node packages/ci-utils/src/set-output.js db_connection_string
```

This will print a `::add-mask::...` line and a `::set-output name=db_connection_string::...` line which can be consumed by GitHub Actions.
