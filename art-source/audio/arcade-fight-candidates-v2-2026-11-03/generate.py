"""Fighting-game audition v2: recorded contact, moving air, differentiated force.

Inputs are unmodified CC0 recordings, listed in sources.json. Python/NumPy and
the existing local ffmpeg render candidates only. Nothing is wired to combat.
"""
from pathlib import Path
import hashlib
import json
import math
import subprocess
import wave
import numpy as np

ROOT = Path(__file__).resolve().parent
RATE = 48000
RNG = np.random.default_rng(2026110302)
CACHE = {}
LABELS = {'jab': 'Punch / jab', 'heavy': 'Heavy punch', 'kick': 'Kick impact',
          'block': 'Guarded hit', 'whiff': 'Missed swing', 'break': 'Guard break',
          'down': 'Knockdown'}
SCHEDULE = [(0.10, 'round'), (1.60, 'fight'), (2.80, 'whiff'), (2.92, 'jab'),
            (3.30, 'jab'), (3.65, 'jab'), (4.10, 'heavy'), (4.95, 'kick'),
            (5.70, 'block'), (6.25, 'whiff'), (6.90, 'break'), (7.80, 'down'), (8.70, 'win')]


def source(group, name, speed=1):
    key = (group, name)
    if key not in CACHE:
        data = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(ROOT/'sources'/group/name),
                                        '-ac', '1', '-ar', str(RATE), '-f', 'f32le', 'pipe:1'])
        data = np.frombuffer(data, dtype='<f4').astype(np.float64)
        active = np.flatnonzero(np.abs(data) > max(np.max(np.abs(data)) * .012, .0003))
        assert len(active)
        data = data[max(0, active[0]-192):min(len(data), active[-1]+721)]
        CACHE[key] = data / max(np.max(np.abs(data)), 1e-9)
    data = CACHE[key]
    return np.interp(np.arange(0, len(data)-1, speed), np.arange(len(data)), data).copy()


def eq(data, low=25, high=12000, body=0):
    frequencies = np.fft.rfftfreq(len(data), 1/RATE)
    shape = (1-np.exp(-(frequencies/low)**4)) * np.exp(-(frequencies/high)**4)
    shape *= 1 + body * np.exp(-((frequencies-150)/160)**2)
    return np.fft.irfft(np.fft.rfft(data)*shape, n=len(data))


