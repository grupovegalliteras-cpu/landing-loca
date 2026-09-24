export type SectorId =
  | "mantenimiento"
  | "limpieza"
  | "piscinas"
  | "climatizacion"
  | "jardineria"
  | "plagas"
  | "solar"
  | "reformas";

export type AvisoTipo = "avería" | "presupuesto" | "consulta" | "queja";
export type Urgencia = "alta" | "media" | "baja";
export type Canal = "llamada" | "whatsapp" | "email" | "web";

export type AvisoTpl = {
  tipo: AvisoTipo;
  urgencia: Urgencia;
  canal: Canal;
  resumen: string;
  /** índice del servicio del catálogo que se propone */
  servicio: number;
  lineas: [quien: "cliente" | "oficina", texto: string][];
};

export type Medicion = { nombre: string; unidad: string; min: number; max: number; dec: number; ok: [number, number] };
export type Material = { nombre: string; ref: string; unidad: string; precio: number };

export type Sector = {
  id: SectorId;
  nombre: string;
  empresa: string;
  empresaCorta: string;
  color: string;
  icono: string;
  lema: string;
  dolor: string;
  instalacion: { tipo: string; plural: string; nombres: string[] };
  servicios: { nombre: string; precio: number; min: number }[];
  checklist: string[];
  mediciones: Medicion[];
  material: Material[];
  contrato: { nombre: string; periodicidad: "mensual" | "trimestral" | "anual"; cuota: [number, number] };
  llamada: AvisoTpl & { cliente: string; contacto: string; instalacionNombre: string };
  avisos: AvisoTpl[];
};

