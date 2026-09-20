# Mars arcade cabinet — sprite source

Fighter art for the optional arcade cabinet behind the ending. The contract is
`asset-reports/mars-arcade-sprite-contract.json`, the process is
`asset-reports/mars-arcade-frame-prompt-pack.md`, and the task brief for the current wave is
`prompts/05_MARS_ARCADE_SPRITE_WAVE_0.md`.

## Layout

```
art-source/arcade/
  prompts/            ready-to-send prompt text, assembled from the pack
  <fighter>/
    generated/        raw generator output, untouched
    normalised/
      <clip>/         <clip>-NN.png in the 128x128 contract cell
```

`<fighter>` is `booster`, `oracle` or `captain`.

## Generating

Codex CLI's built-in `image_gen` only. Never set `OPENAI_API_KEY`.

```
# booster and oracle have no reference yet - the anchor creates it
codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write \
  - < art-source/arcade/prompts/anchor-booster.txt

# the captain is Pop T, so his existing identity anchor is attached
codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write \
  -i art-source/intro/tmb2/popt-v2/references/identity-anchor-1024.png \
  - < art-source/arcade/prompts/anchor-captain.txt
```

## Normalising and gating

Derive each fighter's scale **once**, from that fighter's own anchor, then reuse it for every
frame of that fighter. Re-fitting per frame makes the character change size between clips.

```
CONTRACT=asset-reports/mars-arcade-sprite-contract.json

# once per fighter - prints the scale to lock in
python3 tools/assets/normalise-popt-frame.py \
    art-source/arcade/booster/generated/anchor-00.png /tmp/probe.png \
    --contract $CONTRACT --derive-scale

# every frame thereafter, with that printed value
python3 tools/assets/normalise-popt-frame.py \
    art-source/arcade/booster/generated/anchor-00.png \
    art-source/arcade/booster/normalised/anchor/anchor-00.png \
    --contract $CONTRACT --source-px-per-cell-px <locked value>

python3 tools/assets/check-popt-frames-fullcolour.py \
    --contract $CONTRACT art-source/arcade/booster/normalised
```

Both tools are the Pop T ones, reused unchanged via `--contract`. Verified 2026-09-19 against
this contract in both directions: a correct 104 px frame passes; a short one, a floating one,
and one with leftover `#FF00FF` are rejected.

Airborne and knocked-down poses have no foot span on the baseline — normalise those with
`--align bbox` and record the offset once per clip.

## Locked scales

| Fighter | source px per cell px | Derived from |
| --- | --- | --- |
| booster | _not yet derived_ | |
| oracle | _not yet derived_ | |
| captain | _not yet derived_ | |
