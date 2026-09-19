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

  // Preencha com o número comercial, incluindo país e DDD, para abrir o pedido no WhatsApp.
  const whatsappNumber = '';
  const button = form.querySelector('[data-contact-button]');
  const status = form.querySelector('#form-status');
  if (whatsappNumber) button.firstChild.textContent = 'Continuar pelo WhatsApp ';

  const formatDate = value => {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  };

  const copyMessage = async message => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(message);
        return true;
      } catch (_) {}
    }
    const temporary = document.createElement('textarea');
    temporary.value = message;
    temporary.setAttribute('readonly', '');
    temporary.style.position = 'fixed';
    temporary.style.opacity = '0';
    document.body.appendChild(temporary);
    temporary.select();
    const copied = document.execCommand('copy');
    temporary.remove();
    return copied;
  };

  form.addEventListener('submit', async event => {
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
      'Olá, Xanda! Gostaria de fazer uma encomenda.',
      '',
      `Nome: ${name}`,
      ...(phone ? [`Telefone: ${phone}`] : []),
      `Produto: ${product}`,
      ...(date ? [`Data desejada: ${date}`] : []),
      `Detalhes: ${details}`
    ];
    const message = lines.join('\n');

    if (whatsappNumber) {
      window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      return;
    }

    try {
      const copied = await copyMessage(message);
      if (copied) {
        status.textContent = 'Mensagem copiada! Agora você pode enviá-la para a Xanda pelo seu canal de contato.';
      } else {
        throw new Error('Cópia indisponível');
      }
    } catch (_) {
      let draft = form.querySelector('.message-draft');
      if (!draft) {
        draft = document.createElement('textarea');
        draft.className = 'message-draft';
        draft.setAttribute('aria-label', 'Mensagem do pedido para copiar');
        draft.readOnly = true;
        form.appendChild(draft);
      }
      draft.value = message;
      draft.focus();
      draft.select();
      status.textContent = 'Selecione e copie a mensagem exibida abaixo para enviar à Xanda.';
    }
  });
})();
