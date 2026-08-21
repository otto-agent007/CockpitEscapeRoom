#!/bin/bash
cd /mnt/2TBHDD/CockpitEscapeRoom
LOG=art-source/intro/tmb2/scramble/wave-s16b.log
: > $LOG
for i in 1 2 3 4 5 6; do
  j=$(( i % 6 + 1 ))
  OUT=art-source/intro/tmb2/scramble/generated/s16-walk-t${i}.png
  echo "=== s16-walk-t${i} (pair ${i}-${j}) $(date +%H:%M:%S)" >> $LOG
  env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write \
    -i "art-source/intro/tmb2/scramble/refs/walk-pairs/pair-${i}-${j}.png" \
    - < art-source/intro/tmb2/scramble/prompts/s16-walk-t${i}.txt >> $LOG 2>&1
  if [ ! -f "$OUT" ]; then echo "MISSING: s16-walk-t${i}" >> $LOG; fi
done
echo "WAVE S16B COMPLETE $(date +%H:%M:%S)" >> $LOG
