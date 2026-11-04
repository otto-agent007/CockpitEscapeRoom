"""Render the caption-backed Roboptimus line with the existing local Heart voice.

Use the prior voice project's Python environment (kokoro_onnx + soundfile).
Model/voice-bank files are read in place and never included in the game.
"""
import argparse
import ast
import hashlib
import json
from pathlib import Path
import re
import subprocess

import onnxruntime
onnxruntime.disable_telemetry_events()
from kokoro_onnx import Kokoro
import soundfile

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument("--model", type=Path, required=True)
parser.add_argument("--voices", type=Path, required=True)
args = parser.parse_args()
source = (ROOT / "src/game/optimusGreeting.ts").read_text()
text = ast.literal_eval(re.search(r"^export const OPTIMUS_GREETING_TEXT = (.+)$", source, re.M)[1])
audio_file = ast.literal_eval(re.search(r"^export const OPTIMUS_GREETING_AUDIO_FILE = (.+)$", source, re.M)[1])
cache = ROOT / ".cache/assets/roboptimus-audio"
cache.mkdir(parents=True, exist_ok=True)
wav = cache / "roboptimus-greeting-heart.wav"
output = ROOT / "public" / audio_file
output.parent.mkdir(parents=True, exist_ok=True)
voice = Kokoro(str(args.model), str(args.voices))
samples, rate = voice.create(text, voice="af_heart", speed=0.96, lang="en-us")
soundfile.write(wav, samples, rate)
subprocess.run([
    "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
    "-ar", "24000", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "96k", str(output),
], check=True)
report = {
    "text": text, "voice": "af_heart", "speed": 0.96, "sampleRate": rate,
    "durationWav": len(samples) / rate,
    "output": str(output.relative_to(ROOT)), "byteLength": output.stat().st_size,
    "sha256": hashlib.sha256(output.read_bytes()).hexdigest(),
    "model": str(args.model), "voices": str(args.voices),
}
(cache / "build-report.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report))
