/* ============================================================
   Brasa Burger — lógica do site
   cardápio · carrinho · checkout · entrega · rastreio
   Demonstração Geada Tech
   ============================================================ */
(() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const BRL = n => 'R$ ' + n.toFixed(2).replace('.', ',');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(k, f) { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} }
};

/* ============================================================
   DADOS
   ============================================================ */
const FREE_SHIP = 90;

const MENU = [
  { id: 'classico', img: 'img/menu-classico.jpg', cat: 'burgers', name: 'Brasa Clássico', price: 32,
    desc: 'Blend 180g, queijo prato, alface, tomate e molho da casa no brioche.',
    tags: ['mais pedido'], art: ['bun_bot', 'patty', 'cheese', 'tomato', 'lettuce', 'bun_top'] },
  { id: 'cheddar-duplo', img: 'img/menu-cheddar-duplo.jpg', cat: 'burgers', name: 'Cheddar Duplo', price: 45,
    desc: 'Dois blends de 160g, cheddar cremoso e cebola caramelizada no melado.',
    tags: ['hot'], art: ['bun_bot', 'patty', 'cheese', 'patty', 'cheese', 'onion', 'bun_top'] },
  { id: 'bacon-fume', img: 'img/menu-bacon-fume.jpg', cat: 'burgers', name: 'Bacon Fumê', price: 39,
    desc: 'Blend 180g, bacon em fatia grossa, cheddar e barbecue artesanal.',
    art: ['bun_bot', 'patty', 'cheese', 'bacon', 'onion', 'bun_top'] },
  { id: 'costela-bbq', img: 'img/menu-costela-bbq.jpg', cat: 'burgers', name: 'Costela BBQ', price: 47,
    desc: 'Costela desfiada em cocção de 12h, queijo prato e onion rings crocantes.',
    tags: ['novo'], art: ['bun_bot', 'patty', 'cheese', 'rings', 'bun_top'] },
  { id: 'crispy', img: 'img/menu-crispy.jpg', cat: 'burgers', name: 'Frango Crispy', price: 34,
    desc: 'Filé empanado na hora, muçarela, alface e maionese de limão siciliano.',
    art: ['bun_bot', 'patty', 'cheese', 'lettuce', 'bun_top'] },
  { id: 'veggie', img: 'img/menu-veggie.jpg', cat: 'burgers', name: 'Veggie da Brasa', price: 33,
    desc: 'Burger de grão-de-bico e beterraba, muçarela, rúcula e tomate assado.',
    tags: ['veg'], art: ['bun_bot', 'patty', 'cheese', 'tomato', 'lettuce', 'bun_top'] },
  { id: 'smash-trio', img: 'img/menu-smash-trio.jpg', cat: 'burgers', name: 'Smash Trio', price: 42,
    desc: 'Três smashes de 90g, queijo americano e picles em conserva da casa.',
    tags: ['hot'], art: ['bun_bot', 'patty', 'cheese', 'patty', 'cheese', 'patty', 'bun_top'] },
  { id: 'brasinha', img: 'img/menu-brasinha.jpg', cat: 'kids', name: 'Kids Brasinha', price: 24,
    desc: 'Blend 90g, queijo prato e uma porção pequena de fritas pra acompanhar.',
    art: ['bun_bot', 'patty', 'cheese', 'bun_top'] },
  { id: 'ovo-da-casa', img: 'img/menu-ovo-da-casa.jpg', cat: 'burgers', name: 'Brasa com Ovo', price: 37,
    desc: 'Blend 180g, ovo caipira frito na chapa, queijo prato e cebola roxa.',
    art: ['bun_bot', 'patty', 'cheese', 'egg', 'onion', 'bun_top'] }
];

const SIDES = [
  { id: 'fritas', name: 'Fritas rústicas', desc: 'porção 300g com páprica', price: 18, emoji: '🍟' },
  { id: 'fritas-cheddar', name: 'Fritas cheddar & bacon', desc: 'pra dividir (ou não)', price: 26, emoji: '🧆' },
  { id: 'onion', name: 'Onion rings', desc: '8 unidades empanadas na hora', price: 20, emoji: '🧅' },
  { id: 'nuggets', name: 'Nuggets da casa', desc: '10 unidades + molho', price: 19, emoji: '🍗' }
];
const DRINKS = [
  { id: 'coca', name: 'Coca-Cola 350ml', desc: 'lata bem gelada', price: 7, emoji: '🥤' },
  { id: 'guarana', name: 'Guaraná 350ml', desc: 'lata bem gelada', price: 7, emoji: '🥤' },
  { id: 'suco', name: 'Suco de laranja 500ml', desc: 'espremido na hora', price: 12, emoji: '🍊' },
  { id: 'ipa', name: 'Cerveja IPA artesanal', desc: 'long neck 355ml', price: 18, emoji: '🍺' },
  { id: 'milkshake', name: 'Milkshake Ovomaltine', desc: '400ml com calda', price: 22, emoji: '🥛' }
];

/* ingredientes do builder — id casa com as camadas 3D */
const BUILD_BASE = 26;
const ING = [
  { group: 'A base', items: [
    { id: 'bun_bottom', name: 'Pão brioche', price: 0, cm: 1.2, locked: true, emoji: '🍞' },
    { id: 'patty', name: 'Blend 180g', price: 0, cm: 1.1, locked: true, emoji: '🥩' },
    { id: 'bun_top', name: 'Tampa do pão', price: 0, cm: 1.7, locked: true, emoji: '🍞' }
  ]},
  { group: 'Carne e queijo', items: [
    { id: 'patty2', name: 'Segundo blend', price: 9, cm: 1.1, emoji: '🥩' },
    { id: 'cheese', name: 'Queijo na chapa', price: 5, cm: .5, emoji: '🧀' },
    { id: 'bacon', name: 'Bacon defumado', price: 7, cm: .5, emoji: '🥓' }
  ]},
  { group: 'Da horta', items: [
    { id: 'lettuce', name: 'Alface crespa', price: 2, cm: .6, emoji: '🥬' },
    { id: 'tomato', name: 'Tomate italiano', price: 2, cm: .4, emoji: '🍅' },
    { id: 'onion_red', name: 'Cebola roxa', price: 2, cm: .3, emoji: '🧅' },
    { id: 'pickle', name: 'Picles da casa', price: 2, cm: .25, emoji: '🥒' }
  ]}
];
const ING_MAP = {};
ING.forEach(g => g.items.forEach(i => ING_MAP[i.id] = i));
const LOCKED = ING.flatMap(g => g.items.filter(i => i.locked).map(i => i.id));

