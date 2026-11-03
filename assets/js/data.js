/* Todo el contenido editable del sitio vive aquí. Lo que quede vacío se oculta solo. */
const SITE = {
  nombre: 'Hilos del Alma',
  slogan: 'Hechos desde el alma, con amor',
  frase: 'Lo que llevas también cuenta tu historia',
  ciudad: 'Cali · Popayán, Colombia',
  whatsapp: '573148638807',
  telefono: '+57 314 863 8807',
  instagram: 'hilosdelalma____',
  correo: '',
  horario: '',
  envios: 'Hacemos envíos. Escríbenos y te contamos cómo llega a tus manos.'
};

const waLink = (msg) =>
  `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(msg || 'Hola Hilos del Alma, quiero más información.')}`;

/* Categorías de la colección. Cuando el sitio está conectado a Supabase, estas se
   administran desde el panel; aquí quedan como respaldo si no hay conexión. */
const CATEGORIAS = [
  { id: 'pulseras',  nombre: 'Pulseras', texto: 'Para cada día, para cada intención.' },
  { id: 'manillas',  nombre: 'Manillas', texto: 'Con diferentes nombres y significados.' },
  { id: 'collares',  nombre: 'Collares', texto: 'Perlas, medallas y nombres que te acompañan.' },
  { id: 'charms',    nombre: 'Charms para bolsos y llaveros', texto: 'Un detalle de fe que viaja contigo.' },
  { id: 'straps',    nombre: 'Straps para celular', texto: 'Protección y cariño en tu día a día.' },
  { id: 'hogar',     nombre: 'Bendiciones para el hogar', texto: 'Para que la paz habite tu casa.' },
  { id: 'carro',     nombre: 'Bendiciones para el carro', texto: 'Para cuidar cada camino.' },
  { id: 'rosarios',  nombre: 'Rosarios', texto: 'Hechos a tu medida, con tus colores.' }
];

/* Las tres líneas que ya conocen en Instagram. */
const LINEAS = [
  { id: 'fe', nombre: 'Hilos de fe', texto: 'Medallas, escapularios y detalles que te recuerdan en quién confías.', tono: 'sage' },
  { id: 'amor', nombre: 'Hilos de amor', texto: 'Perlas y piezas suaves para regalar, agradecer y celebrar a quien quieres.', tono: 'rose' },
  { id: 'personalizados', nombre: 'Personalizados', texto: 'Tu nombre, tu palabra, tus colores. Una pieza única, pensada para ti.', tono: 'sand' }
];

/* Piezas de respaldo (las reales se administran desde el panel). Sin precios: se cotiza por WhatsApp. */
const PRODUCTOS = [
  { id: 'dorada',   nombre: 'Pulsera dorada con escapulario', cat: 'pulseras', linea: 'fe',
    img: 'dorada', texto: 'Cuentas doradas y bronce con escapulario bordado en cristales. Ajustable.' },
  { id: 'plateada', nombre: 'Pulsera plateada con medalla', cat: 'pulseras', linea: 'fe',
    img: 'plateada', texto: 'Cuentas plateadas y medalla con imagen sagrada rodeada de cristales.' },
  { id: 'azul',     nombre: 'Pulsera con escapulario azul', cat: 'pulseras', linea: 'fe',
    img: 'azul', texto: 'Cuentas azul grafito y doradas con escapulario enmarcado.' },
  { id: 'palabras', nombre: 'Pulseras con tu palabra', cat: 'pulseras', linea: 'personalizados',
    img: 'palabras', texto: 'FE, DIOS, PAZ o la palabra que elijas, en los colores que más te gusten.' },
  { id: 'muneca',   nombre: 'Manillas con medallas', cat: 'manillas', linea: 'fe',
    img: 'muneca', texto: 'Piedras rosadas y vino con medallas de la Virgen. Se combinan entre sí.' },
  { id: 'perlas',   nombre: 'Manilla de perlas', cat: 'manillas', linea: 'amor',
    img: 'perlas', texto: 'Varias vueltas de perlas finas con perlas barrocas en las puntas.' },
  { id: 'collar',   nombre: 'Collar de perlas', cat: 'collares', linea: 'amor',
    img: 'collar', texto: 'Perlas pequeñas con detalles dorados. Delicado y elegante.' },
  { id: 'llavero-rojo', nombre: 'Llavero Virgen con cuentas rojas', cat: 'charms', linea: 'fe',
    img: 'llavero-rojo', texto: 'Medalla con la Virgen rodeada de cuentas rojas, corazón y dije dorado.' },
  { id: 'llavero-rosa', nombre: 'Llavero rosado con cruz', cat: 'charms', linea: 'fe',
    img: 'llavero-rosa', texto: 'Cristales rosados, medalla de la Virgen y borla tejida con cruz.' }
];

/* Piezas que se muestran primero en la portada. */
const DESTACADOS = ['dorada', 'perlas', 'palabras', 'llavero-rojo', 'plateada', 'collar'];

/* Historia real que ya cuentan en su Instagram. */
const HISTORIA = [
  'Hilos del Alma nació del amor, la unión y la fuerza de dos hermanas que, en medio de momentos difíciles, decidieron levantarse juntas.',
  'Lo que comenzó como una forma de apoyarse y sanar, poco a poco se convirtió en un espacio donde cada detalle es creado con intención, dedicación y mucho corazón.',
  'Más que accesorios, creamos piezas que conectan historias, emociones y personas. Porque creemos que todo lo hecho desde el alma, siempre llega al alma.'
];

const PASOS = [
  { n: '1', t: 'Cuéntanos', p: 'Qué pieza imaginas, para quién es y qué quieres que diga o recuerde.' },
  { n: '2', t: 'La diseñamos', p: 'Te proponemos colores, medallas y detalles. Tú le das el visto bueno.' },
  { n: '3', t: 'La recibes', p: 'La hacemos con calma y te la enviamos lista para estrenar o regalar.' }
];

const MEDALLAS = [];

const IMG = (id) => `assets/img/${id}.webp`;
