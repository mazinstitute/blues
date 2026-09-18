// ============================================================
// PORTAL TO BLUES — UI
// Builds the ONE content panel a pillar reveals when clicked
// (story / vocabulary / songs / facts / quiz), plus the plaza HUD
// (record crate + mute) and in-memory progress tracking.
// Nothing here builds a full scrolling "menu page" anymore — each
// pillar shows exactly one focused panel at a time.
//
// NOTE ON PROGRESS: this is a shared classroom computer, so nothing
// is written to localStorage/sessionStorage on purpose. Progress
// lives only in the `progress` variable below for the length of one
// visit to the page — closing the tab or reloading (which also
// happens automatically once a player finishes the finale) hands the
// next student a completely clean slate.
// ============================================================

const GameUI = (function () {
  let progress = { badges: [], read: {} };
  let currentIndex = -1;

  // ---------------- Anti-guessing: reading progress ----------------
  // The quiz for a dimension only unlocks once its player has actually
  // flipped every Story, Vocabulary, and Did-You-Know card for that
  // dimension — not just glanced at the panel. This is tracked here,
  // in memory, per era id, and read by isQuizReady()/readSummary().
  const READ_TYPES = ["story", "vocab", "facts"];

  function readState(era) {
    if (!progress.read[era.id]) {
      progress.read[era.id] = { story: new Set(), vocab: new Set(), facts: new Set() };
    }
    return progress.read[era.id];
  }

  function markCardRead(era, type, i) {
    readState(era)[type].add(i);
    syncQuizLock(era);
  }

  function readCounts(era) {
    const st = readState(era);
    return {
      story: { done: st.story.size, total: era.history.length },
      vocab: { done: st.vocab.size, total: era.vocab.length },
      facts: { done: st.facts.size, total: era.facts.length }
    };
  }

  function isQuizReady(era) {
    const c = readCounts(era);
    return c.story.done >= c.story.total && c.vocab.done >= c.vocab.total && c.facts.done >= c.facts.total;
  }

  // Keeps the 3D quiz pillar's look (padlock vs. question mark) in sync
  // with reading progress. Safe to call often.
  function syncQuizLock(era) {
    const index = ERAS.indexOf(era);
    if (index === -1 || hasBadge(era.id)) return;
    PortalScene.setQuizLocked(index, !isQuizReady(era));
  }

  const panelEl = document.getElementById("content-panel");
  const panelBody = document.getElementById("panel-body");
  const panelLabel = document.getElementById("panel-type-label");
  const chamberBar = document.getElementById("chamber-bar");
  const eraNameEl = document.getElementById("era-name");
  const eraYearsEl = document.getElementById("era-years");

  function hasBadge(eraId) {
    return progress.badges.includes(eraId);
  }

  function completedArray() {
    return ERAS.map((e) => hasBadge(e.id));
  }

  function awardBadge(eraId) {
    if (!hasBadge(eraId)) {
      progress.badges.push(eraId);
      AudioManager.playBadge();
      return true;
    }
    return false;
  }

  // ---------------- Plaza HUD (record crate + mute) ----------------

  function buildHud() {
    const hud = document.createElement("div");
    hud.id = "hud";
    hud.innerHTML = `
      <div id="record-crate" title="Your record collection">
        ${ERAS.map((e) => `<span class="crate-slot" data-era="${e.id}" style="--dot:${e.color}"></span>`).join("")}
      </div>
      <button id="mute-btn" title="Mute / unmute sound" aria-label="Mute or unmute sound">🔊</button>
    `;
    document.body.appendChild(hud);
    refreshHud();

    document.getElementById("mute-btn").addEventListener("click", () => {
      const muted = AudioManager.toggleMuted();
      document.getElementById("mute-btn").textContent = muted ? "🔇" : "🔊";
    });
  }

  function refreshHud() {
    document.querySelectorAll(".crate-slot").forEach((slot) => {
      const era = slot.getAttribute("data-era");
      slot.classList.toggle("earned", hasBadge(era));
    });
  }

  // ---------------- Entering a chamber ----------------

  function enterChamber(index) {
    currentIndex = index;
    const era = ERAS[index];
    syncQuizLock(era);
    eraNameEl.textContent = era.name;
    eraYearsEl.textContent = era.years;
    eraYearsEl.style.color = era.color;
    chamberBar.style.setProperty("--theme-color", era.color);
    chamberBar.classList.add("visible");
    panelEl.classList.remove("visible");
  }

  function exitChamber() {
    chamberBar.classList.remove("visible");
    panelEl.classList.remove("visible");
    currentIndex = -1;
  }

  // ---------------- Panel router ----------------

  const PANEL_TITLES = {
    story: "The Story",
    vocab: "Key Vocabulary",
    match: "Match It",
    songs: "Essential Listening",
    instrument: "Play It",
    map: "On the Map",
    facts: "Did You Know?",
    quiz: "Earn Your Record"
  };

  function openPanel(index, type) {
    currentIndex = index;
    const era = ERAS[index];
    panelEl.style.setProperty("--theme-color", era.color);
    panelLabel.textContent = PANEL_TITLES[type] || "";
    panelBody.innerHTML = "";

    if (type === "story") renderStory(era, panelBody);
    else if (type === "vocab") renderVocab(era, panelBody);
    else if (type === "match") renderMatch(era, panelBody);
    else if (type === "facts") renderFacts(era, panelBody);
    else if (type === "songs") renderSongs(era, panelBody);
    else if (type === "instrument") renderInstrument(era, panelBody);
    else if (type === "map") renderMap(era, panelBody);
    else if (type === "quiz") renderQuiz(era, panelBody);

    panelEl.classList.add("visible");
  }

  function closePanel() {
    panelEl.classList.remove("visible");
    PortalScene.backToChamberOverview();
  }

  // ---------------- The Story: independent flip-cards ----------------

  function renderStory(era, root) {
    const partNames = ["Part One", "Part Two", "Part Three", "Part Four", "Part Five"];
    root.innerHTML = `<p class="panel-intro">${era.blurb}</p>`;
    era.history.forEach((para, i) => {
      const card = document.createElement("div");
      card.className = "flip-card story-card-flip";
      card.innerHTML = `
        <div class="flip-card-inner">
          <div class="flip-card-front">
            <p class="serif italic panel-card-title">${partNames[i] || `Part ${i + 1}`}</p>
            <p class="flip-hint">Tap to read</p>
          </div>
          <div class="flip-card-back"><p class="panel-card-text">${para}</p></div>
        </div>
      `;
      card.addEventListener("click", () => {
        card.classList.toggle("flipped");
        AudioManager.playClick();
        markCardRead(era, "story", i);
      });
      root.appendChild(card);
    });
  }

  // ---------------- Vocabulary: flip cards ----------------

  function renderVocab(era, root) {
    era.vocab.forEach((v, i) => {
      const card = document.createElement("div");
      card.className = "flip-card";
      card.innerHTML = `
        <div class="flip-card-inner">
          <div class="flip-card-front">
            <p class="serif italic panel-card-title">${v.word}</p>
            <p class="flip-hint">Tap to reveal</p>
          </div>
          <div class="flip-card-back"><p class="panel-card-text">${v.def}</p></div>
        </div>
      `;
      card.addEventListener("click", () => {
        card.classList.toggle("flipped");
        AudioManager.playClick();
        markCardRead(era, "vocab", i);
      });
      root.appendChild(card);
    });
  }

  // ---------------- Match It: a tap-to-pair vocabulary game ----------------

  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function renderMatch(era, root) {
    root.innerHTML = `
      <p class="panel-intro">Tap a word, then tap the definition that goes with it.</p>
      <div class="match-game">
        <div class="match-col" id="match-words"></div>
        <div class="match-col" id="match-defs"></div>
      </div>
      <p id="match-status" class="panel-footnote">&nbsp;</p>
    `;
    const wordsCol = root.querySelector("#match-words");
    const defsCol = root.querySelector("#match-defs");
    const statusEl = root.querySelector("#match-status");
    const items = era.vocab.map((v, i) => ({ id: i, word: v.word, def: v.def }));
    let selected = null;
    let matchedCount = 0;

    shuffled(items).forEach((item) => {
      const btn = document.createElement("button");
      btn.className = "match-item";
      btn.textContent = item.word;
      btn.dataset.id = item.id;
      btn.addEventListener("click", () => {
        if (btn.classList.contains("matched")) return;
        AudioManager.playClick();
        wordsCol.querySelectorAll(".match-item").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        selected = btn;
      });
      wordsCol.appendChild(btn);
    });

    shuffled(items).forEach((item) => {
      const btn = document.createElement("button");
      btn.className = "match-item match-def";
      btn.textContent = item.def;
      btn.dataset.id = item.id;
      btn.addEventListener("click", () => {
        if (!selected || btn.classList.contains("matched")) return;
        const correct = selected.dataset.id === btn.dataset.id;
        if (correct) {
          AudioManager.playChime(true);
          selected.classList.remove("selected");
          selected.classList.add("matched");
          btn.classList.add("matched");
          selected = null;
          matchedCount++;
          if (matchedCount === items.length) {
            statusEl.textContent = "You matched them all — nice work!";
            statusEl.style.color = era.color;
            statusEl.style.fontStyle = "normal";
          }
        } else {
          AudioManager.playChime(false);
          btn.classList.add("wrong");
          setTimeout(() => btn.classList.remove("wrong"), 400);
        }
      });
      defsCol.appendChild(btn);
    });
  }

  // ---------------- Play It: a tappable instrument pad ----------------

  function renderInstrument(era, root) {
    const inst = era.instrument;
    root.innerHTML = `
      <p class="panel-intro"><strong style="color:${era.color}">${inst.name}.</strong> ${inst.hint}</p>
      <div class="instrument-pads" id="instrument-pads"></div>
      <button id="play-riff-btn" class="quiz-option riff-btn">&#9654; Play a Riff</button>
    `;
    const padsEl = root.querySelector("#instrument-pads");
    const pads = PAD_NOTES.map((freq, i) => {
      const pad = document.createElement("button");
      pad.className = "instrument-pad";
      pad.style.setProperty("--pad-color", era.color);
      pad.textContent = PAD_LABELS[i];
      padsEl.appendChild(pad);
      return pad;
    });

    function playPad(i) {
      AudioManager.playNote(PAD_NOTES[i], 0.5);
      pads[i].classList.add("active");
      setTimeout(() => pads[i].classList.remove("active"), 220);
    }
    pads.forEach((pad, i) => pad.addEventListener("click", () => playPad(i)));

    const riffBtn = root.querySelector("#play-riff-btn");
    riffBtn.addEventListener("click", () => {
      riffBtn.disabled = true;
      const riff = inst.riff;
      riff.forEach((padIndex, step) => {
        setTimeout(() => {
          playPad(padIndex);
          if (step === riff.length - 1) setTimeout(() => (riffBtn.disabled = false), 220);
        }, step * 250);
      });
    });
  }

  // ---------------- On the Map: clickable pins with connecting routes ----------------

  function renderMap(era, root) {
    root.innerHTML = `
      <p class="panel-intro">${era.mapCaption || "Tap a glowing pin to learn about a place in this story."}</p>
      <div class="map-wrap" id="map-wrap">
        <svg class="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
      </div>
      <div class="map-detail" id="map-detail"><p class="panel-card-text">Tap a pin to begin.</p></div>
    `;
    const wrap = root.querySelector("#map-wrap");
    const linesSvg = wrap.querySelector("svg");
    const detail = root.querySelector("#map-detail");
    const hub = era.locations.find((l) => l.hub) || era.locations[0];

    era.locations.forEach((loc) => {
      if (!loc.hub) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", hub.x);
        line.setAttribute("y1", hub.y);
        line.setAttribute("x2", loc.x);
        line.setAttribute("y2", loc.y);
        line.setAttribute("class", "map-route");
        line.setAttribute("stroke", era.color);
        linesSvg.appendChild(line);
      }

      const pin = document.createElement("button");
      pin.className = "map-pin" + (loc.hub ? " hub" : "");
      pin.style.left = loc.x + "%";
      pin.style.top = loc.y + "%";
      pin.style.setProperty("--pin-color", era.color);
      pin.setAttribute("aria-label", loc.name);
      pin.addEventListener("click", () => {
        AudioManager.playClick();
        wrap.querySelectorAll(".map-pin").forEach((p) => p.classList.remove("active"));
        pin.classList.add("active");
        detail.innerHTML = `<p class="serif italic panel-card-title" style="color:${era.color}">${loc.name}</p><p class="panel-card-text">${loc.blurb}</p>`;
      });
      wrap.appendChild(pin);
    });

    // Open the hub pin by default so the panel never looks empty.
    const hubPin = wrap.querySelector(".map-pin.hub");
    if (hubPin) hubPin.click();
  }

  // ---------------- Did You Know?: reveal cards ----------------

  function renderFacts(era, root) {
    era.facts.forEach((f, i) => {
      const card = document.createElement("div");
      card.className = "flip-card fact-card";
      card.innerHTML = `
        <div class="flip-card-inner">
          <div class="flip-card-front fact-front">
            <span class="fact-number">${i + 1}</span>
            <p class="flip-hint">Tap to reveal a fact</p>
          </div>
          <div class="flip-card-back"><p class="panel-card-text">${f}</p></div>
        </div>
      `;
      card.addEventListener("click", () => {
        const wasFlipped = card.classList.contains("flipped");
        card.classList.toggle("flipped");
        if (!wasFlipped) AudioManager.playHover();
        markCardRead(era, "facts", i);
      });
      root.appendChild(card);
    });
  }

  // ---------------- The Songs: the centerpiece — a jukebox list, each ----------------
  // ---------------- track paired with a vocabulary term and a fact.  ----------------

  function renderSongs(era, root) {
    root.innerHTML = `<p class="panel-intro">Every dimension is built around its music — start here, then use the "Listen" link to hear it (with an adult's OK), and check the spotlight below each track to connect it back to a word or fact you've learned.</p>`;
    const list = document.createElement("div");
    list.id = "jukebox-list";
    era.songs.forEach((song, i) => {
      const vocab = era.vocab[i % era.vocab.length];
      const fact = era.facts[i % era.facts.length];
      const row = document.createElement("a");
      row.href = song.url || ytSearchUrl(song.title, song.artist);
      row.target = "_blank";
      row.rel = "noopener";
      row.className = "song-row";
      row.innerHTML = `
        <div class="disc-icon"><div class="disc-icon-dot" style="background:${era.color}"></div></div>
        <div class="song-row-main">
          <div class="song-title">${song.title}</div>
          <div class="song-artist">${song.artist}</div>
          <div class="song-spotlight">
            <span class="spotlight-chip" style="border-color:${era.color};color:${era.color}">${vocab.word}</span>
            <span class="spotlight-fact">${fact}</span>
          </div>
        </div>
        <div class="song-listen" style="color:${era.color}">Listen &rarr;</div>
      `;
      row.addEventListener("click", () => AudioManager.playClick());
      list.appendChild(row);
    });
    root.appendChild(list);
    const note = document.createElement("p");
    note.className = "panel-footnote";
    note.textContent = "Tracks open directly to a YouTube video in a new tab.";
    root.appendChild(note);
  }

  // ---------------- Quiz ----------------
  // Anti-guessing design: (1) the quiz stays locked until every Story,
  // Vocabulary, and Did-You-Know card has been read; (2) answering has
  // two parts — pick the answer, then confirm which pillar actually
  // proves it — so clicking through options blind won't work; (3) a
  // wrong combination never reveals which half was wrong, reshuffles
  // both steps, and imposes a short, growing cooldown, so spamming
  // guesses is slower than just going back and reading.

  const SOURCE_LABELS = { story: "The Story", vocab: "Vocabulary", songs: "The Songs", facts: "Did You Know?" };

  function renderQuiz(era, root) {
    const earned = hasBadge(era.id);
    const wrap = document.createElement("div");
    wrap.className = "quiz-card";

    if (earned) {
      wrap.innerHTML = `
        <p class="serif italic panel-card-title">You already earned this dimension's record!</p>
        <p class="panel-card-text">Nice work — come back any time to revisit the story, vocabulary, and songs.</p>
        <div class="earned-badge">
          <span class="disc-icon-static" style="border-color:${era.color}"></span>
          <span>Record collected</span>
        </div>
      `;
      root.appendChild(wrap);
      return;
    }

    if (!isQuizReady(era)) {
      const c = readCounts(era);
      wrap.innerHTML = `
        <div class="quiz-locked">
          <div class="quiz-lock-icon">&#128274;</div>
          <p class="serif italic panel-card-title">Not ready yet</p>
          <p class="panel-card-text">Read through every card in these three pillars first — the quiz draws its questions straight from them, so there's no guessing your way to a record.</p>
          <ul class="quiz-checklist">
            <li class="${c.story.done >= c.story.total ? "done" : ""}">Story &mdash; ${c.story.done}/${c.story.total} read</li>
            <li class="${c.vocab.done >= c.vocab.total ? "done" : ""}">Vocabulary &mdash; ${c.vocab.done}/${c.vocab.total} read</li>
            <li class="${c.facts.done >= c.facts.total ? "done" : ""}">Did You Know? &mdash; ${c.facts.done}/${c.facts.total} read</li>
          </ul>
        </div>
      `;
      root.appendChild(wrap);
      return;
    }

    wrap.innerHTML = `
      <p id="quiz-question" class="serif italic panel-card-title"></p>
      <p id="quiz-step-hint" class="panel-footnote"></p>
      <div id="quiz-options"></div>
      <p id="quiz-feedback">&nbsp;</p>
    `;
    root.appendChild(wrap);

    const qEl = document.getElementById("quiz-question");
    const stepHintEl = document.getElementById("quiz-step-hint");
    const optionsEl = document.getElementById("quiz-options");
    const feedbackEl = document.getElementById("quiz-feedback");

    let attempts = 0;
    let q, selected;

    function newRound() {
      q = shuffleQuizOptions(era.quiz);
      selected = null;
      qEl.textContent = q.question;
      renderAnswerStep();
    }

    function renderAnswerStep() {
      stepHintEl.textContent = "Step 1 of 2 — pick the answer.";
      feedbackEl.textContent = "\u00a0";
      optionsEl.innerHTML = "";
      q.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.className = "quiz-option";
        btn.textContent = opt;
        btn.addEventListener("click", () => {
          selected = i;
          AudioManager.playClick();
          renderSourceStep();
        });
        optionsEl.appendChild(btn);
      });
    }

    function renderSourceStep() {
      stepHintEl.textContent = "Step 2 of 2 — which pillar actually proves that?";
      optionsEl.innerHTML = "";
      const choices = shuffled(Object.keys(SOURCE_LABELS));
      choices.forEach((key) => {
        const btn = document.createElement("button");
        btn.className = "quiz-option";
        btn.textContent = SOURCE_LABELS[key];
        btn.addEventListener("click", () => submit(key));
        optionsEl.appendChild(btn);
      });
      const back = document.createElement("button");
      back.className = "quiz-option quiz-back-btn";
      back.textContent = "\u2190 Change my answer";
      back.addEventListener("click", renderAnswerStep);
      optionsEl.appendChild(back);
    }

    function submit(sourceKey) {
      const correct = selected === q.correct && sourceKey === era.quiz.source;
      AudioManager.playChime(correct);
      Array.from(optionsEl.children).forEach((b) => (b.disabled = true));

      if (correct) {
        feedbackEl.textContent = "That's it — answer AND proof both check out. You earned a record!";
        feedbackEl.style.color = era.color;
        const justEarned = awardBadge(era.id);
        refreshHud();
        if (justEarned) {
          PortalScene.setPortalCompleted(currentIndex, true);
          PortalScene.setQuizLocked(currentIndex, false);
          PortalScene.refreshQuizPillarIcon();
          celebrateBadge(era);
        }
        return;
      }

      attempts++;
      const cooldown = Math.min(2 + attempts, 6);
      let remaining = cooldown;
      feedbackEl.style.color = "#e2572a";
      const tick = () => {
        feedbackEl.textContent = `Not quite — the answer and the proof have to match. Take another look, then try again in ${remaining}s.`;
        remaining--;
      };
      tick();
      const iv = setInterval(() => {
        if (remaining < 0) {
          clearInterval(iv);
          newRound();
        } else {
          tick();
        }
      }, 1000);
    }

    newRound();
  }

  // Returns a copy of an era's quiz with its options (and the correct
  // index) shuffled, so the right answer isn't always in the same spot.
  function shuffleQuizOptions(quiz) {
    const opts = quiz.options.map((text, i) => ({ text, correct: i === quiz.correct }));
    const s = shuffled(opts);
    return { question: quiz.question, options: s.map((o) => o.text), correct: s.findIndex((o) => o.correct) };
  }

  function celebrateBadge(era) {
    const slot = document.querySelector(`.crate-slot[data-era="${era.id}"]`);
    if (slot && window.gsap) {
      gsap.fromTo(slot, { scale: 1.8 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" });
    }
    if (progress.badges.length === ERAS.length) showFinaleMessage();
  }

  // All six keys collected — a chest now waits at the crossroads. This
  // is entirely optional bonus content: the player can dismiss this
  // banner and keep freely revisiting any dimension without ever
  // touching the chest.
  function showFinaleMessage() {
    PortalScene.revealChest();
    const banner = document.createElement("div");
    banner.id = "finale-banner";
    banner.innerHTML = `
      <div class="finale-inner">
        <p class="serif italic finale-title">All six keys are yours! 🔑</p>
        <p class="finale-text">You've traveled the whole story of the blues, from the Mississippi Delta to today. A mysterious chest has appeared back at the Main Plaza — opening it is a totally optional bonus scene, whenever (or if ever) you feel like it.</p>
        <div class="finale-btn-row">
          <button id="finale-close" class="back-btn">Head to the Chest</button>
          <button id="finale-dismiss" class="back-btn finale-dismiss-btn">Keep Exploring</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);
    document.getElementById("finale-close").addEventListener("click", () => {
      banner.remove();
      AudioManager.playClick();
      PortalScene.exitToPlaza();
    });
    document.getElementById("finale-dismiss").addEventListener("click", () => {
      banner.remove();
      AudioManager.playClick();
    });
  }

  // ---------------- The Final Gauntlet ----------------
  // Fires once the chest is opened and PortalScene has finished tearing
  // the plaza apart. One question is picked at random from
  // FINALE_QUESTIONS (js/data.js) — synthesis questions that need
  // knowledge stitched together from more than one era, as one last
  // check that a student's been focusing the whole way through.
  //
  // A wrong answer never swaps to a different question: the SAME one
  // stays up. The wrong option locks in as a visible dead end (with
  // its own little "the world buckles" flavor line) and a hint
  // appears, so every wrong guess still narrows things down instead
  // of starting the question over.

  let finaleQuestion = null;
  let finaleOptions = [];

  function startFinalGauntlet() {
    finaleQuestion = FINALE_QUESTIONS[Math.floor(Math.random() * FINALE_QUESTIONS.length)];
    finaleOptions = shuffled(finaleQuestion.options);
    document.getElementById("finale-quiz-overlay").classList.add("visible");
    renderFinaleQuestion();
  }

  function renderFinaleQuestion() {
    const qEl = document.getElementById("finale-quiz-question");
    const optionsEl = document.getElementById("finale-quiz-options");
    const failureEl = document.getElementById("finale-quiz-failure");
    const feedbackEl = document.getElementById("finale-quiz-feedback");
    qEl.textContent = finaleQuestion.question;
    optionsEl.innerHTML = "";
    failureEl.textContent = "";
    failureEl.classList.remove("visible");
    feedbackEl.textContent = "\u00a0";

    finaleOptions.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "quiz-option";
      btn.textContent = opt.text;
      if (opt.tried) {
        btn.disabled = true;
        btn.classList.add("wrong");
      }
      btn.addEventListener("click", () => {
        if (opt.correct) {
          Array.from(optionsEl.children).forEach((b) => (b.disabled = true));
          btn.classList.add("correct");
          failureEl.textContent = "";
          failureEl.classList.remove("visible");
          feedbackEl.textContent = "That's it — the rift is sealing shut!";
          feedbackEl.style.color = "#5fd48a";
          PortalScene.winFinale();
        } else {
          opt.tried = true;
          btn.disabled = true;
          btn.classList.add("wrong");
          failureEl.textContent = opt.failure || "Something in the world buckles.";
          failureEl.classList.add("visible");
          feedbackEl.textContent = opt.hint ? `Hint: ${opt.hint}` : "Try again!";
          feedbackEl.style.color = "#e2572a";
          PortalScene.shakeWrong();
        }
      });
      optionsEl.appendChild(btn);
    });
  }

  return {
    buildHud,
    refreshHud,
    enterChamber,
    exitChamber,
    openPanel,
    closePanel,
    completedArray,
    startFinalGauntlet
  };
})();
