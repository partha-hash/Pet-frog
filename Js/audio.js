/* PIP — audio: syllabifier, melody generator, harmony engine, formant vocal synth, FX engine, SFX.
   Everything runs locally in Web Audio. One AudioContext, a fixed set of persistent nodes (no per-note leaks). */
(function (P) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ================= SYLLABIFIER ================= */
  const VF = { // F1..F4 (Hz) and mouth shape {open, wide}
    AH: [800, 1150, 2900, 3900], AE: [680, 1720, 2410, 3500], EH: [540, 1840, 2480, 3500], EE: [280, 2250, 3010, 3600],
    IH: [400, 1990, 2550, 3500], OH: [570, 850, 2410, 3500], OO: [310, 880, 2240, 3500], UH: [650, 1200, 2390, 3500] };
  const VIS = { AH: { open: .92, wide: 1 }, AE: { open: .7, wide: 1.15 }, EH: { open: .5, wide: 1.1 }, EE: { open: .24, wide: 1.28 }, IH: { open: .34, wide: 1.15 }, OH: { open: .7, wide: .62 }, OO: { open: .36, wide: .5 }, UH: { open: .6, wide: .85 } };
  const WEXC = { i: [['AH', 'EE']], a: [['UH']], the: [['UH']], of: [['UH']], to: [['OO']], you: [['OO']], your: [['OH']], are: [['AH']], was: [['UH']], what: [['UH']], love: [['UH']], have: [['AE']], give: [['IH']], live: [['IH']],
    one: [['UH']], come: [['UH']], some: [['UH']], said: [['EH']], do: [['OO']], who: [['OO']], they: [['EH', 'EE']], my: [['AH', 'EE']], me: [['EE']], we: [['EE']], he: [['EE']], she: [['EE']], be: [['EE']], eyes: [['AH', 'EE']], night: [['AH', 'EE']], moon: [['OO']], sleepy: [['EE'], ['EE']], egg: [['EH']], looks: [['OO']], like: [['AH', 'EE']], this: [['IH']] };
  const DIG = ['th', 'sh', 'ch', 'ph', 'wh', 'ck', 'ng', 'gh'];
  const isVL = (w, i) => { const c = w[i]; if ('aeiou'.includes(c)) return true; if (c === 'y') return i > 0 || w.length < 3; if (c === 'w') return i > 0 && 'aeiou'.includes(w[i - 1]) && (i === w.length - 1 || !'aeiou'.includes(w[i + 1])); return false; };
  function syllabifyWord(raw) {
    let w = raw.toLowerCase().replace(/[^a-z]/g, '').replace(/qu/g, 'kw'); if (!w) return [];
    const n = w.length, groups = []; let i = 0;
    while (i < n) { if (isVL(w, i)) { let j = i; while (j + 1 < n && isVL(w, j + 1)) j++; groups.push([i, j]); i = j + 1; } else i++; }
    if (!groups.length) return [{ onset: w, nuc: 'u', coda: '', text: raw, v: ['UH'] }];
    let silentE = false;
    const lg = groups[groups.length - 1];
    if (groups.length > 1 && lg[0] === n - 1 && w[n - 1] === 'e' && !(n > 2 && w[n - 2] === 'l' && !'aeiou'.includes(w[n - 3] || 'a'))) { groups.pop(); silentE = true; }
    else if (groups.length > 1 && lg[0] === n - 2 && w[n - 2] === 'e' && (w[n - 1] === 'd' || w[n - 1] === 's') && !'tdsxzcgh'.includes(w[n - 3]) && !(w[n - 1] === 'd' && 'td'.includes(w[n - 3]))) groups.pop();
    const sy = [];
    for (let g = 0; g < groups.length; g++) {
      const [a, b] = groups[g]; const prevEnd = g ? groups[g - 1][1] : -1; const cl = w.slice(prevEnd + 1, a); let onset = '', coda = '';
      if (g === 0) onset = cl; else { if (cl.length === 0) onset = ''; else if (cl.length === 1) onset = cl; else { const d = DIG.find(x => cl.endsWith(x) || cl.startsWith(x)); if (cl.length === 2 && DIG.includes(cl) && !['ck', 'ng'].includes(cl)) onset = cl; else if (['ck', 'ng'].includes(cl)) { sy[sy.length - 1].coda += cl; onset = ''; } else { sy[sy.length - 1].coda += cl[0]; onset = cl.slice(1); } } }
      if (g === groups.length - 1) coda = w.slice(b + 1);
      sy.push({ onset, nuc: w.slice(a, b + 1), coda, text: '', silentE: silentE && g === groups.length - 1 });
    }
    const ex = WEXC[w] || WEXC[raw.toLowerCase()];
    sy.forEach((s, k) => { s.v = ex && ex[k] ? ex[k] : vowelOf(s, k, sy.length, n); s.text = s.onset + s.nuc + s.coda; if (/^gh/.test(s.coda) && s.v.length === 2) s.coda = s.coda.slice(2); });
    return sy;
  }
  function vowelOf(s, k, count, wl) {
    const n = s.nuc, open = !s.coda && k < count - 1;
    if (n === 'i' && /^gh/.test(s.coda)) return ['AH', 'EE'];
    if (s.silentE) return ({ a: ['EH', 'EE'], i: ['AH', 'EE'], o: ['OH'], u: ['OO'], e: ['EE'], y: ['AH', 'EE'] })[n] || ['UH'];
    if (n === 'y') return count === 1 ? ['AH', 'EE'] : (k === count - 1 ? ['EE'] : ['IH']);
    const two = { ee: ['EE'], ea: ['EE'], ie: ['EE'], oo: ['OO'], ou: ['AH', 'OO'], ow: ['AH', 'OO'], oa: ['OH'], oe: ['OH'], ai: ['EH', 'EE'], ay: ['EH', 'EE'], ei: ['EH', 'EE'], ey: ['EE'], oi: ['OH', 'EE'], oy: ['OH', 'EE'], au: ['AH'], aw: ['AH'], ew: ['OO'], eu: ['OO'], ue: ['OO'], ui: ['OO'] };
    if (two[n]) return two[n];
    if (n.length === 1) {
      if (n === 'e' && s.onset && !s.coda && k === count - 1 && count > 1) return ['UH'];
      if (n === 'i' && !s.coda && count === 1) return ['AH', 'EE'];
      if (open) return ({ a: ['EH', 'EE'], e: ['EE'], i: ['AH', 'EE'], o: ['OH'], u: ['OO'] })[n];
      return ({ a: ['AE'], e: ['EH'], i: ['IH'], o: ['AH'], u: ['UH'] })[n];
    }
    return ({ a: ['AE'], e: ['EH'], i: ['IH'], o: ['OH'], u: ['UH'] })[n[0]] || ['UH'];
  }
  function syllabify(text) {
    const out = []; const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    words.forEach((word, wi) => { const punct = (word.match(/[.,!?;:]+$/) || [''])[0]; const sy = syllabifyWord(word); if (!sy.length) { if (punct && out.length) out[out.length - 1].punct = punct; return; }
      sy.forEach((s, k) => { s.word = wi; s.wordEnd = k === sy.length - 1; s.wordStart = k === 0; s.punct = s.wordEnd ? punct : ''; out.push(s); }); });
    return out.slice(0, 72);
  }

  /* ================= MELODY ================= */
  const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], mixolydian: [0, 2, 4, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11], phrygian: [0, 1, 3, 5, 7, 8, 10], 'major pentatonic': [0, 2, 4, 7, 9], 'minor pentatonic': [0, 3, 5, 7, 10], blues: [0, 3, 5, 6, 7, 10], 'whole tone': [0, 2, 4, 6, 8, 10] };
  const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const RANGES = { low: [45, 64], mid: [52, 72], high: [60, 79], wide: [48, 76] };
  const Melody = {
    SCALES, KEYS, RANGES,
    generate(syl, S) {
      const R = rng(hash([syl.map(s => s.text).join('.'), S.key, S.scale, S.range, Math.round(S.complexity * 10)].join('|'))), c = S.complexity, spb = 60 / S.bpm;
      const root = KEYS.indexOf(S.key), pcs = SCALES[S.scale].map(x => (root + x) % 12), [lo, hi] = RANGES[S.range] || RANGES.mid;
      const pool = []; for (let m = lo; m <= hi; m++) if (pcs.includes(m % 12)) pool.push(m);
      const tonics = pool.map((m, i) => m % 12 === root ? i : -1).filter(i => i >= 0), want = lo + (hi - lo) * .38;
      const tIdx = (near) => tonics.reduce((b, i) => Math.abs(pool[i] - near) < Math.abs(pool[b] - near) ? i : b, tonics[0]);
      // phrases
      const phrases = []; let cur = [];
      syl.forEach((s, i) => { cur.push(s); const end = s.punct || (s.wordEnd && cur.length >= 6) || i === syl.length - 1; if (end) { phrases.push(cur); cur = []; } });
      const durSets = c < .34 ? [1, 1, .5, .5, 1] : c < .67 ? [.5, .5, .75, .25, 1, .5, .5] : [.25, .5, .25, .75, .5, 1, .25, .5];
      const stepW = [0, 1, -1, 2, -2, 3, -3, 4, -4], base = [.1, .26 - .06 * c, .26 - .06 * c, .12, .12, .05 + .08 * c, .05 + .08 * c, .01 + .03 * c, .01 + .03 * c];
      const notes = []; let beat = 0; const motifs = [];
      phrases.forEach((ph, pi) => {
        const n = ph.length, last = pi === phrases.length - 1, q = ph[n - 1].punct.includes('?');
        let durs, steps;
        if (pi >= 2 && motifs[pi - 2] && motifs[pi - 2].durs.length && R() < .7 - c * .2) { const m = motifs[pi - 2]; durs = Array.from({ length: n }, (_, i) => m.durs[Math.min(i, m.durs.length - 1)]); steps = Array.from({ length: n }, (_, i) => m.steps[Math.min(i, m.steps.length - 1)]); if (n > 2) steps[n - 2] = R() < .5 ? 1 : -1; }
        else { durs = ph.map((s, i) => { let d = durSets[Math.floor(R() * durSets.length)]; if (s.wordEnd && i < n - 1) d = Math.max(d, .5); return d; }); steps = ph.map((_, i) => { const half = i < n / 2 ? 1 : -1; let tot = 0; const w = base.map((b, k) => { const v = b * (stepW[k] * half > 0 ? 1.4 : 1); tot += v; return v; }); let r = R() * tot, k = 0; while (r > w[k] && k < w.length - 1) { r -= w[k]; k++; } return stepW[k]; }); }
        motifs[pi] = { durs: durs.slice(), steps: steps.slice() };
        // pad to half-bar, end note long
        let sum = durs.reduce((a, b) => a + b, 0); durs[n - 1] = Math.max(durs[n - 1], 1); sum = durs.reduce((a, b) => a + b, 0); const pad = (2 - (sum % 2)) % 2; durs[n - 1] += pad;
        let idx = pi === 0 ? tIdx(want) + (R() < .4 ? 2 : 0) : clamp(notes.length ? notes[notes.length - 1].idx + (R() < .5 ? 1 : -1) : tIdx(want), 0, pool.length - 1);
        const endT = last ? tIdx(want) : clamp(tIdx(want) + ([1, 2, 4][Math.floor(R() * 3)]), 0, pool.length - 1);
        ph.forEach((s, i) => {
          if (i > 0) { idx += steps[i]; if (idx < 0) idx = -idx; if (idx > pool.length - 1) idx = 2 * (pool.length - 1) - idx; idx = clamp(idx, 0, pool.length - 1); }
          if (i === n - 1) idx = q ? clamp(endT + 1, 0, pool.length - 1) : endT; else if (i === n - 2 && n > 2) idx = clamp(idx, endT - 3, endT + 3);
          const d = durs[i], longNote = d >= 1.5;
          notes.push({ beat, dur: d, idx, midi: pool[idx], syl: s, vib: d >= 1, scoop: (i === 0 && pi > 0 && R() < .5) || (d >= 1.5 && R() < .5) || R() < .08 * c ? 1 : 0, gate: s.wordEnd ? .86 : .97, vel: i === 0 ? 1 : .88 + R() * .12, phrase: pi, glideFrom: null });
          beat += d;
        });
        const p = ph[n - 1].punct; beat += p.includes('.') || p.includes('!') ? 1 : .5;
      });
      let prev = null; notes.forEach(nt => { if (prev && nt.beat - (prev.beat + prev.dur) < .01 && !prev.syl.wordEnd && Math.abs(nt.midi - prev.midi) > 2) nt.glideFrom = prev.midi; prev = nt; });
      const jit = rng(hash('j' + S.bpm));
      notes.forEach(nt => { nt.t = nt.beat * spb + (jit() - .5) * .02 * c; nt.sec = nt.dur * spb; });
      return { notes, total: beat * spb + .3 };
    },
    speech(syl, C, rate, seed) {
      const R = rng(hash(syl.map(s => s.text).join('.') + C.id)), sp = C.speak, notes = []; let t = 0, wp = 0, drift = 0;
      syl.forEach((s, i) => { if (s.wordStart) { wp = (R() - .5) * 6 * sp.contour; } const base = sp.base + wp - drift;
        const lastWords = syl.slice(i).filter(x => x.punct).length === 0; const q = syl[syl.length - 1].punct.includes('?') && i >= syl.length - 2; const dur = (.12 + R() * .05) / rate * (s.wordEnd ? 1.15 : 1) * (s.punct ? 1.6 : 1);
        notes.push({ t, sec: dur, midi: base + (q ? 5 : 0) + (s.punct.includes('!') ? 2 : 0), syl: s, vib: false, scoop: 0, gate: .85, vel: .8 + R() * .2, whisper: R() < sp.whisper, glideFrom: null, speech: true });
        t += dur * .95 + (s.wordEnd ? .05 : 0) + (s.punct ? .22 : 0); drift += .25 * sp.contour; });
      return { notes, total: t + .3 };
    }
  };
  const Harmony = { INTERVALS: { 'octave up': 12, 'octave down': -12, 'fifth above': 7, 'fourth below': -5, 'third above': 4, unison: 0 },
    transform(notes, semis, detune) { return notes.map(n => Object.assign({}, n, { midi: n.midi + semis, detune })); } };

  /* ================= FX ENGINE ================= */
  const FX_SCHEMA = [
    { id: 'pitch', label: 'Pitch modulation', params: [{ k: 'mix', def: 0 }, { k: 'rate', l: 'Rate', min: .1, max: 10, step: .1, def: 4, u: 'Hz' }, { k: 'depth', l: 'Depth', min: 0, max: 8, step: .1, def: 1, u: 'ms' }] },
    { id: 'dist', label: 'Distortion', params: [{ k: 'mix', def: 0 }, { k: 'amount', l: 'Amount', min: 0, max: 100, step: 1, def: 40 }] },
    { id: 'od', label: 'Overdrive', params: [{ k: 'mix', def: 0 }, { k: 'amount', l: 'Drive', min: 0, max: 100, step: 1, def: 40 }] },
    { id: 'crush', label: 'Bitcrusher', params: [{ k: 'mix', def: 0 }, { k: 'bits', l: 'Bits', min: 2, max: 12, step: 1, def: 6 }] },
    { id: 'ring', label: 'Ring modulator', params: [{ k: 'mix', def: 0 }, { k: 'freq', l: 'Freq', min: 20, max: 2000, step: 1, def: 150, u: 'Hz' }] },
    { id: 'filt', label: 'Filter', params: [{ k: 'mix', def: 0 }, { k: 'cutoff', l: 'Cutoff', min: 100, max: 8000, step: 10, def: 2000, u: 'Hz' }, { k: 'q', l: 'Q', min: .3, max: 8, step: .1, def: 1 }] },
    { id: 'phase', label: 'Phaser', params: [{ k: 'mix', def: 0 }, { k: 'rate', l: 'Rate', min: .05, max: 4, step: .05, def: .4, u: 'Hz' }, { k: 'depth', l: 'Depth', min: 100, max: 1500, step: 10, def: 700 }] },
    { id: 'chorus', label: 'Chorus', params: [{ k: 'mix', def: 0 }, { k: 'rate', l: 'Rate', min: .1, max: 4, step: .05, def: .6, u: 'Hz' }, { k: 'depth', l: 'Depth', min: 0, max: 8, step: .1, def: 3, u: 'ms' }] },
    { id: 'gate', label: 'Rhythmic gate', params: [{ k: 'mix', def: 0 }, { k: 'rate', l: 'Rate', min: .5, max: 20, step: .1, def: 6, u: 'Hz' }] },
    { id: 'delay', label: 'Delay / ping-pong', params: [{ k: 'mix', def: 0 }, { k: 'time', l: 'Time', min: .04, max: 1, step: .01, def: .3, u: 's' }, { k: 'fb', l: 'Feedback', min: 0, max: .85, step: .01, def: .35 }, { k: 'spread', l: 'Stereo', min: 0, max: 1, step: .05, def: .8 }, { k: 'tone', l: 'Tone', min: 0, max: 1, step: .05, def: .5 }] },
    { id: 'reverb', label: 'Reverb', params: [{ k: 'mix', def: 0 }, { k: 'size', l: 'Size', min: .3, max: 8, step: .1, def: 2, u: 's' }, { k: 'damp', l: 'Damping', min: 0, max: 1, step: .05, def: .5 }, { k: 'shimmer', l: 'Shimmer', min: 0, max: 1, step: .05, def: 0 }] }
  ];
  function fullPreset(p) { const o = {}; FX_SCHEMA.forEach(e => { o[e.id] = {}; e.params.forEach(q => o[e.id][q.k] = q.def); if (p && p[e.id]) Object.assign(o[e.id], p[e.id]); if (e.id === 'filt') o.filt.ftype = (p && p.filt && p.filt.ftype) || 'lowpass'; }); return o; }
  const curve = (n, f) => { const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = f(i * 2 / (n - 1) - 1); return a; };
  const IRC = new WeakMap();
  function irBuffer(ctx, size, damp) {
    let m = IRC.get(ctx); if (!m) IRC.set(ctx, m = {}); const key = size + '|' + damp; if (m[key]) return m[key];
    const sr = ctx.sampleRate, len = Math.floor(size * sr), b = ctx.createBuffer(2, len, sr), R = rng(1234 + Math.round(size * 10));
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let y = 0; for (let i = 0; i < len; i++) { const u = i / len, k = 0.9 - 0.86 * damp * Math.sqrt(u); y += ((R() * 2 - 1) - y) * k; d[i] = y * Math.exp(-6.5 * u) * (i < sr * .012 ? i / (sr * .012) : 1); } }
    return (m[key] = b);
  }
  class FXEngine {
    constructor(ctx) {
      this.ctx = ctx; this.oscs = []; this.timers = []; const co = ctx.createOscillator.bind(ctx); ctx.createOscillator = () => { const o = co(); this.oscs.push(o); return o; };
      this.in = ctx.createGain(); this.out = ctx.createGain(); this.S = {}; let prev = this.in;
      const add = (id, st) => { prev.connect(st.i); prev = st.o; this.S[id] = st; };
      ['pitch', 'dist', 'od', 'crush', 'ring', 'filt', 'phase', 'chorus', 'gate', 'delay', 'reverb'].forEach(id => add(id, this['_' + id]()));
      prev.connect(this.out); this.params = fullPreset(); delete ctx.createOscillator;
    }
    _stage(mode, build) {
      const c = this.ctx, i = c.createGain(), o = c.createGain(), dry = c.createGain(), wet = c.createGain(); i.connect(dry); dry.connect(o); wet.connect(o); wet.gain.value = 0;
      const upd = build(i, wet);
      return { i, o, set: (p) => { const m = clamp(p.mix || 0, 0, 1), t = c.currentTime; dry.gain.setTargetAtTime(mode === 'x' ? 1 - m : 1, t, .02); wet.gain.setTargetAtTime(m, t, .02); upd(p, t); } };
    }
    _pitch() { const c = this.ctx; return this._stage('x', (i, w) => { const d = c.createDelay(.1), l = c.createOscillator(), lg = c.createGain(); d.delayTime.value = .02; l.frequency.value = 4; l.connect(lg); lg.connect(d.delayTime); l.start(); i.connect(d); d.connect(w); return (p, t) => { l.frequency.setTargetAtTime(p.rate, t, .05); lg.gain.setTargetAtTime(p.depth / 1000, t, .05); }; }); }
    _dist() { const c = this.ctx; return this._stage('x', (i, w) => { const pre = c.createGain(), sh = c.createWaveShaper(), post = c.createGain(); sh.oversample = '4x'; post.gain.value = .55; i.connect(pre); pre.connect(sh); sh.connect(post); post.connect(w); let last = -1;
      return (p, t) => { pre.gain.setTargetAtTime(1 + p.amount * .12, t, .03); if (p.amount !== last) { last = p.amount; const a = p.amount; sh.curve = curve(2048, x => clamp(Math.tanh(x * 3) * .6 + Math.sin(x * (2 + a * .05) * Math.PI) * .35, -1, 1)); } }; }); }
    _od() { const c = this.ctx; return this._stage('x', (i, w) => { const pre = c.createGain(), sh = c.createWaveShaper(), post = c.createGain(); sh.oversample = '4x'; post.gain.value = .7; sh.curve = curve(2048, x => Math.tanh(x * 2 + .12) - Math.tanh(.12)); i.connect(pre); pre.connect(sh); sh.connect(post); post.connect(w); return (p, t) => pre.gain.setTargetAtTime(1 + p.amount * .1, t, .03); }); }
    _crush() { const c = this.ctx; return this._stage('x', (i, w) => { const pre = c.createGain(), sh = c.createWaveShaper(), lp = c.createBiquadFilter(), post = c.createGain(); pre.gain.value = 2; post.gain.value = .5; lp.type = 'lowpass'; i.connect(pre); pre.connect(sh); sh.connect(lp); lp.connect(post); post.connect(w); let last = -1;
      return (p, t) => { if (p.bits !== last) { last = p.bits; const L = Math.pow(2, p.bits) / 2; sh.curve = curve(4096, x => Math.round(x * L) / L); lp.frequency.setTargetAtTime(2500 + p.bits * 700, t, .03); } }; }); }
    _ring() { const c = this.ctx; return this._stage('x', (i, w) => { const g = c.createGain(), o = c.createOscillator(), tr = c.createGain(); g.gain.value = 0; tr.gain.value = 1.5; o.frequency.value = 150; o.connect(g.gain); o.start(); i.connect(g); g.connect(tr); tr.connect(w); return (p, t) => o.frequency.setTargetAtTime(p.freq, t, .03); }); }
    _filt() { const c = this.ctx; return this._stage('x', (i, w) => { const f = c.createBiquadFilter(); i.connect(f); f.connect(w); return (p, t) => { f.type = p.ftype || 'lowpass'; f.frequency.setTargetAtTime(p.cutoff, t, .03); f.Q.setTargetAtTime(p.q, t, .03); }; }); }
    _phase() { const c = this.ctx; return this._stage('s', (i, w) => { const aps = [350, 700, 1100, 1700].map(f => { const a = c.createBiquadFilter(); a.type = 'allpass'; a.frequency.value = f; a.Q.value = .7; return a; }), l = c.createOscillator(), lg = c.createGain(); l.frequency.value = .4; l.connect(lg); l.start(); let n = i; aps.forEach((a, k) => { n.connect(a); n = a; lg.connect(a.detune); }); n.connect(w);
      return (p, t) => { l.frequency.setTargetAtTime(p.rate, t, .05); lg.gain.setTargetAtTime(p.depth * 1.6, t, .05); }; }); }
    _chorus() { const c = this.ctx; return this._stage('s', (i, w) => { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = .6; l.connect(lg); l.start(); [[.022, -.6], [.03, .6]].forEach(([b, pan]) => { const d = c.createDelay(.1), pn = c.createStereoPanner(); d.delayTime.value = b; pn.pan.value = pan; lg.connect(d.delayTime); i.connect(d); d.connect(pn); pn.connect(w); });
      return (p, t) => { l.frequency.setTargetAtTime(p.rate, t, .05); lg.gain.setTargetAtTime(p.depth / 1000, t, .05); }; }); }
    _gate() { const c = this.ctx, g = c.createGain(), l = c.createOscillator(), lp = c.createBiquadFilter(), dg = c.createGain(); l.type = 'square'; l.frequency.value = 6; lp.type = 'lowpass'; lp.frequency.value = 160; dg.gain.value = 0; l.connect(lp); lp.connect(dg); dg.connect(g.gain); l.start();
      return { i: g, o: g, set: (p) => { const m = clamp(p.mix || 0, 0, 1), t = c.currentTime; g.gain.setTargetAtTime(1 - m * .5, t, .02); dg.gain.setTargetAtTime(m * .5, t, .02); l.frequency.setTargetAtTime(p.rate, t, .05); } }; }
    _delay() { const c = this.ctx; return this._stage('s', (i, w) => { const dL = c.createDelay(2), dR = c.createDelay(2), lp = c.createBiquadFilter(), f1 = c.createGain(), f2 = c.createGain(), pL = c.createStereoPanner(), pR = c.createStereoPanner(); lp.type = 'lowpass';
      i.connect(dL); dL.connect(lp); lp.connect(f1); f1.connect(dR); dR.connect(f2); f2.connect(dL); dL.connect(pL); dR.connect(pR); pL.connect(w); pR.connect(w);
      return (p, t) => { dL.delayTime.setTargetAtTime(p.time, t, .05); dR.delayTime.setTargetAtTime(p.time, t, .05); f1.gain.setTargetAtTime(p.fb, t, .03); f2.gain.setTargetAtTime(p.fb, t, .03); lp.frequency.setTargetAtTime(400 + p.tone * 9000, t, .03); pL.pan.setTargetAtTime(-p.spread, t, .03); pR.pan.setTargetAtTime(p.spread, t, .03); }; }); }
    _reverb() { const c = this.ctx; return this._stage('s', (i, w) => { const pre = c.createDelay(.1), cv = c.createConvolver(), sh = c.createWaveShaper(), hp = c.createBiquadFilter(), sg = c.createGain(); pre.delayTime.value = .015; sh.curve = curve(1024, Math.abs); hp.type = 'highpass'; hp.frequency.value = 1600; sg.gain.value = 0; i.connect(pre); pre.connect(cv); cv.connect(w); i.connect(sh); sh.connect(hp); hp.connect(sg); sg.connect(pre); let key = '', tm = null;
      return (p, t) => { sg.gain.setTargetAtTime(p.shimmer * 1.4, t, .05); const k = p.size + '|' + p.damp; if (k !== key) { key = k; clearTimeout(tm); const go = () => { try { cv.buffer = irBuffer(c, p.size, p.damp); } catch (e) {} }; if (!cv.buffer) go(); else { tm = setTimeout(go, 120); this.timers.push(tm); } } }; }); }
    dispose() { this.timers.forEach(clearTimeout); this.oscs.forEach(o => { try { o.stop(); } catch (e) {} }); try { this.in.disconnect(); this.out.disconnect(); } catch (e) {} }
    set(all) { this.params = JSON.parse(JSON.stringify(all)); for (const id in this.S) this.S[id].set(this.params[id]); }
    setOne(id, k, v) { this.params[id][k] = v; this.S[id].set(this.params[id]); }
  }

  /* ================= VOCAL SYNTH ================= */
  const CHARS = {
    frog: { fs: 1, nasal: .8, breath: .05, bright: 4200, detune: 9, rough: 0, o2: .35 }, smooth: { fs: 1, nasal: .15, breath: .03, bright: 3600, detune: 5, rough: 0, o2: .25 },
    deep: { fs: .8, nasal: .1, breath: .06, bright: 2800, detune: 6, rough: .04, o2: .3 }, raspy: { fs: .95, nasal: .4, breath: .16, bright: 5200, detune: 12, rough: .22, o2: .45 },
    robot: { fs: 1, nasal: .3, breath: .01, bright: 6500, detune: 0, rough: 0, o2: .5, flat: 1 }, alien: { fs: 1.18, nasal: .95, breath: .05, bright: 5200, detune: 16, rough: .05, o2: .45 }
  };
  const CONS = { s: ['f', 7200, 1.2, .085, .5], z: ['f', 6500, 1.2, .06, .3], f: ['f', 5000, .8, .06, .3], v: ['f', 4500, .8, .05, .2], sh: ['f', 3600, 1.4, .09, .45], ch: ['f', 3800, 1.4, .07, .5], th: ['f', 5200, .6, .05, .2], h: ['f', 1800, .7, .06, .35], j: ['f', 3000, 1.2, .05, .3],
    t: ['s', 4200, 1.5, .03, .5], d: ['s', 3000, 1.2, .025, .3], k: ['s', 2200, 1.5, .035, .5], c: ['s', 2200, 1.5, .035, .5], g: ['s', 1800, 1.2, .03, .3], p: ['s', 1100, 1, .03, .4], b: ['s', 900, 1, .028, .25], q: ['s', 2200, 1.5, .035, .5], x: ['s', 3500, 1.5, .04, .4],
    m: ['n', 250, 1000, 2200], n: ['n', 250, 1400, 2400], l: ['g', 350, 1100, 2700], r: ['g', 350, 1250, 1650], w: ['g', 300, 610, 2200], y: ['g', 270, 2100, 3000] };
  function firstCons(on) { if (!on) return null; const d = ['sh', 'ch', 'th'].find(x => on.startsWith(x)); if (d) return d; if (on.startsWith('ph')) return 'f'; if (on.startsWith('wh')) return 'w'; if (on.startsWith('kn') || on.startsWith('gn')) return 'n'; if (on.startsWith('wr')) return 'r'; return on[0]; }

  class Voice {
    constructor(ctx, dest, noiseBuf, name) {
      this.ctx = ctx; this.name = name; this.noiseBuf = noiseBuf; this.live = new Set(); this.cfg = {};
      const mk = (t) => ctx[t]();
      const re = new Float32Array(48), im = new Float32Array(48); for (let n = 1; n < 48; n++) im[n] = 1 / Math.pow(n, 1.5);
      this.o1 = mk('createOscillator'); this.o1.setPeriodicWave(ctx.createPeriodicWave(re, im)); this.o2 = mk('createOscillator'); this.o2.type = 'sawtooth';
      this.g1 = mk('createGain'); this.g2 = mk('createGain'); this.src = mk('createGain'); this.bright = mk('createBiquadFilter'); this.bright.type = 'lowpass'; this.formIn = mk('createGain');
      this.o1.connect(this.g1); this.o2.connect(this.g2); this.g1.connect(this.src); this.g2.connect(this.src); this.src.connect(this.bright); this.bright.connect(this.formIn);
      this.vib = mk('createOscillator'); this.vibG = mk('createGain'); this.vib.connect(this.vibG); this.vibG.connect(this.o1.detune); this.vibG.connect(this.o2.detune); this.vibG.gain.value = 0;
      this.nz = mk('createBufferSource'); this.nz.buffer = noiseBuf; this.nz.loop = true; this.nzG = mk('createGain'); this.nzG.gain.value = 0; this.nz.connect(this.nzG); this.nzG.connect(this.formIn);
      this.fm = mk('createOscillator'); this.fm.frequency.value = 3.1; this.formSum = mk('createGain'); this.fs = [];
      [[1, 5], [.8, 6], [.5, 8], [.3, 9]].forEach(([gn, q], k) => { const f = mk('createBiquadFilter'), g = mk('createGain'), mg = mk('createGain'); f.type = 'bandpass'; f.Q.value = q; g.gain.value = gn * 1.4; mg.gain.value = 0; this.formIn.connect(f); f.connect(g); g.connect(this.formSum); this.fm.connect(mg); mg.connect(f.frequency); this.fs.push({ f, mg }); });
      this.nas = mk('createBiquadFilter'); this.nas.type = 'peaking'; this.nas.frequency.value = 1000; this.nas.Q.value = 1.6; this.nas2 = mk('createBiquadFilter'); this.nas2.type = 'peaking'; this.nas2.frequency.value = 2700; this.nas2.Q.value = 2;
      this.amp = mk('createGain'); this.amp.gain.value = 0; this.rl = mk('createOscillator'); this.rl.frequency.value = 72; this.rlG = mk('createGain'); this.rlG.gain.value = 0; this.trem = mk('createGain'); this.rl.connect(this.rlG); this.rlG.connect(this.trem.gain);
      this.formSum.connect(this.nas); this.nas.connect(this.nas2); this.nas2.connect(this.amp);
      this.cons = mk('createGain'); this.out = mk('createGain'); this.pan = mk('createStereoPanner');
      this.dry = mk('createGain'); this.wet = mk('createGain'); this.ringG = mk('createGain'); this.ringG.gain.value = 0; this.ro = mk('createOscillator'); this.ro.frequency.value = 180; this.ro.connect(this.ringG.gain); this.wet.gain.value = 0;
      this.amp.connect(this.trem); this.trem.connect(this.dry); this.trem.connect(this.ringG); this.ringG.connect(this.wet); this.cons.connect(this.dry); this.dry.connect(this.out); this.wet.connect(this.out); this.out.connect(this.pan); this.pan.connect(dest);
      [this.o1, this.o2, this.vib, this.nz, this.fm, this.rl, this.ro].forEach(o => o.start());
    }
    configure(c) { // c: {character, vibRate, vibDepth, detune, formantMod, ring, vol, pan, pitch(semis), scoop}
      const ch = CHARS[c.character] || CHARS.frog, t = this.ctx.currentTime; this.cfg = Object.assign({}, c, { ch });
      this.fshift = ch.fs * Math.pow(2, (c.pitch || 0) / 24);
      this.o2.detune.setValueAtTime(ch.detune + (c.detune || 0), t); this.g2.gain.setValueAtTime(ch.o2, t); this.bright.frequency.setValueAtTime(ch.bright, t);
      this.nas.gain.setValueAtTime(ch.nasal * 9, t); this.nas2.gain.setValueAtTime(ch.nasal * 5, t); this.rlG.gain.setValueAtTime(ch.rough, t);
      this.vib.frequency.setValueAtTime(c.vibRate || 5.5, t); this.out.gain.setTargetAtTime(c.vol == null ? 1 : c.vol, t, .02); this.pan.pan.setTargetAtTime(c.pan || 0, t, .02);
      const rm = clamp(c.ring || 0, 0, 1); this.dry.gain.setTargetAtTime(1 - rm * .6, t, .02); this.wet.gain.setTargetAtTime(rm * 1.6, t, .02);
    }
    _noise(t, f, q, d, g) { const c = this.ctx, s = c.createBufferSource(), bp = c.createBiquadFilter(), gg = c.createGain(); s.buffer = this.noiseBuf; s.loop = true; bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
      gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(g, t + Math.min(.008, d / 3)); gg.gain.linearRampToValueAtTime(0, t + d); s.connect(bp); bp.connect(gg); gg.connect(this.cons); s.start(t, Math.random()); s.stop(t + d + .02);
      this.live.add(s); s.onended = () => { this.live.delete(s); try { s.disconnect(); bp.disconnect(); gg.disconnect(); } catch (e) {} }; }
    note(n, t0, base) { // n: {t, sec, midi, syl, vib, scoop, gate, vel, glideFrom, whisper, detune}
      const c = this.ctx, C = this.cfg, ch = C.ch, t = t0 + n.t, dur = Math.max(.06, n.sec), s = n.syl, vel = (n.vel || 1) * (C.gain || .5);
      const f = mtof(n.midi + (C.pitch || 0)); let start = f;
      const sc = n.scoop ? (C.scoop || 0) : 0; if (n.glideFrom != null && !ch.flat) start = mtof(n.glideFrom + (C.pitch || 0)); else if (sc) start = f * Math.pow(2, -sc / 1200);
      const gl = ch.flat ? .004 : clamp(Math.min(.09, dur * .3), .01, .09);
      [this.o1.frequency, this.o2.frequency].forEach(p => { p.setValueAtTime(start, t); p.exponentialRampToValueAtTime(f, t + gl + (sc ? .05 : 0)); });
      // consonant
      const cs = firstCons(s.onset), cd = CONS[cs]; let onT = 0, startF = null;
      if (cd) { if (cd[0] === 'f') { this._noise(t, cd[1], cd[2], cd[3] * Math.min(1.4, dur / .2 + .4), cd[4] * vel * 2); onT = cd[3] * .75; if (cs === 'ch' || cs === 'j') this._noise(t, 2500, 1, .02, .4 * vel); }
        else if (cd[0] === 's') { this._noise(t, cd[1], cd[2], cd[3], cd[4] * vel * 2.2); onT = cd[3] + .012; }
        else { onT = .05; startF = [cd[1], cd[2], cd[3]]; } }
      // amplitude
      const tv = t + onT, tEnd = t + dur * (n.gate || .95), pk = vel * 1.0, A = this.amp.gain;
      A.setValueAtTime(0.0001, t); if (cd && cd[0] === 'n') { A.linearRampToValueAtTime(pk * .35, t + .02); A.linearRampToValueAtTime(pk * .35, t + .05); } A.linearRampToValueAtTime(pk, tv + .025); A.setTargetAtTime(pk * .82, tv + .05, .12); A.setTargetAtTime(0, Math.max(tv + .06, tEnd - .035), .03);
      // source / whisper
      const whisper = !!n.whisper; this.src.gain.setValueAtTime(whisper ? .03 : 1, t); this.nzG.gain.setValueAtTime(whisper ? .9 : ch.breath, t);
      // vibrato
      const vd = n.vib && C.vibDepth ? C.vibDepth : 0; this.vibG.gain.setValueAtTime(0, t); if (vd) { this.vibG.gain.setValueAtTime(0, t + .12); this.vibG.gain.linearRampToValueAtTime(vd, t + Math.max(.25, dur * .45)); this.vibG.gain.setTargetAtTime(0, tEnd, .03); }
      // formants
      const v1 = VF[s.v[0]] || VF.UH, v2 = s.v[1] ? VF[s.v[1]] : null, sh = this.fshift, fmod = C.formantMod || 0;
      this.fs.forEach((o, i) => { const tgt = v1[i] * sh; const st = startF && i < 3 ? startF[i] * sh : tgt; o.f.frequency.setValueAtTime(st, t); o.f.frequency.setTargetAtTime(tgt, t + (startF ? .03 : .005), .025);
        if (v2) o.f.frequency.setTargetAtTime(v2[i] * sh, t + dur * .55, .07);
        if (/^[mn]/.test(s.coda) && dur > .15) { const nf = [260, 1100, 2300, 3300][i]; o.f.frequency.setTargetAtTime(nf, tEnd - .07, .03); }
        o.mg.gain.setValueAtTime(tgt * fmod, t); });
      // coda release burst
      const cc = (s.coda || '').replace(/^gh/, '').slice(-1), cdd = CONS[cc]; if (cdd && cdd[0] !== 'n' && cdd[0] !== 'g' && dur > .12) this._noise(tEnd - .03, cdd[1], cdd[2], Math.min(.07, cdd[3]), cdd[4] * vel * 1.4);
    }
    stop() { const t = this.ctx.currentTime;
      [this.amp.gain, this.vibG.gain, this.nzG.gain, this.src.gain, this.o1.frequency, this.o2.frequency, ...this.fs.map(o => o.f.frequency), ...this.fs.map(o => o.mg.gain)].forEach(p => { try { p.cancelScheduledValues(t); } catch (e) {} });
      this.amp.gain.setValueAtTime(this.amp.gain.value, t); this.amp.gain.setTargetAtTime(0, t, .012); this.vibG.gain.setValueAtTime(0, t); this.nzG.gain.setValueAtTime(0, t);
      this.live.forEach(s => { try { s.stop(); } catch (e) {} }); this.live.clear(); }
    dispose() { this.stop(); [this.o1, this.o2, this.vib, this.nz, this.fm, this.rl, this.ro].forEach(o => { try { o.stop(); } catch (e) {} }); this.out.disconnect(); }
  }

  /* ================= SFX recipes (all run through the costume FX chain) ================= */
  const SFX = {
    chomp: [['n', 900, 2, .08, .5, 0], ['t', 'sine', 220, 110, .1, .35, .03]], whoosh: [['n', 3000, 1.2, .5, .35, 0, 300], ['t', 'sawtooth', 100, 700, .45, .15, 0]],
    sparkle: [1200, 1600, 2000, 2600, 3200].map((f, i) => ['t', 'sine', f, f, .14, .12, i * .07]), screech: [['t', 'sawtooth', 900, 2600, .2, .22, 0], ['t', 'sawtooth', 2600, 700, .22, .22, .2], ['n', 5000, 1, .4, .25, 0]],
    drone: [['t', 'sawtooth', 55, 52, 1.1, .3, 0], ['t', 'sawtooth', 82.5, 80, 1.1, .15, 0]], blip: [0, .09].map(d => ['t', 'square', 800, 1200, .05, .15, d]), fanfare: [[392, 0, .12], [523, .13, .12], [659, .26, .32]].map(([f, d, l]) => ['t', 'sawtooth', f, f, l, .2, d]),
    powerchord: [[110, 0], [165, 0], [220, 0]].map(([f]) => ['t', 'sawtooth', f, f, .5, .18, 0]), zap: [['t', 'sawtooth', 2000, 100, .22, .25, 0], ['n', 6000, 1, .12, .3, 0]], bloop: [['t', 'sine', 300, 700, .14, .35, 0]], hiss: [['n', 4500, .8, .6, .3, 0]], beep: [0, .1, .2].map(d => ['t', 'square', 1000, 1000, .06, .15, d])
  };

  /* ================= PipAudio facade ================= */
  const opts_offline = (c) => typeof OfflineAudioContext !== 'undefined' && c instanceof OfflineAudioContext;
  class PipAudio {
    constructor(opts = {}) { this.ctx = opts.ctx || null; this.ready = false; this.soundOn = true; this.mouth = []; this.songEnd = 0; this.active = false; this.live = new Set(); this.preset = fullPreset(); this.lastPlan = null; this.failed = false; }
    ensure() {
      if (this.ready) { if (this.ctx.state === 'suspended' && this.ctx.resume && !this.offline) this.ctx.resume(); return true; }
      if (this.failed) return false;
      try {
        const AC = window.AudioContext || window.webkitAudioContext; const c = this.ctx = this.ctx || new AC();
        const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = nb.getChannelData(0), R = rng(99); for (let i = 0; i < d.length; i++) d[i] = R() * 2 - 1; this.noiseBuf = nb;
        this.fx = new FXEngine(c); this.comp = c.createDynamicsCompressor(); this.comp.threshold.value = -14; this.comp.knee.value = 8; this.comp.ratio.value = 10; this.comp.attack.value = .003; this.comp.release.value = .2;
        this.master = c.createGain(); this.master.gain.value = this.soundOn ? .9 : 0; this.analyser = c.createAnalyser(); this.analyser.fftSize = 512;
        this.fx.out.connect(this.comp); this.comp.connect(this.master); this.master.connect(c.destination); this.master.connect(this.analyser);
        this.main = new Voice(c, this.fx.in, nb, 'main'); this.harm = new Voice(c, this.fx.in, nb, 'harm'); this.fx.set(this.preset); this.ready = true;
        if (c.resume && c.state === 'suspended' && !opts_offline(c)) c.resume();
        return true;
      } catch (e) { console.warn('Pip: Web Audio unavailable', e); this.failed = true; return false; }
    }
    now() { return this.ctx && this.ready ? this.ctx.currentTime : performance.now() / 1000; }
    setPreset(p) { this.preset = fullPreset(p); if (this.ready) this.fx.set(this.preset); }
    setFx(id, k, v) { this.preset[id][k] = v; if (this.ready) this.fx.setOne(id, k, v); }
    setSound(on) { this.soundOn = on; if (this.ready) this.master.gain.setTargetAtTime(on ? .9 : 0, this.ctx.currentTime, .02); if (!on) this.stop(); }
    voiceCfgs(S) {
      return [{ character: S.character, vibRate: S.vibRate, vibDepth: S.vibrato, detune: 0, formantMod: 0, ring: 0, vol: S.mainVol, pan: S.harmOn ? -.15 : 0, pitch: S.pitch, scoop: S.scoop, gain: .5 },
        { character: S.hCharacter, vibRate: S.hVibRate, vibDepth: S.hVibrato, detune: S.hDetune, formantMod: S.hFormantMod, ring: S.hRing, vol: S.hVol, pan: .15, pitch: S.pitch, scoop: S.scoop, gain: .5 }];
    }
    play(plan, S, withHarm, kind) {
      const t0 = this.now() + .1; this.mouth = []; this.active = true; this.songEnd = t0 + plan.total;
      const [cm, ch] = this.voiceCfgs(S); if (kind === 'speak') { cm.vibDepth = 0; ch.vibDepth = 0; cm.scoop = 0; ch.scoop = 0; }
      const hn = withHarm ? Harmony.transform(plan.notes, S.hInterval, S.hDetune) : null;
      if (this.soundOn && this.ready) { this.main.configure(cm); plan.notes.forEach(n => this.main.note(n, t0)); if (hn) { this.harm.configure(ch); hn.forEach(n => this.harm.note(n, t0)); } }
      plan.notes.forEach(n => { const s = n.syl, v1 = VIS[s.v[0]] || VIS.UH, v2 = s.v[1] ? VIS[s.v[1]] : null; this.mouth.push({ t: t0 + n.t, dur: n.sec * (n.gate || .95), v1, v2, lab: /^[mbp]/.test(s.onset || ''), vel: n.vel || 1, midi: n.midi }); });
      return { start: t0, end: this.songEnd };
    }
    mouthAt(now) {
      if (!this.active) return null; let best = null, bo = -1;
      for (const e of this.mouth) { if (now < e.t) break; const s = now - e.t; if (s > e.dur + .08) continue; const a = Math.min(1, s / .04), r = s > e.dur ? 1 - (s - e.dur) / .08 : 1, env = a * r; let v = e.v2 && s > e.dur * .55 ? e.v2 : e.v1; let o = v.open * env * (.8 + .2 * e.vel); if (e.lab && s < .06) o *= .12; if (o > bo) { bo = o; best = { open: o, wide: v.wide }; } }
      return best || { open: 0.02, wide: 1 };
    }
    noteAt(now) { for (const e of this.mouth) if (now >= e.t && now < e.t + e.dur) return e; return null; }
    isPlaying(now) { return this.active && now < this.songEnd + .1; }
    stop() { this.active = false; this.mouth = []; this.songEnd = 0; if (!this.ready) return; this.main.stop(); this.harm.stop(); this.live.forEach(s => { try { s.stop(); } catch (e) {} }); this.live.clear(); this.flushFx(); }
    /* swap in a fresh FX chain so reverb/delay tails are cut instantly on Stop (old chain is disposed — no leaks) */
    flushFx() { const old = this.fx, c = this.ctx, n = new FXEngine(c); n.set(this.preset); n.out.connect(this.comp);
      [this.main, this.harm].forEach(v => { v.pan.disconnect(); v.pan.connect(n.in); }); this.fx = n; old.out.gain.setTargetAtTime(0, c.currentTime, .004); setTimeout(() => old.dispose(), 80); }
    /* one-shot sounds through the FX chain */
    _tone(type, f0, f1, dur, g, at, extra = {}) { const c = this.ctx, t = c.currentTime + .02 + at, o = c.createOscillator(), gg = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(g, t + .01); gg.gain.setTargetAtTime(0, t + dur * .6, dur * .18);
      let n = o; if (extra.bp) { const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = extra.bp; b.Q.value = 1.2; o.connect(b); n = b; } if (extra.am) { const l = c.createOscillator(), lg = c.createGain(), mg = c.createGain(); mg.gain.value = .5; l.type = 'square'; l.frequency.value = extra.am; lg.gain.value = .5; l.connect(lg); lg.connect(mg.gain); n.connect(mg); n = mg; l.start(t); l.stop(t + dur + .1); this.live.add(l); }
      n.connect(gg); gg.connect(this.fx.in); o.start(t); o.stop(t + dur + .15); this.live.add(o); o.onended = () => { this.live.delete(o); try { gg.disconnect(); } catch (e) {} }; }
    _burst(f, q, dur, g, at, sweep) { const c = this.ctx, t = c.currentTime + .02 + at, s = c.createBufferSource(), b = c.createBiquadFilter(), gg = c.createGain(); s.buffer = this.noiseBuf; s.loop = true; b.type = 'bandpass'; b.frequency.setValueAtTime(f, t); if (sweep) b.frequency.exponentialRampToValueAtTime(sweep, t + dur); b.Q.value = q; gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(g, t + .01); gg.gain.linearRampToValueAtTime(0, t + dur); s.connect(b); b.connect(gg); gg.connect(this.fx.in); s.start(t); s.stop(t + dur + .05); this.live.add(s); s.onended = () => { this.live.delete(s); try { gg.disconnect(); } catch (e) {} }; }
    sfx(name) { if (!this.soundOn || !this.ensure()) return; (SFX[name] || []).forEach(r => { if (r[0] === 'n') this._burst(r[1], r[2], r[3], r[4], r[5], r[6]); else this._tone(r[1], r[2], r[3], r[4], r[5], r[6]); }); }
    ribbit(C) { if (!this.soundOn || !this.ensure()) return; const r = C.ribbit; for (let i = 0; i < r.count; i++) { const k = i / Math.max(1, r.count - 1); this._tone(r.wave, r.f0 * (1 + k * .25), r.f1 * (1 + k * .15), r.dur * (i === r.count - 1 ? 1.4 : 1), r.level, i * r.gap, { bp: r.bp, am: r.am || 0 }); } }
    laugh(C, S) { if (!this.ensure()) return null; this.stop(); const L = C.laugh, R = P.COSTUMES; const [lo, hi] = RANGES[S.range] || RANGES.mid, base = lo + (hi - lo) * .5 + (L.pitch || 0); const notes = []; let t = 0;
      for (let i = 0; i < L.count; i++) { notes.push({ t, sec: L.dur, midi: base + L.notes[i % L.notes.length], syl: { onset: 'h', nuc: 'a', coda: '', v: [L.vowel || 'AH'], text: 'ha' }, vib: false, scoop: 0, gate: .8, vel: 1 - i * .05 }); t += L.dur + L.gap; }
      const plan = { notes, total: t + .2 }; const h = S.harmOn; return this.play(plan, Object.assign({}, S, { vibrato: 0 }), h, 'speak'); }
  }
  P.Audio = PipAudio; P.Melody = Melody; P.Harmony = Harmony; P.syllabify = syllabify; P.FX_SCHEMA = FX_SCHEMA; P.fullPreset = fullPreset; P.CHARS = CHARS; P.SCALES = SCALES; P.KEYS = KEYS;
})(window.Pip = window.Pip || {});
