#!/bin/bash
cd /mnt/2TBHDD/CockpitEscapeRoom
LOG=art-source/intro/tmb2/scramble/wave-s3.log
: > $LOG
echo "=== spr-popt-walk-1 $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/popt-v2/normalised/anchor/anchor-00.png" - < art-source/intro/tmb2/scramble/prompts/spr-popt-walk-1.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/spr-popt-walk-1.png ]; then echo "MISSING: spr-popt-walk-1 — stopping" >> $LOG; exit 1; fi
echo "=== spr-popt-walk-2 $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/popt-v2/normalised/anchor/anchor-00.png,art-source/intro/tmb2/scramble/generated/spr-popt-walk-1.png" - < art-source/intro/tmb2/scramble/prompts/spr-popt-walk-2.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/spr-popt-walk-2.png ]; then echo "MISSING: spr-popt-walk-2 — stopping" >> $LOG; exit 1; fi
echo "=== spr-popt-walk-3 $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/popt-v2/normalised/anchor/anchor-00.png,art-source/intro/tmb2/scramble/generated/spr-popt-walk-1.png" - < art-source/intro/tmb2/scramble/prompts/spr-popt-walk-3.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/spr-popt-walk-3.png ]; then echo "MISSING: spr-popt-walk-3 — stopping" >> $LOG; exit 1; fi
echo "=== spr-popt-walk-4 $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/popt-v2/normalised/anchor/anchor-00.png,art-source/intro/tmb2/scramble/generated/spr-popt-walk-1.png" - < art-source/intro/tmb2/scramble/prompts/spr-popt-walk-4.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/spr-popt-walk-4.png ]; then echo "MISSING: spr-popt-walk-4 — stopping" >> $LOG; exit 1; fi
echo "=== spr-popt-walk-5 $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/popt-v2/normalised/anchor/anchor-00.png,art-source/intro/tmb2/scramble/generated/spr-popt-walk-1.png" - < art-source/intro/tmb2/scramble/prompts/spr-popt-walk-5.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/spr-popt-walk-5.png ]; then echo "MISSING: spr-popt-walk-5 — stopping" >> $LOG; exit 1; fi
echo "=== spr-popt-walk-6 $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/popt-v2/normalised/anchor/anchor-00.png,art-source/intro/tmb2/scramble/generated/spr-popt-walk-1.png" - < art-source/intro/tmb2/scramble/prompts/spr-popt-walk-6.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/spr-popt-walk-6.png ]; then echo "MISSING: spr-popt-walk-6 — stopping" >> $LOG; exit 1; fi
echo "=== spr-popt-backlit $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/popt-v2/normalised/anchor/anchor-00.png" - < art-source/intro/tmb2/scramble/prompts/spr-popt-backlit.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/spr-popt-backlit.png ]; then echo "MISSING: spr-popt-backlit — stopping" >> $LOG; exit 1; fi
echo "=== spr-dc9-runway $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write - < art-source/intro/tmb2/scramble/prompts/spr-dc9-runway.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/spr-dc9-runway.png ]; then echo "MISSING: spr-dc9-runway — stopping" >> $LOG; exit 1; fi
echo "=== spr-dc9-liftoff $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write - < art-source/intro/tmb2/scramble/prompts/spr-dc9-liftoff.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/spr-dc9-liftoff.png ]; then echo "MISSING: spr-dc9-liftoff — stopping" >> $LOG; exit 1; fi
echo "WAVE S3 COMPLETE $(date +%H:%M:%S)" >> $LOG