const ZONES = [
  { id: 'centro', name: 'Centro', fee: 5.9, time: '25 a 35 min', eta: 30 },
  { id: 'jardim-america', name: 'Jardim América', fee: 7.9, time: '30 a 40 min', eta: 35 },
  { id: 'vila-nova', name: 'Vila Nova', fee: 8.9, time: '35 a 45 min', eta: 40 },
  { id: 'parque-das-arvores', name: 'Parque das Árvores', fee: 10.9, time: '40 a 50 min', eta: 46 },
  { id: 'bela-vista', name: 'Bela Vista', fee: 12.9, time: '45 a 60 min', eta: 52 }
];
const REVIEWS = [
  { n: 'Camila R.', w: 'pedi pelo site e deu pra ver o motoboy saindo. chegou quente, o pão não murchou.' },
  { n: 'Diego M.', w: 'o cheddar duplo é sério. carne com ponto certo, não é aquele hambúrguer seco de rede.' },
  { n: 'Fernanda L.', w: 'montei o meu com ovo e picles. em 30 min tava na porta. virou o pedido de sexta.' },
  { n: 'Rodrigo P.', w: 'atendimento no balcão é ótimo, dá pra ver a chapa trabalhando. voltei 3x esse mês.' },
  { n: 'Ana Paula S.', w: 'a costela BBQ desmancha. e o app deles não cobra taxa de aplicativo, isso ajuda.' },
  { n: 'Lucas F.', w: 'fritas rústicas com páprica valem o pedido sozinhas. peço duas porções sempre.' }
];
const HOURS = [
  { d: 'Segunda', t: 'fechado', closed: true },
  { d: 'Terça', t: '18h às 23h30', open: 18, close: 23.5 },
  { d: 'Quarta', t: '18h às 23h30', open: 18, close: 23.5 },
  { d: 'Quinta', t: '18h às 23h30', open: 18, close: 23.5 },
  { d: 'Sexta', t: '18h às 00h30', open: 18, close: 24.5 },
  { d: 'Sábado', t: '18h às 00h30', open: 18, close: 24.5 },
  { d: 'Domingo', t: '18h às 23h', open: 18, close: 23 }
];

/* ============================================================
   ILUSTRAÇÃO SVG DO BURGER (camadas separam no hover)
   ============================================================ */
function sharedDefs() {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('width', '0'); s.setAttribute('height', '0');
  s.style.position = 'absolute';
  s.innerHTML = `<defs>
    <linearGradient id="bgBun" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#eebc7c"/><stop offset="1" stop-color="#c07f3b"/></linearGradient>
    <linearGradient id="bgBunBot" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d9a45f"/><stop offset="1" stop-color="#ac6f30"/></linearGradient>
    <linearGradient id="bgMeat" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5e3620"/><stop offset="1" stop-color="#341c0d"/></linearGradient>
    <linearGradient id="bgCheese" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffd35c"/><stop offset="1" stop-color="#f0a015"/></linearGradient>
    <linearGradient id="bgLettuce" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8fd863"/><stop offset="1" stop-color="#4f9b32"/></linearGradient>
    <linearGradient id="bgTomato" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e8574a"/><stop offset="1" stop-color="#c22e21"/></linearGradient>
    <linearGradient id="bgBacon" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#c14e2f"/><stop offset="1" stop-color="#8d3319"/></linearGradient>
    <linearGradient id="bgOnion" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e5c7ee"/><stop offset="1" stop-color="#b57fc4"/></linearGradient>
    <linearGradient id="bgCrisp" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e8bd79"/><stop offset="1" stop-color="#c58b3c"/></linearGradient>
    <linearGradient id="bgEgg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#eadfc8"/></linearGradient>
  </defs>`;
  document.body.appendChild(s);
}

/* cada camada: altura local + path desenhado de y=0 (topo) pra baixo */
const ART = {
  bun_bot: { h: 26, svg: `<path d="M10 0h180v8c0 11-9 18-22 18H32C19 26 10 19 10 8Z" fill="url(#bgBunBot)"/>
    <path d="M10 0h180v5H10Z" fill="#f0d3a6" opacity=".55"/>` },
  patty: { h: 23, svg: `<path d="M8 6c30-9 62 4 92-1s58-8 92 1v8c0 7-6 9-14 9H22c-8 0-14-2-14-9Z" fill="url(#bgMeat)"/>
    <path d="M8 6c30-9 62 4 92-1s58-8 92 1v3c-34-8-62 2-92 6S38 6 8 9Z" fill="#7a4a2a" opacity=".55"/>` },
  cheese: { h: 19, svg: `<path d="M14 0h172l-9 13-20-7-17 11-20-9-17 11-20-10-17 9-20-7-15 11Z" fill="url(#bgCheese)"/>` },
  lettuce: { h: 17, svg: `<path d="M8 10c8-12 20-12 28-3 7-11 21-12 29-2 7-11 21-11 28-1 8-11 22-11 29-1 8-11 21-10 28 0 8-10 20-9 26 3v4c0 5-5 7-12 7H20c-7 0-12-2-12-7Z" fill="url(#bgLettuce)"/>
    <path d="M8 14c10 6 22 6 32 1 11 6 24 6 35 0 11 6 24 6 35 0 11 6 24 6 34 0 8 4 16 5 24 2v3c0 5-5 7-12 7H20c-7 0-12-2-12-7Z" fill="#3d7d25" opacity=".45"/>` },
  tomato: { h: 14, svg: `<rect x="16" y="1" width="168" height="12" rx="6" fill="url(#bgTomato)"/>
    <rect x="30" y="4" width="140" height="6" rx="3" fill="#ef7d6c" opacity=".7"/>` },
  bacon: { h: 15, svg: `<path d="M10 4c22 10 44-10 66 0s44 10 66 0 34-6 48 2v5c-14-8-34-6-48 2s-44 10-66 0-44 10-66 0Z" fill="url(#bgBacon)"/>
    <path d="M10 6c22 10 44-10 66 0s44 10 66 0 34-6 48 2v2c-14-8-34-6-48 2s-44 10-66 0-44 10-66 0Z" fill="#f0b59c" opacity=".45"/>` },
  onion: { h: 11, svg: `<rect x="22" y="1" width="156" height="8" rx="4" fill="url(#bgOnion)"/>
    <rect x="34" y="3" width="132" height="3" rx="1.5" fill="#fff" opacity=".45"/>` },
  rings: { h: 20, svg: `<g fill="url(#bgCrisp)"><circle cx="66" cy="10" r="10"/><circle cx="100" cy="9" r="11"/><circle cx="136" cy="10" r="10"/></g>
    <g fill="#241812"><circle cx="66" cy="10" r="4"/><circle cx="100" cy="9" r="4.5"/><circle cx="136" cy="10" r="4"/></g>` },
  egg: { h: 18, svg: `<path d="M34 12c-8-12 6-14 14-10 6-9 22-7 26 1 10-8 26-4 28 5 12-3 22 2 22 8v2H34Z" fill="url(#bgEgg)"/>
    <circle cx="112" cy="10" r="8" fill="#ffab18"/><circle cx="109" cy="8" r="3" fill="#ffd166" opacity=".8"/>` },
  bun_top: { h: 58, svg: `<path d="M12 58C6 20 44 0 100 0s94 20 88 58Z" fill="url(#bgBun)"/>
    <g fill="#fff1d2" opacity=".85">
      <ellipse cx="60" cy="32" rx="6" ry="3.4" transform="rotate(-18 60 32)"/>
      <ellipse cx="92" cy="22" rx="6" ry="3.4" transform="rotate(8 92 22)"/>
      <ellipse cx="126" cy="30" rx="6" ry="3.4" transform="rotate(20 126 30)"/>
      <ellipse cx="78" cy="44" rx="6" ry="3.4" transform="rotate(-6 78 44)"/>
      <ellipse cx="112" cy="46" rx="6" ry="3.4" transform="rotate(12 112 46)"/>
      <ellipse cx="146" cy="47" rx="5.4" ry="3.2" transform="rotate(26 146 47)"/>
      <ellipse cx="44" cy="46" rx="5.4" ry="3.2" transform="rotate(-26 44 46)"/>
    </g>` }
};

