// ============================================================
// PORTAL TO BLUES — WORLD KIT
// Everything that makes the plaza feel lived-in and every era's
// chamber feel like its own place (not a recolor):
//   - SKY presets (sky colors, fog, stars, aurora, light levels)
//   - six unique portal frames + six unique chamber worlds
//   - a small "people" kit (villagers, musicians, dancers, crowds)
// scene.js calls into this file; it never touches game state.
// ============================================================

const WorldKit = (function () {
  "use strict";
  const T = THREE;
  const TAU = Math.PI * 2;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const lin = (hex) => new T.Color(hex).convertSRGBToLinear();
  const pixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);
  let viewScale = 450;

  // ---------------- Sky presets (hex values; scene.js applies them) ----------------
  // Every preset sets how bright the world is (ambient/hemi/exposure), so
  // no world is ever washed out — night scenes stay night.
  const SKY = {
    plaza: {
      top: 0x060a1c, bottom: 0x1a2748, fog: 0x101830, density: 0.019, stars: 1, aurora: 1,
      auroraColors: [0x35f2a5, 0x2fb6ff, 0xa66bff],
      moon: { x: -30, y: 22, z: -60, scale: 5, color: 0xdfe8ff, opacity: 0.85 },
      ambient: [0x8f9ad0, 0.2], hemi: [0x4a5c9a, 0x171425, 0.38], exposure: 0.88
    },
    delta: {
      top: 0x1a1633, bottom: 0x8a4a38, fog: 0x3a2320, density: 0.017, stars: 0.35, aurora: 0,
      auroraColors: [0x35f2a5, 0x2fb6ff, 0xa66bff],
      moon: { x: 26, y: 9, z: -55, scale: 7, color: 0xffb070, opacity: 0.8 },
      ambient: [0xd0a890, 0.24], hemi: [0x8a5a4a, 0x201410, 0.4], exposure: 0.9
    },
    boogie: {
      top: 0x081a22, bottom: 0x1b4a48, fog: 0x0e2a2a, density: 0.017, stars: 0.8, aurora: 0,
      auroraColors: [0x35f2a5, 0x2fb6ff, 0xa66bff],
      moon: { x: -22, y: 22, z: -60, scale: 4, color: 0xd6ffe0, opacity: 0.8 },
      ambient: [0x9ad0b0, 0.24], hemi: [0x3a7a6a, 0x101e1a, 0.42], exposure: 0.9
    },
    chicago: {
      top: 0x120a12, bottom: 0x5a2a2a, fog: 0x24151a, density: 0.021, stars: 0.1, aurora: 0,
      auroraColors: [0x35f2a5, 0x2fb6ff, 0xa66bff],
      moon: { x: 0, y: 30, z: -60, scale: 1, color: 0xffffff, opacity: 0 },
      ambient: [0xd09090, 0.22], hemi: [0x7a4a5a, 0x140c10, 0.38], exposure: 0.9
    },
    rnb: {
      top: 0x14081a, bottom: 0x3a1638, fog: 0x1e0c22, density: 0.02, stars: 0, aurora: 0,
      auroraColors: [0x35f2a5, 0x2fb6ff, 0xa66bff],
      moon: { x: 0, y: 30, z: -60, scale: 1, color: 0xffffff, opacity: 0 },
      ambient: [0xd0a0c8, 0.26], hemi: [0x8a4a7a, 0x140a14, 0.4], exposure: 0.9
    },
    british: {
      top: 0x0c0d18, bottom: 0x2a2846, fog: 0x1c1b30, density: 0.033, stars: 0, aurora: 0,
      auroraColors: [0x35f2a5, 0x2fb6ff, 0xa66bff],
      moon: { x: 0, y: 30, z: -60, scale: 1, color: 0xffffff, opacity: 0 },
      ambient: [0x9a98d0, 0.25], hemi: [0x5a58a0, 0x101020, 0.42], exposure: 0.9
    },
    modern: {
      top: 0x040c1e, bottom: 0x0f3a4a, fog: 0x0a2230, density: 0.014, stars: 1, aurora: 1.25,
      auroraColors: [0x2ff2c0, 0x2fa8ff, 0xc06bff],
      moon: { x: 30, y: 26, z: -60, scale: 4, color: 0xdffaff, opacity: 0.7 },
      ambient: [0x90c8d8, 0.24], hemi: [0x3a8aa0, 0x0e1a20, 0.42], exposure: 0.9
    }
  };
  // Lift every preset's ambient/hemisphere a touch: dark moody nights, but
  // never so dark that people and props disappear into the ground.
  Object.keys(SKY).forEach((k) => { SKY[k].ambient[1] *= 1.15; SKY[k].hemi[2] *= 1.2; });
  SKY.plaza.ambient[1] = 0.24 * 1.0; SKY.plaza.hemi[2] = 0.42;
  const WORLD_KEYS = ["delta", "boogie", "chicago", "rnb", "british", "modern"];
  function worldIndex(eraId, fallbackIndex) {
    const i = WORLD_KEYS.indexOf(eraId);
    return i === -1 ? fallbackIndex % WORLD_KEYS.length : i;
  }

  // ---------------- Small helpers ----------------
  const glowCache = {};
  function glowTex() {
    if (glowCache.w) return glowCache.w;
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const x = c.getContext("2d");
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.2, "rgba(255,255,255,0.85)");
    g.addColorStop(0.5, "rgba(255,255,255,0.25)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    return (glowCache.w = new T.CanvasTexture(c));
  }
  function canvasTex(w, h, draw, rx, ry) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    if (rx) t.repeat.set(rx, ry || rx);
    t.anisotropy = 4;
    t.encoding = T.sRGBEncoding;
    return t;
  }
  const std = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85, metalness: 0.05 }, o || {}));
  const bas = (c, o) => new T.MeshBasicMaterial(Object.assign({ color: c }, o || {}));
  function mesh(geo, mat, x, y, z, parent) {
    const m = new T.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    if (parent) parent.add(m);
    return m;
  }
  const box = (w, h, d, mat, x, y, z, p) => mesh(new T.BoxGeometry(w, h, d), mat, x, y, z, p);
  const cyl = (rt, rb, h, mat, x, y, z, p, seg) => mesh(new T.CylinderGeometry(rt, rb, h, seg || 10), mat, x, y, z, p);
  function glow(parent, hex, size, x, y, z, opacity) {
    const s = new T.Sprite(new T.SpriteMaterial({
      map: glowTex(), color: new T.Color(hex), transparent: true, opacity: opacity === undefined ? 0.8 : opacity,
      depthWrite: false, blending: T.AdditiveBlending, fog: false
    }));
    s.scale.set(size, size, 1);
    s.position.set(x, y, z);
    parent.add(s);
    return s;
  }
  function speckleTex(base, a, b, n, rep) {
    return canvasTex(512, 512, (x, w, h) => {
      x.fillStyle = base;
      x.fillRect(0, 0, w, h);
      for (let i = 0; i < n; i++) {
        x.fillStyle = Math.random() < 0.5 ? a : b;
        x.globalAlpha = rnd(0.08, 0.35);
        const s = rnd(1, 4);
        x.fillRect(Math.random() * w, Math.random() * h, s, s);
      }
      x.globalAlpha = 1;
    }, rep);
  }
  function makeGround(g, r, map, o) {
    const m = mesh(new T.CircleGeometry(r, 64), new T.MeshStandardMaterial(Object.assign({ map, roughness: 0.9, metalness: 0.05 }, o || {})), 0, 0, 0, g);
    m.rotation.x = -Math.PI / 2;
    return m;
  }
  function farGround(g, color) {
    const m = mesh(new T.CircleGeometry(95, 32), bas(color), 0, -0.06, 0, g);
    m.rotation.x = -Math.PI / 2;
  }
  // A jagged silhouette ring (hills / treeline) around the whole world.
  function ridge(g, radius, height, color, seed, useFog, baseY) {
    const geo = new T.CylinderGeometry(radius, radius, 1, 120, 1, true);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) > 0) {
        const a = Math.atan2(pos.getX(i), pos.getZ(i));
        const n = Math.sin(a * 3 + seed) * 0.5 + Math.sin(a * 7 + seed * 2) * 0.3 + Math.sin(a * 17 + seed * 3) * 0.2;
        pos.setY(i, height * (0.55 + 0.45 * n));
      } else pos.setY(i, -2);
    }
    const m = new T.Mesh(geo, new T.MeshBasicMaterial({ color, side: T.DoubleSide, fog: !!useFog }));
    m.position.y = baseY || 0;
    g.add(m);
    return m;
  }
  // A drooping string of small glowing bulbs between two points.
  function strand(g, a, b, sag, n, colors, size) {
    const pos = [], col = [], pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const p = new T.Vector3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - sag * 4 * t * (1 - t), a.z + (b.z - a.z) * t);
      pts.push(p);
      pos.push(p.x, p.y, p.z);
      const c = new T.Color(pick(colors));
      col.push(c.r, c.g, c.b);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new T.Float32BufferAttribute(col, 3));
    g.add(new T.Points(geo, new T.PointsMaterial({
      size: size || 0.32, map: glowTex(), vertexColors: true, transparent: true, depthWrite: false,
      blending: T.AdditiveBlending, opacity: 0.95
    })));
    g.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x0a0a0e })));
  }
  // GPU-animated particles: fireflies (blink + wander), embers/steam/sky-lanterns (rise).
  const PF_VERT = `
    attribute float aPhase; attribute float aSize;
    uniform float uTime, uPx, uScale, uRise, uH, uSway;
    varying float vA;
    void main() {
      vec3 p = position;
      p.x += sin(uTime * 0.35 + aPhase * 6.28) * uSway;
      p.z += cos(uTime * 0.29 + aPhase * 9.0) * uSway;
      if (uRise > 0.0) {
        float k = fract(uTime * uRise / uH + aPhase * 7.0);
        p.y += k * uH;
        vA = sin(k * 3.14159);
      } else {
        p.y += sin(uTime * 0.45 + aPhase * 12.0) * 0.35;
        vA = pow(0.5 + 0.5 * sin(uTime * (0.6 + aPhase) + aPhase * 40.0), 3.0);
      }
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = aSize * uPx * uScale / max(-mv.z, 0.5);
      gl_Position = projectionMatrix * mv;
    }`;
  const PF_FRAG = `
    uniform vec3 uColor; uniform float uOpacity; varying float vA;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(uColor, a * a * vA * uOpacity);
    }`;
  function particleField(parent, o, C) {
    const n = o.count, pos = new Float32Array(n * 3), ph = new Float32Array(n), sz = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = rnd(o.x[0], o.x[1]);
      pos[i * 3 + 1] = rnd(o.y[0], o.y[1]);
      pos[i * 3 + 2] = rnd(o.z[0], o.z[1]);
      ph[i] = Math.random();
      sz[i] = rnd(o.size[0], o.size[1]);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(pos, 3));
    geo.setAttribute("aPhase", new T.BufferAttribute(ph, 1));
    geo.setAttribute("aSize", new T.BufferAttribute(sz, 1));
    const mat = new T.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uPx: { value: pixelRatio() }, uScale: { value: viewScale },
        uRise: { value: o.rise || 0 }, uH: { value: o.height || 4 },
        uSway: { value: o.sway === undefined ? 0.6 : o.sway },
        uColor: { value: new T.Color(o.color) }, uOpacity: { value: o.opacity === undefined ? 1 : o.opacity }
      },
      vertexShader: PF_VERT, fragmentShader: PF_FRAG, transparent: true, depthWrite: false, blending: T.AdditiveBlending
    });
    const pts = new T.Points(geo, mat);
    pts.frustumCulled = false;
    parent.add(pts);
    C.fields.push(mat);
    return pts;
  }

  // ---------------- People ----------------
  function makePeopleKit() {
    const g = {
      torso: new T.CylinderGeometry(0.19, 0.24, 0.62, 8), legs: new T.CylinderGeometry(0.2, 0.17, 0.62, 8),
      head: new T.SphereGeometry(0.17, 10, 8), arm: new T.CylinderGeometry(0.05, 0.045, 0.55, 6),
      hatTop: new T.CylinderGeometry(0.13, 0.15, 0.16, 10), hatBrim: new T.CylinderGeometry(0.27, 0.27, 0.03, 12),
      bowler: new T.SphereGeometry(0.17, 10, 6, 0, TAU, 0, Math.PI / 2),
      umbrella: new T.SphereGeometry(0.75, 14, 8, 0, TAU, 0, Math.PI / 2.3), pole: new T.CylinderGeometry(0.015, 0.015, 1, 4),
      gBody: new T.SphereGeometry(0.2, 12, 10), gNeck: new T.CylinderGeometry(0.025, 0.025, 0.6, 5),
      bell: new T.ConeGeometry(0.11, 0.3, 8)
    };
    const cache = {};
    const m = (hex) => cache[hex] || (cache[hex] = new T.MeshStandardMaterial({ color: hex, roughness: 0.9, metalness: 0 }));
    const skins = [0x8a5a3c, 0x6b4429, 0xa87050, 0x4e3020, 0xc08a64, 0x3b2416];
    const cloth = [0x5a6e9a, 0x8a5a70, 0x4a8a7c, 0x9a8a50, 0x7a62a0, 0xa85a4a, 0x4f78a0, 0x8a7458];
    function person(o) {
      o = o || {};
      const grp = new T.Group();
      const c = o.cloth !== undefined ? o.cloth : pick(cloth);
      const legs = mesh(g.legs, m(o.pants || 0x2a3044), 0, 0.31, 0, grp);
      mesh(g.torso, m(c), 0, 0.93, 0, grp);
      mesh(g.head, m(o.skin || pick(skins)), 0, 1.4, 0, grp);
      const armL = new T.Group(), armR = new T.Group();
      armL.position.set(-0.27, 1.2, 0);
      armR.position.set(0.27, 1.2, 0);
      mesh(g.arm, m(c), 0, -0.26, 0, armL);
      mesh(g.arm, m(c), 0, -0.26, 0, armR);
      grp.add(armL, armR);
      if (o.hat === "fedora") { mesh(g.hatBrim, m(0x1a1a20), 0, 1.53, 0, grp); mesh(g.hatTop, m(0x1a1a20), 0, 1.62, 0, grp); }
      else if (o.hat === "bowler") { mesh(g.bowler, m(0x15151c), 0, 1.5, 0, grp); mesh(g.hatBrim, m(0x15151c), 0, 1.52, 0, grp).scale.set(0.7, 1, 0.7); }
      else if (o.hat === "cap") { mesh(g.bowler, m(0x2a3a4a), 0, 1.5, 0, grp); }
      if (o.umbrella) {
        mesh(g.umbrella, new T.MeshStandardMaterial({ color: o.umbrella, roughness: 0.8, side: T.DoubleSide }), 0, 2.0, 0, grp);
        mesh(g.pole, m(0x222226), 0, 1.5, 0, grp);
      }
      if (o.sit) { legs.rotation.x = -Math.PI / 2; legs.position.set(0, 0.6, 0.3); }
      const s = o.scale || 1;
      grp.scale.setScalar(s);
      // Every background person is a clickable character: scene.js
      // raycasts against isCharacter groups and shows a bit of banter
      // (js/data.js CHARACTER_LINES) when a kid clicks one out of curiosity.
      grp.userData = { anim: o.anim || "sway", phase: Math.random() * TAU, armL, armR, baseY: 0, armLBase: 0, isCharacter: true, baseScale: s, lineIndex: -1 };
      return grp;
    }
    function guitar(p, hex) {
      const gg = new T.Group();
      const body = mesh(g.gBody, m(hex || 0x8a5a2a), 0, 0, 0, gg);
      body.scale.set(1, 1.25, 0.35);
      const neck = mesh(g.gNeck, m(0x2a1a10), 0.22, 0.32, 0, gg);
      neck.rotation.z = -0.9;
      gg.position.set(0.02, 1.0, 0.24);
      gg.rotation.z = 0.5;
      p.add(gg);
      p.userData.armL.rotation.x = -1.15;
      p.userData.armR.rotation.x = -0.85;
      p.userData.anim = p.userData.anim === "sway" ? "play" : p.userData.anim;
    }
    function horn(p, hex) {
      const h = new T.Group();
      mesh(g.gNeck, m(hex || 0xc9a13a), 0, 0, 0, h).rotation.x = Math.PI / 2;
      const bell = mesh(g.bell, m(hex || 0xc9a13a), 0, 0, 0.36, h);
      bell.rotation.x = Math.PI / 2;
      h.position.set(0, 1.15, 0.28);
      p.add(h);
      p.userData.armL.rotation.x = -1.2;
      p.userData.armR.rotation.x = -1.2;
      p.userData.anim = "play";
    }
    return { person, guitar, horn };
  }

  function animatePeople(list, t) {
    for (let i = 0; i < list.length; i++) {
      const p = list[i], u = p.userData, ph = u.phase;
      if (u.frozen) {
        // Clicked and camera-focused: stand still with a slow, gentle
        // breathing pulse instead of whatever they were doing before.
        const breathe = 1 + Math.sin(t * 2.1 + ph) * 0.018;
        const s = (u.baseScale || 1) * breathe;
        p.scale.set(s, s, s);
        p.rotation.z = Math.sin(t * 0.8 + ph) * 0.015;
        continue;
      }
      if (u.walk) {
        const w = u.walk;
        p.position.x += w.dir * w.speed * 0.016;
        if (p.position.x > w.x1) w.dir = -1;
        if (p.position.x < w.x0) w.dir = 1;
        p.rotation.y = w.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        p.position.y = Math.abs(Math.sin(t * 5 + ph)) * 0.05;
        u.armL.rotation.x = Math.sin(t * 5 + ph) * 0.5;
        u.armR.rotation.x = -Math.sin(t * 5 + ph) * 0.5;
        continue;
      }
      switch (u.anim) {
        case "dance":
          p.position.y = u.baseY + Math.abs(Math.sin(t * 3.6 + ph)) * 0.1;
          u.armL.rotation.z = -0.9 + Math.sin(t * 3.6 + ph) * 0.7;
          u.armR.rotation.z = 0.9 - Math.sin(t * 3.6 + ph + 1.2) * 0.7;
          p.rotation.z = Math.sin(t * 1.8 + ph) * 0.07;
          break;
        case "cheer":
          p.position.y = u.baseY + Math.abs(Math.sin(t * 2.6 + ph)) * 0.05;
          u.armL.rotation.z = -2.7 + Math.sin(t * 4 + ph) * 0.35;
          u.armR.rotation.z = 2.7 - Math.sin(t * 4 + ph + 1) * 0.35;
          break;
        case "play":
          u.armR.rotation.x = -0.9 + Math.sin(t * 7 + ph) * 0.16;
          p.rotation.z = Math.sin(t * 1.5 + ph) * 0.03;
          break;
        default:
          p.rotation.z = Math.sin(t * 1.1 + ph) * 0.03;
      }
    }
  }

  function newCtx() {
    const C = { anims: [], people: [], fields: [], kit: makePeopleKit() };
    C.person = function (parent, x, z, o) {
      const p = C.kit.person(o);
      p.position.set(x, 0, z);
      if (o && o.seat) { p.position.y = o.seat - 0.62; p.userData.baseY = p.position.y; }
      if (o && o.face) p.rotation.y = Math.atan2(o.face[0] - x, o.face[1] - z);
      if (o && o.yaw !== undefined) p.rotation.y = o.yaw;
      parent.add(p);
      C.people.push(p);
      return p;
    };
    C.update = function (t, dt) {
      viewScale = window.innerHeight * 0.5;
      C.fields.forEach((m) => { m.uniforms.uTime.value = t; m.uniforms.uScale.value = viewScale; });
      animatePeople(C.people, t);
      C.anims.forEach((f) => f(t, dt));
    };
    return C;
  }
  // place `count` people on an arc band (degrees; 90 = straight back, -z)
  function crowd(C, parent, count, rMin, rMax, a0, a1, opts, facing) {
    for (let i = 0; i < count; i++) {
      const a = (rnd(a0, a1) * Math.PI) / 180, r = rnd(rMin, rMax);
      const x = Math.cos(a) * r, z = -Math.sin(a) * r;
      const o = Object.assign({}, opts);
      if (Array.isArray(o.hat)) o.hat = pick(o.hat);
      if (facing) o.face = facing; else o.face = [0, 0];
      C.person(parent, x, z, o);
    }
  }
  function lamp(g, x, z, h, hex, halo) {
    cyl(0.07, 0.11, h, std(0x1a1c22, { metalness: 0.5 }), x, h / 2, z, g, 8);
    box(0.34, 0.42, 0.34, bas(hex), x, h + 0.1, z, g);
    glow(g, hex, halo || 3.4, x, h + 0.1, z, 0.75);
  }
  function tree(g, x, z, h, kind) {
    const t = new T.Group();
    const trunk = std(0x1c140f, { roughness: 1 });
    cyl(0.16, 0.3, h * 0.6, trunk, 0, h * 0.3, 0, t, 7);
    if (kind === "conifer") {
      [1, 0.75, 0.5].forEach((k, i) => mesh(new T.ConeGeometry(1.7 * k, h * 0.45, 8), std(0x14262a, { roughness: 1 }), 0, h * 0.5 + i * h * 0.2, 0, t));
    } else {
      [[0, 0.75, 0, 1.7], [-0.9, 0.62, 0.3, 1.2], [0.9, 0.66, -0.2, 1.3]].forEach((b) => {
        mesh(new T.IcosahedronGeometry(b[3], 1), std(0x142430, { roughness: 1 }), b[0], h * b[1] + 0.6, b[2], t);
      });
    }
    t.position.set(x, 0, z);
    g.add(t);
    return t;
  }

  // ---------------- Plaza life ----------------
  function buildPlazaLife(group, portalPos, eraColors) {
    const C = newCtx();
    // Simple footprints of the props people can walk through (in `group`
    // space, same as every person's position). Used only by the clipping
    // Easter egg: see getClippedProp() below and CLIPPING_LINES in data.js.
    const props = [];
    const addCircle = (kind, cx, cz, r) => props.push({ kind, cx, cz, r });
    const addBox = (kind, cx, cz, rot, hx, hz) => props.push({ kind, cx, cz, rot, hx, hz });
    // paved medallion at the crossing, one arc per dimension
    mesh(new T.CircleGeometry(4.3, 48), std(0x1d1b26, { roughness: 0.9 }), 0, 0.012, 0, group).rotation.x = -Math.PI / 2;
    mesh(new T.CircleGeometry(3.3, 48), std(0x2a2733, { roughness: 0.8 }), 0, 0.02, 0, group).rotation.x = -Math.PI / 2;
    eraColors.forEach((hex, i) => {
      const n = eraColors.length, arc = TAU / n;
      const r = new T.Mesh(new T.RingGeometry(3.45, 3.95, 24, 1, i * arc + 0.06, arc - 0.12), bas(lin(hex), { transparent: true, opacity: 0.9, side: T.DoubleSide }));
      r.rotation.x = -Math.PI / 2;
      r.position.y = 0.03;
      group.add(r);
    });
    // pads + colored light spill under each portal
    portalPos.forEach((p, i) => {
      const pad = mesh(new T.CylinderGeometry(2.7, 2.9, 0.16, 32), std(0x1b1922, { roughness: 0.8 }), p.x, 0.08, p.z, group);
      const ring = new T.Mesh(new T.RingGeometry(2.35, 2.5, 40), bas(lin(eraColors[i]), { transparent: true, opacity: 0.7, side: T.DoubleSide }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(p.x, 0.17, p.z);
      group.add(ring);
      const spill = new T.Mesh(new T.CircleGeometry(5.5, 32), new T.MeshBasicMaterial({
        map: glowTex(), color: new T.Color(eraColors[i]), transparent: true, opacity: 0.32, depthWrite: false, blending: T.AdditiveBlending, fog: false
      }));
      spill.rotation.x = -Math.PI / 2;
      spill.position.set(p.x * 0.93, 0.05, p.z * 0.93 + 1.2);
      group.add(spill);
      pad.receiveShadow = false;
    });
    // street lamps and strings of lights
    const lampSpots = [[-5, -1.5, 4.2], [5, -1.5, 4.2], [-11.5, -4.5, 3.8], [11.5, -4.5, 3.8]];
    lampSpots.forEach((l) => { lamp(group, l[0], l[1], l[2], 0xffc878, 4.2); addCircle("lamp", l[0], l[1], 0.12); });
    const cols = eraColors.map((h) => new T.Color(h).lerp(new T.Color(0xffffff), 0.25).getHex());
    strand(group, new T.Vector3(-5, 4.1, -1.5), new T.Vector3(5, 4.1, -1.5), 0.7, 22, cols, 0.3);
    strand(group, new T.Vector3(-11.5, 3.7, -4.5), new T.Vector3(-5, 4.1, -1.5), 0.5, 14, cols, 0.28);
    strand(group, new T.Vector3(11.5, 3.7, -4.5), new T.Vector3(5, 4.1, -1.5), 0.5, 14, cols, 0.28);
    // benches
    [[-3.9, 1.6, 0.5], [3.9, 1.6, -0.5]].forEach((b) => {
      const bench = new T.Group();
      box(1.7, 0.1, 0.5, std(0x3a2a20), 0, 0.5, 0, bench);
      box(1.7, 0.4, 0.08, std(0x3a2a20), 0, 0.8, -0.24, bench);
      box(0.1, 0.5, 0.45, std(0x15151a, { metalness: 0.5 }), -0.75, 0.25, 0, bench);
      box(0.1, 0.5, 0.45, std(0x15151a, { metalness: 0.5 }), 0.75, 0.25, 0, bench);
      bench.position.set(b[0], 0, b[1]);
      bench.rotation.y = Math.atan2(-b[0], -b[1]) + b[2] * 0.3;
      group.add(bench);
      addBox("bench", b[0], b[1], bench.rotation.y, 0.85, 0.27);
    });
    // campfire circle (left)
    const fx = -5.6, fz = -4.6;
    const logMat = std(0x2a1a10, { roughness: 1 });
    for (let i = 0; i < 4; i++) {
      const l = cyl(0.08, 0.08, 1.1, logMat, fx, 0.16, fz, group, 6);
      l.rotation.z = Math.PI / 2.4;
      l.rotation.y = (i / 4) * TAU;
    }
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      mesh(new T.IcosahedronGeometry(0.16, 0), std(0x2a2a30), fx + Math.cos(a) * 0.85, 0.1, fz + Math.sin(a) * 0.85, group);
    }
    addCircle("campfire", fx, fz, 0.55);
    const flameA = glow(group, 0xff7a2a, 2.4, fx, 0.9, fz, 0.9);
    const flameB = glow(group, 0xffd070, 1.2, fx, 0.7, fz, 0.95);
    const fireLight = new T.PointLight(0xff8a3a, 1.3, 10);
    fireLight.position.set(fx, 1.1, fz);
    group.add(fireLight);
    C.anims.push((t) => {
      const f = 1 + Math.sin(t * 9) * 0.08 + Math.sin(t * 17) * 0.05;
      flameA.scale.set(2.4 * f, 2.6 * f, 1);
      flameB.scale.set(1.2 * f, 1.5 * f, 1);
      fireLight.intensity = 1.2 + Math.sin(t * 11) * 0.25 + Math.sin(t * 23) * 0.12;
    });
    particleField(group, { count: 26, x: [fx - 0.3, fx + 0.3], y: [0.6, 0.8], z: [fz - 0.3, fz + 0.3], color: 0xff9a3a, size: [0.1, 0.2], rise: 0.9, height: 4.2, sway: 0.5 }, C);
    // gatherings
    const circle = [[0.2, 0], [1.3, 0.4], [2.1, 0.9], [3.3, 0.8], [4.2, 0.5], [5.2, 0.7], [0, 2.6]];
    circle.forEach((c, i) => {
      const a = c[0] + 0.2;
      const x = fx + Math.cos(a) * (1.9 + (i % 2) * 0.4), z = fz + Math.sin(a) * (1.9 + (i % 2) * 0.4);
      const p = C.person(group, x, z, { face: [fx, fz], hat: i % 3 === 0 ? "cap" : null });
      if (i === 1) C.kit.guitar(p, 0x8a5a2a);
    });
    C.person(group, fx + 2.4, fz + 1.9, { face: [fx, fz], anim: "dance" });
    // busker + listeners (right)
    const bx = 6.6, bz = -4.4;
    box(0.6, 0.5, 0.6, std(0x3a2a20), bx, 0.25, bz, group);
    const busker = C.person(group, bx, bz, { seat: 0.5, sit: true, face: [0, 0], hat: "fedora", cloth: 0x7a4034 });
    C.kit.guitar(busker, 0xa0703a);
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (0.62 + i * 0.19);
      C.person(group, bx + Math.cos(a) * 2.2, bz + Math.sin(a) * 2.2, { face: [bx, bz], anim: i === 2 ? "dance" : "sway" });
    }
    glow(group, 0xffc878, 5, bx, 0.15, bz + 0.2, 0.25);
    // people waiting in front of each portal
    portalPos.forEach((p, i) => {
      const dir = new T.Vector3(-p.x, 0, -p.z).normalize();
      const side = new T.Vector3(-dir.z, 0, dir.x);
      for (let k = 0; k < 2; k++) {
        const x = p.x + dir.x * 3.6 + side.x * (k ? 0.9 : -0.9) * (1 + (i % 2) * 0.3);
        const z = p.z + dir.z * 3.6 + side.z * (k ? 0.9 : -0.9) * (1 + (i % 2) * 0.3);
        C.person(group, x, z, { face: [p.x, p.z], hat: (i + k) % 3 === 0 ? "fedora" : null });
      }
    });
    // strollers along the crossing path
    [[0.9, 0.9], [1.8, -0.7], [2.6, 0.6]].forEach((w, i) => {
      const p = C.person(group, rnd(-7, 7), w[0] + 1.2 + i * 0.6, { hat: i === 1 ? "bowler" : null });
      p.userData.walk = { x0: -8.5, x1: 8.5, dir: i % 2 ? -1 : 1, speed: 0.55 + i * 0.12 };
    });
    // scenery: trees, rocks, bushes
    for (let i = 0; i < 11; i++) {
      const a = (rnd(10, 170) * Math.PI) / 180, r = rnd(19, 30);
      tree(group, Math.cos(a) * r, -Math.sin(a) * r, rnd(5, 9), i % 3 === 0 ? "conifer" : "round");
      addCircle("tree", Math.cos(a) * r, -Math.sin(a) * r, 0.3);
    }
    for (let i = 0; i < 5; i++) {
      const tx = (i % 2 ? 1 : -1) * rnd(15, 22), tz = rnd(-2, 8);
      tree(group, tx, tz, rnd(4.5, 6.5), "round");
      addCircle("tree", tx, tz, 0.3);
    }
    const rockMat = std(0x1e2230, { roughness: 1 }), bushMat = std(0x16303a, { roughness: 1 });
    for (let i = 0; i < 34; i++) {
      const a = rnd(0, TAU), r = rnd(6, 26);
      const s = rnd(0.25, 0.9);
      const m = mesh(new T.IcosahedronGeometry(1, 0), i % 3 ? rockMat : bushMat, Math.cos(a) * r, s * 0.4, Math.sin(a) * r, group);
      m.scale.set(s * rnd(0.8, 1.4), s * 0.7, s * rnd(0.8, 1.4));
      m.rotation.y = rnd(0, TAU);
      addCircle(i % 3 ? "rock" : "bush", m.position.x, m.position.z, 0.85 * Math.max(m.scale.x, m.scale.z));
    }
    ridge(group, 58, 9, lin(0x080d20), 1.7, false);
    ridge(group, 72, 15, lin(0x050818), 4.2, false);
    particleField(group, { count: 90, x: [-15, 15], y: [0.3, 2.6], z: [-13, 6], color: 0xd8ff8a, size: [0.09, 0.16], sway: 0.9 }, C);
    // Which prop (by kind) is this character currently standing/walking
    // inside? null if none. A small margin counts a body that's only
    // partly in the prop, since that's what reads as "clipping" on screen.
    const CLIP_MARGIN = 0.15;
    function getClippedProp(person) {
      const x = person.position.x, z = person.position.z;
      for (let i = 0; i < props.length; i++) {
        const q = props[i], dx = x - q.cx, dz = z - q.cz;
        if (q.r !== undefined) {
          const rr = q.r + CLIP_MARGIN;
          if (dx * dx + dz * dz < rr * rr) return q.kind;
        } else {
          const c = Math.cos(q.rot), s = Math.sin(q.rot);
          const lx = dx * c - dz * s, lz = dx * s + dz * c;
          if (Math.abs(lx) < q.hx + CLIP_MARGIN && Math.abs(lz) < q.hz + CLIP_MARGIN) return q.kind;
        }
      }
      return null;
    }
    return { update: C.update, characters: C.people, getClippedProp };
  }

  // ---------------- Portal frames (one look per dimension) ----------------
  function helix(R, r, k, n) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const u = (i / n) * TAU;
      pts.push(new T.Vector3(Math.cos(u) * (R + r * Math.cos(k * u)), Math.sin(u) * (R + r * Math.cos(k * u)), r * Math.sin(k * u)));
    }
    return new T.CatmullRomCurve3(pts, true);
  }
  function portalFrame(index, colorHex) {
    const color = new T.Color(colorHex);
    const g = new T.Group();
    const upd = [];
    const ringMat = new T.MeshStandardMaterial({ color: 0x28242e, emissive: color, emissiveIntensity: 0.6, roughness: 0.25, metalness: 0.8 });
    const accent = new T.MeshStandardMaterial({ color: 0x1a1720, emissive: color, emissiveIntensity: 1.0, roughness: 0.4, metalness: 0.3 });
    let ring;
    if (index === 0) { // Delta: rope-wound ring on weathered wooden posts, lantern on top
      ring = mesh(new T.TorusGeometry(2, 0.13, 14, 64), ringMat, 0, 0, 0, g);
      mesh(new T.TubeGeometry(helix(2, 0.15, 30, 300), 480, 0.035, 5, true), std(0x9a7a44, { emissive: color, emissiveIntensity: 0.3 }), 0, 0, 0, g);
      [-2.5, 2.5].forEach((x) => cyl(0.1, 0.15, 2.5, std(0x4a3626, { roughness: 1 }), x, -1.05, 0, g, 7));
      box(0.2, 0.26, 0.2, accent, 0, 2.45, 0, g);
      glow(g, colorHex, 1.4, 0, 2.45, 0, 0.7);
    } else if (index === 1) { // Boogie & Piedmont: a ring of piano keys
      ring = mesh(new T.TorusGeometry(2, 0.13, 14, 64), ringMat, 0, 0, 0, g);
      const white = std(0xd8d4c4, { emissive: color, emissiveIntensity: 0.22 }), black = std(0x0e0e12);
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * TAU, blk = i % 2;
        const k = mesh(new T.BoxGeometry(blk ? 0.1 : 0.17, blk ? 0.3 : 0.5, blk ? 0.16 : 0.1), blk ? black : white, Math.cos(a) * (blk ? 2.62 : 2.48), Math.sin(a) * (blk ? 2.62 : 2.48), 0, g);
        k.rotation.z = a - Math.PI / 2;
      }
    } else if (index === 2) { // Chicago: neon hex frame with bolts at the corners
      ring = mesh(new T.TorusGeometry(2.2, 0.14, 6, 6), ringMat, 0, 0, 0, g);
      mesh(new T.TorusGeometry(1.96, 0.03, 4, 6), bas(color), 0, 0, 0, g);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        mesh(new T.OctahedronGeometry(0.2, 0), accent, Math.cos(a) * 2.2, Math.sin(a) * 2.2, 0, g);
      }
      upd.push((t) => { accent.emissiveIntensity = 1.0 + Math.sin(t * 13) * 0.25 * (Math.sin(t * 2.3) > 0.5 ? 1 : 0.2); });
    } else if (index === 3) { // R&B: a vinyl record with a tone arm
      ring = mesh(new T.TorusGeometry(2, 0.15, 14, 64), ringMat, 0, 0, 0, g);
      [1.55, 1.7, 1.85].forEach((r) => mesh(new T.TorusGeometry(r, 0.014, 4, 64), bas(color, { transparent: true, opacity: 0.7 }), 0, 0, 0.02, g));
      cyl(0.16, 0.2, 0.3, std(0x15151a, { metalness: 0.6 }), 2.6, -1.9, 0, g, 12).rotation.x = Math.PI / 2;
      const arm = cyl(0.045, 0.045, 2.6, std(0xb8b8c4, { metalness: 0.8, roughness: 0.3 }), 1.75, -1.3, 0.05, g, 6);
      arm.rotation.z = 0.7;
      box(0.3, 0.12, 0.1, accent, 0.9, -0.42, 0.05, g).rotation.z = 0.7;
    } else if (index === 4) { // British: a starburst of amp-stack spikes
      ring = mesh(new T.TorusGeometry(2, 0.14, 14, 64), ringMat, 0, 0, 0, g);
      const spikes = new T.Group();
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU, len = i % 2 ? 0.55 : 0.95;
        const s = mesh(new T.ConeGeometry(0.09, len, 6), accent, Math.cos(a) * (2.12 + len / 2), Math.sin(a) * (2.12 + len / 2), 0, spikes);
        s.rotation.z = a - Math.PI / 2;
      }
      g.add(spikes);
      upd.push((t) => { spikes.rotation.z = t * 0.08; });
    } else { // Modern: a gyroscope of orbiting rings
      ring = mesh(new T.TorusGeometry(2, 0.07, 10, 80), ringMat, 0, 0, 0, g);
      const g1 = new T.Group(), g2 = new T.Group();
      mesh(new T.TorusGeometry(2.35, 0.03, 8, 80), bas(color, { transparent: true, opacity: 0.8 }), 0, 0, 0, g1);
      mesh(new T.TorusGeometry(2.6, 0.03, 8, 80), bas(color, { transparent: true, opacity: 0.6 }), 0, 0, 0, g2);
      const orb1 = mesh(new T.SphereGeometry(0.1, 10, 8), bas(0xffffff), 2.35, 0, 0, g1);
      const orb2 = mesh(new T.SphereGeometry(0.08, 10, 8), bas(0xffffff), 2.6, 0, 0, g2);
      g.add(g1, g2);
      upd.push((t) => {
        g1.rotation.x = t * 0.6;
        g2.rotation.y = t * 0.5;
        orb1.position.set(Math.cos(t * 1.4) * 2.35, Math.sin(t * 1.4) * 2.35, 0);
        orb2.position.set(Math.cos(-t * 1.1) * 2.6, Math.sin(-t * 1.1) * 2.6, 0);
      });
    }
    return { group: g, ring, update: (t) => upd.forEach((f) => f(t)) };
  }

  // ---------------- Textures used by worlds ----------------
  function pianoTex() {
    return canvasTex(1024, 1024, (x, w, h) => {
      x.fillStyle = "#0a0a0a";
      x.fillRect(0, 0, w, h);
      const keys = 14, kw = w / keys;
      for (let i = 0; i < keys; i++) {
        x.fillStyle = "#8f9488";
        x.fillRect(i * kw + 2, 0, kw - 4, h);
        x.fillStyle = "rgba(0,0,0,0.25)";
        x.fillRect(i * kw + kw - 8, 0, 6, h);
      }
      x.fillStyle = "#101214";
      for (let i = 0; i < keys - 1; i++) {
        const pos = i % 7;
        if (pos === 2 || pos === 6) continue; // no black key after E and B
        x.fillRect((i + 1) * kw - kw * 0.3, 0, kw * 0.6, h * 0.58);
      }
    });
  }
  function vinylTex(hex) {
    return canvasTex(1024, 1024, (x, w, h) => {
      x.fillStyle = "#0b0a10";
      x.fillRect(0, 0, w, h);
      x.translate(w / 2, h / 2);
      for (let r = 140; r < 510; r += 4) {
        x.strokeStyle = "rgba(255,255,255," + rnd(0.025, 0.08) + ")";
        x.lineWidth = 1;
        x.beginPath();
        x.arc(0, 0, r, 0, TAU);
        x.stroke();
      }
      for (let i = 0; i < 2; i++) {
        x.save();
        x.rotate(i * Math.PI + 0.5);
        x.fillStyle = "rgba(255,255,255,0.07)";
        x.beginPath();
        x.moveTo(0, 0);
        x.arc(0, 0, 505, 0, 0.5);
        x.fill();
        x.restore();
      }
      x.fillStyle = "#" + new T.Color(hex).getHexString();
      x.beginPath();
      x.arc(0, 0, 118, 0, TAU);
      x.fill();
      x.fillStyle = "#0b0a10";
      x.beginPath();
      x.arc(0, 0, 14, 0, TAU);
      x.fill();
      x.fillRect(60, -6, 40, 12);
    });
  }
  function cobbleTex() {
    return canvasTex(512, 512, (x, w, h) => {
      x.fillStyle = "#0c0c14";
      x.fillRect(0, 0, w, h);
      for (let row = 0; row < 16; row++) {
        for (let col = -1; col < 17; col++) {
          const ox = (row % 2) * 16, l = 20 + Math.floor(Math.random() * 30);
          x.fillStyle = "rgb(" + (l - 4) + "," + (l - 4) + "," + (l + 8) + ")";
          x.beginPath();
          if (x.roundRect) x.roundRect(col * 32 + ox + 1, row * 32 + 1, 30, 30, 8);
          else x.rect(col * 32 + ox + 1, row * 32 + 1, 30, 30);
          x.fill();
        }
      }
    }, 9);
  }
  function windowsTex(wall, lit, density) {
    return canvasTex(128, 256, (x, w, h) => {
      x.fillStyle = wall;
      x.fillRect(0, 0, w, h);
      for (let r = 0; r < 16; r++) {
        for (let c = 0; c < 8; c++) {
          const on = Math.random() < density;
          x.fillStyle = on ? pick(lit) : "rgba(0,0,0,0.55)";
          x.fillRect(c * 16 + 3, r * 16 + 3, 10, 10);
        }
      }
    });
  }
  function neonSign(text, hex, w, h) {
    const tex = canvasTex(512, 160, (x, cw, ch) => {
      const css = "#" + new T.Color(hex).getHexString();
      x.clearRect(0, 0, cw, ch);
      x.shadowColor = css;
      x.shadowBlur = 24;
      x.strokeStyle = css;
      x.lineWidth = 8;
      x.beginPath();
      if (x.roundRect) x.roundRect(14, 14, cw - 28, ch - 28, 26); else x.rect(14, 14, cw - 28, ch - 28);
      x.stroke();
      x.fillStyle = "#ffffff";
      x.font = "700 68px Georgia, serif";
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText(text, cw / 2, ch / 2 + 4);
    });
    tex.wrapS = tex.wrapT = T.ClampToEdgeWrapping;
    const s = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, toneMapped: false }));
    s.scale.set(w, h, 1);
    return s;
  }
  function buildings(g, C, count, rMin, rMax, a0, a1, hMin, hMax, texs, useColor) {
    for (let i = 0; i < count; i++) {
      const a = (rnd(a0, a1) * Math.PI) / 180, r = rnd(rMin, rMax);
      const w = rnd(4, 8), h = rnd(hMin, hMax), d = rnd(4, 7);
      const geo = new T.BoxGeometry(w, h, d);
      const uv = geo.attributes.uv;
      for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * (w / 4), uv.getY(k) * (h / 8));
      const m = new T.Mesh(geo, new T.MeshBasicMaterial({ map: pick(texs), color: useColor || 0xffffff }));
      m.position.set(Math.cos(a) * r, h / 2, -Math.sin(a) * r);
      m.rotation.y = Math.atan2(-m.position.x, -m.position.z);
      g.add(m);
    }
  }

  // ---------------- The six chamber worlds ----------------
  function worldDelta(g, C, col) {
    makeGround(g, 24, speckleTex("#5a4030", "#7a5a44", "#3a281e", 6000, 8), { roughness: 1 });
    farGround(g, lin(0x2a1a18));
    ridge(g, 62, 6, lin(0x1a1216), 1.3, true);
    // a slow river behind everything, catching the low moon
    const water = canvasTex(512, 64, (x, w, h) => {
      x.fillStyle = "#2a1c2e";
      x.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) { x.fillStyle = "rgba(255,170,110," + rnd(0.1, 0.4) + ")"; x.fillRect(Math.random() * w, Math.random() * h, rnd(10, 60), 2); }
    }, 5, 1);
    mesh(new T.PlaneGeometry(110, 16), bas(0xffffff, { map: water }), 0, -0.02, -36, g).rotation.x = -Math.PI / 2;
    C.anims.push((t) => { water.offset.x = t * 0.01; });
    // cotton rows
    const puffs = new T.InstancedMesh(new T.IcosahedronGeometry(0.13, 0), std(0xf4eede, { emissive: 0x3a3630, roughness: 1 }), 900);
    const stalks = new T.InstancedMesh(new T.ConeGeometry(0.05, 0.7, 4), std(0x2a3a22, { roughness: 1 }), 450);
    const m4 = new T.Matrix4();
    let pi = 0, si = 0;
    [[-22, -11], [11, 22]].forEach((f) => {
      for (let x = f[0]; x <= f[1]; x += 1.5) {
        for (let z = -3; z <= 10; z += 0.9) {
          const jx = x + rnd(-0.15, 0.15), jz = z + rnd(-0.15, 0.15);
          m4.makeTranslation(jx, 0.35, jz);
          stalks.setMatrixAt(si++, m4);
          for (let k = 0; k < 2; k++) { m4.makeTranslation(jx + (k ? 0.09 : -0.09), 0.76 + k * 0.05, jz); puffs.setMatrixAt(pi++, m4); }
        }
      }
    });
    puffs.count = pi;
    stalks.count = si;
    g.add(puffs, stalks);
    // weathered shack with a porch, a guitarist and two listeners
    function shack(x, z, s) {
      const sh = new T.Group();
      const wall = std(0x4a3626, { roughness: 1 });
      box(4, 2.6, 3.4, wall, 0, 1.3, 0, sh);
      const roof = cyl(0, 2.9, 1.3, std(0x59606a, { metalness: 0.5, roughness: 0.6 }), 0, 3.2, 0, sh, 4);
      roof.rotation.y = Math.PI / 4;
      roof.scale.set(1.15, 1, 1);
      box(4.4, 0.25, 2, wall, 0, 0.12, 2.6, sh);
      [-1.9, 1.9].forEach((px) => cyl(0.08, 0.1, 2.4, wall, px, 1.3, 3.5, sh, 6));
      box(4.6, 0.1, 2.3, std(0x59606a, { metalness: 0.5 }), 0, 2.55, 2.5, sh);
      box(0.9, 0.9, 0.05, bas(0xffc060), -1.1, 1.5, 1.72, sh);
      box(0.9, 1.8, 0.05, std(0x1a120c), 1.0, 0.9, 1.72, sh);
      glow(sh, 0xffb050, 3.4, -1.1, 1.5, 2.1, 0.55);
      glow(sh, 0xffb050, 1.3, 1.6, 2.2, 3.4, 0.9);
      box(0.5, 0.45, 0.5, wall, 0.4, 0.5, 2.8, sh);
      const gtr = C.person(sh, 0.4, 2.8, { seat: 0.75, sit: true, hat: "cap", cloth: 0x594a3a, yaw: 0 });
      C.kit.guitar(gtr, 0x8a5a2a);
      C.person(sh, -1.2, 3.2, { yaw: 0.2 });
      sh.position.set(x, 0, z);
      sh.rotation.y = Math.atan2(-x, -z);
      sh.scale.setScalar(s);
      g.add(sh);
    }
    shack(-15, -9, 1);
    shack(17, -12, 0.85);
    // cypress trees dripping moss
    for (let i = 0; i < 9; i++) {
      const a = (rnd(15, 165) * Math.PI) / 180, r = rnd(20, 30), h = rnd(7, 11);
      const t = tree(g, Math.cos(a) * r, -Math.sin(a) * r, h, "conifer");
      for (let k = 0; k < 10; k++) {
        const aa = rnd(0, TAU), rr = rnd(0.8, 1.7);
        mesh(new T.ConeGeometry(0.06, rnd(1.2, 2.4), 4), std(0x6a7868, { roughness: 1 }), Math.cos(aa) * rr, h * rnd(0.4, 0.7), Math.sin(aa) * rr, t).rotation.x = Math.PI;
      }
    }
    // hanging lanterns on wooden posts
    for (let i = 0; i < 9; i++) {
      const a = ((20 + i * 17.5) * Math.PI) / 180;
      const x = Math.cos(a) * 16, z = -Math.sin(a) * 16;
      cyl(0.09, 0.12, 3.2, std(0x4a3626, { roughness: 1 }), x, 1.6, z, g, 6);
      box(0.3, 0.36, 0.3, bas(0xffb050), x, 3.1, z, g);
      glow(g, 0xffa040, 2.6, x, 3.1, z, 0.7);
    }
    // people: field workers, listeners on the ground
    [[-15, 2], [-18, 6], [-13, 8], [16, 3], [14, 7], [19, 8]].forEach((p, i) => C.person(g, p[0], p[1], { anim: "sway", hat: "cap", face: [0, 0], cloth: [0x594a3a, 0x3a4a5a, 0x6a5a34][i % 3] }));
    [[-5.5, 6], [5.5, 6.4], [-8, 4], [8, 3.5]].forEach((p) => C.person(g, p[0], p[1], { face: [0, -6] }));
    particleField(g, { count: 80, x: [-20, 20], y: [0.3, 3.2], z: [-18, 10], color: 0xffd25a, size: [0.1, 0.2], sway: 1.1 }, C);
    return { pillarColor: 0x4a3626 };
  }

  function worldBoogie(g, C, col) {
    makeGround(g, 24, null, { map: null, color: 0x1a2c28 });
    const floor = makeGround(g, 13, pianoTex(), { roughness: 0.55, metalness: 0.15 });
    floor.position.y = 0.02;
    mesh(new T.TorusGeometry(13, 0.09, 6, 64), bas(lin(col)), 0, 0.05, 0, g).rotation.x = Math.PI / 2;
    farGround(g, lin(0x0a1c1c));
    ridge(g, 70, 15, lin(0x08161a), 2.2, true);
    const near = ridge(g, 44, 8, lin(0x0c1e1e), 5.1, true);
    // lit farmhouse windows on the near hills
    const wpos = [];
    for (let i = 0; i < 30; i++) { const a = rnd(0, TAU); wpos.push(Math.cos(a) * 43.4, rnd(1.2, 3.4), Math.sin(a) * 43.4); }
    const wg = new T.BufferGeometry();
    wg.setAttribute("position", new T.Float32BufferAttribute(wpos, 3));
    g.add(new T.Points(wg, new T.PointsMaterial({ size: 0.9, color: 0xffd080, map: glowTex(), transparent: true, depthWrite: false, blending: T.AdditiveBlending })));
    // grand piano
    const piano = new T.Group();
    const lacquer = std(0x0c0c10, { roughness: 0.25, metalness: 0.6 });
    box(2.6, 0.5, 1.6, lacquer, 0, 1.0, 0, piano);
    const lid = box(2.6, 0.06, 1.5, lacquer, 0, 1.55, -0.1, piano);
    lid.rotation.z = 0.5;
    lid.position.set(0.4, 1.75, -0.1);
    [[-1.1, -0.6], [1.1, -0.6], [-1.1, 0.6]].forEach((l) => cyl(0.06, 0.08, 0.9, lacquer, l[0], 0.45, l[1], piano, 6));
    box(1.6, 0.06, 0.3, std(0xd8d4c4), -0.5, 1.28, 0.8, piano);
    box(0.9, 0.12, 0.4, std(0x2a1a14), -0.5, 0.5, 1.4, piano);
    piano.position.set(-8, 0, 3);
    piano.rotation.y = Math.atan2(8, -3) - Math.PI / 2 + 0.3;
    g.add(piano);
    const pianist = C.person(piano, -0.5, 1.4, { seat: 0.6, sit: true, hat: "fedora", cloth: 0x7a4034, yaw: Math.PI });
    pianist.userData.anim = "play";
    pianist.userData.armL.rotation.x = -1.3;
    pianist.userData.armR.rotation.x = -1.3;
    // dancers around the room
    crowd(C, g, 8, 3, 6.5, 200, 340, { anim: "dance" }, null);
    crowd(C, g, 6, 3.5, 6, 20, 160, { anim: "dance" }, null);
    crowd(C, g, 6, 15, 19, 20, 160, { anim: "cheer", hat: [null, "fedora"] }, [0, -60]);
    // a canopy of string lights running from a center mast to poles
    const mast = new T.Vector3(0, 10.5, -3);
    cyl(0.07, 0.1, 10.5, std(0x1a1c22), 0, 5.25, -3, g, 6);
    const bulbs = [0xffd070, 0xff7a6a, 0x7ae0b0, 0x8ab8ff, 0xffa0d0];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU, px = Math.cos(a) * 17, pz = -3 + Math.sin(a) * 17;
      cyl(0.07, 0.1, 5.8, std(0x1a1c22), px, 2.9, pz, g, 6);
      strand(g, mast, new T.Vector3(px, 5.8, pz), 1.6, 26, bulbs, 0.36);
      glow(g, pick(bulbs), 1.6, (mast.x + px) / 2, 7.4, (mast.z + pz) / 2, 0.55);
    }
    // paper lanterns
    for (let i = 0; i < 12; i++) {
      const a = rnd(0, TAU), r = rnd(8, 16), c = pick(bulbs);
      glow(g, c, 1.6, Math.cos(a) * r, rnd(4.5, 6.5), Math.sin(a) * r - 3, 0.6);
    }
    particleField(g, { count: 60, x: [-18, 18], y: [0.4, 5], z: [-20, 10], color: 0xffe0a0, size: [0.08, 0.16], sway: 1.0 }, C);
    return { pillarColor: 0xcfc9b8 };
  }

  function worldChicago(g, C, col) {
    makeGround(g, 24, speckleTex("#2a2a34", "#3c3c48", "#16161c", 5000, 8), { roughness: 0.32, metalness: 0.45 });
    farGround(g, lin(0x120a0e));
    // road paint
    const paint = bas(0xe8b830);
    for (let z = -26; z < 12; z += 3) { box(0.12, 0.01, 1.6, paint, -0.16, 0.03, z, g); box(0.12, 0.01, 1.6, paint, 0.16, 0.03, z, g); }
    for (let i = -5; i <= 5; i++) box(0.5, 0.01, 2.6, bas(0xc8c8d0), i * 0.95, 0.03, 8.2, g);
    // wet puddles that catch the neon
    [[-6, 4, 0xff5060], [5, 2, 0x50a0ff], [-3, -3, 0xffb040], [8, -4, 0xff5060]].forEach((p) => {
      const m = mesh(new T.CircleGeometry(rnd(1.2, 2.2), 24), bas(lin(p[2]), { transparent: true, opacity: 0.32 }), p[0], 0.035, p[1], g);
      m.rotation.x = -Math.PI / 2;
    });
    // skyline of lit windows
    const texs = [windowsTex("#0e0c12", ["#ffd890", "#ffe8b0", "#9ac0ff"], 0.32), windowsTex("#120c10", ["#ffc070", "#ffe0a0"], 0.22), windowsTex("#0c0e14", ["#a8d0ff", "#ffd890"], 0.4)];
    buildings(g, C, 34, 28, 40, 0, 180, 12, 38, texs);
    buildings(g, C, 10, 26, 32, 180, 360, 12, 26, texs);
    // the "L": an elevated track with a train rumbling across
    const steel = std(0x1c1c24, { metalness: 0.6, roughness: 0.5 });
    box(90, 0.9, 3.4, steel, 0, 8, -19, g);
    for (let x = -40; x <= 40; x += 9) cyl(0.35, 0.45, 8, steel, x, 4, -19, g, 6);
    const train = new T.Group();
    const carMat = std(0x6a6f7a, { metalness: 0.5, roughness: 0.5 });
    for (let i = 0; i < 5; i++) {
      box(6, 2.1, 2.6, carMat, i * 6.3, 0, 0, train);
      box(5.4, 0.7, 2.7, bas(0xffe6a8), i * 6.3, 0.15, 0, train);
    }
    train.position.set(-70, 9.6, -19);
    g.add(train);
    C.anims.push((t) => { train.position.x = ((t * 9) % 150) - 75; });
    // neon signs and sodium street lamps
    [["LIVE BLUES", 0xff5060, -12, 6, -14], ["RECORDS", 0x50a0ff, 11, 5.5, -13], ["OPEN LATE", 0xffb040, 0, 8.6, -22]].forEach((s) => {
      const sg = neonSign(s[0], s[1], 4.6, 1.45);
      sg.position.set(s[2], s[3], s[4]);
      g.add(sg);
      glow(g, s[1], 6, s[2], s[3], s[4] - 0.2, 0.28);
      cyl(0.05, 0.07, s[3], std(0x15151a), s[2], s[3] / 2 - 0.2, s[4], g, 6);
    });
    for (let i = 0; i < 8; i++) {
      const a = ((14 + i * 22) * Math.PI) / 180;
      lamp(g, Math.cos(a) * 16, -Math.sin(a) * 16, 5, 0xffa040, 4);
    }
    // a storefront where the crowd gathers
    const shop = new T.Group();
    box(7, 4, 4, std(0x2a1c1c), 0, 2, 0, shop);
    box(5, 2, 0.1, bas(0xffcf80), 0, 1.9, 2.05, shop);
    box(7.2, 0.2, 1.4, std(0x7a2a2a), 0, 3.6, 2.5, shop).rotation.x = 0.35;
    glow(shop, 0xffb050, 6, 0, 1.8, 2.6, 0.4);
    shop.position.set(-21, 0, -9);
    shop.rotation.y = Math.atan2(21, 9);
    g.add(shop);
    crowd(C, g, 9, 15.5, 18.5, 152, 168, { hat: ["fedora", "fedora", null], anim: "sway" }, [-21, -9]);
    crowd(C, g, 8, 12, 17, 30, 150, { hat: ["fedora", null], anim: "cheer" }, [0, -60]);
    // amp + guitarist
    const amp = new T.Group();
    box(1.5, 1.3, 0.7, std(0x18181c), 0, 0.65, 0, amp);
    box(1.3, 1.1, 0.05, bas(0x2a2418), 0, 0.65, 0.37, amp);
    amp.position.set(12.5, 0, -1);
    amp.rotation.y = Math.atan2(-12.5, 1);
    g.add(amp);
    const gp = C.person(g, 11.2, 0.4, { face: [0, 0], hat: "fedora", cloth: 0x6a2a2a });
    C.kit.guitar(gp, 0xc03030);
    // manhole steam
    [[-4, 6], [6, -6], [-9, -8]].forEach((m) => {
      cyl(0.6, 0.6, 0.03, std(0x111116), m[0], 0.03, m[1], g, 14);
      particleField(g, { count: 10, x: [m[0] - 0.2, m[0] + 0.2], y: [0.1, 0.3], z: [m[1] - 0.2, m[1] + 0.2], color: 0x8a7a80, size: [1.6, 2.6], rise: 0.35, height: 4, sway: 0.4, opacity: 0.3 }, C);
    });
    return { pillarColor: 0x4a4a54 };
  }

  function worldRnb(g, C, col) {
    const rec = makeGround(g, 13, vinylTex(col), { roughness: 0.4, metalness: 0.35 });
    const outer = new T.Mesh(new T.RingGeometry(12.9, 24, 56), std(0x1a0c16, { roughness: 0.6, metalness: 0.2 }));
    outer.rotation.x = -Math.PI / 2;
    outer.position.y = -0.01;
    g.add(outer);
    farGround(g, lin(0x10060e));
    C.anims.push((t, dt) => { rec.rotation.z += (dt || 0.016) * 0.06; });
    // velvet curtain wall
    const cg = new T.CylinderGeometry(23, 23, 15, 96, 1, true, Math.PI * 0.3, Math.PI * 1.4);
    const cp = cg.attributes.position;
    for (let i = 0; i < cp.count; i++) {
      const f = 1 + Math.sin(Math.atan2(cp.getX(i), cp.getZ(i)) * 44) * 0.02;
      cp.setX(i, cp.getX(i) * f);
      cp.setZ(i, cp.getZ(i) * f);
    }
    mesh(cg, std(0x5a1428, { roughness: 1, side: T.DoubleSide }), 0, 7.5, 0, g);
    // marquee arch with chasing bulbs
    const archA = [], archB = [];
    for (let i = 0; i <= 44; i++) {
      const a = (i / 44) * Math.PI;
      (i % 2 ? archA : archB).push(Math.cos(a) * 9.5, Math.sin(a) * 9.5 + 0.2, -19.6);
    }
    mesh(new T.TorusGeometry(9.5, 0.2, 8, 48, Math.PI), std(0x3a2a10, { metalness: 0.8, roughness: 0.3, emissive: col, emissiveIntensity: 0.25 }), 0, 0.2, -19.7, g);
    const mk = (arr) => {
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.Float32BufferAttribute(arr, 3));
      const p = new T.Points(geo, new T.PointsMaterial({ size: 0.6, color: 0xffe0a0, map: glowTex(), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      g.add(p);
      return p;
    };
    const pa = mk(archA), pb = mk(archB);
    C.anims.push((t) => { pa.material.opacity = 0.35 + 0.65 * (Math.sin(t * 5) > 0 ? 1 : 0); pb.material.opacity = 1.0 - pa.material.opacity + 0.35; });
    // the stage and a horn section
    box(13, 0.7, 4.2, std(0x2a1620, { roughness: 0.7 }), 0, 0.35, -17.2, g);
    [-3.6, -1.2, 1.2, 3.6].forEach((x, i) => {
      const p = C.person(g, x, -17, { seat: 0.7, hat: i % 2 ? "fedora" : null, cloth: 0x8a6a20, pants: 0x12101a, yaw: 0 });
      p.position.y = 0.7;
      p.userData.baseY = 0.7;
      if (i < 3) C.kit.horn(p, 0xd8b040); else C.kit.guitar(p, 0x3a2a4a);
    });
    // swaying spotlight beams
    const beams = [];
    [-9, -4.5, 0, 4.5, 9].forEach((x, i) => {
      const pivot = new T.Group();
      pivot.position.set(x, 13.5, -16);
      const cone = mesh(new T.ConeGeometry(2.0, 14, 24, 1, true), new T.MeshBasicMaterial({
        color: i % 2 ? col : 0xffe0b0, transparent: true, opacity: 0.1, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending, fog: false
      }), 0, -7, 0, pivot);
      g.add(pivot);
      beams.push({ pivot, i });
    });
    C.anims.push((t) => beams.forEach((b) => { b.pivot.rotation.z = Math.sin(t * 0.5 + b.i * 1.3) * 0.3; b.pivot.rotation.x = Math.cos(t * 0.4 + b.i) * 0.2; }));
    // speaker stacks that thump
    const woofers = [];
    [-15.5, 15.5].forEach((x) => {
      const st = new T.Group();
      box(1.8, 3.2, 1.5, std(0x12121a), 0, 1.6, 0, st);
      [0.9, 2.3].forEach((y) => {
        const w = mesh(new T.CircleGeometry(0.55, 20), std(0x24242e, { emissive: col, emissiveIntensity: 0.15 }), 0, y, 0.76, st);
        woofers.push(w);
      });
      st.position.set(x, 0, -5);
      st.rotation.y = Math.atan2(-x, 5);
      g.add(st);
    });
    C.anims.push((t) => woofers.forEach((w) => { const s = 1 + Math.pow(Math.max(0, Math.sin(t * 8)), 6) * 0.14; w.scale.set(s, s, 1); }));
    // audience: watching the stage from behind the pillars + swaying at the sides
    crowd(C, g, 16, 11.8, 14.2, 25, 155, { anim: "cheer", hat: [null, "fedora"] }, [0, -60]);
    crowd(C, g, 6, 8, 12, 190, 235, { anim: "dance" }, null);
    crowd(C, g, 6, 8, 12, 305, 350, { anim: "dance" }, null);
    return { pillarColor: 0x6a4a2a };
  }

  function worldBritish(g, C, col) {
    makeGround(g, 24, cobbleTex(), { roughness: 0.35, metalness: 0.3 });
    farGround(g, lin(0x0c0c16));
    // terraced houses with lit windows + a glowing clock face in the fog
    const brick = [0x3a2226, 0x2c2a34, 0x342a24, 0x2a3038];
    const brickCss = ["#26161a", "#1c1b24", "#221b17", "#1a2028"];
    const winTexs = brickCss.map((c) => windowsTex(c, ["#ffd890", "#ffe8b0"], 0.34));
    for (let i = 0; i < 13; i++) {
      const a = ((14 + i * 12.4) * Math.PI) / 180, r = 28;
      const h = rnd(7, 11), w = 6.2;
      const house = new T.Group();
      const wall = std(brick[i % brick.length], { roughness: 1 });
      const front = new T.MeshBasicMaterial({ map: winTexs[i % brick.length] });
      const body = new T.Mesh(new T.BoxGeometry(w, h, 5), [wall, wall, wall, wall, front, wall]);
      body.position.y = h / 2;
      house.add(body);
      const roof = cyl(0, w * 0.75, 2.4, std(0x1a1a22, { roughness: 0.8 }), 0, h + 1.2, 0, house, 4);
      roof.rotation.y = Math.PI / 4;
      [-1.6, 1.4].forEach((cx) => { box(0.6, 1.6, 0.6, wall, cx, h + 1.4, 0, house); cyl(0.16, 0.16, 0.5, std(0x8a3a20), cx, h + 2.4, 0, house, 6); });
      house.position.set(Math.cos(a) * r, 0, -Math.sin(a) * r);
      house.rotation.y = Math.atan2(-house.position.x, -house.position.z);
      g.add(house);
    }
    const tower = new T.Group();
    const stone = std(0x3a3a48, { roughness: 1 });
    box(4, 24, 4, stone, 0, 12, 0, tower);
    box(5, 5, 5, stone, 0, 26, 0, tower);
    cyl(0, 3.4, 7, std(0x1e2a34, { roughness: 0.8 }), 0, 31, 0, tower, 4).rotation.y = Math.PI / 4;
    glow(tower, 0xffe6a0, 4.6, 0, 26, 2.7, 0.95);
    tower.position.set(-10, 0, -34);
    g.add(tower);
    // red phone box, gas lamps
    const phone = new T.Group();
    box(1.2, 2.6, 1.2, std(0xa01818, { roughness: 0.6 }), 0, 1.3, 0, phone);
    [[0, 2], [0.61, 1], [-0.61, 1]].forEach((s) => box(s[0] ? 0.03 : 0.9, 1.6, s[0] ? 0.9 : 0.03, bas(0xffe6a0), s[0], 1.5, s[0] ? 0 : 0.61, phone));
    box(1.3, 0.12, 1.3, std(0xa01818), 0, 2.66, 0, phone);
    glow(phone, 0xffd890, 3, 0, 1.6, 0, 0.5);
    phone.position.set(8.5, 0, 4);
    phone.rotation.y = -0.5;
    g.add(phone);
    for (let i = 0; i < 7; i++) {
      const a = ((14 + i * 25) * Math.PI) / 180;
      lamp(g, Math.cos(a) * 15.5, -Math.sin(a) * 15.5, 4.4, 0xd8e8a0, 4.2);
    }
    // amp stack + guitarist (right)
    const amp = new T.Group();
    [0.55, 1.65].forEach((y) => { box(1.5, 1.05, 0.75, std(0x141418), 0, y, 0, amp); box(1.3, 0.9, 0.04, bas(0x24201a), 0, y, 0.39, amp); box(1.5, 0.06, 0.06, bas(0xd8d0b8), 0, y + 0.5, 0.4, amp); });
    amp.position.set(12.5, 0, 0);
    amp.rotation.y = Math.atan2(-12.5, 0);
    g.add(amp);
    const gp = C.person(g, 11.2, 1.6, { face: [0, 0], cloth: 0x2a2a4a });
    C.kit.guitar(gp, 0x9a2a2a);
    // crowd under umbrellas and bowler hats
    const um = [0x2a2a4a, 0x5a1a2a, 0x1a3a3a, 0x3a3a3a];
    crowd(C, g, 5, 6, 12, 195, 235, { umbrella: um[0], hat: "bowler", anim: "sway" }, [0, 0]);
    crowd(C, g, 4, 12, 16, 30, 150, { umbrella: um[1], hat: "bowler", anim: "sway" }, [0, 0]);
    crowd(C, g, 10, 12, 17, 20, 160, { hat: ["bowler", null], anim: "sway" }, null);
    // falling rain
    const drops = 650, dpos = new Float32Array(drops * 6), dv = [];
    for (let i = 0; i < drops; i++) {
      const x = rnd(-24, 24), y = rnd(0, 18), z = rnd(-30, 16);
      dpos.set([x, y, z, x, y - 0.7, z], i * 6);
      dv.push(rnd(11, 16));
    }
    const rg = new T.BufferGeometry();
    rg.setAttribute("position", new T.BufferAttribute(dpos, 3));
    const rain = new T.LineSegments(rg, new T.LineBasicMaterial({ color: 0x9aa8d8, transparent: true, opacity: 0.35 }));
    rain.frustumCulled = false;
    g.add(rain);
    C.anims.push((t, dt) => {
      const d = dt || 0.016, a = rg.attributes.position.array;
      for (let i = 0; i < drops; i++) {
        let y = a[i * 6 + 1] - dv[i] * d;
        if (y < 0) y = 18;
        a[i * 6 + 1] = y;
        a[i * 6 + 4] = y - 0.7;
      }
      rg.attributes.position.needsUpdate = true;
    });
    return { pillarColor: 0x1e2a26 };
  }

  function worldModern(g, C, col) {
    makeGround(g, 24, speckleTex("#123230", "#1e4a44", "#0a1e1c", 7000, 9), { roughness: 1 });
    farGround(g, lin(0x08181c));
    ridge(g, 66, 9, lin(0x06121a), 3.3, true);
    const dance = makeGround(g, 6.6, null, { color: 0x0e1a24, roughness: 0.3, metalness: 0.5 });
    dance.position.y = 0.02;
    mesh(new T.TorusGeometry(6.6, 0.07, 6, 64), bas(lin(col)), 0, 0.05, 0, g).rotation.x = Math.PI / 2;
    // the festival stage: truss, LED wall, moving lights, lasers
    const truss = std(0x22262e, { metalness: 0.7, roughness: 0.4 });
    box(26, 1.2, 8, std(0x16181e), 0, 0.6, -20, g);
    [-12, 12].forEach((x) => { box(0.6, 15, 0.6, truss, x, 8, -22.5, g); box(0.6, 15, 0.6, truss, x, 8, -17.5, g); });
    box(25, 0.7, 0.7, truss, 0, 14, -22.5, g);
    box(25, 0.7, 0.7, truss, 0, 14, -17.5, g);
    box(25, 0.7, 0.7, truss, 0, 10.5, -17.8, g);
    const led = canvasTex(256, 128, (x, w, h) => {
      const gr = x.createLinearGradient(0, 0, w, 0);
      ["#0aa", "#48f", "#c4f", "#f68", "#fb4", "#0aa"].forEach((c, i) => gr.addColorStop(i / 5, c));
      x.fillStyle = gr;
      x.fillRect(0, 0, w, h);
      x.fillStyle = "rgba(0,0,0,0.45)";
      for (let i = 0; i < w; i += 6) x.fillRect(i, 0, 2, h);
      for (let j = 0; j < h; j += 6) x.fillRect(0, j, w, 2);
    }, 1, 1);
    mesh(new T.PlaneGeometry(17, 7.5), bas(0xb8c4c4, { map: led }), 0, 7.2, -23.4, g);
    C.anims.push((t) => { led.offset.x = t * 0.05; });
    const heads = [];
    for (let i = 0; i < 7; i++) {
      const x = -10.5 + i * 3.5;
      const pivot = new T.Group();
      pivot.position.set(x, 13.6, -18.2);
      mesh(new T.ConeGeometry(1.5, 18, 20, 1, true), new T.MeshBasicMaterial({
        color: [col, 0xff66cc, 0xffffff][i % 3], transparent: true, opacity: 0.09, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending, fog: false
      }), 0, -9, 0, pivot);
      g.add(pivot);
      heads.push({ pivot, i });
    }
    C.anims.push((t) => heads.forEach((h) => { h.pivot.rotation.z = Math.sin(t * 0.7 + h.i) * 0.5; h.pivot.rotation.x = 0.2 + Math.cos(t * 0.6 + h.i * 0.8) * 0.3; }));
    const lasers = new T.Group();
    lasers.position.set(0, 14.4, -19);
    for (let i = 0; i < 9; i++) {
      const l = mesh(new T.CylinderGeometry(0.025, 0.025, 46, 4), bas(i % 2 ? 0x30ffa0 : 0x40c8ff, { transparent: true, opacity: 0.6, fog: false }), 0, 0, 0, lasers);
      l.geometry.translate(0, 23, 0);
      l.rotation.z = -1.0 + i * 0.25;
    }
    g.add(lasers);
    C.anims.push((t) => { lasers.rotation.y = Math.sin(t * 0.35) * 0.5; lasers.rotation.x = -0.35 + Math.sin(t * 0.5) * 0.12; });
    // band on stage
    [[-4, 0], [-1.5, 1], [1.5, 2], [4, 3]].forEach((b) => {
      const p = C.person(g, b[0], -19, { yaw: 0, cloth: [0x2a4a6a, 0x6a2a5a, 0x2a6a5a, 0x5a5a2a][b[1]] });
      p.position.y = 1.2;
      p.userData.baseY = 1.2;
      if (b[1] === 3) p.userData.anim = "cheer"; else C.kit.guitar(p, [0x3a6a9a, 0xc04080, 0x2aa088][b[1]] || 0x3a6a9a);
    });
    // a huge crowd with phone lights
    crowd(C, g, 34, 11.8, 15.2, 22, 158, { anim: "cheer" }, [0, -60]);
    crowd(C, g, 8, 9, 13, 190, 235, { anim: "dance" }, [0, 0]);
    crowd(C, g, 8, 9, 13, 305, 350, { anim: "dance" }, [0, 0]);
    const ph = [];
    for (let i = 0; i < 16; i++) { const a = (rnd(25, 155) * Math.PI) / 180, r = rnd(11.8, 15); ph.push(Math.cos(a) * r, rnd(2.0, 2.5), -Math.sin(a) * r); }
    const pg = new T.BufferGeometry();
    pg.setAttribute("position", new T.Float32BufferAttribute(ph, 3));
    g.add(new T.Points(pg, new T.PointsMaterial({ size: 0.4, color: 0xd8f4ff, map: glowTex(), transparent: true, depthWrite: false, blending: T.AdditiveBlending })));
    // bunting + light poles
    const flags = [0xff6a6a, 0xffd25a, 0x5ad2ff, 0x9a7aff, 0x5aff9a];
    [-1, 1].forEach((sgn) => {
      for (let k = 0; k < 2; k++) {
        const a = new T.Vector3(sgn * 16, 6.2, 2 - k * 10), b = new T.Vector3(sgn * 9.5, 5.6, -7 - k * 4);
        cyl(0.08, 0.1, 6.2, std(0x1a1c22), a.x, 3.1, a.z, g, 6);
        const vp = [], vc = [];
        for (let i = 0; i < 14; i++) {
          const t0 = i / 14, t1 = (i + 0.7) / 14;
          const pt = (t) => new T.Vector3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - 1.3 * 4 * t * (1 - t), a.z + (b.z - a.z) * t);
          const p0 = pt(t0), p1 = pt(t1), pm = pt((t0 + t1) / 2);
          vp.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, pm.x, pm.y - 0.6, pm.z);
          const c = new T.Color(flags[i % flags.length]);
          for (let v = 0; v < 3; v++) vc.push(c.r, c.g, c.b);
        }
        const fg = new T.BufferGeometry();
        fg.setAttribute("position", new T.Float32BufferAttribute(vp, 3));
        fg.setAttribute("color", new T.Float32BufferAttribute(vc, 3));
        g.add(new T.Mesh(fg, new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide })));
      }
    });
    particleField(g, { count: 34, x: [-24, 24], y: [1, 3], z: [-16, 10], color: 0xffb86b, size: [0.7, 1.1], rise: 0.55, height: 24, sway: 1.2, opacity: 0.85 }, C);
    particleField(g, { count: 60, x: [-20, 20], y: [0.3, 3], z: [-14, 10], color: 0xc8ffb0, size: [0.08, 0.15], sway: 1 }, C);
    return { pillarColor: 0x8a9aa0 };
  }

  // Builds one dimension's world into `group`; returns { update, pillarColor }.
  function buildWorld(index, group, colorHex) {
    const C = newCtx();
    const col = new T.Color(colorHex).getHex();
    const fns = [worldDelta, worldBoogie, worldChicago, worldRnb, worldBritish, worldModern];
    const info = fns[index % fns.length](group, C, col) || {};
    return { update: C.update, pillarColor: info.pillarColor || 0x3a3442, characters: C.people };
  }

  function worldKey(eraId, fallbackIndex) { return WORLD_KEYS[worldIndex(eraId, fallbackIndex)]; }

  return { SKY, worldIndex, worldKey, portalFrame, buildPlazaLife, buildWorld, lin };
})();
