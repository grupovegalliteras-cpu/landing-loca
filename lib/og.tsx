/* eslint-disable @next/next/no-img-element -- dentro de ImageResponse no hay <Image> */
import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };

const pieza = (nombre: string) => `data:image/png;base64,${readFileSync(join(process.cwd(), "public/brand", `${nombre}-oscuro.png`)).toString("base64")}`;
const tam = (nombre: string) => {
  const b = readFileSync(join(process.cwd(), "public/brand", `${nombre}-oscuro.png`));
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};
const MARCA = tam("marca");
const NOMBRE = tam("nombre");

/** Bricolage en negrita para el titular. Si no se puede descargar al compilar, se usa la letra por defecto. */
async function fuente(): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700")).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const r = await fetch(url);
    return r.ok ? await r.arrayBuffer() : null;
  } catch {
    return null;
  }
}

/**
 * Imagen de vista previa para WhatsApp y redes: es lo primero que ve
 * quien recibe el enlace, así que va con el mensaje principal bien grande.
 */
export async function ogImage({ kicker, title, sub, chips }: { kicker: string; title: string; sub: string; chips: string[] }) {
  const bold = await fuente();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          color: "white",
          background: "radial-gradient(circle at 85% 0%, #0f5a70 0%, #07303d 40%, #041820 75%)",

        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* logo real, el mismo que en la web */}
          <img src={pieza("marca")} height={64} width={Math.round((64 * MARCA.w) / MARCA.h)} alt="" />
          <img src={pieza("nombre")} height={38} width={Math.round((38 * NOMBRE.w) / NOMBRE.h)} alt="" />
          <div style={{ display: "flex", marginLeft: "auto", fontSize: 24, color: "rgba(255,255,255,0.6)" }}>{kicker}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 78, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2.5, maxWidth: 1000, fontFamily: bold ? "Bricolage" : undefined }}>{title}</div>
          <div style={{ display: "flex", marginTop: 22, fontSize: 30, lineHeight: 1.35, color: "rgba(255,255,255,0.75)", maxWidth: 960 }}>{sub}</div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {chips.map((c, i) => (
            <div
              key={c}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 22px",
                borderRadius: 16,
                fontSize: 24,
                fontWeight: 600,
                background: i === 0 ? "#f5ab2e" : "rgba(255,255,255,0.09)",
                color: i === 0 ? "#1d1300" : "white",
                border: i === 0 ? "none" : "1px solid rgba(255,255,255,0.18)",
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: bold ? [{ name: "Bricolage", data: bold, weight: 700, style: "normal" }] : undefined },
  );
}
