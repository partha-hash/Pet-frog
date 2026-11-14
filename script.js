(() => {
  const $ = (id) => document.getElementById(id);
  const frog = $("frogMount");
  const moods = ["stoned","happy","laughing","crying","smug","angry","shocked","sleepy","love","cool","thinking","queasy"];
  let fullness = 80, currentMood = "stoned", audioCtx = null, soundOn = true, timers = [], activeOscillators = [];
  const moodNames = {stoned:"STONED",happy:"HAPPY",laughing:"LAUGHING",crying:"CRYING",smug:"SMUG",angry:"ANGRY",shocked:"SHOCKED",sleepy:"SLEEPY","love":"IN LOVE",cool:"COOL",thinking:"THINKING",queasy:"QUEASY"};

  function setMood(mood) {
    if (!moods.includes(mood)) return;
    currentMood = mood;
    frog.dataset.mood = mood;
    $("moodLabel").textContent = moodNames[mood];
    document.querySelectorAll(".mood-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.mood === mood));
  }
  function updateFullness() {
    $("fullnessValue").textContent = fullness;
    $("meterFill").style.width = fullness + "%";
    if (fullness < 20) setMood("queasy");
    else if (fullness > 92 && currentMood === "stoned") setMood("happy");
  }
  function toast(message) {
    const el = $("toast"); el.textContent = message; el.classList.add("show");
    clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2100);
  }
  function ctx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }
  function ribbit() {
    if (!soundOn) return;
    try {
      const c = ctx(), now = c.currentTime;
      const osc = c.createOscillator(), gain = c.createGain(), filter = c.createBiquadFilter();
      osc.type = "sawtooth"; osc.frequency.setValueAtTime(180, now); osc.frequency.exponentialRampToValueAtTime(78, now + .18);
      filter.type = "lowpass"; filter.frequency.value = 700;
      gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.12, now + .025); gain.gain.exponentialRampToValueAtTime(.0001, now + .24);
      osc.connect(filter).connect(gain).connect(c.destination); osc.start(now); osc.stop(now + .26);
    } catch (_) {}
  }
  function talking(ms=1000) {
    frog.classList.add("talking");
    setTimeout(() => frog.classList.remove("talking"), ms);
  }
  function speak(text) {
    if (!("speechSynthesis" in window)) { $("voiceNote").textContent = "Speech synthesis is not available in this browser."; return; }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = .82; utterance.pitch = .72; utterance.volume = soundOn ? .85 : 0;
    utterance.onstart = () => talking(Math.min(7000, text.length * 65));
    utterance.onend = () => frog.classList.remove("talking");
    speechSynthesis.speak(utterance);
  }
  function stopSong() {
    timers.forEach(clearTimeout); timers = [];
    activeOscillators.forEach(o => { try { o.stop(); } catch (_) {} }); activeOscillators = [];
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    frog.classList.remove("talking"); $("waveform").classList.remove("playing");
    $("stopBtn").disabled = true; $("singBtn").disabled = false;
    $("songNote").textContent = "The pond is quiet again.";
  }
  const noteMap = {C:[261.63,293.66,329.63,392,440,523.25],G:[196,220,246.94,293.66,329.63,392],D:[293.66,329.63,369.99,440,493.88,587.33],A:[220,246.94,261.63,329.63,369.99,440],E:[164.81,196,220,246.94,293.66,329.63],F:[174.61,196,220,261.63,293.66,349.23]};
  function sing() {
    stopSong();
    const text = $("lyricsInput").value.trim();
    if (!text) { toast("Give Pip a few words first."); return; }
    const words = text.split(/\s+/).slice(0,24), tempo = Number($("tempo").value), beat = 60000 / tempo;
    const notes = noteMap[$("songKey").value] || noteMap.C;
    $("singBtn").disabled = true; $("stopBtn").disabled = false;
    $("waveform").classList.add("playing"); $("songNote").textContent = "Pip is singing into the night...";
    words.forEach((word, i) => {
      const delay = i * beat * .72;
      const t = setTimeout(() => {
        if (soundOn) {
          try {
            const c = ctx(), osc = c.createOscillator(), gain = c.createGain(), now = c.currentTime;
            osc.type = "triangle"; osc.frequency.value = notes[(word.length + i * 2) % notes.length] * (i % 5 === 4 ? 2 : 1);
            gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.095, now + .025); gain.gain.exponentialRampToValueAtTime(.0001, now + beat / 1000 * .55);
            osc.connect(gain).connect(c.destination); osc.start(now); osc.stop(now + beat / 1000 * .58); activeOscillators.push(osc);
          } catch (_) {}
        }
        if ($("speechToggle").checked && soundOn && "speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(word.replace(/[.,!?]/g,""));
          u.rate = .9; u.pitch = .72; u.volume = .65; speechSynthesis.speak(u);
          talking(Math.min(800, beat * .6));
        } else { talking(beat * .4); }
        if (i === words.length - 1) {
          const end = setTimeout(() => { stopSong(); $("songNote").textContent = "Encore? Pip knows approximately one song."; }, beat * .9);
          timers.push(end);
        }
      }, delay);
      timers.push(t);
    });
  }

  document.querySelectorAll(".mood-btn").forEach(btn => btn.addEventListener("click", () => {
    setMood(btn.dataset.mood); ribbit();
  }));
  $("feedBtn").addEventListener("click", () => {
    fullness = Math.min(100, fullness + 20); updateFullness(); setMood("happy"); ribbit();
    toast(fullness === 100 ? "Pip is completely stuffed." : "A tasty little fly. Yum.");
  });
  $("renameBtn").addEventListener("click", () => {
    const name = prompt("What should we call this little guy?", $("frogName").textContent);
    if (name && name.trim()) { $("frogName").textContent = name.trim().slice(0,16).toUpperCase(); toast("A new name for a new night."); }
  });
  $("sayBtn").addEventListener("click", () => {
    const text = $("wordsInput").value.trim(); if (!text) { toast("Pip needs something to say."); return; }
    setMood("thinking"); ribbit();
    $("voiceNote").textContent = "Pip says: “" + text.slice(0,70) + (text.length > 70 ? "…" : "") + "”";
    if ($("speechToggle").checked && soundOn) speak(text); else talking(Math.min(5000,text.length*55));
  });
  $("singBtn").addEventListener("click", sing);
  $("stopBtn").addEventListener("click", stopSong);
  $("tempo").addEventListener("input", e => $("tempoValue").textContent = e.target.value);
  $("soundToggle").addEventListener("click", () => {
    soundOn = !soundOn; $("soundToggle").setAttribute("aria-pressed", String(soundOn));
    $("soundLabel").textContent = soundOn ? "SOUND ON" : "SOUND OFF";
    if (!soundOn) { if ("speechSynthesis" in window) speechSynthesis.cancel(); stopSong(); }
    toast(soundOn ? "Sound is back." : "Quiet mode.");
  });
  setMood("stoned"); updateFullness();
})();