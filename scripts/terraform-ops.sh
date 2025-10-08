#!/bin/bash
# terraform-ops.sh: Run terraform init, plan, and apply
DIR="infra/terraform"
PLAN_OUT="tfplan"

cd "$DIR" || exit 1
terraform init
echo "Terraform initialized."
terraform plan -out="$PLAN_OUT"
echo "Terraform plan created: $PLAN_OUT"
# Uncomment the next line to apply automatically after approval
# terraform apply "$PLAN_OUT"
