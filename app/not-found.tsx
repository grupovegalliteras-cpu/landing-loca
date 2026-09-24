import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg p-6 text-center">
      <div>
        <div className="font-display text-6xl font-semibold text-fg-3">404</div>
        <h1 className="mt-2 font-display text-2xl font-semibold">Esta pantalla no existe</h1>
        <p className="mt-2 text-fg-2">Puede que el enlace esté mal escrito.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/" className="rounded-lg border border-line px-4 py-2 text-sm font-medium">Inicio</Link>
          <Link href="/demo" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-ink">Abrir la demo</Link>
        </div>
      </div>
    </main>
  );
}
