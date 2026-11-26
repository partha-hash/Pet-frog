# Pip the Pond Frog — puppet edition

A tiny digital puppet with nine costumes, a formant-based singing voice and a Web Audio effects rack.
Static site: no build step, no API keys, no dependencies. All audio runs locally in the browser.

## Run it
Open `index.html` directly, or serve the folder (recommended):

    python3 -m http.server 8000   # then visit http://localhost:8000

Audio starts only after your first click/tap (browser autoplay rules).

## Deploy on Vercel
Push this folder to GitHub, import the repo in Vercel, framework preset **Other**, no build command, output directory `.`.
(Or `vercel --prod` from this folder.)

## Files
- `index.html`, `style.css` — layout and pond theme (original dark aesthetic kept)
- `js/costumes.js` — **costume configuration objects** (data only)
- `js/character.js` — procedural puppet: SVG rig, face/expression controller, costume art layers
- `js/audio.js` — syllabifier, melody generator, harmony engine, formant vocal synth, FX engine, SFX
- `js/app.js` — UI, costume manager, interaction controller, main loop

## How the character model works
Pip is a layered SVG puppet (lit radial gradients, grain texture tile, rim shine) with one shared model spec
(`M` in `character.js`): head centre (240,215), eyes at (170,150)/(310,150), mouth line y=252, shoulders y=392.
All costumes share this geometry. Rig parts: two-piece **jaw** (path rebuilt each frame from open/smile/width),
**tongue/teeth**, per-eye **upper & lower lids, pupils, brows**, two-segment **arms** (shoulder + elbow), body squash/breathing.

Face = *mood* (12 original moods) → costume bias (`face` preset + `moodOverrides`) → momentary *costume expression*
→ lip-sync (visemes) → blink. Moods and costumes are independent, so changing one never resets the other.

Costumes add art into named **slots**: `back, bodyOver, armU, armF, collarOver, headBack, headOver, jaw, faceOver`.
Elements inside a layer can use `data-sway="amp,speed,phase,pivotX,pivotY"`, `data-float="amp,speed,phase"`,
`data-twinkle="speed,phase"` for secondary motion.

## Add a costume
1. In `character.js`, add a function to `LAYERS` (`mycostume: (p) => ({ defs, headOver, bodyOver, ... })`; `p` is an id prefix for gradients).
2. In `costumes.js`, push an object: `id, name, tagline, accent, skin{L,M,D,line}, collar, head{sx,sy}, layers:['mycostume'],
   face{...}, moodOverrides, expressions[], idle, speak, sing, harmony, fx, ribbit, laugh, sfx, feed`.
   Copy any existing costume as a template. The wardrobe card, preview, FX preset and voice defaults appear automatically.

## How the singing engine works
1. **Syllabifier** — splits lyrics into syllables (onset / vowel / coda), picks vowels (incl. diphthongs), notes punctuation.
2. **MelodyGenerator** — deterministic (seeded by lyrics+key+scale+range+complexity, so the same input gives the same tune).
   Uses the chosen key/scale, phrases split at punctuation, bar-padded phrase ends, motif reuse, cadences (tonic at the end),
   BPM-locked durations, rests between phrases.
3. **Voice (formant synth)** — glottal-style PeriodicWave + detuned saw → 4 parallel formant band-passes (vowel table, vowel
   glides, diphthongs) → nasal peaks → ADSR amp. Pitch envelope, portamento, scoops, delayed vibrato, breath/whisper noise,
   consonant noise bursts (s/sh/f/t/k/p…), nasal & liquid onsets. Voice characters: frog, smooth, deep, raspy, robot, alien.
4. **HarmonyEngine** — copies the *same notes and timings* of the main voice, transposed (octave, fifth, fourth, third) and
   detuned, rendered by a second independent voice (own formants, vibrato, formant modulation, ring mod, volume).
   Zenomorph enables it by default; any costume can use it from the Harmony tab.
5. **Lip-sync** — jaw/mouth shapes come from the scheduled main-voice notes (vowel-dependent open/width, closed lips on m/b/p),
   so animation stays on audio time; the harmony voice never doubles it.
6. Speaking uses the same synth as a short "babble" voice by default (costume voice + effects). Browser TTS is an optional engine.

## Effects
`FXEngine` signal flow: Voices → pitch mod → distortion → overdrive → bitcrusher → ring mod → filter → phaser → chorus →
rhythmic gate → delay / ping-pong → reverb (with shimmer send) → compressor/limiter → master → output.
Every effect has a mix control and a bypass switch. Presets live in each costume's `fx` object (see `FX_SCHEMA` in `audio.js`
for parameter names); changing costume loads its preset, **RESET PRESET** restores it. Stop swaps in a fresh FX chain so
reverb/delay tails are cut immediately (the old chain is disposed — no node leaks).
Notes: the bitcrusher is waveshaper bit-reduction plus a low-pass (no sample-rate decimation); shimmer is a rectifier-based octave send.

## Safety / behaviour
One AudioContext, created on first interaction. Stop, Esc, switching costume, hiding the tab all cancel voices, noise bursts and tails.
Sound OFF mutes the master and schedules nothing (faces still animate silently). If Web Audio is unavailable, speech falls back to browser TTS.
Pip is an original character inspired by the broad look of expressive green puppet frogs; it does not reproduce any existing character's artwork.
