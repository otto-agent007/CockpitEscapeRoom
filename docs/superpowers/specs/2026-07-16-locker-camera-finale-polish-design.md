# Locker Camera Finale Polish Design

## Goal

Make the locker opening finish on the owner-selected three-quarter watch view, then make the completed locker celebrate the real captain's hat in 3D before the existing popup and confetti appear. Replace the first Wings retry hint with practical numerical guidance.

## Context

- Visual reference: `/home/user1/Pictures/Screenshots/Screenshot from 2026-07-16 01-02-55.png`.
- The current `watch-focus` pose shares the same straight-on offset as Baseball, Charging Bull, and Wings. The reference instead shows a slight rightward pan during the watch zoom, with the watch near the center of the right locker bay and more of the bench extending to the left.
- Completing the Wings question currently reveals the hat and immediately mounts `CaptainHatCelebration`, whose normal-motion presentation includes 24 animated confetti pieces.
- The current first Wings retry says, “Not quite. Think of the Part 121 experience milestone commonly associated with a captain upgrade.” This assumes regulatory vocabulary instead of helping the player reason toward the answer.

## Player Sequence

### Locker opening

The existing wide reveal remains unchanged. Its final zoom uses a dedicated `watch-focus` camera pose rather than the shared memory offset. The camera moves slightly to the right while zooming so the settled frame matches the owner screenshot's three-quarter composition. The watch remains the first available interaction after the camera settles.

### Captain's hat finale

Submitting the correct Wings answer reveals the real hat in the locker but does not mount the popup yet. The HUD and locker interactions become inactive while the camera moves from the Wings to a new close `hat-focus` pose. After the camera reports that the hat pose has settled, the unobstructed 3D close-up remains visible for exactly 2,000 milliseconds. The existing Captain's Hat popup then appears with its current image, copy, button, and 24-piece confetti field.

On reload after the hat has already been revealed, the existing persisted completion remains authoritative and the popup may reopen immediately; the two-second cinematic is not replayed accidentally. If the 3D locker is unavailable and the player uses the accessible fallback, the app skips the unavailable camera beat and opens the accessible popup directly.

### Reduced motion

The app continues honoring the operating system or browser `prefers-reduced-motion` setting. In that mode, the camera snaps to the hat pose rather than animating, holds the settled hat view for the same two seconds, and opens the popup without animated confetti. Normal motion always retains the existing confetti celebration.

### Wings hints

The correct answer and accepted variants remain `1,000 hours`. The progressive retry copy becomes:

1. First miss: “Think in flight hours: it’s a round-number milestone between 500 and 1,500.”
2. Second and later misses: “It’s a four-digit milestone below the 1,500-hour ATP requirement.”

Wrong answers continue preserving every completed locker memory.

## Architecture

- `src/scenes/PrototypeScene.tsx` owns the deterministic `watch-focus` and new `hat-focus` camera poses. The watch pose is independently calibrated; other memory poses keep their current shared offset.
- `src/App.tsx` owns the transient finale sequence: request hat focus, wait for the camera-settled callback, hold for two seconds, then allow the persisted hat state to mount `CaptainHatCelebration`.
- `src/game/config.ts` owns the revised Wings retry copy. The reducer remains the authority for attempts, accepted answers, completed memories, and the revealed-hat save state.
- No Blender source, generated GLB, celebration image, schema version, production dependency, or aircraft content changes are required.

## Constraints

- Preserve the locker asset, prop hierarchy, stable `game_id` contracts, and existing memory order.
- Preserve the normal-motion hat popup and confetti.
- Keep game rules and persisted completion in `src/game`; keep 3D camera presentation in `src/scenes`.
- Keep the accessible fallback, keyboard focus, reload/resume behavior, and safe wrong-answer progression.
- Preserve unrelated DC-9, Airbus, Model Y, asset-pipeline, and mixed-worktree changes.

## Validation

- Add a failing focused test for the practical first and repeated Wings hints before changing the copy.
- Add failing browser assertions that the real 3D flow reaches `hat-focus`, reports `settled`, remains free of the popup for two seconds after settling, and only then shows the popup and normal confetti.
- Assert that reduced motion snaps to `hat-focus`, preserves the two-second hold, and continues omitting animated confetti.
- Assert that reload after persisted hat completion opens the popup without replaying the cinematic and that the accessible fallback remains usable.
- Run focused state and locker browser tests, then `npm run check`, `npm run assets:check`, and `git diff --check`.
- Inspect actual-browser captures near 1440, 768, and 375 CSS pixels, including the screenshot-matched watch endpoint, settled hat close-up before the popup, and final confetti popup.
- Review the complete diff and update the active locker ExecPlan plus `TEST_REPORT.md` with commands actually run and visual evidence.

## Done When

- The opening watch endpoint visibly matches the right-panned, three-quarter composition in the July 16 owner screenshot.
- The final locker sequence is Wings success -> hat reveal -> hat zoom -> settled two-second hold -> existing popup and confetti.
- Normal motion retains all existing confetti; reduced motion retains the existing no-animated-confetti accessibility behavior.
- The first and repeated Wings hints use the approved practical wording.
- Correct, wrong, repeated-wrong, reduced-motion, reload, accessible-fallback, keyboard, and responsive paths pass the relevant automated and browser checks.
- No locker GLB or unrelated worktree content is modified.