function burgerSVG(art, w = 200) {
  const layers = art.map(id => ART[id]).filter(Boolean);
  const overlap = 5;
  const total = layers.reduce((a, l) => a + l.h - overlap, overlap) + 8;
  let y = total - 4;
  const parts = [];
  layers.forEach((l, i) => {
    y -= (l.h - overlap);
    parts.push(`<g class="lay" style="--i:${i}" transform="translate(0 ${y.toFixed(1)})">${l.svg}</g>`);
  });
  return `<svg viewBox="0 0 ${w} ${total}" width="${w}" role="img" aria-hidden="true">${parts.join('')}</svg>`;
}

/* ============================================================
   ESTADO
   ============================================================ */
let cart = store.get('brasa_cart', []);
let order = store.get('brasa_order', null);
let build = { ids: [...LOCKED], qty: 1 };

function saveCart() { store.set('brasa_cart', cart); }
const cartCount = () => cart.reduce((a, i) => a + i.qty, 0);
const subtotal = () => cart.reduce((a, i) => a + i.price * i.qty, 0);

/* ============================================================
   TOASTS
   ============================================================ */
function toast(msg, icon = '🔥', ok = false) {
  const box = $('#toasts'); if (!box) return;
  const t = document.createElement('div');
  t.className = 'toast' + (ok ? ' ok' : '');
  t.innerHTML = `<i>${icon}</i><span>${msg}</span>`;
  box.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, 2600);
  while (box.children.length > 3) box.firstChild.remove();
}

/* ============================================================
   CARDÁPIO
   ============================================================ */
const CATS = [
  { id: 'all', name: 'Tudo' },
  { id: 'burgers', name: 'Burgers' },
  { id: 'kids', name: 'Kids' }
];
function renderMenu(cat = 'all') {
  const grid = $('#menuGrid'); if (!grid) return;
  const items = MENU.filter(m => cat === 'all' || m.cat === cat);
  grid.innerHTML = items.map(m => `
    <article class="card" data-id="${m.id}">
      <div class="card-art" data-open="${m.id}">
        ${m.img
          ? `<img src="${m.img}" alt="${m.name}" loading="lazy" decoding="async" width="720" height="540">`
          : burgerSVG(m.art)}
        ${m.tags?.length ? `<div class="card-tags">${m.tags.map(t => {
          const cls = t === 'veg' ? ' veg' : (t === 'hot' ? ' hot' : '');
          const txt = t === 'veg' ? 'veggie' : (t === 'hot' ? 'picante na medida' : t);
          return `<span class="tag${cls}">${txt}</span>`;
        }).join('')}</div>` : ''}
      </div>
      <div class="card-body">
        <h3 class="card-name"><button type="button" class="card-link" data-open="${m.id}">${m.name}</button></h3>
        <p class="card-desc">${m.desc}</p>
        <div class="card-foot">
          <div class="price">${BRL(m.price)}<small>combo com fritas +R$ 16</small></div>
          <button class="card-add" data-add="${m.id}" aria-label="Adicionar ${m.name} ao carrinho">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/></svg>
            <span class="ca-txt">Adicionar</span>
          </button>
        </div>
      </div>
    </article>`).join('');
  bindTilt();
}
function renderFilters() {
  const box = $('#menuFilters'); if (!box) return;
  box.innerHTML = CATS.map((c, i) => `<button class="chip${i ? '' : ' on'}" role="tab" data-cat="${c.id}">${c.name}</button>`).join('');
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    $$('.chip', box).forEach(c => c.classList.toggle('on', c === b));
    renderMenu(b.dataset.cat);
  });
}

