// ============================================================
// PORTAL TO BLUES — 3D SCENE
// Two 3D spaces share one scene/camera/renderer:
//   1. The Crossroads plaza — six glowing era-portals in an arc.
//   2. A "Chamber" inside whichever portal you stepped through —
//      eight 3D pillars (Story / Vocabulary / Match It / Songs /
//      Play It / On the Map / Facts / Quiz)
//      arranged the same way portals are. Click a pillar to focus
//      the camera on it; the matching content panel (built by
//      ui.js) then appears alongside it.
// Every label — portal names, pillar names — is a real 3D object
// (a canvas-texture sprite with its own background chip), not an
// HTML overlay, so it scales and spaces itself with the world
// instead of overlapping on screen.
// ============================================================

const PortalScene = (function () {
  let scene, camera, renderer, clock, raycaster, mouse;
  let container, introText, controlsHint, flashOverlay, lockedHintEl;
  let lockedHintTimeout = null;
  let callbacks = {};

  // ---- shared state ----
  const cameraY = 2.1;
  const portalY = 2.3;
  const CHAMBER_CAM = { y: 2.1, z: 13.5 };
  // Closer to the plaza than before; pulls back a little on narrow windows
  // so the outermost portals never get cropped.
  function plazaCamZ() {
    const aspect = window.innerWidth / window.innerHeight;
    return 6 + Math.max(0, 1.7 - aspect) * 8;
  }
  let mode = "plaza"; // 'plaza' | 'chamber'
  let panelOpen = false;
  let currentEraIndex = -1;
  let completed = []; // boolean per ERAS index

  // ---- plaza ----
  let plazaGroup;
  let portals = [];
  let hoveredPortalIndex = -1;
  let portalParticles = [];
  let lifeGroup = null; // people, lamps, trees, hills, campfire...
  let plazaLife = null;
  let activeWorld = null; // the current chamber's world (animations)
  let noteParticles = [];

  // ---- the chest & the reality-break finale ----
  let chestGroup = null;
  let chestUnlocked = false;
  let hoveredChest = false;
  let finaleActive = false;
  let allKeysDone = false; // true once the chest has been revealed (informational only — never gates play)
  let blackHoleGroup = null;
  let shakeStrength = 0;
  let lastShakeOffset = null; // set once THREE is available (below)

  // ---- chamber ----
  let chamberGroup;
  let pillars = [];
  let hoveredPillarIndex = -1;

  // ---- clickable background characters (plaza + chamber banter) ----
  let hoveredCharacter = null;
  let focusedCharacter = null; // the character the camera is currently zoomed in on, if any
  let characterFocusActive = false;
  let lastFocusToggleTime = 0; // guards against touchend+synthetic-click double firing
  let activeCharacterBubble = null; // { obj, side }
  let characterBubble, characterBubbleText, characterBackBtn;
  let chamberMoteData = [];
  const quizLockState = {}; // eraIndex -> true while the quiz pillar is reading-gated
  const PILLAR_TYPES = [
    { type: "story", label: "The Story", icon: "book" },
    { type: "vocab", label: "Vocabulary", icon: "gem" },
    { type: "match", label: "Match It", icon: "chain" },
    { type: "songs", label: "The Songs", icon: "records", big: true },
    { type: "instrument", label: "Play It", icon: "note" },
    { type: "map", label: "On the Map", icon: "pin" },
    { type: "facts", label: "Did You Know?", icon: "spark" },
    { type: "quiz", label: "Earn Your Record", icon: "quiz" }
  ];

  function init(opts) {
    callbacks = opts.callbacks || {};
    completed = opts.completed || ERAS.map(() => false);
    container = document.getElementById("canvas-container");
    introText = document.getElementById("intro-text");
    controlsHint = document.getElementById("controls-hint");
    flashOverlay = document.getElementById("flash-overlay");
    lockedHintEl = document.getElementById("locked-hint");
    characterBubble = document.getElementById("character-bubble");
    characterBubbleText = document.getElementById("character-bubble-text");
    characterBackBtn = document.getElementById("character-back-btn");
    if (characterBackBtn) {
      characterBackBtn.addEventListener("click", () => {
        // Same touchend+synthetic-click guard as onClick(): the tap that
        // opened the bubble must not immediately hit the Back button that
        // just appeared under the finger.
        if (performance.now() - lastFocusToggleTime < 400) return;
        if (characterFocusActive) exitCharacterFocus();
      });
    }

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101830);
    scene.fog = new THREE.FogExp2(0x101830, 0.019);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, cameraY, plazaCamZ());

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Filmic tone mapping keeps glows from clipping. Exposure is set per
    // world by applySky() so night scenes stay night (the old fixed 1.25
    // exposure is what made everything look washed out and too bright).
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.88;
    container.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    clock = new THREE.Clock();
    lastShakeOffset = new THREE.Vector3();

    buildSky();
    buildLights();
    applySky("plaza");

    plazaGroup = new THREE.Group();
    scene.add(plazaGroup);
    buildEnvironment();
    buildPortals();
    lifeGroup = new THREE.Group();
    plazaGroup.add(lifeGroup);
    plazaLife = WorldKit.buildPlazaLife(lifeGroup, portals.map((p) => p.position), ERAS.map((e) => e.color));
    buildDustParticles();
    buildNoteParticles();
    buildChest();

    chamberGroup = new THREE.Group();
    chamberGroup.visible = false;
    scene.add(chamberGroup);

    window.addEventListener("resize", onWindowResize, false);
    window.addEventListener("mousemove", onMouseMove, false);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("click", onClick, false);
    window.addEventListener("touchend", onClick, false);

    animate();
  }

  // ---------------- Sky: stars, galaxy, aurora curtains, moon ----------------
  // Every world has its own sky preset (WorldKit.SKY): colors, fog, how
  // many stars, whether the aurora is out. applySky() swaps between them.
  //  * Stars are tiny, slow-twinkling pixel dots (not huge glowing blobs).
  //  * The aurora is real vertical curtains with bright lower edges and
  //    rays, computed from the view direction so it's actually visible
  //    above the portals.

  function buildSky() {
    const skyGeo = new THREE.SphereGeometry(90, 24, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x060a1c) },
        bottomColor: { value: new THREE.Color(0x1a2748) },
        offset: { value: 8 },
        exponent: { value: 0.7 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `
    });
    scene.userData.sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(scene.userData.sky);

    // ---- Galaxy: a faint distant spiral, slowly turning ----
    const galaxyCount = 1400;
    const galaxyGeo = new THREE.BufferGeometry();
    const gPos = new Float32Array(galaxyCount * 3);
    const gCol = new Float32Array(galaxyCount * 3);
    const palette = [new THREE.Color(0xb4a0e8), new THREE.Color(0x8fc4ff), new THREE.Color(0xd0b0ff), new THREE.Color(0xffe7c3)];
    for (let i = 0; i < galaxyCount; i++) {
      const arm = i % 3;
      const t = Math.random();
      const angle = t * Math.PI * 5 + arm * ((Math.PI * 2) / 3);
      const r = 14 + t * 46;
      const spread = (Math.random() - 0.5) * 5 * (1 - t * 0.6);
      gPos[i * 3] = Math.cos(angle) * r + spread;
      gPos[i * 3 + 1] = 26 + Math.sin(t * 7) * 5 + (Math.random() - 0.5) * 5;
      gPos[i * 3 + 2] = -68 - Math.sin(angle) * r * 0.35 + spread;
      const c = palette[i % palette.length];
      gCol[i * 3] = c.r;
      gCol[i * 3 + 1] = c.g;
      gCol[i * 3 + 2] = c.b;
    }
    galaxyGeo.setAttribute("position", new THREE.BufferAttribute(gPos, 3));
    galaxyGeo.setAttribute("color", new THREE.BufferAttribute(gCol, 3));
    const galaxyMat = new THREE.PointsMaterial({
      size: 0.32,
      vertexColors: true,
      transparent: true,
      opacity: 0.32,
      sizeAttenuation: true,
      map: makeGlowTexture("#ffffff"),
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false
    });
    const galaxy = new THREE.Points(galaxyGeo, galaxyMat);
    scene.add(galaxy);
    scene.userData.galaxy = galaxy;

    // ---- Stars: small, calm, slow twinkle ----
    const starCount = 900;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starPhase = new Float32Array(starCount);
    const starSize = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      const r = 60 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.9);
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 3;
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      starPhase[i] = Math.random() * Math.PI * 2;
      starSize[i] = Math.random() < 0.04 ? 3.4 : 1.2 + Math.random() * 1.3; // pixels
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute("aPhase", new THREE.BufferAttribute(starPhase, 1));
    starGeo.setAttribute("aSize", new THREE.BufferAttribute(starSize, 1));
    const starMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPx: { value: Math.min(window.devicePixelRatio || 1, 2) },
        uOpacity: { value: 1 }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float aPhase;
        attribute float aSize;
        uniform float uTime;
        uniform float uPx;
        varying float vTw;
        void main() {
          vTw = 0.8 + 0.2 * sin(uTime * 0.9 + aPhase);
          gl_PointSize = aSize * uPx * (0.9 + 0.1 * vTw);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying float vTw;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.05, d);
          gl_FragColor = vec4(vec3(0.86, 0.9, 1.0) * vTw, a * vTw * uOpacity * 0.9);
        }
      `
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    starPoints.frustumCulled = false;
    scene.add(starPoints);
    scene.userData.stars = starPoints;
    scene.userData.starMat = starMat;

    // ---- Aurora: rippling vertical curtains with rays ----
    const auroraGeo = new THREE.SphereGeometry(82, 64, 24, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const auroraMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uStrength: { value: 1 },
        uColorA: { value: new THREE.Color(0x35f2a5) },
        uColorB: { value: new THREE.Color(0x2fb6ff) },
        uColorC: { value: new THREE.Color(0xa66bff) }
      },
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vDir = wp.xyz - cameraPosition;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uStrength;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;
        varying vec3 vDir;

        float hash(float n) { return fract(sin(n) * 43758.5453123); }
        float noise(float x) {
          float i = floor(x);
          float f = fract(x);
          f = f * f * (3.0 - 2.0 * f);
          return mix(hash(i), hash(i + 1.0), f);
        }

        void main() {
          vec3 d = normalize(vDir);
          float el = d.y;
          if (el < 0.03 || uStrength < 0.001) { gl_FragColor = vec4(0.0); return; }
          float az = atan(d.x, -d.z) + uMouse.x * 0.18;
          float t = uTime;
          float sum = 0.0;
          vec3 col = vec3(0.0);
          for (int i = 0; i < 2; i++) {
            float fi = float(i);
            // wavy lower edge of the curtain
            float base = 0.12 + fi * 0.11 + 0.05 * sin(az * 2.0 + t * 0.12 + fi * 2.0) + 0.03 * sin(az * 5.0 - t * 0.2 + fi);
            float v = el - base;
            float lower = smoothstep(0.0, 0.035, v);
            float upper = exp(-max(v, 0.0) * (5.0 - fi * 1.4));
            // vertical rays, drifting sideways
            float rays = 0.4 + 0.6 * noise(az * (34.0 + fi * 13.0) + t * (0.35 + fi * 0.15) + noise(az * 6.0 + t * 0.2) * 4.0);
            float folds = 0.55 + 0.45 * sin(az * 3.0 + t * 0.25 + fi * 1.7);
            float k = lower * upper * rays * folds;
            vec3 c = mix(uColorA, uColorB, smoothstep(0.0, 0.32, v));
            c = mix(c, uColorC, fi * 0.55 + smoothstep(0.25, 0.6, v) * 0.4);
            col += c * k;
            sum += k;
          }
          float alpha = clamp(sum * 0.95, 0.0, 0.8) * uStrength;
          gl_FragColor = vec4(col / max(sum, 0.001), alpha);
        }
      `
    });
    const aurora = new THREE.Mesh(auroraGeo, auroraMat);
    aurora.frustumCulled = false;
    scene.add(aurora);
    scene.userData.aurora = aurora;

    const moonTex = makeGlowTexture("#fff3d6");
    const moonMat = new THREE.SpriteMaterial({ map: moonTex, color: 0xdfe8ff, transparent: true, depthWrite: false, fog: false });
    const moon = new THREE.Sprite(moonMat);
    moon.scale.set(5, 5, 1);
    moon.position.set(-30, 22, -60);
    scene.add(moon);
    scene.userData.moon = moon;
  }

  function buildLights() {
    scene.userData.ambient = new THREE.AmbientLight(0x8f9ad0, 0.2);
    scene.add(scene.userData.ambient);
    scene.userData.hemi = new THREE.HemisphereLight(0x4a5c9a, 0x171425, 0.38);
    scene.add(scene.userData.hemi);
  }

  // Swap the whole atmosphere: sky colors, fog, stars, aurora, moon and
  // light levels. `key` is "plaza" or a world key from WorldKit.
  function applySky(key) {
    const p = WorldKit.SKY[key] || WorldKit.SKY.plaza;
    const sky = scene.userData.sky.material.uniforms;
    sky.topColor.value.set(p.top);
    sky.bottomColor.value.set(p.bottom);
    scene.background.set(p.bottom);
    scene.fog.color.copy(WorldKit.lin(p.fog));
    scene.fog.density = p.density;
    scene.userData.starMat.uniforms.uOpacity.value = p.stars;
    const au = scene.userData.aurora.material.uniforms;
    au.uStrength.value = p.aurora;
    au.uColorA.value.set(p.auroraColors[0]);
    au.uColorB.value.set(p.auroraColors[1]);
    au.uColorC.value.set(p.auroraColors[2]);
    scene.userData.galaxy.material.opacity = key === "plaza" || key === "modern" ? 0.32 : 0.12;
    const m = scene.userData.moon;
    m.material.color.set(p.moon.color);
    m.material.opacity = p.moon.opacity;
    m.position.set(p.moon.x, p.moon.y, p.moon.z);
    m.scale.set(p.moon.scale, p.moon.scale, 1);
    scene.userData.ambient.color.set(p.ambient[0]);
    scene.userData.ambient.intensity = p.ambient[1];
    scene.userData.hemi.color.set(p.hemi[0]);
    scene.userData.hemi.groundColor.set(p.hemi[1]);
    scene.userData.hemi.intensity = p.hemi[2];
    renderer.toneMappingExposure = p.exposure;
  }

  // ---------------- Canvas texture helpers ----------------

  function makeGlowTexture(hexColor) {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, hexColor);
    grad.addColorStop(0.25, hexColor);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }

  function makeNoteTexture() {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f5efe0";
    ctx.font = "48px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("\u266A", size / 2, size / 2 + 2);
    return new THREE.CanvasTexture(canvas);
  }

  // Draws a rounded, mostly-opaque plaque with one or two lines of text.
  // Used for every 3D label (portal names, pillar names). Built for
  // legibility: 2x supersampled canvas, big white text with a dark
  // outline, long names wrap onto two lines instead of shrinking to
  // nothing, and the sprite ignores fog and tone mapping so distance
  // never dims it.
  function makeLabelSprite(mainText, subText, color, opts) {
    opts = opts || {};
    const S = 2;
    const W = 560 * S;
    const pad = 14 * S;
    const maxW = W - pad * 2 - 44 * S;
    const scratch = document.createElement("canvas").getContext("2d");
    const setFont = (ctx, px) => (ctx.font = `italic 700 ${px}px Georgia, 'Times New Roman', serif`);

    let fs = (opts.big ? 84 : 76) * S;
    let lines = [mainText];
    setFont(scratch, fs);
    while (scratch.measureText(mainText).width > maxW && fs > 58 * S) {
      fs -= 2 * S;
      setFont(scratch, fs);
    }
    if (scratch.measureText(mainText).width > maxW) {
      // wrap onto two lines at the space nearest the middle
      const words = mainText.split(" ");
      let best = 1, bestDiff = 1e9;
      for (let i = 1; i < words.length; i++) {
        const diff = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
        if (diff < bestDiff) { bestDiff = diff; best = i; }
      }
      lines = [words.slice(0, best).join(" "), words.slice(best).join(" ")];
      fs = 70 * S;
      setFont(scratch, fs);
      while (lines.some((l) => scratch.measureText(l).width > maxW) && fs > 36 * S) {
        fs -= 2 * S;
        setFont(scratch, fs);
      }
    }
    const lineH = fs * 1.16;
    const subH = subText ? 46 * S : 0;
    const H = Math.ceil(pad * 2 + subH + lines.length * lineH + 20 * S);

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 26 * S);
    ctx.fillStyle = "rgba(6,8,18,0.9)";
    ctx.fill();
    ctx.lineWidth = 4 * S;
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let y = pad + 12 * S;
    if (subText) {
      ctx.fillStyle = new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.35).getStyle();
      ctx.font = `700 ${30 * S}px 'Work Sans', Arial, sans-serif`;
      if ("letterSpacing" in ctx) ctx.letterSpacing = `${3 * S}px`;
      ctx.fillText(subText.toUpperCase(), W / 2, y + 22 * S);
      if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
      y += subH;
    }
    setFont(ctx, fs);
    ctx.lineJoin = "round";
    lines.forEach((line, i) => {
      const ly = y + lineH * (i + 0.5) + 2 * S;
      ctx.lineWidth = 7 * S;
      ctx.strokeStyle = "rgba(0,0,0,0.85)";
      ctx.strokeText(line, W / 2, ly);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(line, W / 2, ly);
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;
    tex.encoding = THREE.sRGBEncoding;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, fog: false, toneMapped: false });
    const sprite = new THREE.Sprite(mat);
    const worldW = opts.worldWidth || 2.8;
    sprite.scale.set(worldW, (worldW * H) / W, 1);
    if (opts.anchorBottom) sprite.center.set(0.5, 0);
    // Labels are UI, not scene geometry: always drawn last, never dimmed.
    sprite.renderOrder = 999;
    return sprite;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // A small "checkmark" badge sprite used to mark a completed portal/quiz.
  function makeCheckSprite() {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
    ctx.fillStyle = "#f2c94c";
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#3a2a05";
    ctx.beginPath();
    ctx.moveTo(size * 0.28, size * 0.53);
    ctx.lineTo(size * 0.45, size * 0.7);
    ctx.lineTo(size * 0.74, size * 0.32);
    ctx.stroke();
    return new THREE.CanvasTexture(canvas);
  }

  function makeLockTexture(color) {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = color;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(size / 2, size * 0.42, size * 0.2, Math.PI, 0, false);
    ctx.stroke();
    ctx.fillStyle = color;
    roundRect(ctx, size * 0.26, size * 0.44, size * 0.48, size * 0.38, 10);
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
  }

  function makeQuestionMarkTexture(color) {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = color;
    ctx.font = "bold 96px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", size / 2, size / 2 + 6);
    return new THREE.CanvasTexture(canvas);
  }

  // ---------------- Ground, crossroads paths, tree, signpost ----------------

  function loadOptionalTexture(url, onOk) {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(12, 12);
        onOk(tex);
      },
      undefined,
      () => {}
    );
  }

  function makeGroundTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const x = c.getContext("2d");
    x.fillStyle = "#6a7498";
    x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 5000; i++) {
      x.fillStyle = Math.random() < 0.5 ? "#7c88ae" : "#4c5478";
      x.globalAlpha = 0.1 + Math.random() * 0.3;
      const sz = 1 + Math.random() * 3;
      x.fillRect(Math.random() * 512, Math.random() * 512, sz, sz);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(16, 16);
    t.anisotropy = 4;
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  function buildEnvironment() {
    const groundGeo = new THREE.PlaneGeometry(100, 100, 32, 32);
    const groundTex = makeGroundTexture();
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: groundTex, roughness: 0.92, metalness: 0.05 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    plazaGroup.add(ground);
    loadOptionalTexture("assets/textures/ground-dirt.jpg", (tex) => {
      groundMat.map = tex;
      groundMat.color.set(0xffffff);
      groundMat.needsUpdate = true;
    });
    scene.userData.ground = ground;

    scene.userData.grid = null; // the old neon grid is gone: it read as "empty tech void"

    const pathMat = new THREE.MeshStandardMaterial({
      color: 0x4a3e3c,
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
      opacity: 0.9
    });
    const pathA = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 60), pathMat);
    pathA.rotation.x = -Math.PI / 2;
    pathA.position.y = 0.015;
    plazaGroup.add(pathA);
    const pathB = pathA.clone();
    pathB.rotation.z = Math.PI / 2;
    plazaGroup.add(pathB);

    const horizonLight = new THREE.PointLight(0x4258a8, 0.9, 60);
    horizonLight.position.set(0, 6, -25);
    plazaGroup.add(horizonLight);

    buildTree();
    buildSignpost();
  }

  function buildTree() {
    const tree = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1c140f, roughness: 1 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 3.2, 7), trunkMat);
    trunk.position.y = 1.6;
    tree.add(trunk);

    for (let i = 0; i < 5; i++) {
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.12, 1.6, 5), trunkMat);
      const ang = (i / 5) * Math.PI * 2;
      branch.position.set(Math.cos(ang) * 0.4, 3.1 + Math.random() * 0.4, Math.sin(ang) * 0.4);
      branch.rotation.z = Math.cos(ang) * 0.9;
      branch.rotation.x = Math.sin(ang) * 0.9;
      tree.add(branch);
    }

    tree.position.set(-9, 0, -6);
    plazaGroup.add(tree);
    scene.userData.tree = tree;

    const rimLight = new THREE.PointLight(0x6f56a8, 0.5, 8);
    rimLight.position.set(-9, 3, -6);
    plazaGroup.add(rimLight);
  }

  function buildSignpost() {
    const group = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({ color: 0x2a1f18, roughness: 0.95 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.6, 8), postMat);
    post.position.y = 1.3;
    group.add(post);

    const lanternGlow = makeGlowTexture("#ffd98a");
    const lanternMat = new THREE.SpriteMaterial({ map: lanternGlow, transparent: true, depthWrite: false });
    const lantern = new THREE.Sprite(lanternMat);
    lantern.scale.set(1.4, 1.4, 1);
    lantern.position.y = 2.75;
    group.add(lantern);

    const lanternLight = new THREE.PointLight(0xffd28a, 1.2, 10);
    lanternLight.position.y = 2.7;
    group.add(lanternLight);

    group.position.set(-2.6, 0, 0.3);
    plazaGroup.add(group);
    scene.userData.lanternLight = lanternLight;
    scene.userData.signpost = group;
  }

  // ---------------- Portals (plaza) ----------------

  const portalVertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const portalFragmentShader = `
    uniform float uTime;
    uniform vec3 uColor;
    uniform float uHover;
    uniform float uGold;
    uniform float uStyle;
    varying vec2 vUv;

    void main() {
      vec2 c = vUv - 0.5;
      float dist = length(c) * 2.0;
      float ang = atan(c.y, c.x);
      float bands = 0.0;

      if (uStyle < 0.5) {
        // Delta: slow river ripples
        bands = sin(dist * 16.0 - uTime * 1.8 + sin(ang * 3.0 + uTime * 0.4) * 1.2) * 0.5 + 0.5;
      } else if (uStyle < 1.5) {
        // Boogie Woogie: bouncing piano-key bars
        float k = abs(sin(ang * 7.0 + uTime * 0.6));
        bands = smoothstep(0.35, 0.95, k) * (0.55 + 0.45 * sin(dist * 10.0 - uTime * 3.0));
      } else if (uStyle < 2.5) {
        // Chicago: crackling electric arcs
        bands = pow(1.0 - abs(sin(ang * 4.0 + sin(dist * 9.0 - uTime * 3.5) * 1.6 + uTime * 0.5)), 5.0) * 1.4 + 0.15;
      } else if (uStyle < 3.5) {
        // R&B: record grooves with a turning sheen
        bands = 0.35 + 0.35 * sin(dist * 46.0) + 0.4 * pow(max(0.0, sin(ang * 2.0 - uTime * 1.2)), 6.0);
      } else if (uStyle < 4.5) {
        // British Blues Rock: a tight vortex
        bands = pow(sin(ang * 2.0 + dist * 12.0 - uTime * 2.6) * 0.5 + 0.5, 1.6);
      } else {
        // Modern: flowing waves
        bands = sin(c.x * 9.0 + sin(c.y * 6.0 + uTime * 1.2) * 1.6 + uTime * 1.5) * 0.5 + 0.5;
      }
      bands = clamp(bands, 0.0, 1.0);

      float edgeFade = smoothstep(1.0, 0.65, dist);
      float core = smoothstep(0.9, 0.0, dist) * 0.5;

      float alpha = (bands * 0.55 + core) * edgeFade;
      alpha *= (0.7 + uHover * 0.5);

      vec3 baseCol = uColor * (0.6 + bands * 0.7) + vec3(1.0) * core * 0.25;
      vec3 goldCol = vec3(0.95, 0.78, 0.35) * (0.7 + bands * 0.6) + vec3(1.0) * core * 0.25;
      vec3 col = mix(baseCol, goldCol, uGold * 0.55);
      gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    }
  `;

  function buildPortals() {
    const portalCount = ERAS.length;
    const arcRadius = 13.5;
    const arcSpan = THREE.MathUtils.degToRad(108);
    const startAngle = Math.PI / 2 + arcSpan / 2;

    ERAS.forEach((era, i) => {
      const angle = startAngle - i * (arcSpan / (portalCount - 1));
      const color = new THREE.Color(era.color);
      const style = WorldKit.worldIndex(era.id, i);

      const portalGroup = new THREE.Group();
      const px = Math.cos(angle) * arcRadius;
      const pz = -Math.sin(angle) * arcRadius;
      portalGroup.position.set(px, portalY, pz);
      portalGroup.lookAt(0, portalY, 0);

      // Each dimension gets its own frame design (see WorldKit.portalFrame).
      const frame = WorldKit.portalFrame(style, era.color);
      portalGroup.add(frame.group);
      const ring = frame.ring;

      // Second thin ring, only lit up gold once the era is completed.
      const goldRingGeo = new THREE.TorusGeometry(2.28, 0.045, 8, 64);
      const goldRingMat = new THREE.MeshBasicMaterial({ color: 0xf2c94c, transparent: true, opacity: 0 });
      const goldRing = new THREE.Mesh(goldRingGeo, goldRingMat);
      portalGroup.add(goldRing);

      const swirlGeo = new THREE.CircleGeometry(1.9, 48);
      const swirlMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: Math.random() * 10 },
          uColor: { value: color },
          uHover: { value: 0 },
          uGold: { value: 0 },
          uStyle: { value: style }
        },
        vertexShader: portalVertexShader,
        fragmentShader: portalFragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const swirl = new THREE.Mesh(swirlGeo, swirlMat);
      portalGroup.add(swirl);

      const detailGeo = new THREE.RingGeometry(1.4, 1.8, 32);
      const detailMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        wireframe: true
      });
      const detailRing = new THREE.Mesh(detailGeo, detailMat);
      portalGroup.add(detailRing);

      const hitGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.5, 16);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitBox = new THREE.Mesh(hitGeo, hitMat);
      hitBox.rotation.x = Math.PI / 2;
      portalGroup.add(hitBox);

      const pLight = new THREE.PointLight(color, 1.5, 13);
      portalGroup.add(pLight);

      const sparkleCount = 30;
      const sparkleGeo = new THREE.BufferGeometry();
      const sparklePos = new Float32Array(sparkleCount * 3);
      const sparkleData = [];
      for (let sp = 0; sp < sparkleCount; sp++) {
        const a = (sp / sparkleCount) * Math.PI * 2;
        sparklePos[sp * 3] = Math.cos(a) * 2.05;
        sparklePos[sp * 3 + 1] = Math.sin(a) * 2.05;
        sparklePos[sp * 3 + 2] = 0;
        sparkleData.push({ angle: a, speed: 0.3 + Math.random() * 0.4, radius: 2.0 + Math.random() * 0.3 });
      }
      sparkleGeo.setAttribute("position", new THREE.BufferAttribute(sparklePos, 3));
      const sparkleMat = new THREE.PointsMaterial({
        size: 0.09,
        color: color,
        map: makeGlowTexture("#ffffff"),
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const sparkles = new THREE.Points(sparkleGeo, sparkleMat);
      portalGroup.add(sparkles);

      // 3D label: big, sitting just above the ring, wraps long names.
      const label = makeLabelSprite(era.name, era.years, era.color, { worldWidth: 4.6, anchorBottom: true });
      // sits above the tallest frame decoration (British spikes, Boogie keys)
      label.position.set(0, 3.15, 0);
      portalGroup.add(label);
      const labelTop = 3.15 + label.scale.y;

      // "Collected" badge + tag, stacked above the label (never on it).
      const checkTex = makeCheckSprite();
      const checkMat = new THREE.SpriteMaterial({ map: checkTex, transparent: true, depthWrite: false, depthTest: false, opacity: 0, fog: false });
      const checkBadge = new THREE.Sprite(checkMat);
      checkBadge.scale.set(0.6, 0.6, 1);
      checkBadge.position.set(1.45, labelTop + 0.42, 0);
      checkBadge.renderOrder = 999;
      portalGroup.add(checkBadge);

      const collectedLabel = makeLabelSprite("Completed", null, "#f2c94c", { worldWidth: 2.0, anchorBottom: true });
      collectedLabel.position.set(-0.2, labelTop + 0.12, 0);
      collectedLabel.material.opacity = 0;
      portalGroup.add(collectedLabel);

      portalGroup.userData = {
        index: i,
        ring,
        frame,
        goldRing,
        swirl,
        swirlMat,
        detail: detailRing,
        light: pLight,
        color,
        sparkles,
        sparkleData,
        sparkleBaseColor: color.clone(),
        checkBadge,
        collectedLabel
      };

      plazaGroup.add(portalGroup);
      portals.push(portalGroup);
    });

    applyCompletedVisuals();
  }

  function applyCompletedVisuals() {
    portals.forEach((p, i) => {
      const isDone = !!completed[i];
      const u = p.userData;
      u.goldRing.material.opacity = isDone ? 0.85 : 0;
      u.swirlMat.uniforms.uGold.value = isDone ? 1 : 0;
      u.checkBadge.material.opacity = isDone ? 1 : 0;
      u.collectedLabel.material.opacity = isDone ? 0.9 : 0;
      if (isDone) {
        u.sparkles.material.color.set(0xf2c94c);
      } else {
        u.sparkles.material.color.copy(u.sparkleBaseColor);
      }
    });
  }

  function setPortalCompleted(index, isCompleted) {
    completed[index] = isCompleted;
    if (!portals[index]) return;
    const p = portals[index];
    const u = p.userData;
    if (window.gsap) {
      gsap.to(u.goldRing.material, { opacity: isCompleted ? 0.85 : 0, duration: 0.6 });
      gsap.to(u.swirlMat.uniforms.uGold, { value: isCompleted ? 1 : 0, duration: 0.8 });
      gsap.to(u.checkBadge.material, { opacity: isCompleted ? 1 : 0, duration: 0.6 });
      gsap.to(u.collectedLabel.material, { opacity: isCompleted ? 0.9 : 0, duration: 0.6 });
    } else {
      applyCompletedVisuals();
    }
    if (isCompleted) {
      gsap && gsap.to(u.sparkles.material.color, { r: 0.95, g: 0.78, b: 0.3, duration: 0.8 });
    }
  }

  // ---------------- The chest (plaza center, appears once all six keys are collected) ----------------

  function buildChest() {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3b2417, roughness: 0.85, metalness: 0.05 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf2c94c, emissive: 0xf2c94c, emissiveIntensity: 0.55, roughness: 0.3, metalness: 0.8 });

    const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.85, 1.0), woodMat);
    base.position.y = 0.425;
    group.add(base);

    [-0.62, 0, 0.62].forEach((x) => {
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.89, 1.04), goldMat);
      band.position.set(x, 0.425, 0);
      group.add(band);
    });

    // Lid hinges open at the back edge.
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.85, -0.5);
    group.add(lidPivot);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.35, 1.05), woodMat);
    lid.position.set(0, 0.17, 0.52);
    lidPivot.add(lid);
    const lidBand = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.38, 0.12), goldMat);
    lidBand.position.set(0, 0.17, 0.02);
    lidPivot.add(lidBand);

    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.1), goldMat);
    lock.position.set(0, 0.75, 0.51);
    group.add(lock);

    // A soft glow hinting something's inside, and a floating label —
    // both start invisible; revealChest() fades them in.
    const glowTex = makeGlowTexture("#fff3c4");
    const glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0 });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.set(2.4, 2.4, 1);
    glow.position.set(0, 0.85, 0);
    group.add(glow);

    const light = new THREE.PointLight(0xf2c94c, 0, 7);
    light.position.set(0, 1.3, 0);
    group.add(light);

    const label = makeLabelSprite("A Mysterious Chest", "Tap to open", "#f2c94c", { worldWidth: 2.6 });
    label.position.set(0, 2.15, 0);
    label.material.opacity = 0;
    group.add(label);

    const hit = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.4, 1.8), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 1.0;
    group.add(hit);

    group.position.set(0, 0, -3);
    group.scale.set(0.001, 0.001, 0.001);
    group.visible = false;
    group.userData = { lidPivot, glow, light, label, hit, revealed: false };

    plazaGroup.add(group);
    chestGroup = group;
  }

  // Called once the sixth (final) key/record is earned. Safe to call
  // more than once — only does anything the first time.
  function revealChest() {
    if (!chestGroup || chestGroup.userData.revealed) return;
    chestGroup.userData.revealed = true;
    chestGroup.visible = true;
    chestUnlocked = true;
    // All six keys are in. The chest and the black-hole finale beyond
    // it are a completely optional bonus scene — portals stay open so
    // a player can keep freely revisiting any dimension whether or
    // not they ever choose to open the chest.
    allKeysDone = true;
    gsap.to(chestGroup.scale, { x: 1, y: 1, z: 1, duration: 1, ease: "back.out(1.6)" });
    gsap.to(chestGroup.userData.glow.material, { opacity: 0.8, duration: 1.2 });
    gsap.to(chestGroup.userData.light, { intensity: 1.3, duration: 1.2 });
    gsap.to(chestGroup.userData.label.material, { opacity: 0.95, duration: 1.2, delay: 0.3 });
  }

  function raycastChest() {
    if (!chestGroup || !chestUnlocked) return;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(chestGroup.userData.hit, false);
    const found = intersects.length > 0;
    if (found !== hoveredChest) {
      hoveredChest = found;
      if (found) {
        gsap.to(chestGroup.scale, { x: 1.08, y: 1.08, z: 1.08, duration: 0.3, ease: "back.out(1.5)" });
        document.body.style.cursor = "pointer";
        AudioManager.playHover();
      } else {
        gsap.to(chestGroup.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
        document.body.style.cursor = "default";
      }
    }
  }

  // ---------------- Opening the chest: the reality-break finale ----------------
  // Tapping the chest starts an uninterruptible cinematic: the lid pops
  // open, the plaza is torn apart and sucked into a black hole, and once
  // the destruction settles the game hands off to GameUI's final
  // multiple-choice gauntlet (see callbacks.onFinaleReady). A correct
  // answer collapses the black hole and reloads the page — which is
  // also how progress resets for the next student, since nothing here
  // is ever saved to begin with.

  function openChest() {
    if (finaleActive || !chestGroup) return;
    finaleActive = true;
    mode = "finale";
    chestUnlocked = false;
    hoveredChest = false;
    document.body.style.cursor = "default";
    cancelCharacterFocus();
    introText.style.opacity = "0";
    controlsHint.style.opacity = "0";
    const hud = document.getElementById("hud");
    if (hud) gsap.to(hud, { opacity: 0, duration: 0.5 });

    AudioManager.playWhoosh();
    gsap.to(chestGroup.userData.lidPivot.rotation, { x: -Math.PI * 0.75, duration: 0.55, ease: "back.out(1.4)" });
    gsap.to(chestGroup.userData.light, { intensity: 7, duration: 0.4, yoyo: true, repeat: 1 });

    flashOverlay.style.background = "#fff8e0";
    gsap.to(flashOverlay, {
      opacity: 0.95,
      duration: 0.35,
      delay: 0.4,
      ease: "power1.in",
      onComplete: () => {
        gsap.to(flashOverlay, { opacity: 0, duration: 0.5 });
        startRealityBreak();
      }
    });
  }

  function startRealityBreak() {
    AudioManager.playDestructionSequence(2.6);

    const holeCenter = new THREE.Vector3(0, 2.4, -3);

    // Pull the camera back to a wide, dramatic angle on the whole plaza.
    gsap.to(camera.position, { x: 0, y: 4.6, z: 11, duration: 1.2, ease: "power2.inOut" });
    gsap.to({ t: 0 }, {
      t: 1,
      duration: 1.2,
      onUpdate: () => camera.lookAt(holeCenter)
    });

    // Camera shake ramps up as everything gets torn apart, then eases
    // off once the destruction settles (see the delayedCall below).
    const shakeState = { v: 0.05 };
    shakeStrength = shakeState.v;
    gsap.to(shakeState, {
      v: 0.85,
      duration: 2.2,
      ease: "power2.in",
      onUpdate: () => (shakeStrength = shakeState.v)
    });

    // Sky and fog drain to black.
    gsap.to(scene.fog.color, { r: 0, g: 0, b: 0, duration: 3 });
    gsap.to(scene.userData.sky.material.uniforms.topColor.value, { r: 0, g: 0, b: 0, duration: 3 });
    gsap.to(scene.userData.sky.material.uniforms.bottomColor.value, { r: 0, g: 0, b: 0, duration: 3 });
    if (scene.userData.starMat) gsap.to(scene.userData.starMat.uniforms.uOpacity, { value: 0, duration: 2 });
    if (scene.userData.aurora) gsap.to(scene.userData.aurora.material.uniforms.uStrength, { value: 0, duration: 2 });
    if (lifeGroup) {
      gsap.to(lifeGroup.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 2.2, delay: 0.3, ease: "power3.in", onComplete: () => (lifeGroup.visible = false) });
    }
    if (scene.userData.moon) {
      gsap.to(scene.userData.moon.material, { opacity: 0, duration: 1.5 });
      gsap.to(scene.userData.moon.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 1.5 });
    }
    if (scene.userData.particles) gsap.to(scene.userData.particles.material, { opacity: 0, duration: 1.5 });
    if (scene.userData.notes) gsap.to(scene.userData.notes.material, { opacity: 0, duration: 1.5 });
    if (scene.userData.ground) gsap.to(scene.userData.ground.material.color, { r: 0, g: 0, b: 0, duration: 3 });
    if (scene.userData.grid) gsap.to(scene.userData.grid.material, { opacity: 0, duration: 2, delay: 0.6 });

    buildBlackHole(holeCenter);

    // Every portal gets ripped from its spot in the arc and pulled in.
    portals.forEach((p, i) => {
      const delay = 0.15 + i * 0.12;
      gsap.to(p.position, { x: holeCenter.x, y: holeCenter.y, z: holeCenter.z, duration: 1.6, delay, ease: "power3.in" });
      gsap.to(p.rotation, {
        x: `+=${6 + Math.random() * 4}`,
        y: `+=${6 + Math.random() * 4}`,
        z: `+=${6 + Math.random() * 4}`,
        duration: 1.6,
        delay,
        ease: "power2.in"
      });
      gsap.to(p.scale, {
        x: 0.01,
        y: 0.01,
        z: 0.01,
        duration: 1.6,
        delay,
        ease: "power3.in",
        onComplete: () => (p.visible = false)
      });
    });

    // The tree and signpost topple in after the portals.
    [scene.userData.tree, scene.userData.signpost].forEach((obj) => {
      if (!obj) return;
      gsap.to(obj.position, { x: holeCenter.x, y: holeCenter.y, z: holeCenter.z, duration: 1.8, delay: 0.3, ease: "power3.in" });
      gsap.to(obj.rotation, { x: `+=${4 + Math.random() * 4}`, z: `+=${4 + Math.random() * 4}`, duration: 1.8, delay: 0.3 });
      gsap.to(obj.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 1.8, delay: 0.3, onComplete: () => (obj.visible = false) });
    });

    // The chest itself gets pulled in too.
    gsap.to(chestGroup.position, { x: holeCenter.x, y: holeCenter.y, z: holeCenter.z, duration: 1.4, delay: 0.5, ease: "power3.in" });
    gsap.to(chestGroup.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 1.4, delay: 0.5, onComplete: () => (chestGroup.visible = false) });

    spawnGroundDebris(holeCenter);

    // Once the destruction has mostly settled, ease off the shake, pull
    // the camera in a little closer to the black hole, and hand off to
    // the final question.
    gsap.delayedCall(2.6, () => {
      const settle = { v: shakeStrength };
      gsap.to(settle, { v: 0.15, duration: 1, onUpdate: () => (shakeStrength = settle.v) });
      gsap.to(camera.position, { x: 0, y: 2.6, z: 6.5, duration: 1.4, ease: "power2.out" });
      gsap.to({ t: 0 }, { t: 1, duration: 1.4, onUpdate: () => camera.lookAt(holeCenter) });

      gsap.delayedCall(1.3, () => {
        const finalSettle = { v: shakeStrength };
        gsap.to(finalSettle, { v: 0.02, duration: 0.8, onUpdate: () => (shakeStrength = finalSettle.v) });
        if (callbacks.onFinaleReady) callbacks.onFinaleReady();
      });
    });
  }

  function spawnGroundDebris(holeCenter) {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x1c1a20, roughness: 0.9, metalness: 0.1 });
    for (let i = 0; i < 40; i++) {
      const size = 0.15 + Math.random() * 0.35;
      const rock = new THREE.Mesh(new THREE.BoxGeometry(size, size * 0.7, size), rockMat);
      const a = Math.random() * Math.PI * 2;
      const r = 2 + Math.random() * 9;
      rock.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r - 3);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      scene.add(rock);

      const delay = 0.2 + Math.random() * 0.8;
      const dur = 1.1 + Math.random() * 0.6;
      gsap.to(rock.position, {
        x: holeCenter.x,
        y: holeCenter.y + (Math.random() - 0.5) * 1.5,
        z: holeCenter.z,
        duration: dur,
        delay,
        ease: "power2.in",
        onComplete: () => {
          scene.remove(rock);
          rock.geometry.dispose();
          rock.material.dispose();
        }
      });
      gsap.to(rock.rotation, {
        x: `+=${6 + Math.random() * 6}`,
        y: `+=${6 + Math.random() * 6}`,
        duration: dur,
        delay
      });
      gsap.to(rock.scale, { x: 0.01, y: 0.01, z: 0.01, duration: dur, delay: delay + 0.3 });
    }
  }

  function buildBlackHole(center) {
    const group = new THREE.Group();
    group.position.copy(center);
    group.scale.set(0.001, 0.001, 0.001);

    const core = new THREE.Mesh(new THREE.SphereGeometry(1.1, 32, 24), new THREE.MeshBasicMaterial({ color: 0x000000 }));
    group.add(core);

    // The accretion disc reuses the portal swirl shader with a hotter,
    // white-purple palette and full-intensity swirl.
    const discMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0xfff2c9) },
        uHover: { value: 1 },
        uGold: { value: 0 },
        uStyle: { value: 4 }
      },
      vertexShader: portalVertexShader,
      fragmentShader: portalFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const disc = new THREE.Mesh(new THREE.RingGeometry(1.2, 3.4, 64), discMat);
    group.add(disc);
    const disc2 = new THREE.Mesh(new THREE.RingGeometry(1.2, 3.4, 64), discMat.clone());
    disc2.rotation.x = Math.PI / 2.4;
    group.add(disc2);

    const glowTex = makeGlowTexture("#e9d8ff");
    const glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.set(9, 9, 1);
    group.add(glow);

    const light = new THREE.PointLight(0xcaa8ff, 3, 22);
    group.add(light);

    // Debris motes spiral inward and vanish — recycled to an outer
    // radius so the effect keeps going for as long as the finale lasts.
    const moteCount = 140;
    const moteGeo = new THREE.BufferGeometry();
    const motePos = new Float32Array(moteCount * 3);
    const moteData = [];
    for (let i = 0; i < moteCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * 5;
      motePos[i * 3] = Math.cos(a) * r;
      motePos[i * 3 + 1] = (Math.random() - 0.5) * 3;
      motePos[i * 3 + 2] = Math.sin(a) * r;
      moteData.push({ angle: a, radius: r, speed: 0.6 + Math.random() * 0.8, fall: 0.35 + Math.random() * 0.5 });
    }
    moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
    const moteMat = new THREE.PointsMaterial({
      size: 0.12,
      color: 0xffffff,
      map: makeGlowTexture("#ffffff"),
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const motes = new THREE.Points(moteGeo, moteMat);
    group.add(motes);

    scene.add(group);
    blackHoleGroup = group;
    blackHoleGroup.userData = { core, disc, disc2, discMat, glow, light, motes, moteData };

    gsap.to(group.scale, { x: 1, y: 1, z: 1, duration: 2.4, ease: "power2.out" });
  }

  // Called by GameUI when the player answers the final question right.
  function winFinale() {
    AudioManager.playChime(true);
    if (blackHoleGroup) {
      gsap.to(blackHoleGroup.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.9, ease: "power3.in" });
      gsap.to(blackHoleGroup.userData.light, { intensity: 8, duration: 0.3, yoyo: true, repeat: 1 });
    }
    flashOverlay.style.background = "#ffffff";
    gsap.to(flashOverlay, {
      opacity: 1,
      duration: 0.9,
      delay: 0.5,
      ease: "power1.in",
      onComplete: () => window.location.reload()
    });
  }

  // Called by GameUI when the player answers the final question wrong —
  // a jolt of shake and a small pulse of the black hole, then GameUI
  // moves on to the next question itself.
  function shakeWrong() {
    AudioManager.playChime(false);
    shakeStrength = Math.max(shakeStrength, 0.35);
    const settle = { v: shakeStrength };
    gsap.to(settle, { v: 0.03, duration: 0.6, onUpdate: () => (shakeStrength = settle.v) });
    if (blackHoleGroup) {
      gsap.to(blackHoleGroup.scale, { x: "+=0.06", y: "+=0.06", z: "+=0.06", duration: 0.25, yoyo: true, repeat: 1, ease: "power1.inOut" });
    }
  }

  // ---------------- Chamber (inside a portal): 3D pillars ----------------

  function buildChamber(index) {
    // clear previous chamber contents
    while (chamberGroup.children.length) {
      const child = chamberGroup.children.pop();
      disposeObject(child);
    }
    pillars = [];
    hoveredPillarIndex = -1;
    activeWorld = null;

    const era = ERAS[index];
    const color = new THREE.Color(era.color);

    // The world: ground, sky dressing, props, people and atmosphere are all
    // built per dimension in WorldKit (worlds.js), so each portal leads to
    // a genuinely different place rather than a recolored copy.
    activeWorld = WorldKit.buildWorld(WorldKit.worldIndex(era.id, index), chamberGroup, era.color);

    const pLight = new THREE.PointLight(color, 1.1, 34);
    pLight.position.set(0, 6, -2);
    chamberGroup.add(pLight);
    const fillLight = new THREE.PointLight(0xffffff, 0.3, 26);
    fillLight.position.set(0, 8, 8);
    chamberGroup.add(fillLight);

    // Eight pillars, arranged the same way the plaza portals are —
    // the "Songs" pillar sits near the center and stands taller, since
    // the songs are meant to be the centerpiece of each dimension.
    const count = PILLAR_TYPES.length;
    const radius = 9.6;
    const arcSpan = THREE.MathUtils.degToRad(165);
    const startAngle = Math.PI / 2 + arcSpan / 2;

    PILLAR_TYPES.forEach((def, i) => {
      const angle = startAngle - i * (arcSpan / (count - 1));
      const px = Math.cos(angle) * radius;
      const pz = -Math.sin(angle) * radius;
      const big = !!def.big;

      const group = new THREE.Group();
      group.position.set(px, 0, pz);
      group.lookAt(0, 0, 0);

      const shaftH = big ? 4.0 : 3.0;
      const shaftR = big ? 0.5 : 0.35;
      const stoneMat = new THREE.MeshStandardMaterial({
        color: activeWorld.pillarColor,
        roughness: 0.7,
        metalness: 0.25,
        emissive: color,
        emissiveIntensity: 0.2
      });
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(shaftR * 0.85, shaftR, shaftH, 10), stoneMat);
      shaft.position.y = shaftH / 2;
      group.add(shaft);

      const capMat = new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.55, roughness: 0.4 });
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(shaftR * 1.15, shaftR * 1.15, 0.15, 10), capMat);
      cap.position.y = shaftH + 0.08;
      group.add(cap);

      const iconAnchor = new THREE.Group();
      iconAnchor.position.y = shaftH + (big ? 1.05 : 0.85);
      group.add(iconAnchor);

      const icon = buildPillarIcon(def, color, era, index, big);
      iconAnchor.add(icon);

      const iconLight = new THREE.PointLight(color, 1.0, 6.5);
      iconAnchor.add(iconLight);

      const label = makeLabelSprite(def.label, null, era.color, { worldWidth: big ? 3.6 : 3.1 });
      label.position.y = shaftH + (big ? 2.55 : 2.2);
      group.add(label);

      const hitGeo = new THREE.CylinderGeometry(1.1, 1.1, shaftH + 2.2, 12);
      const hitMesh = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false }));
      hitMesh.position.y = (shaftH + 2.2) / 2 - 0.4;
      group.add(hitMesh);

      group.userData = { type: def.type, iconAnchor, icon, label, shaft: cap, hit: hitMesh, baseY: iconAnchor.position.y };
      chamberGroup.add(group);
      pillars.push(group);
    });
  }

  function buildPillarIcon(def, color, era, eraIndex, big) {
    const g = new THREE.Group();
    const emissiveIntensity = 0.72;

    if (def.type === "story") {
      const geo = new THREE.TorusKnotGeometry(0.42, 0.15, 90, 12);
      const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity, roughness: 0.3, metalness: 0.5 });
      g.add(new THREE.Mesh(geo, mat));
    } else if (def.type === "vocab") {
      const geo = new THREE.OctahedronGeometry(0.58, 0);
      const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity, roughness: 0.15, metalness: 0.7 });
      g.add(new THREE.Mesh(geo, mat));
    } else if (def.type === "facts") {
      const geo = new THREE.IcosahedronGeometry(0.52, 0);
      const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity, roughness: 0.2, metalness: 0.6 });
      g.add(new THREE.Mesh(geo, mat));
    } else if (def.type === "songs") {
      // A little stack of spinning vinyl records — the centerpiece icon.
      const discMat = new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.35, metalness: 0.6, emissive: color, emissiveIntensity: 0.15 });
      const labelMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.3 });
      for (let i = 0; i < 3; i++) {
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 28), discMat);
        disc.position.set((i - 1) * 0.16, i * 0.09, (i - 1) * 0.05);
        disc.rotation.x = Math.PI / 2 + (i - 1) * 0.12;
        disc.userData.spin = 0.4 + i * 0.15;
        const centerLabel = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.052, 20), labelMat);
        centerLabel.position.copy(disc.position);
        centerLabel.rotation.copy(disc.rotation);
        g.add(disc);
        g.add(centerLabel);
      }
    } else if (def.type === "match") {
      // Two interlocked rings — a simple, readable "connect the pairs" symbol.
      const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity, roughness: 0.25, metalness: 0.6 });
      const ringA = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.09, 12, 24), mat);
      ringA.position.x = -0.22;
      ringA.rotation.y = Math.PI / 2.4;
      const ringB = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.09, 12, 24), mat);
      ringB.position.x = 0.22;
      ringB.rotation.y = -Math.PI / 2.4;
      g.add(ringA, ringB);
    } else if (def.type === "instrument") {
      // A stylized musical note (head + stem + flag) — reads clearly
      // from a distance as "something you play."
      const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity, roughness: 0.3, metalness: 0.5 });
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12), mat);
      head.scale.set(1.15, 0.85, 0.7);
      head.position.set(-0.12, -0.28, 0);
      head.rotation.z = -0.25;
      g.add(head);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.95, 8), mat);
      stem.position.set(0.16, 0.2, 0);
      g.add(stem);
      const flag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.05), mat);
      flag.position.set(0.28, 0.58, 0);
      flag.rotation.z = -0.5;
      g.add(flag);
    } else if (def.type === "map") {
      // A classic map pin: a cone point with a ball head.
      const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity, roughness: 0.3, metalness: 0.4 });
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 14), mat);
      ball.position.y = 0.18;
      g.add(ball);
      const point = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.4, 16), mat);
      point.position.y = -0.32;
      point.rotation.x = Math.PI;
      g.add(point);
      const hole = new THREE.Mesh(
        new THREE.CircleGeometry(0.12, 16),
        new THREE.MeshStandardMaterial({ color: 0x120f18, roughness: 0.6 })
      );
      hole.position.set(0, 0.18, 0.31);
      g.add(hole);
    } else if (def.type === "quiz") {
      const isDone = !!completed[eraIndex];
      const isLocked = !isDone && !!quizLockState[eraIndex];
      if (isDone) {
        const tex = makeCheckSprite();
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
        const s = new THREE.Sprite(mat);
        s.scale.set(1, 1, 1);
        g.add(s);
      } else if (isLocked) {
        // Dim, grey, padlocked — a visible cue that the reading pillars
        // need to be explored before this one will open.
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 20, 20),
          new THREE.MeshStandardMaterial({ color: 0x39333f, emissive: 0x1b1722, emissiveIntensity: 0.3, roughness: 0.6, metalness: 0.2 })
        );
        g.add(sphere);
        const lockTex = makeLockTexture("#d8d4e6");
        const lockMat = new THREE.SpriteMaterial({ map: lockTex, transparent: true, depthWrite: false });
        const lock = new THREE.Sprite(lockMat);
        lock.scale.set(0.62, 0.62, 1);
        lock.position.z = 0.42;
        g.add(lock);
      } else {
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.5, 20, 20),
          new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5, roughness: 0.4, metalness: 0.3 })
        );
        g.add(sphere);
        const qTex = makeQuestionMarkTexture("#ffffff");
        const qMat = new THREE.SpriteMaterial({ map: qTex, transparent: true, depthWrite: false });
        const q = new THREE.Sprite(qMat);
        q.scale.set(0.7, 0.7, 1);
        q.position.z = 0.42;
        g.add(q);
      }
    }

    if (big) g.scale.set(1.25, 1.25, 1.25);
    return g;
  }

  function refreshQuizPillarIcon() {
    if (mode !== "chamber" || currentEraIndex === -1) return;
    const quizPillar = pillars.find((p) => p.userData.type === "quiz");
    if (!quizPillar) return;
    const anchor = quizPillar.userData.iconAnchor;
    // Drop the old icon meshes but keep the point light (added after the icon).
    const oldIcon = quizPillar.userData.icon;
    if (oldIcon) {
      anchor.remove(oldIcon);
      disposeObject(oldIcon);
    }
    const def = PILLAR_TYPES.find((d) => d.type === "quiz");
    const era = ERAS[currentEraIndex];
    const icon = buildPillarIcon(def, new THREE.Color(era.color), era, currentEraIndex, false);
    anchor.add(icon);
    quizPillar.userData.icon = icon;
  }

  // Called by the UI layer whenever reading-progress changes, so the
  // quiz pillar's look (padlock vs. question mark) always matches
  // whether enough of the other pillars have actually been read.
  function setQuizLocked(eraIndex, locked) {
    quizLockState[eraIndex] = locked;
    if (eraIndex === currentEraIndex) refreshQuizPillarIcon();
  }

  function disposeObject(obj) {
    obj.traverse((child) => {
      // Sprites all share one internal geometry instance across the whole
      // app — disposing it here would break every other sprite still on
      // screen, so only dispose geometry for "real" (non-sprite) meshes.
      if (child.geometry && !child.isSprite) child.geometry.dispose();
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => {
          if (m.map) m.map.dispose();
          m.dispose();
        });
      }
    });
  }

  // ---------------- Particles (plaza ambience) ----------------

  function buildDustParticles() {
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const colorPool = ERAS.map((e) => new THREE.Color(e.color));

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      const c = colorPool[Math.floor(Math.random() * colorPool.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      portalParticles.push({
        speedX: (Math.random() - 0.5) * 0.02,
        speedY: Math.random() * 0.02,
        speedZ: (Math.random() - 0.5) * 0.02
      });
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      map: makeGlowTexture("#ffffff"),
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(geometry, material);
    plazaGroup.add(particleSystem);
    scene.userData.particles = particleSystem;
  }

  function buildNoteParticles() {
    const count = 40;
    const noteTex = makeNoteTexture();
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = Math.random() * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 24;
      noteParticles.push({ speed: 0.006 + Math.random() * 0.01, drift: (Math.random() - 0.5) * 0.006 });
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      size: 0.4,
      map: noteTex,
      color: 0xf5efe0,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(geometry, material);
    plazaGroup.add(points);
    scene.userData.notes = points;
  }

  // ---------------- Input ----------------

  function onWindowResize() {
    if (mode === "plaza") camera.position.z = plazaCamZ();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function updateMouseVector(clientX, clientY) {
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
  }

  function onMouseMove(event) {
    updateMouseVector(event.clientX, event.clientY);
    handleRaycast();
  }

  function onTouchMove(event) {
    if (event.touches.length > 0) {
      updateMouseVector(event.touches[0].clientX, event.touches[0].clientY);
      handleRaycast();
    }
  }

  function handleRaycast() {
    if (characterFocusActive) return; // camera is settled on someone; ignore other hovers
    if (mode === "plaza") {
      raycastPortals();
      raycastChest();
      introText.style.opacity = hoveredPortalIndex !== -1 || hoveredChest ? "0" : "1";
      raycastCharacterHover(hoveredPortalIndex === -1 && !hoveredChest ? currentCharacterList() : null);
    } else if (mode === "chamber" && !panelOpen) {
      raycastPillars();
      raycastCharacterHover(hoveredPillarIndex === -1 ? currentCharacterList() : null);
    } else {
      raycastCharacterHover(null);
    }
  }

  // ---------------- Background characters (plaza + chamber banter) ----------------
  // Every villager/dancer/listener WorldKit places in the scene is tagged
  // isCharacter:true (see js/worlds.js person()); a click on any of them
  // freezes them into a gentle standing-still "breathing" pose, flies the
  // camera in close, and shows one line from js/data.js CHARACTER_LINES —
  // picked for wherever the player currently is (the plaza, or the era
  // they're standing in). The bubble stays up until the player presses
  // Back (or clicks away) —
  // un-freezes them and flies the camera back out.

  function currentCharacterList() {
    if (mode === "plaza") return plazaLife && plazaLife.characters;
    if (mode === "chamber") return activeWorld && activeWorld.characters;
    return null;
  }

  function raycastCharacterObject(list) {
    if (!list || !list.length) return null;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(list, true);
    if (!intersects.length) return null;
    let obj = intersects[0].object;
    while (obj && !(obj.userData && obj.userData.isCharacter)) obj = obj.parent;
    return obj || null;
  }

  function raycastCharacterHover(list) {
    const found = raycastCharacterObject(list);
    if (found === hoveredCharacter) return;
    if (hoveredCharacter) {
      const s0 = hoveredCharacter.userData.baseScale || 1;
      gsap.to(hoveredCharacter.scale, { x: s0, y: s0, z: s0, duration: 0.25, ease: "power2.out" });
    }
    hoveredCharacter = found;
    if (hoveredCharacter) {
      const s = (hoveredCharacter.userData.baseScale || 1) * 1.18;
      gsap.to(hoveredCharacter.scale, { x: s, y: s, z: s, duration: 0.3, ease: "back.out(2)" });
      document.body.style.cursor = "pointer";
    } else if (hoveredPortalIndex === -1 && hoveredPillarIndex === -1 && !hoveredChest) {
      document.body.style.cursor = "default";
    }
  }

  function currentLineKey() {
    if (mode === "plaza") return "plaza";
    if (currentEraIndex >= 0 && ERAS[currentEraIndex]) return ERAS[currentEraIndex].id;
    return "plaza";
  }

  // Stops a walking/dancing/etc. character in place and swaps them to a
  // subtle standing-still breathing pose (see the `frozen` branch of
  // animatePeople() in js/worlds.js). Their previous animation/walk data
  // is stashed so unfreezeCharacter() can hand it right back.
  function freezeCharacter(obj) {
    const u = obj.userData;
    if (u.frozen) return;
    gsap.killTweensOf(obj.scale);
    u.prevAnim = u.anim;
    u.prevWalk = u.walk || null;
    u.walk = null;
    u.frozen = true;
    obj.position.y = u.baseY || 0;
    obj.rotation.z = 0;
    const s = u.baseScale || 1;
    obj.scale.set(s, s, s);
  }

  function unfreezeCharacter(obj) {
    const u = obj && obj.userData;
    if (!u || !u.frozen) return;
    u.frozen = false;
    u.walk = u.prevWalk || null;
    u.anim = u.prevAnim || "sway";
    const s = u.baseScale || 1;
    gsap.killTweensOf(obj.scale);
    gsap.to(obj.scale, { x: s, y: s, z: s, duration: 0.3 });
  }

  // Flies the camera in close to `obj` and points it at roughly head
  // height, approaching from whichever side the camera already happens
  // to be on so it doesn't swing awkwardly through the character.
  function flyCameraToCharacter(obj) {
    const charPos = new THREE.Vector3();
    obj.getWorldPosition(charPos);
    const scaleV = obj.userData.baseScale || 1;
    const dir = new THREE.Vector3().subVectors(camera.position, charPos);
    dir.y = 0;
    if (dir.lengthSq() < 0.0001) dir.set(0, 0, 1);
    dir.normalize();
    const dist = 3.1 * Math.max(scaleV, 0.85);
    const camPos = charPos.clone().add(dir.multiplyScalar(dist));
    camPos.y = charPos.y + 1.5 * scaleV;
    const lookTarget = charPos.clone();
    lookTarget.y = charPos.y + 1.25 * scaleV;
    gsap.killTweensOf(camera.position);
    gsap.to(camera.position, {
      x: camPos.x,
      y: camPos.y,
      z: camPos.z,
      duration: 0.85,
      ease: "power2.inOut",
      onUpdate: () => camera.lookAt(lookTarget)
    });
  }

  // Sends the camera back to the normal plaza/chamber overview position.
  function returnCameraToOverview() {
    gsap.killTweensOf(camera.position);
    if (mode === "plaza") {
      gsap.to(camera.position, { x: 0, y: cameraY, z: plazaCamZ(), duration: 0.8, ease: "power2.inOut", onUpdate: () => camera.lookAt(0, cameraY, 0) });
    } else if (mode === "chamber") {
      gsap.to(camera.position, { x: 0, y: CHAMBER_CAM.y, z: CHAMBER_CAM.z, duration: 0.8, ease: "power2.inOut", onUpdate: () => camera.lookAt(0, CHAMBER_CAM.y + 0.3, -8) });
    }
  }

  // Freezes `obj`, flies the camera to it, and shows its line. Used both
  // for a fresh click and for switching focus straight to a different
  // character while already zoomed in on someone.
  function focusCharacter(obj) {
    if (focusedCharacter && focusedCharacter !== obj) unfreezeCharacter(focusedCharacter);
    focusedCharacter = obj;
    characterFocusActive = true;
    hoveredCharacter = null;
    document.body.style.cursor = "default";
    freezeCharacter(obj);
    flyCameraToCharacter(obj);
    triggerCharacterLine(obj);
  }

  // Un-freezes whoever's focused and flies the camera back out. Used when
  // the player clicks away from a focused character, or their bubble
  // presses Back.
  function exitCharacterFocus() {
    if (focusedCharacter) unfreezeCharacter(focusedCharacter);
    focusedCharacter = null;
    characterFocusActive = false;
    hideCharacterBubble();
    returnCameraToOverview();
  }

  // Lighter-weight cleanup for when some OTHER transition (entering a
  // portal, opening a pillar panel, exiting to the plaza, opening the
  // chest) is about to move the camera itself — un-freezes the character
  // and drops the focus flag without also kicking off a competing camera
  // tween back to the overview position.
  function cancelCharacterFocus() {
    if (focusedCharacter) unfreezeCharacter(focusedCharacter);
    focusedCharacter = null;
    characterFocusActive = false;
    hideCharacterBubble();
  }

  // EASTER EGG: if this character is currently walking (or standing)
  // through a plaza prop, they say something funny about it instead of the
  // usual banter. Returns true if a clipping line was shown.
  let lastClipLine = null;
  function triggerClippingLine(obj) {
    if (mode !== "plaza" || !plazaLife || !plazaLife.getClippedProp) return false;
    if (typeof CLIPPING_LINES === "undefined") return false;
    const kind = plazaLife.getClippedProp(obj);
    if (!kind) return false;
    const specific = CLIPPING_LINES[kind] || [];
    const pool = specific.concat(CLIPPING_LINES.any || []).filter((l) => l !== lastClipLine);
    if (!pool.length) return false;
    const line = pool[Math.floor(Math.random() * pool.length)];
    lastClipLine = line;
    AudioManager.playClick();
    showCharacterBubble(obj, line);
    return true;
  }

  function triggerCharacterLine(obj) {
    if (triggerClippingLine(obj)) return;
    const key = currentLineKey();
    const lines = (typeof CHARACTER_LINES !== "undefined" && (CHARACTER_LINES[key] || CHARACTER_LINES.plaza)) || null;
    if (!lines || !lines.length) return;
    let idx = Math.floor(Math.random() * lines.length);
    if (lines.length > 1 && idx === obj.userData.lineIndex) idx = (idx + 1) % lines.length;
    obj.userData.lineIndex = idx;
    AudioManager.playClick();
    showCharacterBubble(obj, lines[idx]);
  }

  function showCharacterBubble(obj, text) {
    if (!characterBubble) return;
    activeCharacterBubble = { obj, side: null };
    characterBubbleText.textContent = text;
    if (characterBackBtn) {
      // Back button wears the current dimension's color (gold in the plaza).
      if (mode === "chamber" && ERAS[currentEraIndex]) characterBackBtn.style.setProperty("--theme-color", ERAS[currentEraIndex].color);
      else characterBackBtn.style.removeProperty("--theme-color");
      characterBackBtn.classList.add("visible");
    }
    updateCharacterBubble();
  }

  function hideCharacterBubble() {
    activeCharacterBubble = null;
    if (characterBubble) characterBubble.style.opacity = "0";
    if (characterBackBtn) characterBackBtn.classList.remove("visible");
  }

  // Keeps the bubble BESIDE the character (never above, where it runs
  // off-screen, and never on top of them). The character's real on-screen
  // outline is measured every frame from their 3D bounding box (hat,
  // guitar, raised arms and all), so the bubble clears them no matter how
  // big they appear on a given screen. It goes on whichever side has more
  // room, sticks with that side unless it stops fitting (so it doesn't flip
  // while the camera flies in), and is clamped to stay fully on screen. The
  // tail points at the character's head.
  const _bubBox = new THREE.Box3();
  const _bubCorner = new THREE.Vector3();
  function characterScreenBounds(obj, vw, vh) {
    _bubBox.setFromObject(obj);
    if (_bubBox.isEmpty()) return null;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < 8; i++) {
      _bubCorner.set(
        i & 1 ? _bubBox.max.x : _bubBox.min.x,
        i & 2 ? _bubBox.max.y : _bubBox.min.y,
        i & 4 ? _bubBox.max.z : _bubBox.min.z
      ).project(camera);
      if (_bubCorner.z > 1) return null; // behind the camera
      const x = (_bubCorner.x * 0.5 + 0.5) * vw, y = (-_bubCorner.y * 0.5 + 0.5) * vh;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    return { minX, maxX, minY, maxY };
  }

  function updateCharacterBubble() {
    if (!activeCharacterBubble || !characterBubble) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const box = characterScreenBounds(activeCharacterBubble.obj, vw, vh);
    if (!box) {
      characterBubble.style.opacity = "0";
      return;
    }
    const headY = box.minY + (box.maxY - box.minY) * 0.22; // head sits near the top of the outline

    const GAP = 18, MARGIN = 10, MAXW = 320, MINW = 150;
    const noteEl = document.getElementById("session-note");
    const topLimit = (noteEl ? noteEl.offsetHeight : 0) + MARGIN;

    const roomRight = vw - MARGIN - (box.maxX + GAP);
    const roomLeft = box.minX - GAP - MARGIN;
    let side = activeCharacterBubble.side || (roomRight >= roomLeft ? "right" : "left");
    const roomHere = side === "right" ? roomRight : roomLeft;
    const roomOther = side === "right" ? roomLeft : roomRight;
    if (roomHere < MINW && roomOther > roomHere) side = side === "right" ? "left" : "right";
    activeCharacterBubble.side = side;

    const room = side === "right" ? roomRight : roomLeft;
    characterBubble.style.maxWidth = Math.max(MINW, Math.min(MAXW, room)) + "px";
    const bw = characterBubble.offsetWidth, bh = characterBubble.offsetHeight;

    let bx = side === "right" ? box.maxX + GAP : box.minX - GAP - bw;
    bx = Math.max(MARGIN, Math.min(vw - MARGIN - bw, bx));
    let by = headY - bh * 0.3;
    by = Math.max(topLimit, Math.min(vh - MARGIN - bh, by));

    characterBubble.dataset.side = side;
    characterBubble.style.setProperty("--tail-y", Math.max(18, Math.min(bh - 18, headY - by)) + "px");
    characterBubble.style.transform = "translate(" + Math.round(bx) + "px," + Math.round(by) + "px)";
    characterBubble.style.opacity = "1";
  }

  function raycastPortals() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(portals, true);
    let foundIndex = -1;
    if (intersects.length > 0) {
      let object = intersects[0].object;
      while (object.parent && object.parent.type === "Group" && object.parent !== plazaGroup) {
        object = object.parent;
      }
      if (object.userData && object.userData.index !== undefined) foundIndex = object.userData.index;
    }

    if (foundIndex !== hoveredPortalIndex) {
      if (hoveredPortalIndex !== -1) {
        const oldPortal = portals[hoveredPortalIndex];
        gsap.to(oldPortal.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: "power2.out" });
        gsap.to(oldPortal.userData.ring.material, { emissiveIntensity: 0.5, duration: 0.3 });
        gsap.to(oldPortal.userData.swirlMat.uniforms.uHover, { value: 0, duration: 0.3 });
      }

      hoveredPortalIndex = foundIndex;

      if (hoveredPortalIndex !== -1) {
        const newPortal = portals[hoveredPortalIndex];
        gsap.to(newPortal.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.4, ease: "back.out(1.5)" });
        gsap.to(newPortal.userData.ring.material, { emissiveIntensity: 1.6, duration: 0.3 });
        gsap.to(newPortal.userData.swirlMat.uniforms.uHover, { value: 1, duration: 0.3 });
        document.body.style.cursor = "pointer";
        AudioManager.playHover();
      } else {
        document.body.style.cursor = "default";
      }
    }
  }

  function raycastPillars() {
    raycaster.setFromCamera(mouse, camera);
    const hitMeshes = pillars.map((p) => p.userData.hit);
    const intersects = raycaster.intersectObjects(hitMeshes, false);
    let foundIndex = -1;
    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      foundIndex = pillars.findIndex((p) => p.userData.hit === hitMesh);
    }

    if (foundIndex !== hoveredPillarIndex) {
      if (hoveredPillarIndex !== -1) {
        const old = pillars[hoveredPillarIndex];
        gsap.to(old.userData.iconAnchor.scale, { x: 1, y: 1, z: 1, duration: 0.35 });
      }
      hoveredPillarIndex = foundIndex;
      if (hoveredPillarIndex !== -1) {
        const p = pillars[hoveredPillarIndex];
        gsap.to(p.userData.iconAnchor.scale, { x: 1.25, y: 1.25, z: 1.25, duration: 0.35, ease: "back.out(1.5)" });
        document.body.style.cursor = "pointer";
        AudioManager.playHover();
      } else {
        document.body.style.cursor = "default";
      }
    }
  }

  // THE "STUCK IN THE CARD" BUG: this handler lives on `window`, so every
  // click on a panel button (including "Return to Chamber") bubbled up
  // to here AFTER the button had already closed the panel. By then the
  // panel was closed and a pillar was still flagged as hovered, so the
  // very same click re-selected that pillar and re-opened the card.
  // Clicks that start on any HTML UI are now ignored by the 3D scene.
  function isUiEvent(event) {
    const t = event.target;
    return !!(t && t.closest && t.closest("#content-panel, #chamber-bar, #hud, #finale-banner, #finale-quiz-overlay, button, a"));
  }

  function clearPillarHover() {
    if (hoveredPillarIndex !== -1 && pillars[hoveredPillarIndex]) {
      gsap.to(pillars[hoveredPillarIndex].userData.iconAnchor.scale, { x: 1, y: 1, z: 1, duration: 0.2 });
    }
    hoveredPillarIndex = -1;
    document.body.style.cursor = "default";
  }

  function onClick(event) {
    if (isUiEvent(event)) return;
    if (event.changedTouches && event.changedTouches.length > 0) {
      updateMouseVector(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
      handleRaycast();
    }

    if (characterFocusActive) {
      // Touch devices fire both `touchend` and a synthetic `click` for
      // the same tap; without this guard the second event immediately
      // undoes the focus the first one just set.
      if (performance.now() - lastFocusToggleTime < 400) return;
      const hit = raycastCharacterObject(currentCharacterList());
      lastFocusToggleTime = performance.now();
      if (hit && hit !== focusedCharacter) focusCharacter(hit);
      else exitCharacterFocus();
      return;
    }

    if (mode === "plaza" && hoveredPortalIndex !== -1) {
      // Portals are never locked, even after all six keys and the
      // chest have appeared — visiting the dimensions again (or the
      // chest/finale) is always the player's choice, never forced.
      enterPortal(hoveredPortalIndex);
    } else if (mode === "plaza" && hoveredChest) {
      openChest();
    } else if (mode === "chamber" && !panelOpen && hoveredPillarIndex !== -1) {
      selectPillar(hoveredPillarIndex);
    } else if (hoveredCharacter) {
      focusCharacter(hoveredCharacter);
      lastFocusToggleTime = performance.now();
    }
  }

  // ---------------- Enter portal -> build & fly into chamber ----------------

  function enterPortal(index) {
    mode = "entering";
    document.body.style.cursor = "default";
    cancelCharacterFocus();
    AudioManager.playWhoosh();
    AudioManager.stopAmbient();

    const targetPortal = portals[index];
    const era = ERAS[index];

    introText.style.opacity = "0";
    controlsHint.style.opacity = "0";
    flashOverlay.style.background = era.color;

    const targetPos = new THREE.Vector3();
    targetPortal.getWorldPosition(targetPos);
    const dir = targetPos.clone().normalize();
    const finalCamPos = targetPos.clone().add(dir.multiplyScalar(0.5));

    gsap.to(camera.position, {
      x: finalCamPos.x,
      y: finalCamPos.y,
      z: finalCamPos.z,
      duration: 1.05,
      ease: "power2.inOut",
      onUpdate: () => camera.lookAt(targetPos)
    });

    gsap.to(flashOverlay, {
      opacity: 1,
      duration: 0.55,
      delay: 0.5,
      ease: "power1.in",
      onComplete: () => {
        currentEraIndex = index;
        buildChamber(index);
        plazaGroup.visible = false;
        chamberGroup.visible = true;
        mode = "chamber";
        panelOpen = false;

        camera.position.set(0, CHAMBER_CAM.y, CHAMBER_CAM.z);
        camera.lookAt(0, CHAMBER_CAM.y + 0.3, -8);
        applySky(WorldKit.worldKey(era.id, index));

        if (callbacks.onEnterChamber) callbacks.onEnterChamber(index);
        AudioManager.playAmbient(era.ambientTrack);
        gsap.to(flashOverlay, { opacity: 0, duration: 0.5, ease: "power1.out" });
      }
    });
  }

  function selectPillar(index) {
    const pillar = pillars[index];
    clearPillarHover();
    panelOpen = true;
    mode = "chamber";
    document.body.style.cursor = "default";
    cancelCharacterFocus();
    AudioManager.playClick();

    const anchorPos = new THREE.Vector3();
    pillar.userData.iconAnchor.getWorldPosition(anchorPos);
    const camTarget = anchorPos.clone();
    camTarget.z += 4.2;
    camTarget.y = Math.max(camTarget.y - 0.6, 1.6);

    gsap.to(camera.position, {
      x: camTarget.x * 0.5,
      y: camTarget.y,
      z: camTarget.z,
      duration: 0.8,
      ease: "power2.inOut",
      onUpdate: () => camera.lookAt(anchorPos)
    });

    if (callbacks.onPillarSelect) callbacks.onPillarSelect(currentEraIndex, pillar.userData.type);
  }

  function backToChamberOverview() {
    clearPillarHover();
    panelOpen = false;
    mode = "chamber";
    gsap.to(camera.position, {
      x: 0,
      y: CHAMBER_CAM.y,
      z: CHAMBER_CAM.z,
      duration: 0.75,
      ease: "power2.inOut",
      onUpdate: () => camera.lookAt(0, CHAMBER_CAM.y + 0.3, -8)
    });
  }

  function exitToPlaza() {
    cancelCharacterFocus();
    AudioManager.playWhoosh();
    AudioManager.stopAmbient();
    gsap.to(flashOverlay, {
      opacity: 1,
      duration: 0.45,
      onComplete: () => {
        chamberGroup.visible = false;
        plazaGroup.visible = true;
        mode = "plaza";
        panelOpen = false;
        currentEraIndex = -1;

        if (callbacks.onExitToPlaza) callbacks.onExitToPlaza();

        camera.position.set(0, cameraY, plazaCamZ());
        camera.lookAt(0, cameraY, 0);
        applySky("plaza");
        activeWorld = null;

        hoveredPortalIndex = -1;
        introText.style.opacity = "1";
        controlsHint.style.opacity = "1";

        portals.forEach((p) => {
          p.scale.set(1, 1, 1);
          p.userData.ring.material.emissiveIntensity = 0.6;
          p.userData.swirlMat.uniforms.uHover.value = 0;
        });

        AudioManager.playPlazaAmbient();
        gsap.to(flashOverlay, { opacity: 0, duration: 0.5 });
      }
    });
  }

  // ---------------- Animate ----------------

  function animate() {
    requestAnimationFrame(animate);
    // (getDelta first: it also advances elapsedTime. Calling
    // getElapsedTime() first left delta at ~0, which froze the portal
    // sparkles and the black-hole debris.)
    const delta = Math.min(clock.getDelta(), 0.1);
    const time = clock.elapsedTime;

    if (!characterFocusActive && (mode === "plaza" || (mode === "chamber" && !panelOpen))) {
      const baseY = mode === "plaza" ? cameraY : CHAMBER_CAM.y;
      camera.position.y = baseY + Math.sin(time * 0.6) * 0.025;
      const lookTarget = new THREE.Vector3(mouse.x * 5, baseY + 0.9 + mouse.y * 0.6, camera.position.z - 25);
      camera.lookAt(lookTarget);
    }

    // Celestial skybox: aurora, stars, and galaxy all react live to the
    // cursor (via `mouse`, already tracked for raycasting) and to time.
    if (scene.userData.aurora) {
      scene.userData.aurora.material.uniforms.uTime.value = time;
      scene.userData.aurora.material.uniforms.uMouse.value.set(mouse.x, mouse.y);
    }
    if (scene.userData.starMat) {
      scene.userData.starMat.uniforms.uTime.value = time;
    }
    if (scene.userData.galaxy) {
      scene.userData.galaxy.rotation.y = time * 0.02 + mouse.x * 0.06;
      scene.userData.galaxy.rotation.x = mouse.y * 0.03;
    }

    if (scene.userData.lanternLight) {
      scene.userData.lanternLight.intensity = 1.5 + Math.sin(time * 6) * 0.15 + Math.sin(time * 13) * 0.08;
    }

    if (plazaGroup.visible) {
      if (plazaLife && lifeGroup.visible) plazaLife.update(time, delta);
      portals.forEach((p, i) => {
        p.userData.detail.rotation.z = time * 0.4 + i;
        p.userData.light.intensity = 1.3 + Math.sin(time * 3 + i) * 0.35;
        p.userData.frame.update(time);
        p.userData.swirlMat.uniforms.uTime.value = time;

        const positions = p.userData.sparkles.geometry.attributes.position.array;
        p.userData.sparkleData.forEach((s, si) => {
          s.angle += s.speed * delta;
          positions[si * 3] = Math.cos(s.angle) * s.radius;
          positions[si * 3 + 1] = Math.sin(s.angle) * s.radius;
        });
        p.userData.sparkles.geometry.attributes.position.needsUpdate = true;

        if (completed[i]) p.userData.goldRing.rotation.z = -time * 0.3;
      });

      if (scene.userData.particles) {
        const geo = scene.userData.particles.geometry;
        const positions = geo.attributes.position.array;
        for (let i = 0; i < portalParticles.length; i++) {
          const idx = i * 3;
          positions[idx] += portalParticles[i].speedX;
          positions[idx + 1] += portalParticles[i].speedY;
          positions[idx + 2] += portalParticles[i].speedZ;
          if (positions[idx + 1] > 10) positions[idx + 1] = 0;
          if (positions[idx] > 15 || positions[idx] < -15) portalParticles[i].speedX *= -1;
          if (positions[idx + 2] > 15 || positions[idx + 2] < -15) portalParticles[i].speedZ *= -1;
        }
        geo.attributes.position.needsUpdate = true;
      }

      if (scene.userData.notes) {
        const geo = scene.userData.notes.geometry;
        const positions = geo.attributes.position.array;
        for (let i = 0; i < noteParticles.length; i++) {
          const idx = i * 3;
          positions[idx + 1] += noteParticles[i].speed;
          positions[idx] += noteParticles[i].drift;
          if (positions[idx + 1] > 7) {
            positions[idx + 1] = 0;
            positions[idx] = (Math.random() - 0.5) * 24;
            positions[idx + 2] = (Math.random() - 0.5) * 24;
          }
        }
        geo.attributes.position.needsUpdate = true;
      }

      if (chestGroup && chestGroup.userData.revealed && chestGroup.visible) {
        chestGroup.userData.light.intensity = 1.3 + Math.sin(time * 2) * 0.3;
        chestGroup.userData.glow.material.opacity = 0.65 + Math.sin(time * 2) * 0.15;
      }
    }

    if (blackHoleGroup) {
      const u = blackHoleGroup.userData;
      u.discMat.uniforms.uTime.value = time;
      u.disc.rotation.z = time * 0.6;
      u.disc2.rotation.z = -time * 0.4;
      u.light.intensity = 3 + Math.sin(time * 4) * 0.6;
      u.glow.material.opacity = 0.7 + Math.sin(time * 1.6) * 0.1;

      const pos = u.motes.geometry.attributes.position.array;
      u.moteData.forEach((m, i) => {
        m.angle += m.speed * delta;
        m.radius -= m.fall * delta;
        if (m.radius < 0.3) {
          m.radius = 3 + Math.random() * 5;
          m.angle = Math.random() * Math.PI * 2;
        }
        pos[i * 3] = Math.cos(m.angle) * m.radius;
        pos[i * 3 + 1] = Math.sin(m.angle * 0.7) * 0.6;
        pos[i * 3 + 2] = Math.sin(m.angle) * m.radius;
      });
      u.motes.geometry.attributes.position.needsUpdate = true;
    }

    // Camera shake: undo last frame's random offset, then apply a fresh
    // one, so it layers on top of whatever gsap/lookAt set this frame
    // without the camera drifting away from its real position.
    camera.position.sub(lastShakeOffset);
    if (shakeStrength > 0.001) {
      lastShakeOffset.set(
        (Math.random() - 0.5) * shakeStrength,
        (Math.random() - 0.5) * shakeStrength,
        (Math.random() - 0.5) * shakeStrength * 0.6
      );
    } else {
      lastShakeOffset.set(0, 0, 0);
    }
    camera.position.add(lastShakeOffset);

    if (chamberGroup.visible) {
      if (activeWorld) activeWorld.update(time, delta);
      pillars.forEach((p, i) => {
        const anchor = p.userData.iconAnchor;
        anchor.position.y = p.userData.baseY + Math.sin(time * 1.4 + i) * 0.12;
        anchor.rotation.y = time * 0.5 + i;
        if (p.userData.type === "songs") {
          p.userData.icon.children.forEach((child, ci) => {
            if (child.userData.spin) child.rotation.z = time * child.userData.spin;
          });
        }
      });
    }

    if (activeCharacterBubble) updateCharacterBubble();

    renderer.render(scene, camera);
  }

  return {
    init,
    exitToPlaza,
    backToChamberOverview,
    setPortalCompleted,
    refreshQuizPillarIcon,
    setQuizLocked,
    revealChest,
    winFinale,
    shakeWrong
  };
})();
