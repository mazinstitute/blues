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
  const startCamZ = 15;
  const cameraY = 1.7;
  let mode = "plaza"; // 'plaza' | 'chamber'
  let panelOpen = false;
  let currentEraIndex = -1;
  let completed = []; // boolean per ERAS index

  // ---- plaza ----
  let plazaGroup;
  let portals = [];
  let hoveredPortalIndex = -1;
  let portalParticles = [];
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

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0a1c);
    scene.fog = new THREE.FogExp2(0x0b0a1c, 0.026);

    camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, cameraY, startCamZ);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // A filmic tone curve plus a touch of extra exposure lifts and
    // saturates everything downstream (portals, lanterns, sky) instead
    // of just multiplying raw color values — punchier without blowing
    // out the dark, moody base the game is going for.
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    clock = new THREE.Clock();
    lastShakeOffset = new THREE.Vector3();

    buildSky();
    buildLights();

    plazaGroup = new THREE.Group();
    scene.add(plazaGroup);
    buildEnvironment();
    buildPortals();
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

  // ---------------- Sky: a living celestial skybox ----------------
  // Four layers, back to front: a brighter gradient dome, a distant
  // spiral galaxy, twinkling parallax stars, and a flowing aurora band
  // near the horizon. The galaxy, stars, and aurora all read live
  // uMouse/uTime uniforms updated every frame in animate(), so the sky
  // visibly drifts and shimmers as the player moves the cursor or the
  // camera turns.

  function buildSky() {
    const skyGeo = new THREE.SphereGeometry(90, 24, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x1a1840) },
        bottomColor: { value: new THREE.Color(0x4f3d84) },
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

    // ---- Galaxy: a distant spiral of colored points, slowly turning ----
    const galaxyCount = 1600;
    const galaxyGeo = new THREE.BufferGeometry();
    const gPos = new Float32Array(galaxyCount * 3);
    const gCol = new Float32Array(galaxyCount * 3);
    const palette = [new THREE.Color(0xff9fe0), new THREE.Color(0x8fd6ff), new THREE.Color(0xcaa6ff), new THREE.Color(0xffe7a3)];
    for (let i = 0; i < galaxyCount; i++) {
      const arm = i % 3;
      const t = Math.random();
      const angle = t * Math.PI * 5 + arm * ((Math.PI * 2) / 3);
      const r = 14 + t * 46;
      const spread = (Math.random() - 0.5) * 5 * (1 - t * 0.6);
      gPos[i * 3] = Math.cos(angle) * r + spread;
      gPos[i * 3 + 1] = 22 + Math.sin(t * 7) * 5 + (Math.random() - 0.5) * 5;
      gPos[i * 3 + 2] = -68 - Math.sin(angle) * r * 0.35 + spread;
      const c = palette[i % palette.length];
      gCol[i * 3] = c.r;
      gCol[i * 3 + 1] = c.g;
      gCol[i * 3 + 2] = c.b;
    }
    galaxyGeo.setAttribute("position", new THREE.BufferAttribute(gPos, 3));
    galaxyGeo.setAttribute("color", new THREE.BufferAttribute(gCol, 3));
    const galaxyMat = new THREE.PointsMaterial({
      size: 0.55,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      map: makeGlowTexture("#ffffff"),
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const galaxy = new THREE.Points(galaxyGeo, galaxyMat);
    scene.add(galaxy);
    scene.userData.galaxy = galaxy;

    // ---- Stars: twinkling, and nudged very slightly by the cursor ----
    // (a cheap parallax — the sky "looks back" as you look around).
    const starCount = 1100;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starPhase = new Float32Array(starCount);
    const starSize = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      const r = 60 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.85);
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 4;
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      starPhase[i] = Math.random() * Math.PI * 2;
      starSize[i] = 6 + Math.random() * 10;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute("aPhase", new THREE.BufferAttribute(starPhase, 1));
    starGeo.setAttribute("aSize", new THREE.BufferAttribute(starSize, 1));
    const starMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uMap: { value: makeGlowTexture("#fffdf2") }
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        attribute float aPhase;
        attribute float aSize;
        uniform float uTime;
        uniform vec2 uMouse;
        varying float vTwinkle;
        void main() {
          vTwinkle = 0.5 + 0.5 * sin(uTime * 2.0 + aPhase);
          vec3 p = position;
          p.x += uMouse.x * 1.4;
          p.y += uMouse.y * 0.7;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * (0.55 + 0.45 * vTwinkle) * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        varying float vTwinkle;
        void main() {
          vec4 tex = texture2D(uMap, gl_PointCoord);
          gl_FragColor = vec4(vec3(1.0, 0.97, 0.88) * vTwinkle, tex.a * (0.6 + 0.4 * vTwinkle));
        }
      `
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);
    scene.userData.stars = starPoints;
    scene.userData.starMat = starMat;

    // ---- Aurora: a flowing curtain of color wrapped around the upper ----
    // sky, its bands and hue drifting with both time and the cursor.
    const auroraGeo = new THREE.SphereGeometry(82, 56, 28, 0, Math.PI * 2, 0, Math.PI * 0.58);
    const auroraMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uColorA: { value: new THREE.Color(0x4dffc3) },
        uColorB: { value: new THREE.Color(0x9d6bff) },
        uColorC: { value: new THREE.Color(0x53b6ff) }
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;
        varying vec3 vPos;
        void main() {
          float h = vPos.y;
          float band = sin(vPos.x * 3.1 + uTime * 0.22 + uMouse.x * 2.2) * 0.5 + 0.5;
          band += sin(vPos.z * 4.4 - uTime * 0.17 + uMouse.y * 1.6) * 0.5;
          band *= 0.5;
          float mask = smoothstep(0.1, 0.5, h) * smoothstep(1.0, 0.5, h);
          vec3 col = mix(uColorA, uColorB, band);
          col = mix(col, uColorC, sin(uTime * 0.12 + vPos.x * 2.0) * 0.5 + 0.5);
          float alpha = mask * (0.4 + 0.4 * band);
          gl_FragColor = vec4(col, alpha);
        }
      `
    });
    const aurora = new THREE.Mesh(auroraGeo, auroraMat);
    aurora.position.y = 4;
    scene.add(aurora);
    scene.userData.aurora = aurora;

    const moonTex = makeGlowTexture("#fff3d6");
    const moonMat = new THREE.SpriteMaterial({ map: moonTex, color: 0xfff3d6, transparent: true, depthWrite: false });
    const moon = new THREE.Sprite(moonMat);
    moon.scale.set(9, 9, 1);
    moon.position.set(-28, 24, -55);
    scene.add(moon);
    scene.userData.moon = moon;
  }

  function buildLights() {
    scene.userData.ambient = new THREE.AmbientLight(0xffffff, 0.32);
    scene.add(scene.userData.ambient);
    scene.userData.hemi = new THREE.HemisphereLight(0x7d68c2, 0x241f38, 0.75);
    scene.add(scene.userData.hemi);
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

  // Draws a rounded, semi-opaque plaque with one or two lines of text —
  // used for every 3D label in the game (portal names, pillar names).
  // Fixed physical (world-unit) size, so labels never overflow into
  // each other the way pixel-sized HTML overlays did.
  function makeLabelSprite(mainText, subText, color, opts) {
    opts = opts || {};
    const W = 560, H = subText ? 190 : 130;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // backdrop chip
    const pad = 10;
    roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 22);
    ctx.fillStyle = "rgba(6,5,10,0.62)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.stroke();
    ctx.globalAlpha = 1;

    let y = subText ? 58 : H / 2 + 4;

    if (subText) {
      ctx.fillStyle = color;
      ctx.font = "600 30px 'Work Sans', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.letterSpacing = "3px";
      ctx.fillText(subText.toUpperCase(), W / 2, y);
      ctx.letterSpacing = "0px";
      y = H - 58;
    }

    // auto-shrink main text to fit the chip width
    let fontSize = opts.big ? 58 : 46;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const maxWidth = W - pad * 2 - 40;
    do {
      ctx.font = `italic 700 ${fontSize}px Georgia, 'Times New Roman', serif`;
      fontSize -= 2;
    } while (ctx.measureText(mainText).width > maxWidth && fontSize > 20);
    ctx.fillStyle = "#f5efe0";
    ctx.fillText(mainText, W / 2, y);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    const worldW = opts.worldWidth || 2.8;
    sprite.scale.set(worldW, (worldW * H) / W, 1);
    // Labels are UI, not scene geometry — floating dust/note particles
    // (and anything else drawn earlier) should never poke through the
    // text. Disabling the depth test and forcing a high render order
    // means the plaque always draws last and stays fully readable,
    // regardless of what drifts in front of or behind it.
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

  function buildEnvironment() {
    const groundGeo = new THREE.PlaneGeometry(100, 100, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1c1828, roughness: 0.85, metalness: 0.15 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    plazaGroup.add(ground);
    loadOptionalTexture("assets/textures/ground-dirt.jpg", (tex) => {
      groundMat.map = tex;
      groundMat.color.set(0xffffff);
      groundMat.needsUpdate = true;
    });
    scene.userData.ground = ground;

    const grid = new THREE.GridHelper(100, 100, 0x352c52, 0x1c1830);
    grid.position.y = 0.01;
    grid.material.transparent = true;
    plazaGroup.add(grid);
    scene.userData.grid = grid;

    const pathMat = new THREE.MeshStandardMaterial({
      color: 0x3a2c2c,
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

    const horizonLight = new THREE.PointLight(0x4258a8, 1.4, 60);
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

    const rimLight = new THREE.PointLight(0x6f56a8, 0.75, 8);
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

    const lanternLight = new THREE.PointLight(0xffd28a, 1.6, 11);
    lanternLight.position.y = 2.7;
    group.add(lanternLight);

    group.position.set(0, 0, 2.2);
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
    varying vec2 vUv;

    void main() {
      vec2 centered = vUv - 0.5;
      float dist = length(centered) * 2.0;
      float angle = atan(centered.y, centered.x);

      float swirl = sin(angle * 6.0 + uTime * 2.0 - dist * 8.0) * 0.5 + 0.5;
      float swirl2 = sin(angle * -3.0 + uTime * 1.3 + dist * 5.0) * 0.5 + 0.5;
      float bands = mix(swirl, swirl2, 0.5);

      float edgeFade = smoothstep(1.0, 0.65, dist);
      float core = smoothstep(0.9, 0.0, dist) * 0.6;

      float alpha = (bands * 0.5 + core) * edgeFade;
      alpha *= (0.65 + uHover * 0.5);

      vec3 baseCol = uColor * (0.7 + bands * 0.6) + vec3(1.0) * core * 0.3;
      vec3 goldCol = vec3(0.95, 0.78, 0.35) * (0.7 + bands * 0.6) + vec3(1.0) * core * 0.3;
      vec3 col = mix(baseCol, goldCol, uGold * 0.55);
      gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    }
  `;

  function buildPortals() {
    const portalCount = ERAS.length;
    const arcRadius = 15;
    const arcSpan = THREE.MathUtils.degToRad(100);
    const startAngle = Math.PI / 2 + arcSpan / 2;

    ERAS.forEach((era, i) => {
      const angle = startAngle - i * (arcSpan / (portalCount - 1));
      const color = new THREE.Color(era.color);

      const portalGroup = new THREE.Group();
      const px = Math.cos(angle) * arcRadius;
      const pz = -Math.sin(angle) * arcRadius;
      portalGroup.position.set(px, 2.6, pz);
      portalGroup.lookAt(0, 2.6, 0);

      const ringGeo = new THREE.TorusGeometry(2, 0.15, 16, 64);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x28242e,
        emissive: color,
        emissiveIntensity: 0.65,
        roughness: 0.2,
        metalness: 0.8
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      portalGroup.add(ring);

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
          uGold: { value: 0 }
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
        opacity: 0.25,
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

      const pLight = new THREE.PointLight(color, 1.9, 13);
      portalGroup.add(pLight);

      const sparkleCount = 36;
      const sparkleGeo = new THREE.BufferGeometry();
      const sparklePos = new Float32Array(sparkleCount * 3);
      const sparkleData = [];
      for (let s = 0; s < sparkleCount; s++) {
        const a = (s / sparkleCount) * Math.PI * 2;
        sparklePos[s * 3] = Math.cos(a) * 2.05;
        sparklePos[s * 3 + 1] = Math.sin(a) * 2.05;
        sparklePos[s * 3 + 2] = 0;
        sparkleData.push({ angle: a, speed: 0.3 + Math.random() * 0.4, radius: 2.0 + Math.random() * 0.3 });
      }
      sparkleGeo.setAttribute("position", new THREE.BufferAttribute(sparklePos, 3));
      const sparkleMat = new THREE.PointsMaterial({
        size: 0.09,
        color: color,
        map: makeGlowTexture("#ffffff"),
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const sparkles = new THREE.Points(sparkleGeo, sparkleMat);
      portalGroup.add(sparkles);

      // 3D label — replaces the old HTML overlay. It's a real object in
      // the world (fixed world-unit size), so it never overflows past
      // its neighbor the way pixel-based labels could.
      const label = makeLabelSprite(era.name, era.years, era.color, { worldWidth: 2.7 });
      label.position.set(0, 3.05, 0);
      portalGroup.add(label);

      // "Collected" badge — small check icon + tag, only visible once earned.
      const checkTex = makeCheckSprite();
      const checkMat = new THREE.SpriteMaterial({ map: checkTex, transparent: true, depthWrite: false, depthTest: false, opacity: 0 });
      const checkBadge = new THREE.Sprite(checkMat);
      checkBadge.scale.set(0.55, 0.55, 1);
      checkBadge.position.set(1.55, 4.2, 0);
      checkBadge.renderOrder = 999;
      portalGroup.add(checkBadge);

      const collectedLabel = makeLabelSprite("Completed", null, "#f2c94c", { worldWidth: 1.5 });
      collectedLabel.position.set(0, 3.75, 0);
      collectedLabel.material.opacity = 0;
      portalGroup.add(collectedLabel);

      portalGroup.userData = {
        index: i,
        ring,
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
    if (scene.userData.stars) gsap.to(scene.userData.stars.material, { opacity: 0, duration: 2 });
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
        uGold: { value: 0 }
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

    const era = ERAS[index];
    const color = new THREE.Color(era.color);

    // Ground disc, tinted by era — brighter than before so the chamber
    // reads as a lively plaza rather than a dim vault.
    const groundMat = new THREE.MeshStandardMaterial({
      color: color.clone().multiplyScalar(0.36).offsetHSL(0, 0.08, 0.08),
      roughness: 0.75,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(new THREE.CircleGeometry(12, 48), groundMat);
    ground.rotation.x = -Math.PI / 2;
    chamberGroup.add(ground);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(11.6, 0.07, 8, 64),
      new THREE.MeshBasicMaterial({ color: era.color, transparent: true, opacity: 0.6 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.02;
    chamberGroup.add(rim);

    const grid = new THREE.GridHelper(24, 24, new THREE.Color(era.color).multiplyScalar(0.42), 0x241f36);
    grid.position.y = 0.015;
    chamberGroup.add(grid);

    const pLight = new THREE.PointLight(color, 1.8, 34);
    pLight.position.set(0, 6, -2);
    chamberGroup.add(pLight);
    const rimLight = new THREE.PointLight(color, 1.0, 20);
    rimLight.position.set(0, 2, 10);
    chamberGroup.add(rimLight);
    const fillLight = new THREE.PointLight(0xffffff, 0.5, 26);
    fillLight.position.set(0, 8, 6);
    chamberGroup.add(fillLight);

    // ---- Beyond the eight pillars: a wider plaza so the chamber never ----
    // reads as eight markers floating alone in a void. A soft outer floor
    // ring, a loose ring of small ambient lantern-posts circling the whole
    // space, and a scatter of slow-drifting motes give the space real
    // depth and life beyond the functional pillars.
    const outerGround = new THREE.Mesh(
      new THREE.RingGeometry(11.8, 23, 56),
      new THREE.MeshStandardMaterial({
        color: color.clone().multiplyScalar(0.16),
        roughness: 0.9,
        metalness: 0.05,
        transparent: true,
        opacity: 0.7
      })
    );
    outerGround.rotation.x = -Math.PI / 2;
    outerGround.position.y = -0.01;
    chamberGroup.add(outerGround);

    const lanternCount = 18;
    const lanternRadius = 19;
    for (let i = 0; i < lanternCount; i++) {
      const angle = (i / lanternCount) * Math.PI * 2;
      const px = Math.cos(angle) * lanternRadius;
      const pz = Math.sin(angle) * lanternRadius;
      const h = 1.3 + Math.random() * 2.4;
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.18, h, 8),
        new THREE.MeshStandardMaterial({ color: 0x3a3348, roughness: 0.7, metalness: 0.2, emissive: color, emissiveIntensity: 0.18 })
      );
      post.position.set(px, h / 2, pz);
      chamberGroup.add(post);

      const lantern = new THREE.Mesh(
        new THREE.SphereGeometry(0.17, 10, 8),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.2, roughness: 0.3 })
      );
      lantern.position.set(px, h + 0.2, pz);
      chamberGroup.add(lantern);

      const lLight = new THREE.PointLight(color, 0.75, 7.5);
      lLight.position.copy(lantern.position);
      chamberGroup.add(lLight);
    }

    chamberMoteData = [];
    const moteCount = 90;
    const moteGeo = new THREE.BufferGeometry();
    const motePos = new Float32Array(moteCount * 3);
    for (let i = 0; i < moteCount; i++) {
      const r = 6 + Math.random() * 15;
      const a = Math.random() * Math.PI * 2;
      const y = 0.5 + Math.random() * 5;
      motePos[i * 3] = Math.cos(a) * r;
      motePos[i * 3 + 1] = y;
      motePos[i * 3 + 2] = Math.sin(a) * r;
      chamberMoteData.push({ speed: 0.15 + Math.random() * 0.35, drift: (Math.random() - 0.5) * 0.2, baseY: y });
    }
    moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
    const moteMat = new THREE.PointsMaterial({
      size: 0.22,
      color: color.clone().offsetHSL(0, 0, 0.25),
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
      map: makeGlowTexture("#ffffff"),
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const motes = new THREE.Points(moteGeo, moteMat);
    chamberGroup.add(motes);
    chamberGroup.userData.motes = motes;

    // Eight pillars, arranged the same way the plaza portals are —
    // the "Songs" pillar sits near the center and stands taller, since
    // the songs are meant to be the centerpiece of each dimension.
    const count = PILLAR_TYPES.length;
    const radius = 9.6;
    const arcSpan = THREE.MathUtils.degToRad(155);
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
        color: 0x3a3442,
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

      const iconLight = new THREE.PointLight(color, 1.4, 6.5);
      iconAnchor.add(iconLight);

      const label = makeLabelSprite(def.label, null, era.color, { worldWidth: big ? 2.6 : 2.1 });
      label.position.y = shaftH + (big ? 2.35 : 2.05);
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
      size: 0.15,
      vertexColors: true,
      map: makeGlowTexture("#ffffff"),
      transparent: true,
      opacity: 0.6,
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
      size: 0.5,
      map: noteTex,
      color: 0xf5efe0,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(geometry, material);
    plazaGroup.add(points);
    scene.userData.notes = points;
  }

  // ---------------- Input ----------------

  function onWindowResize() {
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
    if (mode === "plaza") {
      raycastPortals();
      raycastChest();
      introText.style.opacity = hoveredPortalIndex !== -1 || hoveredChest ? "0" : "1";
    } else if (mode === "chamber" && !panelOpen) {
      raycastPillars();
    }
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

  function onClick(event) {
    if (event.changedTouches && event.changedTouches.length > 0) {
      updateMouseVector(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
      handleRaycast();
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
    }
  }

  // ---------------- Enter portal -> build & fly into chamber ----------------

  function enterPortal(index) {
    mode = "entering";
    document.body.style.cursor = "default";
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

        camera.position.set(0, 1.95, 16.5);
        camera.lookAt(0, 1.9, -8);

        gsap.to(scene.fog.color, { r: new THREE.Color(era.color).r * 0.18, g: new THREE.Color(era.color).g * 0.18, b: new THREE.Color(era.color).b * 0.18, duration: 1 });
        gsap.to(scene.fog, { density: 0.015, duration: 1 });

        if (callbacks.onEnterChamber) callbacks.onEnterChamber(index);
        AudioManager.playAmbient(era.ambientTrack);
        gsap.to(flashOverlay, { opacity: 0, duration: 0.5, ease: "power1.out" });
      }
    });
  }

  function selectPillar(index) {
    const pillar = pillars[index];
    panelOpen = true;
    mode = "chamber";
    document.body.style.cursor = "default";
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
    panelOpen = false;
    mode = "chamber";
    gsap.to(camera.position, {
      x: 0,
      y: 1.95,
      z: 16.5,
      duration: 0.75,
      ease: "power2.inOut",
      onUpdate: () => camera.lookAt(0, 1.9, -8)
    });
  }

  function exitToPlaza() {
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

        camera.position.set(0, cameraY, startCamZ);
        camera.lookAt(0, cameraY, 0);
        gsap.to(scene.fog.color, { r: 0x0b / 255, g: 0x0a / 255, b: 0x1c / 255, duration: 1 });
        gsap.to(scene.fog, { density: 0.026, duration: 1 });

        hoveredPortalIndex = -1;
        introText.style.opacity = "1";
        controlsHint.style.opacity = "1";

        portals.forEach((p) => {
          p.scale.set(1, 1, 1);
          p.userData.ring.material.emissiveIntensity = 0.5;
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
    const time = clock.getElapsedTime();
    const delta = Math.min(clock.getDelta(), 0.1);

    if (mode === "plaza" || (mode === "chamber" && !panelOpen)) {
      const baseZ = mode === "plaza" ? startCamZ : 13;
      const baseY = mode === "plaza" ? cameraY : 1.9;
      camera.position.y = baseY + Math.sin(time * 0.6) * 0.025;
      const lookTarget = new THREE.Vector3(mouse.x * 5, baseY + mouse.y * 0.5, camera.position.z - 25);
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
      scene.userData.starMat.uniforms.uMouse.value.set(mouse.x, mouse.y);
    }
    if (scene.userData.galaxy) {
      scene.userData.galaxy.rotation.y = time * 0.02 + mouse.x * 0.06;
      scene.userData.galaxy.rotation.x = mouse.y * 0.03;
    }

    if (scene.userData.lanternLight) {
      scene.userData.lanternLight.intensity = 1.5 + Math.sin(time * 6) * 0.15 + Math.sin(time * 13) * 0.08;
    }

    if (plazaGroup.visible) {
      portals.forEach((p, i) => {
        p.userData.detail.rotation.z = time * 0.4 + i;
        p.userData.light.intensity = 1.5 + Math.sin(time * 3 + i) * 0.5;
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
      if (chamberGroup.userData.motes) {
        const geo = chamberGroup.userData.motes.geometry;
        const positions = geo.attributes.position.array;
        chamberMoteData.forEach((m, i) => {
          const idx = i * 3;
          positions[idx + 1] += m.speed * delta;
          positions[idx] += m.drift * delta;
          if (positions[idx + 1] > m.baseY + 3) positions[idx + 1] = m.baseY - 1;
        });
        geo.attributes.position.needsUpdate = true;
      }
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