def fit(data, duration):
    result = np.zeros(round(duration*RATE))
    size = min(len(data), len(result))
    result[:size] = data[:size]
    fade = min(480, size//3)
    result[size-fade:size] *= np.linspace(1, 0, fade)
    return result


def mix(duration, *layers):
    result = np.zeros(round(duration*RATE))
    for at, gain, data in layers:
        start = round(at*RATE)
        size = min(len(data), len(result)-start)
        if size > 0:
            result[start:start+size] += gain*data[:size]
    return result


def finish(data, peak=.75, drive=1):
    data = data - np.mean(data)
    data = np.tanh(data*drive)
    data *= peak / max(np.max(np.abs(data)), 1e-9)
    fade = min(96, len(data)//3)
    data[:fade] *= np.linspace(0, 1, fade)
    data[-480:] *= np.linspace(1, 0, min(480, len(data)))
    return data


def punch(number, speed=1):
    return source('punches', f'hit{number:02d}.mp3.flac', speed)


def smack(number, speed=1):
    return source('thwack', f'thwack-{number:02d}.wav', speed)


def swish(number, speed=1):
    return source('swishes', f'swish-{number}.wav', speed)


def strikes(weight):
    speed = 1 if weight == 'snap' else .84
    body = .2 if weight == 'snap' else .85
    cues = {}
    cues['jab'] = [finish(mix(.25, (0, .9, eq(punch(n, 1.12*speed), body=body)),
                                      (.004, .24, fit(smack(2 if i%2 else 3, 1.08), .075))), .58, 1.1)
                   for i,n in enumerate([10,15,23])]
    cues['heavy'] = [finish(mix(.43, (0, 1, eq(punch(n, .97*speed), body=body+.4)),
                                         (.008, .3, fit(smack(1, .9), .14)),
                                         (.018, .32, eq(punch(37, .75*speed), high=430))), .80, 1.25)
                     for n in [9,24]]
    cues['kick'] = [finish(mix(.48, (0, .8, eq(punch(n, .84*speed), body=body+.5)),
                                        (.002, .7, fit(smack(10, 1.05*speed), .15)),
                                        (.025, .25, eq(punch(9, .7), high=380))), .78, 1.2)
                    for n in [31,37]]
    cues['block'] = [finish(mix(.23, (0, .8, eq(punch(n, 1.25*speed), high=2200)),
                                         (.001, .5, fit(smack(3, 1.4), .065))), .49)
                     for n in [15,23]]
    cues['whiff'] = [finish(fit(swish(1 if weight=='snap' else 7, speed), .24), .29)]
    cues['break'] = [finish(mix(.48, (0, .75, smack(6, .9)),
                                         (.018, .8, eq(punch(24, .78*speed), body=body+.4)),
                                         (.05, .3, eq(smack(10, .7), high=1300))), .8, 1.15)]
    cues['down'] = [finish(mix(.72, (0, .8, eq(punch(37, .63*speed), body=1.2)),
                                        (.10, .4, eq(punch(9, .75), high=1500)),
                                        (.22, .18, eq(smack(10, .8), high=800))), .8)]
    return cues


def air(duration, low=80, high=10000):
    return eq(RNG.uniform(-1,1,round(duration*RATE)), low, high)


def signatures():
    duration = .7
    t = np.arange(round(duration*RATE))/RATE
    phase = 2*np.pi*np.cumsum(2600*np.exp(-t*9)+90)/RATE
    laser = mix(duration, (0, .5, np.sin(phase + 2.5*np.sin(phase*1.07))*np.exp(-t*13)),
                              (0, 1.1, air(duration,1200,14000)*np.exp(-t*24)),
                              (.018,.65,fit(punch(24,.8),.3)))
    cap = mix(.66, (0,.6,swish(4,.8)), (.14,.45,swish(1,1.2)),
                    (.27,.35,swish(12,1.1)), (.38,.4,fit(smack(2,1.1),.13)))
    t = np.arange(round(1.8*RATE))/RATE
    sweep = np.sin(np.pi*t/1.8)**2
    frequencies = 130 - 75*(t/1.8)
    phase = np.cumsum(frequencies)*2*np.pi/RATE
    engines = sum(np.sin(phase*k) / (k**.8) for k in [1,2,3,5,7,11])
    flyby = (1.3*air(1.8,90,6000)+.35*engines)*sweep
    text = mix(.44, (0,.4,swish(12,1.15)), (.05,.35,swish(12,1.55)),
                     (.10,.3,swish(12,1.9)), (.16,.45,fit(smack(3,1.6),.08)),
                     (.185,.25,fit(punch(15,1.3),.17)))
    return {'laser': ('TECHNOKING · space laser',finish(laser,.74)),
            'caps': ('TEFLON DON · cap throw',finish(cap,.58)),
            'flyby': ('THE CAPTAIN · flyby',finish(flyby,.68)),
            'text': ('SCAM ALTMAN · text burst',finish(text,.55))}


def save(file, signal, label, sources):
    path = ROOT/file
    path.parent.mkdir(exist_ok=True,parents=True)
    assert np.all(np.isfinite(signal)) and np.max(np.abs(signal)) < .98
    with wave.open(str(path),'wb') as audio:
        audio.setnchannels(1); audio.setsampwidth(2); audio.setframerate(RATE)
        audio.writeframes(np.rint(signal*32767).astype('<i2').tobytes())
    return {'file':file,'label':label,'duration':len(signal)/RATE,
            'peakDbFS':round(20*math.log10(max(float(np.max(np.abs(signal))),1e-9)),2),
            'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
            'sources':sources}


voices = {key:finish(source('voice-oga',name),.58) for key,name in
          [('round','round_1.ogg'),('fight','fight.ogg'),('win','you_win.ogg'),('combo','combo.ogg')]}
manifest = {'status':'revision-2-awaiting-owner-audition', 'rate':RATE, 'channels':1, 'bits':16,
            'sets':[], 'signatures':{}, 'announcer':{},
            'timeline':[{'at':at,'cue':cue,'label':LABELS.get(cue, {'round':'Round one','fight':'Fight!','win':'You win!'}.get(cue))} for at,cue in SCHEDULE]}
for key,data in voices.items():
    manifest['announcer'][key] = save(f'common/{key}.wav',data,{'round':'Round one','fight':'Fight!','win':'You win!','combo':'Combo!'}[key],['voice-oga'])
for ident,name,description in [
    ('snap','Arcade snap','Fast, dry smacks. Crisp jabs, a sharp kick crack and clearly muffled blocks.'),
    ('weight','Heavy hitters','Deeper body hits, a fuller kick thud and a heavier floor landing.')]:
    cues = strikes(ident)
    record = {'id':ident,'name':name,'description':description,'cues':{}}
    for cue,variants in cues.items():
        record['cues'][cue] = [save(f'{ident}/{cue}-{i+1}.wav',data,LABELS[cue],['swishes'] if cue=='whiff' else ['punches','thwack']) for i,data in enumerate(variants)]
    demo = np.zeros(round(10.3*RATE))
    counts = {}
    for at,cue in SCHEDULE:
        if cue in voices: data=voices[cue]
        else:
            index=counts.get(cue,0); counts[cue]=index+1
            data=cues[cue][index%len(cues[cue])]
        start=round(at*RATE)
        demo[start:start+len(data)]+=data
    record['demo'] = save(f'{ident}/demo.wav',demo,'Combo and finish',['punches','thwack','swishes','voice-oga'])
    manifest['sets'].append(record)
special_demo = np.zeros(round(7.5*RATE))
for at,(key,(label,data)) in zip([.2,1.65,3.1,5.55],signatures().items()):
    manifest['signatures'][key]=save(f'common/{key}.wav',data,label,{'laser':['punches','original synthesis'],'caps':['swishes','thwack'],'flyby':['original synthesis'],'text':['swishes','thwack','punches']}[key])
    start=round(at*RATE);special_demo[start:start+len(data)]+=data
manifest['specialsDemo']=save('common/specials-demo.wav',special_demo,'Signature moves',['punches','thwack','swishes','original synthesis'])
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'sets':len(manifest['sets']),'wavFiles':len(list(ROOT.glob('*/*.wav'))),
                  'candidateBytes':sum(p.stat().st_size for p in ROOT.glob('*/*.wav'))}))
