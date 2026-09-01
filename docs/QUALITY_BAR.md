# Quality, accessibility, and performance bar

## Functional

- Every required phase has correct path, wrong path recovery, repeated wrong-path recovery, and progressive hints.
- Completed puzzles are never erased by an ordinary mistake.
- Reload resumes safely.
- Corrupt and outdated saves recover without a blank screen.
- Restart requires confirmation and can be canceled.
- Final reward reveal does not run twice accidentally.
- Model Y must remain hidden until after Captain Mode is complete.
- Memphis mistakes and explicit retry restore only the latest departure checkpoint; earlier Final Flight Log progress remains intact.
- A Memphis environment load failure preserves the complete native guidance and control path.

## Accessibility

- Every required 3D action has a native HTML equivalent.
- Controls have visible focus and accessible names.
- Focus order follows the visual task order.
- Puzzle status is announced through an ARIA live region.
- Color is never the only status signal.
- Touch targets are comfortably sized.
- Continuous cockpit inputs have keyboard, gamepad where supported, and native hold-button equivalents with the same normalized rules.
- Reduced-motion users receive equivalent state changes without unnecessary camera or launch animation.
- The cinematic exposes sound retry and volume; milestone and simulator audio expose persistent sound toggles appropriate to their scope. Audio failure never blocks play.

## Visual

Check approximately 375, 768, and 1440 CSS pixels wide. Look for clipping, overlap, unreadable contrast, hidden controls, tiny type, motion sickness, unexpected scrolling, and cockpit or outside scenery that blocks the puzzle UI. Fixed seat-role screenshots must also prove the DC-9 right seat, Memphis windshield memory, Airbus left seat, and spoiler-safe reward framing when those surfaces change.

## Performance

- Lazy-load 3D and bonus assets.
- Keep the Memphis environment separate from the DC-9 cockpit so it can preload, fail, retry, and dispose independently.
- Profile on an ordinary laptop and a representative phone.
- Record GLB size, texture memory, draw calls, material count, and sustained frame rate at each visual gate.
- Prefer baked detail and compressed textures only after confirming the appearance and preserving interaction contracts.
- Avoid continuous animation when nothing changes.

## Review severity

Critical or high-severity findings block a milestone. Medium findings require a documented decision. Low findings may be scheduled, but the final Father’s Day build should have no visible debug copy, broken placeholder behavior, or unresolved TODO that affects play.
