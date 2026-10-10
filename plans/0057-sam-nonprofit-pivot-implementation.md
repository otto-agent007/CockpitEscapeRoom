# Sam Non-Profit Pivot Implementation Plan

> Execute inline with superpowers:executing-plans. User approved the design and requested execution: “looks good lets get it done.” No commits or publication.

**Goal:** A complete playable Non-Profit Pivot candidate appears in the review gym/arcade with correct art, inputs, capture/reversal, guard bypass, meter theft and conditional timed damage.

**Architecture:** Keep the existing Oracle special as default and add an explicitly enabled dev-preview move. Pure combat state owns capture/placement/meter/status; input history owns motion recognition; the existing animation table owns poses/holds/boxes. Presentation draws dialogue, halo, stamp and status from actual state/events. New candidate source/boxes remain unreviewed until owner visual signoff.

**Tech stack:** Existing TypeScript/Vitest, Vite dev harness, builtin imagegen, Python normalization/gates, Playwright. No dependencies or paid APIs.

**Spec:** plans/0056-sam-nonprofit-pivot-spec.md (approved for prototype execution; final art/box review remains).

## Constraints and rulings

- Preserve all current Captain/Booster/Oracle clips, tuning, owner unsaved gym tab and recovery artifacts. Work in existing isolated animation-workflow branch; separate review server5362.
- Prototype values:60cost,60px grounded capture at tick24;18captured ticks; strike at42..44;21recovery,66total;18damage/36tagged;50% pre-impact meter transfer; tagged DoT1HP/60ticks for180ticks, refresh/no stacking. Booster/Oracle tagged, Captain untagged.
- Motion forward/down/down-forward+Heavy within18ticks, facing relative. Keep L/nativeSpecial. Down is a motion input, not a new crouch. Keyboard S becomes down only when P1Oracle preview is enabled; speed native button still works. Other fighters' inputs remain intact.
- Reversal uses a captured target and safe stage coordinates, not art travel. Abort capture and release defender on interruption/terminal state. Freeze capture/status clocks through pause/hitstop; no stale state on reset/reload.
- Preview is opt-in and reload-safe through a named review URL. Default game remains TextBubble. New moves must be known to table validation without requiring activation.
- Author6Sam poses (2awe/point,slide/drawpen,strike,retract,settle) plus distraction poses for opponents. Locked scale13.60576923076923 for Sam, existing roster scales for opponents; no hand-painted cells or relaxed gates. Preserve source outputs and bounded3repair attempts per failed cell.
- If an atlas has smaller output panels, restore its nominal reference-canvas resolution uniformly before locked-scale normalization; record the canvas ratio, never derive scale separately from a pose.

## Tasks

- [x] Task1: generate/normalize/gate/wire first Sam art draft and show in gym/tmux. Then complete6poses and opponent distraction art; preserve originals and snapshots.
- [x] Task2: RED tests for real capture/hit/miss/jump/interruption, mirrored stage edges, guard bypass, exact50% transfer, critical tags, DoT ticks/refresh/KO and clone/reset. Implement optional move registry/preview and pure rules; GREEN targeted/nearby tests. Expected: existing default rules/roster tests still pass.
- [x] Task3: RED tests for both-facing motion inputs, window expiry/reset, heavy fallback, blur/paused behavior and accessible equivalents. Implement bounded history and preview setup; GREEN tests.
- [x] Task4: wire actual candidate phase holds24+18/3/21, physical strike boxes, shared captured sprite/rules selection and presentation dialogue/halo/stamp/marker. Prove visible gym playback and real combat, both sides/reduced/missing assets/reload/reset/375,768,1440.
- [x] Task5: relevant validator/cell gates/audits, lint/types/tests/build; one fresh scoped code review, fix critical/high findings; record reports/TEST_REPORT; save hash-verified recovery with clean reopen; show actual final candidate and obtain owner art/box review.

## Progress and evidence

### Pen strike readability (owner requested)

