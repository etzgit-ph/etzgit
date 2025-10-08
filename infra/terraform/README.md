# Terraform (infra/terraform)

This folder contains a small, safe starter Terraform configuration used as a placeholder for the repository's infrastructure.

What this provides

- Provider placeholders (AWS, random, null) with versions.
- An optional S3 backend example (commented out) for remote state.
- A gated example S3 bucket resource (`aws_s3_bucket.example`) that is created only when `aws_enabled = true`.
- A `null_resource.container_hosting` placeholder that always exists and encodes the `image` and `tags` into its triggers.
- Helpful outputs describing what would be created.

Safety and usage

- By default `aws_enabled = false`. This makes `terraform plan` safe for users without AWS credentials.
- Do NOT commit secrets or real backend configuration to the repository. Use environment variables or CI secrets for credentials and backend configuration.

Quick start (local)

1. Install Terraform (>= 1.0). On Debian/Ubuntu:

```bash
# Example: using apt (or install via tfenv/homebrew as preferred)
sudo apt-get update && sudo apt-get install -y gnupg software-properties-common
# Follow official HashiCorp instructions for adding the apt repo and installing terraform
```

2. Initialize the working directory:

```bash
cd infra/terraform
terraform init
```

3. (Optional) Create a `terraform.tfvars` or pass flags when running plan/apply. Example `terraform.tfvars`:

```hcl
aws_enabled = false
aws_region = "us-east-1"
image = "ghcr.io/yourorg/aca:latest"
# state_bucket = "my-terraform-state-bucket"
# state_dynamodb_table = "my-terraform-locks"
```

4. Run a plan (safe, will not create cloud resources when `aws_enabled = false`):

```bash
terraform plan -var-file="terraform.tfvars"
```

5. To create the AWS example resources, set `aws_enabled = true` and configure your AWS credentials (e.g., via environment variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` or an AWS profile). Then re-run `terraform init` and `terraform apply`.

CI and remote state

- If you want remote state in CI, configure the backend block in `main.tf` (commented out). Prefer storing the bucket name and DynamoDB table in CI secrets and avoid committing them in plain text.

Notes

- Bucket names must be globally unique. The example uses a random suffix to reduce collisions when `aws_enabled` is true.
- The resources in this folder are intentionally minimal. Use them as a starting point and expand to match your deployment and governance needs.

If you'd like, I can also:

- Add a `Makefile` or npm script to run `terraform init/plan/apply` with sensible defaults.
- Create a CI job skeleton that runs `terraform fmt` and `terraform validate` and optionally `plan` with a `--detailed-exitcode`.
- Wire a sample `backend.tfvars` or GitHub Actions secret template for remote state.

Tell me which of those you'd like next.
