import * as THREE from "three";
import { OUTLINE, isOnIsland, toMap } from "./island-shape";

// Low-poly 3D Sri Lanka for the About hero: an extruded island with the
// central highlands, scattered trees, a sea disc with ripples and a pin per
// destination. Loaded with import() so three.js stays out of the main bundle.

export type ScenePin = { x: number; y: number; label: HTMLElement };

type SceneOptions = {
  container: HTMLElement;
  // Labels are positioned relative to this element.
  labelFrame: HTMLElement;
  pins: ScenePin[];
  reducedMotion: boolean;
  onReady: () => void;
};

const COLOURS = {
  land: "#38a392",
  cliff: "#1c5b52",
  highland: "#2b7f6c",
  peak: "#1c5b52",
  tree: "#246b52",
  sea: "#8fc7cf",
  pin: "#ff6b04",
  light: "#fff9f1",
};

const LAND_DEPTH = 0.16;
const LAND_TOP = LAND_DEPTH + 0.04;
const TILT = -0.95;
const INTRO_MS = 1400;
const PIN_DELAY_MS = 700;
const PIN_STAGGER_MS = 160;

// Main peaks of the hill country (lng, lat, height).
const PEAKS: [number, number, number][] = [
  [80.77, 7.0, 0.42], // Pidurutalagala
  [80.5, 6.81, 0.36], // Sri Pada
  [80.92, 7.12, 0.3],
  [80.63, 7.28, 0.26], // Knuckles side
  [81.06, 6.87, 0.24], // Ella gap
  [80.62, 6.95, 0.28],
  [80.86, 6.8, 0.26],
  [80.78, 7.42, 0.2],
];

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function islandMesh() {
  const shape = new THREE.Shape(OUTLINE.map(({ x, y }) => new THREE.Vector2(x, y)));
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: LAND_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.025,
    bevelSegments: 2,
    curveSegments: 1,
  });
  // Group 0 is the top and bottom faces, group 1 the coastline cliffs.
  return new THREE.Mesh(geometry, [
    new THREE.MeshStandardMaterial({ color: COLOURS.land, roughness: 0.9, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: COLOURS.cliff, roughness: 0.9, flatShading: true }),
  ]);
}

function highlands() {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: COLOURS.highland, roughness: 0.85, flatShading: true });
  const peakMaterial = new THREE.MeshStandardMaterial({ color: COLOURS.peak, roughness: 0.85, flatShading: true });
  PEAKS.forEach(([lng, lat, height], index) => {
    const { x, y } = toMap(lng, lat);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(height * 0.6, height * 0.75, 6), index < 2 ? peakMaterial : material);
    cone.rotation.x = Math.PI / 2;
    cone.rotation.y = index;
    cone.position.set(x, y, LAND_TOP + (height * 0.75) / 2 - 0.02);
    group.add(cone);
  });
  return group;
}

function trees() {
  const random = seeded(11);
  const geometry = new THREE.ConeGeometry(0.035, 0.11, 5);
  const material = new THREE.MeshStandardMaterial({ color: COLOURS.tree, roughness: 0.9, flatShading: true });
  const positions: THREE.Vector3[] = [];
  while (positions.length < 70) {
    const x = (random() - 0.5) * 2.2;
    const y = (random() - 0.5) * 3.9;
    // Keep clear of the coast and the highland cones.
    const nearPeak = PEAKS.some(([lng, lat]) => {
      const peak = toMap(lng, lat);
      return Math.hypot(peak.x - x, peak.y - y) < 0.28;
    });
    if (isOnIsland(x, y) && isOnIsland(x + 0.08, y) && isOnIsland(x - 0.08, y) && !nearPeak) {
      positions.push(new THREE.Vector3(x, y, LAND_TOP + 0.05));
    }
  }
  const mesh = new THREE.InstancedMesh(geometry, material, positions.length);
  const matrix = new THREE.Matrix4();
  const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  positions.forEach((position, index) => {
    const size = 0.7 + random() * 0.6;
    matrix.compose(position, rotation, new THREE.Vector3(size, size, size));
    mesh.setMatrixAt(index, matrix);
  });
  return mesh;
}

function sea() {
  const group = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(1.85, 64),
    new THREE.MeshBasicMaterial({ color: COLOURS.sea, transparent: true, opacity: 0.22, depthWrite: false }),
  );
  disc.position.z = -0.02;
  group.add(disc);
  const ripples = [0, 1, 2].map(() => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1, 1.012, 96),
      new THREE.MeshBasicMaterial({ color: COLOURS.sea, transparent: true, opacity: 0, depthWrite: false }),
    );
    ring.position.z = -0.01;
    group.add(ring);
    return ring;
  });
  return { group, ripples };
}