Owner requests “the pen poke have a couple extra frames because it's too quick to see.” Keep exactly42startup/3active/21recovery, damage/cost/theft/status and all PNGs unchanged. Show the same pen-strike drawing for two additional3tick follow-through entries (45..50), with its existing approved body/hurt boxes and no attack box, then retract5ticks instead of11, settle10. Total remains66. This is the requested hold change, not new active frames. Preserve before rows, prove visible follow-through and absence of recovery attack boxes on both sides/reduced motion, and show updated gym/tmux. Named gym link should select the canonical adopted special rather than its retained pre-adoption candidate.

### Regular arcade adoption (owner authorized)

Owner now requests “ok incorporate it so i can play it in the arcade,” accepting the shown candidate for regular local arcade integration. Apply that authorization to the exact shown six Sam poses and three capture poses/boxes; preserve all originals. No production cabinet or publication.

Done when: ordinary /dev/arcade.html equips Sam with Pivot without a query or temporary browser mutation; L/native Special and mirrored motion work, authored clips load after reload, hit/theft/status remain approved values, recorded exchange retains Text Bubble, and tuning Save keeps other edits without corrupting retained legacy special. Keep optional named practice URL compatible. Save before tables and acceptance/source hashes; run focused RED/GREEN, main/review checks, normal-URL browser proof and recovery reopen. Runtime activation belongs to the existing dev harness, leaving production rules content and its saved tuning unchanged.

Implementation: main canonical oracle:special plus three distracted clips; regular harness enables existing dev move switch, named query only controls practice setup; new rounds restore regular mode, recorded exchange temporarily selects legacy mode. A shared pure tuning projection preserves the hidden retained special slot on apply/save while the approved Pivot fields are read-only. Owner Captain work/drafts and unrelated code remain intact.

2026-10-06: inspected current main/review tables, existing Sam source and input/engine/presentation interfaces. Captain frame5 accepted and saved separately. Prototype work starting; no Sam art/rules changed yet.

2026-10-06 completed implementation: all nine selected cells gated;6pose gameplay clip plus3distraction clips wired to review with owner flags false. Rules14 and motion6 tests plus broader suites pass. Main full check949/83; review962/85. Four mirrored/reduced native runs prove all66ticks/sixpaintedposes/theft/3DoTpulses; all3NPCs, layouts375/768/1440, gym/query/default/reset/reload, six native edge cases and existing gym/playground regressions pass. Target dying immediately before strike regression failed then fixed (no postmortem theft); ready slide leg hurt width34 removes new silhouette warning. Manifest contract now checks registered fighter-owned moves; default TextBubble stays. Screenshot review fixed opening banner overlapping dialogue and moved lawsuit label belowfeet; final checks pass. Fresh scoped reviewer plus final deltas found no major issues. Report records exact unrun checks. Task5 technical verification done; recovery/reopen packaging in progress, owner art/box acceptance pending.

Recovery complete: checkpoint-20261006T224610Z,889hash-verified files/26159020bytes, SHA2563b89bf24080e20530d2589119955285b35e7be71575f7293a138b76840c628b8. Fresh restored main98andreview155sprites plus actual Samstrike/gym PASS, no errors. Only owner art/box acceptance remains.

### Owner-authorized regular arcade adoption

Owner: “ok incorporate it so i can play it in the arcade.” Accepted exact shown Sam6pose special and3opponent capture clips/boxes; canonical oracle:special and three distracted clips adopted in main and review with reviewedtrue. Main35clips114frames107drawings,review68clips229frames155drawings, validators0errors. Regular /dev/arcade.html now enablesPivot withoutquery; namedpracticeURL remainscompatible. Baked production TextBubble and tuning JSON unchanged. Recorded exchange selectslegacy; allmanualhandoffs startfreshregularround to avoid reinterpreting an in-flight legacyattack. Owner otherart, Captain data, oldcandidate/rawPNGbytes preserved. Pure tuning projection keeps retained special slot on apply/save/reset while other tuning edits work.

