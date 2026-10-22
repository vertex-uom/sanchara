// Sri Lanka's main island for the About hero map. Coastline from Natural Earth
// 1:50m admin-0 countries (public domain), longitude/latitude, 75 points.
// Map units: origin at the island's centre, 1 unit = 1° of latitude.

export const COASTLINE: [lng: number, lat: number][] = [
  [79.982, 9.813], [80.078, 9.807], [80.181, 9.81], [80.253, 9.796], [80.376, 9.642], [80.711, 9.366],
  [80.893, 9.086], [80.91, 9.025], [80.935, 8.971], [80.979, 8.957], [81.016, 8.933], [81.198, 8.662],
  [81.219, 8.608], [81.216, 8.549], [81.227, 8.506], [81.275, 8.484], [81.334, 8.472], [81.373, 8.431],
  [81.422, 8.215], [81.422, 8.148], [81.436, 8.119], [81.665, 7.782], [81.679, 7.742], [81.676, 7.711],
  [81.683, 7.684], [81.727, 7.625], [81.797, 7.465], [81.832, 7.428], [81.874, 7.288], [81.877, 7.02],
  [81.861, 6.901], [81.819, 6.756], [81.768, 6.614], [81.713, 6.512], [81.637, 6.425], [81.38, 6.241],
  [81.306, 6.204], [80.971, 6.088], [80.724, 5.979], [80.496, 5.949], [80.267, 6.01], [80.095, 6.153],
  [80.007, 6.364], [79.947, 6.585], [79.859, 6.829], [79.792, 7.585], [79.76, 7.796], [79.708, 8.066],
  [79.713, 8.182], [79.75, 8.294], [79.75, 8.049], [79.783, 8.018], [79.809, 8.05], [79.832, 8.304],
  [79.851, 8.412], [79.942, 8.692], [79.944, 8.741], [79.928, 8.846], [79.929, 8.899], [80.065, 9.096],
  [80.1, 9.21], [80.118, 9.327], [80.111, 9.453], [80.086, 9.578], [80.196, 9.538], [80.256, 9.495],
  [80.318, 9.465], [80.368, 9.48], [80.428, 9.481], [80.385, 9.549], [80.258, 9.611], [80.046, 9.65],
  [79.979, 9.699], [79.954, 9.742], [79.967, 9.793],];

const LNG_MIN = 79.708;
const LNG_MAX = 81.877;
const LAT_MIN = 5.949;
const LAT_MAX = 9.813;
const CENTRE_LNG = (LNG_MIN + LNG_MAX) / 2;
const CENTRE_LAT = (LAT_MIN + LAT_MAX) / 2;
// Equirectangular, corrected for latitude so the island keeps its shape.
const LNG_SCALE = Math.cos((CENTRE_LAT * Math.PI) / 180);

export const MAP_WIDTH = (LNG_MAX - LNG_MIN) * LNG_SCALE;
export const MAP_HEIGHT = LAT_MAX - LAT_MIN;

// y grows north (up), as in three.js.
export function toMap(lng: number, lat: number) {
  return { x: (lng - CENTRE_LNG) * LNG_SCALE, y: lat - CENTRE_LAT };
}

export const OUTLINE = COASTLINE.map(([lng, lat]) => toMap(lng, lat));

export function isOnIsland(x: number, y: number) {
  let inside = false;
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const a = OUTLINE[i];
    const b = OUTLINE[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

// Percent position inside the outline's bounding box (SVG fallback and labels).
export function toPercent(x: number, y: number) {
  return { left: (x / MAP_WIDTH + 0.5) * 100, top: (0.5 - y / MAP_HEIGHT) * 100 };
}

// SVG path in a MAP_WIDTH × MAP_HEIGHT box, y flipped for screen space.
export const OUTLINE_SVG_PATH = `M${OUTLINE.map(({ x, y }) => `${(x + MAP_WIDTH / 2).toFixed(3)} ${(MAP_HEIGHT / 2 - y).toFixed(3)}`).join("L")}Z`;
