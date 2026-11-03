/* Carga categorías, piezas y medallas desde Supabase (lectura pública).
   Si no hay conexión o no está configurado, cae a los datos de respaldo de data.js. */
const Catalogo = (() => {
  const configurado = () => Boolean(SUPABASE_URL && SUPABASE_KEY);

  const get = async (ruta) => {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${ruta}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if (!r.ok) throw new Error(`Supabase ${r.status}`);
    return r.json();
  };

  const pieza = (p) => {
    const fotos = (p.producto_fotos || []).slice().sort((a, b) => a.posicion - b.posicion).map(f => f.url);
    return {
      id: p.id, nombre: p.nombre, cat: p.categoria_id, linea: p.linea || '',
      fotos, img: fotos[0] || '', texto: p.descripcion || '', significado: p.significado || '',
      precio: p.precio, agotado: !!p.agotado, destacado: !!p.destacado
    };
  };

  const respaldo = () => ({
    categorias: CATEGORIAS.map(c => ({ ...c })),
    piezas: PRODUCTOS.map(p => ({
      id: p.id, nombre: p.nombre, cat: p.cat, linea: p.linea || '', fotos: [IMG(p.img)], img: IMG(p.img),
      texto: p.texto, significado: '', precio: null, agotado: false, destacado: DESTACADOS.includes(p.id)
    })),
    medallas: MEDALLAS.slice(),
    enVivo: false
  });

  const cargar = async () => {
    if (!configurado()) return respaldo();
    try {
      const [cats, prods, meds] = await Promise.all([
        get('categorias?select=id,nombre,texto,orden&order=orden.asc,nombre.asc'),
        get('productos?select=*,producto_fotos(url,posicion)&order=orden.asc,created_at.desc'),
        get('medallas?select=id,nombre,significado,foto,orden&order=orden.asc,nombre.asc')
      ]);
      return {
        categorias: cats.map(c => ({ id: c.id, nombre: c.nombre, texto: c.texto || '' })),
        piezas: prods.map(pieza),
        medallas: meds,
        enVivo: true
      };
    } catch (e) {
      console.warn('No se pudo leer Supabase; se usa el respaldo.', e);
      return respaldo();
    }
  };

  const precio = (n) => (n == null || n === '') ? '' :
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  return { cargar, precio, configurado };
})();