Observed normalURL REDoldTextBubble; tuninghelper RED thenGREEN2; reviewer handoffRED thenfixed. Final main npmruncheck lint/types/951tests84files/buildPASS;review964tests86files/buildPASS. Four normalURL native/motion mirrored/reduced browsercontextsPASS:6actualSam sources,capture,36damage,50meter theft,correctrefund, lawsuit,saveoutgoingpayload interceptionwithoutdiskwrite,legacyrecording/T handoff/freeplay/reload;375/768/1440nooverflow/errors. Reviewer final no remainingimportantfindings. Evidence regular-adoption/. Prior fullmove engine/edge/art proofs cover unchangedapprovedrules/PNGbytes. No productioncabinet/deployment/commit; Captain remaininggoal separate.

Sam regular adoption recovery complete: checkpoint20261007T013736Z,934hashverifiedfiles/27904167bytes,SHA25631aaffc7e9ff525dac4a2da078b798301619f4901f5c137bd08c17067a397e4c. Freshmain107/review155sprites + actualnormalURLspecial/gym PASS. Owner reported no damage; preserved actual KOlog showing9hardCutoffheavyhits11damage and finishinglight4. Fresh existing headedmain demonstrably activates nativeSpecial:100→64HP,100→50victimmeter,Sam100→90meter, Lawsuit180frames; no engine/tuning mutation. Screenshot shown in tmux; roundresumed afterward. HeavyK alone remains normalheavy; useL/nativeSpecial or fullmotion and have60meter/groundedwithin60px. No damage-code change warranted by observed evidence.

### Owner-requested pen-poke follow-through

Added2extra3tick recovery entries (pen-contact-hold and pen-follow-through) reusing exact strikePNG/body/hurt boxes, noattackboxes. Poke now visible9simulationticks+3hitstopticks ≈0.2sec instead of3+3≈0.1sec. Retract11→5,settle10; total42/3/21=66,damage/cost/theft/status unchanged. Only main/review canonicaloracle:special changes; allotherclips and oldreviewcandidate exact. Gympracticequerynowpreferscanonicaladoptedspecial. Fullmaincheck957tests85files and review970tests87files/lint/types/build PASS; validators0errors. Native4mirrored/reduced contexts:actualstrikePNG frames42..50,6recoveryticks, single36damagehit andmetertransfer, reload8holds[12,12,18,3,3,3,5,10]PASS;maingym5360/reviewgym5362correctcanonical/follow-throughwithoutattack PASS. RED4failures beforeholdchange thenGREEN6newtests+14coretests. Freshscopedreview no importantfindings; all9PNGhashes preserved. Evidence pen-follow-through/. No newpainted/generatedassets,combattiming orproductiontuning changes.

Penfollow-through recovery saved:34file overlay checkpoint20261007T021048Z,SHA25689ef9358af2b0743aac4a2b571bd8cf3a66e1f3a59724c0ec36d76068548d72a, basedonfullSam013736Z/31aaffc7e9ff525dac4a2da078b798301619f4901f5c137bd08c17067a397e4c. Freshrestorednormalmain107/review155sprites, actual36damage/50theft,8holdsandcanonicalgymreopen PASS,noerrors. SourcePNGsglobalhashesunchanged; updateshownintmux and existingmainarcadeleftSamP1/Boosterhuman/fullmeter/within60px/unpaused.

### One-second pen pose (owner requested)

Owner rejects0.2sec and asks “about a second.” Make extendedpen60simulationticks (42..101 inclusive):3active+28contacthold+29followthrough; ~1sec at1x,1.05sec with3tick hitstop onconnect. Recovery becomes72 (57hold+5retract+10settle),total117=1.95sec. This intentionally lengthens Sam recovery; damage18/36,cost60,exacttheft50%,lawsuit andstartup42/active3 unchanged. Old shortprototype has separately registered idoracle.nonProfitPivotShort with recovery21 so its art/timing remains preserved/valid, never equipped in regularplay. Tests now use actual registered live content rather than hardcoded short move. RED4failthenGREEN20focusedtests. Prove60actualpaintedticks/no recoveryattack, singlehit/theft/DOT, bothsides/reduced/reload;fullchecks,review,saveandshowtmux. No newPNG/generation.

### Owner-requested one-second pen pose

