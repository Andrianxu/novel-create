import { h, clear, toast, modal, injectStyle, uid, ALIGN } from '../util.js';

injectStyle('world', `
/* ================= 世界观 · 位面地图 ================= */
.wld-wrap{display:flex;width:100%;height:100%;min-width:0;overflow:hidden}

/* ---------- 左栏 236 ---------- */
.wld-side{width:236px;flex:none;background:#F1EADA;border-right:1px solid #DFD4BF;display:flex;flex-direction:column;gap:2px;padding:10px 9px 12px;overflow:auto}
.wld-cap{display:flex;align-items:center;gap:6px;font-size:9.5px;letter-spacing:.14em;color:#8C8272;padding:8px 6px 3px}
.wld-cap .n{font-size:9px;letter-spacing:0;color:#B0A48D}
.wld-list{display:flex;flex-direction:column;gap:1px}
.wld-prow{display:flex;flex-direction:column;gap:1px;padding:6px 8px;border-radius:8px;cursor:pointer;border:1px solid transparent;min-width:0}
.wld-prow:hover{background:rgba(255,255,255,.5)}
.wld-prow.on{background:#FFFCF5;border-color:#DFD4BF;box-shadow:0 1px 3px rgba(90,70,45,.05)}
.wld-prow b{font-size:12px;font-weight:700;color:#201C18}
.wld-prow small{font-size:9.5px;color:#8C8272;line-height:1.45;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wld-add{align-self:flex-start;margin:5px 0 1px 2px}
.wld-crow{display:flex;align-items:center;gap:7px;padding:5px 8px;border-radius:7px;cursor:pointer;font-size:11.5px;color:#3B342C;min-width:0}
.wld-crow:hover{background:rgba(255,255,255,.5)}
.wld-crow.on{background:#FFFCF5;box-shadow:inset 0 0 0 1px #DFD4BF;color:#201C18;font-weight:700}
.wld-crow i{width:8px;height:8px;border-radius:2px;flex:none;border:1px solid rgba(120,95,60,.32)}
.wld-crow small{margin-left:auto;font-size:9px;color:#8C8272;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:96px}
.wld-lyr{display:flex;align-items:center;gap:8px;padding:4px 8px;font-size:11.5px;color:#3B342C}
.wld-hint{margin-top:auto;border:1px dashed #DFD4BF;border-radius:9px;padding:9px 10px;font-size:10px;line-height:1.75;color:#8C8272;background:rgba(255,252,245,.55)}

/* ---------- 主区 ---------- */
.wld-main{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;gap:10px;padding:12px 16px 18px;overflow:auto}
.wld-top{display:flex;align-items:center;gap:8px;flex:none;padding:0 2px}
.wld-crumb{display:flex;align-items:center;gap:6px;font-size:11.5px;color:#8C8272;min-width:0}
.wld-crumb b{font-family:var(--kai);font-size:15px;letter-spacing:.06em;color:#201C18;font-weight:700;white-space:nowrap}
.wld-sep{color:#C6B79E;font-size:11px}
.wld-stage{display:flex;justify-content:center;flex:none}
.wld-mapbox{position:relative;height:clamp(400px,calc(100vh - 348px),690px);aspect-ratio:5/4;max-width:100%;border:1px solid #D6C8AE;border-radius:11px;overflow:hidden;background:#E4EEE9;box-shadow:0 3px 16px rgba(90,70,45,.09);user-select:none}
.wld-mapbox svg{display:block;width:100%;height:100%}
.wld-mapbox.is-drag,.wld-mapbox.is-drag .wld-node{cursor:grabbing}
.wld-node{cursor:grab}
.wld-node .wld-ring{opacity:0}
.wld-node.on .wld-ring{opacity:.95}
.wld-node:hover .wld-dot{stroke-width:3}
.wld-cont{cursor:pointer}

/* 图例 */
.wld-legend{position:absolute;right:9px;bottom:9px;display:flex;gap:8px;background:rgba(255,252,245,.93);border:1px solid #DFD4BF;border-radius:8px;padding:7px 9px;font-size:9.5px;color:#5B5348;pointer-events:none;box-shadow:0 2px 8px rgba(80,60,40,.08)}
.wld-lgcol{display:flex;flex-direction:column;gap:3px}
.wld-lgt{font-size:8.5px;letter-spacing:.16em;color:#A99C84}
.wld-lg{display:flex;align-items:center;gap:6px;line-height:1}
.wld-lg i.d{width:7px;height:7px;border-radius:50%;flex:none;display:inline-block}
.wld-lg i.l{width:16px;height:0;border-top:1.6px solid #2F6F63;flex:none;display:inline-block}
.wld-lgsep{width:1px;background:#EAE1CF}

/* ---------- 详情卡 ---------- */
.wld-dwrap{display:flex;flex-direction:column;flex:none}
.wld-detail{display:flex;flex-direction:column;gap:6px;padding:11px 15px 13px;min-height:112px}
.wld-dhead{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.wld-dhead h3{font-family:var(--kai);font-size:17px;margin:0;letter-spacing:.06em}
.wld-ddot{width:9px;height:9px;border-radius:50%;flex:none;box-shadow:0 0 0 3px rgba(185,138,60,.14)}
.wld-dmeta{display:flex;gap:16px;font-size:10.5px;color:#8C8272;flex-wrap:wrap}
.wld-dmeta b{color:#201C18;font-weight:400}
.wld-desc{margin:1px 0 0;font-size:12px;line-height:1.85;color:#3B342C}
.wld-chips{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding-top:7px;margin-top:2px;border-top:1px dashed #EAE1CF}
.wld-chip{display:inline-flex;align-items:center;gap:5px;font-size:11px;background:#F7F1E3;border:1px solid #EAE1CF;border-radius:999px;padding:2px 9px 2px 3px;cursor:pointer;color:#201C18}
.wld-chip:hover{background:#FFFCF5;border-color:#CBB894}
.wld-chip i{width:17px;height:17px;border-radius:50%;color:#fff;font-style:normal;display:grid;place-items:center;font-size:9px;font-family:var(--kai);flex:none}
.wld-chip small{color:#8C8272;font-size:9.5px;font-weight:400}

/* ---------- 右栏 300 ---------- */
.wld-rail{width:300px;flex:none;background:#F8F3E8;border-left:1px solid #DFD4BF;display:flex;flex-direction:column;gap:10px;padding:12px 12px 14px;overflow:auto}
.wld-rcard{padding:10px 12px 12px;display:flex;flex-direction:column;gap:1px}
.wld-rh{display:flex;align-items:center;gap:8px;padding-bottom:7px;border-bottom:1px solid #EAE1CF;margin-bottom:6px}
.wld-rh h3{font-family:var(--kai);font-size:14px;margin:0;letter-spacing:.08em}
.wld-realms{display:flex;flex-direction:column}
.wld-realm{display:flex;align-items:center;gap:8px;padding:7px 6px;border-radius:7px;font-size:11.5px;color:#3B342C;min-width:0}
.wld-realm i{width:16px;height:16px;border-radius:50%;background:#EFE7D7;color:#9C9080;font-style:normal;font-size:9px;display:grid;place-items:center;flex:none}
.wld-realm b{font-weight:400;color:#201C18;min-width:34px}
.wld-realm span{font-size:10px;color:#8C8272;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wld-realm em{font-style:normal;margin-left:auto;font-size:9px;color:#8A6421;background:#F7EBD3;border-radius:999px;padding:1px 7px;flex:none}
.wld-realm.now{background:#F6EEDC;box-shadow:inset 0 0 0 1px #E2D3B5}
.wld-realm.now i{background:#B98A3C;color:#FFFCF5}
.wld-realm.now b{font-weight:700}
.wld-lore{display:flex;gap:8px;padding:7px 4px;font-size:11.5px;line-height:1.85;color:#3B342C;border-bottom:1px dashed #EFE7D7}
.wld-lore:last-child{border-bottom:none}
.wld-lore .tag{flex:none;font-size:9.5px;color:#8A6421;background:#F7EBD3;border-radius:4px;padding:1px 5px;height:16px;line-height:14px;margin-top:2px}
.wld-stats{display:flex;align-items:stretch;margin:auto 0 2px;padding:9px 4px;border-top:1px dashed #E2D8C4;border-bottom:1px dashed #E2D8C4}
.wld-stats div{flex:1;display:flex;flex-direction:column;align-items:center;gap:1px;border-left:1px dotted #E2D8C4}
.wld-stats div:first-child{border-left:none}
.wld-stats b{font-family:var(--kai);font-size:17px;font-weight:400;color:#3B342C;line-height:1.15}
.wld-stats span{font-size:9px;letter-spacing:.1em;color:#8C8272}
.wld-railfoot{margin-top:auto;padding-top:12px;border-top:1px dashed #E2D8C4;text-align:center;font-family:var(--kai);font-size:10px;letter-spacing:.36em;color:#B3A790}
`);