/* tilt 3D nos cards */
function bindTilt() {
  if (REDUCED) return;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  $$('.card').forEach(card => {
    if (!fine) {
      card.addEventListener('pointerdown', () => card.classList.add('touched'), { once: true });
      return;
    }
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', px * 100 + '%');
      card.style.setProperty('--my', py * 100 + '%');
      card.style.transform = `perspective(900px) rotateX(${(.5 - py) * 8}deg) rotateY(${(px - .5) * 9}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

function renderExtras() {
  const row = it => `<li>
      <span class="ex-emoji" aria-hidden="true">${it.emoji}</span>
      <span class="ex-txt"><b>${it.name}</b><span>${it.desc}</span></span>
      <span class="ex-price">${BRL(it.price)}</span>
      <button class="ex-add" data-add="${it.id}" aria-label="Adicionar ${it.name}">+</button>
    </li>`;
  if ($('#sidesList')) $('#sidesList').innerHTML = SIDES.map(row).join('');
  if ($('#drinksList')) $('#drinksList').innerHTML = DRINKS.map(row).join('');
}

/* clique global de "adicionar" */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-add]'); if (!b) return;
  const id = b.dataset.add;
  const item = MENU.find(m => m.id === id) || SIDES.find(s => s.id === id) || DRINKS.find(d => d.id === id);
  if (!item) return;
  addToCart({ key: item.id, name: item.name, price: item.price, art: item.art, img: item.img, emoji: item.emoji });
  if (b.classList.contains('card-add')) {
    b.classList.add('done');
    const old = b.innerHTML;
    b.innerHTML = '<span aria-hidden="true">✓</span><span class="ca-txt">No carrinho</span>';
    setTimeout(() => { b.classList.remove('done'); b.innerHTML = old; }, 1400);
  }
});

/* ============================================================
   FICHA DO PRODUTO
   Tocar na foto ou no nome abre a ficha: combo, quantidade e
   observação. É o que torna real o "combo com fritas +R$ 16" do card.
   ============================================================ */
const COMBO = 16;
const pd = { item: null, qty: 1, combo: false };
function pdTotal() { return (pd.item.price + (pd.combo ? COMBO : 0)) * pd.qty; }
function pdSync() {
  $('#pdQty').textContent = pd.qty;
  $('#pdTotal').textContent = BRL(pdTotal());
}
function openProduct(id) {
  const m = MENU.find(x => x.id === id); if (!m) return;
  Object.assign(pd, { item: m, qty: 1, combo: false });
  $('#pdArt').innerHTML = m.img ? `<img src="${m.img}" alt="${m.name}" width="720" height="540">` : burgerSVG(m.art, 220);
  $('#pdName').textContent = m.name;
  $('#pdDesc').textContent = m.desc;
  $('#pdPrice').textContent = BRL(m.price);
  $('#pdCombo').checked = false;
  $('#pdNote').value = '';
  pdSync();
  openModal($('#product'));
  $('.modal-card', $('#product')).scrollTop = 0;
}
document.addEventListener('click', e => {
  const o = e.target.closest('[data-open]');
  if (o && !e.target.closest('[data-add]')) openProduct(o.dataset.open);
});
$('#pdCombo')?.addEventListener('change', e => { pd.combo = e.target.checked; pdSync(); });
$$('[data-pq]').forEach(b => b.addEventListener('click', () => {
  pd.qty = clamp(pd.qty + +b.dataset.pq, 1, 20); pdSync();
}));
$('#pdClose')?.addEventListener('click', () => closeModal($('#product')));
$('#product')?.addEventListener('click', e => { if (e.target.id === 'product') closeModal($('#product')); });
$('#pdAdd')?.addEventListener('click', () => {
  const m = pd.item, note = $('#pdNote').value.trim();
  addToCart({
    key: m.id + (pd.combo ? '+combo' : '') + (note ? '|' + note : ''),
    name: m.name + (pd.combo ? ' em combo' : ''),
    desc: [pd.combo ? 'com fritas rústicas + lata' : '', note ? 'obs: ' + note : ''].filter(Boolean).join(' · '),
    price: m.price + (pd.combo ? COMBO : 0), img: m.img, art: m.art
  }, pd.qty);
  closeModal($('#product'));
});

/* ============================================================
   CARRINHO
   ============================================================ */
function addToCart(it, qty = 1) {
  const found = cart.find(c => c.key === it.key && !it.custom);
  if (found) found.qty += qty;
  else cart.push({ ...it, qty });
  saveCart(); renderCart();
  toast(`${it.name} no carrinho`, '🛒', true);
  bump();
}
function renderCart() {
  const n = cartCount();
  $('#cartCount').textContent = n;
  const body = $('#cartBody'), empty = $('#cartEmpty'), foot = $('#cartFoot'), ups = $('#cartUpsell');
  const sub = subtotal();

  if (!cart.length) {
    body.innerHTML = '';
    empty.hidden = false; foot.hidden = true; ups.hidden = true;
  } else {
    empty.hidden = true; foot.hidden = false;
    ups.hidden = cart.some(c => c.key === 'combo' || c.key === 'fritas');
    body.innerHTML = cart.map((c, i) => `
      <div class="ci">
        <div class="ci-art">${c.img ? `<img src="${c.img}" alt="" loading="lazy">`
          : (c.art ? burgerSVG(c.art, 42) : (c.emoji || '🍟'))}</div>
        <div class="ci-main">
          <b>${c.name}</b>
          ${c.desc ? `<div class="ci-desc">${c.desc}</div>` : ''}
          <div class="ci-bottom">
            <div class="ci-qty">
              <button data-q="${i}|-1" aria-label="Diminuir">−</button><b>${c.qty}</b><button data-q="${i}|1" aria-label="Aumentar">+</button>
            </div>
            <button class="ci-del" data-del="${i}">remover</button>
            <span class="ci-price">${BRL(c.price * c.qty)}</span>
          </div>
        </div>
      </div>`).join('');
    $('#cartSubtotal').textContent = BRL(sub);
    $('#cartTotal').textContent = BRL(sub);
    const miss = FREE_SHIP - sub;
    const bar = $('#shipProgress .sp-bar i'), txt = $('#shipProgress .sp-txt');
    bar.style.width = clamp(sub / FREE_SHIP * 100, 0, 100) + '%';
    if (miss > 0) { txt.className = 'sp-txt'; txt.innerHTML = `Faltam <b>${BRL(miss)}</b> pra ganhar o frete.`; }
    else { txt.className = 'sp-txt free'; txt.textContent = '🎉 Frete grátis liberado!'; }
  }
  const mt = $('#mobileCartTxt'), mc = $('#mobileCartCount');
  if (mt) mt.textContent = n ? `Ver pedido · ${BRL(sub)}` : 'Ver pedido';
  if (mc) { mc.hidden = !n; mc.textContent = n; }
}
function bump() {
  const el = $('#cartCount'); if (!el || REDUCED) return;
  el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.45)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
}
$('#cartBody')?.addEventListener('click', e => {
  const q = e.target.closest('[data-q]'), d = e.target.closest('[data-del]');
  if (q) {
    const [i, delta] = q.dataset.q.split('|').map(Number);
    cart[i].qty += delta;
    if (cart[i].qty < 1) cart.splice(i, 1);
    saveCart(); renderCart();
  } else if (d) {
    cart.splice(+d.dataset.del, 1); saveCart(); renderCart();
  }
});
$('#comboAdd')?.addEventListener('click', () => {
  addToCart({ key: 'combo', name: 'Combo fritas + refri', desc: 'fritas rústicas 300g + lata 350ml', price: 16, emoji: '🍟' });
});

/* drawer */
const scrim = $('#scrim');
function openCart(on = true) {
  $('#cart').classList.toggle('on', on);
  $('#cart').setAttribute('aria-hidden', String(!on));
  toggleScrim(on);
}
function toggleScrim(on) {
  if (on) { scrim.hidden = false; requestAnimationFrame(() => scrim.classList.add('on')); document.body.classList.add('no-scroll'); }
  else {
    scrim.classList.remove('on'); document.body.classList.remove('no-scroll');
    setTimeout(() => { if (!scrim.classList.contains('on')) scrim.hidden = true; }, 360);
  }
}
$('#cartBtn')?.addEventListener('click', () => openCart(true));
$('#mobileCart')?.addEventListener('click', () => openCart(true));
$('#cartClose')?.addEventListener('click', () => openCart(false));
scrim?.addEventListener('click', () => { openCart(false); closeModal($('#checkout')); });
$$('[data-close-cart]').forEach(a => a.addEventListener('click', () => openCart(false)));
addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if ($('#cart').classList.contains('on')) openCart(false);
  if ($('#checkout').classList.contains('on')) closeModal($('#checkout'));
  if ($('#tracking').classList.contains('on')) closeModal($('#tracking'));
  if ($('#product').classList.contains('on')) closeModal($('#product'));
});

/* ============================================================
   BUILDER
   ============================================================ */
function renderBuilder() {
  const box = $('#builderGroups'); if (!box) return;
  box.innerHTML = ING.map(g => `
    <div class="bp-group">
      <h4>${g.group}</h4>
      <div class="ing-row">
        ${g.items.map(i => `
          <button type="button" class="ing${build.ids.includes(i.id) ? ' on' : ''}" data-ing="${i.id}"
            ${i.locked ? 'data-locked="1" aria-disabled="true"' : ''}>
            <i aria-hidden="true">${i.emoji}</i>${i.name}${i.price ? `<s>+${BRL(i.price)}</s>` : ''}
          </button>`).join('')}
      </div>
    </div>`).join('');
}
function buildPrice() {
  return BUILD_BASE + build.ids.reduce((a, id) => a + (ING_MAP[id]?.price || 0), 0);
}
function buildHeight() {
  return build.ids.reduce((a, id) => a + (ING_MAP[id]?.cm || 0), 0);
}
function buildName() {
  const extras = build.ids.filter(id => !LOCKED.includes(id)).map(id => ING_MAP[id].name);
  return extras.length ? extras.join(', ') : 'Só o básico: pão brioche + blend 160g';
}
function syncBuilder() {
  $('#builderPrice').textContent = BRL(buildPrice() * build.qty);
  $('#builderQty').textContent = build.qty;
  $('#builderStackTxt').textContent = buildName();
  const h = $('#builderHeight');
  if (h) h.querySelector('b').textContent = buildHeight().toFixed(1).replace('.', ',');
  $$('[data-ing]').forEach(b => b.classList.toggle('on', build.ids.includes(b.dataset.ing)));
  window.Burger3D?.setStack?.(build.ids);
}
$('#builderGroups')?.addEventListener('click', e => {
  const b = e.target.closest('[data-ing]'); if (!b) return;
  const id = b.dataset.ing;
  if (ING_MAP[id]?.locked) { toast('Essa parte é a base, não sai 🙂'); return; }
  if (build.ids.includes(id)) build.ids = build.ids.filter(x => x !== id);
  else build.ids.push(id);
  syncBuilder();
});
$$('[data-bq]').forEach(b => b.addEventListener('click', () => {
  build.qty = clamp(build.qty + Number(b.dataset.bq), 1, 20);
  syncBuilder();
}));
$('#builderReset')?.addEventListener('click', () => { build = { ids: [...LOCKED], qty: 1 }; syncBuilder(); });
$('#builderAdd')?.addEventListener('click', () => {
  const extras = build.ids.filter(id => !LOCKED.includes(id));
  addToCart({
    key: 'custom-' + Date.now(), custom: true, name: 'Burger do seu jeito',
    desc: extras.length ? extras.map(id => ING_MAP[id].name).join(' · ') : 'pão brioche + blend 160g',
    price: buildPrice(), art: artFromBuild()
  }, build.qty);
  build.qty = 1; syncBuilder();
});
function artFromBuild() {
  const map = { cheese: 'cheese', bacon: 'bacon', tomato: 'tomato', onion_red: 'onion', pickle: 'onion', lettuce: 'lettuce' };
  const mid = ['patty', 'cheese', 'bacon', 'tomato', 'onion_red', 'pickle', 'lettuce']
    .filter(id => id === 'patty' || build.ids.includes(id))
    .map(id => map[id] || id);
  if (build.ids.includes('patty2')) mid.splice(1, 0, 'patty');
  return ['bun_bot', ...mid, 'bun_top'];
}

/* ============================================================
   ENTREGA — zonas e CEP
   ============================================================ */
function renderZones() {
  const el = $('#zonesList'); if (!el) return;
  el.innerHTML = ZONES.map(z => `
    <li data-zone="${z.id}">
      <span class="z-name">${z.name}</span>
      <span class="z-time">${z.time}</span>
      <span class="z-fee">${BRL(z.fee)}</span>
    </li>`).join('') +
    `<li><span class="z-name">Retirada no balcão</span><span class="z-time">15 a 20 min</span><span class="z-fee free">grátis</span></li>`;
}
const slug = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
function matchZone(bairro) {
  const b = slug(bairro);
  if (!b) return null;
  return ZONES.find(z => slug(z.name) === b) ||
         ZONES.find(z => b.includes(slug(z.name)) || slug(z.name).includes(b)) || null;
}
function maskCep(v) {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
}
async function lookupCep(cep) {
  const d = cep.replace(/\D/g, '');
  if (d.length !== 8) throw new Error('curto');
  const r = await fetch(`https://viacep.com.br/ws/${d}/json/`, { cache: 'force-cache' });
  const j = await r.json();
  if (j.erro) throw new Error('nao-encontrado');
  return j;
}
$('#cepInput')?.addEventListener('input', e => { e.target.value = maskCep(e.target.value); });
$('#cepForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const out = $('#cepResult'), cep = $('#cepInput').value;
  $$('#zonesList li').forEach(li => li.classList.remove('hl'));
  out.className = 'cep-result'; out.textContent = 'consultando…';
  try {
    const d = await lookupCep(cep);
    const z = matchZone(d.bairro);
    if (z) {
      out.className = 'cep-result ok';
      out.textContent = `Entregamos sim! ${d.bairro}, taxa ${BRL(z.fee)}, ${z.time}.`;
      $(`#zonesList [data-zone="${z.id}"]`)?.classList.add('hl');
    } else {
      out.className = 'cep-result warn';
      out.textContent = `${d.bairro || d.localidade} está fora da lista. Chama no WhatsApp que a gente confirma na hora.`;
    }
  } catch (err) {
    out.className = 'cep-result ' + (err.message === 'curto' ? 'bad' : 'warn');
    out.textContent = err.message === 'curto'
      ? 'Digite os 8 números do CEP.'
      : 'Não consegui consultar agora. Escolhe o bairro na lista ou chama no WhatsApp.';
  }
});

/* ============================================================
   CHECKOUT
   ============================================================ */
const ck = { step: 1, mode: 'delivery', pay: 'pix' };
function openModal(m) {
  m.classList.add('on'); m.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
}
function closeModal(m) {
  if (!m?.classList.contains('on')) return;
  m.classList.remove('on'); m.setAttribute('aria-hidden', 'true');
  if (!$('#cart').classList.contains('on')) document.body.classList.remove('no-scroll');
}
$('#checkoutClose')?.addEventListener('click', () => closeModal($('#checkout')));
$('#trackClose')?.addEventListener('click', () => closeModal($('#tracking')));
$('#checkout')?.addEventListener('click', e => { if (e.target.id === 'checkout') closeModal($('#checkout')); });
$('#tracking')?.addEventListener('click', e => { if (e.target.id === 'tracking') closeModal($('#tracking')); });

function fillHoods() {
  const s = $('#ckHood'); if (!s) return;
  s.innerHTML = ZONES.map(z => `<option value="${z.id}">${z.name} · ${BRL(z.fee)} · ${z.time}</option>`).join('');
}
function currentZone() {
  return ZONES.find(z => z.id === $('#ckHood')?.value) || ZONES[0];
}
function fee() {
  if (ck.mode === 'pickup') return 0;
  if (subtotal() >= FREE_SHIP) return 0;
  return currentZone().fee;
}
function total() { return subtotal() + fee(); }

function gotoStep(n) {
  ck.step = clamp(n, 1, 3);
  $$('.step').forEach(s => s.classList.toggle('is-on', +s.dataset.step === ck.step));
  $$('.steps-bar i').forEach((i, idx) => i.classList.toggle('on', idx < ck.step));
  $('#checkoutStep').textContent = `Etapa ${ck.step} de 3`;
  $('#checkoutTitle').textContent = ['Como você quer receber?', 'Como prefere pagar?', 'Confere e confirma'][ck.step - 1];
  $('#ckNext').textContent = ck.step === 3 ? 'Simular pedido' : 'Continuar';
  $('#ckBack').style.visibility = ck.step === 1 ? 'hidden' : 'visible';
  /* o aviso do topo só na etapa 1: na 2 o Pix já avisa e na 3 tem aviso próprio */
  $('.ck-demo').hidden = ck.step !== 1;
  $('#ckTotal').textContent = BRL(total());
  if (ck.step === 3) renderReview();
  $('.modal-card', $('#checkout')).scrollTop = 0;
}
$('#checkoutBtn')?.addEventListener('click', () => {
  if (!cart.length) return;
  openCart(false);
  fillHoods();
  gotoStep(1);
  openModal($('#checkout'));
});
$$('input[name="mode"]').forEach(r => r.addEventListener('change', () => {
  ck.mode = r.value;
  $('#deliveryFields').style.display = ck.mode === 'pickup' ? 'none' : '';
  $('#ckTotal').textContent = BRL(total());
}));
$$('input[name="pay"]').forEach(r => r.addEventListener('change', () => {
  ck.pay = r.value;
  $('#payPix').hidden = ck.pay !== 'pix';
  $('#payCash').hidden = ck.pay !== 'cash';
}));
$('#ckHood')?.addEventListener('change', () => { $('#ckTotal').textContent = BRL(total()); });
$('#ckCep')?.addEventListener('input', async e => {
  e.target.value = maskCep(e.target.value);
  if (e.target.value.replace(/\D/g, '').length !== 8) return;
  const hint = $('#ckCepHint');
  hint.textContent = 'buscando…';
  try {
    const d = await lookupCep(e.target.value);
    if (d.logradouro) $('#ckStreet').value = d.logradouro;
    const z = matchZone(d.bairro);
    if (z) { $('#ckHood').value = z.id; hint.textContent = `${d.bairro} · ${d.localidade}-${d.uf}`; }
    else hint.textContent = `${d.bairro || d.localidade} fora da lista, escolhe o bairro mais perto`;
    $('#ckTotal').textContent = BRL(total());
    $('#ckNumber').focus();
  } catch {
    hint.textContent = 'não achei esse CEP, preenche na mão';
  }
});
$('#ckPhone')?.addEventListener('input', e => {
  const d = e.target.value.replace(/\D/g, '').slice(0, 11);
  e.target.value = d.length <= 2 ? d
    : d.length <= 6 ? `(${d.slice(0, 2)}) ${d.slice(2)}`
    : d.length <= 10 ? `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
    : `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
});

function validateStep1() {
  const need = ck.mode === 'pickup' ? ['ckName', 'ckPhone'] : ['ckName', 'ckPhone', 'ckStreet', 'ckNumber'];
  let ok = true;
  $$('.f').forEach(f => f.classList.remove('err'));
  need.forEach(id => {
    const el = $('#' + id);
    const v = el.value.trim();
    const bad = !v || (id === 'ckPhone' && v.replace(/\D/g, '').length < 10);
    if (bad) { el.closest('.f').classList.add('err'); ok = false; }
  });
  if (!ok) {
    toast('Falta preencher algo aí em cima', '✍️');
    const first = $('.f.err input, .f.err select');
    first?.scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' });
    first?.focus({ preventScroll: true });
  }
  return ok;
}
function addrText() {
  if (ck.mode === 'pickup') return 'Retirada no balcão · Rua das Cerejeiras, 128';
  const z = currentZone();
  const cep = $('#ckCep').value.trim();
  return `${$('#ckStreet').value}, ${$('#ckNumber').value}${$('#ckComp').value ? ', ' + $('#ckComp').value : ''}<br>${z.name}${cep ? ' · CEP ' + cep : ''}`;
}
function renderReview() {
  const payTxt = { pix: 'Pix na confirmação', card: 'Cartão na entrega', cash: 'Dinheiro' + ($('#ckChange').value ? ` (troco pra ${$('#ckChange').value})` : '') }[ck.pay];
  const z = currentZone();
  $('#reviewBox').innerHTML = `
    <div class="rv-block">
      <h4>Itens</h4>
      ${cart.map(c => `<div class="rv-line"><span>${c.qty}× ${c.name}</span><span>${BRL(c.price * c.qty)}</span></div>`).join('')}
      <div class="rv-line"><span>${ck.mode === 'pickup' ? 'Retirada' : 'Entrega · ' + z.name}</span><span>${fee() ? BRL(fee()) : 'grátis'}</span></div>
      <div class="rv-line rv-total"><span>Total</span><span>${BRL(total())}</span></div>
    </div>
    <div class="rv-block">
      <h4>${ck.mode === 'pickup' ? 'Retirada' : 'Entrega'}</h4>
      <p class="rv-addr">${addrText()}<br>
        <span class="muted">${$('#ckName').value} · ${$('#ckPhone').value}</span>
        ${$('#ckNote').value ? `<br><span class="muted">obs: ${$('#ckNote').value}</span>` : ''}
      </p>
    </div>
    <div class="rv-block">
      <h4>Pagamento</h4>
      <p class="rv-addr">${payTxt}</p>
    </div>
    <div class="rv-block">
      <h4>Previsão</h4>
      <p class="rv-addr">${ck.mode === 'pickup' ? 'Pronto pra retirar em 15 a 20 min' : `Na sua porta em ${z.time}`}</p>
    </div>
    <p class="demo-note"><b>Isto é uma simulação.</b> Ao tocar em "Simular pedido" nada é cobrado e nenhum pedido é enviado à hamburgueria. Você só vê como o cliente acompanharia a entrega.</p>`;
}
$('#demoFill')?.addEventListener('click', () => {
  const v = { ckCep: '01000-000', ckStreet: 'Rua das Cerejeiras', ckNumber: '200', ckComp: 'apto 12',
    ckName: 'Cliente Teste', ckPhone: '(11) 90000-0000', ckNote: 'sem cebola, por favor' };
  Object.entries(v).forEach(([id, val]) => { const el = $('#' + id); if (el) el.value = val; });
  $('#ckHood').value = 'centro';
  $('#ckCepHint').textContent = 'dados de exemplo';
  $$('.f').forEach(f => f.classList.remove('err'));
  $('#ckTotal').textContent = BRL(total());
  toast('Preenchido com dados de exemplo', '🧪');
});
$('#ckBack')?.addEventListener('click', () => gotoStep(ck.step - 1));
$('#ckNext')?.addEventListener('click', () => {
  if (ck.step === 1 && !validateStep1()) return;
  if (ck.step < 3) return gotoStep(ck.step + 1);
  placeOrder();
});

/* QR de demonstração */
function pixDemo(code) {
  const box = $('#pixQr'); if (!box) return;
  let h = 0; for (const c of code) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const cells = [];
  for (let i = 0; i < 121; i++) {
    const x = i % 11, y = (i / 11) | 0;
    const corner = (x < 3 && y < 3) || (x > 7 && y < 3) || (x < 3 && y > 7);
    const edge = (x === 3 && y < 4) || (y === 3 && x < 4);
    h = (h * 1103515245 + 12345) >>> 0;
    const on = corner ? !((x === 1 && y === 1) || (x === 9 && y === 1) || (x === 1 && y === 9)) : (edge ? false : (h >>> 16) % 100 < 46);
    cells.push(on ? '<i></i>' : '<span></span>');
  }
  box.innerHTML = cells.join('');
  $('#pixCode').textContent = `00020126BRASA${code}5204000053039865802BR6009SAOPAULO62070503***6304DEMO`;
}
$('#pixCopy')?.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('#pixCode').textContent); toast('Código copiado', '📋', true); }
  catch { toast('Copia manual: seleciona o código', '📋'); }
});

