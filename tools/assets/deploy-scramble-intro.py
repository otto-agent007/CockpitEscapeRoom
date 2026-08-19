#!/usr/bin/env python3
"""Deploy the Scramble intro assets from art-source to public/.

Copies the normalised 320x224 plates and cards, packs the walk cycle into a
6-column sprite sheet (cell 24x36, feet on the bottom cell row, centred), pads
the backlit figure into its cell, copies the jet sprites, and derives the dark
pre-reveal hangar plate. Deterministic; run after any normalised asset changes,
then `node tools/assets/build-intro-manifest.mjs && npm run assets:check`.
"""

from pathlib import Path

from PIL import Image

SRC = Path('art-source/intro/tmb2/scramble/normalised')
DST = Path('public/images/intro/tmb2/scramble')

PLATES = {
    'plate-hangar-reveal-320.png': 'plates/hangar-reveal.png',
    'plate-doorway-320.png': 'plates/doorway.png',
    'plate-walk-tarmac-320.png': 'plates/walk-tarmac.png',
    'plate-runway-lineup-320.png': 'plates/runway-lineup.png',
    'plate-night-sky-320.png': 'plates/night-sky.png',
    'strip-door-leaf-168.png': 'plates/door-leaf.png',
}

CARDS = [
    'card-boots', 'card-coffee', 'card-flight-case', 'card-flight-case-shut',
    'card-watch', 'card-stripes', 'card-logbook', 'card-wings',
    'card-cap-a', 'card-cap-mid', 'card-cap-b', 'card-shades', 'card-nacelle-a',
    'card-nacelle-b', 'card-nacelle-c', 'card-instruments', 'card-instruments-b',
    'card-photo', 'card-throttles-a', 'card-throttles-b',
]

WALK_CELL = (26, 50)
RUN_CELL = (44, 66)
BACKLIT_CELL = (28, 64)


def cell_pack(sprite: Image.Image, cell: tuple[int, int]) -> Image.Image:
    """Centre the sprite in the cell with its lowest opaque row on the cell's
    second-to-last row (row cell_h-1 stays clear so the pivot row is stable)."""
    cw, ch = cell
    out = Image.new('RGBA', cell, (0, 0, 0, 0))
    x = (cw - sprite.width) // 2
    y = (ch - 1) - sprite.height
    out.alpha_composite(sprite, (x, y))
    return out


def main() -> None:
    for sub in ('plates', 'cards', 'sprites'):
        (DST / sub).mkdir(parents=True, exist_ok=True)

    for src_name, dst_name in PLATES.items():
        Image.open(SRC / src_name).save(DST / dst_name)

    # dark pre-reveal variant: the lit plate multiplied down, cool-shifted
    lit = Image.open(SRC / 'plate-hangar-reveal-320.png').convert('RGB')
    dark = lit.point(lambda v: int(v * 0.14))
    dark.save(DST / 'plates/hangar-dark.png')

    for name in CARDS:
        Image.open(SRC / f'{name}-320.png').save(DST / f'cards/{name.removeprefix("card-")}.png')

    # Wave S4 cycles: the 48 px walk and the 64 px ident run, one row each.
    for cell, src_prefix, out_name in (
        (WALK_CELL, 'spr-popt-walk48', 'popt-walk-sheet.png'),
        (RUN_CELL, 'spr-popt-run64', 'popt-run-sheet.png'),
    ):
        sheet = Image.new('RGBA', (cell[0] * 6, cell[1]), (0, 0, 0, 0))
        for index in range(6):
            frame = Image.open(SRC / f'{src_prefix}-{index + 1}.png').convert('RGBA')
            sheet.alpha_composite(cell_pack(frame, cell), (index * cell[0], 0))
        sheet.save(DST / f'sprites/{out_name}')

    for single, out_name in (('spr-popt-skid64', 'popt-skid.png'), ('spr-popt-tap64', 'popt-tap.png')):
        Image.open(SRC / f'{single}.png').convert('RGBA').save(DST / f'sprites/{out_name}')

    backlit = Image.open(SRC / 'spr-popt-backlit.png').convert('RGBA')
    cell_pack(backlit, BACKLIT_CELL).save(DST / 'sprites/popt-backlit.png')

    for name in ('spr-dc9-runway', 'spr-dc9-runway-36', 'spr-dc9-runway-26',
                 'spr-dc9-liftoff-48', 'spr-dc9-liftoff-80', 'spr-dc9-liftoff-160', 'spr-dc9-liftoff-320'):
        Image.open(SRC / f'{name}.png').save(DST / f'sprites/{name.removeprefix("spr-")}.png')

    print('deployed', len(PLATES) + 1 + len(CARDS) + 6, 'files to', DST)


if __name__ == '__main__':
    main()