Owner says0.2secnotlongenough and asks about1sec. Pen extended60simulationticks (42..101):3active+57nonattackingfollowthrough28/29;1sec at1x,1.05secwith3tickhitstop. Recovery72including5retract/10settle, total117ticks1.95sec; explicitly longerSamrecovery. Damage18/36,cost60,half-meterseizure,lawsuit180ticks,startup42,active3unchanged. AllPNGbytesunchanged. Retainedshortprototype boundto separatelyregistered oracle.nonProfitPivotShort/21recovery,oldart/holds/boxes preserved; regularplay equipslongmoveonly. Coretestsnowuseactualregisteredlivecontent,waitactualrecoverybeforesecondcastandprovefinishedwhiffs. Focused20testsPASS;fullmain957tests85files/review970tests87filespluslint/types/buildPASS;bothvalidators0errors. Fouractualnativebothside/reducedcontextsprove60paintedextendedticks,57nonattackingrecoveryticks,single36damagehit/half-metertransfer/1lawsuitpulsebyend,reloadholds[12,12,18,3,28,29,5,10];normal/reviewgymhold29noattack/canonicalselectionPASS,noerrors. Evidence pen-one-second/. No newrasterart orchangedotherfightertuning.

One-second pen timing final review: no importantfindings; scopedotherrows/boxes/source refs exact, retainedshortcandidate onlyIDchange.31file recoveryoverlay checkpoint20261007T035609Z SHA256f520f4fca13b1910d9169010305efd6ee6ed90267bd52f1b0a19ef06b9d51628, basedon021048Z andfull013736Z. Alloverlayhashes/basearchive verified; freshnormalmain107/review155sprite play/gym+117timing+single36hit/theft/DOT PASS,noerrors. SourcePNG/tuning unchanged. ExistingarcadeleftSamP1/fullmeter/close/unpaused;tmuxshowslongfollowthrough.

### Reading pause (owner requested)

User asks more pause/time to read and slowermove. Add120captured stationaryticks after originalcapture24;slide18 starts144, strike162. New42lessold startup162/active3/recovery72,total237=3.95sec. Canonicalholds[12,132,18,3,28,29,5,10]; no newart/boxes. Speech lasts270simticks=4.5sec. One-secondpen60ticks stays. Capture/escape window24 remains, targetdistracted immobile whileannouncementheld; damage/cost/theft/statusunchanged. Sharedcontent timingobject drivescapture/slide, slideprogress usesactualregisteredstartup−18 so retainedshortprototype remains42/3/21 and66valid. Accessiblecapturedstatus namesannouncementduringhold, reversalduringslide. RED2movement+1speech failures thenGREEN23focused. Prove120stationarypaintedreading ticks/no earlydamage/textvisibility,60pen ticks/singlehit onbothsides/reduced plusreload/gym,fullchecks/review/save. Longer capture is the intentional owner pacing change; Sam can still be interrupted andlawsuit clocks keep simtime.

### Longer reading pause

Owner requests pause/time toread andslowermove. Added120capturedstationaryticks afteroriginalwindup24;slide18starts144,strike162;162/3/72=237ticks3.95sec. Speech270simulationticks=4.5sec. Canonicalholds[12,132,18,3,28,29,5,10];pen60ticks/1sec remains. Accessiblecapturedstatusaccuratelynamesannouncementuntilslide. Capture/escapewindow24 unchanged, targetimmobilewhilereading. Damage/cost/theft/lawsuit and allPNG/boxes unchanged. Shortprototypeexplicit42startup/21recovery stays66valid;slideprogressderivesactualregisteredstartup−18. PureREDreading2+speech1thenGREEN23focusedtests. Mainfullcheck960tests86files and review973tests88files/lint/types/buildPASS;validators0errors. Fouractualnativebothside/reducedcontextsprove120stationaryreadingticks withcorrectawePNG/visiblequote/targethealth100,60penpaintticks,singlehit/theft/status/reload/gymPASS;announcementexpiresafter270;noerrors. Scopedreviewnoimportantfindings. Evidence reading-pause/. Existinglayout/assetgeometryunchanged;no newimagegeneration orotherfightertuning. Longer capture andtotalpacing are owner-requested;captureinterruptions/status clocks remainrules-driven.