/* ============================================================
   PEDIDO + RASTREIO
   ============================================================ */
const STAGES_DELIVERY = [
  { t: 0,   name: 'Pedido recebido',      sub: 'a cozinha já viu' },
  { t: 9,   name: 'Na chapa',             sub: 'carne prensada, 280°' },
  { t: 26,  name: 'Embalando',            sub: 'fechando a sacola térmica' },
  { t: 42,  name: 'Saiu pra entrega',     sub: 'Rafael tá na rua' },
  { t: 105, name: 'Entregue',             sub: 'bom apetite 🔥' }
];
const STAGES_PICKUP = [
  { t: 0,  name: 'Pedido recebido',      sub: 'a cozinha já viu' },
  { t: 9,  name: 'Na chapa',             sub: 'carne prensada, 280°' },
  { t: 26, name: 'Embalando',            sub: 'fechando a sacola' },
  { t: 45, name: 'Pronto pra retirada',  sub: 'te esperamos no balcão' }
];
const SIM_TOTAL = 105;

function orderCode() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return 'BRS-' + n;
}
function placeOrder() {
  const z = currentZone();
  order = {
    code: orderCode(), at: Date.now(), mode: ck.mode, pay: ck.pay,
    name: $('#ckName').value.trim(), phone: $('#ckPhone').value,
    addr: addrText(), zone: z.name, etaMin: ck.mode === 'pickup' ? 18 : z.eta,
    items: cart.map(c => ({ name: c.name, qty: c.qty, price: c.price })),
    sub: subtotal(), fee: fee(), total: total(), notified: -1
  };
  store.set('brasa_order', order);
  cart = []; saveCart(); renderCart();
  closeModal($('#checkout'));
  $('#trackBtn').hidden = false;
  renderTracking(true);
  openModal($('#tracking'));
  toast('Pedido de demonstração ' + order.code + ' criado', '✅', true);
}