/* ================= 地图几何（确定性） ================= */
const VBW = 1000, VBH = 800;

function hash32(str) {
  let x = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; }
  return x >>> 0;
}
/* 字符串种子 → 伪随机序列，保证同一 id 每次绘出的海岸线一致 */
function rngOf(seedStr) {
  let x = (hash32(seedStr) || 1) >>> 0;
  return () => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; };
}
const r1 = v => Math.round(v * 10) / 10;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* 在椭圆上取 16–20 个点，每点半径乘 0.86–1.15 的确定性因子 */
function coastPoints(c) {
  const rnd = rngOf('coast|' + (c.id || '') + '|' + (c.name || ''));
  const n = 16 + Math.floor(rnd() * 5);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + (rnd() - 0.5) * 0.1;
    const f = 0.86 + rnd() * 0.29;
    pts.push([c.cx + Math.cos(ang) * c.rx * f, c.cy + Math.sin(ang) * c.ry * f]);
  }
  return pts;
}
/* Catmull-Rom → 三次贝塞尔，闭合 */
function smoothClosed(pts) {
  const n = pts.length;
  const at = i => pts[((i % n) + n) % n];
  const p0 = at(0);
  let d = 'M' + r1(p0[0]) + ' ' + r1(p0[1]);
  for (let i = 0; i < n; i++) {
    const a = at(i - 1), b = at(i), c = at(i + 1), e = at(i + 2);
    const c1x = b[0] + (c[0] - a[0]) / 6, c1y = b[1] + (c[1] - a[1]) / 6;
    const c2x = c[0] - (e[0] - b[0]) / 6, c2y = c[1] - (e[1] - b[1]) / 6;
    d += 'C' + r1(c1x) + ' ' + r1(c1y) + ' ' + r1(c2x) + ' ' + r1(c2y) + ' ' + r1(c[0]) + ' ' + r1(c[1]);
  }
  return d + 'Z';
}
const pathCache = new Map();
function coastPath(c) {
  const key = [c.id, c.cx, c.cy, c.rx, c.ry].join('|');
  if (!pathCache.has(key)) pathCache.set(key, smoothClosed(coastPoints(c)));
  return pathCache.get(key);
}
/* 关系线的弯曲度，也由 id 派生 */
function bendOf(seedStr) {
  const r = rngOf('bend|' + seedStr)();
  const b = r * 2 - 1;
  return (Math.abs(b) < 0.42 ? (b < 0 ? -0.6 : 0.6) : b) * 0.85;
}
function curveGeo(a, b, bend) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = (a.x + b.x) / 2 + (-dy / len) * len * 0.09 * bend;
  const cy = (a.y + b.y) / 2 + (dx / len) * len * 0.09 * bend;
  return {
    d: 'M' + r1(a.x) + ' ' + r1(a.y) + 'Q' + r1(cx) + ' ' + r1(cy) + ' ' + r1(b.x) + ' ' + r1(b.y),
    lx: (a.x + 2 * cx + b.x) / 4, ly: (a.y + 2 * cy + b.y) / 4
  };
}
/* 屏幕坐标 → viewBox 坐标（扣掉 preserveAspectRatio 留下的留白） */
function clientToView(svgEl, clientX, clientY) {
  const rc = svgEl.getBoundingClientRect();
  const sc = Math.min(rc.width / VBW, rc.height / VBH) || 1;
  const ox = rc.left + (rc.width - VBW * sc) / 2;
  const oy = rc.top + (rc.height - VBH * sc) / 2;
  return { x: (clientX - ox) / sc, y: (clientY - oy) / sc };
}

