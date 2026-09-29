/* ============================================================
   Brasa Burger — pilha de camadas em foto real
   As camadas saíram de uma foto de burger explodido, recortadas
   uma a uma com fundo transparente. Aqui elas são empilhadas em
   CSS 3D: montam o burger, separam no scroll e reagem ao mouse.
   Sem WebGL, sem modelo 3D — e com cara de foto porque é foto.
   ============================================================ */
(() => {
'use strict';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = () => innerWidth < 900;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* Medidas em pixels da foto original.
   dx = quanto o centro da camada desvia do eixo do burger.
   show = quanto essa camada "aparece" embaixo da de cima (o quanto
   ela faz a pilha crescer). É o que permite montar o burger com
   qualquer combinação de ingredientes sem abrir buraco. */
const L = {
  bun_bottom: { img: 'bun-bot', w: 565, h: 163, dx: 0,   show: 100 },
  lettuce:    { img: 'lettuce', w: 642, h: 157, dx: 4,   show: 55 },
  tomato:     { img: 'tomato',  w: 548, h: 118, dx: -23, show: 40 },
  patty:      { img: 'patty',   w: 580, h: 135, dx: -9,  show: 55 },
  patty2:     { img: 'patty',   w: 580, h: 135, dx: 6,   show: 55 },
  cheese:     { img: 'cheese',  w: 575, h: 127, dx: 6,   show: 45 },
  bacon:      { img: 'bacon',   w: 587, h: 178, dx: 14,  show: 48 },
  onion_red:  { img: 'onion',   w: 575, h: 102, dx: 7,   show: 45 },
  pickle:     { img: 'pickle',  w: 566, h: 90,  dx: 3,   show: 40 },
  bun_top:    { img: 'bun-top', w: 591, h: 200, dx: 1,   show: 0 }
};
const ORDER = ['bun_bottom', 'lettuce', 'tomato', 'patty', 'patty2',
               'cheese', 'bacon', 'onion_red', 'pickle', 'bun_top'];
const STACK_W = 700;

/* burger da seção Anatomia (de baixo pra cima) */
const CLASSIC = ['bun_bottom', 'lettuce', 'tomato', 'patty', 'cheese', 'bacon', 'onion_red', 'pickle', 'bun_top'];
const LABELS = {
  bun_top:    ['Pão brioche', 'gergelim e manteiga na chapa'],
  pickle:     ['Picles da casa', 'conserva de 48h'],
  onion_red:  ['Cebola roxa', 'fatiada fina na hora'],
  bacon:      ['Bacon defumado', 'fatia grossa, bem crocante'],
  cheese:     ['Cheddar derretido', 'escorrendo na carne ainda na chapa'],
  patty:      ['Blend 180g', 'maminha, acém e costela'],
  tomato:     ['Tomate italiano', 'em rodela grossa'],
  lettuce:    ['Alface crespa', 'lavada folha por folha'],
  bun_bottom: ['Base de brioche', 'tostada na manteiga']
};

/* ---------- monta a pilha ---------- */
const wOf = m => m.w * (m.sc ?? 1);
const hOf = m => m.h * (m.sc ?? 1);

function makeLayer(id) {
  const m = L[id];
  const el = document.createElement('img');
  el.className = 'bl';
  el.src = 'img/camadas/' + m.img + '.webp';
  el.alt = '';
  el.width = m.w; el.height = m.h;
  el.decoding = 'async';
  el.dataset.layer = id;
  el.style.setProperty('--w', wOf(m));
  el.style.setProperty('--dx', m.dx);
  return el;
}

/* posiciona as camadas presentes, de baixo pra cima */
function layout(ids) {
  const present = ORDER.filter(id => ids.includes(id));
  let bottom = 0;
  const pos = {};
  for (let i = 0; i < present.length; i++) {
    const id = present[i];
    pos[id] = { bottom, k: i };
    bottom -= L[id].show;                  // a próxima sobe
  }
  const top = Math.min(...present.map(id => pos[id].bottom - hOf(L[id])));
  const height = 0 - top;                  // altura total da pilha
  const out = [];
  present.forEach(id => {
    out.push({ id, y: pos[id].bottom - hOf(L[id]) - top, k: pos[id].k, n: present.length });
  });
  return { list: out, height, n: present.length };
}

function applyLayout(root, ids) {
  const { list, height, n } = layout(ids);
  const mid = (n - 1) / 2;
  list.forEach(o => {
    const el = root.querySelector(`[data-layer="${o.id}"]`);
    if (!el) return;
    el.style.setProperty('--y', o.y);
    el.style.setProperty('--i', (o.k - mid).toFixed(3));   // sinal do explode
    el.style.setProperty('--k', o.k);
    el.style.zIndex = o.k + 1;
  });
  root.style.setProperty('--sh', height);
  return height;
}

/* ============================================================
   HERO + ANATOMIA
   ============================================================ */
function initHero() {
  const stage = document.getElementById('stage');
  const wrap = document.getElementById('burgerWrap');
  const stack = document.getElementById('burgerStack');
  const sticky = stage?.querySelector('.stage-sticky');
  if (!stage || !stack || !sticky) return;

  CLASSIC.forEach(id => stack.appendChild(makeLayer(id)));
  applyLayout(stack, CLASSIC);

  /* labels da anatomia */
  const labelLayer = document.getElementById('labelLayer');
  const leaders = document.getElementById('leaders');
  const listEl = document.getElementById('anatomyList');
  const topDown = [...CLASSIC].reverse();
  const labelEls = [], leaderEls = [];
  topDown.forEach((id, i) => {
    const [t, s] = LABELS[id] || ['', ''];
    const d = document.createElement('div');
    d.className = 'lbl';
    d.innerHTML = `${t}<small>${s}</small>`;
    labelLayer?.appendChild(d);
    labelEls.push(d);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '2.5');
    leaders?.append(line, dot);
    leaderEls.push({ line, dot });
    if (listEl) {
      const li = document.createElement('li');
      li.innerHTML = `<i>${String(i + 1).padStart(2, '0')}</i><span>${t} <span class="muted">· ${s}</span></span>`;
      listEl.appendChild(li);
    }
  });
  const listItems = listEl ? [...listEl.children] : [];

  const heroCopy = document.getElementById('heroCopy');
  const anatomy = document.getElementById('anatomy');
  const scrollHint = document.getElementById('scrollHint');
  const dragHint = document.getElementById('dragHint');
  const word = stage.querySelector('.stage-word');
  const swIn = stage.querySelector('.sw-in');

  /* Escrever custom property é recalcular estilo da seção inteira. Como o
     loop roda a 60fps, só escreve quando o valor arredondado muda. */
  const vcache = {};
  const setVar = (el, k, v, dec) => {
    const t = v.toFixed(dec);
    if (vcache[k] === t) return;
    vcache[k] = t;
    el.style.setProperty(k, t);
  };

  /* ---- interação: mouse/arraste inclina a pilha ---- */
  let tx = 0, ty = 0, cx = 0, cy = 0, dragging = false, px = 0, py = 0;
  let mx = -9e4, my = -9e4, over = false;
  const onMove = e => {
    const r = stage.getBoundingClientRect();
    tx = clamp(((e.clientX - r.left) / r.width - .5) * 2, -1, 1);
    ty = clamp(((e.clientY - r.top) / r.height - .5) * 2, -1, 1);
  };
  stage.addEventListener('pointermove', e => {
    mx = e.clientX; my = e.clientY;
    over = e.pointerType !== 'touch';
    if (!dragging) onMove(e);
  });
  stage.addEventListener('pointerleave', () => { tx = 0; ty = 0; over = false; });
  wrap?.addEventListener('pointerdown', e => {
    dragging = true; px = e.clientX; py = e.clientY;
    wrap.setPointerCapture?.(e.pointerId);
    wrap.style.cursor = 'grabbing';
    dragHint?.classList.add('gone');
  });
  addEventListener('pointermove', e => {
    if (!dragging) return;
    mx = e.clientX; my = e.clientY;
    tx = clamp(tx + (e.clientX - px) * .006, -1.6, 1.6);
    ty = clamp(ty + (e.clientY - py) * .004, -1.2, 1.2);
    px = e.clientX; py = e.clientY;
  });
  const endDrag = () => { dragging = false; if (wrap) wrap.style.cursor = 'grab'; };
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);

  /* ---- scroll ---- */
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  let visible = true, phase = -1, lastCur = -2, cueGone = false;
  let exp = 0, scale = .6, oy = 0, hov = 0;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(stage);

  function progress() {
    const r = stage.getBoundingClientRect();
    const span = stage.offsetHeight - innerHeight;
    return span <= 0 ? 0 : clamp(-r.top / span, 0, 1);
  }

  let t0 = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - t0) / 1000); t0 = now;
    if (!visible) return;

    const p = progress();
    const mob = isMobile();

    /* explosão por scroll: sobe até o meio da seção e volta no fim */
    const open = smooth(.16, .5, p) * (1 - smooth(.84, .99, p));

    /* proximidade do mouse: 1 em cima da pilha, zero a 150px dela. É isso
       que entreabre o burger no hero sem precisar rolar. Vale só enquanto
       a anatomia está fechada, senão as duas coisas brigariam. */
    let near = 0;
    if (over && !mob && open < .96) {
      const rs = stack.getBoundingClientRect();
      const gx = Math.max(rs.left - mx, 0, mx - rs.right);
      const gy = Math.max(rs.top - my, 0, my - rs.bottom);
      near = 1 - clamp(Math.hypot(gx, gy) / 150, 0, 1);
      near = near * near * (3 - 2 * near);
    }
    hov += (near * (1 - open) - hov) * Math.min(1, dt * 7);

    const targetExp = open * (mob ? 84 : 104) + hov * 26;
    exp += (targetExp - exp) * Math.min(1, dt * 6);

    /* escala: grande no hero, encolhe quando a anatomia abre pra caber nas
       etiquetas. O tamanho do hero sai da tela, não de um número fixo. */
    const sA = mob ? .38 : clamp(Math.min(innerHeight * .58 / 640, innerWidth * .365 / 700), .46, .78);
    /* Aberta, a pilha ocupa a altura dela mais a separação das 9 camadas:
       628 + 2 * 104 * 4 ≈ 1460 unidades da foto. Daí sai a escala que faz
       a anatomia inteira caber na tela, com folga pro header e pras etiquetas. */
    const sB = mob ? .33 : clamp(Math.min((innerHeight - 132) / 1460, innerWidth * .30 / 700), .3, .56);
    /* no hover ela encolhe um pouco, senão as camadas separadas vazam pra fora */
    const targetScale = sA + (sB - sA) * open - hov * .07;
    scale += (targetScale - scale) * Math.min(1, dt * 6);

    /* posição: o burger fica no centro nas duas fases. No hero sobe um
       pouco pra abrir espaço pro texto do rodapé; no celular sobe bem mais,
       porque lá o texto ocupa a metade de baixo. */
    const toCenter = smooth(.12, .5, p);
    const box = sticky.getBoundingClientRect();
    const toy = (1 - toCenter) * -box.height * (mob ? .25 : .055);
    oy += (toy - oy) * Math.min(1, dt * 5);

    /* inclinação com inércia */
    const idle = REDUCED ? 0 : Math.sin(now / 2600) * .16;
    cx += ((dragging ? tx : tx + idle) - cx) * Math.min(1, dt * 5);
    cy += (ty - cy) * Math.min(1, dt * 5);
    const float = REDUCED ? 0 : Math.sin(now / 1800) * (1 - open) * 8;

    stack.style.setProperty('--s', scale.toFixed(4));
    stack.style.setProperty('--exp', exp.toFixed(2));
    stack.style.transform =
      `translate3d(0, ${(oy + float).toFixed(1)}px, 0)` +
      ` rotateX(${(-cy * 7).toFixed(2)}deg) rotateY(${(cx * 9).toFixed(2)}deg)`;

    /* fundo reagindo: brasa acende no hover e abaixa quando a anatomia abre */
    setVar(sticky, '--hov', hov, 2);
    setVar(sticky, '--plate', 1 - open * .75, 2);
    setVar(sticky, '--smoke', 1 - open * .45, 2);

    /* a marca do fundo anda menos que o burger, pra parecer mais longe */
    if (swIn) {
      swIn.style.transform =
        `translate3d(${(-cx * 15).toFixed(1)}px, ${(oy * .45 - cy * 8).toFixed(1)}px, 0)` +
        ` scale(${(1 + open * .05).toFixed(4)})`;
    }
    if (!cueGone && p > .03) { cueGone = true; dragHint?.classList.add('gone'); }

    /* hero <-> anatomia */
    const want = p > .13 ? 1 : 0;
    if (want !== phase) {
      phase = want;
      heroCopy?.classList.toggle('fade', phase === 1);
      word?.classList.toggle('dim', phase === 1);
      anatomy?.classList.toggle('on', phase === 1);
      anatomy?.setAttribute('aria-hidden', phase === 1 ? 'false' : 'true');
      if (scrollHint) scrollHint.style.opacity = phase === 1 ? 0 : 1;
    }

    /* etiquetas ancoradas na posição real de cada camada */
    const showLabels = !mob && open > .25;
    const host = box;
    let cur = -1;
    /* 1ª passada: onde cada camada está e se a etiqueta aparece */
    const spots = topDown.map((id, i) => {
      const on = open > .3 + i * .03;
      if (on) cur = i;
      listItems[i]?.classList.toggle('on', on);
      if (!showLabels || !on) return null;
      const img = stack.querySelector(`[data-layer="${id}"]`);
      if (!img) return null;
      const r = img.getBoundingClientRect();
      return {
        i,
        ax: r.right - host.left - r.width * .28,          // âncora na camada
        ay: r.top + r.height / 2 - host.top,
        ly: r.top + r.height / 2 - host.top                // y da etiqueta (ajustável)
      };
    });
    /* 2ª passada: afasta etiquetas que ficariam uma em cima da outra */
    const GAP = 52;
    let prev = -1e9;
    spots.forEach(s => {
      if (!s) return;
      s.ly = Math.max(s.ly, prev + GAP);
      prev = s.ly;
    });
    topDown.forEach((id, i) => {
      const el = labelEls[i], ld = leaderEls[i], s = spots[i];
      if (!s) {
        el.classList.remove('on');
        ld.line.setAttribute('stroke-opacity', '0');
        ld.dot.setAttribute('fill-opacity', '0');
        return;
      }
      const lx = Math.min(host.width - 250, s.ax + 120);
      el.style.left = lx + 'px';
      el.style.top = s.ly + 'px';
      el.classList.add('on');
      ld.line.setAttribute('x1', s.ax + 8); ld.line.setAttribute('y1', s.ay);
      ld.line.setAttribute('x2', lx - 8); ld.line.setAttribute('y2', s.ly);
      ld.line.setAttribute('stroke-opacity', '.45');
      ld.dot.setAttribute('cx', s.ax + 5); ld.dot.setAttribute('cy', s.ay);
      ld.dot.setAttribute('fill-opacity', '1');
    });
    if (mob && cur !== lastCur) {
      lastCur = cur;
      listItems.forEach((li, i) => li.classList.toggle('cur', i === cur));
    }
  }
  requestAnimationFrame(frame);
}

