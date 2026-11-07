# Mobile cockpit review

Authority: the owner reported cockpit obstruction and selected compact touch controls below the cockpit with instructions behind Help. The first actual 375×812 DC9 screenshot is `before-dc9-375.png`; the final is `dc9-control-check-375.png`. A labelled before/after comparison is displayed in the existing owned tmux pane.

## Inspected comparison points

1. **Cockpit visibility:** the old 471px overlay covered 58% of the phone canvas. The final DC9 control check renders the actual canvas at 375×522, ending exactly where the native tray begins. Scan/departure/flight reserve their stage-specific height.
2. **Touch controls:** current-axis DC9 buttons are at least 48px. A320 hold groups use non-overlapping hit areas; thrust labels fit their group. Utility/Help actions are at least 44px. Real phone taps place SIDESTICK on its projected 3D target; the resulting 1/5 capture is retained.
3. **Feedback:** first/second-miss scan messages, shutdown wrong-order coaching, departure corrective/live cue and A320 workload hints remain readable. The 1995 Memphis label remains visible.
4. **Help and focus:** the native modal has a named Close control, high contrast, explicit Tab wrapping, Escape restoration and inert background. Crossing responsive breakpoints cannot reopen stale Help. Flight Help pauses for explicit Resume.
5. **Landscape:** 667×375 and 932×430 keep compact controls, live route/required task actions and safe Retry reachable; longer secondary details scroll within their own shelf. This is an intentional layout adaptation, preserving the full text.
6. **Tablet/desktop:** 768px and 1024px touch layouts retain the tray; 1440×900 retains the original desktop presentation. Canvas coordinates still drive real projected targets. Camera poses, model files and materials are unchanged.
7. **Art/copy:** actual runtime DC9/A320 models and native controls are used; no mock image replaces UI. The approved entry art/fonts/icons/copy are unchanged. New mobile instructions describe required touch actions.

Actual DC9, scan, departure, A320 qualification, Storm Line and Engine-Out phone screenshots were inspected, together with critical landscape views. Selected tablet/desktop captures are also retained. No-cache runtime GLB byte/hash comparisons match disk. Source fingerprint, measurements and browser error receipt accompany the captures.

Validation: 29 broad production browser cases, 15 final mobile/layout/axe cases and 2 last spacing cases pass; overlapping cases are not summed. All 1,060 unit tests, lint/types/build, asset/privacy/spoiler/budget gates pass. The final four flight images were refreshed from the published-source production build. No runtime/console errors were captured.

Remaining owner step: playtest the protected Vercel preview on a physical phone. Chromium emulates touch; Safari/Firefox and physical-device behavior have not been verified. This is a preview milestone, with no production merge/promotion.
