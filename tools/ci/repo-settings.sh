#!/usr/bin/env bash
# Repository settings for the CI/CD in plans/0045-pro-ci-cd.md, as code.
# Idempotent: re-running it re-applies the same settings. Needs `gh` logged in as
# a repository admin. Apply AFTER the workflows are on main, because branch
# protection requires check names that must exist there.
#
#   tools/ci/repo-settings.sh [owner/repo]
set -euo pipefail
repo="${1:-otto-agent007/CockpitEscapeRoom}"
owner="${repo%%/*}"

echo "== merge settings: allow auto-merge"
gh api -X PATCH "repos/$repo" -F allow_auto_merge=true --jq '"allow_auto_merge=\(.allow_auto_merge)"'

echo "== Actions may open pull requests (release-please's release PR)"
gh api -X PUT "repos/$repo/actions/permissions/workflow" \
  -f default_workflow_permissions=read -F can_approve_pull_request_reviews=true
gh api "repos/$repo/actions/permissions/workflow" --jq '"default=\(.default_workflow_permissions) can_open_prs=\(.can_approve_pull_request_reviews)"'

echo "== security: dependency graph alerts and automatic security-fix PRs"
gh api -X PUT "repos/$repo/vulnerability-alerts" --silent
gh api -X PATCH "repos/$repo" -f 'security_and_analysis[dependabot_security_updates][status]=enabled' \
  --jq '"dependabot_security_updates=\(.security_and_analysis.dependabot_security_updates.status)"'

echo "== branch protection on main"
# - Required checks: the three stable names. `browser-smoke` aggregates the e2e shards.
# - strict=false: "branch must be up to date" would force a fresh 20-30 min suite
#   before nearly every merge, because main moves several times a day.
# - No required reviews: the owner merges their own PRs.
# - enforce_admins=false: the owner can still bypass in an emergency.
gh api -X PUT "repos/$repo/branches/main/protection" --input - <<'JSON' --jq '"required checks: \(.required_status_checks.contexts | join(", "))"'
{
  "required_status_checks": {
    "strict": false,
    "contexts": ["quality", "browser-smoke", "new-production-dependencies"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": false
}
JSON

echo "== release-approval environment, approved by the owner"
# Not "production": GitHub environment names are case-insensitive, and "Production"
# belongs to Vercel's GitHub integration. Putting a reviewer on it is wrong.
owner_id=$(gh api "users/$owner" --jq .id)
gh api -X PUT "repos/$repo/environments/release-approval" --input - --jq '"environment \(.name): reviewers=\([.protection_rules[]? | select(.type=="required_reviewers") | .reviewers[].reviewer.login] | join(","))"' <<JSON
{ "reviewers": [{ "type": "User", "id": $owner_id }], "deployment_branch_policy": null }
JSON

echo "== labels used by the workflows"
gh label create dependency-approved -R "$repo" --force --color 0e8a16 \
  --description "Owner approved a new production dependency (tools/ci/new-deps-guard.mjs)"
gh label create dependencies -R "$repo" --force --color 0366d6 --description "Dependabot updates"
gh label create major-update -R "$repo" --force --color d93f0b --description "Major dependency update: not auto-merged, needs owner review"

echo "== merge queue"
echo "   Not available: GitHub offers merge queues only for organisation-owned repositories."
