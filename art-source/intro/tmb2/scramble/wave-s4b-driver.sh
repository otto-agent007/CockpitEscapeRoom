#!/bin/bash
cd /mnt/2TBHDD/CockpitEscapeRoom
LOG=art-source/intro/tmb2/scramble/wave-s4b.log
: > $LOG
echo "=== s4-card-logbook $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/refs/comp-harness.png" - < art-source/intro/tmb2/scramble/prompts/s4-card-logbook.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/s4-card-logbook.png ]; then echo "MISSING: s4-card-logbook — stopping" >> $LOG; exit 1; fi
echo "=== s4-card-cap-a2 $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/generated/card-cap-a.png,public/images/captains-hat-celebration.png" - < art-source/intro/tmb2/scramble/prompts/s4-card-cap-a2.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/s4-card-cap-a2.png ]; then echo "MISSING: s4-card-cap-a2 — stopping" >> $LOG; exit 1; fi
echo "=== s4-card-cap-mid2 $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/generated/s4-card-cap-a2.png" - < art-source/intro/tmb2/scramble/prompts/s4-card-cap-mid2.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/s4-card-cap-mid2.png ]; then echo "MISSING: s4-card-cap-mid2 — stopping" >> $LOG; exit 1; fi
echo "=== s4-card-cap-b3 $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/generated/s4-card-cap-a2.png" - < art-source/intro/tmb2/scramble/prompts/s4-card-cap-b3.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/s4-card-cap-b3.png ]; then echo "MISSING: s4-card-cap-b3 — stopping" >> $LOG; exit 1; fi
echo "WAVE S4B COMPLETE $(date +%H:%M:%S)" >> $LOG
