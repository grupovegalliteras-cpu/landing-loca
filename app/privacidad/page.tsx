import type { Metadata } from "next";
import { SiteFooter, SiteNav } from "@/components/site/chrome";
import { CONTACTO } from "@/data/site";

export const metadata: Metadata = {
  title: "Privacidad",
  description: "Qué datos tratamos en esta web y en la demo de Nexo4Pymes.",
};

const BLOQUES: [string, string][] = [
  ["Quiénes somos", `Nexo4Pymes, en ${CONTACTO.ciudad}. Para cualquier cosa sobre tus datos, escríbenos a ${CONTACTO.email}.`],
  [
    "El formulario de contacto",
    "El formulario no guarda nada en nuestros servidores. Solo prepara un mensaje con lo que escribes y lo abre en tu WhatsApp o en tu correo, y eres tú quien decide enviarlo. Lo que nos mandes lo usamos únicamente para responderte y preparar tu demo.",
  ],
  [
    "La demo",
    "Todas las empresas, personas y cifras de la demo son ficticias. Lo que haces en ella (avisos, partes, facturas de prueba) se guarda solo en el almacenamiento de tu navegador, para que la demo recuerde dónde lo dejaste. No sale de tu dispositivo y se borra con el botón Reiniciar o limpiando los datos del navegador.",
  ],
  ["Cookies", "Esta web no usa cookies de publicidad ni de analítica, ni herramientas de seguimiento de terceros."],
  [
    "Tus derechos",
    `Puedes pedirnos acceder a tus datos, corregirlos o borrarlos escribiendo a ${CONTACTO.email}. Si crees que no los hemos tratado bien, puedes reclamar ante la Agencia Española de Protección de Datos.`,
  ],
];

export default function Privacidad() {
  return (
    <div className="bg-bg text-fg">
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 pt-24 pb-16 sm:px-6 sm:pt-28 sm:pb-24">
        <h1 className="font-display text-[36px] leading-tight font-semibold tracking-tight sm:text-[48px]">Privacidad</h1>
        <p className="mt-3 text-[17px] text-fg-2">Explicado claro y corto.</p>
        <div className="mt-10 grid gap-8">
          {BLOQUES.map(([t, d]) => (
            <section key={t}>
              <h2 className="font-display text-[22px] font-semibold tracking-tight">{t}</h2>
              <p className="mt-2 text-[16px] leading-relaxed text-fg-2">{d}</p>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
