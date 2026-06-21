# Quality, accessibility, and performance bar

## Functional

- Every required puzzle has a correct path, wrong path, repeated-wrong path, and progressive hints.
- Completed puzzles are never erased by an ordinary mistake.
- Reload resumes safely.
- Corrupt and outdated saves recover without a blank screen.
- Restart requires confirmation and can be canceled.
- Final reveals cannot run twice accidentally.

## Accessibility

- Every required 3D action has a native HTML equivalent.
- Controls have visible focus and accessible names.
- Focus order follows the visual task order.
- Puzzle status is announced through an ARIA live region.
- Color is never the only status signal.
- Touch targets are comfortably sized.
- Reduced-motion users receive equivalent state changes without unnecessary camera or launch animation.
- Audio has mute and volume controls before production sound is added.

## Visual

Check approximately 375, 768, and 1440 CSS pixels wide. Look for clipping, overlap, unreadable contrast, hidden controls, tiny type, motion sickness, unexpected scrolling, and cockpit detail that blocks the puzzle UI.

## Performance

- Lazy-load 3D and bonus assets.
- Profile on an ordinary laptop and a representative phone.
- Record GLB size, texture memory, draw calls, material count, and sustained frame rate at each visual gate.
- Prefer baked detail and compressed textures only after confirming the appearance and preserving interaction contracts.
- Avoid continuous animation when nothing changes.

## Review severity

Critical or high-severity findings block a milestone. Medium findings require a documented decision. Low findings may be scheduled, but the final Father’s Day build should have no visible debug copy, broken placeholder behavior, or unresolved TODO that affects play.
