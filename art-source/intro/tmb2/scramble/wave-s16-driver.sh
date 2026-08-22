#!/bin/bash
cd /mnt/2TBHDD/CockpitEscapeRoom
LOG=art-source/intro/tmb2/scramble/wave-s16.log
: > $LOG
echo "=== s16-walk-tweens $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write \
  -i "art-source/intro/tmb2/scramble/generated/s4-walk-sheet.png,art-source/intro/tmb2/scramble/refs/identity-popt-canonical.png" \
  - < art-source/intro/tmb2/scramble/prompts/s16-walk-tweens.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/s16-walk-tweens.png ]; then echo "MISSING: s16-walk-tweens" >> $LOG; exit 1; fi
echo "WAVE S16 COMPLETE $(date +%H:%M:%S)" >> $LOG