let routeLen = 0;
function elapsed() { return order ? (Date.now() - order.at) / 1000 : 0; }
function stagesOf(o) { return o.mode === 'pickup' ? STAGES_PICKUP : STAGES_DELIVERY; }
function stageIndex(o) {
  const st = stagesOf(o), e = (Date.now() - o.at) / 1000;
  let i = 0;
  st.forEach((s, k) => { if (e >= s.t) i = k; });
  return i;
}
function renderTracking(fresh = false) {
  if (!order) return;
  const st = stagesOf(order), idx = stageIndex(order), e = elapsed();
  const done = idx === st.length - 1;

  $('#trackCode').textContent = 'pedido ' + order.code;
  $('#trackTitle').textContent = done
    ? (order.mode === 'pickup' ? 'Pronto pra retirada!' : 'Pedido entregue!')
    : st[idx].name;

  $('#trackSteps').innerHTML = st.map((s, i) => `
    <li class="${i < idx ? 'done' : i === idx ? 'now' : ''}">
      <span class="ts-dot">${i < idx ? '✓' : i + 1}</span>
      <span class="ts-txt"><b>${s.name}</b><span>${i === idx ? s.sub : (i < idx ? 'concluído' : 'aguardando')}</span></span>
    </li>`).join('');

  /* ETA */
  const remain = Math.max(0, Math.ceil(order.etaMin * (1 - clamp(e / SIM_TOTAL, 0, 1))));
  $('#etaLabel').textContent = done ? 'status' : (order.mode === 'pickup' ? 'pronto em' : 'chega em');
  $('#etaValue').textContent = done ? (order.mode === 'pickup' ? 'no balcão' : 'entregue') : remain + ' min';

  /* mapa */
  const path = $('#routeLive'), rider = $('#riderLive'), doneLine = $('#routeDone');
  if (path && rider && doneLine) {
    if (!routeLen) { routeLen = path.getTotalLength(); doneLine.setAttribute('stroke-dasharray', routeLen); }
    const startT = order.mode === 'pickup' ? SIM_TOTAL : st[3].t;
    const prog = order.mode === 'pickup' ? (done ? 0 : 0) : clamp((e - startT) / (SIM_TOTAL - startT), 0, 1);
    doneLine.setAttribute('stroke-dashoffset', routeLen * (1 - prog));
    const p = path.getPointAtLength(routeLen * prog);
    rider.setAttribute('transform', `translate(${p.x} ${p.y})`);
    rider.style.opacity = order.mode === 'pickup' ? .25 : 1;
  }

  $('#trackRider').hidden = !(order.mode !== 'pickup' && idx >= 3 && !done);

  $('#trackSummary').innerHTML = `
    ${order.items.map(i => `<div class="rv-line"><span>${i.qty}× ${i.name}</span><span>${BRL(i.price * i.qty)}</span></div>`).join('')}
    <div class="rv-line"><span>${order.mode === 'pickup' ? 'Retirada' : 'Entrega'}</span><span>${order.fee ? BRL(order.fee) : 'grátis'}</span></div>
    <div class="rv-line rv-total"><span>Total</span><span>${BRL(order.total)}</span></div>
    <div class="rv-line"><span class="muted">${order.mode === 'pickup' ? 'Retirar em' : 'Entregar em'}</span><span class="muted" style="text-align:right">${order.addr}</span></div>`;

  /* aviso de mudança de etapa */
  if (!fresh && order.notified !== idx) {
    order.notified = idx; store.set('brasa_order', order);
    if (!$('#tracking').classList.contains('on')) toast(st[idx].name + ' · ' + order.code, done ? '🎉' : '🛵');
  }
  if (fresh) { order.notified = idx; store.set('brasa_order', order); }
}
$('#trackBtn')?.addEventListener('click', () => { renderTracking(true); openModal($('#tracking')); });
$('#trackCancel')?.addEventListener('click', () => {
  store.del('brasa_order'); order = null;
  $('#trackBtn').hidden = true;
  closeModal($('#tracking'));
  toast('Pedido de demonstração cancelado', '🗑️');
});
/* o botão do entregador não pode abrir WhatsApp de ninguém: é tudo fictício */
$('#riderCall')?.addEventListener('click', () => toast('Na versão real, abre o WhatsApp do entregador', '🛵'));
setInterval(() => { if (order) renderTracking(); }, 1000);

