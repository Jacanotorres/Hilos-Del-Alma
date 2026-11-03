/* Cabecera, pie y botón flotante de WhatsApp compartidos por todas las páginas. */
(function () {
  const page = document.body.dataset.page || '';
  const NAV = [
    ['index.html', 'Inicio', 'inicio'],
    ['coleccion.html', 'Colección', 'coleccion'],
    ['personalizados.html', 'Personalizados', 'personalizados'],
    ['nosotras.html', 'Nosotras', 'nosotras'],
    ['contacto.html', 'Contacto', 'contacto']
  ];
  const links = NAV.map(([href, label, id]) =>
    `<a href="${href}"${id === page ? ' class="is-active" aria-current="page"' : ''}>${label}</a>`).join('');

  const header = `
  <header class="site-header" id="top">
    <div class="wrap site-header__in">
      <a class="brand" href="index.html" aria-label="${SITE.nombre} · inicio">
        <img src="assets/img/logo.webp" alt="" width="56" height="62">
        <span class="brand__name">Hilos <i>del</i> Alma</span>
      </a>
      <nav class="nav" id="nav" aria-label="Principal">
        ${links}
        <a class="btn btn--ghost btn--sm nav__login" href="login.html">${Art.icon('user', 18)} <span>Ingresar</span></a>
        <a class="btn btn--sm nav__cta" href="${waLink('Hola Hilos del Alma, quiero información.')}" target="_blank" rel="noopener">${Art.icon('wa', 18)} <span>WhatsApp</span></a>
      </nav>
      <button class="burger" id="burger" aria-label="Abrir menú" aria-expanded="false" aria-controls="nav"><i></i><i></i></button>
    </div>
  </header>`;

  const footer = `
  <footer class="site-footer">
    <div class="wrap site-footer__grid">
      <div class="site-footer__brand">
        <img src="assets/img/logo.webp" alt="${SITE.nombre}" width="150" height="166" loading="lazy">
      </div>
      <div>
        <h4>Explora</h4>
        <ul class="flist">${NAV.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h4>Escríbenos</h4>
        <ul class="flist">
          <li>${Art.icon('wa', 18)}<a href="${waLink()}" target="_blank" rel="noopener">${SITE.telefono}</a></li>
          ${SITE.instagram ? `<li>${Art.icon('insta', 18)}<a href="https://www.instagram.com/${SITE.instagram}/" target="_blank" rel="noopener">@${SITE.instagram}</a></li>` : ''}
          ${SITE.correo ? `<li>${Art.icon('mail', 18)}<a href="mailto:${SITE.correo}">${SITE.correo}</a></li>` : ''}
          ${SITE.ciudad ? `<li>${Art.icon('pin', 18)}<span>${SITE.ciudad}</span></li>` : ''}
          ${SITE.horario ? `<li>${Art.icon('clock', 18)}<span>${SITE.horario}</span></li>` : ''}
        </ul>
      </div>
    </div>
    <div class="wrap site-footer__bar">
      <span>© ${new Date().getFullYear()} ${SITE.nombre} · ${SITE.slogan}</span>
      <span><a href="login.html">Ingresar al panel</a> · <a href="#top">Volver arriba ↑</a></span>
    </div>
  </footer>
  <a class="wa-float" href="${waLink('Hola Hilos del Alma, quiero información.')}" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">${Art.icon('wa', 26)}</a>`;

  document.body.insertAdjacentHTML('afterbegin', header);
  document.body.insertAdjacentHTML('beforeend', footer);

  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const close = () => { nav.classList.remove('is-open'); burger.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); document.body.classList.remove('no-scroll'); };
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    document.body.classList.toggle('no-scroll', open);
  });
  nav.addEventListener('click', e => { if (e.target.closest('a')) close(); });
  const onScroll = () => document.querySelector('.site-header').classList.toggle('is-stuck', window.scrollY > 10);
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
})();
