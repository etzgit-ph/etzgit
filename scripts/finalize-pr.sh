#!/bin/bash
# finalize-pr.sh: Update PR body, request reviewers, set labels
PR_NUMBER="$1"
SUMMARY_FILE="$2"
REVIEWERS="team/eng"
LABELS="ci-passed"

if [[ -z "$PR_NUMBER" || -z "$SUMMARY_FILE" ]]; then
  echo "Usage: $0 <pr-number> <summary-file>"
  exit 1
fi

SUMMARY=$(cat "$SUMMARY_FILE")

gh pr edit "$PR_NUMBER" --body "$SUMMARY" --add-reviewer "$REVIEWERS" --add-label "$LABELS"
echo "PR #$PR_NUMBER updated with summary, reviewers, and labels."
