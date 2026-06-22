export CER_MAIN="$HOME/Projects/CockpitEscapeRoom-main"
export CER_WORKTREES="$HOME/Worktrees"

cd "$CER_MAIN"

git fetch origin --prune
git switch main
git pull --ff-only origin main
git status --short

# Confirm the foundation is present.
test -f tools/blender/cockpit_pipeline/pipeline.py
test -d art-source/cockpit-pipeline

# Review existing worktrees before adding another.
git worktree list

git worktree add \
  "$CER_WORKTREES/cer-source" \
  -b asset/dc9-vslice-source \
  origin/main

cd "$CER_WORKTREES/cer-source"

python3 tools/blender/cockpit_pipeline/pipeline.py preflight
