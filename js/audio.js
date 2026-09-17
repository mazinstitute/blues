// ============================================================
// PORTAL TO BLUES — AUDIO
// Every sound has a real-file version AND a synthesized fallback,
// so the game sounds good the moment you unzip it, and sounds
// even better once you drop real audio files into assets/sounds/.
// See README.md for the full list of optional files.
// ============================================================

const AudioManager = (function () {
  let ctx = null;
  let musicGain, sfxGain, masterGain;
  let currentAmbient = null;
  let currentAmbientEl = null;
  let unlocked = false;
  let muted = false;
  const fileCache = {}; // url -> true (exists) / false (missing) once checked

  function ensureContext() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = 1;
      masterGain.connect(ctx.destination);

      musicGain = ctx.createGain();
      musicGain.gain.value = 0.35;
      musicGain.connect(masterGain);

      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.5;
      sfxGain.connect(masterGain);
    }
    if (ctx.state === "suspended") ctx.resume();
  }

  // Call this on the first user interaction (click/tap/key) to satisfy
  // browser autoplay policies.
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    ensureContext();
  }

  function setMuted(val) {
    muted = val;
    if (masterGain) masterGain.gain.value = muted ? 0 : 1;
  }

  function toggleMuted() {
    setMuted(!muted);
    return muted;
  }

  // ---------- Synthesized fallback sounds ----------

  function synthWhoosh() {
    ensureContext();
    const dur = 0.9;
    const bufferSize = ctx.sampleRate * dur;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + dur * 0.6);
    filter.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.9, ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    noise.connect(filter).connect(gain).connect(sfxGain);
    noise.start();
    noise.stop(ctx.currentTime + dur);
  }

  function synthClick(freq = 660, dur = 0.08) {
    ensureContext();
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain).connect(sfxGain);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  function synthFootstep() {
    ensureContext();
    const bufferSize = ctx.sampleRate * 0.06;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 500;
    const gain = ctx.createGain();
    gain.gain.value = 0.18;
    noise.connect(filter).connect(gain).connect(sfxGain);
    noise.start();
  }

  function synthChime(success) {
    ensureContext();
    const notes = success ? [523.25, 659.25, 783.99] : [392, 349.23];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      const t0 = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.3, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
      osc.connect(gain).connect(sfxGain);
      osc.start(t0);
      osc.stop(t0 + 0.55);
    });
  }

  function synthAmbientHum(baseFreq) {
    ensureContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.value = baseFreq;
    osc2.frequency.value = baseFreq * 1.5;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.gain.setTargetAtTime(0.12, ctx.currentTime, 1.2);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain).connect(musicGain);
    osc1.start();
    osc2.start();
    return {
      stop() {
        gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.6);
        setTimeout(() => {
          osc1.stop();
          osc2.stop();
        }, 1200);
      }
    };
  }

  // ---------- File-based playback with graceful fallback ----------

  function checkFile(url, cb) {
    if (fileCache[url] !== undefined) return cb(fileCache[url]);
    fetch(url, { method: "HEAD" })
      .then((res) => {
        fileCache[url] = res.ok;
        cb(res.ok);
      })
      .catch(() => {
        fileCache[url] = false;
        cb(false);
      });
  }

  function playWhoosh() {
    if (!unlocked) return;
    const url = "assets/sounds/portal-whoosh.mp3";
    checkFile(url, (exists) => {
      if (exists) {
        const el = new Audio(url);
        el.volume = 0.6;
        el.play().catch(() => synthWhoosh());
      } else {
        synthWhoosh();
      }
    });
  }

  function playFootstep() {
    if (!unlocked) return;
    const url = "assets/sounds/footstep.mp3";
    checkFile(url, (exists) => {
      if (exists) {
        const el = new Audio(url);
        el.volume = 0.3;
        el.play().catch(() => synthFootstep());
      } else {
        synthFootstep();
      }
    });
  }

  function playClick() {
    if (!unlocked) return;
    synthClick(660, 0.06);
  }

  function playHover() {
    if (!unlocked) return;
    synthClick(880, 0.05);
  }

  function playChime(success) {
    if (!unlocked) return;
    const url = success ? "assets/sounds/quiz-correct.mp3" : "assets/sounds/quiz-wrong.mp3";
    checkFile(url, (exists) => {
      if (exists) {
        const el = new Audio(url);
        el.volume = 0.6;
        el.play().catch(() => synthChime(success));
      } else {
        synthChime(success);
      }
    });
  }

  function playBadge() {
    if (!unlocked) return;
    const url = "assets/sounds/badge-earned.mp3";
    checkFile(url, (exists) => {
      if (exists) {
        const el = new Audio(url);
        el.volume = 0.7;
        el.play().catch(() => synthChime(true));
      } else {
        synthChime(true);
      }
    });
  }

  function stopAmbient() {
    if (currentAmbientEl) {
      currentAmbientEl.pause();
      currentAmbientEl = null;
    }
    if (currentAmbient) {
      currentAmbient.stop();
      currentAmbient = null;
    }
  }

  function playAmbient(url, fallbackFreq) {
    if (!unlocked) return;
    stopAmbient();
    checkFile(url, (exists) => {
      if (exists) {
        const el = new Audio(url);
        el.loop = true;
        el.volume = 0;
        el.play()
          .then(() => {
            currentAmbientEl = el;
            let v = 0;
            const iv = setInterval(() => {
              v += 0.03;
              el.volume = Math.min(v, 0.35);
              if (v >= 0.35) clearInterval(iv);
            }, 40);
          })
          .catch(() => {
            currentAmbient = synthAmbientHum(fallbackFreq);
          });
      } else {
        currentAmbient = synthAmbientHum(fallbackFreq);
      }
    });
  }

  function playPlazaAmbient() {
    playAmbient("assets/sounds/plaza-ambient.mp3", 110);
  }

  return {
    unlock,
    setMuted,
    toggleMuted,
    playWhoosh,
    playFootstep,
    playClick,
    playHover,
    playChime,
    playBadge,
    playAmbient,
    playPlazaAmbient,
    stopAmbient
  };
})();
