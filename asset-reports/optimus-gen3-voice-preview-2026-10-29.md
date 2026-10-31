# Optimus congratulations voice preview — 2026-10-29

## Status

Local audio and motion **review candidate** for the post-Airbus handoff. No game code, runtime media, robot export or protected Tesla film was changed. Owner voice and motion approval remain open.

Follow-up on 2026-10-29: the owner selected Heart. Its matching MP3 and caption were integrated into the Airbus completion card; the runtime/browser evidence is in `asset-reports/optimus-heart-handoff-2026-10-29.md`. Robot appearance and motion approval remain open. The original preview status above describes the state when this report was first written.

## Voice source and rights

The voiceover project at `/mnt/2TBHDD/thermo-explainer-video/tts` holds `kokoro-v1.0.onnx` (325,532,387 bytes; SHA-256 `7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5`) and `voices-v1.0.bin` (28,214,398 bytes; SHA-256 `bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d`). That project's `samples.py` labels `af_heart` and `af_bella` as American female voices, and its README identifies Heart as the voice already used for its narrated video. The model and bank were used in place; neither was copied into this game or uploaded.

The [original Kokoro model card](https://huggingface.co/hexgrad/Kokoro-82M) lists Apache-2.0 for the model, and its [voice catalog](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md) lists `af_heart` and `af_bella`. The [kokoro-onnx release](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0) describes the local model and voice-bank file format. The prior project's original download receipt was not present, so these filenames and hashes are the available local provenance. The generated game clip can be shipped without bundling the model.

## Script and outputs

Draft text: **“Congratulations! You did it! Your pilot skills have earned you something special. Ready to see it?”** The vehicle stays unnamed until the reward action. Both voices were synthesized locally through the prior project's `env/bin/python`, `kokoro_onnx` and `soundfile` at speed 0.96, 24 kHz, mono. The raw WAVs and compact MP3 auditions are under `preview-renders/optimus-gen3-animation-intake/voice/`:

- Heart: `optimus-congratulations-af_heart.wav` / `.mp3`, 5.611 seconds; MP3 SHA-256 `596507e432e37eff0d2884399f2ff3b91ed8e42934fec9ef45fbb0b552f5ec1c`.
- Bella: `optimus-congratulations-af_bella.wav` / `.mp3`, 5.888 seconds; MP3 SHA-256 `54d63644e35ff1bf4bb14b057280dad82b19e15ca552da286a02668d8067bbb4`.

The Heart review clip `optimus-congratulations-heart-wave-review.mp4` (5.958 seconds, 720×840 H.264/AAC, SHA-256 `3084c200a65dfc8c47b5e8d75814fcb172df3412da5f3b74e2c4acb064748746`) pairs the voice with the earlier 16-frame PBR `wave_goodbye_02` sample and burned captions. A silence scan found pauses at 1.717–2.111 and 4.304–4.743 seconds; the caption changes are aligned to their ends. Its silent companion GIF is in the same folder and was shown in the owned tmux sidepane. Desktop `ffplay` completed the Heart WAV once with exit code 0. The GIF cannot carry audio; the MP4 is the combined review artifact.

A second, more representative motion diagnostic `optimus-congratulations-heart-greet-walk-review.mp4` (6.000 seconds, 720×840 H.264/AAC, SHA-256 `f2b1e40bccc212d04a5151a5d61a91f08e902ef4bf0452ebc9d93355d6fa822a`) uses 24 sampled Blender frames at 4 fps: `greet_01` for 3.5 seconds, then the in-place `walk` action with a small scene-controlled forward move. The reproducible source is `render-greet-walk-workbench.py`, and `greet-walk-motion-contact.png` shows five positions. This render is fast Workbench with flat source texture color. A separate Eevee/PBR first frame was inspected, but the 18–20 seconds per frame cost led to stopping the full PBR pass after three frames; its partial frames remain under `greet-walk-frames/`. The captioned GIF for this sequence replaced the wave GIF in the owned tmux pane, and desktop `ffplay` played its combined MP4 once with exit code 0. A decoded frame at 3.25 seconds shows the second caption below the robot.

## Limits and next step

The wave preview's 16 sampled motion frames and 5.33-second source do not prove continuous deformation or foot contact; its final frame is held to finish the audio. The greet-to-walk diagnostic samples 4 fps and has an unblended Action switch, so it establishes rough pacing only. Caption timing follows detected phrase pauses but was not manually checked against every spoken word. The final game needs owner voice and robot visual choice, a cleaned full-motion Blender export with continuous deformation and transition checks, native captions and playback controls, then browser/reduced-motion/spoiler validation. No production promotion is claimed here.
