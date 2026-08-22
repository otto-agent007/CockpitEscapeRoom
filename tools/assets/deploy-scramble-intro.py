#!/usr/bin/env python3
"""Deploy the Scramble intro assets from art-source to public/.

Copies the normalised 320x224 plates and cards, packs the walk and run cycles
into sprite sheets (feet on the bottom cell row, centred), pads the backlit
figure into its cell, and derives the dark pre-reveal hangar plate. Deterministic; run after any normalised asset changes,
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
    'plate-right-seat-320.png': 'plates/right-seat.png',
    'strip-door-leaf-168.png': 'plates/door-leaf.png',
}

CARDS = [
    'card-boots', 'card-coffee',
    'card-watch', 'card-stripes', 'card-logbook', 'card-wings',
    'card-cap-a', 'card-cap-mid', 'card-cap-b', 'card-shades', 'card-instruments', 'card-instruments-b',
    'card-throttles-a', 'card-throttles-b',
    'card-headset', 'card-overhead',
    'card-nacelle-a', 'card-nacelle-b', 'card-nacelle-c',
    'card-logbook-books', 'card-logbook-sweep', 'card-logbook-lift', 'card-shadow',
]

WALK_CELL = (26, 50)
RUN_CELL = (50, 66)
BACKLIT_CELL = (28, 64)


def cell_pack(sprite: Image.Image, cell: tuple[int, int]) -> Image.Image:
    """Centre the sprite in the cell with its lowest opaque row on the cell's
    second-to-last row (row cell_h-1 stays clear so the pivot row is stable).

    Centring on the bounding box was checked against anchoring on the torso
    centroid when the walk went to twelve frames: on this art the two agree to
    the pixel, because integer placement quantises the 0.4 px they differ by."""
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

    # The 48 px walk is TWELVE frames: the six Wave S4 poses interleaved with the
    # six Wave S16 in-betweens, so the stride plays at ~15 fps instead of 7.7
    # while keeping its 780 ms length — the same trade the ident run took.
    walk_order = []
    for index in range(6):
        walk_order.append(f'spr-popt-walk48-{index + 1}')
        walk_order.append(f'spr-popt-walk48-t{index + 1}')
    sheet = Image.new('RGBA', (WALK_CELL[0] * len(walk_order), WALK_CELL[1]), (0, 0, 0, 0))
    for index, name in enumerate(walk_order):
        frame = Image.open(SRC / f'{name}.png').convert('RGBA')
        sheet.alpha_composite(cell_pack(frame, WALK_CELL), (index * WALK_CELL[0], 0))
    sheet.save(DST / 'sprites/popt-walk-sheet.png')

    # The ident run is TWELVE frames: the six Wave S7 poses interleaved with the
    # six Wave S13 in-betweens, so the cycle plays at 25 fps instead of 12.5.
    run_order = []
    for index in range(6):
        run_order.append(f'spr-popt-run64-{index + 1}')
        run_order.append(f'spr-popt-run64-t{index + 1}')
    sheet = Image.new('RGBA', (RUN_CELL[0] * len(run_order), RUN_CELL[1]), (0, 0, 0, 0))
    for index, name in enumerate(run_order):
        frame = Image.open(SRC / f'{name}.png').convert('RGBA')
        sheet.alpha_composite(cell_pack(frame, RUN_CELL), (index * RUN_CELL[0], 0))
    sheet.save(DST / 'sprites/popt-run-sheet.png')

    for single, out_name in (
        ('spr-popt-gag-skid', 'popt-skid.png'),
        ('spr-popt-gag-blinded', 'popt-blinded.png'),
        ('spr-popt-gag-forearm', 'popt-forearm.png'),
        ('spr-popt-gag-flick', 'popt-flick.png'),
        ('spr-popt-gag-crooked', 'popt-crooked.png'),
        ('spr-popt-gag-salute', 'popt-salute.png'),
        ('spr-popt-gag-tip', 'popt-tip.png'),
        ('spr-popt-gag-cover', 'popt-cover.png'),
        ('spr-popt-gag-fall', 'popt-fall.png'),
        ('spr-popt-gag-swing', 'popt-swing.png'),
        ('spr-popt-gag-lookup', 'popt-lookup.png'),
        ('spr-popt-cap', 'popt-cap.png'),
        ('spr-popt-gag-landed', 'popt-landed.png'),
    ):
        Image.open(SRC / f'{single}.png').convert('RGBA').save(DST / f'sprites/{out_name}')

    backlit = Image.open(SRC / 'spr-popt-backlit.png').convert('RGBA')
    cell_pack(backlit, BACKLIT_CELL).save(DST / 'sprites/popt-backlit.png')

    print('deployed', len(PLATES) + 1 + len(CARDS) + 6, 'files to', DST)


if __name__ == '__main__':
    main()
