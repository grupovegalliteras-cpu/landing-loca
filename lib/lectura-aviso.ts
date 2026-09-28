import { MUNICIPIOS } from "@/data/seed";
import type { Sector } from "@/data/sectors";

/* ---------- Lectura de un aviso escrito por el visitante ----------
   Reglas sencillas y deterministas: suficiente para enseñar el flujo con cualquier texto. */

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Pueblos que no están en el mapa de la demo, llevados a la zona más cercana. */
const ALIAS: Record<string, string> = {
  andratx: "Calvià", "santa ponsa": "Calvià", magaluf: "Calvià", portals: "Calvià", palmanova: "Calvià", bendinat: "Calvià",
  pollensa: "Alcúdia", pollenca: "Alcúdia", "can picafort": "Alcúdia", muro: "Alcúdia",
  "sa pobla": "Inca", binissalem: "Inca", lloseta: "Inca", selva: "Inca",
  "cala millor": "Manacor", "porto cristo": "Manacor", felanitx: "Manacor", "cala d'or": "Manacor", arta: "Manacor", capdepera: "Manacor",
  arenal: "Llucmajor", campos: "Llucmajor", santanyi: "Llucmajor", "colonia de sant jordi": "Llucmajor",
  deia: "Sóller", valldemossa: "Sóller", fornalutx: "Sóller",
  bunyola: "Marratxí", "santa maria": "Marratxí", "pont d'inca": "Marratxí",
  "son ferriol": "Palma", "playa de palma": "Palma", "es molinar": "Palma", portixol: "Palma",
};

/** Palabras del oficio que no salen en el nombre del servicio: [en el mensaje, en el nombre del servicio]. */
const SINONIMOS: [RegExp, RegExp][] = [
  [/fuga|gotea|grifo|tuberi|atasc|cisterna|desague/, /fontaner/],
  [/caldera|agua caliente|calefacc/, /caldera/],
  [/diferencial|enchufe|sin luz|cuadro electrico|salta la luz/, /electric/],
  [/termo/, /termo/],
  [/cucarach|hormig|insect|chinche|avispa/, /desinsect|choque/],
  [/rata|raton|roedor|excrement/, /desratiz/],
  [/riego|aspersor|goteo|programador/, /riego/],
  [/palmera|picudo/, /palmera/],
  [/maleza|hierba alta|parcela|desbroz/, /desbroce/],
  [/no enfria|camara|grados|congelad/, /frio/],
  [/fuga de gas|recargar gas|alarma de la camara/, /gas/],
  [/split|aire acondicionado|poner aire/, /split/],
  [/verde/, /verde/],
  [/depuradora|no aspira/, /depuradora/],
  [/polvo|pintores|fin de obra/, /obra/],
  [/cristal|ventana/, /cristal/],
  [/inversor|luz roja|producen/, /inversor/],
  [/bateria/, /bateria/],
  [/baldosa|persiana|suena hueca|pequeno arreglo/, /puntual/],
  [/terraza|filtra|gotera/, /impermeab|terraza/],
];

export type Lectura = {
  tipo: "avería" | "presupuesto" | "queja" | "consulta";
  urgencia: "alta" | "media" | "baja";
  servicio: { nombre: string; precio: number; min: number };
  municipio: string;
  municipioDicho: boolean;
  resumen: string;
};

export function leer(texto: string, sector: Sector): Lectura {
  const t = norm(texto);
  const urg =
    /urgent|fuga|gotea|inund|no funciona|no va\b|no enciende|no arranca|no enfria|sin luz|sin agua|no hay agua|se sale|humo|roto|rota|averi|hoy|ahora|ya mismo|esta noche|cuanto antes|huesped|clientes? (estan|llegan)|llega una familia|verde|parad|subiendo|cucarach|\bratas?\b|raton|excrement|apagad|auditori|inspecc|agua por/.test(
      t,
    );
  const tipo: Lectura["tipo"] = /precio|presupuesto|cuanto (cuesta|vale|costaria|me cobr)|tarifa/.test(t)
    ? "presupuesto"
    : /otra vez|vuelve a|de nuevo|queja|no vinieron|no vino|mal hecho|sigue igual|siguen saliendo|se han quedado/.test(t)
      ? "queja"
      : urg || /problema|no (funciona|va|sale|salta|enciende|enfria|aspira|carga)|ruido|olor|mancha|atasc|fall|cae agua|entrado agua|la mitad|luz roja|turbi|caid|hueca|restos|hormig|plaga|bicho/.test(t)
        ? "avería"
        : "consulta";
  const urgencia: Lectura["urgencia"] = urg && tipo !== "presupuesto" ? "alta" : tipo === "queja" || tipo === "avería" ? "media" : "baja";

  // servicio: el nombre del catálogo pesa mucho; los avisos de ejemplo del sector, poco (comparten palabras genéricas)
  const palabras = (s: string) => norm(s).split(/[^a-zñ0-9]+/).filter((w) => w.length > 3).map((w) => w.slice(0, 5));
  const msg = new Set(palabras(texto));
  const puntos = sector.servicios.map((s) => palabras(s.nombre).filter((w) => msg.has(w)).length * 5);
  SINONIMOS.forEach(([enMensaje, enServicio]) => {
    if (!enMensaje.test(t)) return;
    sector.servicios.forEach((s, i) => {
      if (enServicio.test(norm(s.nombre))) puntos[i] += 6;
    });
  });
  sector.avisos.forEach((a) => {
    const txt = a.lineas.map((l) => l[1]).join(" ") + " " + a.resumen;
    puntos[a.servicio] += new Set(palabras(txt).filter((w) => msg.has(w))).size * 0.5;
  });
  const max = Math.max(...puntos);
  const idx = max === 0 ? (tipo === "presupuesto" ? sector.servicios.length - 1 : 0) : puntos.indexOf(max);

  let municipio = "";
  for (const m of Object.keys(MUNICIPIOS)) if (t.includes(norm(m))) municipio = m;
  if (!municipio) for (const [a, m] of Object.entries(ALIAS)) if (t.includes(a)) municipio = m;

  // la frase con el problema, no el saludo ni la presentación
  const limpio = texto.replace(/\s+/g, " ").trim();
  const frases = limpio.split(/(?<=[.!?])\s+/);
  const frase = frases.find((f) => !/^(hola|buen[oa]s|soy |llamo |le escribo|te escribo)/i.test(f) && f.length > 15) ?? frases[0] ?? limpio;
  const resumen = frase.length > 90 ? frase.slice(0, 87).trimEnd() + "…" : frase;

  return { tipo, urgencia, servicio: sector.servicios[idx], municipio: municipio || "Palma", municipioDicho: !!municipio, resumen };
}
