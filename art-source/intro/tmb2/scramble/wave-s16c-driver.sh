#!/bin/bash
cd /mnt/2TBHDD/CockpitEscapeRoom
LOG=art-source/intro/tmb2/scramble/wave-s16c.log
: > $LOG
for i in 2 3 5 6; do
  j=$(( i % 6 + 1 ))
  OUT=art-source/intro/tmb2/scramble/generated/s16-walk-t${i}.png
  mv "$OUT" "art-source/intro/tmb2/scramble/generated/s16-walk-t${i}-rejected.png" 2>/dev/null
  echo "=== s16-walk-t${i} v2 (pair ${i}-${j}) $(date +%H:%M:%S)" >> $LOG
  env -u OPENAI_API_KEY ~/.local/bin/codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write \
    -i "art-source/intro/tmb2/scramble/refs/walk-pairs/pair-${i}-${j}.png" \
    - < art-source/intro/tmb2/scramble/prompts/s16-walk-t${i}.txt >> $LOG 2>&1
  if [ ! -f "$OUT" ]; then echo "MISSING: s16-walk-t${i}" >> $LOG; fi
done
echo "WAVE S16C COMPLETE $(date +%H:%M:%S)" >> $LOG
