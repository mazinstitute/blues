// ============================================================
// PORTAL TO BLUES — UI
// Builds each dimension's panel (story, vocab, facts, songs,
// quiz), and tracks the player's collected record badges in
// localStorage so progress survives a page reload.
// ============================================================

const GameUI = (function () {
  const STORAGE_KEY = "portalToBluesProgress";
  let progress = loadProgress();
  let currentIndex = -1;

  const uiLayer = document.getElementById("dimension-ui");

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      /* ignore — localStorage may be unavailable */
    }
    return { badges: [] };
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      /* ignore */
    }
  }

  function hasBadge(eraId) {
    return progress.badges.includes(eraId);
  }

  function awardBadge(eraId) {
    if (!hasBadge(eraId)) {
      progress.badges.push(eraId);
      saveProgress();
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
      if (hasBadge(era)) slot.classList.add("earned");
      else slot.classList.remove("earned");
    });
  }

  // ---------------- Dimension panel ----------------

  function buildDimensionUI(index) {
    currentIndex = index;
    const era = ERAS[index];

    uiLayer.style.setProperty("--theme-color", era.color);
    document.getElementById("ui-era-tag").textContent = `Dimension ${index + 1} of ${ERAS.length}`;
    document.getElementById("ui-years").textContent = era.years;
    document.getElementById("ui-years").style.color = era.color;
    document.getElementById("ui-title").textContent = era.name;
    document.getElementById("ui-blurb").textContent = era.blurb;

    buildStoryFlashcards(era);
    buildVocabFlipCards(era);
    buildFactsRevealCards(era);

    // Songs
    const songsContainer = document.getElementById("ui-songs");
    songsContainer.innerHTML = "";
    era.songs.forEach((song) => {
      const link = document.createElement("a");
      link.href = ytSearchUrl(song.title, song.artist);
      link.target = "_blank";
      link.rel = "noopener";
      link.className = "song-row flex items-center gap-4 py-4 cursor-pointer group no-underline text-white";
      link.innerHTML = `
        <div class="disc-icon w-10 h-10 rounded-full flex-shrink-0 border border-gray-600 relative">
          <div class="absolute inset-0 m-auto w-3 h-3 rounded-full" style="background:${era.color}"></div>
        </div>
        <div class="flex-grow min-w-0">
          <div class="font-semibold truncate text-lg">${song.title}</div>
          <div class="text-sm text-gray-400 truncate">${song.artist}</div>
        </div>
        <div class="opacity-0 group-hover:opacity-100 transition-opacity text-sm font-semibold" style="color:${era.color}">
          Listen &rarr;
        </div>
      `;
      link.addEventListener("click", () => AudioManager.playClick());
      songsContainer.appendChild(link);
    });

    buildQuiz(era);
  }

  // ---------------- The Story: independent flashcards, open any of them, any order ----------------

  function buildStoryFlashcards(era) {
    const container = document.getElementById("ui-history");
    container.innerHTML = "";
    const partNames = ["Part One", "Part Two", "Part Three", "Part Four", "Part Five"];
    era.history.forEach((para, i) => {
      const card = document.createElement("div");
      card.className = "flip-card story-card-flip mb-4";
      card.innerHTML = `
        <div class="flip-card-inner">
          <div class="flip-card-front">
            <p class="serif italic text-xl text-white">${partNames[i] || `Part ${i + 1}`}</p>
            <p class="flip-hint">Tap to read</p>
          </div>
          <div class="flip-card-back">
            <p class="text-sm text-gray-200 leading-relaxed">${para}</p>
          </div>
        </div>
      `;
      card.addEventListener("click", () => {
        card.classList.toggle("flipped");
        AudioManager.playClick();
      });
      container.appendChild(card);
    });
  }

  // ---------------- Key Vocabulary: click a card to flip it over ----------------

  function buildVocabFlipCards(era) {
    const container = document.getElementById("ui-vocab-list");
    container.innerHTML = "";
    era.vocab.forEach((v) => {
      const card = document.createElement("div");
      card.className = "flip-card mb-4";
      card.innerHTML = `
        <div class="flip-card-inner">
          <div class="flip-card-front">
            <p class="serif italic text-xl text-white">${v.word}</p>
            <p class="flip-hint">Tap to reveal</p>
          </div>
          <div class="flip-card-back">
            <p class="text-sm text-gray-200 leading-relaxed">${v.def}</p>
          </div>
        </div>
      `;
      card.addEventListener("click", () => {
        card.classList.toggle("flipped");
        AudioManager.playClick();
      });
      container.appendChild(card);
    });
  }

  // ---------------- Did You Know?: flip a mystery tile to reveal a fact ----------------

  function buildFactsRevealCards(era) {
    const container = document.getElementById("ui-facts");
    container.innerHTML = "";
    era.facts.forEach((f, i) => {
      const card = document.createElement("div");
      card.className = "flip-card fact-card mb-4";
      card.innerHTML = `
        <div class="flip-card-inner">
          <div class="flip-card-front fact-front">
            <span class="fact-number">${i + 1}</span>
            <p class="flip-hint">Tap to reveal a fact</p>
          </div>
          <div class="flip-card-back">
            <p class="text-sm text-gray-200 leading-relaxed">${f}</p>
          </div>
        </div>
      `;
      card.addEventListener("click", () => {
        const wasFlipped = card.classList.contains("flipped");
        card.classList.toggle("flipped");
        if (!wasFlipped) AudioManager.playHover();
      });
      container.appendChild(card);
    });
  }

  function buildQuiz(era) {
    const quizContainer = document.getElementById("ui-quiz");
    quizContainer.innerHTML = "";
    quizContainer.style.setProperty("--theme-color", era.color);

    const earned = hasBadge(era.id);

    const wrap = document.createElement("div");
    wrap.className = "quiz-card rounded-xl p-6";
    wrap.innerHTML = `
      <h3 class="text-xs uppercase tracking-widest text-gray-400 mb-4">Earn Your Record</h3>
      <p id="quiz-question" class="serif italic text-lg text-white mb-4"></p>
      <div id="quiz-options" class="flex flex-col gap-3 mb-3"></div>
      <p id="quiz-feedback" class="text-sm mt-2"></p>
    `;
    quizContainer.appendChild(wrap);

    if (earned) {
      document.getElementById("quiz-question").textContent = "You already earned this dimension's record! Nice work.";
      const badge = document.createElement("div");
      badge.className = "earned-badge";
      badge.innerHTML = `<span class="disc-icon w-14 h-14 rounded-full inline-block border-2" style="border-color:${era.color}"></span><span class="ml-3">Record collected</span>`;
      wrap.appendChild(badge);
      return;
    }

    document.getElementById("quiz-question").textContent = era.quiz.question;
    const optionsEl = document.getElementById("quiz-options");
    era.quiz.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "quiz-option";
      btn.textContent = opt;
      btn.addEventListener("click", () => {
        const correct = i === era.quiz.correct;
        AudioManager.playChime(correct);
        const feedback = document.getElementById("quiz-feedback");
        Array.from(optionsEl.children).forEach((b) => (b.disabled = true));
        if (correct) {
          btn.classList.add("correct");
          feedback.textContent = "That's right! You earned a record for your collection.";
          feedback.style.color = era.color;
          const justEarned = awardBadge(era.id);
          refreshHud();
          if (justEarned) celebrateBadge(era);
        } else {
          btn.classList.add("wrong");
          feedback.textContent = "Not quite — but you can try again next time you visit!";
          feedback.style.color = "#e2572a";
          Array.from(optionsEl.children)[era.quiz.correct].classList.add("correct");
        }
      });
      optionsEl.appendChild(btn);
    });
  }

  function celebrateBadge(era) {
    const slot = document.querySelector(`.crate-slot[data-era="${era.id}"]`);
    if (slot && window.gsap) {
      gsap.fromTo(slot, { scale: 1.8 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" });
    }
    const total = ERAS.length;
    const earned = progress.badges.length;
    if (earned === total) {
      showFinaleMessage();
    }
  }

  function showFinaleMessage() {
    const banner = document.createElement("div");
    banner.id = "finale-banner";
    banner.innerHTML = `
      <div class="finale-inner">
        <p class="serif italic text-3xl mb-2">You collected every record! 🎶</p>
        <p class="text-gray-300">You've traveled the whole story of the blues, from the Mississippi Delta to today. Keep listening — the story keeps going.</p>
        <button id="finale-close" class="back-btn px-5 py-2 rounded-full text-sm mt-4">Keep Exploring</button>
      </div>
    `;
    document.body.appendChild(banner);
    document.getElementById("finale-close").addEventListener("click", () => banner.remove());
  }

  return {
    buildHud,
    buildDimensionUI,
    refreshHud
  };
})();