/* ============================================================
   BUILDER
   ============================================================ */
function initBuilder() {
  const stage = document.getElementById('buildStage');
  const stack = document.getElementById('buildStack');
  if (!stack) return null;

  const made = new Set();
  let tilt = 0, cur = 0, target = 0;

  stage?.addEventListener('pointermove', e => {
    const r = stage.getBoundingClientRect();
    target = clamp(((e.clientX - r.left) / r.width - .5) * 2, -1, 1);
  });
  stage?.addEventListener('pointerleave', () => { target = 0; });

  function setStack(ids) {
    /* cria o que falta */
    ids.forEach(id => {
      if (!L[id] || made.has(id)) return;
      const el = makeLayer(id);
      el.classList.add('is-in');
      stack.appendChild(el);
      made.add(id);
      requestAnimationFrame(() => el.classList.remove('is-in'));
    });
    /* tira o que saiu */
    [...made].forEach(id => {
      if (ids.includes(id)) return;
      const el = stack.querySelector(`[data-layer="${id}"]`);
      made.delete(id);
      if (!el) return;
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 320);
    });
    const known = ids.filter(id => L[id]);
    applyLayout(stack, known);

    /* Escala pra pilha caber no palco. A altura de referência é fixa de
       propósito: o palco é um grid que cresce com o conteúdo, então usar
       o clientHeight dele criaria uma dependência circular (a pilha define
       o palco que define a pilha) e o burger estourava a moldura. */
    const h = layout(known).height || 700;
    const boxH = isMobile() ? Math.min(innerHeight * .37, 320) : 470;
    const boxW = (stage?.clientWidth || 600) - 48;
    const s = clamp(Math.min((boxH - 40) / h, boxW / 700), .16, .68);
    stack.style.setProperty('--s', s.toFixed(4));
    return known.length;
  }

  (function loop() {
    requestAnimationFrame(loop);
    cur += (target - cur) * .09;
    if (Math.abs(cur - tilt) > .0005) {
      tilt = cur;
      stack.style.transform = `rotateX(${(-2).toFixed(1)}deg) rotateY(${(tilt * 11).toFixed(2)}deg)`;
    }
  })();

  return { setStack };
}

/* ============================================================
   BOOT
   ============================================================ */
try {
  initHero();
  const b = initBuilder();
  window.Burger3D = { setStack: ids => b?.setStack(ids), ok: true };
} catch (err) {
  console.warn('[brasa] pilha indisponível:', err);
  window.Burger3D = { setStack() {}, ok: false };
}
document.dispatchEvent(new Event('burger3d:ready'));
})();
