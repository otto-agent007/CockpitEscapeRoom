#!/bin/bash
cd /mnt/2TBHDD/CockpitEscapeRoom
LOG=art-source/intro/tmb2/scramble/wave-s2.log
: > $LOG
echo "=== card-boots $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/refs/comp-boots.png" - < art-source/intro/tmb2/scramble/prompts/card-boots.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/card-boots.png ]; then echo "MISSING: card-boots — stopping" >> $LOG; exit 1; fi
echo "=== card-coffee $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/refs/comp-coffee.png" - < art-source/intro/tmb2/scramble/prompts/card-coffee.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/card-coffee.png ]; then echo "MISSING: card-coffee — stopping" >> $LOG; exit 1; fi
echo "=== card-flight-case-shut $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/generated/card-flight-case.png" - < art-source/intro/tmb2/scramble/prompts/card-flight-case-shut.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/card-flight-case-shut.png ]; then echo "MISSING: card-flight-case-shut — stopping" >> $LOG; exit 1; fi
echo "=== card-gloves-a $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/refs/comp-gloves.png" - < art-source/intro/tmb2/scramble/prompts/card-gloves-a.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/card-gloves-a.png ]; then echo "MISSING: card-gloves-a — stopping" >> $LOG; exit 1; fi
echo "=== card-gloves-b $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/generated/card-gloves-a.png" - < art-source/intro/tmb2/scramble/prompts/card-gloves-b.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/card-gloves-b.png ]; then echo "MISSING: card-gloves-b — stopping" >> $LOG; exit 1; fi
echo "=== card-stripes $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/refs/comp-stripes.png" - < art-source/intro/tmb2/scramble/prompts/card-stripes.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/card-stripes.png ]; then echo "MISSING: card-stripes — stopping" >> $LOG; exit 1; fi
echo "=== card-harness $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/refs/comp-harness.png" - < art-source/intro/tmb2/scramble/prompts/card-harness.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/card-harness.png ]; then echo "MISSING: card-harness — stopping" >> $LOG; exit 1; fi
echo "=== card-wings $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/refs/comp-wings.png" - < art-source/intro/tmb2/scramble/prompts/card-wings.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/card-wings.png ]; then echo "MISSING: card-wings — stopping" >> $LOG; exit 1; fi
echo "=== card-cap-a $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/refs/comp-cap.png" - < art-source/intro/tmb2/scramble/prompts/card-cap-a.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/card-cap-a.png ]; then echo "MISSING: card-cap-a — stopping" >> $LOG; exit 1; fi
echo "=== card-cap-b $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/generated/card-cap-a.png" - < art-source/intro/tmb2/scramble/prompts/card-cap-b.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/card-cap-b.png ]; then echo "MISSING: card-cap-b — stopping" >> $LOG; exit 1; fi
echo "=== card-shades $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/refs/comp-shades.png" - < art-source/intro/tmb2/scramble/prompts/card-shades.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/card-shades.png ]; then echo "MISSING: card-shades — stopping" >> $LOG; exit 1; fi
echo "=== card-nacelle-a $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/refs/comp-nacelle.png" - < art-source/intro/tmb2/scramble/prompts/card-nacelle-a.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/card-nacelle-a.png ]; then echo "MISSING: card-nacelle-a — stopping" >> $LOG; exit 1; fi
echo "=== card-nacelle-b $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/generated/card-nacelle-a.png" - < art-source/intro/tmb2/scramble/prompts/card-nacelle-b.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/card-nacelle-b.png ]; then echo "MISSING: card-nacelle-b — stopping" >> $LOG; exit 1; fi
echo "=== card-nacelle-c $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/generated/card-nacelle-a.png" - < art-source/intro/tmb2/scramble/prompts/card-nacelle-c.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/card-nacelle-c.png ]; then echo "MISSING: card-nacelle-c — stopping" >> $LOG; exit 1; fi
echo "=== card-instruments $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/refs/comp-instruments.png" - < art-source/intro/tmb2/scramble/prompts/card-instruments.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/card-instruments.png ]; then echo "MISSING: card-instruments — stopping" >> $LOG; exit 1; fi
echo "=== card-photo $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/refs/comp-photo.png,art-source/intro/tmb2/popt-v2/normalised/anchor/anchor-00.png" - < art-source/intro/tmb2/scramble/prompts/card-photo.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/card-photo.png ]; then echo "MISSING: card-photo — stopping" >> $LOG; exit 1; fi
echo "=== card-throttles-a $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/refs/comp-throttles.png" - < art-source/intro/tmb2/scramble/prompts/card-throttles-a.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/card-throttles-a.png ]; then echo "MISSING: card-throttles-a — stopping" >> $LOG; exit 1; fi
echo "=== card-throttles-b $(date +%H:%M:%S)" >> $LOG
env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "art-source/intro/tmb2/scramble/generated/card-throttles-a.png" - < art-source/intro/tmb2/scramble/prompts/card-throttles-b.txt >> $LOG 2>&1
if [ ! -f art-source/intro/tmb2/scramble/generated/card-throttles-b.png ]; then echo "MISSING: card-throttles-b — stopping" >> $LOG; exit 1; fi
echo "WAVE S2 COMPLETE $(date +%H:%M:%S)" >> $LOG
