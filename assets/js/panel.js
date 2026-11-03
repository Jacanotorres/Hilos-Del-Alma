/* Panel de Hilos del Alma: la clienta agrega y edita piezas, categorías y medallas.
   Todo se guarda en Supabase; las fotos van a Storage (se reducen antes de subir). */
(async function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const app = $('#app');

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    app.innerHTML = '<div class="pempty"><h2 class="h2">Falta <em>conectar</em></h2><p class="muted">El panel aún no está conectado a Supabase. Falta llenar <code>assets/js/config.js</code>.</p></div>';
    return;
  }
  const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  /* ---------- Acceso ---------- */
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { location.href = 'login.html'; return; }
  const { data: perfil } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
  if (!perfil || perfil.role !== 'admin') { await sb.auth.signOut(); location.href = 'login.html?sin=acceso'; return; }
  $('#salir').addEventListener('click', async () => { await sb.auth.signOut(); location.href = 'login.html'; });

  /* ---------- Utilidades ---------- */
  const toast = (msg, tipo = 'ok') => {
    const t = document.createElement('div');
    t.className = `toast toast--${tipo}`; t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('is-out'), 3200);
    setTimeout(() => t.remove(), 3700);
  };
  const fallo = (e, que) => { console.error(e); toast(`No se pudo ${que}. ${e && e.message ? e.message : ''}`.trim(), 'err'); };
  const precioTxt = (n) => n == null ? 'Sin precio' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
  const slug = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'categoria';
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
  const esStorage = (u, bucket) => u.includes(`/storage/v1/object/public/${bucket}/`);
  const rutaStorage = (u, bucket) => decodeURIComponent(u.split(`/storage/v1/object/public/${bucket}/`)[1] || '');

  /* Reduce la foto (máx. 1600 px) y la pasa a WebP; así sube rápido desde el celular. */
  async function comprimir(file, max = 1600) {
    let bmp;
    try { bmp = await createImageBitmap(file); } catch (e) { throw new Error('Esa imagen no se pudo leer. Prueba con otra foto (JPG o PNG).'); }
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    let blob = await new Promise(r => c.toBlob(r, 'image/webp', 0.86));
    if (!blob || blob.type !== 'image/webp') blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.86));
    return blob;
  }
  async function subir(bucket, carpeta, file) {
    const blob = await comprimir(file);
    const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
    const ruta = `${carpeta}/${uid()}.${ext}`;
    const { error } = await sb.storage.from(bucket).upload(ruta, blob, { contentType: blob.type, cacheControl: '31536000' });
    if (error) throw error;
    return sb.storage.from(bucket).getPublicUrl(ruta).data.publicUrl;
  }

  /* ---------- Estado ---------- */
  const S = { tab: 'piezas', cats: [], prods: [], meds: [], q: '', fcat: '' };
  async function cargar() {
    const [c, p, m] = await Promise.all([
      sb.from('categorias').select('*').order('orden').order('nombre'),
      sb.from('productos').select('*, producto_fotos(id,url,posicion)').order('orden').order('created_at', { ascending: false }),
      sb.from('medallas').select('*').order('orden').order('nombre')
    ]);
    const err = c.error || p.error || m.error;
    if (err) throw err;
    S.cats = c.data; S.meds = m.data;
    S.prods = p.data.map(x => ({ ...x, fotos: (x.producto_fotos || []).slice().sort((a, b) => a.posicion - b.posicion) }));
  }
  const catNombre = (id) => (S.cats.find(c => c.id === id) || {}).nombre || 'Sin categoría';

  /* ---------- Estructura ---------- */
  function shell() {
    app.innerHTML = `
      <div class="ptabs" role="tablist">
        <button role="tab" data-tab="piezas">Piezas <b>${S.prods.length}</b></button>
        <button role="tab" data-tab="categorias">Categorías <b>${S.cats.length}</b></button>
        <button role="tab" data-tab="medallas">Medallas <b>${S.meds.length}</b></button>
      </div>
      <section id="vista"></section>
      <dialog class="pdlg" id="modal"></dialog>`;
    $$('.ptabs button').forEach(b => {
      b.classList.toggle('is-on', b.dataset.tab === S.tab);
      b.addEventListener('click', () => { S.tab = b.dataset.tab; shell(); vista(); });
    });
  }
  const vista = () => ({ piezas: vPiezas, categorias: vCategorias, medallas: vMedallas }[S.tab])();
  async function refrescar() { await cargar(); shell(); vista(); }

  /* ============ PIEZAS ============ */
  function vPiezas() {
    const v = $('#vista');
    v.innerHTML = `
      <div class="ptool">
        <input id="q" type="search" placeholder="Buscar pieza…" value="${esc(S.q)}" aria-label="Buscar">
        <select id="fcat" aria-label="Filtrar por categoría"><option value="">Todas las categorías</option>${S.cats.map(c => `<option value="${esc(c.id)}"${S.fcat === c.id ? ' selected' : ''}>${esc(c.nombre)}</option>`).join('')}</select>
        <button class="btn btn--sage" id="nueva" type="button">+ Nueva pieza</button>
      </div>
      <div class="plist" id="lista"></div>`;
    const pintar = () => {
      const q = S.q.toLowerCase();
      const l = S.prods.filter(p => (!S.fcat || p.categoria_id === S.fcat) && (!q || p.nombre.toLowerCase().includes(q)));
      $('#lista').innerHTML = l.length ? l.map(p => `
        <article class="pcard${p.visible ? '' : ' is-off'}">
          <div class="pcard__img">${p.fotos[0] ? `<img src="${esc(p.fotos[0].url)}" alt="" loading="lazy">` : '<span>Sin foto</span>'}</div>
          <div class="pcard__body">
            <h3>${esc(p.nombre)}</h3>
            <p class="muted">${esc(catNombre(p.categoria_id))} · ${precioTxt(p.precio)}</p>
            <div class="tags">
              ${p.visible ? '' : '<span class="tag tag--off">Oculta</span>'}
              ${p.agotado ? '<span class="tag tag--warn">Agotado</span>' : ''}
              ${p.destacado ? '<span class="tag">Destacada</span>' : ''}
              ${p.fotos.length > 1 ? `<span class="tag">${p.fotos.length} fotos</span>` : ''}
            </div>
            <div class="pcard__act">
              <button class="btn btn--ghost btn--sm" data-edit="${p.id}" type="button">Editar</button>
              <button class="pbtn" data-vis="${p.id}" type="button">${p.visible ? 'Ocultar' : 'Mostrar'}</button>
              <button class="pbtn pbtn--del" data-del="${p.id}" type="button">Borrar</button>
            </div>
          </div>
        </article>`).join('') : `<div class="pempty"><p class="muted">${S.prods.length ? 'No hay piezas con ese filtro.' : 'Aún no hay piezas. Crea la primera con “Nueva pieza”.'}</p></div>`;
    };
    pintar();
    $('#q').addEventListener('input', e => { S.q = e.target.value; pintar(); });
    $('#fcat').addEventListener('change', e => { S.fcat = e.target.value; pintar(); });
    $('#nueva').addEventListener('click', () => formPieza(null));
    $('#lista').addEventListener('click', async e => {
      const id = (e.target.closest('[data-edit],[data-vis],[data-del]') || {}).dataset;
      if (!id) return;
      const p = S.prods.find(x => x.id === (id.edit || id.vis || id.del));
      if (!p) return;
      if (id.edit) return formPieza(p);
      if (id.vis) {
        const { error } = await sb.from('productos').update({ visible: !p.visible, updated_at: new Date().toISOString() }).eq('id', p.id);
        if (error) return fallo(error, 'cambiar la visibilidad');
        toast(p.visible ? 'La pieza quedó oculta' : 'La pieza ya se ve en la página'); return refrescar();
      }
      if (id.del) {
        if (!confirm(`¿Borrar “${p.nombre}”? Esto no se puede deshacer.`)) return;
        try {
          const rutas = p.fotos.filter(f => esStorage(f.url, 'productos')).map(f => rutaStorage(f.url, 'productos'));
          if (rutas.length) await sb.storage.from('productos').remove(rutas);
          const { error } = await sb.from('productos').delete().eq('id', p.id);
          if (error) throw error;
          toast('Pieza borrada'); refrescar();
        } catch (er) { fallo(er, 'borrar la pieza'); }
      }
    });
  }

  function formPieza(p) {
    const nueva = !p;
    const fotos = (p ? p.fotos : []).map(f => ({ id: f.id, url: f.url }));
    const m = $('#modal');
    m.innerHTML = `
      <form id="fp" novalidate>
        <header class="pdlg__h"><h2>${nueva ? 'Nueva pieza' : 'Editar pieza'}</h2><button type="button" class="dlg__x" data-cerrar aria-label="Cerrar">✕</button></header>
        <div class="pdlg__b">
          <div class="field"><label for="f-nombre">Nombre de la pieza *</label><input id="f-nombre" required maxlength="120" value="${esc(p?.nombre)}" placeholder="Ej: Collar Esperanza"></div>
          <div class="frow">
            <div class="field"><label for="f-cat">Categoría</label><select id="f-cat"><option value="">Sin categoría</option>${S.cats.map(c => `<option value="${esc(c.id)}"${p?.categoria_id === c.id ? ' selected' : ''}>${esc(c.nombre)}</option>`).join('')}</select></div>
            <div class="field"><label for="f-precio">Precio (COP)</label><input id="f-precio" type="number" inputmode="numeric" min="0" step="500" value="${p?.precio ?? ''}" placeholder="Vacío = “Consulta el precio”"></div>
          </div>
          <div class="field"><label for="f-desc">Descripción</label><textarea id="f-desc" rows="3" placeholder="Materiales, colores, tamaño…">${esc(p?.descripcion)}</textarea></div>
          <div class="field"><label for="f-sig">Qué significa (medalla o pieza)</label><textarea id="f-sig" rows="3" placeholder="Opcional. Se muestra en la ficha de la pieza.">${esc(p?.significado)}</textarea></div>
          <div class="field"><label for="f-linea">Línea</label><select id="f-linea"><option value="">Ninguna</option>
            <option value="fe"${p?.linea === 'fe' ? ' selected' : ''}>Hilos de fe</option><option value="amor"${p?.linea === 'amor' ? ' selected' : ''}>Hilos de amor</option><option value="personalizados"${p?.linea === 'personalizados' ? ' selected' : ''}>Personalizados</option></select></div>
          <div class="checks">
            <label class="chk"><input type="checkbox" id="f-visible" ${p ? (p.visible ? 'checked' : '') : 'checked'}><span>Mostrar en la página</span></label>
            <label class="chk"><input type="checkbox" id="f-destacado" ${p?.destacado ? 'checked' : ''}><span>Destacar en el inicio</span></label>
            <label class="chk"><input type="checkbox" id="f-agotado" ${p?.agotado ? 'checked' : ''}><span>Marcar como agotado</span></label>
          </div>
          <div class="field"><label>Fotos <small class="muted">La primera es la portada</small></label>
            <div class="fotos" id="fotos"></div>
            <label class="btn btn--ghost btn--sm fotos__add"><input type="file" id="f-files" accept="image/*" multiple hidden>+ Agregar fotos</label>
          </div>
        </div>
        <footer class="pdlg__f">
          <button type="button" class="btn btn--ghost" data-cerrar>Cancelar</button>
          <button type="submit" class="btn btn--sage" id="guardar">${nueva ? 'Crear pieza' : 'Guardar cambios'}</button>
        </footer>
      </form>`;
    const pintarFotos = () => {
      $('#fotos').innerHTML = fotos.length ? fotos.map((f, i) => `
        <figure class="foto${i === 0 ? ' is-cover' : ''}">
          <img src="${esc(f.blob || f.url)}" alt="">
          ${i === 0 ? '<span class="foto__tag">Portada</span>' : ''}
          <div class="foto__act">
            <button type="button" data-izq="${i}" aria-label="Mover a la izquierda"${i === 0 ? ' disabled' : ''}>←</button>
            <button type="button" data-der="${i}" aria-label="Mover a la derecha"${i === fotos.length - 1 ? ' disabled' : ''}>→</button>
            <button type="button" data-qt="${i}" aria-label="Quitar foto">✕</button>
          </div>
        </figure>`).join('') : '<p class="muted fotos__vacio">Aún no hay fotos.</p>';
    };
    pintarFotos();
    $('#fotos').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const d = b.dataset; const mover = (i, j) => { [fotos[i], fotos[j]] = [fotos[j], fotos[i]]; };
      if (d.izq) mover(+d.izq, +d.izq - 1);
      else if (d.der) mover(+d.der, +d.der + 1);
      else if (d.qt) { const [q] = fotos.splice(+d.qt, 1); if (q.blob) URL.revokeObjectURL(q.blob); }
      pintarFotos();
    });
    $('#f-files').addEventListener('change', e => {
      [...e.target.files].forEach(file => fotos.push({ file, blob: URL.createObjectURL(file) }));
      e.target.value = ''; pintarFotos();
    });
    m.onclick = e => { if (e.target.closest('[data-cerrar]') || e.target === m) m.close(); };

    $('#fp').addEventListener('submit', async e => {
      e.preventDefault();
      const nombre = $('#f-nombre').value.trim();
      if (!nombre) { toast('Escribe el nombre de la pieza', 'err'); $('#f-nombre').focus(); return; }
      const precioV = $('#f-precio').value.trim();
      const datos = {
        nombre, categoria_id: $('#f-cat').value || null, linea: $('#f-linea').value || null,
        descripcion: $('#f-desc').value.trim() || null, significado: $('#f-sig').value.trim() || null,
        precio: precioV === '' ? null : Math.round(Number(precioV)),
        visible: $('#f-visible').checked, destacado: $('#f-destacado').checked, agotado: $('#f-agotado').checked,
        updated_at: new Date().toISOString()
      };
      if (datos.precio != null && (!Number.isFinite(datos.precio) || datos.precio < 0)) { toast('El precio no es válido', 'err'); return; }
      const btn = $('#guardar'); btn.disabled = true; btn.textContent = 'Guardando…';
      try {
        let id = p?.id;
        if (id) { const { error } = await sb.from('productos').update(datos).eq('id', id); if (error) throw error; }
        else { const { data, error } = await sb.from('productos').insert({ ...datos, orden: 0 }).select('id').single(); if (error) throw error; id = data.id; }

        /* Fotos: se suben las nuevas, se insertan en el orden final y luego se quitan las anteriores. */
        const urls = [];
        for (let i = 0; i < fotos.length; i++) {
          btn.textContent = `Subiendo foto ${i + 1} de ${fotos.length}…`;
          urls.push(fotos[i].file ? await subir('productos', id, fotos[i].file) : fotos[i].url);
        }
        const viejas = p ? p.fotos : [];
        if (urls.length) {
          const { error } = await sb.from('producto_fotos').insert(urls.map((url, i) => ({ producto_id: id, url, posicion: i })));
          if (error) throw error;
        }
        if (viejas.length) {
          const { error } = await sb.from('producto_fotos').delete().in('id', viejas.map(f => f.id));
          if (error) throw error;
          const quitadas = viejas.map(f => f.url).filter(u => !urls.includes(u) && esStorage(u, 'productos')).map(u => rutaStorage(u, 'productos'));
          if (quitadas.length) await sb.storage.from('productos').remove(quitadas);
        }
        fotos.forEach(f => f.blob && URL.revokeObjectURL(f.blob));
        m.close(); toast(nueva ? 'Pieza creada' : 'Cambios guardados'); refrescar();
      } catch (er) { fallo(er, 'guardar la pieza'); btn.disabled = false; btn.textContent = nueva ? 'Crear pieza' : 'Guardar cambios'; }
    });
    m.showModal();
  }

  /* ============ LISTAS SIMPLES (categorías y medallas) ============ */
  async function reordenar(tabla, lista, i, j) {
    const a = lista.slice(); [a[i], a[j]] = [a[j], a[i]];
    const res = await Promise.all(a.map((x, k) => x.orden === k + 1 ? null : sb.from(tabla).update({ orden: k + 1 }).eq('id', x.id)));
    const e = res.find(r => r && r.error); if (e) return fallo(e.error, 'cambiar el orden');
    refrescar();
  }

  /* ============ CATEGORÍAS ============ */
  function vCategorias() {
    const v = $('#vista');
    v.innerHTML = `
      <div class="ptool"><p class="muted ptool__txt">Así se agrupan las piezas en la página. Puedes cambiar el orden con las flechas.</p>
        <button class="btn btn--sage" id="nc" type="button">+ Nueva categoría</button></div>
      <div class="rows" id="rows">${S.cats.map((c, i) => `
        <div class="row">
          <div class="row__arrows"><button data-up="${i}" aria-label="Subir"${i === 0 ? ' disabled' : ''}>↑</button><button data-dn="${i}" aria-label="Bajar"${i === S.cats.length - 1 ? ' disabled' : ''}>↓</button></div>
          <div class="row__main"><h3>${esc(c.nombre)}</h3><p class="muted">${esc(c.texto || '')} · ${(n => `${n} ${n === 1 ? 'pieza' : 'piezas'}`)(S.prods.filter(p => p.categoria_id === c.id).length)}</p></div>
          <div class="row__act"><button class="btn btn--ghost btn--sm" data-edit="${i}">Editar</button><button class="pbtn pbtn--del" data-del="${i}">Borrar</button></div>
        </div>`).join('')}</div>`;
    $('#nc').addEventListener('click', () => formCat(null));
    $('#rows').addEventListener('click', async e => {
      const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
      if (d.up) return reordenar('categorias', S.cats, +d.up, +d.up - 1);
      if (d.dn) return reordenar('categorias', S.cats, +d.dn, +d.dn + 1);
      if (d.edit) return formCat(S.cats[+d.edit]);
      if (d.del) {
        const c = S.cats[+d.del]; const n = S.prods.filter(p => p.categoria_id === c.id).length;
        if (!confirm(`¿Borrar la categoría “${c.nombre}”?${n ? ` Las ${n} piezas que tiene quedarán sin categoría.` : ''}`)) return;
        const { error } = await sb.from('categorias').delete().eq('id', c.id);
        if (error) return fallo(error, 'borrar la categoría');
        toast('Categoría borrada'); refrescar();
      }
    });
  }
  function formCat(c) {
    const m = $('#modal');
    m.innerHTML = `
      <form id="fc" novalidate>
        <header class="pdlg__h"><h2>${c ? 'Editar categoría' : 'Nueva categoría'}</h2><button type="button" class="dlg__x" data-cerrar aria-label="Cerrar">✕</button></header>
        <div class="pdlg__b">
          <div class="field"><label for="c-nombre">Nombre *</label><input id="c-nombre" required maxlength="80" value="${esc(c?.nombre)}" placeholder="Ej: Bendiciones para el hogar"></div>
          <div class="field"><label for="c-texto">Frase corta</label><input id="c-texto" maxlength="120" value="${esc(c?.texto)}" placeholder="Se muestra debajo del nombre en el inicio"></div>
        </div>
        <footer class="pdlg__f"><button type="button" class="btn btn--ghost" data-cerrar>Cancelar</button><button type="submit" class="btn btn--sage" id="guardar">Guardar</button></footer>
      </form>`;
    m.onclick = e => { if (e.target.closest('[data-cerrar]') || e.target === m) m.close(); };
    $('#fc').addEventListener('submit', async e => {
      e.preventDefault();
      const nombre = $('#c-nombre').value.trim(); if (!nombre) { toast('Escribe el nombre', 'err'); return; }
      const texto = $('#c-texto').value.trim() || null;
      const btn = $('#guardar'); btn.disabled = true;
      let error;
      if (c) ({ error } = await sb.from('categorias').update({ nombre, texto }).eq('id', c.id));
      else {
        let id = slug(nombre), n = 2; while (S.cats.some(x => x.id === id)) id = `${slug(nombre)}-${n++}`;
        ({ error } = await sb.from('categorias').insert({ id, nombre, texto, orden: S.cats.length + 1 }));
      }
      if (error) { fallo(error, 'guardar la categoría'); btn.disabled = false; return; }
      m.close(); toast('Categoría guardada'); refrescar();
    });
    m.showModal();
  }

  /* ============ MEDALLAS ============ */
  function vMedallas() {
    const v = $('#vista');
    v.innerHTML = `
      <div class="ptool"><p class="muted ptool__txt">El significado de cada medalla. Se muestra en el inicio y en “Nosotras”, como parte de la experiencia del empaque.</p>
        <button class="btn btn--sage" id="nm" type="button">+ Nueva medalla</button></div>
      <div class="rows" id="rows">${S.meds.length ? S.meds.map((x, i) => `
        <div class="row">
          <div class="row__arrows"><button data-up="${i}" aria-label="Subir"${i === 0 ? ' disabled' : ''}>↑</button><button data-dn="${i}" aria-label="Bajar"${i === S.meds.length - 1 ? ' disabled' : ''}>↓</button></div>
          <div class="row__thumb">${x.foto ? `<img src="${esc(x.foto)}" alt="">` : '<span>✦</span>'}</div>
          <div class="row__main"><h3>${esc(x.nombre)}</h3><p class="muted">${esc(x.significado || 'Sin significado todavía')}</p></div>
          <div class="row__act"><button class="btn btn--ghost btn--sm" data-edit="${i}">Editar</button><button class="pbtn pbtn--del" data-del="${i}">Borrar</button></div>
        </div>`).join('') : '<div class="pempty"><p class="muted">Aún no hay medallas. Agrega la primera con “Nueva medalla”.</p></div>'}</div>`;
    $('#nm').addEventListener('click', () => formMed(null));
    $('#rows').addEventListener('click', async e => {
      const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
      if (d.up) return reordenar('medallas', S.meds, +d.up, +d.up - 1);
      if (d.dn) return reordenar('medallas', S.meds, +d.dn, +d.dn + 1);
      if (d.edit) return formMed(S.meds[+d.edit]);
      if (d.del) {
        const x = S.meds[+d.del]; if (!confirm(`¿Borrar la medalla “${x.nombre}”?`)) return;
        if (x.foto && esStorage(x.foto, 'medallas')) await sb.storage.from('medallas').remove([rutaStorage(x.foto, 'medallas')]);
        const { error } = await sb.from('medallas').delete().eq('id', x.id);
        if (error) return fallo(error, 'borrar la medalla');
        toast('Medalla borrada'); refrescar();
      }
    });
  }
  function formMed(x) {
    let foto = x?.foto || null, archivo = null, preview = null;
    const m = $('#modal');
    m.innerHTML = `
      <form id="fm" novalidate>
        <header class="pdlg__h"><h2>${x ? 'Editar medalla' : 'Nueva medalla'}</h2><button type="button" class="dlg__x" data-cerrar aria-label="Cerrar">✕</button></header>
        <div class="pdlg__b">
          <div class="field"><label for="m-nombre">Nombre *</label><input id="m-nombre" required maxlength="80" value="${esc(x?.nombre)}" placeholder="Ej: San Benito"></div>
          <div class="field"><label for="m-sig">Qué significa</label><textarea id="m-sig" rows="4" placeholder="Qué representa y para quién es">${esc(x?.significado)}</textarea></div>
          <div class="field"><label>Foto</label>
            <div class="fotos" id="mfoto"></div>
            <label class="btn btn--ghost btn--sm fotos__add"><input type="file" id="m-file" accept="image/*" hidden>Elegir foto</label></div>
        </div>
        <footer class="pdlg__f"><button type="button" class="btn btn--ghost" data-cerrar>Cancelar</button><button type="submit" class="btn btn--sage" id="guardar">Guardar</button></footer>
      </form>`;
    const pintar = () => { $('#mfoto').innerHTML = (preview || foto) ? `<figure class="foto is-cover"><img src="${esc(preview || foto)}" alt=""><div class="foto__act"><button type="button" data-qt>✕</button></div></figure>` : '<p class="muted fotos__vacio">Sin foto.</p>'; };
    pintar();
    $('#mfoto').addEventListener('click', e => { if (e.target.closest('[data-qt]')) { foto = null; archivo = null; preview = null; pintar(); } });
    $('#m-file').addEventListener('change', e => { const f = e.target.files[0]; if (f) { archivo = f; preview = URL.createObjectURL(f); pintar(); } e.target.value = ''; });
    m.onclick = e => { if (e.target.closest('[data-cerrar]') || e.target === m) m.close(); };
    $('#fm').addEventListener('submit', async e => {
      e.preventDefault();
      const nombre = $('#m-nombre').value.trim(); if (!nombre) { toast('Escribe el nombre', 'err'); return; }
      const btn = $('#guardar'); btn.disabled = true; btn.textContent = 'Guardando…';
      try {
        let url = foto;
        if (archivo) url = await subir('medallas', 'fotos', archivo);
        const datos = { nombre, significado: $('#m-sig').value.trim() || null, foto: url };
        if (x) { const { error } = await sb.from('medallas').update(datos).eq('id', x.id); if (error) throw error; }
        else { const { error } = await sb.from('medallas').insert({ ...datos, orden: S.meds.length + 1 }); if (error) throw error; }
        if (x?.foto && x.foto !== url && esStorage(x.foto, 'medallas')) await sb.storage.from('medallas').remove([rutaStorage(x.foto, 'medallas')]);
        m.close(); toast('Medalla guardada'); refrescar();
      } catch (er) { fallo(er, 'guardar la medalla'); btn.disabled = false; btn.textContent = 'Guardar'; }
    });
    m.showModal();
  }

  /* ---------- Arranque ---------- */
  try { await cargar(); shell(); vista(); }
  catch (e) {
    console.error(e);
    app.innerHTML = `<div class="pempty"><h2 class="h2">No pudimos <em>cargar</em></h2><p class="muted">${esc(e.message || 'Error desconocido')}. ¿Ya se corrió <code>supabase-setup.sql</code>?</p></div>`;
  }
})();
