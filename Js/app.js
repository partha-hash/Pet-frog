/* PIP — application controller: UI wiring, costume manager, interaction controller, main loop. */
(function (P) {
  const $ = (id) => document.getElementById(id), rand = (a, b) => a + Math.random() * (b - a), pick = (a) => a[Math.floor(Math.random() * a.length)];
  const COST = P.COSTUMES; let ci = 0, C = COST[0];
  const audio = new P.Audio(), stage = $('frogMount'), char = new P.PipCharacter(stage, { prefix: 'main', interactive: true });
  let fullness = 80, mood = 'stoned', soundOn = true, singing = false, speakingTTS = false, lastNote = null, lastAct = performance.now(), morphT = null;
  const moodNames = { stoned: 'STONED', happy: 'HAPPY', laughing: 'LAUGHING', crying: 'CRYING', smug: 'SMUG', angry: 'ANGRY', shocked: 'SHOCKED', sleepy: 'SLEEPY', love: 'IN LOVE', cool: 'COOL', thinking: 'THINKING', queasy: 'QUEASY' };
  const moodGlyph = { stoned: '◡', happy: '☺', laughing: '☻', crying: '◠', smug: '⌣', angry: '⌁', shocked: '○', sleepy: 'zZ', love: '♥', cool: '▰', thinking: '?', queasy: '〰' };
  const S = {}; const ui = {}; let fxState = P.fullPreset(C.fx), bypass = {};

  function toast(m) { const el = $('toast'); el.textContent = m; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2200); }
  const touch = () => { lastAct = performance.now(); };

  /* ---------- UI builders ---------- */
  function slider(parent, key, label, min, max, step, fmt, onSet) {
    const d = document.createElement('div'); d.className = 'setting'; d.innerHTML = `<label for="c-${key}">${label} <strong id="v-${key}"></strong></label><input type="range" id="c-${key}" min="${min}" max="${max}" step="${step}">`; parent.appendChild(d);
    const inp = d.querySelector('input'), out = d.querySelector('strong'); const show = () => out.textContent = fmt ? fmt(+inp.value) : inp.value;
    inp.addEventListener('input', () => { S[key] = +inp.value; show(); if (onSet) onSet(S[key]); }); ui[key] = { set(v) { inp.value = v; S[key] = +v; show(); } };
  }
  function select(parent, key, label, opts, onSet) {
    const d = document.createElement('div'); d.className = 'setting'; d.innerHTML = `<label for="c-${key}">${label}</label><select id="c-${key}">${opts.map(o => `<option value="${o[0]}">${o[1]}</option>`).join('')}</select>`; parent.appendChild(d);
    const s = d.querySelector('select'); s.addEventListener('change', () => { S[key] = isNaN(+s.value) || s.value === '' ? s.value : +s.value; if (onSet) onSet(S[key]); }); ui[key] = { set(v) { s.value = v; S[key] = isNaN(+s.value) ? s.value : +s.value; } };
  }
  function check(parent, key, label) {
    const d = document.createElement('div'); d.className = 'setting'; d.innerHTML = `<label class="toggle-row"><input type="checkbox" id="c-${key}"><span class="toggle"></span><span>${label}</span></label>`; parent.appendChild(d);
    const i = d.querySelector('input'); i.addEventListener('change', () => S[key] = i.checked); ui[key] = { set(v) { i.checked = !!v; S[key] = !!v; } };
  }
  const charOpts = [['frog', 'Frog (nasal, goofy)'], ['smooth', 'Smooth'], ['deep', 'Deep'], ['raspy', 'Raspy'], ['robot', 'Robot'], ['alien', 'Alien']];
  function buildStudio() {
    const m = $('tab-melody'), v = $('tab-voice'), h = $('tab-harmony');
    slider(m, 'bpm', 'TEMPO', 60, 160, 1, x => x + ' BPM'); select(m, 'key', 'KEY', P.KEYS.map(k => [k, k]));
    select(m, 'scale', 'SCALE / MODE', Object.keys(P.SCALES).map(k => [k, k])); select(m, 'range', 'VOCAL RANGE', [['low', 'Low'], ['mid', 'Mid'], ['high', 'High'], ['wide', 'Wide']]);
    slider(m, 'complexity', 'MELODY COMPLEXITY', 0, 1, .05, x => Math.round(x * 100) + '%');
    select(v, 'character', 'VOICE CHARACTER', charOpts); slider(v, 'pitch', 'VOICE PITCH', -12, 12, 1, x => (x > 0 ? '+' : '') + x + ' st'); slider(v, 'vibrato', 'VIBRATO DEPTH', 0, 90, 1, x => x + ' ¢');
    slider(v, 'vibRate', 'VIBRATO RATE', 0, 9, .1, x => x.toFixed(1) + ' Hz'); slider(v, 'scoop', 'GLIDE / SCOOP', 0, 200, 5, x => x + ' ¢'); slider(v, 'mainVol', 'MAIN VOLUME', 0, 1, .01, x => Math.round(x * 100) + '%');
    check(h, 'harmOn', 'Harmony voice on'); select(h, 'hInterval', 'INTERVAL', Object.entries(P.Harmony.INTERVALS).map(([k, x]) => [x, k])); slider(h, 'hVol', 'HARMONY VOLUME', 0, 1, .01, x => Math.round(x * 100) + '%');
    slider(h, 'hDetune', 'DETUNE', -50, 50, 1, x => x + ' ¢'); select(h, 'hCharacter', 'HARMONY CHARACTER', charOpts); slider(h, 'hVibrato', 'HARMONY VIBRATO', 0, 90, 1, x => x + ' ¢'); slider(h, 'hVibRate', 'VIBRATO RATE', 0, 9, .1, x => x.toFixed(1) + ' Hz');
    slider(h, 'hFormantMod', 'FORMANT MOD', 0, .4, .01, x => Math.round(x * 100) + '%'); slider(h, 'hRing', 'RING MOD', 0, 1, .01, x => Math.round(x * 100) + '%');
    document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === b)); document.querySelectorAll('.tab-body').forEach(x => x.hidden = x.id !== 'tab-' + b.dataset.tab); }));
    ui.bpm.set(92); ui.key.set('C'); ui.scale.set('major'); ui.complexity.set(.45); ui.mainVol.set(.9);
  }
  function applyCostumeVoice() {
    const sg = C.sing, hm = C.harmony; ui.range.set(sg.range); ui.character.set(sg.character); ui.pitch.set(0); ui.vibrato.set(sg.vibDepth); ui.vibRate.set(sg.vibRate); ui.scoop.set(sg.scoop);
    ui.harmOn.set(hm.on); ui.hInterval.set(hm.interval); ui.hVol.set(hm.vol); ui.hDetune.set(hm.detune); ui.hCharacter.set(hm.character); ui.hVibrato.set(hm.vibDepth); ui.hVibRate.set(hm.vibRate); ui.hFormantMod.set(hm.formantMod); ui.hRing.set(hm.ring);
  }

  /* ---------- FX panel ---------- */
  const fxCtl = {};
  function effective() { const o = JSON.parse(JSON.stringify(fxState)); for (const id in bypass) if (bypass[id]) o[id].mix = 0; return o; }
  function pushFx() { audio.setPreset(effective()); }
  function buildFx() {
    const g = $('fxGrid'); g.innerHTML = '';
    P.FX_SCHEMA.forEach(e => {
      const d = document.createElement('div'); d.className = 'fx-row'; d.innerHTML = `<div class="fx-title"><label class="toggle-row"><input type="checkbox" data-fx="${e.id}" checked><span class="toggle"></span><span>${e.label.toUpperCase()}</span></label></div>`; g.appendChild(d); fxCtl[e.id] = {};
      e.params.forEach(q => {
        const k = q.k, r = document.createElement('div'); r.className = 'setting'; const lab = k === 'mix' ? 'MIX' : q.l.toUpperCase();
        r.innerHTML = `<label>${lab} <strong></strong></label><input type="range" min="${k === 'mix' ? 0 : q.min}" max="${k === 'mix' ? 1 : q.max}" step="${k === 'mix' ? .01 : q.step}">`; d.appendChild(r);
        const inp = r.querySelector('input'), out = r.querySelector('strong'), u = q.u || ''; const show = () => out.textContent = k === 'mix' ? Math.round(inp.value * 100) + '%' : (+inp.value).toFixed(q.step < 1 ? (q.step < .1 ? 2 : 1) : 0) + u;
        inp.addEventListener('input', () => { fxState[e.id][k] = +inp.value; show(); if (!(bypass[e.id] && k === 'mix')) audio.setFx(e.id, k, +inp.value); }); fxCtl[e.id][k] = { set(v) { inp.value = v; show(); } };
      });
      d.querySelector('input[data-fx]').addEventListener('change', (ev) => { bypass[e.id] = !ev.target.checked; d.classList.toggle('off', bypass[e.id]); audio.setFx(e.id, 'mix', bypass[e.id] ? 0 : fxState[e.id].mix); });
    });
  }
  function syncFxUI() { P.FX_SCHEMA.forEach(e => { e.params.forEach(q => fxCtl[e.id][q.k].set(fxState[e.id][q.k])); const row = $('fxGrid').children[P.FX_SCHEMA.indexOf(e)]; row.querySelector('input[data-fx]').checked = !bypass[e.id]; row.classList.toggle('off', !!bypass[e.id]); }); $('fxName').textContent = 'PRESET: ' + C.name.toUpperCase(); }

  /* ---------- costume manager ---------- */
  function buildWardrobe() {
    const g = $('costumeGrid'); g.innerHTML = '';
    COST.forEach((c, i) => { const b = document.createElement('button'); b.className = 'costume-card'; b.dataset.i = i; b.style.setProperty('--acc', c.accent);
      b.innerHTML = `<div class="cprev"></div><b>${c.name}</b><small>${c.tagline}</small><i class="cdot"></i>`; g.appendChild(b);
      const pv = new P.PipCharacter(b.querySelector('.cprev'), { prefix: 'pv' + i }); pv.mood = 'happy'; pv.setCostume(c); pv.render(0); pv.render(.5);
      b.addEventListener('click', () => { touch(); setCostume(i, true); }); });
  }
  function setCostume(i, anim) {
    clearTimeout(morphT); const apply = () => {
      ci = (i + COST.length) % COST.length; C = COST[ci]; stopAll(true); char.setCostume(C); char.render(0);
      document.documentElement.style.setProperty('--accent', C.accent); $('topCostume').textContent = C.name.toUpperCase(); $('persona').textContent = C.tagline.toUpperCase();
      document.querySelectorAll('.costume-card').forEach((b, k) => b.classList.toggle('active', k === ci));
      fxState = P.fullPreset(C.fx); bypass = {}; syncFxUI(); pushFx(); applyCostumeVoice(); buildExprChips();
    };
    if (!anim || !char.costume) { apply(); return; }
    const sm = matchMedia('(prefers-reduced-motion: reduce)').matches; stage.classList.remove('morph'); void stage.offsetWidth; $('poof').classList.remove('go'); void $('poof').offsetWidth;
    if (!sm) { stage.classList.add('morph'); $('poof').classList.add('go'); }
    if (soundOn && audio.ensure()) audio.sfx(COST[(i + COST.length) % COST.length].sfx.transform);
    morphT = setTimeout(() => { apply(); toast('Pip is now: ' + C.name); }, sm ? 0 : 330);
  }
  function buildExprChips() { const r = $('exprRow'); r.innerHTML = ''; C.expressions.forEach(e => { const b = document.createElement('button'); b.className = 'chip'; b.textContent = e.label; b.addEventListener('click', () => { touch(); doExpr(e); }); r.appendChild(b); }); }

  /* ---------- mood / expressions / sound actions ---------- */
  function setMood(m) { if (!P.MOODS[m]) return; mood = m; char.setMood(m); $('moodLabel').textContent = moodNames[m]; document.querySelectorAll('.mood-btn').forEach(b => b.classList.toggle('active', b.dataset.mood === m)); }
  function buildMoods() { const g = $('moodGrid'); P.MOOD_NAMES.forEach(m => { const b = document.createElement('button'); b.className = 'mood-btn'; b.dataset.mood = m; b.innerHTML = `<span class="mood-face">${moodGlyph[m]}</span><b>${m === 'love' ? 'In love' : m[0].toUpperCase() + m.slice(1)}</b>`; b.addEventListener('click', () => { touch(); setMood(m); ribbit(); }); g.appendChild(b); }); }
  function ribbit() { if (soundOn && audio.ensure()) audio.ribbit(C); }
  function doExpr(e) {
    char.express(e); if (e.laugh) laugh(); else if (e.whisper) whisperLine(); else if (e.sfx === 'ribbit') ribbit(); else if (e.sfx && soundOn && audio.ensure()) audio.sfx(e.sfx);
  }
  function startPlay(r) { if (!r) return; singing = true; $('stopBtn').disabled = false; $('singBtn').disabled = true; $('viz').classList.add('on'); }
  function laugh() { if (!audio.ensure() && !audio.failed) return; const ctxOk = audio.ready; if (!ctxOk) { char.express({ p: { smile: 1, open: .6, lid: .4 }, dur: 1.6, laugh: true }); return; } stopSpeech(); pushVoice();
    const r = audio.laugh(C, Object.assign({}, S)); char.express({ p: { smile: 1, open: .5, lid: .4, lidLow: .5, headRot: 6, shake: .6 }, dur: r ? r.end - r.start + .2 : 1.6, laugh: true }); startPlay(r); }
  function pushVoice() { audio.setPreset(effective()); }
  function sayText() {
    const text = $('wordsInput').value.trim(); if (!text) { toast('Pip needs something to say.'); return; }
    setMood('thinking'); ribbit(); $('voiceNote').textContent = 'Pip says: “' + text.slice(0, 70) + (text.length > 70 ? '…' : '') + '”';
    stopAll(); const syl = P.syllabify(text);
    if (!$('speechToggle').checked || !soundOn) { char.speechFlap = true; setTimeout(() => char.speechFlap = false, Math.min(5000, text.length * 55)); return; }
    if ($('speakEngine').value === 'browser' || !audio.ensure()) { speakTTS(text); return; }
    const sp = C.speak, plan = P.Melody.speech(syl, C, sp.rate * (S.speakRate || 1)); const sv = Object.assign({}, S, { character: sp.character, pitch: 0, vibrato: 0, scoop: 0 });
    const r = audio.play(plan, sv, !!(sp.harmony && S.harmOn), 'speak'); startPlay(r); char.pulse(.2);
  }
  function whisperLine() { if (!soundOn || !audio.ensure()) return; stopSpeech(); const syl = P.syllabify('hush now little one'), plan = P.Melody.speech(syl, C, .7); plan.notes.forEach(n => n.whisper = true); startPlay(audio.play(plan, Object.assign({}, S, { character: 'deep', pitch: 0, vibrato: 0, scoop: 0 }), false, 'speak')); }
  function speakTTS(text) {
    if (!('speechSynthesis' in window)) { $('voiceNote').textContent = 'Speech synthesis is not available in this browser.'; char.speechFlap = true; setTimeout(() => char.speechFlap = false, 1500); return; }
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text), t = C.speak.tts; u.rate = t.rate; u.pitch = t.pitch; u.volume = .85;
    u.onstart = () => { speakingTTS = true; char.speechFlap = true; }; u.onend = u.onerror = () => { speakingTTS = false; char.speechFlap = false; }; speechSynthesis.speak(u);
  }
  function stopSpeech() { if ('speechSynthesis' in window) speechSynthesis.cancel(); speakingTTS = false; char.speechFlap = false; }
  const SING_FACE = { punk: { tilt: .6, browRot: 14, shake: .5 }, evil: { tilt: .5, browRot: 12, lid: .35 }, zeno: { pupS: .6, eyeS: 1.1, headRot: 6, smile: .3 }, myco: { lid: .45, smile: .5 }, royal: { headRot: -8, browY: -6, smile: .5 }, cyber: { lid: .1, shake: .2 } };
  function sing() {
    touch(); const text = $('lyricsInput').value.trim(); if (!text) { toast('Give Pip a few words first.'); return; }
    stopAll(); if (soundOn) audio.ensure(); pushVoice();
    const syl = P.syllabify(text), plan = P.Melody.generate(syl, S); if (!plan.notes.length) { toast('Pip could not find any syllables.'); return; }
    const r = audio.play(plan, S, S.harmOn, 'sing'); startPlay(r);
    char.express({ p: Object.assign({ smile: .5, lid: .1, browY: -4, headRot: 3 }, SING_FACE[C.idle.kind] || {}), dur: plan.total + .3 });
    $('songNote').textContent = `Pip is singing ${syl.length} syllables at ${S.bpm} BPM in ${S.key} ${S.scale}` + (S.harmOn && soundOn ? ' — with harmony.' : '.') + (soundOn ? '' : ' (sound is off)');
  }
  function stopAll(quiet) { audio.stop(); stopSpeech(); finishSong(quiet); }
  function finishSong(quiet) { singing = false; $('stopBtn').disabled = true; $('singBtn').disabled = false; $('viz').classList.remove('on'); char.visemes = null; lastNote = null; if (!quiet) $('songNote').textContent = 'The pond is quiet again.'; }

  /* ---------- feed / rename / sound ---------- */
  function feed() { touch(); const fd = C.feed; fullness = Math.min(100, fullness + 20); $('fullnessValue').textContent = fullness; $('meterFill').style.width = fullness + '%';
    setMood(fd.mood); if (fd.expr) { const e = C.expressions.find(x => x.id === fd.expr); if (e) char.express(Object.assign({}, e, { sfx: null })); }
    if (soundOn && audio.ensure()) audio.sfx(C.sfx.feed); toast(fullness === 100 ? 'Pip is completely stuffed.' : pick(fd.lines));
    if (fullness < 20) setMood('queasy'); }
  function poke() { touch(); stage.classList.remove('poked'); void stage.offsetWidth; stage.classList.add('poked'); const e = pick(C.expressions); char.express(Object.assign({}, e, { sfx: null })); ribbit(); toast(pick(['Boop.', 'Hey! Face!', 'Pip noticed that.', 'Rude. Also fine.', 'Again?'])); }

  /* ---------- idle behaviour: sparse, never while the user is busy ---------- */
  function idleTick() {
    const quiet = performance.now() - lastAct > 8000 && !singing && !speakingTTS && !document.hidden;
    if (quiet) { const r = Math.random(); if (r < .5) char.nudge(rand(-1, 1), rand(-.7, .6), rand(1, 2.2)); else if (r < .85) { const id = pick(C.idle.events), e = C.expressions.find(x => x.id === id); if (e) char.express(Object.assign({}, e, { sfx: null, laugh: false, whisper: false })); } else char.express({ p: {}, dur: .8, blink: 'double' }); }
    setTimeout(idleTick, rand(C.idle.look[0], C.idle.look[1]) * 1000 + 4000);
  }

  /* ---------- main loop ---------- */
  const viz = $('viz'), vg = viz.getContext('2d'); let last = performance.now(), wf = null;
  function drawViz(now) {
    const w = viz.width, h = viz.height; vg.clearRect(0, 0, w, h); vg.lineWidth = 2; vg.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#9fdc5c'; vg.beginPath();
    if (singing && audio.ready && audio.analyser) { wf = wf || new Uint8Array(audio.analyser.fftSize); audio.analyser.getByteTimeDomainData(wf); for (let i = 0; i < wf.length; i++) { const x = i / wf.length * w, y = h / 2 + (wf[i] - 128) / 128 * h * .9; i ? vg.lineTo(x, y) : vg.moveTo(x, y); } }
    else { vg.globalAlpha = .35; vg.moveTo(0, h / 2); vg.lineTo(w, h / 2); } vg.stroke(); vg.globalAlpha = 1;
  }
  function loop(ts) {
    const dt = Math.min(.05, (ts - last) / 1000); last = ts; const now = audio.now();
    if (singing) { if (audio.isPlaying(now) || (!audio.active && false)) { char.visemes = audio.mouthAt(now); const ne = audio.noteAt(now); if (ne && ne !== lastNote) { lastNote = ne; char.pulse(.8); } }
      else { finishSong(); $('songNote').textContent = 'Encore? Pip knows approximately one song.'; } }
    char.render(dt); if (!document.hidden) drawViz(now); requestAnimationFrame(loop);
  }

  /* ---------- wire up ---------- */
  buildStudio(); buildFx(); buildMoods(); buildWardrobe(); setCostume(0, false); setMood('stoned');
  $('feedBtn').addEventListener('click', feed); $('laughBtn').addEventListener('click', () => { touch(); laugh(); });
  $('renameBtn').addEventListener('click', () => { const n = prompt('What should we call this little guy?', $('frogName').textContent); if (n && n.trim()) { $('frogName').textContent = n.trim().slice(0, 16).toUpperCase(); toast('A new name for a new night.'); } });
  $('sayBtn').addEventListener('click', () => { touch(); sayText(); }); $('singBtn').addEventListener('click', sing); $('stopBtn').addEventListener('click', () => { touch(); stopAll(); });
  stage.addEventListener('click', poke); $('prevCostume').addEventListener('click', () => { touch(); setCostume(ci - 1, true); }); $('nextCostume').addEventListener('click', () => { touch(); setCostume(ci + 1, true); });
  $('fxReset').addEventListener('click', () => { fxState = P.fullPreset(C.fx); bypass = {}; syncFxUI(); pushFx(); toast('Effects reset to the ' + C.name + ' preset.'); });
  $('soundToggle').addEventListener('click', () => { soundOn = !soundOn; $('soundToggle').setAttribute('aria-pressed', String(soundOn)); $('soundLabel').textContent = soundOn ? 'SOUND ON' : 'SOUND OFF'; audio.setSound(soundOn); if (!soundOn) { stopSpeech(); finishSong(); } toast(soundOn ? 'Sound is back.' : 'Quiet mode.'); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(true); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') stopAll(); });
  requestAnimationFrame(loop); setTimeout(idleTick, 9000);
  P.app = { audio, char, S, setCostume, sing, sayText, laugh, feed, setMood, stopAll, get costume() { return C; }, fx: () => fxState };
})(window.Pip);