Readingpause recovery:43file overlay checkpoint20261007T044148Z,SHA256b3b5f3b38bd3fcb89bc470a0dd4ffbedee32cb02de03bb07bdb568a74097941a, basedon035609Z→021048Z→full013736Z. Base/overlayhashesandfreshnormalmain107/review155play/gym/holds237/singlehit/theft/statusreopenPASS,noerrors. Tmuxreadingholdshowscorrectquote/halo; existingmainarcadeSamP1/fullmeter/closerange/unpausedready. No newcodechangesaftervalidation.

Owner final pacing acceptance: “I like it.” Keep current2secondcapturedreadingpause/4.5secondannouncement/1secondpenpose,162/3/72=237. Acceptance tied to exact canonicalrow/tablehash and verified recovery in reading-pause/owner-pacing-acceptance.json. No code/art/tuning changed; prior passing checks remain applicable. Separate Captain goal/gates unchanged.

## Booster look-away wardrobe correction

Goal: Sam special keeps Elon current charcoal trousers and black shoes. Context/root cause: canonical look-up was generated from obsolete wardrobe. Constraints: preserve old source, current idle, accepted Sam move/timing/damage and reduced-motion; local unadopted candidate only until art and boxes sign-off. Done when: candidate gate/audit, actual PNG playback both sides, owner visual/box decision, bounded adoption and verified recovery.

Owner feedback: Elon pants/shoes revert to old look during Sam special. Confirmed canonical booster:distracted PNG has olive trousers and brown footwear, mismatching sleek current idle. Imagegen produced a new look-up using current idle as wardrobe authority. Uniform whole-source resolution conversion follows existing single-pose workflow; locked14.038461538461538 normalization unchanged, feet alignment/bilinear. 128RGBA, height104, baseline119; full-color gate and sequence audit pass. New booster:distracted-candidate is unreviewed, selectable in gym and reversible arcade override. Canonical old pose untouched. Neutral18, three hurt regions, collision49x103; no attack. Art and boxes await owner sign-off via shown tmux contact sheet/gym.

HUD complete and saved separately: main961/review974 full checks, browser/motion/responsive/Sam timing proofs. Recovery overlay checkpoint20261007T063759Z SHA256342e344139f1f5bf50ce52ac58749fbdcfe5b5da79b31c8e6bff32f51a3a0afe;69hash-verifiedfiles, fresh main/review normal arcade and gym reopen pass.

Wardrobe candidate validation: rules/silhouette0errors,11knownunreviewedwarnings;23focused sprite/Pivot/contract tests pass. Original art and data preserved. No owner acceptance inferred from gate or pane. Final adoption remains pending.

Candidate recovery verified:30files, archive SHA2563e4e0ff6cca2f185f85a70aba14f274300a1e830b5d11d302d916f82fc35ec1f; fresh main108/review156sprite startup, reversible corrected clothing override, same singlehit/theft/timing, gym reopen, no browser errors. Canonical old distraction is unchanged and new candidate remains unreviewed pending owner. Proof: /mnt/2TBHDD/CockpitEscapeRoom/.worktrees/animation-workflow/preview-renders/mars-arcade/booster-pivot-wardrobe-2026-10-06/checkpoint-20261007T064530Z/fresh-reopen-proof.json.

Owner approved corrected look-away art and shown boxes: "yes whats next?" Canonical booster:distracted now uses the exact accepted charcoal/black PNG and three shown hurt regions, reviewedtrue. Neutralhold18/noattack unchanged. Old distraction retained as distracted-legacy-wardrobe, disabled in normal play. Accepted candidate also retained. Only these Booster rows changed; all other main/review rows exact. Actual default playback, candidate checkbox OFF, both sides:120correctedreadingPNGticks,60penhold,36damage/singlehit/theft PASS.23focusedtests and validator0errors/10unreviewedwarnings PASS. No Sam tuning/timing changes.

Approved wardrobe recovery verified: archive booster-wardrobe-adopted.tar.gz, SHA2569c5c23929f1dedfe6c6f04216acb4f0f169aeae67f7ca4d5b5bde4a8ddbe8f22; extracted overlay hashes and parent archive verified, fresh main108/review156sprites normal default-play/gym reopen PASS, no errors. Tmux now shows actual adopted reading pose; approval receipt preserved.
