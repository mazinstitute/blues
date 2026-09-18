// ============================================================
// PORTAL TO BLUES — MAIN
// Wires the 3D scene, the panel UI, and the audio manager
// together, and handles the back/close buttons + first-interaction
// audio unlock (required by browsers before sound can play).
// ============================================================

(function () {
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
    GameUI.buildHud();

    PortalScene.init({
      completed: GameUI.completedArray(),
      callbacks: {
        onEnterChamber: (index) => GameUI.enterChamber(index),
        onPillarSelect: (index, type) => GameUI.openPanel(index, type),
        onExitToPlaza: () => GameUI.exitChamber(),
        onFinaleReady: () => GameUI.startFinalGauntlet()
      }
    });

    document.getElementById("back-btn").addEventListener("click", () => {
      AudioManager.playClick();
      PortalScene.exitToPlaza();
    });

    document.getElementById("panel-close").addEventListener("click", () => {
      AudioManager.playClick();
      GameUI.closePanel();
    });
  });
})();