function pinMesh(material: THREE.Material, baseMaterial: THREE.Material) {
  const pin = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.34, 6), material);
  stem.rotation.x = Math.PI / 2;
  stem.position.z = 0.17;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 12), material);
  head.position.z = 0.36;
  const base = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.075, 32), baseMaterial);
  base.position.z = 0.005;
  pin.add(stem, head, base);
  return { pin, head, base };
}

function disposeTree(root: THREE.Object3D) {
  root.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.geometry.dispose();
      (Array.isArray(node.material) ? node.material : [node.material]).forEach((material) => material.dispose());
    }
  });
}

const easeOut = (t: number) => 1 - (1 - Math.min(Math.max(t, 0), 1)) ** 3;

// Builds the scene into the container. Returns a cleanup function, or null
// when WebGL is unavailable (the SVG fallback then stays).
export function mountIslandScene({ container, labelFrame, pins, reducedMotion, onReady }: SceneOptions) {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.className = "absolute inset-0 size-full";
  // Under the label layer, so the link pills stay on top.
  container.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(COLOURS.light, COLOURS.cliff, 1.6));
  const sun = new THREE.DirectionalLight("#fff1d6", 2.4);
  sun.position.set(-3, 4, 6);
  scene.add(sun);

  // tilt: leans the map back. island: sways and bobs inside it.
  const tilt = new THREE.Group();
  tilt.rotation.x = TILT;
  const island = new THREE.Group();
  const { group: seaGroup, ripples } = sea();
  island.add(seaGroup, islandMesh(), highlands(), trees());
  tilt.add(island);
  scene.add(tilt);

  const pinMaterial = new THREE.MeshStandardMaterial({ color: COLOURS.pin, roughness: 0.4, emissive: COLOURS.pin, emissiveIntensity: 0.25 });
  const pinBaseMaterial = new THREE.MeshBasicMaterial({ color: COLOURS.pin, transparent: true, opacity: 0.7, depthWrite: false });
  const pinMeshes = pins.map(({ x, y }) => {
    const mesh = pinMesh(pinMaterial, pinBaseMaterial);
    mesh.pin.position.set(x, y, LAND_TOP);
    island.add(mesh.pin);
    return mesh;
  });

  // Hovering a pin highlights its label, and the other way round.
  let hovered = -1;
  const setHovered = (index: number) => {
    if (index === hovered) return;
    if (hovered >= 0) delete pins[hovered].label.dataset.hover;
    hovered = index;
    if (index >= 0) pins[index].label.dataset.hover = "";
    container.style.cursor = index >= 0 ? "pointer" : "";
    wake();
  };
  const onLabel = (event: Event) => event.target instanceof Element && event.target.closest("[data-island-label]") !== null;
  const labelListeners = pins.map(({ label }, index) => {
    const enter = () => setHovered(index);
    const leave = () => setHovered(-1);
    label.addEventListener("pointerenter", enter);
    label.addEventListener("pointerleave", leave);
    label.addEventListener("focusin", enter);
    label.addEventListener("focusout", leave);
    return { label, enter, leave };
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const tiltTarget = new THREE.Vector2();
  const heads: THREE.Object3D[] = pinMeshes.map(({ head }) => head);
  const onPointerMove = (event: PointerEvent) => {
    const box = container.getBoundingClientRect();
    pointer.set(((event.clientX - box.left) / box.width) * 2 - 1, -((event.clientY - box.top) / box.height) * 2 + 1);
    tiltTarget.set(pointer.x, pointer.y);
    // Labels manage their own hover.
    if (onLabel(event)) return;
    raycaster.setFromCamera(pointer, camera);
    // Generous hit area: the nearest pin head within reach of the ray.
    const hit = raycaster.intersectObjects(heads, false)[0];
    setHovered(hit ? heads.indexOf(hit.object) : -1);
  };
  const onPointerLeave = () => {
    tiltTarget.set(0, 0);
    setHovered(-1);
  };
  const onClick = (event: MouseEvent) => {
    if (hovered >= 0 && !onLabel(event)) pins[hovered].label.querySelector("a")?.click();
  };
  container.addEventListener("pointermove", onPointerMove);
  container.addEventListener("pointerleave", onPointerLeave);
  container.addEventListener("click", onClick);

  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Pull back on narrow frames so the whole island fits.
    camera.position.set(0, 0, 6.6 / Math.min(1, camera.aspect * 1.4));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  };

  const projected = new THREE.Vector3();
  const placeLabels = () => {
    const box = container.getBoundingClientRect();
    const frame = labelFrame.getBoundingClientRect();
    const points = pinMeshes.map(({ head }, index) => {
      head.getWorldPosition(projected).project(camera);
      const left = ((projected.x + 1) / 2) * box.width + box.left - frame.left;
      const top = ((1 - projected.y) / 2) * box.height + box.top - frame.top;
      const { label } = pins[index];
      label.style.left = `${left.toFixed(1)}px`;
      label.style.top = `${top.toFixed(1)}px`;
      return { left, top, width: label.offsetWidth, height: label.offsetHeight };
    });

    // Labels sit centred above their pin. When two would overlap, the western
    // one moves to the left of its pin and the other to the right.
    const sides: (string | undefined)[] = points.map(() => undefined);
    points.forEach((a, i) => {
      points.slice(i + 1).forEach((b, offset) => {
        const j = i + 1 + offset;
        const overlaps = Math.abs(a.left - b.left) < (a.width + b.width) / 2 && Math.abs(a.top - b.top) < (a.height + b.height) / 2 + 12;
        if (!overlaps) return;
        sides[a.left < b.left ? i : j] = "left";
        sides[a.left < b.left ? j : i] = "right";
      });
    });
    sides.forEach((side, index) => {
      const { label } = pins[index];
      if (label.dataset.side === side) return;
      if (side) label.dataset.side = side;
      else delete label.dataset.side;
    });
  };

  const start = performance.now();
  let frame = 0;
  let visible = true;
  let ready = false;
  const tiltNow = new THREE.Vector2();

  const draw = (now: number) => {
    const elapsed = reducedMotion ? Number.POSITIVE_INFINITY : now - start;
    const seconds = now / 1000;
    const intro = easeOut(elapsed / INTRO_MS);
    island.position.y = (1 - intro) * -0.6 + (reducedMotion ? 0 : Math.sin(seconds * 0.8) * 0.04);
    island.scale.setScalar(0.85 + intro * 0.15);

    if (!reducedMotion) {
      tiltNow.lerp(tiltTarget, 0.06);
      island.rotation.z = Math.sin(seconds * 0.25) * 0.16 + tiltNow.x * 0.22;
      tilt.rotation.x = TILT - tiltNow.y * 0.12;
      ripples.forEach((ring, index) => {
        const phase = (seconds / 6 + index / ripples.length) % 1;
        ring.scale.setScalar(1.2 + phase * 0.75);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.45 * (1 - phase) * intro;
      });
    }

    pinMeshes.forEach(({ pin, base }, index) => {
      const rise = easeOut((elapsed - PIN_DELAY_MS - index * PIN_STAGGER_MS) / 500);
      const highlight = index === hovered ? 1.35 : 1;
      pin.scale.set(highlight, highlight, Math.max(rise, 0.001) * highlight);
      const pulse = reducedMotion ? 0 : (seconds * 0.9 + index * 0.3) % 1;
      base.scale.setScalar(1 + pulse * 0.8);
      pins[index].label.style.opacity = String(rise);
    });

    renderer.render(scene, camera);
    placeLabels();
    if (!ready) {
      ready = true;
      onReady();
    }
  };

  // With reduced motion there is no loop: one frame per change (hover, resize).
  const loop = (now: number) => {
    draw(now);
    frame = visible && !reducedMotion ? requestAnimationFrame(loop) : 0;
  };
  const wake = () => {
    if (!frame) frame = requestAnimationFrame(loop);
  };

  const resizeObserver = new ResizeObserver(() => {
    resize();
    wake();
  });
  resizeObserver.observe(container);
  // Only animate while the hero is on screen and the tab is visible.
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && document.visibilityState === "visible";
    if (visible) wake();
  });
  visibility.observe(container);
  const onVisibilityChange = () => {
    visible = document.visibilityState === "visible";
    if (visible) wake();
  };
  document.addEventListener("visibilitychange", onVisibilityChange);

  resize();
  wake();

  return () => {
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    visibility.disconnect();
    document.removeEventListener("visibilitychange", onVisibilityChange);
    container.removeEventListener("pointermove", onPointerMove);
    container.removeEventListener("pointerleave", onPointerLeave);
    container.removeEventListener("click", onClick);
    labelListeners.forEach(({ label, enter, leave }) => {
      label.removeEventListener("pointerenter", enter);
      label.removeEventListener("pointerleave", leave);
      label.removeEventListener("focusin", enter);
      label.removeEventListener("focusout", leave);
    });
    disposeTree(scene);
    renderer.dispose();
    renderer.domElement.remove();
  };
}
