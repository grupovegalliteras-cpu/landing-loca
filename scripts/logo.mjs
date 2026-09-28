// Genera las piezas del logo a partir del original (NEXO/logo.png, fondo azul marino).
// Uso: node scripts/logo.mjs ../../logo.png
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const src = process.argv[2] ?? "../../logo.png";
const out = "public/brand";
mkdirSync(out, { recursive: true });

const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width;
const BG = [8, 16, 46];
const BLANCO = [255, 255, 255];
const MENTA = [1, 245, 197];

/** Separa cada píxel en color puro (blanco o menta) + transparencia, sin halo del fondo. */
function recorte([x0, y0, x1, y1], tinta) {
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const buf = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = ((y + y0) * W + (x + x0)) * 3;
      const p = [data[i], data[i + 1], data[i + 2]];
      const dg = p[1] - BG[1];
      const dr = p[0] - BG[0];
      const esBlanco = dg > 0 ? dr / dg > 0.5 : false;
      const fg = esBlanco ? BLANCO : MENTA;
      const a = Math.max(0, Math.min(1, dg / (fg[1] - BG[1])));
      const c = esBlanco ? tinta.blanco : tinta.menta;
      const o = (y * w + x) * 4;
      buf[o] = c[0];
      buf[o + 1] = c[1];
      buf[o + 2] = c[2];
      buf[o + 3] = Math.round(a * 255);
    }
  return sharp(buf, { raw: { width: w, height: h, channels: 4 } });
}

const OSCURO = { blanco: BLANCO, menta: MENTA }; // para fondos oscuros, tal cual el original
const CLARO = { blanco: BG, menta: [0, 178, 142] }; // para fondos claros: tinta azul marino y menta más profundo

const MARCA = [433, 346, 820, 725];
const PALABRA = [166, 753, 1090, 889];

for (const [nombre, tinta] of [["oscuro", OSCURO], ["claro", CLARO]]) {
  await recorte(MARCA, tinta).png({ compressionLevel: 9 }).toFile(`${out}/marca-${nombre}.png`);
  await recorte(PALABRA, tinta).resize({ height: 96 }).png({ compressionLevel: 9 }).toFile(`${out}/nombre-${nombre}.png`);
}

// icono cuadrado sobre el azul marino de la marca (favicon, app, vista previa)
const marca = await recorte(MARCA, OSCURO).png().toBuffer();
for (const s of [512, 192, 180, 32]) {
  const m = Math.round(s * (s <= 32 ? 0.86 : 0.64));
  const pieza = await sharp(marca).resize({ width: m, height: m, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  await sharp({ create: { width: s, height: s, channels: 4, background: { r: BG[0], g: BG[1], b: BG[2], alpha: 1 } } })
    .composite([{ input: pieza, gravity: "center" }])
    .png()
    .toFile(`${out}/icono-${s}.png`);
}
console.log("listo");
