/*
 * Tema Preciosa Aroma e Arte para Loja Integrada.
 * Age nas páginas de vitrine (início, categoria, busca, produto, páginas institucionais),
 * no carrinho, no login/cadastro e em Minha conta, só no visual.
 * Checkout, pagamento e confirmação de pedido ficam intocados: o script sai antes de qualquer coisa.
 * Não lê formulários, não guarda dados e não chama nenhum serviço externo.
 */
(function () {
  'use strict';
  // se o tema for colado duas vezes (ou carregado pelo painel e por outro lugar), só a primeira cópia age
  if (window.pzTemaAtivo) return;
  window.pzTemaAtivo = true;

  var CONFIG = {
    whatsapp: '5547988157179',
    mostrarBannerDaLoja: false, // true volta a exibir o banner cadastrado no painel, abaixo do novo topo
    heroProduto: {
      nome: 'Conjunto Difusor de Aromas e Bandeja',
      url: '/none-90741978',
      imagem: 'https://cdn.awsli.com.br/1000x1000/1717/1717512/produto/90741978/defb31bce6.jpg'
    },
    colecoes: [
      { nome: 'Conjuntos para lavabo e banheiro', url: '/conjunto-para-lavabo-ou-banheiro', imagem: '135535827/56b5079b7a.jpg' },
      { nome: 'Bandejas espelhadas', url: '/bandeja-espelhada', imagem: '85830310/455ba7d9e4.jpg' },
      { nome: 'Aromas', url: '/aromas', imagem: '153255167/-gua-perfumada-para-tecidos-ug46tz9r77.png' },
      { nome: 'Vidros decorados', url: '/saboneteira', imagem: '147619461/651754e87c.jpg' }
    ]
  };

  var CDN = 'https://cdn.awsli.com.br/';
  // checkout, pagamento e confirmação de pedido ficam intocados; carrinho e /conta/* recebem só o visual
  var PATH_BLOQUEADO = /^\/(checkout|pedido|pagamento)(\/|$)/i;
  var PAGINAS = ['pagina-inicial', 'pagina-categoria', 'pagina-busca', 'pagina-produto', 'pagina-pagina', 'pagina-marca', 'pagina-carrinho', 'pagina-login', 'pagina-cadastro'];

  function paginaPermitida() {
    if (PATH_BLOQUEADO.test(location.pathname)) return false;
    // área do cliente (Minha conta, pedidos, endereços, favoritos): decide pelo caminho, as classes variam
    if (/^\/conta(\/|$)/i.test(location.pathname)) return true;
    var cls = document.body.className;
    for (var i = 0; i < PAGINAS.length; i++) if (cls.indexOf(PAGINAS[i]) !== -1) return true;
    // página de erro (404) vem sem classe "pagina-*"; o caminho já passou pelo filtro das áreas protegidas acima
    return !/(^|\s)pagina-/.test(cls);
  }

  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  // só aceita endereço da própria loja (começando com /) ou do CDN da Loja Integrada
  function urlSegura(u) {
    u = String(u);
    return (/^\/(?!\/)/.test(u) || u.indexOf(CDN) === 0) ? esc(u) : '#';
  }

  function linkWhats(texto) {
    return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(texto);
  }

  var reduzMovimento = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Cabeçalho: sombra ao rolar (a barra sempre fica visível) ---------- */
  function cabecalho() {
    var header = document.querySelector('.conteiner-principal > header');
    if (!header) return;
    header.classList.add('pz-header');
    var tick = false;
    function atualiza() {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      tick = false;
    }
    window.addEventListener('scroll', function () {
      if (!tick) { tick = true; requestAnimationFrame(atualiza); }
    }, { passive: true });
    atualiza();
  }

  /* ---------- Fotos dos produtos em resolução maior (o CDN entrega 300px por padrão) ---------- */
  function fotosNitidas(raiz) {
    var imgs = (raiz || document).querySelectorAll('.listagem-item img.imagem-principal');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      if (img.dataset.pzHd) continue;
      img.dataset.pzHd = '1';
      // a plataforma troca pela 2ª foto do produto no hover; a foto do card fica fixa (o CSS também esconde a 2ª)
      img.removeAttribute('data-imagem-caminho');
      if (window.jQuery) jQuery(img).removeData('imagem-caminho');
      marcaFormato(img);
      var src = img.getAttribute('src') || '';
      if (src.indexOf('/300x300/') === -1) continue;
      img.setAttribute('srcset', src + ' 300w, ' + src.replace('/300x300/', '/600x600/') + ' 600w');
      img.setAttribute('sizes', '(max-width: 767px) 100vw, 300px');
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
    }
  }

  // foto em pé ganha a classe pz-retrato: o CSS a ajusta pela altura (as deitadas e quadradas, pela largura),
  // assim ela ocupa o quadro todo sem cortar e o arredondado continua acompanhando a própria foto
  function marcaFormato(img) {
    function aplica() { if (img.naturalWidth) img.classList.toggle('pz-retrato', img.naturalHeight > img.naturalWidth); }
    if (img.complete) aplica();
    img.addEventListener('load', aplica);
  }

  /* ---------- Página inicial ---------- */
  function precoDaVitrine(nome) {
    var itens = document.querySelectorAll('.listagem-item');
    for (var i = 0; i < itens.length; i++) {
      var n = itens[i].querySelector('.nome-produto');
      if (n && n.textContent.trim().toLowerCase() === nome.toLowerCase()) {
        var p = itens[i].querySelector('.preco-promocional, .preco-venda');
        return p ? p.textContent.trim() : '';
      }
    }
    return '';
  }

  function hero() {
    var p = CONFIG.heroProduto;
    var preco = precoDaVitrine(p.nome);
    var sec = el('section', { 'class': 'pz-hero', 'aria-labelledby': 'pz-hero-title' },
      '<div class="pz-hero__text">' +
        '<svg class="pz-smoke" viewBox="0 0 120 260" aria-hidden="true" focusable="false">' +
          '<path class="pz-smoke__a" d="M60 258 C 40 220, 82 196, 62 160 S 34 104, 60 70 S 84 22, 64 2"/>' +
          '<path class="pz-smoke__b" d="M66 258 C 88 226, 50 200, 70 168 S 96 116, 72 84 S 50 40, 70 12"/>' +
        '</svg>' +
        '<h2 id="pz-hero-title" class="pz-hero__title">Artesanato de luxo, feito à mão para perfumar e vestir a casa</h2>' +
        '<p class="pz-hero__lead">Saboneteiras, aromatizadores, bandejas espelhadas e cachepots customizados peça por peça, com refis preparados artesanalmente.</p>' +
        '<div class="pz-hero__actions">' +
          '<a class="pz-btn pz-btn--light" href="#pz-colecoes">Ver a coleção</a>' +
          '<a class="pz-btn pz-btn--ghost" href="' + linkWhats('Olá! Vim do site e quero encomendar uma peça.') + '" target="_blank" rel="noopener">Encomendar pelo WhatsApp</a>' +
        '</div>' +
      '</div>' +
      '<figure class="pz-hero__media">' +
        '<img src="' + urlSegura(p.imagem) + '" alt="' + esc(p.nome) + ': difusor preto com pingente dourado sobre bandeja espelhada" width="1000" height="1000" fetchpriority="high" decoding="async">' +
        '<figcaption><a href="' + urlSegura(p.url) + '"><span class="pz-hero__name">' + esc(p.nome) + '</span>' +
          (preco ? '<span class="pz-hero__price">' + esc(preco) + '</span>' : '') + '</a></figcaption>' +
      '</figure>');
    return sec;
  }

  function colecoes() {
    var tiles = CONFIG.colecoes.map(function (c, i) {
      return '<li class="pz-tile pz-tile--' + (i + 1) + (c.inteira ? ' pz-tile--contain' : '') + '">' +
        '<a href="' + urlSegura(c.url) + '">' +
          '<span class="pz-tile__img"><img src="' + urlSegura(CDN + '600x600/1717/1717512/produto/' + c.imagem) + '" alt="" loading="lazy" decoding="async" width="600" height="600"></span>' +
          '<span class="pz-tile__name">' + esc(c.nome) + '</span>' +
        '</a></li>';
    }).join('');
    return el('section', { 'class': 'pz-colecoes pz-reveal', id: 'pz-colecoes', 'aria-labelledby': 'pz-colecoes-title' },
      '<header class="pz-section-head">' +
        '<h2 id="pz-colecoes-title">Para cada canto da casa</h2>' +
        '<a class="pz-link" href="/decoracao-e-utilidades">Ver tudo</a>' +
      '</header>' +
      '<ul class="pz-tiles">' + tiles + '</ul>');
  }

  function identidadeOlfativa() {
    return el('section', { 'class': 'pz-olfativa pz-reveal', 'aria-labelledby': 'pz-olfativa-title' },
      '<div class="pz-olfativa__inner">' +
        '<h2 id="pz-olfativa-title">Identidade olfativa para o seu espaço</h2>' +
        '<div class="pz-olfativa__body">' +
          '<p>Para ambientes comerciais e residenciais, desenvolvemos um aroma próprio e preparamos à mão os refis de aromatizador e a água perfumada para tecidos. Aconchego e bem-estar para quem passa ou convive ali.</p>' +
          '<a class="pz-btn pz-btn--light" href="' + linkWhats('Olá! Quero saber sobre a identidade olfativa para o meu espaço.') + '" target="_blank" rel="noopener">Conversar sobre o meu espaço</a>' +
        '</div>' +
      '</div>');
  }

  function paginaInicial() {
    if (document.body.className.indexOf('pagina-inicial') === -1) return;
    var banners = document.querySelector('.secao-banners');
    var corpo = document.querySelector('#corpo .conteiner');
    if (!corpo) return;

    var h = hero();
    if (banners) {
      banners.parentNode.insertBefore(h, banners);
      if (!CONFIG.mostrarBannerDaLoja) banners.classList.add('pz-oculto');
    } else {
      corpo.parentNode.parentNode.insertBefore(h, corpo.parentNode);
    }

    corpo.insertBefore(colecoes(), corpo.firstChild);
    var principal = corpo.querySelector('.secao-principal');
    var olf = identidadeOlfativa();
    if (principal && principal.nextSibling) corpo.insertBefore(olf, principal.nextSibling);
    else corpo.appendChild(olf);

    // título da vitrine com o mesmo desenho dos outros títulos
    var tit = document.querySelector('.titulo-categoria.vitrine-destaque');
    if (tit) tit.classList.add('pz-vitrine-title');

  }

  /* ---------- Revelação leve das seções novas ---------- */
  function revelar() {
    var alvos = document.querySelectorAll('.pz-reveal');
    if (reduzMovimento || !('IntersectionObserver' in window)) {
      for (var i = 0; i < alvos.length; i++) alvos[i].classList.add('is-in');
      return;
    }
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    for (var j = 0; j < alvos.length; j++) io.observe(alvos[j]);
  }

  /* ---------- Setas dos carrosséis na linha do título ----------
     O carrossel da plataforma cria as setas depois do carregamento. Elas são movidas (não copiadas)
     para dentro do título: continuam sendo os mesmos botões, com o clique original. */
  function setasNoTitulo(raiz) {
    var navs = (raiz || document).querySelectorAll('.listagem .flexslider > .flex-direction-nav');
    for (var i = 0; i < navs.length; i++) {
      var lista = navs[i].closest('ul.produtos-carrossel');
      var titulo = lista && lista.previousElementSibling;
      if (!titulo || !titulo.classList.contains('titulo-categoria')) continue;
      titulo.classList.add('pz-com-setas');
      titulo.appendChild(navs[i]);
      var setas = navs[i].querySelectorAll('a');
      // no celular o carrossel do tema reage ao "touchend" e cancela o clique; por isso a seta escuta os dois
      for (var k = 0; k < setas.length; k++) {
        setas[k].addEventListener('touchend', setaRolaFaixa, true);
        setas[k].addEventListener('click', setaRolaFaixa, true);
      }
    }
  }

  /* ---------- Miniaturas do produto: o tema carrega 64×50; troca por 200×200 (o CDN mantém a proporção) ---------- */
  function miniaturasNitidas() {
    var imgs = document.querySelectorAll('.pagina-produto :is(.thumbs-vertical, .thumbs-horizontal) img');
    for (var i = 0; i < imgs.length; i++) {
      var src = imgs[i].getAttribute('src') || '';
      if (/\/64x50\//.test(src)) imgs[i].setAttribute('src', src.replace('/64x50/', '/200x200/'));
    }
  }

  /* ---------- Carrossel no celular: um card por vez com rolagem nativa (ver CSS) ----------
     As setas passam a rolar a faixa, e o toque não é repassado ao carrossel do tema,
     que tentaria mover a lista ao mesmo tempo que o dedo. */
  var celular = window.matchMedia ? matchMedia('(max-width: 767px)') : { matches: false };
  function carrosselNativo() {
    var faixas = document.querySelectorAll('.listagem .flexslider > .flex-viewport');
    for (var i = 0; i < faixas.length; i++) {
      var faixa = faixas[i];
      if (faixa.dataset.pzNativo) continue;
      faixa.dataset.pzNativo = '1';
      ['touchstart', 'touchmove', 'touchend'].forEach(function (tipo) {
        faixa.addEventListener(tipo, function (e) { if (celular.matches) e.stopPropagation(); }, { capture: true, passive: true });
      });
    }
  }
  function setaRolaFaixa(e) {
    if (!celular.matches) return; // no computador o carrossel do tema continua no comando
    var titulo = e.currentTarget.closest('.titulo-categoria');
    var lista = titulo && titulo.nextElementSibling;
    var faixa = lista && lista.querySelector('.flex-viewport');
    if (!faixa) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    // vai direto ao card seguinte/anterior (posição exata), em vez de "andar X pixels" a partir de onde está;
    // o encaixe é desligado durante a animação: no iPhone ele brigava com a rolagem e parava no meio de dois cards
    var cards = faixa.querySelectorAll('ul > li:not(.clone)');
    if (!cards.length) return;
    // posição de encaixe de cada card medida como o navegador mede (borda do card × borda interna da faixa),
    // para o destino da seta e o encaixe darem o mesmo número e não haver "pulo" no fim
    var borda = faixa.getBoundingClientRect().left + faixa.clientLeft + (parseFloat(getComputedStyle(faixa).scrollPaddingLeft) || 0);
    function posicao(card) { return Math.round(card.getBoundingClientRect().left - borda + faixa.scrollLeft); }
    var atual = 0, menor = Infinity;
    for (var i = 0; i < cards.length; i++) {
      var d = Math.abs(posicao(cards[i]) - faixa.scrollLeft);
      if (d < menor) { menor = d; atual = i; }
    }
    var alvo = Math.max(0, Math.min(cards.length - 1, atual + (e.currentTarget.classList.contains('flex-prev') ? -1 : 1)));
    var destino = Math.max(0, Math.min(posicao(cards[alvo]), faixa.scrollWidth - faixa.clientWidth));
    // o encaixe fica desligado só durante a animação (no iPhone ele brigava com ela) e volta quando a rolagem termina
    faixa.style.scrollSnapType = 'none';
    clearTimeout(faixa.pzEncaixe);
    var parado = 0, ultimo = -1;
    function confere() {
      if (Math.abs(faixa.scrollLeft - destino) < 1 || (faixa.scrollLeft === ultimo && ++parado > 3)) {
        faixa.style.scrollSnapType = '';
        return;
      }
      if (faixa.scrollLeft !== ultimo) parado = 0;
      ultimo = faixa.scrollLeft;
      faixa.pzEncaixe = setTimeout(confere, 50);
    }
    faixa.scrollTo({ left: destino, behavior: reduzMovimento ? 'auto' : 'smooth' });
    faixa.pzEncaixe = setTimeout(confere, 50);
  }

  /* ---------- Botão do menu (celular): ícone padrão de 3 traços iguais e nome para leitores de tela ---------- */
  function botaoMenu() {
    var b = document.querySelector('.menu-trigger');
    if (!b || b.querySelector('.pz-burger')) return;
    if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', 'Abrir menu');
    b.insertAdjacentHTML('beforeend', '<svg class="pz-burger" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h16"/></svg>');
  }

  /* ---------- Menu do celular: item sem página própria ("Páginas") abre os subitens ao tocar no nome ----------
     O link desses itens não leva a lugar nenhum; só a setinha ao lado abria a lista. */
  function menuItemSemPagina() {
    document.addEventListener('click', function (e) {
      if (!celular.matches) return;
      var a = e.target.closest && e.target.closest('li.com-filho > a[href^="javascript"]');
      var bt = a && a.parentElement.querySelector(':scope > .menu-dropdown-toggle');
      if (!bt) return;
      e.preventDefault();
      bt.click();
    });
  }

  /* ---------- Foto do produto: sem lupa no hover; amplia só ao clicar ou tocar ----------
     A lupa da plataforma (ImageZoom) é desligada só no hover: a instância continua, porque a troca
     de foto pelas miniaturas passa por ela. O clique abre a galeria ampliada da própria plataforma. */
  function zoomSoNoClique() {
    var foto = document.getElementById('imagemProduto');
    if (!foto) return;
    if (window.jQuery) jQuery(foto).off('mouseover.zoompro');
    if (foto.dataset.pzZoom) return;
    foto.dataset.pzZoom = '1';
    // no computador a plataforma já abre a galeria no clique; no celular não abria
    foto.addEventListener('click', function () {
      if (!celular.matches) return;
      var abre = document.getElementById('abreZoom');
      if (abre) abre.click();
    });
  }

  /* ---------- Janelas da plataforma (galeria de fotos, carrinho, avisos): a animação fica com o CSS ----------
     A animação própria da plataforma (crescer a partir do clique, em JavaScript) dava trancos; sem ela,
     o CSS faz uma entrada suave e igual em todas as janelas. */
  function janelasSuaves() {
    var fb = window.jQuery && jQuery.fancybox;
    if (!fb || !fb.defaults || fb.defaults.pzSuave) return;
    jQuery.extend(fb.defaults, { openEffect: 'none', closeEffect: 'none', nextEffect: 'none', prevEffect: 'none' });
    fb.defaults.pzSuave = true;
    // entrada suave só ao abrir; trocar de foto não anima
    var raiz = document.documentElement, t;
    function marca(classe) {
      raiz.classList.remove('pz-abrindo');
      void raiz.offsetWidth;
      raiz.classList.add(classe);
      clearTimeout(t); t = setTimeout(function () { raiz.classList.remove(classe); }, 700);
    }
    var abre = fb.open;
    // a galeria do produto passa os próprios efeitos (fade); aqui eles são trocados por nenhum em toda abertura
    var semEfeito = { openEffect: 'none', closeEffect: 'none', nextEffect: 'none', prevEffect: 'none' };
    if (abre) fb.open = function (grupo, opcoes) { marca('pz-abrindo'); return abre.call(this, grupo, jQuery.extend({}, opcoes, semEfeito)); };
  }

  /* ---------- Número do carrinho: total de unidades, não de produtos diferentes ----------
     A plataforma conta produtos distintos (3 produtos com 1, 7 e 1 unidades mostravam "3"), então mudar
     a quantidade no carrinho não alterava o número. Aqui a soma usa os mesmos dados que a plataforma já
     buscou do carrinho (nenhum pedido novo ao servidor). */
  function somaUnidades(carrinho) {
    if (!carrinho || !carrinho.items || !carrinho.items.length) return null;
    var total = 0;
    for (var i = 0; i < carrinho.items.length; i++) total += parseInt(carrinho.items[i].quantity, 10) || 0;
    return total;
  }
  function mostraUnidades(total) {
    if (total == null) return;
    var alvos = document.querySelectorAll('.carrinho > a .qtd-carrinho');
    for (var i = 0; i < alvos.length; i++) alvos[i].textContent = String(total);
  }
  function contadorDeUnidades() {
    var original = window.atualizarCarrinhoAsync;
    if (typeof original !== 'function' || original.pzUnidades) return;
    var novo = function (carrinho) {
      var r = original.apply(this, arguments);
      mostraUnidades(somaUnidades(carrinho));
      return r;
    };
    novo.pzUnidades = true;
    window.atualizarCarrinhoAsync = novo;
    // a primeira atualização (com o carrinho guardado nesta aba) roda antes deste script
    try { mostraUnidades(somaUnidades(JSON.parse(sessionStorage.getItem('carrinho_minicart') || 'null'))); } catch (e) { /* sem acesso ao armazenamento: fica o número da plataforma */ }
  }

  /* ---------- Rodapé: crédito do design ---------- */
  function credito() {
    var rodape = document.getElementById('rodape');
    if (!rodape || rodape.querySelector('.pz-credito')) return;
    // no carrinho a plataforma usa um rodapé enxuto e claro, sem a faixa escura
    var claro = !rodape.querySelector('.institucional');
    var bloco = el('div', { 'class': 'pz-credito' + (claro ? ' pz-credito--claro' : '') },
      '<p>Remodelado por <a href="https://micio.dev/" target="_blank" rel="noopener">Mauricio Renato Sardá Filho</a>.' +
      ' <a href="https://www.instagram.com/micio_dev/" target="_blank" rel="noopener">Instagram</a>' +
      ' <a href="https://www.linkedin.com/in/mauricio-sarda-filho/" target="_blank" rel="noopener">LinkedIn</a></p>');
    var selos = rodape.querySelector('.pagamento-selos');
    if (selos && selos.nextSibling) rodape.insertBefore(bloco, selos.nextSibling);
    else rodape.appendChild(bloco);
  }

  function iniciar() {
    // o <head> já marca .pz cedo para evitar piscar o tema antigo; aqui confirma pela classe da página
    if (!paginaPermitida()) { document.documentElement.classList.remove('pz'); return; }
    document.documentElement.classList.add('pz');
    cabecalho();
    botaoMenu();
    menuItemSemPagina();
    paginaInicial();
    fotosNitidas();
    credito();
    revelar();
    setasNoTitulo();
    carrosselNativo();
    miniaturasNitidas();
    zoomSoNoClique();
    contadorDeUnidades();
    janelasSuaves();
    // a lupa é ligada pelo carrossel de miniaturas, às vezes depois deste script
    window.addEventListener('load', zoomSoNoClique);
    // vitrines e setas criadas depois (carrossel, "veja também") também são tratadas
    if ('MutationObserver' in window) {
      var corpo = document.getElementById('corpo');
      if (corpo) new MutationObserver(function () { fotosNitidas(corpo); setasNoTitulo(corpo); carrosselNativo(); miniaturasNitidas(); }).observe(corpo, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