export const SECTORES: Sector[] = [
  {
    id: "mantenimiento",
    nombre: "Mantenimiento multiservicio",
    empresa: "Mantenimientos Llevant",
    empresaCorta: "Llevant",
    color: "#0a5d78",
    icono: "Wrench",
    lema: "Fontanería, electricidad y calderas",
    dolor: "Hoteles y comunidades que llaman a todas horas y un cuaderno que no da abasto.",
    instalacion: { tipo: "Instalación", plural: "Instalaciones", nombres: ["Caldera sala técnica", "Cuadro eléctrico general", "Grupo de presión", "Termo planta 2", "Bomba de achique", "ACS habitaciones"] },
    servicios: [
      { nombre: "Reparación de fontanería", precio: 145, min: 90 },
      { nombre: "Revisión de caldera", precio: 120, min: 60 },
      { nombre: "Avería eléctrica", precio: 135, min: 75 },
      { nombre: "Mantenimiento preventivo", precio: 180, min: 120 },
      { nombre: "Sustitución de termo", precio: 420, min: 150 },
    ],
    checklist: ["Localizar origen de la avería", "Cortar suministro de la zona", "Reparar o sustituir la pieza", "Prueba de estanqueidad", "Limpiar la zona de trabajo", "Explicar la intervención al cliente"],
    mediciones: [
      { nombre: "Presión de red", unidad: "bar", min: 1.5, max: 5, dec: 1, ok: [2, 4] },
      { nombre: "Temperatura ACS", unidad: "°C", min: 40, max: 70, dec: 0, ok: [55, 65] },
      { nombre: "Tensión", unidad: "V", min: 215, max: 240, dec: 0, ok: [220, 235] },
    ],
    material: [
      { nombre: "Latiguillo flexible 30 cm", ref: "FON-LT30", unidad: "ud", precio: 6.4 },
      { nombre: "Válvula de esfera 1/2\"", ref: "FON-VE12", unidad: "ud", precio: 9.8 },
      { nombre: "Sifón de ducha extraplano", ref: "FON-SD90", unidad: "ud", precio: 18.5 },
      { nombre: "Silicona sanitaria", ref: "GEN-SIL", unidad: "ud", precio: 7.2 },
      { nombre: "Magnetotérmico 16 A", ref: "ELE-MG16", unidad: "ud", precio: 11.9 },
      { nombre: "Cable 2,5 mm²", ref: "ELE-C25", unidad: "m", precio: 0.62 },
      { nombre: "Termopar universal", ref: "CAL-TPU", unidad: "ud", precio: 14.3 },
      { nombre: "Cinta de teflón", ref: "FON-TEF", unidad: "ud", precio: 1.1 },
    ],
    contrato: { nombre: "Mantenimiento integral", periodicidad: "mensual", cuota: [180, 950] },
    llamada: {
      cliente: "Hotel Sa Roca",
      contacto: "Carmen Salom",
      instalacionNombre: "Baño habitación 214",
      tipo: "avería",
      urgencia: "alta",
      canal: "llamada",
      servicio: 0,
      resumen: "Fuga de agua bajo el plato de ducha en la habitación 214, con huéspedes entrando a las 14:00.",
      lineas: [
        ["oficina", "Mantenimientos Llevant, buenos días, le atiende Marga."],
        ["cliente", "Hola Marga, soy Carmen, de recepción del Hotel Sa Roca, en Calvià."],
        ["cliente", "Tenemos una fuga en el baño de la 214. Sale agua por debajo del plato de ducha y ya llega al pasillo."],
        ["oficina", "Vale, ¿han cerrado la llave de paso de la habitación?"],
        ["cliente", "Sí, pero entran huéspedes a las dos y la necesitamos lista."],
        ["oficina", "Entendido, le mando a un técnico ahora mismo. Le llegará un aviso cuando vaya de camino."],
      ],
    },
    avisos: [
      { tipo: "avería", urgencia: "alta", canal: "whatsapp", servicio: 2, resumen: "Sin luz en la zona de cocina, salta el diferencial al encender el horno.", lineas: [["cliente", "Buenas, en el restaurante nos salta el diferencial cada vez que encendemos el horno."], ["cliente", "Esta noche tenemos el comedor lleno, ¿podéis venir hoy?"]] },
      { tipo: "avería", urgencia: "media", canal: "llamada", servicio: 1, resumen: "La caldera de la comunidad da error y no hay agua caliente en el bloque B.", lineas: [["cliente", "Llamo de la comunidad, la caldera da un error E133 desde esta mañana."], ["oficina", "¿Afecta a todo el edificio?"], ["cliente", "Solo al bloque B, el A va bien."]] },
      { tipo: "presupuesto", urgencia: "baja", canal: "web", servicio: 4, resumen: "Pide presupuesto para cambiar el termo de 80 litros de su vivienda.", lineas: [["cliente", "Quiero cambiar el termo eléctrico de 80 litros, tiene ya 12 años. ¿Me podéis pasar precio?"]] },
      { tipo: "consulta", urgencia: "baja", canal: "email", servicio: 3, resumen: "Pregunta cuándo toca la próxima revisión del contrato.", lineas: [["cliente", "Buenos días, ¿cuándo tenemos la próxima visita de mantenimiento preventivo?"]] },
      { tipo: "queja", urgencia: "media", canal: "llamada", servicio: 0, resumen: "Vuelve a gotear el grifo que se reparó la semana pasada.", lineas: [["cliente", "El grifo del office que arreglasteis el martes vuelve a gotear."], ["oficina", "Lo siento mucho, lo abrimos como garantía y va el mismo técnico."]] },
    ],
  },
  {
    id: "limpieza",
    nombre: "Limpieza",
    empresa: "Netbrill Neteja",
    empresaCorta: "Netbrill",
    color: "#2c7a6b",
    icono: "SprayCan",
    lema: "Oficinas, comunidades y fin de obra",
    dolor: "Cuadrantes en Excel, cambios de turno por WhatsApp y clientes que piden pruebas de que se ha limpiado.",
    instalacion: { tipo: "Centro", plural: "Centros", nombres: ["Oficinas planta 1", "Zonas comunes", "Recepción y aseos", "Sala de espera", "Vestuarios", "Portal y escalera"] },
    servicios: [
      { nombre: "Limpieza de mantenimiento", precio: 95, min: 120 },
      { nombre: "Limpieza de fin de obra", precio: 480, min: 360 },
      { nombre: "Limpieza de cristales", precio: 160, min: 150 },
      { nombre: "Abrillantado de suelos", precio: 320, min: 240 },
      { nombre: "Desinfección de zonas comunes", precio: 140, min: 90 },
    ],
    checklist: ["Aseos limpios y repuestos", "Papeleras vaciadas", "Suelos fregados", "Superficies y pomos desinfectados", "Cristales de entrada", "Foto del resultado"],
    mediciones: [
      { nombre: "Superficie limpiada", unidad: "m²", min: 80, max: 600, dec: 0, ok: [80, 600] },
      { nombre: "Dilución desinfectante", unidad: "%", min: 0.5, max: 3, dec: 1, ok: [1, 2] },
    ],
    material: [
      { nombre: "Desinfectante clorado 5 L", ref: "LIM-DC5", unidad: "garrafa", precio: 8.9 },
      { nombre: "Papel secamanos", ref: "LIM-PSM", unidad: "caja", precio: 21.5 },
      { nombre: "Bolsas de basura 100 L", ref: "LIM-BB100", unidad: "rollo", precio: 3.4 },
      { nombre: "Friegasuelos neutro 5 L", ref: "LIM-FN5", unidad: "garrafa", precio: 7.6 },
      { nombre: "Bayetas microfibra", ref: "LIM-BMF", unidad: "pack", precio: 6.2 },
      { nombre: "Limpiacristales 5 L", ref: "LIM-LC5", unidad: "garrafa", precio: 9.3 },
      { nombre: "Jabón de manos 5 L", ref: "LIM-JM5", unidad: "garrafa", precio: 11.4 },
    ],
    contrato: { nombre: "Limpieza periódica", periodicidad: "mensual", cuota: [240, 1800] },
    llamada: {
      cliente: "Clínica Dental Llevant",
      contacto: "Laura Rosselló",
      instalacionNombre: "Gabinetes y sala de espera",
      tipo: "avería",
      urgencia: "alta",
      canal: "llamada",
      servicio: 4,
      resumen: "Necesitan desinfección de la sala de espera y dos gabinetes antes de abrir mañana a las 8:00.",
      lineas: [
        ["oficina", "Netbrill Neteja, le atiende Marga."],
        ["cliente", "Hola, soy Laura, de la Clínica Dental Llevant, en Manacor."],
        ["cliente", "Hoy han estado los pintores y han dejado la sala de espera y dos gabinetes llenos de polvo."],
        ["cliente", "Mañana abrimos a las ocho con pacientes. ¿Podéis pasar esta tarde?"],
        ["oficina", "Sí, le mandamos a alguien esta tarde y le enviamos fotos del resultado al terminar."],
      ],
    },
    avisos: [
      { tipo: "queja", urgencia: "media", canal: "whatsapp", servicio: 0, resumen: "Los aseos de la planta 2 no se repusieron el jueves.", lineas: [["cliente", "El jueves no se repuso papel en los aseos de la segunda planta."]] },
      { tipo: "presupuesto", urgencia: "baja", canal: "web", servicio: 1, resumen: "Limpieza de fin de obra en un local de 180 m² en Palma.", lineas: [["cliente", "Terminamos obra en un local de 180 m² en Palma. Necesitamos precio para limpieza final."]] },
      { tipo: "consulta", urgencia: "baja", canal: "email", servicio: 2, resumen: "Pregunta si se pueden añadir cristales exteriores al contrato.", lineas: [["cliente", "¿Podríais incluir los cristales exteriores una vez al mes?"]] },
      { tipo: "avería", urgencia: "alta", canal: "llamada", servicio: 4, resumen: "Inundación leve en el portal, hay que secar y desinfectar hoy.", lineas: [["cliente", "Se ha roto una tubería en el portal y hay agua por todo el suelo."], ["oficina", "Mandamos a alguien a secar y desinfectar en cuanto lo arreglen."]] },
      { tipo: "presupuesto", urgencia: "media", canal: "llamada", servicio: 3, resumen: "Abrillantado de suelos del hall del hotel antes de temporada.", lineas: [["cliente", "Antes de abrir la temporada queremos abrillantar el mármol del hall."]] },
    ],
  },
  {
    id: "piscinas",
    nombre: "Piscinas",
    empresa: "Aigua Clara Piscines",
    empresaCorta: "Aigua Clara",
    color: "#1177a8",
    icono: "Waves",
    lema: "Mantenimiento de piscinas y villas turísticas",
    dolor: "Temporada alta, cien piscinas por semana y propietarios que viven fuera y quieren ver cómo está el agua.",
    instalacion: { tipo: "Piscina", plural: "Piscinas", nombres: ["Piscina principal", "Piscina infantil", "Jacuzzi exterior", "Piscina desbordante", "Piscina cubierta"] },
    servicios: [
      { nombre: "Mantenimiento semanal", precio: 75, min: 45 },
      { nombre: "Recuperación de agua verde", precio: 260, min: 120 },
      { nombre: "Puesta en marcha de temporada", precio: 340, min: 180 },
      { nombre: "Reparación de depuradora", precio: 190, min: 90 },
      { nombre: "Cambio de arena del filtro", precio: 290, min: 150 },
    ],
    checklist: ["Limpiar skimmers y cestos", "Pasar limpiafondos", "Cepillar paredes y línea de flotación", "Contralavado del filtro", "Medir y ajustar pH y cloro", "Revisar bomba y temporizador"],
    mediciones: [
      { nombre: "pH", unidad: "", min: 6.8, max: 8.2, dec: 1, ok: [7.2, 7.6] },
      { nombre: "Cloro libre", unidad: "ppm", min: 0, max: 3, dec: 1, ok: [0.5, 2] },
      { nombre: "Temperatura", unidad: "°C", min: 19, max: 30, dec: 0, ok: [20, 30] },
      { nombre: "Presión filtro", unidad: "bar", min: 0.4, max: 1.6, dec: 1, ok: [0.6, 1.2] },
    ],
    material: [
      { nombre: "Cloro granulado 5 kg", ref: "PIS-CG5", unidad: "bote", precio: 32.5 },
      { nombre: "Reductor de pH 8 kg", ref: "PIS-PH8", unidad: "bote", precio: 18.9 },
      { nombre: "Tabletas cloro lento 5 kg", ref: "PIS-TCL", unidad: "bote", precio: 41.0 },
      { nombre: "Alguicida 5 L", ref: "PIS-ALG", unidad: "garrafa", precio: 22.4 },
      { nombre: "Floculante 5 L", ref: "PIS-FLO", unidad: "garrafa", precio: 19.8 },
      { nombre: "Arena sílex 25 kg", ref: "PIS-ARE", unidad: "saco", precio: 12.6 },
      { nombre: "Cesto de skimmer", ref: "PIS-CSK", unidad: "ud", precio: 14.9 },
    ],
    contrato: { nombre: "Mantenimiento de temporada", periodicidad: "mensual", cuota: [220, 690] },
    llamada: {
      cliente: "Villa Es Pinaret",
      contacto: "Tomeu Garau",
      instalacionNombre: "Piscina principal",
      tipo: "avería",
      urgencia: "alta",
      canal: "llamada",
      servicio: 1,
      resumen: "Agua verde en la piscina de la villa, con huéspedes llegando el viernes.",
      lineas: [
        ["oficina", "Aigua Clara Piscines, le atiende Marga."],
        ["cliente", "Hola, soy Tomeu, el gestor de la Villa Es Pinaret, en Alcúdia."],
        ["cliente", "Tras la tormenta del fin de semana el agua de la piscina se ha puesto verde."],
        ["cliente", "El viernes llega una familia de seis y la tiene que ver perfecta."],
        ["oficina", "Hoy mismo va un técnico a tratarla y le mandamos el informe con fotos y el pH al terminar."],
      ],
    },
    avisos: [
      { tipo: "avería", urgencia: "alta", canal: "whatsapp", servicio: 3, resumen: "La depuradora hace ruido y no aspira, villa ocupada.", lineas: [["cliente", "La depuradora hace un ruido raro y no aspira. Tenemos huéspedes hasta el domingo."]] },
      { tipo: "presupuesto", urgencia: "baja", canal: "web", servicio: 2, resumen: "Puesta en marcha de temporada para una villa en Sóller.", lineas: [["cliente", "Necesito poner a punto la piscina de mi casa en Sóller para mayo."]] },
      { tipo: "consulta", urgencia: "baja", canal: "email", servicio: 0, resumen: "El propietario, que vive fuera, pide los últimos valores de pH y cloro.", lineas: [["cliente", "Hola, soy el propietario de Villa Sa Talaia. ¿Me podéis mandar los valores del agua de esta semana?"]] },
      { tipo: "queja", urgencia: "media", canal: "llamada", servicio: 0, resumen: "Hojas en el fondo el día después del mantenimiento.", lineas: [["cliente", "Ayer pasasteis pero hoy el fondo está lleno de hojas."], ["oficina", "Ha habido viento de tramuntana, pasamos mañana sin coste."]] },
      { tipo: "avería", urgencia: "media", canal: "llamada", servicio: 4, resumen: "El filtro pierde presión y el agua está turbia.", lineas: [["cliente", "El manómetro del filtro marca muy poco y el agua está turbia."]] },
    ],
  },
  {
    id: "climatizacion",
    nombre: "Climatización",
    empresa: "Clima Tramuntana",
    empresaCorta: "Tramuntana",
    color: "#2f5fb3",
    icono: "Thermometer",
    lema: "Aire acondicionado, frío industrial y cámaras",
    dolor: "Cadenas con veinte centros, cámaras frigoríficas que no pueden fallar y registros de gases que nadie encuentra.",
    instalacion: { tipo: "Equipo", plural: "Equipos", nombres: ["Cámara frigorífica", "Split sala principal", "Enfriadora cubierta", "Cassette recepción", "Cámara de congelación", "Rooftop sala de ventas"] },
    servicios: [
      { nombre: "Reparación de avería de frío", precio: 210, min: 120 },
      { nombre: "Mantenimiento preventivo", precio: 150, min: 90 },
      { nombre: "Carga de gas refrigerante", precio: 240, min: 90 },
      { nombre: "Instalación de split", precio: 690, min: 240 },
      { nombre: "Limpieza de filtros y baterías", precio: 95, min: 60 },
    ],
    checklist: ["Comprobar temperaturas de trabajo", "Medir presiones de alta y baja", "Revisar fugas con detector", "Limpiar filtros y baterías", "Comprobar desagües", "Registrar gas en el libro"],
    mediciones: [
      { nombre: "Presión de alta", unidad: "bar", min: 14, max: 26, dec: 1, ok: [16, 22] },
      { nombre: "Presión de baja", unidad: "bar", min: 2, max: 8, dec: 1, ok: [3.5, 6] },
      { nombre: "Temperatura cámara", unidad: "°C", min: -22, max: 10, dec: 1, ok: [0, 4] },
      { nombre: "Gas añadido", unidad: "kg", min: 0, max: 3, dec: 2, ok: [0, 3] },
    ],
    material: [
      { nombre: "Gas R-32 botella 9 kg", ref: "CLI-R32", unidad: "kg", precio: 38.0 },
      { nombre: "Gas R-448A", ref: "CLI-R448", unidad: "kg", precio: 52.0 },
      { nombre: "Filtro deshidratador", ref: "CLI-FDH", unidad: "ud", precio: 24.5 },
      { nombre: "Condensador 35 µF", ref: "CLI-C35", unidad: "ud", precio: 16.8 },
      { nombre: "Presostato de alta", ref: "CLI-PRA", unidad: "ud", precio: 44.0 },
      { nombre: "Tubo de cobre 3/8\"", ref: "CLI-TC38", unidad: "m", precio: 8.9 },
      { nombre: "Limpiador de baterías", ref: "CLI-LB", unidad: "bote", precio: 12.3 },
    ],
    contrato: { nombre: "Mantenimiento de frío y clima", periodicidad: "trimestral", cuota: [390, 2400] },
    llamada: {
      cliente: "Supermercats Illa Fresca",
      contacto: "Andreu Nicolau",
      instalacionNombre: "Cámara frigorífica, tienda de Inca",
      tipo: "avería",
      urgencia: "alta",
      canal: "llamada",
      servicio: 0,
      resumen: "La cámara frigorífica de la tienda de Inca marca 9 °C, con producto fresco dentro.",
      lineas: [
        ["oficina", "Clima Tramuntana, le atiende Marga."],
        ["cliente", "Buenos días, soy Andreu, de mantenimiento de Supermercats Illa Fresca."],
        ["cliente", "La cámara de frescos de la tienda de Inca está a nueve grados y subiendo."],
        ["cliente", "Tenemos carne y lácteos dentro, si no se arregla en dos horas hay que tirarlo."],
        ["oficina", "Le mandamos al técnico más cercano ya. Verá en su portal cuándo llega."],
      ],
    },
    avisos: [
      { tipo: "avería", urgencia: "alta", canal: "whatsapp", servicio: 0, resumen: "El aire de la sala de ventas de Manacor no enfría.", lineas: [["cliente", "En la tienda de Manacor el aire no enfría y estamos a 29 grados."]] },
      { tipo: "presupuesto", urgencia: "baja", canal: "web", servicio: 3, resumen: "Instalación de tres splits en unas oficinas de Palma.", lineas: [["cliente", "Queremos poner aire en tres despachos de nuestra oficina de Palma."]] },
      { tipo: "consulta", urgencia: "baja", canal: "email", servicio: 1, resumen: "Piden el registro de gases del último año para una auditoría.", lineas: [["cliente", "¿Nos podéis mandar el registro de gases de todas las tiendas del último año?"]] },
      { tipo: "avería", urgencia: "media", canal: "llamada", servicio: 4, resumen: "Gotea agua del cassette de recepción del hotel.", lineas: [["cliente", "Cae agua del aparato del techo de recepción."]] },
      { tipo: "queja", urgencia: "media", canal: "llamada", servicio: 2, resumen: "Vuelve a saltar la alarma de temperatura en la cámara de congelados.", lineas: [["cliente", "Otra vez salta la alarma de la cámara de congelados de Marratxí."]] },
    ],
  },
  {
    id: "jardineria",
    nombre: "Jardinería",
    empresa: "Verd Mallorca",
    empresaCorta: "Verd",
    color: "#3d7a32",
    icono: "Leaf",
    lema: "Mantenimiento de jardines, poda y riego",
    dolor: "Cuadrillas repartidas por toda la isla, riegos que fallan en agosto y visitas periódicas que se olvidan.",
    instalacion: { tipo: "Zona", plural: "Zonas", nombres: ["Jardín principal", "Zona de césped", "Seto perimetral", "Riego por goteo", "Palmeras entrada", "Huerto y frutales"] },
    servicios: [
      { nombre: "Mantenimiento de jardín", precio: 110, min: 120 },
      { nombre: "Poda de palmeras", precio: 85, min: 60 },
      { nombre: "Reparación de riego", precio: 95, min: 60 },
      { nombre: "Desbroce de parcela", precio: 280, min: 240 },
      { nombre: "Tratamiento fitosanitario", precio: 130, min: 60 },
    ],
    checklist: ["Cortar césped y perfilar bordes", "Recortar setos", "Revisar programador y goteros", "Retirar restos vegetales", "Revisar palmeras (picudo rojo)", "Foto del resultado"],
    mediciones: [
      { nombre: "Superficie de césped", unidad: "m²", min: 50, max: 900, dec: 0, ok: [50, 900] },
      { nombre: "Riego diario", unidad: "min", min: 5, max: 45, dec: 0, ok: [10, 30] },
      { nombre: "Restos retirados", unidad: "kg", min: 10, max: 400, dec: 0, ok: [10, 400] },
    ],
    material: [
      { nombre: "Gotero autocompensante", ref: "JAR-GOT", unidad: "ud", precio: 0.45 },
      { nombre: "Tubería PE 16 mm", ref: "JAR-PE16", unidad: "m", precio: 0.38 },
      { nombre: "Electroválvula 1\"", ref: "JAR-EV1", unidad: "ud", precio: 29.9 },
      { nombre: "Abono granulado 25 kg", ref: "JAR-ABO", unidad: "saco", precio: 24.0 },
      { nombre: "Tratamiento picudo rojo", ref: "JAR-PIC", unidad: "L", precio: 36.5 },
      { nombre: "Hilo desbrozadora", ref: "JAR-HIL", unidad: "rollo", precio: 15.2 },
    ],
    contrato: { nombre: "Mantenimiento de jardín", periodicidad: "mensual", cuota: [160, 1200] },
    llamada: {
      cliente: "Comunidad Jardins de Sóller",
      contacto: "Francesca Pons",
      instalacionNombre: "Riego zona de entrada",
      tipo: "avería",
      urgencia: "media",
      canal: "llamada",
      servicio: 2,
      resumen: "El riego automático de la entrada no salta desde hace tres días y el césped se está secando.",
      lineas: [
        ["oficina", "Verd Mallorca, le atiende Marga."],
        ["cliente", "Hola, soy Francesca, la presidenta de la Comunidad Jardins de Sóller."],
        ["cliente", "El riego de la zona de la entrada no salta desde el lunes y con este calor el césped se está quemando."],
        ["oficina", "Probablemente sea la electroválvula. Le mandamos a alguien hoy mismo."],
      ],
    },
    avisos: [
      { tipo: "avería", urgencia: "alta", canal: "whatsapp", servicio: 1, resumen: "Una palmera con hojas caídas sobre la piscina del hotel, posible picudo.", lineas: [["cliente", "Una de las palmeras de la piscina tiene las hojas del centro caídas. ¿Picudo?"]] },
      { tipo: "presupuesto", urgencia: "baja", canal: "web", servicio: 3, resumen: "Desbroce de una parcela de 2.000 m² en Llucmajor.", lineas: [["cliente", "Necesito desbrozar una parcela de unos 2.000 m² en Llucmajor antes del verano."]] },
      { tipo: "consulta", urgencia: "baja", canal: "email", servicio: 0, resumen: "Pregunta si pueden cambiar el día de visita a los jueves.", lineas: [["cliente", "¿Sería posible que vinierais los jueves en vez de los lunes?"]] },
      { tipo: "queja", urgencia: "media", canal: "llamada", servicio: 0, resumen: "Restos de poda olvidados en el aparcamiento.", lineas: [["cliente", "Se han quedado restos de poda en el aparcamiento de la comunidad."]] },
    ],
  },
  {
    id: "plagas",
    nombre: "Control de plagas",
    empresa: "Plagues Illa",
    empresaCorta: "Plagues Illa",
    color: "#8a5a1c",
    icono: "Bug",
    lema: "Desinsectación, desratización y legionela",
    dolor: "Restaurantes y hoteles con inspecciones sanitarias que piden certificados y planos de puntos de control al momento.",
    instalacion: { tipo: "Punto de control", plural: "Puntos de control", nombres: ["Cocina y almacén", "Cuarto de basuras", "Cámara de frío", "Zona exterior", "Sótano", "Office de planta"] },
    servicios: [
      { nombre: "Tratamiento de desinsectación", precio: 140, min: 60 },
      { nombre: "Revisión de desratización", precio: 95, min: 45 },
      { nombre: "Tratamiento de choque", precio: 320, min: 120 },
      { nombre: "Control de legionela", precio: 210, min: 90 },
      { nombre: "Revisión periódica APPCC", precio: 120, min: 60 },
    ],
    checklist: ["Revisar puntos de control", "Reponer cebos consumidos", "Aplicar tratamiento autorizado", "Señalizar zona tratada", "Registrar productos y dosis", "Entregar certificado"],
    mediciones: [
      { nombre: "Puntos revisados", unidad: "", min: 4, max: 40, dec: 0, ok: [4, 40] },
      { nombre: "Puntos con actividad", unidad: "", min: 0, max: 8, dec: 0, ok: [0, 1] },
      { nombre: "Producto aplicado", unidad: "ml", min: 50, max: 800, dec: 0, ok: [50, 800] },
    ],
    material: [
      { nombre: "Gel cucarachicida", ref: "PLA-GEL", unidad: "jeringa", precio: 12.8 },
      { nombre: "Cebo rodenticida bloque", ref: "PLA-CRB", unidad: "kg", precio: 18.4 },
      { nombre: "Portacebos de seguridad", ref: "PLA-PCS", unidad: "ud", precio: 6.9 },
      { nombre: "Insecticida microencapsulado", ref: "PLA-INS", unidad: "L", precio: 46.0 },
      { nombre: "Trampa adhesiva", ref: "PLA-TAD", unidad: "ud", precio: 1.9 },
      { nombre: "Etiquetas de señalización", ref: "PLA-ETQ", unidad: "pack", precio: 4.5 },
    ],
    contrato: { nombre: "Control de plagas APPCC", periodicidad: "trimestral", cuota: [120, 900] },
    llamada: {
      cliente: "Restaurante Es Moll Vell",
      contacto: "Jaume Serra",
      instalacionNombre: "Cocina y almacén",
      tipo: "avería",
      urgencia: "alta",
      canal: "llamada",
      servicio: 2,
      resumen: "Cucarachas en la cocina del restaurante, con inspección sanitaria la semana que viene.",
      lineas: [
        ["oficina", "Plagues Illa, le atiende Marga."],
        ["cliente", "Hola, soy Jaume, del Restaurante Es Moll Vell, en Alcúdia."],
        ["cliente", "Anoche vimos cucarachas en la cocina, detrás de los fogones."],
        ["cliente", "La semana que viene tenemos inspección de sanidad y necesito el certificado."],
        ["oficina", "Hacemos un tratamiento de choque hoy y le dejamos el certificado en su portal."],
      ],
    },
    avisos: [
      { tipo: "avería", urgencia: "alta", canal: "whatsapp", servicio: 1, resumen: "Excrementos de roedor en el almacén del supermercado.", lineas: [["cliente", "Hemos encontrado excrementos de ratón en el almacén de la tienda."]] },
      { tipo: "consulta", urgencia: "media", canal: "email", servicio: 4, resumen: "Piden el plano de puntos de control y los certificados para la auditoría.", lineas: [["cliente", "Necesitamos el plano de puntos y los certificados de este año para la auditoría del jueves."]] },
      { tipo: "presupuesto", urgencia: "baja", canal: "web", servicio: 3, resumen: "Control de legionela para un hotel de 120 habitaciones.", lineas: [["cliente", "Pedimos precio para el control de legionela anual del hotel."]] },
      { tipo: "queja", urgencia: "media", canal: "llamada", servicio: 0, resumen: "Siguen apareciendo hormigas tras el tratamiento.", lineas: [["cliente", "Tras el tratamiento del martes siguen saliendo hormigas en la terraza."]] },
    ],
  },
  {
    id: "solar",
    nombre: "Instalaciones solares",
    empresa: "Sol de Migjorn",
    empresaCorta: "Migjorn",
    color: "#b86e0a",
    icono: "SunMedium",
    lema: "Autoconsumo fotovoltaico y mantenimiento",
    dolor: "Obras por fases, instalaciones que bajan de rendimiento sin que nadie se entere y papeleo por cada cliente.",
    instalacion: { tipo: "Instalación FV", plural: "Instalaciones FV", nombres: ["Cubierta nave", "Pérgola solar", "Cubierta vivienda", "Planta en suelo", "Marquesina parking"] },
    servicios: [
      { nombre: "Revisión de rendimiento", precio: 160, min: 90 },
      { nombre: "Limpieza de paneles", precio: 220, min: 120 },
      { nombre: "Reparación de inversor", precio: 280, min: 120 },
      { nombre: "Instalación de autoconsumo", precio: 6400, min: 960 },
      { nombre: "Instalación de baterías", precio: 3900, min: 480 },
    ],
    checklist: ["Inspección visual de paneles", "Revisar inversor y alarmas", "Termografía de strings", "Apriete de conexiones", "Comprobar producción frente a lo esperado", "Informe de rendimiento"],
    mediciones: [
      { nombre: "Producción del día", unidad: "kWh", min: 8, max: 120, dec: 1, ok: [20, 120] },
      { nombre: "Rendimiento", unidad: "%", min: 40, max: 100, dec: 0, ok: [85, 100] },
      { nombre: "Tensión string", unidad: "V", min: 300, max: 800, dec: 0, ok: [450, 750] },
    ],
    material: [
      { nombre: "Panel 450 W", ref: "SOL-P450", unidad: "ud", precio: 128.0 },
      { nombre: "Conector MC4 (par)", ref: "SOL-MC4", unidad: "par", precio: 3.2 },
      { nombre: "Cable solar 6 mm²", ref: "SOL-C6", unidad: "m", precio: 1.35 },
      { nombre: "Fusible string 15 A", ref: "SOL-F15", unidad: "ud", precio: 4.9 },
      { nombre: "Estructura coplanar", ref: "SOL-EST", unidad: "kit", precio: 46.0 },
      { nombre: "Protector sobretensiones", ref: "SOL-PST", unidad: "ud", precio: 58.0 },
    ],
    contrato: { nombre: "Mantenimiento fotovoltaico", periodicidad: "anual", cuota: [180, 1400] },
    llamada: {
      cliente: "Agroturismo Can Vidal",
      contacto: "Miquel Vidal",
      instalacionNombre: "Cubierta del establo",
      tipo: "avería",
      urgencia: "media",
      canal: "llamada",
      servicio: 2,
      resumen: "La instalación produce la mitad desde hace una semana y el inversor muestra una alarma.",
      lineas: [
        ["oficina", "Sol de Migjorn, le atiende Marga."],
        ["cliente", "Hola, soy Miquel, del Agroturismo Can Vidal, en Sóller."],
        ["cliente", "Desde la semana pasada las placas producen la mitad y el inversor tiene una luz roja."],
        ["oficina", "Puede ser un string caído. Le mandamos a un técnico y le enviamos el informe de rendimiento."],
      ],
    },
    avisos: [
      { tipo: "presupuesto", urgencia: "media", canal: "web", servicio: 3, resumen: "Autoconsumo para una nave de 600 m² en Marratxí.", lineas: [["cliente", "Tenemos una nave de 600 m² en Marratxí y queremos poner placas."]] },
      { tipo: "presupuesto", urgencia: "baja", canal: "whatsapp", servicio: 4, resumen: "Añadir baterías a una instalación de vivienda en Llucmajor.", lineas: [["cliente", "Tengo placas desde hace dos años, ¿cuánto costaría añadir baterías?"]] },
      { tipo: "consulta", urgencia: "baja", canal: "email", servicio: 0, resumen: "Pide el informe de producción del último trimestre.", lineas: [["cliente", "¿Me podéis mandar la producción del último trimestre?"]] },
      { tipo: "avería", urgencia: "alta", canal: "llamada", servicio: 2, resumen: "El inversor del hotel se ha apagado tras una tormenta.", lineas: [["cliente", "Después de la tormenta el inversor está apagado del todo."]] },
    ],
  },
  {
    id: "reformas",
    nombre: "Reformas",
    empresa: "Reformes Ponent",
    empresaCorta: "Ponent",
    color: "#6b4f9e",
    icono: "Hammer",
    lema: "Reformas integrales, baños y cocinas",
    dolor: "Obras largas, presupuestos por capítulos que cambian cada semana y clientes que quieren ver el avance.",
    instalacion: { tipo: "Obra", plural: "Obras", nombres: ["Reforma baño principal", "Cocina completa", "Reforma integral piso", "Terraza y cubierta", "Local comercial"] },
    servicios: [
      { nombre: "Visita técnica y medición", precio: 60, min: 60 },
      { nombre: "Reforma de baño", precio: 7800, min: 2400 },
      { nombre: "Reforma de cocina", precio: 11500, min: 3000 },
      { nombre: "Reparación puntual", precio: 180, min: 120 },
      { nombre: "Impermeabilización de terraza", precio: 2600, min: 960 },
    ],
    checklist: ["Revisar planificación del capítulo", "Proteger zonas comunes", "Ejecutar la fase del día", "Fotos de avance", "Limpiar y retirar escombro", "Anotar material pendiente"],
    mediciones: [
      { nombre: "Avance de obra", unidad: "%", min: 0, max: 100, dec: 0, ok: [0, 100] },
      { nombre: "Superficie alicatada", unidad: "m²", min: 0, max: 60, dec: 1, ok: [0, 60] },
      { nombre: "Humedad soporte", unidad: "%", min: 1, max: 8, dec: 1, ok: [1, 4] },
    ],
    material: [
      { nombre: "Cemento cola C2 25 kg", ref: "REF-CC2", unidad: "saco", precio: 14.2 },
      { nombre: "Azulejo 30x60", ref: "REF-AZ36", unidad: "m²", precio: 22.0 },
      { nombre: "Placa de yeso 13 mm", ref: "REF-PY13", unidad: "ud", precio: 7.9 },
      { nombre: "Impermeabilizante líquido 20 kg", ref: "REF-IMP", unidad: "bote", precio: 89.0 },
      { nombre: "Tubo multicapa 16 mm", ref: "REF-TM16", unidad: "m", precio: 2.1 },
      { nombre: "Saco de escombro", ref: "REF-SAC", unidad: "ud", precio: 1.2 },
    ],
    contrato: { nombre: "Mantenimiento de edificio", periodicidad: "trimestral", cuota: [250, 1500] },
    llamada: {
      cliente: "Comunidad Passeig Mallorca 40",
      contacto: "Pere Amengual",
      instalacionNombre: "Terraza comunitaria",
      tipo: "presupuesto",
      urgencia: "media",
      canal: "llamada",
      servicio: 4,
      resumen: "Filtraciones desde la terraza comunitaria al ático; piden visita y presupuesto de impermeabilización.",
      lineas: [
        ["oficina", "Reformes Ponent, le atiende Marga."],
        ["cliente", "Hola, soy Pere, el administrador de la comunidad de Passeig Mallorca 40, en Palma."],
        ["cliente", "Con las lluvias ha entrado agua desde la terraza al ático y el vecino tiene manchas en el techo."],
        ["cliente", "Queremos una visita y un presupuesto para impermeabilizar antes del otoño."],
        ["oficina", "Le mandamos a un técnico a medir y tendrá el presupuesto por capítulos para firmar online."],
      ],
    },
    avisos: [
      { tipo: "presupuesto", urgencia: "baja", canal: "web", servicio: 2, resumen: "Reforma de cocina en un piso de Manacor.", lineas: [["cliente", "Queremos reformar la cocina de un piso en Manacor, unos 12 m²."]] },
      { tipo: "presupuesto", urgencia: "media", canal: "whatsapp", servicio: 1, resumen: "Cambiar bañera por plato de ducha en una vivienda de Inca.", lineas: [["cliente", "Quiero cambiar la bañera por un plato de ducha. ¿Cuándo podéis venir a ver?"]] },
      { tipo: "queja", urgencia: "media", canal: "llamada", servicio: 3, resumen: "Una baldosa del baño reformado suena hueca.", lineas: [["cliente", "Una baldosa del baño nuevo suena hueca al pisar."]] },
      { tipo: "consulta", urgencia: "baja", canal: "email", servicio: 0, resumen: "Pregunta en qué fase va su obra y cuándo acaba.", lineas: [["cliente", "¿En qué fase está nuestra obra? ¿Seguimos con la fecha de fin prevista?"]] },
    ],
  },
];

export const SECTOR_POR_ID = Object.fromEntries(SECTORES.map((s) => [s.id, s])) as Record<SectorId, Sector>;
export const SECTOR_DEFECTO: SectorId = "mantenimiento";

export function isSectorId(v: string | null | undefined): v is SectorId {
  return !!v && v in SECTOR_POR_ID;
}
