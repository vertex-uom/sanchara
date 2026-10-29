// Scratch tool: print pixel colours from an 8-bit, non-interlaced PNG.
// Usage:
//   node sample.mjs <png> x,y [x,y ...]          one hex per point
//   node sample.mjs <png> row:y:x0:x1            runs of equal colour along a row
//   node sample.mjs <png> col:x:y0:y1            runs of equal colour along a column
// Coordinates are in the PNG's own pixels.
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

function decode(path) {
  const buf = readFileSync(path);
  let pos = 8;
  let width = 0, height = 0, colorType = 0, bitDepth = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      if (data[12] !== 0) throw new Error("interlaced PNG not supported");
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  if (bitDepth !== 8) throw new Error(`bit depth ${bitDepth} not supported`);
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`colour type ${colorType} not supported`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? out[y * stride + i - channels] : 0;
      const b = y > 0 ? out[(y - 1) * stride + i] : 0;
      const c = y > 0 && i >= channels ? out[(y - 1) * stride + i - channels] : 0;
      let value = line[i];
      if (filter === 1) value += a;
      else if (filter === 2) value += b;
      else if (filter === 3) value += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[y * stride + i] = value & 0xff;
    }
  }
  return {
    width,
    height,
    hex(x, y) {
      const i = y * stride + x * channels;
      const rgb = channels >= 3 ? [out[i], out[i + 1], out[i + 2]] : [out[i], out[i], out[i]];
      return `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
    },
  };
}

const [file, ...specs] = process.argv.slice(2);
const img = decode(file);
console.log(`${file}: ${img.width}x${img.height}`);
for (const spec of specs) {
  if (spec.startsWith("row:") || spec.startsWith("col:")) {
    const [mode, fixed, from, to] = spec.split(":");
    const runs = [];
    for (let t = Number(from); t <= Number(to); t++) {
      const color = mode === "row" ? img.hex(t, Number(fixed)) : img.hex(Number(fixed), t);
      const last = runs.at(-1);
      if (last && last.color === color) last.end = t;
      else runs.push({ color, start: t, end: t });
    }
    console.log(spec);
    for (const run of runs) console.log(`  ${run.start}-${run.end} (${run.end - run.start + 1}px) ${run.color}`);
  } else {
    const [x, y] = spec.split(",").map(Number);
    console.log(`${spec} ${img.hex(x, y)}`);
  }
}