/* ============================================================
   VISITA / HORÁRIOS
   ============================================================ */
function renderHours() {
  const el = $('#hoursList'); if (!el) return;
  const jsDay = new Date().getDay();          // 0 = domingo
  const idx = jsDay === 0 ? 6 : jsDay - 1;    // lista começa na segunda
  el.innerHTML = HOURS.map((h, i) => `
    <li class="${i === idx ? 'today' : ''}${h.closed ? ' closed' : ''}">
      <b>${h.d}${i === idx ? ' · hoje' : ''}</b><span>${h.t}</span>
    </li>`).join('');

  const now = new Date();
  const hNow = now.getHours() + now.getMinutes() / 60;
  const today = HOURS[idx];
  const open = !today.closed && hNow >= today.open && hNow <= today.close;
  const box = $('#hoursNow');
  if (box) {
    box.querySelector('b').textContent = open
      ? `Aberto agora, até ${today.t.split(' às ')[1]}`
      : (today.closed ? 'Fechado hoje (segunda)' : 'Fechado agora, abre 18h');
    box.querySelector('.pulse-dot').style.background = open ? 'var(--green)' : '#7d6f66';
  }
}
function renderReviews() {
  const el = $('#reviewsTrack'); if (!el) return;
  const one = r => `<figure class="rev"><div class="rev-stars">★★★★★</div><p>“${r.w}”</p><b>${r.n}</b><span>pedido pelo site</span></figure>`;
  el.innerHTML = [...REVIEWS, ...REVIEWS].map(one).join('');
}