/* ================= SVG 构造 ================= */
const NS = 'http://www.w3.org/2000/svg';
function s(tag, attrs, ...kids) {
  const el = document.createElementNS(NS, tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat(9)) {
    if (kid == null || kid === false) continue;
    el.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}
const HALO = { stroke: '#FFFCF5', 'stroke-width': 3.2, 'paint-order': 'stroke', 'stroke-linejoin': 'round' };

const REL_KIND = {
  ally: { label: '盟约', stroke: '#2F6F63', dash: '7 5' },
  enemy: { label: '敌对', stroke: '#A8322A', dash: '2 5' },
  secret: { label: '暗通', stroke: '#6E5A8C', dash: '11 4 2 4' }
};
const PILL_OF = { good: 'jade', neutral: 'gold', evil: 'seal', hidden: 'grey' };
const CURRENT_REALM = 2; /* 第三条（金丹）标为当前 */
const REALM_NAMES = ['练气', '筑基', '金丹', '元婴', '化神', '炼虚', '合体', '大乘', '渡劫'];

function alignOf(a) { return ALIGN[a] || ALIGN.neutral; }
function emptyPlane() {
  return {
    id: uid('p'), name: '新位面', note: '尚未填写', baseImage: null,
    continents: [], sects: [], sectRelations: [],
    realms: REALM_NAMES.map(n => ({ name: n, note: '—' })), lore: []
  };
}

export default {
  id: 'world', label: '世界观',
  statusText(doc) {
    const planes = doc.planes || [];
    const sects = planes.reduce((n, p) => n + ((p.sects || []).length), 0);
    return '世界观 · ' + planes.length + ' 个位面 · ' + sects + ' 个宗门';
  },
  unmount() {},
  mount(root, ctx) {
    const { doc, params, NF } = ctx;
    if (!Array.isArray(doc.planes) || !doc.planes.length) { doc.planes = [emptyPlane()]; NF.save(); }

    /* ---------- 状态 ---------- */
    const st = {
      planeId: null, continentId: null, sectId: null,
      layers: { terrain: true, sects: true, rels: true }
    };
    const findPlaneOfSect = sid => doc.planes.find(p => (p.sects || []).some(x => x.id === sid));
    const wanted = params.plane && doc.planes.find(p => p.id === params.plane);
    const owner = params.sect ? findPlaneOfSect(params.sect) : null;
    st.planeId = (owner || wanted || doc.planes[0]).id;
    if (params.sect && owner) st.continentId = null;
    const firstSect = (doc.planes.find(p => p.id === st.planeId).sects || [])[0];
    st.sectId = params.sect || (firstSect ? firstSect.id : null);

    const plane = () => doc.planes.find(p => p.id === st.planeId) || doc.planes[0];
    const sectOf = (p, id) => (p.sects || []).find(x => x.id === id) || null;

    /* ---------- 骨架 ---------- */
    const side = h('aside', { class: 'wld-side', 'data-probe': 'wld-side' });
    const main = h('main', { class: 'wld-main', 'data-probe': 'wld-main' });
    const rail = h('aside', { class: 'wld-rail', 'data-probe': 'wld-rail' });
    const detailHost = h('div', { class: 'wld-dwrap' });
    root.appendChild(h('div', { class: 'wld-wrap' }, side, main, rail));

    /* 地图内的元素引用：拖动时只改这些，不重绘整页 */
    let svgEl = null, gTerrain = null, gRels = null, gSects = null;
    const nodeRefs = new Map();
    const contRefs = new Map();
    const relRefs = [];

    /* ================= 地图 ================= */
    function buildMap(p) {
      nodeRefs.clear(); contRefs.clear(); relRefs.length = 0;

      const svg = s('svg', { viewBox: '0 0 ' + VBW + ' ' + VBH, preserveAspectRatio: 'xMidYMid meet' });

      svg.appendChild(s('defs', {},
        s('pattern', { id: 'wld-sg', width: 25, height: 25, patternUnits: 'userSpaceOnUse' },
          s('path', { d: 'M25 0H0V25', fill: 'none', stroke: '#CFE1DB', 'stroke-width': 0.7 })),
        s('pattern', { id: 'wld-lg', width: 125, height: 125, patternUnits: 'userSpaceOnUse' },
          s('path', { d: 'M125 0H0V125', fill: 'none', stroke: '#B7D1CA', 'stroke-width': 1 })),
        s('filter', { id: 'wld-soft', x: '-25%', y: '-25%', width: '150%', height: '150%' },
          s('feGaussianBlur', { stdDeviation: 7 }))));

      /* 底图 或 海面 */
      if (p.baseImage) {
        const img = s('image', { x: 0, y: 0, width: VBW, height: VBH, preserveAspectRatio: 'xMidYMid slice' });
        window.nf.image.absolute(p.baseImage)
          .then(u => { if (u) img.setAttribute('href', u); })
          .catch(() => {});
        svg.appendChild(img);
      } else {
        svg.appendChild(s('rect', { x: 0, y: 0, width: VBW, height: VBH, fill: '#E4EEE9' }));
        svg.appendChild(s('rect', { x: 0, y: 0, width: VBW, height: VBH, fill: 'url(#wld-sg)' }));
        svg.appendChild(s('rect', { x: 0, y: 0, width: VBW, height: VBH, fill: 'url(#wld-lg)' }));
      }
      /* 点海面 = 回到全域 */
      const seaHit = s('rect', { x: 0, y: 0, width: VBW, height: VBH, fill: 'transparent' });
      seaHit.addEventListener('click', () => setContinent(null));
      svg.appendChild(seaHit);

      gTerrain = s('g', { class: 'wld-terrain' });
      gRels = s('g', { class: 'wld-rels' });
      gSects = s('g', { class: 'wld-sects' });
      svg.appendChild(gTerrain); svg.appendChild(gRels); svg.appendChild(gSects);

      /* ---- 板块 ---- */
      (p.continents || []).forEach(c => {
        const d = coastPath(c);
        const g = s('g', { class: 'wld-cont', 'data-cont': c.id });
        /* 浅海光晕：同形状放大一点 + blur */
        g.appendChild(s('path', {
          d, fill: c.color, opacity: 0.6, filter: 'url(#wld-soft)',
          transform: 'translate(' + c.cx + ',' + c.cy + ') scale(1.05) translate(' + (-c.cx) + ',' + (-c.cy) + ')'
        }));
        g.appendChild(s('path', {
          d, fill: c.color, stroke: '#B29672', 'stroke-width': 1.4, 'stroke-linejoin': 'round',
          'fill-opacity': p.baseImage ? 0.3 : 1
        }));
        const nameY = r1(c.cy + Math.max(15, (c.ry || 20) * 0.46));
        const nameTxt = s('text', {
          x: r1(c.cx), y: nameY, 'text-anchor': 'middle',
          'font-family': 'KaiTi, STKaiti, Kaiti SC, serif', 'font-size': 20, 'letter-spacing': 6,
          fill: '#6E4F2A', opacity: 0.76, 'pointer-events': 'none'
        }, c.name);
        nameTxt._bx = r1(c.cx); nameTxt._by = nameY;
        g.appendChild(nameTxt);
        if (c.note) {
          const noteTxt = s('text', {
            x: r1(c.cx), y: nameY + 17, 'text-anchor': 'middle',
            'font-size': 9, fill: '#8A7856', opacity: 0.62, 'letter-spacing': 1, 'pointer-events': 'none'
          }, c.note);
          noteTxt._bx = r1(c.cx); noteTxt._by = nameY + 17;
          g.appendChild(noteTxt);
        }
        g.addEventListener('click', ev => {
          ev.stopPropagation();
          setContinent(st.continentId === c.id ? null : c.id);
        });
        gTerrain.appendChild(g);
        contRefs.set(c.id, g);
      });

      /* ---- 势力关系（画在节点之下） ---- */
      (p.sectRelations || []).forEach(r => {
        const a = sectOf(p, r.a), b = sectOf(p, r.b);
        if (!a || !b || a.id === b.id) return;
        const kind = REL_KIND[r.kind] || REL_KIND.ally;
        const bend = bendOf(r.a + '|' + r.b + '|' + (r.label || ''));
        const geo = curveGeo(a, b, bend);
        const path = s('path', {
          d: geo.d, fill: 'none', stroke: kind.stroke, 'stroke-width': 1.5,
          'stroke-dasharray': kind.dash, 'stroke-linecap': 'round', opacity: 0.82
        });
        const label = s('text', {
          x: r1(geo.lx), y: r1(geo.ly), 'text-anchor': 'middle', 'dominant-baseline': 'middle',
          'font-size': 9.5, fill: '#5B5348', 'stroke-width': 3, 'pointer-events': 'none'
        }, r.label || kind.label);
        Object.keys(HALO).forEach(k => label.setAttribute(k, HALO[k]));
        label.setAttribute('stroke-width', 3);
        gRels.appendChild(path);
        gRels.appendChild(label);
        relRefs.push({ a: r.a, b: r.b, path, label, bend });
      });

      /* ---- 宗门节点 ---- */
      (p.sects || []).forEach(sec => {
        const al = alignOf(sec.align);
        const rad = 8 + (sec.size || 1) * 2;
        const g = s('g', {
          class: 'wld-node' + (sec.id === st.sectId ? ' on' : ''),
          'data-sect': sec.id,
          transform: 'translate(' + sec.x + ',' + sec.y + ')'
        });
        g.appendChild(s('circle', { r: rad + 9, fill: '#FFFCF5', opacity: 0, 'pointer-events': 'all' }));
        g.appendChild(s('circle', { class: 'wld-halo', r: rad + 7, fill: al.color, opacity: 0.16, 'pointer-events': 'none' }));
        g.appendChild(s('circle', {
          class: 'wld-ring', r: rad + 12, fill: 'none', stroke: al.color,
          'stroke-width': 1.3, 'stroke-dasharray': '3 3', 'pointer-events': 'none'
        }));
        g.appendChild(s('circle', { class: 'wld-dot', r: rad, fill: al.color, stroke: '#FFFCF5', 'stroke-width': 2 }));
        g.appendChild(s('circle', { r: r1(rad * 0.34), fill: '#FFFCF5', opacity: 0.5, 'pointer-events': 'none' }));
        const nm = s('text', { y: rad + 15, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: '#2A241E', 'pointer-events': 'none' }, sec.name);
        Object.keys(HALO).forEach(k => nm.setAttribute(k, HALO[k]));
        g.appendChild(nm);
        if (sec.members) {
          const mt = s('text', { y: rad + 27, 'text-anchor': 'middle', 'font-size': 9.5, fill: '#6E6555', 'pointer-events': 'none' }, sec.members);
          Object.keys(HALO).forEach(k => mt.setAttribute(k, HALO[k]));
          mt.setAttribute('stroke-width', 2.6);
          g.appendChild(mt);
        }
        g.appendChild(s('title', {}, sec.name + ' · ' + al.label));
        g.addEventListener('mousedown', ev => startDrag(ev, sec, g));
        g.addEventListener('click', ev => ev.stopPropagation());
        gSects.appendChild(g);
        nodeRefs.set(sec.id, { g, sect: sec });
      });

      /* ---- 装饰：指北 + 落款 ---- */
      svg.appendChild(s('g', { transform: 'translate(58,58)', opacity: 0.7, 'pointer-events': 'none' },
        s('circle', { r: 26, fill: 'none', stroke: '#AEC9C2', 'stroke-width': 1 }),
        s('circle', { r: 19, fill: 'none', stroke: '#C8DCD6', 'stroke-width': 0.8 }),
        s('path', { d: 'M0 -19L5 0L0 19L-5 0Z', fill: '#8FA9A2', opacity: 0.5 }),
        s('path', { d: 'M0 -19L5 0L0 4L-5 0Z', fill: '#A8322A', opacity: 0.72 }),
        s('text', { y: -30, 'text-anchor': 'middle', 'font-size': 9, fill: '#7C8F89', 'letter-spacing': 1 }, '北')));
      svg.appendChild(s('text', {
        x: 26, y: 782, 'font-size': 10.5, fill: '#7E938C', 'letter-spacing': 2.4,
        'font-family': 'KaiTi, STKaiti, KaiTi SC, serif', 'pointer-events': 'none'
      }, p.name + ' · 舆图'));

      /* ---- 空位面提示 ---- */
      if (!(p.continents || []).length) {
        svg.appendChild(s('text', {
          x: 500, y: 386, 'text-anchor': 'middle', 'font-family': 'KaiTi, STKaiti, serif',
          'font-size': 22, fill: '#7E938C', 'letter-spacing': 4
        }, '这位面还没有板块'));
        svg.appendChild(s('text', {
          x: 500, y: 418, 'text-anchor': 'middle', 'font-size': 11, fill: '#93A8A1'
        }, '新建位面会复制当前板块，也可以先标注宗门'));
      }

      svgEl = svg;
      return svg;
    }

    /* 大陆名避让：按候选偏移试位，取第一个不压住宗门节点/关系标注的位置 */
    function layoutContinentLabels(p) {
      if (!svgEl) return;
      const obs = [];
      nodeRefs.forEach(ref => {
        const b = ref.g.getBBox();
        obs.push([ref.sect.x + b.x - 3, ref.sect.y + b.y - 3,
          ref.sect.x + b.x + b.width + 3, ref.sect.y + b.y + b.height + 3]);
      });
      svgEl.querySelectorAll('.wld-rels text').forEach(t => {
        const b = t.getBBox();
        obs.push([b.x - 2, b.y - 2, b.x + b.width + 2, b.y + b.height + 2]);
      });
      const cands = [];
      [0, 0.2, -0.24, 0.4, -0.46, 0.6, -0.68, 0.8, -0.9, -1.05, -1.3, -1.55].forEach(dy => {
        [0, 0.14, -0.14, 0.3, -0.3, 0.5, -0.5].forEach(dx => cands.push([dx, dy]));
      });
      contRefs.forEach((g, id) => {
        const c = (p.continents || []).find(x => x.id === id);
        const all = Array.from(g.querySelectorAll('text'));
        if (!c || !all.length) return;
        const note = all.length > 1 ? all[1] : null;
        const place = (list, dx, dy) => list.forEach(t => {
          t.setAttribute('x', r1(t._bx + dx));
          t.setAttribute('y', r1(t._by + dy));
        });
        /* 先带副标题试位，放不下就去掉副标题再试（小板块容易挤） */
        const attempt = list => cands.some(cand => {
          place(list, cand[0] * c.rx, cand[1] * c.ry);
          let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
          list.forEach(t => {
            const b = t.getBBox();
            x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
            x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
          });
          if (x0 < 8 || y0 < 8 || x1 > 992 || y1 > 792) return false;
          return !obs.some(o => x0 < o[2] && x1 > o[0] && y0 < o[3] && y1 > o[1]);
        });
        if (attempt(all)) return;
        if (note) {
          note.style.display = 'none';
          if (attempt([all[0]])) return;
          note.style.display = '';
        } else {
          attempt([all[0]]);
          return;
        }
        place(all, 0, 0);
      });
    }

    /* 关系线只更新受影响的几条 */
    function updateRels(id) {
      for (const r of relRefs) {
        if (r.a !== id && r.b !== id) continue;
        const A = nodeRefs.get(r.a), B = nodeRefs.get(r.b);
        if (!A || !B) continue;
        const geo = curveGeo(A.sect, B.sect, r.bend);
        r.path.setAttribute('d', geo.d);
        r.label.setAttribute('x', r1(geo.lx));
        r.label.setAttribute('y', r1(geo.ly));
      }
    }

    function applyLayers() {
      if (gTerrain) gTerrain.style.display = st.layers.terrain ? '' : 'none';
      if (gSects) gSects.style.display = st.layers.sects ? '' : 'none';
      if (gRels) gRels.style.display = st.layers.rels ? '' : 'none';
    }

    function applyContinent() {
      contRefs.forEach((g, id) => {
        const dim = !!st.continentId && id !== st.continentId;
        g.style.opacity = dim ? '0.45' : '';
      });
      side.querySelectorAll('[data-cont-row]').forEach(el => {
        const id = el.getAttribute('data-cont-row') || null;
        el.classList.toggle('on', id === st.continentId);
      });
    }

    function setContinent(id) {
      st.continentId = id || null;
      applyContinent();
    }

    function selectSect(id) {
      st.sectId = id;
      nodeRefs.forEach((ref, k) => ref.g.classList.toggle('on', k === id));
      renderDetail();
    }

    /* ================= 拖动 ================= */
    function startDrag(ev, sec, g) {
      if (ev.button !== 0) return;
      ev.preventDefault();
      if (st.sectId !== sec.id) selectSect(sec.id);
      const host = g.ownerSVGElement;
      if (!host) return;
      const box = host.parentElement;
      const from = clientToView(host, ev.clientX, ev.clientY);
      const ox = sec.x, oy = sec.y;
      let moved = false;
      if (box) box.classList.add('is-drag');
      document.body.style.cursor = 'grabbing';
      const onMove = e => {
        const now = clientToView(host, e.clientX, e.clientY);
        const nx = clamp(ox + now.x - from.x, 26, 974);
        const ny = clamp(oy + now.y - from.y, 26, 774);
        if (Math.abs(now.x - from.x) > 2 || Math.abs(now.y - from.y) > 2) moved = true;
        sec.x = Math.round(nx);
        sec.y = Math.round(ny);
        g.setAttribute('transform', 'translate(' + sec.x + ',' + sec.y + ')');
        updateRels(sec.id);
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        if (box) box.classList.remove('is-drag');
        document.body.style.cursor = '';
        if (moved) { NF.save(); renderDetail(); }
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }

    /* ================= 图例 ================= */
    function legendEl() {
      const dot = (color, txt) => h('span', { class: 'wld-lg' }, h('i', { class: 'd', style: { background: color } }), txt);
      const line = (color, style, txt) => h('span', { class: 'wld-lg' },
        h('i', { class: 'l', style: { borderTopColor: color, borderTopStyle: style } }), txt);
      return h('div', { class: 'wld-legend', 'data-probe': 'wld-legend' },
        h('div', { class: 'wld-lgcol' },
          h('div', { class: 'wld-lgt' }, '阵营'),
          dot(ALIGN.good.color, '正道'), dot(ALIGN.neutral.color, '中立'),
          dot(ALIGN.evil.color, '邪道'), dot(ALIGN.hidden.color, '隐世')),
        h('div', { class: 'wld-lgsep' }),
        h('div', { class: 'wld-lgcol' },
          h('div', { class: 'wld-lgt' }, '关系'),
          line(REL_KIND.ally.stroke, 'dashed', '盟约'),
          line(REL_KIND.enemy.stroke, 'dotted', '敌对'),
          line(REL_KIND.secret.stroke, 'dashed', '暗通')));
    }

    /* ================= 左栏 ================= */
    function renderSide() {
      clear(side);
      const p = plane();

      side.appendChild(h('div', { class: 'wld-cap' }, '位面', h('span', { class: 'grow' }), h('span', { class: 'n' }, doc.planes.length)));
      const plist = h('div', { class: 'wld-list' });
      doc.planes.forEach(pl => plist.appendChild(h('div', {
        class: 'wld-prow' + (pl.id === st.planeId ? ' on' : ''),
        title: pl.note || '',
        onclick: () => switchPlane(pl.id)
      }, h('b', {}, pl.name), h('small', {}, pl.note || '未填写说明'))));
      side.appendChild(plist);
      side.appendChild(h('button', { class: 'btn xs wld-add', onclick: addPlane }, '＋ 新建位面'));

      side.appendChild(h('div', { class: 'wld-cap' }, '本界板块'));
      const clist = h('div', { class: 'wld-list' });
      clist.appendChild(h('div', {
        class: 'wld-crow' + (!st.continentId ? ' on' : ''), 'data-cont-row': '',
        onclick: () => setContinent(null)
      }, h('i', { style: { background: '#E4EEE9', borderColor: '#B7D1CA' } }), '全域',
        h('small', {}, (p.continents || []).length + ' 洲')));
      (p.continents || []).forEach(c => clist.appendChild(h('div', {
        class: 'wld-crow' + (st.continentId === c.id ? ' on' : ''),
        'data-cont-row': c.id,
        title: c.note || '',
        onclick: () => setContinent(st.continentId === c.id ? null : c.id)
      }, h('i', { style: { background: c.color } }), c.name, h('small', {}, c.note || ''))));
      side.appendChild(clist);

      side.appendChild(h('div', { class: 'wld-cap' }, '图层'));
      [['terrain', '地形水系'], ['sects', '宗门节点'], ['rels', '势力关系']].forEach(item => {
        const key = item[0];
        const sw = h('div', {
          class: 'sw' + (st.layers[key] ? ' on' : ''),
          onclick: () => {
            st.layers[key] = !st.layers[key];
            sw.classList.toggle('on', st.layers[key]);
            applyLayers();
          }
        });
        side.appendChild(h('div', { class: 'wld-lyr' }, sw, item[1]));
      });

      side.appendChild(h('div', { class: 'wld-hint' },
        '地图由数据生成：海岸线按板块参数程序绘制，宗门节点可以拖动。也可以导入一张底图铺在下面。'));
    }

    /* ================= 主区 ================= */
    function renderMain() {
      clear(main);
      nodeRefs.clear(); contRefs.clear(); relRefs.length = 0;
      const p = plane();

      main.appendChild(h('div', { class: 'wld-top', 'data-probe': 'wld-top' },
        h('div', { class: 'wld-crumb' },
          h('span', {}, '世界观'), h('span', { class: 'wld-sep' }, '›'),
          h('span', {}, '地图'), h('span', { class: 'wld-sep' }, '›'),
          h('b', {}, p.name),
          p.baseImage ? h('span', { class: 'pill gold', style: { marginLeft: '2px' } }, '底图') : null,
          p.baseImage ? h('span', { class: 'link', onclick: removeBase }, '移除底图') : null),
        h('span', { class: 'grow' }),
        h('button', { class: 'btn xs', onclick: addSect }, '＋ 标注宗门'),
        h('button', { class: 'btn xs', onclick: importBase }, '⤓ 导入底图')));

      const box = h('div', { class: 'wld-mapbox', 'data-probe': 'wld-map' });
      main.appendChild(h('div', { class: 'wld-stage' }, box));
      box.appendChild(buildMap(p));
      box.appendChild(legendEl());
      layoutContinentLabels(p);

      main.appendChild(detailHost);
      renderDetail();
      applyLayers();
      applyContinent();
    }

    /* ================= 详情卡 ================= */
    function renderDetail() {
      clear(detailHost);
      const p = plane();
      const sec = sectOf(p, st.sectId);
      if (!sec) {
        detailHost.appendChild(h('div', { class: 'card wld-detail', 'data-probe': 'wld-detail' },
          h('div', { class: 'wld-dhead' },
            h('i', { class: 'wld-ddot', style: { background: '#C2B49C' } }),
            h('h3', {}, p.name),
            h('span', { class: 'pill' }, p.note || '位面'),
            h('span', { class: 'grow' }),
            h('span', { class: 'tiny muted' }, '点地图上的宗门节点查看详情 · 节点可拖动改位置')),
          h('p', { class: 'wld-desc' },
            (p.lore && p.lore.length) ? p.lore[0].text : '这位面还没有填写设定，先在右栏补齐修为体系与关键设定。')));
        return;
      }

      const al = alignOf(sec.align);
      const cont = (p.continents || []).find(c => c.id === sec.continentId);
      const chars = (sec.characterIds || [])
        .map(id => doc.characters.find(c => c.id === id)).filter(Boolean);
      const rels = (p.sectRelations || []).filter(r => r.a === sec.id || r.b === sec.id);

      detailHost.appendChild(h('div', { class: 'card wld-detail', 'data-probe': 'wld-detail' },
        h('div', { class: 'wld-dhead' },
          h('i', { class: 'wld-ddot', style: { background: al.color } }),
          h('h3', {}, sec.name),
          h('span', { class: 'pill ' + (PILL_OF[sec.align] || 'grey') }, al.label),
          cont ? h('span', { class: 'tiny muted' }, cont.name) : null,
          h('span', { class: 'grow' }),
          h('span', { class: 'tiny muted mono' }, '座标 ' + sec.x + ', ' + sec.y),
          h('button', { class: 'btn xs', onclick: () => openSect(sec) }, '打开宗门详情')),
        h('div', { class: 'wld-dmeta' },
          h('span', {}, '规模 ', h('b', {}, '第 ' + (sec.size || 1) + ' 等')),
          h('span', {}, '成员 ', h('b', {}, sec.members || '—')),
          h('span', {}, '对外关系 ', h('b', {}, rels.length
            ? rels.map(r => {
              const other = sectOf(p, r.a === sec.id ? r.b : r.a);
              return (other ? other.name : '?') + ' · ' + ((REL_KIND[r.kind] || REL_KIND.ally).label);
            }).join('　')
            : '—'))),
        h('p', { class: 'wld-desc' }, sec.desc || '（还没有写宗门简介）'),
        h('div', { class: 'wld-chips' },
          h('span', { class: 'tiny muted' }, '相关人物'),
          chars.length
            ? chars.map(c => h('span', {
              class: 'wld-chip', title: '打开人物页',
              onclick: () => NF.go('characters', { id: c.id })
            }, h('i', { style: { background: c.color || '#2F6F63' } }, c.name.slice(0, 1)),
              c.name, c.identity ? h('small', {}, c.identity.split(' · ').pop()) : null))
            : h('span', { class: 'tiny muted' }, '未关联人物'))));
    }

    function openSect(sec) {
      const p = plane();
      const al = alignOf(sec.align);
      const cont = (p.continents || []).find(c => c.id === sec.continentId);
      const chars = (sec.characterIds || [])
        .map(id => doc.characters.find(c => c.id === id)).filter(Boolean);
      const rels = (p.sectRelations || []).filter(r => r.a === sec.id || r.b === sec.id);
      const m = modal({
        title: sec.name + ' · 宗门', width: '540px', cancelText: '关闭',
        body: h('div', { class: 'col' },
          h('div', { class: 'row wrap' },
            h('span', { class: 'pill ' + (PILL_OF[sec.align] || 'grey') }, al.label),
            h('span', { class: 'pill' }, '第 ' + (sec.size || 1) + ' 等'),
            cont ? h('span', { class: 'pill grey' }, cont.name) : null,
            h('span', { class: 'grow' }),
            h('span', { class: 'tiny muted mono' }, sec.x + ', ' + sec.y)),
          h('div', { class: 'field' }, h('label', {}, '成员'), h('div', { class: 'small' }, sec.members || '—')),
          h('div', { class: 'field' }, h('label', {}, '简介'), h('div', { class: 'small', style: { lineHeight: '1.8' } }, sec.desc || '（还没有写宗门简介）')),
          h('div', { class: 'field' }, h('label', {}, '对外关系'),
            rels.length
              ? h('div', { class: 'col', style: { gap: '4px' } }, rels.map(r => {
                const other = sectOf(p, r.a === sec.id ? r.b : r.a);
                const kind = REL_KIND[r.kind] || REL_KIND.ally;
                return h('div', { class: 'small' },
                  h('span', { style: { color: kind.stroke } }, '● ' + kind.label),
                  '　' + (other ? other.name : '?') + (r.label ? '　' + r.label : ''));
              }))
              : h('div', { class: 'small muted' }, '尚无记录')),
          h('div', { class: 'field' }, h('label', {}, '相关人物'),
            chars.length
              ? h('div', { class: 'row wrap' }, chars.map(c => h('span', {
                class: 'wld-chip', onclick: () => { m.close(); NF.go('characters', { id: c.id }); }
              }, h('i', { style: { background: c.color || '#2F6F63' } }, c.name.slice(0, 1)), c.name)))
              : h('div', { class: 'small muted' }, '未关联人物')))
      });
    }

    /* ================= 右栏 ================= */
    function renderRail() {
      clear(rail);
      const p = plane();
      const realms = p.realms || [];
      const realmBox = h('div', { class: 'wld-realms' }, realms.map((r, i) => h('div', {
        class: 'wld-realm' + (i === CURRENT_REALM ? ' now' : '')
      }, h('i', {}, i + 1), h('b', {}, r.name), h('span', {}, r.note || '—'),
        i === CURRENT_REALM ? h('em', {}, '当前') : null)));

      rail.appendChild(h('div', { class: 'card wld-rcard', 'data-probe': 'wld-realms' },
        h('div', { class: 'wld-rh' },
          h('h3', {}, '修为体系 · 九境'),
          h('span', { class: 'grow' }),
          h('span', { class: 'tiny muted' }, realms.length ? realms.length + ' 境' : '未填写')),
        realms.length ? realmBox : h('div', { class: 'empty', style: { padding: '18px' } }, '还没有填写修为体系')));

      const lore = p.lore || [];
      rail.appendChild(h('div', { class: 'card wld-rcard', 'data-probe': 'wld-lore' },
        h('div', { class: 'wld-rh' },
          h('h3', {}, '关键设定'),
          h('span', { class: 'grow' }),
          h('span', { class: 'tiny muted' }, lore.length + ' 条')),
        lore.length
          ? h('div', {}, lore.map(x => h('div', { class: 'wld-lore' },
            h('span', { class: 'tag' }, x.tag || '设定'), h('span', {}, x.text))))
          : h('div', { class: 'empty', style: { padding: '18px' } }, '还没有设定条目')));

      rail.appendChild(h('div', { class: 'wld-stats', 'data-probe': 'wld-stats' },
        h('div', {}, h('b', {}, (p.continents || []).length), h('span', {}, '板块')),
        h('div', {}, h('b', {}, (p.sects || []).length), h('span', {}, '宗门')),
        h('div', {}, h('b', {}, (p.sectRelations || []).length), h('span', {}, '势力关系'))));

      rail.appendChild(h('div', { class: 'wld-railfoot' }, '卷帙 · 世界观'));
    }

    /* ================= 交互 ================= */
    function switchPlane(id) {
      if (id === st.planeId) return;
      st.planeId = id;
      st.continentId = null;
      const p = plane();
      st.sectId = (p.sects && p.sects[0]) ? p.sects[0].id : null;
      renderSide(); renderMain(); renderRail();
      NF.status('世界观 · ' + p.name);
    }

    function addPlane() {
      const nameIn = h('input', { class: 'input', value: '新位面', placeholder: '位面名' });
      const noteIn = h('input', { class: 'input', placeholder: '如：2 洲 · 5 宗门 · 番外' });
      modal({
        title: '新建位面', width: '430px', okText: '创建',
        body: h('div', { class: 'col' },
          h('div', { class: 'field' }, h('label', {}, '位面名'), nameIn),
          h('div', { class: 'field' }, h('label', {}, '备注'), noteIn),
          h('div', { class: 'tiny muted' }, '会复制当前位面的板块轮廓与修为体系，宗门与关系留空。')),
        onOk: () => {
          const name = nameIn.value.trim();
          if (!name) { toast('给位面起个名字', 'err'); return false; }
          const src = plane();
          const np = emptyPlane();
          np.name = name;
          np.note = noteIn.value.trim() || '新位面';
          np.continents = (src.continents || []).map(c => Object.assign({}, c, { id: uid('k') }));
          np.realms = (src.realms || []).map(r => ({ name: r.name, note: r.note }));
          doc.planes.push(np);
          st.planeId = np.id; st.continentId = null; st.sectId = null;
          NF.save();
          renderSide(); renderMain(); renderRail();
          NF.status('世界观 · ' + np.name);
          toast('已新建位面「' + name + '」', 'ok');
        }
      });
      setTimeout(() => { nameIn.focus(); nameIn.select(); }, 40);
    }

    function addSect() {
      const p = plane();
      const nameIn = h('input', { class: 'input', placeholder: '如：寒山寺' });
      modal({
        title: '标注宗门', width: '420px', okText: '创建',
        body: h('div', { class: 'col' },
          h('div', { class: 'field' }, h('label', {}, '宗门名'), nameIn),
          h('div', { class: 'tiny muted' },
            '落在' + (st.continentId ? '当前选中的板块' : '第一个板块') + '内的随机位置，阵营记作中立，创建后可直接拖动调整。')),
        onOk: () => createSect(nameIn.value.trim())
      });
      setTimeout(() => nameIn.focus(), 40);
    }

    function createSect(name) {
      if (!name) { toast('给宗门起个名字', 'err'); return false; }
      const p = plane();
      const cont = (p.continents || []).find(c => c.id === st.continentId) || (p.continents || [])[0] || null;
      let x = 500, y = 400;
      if (cont) {
        const ang = Math.random() * Math.PI * 2;
        const rad = 0.2 + Math.random() * 0.55;
        x = clamp(Math.round(cont.cx + Math.cos(ang) * cont.rx * rad), 26, 974);
        y = clamp(Math.round(cont.cy + Math.sin(ang) * cont.ry * rad), 26, 774);
      }
      const sec = {
        id: uid('s'), name, continentId: cont ? cont.id : '',
        x, y, align: 'neutral', size: 2, members: '', desc: '', characterIds: []
      };
      p.sects.push(sec);
      st.sectId = sec.id;
      NF.save();
      renderMain();
      renderRail();
      toast('已标注「' + name + '」', 'ok');
    }

    async function importBase() {
      const p = plane();
      try {
        const r = await window.nf.image.pickMapBase(p.id);
        if (!r || r.canceled || !r.baseImage) return;
        p.baseImage = r.baseImage;
        NF.save();
        renderMain();
        toast('底图已导入，可点「移除底图」还原', 'ok');
      } catch (e) {
        toast('导入底图失败：' + (e.message || ''), 'err');
      }
    }

    function removeBase() {
      plane().baseImage = null;
      NF.save();
      renderMain();
      toast('已移除底图', 'ok');
    }

    /* ---------- 起手 ---------- */
    renderSide(); renderMain(); renderRail();
  }
};
