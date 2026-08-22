#!/usr/bin/env python3
"""Greybox animatic for plan 0031 — the Scramble intro design (pure Option B).

Renders the full 53.04 s launch-sequence design as placeholder art at the real
stage resolution (320x224, upscaled 4x NEAREST), 12 fps, fully deterministic
(no wall clock, no RNG), then muxes it with the real intro track. Nothing here
is production art; it exists so the design's rhythm, beat placement, and
composition can be judged before a single generated frame is spent.

Usage:
    python3 tools/design/intro-0031-animatic.py <frames-dir> [--mp4 <out.mp4>]

Beat map and cue values mirror plans/0031-ink-and-altitude-intro.md and
src/game/introMusicCues.ts. If a cue changes there, change it here.
"""

import math
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 320, 224
SCALE = 4
FPS = 12
DURATION = 53.04

CUES = {
    'bootsDown': 7.512,        # assembleDone
    'hangarReveal': 13.056,    # exclaim — largest hit in the track
    'gloveSnap': 14.544,       # keyFlyExit
    'harnessClick': 19.368,    # cartNearMiss
    'capFlip': 24.552,         # ballDeflect
    'shadesDown': 30.48,       # bullImpact
    'engineStart': 35.64,      # skyGridIgnite
    'throttlesUp': 45.12,      # missLunge
    'rotate': 46.008,          # catchRecover
    'jetPass': 47.496,         # catchGrab
    'emblemStamp': 49.704,
}
GRID = 0.72

INK = (25, 25, 34)
GOLD = (245, 196, 36)
BLUE = (23, 97, 232)
RED = (229, 72, 53)
NIGHT = (10, 15, 34)
HANGAR = (20, 26, 46)
CARD_BG = (14, 18, 32)
STEEL = (50, 62, 96)
AMBER = (255, 176, 32)
WHITE = (255, 253, 240)
SKIN = (248, 172, 117)
NAVY = (24, 30, 54)

FONT_DIR = '/usr/share/fonts/truetype/dejavu'
F8 = ImageFont.truetype(f'{FONT_DIR}/DejaVuSansMono.ttf', 8)
F10 = ImageFont.truetype(f'{FONT_DIR}/DejaVuSans-Bold.ttf', 10)
F13 = ImageFont.truetype(f'{FONT_DIR}/DejaVuSans-Bold.ttf', 13)
F26 = ImageFont.truetype(f'{FONT_DIR}/DejaVuSans-Bold.ttf', 26)


def clamp01(v):
    return max(0.0, min(1.0, v))


def punch(t, accent, attack=0.06, decay=0.5):
    since = t - accent
    if since < 0 or since >= attack + decay:
        return 0.0
    if since < attack:
        return since / attack
    return (1 - (since - attack) / decay) ** 2


def flash_env(t, accent, dur=0.18):
    since = t - accent
    if since < 0 or since >= dur:
        return 0.0
    phase = since / dur
    return 1.0 if phase < 0.35 else (1 - phase) / 0.65


def shake(t, accent, amp, dur=0.4):
    since = t - accent
    if since < 0 or since >= dur:
        return 0, 0
    env = (1 - since / dur) ** 2
    lat = int(since * 60)
    x = round(amp * env * ((((lat * 73 + 19) % 7) - 3) / 3))
    y = round(amp * env * ((((lat * 41 + 7) % 5) - 2) / 2))
    return x, y


def beacon_on(t):
    """Anti-collision beacon flash, locked to the 0.72 s grid after light-off."""
    if t < CUES['engineStart']:
        return False
    return ((t - CUES['engineStart']) / GRID) % 1.0 < 0.14


