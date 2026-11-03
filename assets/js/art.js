/* Iconos de línea fina y pequeñas ilustraciones, todo en SVG para no depender de librerías. */
const Art = (() => {
  const P = {
    wa: '<path d="M3 21l1.6-4.6A8.5 8.5 0 1 1 8 19.6L3 21z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1.3-1.6-2-1-1 .7c-1-.4-1.9-1.3-2.4-2.4l.7-1-1-2L9 8.5z"/>',
    insta: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    phone: '<path d="M5 4h4l1.5 4-2 1.3a11 11 0 0 0 5.2 5.2L15 12.5l4 1.5v4a1.5 1.5 0 0 1-1.6 1.5A14.5 14.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
    leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14"/><path d="M5 19c2.5-4 5.5-7 9-9"/>',
    hands: '<path d="M12 20c-4-2.5-7-5-7-8.5a3.5 3.5 0 0 1 7-1 3.5 3.5 0 0 1 7 1c0 3.5-3 6-7 8.5z"/><path d="M12 4v3M8.5 5.5 9.7 7.7M15.5 5.5 14.3 7.7"/>',
    gift: '<rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M12 9v11M3.5 13h17M12 9c-3-.2-4.5-1.3-4.5-2.8S9.8 4 12 9zm0 0c3-.2 4.5-1.3 4.5-2.8S14.2 4 12 9z"/>',
    cross: '<path d="M12 3v18M7 9h10"/>',
    send: '<path d="M4 12 20 4l-4 16-4.5-6.5L4 12z"/><path d="M11.5 13.5 20 4"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7.5" cy="17.5" r="1.7"/><circle cx="17" cy="17.5" r="1.7"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };
  const icon = (name, size = 22, sw = 1.4) =>
    `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;

  const sparkle = (cls = '') =>
    `<svg class="sparkle ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C12.8 7 17 11.2 24 12 17 12.8 12.8 17 12 24 11.2 17 7 12.8 0 12 7 11.2 11.2 7 12 0z" fill="currentColor"/></svg>`;

  /* Rosario en línea fina, para la categoría que aún no tiene foto. */
  const rosario = () => {
    const beads = Array.from({ length: 18 }, (_, i) => {
      const a = (i / 18) * Math.PI * 2 - Math.PI / 2;
      const big = i % 6 === 0;
      return `<circle cx="${100 + 58 * Math.cos(a)}" cy="${86 + 58 * Math.sin(a)}" r="${big ? 5.2 : 3.4}" fill="${big ? '#e8bdb0' : '#fbf6ee'}" stroke="#5e3b29" stroke-width="1.2"/>`;
    }).join('');
    return `<svg viewBox="0 0 200 250" class="art-rosario" aria-hidden="true">
      <circle cx="100" cy="86" r="58" fill="none" stroke="#b98e4a" stroke-width=".7" stroke-dasharray="1 4"/>
      ${beads}
      <path d="M100 144v32" stroke="#5e3b29" stroke-width="1.2"/>
      <circle cx="100" cy="150" r="4" fill="#fbf6ee" stroke="#5e3b29" stroke-width="1.2"/>
      <circle cx="100" cy="164" r="3.4" fill="#fbf6ee" stroke="#5e3b29" stroke-width="1.2"/>
      <path d="M100 178v44M86 191h28" stroke="#5e3b29" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M96 222l4 8 4-8" fill="none" stroke="#5e3b29" stroke-width="1.2"/>
    </svg>`;
  };

  /* Ilustración suave para categorías que aún no tienen foto. */
  const generico = () => `<svg viewBox="0 0 200 250" class="art-rosario" aria-hidden="true">
      <circle cx="100" cy="115" r="58" fill="none" stroke="#b98e4a" stroke-width=".7" stroke-dasharray="1 4"/>
      <circle cx="100" cy="115" r="38" fill="none" stroke="#5e3b29" stroke-width="1.1"/>
      <path d="M100 135s-18-10.5-18-24a10 10 0 0 1 18-6 10 10 0 0 1 18 6c0 13.500-18 24-18 24z" fill="#e8bdb0" stroke="#5e3b29" stroke-width="1.2"/>
      <path d="M100 38v10M100 182v10M30 115h10M160 115h10" stroke="#b98e4a" stroke-width="1.2" stroke-linecap="round"/>
    </svg>`;

  return { icon, sparkle, rosario, generico };
})();
