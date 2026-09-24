import { ImageResponse } from "next/og";

export function generateStaticParams() {
  return [{ size: "192" }, { size: "512" }];
}

export async function GET(_req: Request, ctx: RouteContext<"/pwa-icon/[size]">) {
  const { size } = await ctx.params;
  const s = size === "512" ? 512 : 192;
  return new ImageResponse(
    (
      <div style={{ width: s, height: s, background: "#0c1a22", display: "flex" }}>
        <svg width={s} height={s} viewBox="0 0 32 32">
          <path d="M10 21.5 C 10 13, 22 19, 22 10.5" fill="none" stroke="#f5ab2e" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="10" cy="21.5" r="3.4" fill="#3db1d3" />
          <circle cx="22" cy="10.5" r="3.4" fill="#3db1d3" />
        </svg>
      </div>
    ),
    { width: s, height: s, headers: { "cache-control": "public, max-age=86400" } },
  );
}
