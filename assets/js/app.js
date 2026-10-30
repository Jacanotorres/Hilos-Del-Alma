/* Comportamiento de las páginas: renderiza los bloques desde data.js. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const prod = id => PRODUCTOS.find(p => p.id === id);
  const catName = id => (CATEGORIAS.find(c => c.id === id) || {}).nombre || '';

  const card = p => `
    <article class="piece reveal">
      <a class="piece__img arch" href="${waLink(`Hola Hilos del Alma, me interesa: ${p.nombre}. ¿Me das más información?`)}" target="_blank" rel="noopener" aria-label="Preguntar por ${p.nombre}">
        <img src="${IMG(p.img)}" alt="${p.nombre}" loading="lazy">
      </a>
      <div class="piece__body">
        <span class="piece__cat">${catName(p.cat)}</span>
        <h3>${p.nombre}</h3>
        <p>${p.texto}</p>
        <a class="link" href="${waLink(`Hola Hilos del Alma, me interesa: ${p.nombre}. ¿Me das más información?`)}" target="_blank" rel="noopener">Cotizar por WhatsApp ${Art.icon('arrow', 16)}</a>
      </div>
    </article>`;

  /* Categorías de la portada */
  const cats = $('#cats');
  if (cats) {
    cats.innerHTML = CATEGORIAS.map(c => {
      const href = c.wa ? waLink(c.wa) : `coleccion.html?cat=${c.id}`;
      const ext = c.wa ? ' target="_blank" rel="noopener"' : '';
      const media = c.art ? `<div class="cat__art">${Art[c.art]()}</div>` : `<img src="${IMG(c.img)}" alt="" loading="lazy">`;
      return `<a class="cat reveal" href="${href}"${ext}><div class="cat__img arch">${media}</div><h3>${c.nombre}</h3><p>${c.texto}</p></a>`;
    }).join('');
  }

  /* Líneas */
  const lineas = $('#lineas');
  if (lineas) {
    const href = { fe: 'coleccion.html?linea=fe', amor: 'coleccion.html?linea=amor', personalizados: 'personalizados.html' };
    lineas.innerHTML = LINEAS.map(l => `
      <a class="linea linea--${l.tono} reveal" href="${href[l.id]}">
        ${Art.sparkle('linea__spark')}
        <h3>${l.nombre}</h3><p>${l.texto}</p>
        <span class="link">Ver más ${Art.icon('arrow', 16)}</span>
      </a>`).join('');
  }

  /* Destacados */
  const dest = $('#destacados');
  if (dest) dest.innerHTML = DESTACADOS.map(prod).filter(Boolean).map(card).join('');

  /* Pasos */
  const pasos = $('#pasos');
  if (pasos) pasos.innerHTML = PASOS.map(s => `<li class="step reveal"><b>${s.n}</b><div><h3>${s.t}</h3><p>${s.p}</p></div></li>`).join('');

  /* Historia */
  const hist = $('#historia');
  if (hist) hist.innerHTML = HISTORIA.map(t => `<p>${t}</p>`).join('');

  /* Tira de Instagram */
  const ig = $('#ig');
  if (ig) {
    const url = `https://www.instagram.com/${SITE.instagram}/`;
    ig.innerHTML = ['perlas', 'azul', 'llavero-rosa', 'palabras', 'muneca', 'plateada'].map(id =>
      `<a class="ig__tile reveal" href="${url}" target="_blank" rel="noopener" aria-label="Ver en Instagram"><img src="${IMG(id)}" alt="" loading="lazy"></a>`).join('');
  }

  /* Colección con filtros */
  const grid = $('#coleccion');
  if (grid) {
    const params = new URLSearchParams(location.search);
    let cat = params.get('cat') || 'todo';
    let linea = params.get('linea') || '';
    const chips = $('#chips');
    const usadas = new Set(PRODUCTOS.map(p => p.cat));
    const opts = [['todo', 'Todo'], ...CATEGORIAS.filter(c => usadas.has(c.id)).map(c => [c.id, c.nombre])];
    if (!opts.some(o => o[0] === cat)) cat = 'todo';
    const draw = () => {
      chips.innerHTML = opts.map(([id, n]) => `<button class="chip${id === cat ? ' is-on' : ''}" data-cat="${id}">${n}</button>`).join('');
      const lista = PRODUCTOS.filter(p => (cat === 'todo' || p.cat === cat) && (!linea || p.linea === linea));
      const info = $('#linea-info');
      const l = LINEAS.find(x => x.id === linea);
      info.hidden = !l;
      if (l) info.innerHTML = `Mostrando <b>${l.nombre}</b> · <button class="link" id="quitar">Ver toda la colección</button>`;
      grid.innerHTML = lista.length ? lista.map(card).join('') : '<p class="muted empty">Aún no hay piezas aquí. Escríbenos y la creamos para ti.</p>';
      requestAnimationFrame(reveal);
    };
    chips.addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) { cat = b.dataset.cat; draw(); } });
    $('#linea-info').addEventListener('click', e => { if (e.target.id === 'quitar') { linea = ''; draw(); } });
    draw();
  }

  /* Formularios que abren WhatsApp con el mensaje armado */
  $$('form[data-wa-form]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f).entries());
    const lines = [`Hola Hilos del Alma, soy ${d.nombre || ''}.`];
    if (d.pieza) lines.push(`Me gustaría: ${d.pieza}.`);
    if (d.para) lines.push(`Es para: ${d.para}.`);
    if (d.colores) lines.push(`Colores o estilo: ${d.colores}.`);
    if (d.mensaje) lines.push(d.mensaje);
    window.open(waLink(lines.join(' ')), '_blank', 'noopener');
  }));

  /* Enlaces con data-wa */
  $$('a[data-wa]').forEach(a => { a.href = waLink(a.dataset.wa); });

  /* Aparecer suavemente al hacer scroll */
  function reveal() {
    const els = $$('.reveal:not(.is-in)');
    if (!('IntersectionObserver' in window)) return els.forEach(e => e.classList.add('is-in'));
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(el => io.observe(el));
  }
  reveal();
})();