/* ============================================================
   UX GERAL
   ============================================================ */
/* header + barra mobile */
addEventListener('scroll', () => {
  $('#hdr').classList.toggle('stuck', scrollY > 30);
  $('#mobileBar')?.classList.toggle('on', scrollY > innerHeight * .6);
}, { passive: true });

/* nav mobile */
const navT = $('#navToggle');
navT?.addEventListener('click', () => {
  const on = navT.getAttribute('aria-expanded') === 'true';
  navT.setAttribute('aria-expanded', String(!on));
  $('#nav').classList.toggle('on', !on);
});
$$('#nav a').forEach(a => a.addEventListener('click', () => {
  $('#nav').classList.remove('on'); navT?.setAttribute('aria-expanded', 'false');
}));

/* reveal */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in');
  $$('[data-count]', e.target).forEach(countTo);
  io.unobserve(e.target);
}), { threshold: .12, rootMargin: '0px 0px -8% 0px' });
function observeReveals() { $$('.reveal').forEach(el => io.observe(el)); }

/* O HTML já traz o número final (4,9/5, 35, 180). A contagem é enfeite:
   se a aba estiver em segundo plano o requestAnimationFrame para, e sem
   isso o número podia ficar travado no 0. Por isso o timeout no fim
   sempre grava o valor certo. */
function countTo(el) {
  const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
  const suf = el.dataset.suffix ? `<small>${el.dataset.suffix}</small>` : '';
  const put = v => { el.innerHTML = v.toFixed(dec).replace('.', ',') + suf; };
  if (REDUCED || document.hidden) return put(to);
  const t0 = performance.now(), dur = 1100;
  const tick = now => {
    const p = clamp((now - t0) / dur, 0, 1);
    put(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  setTimeout(() => put(to), dur + 400);
}

/* ============================================================
   BOOT
   ============================================================ */
function boot() {
  sharedDefs();
  const ce = $('#ceArt');
  if (ce) ce.innerHTML = burgerSVG(['bun_bot', 'patty', 'cheese', 'lettuce', 'bun_top'], 120);
  renderFilters(); renderMenu(); renderExtras(); renderBuilder();
  renderZones(); renderReviews(); renderHours(); renderCart();
  syncBuilder();
  observeReveals();
  pixDemo('BRS' + Math.floor(Math.random() * 9000 + 1000));
  fillHoods();

  if (order && Date.now() - order.at < 3 * 3600e3) {
    $('#trackBtn').hidden = false;
    renderTracking(true);
  } else if (order) { store.del('brasa_order'); order = null; }

  /* o 3D carrega depois (módulo) — assim que estiver pronto, manda a pilha atual */
  document.addEventListener('burger3d:ready', () => window.Burger3D?.setStack?.(build.ids));

  /* loader sai quando tudo (fontes + 3D) respondeu */
  const done = () => setTimeout(() => document.body.classList.remove('is-loading'), 260);
  let fired = false;
  const finish = () => { if (!fired) { fired = true; done(); } };
  document.addEventListener('burger3d:ready', finish, { once: true });
  addEventListener('load', () => setTimeout(finish, 400));
  setTimeout(finish, 3200);
}
document.addEventListener('DOMContentLoaded', boot);
})();
