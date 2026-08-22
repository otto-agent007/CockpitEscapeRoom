# Pop T v3 generation prompts

The exact prompts fed to `codex exec`, kept verbatim so any frame can be reproduced.

- `anchor-00.txt` — produced the **approved** Wave 0 anchor
  (`../generated/anchor/anchor-00-c.png` → `../normalised/anchor/anchor-00.png`).
  This is the one to copy for new frames: swap the pose brief, keep everything else.
- `anchor-00-earlier-no-mouth.txt` — the previous attempt. Kept as evidence: it lacks the
  proportions and facial-feature blocks, and its output lost the mouth entirely at the 19x
  reduction and came back at 6.12 head-heights instead of the caricatured ~5.

Run them with the identity reference attached and no `OPENAI_API_KEY` in the environment:

```
codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write \
  -i art-source/intro/tmb2/popt-v2/references/identity-anchor-1024.png \
  - < art-source/intro/tmb2/popt-v2/prompts/anchor-00.txt
```
