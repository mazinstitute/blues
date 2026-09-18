// ============================================================
// PORTAL TO BLUES — AUDIO
// Short sound effects (whoosh, clicks, quiz chimes, badge) have a
// real-file version AND a tiny synthesized fallback, so the game
// sounds good the moment you unzip it. Ambient background sound
// is file-only now — if you drop a real ambience file into
// assets/sounds/ it will play softly; if you don't, it just stays
// quiet instead of humming. See README.md for the optional file list.
// ============================================================

const AudioManager = (function () {
  let ctx = null;
  let musicGain, sfxGain, masterGain;
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
    if (currentAmbientEl) currentAmbientEl.muted = muted;
  }

  function toggleMuted() {
    setMuted(!muted);
    return muted;
  }

  // ---------- Synthesized fallback sounds (short SFX only) ----------

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

  // A low, sustained rumble for the reality-break finale — synthesized
  // only, since this is a dramatic one-off moment rather than a UI cue.
  function synthRumble(duration) {
    ensureContext();
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(140, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(55, ctx.currentTime + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.55, ctx.currentTime + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    noise.connect(filter).connect(gain).connect(sfxGain);
    noise.start();
    noise.stop(ctx.currentTime + duration);
  }

  function playRumble() {
    if (!unlocked) return;
    synthRumble(2.6);
  }

  // ---------- Destruction sequence layers (reality-break finale) ----------

  // A short, sharp crackle — things snapping and tearing apart.
  function synthCrack() {
    ensureContext();
    const dur = 0.14 + Math.random() * 0.08;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 900 + Math.random() * 1800;
    filter.Q.value = 1.2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5 + Math.random() * 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    noise.connect(filter).connect(gain).connect(sfxGain);
    noise.start();
    noise.stop(ctx.currentTime + dur);
  }

  // A short "pulled inward" whoosh with a descending pitch — layered
  // through the sequence as chunks of the plaza vanish into the hole.
  function synthSuck() {
    ensureContext();
    const dur = 0.5;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + dur);
    filter.Q.value = 1.4;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    noise.connect(filter).connect(gain).connect(sfxGain);
    noise.start();
    noise.stop(ctx.currentTime + dur);
  }

  // One deep boom for the moment the destruction settles.
  function synthBoom() {
    ensureContext();
    const dur = 1.1;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.7, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain).connect(sfxGain);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  // A soft, low "not yet" buzz — plays when a player tries to step
  // into a portal after all six keys are collected but before the
  // chest has been opened.
  function synthDenied() {
    ensureContext();
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = 140;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.connect(gain).connect(sfxGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  }

  function playDenied() {
    if (!unlocked) return;
    synthDenied();
  }

  // The full destruction soundscape for the reality-break sequence:
  // the sustained rumble, plus a scattering of cracks and inward
  // "sucking" whooshes timed roughly alongside the portals and debris
  // getting torn away, finishing on one deep boom as everything settles.
  function playDestructionSequence(duration) {
    if (!unlocked) return;
    synthRumble(duration);
    const beats = [0.15, 0.4, 0.7, 0.95, 1.25, 1.55, 1.85, 2.15];
    beats.forEach((t, i) => {
      setTimeout(() => {
        if (i % 2 === 0) synthCrack();
        else synthSuck();
      }, t * 1000);
    });
    setTimeout(() => synthBoom(), Math.max(0, duration - 0.35) * 1000);
  }

  // ---------- File-based playback (ambience is file-only, no hum fallback) ----------

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

  function playClick() {
    if (!unlocked) return;
    synthClick(660, 0.06);
  }

  function playHover() {
    if (!unlocked) return;
    synthClick(880, 0.05);
  }

  // A single plucked/struck note, used by the "Play It" instrument
  // pillar's pads. A short attack + decay envelope on a triangle wave
  // reads as an instrument tone rather than a UI beep.
  function playNote(freq, dur = 0.5) {
    if (!unlocked) return;
    ensureContext();
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    const t0 = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.32, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
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

  // Ambient background is file-only now — no synthesized hum. If the
  // named file exists it fades gently in; if it doesn't, the game
  // just stays quiet (aside from whoosh/click/chime SFX).
  function stopAmbient() {
    if (currentAmbientEl) {
      const el = currentAmbientEl;
      currentAmbientEl = null;
      if (window.gsap) {
        gsap.to(el, { volume: 0, duration: 0.5, onComplete: () => el.pause() });
      } else {
        el.pause();
      }
    }
  }

  function playAmbient(url) {
    if (!unlocked) return;
    stopAmbient();
    if (!url) return;
    checkFile(url, (exists) => {
      if (!exists) return; // silence — no synthesized hum fallback
      const el = new Audio(url);
      el.loop = true;
      el.volume = 0;
      el.muted = muted;
      el.play()
        .then(() => {
          currentAmbientEl = el;
          if (window.gsap) {
            gsap.to(el, { volume: 0.28, duration: 1.2 });
          } else {
            el.volume = 0.28;
          }
        })
        .catch(() => {
          /* autoplay blocked or file unusable — stay silent */
        });
    });
  }

  function playPlazaAmbient() {
    playAmbient("assets/sounds/plaza-ambient.mp3");
  }

  return {
    unlock,
    setMuted,
    toggleMuted,
    playWhoosh,
    playClick,
    playHover,
    playNote,
    playChime,
    playBadge,
    playRumble,
    playDenied,
    playDestructionSequence,
    playAmbient,
    playPlazaAmbient,
    stopAmbient
  };
})();
