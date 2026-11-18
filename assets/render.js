(() => {
  const root = document.querySelector('#site');
  const preview = location.hash === '#editor-preview' && window.parent !== window;
  const node = (tag, cls, value) => {
    const element = document.createElement(tag);
    if (cls) element.className = cls;
    if (value) element.textContent = value;
    return element;
  };
  function add(parent, tag, cls, value) {
    if (!value) return;
    const element = node(tag, cls, value);
    parent.append(element);
    return element;
  }
  function link(parent, label, href, cls) {
    if (!label || !href) return;
    const a = node('a', cls, label);
    a.href = href;
    if (href.startsWith('https://wa.me/')) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    parent.append(a);
    return a;
  }
  function render(data) {
    root.replaceChildren();
    document.title = data.title || 'Portfolio';
    document.documentElement.lang = data.language || 'en';
    const meta = document.querySelector('meta[name="description"]') || node('meta');
    meta.name = 'description';
    meta.content = data.description || '';
    document.head.append(meta);
    for (const key of ['board', 'deep', 'ink', 'lime', 'pink', 'paper']) {
      document.documentElement.style.setProperty('--' + key, data.theme?.[key] || '');
    }
    for (const [key, property] of [['displayFont', '--display'], ['handFont', '--hand'], ['bodyFont', '--body']]) {
      const value = data.theme?.[key]?.replace(/[^\p{L}\d -]/gu, '');
      document.documentElement.style.setProperty(property, value ? JSON.stringify(value) : '');
    }
    const sections = data.sections || [];
    const digits = (data.phone || '').replace(/\D/g, '');
    const whatsapp = /^\d{7,15}$/.test(digits) ? 'https://wa.me/' + digits + (data.message ? '?text=' + encodeURIComponent(data.message) : '') : '';
    const header = node('header', 'header');
    if (data.brand || data.brandNote || data.brandMark) {
      const brand = node('a', 'brand');
      brand.href = './';
      add(brand, 'span', 'brand-mark', data.brandMark)?.setAttribute('aria-hidden', 'true');
      if (!data.brand && !data.brandNote) brand.setAttribute('aria-label', 'Home');
      const names = node('span');
      add(names, 'b', '', data.brand);
      add(names, 'small', '', data.brandNote);
      brand.append(names);
      header.append(brand);
    }
    const nav = node('nav');
    nav.setAttribute('aria-label', 'Main navigation');
    for (const section of sections) {
      link(nav, section.nav, section.id && '#' + encodeURIComponent(section.id));
    }
    link(nav, data.contactLabel, whatsapp, 'nav-contact');
    if (nav.childElementCount) header.append(nav);
    if (header.childElementCount) root.append(header);
    const main = node('main');
    let hasHeading = false;
    for (const section of sections) {
      const type = ['hero', 'cards', 'cta'].includes(section.type) ? section.type : 'text';
      const area = node('section', 'section ' + type);
      if (section.id) area.id = section.id;
      const styles = ['features', 'tiles', 'checklist', 'timeline', 'steps'];
      const defaultStyles = { approach: 'features', subjects: 'tiles', benefits: 'checklist', lesson: 'timeline', 'first-lesson': 'steps' };
      const presentation = section.presentation ?? defaultStyles[section.id];
      if (styles.includes(presentation)) area.className += ' ' + presentation;
      const copy = node('div', 'copy');
      add(copy, 'p', 'eyebrow', section.label);
      if (section.heading) {
        add(copy, hasHeading ? 'h2' : 'h1', '', section.heading);
        hasHeading = true;
      }
      add(copy, 'p', 'highlight', section.highlight);
      add(copy, 'p', 'body', section.body);
      const actions = node('div', 'actions');
      link(actions, section.action, whatsapp, 'button');
      if (sections.some(item => item.id && item.id === section.target)) {
        link(actions, section.secondary, '#' + encodeURIComponent(section.target), 'secondary');
      }
      if (actions.childElementCount) copy.append(actions);
      if (copy.childElementCount) area.append(copy);
      if (section.image && /^(https?:\/\/|\.\.?\/|[\w-]|data:image\/(?:png|jpeg|webp|gif|avif);base64,)/i.test(section.image)) {
        const picture = node('figure', 'portrait');
        const img = node('img');
        img.src = section.image;
        img.alt = section.imageAlt || '';
        picture.append(img);
        add(picture, 'figcaption', 'note', section.note);
        area.append(picture);
      } else {
        add(area, 'p', 'note', section.note);
      }
      if (section.cards?.length) {
        const ordered = presentation === 'timeline' || presentation === 'steps';
        const grid = node(ordered ? 'ol' : 'ul', 'cards-grid');
        grid.setAttribute('role', 'list');
        for (const card of section.cards) {
          const item = node('li', 'paper');
          if (/^#[\da-f]{6}$/i.test(card.color || '')) item.style.setProperty('--card', card.color);
          add(item, 'span', 'symbol', card.symbol);
          add(item, hasHeading ? 'h3' : 'h2', '', card.heading);
          add(item, 'p', '', card.body);
          if (item.childElementCount) grid.append(item);
        }
        if (grid.childElementCount) area.append(grid);
      }
      if (area.childElementCount) main.append(area);
    }
    root.append(main);
    if (data.footer) add(root, 'footer', 'footer', data.footer);
  }
  if (preview) {
    window.addEventListener('message', event => {
      if (event.source === window.parent && event.data?.type === 'portfolio-content') render(event.data.content);
    });
  } else {
    fetch('./assets/content.json').then(response => {
      if (!response.ok) throw Error('Content unavailable');
      return response.json();
    }).then(render).catch(() => {
      root.textContent = 'The portfolio could not load. Please refresh or open it through a web server.';
    });
  }
})();
