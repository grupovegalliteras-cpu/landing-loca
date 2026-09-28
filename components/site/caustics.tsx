"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
// El dibujo necesita alta precisión: con mediump (muchos móviles) sale ruido en bloques.
const FRAG = `precision highp float;
uniform vec2 r;uniform float t;uniform vec3 deep;uniform vec3 mid;uniform vec3 light;
void main(){
  vec2 uv=gl_FragCoord.xy/r.y;
  float time=t*.22+23.;
  vec2 p=uv*5.2-250.;
  vec2 i=p;float c=1.;float inten=.005;
  for(int n=0;n<5;n++){
    float tt=time*(1.-(3.5/float(n+1)));
    i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));
    c+=1./length(vec2(p.x/(sin(i.x+tt)/inten),p.y/(cos(i.y+tt)/inten)));
  }
  c/=5.;c=1.17-pow(c,1.4);
  float v=clamp(pow(abs(c),8.),0.,1.);
  vec2 q=gl_FragCoord.xy/r;
  vec3 col=mix(deep,mid,smoothstep(0.,1.,q.y*.9+q.x*.25));
  col+=light*v*(.35+.35*q.y);
  float vig=smoothstep(1.25,.25,length(q-vec2(.6,.75)));
  col*=.55+.45*vig;
  gl_FragColor=vec4(col,1.);
}`;

function hex(h: string) {
  const n = parseInt(h.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Fondo de cáusticas de agua en WebGL. Se detiene fuera de pantalla y respeta reducir movimiento. */
export function Caustics({ className, deep = "#041820", mid = "#0a4a5e", light = "#9fe3f2" }: { className?: string; deep?: string; mid?: string; light?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    // opaco y conservando el último fotograma: si el navegador no repinta, nunca queda un hueco blanco
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, preserveDrawingBuffer: true });
    if (!gl) return;
    // sin alta precisión en el fragment shader nos quedamos con el degradado de CSS
    const hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    if (!hp || hp.precision < 16) return;
    const sh =(type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, "r");
    const uT = gl.getUniformLocation(prog, "t");
    gl.uniform3fv(gl.getUniformLocation(prog, "deep"), hex(deep));
    gl.uniform3fv(gl.getUniformLocation(prog, "mid"), hex(mid));
    gl.uniform3fv(gl.getUniformLocation(prog, "light"), hex(light));

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    const draw = () => {
      // con movimiento reducido se pinta un instante fijo y bonito de la animación
      const t = reduce ? 18 : ((performance.now() - t0) / 1000) % 1200;
      gl.uniform1f(uT, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const resize = () => {
      const s = 0.5;
      const w = Math.max(1, Math.floor(canvas.clientWidth * s));
      const h = Math.max(1, Math.floor(canvas.clientHeight * s));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      // siempre: si el lienzo ya tenía este tamaño (efecto montado dos veces), el programa nuevo no lo sabría
      gl.uniform2f(uR, w, h);
      // cambiar el tamaño borra el lienzo: hay que volver a pintar
      draw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    let raf = 0;
    const frame = () => {
      if (visible) draw();
      raf = requestAnimationFrame(frame);
    };
    if (!reduce) raf = requestAnimationFrame(frame);

    const lost = (e: Event) => e.preventDefault();
    canvas.addEventListener("webglcontextlost", lost);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("webglcontextlost", lost);
    };
  }, [deep, mid, light]);
  return (
    <canvas
      ref={ref}
      className={cn("block size-full", className)}
      aria-hidden
      style={{ background: `radial-gradient(ellipse at 70% 20%, ${mid}, ${deep} 70%)` }}
    />
  );
}
