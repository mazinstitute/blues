// ============================================================
// PORTAL TO BLUES — 3D SCENE
// The Crossroads plaza: a walkable 3D world with six glowing
// era-portals arranged in an arc, a starry sky, a lone tree,
// a lantern signpost, drifting dust, and floating music notes.
// ============================================================

const PortalScene = (function () {
  let scene, camera, renderer, clock, raycaster, mouse;
  let portals = [];
  let hoveredPortalIndex = -1;
  let isInsidePortal = false;
  let portalParticles = [];
  let noteParticles = [];
  let callbacks = {};
  let container, labelsLayer, introText, flashOverlay;

  // The camera never moves on its own — the whole crossroads is framed
  // in one fixed shot, and the mouse is the only input: move it to look
  // around a little, click a portal to step through. No keys, no joystick.
  const startCamZ = 15;
  const cameraY = 1.7;

  function init(opts) {
    callbacks = opts.callbacks || {};
    container = document.getElementById("canvas-container");
    labelsLayer = document.getElementById("labels-layer");
    introText = document.getElementById("intro-text");
    flashOverlay = document.getElementById("flash-overlay");

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030305);
    scene.fog = new THREE.FogExp2(0x030305, 0.032);

    camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, cameraY, startCamZ);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    clock = new THREE.Clock();

    buildSky();
    buildEnvironment();
    buildPortals();
    buildDustParticles();
    buildNoteParticles();

    window.addEventListener("resize", onWindowResize, false);
    window.addEventListener("mousemove", onMouseMove, false);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("click", onClick, false);
    window.addEventListener("touchend", onClick, false);

    animate();
  }

  // ---------------- Sky: gradient dome + stars + moon ----------------

  function buildSky() {
    // Gradient dome (dark navy near horizon fading to near-black overhead)
    const skyGeo = new THREE.SphereGeometry(90, 24, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x05040c) },
        bottomColor: { value: new THREE.Color(0x201530) },
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
    scene.add(new THREE.Mesh(skyGeo, skyMat));

    // Stars
    const starCount = 900;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 60 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.85); // keep mostly above horizon
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 4;
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.5,
      color: 0xfff6e0,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      map: makeGlowTexture("#ffffff"),
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // Moon (billboard sprite)
    const moonTex = makeGlowTexture("#fff3d6");
    const moonMat = new THREE.SpriteMaterial({ map: moonTex, color: 0xfff3d6, transparent: true, depthWrite: false });
    const moon = new THREE.Sprite(moonMat);
    moon.scale.set(9, 9, 1);
    moon.position.set(-28, 24, -55);
    scene.add(moon);
  }

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
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
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
      () => {
        /* silently keep procedural fallback */
      }
    );
  }

  function buildEnvironment() {
    // Ground
    const groundGeo = new THREE.PlaneGeometry(100, 100, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0d0b12,
      roughness: 0.85,
      metalness: 0.15
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    // Optional real dirt texture drop-in
    loadOptionalTexture("assets/textures/ground-dirt.jpg", (tex) => {
      groundMat.map = tex;
      groundMat.color.set(0xffffff);
      groundMat.needsUpdate = true;
    });

    // Subtle ground grid
    const grid = new THREE.GridHelper(100, 100, 0x1a1626, 0x0a0a14);
    grid.position.y = 0.01;
    scene.add(grid);

    // Crossroads: two crossing dirt paths, lighter than the ground
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0x241c1c,
      roughness: 0.9,
      metalness: 0.05,
      transparent: true,
      opacity: 0.9
    });
    const pathA = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 60), pathMat);
    pathA.rotation.x = -Math.PI / 2;
    pathA.position.y = 0.015;
    scene.add(pathA);
    const pathB = pathA.clone();
    pathB.rotation.z = Math.PI / 2;
    scene.add(pathB);

    // Ambient + hemisphere light for soft fill
    scene.add(new THREE.AmbientLight(0xffffff, 0.12));
    scene.add(new THREE.HemisphereLight(0x3b3050, 0x0a0810, 0.35));

    // Central glowing horizon light
    const horizonLight = new THREE.PointLight(0x2a3a66, 1, 60);
    horizonLight.position.set(0, 6, -25);
    scene.add(horizonLight);

    buildTree();
    buildSignpost();
  }

  function buildTree() {
    const tree = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x1c140f, roughness: 1 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 3.2, 7), trunkMat);
    trunk.position.y = 1.6;
    tree.add(trunk);

    // A few gnarled branches (simple bent cylinders)
    for (let i = 0; i < 5; i++) {
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.12, 1.6, 5), trunkMat);
      const ang = (i / 5) * Math.PI * 2;
      branch.position.set(Math.cos(ang) * 0.4, 3.1 + Math.random() * 0.4, Math.sin(ang) * 0.4);
      branch.rotation.z = Math.cos(ang) * 0.9;
      branch.rotation.x = Math.sin(ang) * 0.9;
      tree.add(branch);
    }

    tree.position.set(-9, 0, -6);
    scene.add(tree);

    const rimLight = new THREE.PointLight(0x4b3a6b, 0.5, 8);
    rimLight.position.set(-9, 3, -6);
    scene.add(rimLight);
  }

  function buildSignpost() {
    const group = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({ color: 0x2a1f18, roughness: 0.95 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.6, 8), postMat);
    post.position.y = 1.3;
    group.add(post);

    // Lantern glow on top
    const lanternGlow = makeGlowTexture("#ffd98a");
    const lanternMat = new THREE.SpriteMaterial({ map: lanternGlow, transparent: true, depthWrite: false });
    const lantern = new THREE.Sprite(lanternMat);
    lantern.scale.set(1.4, 1.4, 1);
    lantern.position.y = 2.75;
    group.add(lantern);

    const lanternLight = new THREE.PointLight(0xffce7a, 1.2, 10);
    lanternLight.position.y = 2.7;
    group.add(lanternLight);

    group.position.set(0, 0, 2.2);
    scene.add(group);
    scene.userData.lanternLight = lanternLight;
  }

  // ---------------- Portals ----------------

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

      vec3 col = uColor * (0.7 + bands * 0.6) + vec3(1.0) * core * 0.3;
      gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    }
  `;

  function buildPortals() {
    const portalCount = ERAS.length;
    const arcRadius = 15;
    // Centered on straight-ahead (90°) so every portal lands well inside
    // the fixed camera's field of view — no walking required to see any of them.
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

      // Outer torus ring
      const ringGeo = new THREE.TorusGeometry(2, 0.15, 16, 64);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        emissive: color,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.8
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      portalGroup.add(ring);

      // Shader swirl disc (the "cool" upgrade over the old flat circle)
      const swirlGeo = new THREE.CircleGeometry(1.9, 48);
      const swirlMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: Math.random() * 10 },
          uColor: { value: color },
          uHover: { value: 0 }
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

      // Thin wireframe detail ring (rotates)
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

      // Invisible hitbox for raycasting
      const hitGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.5, 16);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitBox = new THREE.Mesh(hitGeo, hitMat);
      hitBox.rotation.x = Math.PI / 2;
      portalGroup.add(hitBox);

      // Point light glow
      const pLight = new THREE.PointLight(color, 1.5, 12);
      portalGroup.add(pLight);

      // Orbiting sparkle ring
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

      portalGroup.userData = {
        index: i,
        ring,
        swirl,
        swirlMat,
        detail: detailRing,
        light: pLight,
        color,
        sparkles,
        sparkleData
      };

      scene.add(portalGroup);
      portals.push(portalGroup);

      // HTML label
      const label = document.createElement("div");
      label.className = "portal-label";
      label.style.color = era.color;
      label.innerHTML = `
        <div class="portal-year">${era.years}</div>
        <div class="portal-title">${era.name}</div>
      `;
      labelsLayer.appendChild(label);
      portalGroup.userData.labelEl = label;
    });
  }

  // ---------------- Particles ----------------

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
    scene.add(particleSystem);
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
    scene.add(points);
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
    if (isInsidePortal) return;
    updateMouseVector(event.clientX, event.clientY);
    handleRaycast();
  }

  function onTouchMove(event) {
    if (isInsidePortal) return;
    if (event.touches.length > 0) {
      updateMouseVector(event.touches[0].clientX, event.touches[0].clientY);
      handleRaycast();
    }
  }

  function handleRaycast() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(portals, true);
    let foundIndex = -1;
    if (intersects.length > 0) {
      let object = intersects[0].object;
      while (object.parent && object.parent.type === "Group" && object.parent !== scene) {
        object = object.parent;
      }
      if (object.userData && object.userData.index !== undefined) {
        foundIndex = object.userData.index;
      }
    }

    if (foundIndex !== hoveredPortalIndex) {
      if (hoveredPortalIndex !== -1) {
        const oldPortal = portals[hoveredPortalIndex];
        gsap.to(oldPortal.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: "power2.out" });
        gsap.to(oldPortal.userData.ring.material, { emissiveIntensity: 0.5, duration: 0.3 });
        gsap.to(oldPortal.userData.swirlMat.uniforms.uHover, { value: 0, duration: 0.3 });
        oldPortal.userData.labelEl.classList.remove("active");
        document.body.style.cursor = "default";
      }

      hoveredPortalIndex = foundIndex;

      if (hoveredPortalIndex !== -1) {
        const newPortal = portals[hoveredPortalIndex];
        gsap.to(newPortal.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.4, ease: "back.out(1.5)" });
        gsap.to(newPortal.userData.ring.material, { emissiveIntensity: 1.6, duration: 0.3 });
        gsap.to(newPortal.userData.swirlMat.uniforms.uHover, { value: 1, duration: 0.3 });
        newPortal.userData.labelEl.classList.add("active");
        document.body.style.cursor = "pointer";
        introText.style.opacity = "0";
        AudioManager.playHover();
      } else {
        introText.style.opacity = "1";
      }
    }
  }

  function onClick(event) {
    if (isInsidePortal) return;
    if (event.changedTouches && event.changedTouches.length > 0) {
      updateMouseVector(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
      handleRaycast();
    }
    if (hoveredPortalIndex !== -1) {
      enterPortal(hoveredPortalIndex);
    }
  }

  // ---------------- Enter / Exit ----------------

  function enterPortal(index) {
    isInsidePortal = true;
    document.body.style.cursor = "default";
    AudioManager.playWhoosh();
    AudioManager.stopAmbient();

    const targetPortal = portals[index];
    const era = ERAS[index];

    portals.forEach((p) => (p.userData.labelEl.style.opacity = "0"));
    introText.style.opacity = "0";

    flashOverlay.style.background = era.color;

    const targetPos = new THREE.Vector3();
    targetPortal.getWorldPosition(targetPos);
    const dir = targetPos.clone().normalize();
    const finalCamPos = targetPos.clone().add(dir.multiplyScalar(0.5));

    gsap.to(camera.position, {
      x: finalCamPos.x,
      y: finalCamPos.y,
      z: finalCamPos.z,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: () => {
        camera.lookAt(targetPos);
      }
    });

    gsap.to(flashOverlay, {
      opacity: 1,
      duration: 0.8,
      delay: 0.7,
      ease: "power1.in",
      onComplete: () => {
        if (callbacks.onEnter) callbacks.onEnter(index);
        AudioManager.playAmbient(era.ambientTrack, 90 + index * 12);
        gsap.to(flashOverlay, { opacity: 0, duration: 0.8, ease: "power1.out" });
      }
    });
  }

  function exitToPlaza() {
    AudioManager.playWhoosh();
    AudioManager.stopAmbient();
    gsap.to(flashOverlay, {
      opacity: 1,
      duration: 0.6,
      onComplete: () => {
        if (callbacks.onExit) callbacks.onExit();

        camera.position.set(0, cameraY, startCamZ);
        camera.lookAt(0, cameraY, 0);

        isInsidePortal = false;
        hoveredPortalIndex = -1;

        portals.forEach((p) => (p.userData.labelEl.style.opacity = "0.4"));
        introText.style.opacity = "1";

        portals.forEach((p) => {
          p.scale.set(1, 1, 1);
          p.userData.ring.material.emissiveIntensity = 0.5;
          p.userData.swirlMat.uniforms.uHover.value = 0;
        });

        AudioManager.playPlazaAmbient();

        gsap.to(flashOverlay, { opacity: 0, duration: 0.8 });
      }
    });
  }

  // ---------------- Animate ----------------

  function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    const delta = Math.min(clock.getDelta(), 0.1);

    if (!isInsidePortal) {
      // A faint, automatic breathing motion — not tied to any input —
      // just so the plaza doesn't feel like a frozen photo.
      camera.position.y = cameraY + Math.sin(time * 0.6) * 0.025;

      // Move your mouse to look around; every portal is already in view,
      // this just adds a bit of life. Click a portal to step through.
      const lookTarget = new THREE.Vector3(
        mouse.x * 5,
        1.7 + mouse.y * 0.5,
        camera.position.z - 25
      );
      camera.lookAt(lookTarget);
    }

    // Lantern flicker
    if (scene.userData.lanternLight) {
      scene.userData.lanternLight.intensity = 1.1 + Math.sin(time * 6) * 0.15 + Math.sin(time * 13) * 0.08;
    }

    portals.forEach((p, i) => {
      p.userData.detail.rotation.z = time * 0.4 + i;
      p.userData.light.intensity = 1.5 + Math.sin(time * 3 + i) * 0.5;
      p.userData.swirlMat.uniforms.uTime.value = time;

      // Sparkle ring orbit
      const positions = p.userData.sparkles.geometry.attributes.position.array;
      p.userData.sparkleData.forEach((s, si) => {
        s.angle += s.speed * delta;
        positions[si * 3] = Math.cos(s.angle) * s.radius;
        positions[si * 3 + 1] = Math.sin(s.angle) * s.radius;
      });
      p.userData.sparkles.geometry.attributes.position.needsUpdate = true;

      if (!isInsidePortal) {
        const pWorld = new THREE.Vector3();
        p.getWorldPosition(pWorld);
        pWorld.project(camera);
        const x = (pWorld.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(pWorld.y * 0.5) + 0.5) * window.innerHeight;
        p.userData.labelEl.style.left = `${x}px`;
        p.userData.labelEl.style.top = `${y - 80}px`;
        p.userData.labelEl.style.display = pWorld.z > 1 ? "none" : "block";
      }
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

    renderer.render(scene, camera);
  }

  return {
    init,
    exitToPlaza
  };
})();
