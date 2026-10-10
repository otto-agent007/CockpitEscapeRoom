# Arcade game controllers for two players

Goal: two people can fight each other in the dev Mars arcade (`/dev/arcade.html`), each on a game controller, or one on a controller and one on the keyboard. The owner asked on 2026-10-10: "make sure the arcade is 2 player and I can plug in my bluetooth controller to play it". No production dependency, nothing in the production bundle, no change to fight rules or tuning.

Context: two-player play already worked on one keyboard. P1 uses WASD + J/K/L, P2 uses the arrows + , . /, and T toggles P2 between CPU and human. There was no Gamepad API support. The workstation has no Bluetooth adapter: `/sys/class/bluetooth` is absent, and `bluetooth.service` is skipped on that condition. A Bluetooth controller therefore has to be plugged in by USB, or the PC needs a Bluetooth dongle. The browser sees a USB controller and a Bluetooth controller the same way, so the code does not care which.

Design decisions:
- **A controller presses its player's keys.** Each frame, the controller is read into the same key codes as that player's keyboard bindings. Taps, holds, pause-and-step and Sam's forward, down, down-forward + Heavy motion therefore behave exactly as on the keyboard, and reuse the code that already handles them.
- **Button layout:** the W3C standard mapping.
  - d-pad or left stick (half-travel deadzone): move, jump on up, down for the motion.
  - South face button (A / ✕): jump.
  - West (X / □): light. North (Y / △): heavy. East (B / ○): special.
  - Start: pause. Back: restart round.
  - A non-standard layout keeps only the stick and the four face buttons. The status line flags it.
- **Seating:**
  - The first controller takes P1 and the second takes P2. A controller keeps its seat until it disconnects, so a flat P1 battery never hands P1 to the P2 controller. A third controller waits.
  - "Swap controller sides" moves a lone controller to P2, or makes two controllers trade.
  - Any press on the P2 controller takes P2 from the CPU. Free play keeps P2 human while a controller sits there.
- **Status:** `#pad-status` (role status) names each seated controller and how to connect one.

Files: `src/dev/arcadeHarnessGamepad.ts` and its test (new), `src/dev/arcadeHarness.ts`, `dev/arcade.html`, `tools/dev/arcadeControllerProof.cjs` (new browser proof).

Progress: done. Pure mapping, seating and status are in the new module. The harness polls the controllers at the top of each frame and feeds them into the sampled input and the motion history.

Validation (2026-10-10):
- Unit tests: 15 new tests in `arcadeHarnessGamepad.test.ts`. `npm run check` passes: lint, types, 984 tests in 89 files, and the build. The spoiler, privacy and asset-budget guards pass. No controller code appears in `dist`.
- Browser proof: `tools/dev/arcadeControllerProof.cjs` drives fake controllers through `navigator.getGamepads` on a dev server; 24/24 pass.
  - Seating and status text.
  - d-pad and stick walking.
  - Captain jab, heavy and flyby from X, Y and B.
  - The second controller takes P2 from the CPU, and both controllers move in the same frames.
  - Start pauses and resumes from either controller; Back restarts.
  - Swap, and a P1 disconnect that leaves P2 seated.
  - Keyboard P1 alongside controller P2.
  - Sam's Pivot from the stick motion: 60 meter spent, the announcement shown, 50 meter stolen.
  - No overflow at 375, 768 and 1440 px, and no page or console errors.

Limitations: no physical controller was connected during this work, so the real-device check is still the owner's. The face-button positions for a non-standard layout are a best guess.
