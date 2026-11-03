/* Comportamiento de las páginas: renderiza los bloques con el catálogo (Supabase o respaldo). */
(async function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Aparecer suavemente al hacer scroll */
  function reveal() {
    const els = $$('.reveal:not(.is-in)');
    if (!('IntersectionObserver' in window)) return els.forEach(e => e.classList.add('is-in'));
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(el => io.observe(el));
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
  $$('a[data-wa]').forEach(a => { a.href = waLink(a.dataset.wa); });
  $$('#pasos').forEach(el => { el.innerHTML = PASOS.map(s => `<li class="step reveal"><b>${s.n}</b><div><h3>${s.t}</h3><p>${s.p}</p></div></li>`).join(''); });
  const hist = $('#historia');
  if (hist) hist.innerHTML = HISTORIA.map(t => `<p>${t}</p>`).join('');

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

  /* Tira de Instagram (fotos propias del sitio) */
  const ig = $('#ig');
  if (ig) {
    const url = `https://www.instagram.com/${SITE.instagram}/`;
    ig.innerHTML = ['perlas', 'azul', 'llavero-rosa', 'palabras', 'muneca', 'plateada'].map(id =>
      `<a class="ig__tile reveal" href="${url}" target="_blank" rel="noopener" aria-label="Ver en Instagram"><img src="${IMG(id)}" alt="" loading="lazy"></a>`).join('');
  }
  reveal();

  /* ---- Todo lo que depende del catálogo ---- */
  const needsCatalog = $('#cats, #destacados, #coleccion, #medallas');
  if (!needsCatalog) return;
  const C = await Catalogo.cargar();
  const catName = id => (C.categorias.find(c => c.id === id) || {}).nombre || '';
  const pieza = id => C.piezas.find(p => String(p.id) === String(id));
  const pedido = p => waLink(`Hola Hilos del Alma, me interesa: ${p.nombre}. ¿Me das más información?`);

  const card = p => `
    <article class="piece reveal">
      <button class="piece__img arch" type="button" data-open="${esc(p.id)}" aria-label="Ver ${esc(p.nombre)}">
        ${p.img ? `<img src="${esc(p.img)}" alt="${esc(p.nombre)}" loading="lazy">` : `<span class="piece__ph">${Art.generico()}</span>`}
        ${p.agotado ? '<span class="badge">Agotado</span>' : ''}
        ${p.fotos.length > 1 ? `<span class="badge badge--n">${p.fotos.length} fotos</span>` : ''}
      </button>
      <div class="piece__body">
        <span class="piece__cat">${esc(catName(p.cat))}</span>
        <h3>${esc(p.nombre)}</h3>
        ${p.texto ? `<p>${esc(p.texto)}</p>` : ''}
        <div class="piece__foot">
          <b class="piece__price">${p.precio != null ? Catalogo.precio(p.precio) : 'Consulta el precio'}</b>
          <button class="link" type="button" data-open="${esc(p.id)}">Ver más ${Art.icon('arrow', 16)}</button>
        </div>
      </div>
    </article>`;

  /* Categorías de la portada */
  const cats = $('#cats');
  if (cats) {
    cats.innerHTML = C.categorias.map(c => {
      const foto = (C.piezas.find(p => p.cat === c.id && p.img) || {}).img;
      const art = c.id === 'rosarios' ? Art.rosario() : Art.generico();
      const media = foto ? `<img src="${esc(foto)}" alt="" loading="lazy">` : `<div class="cat__art">${art}</div>`;
      /* Sin piezas todavía: en vez de una página vacía, invita a preguntar por WhatsApp. */
      const hay = C.piezas.some(p => p.cat === c.id);
      const enlace = hay ? `href="coleccion.html?cat=${esc(c.id)}"` : `href="${waLink(`Hola Hilos del Alma, me interesa: ${c.nombre}. ¿Me cuentas las opciones?`)}" target="_blank" rel="noopener"`;
      return `<a class="cat reveal" ${enlace}><div class="cat__img arch">${media}</div><h3>${esc(c.nombre)}</h3><p>${esc(c.texto)}</p></a>`;
    }).join('');
  }

  /* Destacadas */
  const dest = $('#destacados');
  if (dest) {
    const marcadas = C.piezas.filter(p => p.destacado);
    const lista = (marcadas.length ? marcadas : C.piezas).slice(0, 6);
    dest.innerHTML = lista.length ? lista.map(card).join('') : '<p class="muted empty">Muy pronto verás aquí nuestras piezas.</p>';
  }

  /* Medallas y su significado */
  const meds = $('#medallas');
  if (meds) {
    const sec = meds.closest('[data-medallas]');
    if (!C.medallas.length) { if (sec) sec.hidden = true; }
    else meds.innerHTML = C.medallas.map(m => `
      <article class="medal reveal">
        ${m.foto ? `<div class="medal__img"><img src="${esc(m.foto)}" alt="${esc(m.nombre)}" loading="lazy"></div>` : `<div class="medal__img medal__img--ph">${Art.sparkle()}</div>`}
        <h3>${esc(m.nombre)}</h3><p>${esc(m.significado || '')}</p>
      </article>`).join('');
  }

  reveal();

  /* Colección con filtros */
  const grid = $('#coleccion');
  if (grid) {
    const params = new URLSearchParams(location.search);
    let cat = params.get('cat') || 'todo';
    let linea = params.get('linea') || '';
    let q = '';
    const chips = $('#chips');
    const opts = [['todo', 'Todo'], ...C.categorias.filter(c => C.piezas.some(p => p.cat === c.id)).map(c => [c.id, c.nombre])];
    if (!opts.some(o => o[0] === cat)) cat = 'todo';
    const draw = () => {
      chips.innerHTML = opts.map(([id, n]) => `<button class="chip${id === cat ? ' is-on' : ''}" data-cat="${esc(id)}">${esc(n)}</button>`).join('');
      const lista = C.piezas.filter(p => (cat === 'todo' || p.cat === cat) && (!linea || p.linea === linea)
        && (!q || (p.nombre + ' ' + p.texto).toLowerCase().includes(q)));
      const info = $('#linea-info');
      const l = LINEAS.find(x => x.id === linea);
      info.hidden = !l;
      if (l) info.innerHTML = `Mostrando <b>${l.nombre}</b> · <button class="link" id="quitar">Ver toda la colección</button>`;
      grid.innerHTML = lista.length ? lista.map(card).join('') : '<p class="muted empty">No encontramos piezas aquí. Escríbenos y la creamos para ti.</p>';
      reveal();
    };
    chips.addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) { cat = b.dataset.cat; draw(); } });
    $('#linea-info').addEventListener('click', e => { if (e.target.id === 'quitar') { linea = ''; draw(); } });
    const buscar = $('#buscar');
    if (buscar) buscar.addEventListener('input', () => { q = buscar.value.trim().toLowerCase(); draw(); });
    draw();
  }

  /* Ficha de la pieza (ventana con fotos, significado y pedido) */
  document.body.insertAdjacentHTML('beforeend', '<dialog class="dlg" id="ficha" aria-label="Detalle de la pieza"></dialog>');
  const dlg = $('#ficha');
  const abrir = (p) => {
    const fotos = p.fotos.length ? p.fotos : [''];
    dlg.innerHTML = `
      <button class="dlg__x" type="button" aria-label="Cerrar">✕</button>
      <div class="dlg__grid">
        <div class="dlg__media">
          <div class="dlg__main arch">${fotos[0] ? `<img id="ficha-main" src="${esc(fotos[0])}" alt="${esc(p.nombre)}">` : `<span class="piece__ph">${Art.generico()}</span>`}</div>
          ${fotos.length > 1 ? `<div class="dlg__thumbs">${fotos.map((f, i) => `<button type="button" class="${i ? '' : 'is-on'}" data-foto="${esc(f)}" aria-label="Foto ${i + 1}"><img src="${esc(f)}" alt=""></button>`).join('')}</div>` : ''}
        </div>
        <div class="dlg__info">
          <span class="piece__cat">${esc(catName(p.cat))}</span>
          <h2>${esc(p.nombre)}</h2>
          <b class="dlg__price">${p.precio != null ? Catalogo.precio(p.precio) : 'Consulta el precio'}${p.agotado ? ' · <i>Agotado</i>' : ''}</b>
          ${p.texto ? `<p>${esc(p.texto)}</p>` : ''}
          ${p.significado ? `<div class="dlg__sig"><small>Qué significa</small><p>${esc(p.significado)}</p></div>` : ''}
          <a class="btn btn--sage" href="${pedido(p)}" target="_blank" rel="noopener">${Art.icon('wa', 18)} ${p.agotado ? 'Preguntar disponibilidad' : 'Pedir por WhatsApp'}</a>
        </div>
      </div>`;
    dlg.showModal();
  };
  dlg.addEventListener('click', e => {
    if (e.target === dlg || e.target.closest('.dlg__x')) return dlg.close();
    const t = e.target.closest('[data-foto]');
    if (t) {
      $('#ficha-main').src = t.dataset.foto;
      $$('.dlg__thumbs button', dlg).forEach(b => b.classList.toggle('is-on', b === t));
    }
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-open]');
    if (b) { const p = pieza(b.dataset.open); if (p) abrir(p); }
  });
  const abierta = new URLSearchParams(location.search).get('p');
  if (abierta && pieza(abierta)) abrir(pieza(abierta));
})();
