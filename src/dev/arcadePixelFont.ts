/**
 * A 5x7 pixel font for the arcade HUD.
 *
 * The harness used the browser's monospace font at canvas scale, which is the one
 * thing on the stage that could not be pixel art: it antialiases, it does not land
 * on the stage's pixel grid, and it changes shape between platforms. These glyphs
 * are authored on the same grid as everything else and are only ever drawn at whole
 * multiples, so the HUD reads as part of the cabinet instead of as a web page.
 *
 * Coverage is not optional. A missing glyph renders as nothing at all, which is
 * invisible until a fighter is renamed — so `arcadePixelFont.test.ts` asserts every
 * character the HUD can emit exists here.
 */

export const GLYPH_WIDTH = 5
export const GLYPH_HEIGHT = 7
/** One blank column between glyphs, so advance is six. */
export const GLYPH_ADVANCE = GLYPH_WIDTH + 1

/** Exported so the shapes themselves can be checked, not just their presence. */
export const PIXEL_GLYPHS: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  ':': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.....'],
}

export function hasGlyph(character: string): boolean {
  return character in PIXEL_GLYPHS
}

/** Width of `text` in font pixels, with no trailing inter-glyph gap. */
export function measureText(text: string): number {
  return text.length === 0 ? 0 : text.length * GLYPH_ADVANCE - 1
}

/**
 * Draw `text` at whole font pixels.
 *
 * `pixel` is the size of one font pixel in canvas units; it must be a whole number
 * or the glyphs stop landing on the grid, which is the entire point of this file.
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  pixel: number,
  colour: string,
): void {
  ctx.fillStyle = colour
  let cursor = x
  for (const character of text.toUpperCase()) {
    const glyph = PIXEL_GLYPHS[character]
    if (glyph) {
      for (let row = 0; row < GLYPH_HEIGHT; row += 1) {
        const line = glyph[row] ?? ''
        for (let column = 0; column < GLYPH_WIDTH; column += 1) {
          if (line[column] === '#') {
            ctx.fillRect(cursor + column * pixel, y + row * pixel, pixel, pixel)
          }
        }
      }
    }
    cursor += GLYPH_ADVANCE * pixel
  }
}

/** Same as drawText, with a one-pixel drop shadow so type reads over the sky. */
export function drawTextShadowed(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  pixel: number,
  colour: string,
  shadow = '#160f18',
): void {
  drawText(ctx, text, x + pixel, y + pixel, pixel, shadow)
  drawText(ctx, text, x, y, pixel, colour)
}