def figure(d, x, y, h, colourless=False, stride=0.0, backlit=False):
    """Block figure standing on baseline y, total height h."""
    head = int(h * 0.24)
    torso = int(h * 0.40)
    legs = h - head - torso
    cx = int(x)
    hw = max(3, int(h * 0.16))
    if backlit or colourless:
        shirt = trousers = cap = skin = (8, 10, 18) if backlit else INK
    else:
        shirt, trousers, cap, skin = WHITE, NAVY, (18, 22, 44), SKIN
    ty = int(y - legs - torso)
    hy = int(ty - head)
    spread = int(legs * 0.35 * stride)
    d.rectangle([cx - hw + 1, int(y - legs), cx - 1, y], fill=trousers)
    d.rectangle([cx + 1, int(y - legs), cx + hw - 1, y], fill=trousers)
    if spread:
        d.rectangle([cx - hw + 1 - spread, int(y - legs * 0.4), cx - 1 - spread, y], fill=trousers)
        d.rectangle([cx + 1 + spread, int(y - legs * 0.4), cx + hw - 1 + spread, y], fill=trousers)
    d.rectangle([cx - hw, ty, cx + hw, int(y - legs)], fill=shirt)
    d.rectangle([cx - int(head * 0.45), hy, cx + int(head * 0.45), ty], fill=skin)
    d.rectangle([cx - int(head * 0.6), hy - max(2, head // 4), cx + int(head * 0.6), hy + 1], fill=cap)
    if not (backlit or colourless):
        d.rectangle([cx - 1, ty + 1, cx + 1, ty + torso // 2], fill=NAVY)


def dc9_side(d, cx, cy, s, colour):
    """DC-9 side silhouette: clean fuselage, T-tail, rear engine pod. cx,cy is
    the fuselage centre; s is the fuselage half-length in px."""
    fh = max(4, int(s * 0.14))
    d.rounded_rectangle([cx - s, cy - fh, cx + s, cy + fh], radius=fh, fill=colour)
    fin_x = cx + s - int(s * 0.18)
    fin_top = cy - fh - int(s * 0.42)
    d.polygon([(fin_x, cy - fh), (fin_x + int(s * 0.20), fin_top),
               (fin_x + int(s * 0.30), fin_top), (fin_x + int(s * 0.16), cy - fh)], fill=colour)
    d.rectangle([fin_x + int(s * 0.06), fin_top - max(2, fh // 2),
                 fin_x + int(s * 0.46), fin_top], fill=colour)
    pod_x = cx + s - int(s * 0.38)
    d.rounded_rectangle([pod_x, cy - fh - max(3, fh // 2) - 2, pod_x + int(s * 0.26),
                         cy - fh - 1], radius=2, fill=colour)
    d.polygon([(cx - s, cy - fh + 1), (cx - s - int(s * 0.10), cy),
               (cx - s, cy + fh - 1)], fill=colour)
    d.rectangle([cx - int(s * 0.78), cy - fh + 1, cx - int(s * 0.62), cy - fh + 3], fill=SKYBLUE if colour != INK else colour)


SKYBLUE = (117, 196, 255)


def card(d, caption):
    d.rectangle([0, 0, W, H], fill=CARD_BG)
    cx, cy = W // 2, H // 2 - 10
    for s in (-1, 1):
        d.line([cx + s * 66, cy - 2, cx + s * 78, cy - 2], fill=GOLD, width=2)
    d.text((W // 2, H - 34), caption, font=F13, fill=WHITE, anchor='mm')
    return cx, cy


def ticks(d, cx, cy, r0=10, r1=18, n=6, colour=GOLD):
    for i in range(n):
        ang = i * (2 * math.pi / n) + 0.4
        d.line([cx + r0 * math.cos(ang), cy + r0 * math.sin(ang),
                cx + r1 * math.cos(ang), cy + r1 * math.sin(ang)], fill=colour, width=2)


def scene_ident(img, d, t):
    d.rectangle([0, 0, W, H], fill=NIGHT)
    build = clamp01(t / 1.7)
    bw = int(120 * build)
    if bw > 2:
        d.rectangle([W // 2 - bw, 78, W // 2 + bw, 128], outline=BLUE, width=3)
    if build >= 0.999:
        d.text((W // 2, 103), 'TMB2', font=F26, fill=WHITE, anchor='mm')
    if t >= 4.656:
        for i in range(3):
            tw = (t - 4.656) * 3.1 + i * 2.3
            x = 64 + i * 96 + 5 * math.sin(tw)
            y = 74 + 4 * math.cos(tw * 0.7)
            d.line([x - 3, y, x + 3, y], fill=GOLD, width=1)
            d.line([x, y - 3, x, y + 3], fill=GOLD, width=1)
    d.text((W // 2, H - 16), 'IDENT — EXISTING SCENE, UNCHANGED', font=F8, fill=(90, 110, 160), anchor='mm')
    return punch(t, 3.936) * 0.16, (W // 2, 103), [('white', 0.5 * flash_env(t, 3.936, 0.15))]


def scene_beacon_dark(img, d, t):
    d.rectangle([0, 0, W, H], fill=(4, 6, 14))
    p = (t - 6.0) / (CUES['bootsDown'] - 6.0)
    bx = int(-40 + 400 * p)
    for k in range(5):
        alpha_w = 5 - k
        d.line([bx - k * 14, 0, bx - k * 14 - 30, H], fill=(30 + 14 * alpha_w, 24 + 10 * alpha_w, 10), width=3)
    d.ellipse([bx - 3, 100, bx + 3, 106], fill=AMBER)
    return 0.0, (W // 2, H // 2), []


RITUAL = [
    (CUES['bootsDown'], 'BOOTS ON THE TARMAC'),
    (CUES['bootsDown'] + 2 * GRID, 'COFFEE DOWN'),
    (CUES['bootsDown'] + 4 * GRID, 'THE FLIGHT CASE'),
    (CUES['bootsDown'] + 6 * GRID, 'LATCHES SNAP'),
]


def scene_ritual(img, d, t):
    idx = max(i for i, (ct, _) in enumerate(RITUAL) if t >= ct)
    ct, name = RITUAL[idx]
    cx, cy = card(d, name)
    if idx == 0:
        d.line([cx - 70, cy + 26, cx + 70, cy + 26], fill=STEEL, width=2)
        for s in (-1, 1):
            bx = cx + s * 26
            drop = int(max(0, 0.18 - (t - ct)) * 60) * (1 if s < 0 else 0)
            d.rectangle([bx - 14, cy - 8 - drop, bx + 10, cy + 24 - drop], fill=NAVY)
            d.rectangle([bx - 18, cy + 14 - drop, bx + 10, cy + 24 - drop], fill=(14, 16, 26))
        if t - ct < 0.4:
            ticks(d, cx, cy + 26, 12, 20, 4, (120, 130, 160))
    elif idx == 1:
        d.line([cx - 70, cy + 24, cx + 70, cy + 24], fill=STEEL, width=2)
        d.rectangle([cx - 12, cy - 4, cx + 12, cy + 24], fill=WHITE)
        d.arc([cx + 10, cy + 2, cx + 26, cy + 18], 270, 90, fill=WHITE, width=3)
        for k in range(3):
            ph = t * 2.2 + k * 1.9
            sx = cx - 6 + k * 6
            d.arc([sx - 3, cy - 26 + int(2 * math.sin(ph)), sx + 3, cy - 10], 90, 270, fill=(150, 160, 190), width=1)
    else:
        d.rectangle([cx - 44, cy - 20, cx + 44, cy + 28], fill=NAVY, outline=STEEL, width=2)
        d.rectangle([cx - 12, cy - 28, cx + 12, cy - 20], outline=STEEL, width=2)
        d.rectangle([cx - 30, cy + 2, cx + 30, cy + 12], fill=(14, 16, 26))
        d.text((cx, cy + 7), 'CAPT. POP T', font=F8, fill=GOLD, anchor='mm')
        for s in (-1, 1):
            lx = cx + s * 30
            closed = idx == 3
            d.rectangle([lx - 5, cy - 24 if not closed else cy - 22, lx + 5, cy - 16], fill=GOLD)
        if idx == 3 and t - ct < 0.4:
            ticks(d, cx, cy - 20, 14, 22, 4)
    return punch(t, ct, 0.04, 0.35) * 0.10, (cx, cy), \
        [('white', 0.3 * flash_env(t, ct, 0.08))]


def scene_reveal(img, d, t):
    d.rectangle([0, 0, W, H], fill=(6, 8, 18))
    since = t - CUES['hangarReveal']
    rows_on = min(4, 1 + int(since / 0.09))
    for r in range(rows_on):
        ly = 24 + r * 14
        for k in range(6):
            lx = 30 + k * 52
            d.rectangle([lx - 12, ly, lx + 12, ly + 4], fill=WHITE)
            d.polygon([(lx - 12, ly + 4), (lx + 12, ly + 4), (lx + 26, ly + 44), (lx - 26, ly + 44)],
                      fill=(24 + 6 * (4 - r), 30 + 6 * (4 - r), 52))
    if rows_on >= 2:
        d.rectangle([0, 176, W, H], fill=(26, 32, 54))
        dc9_side(d, W // 2, 148, 120, STEEL)
        d.line([40, 176, 280, 176], fill=(60, 72, 108), width=1)
    if rows_on >= 3:
        figure(d, 52, 200, 40, backlit=True)
    stamp = 0.94 if since < 0.08 else 1.0
    return (1 - stamp) + punch(t, CUES['hangarReveal']) * 0.16, (W // 2, 140), \
        [('white', 0.55 * flash_env(t, CUES['hangarReveal'], 0.2))]


SUITUP = [
    (CUES['gloveSnap'], 'GLOVE SNAP'),
    (CUES['gloveSnap'] + 3 * GRID, 'FOUR STRIPES'),
    (CUES['harnessClick'], 'HARNESS CLICK'),
    (CUES['harnessClick'] + 3 * GRID, 'WINGS PINNED'),
    (CUES['capFlip'], 'CAP FLIP'),
]


def scene_suitup(img, d, t):
    idx = max(i for i, (ct, _) in enumerate(SUITUP) if t >= ct)
    ct, name = SUITUP[idx]
    cx, cy = card(d, name)
    if idx == 0:
        d.rectangle([cx - 60, cy - 20, cx - 12, cy + 24], fill=(230, 226, 214))
        d.rectangle([cx + 12, cy - 20, cx + 60, cy + 24], fill=(230, 226, 214))
        for s in (-1, 1):
            for k in range(3):
                d.line([cx + s * (14 + k * 12), cy - 20, cx + s * (16 + k * 12), cy - 34],
                       fill=(230, 226, 214), width=5)
        if t - ct < 0.3:
            ticks(d, cx, cy, 16, 24, 6)
    elif idx == 1:
        d.polygon([(cx - 54, cy + 30), (cx - 30, cy - 34), (cx + 30, cy - 34), (cx + 54, cy + 30)],
                  fill=NAVY)
        slide = clamp01((t - ct) / 0.4)
        for k in range(4):
            sy = cy + 18 - k * 12
            wdt = int(40 * min(1, slide * 4 - k * 0.6)) if slide * 4 > k * 0.6 else 0
            if wdt > 0:
                d.rectangle([cx - wdt, sy - 3, cx + wdt, sy + 1], fill=GOLD)
        shine = (t - ct) * 160 - 40
        if 0 < shine < 108:
            d.line([cx - 54 + shine, cy + 30, cx - 34 + shine, cy - 34], fill=WHITE, width=2)
    elif idx == 2:
        d.rectangle([cx - 44, cy - 44, cx + 44, cy + 48], fill=(238, 236, 228))
        d.line([cx - 44, cy - 44, cx + 44, cy + 48], fill=NAVY, width=9)
        d.line([cx + 44, cy - 44, cx - 44, cy + 48], fill=NAVY, width=9)
        d.rectangle([cx - 10, cy - 8, cx + 10, cy + 12], fill=(150, 150, 160), outline=(60, 60, 70), width=2)
        if t - ct < 0.3:
            ticks(d, cx, cy + 2, 16, 24, 4, (200, 210, 230))
    elif idx == 3:
        d.ellipse([cx - 9, cy - 9, cx + 9, cy + 9], outline=GOLD, width=3)
        for s in (-1, 1):
            for i in range(3):
                wl = 26 - i * 7
                yy = cy - 6 + i * 6
                xa = cx + s * 11
                d.rectangle([min(xa, xa + s * wl), yy, max(xa, xa + s * wl), yy + 3], fill=GOLD)
        for i, (sx, sy) in enumerate([(-30, -20), (32, -16), (0, -30)]):
            tw = t * 3 + i * 2.1
            if math.sin(tw) > 0.2:
                d.line([cx + sx - 3, cy + sy, cx + sx + 3, cy + sy], fill=WHITE, width=1)
                d.line([cx + sx, cy + sy - 3, cx + sx, cy + sy + 3], fill=WHITE, width=1)
    else:
        ang = min(1.0, (t - ct) / 0.5) * math.pi * 1.5
        ox = int(30 * math.cos(ang))
        oy = int(-34 + 24 * abs(math.sin(ang)))
        d.arc([cx - 50, cy - 60, cx + 50, cy + 10], 200, 340, fill=(70, 80, 110), width=1)
        d.rectangle([cx + ox - 22, cy + oy - 7, cx + ox + 22, cy + oy + 7], fill=(18, 22, 44))
        d.rectangle([cx + ox - 26, cy + oy + 5, cx + ox + 26, cy + oy + 9], fill=(18, 22, 44))
        d.rectangle([cx + ox - 8, cy + oy - 5, cx + ox + 8, cy + oy - 1], fill=GOLD)
        if t - ct >= 0.5:
            d.rectangle([cx - 10, cy + 18, cx + 10, cy + 30], fill=SKIN)
    return punch(t, ct, 0.04, 0.35) * 0.12, (cx, cy), \
        [('white', 0.4 * flash_env(t, ct, 0.1))]


def scene_doors(img, d, t):
    p = clamp01((t - 26.0) / (CUES['shadesDown'] - 26.0))
    d.rectangle([0, 0, W, H], fill=(6, 8, 16))
    gap = int(8 + 120 * p)
    glow = Image.new('RGB', (W, H), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.polygon([(W // 2 - gap, 0), (W // 2 + gap, 0), (W // 2 + gap + 40, H), (W // 2 - gap - 40, H)],
               fill=(56, 62, 92))
    gd.polygon([(W // 2 - gap // 2, 0), (W // 2 + gap // 2, 0), (W // 2 + gap, H), (W // 2 - gap, H)],
               fill=(96, 100, 130))
    img.paste(glow, (0, 0))
    d = ImageDraw.Draw(img)
    dc9_side(d, W // 2, 120, min(110, gap + 30), (16, 20, 34))
    d.rectangle([0, 0, W // 2 - gap, H], fill=(8, 10, 20))
    d.rectangle([W // 2 + gap, 0, W, H], fill=(8, 10, 20))
    for s in (-1, 1):
        ex = W // 2 + s * gap
        d.rectangle([min(ex, ex - s * 6), 0, max(ex, ex - s * 6), H], fill=(30, 36, 58))
    figure(d, W // 2, 208, 64, backlit=True)
    return 0.0, (W // 2, 120), []


def scene_shades(img, d, t):
    cx, cy = card(d, 'SHADES DOWN')
    d.rectangle([cx - 52, cy - 12, cx + 52, cy + 14], fill=(14, 16, 26), outline=(70, 80, 110), width=2)
    d.rectangle([cx - 4, cy - 6, cx + 4, cy + 8], fill=(70, 80, 110))
    streak = clamp01((t - CUES['shadesDown']) / 0.3)
    sx = int(cx - 60 + 140 * streak)
    d.line([sx - 18, cy + 16, sx + 8, cy - 16], fill=WHITE, width=3)
    return punch(t, CUES['shadesDown'], 0.04, 0.35) * 0.12, (cx, cy), \
        [('white', 0.45 * flash_env(t, CUES['shadesDown'], 0.12))]


def scene_walk(img, d, t):
    p = clamp01((t - 31.5) / (CUES['engineStart'] - 31.5))
    d.rectangle([0, 0, W, H], fill=NIGHT)
    for i in range(10):
        d.point((((i * 97 + 31) % W), ((i * 61 + 11) % 70)), fill=WHITE)
    d.rectangle([0, 20, 24, 190], fill=(16, 20, 36))
    d.rectangle([W - 24, 20, W, 190], fill=(16, 20, 36))
    d.rectangle([24, 20, W - 24, 190], fill=(22, 30, 58))
    nx = W // 2 + 30
    d.rounded_rectangle([nx - 90, 96, nx + 130, 140], radius=18, fill=(40, 50, 80))
    d.polygon([(nx + 96, 96), (nx + 118, 40), (nx + 128, 40), (nx + 112, 96)], fill=(40, 50, 80))
    d.rectangle([nx + 106, 36, nx + 146, 42], fill=(40, 50, 80))
    d.rectangle([0, 190, W, H], fill=(26, 32, 54))
    wx = int(50 + 120 * p)
    figure(d, wx, 190, 34, stride=math.sin(t * 9))
    d.polygon([(wx - 3, 190), (wx + 3, 190), (wx + 26, 196), (wx - 14, 196)], fill=(12, 16, 30))
    return 0.0, (W // 2, 130), []


def scene_engine_start(img, d, t):
    d.rectangle([0, 0, W, H], fill=HANGAR)
    cx, cy = W // 2, H // 2 - 12
    since = t - CUES['engineStart']
    d.ellipse([cx - 46, cy - 46, cx + 46, cy + 46], fill=(30, 38, 62), outline=STEEL, width=4)
    d.ellipse([cx - 36, cy - 36, cx + 36, cy + 36], fill=(10, 12, 22))
    spool = min(1.0, since / 2.2)
    ang0 = 3.0 * since * since + 0.8 * since
    for k in range(4):
        ang = ang0 + k * math.pi / 2
        d.line([cx, cy, cx + 30 * math.cos(ang), cy + 30 * math.sin(ang)],
               fill=(120 + int(60 * spool), 130, 160), width=3)
    d.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill=STEEL)
    if beacon_on(t):
        d.ellipse([cx + 58, cy - 52, cx + 70, cy - 40], fill=AMBER)
        ticks(d, cx + 64, cy - 46, 8, 13, 4, AMBER)
    d.text((W // 2, H - 34), 'ENGINE START', font=F13, fill=WHITE, anchor='mm')
    for s in (-1, 1):
        d.line([cx + s * 66, cy - 2, cx + s * 78, cy - 2], fill=GOLD, width=2)
    return punch(t, CUES['engineStart']) * 0.14, (cx, cy), \
        [('white', 0.4 * flash_env(t, CUES['engineStart'], 0.15))]


INSERTS = [
    (CUES['engineStart'] + 4 * GRID, 'INSTRUMENTS ALIVE'),
    (CUES['engineStart'] + 6 * GRID, 'THE PHOTO'),
    (CUES['engineStart'] + 8 * GRID, 'HAND ON THE THROTTLES'),
]


def scene_inserts(img, d, t):
    idx = max(i for i, (ct, _) in enumerate(INSERTS) if t >= ct)
    ct, name = INSERTS[idx]
    cx, cy = card(d, name)
    if idx == 0:
        d.rectangle([cx - 70, cy - 24, cx + 70, cy + 28], fill=(16, 18, 30), outline=STEEL, width=2)
        prog = clamp01((t - ct) / 0.6)
        for k in range(8):
            gx = cx - 56 + k * 16
            on = prog * 8 > k
            colour = SKYBLUE if k % 3 else AMBER
            d.ellipse([gx - 6, cy - 10, gx + 6, cy + 2], outline=colour if on else (40, 44, 62), width=2)
            if on:
                ang = -2.2 + k * 0.5
                d.line([gx, cy - 4, gx + 5 * math.cos(ang), cy - 4 + 5 * math.sin(ang)], fill=colour, width=1)
        for k in range(6):
            gx = cx - 50 + k * 20
            if prog * 6 > k:
                d.rectangle([gx - 4, cy + 12, gx + 4, cy + 20], fill=(30, 90, 60))
    elif idx == 1:
        d.polygon([(cx - 80, cy + 34), (cx + 80, cy + 34), (cx + 60, cy + 6), (cx - 60, cy + 6)],
                  fill=(16, 18, 30))
        d.rectangle([cx - 26, cy - 34, cx + 26, cy + 12], fill=WHITE)
        d.rectangle([cx - 22, cy - 30, cx + 22, cy + 2], fill=(70, 110, 170))
        d.line([cx - 22, cy - 12, cx + 22, cy - 12], fill=(120, 160, 210), width=1)
        figure(d, cx - 8, cy + 1, 22, colourless=False)
        figure(d, cx + 9, cy + 1, 14, colourless=False)
        d.polygon([(cx - 6, cy - 34), (cx + 6, cy - 34), (cx, cy - 40)], fill=GOLD)
        tw = t * 2.6
        if math.sin(tw) > 0:
            d.line([cx + 34, cy - 24, cx + 40, cy - 24], fill=GOLD, width=1)
            d.line([cx + 37, cy - 27, cx + 37, cy - 21], fill=GOLD, width=1)
    else:
        for k in range(3):
            d.arc([cx - 60, cy - 20 + k * 4, cx + 60, cy + 60 + k * 4], 220, 320, fill=(40, 44, 62), width=1)
        drop = int(18 * (1 - clamp01((t - ct) / 0.35)))
        for s in (-1, 1):
            lx = cx + s * 12
            d.rectangle([lx - 4, cy - 18, lx + 4, cy + 26], fill=STEEL)
            d.rectangle([lx - 7, cy - 26, lx + 7, cy - 16], fill=(200, 205, 220))
        d.rectangle([cx - 20, cy - 40 - drop, cx + 20, cy - 22 - drop], fill=SKIN)
        d.rectangle([cx - 24, cy - 46 - drop, cx + 24, cy - 36 - drop], fill=WHITE)
    return punch(t, ct, 0.04, 0.35) * 0.10, (cx, cy), \
        [('white', 0.3 * flash_env(t, ct, 0.08))]


def scene_takeoff(img, d, t):
    d.rectangle([0, 0, W, H], fill=NIGHT)
    for i in range(12):
        d.point((((i * 97 + 31) % W), ((i * 61 + 11) % 90)), fill=WHITE)
    speed = clamp01((t - CUES['throttlesUp']) / 1.6)
    pitch = clamp01((t - CUES['rotate']) / 1.2)
    hy = int(118 + 30 * pitch)
    d.rectangle([0, hy, W, H], fill=(18, 22, 38))
    d.polygon([(W // 2 - 14, hy), (W // 2 + 14, hy), (W // 2 + 150, H), (W // 2 - 150, H)],
              fill=(30, 34, 52))
    scroll = (t * (10 + 280 * speed)) % 24
    for k in range(10):
        yy = hy + 6 + k * 24 - scroll
        if hy < yy < H:
            depth = (yy - hy) / (H - hy)
            wgap = int(2 + 10 * depth)
            ln = int(3 + 14 * depth * (1 + 2 * speed))
            d.rectangle([W // 2 - wgap // 2, int(yy), W // 2 + wgap // 2, int(yy + ln)], fill=WHITE)
            ex = int(14 + 136 * depth)
            stretch = int(1 + 10 * speed * depth)
            d.rectangle([W // 2 - ex, int(yy), W // 2 - ex + 2, int(yy + stretch)], fill=AMBER)
            d.rectangle([W // 2 + ex - 2, int(yy), W // 2 + ex, int(yy + stretch)], fill=AMBER)
    strobe = (int(t * 10) % 12) < 2
    if t < CUES['jetPass']:
        jy = int(150 - 34 * pitch)
        d.rounded_rectangle([W // 2 - 26, jy, W // 2 + 26, jy + 12], radius=6, fill=STEEL)
        d.polygon([(W // 2 + 18, jy), (W // 2 + 26, jy - 16 - int(6 * pitch)),
                   (W // 2 + 31, jy - 16 - int(6 * pitch)), (W // 2 + 25, jy)], fill=STEEL)
        if beacon_on(t):
            d.ellipse([W // 2 - 2, jy - 5, W // 2 + 2, jy - 1], fill=AMBER)
        if strobe:
            for s in (-1, 1):
                d.ellipse([W // 2 + s * 24 - 1, jy + 4, W // 2 + s * 24 + 2, jy + 7], fill=WHITE)
        if pitch > 0:
            d.polygon([(W // 2 - 26, jy + 12), (W // 2 - 40, jy + 12 + int(10 * pitch)),
                       (W // 2 - 26, jy + 6)], fill=(255, 200, 120))
    else:
        pp = clamp01((t - CUES['jetPass']) / 0.5)
        if pp < 1:
            jscale = 1 + 5 * pp
            jw, jh = int(60 * jscale), int(16 * jscale)
            jx = int(W // 2 - 40 * pp)
            jy = int(140 - 190 * pp)
            d.rounded_rectangle([jx - jw // 2, jy, jx + jw // 2, jy + jh], radius=jh // 2, fill=STEEL)
            d.polygon([(jx + jw // 4, jy), (jx + jw // 3, jy - jh * 2), (jx + jw // 3 + 8, jy - jh * 2),
                       (jx + jw // 4 + 10, jy)], fill=STEEL)
        cx0, cy0 = W // 2 + 20, 150
        for k in range(24):
            cp = k / 23
            px = int(cx0 - (cx0 - 30) * cp * clamp01((t - CUES['jetPass']) / 1.2))
            py = int(cy0 - (cy0 - 30) * (cp ** 1.4) * clamp01((t - CUES['jetPass']) / 1.2))
            wdt = max(1, int(5 * (1 - cp)))
            d.ellipse([px - wdt, py - wdt, px + wdt, py + wdt], fill=(220, 228, 244))
    z = max(punch(t, CUES['throttlesUp']) * 0.1, punch(t, CUES['rotate']) * 0.08,
            punch(t, CUES['jetPass']) * 0.2)
    return z, (W // 2, 130), [('white', 0.4 * flash_env(t, CUES['jetPass'], 0.15))]


def scene_title(img, d, t):
    d.rectangle([0, 0, W, H], fill=NIGHT)
    for i in range(12):
        d.point((((i * 97 + 31) % W), ((i * 61 + 11) % H)), fill=WHITE)
    d.line([30, 160, 290, 76], fill=(200, 210, 230), width=2)
    reveal = clamp01((t - CUES['emblemStamp']) / 0.236)
    stamp = 0.9 if t - CUES['emblemStamp'] < 0.08 else 1.0
    cx, cy = W // 2, 100
    for i in range(12):
        ang = i * math.pi / 6 + (t - CUES['emblemStamp']) * 0.35
        d.line([cx + 40 * math.cos(ang), cy + 40 * math.sin(ang),
                cx + 120 * math.cos(ang), cy + 120 * math.sin(ang)],
               fill=(40, 52, 92), width=2)
    r = int(26 * stamp * reveal + 1)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=GOLD, width=4)
    if r > 8:
        d.arc([cx - r + 6, cy - r + 6, cx + r - 6, cy + r - 6], 0, 360, fill=GOLD, width=1)
    for s in (-1, 1):
        for i in range(3):
            wl = int((34 - i * 9) * stamp * reveal)
            yy = cy - 8 + i * 7
            xa = cx + s * (r + 2)
            d.rectangle([min(xa, xa + s * wl), yy, max(xa, xa + s * wl), yy + 4], fill=GOLD)
    if reveal >= 1:
        d.text((cx, cy + 52), 'TMB2 PRODUCTIONS', font=F13, fill=WHITE, anchor='mm')
    return (1 - stamp) + punch(t, CUES['emblemStamp']) * 0.1, (cx, cy), \
        [('white', 0.6 * flash_env(t, CUES['emblemStamp'], 0.22))]


def scene_collapse(img, d, t):
    scene_title(img, d, min(t, 50.9))
    d = ImageDraw.Draw(img)
    p = clamp01((t - 51.0) / 2.04)
    n = int(1120 * p)
    for k in range(n):
        gx = ((k * 193 + 71) % 40) * 8
        gy = ((k * 149 + 37) % 28) * 8
        c = BLUE if (k * 7 + 3) % 5 else NIGHT
        d.rectangle([gx, gy, gx + 7, gy + 7], fill=c)
    return 0.0, (W // 2, H // 2), []


SCENES = [
    (0.0, 6.0, scene_ident),
    (6.0, CUES['bootsDown'], scene_beacon_dark),
    (CUES['bootsDown'], CUES['hangarReveal'], scene_ritual),
    (CUES['hangarReveal'], CUES['gloveSnap'], scene_reveal),
    (CUES['gloveSnap'], 26.0, scene_suitup),
    (26.0, CUES['shadesDown'], scene_doors),
    (CUES['shadesDown'], 31.5, scene_shades),
    (31.5, CUES['engineStart'], scene_walk),
    (CUES['engineStart'], INSERTS[0][0], scene_engine_start),
    (INSERTS[0][0], 42.84, scene_inserts),
    (42.84, CUES['emblemStamp'], scene_takeoff),
    (CUES['emblemStamp'], 51.0, scene_title),
    (51.0, DURATION + 1, scene_collapse),
]

SHAKES = [
    (CUES['hangarReveal'], 3.5, 0.4), (CUES['capFlip'], 1.5, 0.25),
    (CUES['shadesDown'], 2.0, 0.3), (CUES['engineStart'], 2.0, 0.35),
    (CUES['jetPass'], 2.5, 0.35), (CUES['emblemStamp'], 2.0, 0.3),
]


def render_frame(t):
    img = Image.new('RGB', (W, H), NIGHT)
    d = ImageDraw.Draw(img)
    for start, end, fn in SCENES:
        if start <= t < end:
            zoom_lift, focal, flashes = fn(img, d, t)
            break
    else:
        zoom_lift, focal, flashes = 0.0, (W // 2, H // 2), []
    zoom = 1 + zoom_lift
    if zoom > 1.02:
        cw, chh = int(W / zoom), int(H / zoom)
        fx = min(max(focal[0] - cw // 2, 0), W - cw)
        fy = min(max(focal[1] - chh // 2, 0), H - chh)
        img = img.crop((fx, fy, fx + cw, fy + chh)).resize((W, H), Image.NEAREST)
    sx = sy = 0
    for accent, amp, dur in SHAKES:
        ox, oy = shake(t, accent, amp, dur)
        sx += ox
        sy += oy
    if CUES['throttlesUp'] <= t < CUES['jetPass']:
        lat = int(t * 60)
        sx += (((lat * 73 + 19) % 3) - 1)
        sy += (((lat * 41 + 7) % 3) - 1)
    if sx or sy:
        shaken = Image.new('RGB', (W, H), (0, 0, 0))
        shaken.paste(img, (sx, sy))
        img = shaken
    for colour, opacity in flashes:
        if opacity > 0:
            tint = WHITE if colour == 'white' else RED
            overlay = Image.new('RGBA', (W, H), tint + (int(255 * opacity),))
            img = Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB')
    d = ImageDraw.Draw(img)
    fired = [name for name, ct in CUES.items() if 0 <= t - ct < 0.7]
    tag = f't={t:5.2f}' + (('  ' + fired[-1]) if fired else '')
    d.text((4, H - 10), tag, font=F8, fill=(120, 200, 120))
    return img


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    frames_dir = Path(sys.argv[1])
    mp4_out = None
    if '--mp4' in sys.argv:
        mp4_out = Path(sys.argv[sys.argv.index('--mp4') + 1])
    if frames_dir.exists():
        shutil.rmtree(frames_dir)
    frames_dir.mkdir(parents=True)
    total = int(DURATION * FPS)
    for i in range(total):
        t = i / FPS
        img = render_frame(t)
        img.resize((W * SCALE, H * SCALE), Image.NEAREST).save(frames_dir / f'f{i:04d}.png')
    print(f'{total} frames -> {frames_dir}')
    if mp4_out:
        audio = Path(__file__).resolve().parents[2] / 'public/audio/intro-audio-53s.mp3'
        subprocess.run([
            'ffmpeg', '-y', '-framerate', str(FPS), '-i', str(frames_dir / 'f%04d.png'),
            '-i', str(audio), '-c:v', 'libx264', '-crf', '21', '-pix_fmt', 'yuv420p',
            '-c:a', 'aac', '-b:a', '160k', '-shortest', str(mp4_out),
        ], check=True, capture_output=True)
        print(f'muxed -> {mp4_out}')


if __name__ == '__main__':
    main()
