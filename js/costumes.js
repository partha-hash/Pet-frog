/* PIP — costume configuration objects.
   Each costume is plain data: visuals (skin, layers), facial preset, voices, FX preset, sounds.
   Add a new one by pushing another object onto Pip.COSTUMES (see README). */
(function (P) {
  const fx = (o) => o; // readability helper
  P.COSTUMES = [
    {
      id: 'pip', name: 'Original Pip', tagline: 'Goofy, gentle, mildly confused', accent: '#9fdc5c',
      skin: { L: '#b4e06f', M: '#78b04c', D: '#437a3a', line: '#2d5a2e' }, collar: '#d6ea8c',
      head: { sx: 1, sy: 1 }, layers: [],
      face: { speed: 7, lidBias: 0, brow: { y: 0, rot: 0 }, smile: 0.05, blink: { style: 'normal', every: [2.4, 5.5] },
        eye: { sclera: '#f4f5e6', iris: null, pupil: 'round', pupilR: 12, scale: 1 }, brows: true, teeth: null, jaw: 1, wide: 1, tongue: '#e2677c', cavity: '#5c2630' },
      moodOverrides: {},
      expressions: [
        { id: 'ribbit', label: 'Ribbit!', p: { open: 0.55, wide: 0.9, smile: 0.2, lid: 0.1 }, dur: 1.1, sfx: 'ribbit' },
        { id: 'tongue', label: 'Goofy tongue', p: { open: 0.5, tongue: 1, smile: 0.6, cross: 0.8, lid: 0.15, headRot: 6 }, dur: 2.2 },
        { id: 'cross', label: 'Cross-eyed', p: { cross: 1, pupS: 1.1, open: 0.12, smile: 0.3 }, dur: 2.4 },
        { id: 'puff', label: 'Cheek puff', p: { open: 0.05, wide: 0.75, cheek: 1, lidLow: 0.5, eyeS: 1.08 }, dur: 2 }
      ],
      idle: { kind: 'pip', bob: 4, speed: 1, sway: 1, look: [3, 8], events: ['cross', 'puff'] },
      speak: { character: 'frog', base: 52, rate: 1, contour: 1, whisper: 0, harmony: false, tts: { rate: 0.95, pitch: 1.35 } },
      sing: { character: 'frog', range: 'mid', vibRate: 5.6, vibDepth: 28, scoop: 80 },
      harmony: { on: false, interval: 7, detune: 6, vol: 0.45, character: 'smooth', vibRate: 5.1, vibDepth: 20, formantMod: 0, ring: 0 },
      fx: fx({ chorus: { mix: .35, rate: .8, depth: 2.5 }, od: { mix: .2, amount: 20 }, pitch: { mix: .12, rate: 4.6, depth: 1 }, reverb: { mix: .2, size: 1.2, damp: .5 } }),
      ribbit: { f0: 200, f1: 95, count: 2, gap: .15, dur: .11, am: 38, bp: 700, wave: 'sawtooth', level: .45 },
      laugh: { notes: [4, 2, 4, 0, 2, -2], gap: .14, dur: .11, count: 6, pitch: 0 },
      sfx: { feed: 'chomp', transform: 'whoosh', special: 'bloop' },
      feed: { mood: 'happy', expr: null, lines: ['A tasty little fly. Yum.', 'Crunchy! Slightly legs, mostly joy.', 'Pip approves of this snack.'] }
    },
    {
      id: 'zeno', name: 'Zenomorph', tagline: 'Alien duet. Two throats, one very odd frog', accent: '#c6ff3d',
      skin: { L: '#d2f26a', M: '#8fc72e', D: '#4c8a1d', line: '#2e5a12' }, collar: '#b2d84a',
      head: { sx: 0.94, sy: 1.1 }, layers: ['zeno'],
      face: { speed: 9, lidBias: 0.05, brow: { y: 3, rot: 0 }, smile: 0, blink: { style: 'double', every: [2.2, 4.6] },
        eye: { sclera: '#e8ecd2', iris: null, pupil: 'round', pupilR: 8, scale: 0.78 }, brows: false,
        teeth: { upper: 9, lower: 8, len: 11, color: '#f2f5de' }, jaw: 1.25, wide: 1.1, tongue: '#8a2a58', cavity: '#3a0f2a' },
      moodOverrides: { happy: { smile: 1, wide: 1.3, open: 0.35, teeth: 1 }, laughing: { teeth: 1 }, stoned: { pupS: 0.7 } },
      expressions: [
        { id: 'stare', label: 'Curious stare', p: { lid: 0, pupS: 0.55, eyeS: 1.25, headRot: 12, smile: -0.05, open: 0.04 }, dur: 2.6, boost: 'sway' },
        { id: 'dblink', label: 'Double blink', p: { lid: 0.1 }, dur: 1.2, blink: 'double' },
        { id: 'jaw', label: 'Jaw stretch', p: { open: 1, wide: 1.25, teeth: 1, headRot: -6, lid: 0.15 }, dur: 1.9, sfx: 'screech', boost: 'sway' },
        { id: 'grin', label: 'Alien grin', p: { smile: 1, wide: 1.4, open: 0.3, teeth: 1, lid: 0.3, headRot: 5 }, dur: 2.6, boost: 'sway' }
      ],
      idle: { kind: 'zeno', bob: 3, speed: 0.8, sway: 1.4, look: [2.5, 6], events: ['stare', 'dblink', 'grin'] },
      speak: { character: 'alien', base: 54, rate: 1, contour: 1.2, whisper: 0, harmony: true, tts: { rate: 0.85, pitch: 0.6 } },
      sing: { character: 'alien', range: 'mid', vibRate: 5.2, vibDepth: 34, scoop: 110 },
      harmony: { on: true, interval: 12, detune: 14, vol: 0.55, character: 'robot', vibRate: 7.4, vibDepth: 45, formantMod: 0.12, ring: 0.28 },
      fx: fx({ dist: { mix: .5, amount: 55 }, chorus: { mix: .5, rate: .35, depth: 5 }, ring: { mix: .1, freq: 140 }, delay: { mix: .35, time: .28, fb: .45, spread: 1, tone: .6 }, reverb: { mix: .55, size: 5.5, damp: .4, shimmer: .15 } }),
      ribbit: { f0: 700, f1: 210, count: 3, gap: .1, dur: .09, am: 70, bp: 1500, wave: 'sawtooth', level: .4 },
      laugh: { notes: [12, 9, 12, 7, 10, 5, 8], gap: .09, dur: .08, count: 7, pitch: 3 },
      sfx: { feed: 'screech', transform: 'zap', special: 'hiss' },
      feed: { mood: 'happy', expr: 'jaw', lines: ['The jaw unfolds. The fly vanishes. Nobody speaks of it.', 'Nom. (Inner jaw sounds.)', 'Pip-morph is satisfied.'] }
    },
    {
      id: 'evil', name: 'Evil Twin', tagline: 'Hooded, theatrical, faintly damp', accent: '#c0344a',
      skin: { L: '#8db06a', M: '#587a42', D: '#2f4a2c', line: '#1b2e1c' }, collar: null,
      head: { sx: 1, sy: 1 }, layers: ['evil'],
      face: { speed: 3.6, lidBias: 0.3, brow: { y: 2, rot: 14 }, smile: -0.05, blink: { style: 'slow', every: [3.5, 7] },
        eye: { sclera: '#e0d27a', iris: '#b81d2a', irisR: 22, pupil: 'slit', pupilR: 10, scale: 0.95 }, brows: true,
        teeth: null, jaw: 0.95, wide: 1, tongue: '#7a2230', cavity: '#2a0c12' },
      moodOverrides: { happy: { smile: 0.7, lid: 0.35, tilt: 0.7, browRot: 16 }, laughing: { tilt: 0.6 } },
      expressions: [
        { id: 'smile', label: 'Sinister smile', p: { smile: 0.95, lid: 0.38, tilt: 0.8, browRot: 20, open: 0.08, wide: 1.12, teeth: 0.6 }, dur: 3 },
        { id: 'narrow', label: 'Narrowed eyes', p: { lid: 0.55, tilt: 1, browRot: 22, pupS: 0.8, smile: -0.1 }, dur: 2.8 },
        { id: 'laugh', label: 'Evil laugh', p: { smile: 1, open: 0.7, lid: 0.4, tilt: 0.8, headRot: -8, shake: 1.2 }, dur: 2.4, laugh: true },
        { id: 'whisper', label: 'Whisper', p: { open: 0.18, wide: 0.7, lid: 0.4, tilt: 0.5, headRot: 7 }, dur: 2.4, whisper: true }
      ],
      idle: { kind: 'evil', bob: 2, speed: 0.6, sway: 0.6, look: [4, 10], events: ['narrow', 'smile'] },
      speak: { character: 'deep', base: 41, rate: 0.72, contour: 0.7, whisper: 0.22, harmony: false, tts: { rate: 0.7, pitch: 0.3 } },
      sing: { character: 'deep', range: 'low', vibRate: 4.6, vibDepth: 38, scoop: 70 },
      harmony: { on: false, interval: -12, detune: 8, vol: 0.4, character: 'deep', vibRate: 4, vibDepth: 25, formantMod: 0, ring: 0 },
      fx: fx({ dist: { mix: .42, amount: 40 }, filt: { mix: 1, cutoff: 1900, q: .8, ftype: 'lowpass' }, delay: { mix: .15, time: .38, fb: .35, spread: .4, tone: .25 }, reverb: { mix: .62, size: 6.8, damp: .8 } }),
      ribbit: { f0: 95, f1: 48, count: 1, gap: 0, dur: .5, am: 24, bp: 380, wave: 'sawtooth', level: .6 },
      laugh: { notes: [0, 0, -2, -2, -4, -4, -5], gap: .27, dur: .2, count: 7, pitch: -4, vowel: 'AH' },
      sfx: { feed: 'drone', transform: 'drone', special: 'drone' },
      feed: { mood: 'smug', expr: 'smile', lines: ['A fly. How… delicious.', 'The fly never saw it coming.', 'Another soul. Slightly crunchy.'] }
    },
    {
      id: 'myco', name: 'Myco-Man', tagline: 'Sleepy, spore-scented, quietly cosmic', accent: '#ff8a5c',
      skin: { L: '#b9d27a', M: '#7ea05a', D: '#456a46', line: '#2f4a38' }, collar: '#93b45b',
      head: { sx: 1, sy: 0.98 }, layers: ['myco'],
      face: { speed: 3, lidBias: 0.32, brow: { y: 4, rot: -4 }, smile: 0.2, blink: { style: 'slow', every: [3, 6] },
        eye: { sclera: '#f1ecd6', iris: null, pupil: 'round', pupilR: 13, scale: 1 }, brows: true, teeth: null, jaw: 0.9, wide: 0.95, tongue: '#d8707c', cavity: '#573030' },
      moodOverrides: { happy: { lid: 0.4, smile: 0.7 } },
      expressions: [
        { id: 'sleepy', label: 'Sleepy stare', p: { lid: 0.7, py: 0.3, smile: 0.1, headRot: 6, zzz: 0.5 }, dur: 3.2 },
        { id: 'wobble', label: 'Mushroom wobble', p: { lid: 0.3, smile: 0.5, headRot: -4 }, dur: 2.8, boost: 'sway' },
        { id: 'dream', label: 'Dreamy grin', p: { smile: 0.85, lid: 0.5, lidLow: 0.3, cheek: 0.7, headRot: 6, py: -0.3 }, dur: 3 },
        { id: 'slowblink', label: 'Slow blink', p: { lid: 0.2 }, dur: 2.4, blink: 'slow' }
      ],
      idle: { kind: 'myco', bob: 3, speed: 0.55, sway: 1.2, look: [5, 11], events: ['sleepy', 'dream', 'slowblink'] },
      speak: { character: 'smooth', base: 50, rate: 0.8, contour: 0.8, whisper: 0.1, harmony: false, tts: { rate: 0.72, pitch: 0.9 } },
      sing: { character: 'smooth', range: 'mid', vibRate: 4.4, vibDepth: 34, scoop: 60 },
      harmony: { on: false, interval: 4, detune: 10, vol: 0.4, character: 'smooth', vibRate: 4.8, vibDepth: 25, formantMod: 0, ring: 0 },
      fx: fx({ phase: { mix: .6, rate: .25, depth: 800 }, chorus: { mix: .6, rate: .5, depth: 4 }, delay: { mix: .4, time: .4, fb: .5, spread: .5, tone: .3 }, reverb: { mix: .55, size: 4, damp: .35 } }),
      ribbit: { f0: 300, f1: 420, count: 2, gap: .2, dur: .16, am: 14, bp: 500, wave: 'sine', level: .5 },
      laugh: { notes: [0, 2, 0, 3, 0], gap: .24, dur: .2, count: 5, pitch: 0 },
      sfx: { feed: 'bloop', transform: 'sparkle', special: 'bloop' },
      feed: { mood: 'sleepy', expr: 'dream', lines: ['Mmm. Fly spores.', 'Everything is soft and the fly is gone.', 'Pip-shroom approves, slowly.'] }
    },
    {
      id: 'punk', name: 'Punk Frog', tagline: 'Loud, raspy, extremely unbothered', accent: '#ff3d9a',
      skin: { L: '#a6d968', M: '#6ea63f', D: '#3d6e2e', line: '#24461f' }, collar: null,
      head: { sx: 1.02, sy: 0.98 }, layers: ['punk'],
      face: { speed: 12, lidBias: 0.18, brow: { y: 3, rot: 12 }, smile: 0.1, blink: { style: 'normal', every: [2.5, 6] },
        eye: { sclera: '#f6f3e2', iris: null, pupil: 'round', pupilR: 12, scale: 1 }, brows: true, teeth: { upper: 6, lower: 0, len: 7, color: '#f2f2e6' }, jaw: 1.1, wide: 1.05, tongue: '#e05a6a', cavity: '#4a1c1e' },
      moodOverrides: { happy: { smile: 0.6, tilt: 0.4, lid: 0.2 } },
      expressions: [
        { id: 'angry', label: 'Angry', p: { tilt: 1, browRot: 24, lid: 0.3, open: 0.35, teeth: 1, smile: -0.5, shake: 0.8 }, dur: 2.2 },
        { id: 'smirk', label: 'Smirk', p: { smile: 0.7, lid: 0.35, tilt: 0.3, headRot: -6, open: 0.04 }, dur: 2.4 },
        { id: 'bob', label: 'Head bob', p: { smile: 0.4, lid: 0.3 }, dur: 3, bob: true, sfx: 'powerchord' },
        { id: 'shout', label: 'Singing shout', p: { open: 1, wide: 1.1, lid: 0.45, tilt: 0.9, browRot: 20, teeth: 1, shake: 1.2, headRot: -8 }, dur: 1.6, sfx: 'powerchord' }
      ],
      idle: { kind: 'punk', bob: 3, speed: 1.2, sway: 1, look: [3, 7], events: ['smirk', 'bob'] },
      speak: { character: 'raspy', base: 50, rate: 1.15, contour: 1.4, whisper: 0, harmony: false, tts: { rate: 1.15, pitch: 0.8 } },
      sing: { character: 'raspy', range: 'mid', vibRate: 6.5, vibDepth: 14, scoop: 120 },
      harmony: { on: false, interval: -12, detune: 5, vol: 0.4, character: 'raspy', vibRate: 6, vibDepth: 10, formantMod: 0, ring: 0 },
      fx: fx({ od: { mix: .8, amount: 70 }, crush: { mix: .4, bits: 7 }, delay: { mix: .35, time: .1, fb: .12, spread: 0, tone: .8 }, reverb: { mix: .1, size: .6, damp: .5 } }),
      ribbit: { f0: 150, f1: 70, count: 2, gap: .12, dur: .1, am: 55, bp: 900, wave: 'square', level: .4 },
      laugh: { notes: [0, 3, 0, 3, -2, 0], gap: .12, dur: .09, count: 6, pitch: 0 },
      sfx: { feed: 'chomp', transform: 'powerchord', special: 'powerchord' },
      feed: { mood: 'smug', expr: 'smirk', lines: ['Fly? Punk as hell.', 'Chewed with attitude.', 'Anarchy. Also lunch.'] }
    },
    {
      id: 'wizard', name: 'Frog Wizard', tagline: 'Theatrical, pointy-hatted, magically damp', accent: '#8f7bff',
      skin: { L: '#b0de72', M: '#76ac4c', D: '#43763b', line: '#2c522f' }, collar: null,
      head: { sx: 1, sy: 1 }, layers: ['wizard'],
      face: { speed: 6, lidBias: 0.08, brow: { y: -2, rot: -4 }, smile: 0.15, blink: { style: 'normal', every: [2.8, 6] },
        eye: { sclera: '#f4f4e8', iris: '#4a7cff', irisR: 18, pupil: 'round', pupilR: 9, scale: 1 }, brows: true, teeth: null, jaw: 1, wide: 1, tongue: '#d96b7e', cavity: '#58283a' },
      moodOverrides: {},
      expressions: [
        { id: 'cast', label: 'Cast spell', p: { open: 0.5, wide: 0.8, lid: 0, browRot: -8, smile: 0.2, headRot: -6, armR1: 125, armR2: 15 }, dur: 2.4, sfx: 'sparkle', boost: 'sway' },
        { id: 'mystic', label: 'Mystic stare', p: { lid: 0.1, pupS: 0.7, eyeS: 1.15, smile: 0, open: 0.03, py: -0.2 }, dur: 2.6 },
        { id: 'wise', label: 'Wise smile', p: { smile: 0.7, lid: 0.25, lidLow: 0.3, headRot: 5, browY: -3 }, dur: 2.6 }
      ],
      idle: { kind: 'wizard', bob: 5, speed: 0.8, sway: 1, look: [3, 8], events: ['mystic', 'wise', 'cast'] },
      speak: { character: 'frog', base: 49, rate: 0.9, contour: 1.5, whisper: 0, harmony: true, tts: { rate: 0.8, pitch: 0.7 } },
      sing: { character: 'smooth', range: 'mid', vibRate: 5, vibDepth: 42, scoop: 90 },
      harmony: { on: true, interval: 12, detune: 9, vol: 0.38, character: 'smooth', vibRate: 5.8, vibDepth: 30, formantMod: 0, ring: 0 },
      fx: fx({ reverb: { mix: .6, size: 6, damp: .3, shimmer: .6 }, chorus: { mix: .4, rate: .5, depth: 3.5 }, pitch: { mix: .3, rate: 3, depth: 2 }, delay: { mix: .2, time: .33, fb: .35, spread: .6, tone: .5 } }),
      ribbit: { f0: 240, f1: 130, count: 2, gap: .14, dur: .12, am: 30, bp: 800, wave: 'sawtooth', level: .45 },
      laugh: { notes: [0, 4, 0, 4, 7, 4], gap: .2, dur: .15, count: 6, pitch: 0 },
      sfx: { feed: 'sparkle', transform: 'sparkle', special: 'sparkle' },
      feed: { mood: 'happy', expr: 'cast', lines: ['A fly, conjured. And eaten.', 'By the old magic: nom.', 'The fly joins the ancient tome of snacks.'] }
    },
    {
      id: 'space', name: 'Space Frog', tagline: 'Radio-crackled, weightless, mission-focused', accent: '#4fc3ff',
      skin: { L: '#b5e27a', M: '#7ab653', D: '#46803f', line: '#2c5a30' }, collar: null,
      head: { sx: 1, sy: 1 }, layers: ['space'],
      face: { speed: 7, lidBias: 0, brow: { y: 0, rot: 0 }, smile: 0.2, blink: { style: 'normal', every: [2.4, 5] },
        eye: { sclera: '#f5f6ea', iris: null, pupil: 'round', pupilR: 12, scale: 1 }, brows: true, teeth: null, jaw: 1, wide: 1, tongue: '#e06a7c', cavity: '#58262e' },
      moodOverrides: {},
      expressions: [
        { id: 'radio', label: 'Radio check', p: { open: 0.3, wide: 0.9, smile: 0.2, lid: 0.1, headRot: 4 }, dur: 1.6, sfx: 'blip' },
        { id: 'float', label: 'Zero-G float', p: { smile: 0.5, lid: 0.15, headRot: -8, py: -0.4 }, dur: 3, float: true },
        { id: 'awe', label: 'Awe', p: { lid: 0, pupS: 0.6, eyeS: 1.18, open: 0.5, wide: 0.7, browY: -10, py: -0.6 }, dur: 2.6 }
      ],
      idle: { kind: 'space', bob: 6, speed: 0.55, sway: 1, look: [3, 8], events: ['radio', 'awe', 'float'] },
      speak: { character: 'robot', base: 52, rate: 1, contour: 0.8, whisper: 0, harmony: false, tts: { rate: 1, pitch: 0.9 } },
      sing: { character: 'smooth', range: 'mid', vibRate: 5, vibDepth: 18, scoop: 40 },
      harmony: { on: false, interval: 7, detune: 6, vol: 0.4, character: 'robot', vibRate: 5, vibDepth: 10, formantMod: 0, ring: 0.2 },
      fx: fx({ ring: { mix: .3, freq: 90 }, filt: { mix: .9, cutoff: 1700, q: 1.1, ftype: 'bandpass' }, delay: { mix: .45, time: .33, fb: .5, spread: 1, tone: .5 }, reverb: { mix: .25, size: 2.5, damp: .5 } }),
      ribbit: { f0: 900, f1: 600, count: 3, gap: .09, dur: .06, am: 0, bp: 1700, wave: 'square', level: .3 },
      laugh: { notes: [0, 2, 0, 2, 0], gap: .15, dur: .1, count: 5, pitch: 0 },
      sfx: { feed: 'blip', transform: 'whoosh', special: 'blip' },
      feed: { mood: 'happy', expr: 'radio', lines: ['Rations received. Over.', 'Fly acquired. Mission success.', 'Houston, the fly is delicious.'] }
    },
    {
      id: 'royal', name: 'Frog Royalty', tagline: 'Overconfident, operatic, chin permanently up', accent: '#ffc83d',
      skin: { L: '#b8e47a', M: '#7cb450', D: '#47803c', line: '#2d5a2d' }, collar: null,
      head: { sx: 1, sy: 1 }, layers: ['royal'],
      face: { speed: 6, lidBias: 0.2, brow: { y: -3, rot: -2 }, smile: 0.35, blink: { style: 'slow', every: [3, 6] },
        eye: { sclera: '#f6f3e2', iris: null, pupil: 'round', pupilR: 11, scale: 1 }, brows: true, teeth: null, jaw: 1.1, wide: 1, tongue: '#df6a7a', cavity: '#58262e' },
      moodOverrides: { happy: { lid: 0.3, smile: 0.8 } },
      expressions: [
        { id: 'smug', label: 'Smug royal', p: { smile: 0.8, lid: 0.45, headRot: -9, browY: -6, open: 0.03, px: 0.4 }, dur: 2.8 },
        { id: 'gasp', label: 'Dramatic gasp', p: { open: 0.75, wide: 0.7, lid: 0, eyeS: 1.15, browY: -14, headRot: 7, armL1: 40, armL2: 100 }, dur: 2 },
        { id: 'wave', label: 'Regal wave', p: { smile: 0.6, lid: 0.3, armR1: 130, armR2: 20 }, dur: 2.6, wave: true }
      ],
      idle: { kind: 'royal', bob: 3, speed: 0.7, sway: 0.7, look: [4, 9], events: ['smug', 'wave'] },
      speak: { character: 'smooth', base: 47, rate: 0.85, contour: 1.8, whisper: 0, harmony: false, tts: { rate: 0.8, pitch: 0.65 } },
      sing: { character: 'smooth', range: 'wide', vibRate: 5.4, vibDepth: 55, scoop: 100 },
      harmony: { on: true, interval: -12, detune: 7, vol: 0.42, character: 'deep', vibRate: 5.4, vibDepth: 40, formantMod: 0, ring: 0 },
      fx: fx({ reverb: { mix: .5, size: 4.5, damp: .35 }, chorus: { mix: .3, rate: .6, depth: 3 }, delay: { mix: .1, time: .25, fb: .2, spread: .3, tone: .5 } }),
      ribbit: { f0: 220, f1: 150, count: 2, gap: .18, dur: .2, am: 18, bp: 600, wave: 'sawtooth', level: .45 },
      laugh: { notes: [7, 4, 7, 4, 2, 0], gap: .2, dur: .15, count: 6, pitch: 0 },
      sfx: { feed: 'fanfare', transform: 'fanfare', special: 'fanfare' },
      feed: { mood: 'smug', expr: 'smug', lines: ['The royal fly has been consumed.', 'Acceptable. Bring more.', 'One does adore a snack.'] }
    },
    {
      id: 'cyber', name: 'Cyber Frog', tagline: 'Synthetic, glitchy, rhythmically gated', accent: '#35f0ff',
      skin: { L: '#a6ece6', M: '#43aab5', D: '#1f5c6c', line: '#12384a' }, collar: '#5c6c7e',
      head: { sx: 1, sy: 1 }, layers: ['cyber'],
      face: { speed: 14, lidBias: 0, brow: { y: 0, rot: 3 }, smile: 0, blink: { style: 'normal', every: [2, 4.5] },
        eye: { sclera: '#e8fbff', iris: '#ff2f5a', irisR: 20, pupil: 'round', pupilR: 8, scale: 1 }, brows: true, teeth: null, jaw: 0.9, wide: 1, tongue: '#37c8d6', cavity: '#0c2a38' },
      moodOverrides: {},
      expressions: [
        { id: 'scan', label: 'Scan', p: { lid: 0, pupS: 0.6, px: 1, cross: 0 }, dur: 2.4, scan: true },
        { id: 'glitch', label: 'Glitch', p: { open: 0.3, lid: 0.3, shake: 1.6, headRot: 8, eyeS: 1.1 }, dur: 1.4, sfx: 'zap', glitch: true },
        { id: 'boot', label: 'Boot-up', p: { lid: 0.9, smile: 0 }, dur: 1.6, sfx: 'beep', boot: true }
      ],
      idle: { kind: 'cyber', bob: 2, speed: 1.2, sway: 0.5, look: [2.5, 6], events: ['scan', 'glitch', 'boot'] },
      speak: { character: 'robot', base: 50, rate: 1, contour: 0.4, whisper: 0, harmony: false, tts: { rate: 1.05, pitch: 0.5 } },
      sing: { character: 'robot', range: 'mid', vibRate: 0, vibDepth: 0, scoop: 0 },
      harmony: { on: false, interval: 12, detune: 0, vol: 0.4, character: 'robot', vibRate: 0, vibDepth: 0, formantMod: 0, ring: 0.1 },
      fx: fx({ crush: { mix: .7, bits: 5 }, ring: { mix: .45, freq: 220 }, gate: { mix: .8, rate: 8 }, filt: { mix: .3, cutoff: 300, q: .7, ftype: 'highpass' }, reverb: { mix: .15, size: 1 } }),
      ribbit: { f0: 1000, f1: 1000, count: 3, gap: .08, dur: .05, am: 0, bp: 1400, wave: 'square', level: .3 },
      laugh: { notes: [0, 0, 0, 0, 0, 0], gap: .12, dur: .06, count: 6, pitch: 0 },
      sfx: { feed: 'beep', transform: 'zap', special: 'zap' },
      feed: { mood: 'happy', expr: 'scan', lines: ['Fly.exe executed.', 'Nutrient packet received.', 'Digesting... 100%.'] }
    }
  ];
})(window.Pip = window.Pip || {});
