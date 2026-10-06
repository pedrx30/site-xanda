(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.site-nav');

  if (menuButton && menu) {
    const closeMenu = () => {
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Abrir menu');
      menu.classList.remove('is-open');
    };

    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
      menu.classList.toggle('is-open', !isOpen);
    });

    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        menuButton.focus();
      }
    });
    document.addEventListener('click', event => {
      if (!menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 780) closeMenu();
    });
  }

  document.querySelectorAll('.year').forEach(year => {
    year.textContent = new Date().getFullYear();
  });

  const revealElements = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealElements.forEach(element => element.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    revealElements.forEach(element => observer.observe(element));
  }

  document.querySelectorAll('.cake-carousel').forEach(carousel => {
    const frame = carousel.querySelector('.cake-frame');
    const photos = [...frame.querySelectorAll('.cake-photo')];
    const thumbs = [...carousel.querySelectorAll('.cake-thumb')];
    const strip = carousel.querySelector('.cake-thumbs');
    const counter = carousel.querySelector('.cake-counter');
    const play = carousel.querySelector('[data-cake-play]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let current = 0;
    let requested = 0;
    let revision = 0;
    let timer;
    let paused = reducedMotion.matches;
    let visible = !('IntersectionObserver' in window);
    let touching = false;
    let hovering = false;
    let focused = false;
    let pointerStart;

    carousel.querySelector('.cake-controls').hidden = false;
    strip.hidden = false;
    const updatePlayback = () => {
      play.classList.toggle('is-paused', paused);
      play.setAttribute('aria-pressed', String(paused));
      play.setAttribute('aria-label', paused ? 'Iniciar passagem automática' : 'Pausar passagem automática');
      counter.setAttribute('aria-live', paused ? 'polite' : 'off');
    };
    const schedule = () => {
      window.clearTimeout(timer);
      if (!paused && visible && !touching && !hovering && !focused && !document.hidden) {
        timer = window.setTimeout(() => show(current + 1), 3000);
      }
    };
    const show = async index => {
      window.clearTimeout(timer);
      requested = (index + thumbs.length) % thumbs.length;
      const target = requested;
      const request = ++revision;
      const incoming = photos.find(photo => !photo.classList.contains('is-active'));
      incoming.src = thumbs[target].dataset.cakeSrc;
      try {
        await incoming.decode();
      } catch {
        if (request === revision) schedule();
        return;
      }
      if (request !== revision) return;
      photos.forEach(photo => {
        const active = photo === incoming;
        photo.alt = active ? thumbs[target].dataset.cakeAlt : '';
        photo.setAttribute('aria-hidden', String(!active));
        photo.classList.toggle('is-active', active);
      });
      current = target;
      counter.textContent = `${String(current + 1).padStart(2, '0')} / ${thumbs.length}`;
      thumbs.forEach((thumb, i) => thumb.setAttribute('aria-pressed', String(i === current)));
      const selected = thumbs[current];
      strip.scrollTo({ left: selected.offsetLeft - (strip.clientWidth - selected.offsetWidth) / 2, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
      const nextPhoto = new Image();
      nextPhoto.src = thumbs[(current + 1) % thumbs.length].dataset.cakeSrc;
      schedule();
    };
    carousel.querySelector('[data-cake-prev]').addEventListener('click', () => show(requested - 1));
    carousel.querySelector('[data-cake-next]').addEventListener('click', () => show(requested + 1));
    thumbs.forEach((thumb, i) => thumb.addEventListener('click', () => show(i)));
    play.addEventListener('click', () => {
      paused = !paused;
      updatePlayback();
      schedule();
    });
    frame.addEventListener('keydown', event => {
      const actions = { ArrowLeft: requested - 1, ArrowRight: requested + 1, Home: 0, End: thumbs.length - 1 };
      if (event.key in actions) {
        event.preventDefault();
        show(actions[event.key]);
      }
    });
    frame.addEventListener('pointerdown', event => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      pointerStart = { x: event.clientX, y: event.clientY };
      touching = true;
      window.clearTimeout(timer);
      frame.setPointerCapture(event.pointerId);
    });
    const finishGesture = event => {
      if (!pointerStart) return;
      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;
      pointerStart = undefined;
      touching = false;
      if (event.type !== 'pointercancel' && Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        show(requested + (dx < 0 ? 1 : -1));
      } else schedule();
    };
    frame.addEventListener('pointerup', finishGesture);
    frame.addEventListener('pointercancel', finishGesture);
    carousel.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return;
      hovering = true;
      window.clearTimeout(timer);
    });
    carousel.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'mouse') return;
      hovering = false;
      schedule();
    });
    carousel.addEventListener('focusin', event => {
      focused = event.target !== play && event.target.matches(':focus-visible');
      schedule();
    });
    carousel.addEventListener('focusout', event => {
      focused = carousel.contains(event.relatedTarget) && event.relatedTarget !== play && event.relatedTarget.matches(':focus-visible');
      schedule();
    });
    document.addEventListener('visibilitychange', schedule);
    reducedMotion.addEventListener('change', () => {
      paused = reducedMotion.matches;
      updatePlayback();
      schedule();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        schedule();
      }, { threshold: 0.25 }).observe(frame);
    }
    const nextPhoto = new Image();
    nextPhoto.src = thumbs[1].dataset.cakeSrc;
    updatePlayback();
    schedule();
  });

  const form = document.querySelector('#pedido-form');
  if (!form) return;

  const productField = form.elements.produto;
  const dateField = form.elements.data;
  const today = new Date();
  dateField.min = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
  const requestedProduct = new URLSearchParams(window.location.search).get('produto');
  const productValues = { bolos: 'Bolos', doces: 'Doces', salgados: 'Salgados' };
  if (requestedProduct && productValues[requestedProduct]) {
    productField.value = productValues[requestedProduct];
  }

  const whatsappNumber = '5547997192457';
  const status = form.querySelector('#form-status');

  const formatDate = value => {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const name = String(data.get('nome') || '').trim();
    const phone = String(data.get('telefone') || '').trim();
    const product = String(data.get('produto') || '').trim();
    const date = formatDate(String(data.get('data') || ''));
    const details = String(data.get('mensagem') || '').trim();
    if (!name || !details) {
      status.textContent = 'Preencha seu nome e os detalhes da encomenda.';
      (!name ? form.elements.nome : form.elements.mensagem).focus();
      return;
    }
    const lines = [
      'Olá, Xanda! Gostaria de fazer um pedido.',
      '',
      `Nome: ${name}`,
      `Telefone: ${phone || 'Não informado'}`,
      `O que desejo: ${product}`,
      `Data desejada: ${date || 'Não informada'}`,
      `Detalhes da encomenda: ${details}`
    ];
    const message = lines.join('\n');
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    status.textContent = 'WhatsApp aberto com sua mensagem pronta.';
  });
})();
