#!/bin/bash
cd /mnt/2TBHDD/CockpitEscapeRoom
LOG=art-source/intro/tmb2/scramble/wave-s5.log
: > $LOG
echo "=== s5-card-cap-a $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/generated/s4-card-cap-a2.png" - < art-source/intro/tmb2/scramble/prompts/s5-card-cap-a.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/s5-card-cap-a.png ]; then echo "MISSING: s5-card-cap-a — stopping" >> $LOG; exit 1; fi
echo "=== s5-card-cap-mid $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/generated/s5-card-cap-a.png" - < art-source/intro/tmb2/scramble/prompts/s5-card-cap-mid.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/s5-card-cap-mid.png ]; then echo "MISSING: s5-card-cap-mid — stopping" >> $LOG; exit 1; fi
echo "=== s5-card-cap-b $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/generated/s5-card-cap-a.png" - < art-source/intro/tmb2/scramble/prompts/s5-card-cap-b.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/s5-card-cap-b.png ]; then echo "MISSING: s5-card-cap-b — stopping" >> $LOG; exit 1; fi
echo "=== s5-card-watch $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/generated/s4-card-watch.png" - < art-source/intro/tmb2/scramble/prompts/s5-card-watch.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/s5-card-watch.png ]; then echo "MISSING: s5-card-watch — stopping" >> $LOG; exit 1; fi
echo "WAVE S5 COMPLETE $(date +%H:%M:%S)" >> $LOG
