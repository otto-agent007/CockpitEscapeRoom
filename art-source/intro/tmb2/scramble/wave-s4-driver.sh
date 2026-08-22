#!/bin/bash
cd /mnt/2TBHDD/CockpitEscapeRoom
LOG=art-source/intro/tmb2/scramble/wave-s4.log
: > $LOG
echo "=== s4-ident-run-sheet $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/popt-v2/normalised/anchor/anchor-00.png" - < art-source/intro/tmb2/scramble/prompts/s4-ident-run-sheet.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/s4-ident-run-sheet.png ]; then echo "MISSING: s4-ident-run-sheet — stopping" >> $LOG; exit 1; fi
echo "=== s4-ident-skid $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/popt-v2/normalised/anchor/anchor-00.png" - < art-source/intro/tmb2/scramble/prompts/s4-ident-skid.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/s4-ident-skid.png ]; then echo "MISSING: s4-ident-skid — stopping" >> $LOG; exit 1; fi
echo "=== s4-ident-tap $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/popt-v2/normalised/anchor/anchor-00.png" - < art-source/intro/tmb2/scramble/prompts/s4-ident-tap.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/s4-ident-tap.png ]; then echo "MISSING: s4-ident-tap — stopping" >> $LOG; exit 1; fi
echo "=== s4-walk-sheet $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/popt-v2/normalised/anchor/anchor-00.png" - < art-source/intro/tmb2/scramble/prompts/s4-walk-sheet.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/s4-walk-sheet.png ]; then echo "MISSING: s4-walk-sheet — stopping" >> $LOG; exit 1; fi
echo "=== s4-card-watch $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/refs/comp-gloves.png,art-source/intro/tmb2/popt-v2/normalised/anchor/anchor-00.png" - < art-source/intro/tmb2/scramble/prompts/s4-card-watch.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/s4-card-watch.png ]; then echo "MISSING: s4-card-watch — stopping" >> $LOG; exit 1; fi
echo "=== s4-card-harness-a $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/refs/comp-harness.png,art-source/intro/tmb2/popt-v2/normalised/anchor/anchor-00.png" - < art-source/intro/tmb2/scramble/prompts/s4-card-harness-a.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/s4-card-harness-a.png ]; then echo "MISSING: s4-card-harness-a — stopping" >> $LOG; exit 1; fi
echo "=== s4-card-harness-b $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/generated/s4-card-harness-a.png" - < art-source/intro/tmb2/scramble/prompts/s4-card-harness-b.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/s4-card-harness-b.png ]; then echo "MISSING: s4-card-harness-b — stopping" >> $LOG; exit 1; fi
echo "=== s4-card-cap-mid $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/generated/card-cap-a.png" - < art-source/intro/tmb2/scramble/prompts/s4-card-cap-mid.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/s4-card-cap-mid.png ]; then echo "MISSING: s4-card-cap-mid — stopping" >> $LOG; exit 1; fi
echo "=== s4-card-cap-b2 $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/generated/card-cap-a.png" - < art-source/intro/tmb2/scramble/prompts/s4-card-cap-b2.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/s4-card-cap-b2.png ]; then echo "MISSING: s4-card-cap-b2 — stopping" >> $LOG; exit 1; fi
echo "=== s4-card-case-shut $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/generated/card-flight-case.png" - < art-source/intro/tmb2/scramble/prompts/s4-card-case-shut.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/s4-card-case-shut.png ]; then echo "MISSING: s4-card-case-shut — stopping" >> $LOG; exit 1; fi
echo "=== s4-card-shades $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/generated/card-shades.png" - < art-source/intro/tmb2/scramble/prompts/s4-card-shades.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/s4-card-shades.png ]; then echo "MISSING: s4-card-shades — stopping" >> $LOG; exit 1; fi
echo "WAVE S4 COMPLETE $(date +%H:%M:%S)" >> $LOG
