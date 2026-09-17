// ============================================================
// PORTAL TO BLUES — MAIN
// Wires the 3D scene, the dimension UI, and the audio manager
// together, and handles the back button + first-interaction
// audio unlock (required by browsers before sound can play).
// ============================================================

(function () {
  const uiLayer = document.getElementById("dimension-ui");

  function unlockAudioOnce() {
    AudioManager.unlock();
    AudioManager.playPlazaAmbient();
    window.removeEventListener("click", unlockAudioOnce);
    window.removeEventListener("touchend", unlockAudioOnce);
    window.removeEventListener("keydown", unlockAudioOnce);
  }
  window.addEventListener("click", unlockAudioOnce, { once: true });
  window.addEventListener("touchend", unlockAudioOnce, { once: true });
  window.addEventListener("keydown", unlockAudioOnce, { once: true });

  window.addEventListener("load", () => {
    PortalScene.init({
      callbacks: {
        onEnter: (index) => {
          GameUI.buildDimensionUI(index);
          uiLayer.classList.add("visible");
        },
        onExit: () => {
          uiLayer.classList.remove("visible");
        }
      }
    });

    GameUI.buildHud();

    document.getElementById("back-btn").addEventListener("click", () => {
      AudioManager.playClick();
      PortalScene.exitToPlaza();
    });
  });
})();
