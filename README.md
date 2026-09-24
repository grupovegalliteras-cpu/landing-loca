# Nexo4Pymes: demo comercial

Demo de la plataforma Nexo4Pymes: panel de oficina y app de operarios conectados en tiempo real, con 40 módulos navegables, 8 sectores y un recorrido guiado para enseñarla en llamadas.

Todo funciona sin servidor: los datos son ficticios, se generan con una semilla fija y se guardan en el navegador.

## Arrancar

```bash
npm install
npm run dev
```

Abre http://localhost:3000.

Build de producción:

```bash
npm run build
npm start
```

Se despliega en Vercel tal cual (proyecto Next.js, sin variables de entorno).

## Rutas

| Ruta | Qué es |
|---|---|
| `/` | Landing de producto |
| `/demo` | Modo presentación: panel y móvil lado a lado, con botón **Ver recorrido** |
| `/demo?tour=1` | Abre el modo presentación y arranca el recorrido solo (ideal para mandar por email) |
| `/panel/[modulo]` | Panel de oficina a pantalla completa, un módulo por ruta (`/panel/central-avisos`, `/panel/facturacion`…) |
| `/app` | App de operarios. En móvil ocupa toda la pantalla y se instala; en escritorio sale en un marco de móvil con un QR |
| `/servicios` | Catálogo completo agrupado |
| `/sectores/[sector]` | Página de cada sector con su versión de la demo |

### En una llamada

- **Espacio** pausa o reanuda el recorrido, **flechas** para avanzar o retroceder, **Esc** para salir.
- Menú **Simular** del panel: llamada entrante, WhatsApp, reiniciar demo y cambiar de sector.
- En la app, menú **Más** > **Simular sin cobertura**: el parte se guarda en el móvil y se envía solo al volver.
- **Ctrl/Cmd + K** busca en todo el panel. El botón **Pregunta** abre el asistente IA, que responde con los datos de la demo.
- Si abres `/app` en otra pestaña (o `/demo` y `/panel` a la vez) se sincronizan en directo.

## Sector por defecto y enlaces por lead

- Por URL: `?sector=piscinas` en cualquier ruta (`/demo?sector=climatizacion&tour=1`).
- Sector por defecto del código: `SECTOR_DEFECTO` en `data/sectors.ts`.

Sectores: `mantenimiento`, `limpieza`, `piscinas`, `climatizacion`, `jardineria`, `plagas`, `solar`, `reformas`.

## Etiquetas de estado de los módulos

Cada módulo tiene `estado: 'disponible' | 'a-medida'` en `data/modules.ts`. Están ocultas por defecto; se ven añadiendo `?estado=1` a la URL (landing, `/servicios` y panel).

## Añadir un sector nuevo

1. Añade el id al tipo `SectorId` y un objeto a `SECTORES` en `data/sectors.ts`: empresa ficticia, color, icono, servicios con precio y duración, checklist, mediciones con su rango correcto, material, contrato tipo, la llamada estrella (`llamada`) y avisos de ejemplo.
2. Añade el nombre del rol del técnico en `ROL` dentro de `data/seed.ts`.
3. Si usas un icono nuevo, regístralo en `components/icon.tsx`.

La página `/sectores/[sector]`, el selector de la landing y la demo lo recogen solos.

## Dónde está cada cosa

- `data/modules.ts`: catálogo de servicios (fuente de verdad del contenido).
- `data/sectors.ts`: los 8 sectores.
- `data/seed.ts`: generador determinista de datos (3 meses de historial, clientes de Mallorca, 6 técnicos).
- `data/site.ts`: WhatsApp y email de contacto de la llamada a la acción.
- `store/demo.ts`: estado compartido y acciones de la demo, con sincronización entre pestañas.
- `components/panel/*`: panel de oficina; `components/app/*`: app de operarios; `components/demo/*`: modo presentación y recorrido; `components/site/*`: landing y páginas públicas.
- `lib/pdf.ts`: factura e informe de servicio en PDF generados en el navegador.

## Notas

- El mapa es un mapa vectorial propio de Mallorca: funciona sin red y sin claves.
- El fondo animado del hero son cáusticas de agua en WebGL (no hay vídeos que pesen); se detiene fuera de pantalla y respeta «reducir movimiento».
- Todas las empresas, personas, importes y opiniones son ficticias.
