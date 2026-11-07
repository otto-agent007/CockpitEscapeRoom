# Captain's Key entry artwork and browser icon

**Superseded:** the owner declined this first winged-key direction and selected B — Arcade Adventure. The original is preserved as history; its runtime derivatives are omitted from the build. The selected art and full-page restyle are documented in `captains-key-arcade-entry-2026-11-06.md`.

Generated on 2026-11-06 at the owner's request using the built-in image maker (`image_gen.imagegen`). The same square artwork supplies the entry-page illustration and all browser-icon derivatives. No external airline artwork, production dependency, Blender asset or game reward asset was added or changed. Owner visual review remains pending.

## Source and derivatives

| Artifact | Dimensions | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `art-source/branding/captains-key-emblem-source.png` | 1254 × 1254 | 1,463,364 | `3d3d168a9b5a556216dc94128f1b101faccfc67080884079d62773868765965c` |
| `public/images/captains-key-emblem.webp` | 640 × 640 | 27,370 | `bddfc08d0114b5981f24a802df2895e7d92fa3e814a22bcc0a1f1d4cb1d135d3` |
| `public/favicon-16.png` | 16 × 16 | 629 | `3ce5172707db5929863513b96075080fbeee06ffd49f8fcc010e79a456b27852` |
| `public/favicon-32.png` | 32 × 32 | 1,640 | `63fb74f1a74231d36b954b6e0e880d0a716e29c591d77bb47f01d0a678b09969` |
| `public/apple-touch-icon.png` | 180 × 180 | 31,343 | `0ea864f8d48cd86616e73a5584d1deefc0866a82469324aaa895f0d3a08171cc` |

The generated original was copied, unchanged, from `/home/user1/.codex/generated_images/01a1b22e-936b-7933-8f1c-3935f86cb54e/exec-e43adbfc-5c5d-4de9-b93e-c8eecbfc2e37.png`. Its original copy remains there. Existing sharp development tooling resized it with the default Lanczos kernel: `sharp(source).resize(640, 640).webp({ quality: 90 })` for display and `sharp(source).resize(size, size).png({ compressionLevel: 9 })` for icons. These are size/encoding derivatives, with no repainting, compositing or content replacement. Source artwork is excluded from Vercel builds by the existing art-source rule.

## Generation prompt

> Use case: logo-brand. Asset type: one square game emblem, to appear prominently on a click-to-begin screen and to be downscaled into the browser tab favicon for the aviation tribute game The Captain's Key. Create a polished, memorable GOLD WINGED KEY emblem, centered and large, on an opaque uniform very dark midnight navy background (#090f14). One bold upright antique key: circular open bow at the top, thick vertical shaft, two clear squared teeth at its lower right. A pair of symmetrical broad pilot-wings spread left and right from the upper key shaft, three simple stepped feathers per side. The key is unmistakably a key, the winged shape evokes a classic airline pilot's wings pin. Elegant warm brushed gold with restrained beveled highlights, clean silhouette, substantial negative space in the open key ring; rich premium game-art finish with subtle console-era aviation influence, not pixelated. Composition balanced inside a square, emblem fills approximately 84 percent of width and 84 percent of height, with sufficient dark margin for an app icon. Strong readable silhouette at 16x16 and 32x32 pixels: broad forms, simplified feathers, no hairline details. This is the finished artwork only. No text, letters, words, lettering, numbers, logo captions, frame, mockup, website interface, watermark, photograph background, aircraft cockpit, people, vehicles, Tesla, spaceships, or reward spoilers. Do not add any object beyond the single winged key emblem.

## Validation

Source and derivatives decode successfully with the dimensions and hashes above. The original was inspected after generation. Responsive browser captures, native Begin sound-start verification and favicon request checks are recorded in plan 0078 and TEST_REPORT.md as they complete.
