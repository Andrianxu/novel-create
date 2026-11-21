import { h, clear, toast, modal, injectStyle, uid, ago, STATUS } from '../util.js';

injectStyle('plot', `
/* ===== 情节页 · pl- ===== */
.pl-wrap{flex:1;min-width:0;display:flex;flex-direction:column;gap:10px;padding:12px 16px 14px;overflow:hidden}

/* ---- 顶部工具行 ---- */
.pl-head{flex:none;display:flex;align-items:center;gap:12px}
.pl-hgroup{display:flex;align-items:baseline;gap:12px;min-width:0}
.pl-title{font-family:var(--kai);font-size:23px;line-height:1;letter-spacing:.1em;margin:0;font-weight:400}
.pl-sub{font-size:11px;color:var(--muted);white-space:nowrap}
.pl-headacts{margin-left:auto;display:flex;gap:8px;flex:none}

/* ---- 时间轴卡片 ---- */
.pl-tl{flex:none;padding:10px 16px 12px;position:relative}
.pl-tlhead{display:flex;align-items:center;gap:14px;color:var(--sub)}
.pl-tlhead h3{font-family:var(--kai);font-size:13.5px;margin:0;font-weight:400;letter-spacing:.08em;color:var(--ink)}
.pl-lg{display:inline-flex;align-items:center;gap:5px;font-size:10.5px}
.pl-lg i{width:8px;height:8px;border-radius:50%;display:inline-block;background:var(--jade)}
.pl-lg i.later{border:1.5px dashed #C9973C;background:transparent}
.pl-lg i.ending{width:7px;height:7px;border-radius:1.5px;background:var(--seal);transform:rotate(45deg)}
.pl-hint{margin-left:auto;font-size:10px;color:var(--muted)}
.pl-track{position:relative;height:104px;margin-top:6px}
.pl-axis{position:absolute;left:0;right:0;top:58px;height:2px;border-radius:2px;background:linear-gradient(90deg,#2F6F63,#B98A3C 58%,#A8322A)}
.pl-vol{position:absolute;top:24px;bottom:18px;border-left:1px dashed #E6DAC4}
.pl-volname{position:absolute;top:82px;font-size:9.5px;color:#B6A98F;white-space:nowrap;letter-spacing:.04em}
.pl-node{position:absolute;top:58px;width:0;height:0;cursor:pointer}
.pl-node i{position:absolute;left:0;top:0;width:11px;height:11px;margin:-5.5px 0 0 -5.5px;border-radius:50%;border:2px solid var(--jade);background:#FFFCF5;display:block;transition:box-shadow .12s}
.pl-node.done i{background:var(--jade)}
.pl-node.later i{border-color:#C9973C;border-style:dashed;background:#FFFCF5}
.pl-node.ending i{width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:2px;background:var(--seal);border-color:var(--seal);transform:rotate(45deg)}
.pl-node:hover i{box-shadow:0 0 0 4px rgba(47,111,99,.13)}
.pl-node.later:hover i{box-shadow:0 0 0 4px rgba(201,151,60,.18)}
.pl-node.ending:hover i{box-shadow:0 0 0 4px rgba(168,50,42,.18)}
.pl-node.on i{box-shadow:0 0 0 4px rgba(47,111,99,.22)}
.pl-node.later.on i{box-shadow:0 0 0 4px rgba(201,151,60,.26)}
.pl-node.ending.on i{box-shadow:0 0 0 4px rgba(168,50,42,.24)}
.pl-node b{position:absolute;left:0;bottom:9px;transform:translateX(-50%);font-size:10px;font-weight:400;color:#201C18;white-space:nowrap;line-height:1.2;padding:0 2px}
.pl-node.on b{color:#7C291F}
.pl-node s{position:absolute;left:0;top:10px;transform:translateX(-50%);font-size:9px;color:#8C8272;text-decoration:none;white-space:nowrap}
.pl-track{cursor:crosshair}
.pl-track.dragging{cursor:grabbing}
.pl-node{cursor:grab;user-select:none}
.pl-track.dragging .pl-node{transition:none}
.pl-node.dragging{z-index:5}
.pl-node.dragging i{box-shadow:0 0 0 6px rgba(47,111,99,.2);transform:scale(1.25)}
.pl-node.dragging.later i{transform:scale(1.25)}
.pl-node.dragging b{color:#7C291F}
.pl-tick{position:absolute;top:58px;width:1px;height:7px;margin-top:-3px;background:#D8CBB2;pointer-events:none}
.pl-tick.tp-label{top:66px;height:auto;margin-top:0;background:none;font-size:8.5px;color:#B6A98F;transform:translateX(-50%);white-space:nowrap}
.pl-ghost{position:absolute;top:58px;width:0;height:0;pointer-events:none;z-index:4}
.pl-ghost i{position:absolute;left:0;top:0;width:13px;height:13px;margin:-6.5px 0 0 -6.5px;border-radius:50%;border:2px dashed var(--seal);background:#FFFCF5}
.pl-ghost b{position:absolute;left:0;bottom:12px;transform:translateX(-50%);font-size:10px;font-weight:400;color:var(--seal);white-space:nowrap;background:#FFFCF5;border:1px dashed #E0B9A8;border-radius:5px;padding:0 5px;line-height:1.5}
.pl-track .pl-drop-hint{position:absolute;right:0;top:0;font-size:9.5px;color:var(--muted)}

/* ---- 悬停气泡 ---- */
.pl-tip{position:fixed;left:0;top:0;z-index:8300;width:252px;display:none;background:rgba(38,32,26,.96);color:#F2EBDB;border-radius:9px;padding:10px 12px;box-shadow:0 12px 30px rgba(40,30,20,.32);pointer-events:none}
.pl-tip.on{display:block}
.pl-tip-h{display:flex;align-items:center;gap:8px;margin-bottom:5px}
.pl-tip-h b{font-family:var(--kai);font-size:13px;font-weight:400;letter-spacing:.04em;line-height:1.35}
.pl-tip-h .pill{font-size:9.5px;padding:1px 7px}
.pl-tip-m{font-size:10.5px;color:#BCB1A0;line-height:1.65}
.pl-tip-s{margin-top:6px;padding-top:6px;border-top:1px solid rgba(246,241,230,.14);font-size:11px;line-height:1.7;color:#E4DACA;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}

/* ---- 两栏 ---- */
.pl-cols{flex:1;min-height:0;display:flex;gap:10px}
.pl-list{flex:1.4;min-width:0;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.pl-detail{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;overflow:auto}
.pl-chead{flex:none;display:flex;align-items:center;gap:8px;padding:9px 12px;border-bottom:1px solid var(--line)}
.pl-chead h3{font-family:var(--kai);font-size:13px;margin:0;font-weight:400;letter-spacing:.06em}
.pl-cnt{font-size:10px;color:var(--muted)}
.pl-chead .r{margin-left:auto;font-size:10px;color:var(--muted)}

/* ---- 情节列表 ---- */
.pl-lhead,.pl-lrow{display:grid;grid-template-columns:30px minmax(0,1fr) 62px 76px minmax(0,1.05fr) 92px;align-items:center;gap:8px}
.pl-lhead{flex:none;padding:6px 12px;font-size:9.5px;letter-spacing:.08em;color:var(--muted);border-bottom:1px solid var(--line)}
.pl-lhead .rt{text-align:right}
.pl-lbody{flex:1;min-height:0;overflow:auto;padding:2px 6px 8px}
.pl-lrow{padding:6px;border-bottom:1px dashed #EFE7D7;cursor:pointer;font-size:12px;border-radius:7px}
.pl-lrow:hover{background:#FBF6EA}
.pl-lrow.on{background:#F7F0DF;box-shadow:inset 3px 0 0 var(--jade)}
.pl-lrow.drop-before{box-shadow:inset 0 3px 0 var(--seal);background:#FBEEE8}
.pl-lrow[draggable="true"]{cursor:grab}
.pl-lrow.dragging-row{opacity:.45}
.pl-idx{font-family:var(--mono);font-size:10px;color:#B3A78F}
.pl-ptitle{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pl-lrow.on .pl-ptitle{font-weight:700;color:#7C291F}
.pl-chap{font-family:var(--mono);font-size:10.5px;color:#5B5348;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pl-who{font-size:10.5px;color:#8C8272;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pl-rowacts{display:flex;gap:4px;justify-content:flex-end}
.pl-rowacts .btn{padding:2px 7px;font-size:10.5px}

/* ---- 详情卡 ---- */
.pl-din{padding:12px 14px;display:flex;flex-direction:column;gap:9px;flex:1}
.pl-dtop{display:flex;align-items:center;gap:8px;min-width:0}
.pl-dtop h2{font-family:var(--kai);font-size:17px;margin:0;font-weight:400;letter-spacing:.06em;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pl-dmeta{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:10.5px;color:var(--muted)}
.pl-dmeta b{font-weight:400;color:var(--sub)}
.pl-dsum{margin:0;font-size:12.5px;line-height:1.85;color:#332C25}
.pl-dsec{font-size:9.5px;letter-spacing:.1em;color:var(--muted)}
.pl-dchips{display:flex;flex-wrap:wrap;gap:6px}
.pl-chip{display:inline-flex;align-items:center;gap:5px;font-size:11px;background:#F8F2E4;border:1px solid var(--line);border-radius:999px;padding:2px 9px 2px 2px;cursor:pointer}
.pl-chip:hover{border-color:#CBB894}
.pl-chip i{width:17px;height:17px;border-radius:50%;color:#fff;font-style:normal;display:grid;place-items:center;font-size:9px;font-family:var(--kai)}
.pl-dacts{margin-top:auto;padding-top:10px;border-top:1px dashed var(--line);display:flex;gap:8px}

/* ---- 废案抽屉 ---- */
.pl-layer{display:none}
.pl-layer.on{display:block}
.pl-scrim{position:fixed;inset:0;background:rgba(40,32,24,.26);z-index:8400}
.pl-drawer{position:fixed;right:0;top:0;bottom:0;width:420px;z-index:8410;background:var(--panel);border-left:1px solid var(--line2);box-shadow:-20px 0 50px rgba(50,35,20,.18);display:flex;flex-direction:column}
.pl-dhead{flex:none;display:flex;align-items:center;gap:8px;padding:14px 16px 10px}
.pl-dhead h3{font-family:var(--kai);font-size:15px;margin:0;font-weight:400;letter-spacing:.08em}
.pl-x{margin-left:auto;cursor:pointer;color:var(--muted);font-size:14px;line-height:1;padding:2px 4px}
.pl-x:hover{color:var(--ink)}
.pl-dnote{flex:none;padding:0 16px 10px;font-size:10.5px;line-height:1.75;color:var(--muted)}
.pl-fchips{flex:none;display:flex;gap:6px;padding:0 16px 10px;border-bottom:1px solid var(--line)}
.pl-fchip{font-size:11px;padding:3px 10px;border-radius:999px;border:1px solid var(--line2);color:var(--sub);cursor:pointer;background:#FFFDF8;user-select:none}
.pl-fchip:hover{border-color:#CBB894}
.pl-fchip.on{background:var(--ink);border-color:var(--ink);color:var(--paper)}
.pl-slist{flex:1;min-height:0;overflow:auto;padding:4px 16px 10px}
.pl-scrap{display:flex;gap:10px;padding:11px 0;border-bottom:1px dashed var(--line)}
.pl-sbody{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}
.pl-st{display:flex;align-items:center;gap:6px;min-width:0}
.pl-stitle{font-size:12.5px;font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pl-ago{margin-left:auto;font-size:10px;color:var(--muted);white-space:nowrap;flex:none}
.pl-smeta{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.pl-origin{font-size:9.5px;padding:1px 7px;border-radius:999px;background:#F0E9DA;color:#5B5348;white-space:nowrap}
.pl-reason{font-size:9.5px;padding:1px 7px;border-radius:999px;background:#F7EBD3;color:#8A6421;white-space:nowrap}
.pl-ssum{margin:0;font-size:11.5px;line-height:1.7;color:#5B5348;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.pl-sacts{flex:none;display:flex;flex-direction:column;gap:5px;justify-content:center}
.pl-sacts .btn{padding:2px 8px;font-size:10.5px}
.pl-sfoot{flex:none;padding:10px 16px 14px;border-top:1px solid var(--line)}
.pl-empty{padding:28px 0;text-align:center;color:var(--muted);font-size:11.5px}

/* ---- 表单：相关人物多选 ---- */
.pl-pick{display:flex;flex-wrap:wrap;gap:6px;max-height:120px;overflow:auto;border:1px solid var(--line2);border-radius:8px;padding:8px;background:#FFFDF8}
.pl-pickchip{display:inline-flex;align-items:center;gap:5px;font-size:11px;padding:2px 10px 2px 2px;border-radius:999px;border:1px solid var(--line2);background:#FFFCF5;color:var(--sub);cursor:pointer;user-select:none}
.pl-pickchip:hover{border-color:#CBB894}
.pl-pickchip.on{background:#E2EEEA;border-color:#9CC3B7;color:#23604F}
.pl-pickchip i{width:17px;height:17px;border-radius:50%;color:#fff;font-style:normal;display:grid;place-items:center;font-size:9px;font-family:var(--kai)}

/* ---- 滚动条 ---- */
.pl-lbody::-webkit-scrollbar,.pl-detail::-webkit-scrollbar,.pl-slist::-webkit-scrollbar,.pl-pick::-webkit-scrollbar{width:8px}
.pl-lbody::-webkit-scrollbar-thumb,.pl-detail::-webkit-scrollbar-thumb,.pl-slist::-webkit-scrollbar-thumb,.pl-pick::-webkit-scrollbar-thumb{background:#E2D7C2;border-radius:5px;border:2px solid var(--panel)}
`);

/* 废案类别 → 中文。设定过滤把「设定」与「结局」两类一起收进来。 */
const KIND_LABEL = { plot: '情节', character: '人物', ending: '结局', world: '设定' };
const FILTERS = [
  { k: 'all', label: '全部', kinds: null },
  { k: 'plot', label: '情节', kinds: ['plot'] },
  { k: 'character', label: '人物', kinds: ['character'] },
  { k: 'world', label: '设定', kinds: ['world', 'ending'] }
];
const STATUS_KEYS = ['done', 'later', 'ending'];

/* 时间点怎么显示：整数原样，小数最多两位 */
function fmtTp(v) {
  const n = Number(v);
  if (!isFinite(n)) return '—';
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

export default {
  id: 'plot', label: '情节',
  statusText(doc) {
    const n = (doc.plots || []).length, s = (doc.scraps || []).length;
    return '情节 ' + n + ' 个节点 · 废案 ' + s + ' 条';
  },
  unmount() { if (this._cleanup) { this._cleanup(); this._cleanup = null; } },

  mount(root, ctx) {
    const { doc, params, NF } = ctx;
    if (!Array.isArray(doc.plots)) doc.plots = [];
    if (!Array.isArray(doc.scraps)) doc.scraps = [];

    /* ================= 状态与小工具 ================= */
    const st = { selId: null, filter: 'all', drawer: false };
    const touch = () => NF.save();
    const vols = () => (Array.isArray(doc.chapters) ? doc.chapters : []);
    const chars = () => (Array.isArray(doc.characters) ? doc.characters : []);
    /* 按时间点排序；时间点相同的保持原数组次序（Array#sort 是稳定排序） */
    const byTime = () => doc.plots.slice().sort((a, b) => (Number(a.timePoint) || 0) - (Number(b.timePoint) || 0));
    const current = () => doc.plots.find(p => p.id === st.selId) || null;
    const nameOf = id => { const c = chars().find(x => x.id === id); return c ? c.name : ''; };
    const namesOf = p => (p.characterIds || []).map(nameOf).filter(Boolean);
    const statusOf = s => STATUS[s] || { label: s || '未定', cls: 'grey' };
    const nodeCls = p => (STATUS[p.status] ? p.status : 'later');
    const nextTp = () => Math.max(0, ...doc.plots.map(p => Number(p.timePoint) || 0)) + 2;
    /* 稿件标题里的章号：先认阿拉伯数字；「第十八章」这类中文数字也认 */
    const CN_NUM = { 〇: 0, 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
    function cnToInt(cn) {
      if (!cn) return 0;
      let total = 0, cur = 0;
      for (const ch of cn) {
        if (ch === '十') { total += (cur || 1) * 10; cur = 0; }
        else if (ch === '百') { total += (cur || 1) * 100; cur = 0; }
        else if (CN_NUM[ch] != null) cur = CN_NUM[ch];
        else return 0;
      }
      return total + cur;
    }
    function chNum(s) {
      const t = String(s || '');
      /* 「第18章」「第18回」「18」 */
      const ar = t.match(/第\s*(\d+)\s*[章回节]/);
      if (ar) return Number(ar[1]);
      const cn = t.match(/第\s*([〇零一二三四五六七八九十百]+)\s*[章回节]/);
      if (cn) return cnToInt(cn[1]);
      const bare = t.match(/(\d+)/);
      return bare ? Number(bare[1]) : 0;
    }

    /* 下拉里一条稿件的写法：卷一 · 第五章 听雨断剑
     * 卷名 / 章名都从「章节写作」里取，不拼编号，避免出现 0 这种码 */
    function msLabel(m) {
      const v = (doc.chapters || []).find(x => x.id === m.volumeId);
      const vt = v && v.title ? String(v.title) : '';
      const mt = m.title || '未命名章';
      /* 卷名里常常已经含章名，重复的就不再叠一遍 */
      return vt && mt.indexOf(vt.split(' · ')[0]) < 0 ? vt + ' · ' + mt : mt;
    }

    /* ================= 骨架 ================= */
    const wrap = h('div', { class: 'pl-wrap' });
    const head = h('div', { class: 'pl-head', 'data-probe': 'plot-head' });
    const tlCard = h('div', { class: 'card pl-tl', 'data-probe': 'plot-axis' });
    const listCard = h('div', { class: 'card pl-list', 'data-probe': 'plot-list' });
    const detailCard = h('div', { class: 'card pl-detail', 'data-probe': 'plot-detail' });
    const tip = h('div', { class: 'pl-tip' });
    wrap.appendChild(head);
    wrap.appendChild(tlCard);
    wrap.appendChild(h('div', { class: 'pl-cols' }, listCard, detailCard));
    wrap.appendChild(tip);
    root.appendChild(wrap);

    const scrim = h('div', { class: 'pl-scrim', onclick: closeDrawer });
    const drawer = h('div', { class: 'pl-drawer', 'data-probe': 'plot-drawer' });
    const layer = h('div', { class: 'pl-layer' }, scrim, drawer);
    root.appendChild(layer);

    /* ================= 顶部工具行 ================= */
    function renderHead() {
      clear(head);
      const cnt = { done: 0, later: 0, ending: 0 };
      doc.plots.forEach(p => { if (cnt[p.status] != null) cnt[p.status] += 1; });
      head.appendChild(h('div', { class: 'pl-hgroup' },
        h('h1', { class: 'pl-title' }, '情节'),
        h('div', { class: 'pl-sub' },
          doc.plots.length + ' 个节点 · 已发生 ' + cnt.done + ' / 计划 ' + cnt.later + ' / 结局 ' + cnt.ending)));
      head.appendChild(h('div', { class: 'pl-headacts' },
        h('button', { class: 'btn pri', onclick: () => openForm(null) }, '＋ 新建情节'),
        h('button', { class: 'btn', onclick: openDrawer, title: '打开废案回收站' }, '◱ 废案篓 ' + doc.scraps.length)));
    }

    /* ================= 时间轴 ================= */

    function showTip(p, node) {
      const s = statusOf(p.status);
      const who = namesOf(p);
      clear(tip);
      tip.appendChild(h('div', { class: 'pl-tip-h' }, h('b', {}, p.title), h('span', { class: 'pill ' + s.cls }, s.label)));
      tip.appendChild(h('div', { class: 'pl-tip-m' }, '章节 ' + (p.chapter || '—') + ' · 地点 ' + (p.place || '—')));
      tip.appendChild(h('div', { class: 'pl-tip-m' }, '在场 ' + (who.length ? who.join(' · ') : '未标注')));
      tip.appendChild(h('div', { class: 'pl-tip-s' }, p.summary || '（还没有摘要）'));
      tip.classList.add('on');
      /* 默认落在节点下方，靠近光标；下方放不下时才翻到上方 */
      const r = node.getBoundingClientRect();
      const w = tip.offsetWidth, hh = tip.offsetHeight;
      const x = Math.max(10, Math.min(window.innerWidth - w - 10, Math.round(r.left - w / 2)));
      let y = Math.round(r.top + 16);
      if (y + hh > window.innerHeight - 10) y = Math.round(r.top - hh - 14);
      tip.style.left = x + 'px';
      tip.style.top = Math.round(Math.max(8, y)) + 'px';
    }
    function hideTip() { tip.classList.remove('on'); }

    /* ---------- 时间轴 ↔ 时间点的换算 ----------
     * 位置 = 时间点本身，直接线性映射到轴上（4% ~ 96%）。
     * 这样「改一条情节的时间点」只影响它自己，其它节点在轴上的位置纹丝不动 ——
     * 这正是拖动的预期：拖哪一个就只动哪一个。
     * 只有时间点完全相同的一簇会做一点推开处理，保证看得见、不叠在一起。 */
    const tpNum = p => { const n = Number(p && p.timePoint); return isFinite(n) ? n : 0; };
    const round2 = v => Math.round(v * 100) / 100;
    const MIN_GAP = 1.6;      /* 时间点相同时也至少隔开的百分比 */
    const SPAN_LO = 4, SPAN_HI = 96;

    /* 时间点 → 百分比。等比映射，单调、稳定：同一条情节点移动不会带动别人。
     * list 可以是任意子集，但映射必须只用「时间点」本身作参照，
     * 所以这里用一个和 list 无关的基准（0 ~ 最大时间点），避免增删情节时整体缩放。 */
    function tpToPct(tp, maxTp) {
      if (!(maxTp > 0)) return 50;
      return SPAN_LO + (tp / maxTp) * (SPAN_HI - SPAN_LO);
    }
    /* 排序列表 → 每个节点的百分比坐标 */
    function layoutSpots(list) {
      const n = list.length;
      if (!n) return [];
      const tps = list.map(tpNum);
      const maxTp = Math.max(...tps);
      if (!(maxTp > 0)) {
        /* 全是 0 或负数：退化成均匀排布 */
        return n === 1 ? [50] : tps.map((_, i) => SPAN_LO + (i / (n - 1)) * (SPAN_HI - SPAN_LO));
      }
      const spots = tps.map(t => tpToPct(t, maxTp));
      /* 时间点相同时把这一簇轻轻推开，只影响簇内，不影响别人 */
      for (let i = 1; i < n; i++) {
        if (spots[i] <= spots[i - 1] + 0.001) spots[i] = Math.min(SPAN_HI, spots[i - 1] + MIN_GAP);
      }
      return spots;
    }
    function nodeSpots(list) { return layoutSpots(list); }

    /* 轴上一点（百分比）落在哪两个相邻节点之间，以及插值比例
     * 返回 { i, f }：i 是左边节点的下标，f 是 0~1 的比例 */
    function locate(list, pct) {
      const n = list.length;
      const spots = layoutSpots(list);
      const t = Math.max(spots[0], Math.min(spots[n - 1], SPAN_LO + (pct / 100) * (SPAN_HI - SPAN_LO)));
      let i = 0;
      while (i < n - 2 && t > spots[i + 1]) i++;
      const seg = spots[i + 1] - spots[i] || 1;
      return { i, f: Math.max(0, Math.min(1, (t - spots[i]) / seg)) };
    }

    /* 轴上一点 → 时间点（允许小数）：夹在相邻两个节点的时间点之间插值 */
    function timeAtPct(list, pct) {
      const n = list.length;
      if (!n) return 1;
      if (n === 1) return tpNum(list[0]);
      const { i, f } = locate(list, pct);
      const a = tpNum(list[i]), b = tpNum(list[i + 1]);
      return a + (b - a) * f;
    }
    /* 轴上一点 → 如果在这一格新建，它前后的时间点该怎么取 */
    function insertAtPct(list, pct) {
      const n = list.length;
      if (!n) return { index: 0, tp: 1 };
      if (n === 1) return { index: pct >= 50 ? 1 : 0, tp: tpNum(list[0]) };
      const { i, f } = locate(list, pct);
      return { index: i + 1, tp: timeAtPct(list, pct), f };
    }

    function renderTimeline() {
      clear(tlCard);
      hideTip();
      ghostAt = null;
      const list = byTime();

      tlCard.appendChild(h('div', { class: 'pl-tlhead' },
        h('h3', {}, '时间轴'),
        h('span', { class: 'pl-lg' }, h('i', {}), '已发生'),
        h('span', { class: 'pl-lg' }, h('i', { class: 'later' }), '后续计划'),
        h('span', { class: 'pl-lg' }, h('i', { class: 'ending' }), '结局'),
        h('span', { class: 'pl-hint' }, list.length
          ? '悬停看摘要 · 点击选中 · 拖动节点改时间 · 双击空白处新建'
          : '双击时间轴空白处，在这条时间上新建情节')));

      const track = h('div', { class: 'pl-track' });
      track.appendChild(h('div', { class: 'pl-axis' }));

      /* 分卷：按卷数等分轴段，标出淡色分隔线与卷名 */
      const vs = vols();
      if (vs.length > 1) {
        vs.forEach((v, i) => {
          const pct = (i / vs.length) * 100;
          if (i > 0) track.appendChild(h('div', { class: 'pl-vol', style: { left: pct + '%' } }));
          track.appendChild(h('div', {
            class: 'pl-volname',
            style: { left: 'calc(' + pct + '% + ' + (i ? 6 : 0) + 'px)' }
          }, v.title || '卷' + (i + 1)));
        });
      }

      const spots = nodeSpots(list);
      /* 每段取一个刻度：段够宽就把两端的时间点标在节点下方，太挤就只在段中点标个「→」 */
      if (list.length > 1) {
        for (let i = 0; i < list.length; i++) {
          const tp = tpNum(list[i]);
          const left = spots[i] + '%';
          track.appendChild(h('span', { class: 'pl-tick', style: { left } }));
          if (i === 0 || spots[i] - spots[i - 1] >= 4.5) {
            track.appendChild(h('span', { class: 'pl-tick tp-label', style: { left } }, fmtTp(tp)));
          }
        }
      }
      const nodes = [];
      list.forEach((p, i) => {
        const node = h('div', {
          class: 'pl-node ' + nodeCls(p) + (p.id === st.selId ? ' on' : ''),
          style: { left: spots[i] + '%' },
          title: p.title + ' · 时间点 ' + (p.timePoint == null ? '—' : p.timePoint) + '（拖我改时间）',
          onclick: () => { if (!drag || !drag.moved) select(p.id); },
          onmouseenter: () => { if (!drag) showTip(p, node); },
          onmouseleave: hideTip,
          onmousedown: ev => startDrag(ev, p, list, node)
        }, h('b', {}, p.title), h('s', {}, p.chapter || ''), h('i', {}));
        track.appendChild(node);
        nodes.push({ node, p });
      });

      const pctOf = ev => {
        const rect = track.getBoundingClientRect();
        return Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100));
      };
      track.addEventListener('click', ev => {
        if (ev.target.closest('.pl-node')) return;
        const pct = pctOf(ev);
        const at = insertAtPct(list, pct);
        showGhostAt(track, pct, fmtTp(at.tp), at);
      });
      track.addEventListener('dblclick', ev => {
        if (ev.target.closest('.pl-node')) return;   /* 双击节点 = 打开编辑，不新建 */
        const pct = pctOf(ev);
        const at = insertAtPct(list, pct);
        openForm(null, at.tp, at);
      });
      tlCard.appendChild(track);
      trackEl = track;
    }
    let trackEl = null;
    let drag = null;
    let ghostAt = null;   /* 单击空白处留下的「将在这里新建」提示 */

    /* 画一个虚线幽灵节点 + 时间点标签，告诉用户双击会落在哪 */
    function showGhostAt(track, pct, tpText, at) {
      if (ghostAt && ghostAt.parentNode) ghostAt.remove();
      ghostAt = h('div', { class: 'pl-ghost', style: { left: pct + '%', display: '' } },
        h('b', {}, '双击在此新建 · 插在第 ' + (at && at.index != null ? at.index + 1 : '—') + ' 位 · 时间点约 ' + tpText), h('i', {}));
      track.appendChild(ghostAt);
    }

    /* 拖动时间轴上的节点：只管被拖的这一个，别的情节一动不动。
     * 位置不吸附 —— 鼠标停在哪就是哪，时间点由它左右两个「没动过的」邻居插值出来，
     * 所以可以是 1.5、6.35 这种小数；松手只写这一个 timePoint，其它节点的时间点原样保留。 */
    function startDrag(ev, p, list, nodeEl) {
      if (ev.button !== 0) return;
      ev.preventDefault();
      ev.stopPropagation();
      hideTip();
      const track = trackEl;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const startX = ev.clientX;
      const order = list.slice();                       /* 当前顺序（byTime 已排好） */
      const rest = order.filter(q => q.id !== p.id);    /* 别的情节：全程不动 */
      const restTps = rest.map(tpNum);
      drag = { p, moved: false };
      const ghost = h('div', { class: 'pl-ghost' }, h('b', {}, ''), h('i', {}));
      track.appendChild(ghost);
      track.classList.add('dragging');
      const myEl = nodeEl || null;
      if (myEl) myEl.classList.add('dragging');

      /* 鼠标所在的百分比 → 只给被拖的这个算一个新时间点，邻居的时间点完全不碰。
       * 因为轴就是时间点的线性映射，直接用反函数换算即可：pct → timePoint。 */
      const maxTp = Math.max(...order.map(tpNum), 0);
      const pctToTp = pct => {
        const lo = SPAN_LO, hi = SPAN_HI;
        const t = Math.max(lo, Math.min(hi, lo + (pct / 100) * (hi - lo)));
        if (!(maxTp > 0)) return 1;
        return round2(((t - lo) / (hi - lo)) * maxTp);
      };
      const place = pct => {
        let tp = pctToTp(pct);
        /* 跟别的情节撞到同一个时间点就往旁边让一点，免得两个点叠在一起 */
        if (restTps.some(v => Math.abs(v - tp) < 0.011)) {
          let bump = tp;
          for (let k = 0; k < 60; k++) {
            bump = round2(tp + (k + 1) * 0.02);
            if (bump > maxTp) bump = round2(tp - (k + 1) * 0.02);
            if (bump < 0) break;
            if (!restTps.some(v => Math.abs(v - bump) < 0.011)) break;
          }
          tp = Math.max(0, bump);
        }
        return { tp: Math.max(0, round2(tp)) };
      };

      const move = e => {
        if (!drag) return;
        if (Math.abs(e.clientX - startX) > 2) drag.moved = true;
        const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const got = place(pct);
        drag.tp = got.tp;
        /* 只有被拖的这个跟着鼠标走，其它节点一个像素都不动 */
        if (myEl) myEl.style.left = pct + '%';
        ghost.style.left = pct + '%';
        const label = ghost.querySelector('b');
        if (label) label.textContent = '时间点 ' + fmtTp(got.tp);
        ghost.style.display = drag.moved ? '' : 'none';
      };
      const up = () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
        track.classList.remove('dragging');
        if (ghost.parentNode) ghost.remove();
        if (myEl) myEl.classList.remove('dragging');
        const d = drag; drag = null;
        if (!d || !d.moved || d.tp == null) { renderTimeline(); return; }
        /* 落盘：只改这一个情节的时间点，其它情节原样不动 */
        p.timePoint = round2(Math.max(0, d.tp));
        touch();
        renderAll();
        select(p.id);
        toast('「' + p.title + '」时间点改为 ' + fmtTp(p.timePoint), 'ok');
      };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
      move(ev);
    }

    /* ---------- 列表拖拽排序 ----------
     * 列表按时间点排序，所以「拖到某一行前面」= 让它和途中经过的那几条交换时间点。
     * 只交换涉及到的这几条，没经过的情节时间点一点都不动。 */
    let listDragId = null;
    function clearRowMarks() {
      listBody.querySelectorAll('.pl-lrow').forEach(r => r.classList.remove('drop-before'));
    }
    function movePlotInList(fromId, toId) {
      const list = byTime();
      const from = list.findIndex(p => p.id === fromId);
      const to = list.findIndex(p => p.id === toId);
      if (from < 0 || to < 0 || from === to) return;
      const moved = list.splice(from, 1)[0];
      let target = to;                    /* 插到目标行之前 */
      if (from < to) target = to - 1;
      list.splice(target, 0, moved);
      /* 只把移动路径上那几条的时间点轮换一圈，其它情节原样不动 */
      const lo = Math.min(from, target), hi = Math.max(from, target);
      const tps = list.slice(lo, hi + 1).map(p => tpNum(p));
      tps.unshift(tps.pop());             /* 末尾那个的时间点挪到最前 */
      list.slice(lo, hi + 1).forEach((p, i) => { p.timePoint = tps[i]; });
      touch();
      renderAll();
      toast('已把「' + moved.title + '」移到第 ' + (target + 1) + ' 位', 'ok');
    }

    /* ================= 情节列表 ================= */
    let listBody = null;
    function renderList() {
      clear(listCard);
      const list = byTime();
      listCard.appendChild(h('div', { class: 'pl-chead' },
        h('h3', {}, '情节列表'),
        h('span', { class: 'pl-cnt' }, list.length + ' 条'),
        h('span', { class: 'r' }, '按时间点排序')));

      listCard.appendChild(h('div', { class: 'pl-lhead' },
        h('span', {}, '序号'), h('span', {}, '情节名'), h('span', {}, '章节'),
        h('span', {}, '状态'), h('span', {}, '相关人物'), h('span', { class: 'rt' }, '操作')));

      const body = h('div', { class: 'pl-lbody' });
      if (!list.length) body.appendChild(h('div', { class: 'empty' }, '还没有情节节点，点右上角「新建情节」'));
      list.forEach((p, i) => {
        const s = statusOf(p.status);
        const who = namesOf(p);
        const row = h('div', {
          class: 'pl-lrow' + (p.id === st.selId ? ' on' : ''),
          draggable: 'true',
          title: '拖动这一行可以调整它在时间上的先后',
          onclick: () => select(p.id),
          ondragstart: ev => {
            listDragId = p.id;
            ev.dataTransfer.effectAllowed = 'move';
            try { ev.dataTransfer.setData('text/plain', p.id); } catch (e) {}
            row.style.opacity = '0.45';
          },
          ondragend: () => { row.style.opacity = ''; listDragId = null; clearRowMarks(); },
          ondragover: ev => {
            if (!listDragId || listDragId === p.id) return;
            ev.preventDefault();
            ev.dataTransfer.dropEffect = 'move';
            clearRowMarks();
            row.classList.add('drop-before');
          },
          ondragleave: () => row.classList.remove('drop-before'),
          ondrop: ev => {
            ev.preventDefault();
            const fromId = listDragId;
            listDragId = null;
            clearRowMarks();
            if (!fromId || fromId === p.id) return;
            movePlotInList(fromId, p.id);
          }
        },
          h('span', { class: 'pl-idx' }, String(i + 1).padStart(2, '0')),
          h('span', { class: 'pl-ptitle', title: p.title }, p.title),
          h('span', { class: 'pl-chap' }, p.chapter || '—'),
          h('span', {}, h('span', { class: 'pill ' + s.cls }, s.label)),
          h('span', { class: 'pl-who', title: who.join(' · ') },
            who.length ? (who.length > 2 ? who.slice(0, 2).join('、') + ' 等 ' + who.length + ' 人' : who.join('、')) : '—'),
          h('span', { class: 'pl-rowacts' },
            h('button', { class: 'btn xs', onclick: e => { e.stopPropagation(); openForm(p); } }, '编辑'),
            h('button', { class: 'btn xs', onclick: e => { e.stopPropagation(); scrapPlot(p); } }, '删除')));
        body.appendChild(row);
      });
      listBody = body;
      listCard.appendChild(body);
    }

    /* ================= 选中详情 ================= */
    function renderDetail() {
      clear(detailCard);
      const p = current();
      const idx = p ? byTime().findIndex(x => x.id === p.id) + 1 : 0;
      detailCard.appendChild(h('div', { class: 'pl-chead' },
        h('h3', {}, '情节详情'),
        h('span', { class: 'pl-cnt' }, p ? '第 ' + idx + ' / ' + doc.plots.length + ' 个节点' : '')));

      if (!p) {
        detailCard.appendChild(h('div', { class: 'empty' }, '在时间轴或左侧列表里选一个节点'));
        return;
      }
      const s = statusOf(p.status);
      const ids = (p.characterIds || []).filter(id => nameOf(id));
      const chips = ids.map(id => {
        const c = chars().find(x => x.id === id);
        return h('span', { class: 'pl-chip', onclick: () => NF.go('characters', { id: c.id }), title: '在人物页打开' },
          h('i', { style: { background: c.color || '#2F6F63' } }, c.name.slice(0, 1)), c.name);
      });

      detailCard.appendChild(h('div', { class: 'pl-din' },
        h('div', { class: 'pl-dtop' }, h('h2', { title: p.title }, p.title), h('span', { class: 'pill ' + s.cls }, s.label)),
        h('div', { class: 'pl-dmeta' },
          h('span', {}, '章节 ', h('b', {}, p.chapter || '—')),
          h('span', {}, '时间点 ', h('b', {}, String(p.timePoint == null ? '—' : p.timePoint))),
          h('span', {}, '地点 ', h('b', {}, p.place || '—'))),
        h('p', { class: 'pl-dsum' }, p.summary || '（还没有摘要）'),
        h('div', { class: 'pl-dsec' }, '相关人物'),
        chips.length ? h('div', { class: 'pl-dchips' }, chips) : h('div', { class: 'pl-dmeta' }, '未标注相关人物'),
        h('div', { class: 'pl-dacts' },
          h('button', { class: 'btn xs', onclick: () => openForm(p) }, '编辑'),
          h('button', { class: 'btn xs', onclick: () => NF.go('chapter', { plot: p.id }), title: '跳到章节写作里对应的一章' }, '去章节里写'),
          h('button', { class: 'btn xs', onclick: () => scrapPlot(p) }, '移到废案'))));
    }

    /* ================= 新建 / 编辑表单 ================= */
    /* presetTime：在时间轴上双击时传进来的时间点，新建时就落在那儿
     * at：双击位置算出来的插入位次 { index }，保存时按这个位次插进列表再归一化 */
    function openForm(plot, presetTime, at) {
      const isNew = !plot;
      const model = isNew
        ? { id: uid('g'), title: '', chapter: '', chapterNo: 0, timePoint: presetTime == null ? nextTp() : presetTime, place: '', characterIds: [], status: 'later', summary: '' }
        : Object.assign({}, plot, { characterIds: (plot.characterIds || []).slice() });

      const titleIn = h('input', { class: 'input', value: model.title, placeholder: '例如：雪夜断桥' });
      /* 章节：直接列出「章节写作」里的稿件，选中哪条就关联哪条（不带编号，不会出现 0|标题） */
      const msList = (doc.manuscripts || []).slice();
      const chapSel = h('select', { class: 'select', id: 'pl-chap-sel' });
      chapSel.appendChild(h('option', { value: '' }, '（不指定章节）'));
      /* 认章节：先比标题完全相同，再比章号（章号必须两边都非零，否则空值会误配到第一篇） */
      const wantNo = chNum(model.chapter || '');
      const sameChapter = m => (model.chapter && model.chapter === m.title) || (wantNo > 0 && chNum(m.title) === wantNo);
      msList.forEach(m => {
        chapSel.appendChild(h('option', { value: m.title, selected: !!sameChapter(m) }, msLabel(m)));
      });
      /* 老数据里的章节名不在稿件列表里：补一条，别把已有值弄丢 */
      const matched = msList.some(sameChapter);
      if (model.chapter && !matched) {
        chapSel.appendChild(h('option', { value: model.chapter, selected: true }, model.chapter + '（原有，未对上稿件）'));
      }
      const tpIn = h('input', { class: 'input', type: 'number', min: '0', step: '0.01', value: String(model.timePoint == null ? nextTp() : round2(model.timePoint)) });
      const placeIn = h('input', { class: 'input', value: model.place || '', placeholder: '例如：临水 · 断桥' });
      const statusSel = h('select', { class: 'select' },
        STATUS_KEYS.map(k => h('option', { value: k, selected: k === model.status }, STATUS[k].label)));
      const sumTa = h('textarea', { class: 'ta', style: { minHeight: '74px' } }, model.summary || '');

      const pick = h('div', { class: 'pl-pick' });
      if (!chars().length) pick.appendChild(h('span', { class: 'small muted' }, '还没有人物，可先去「人物」页新建'));
      chars().forEach(c => {
        const chip = h('span', { class: 'pl-pickchip' + (model.characterIds.includes(c.id) ? ' on' : '') },
          h('i', { style: { background: c.color || '#2F6F63' } }, c.name.slice(0, 1)), c.name);
        chip.addEventListener('click', () => {
          const i = model.characterIds.indexOf(c.id);
          if (i >= 0) model.characterIds.splice(i, 1); else model.characterIds.push(c.id);
          chip.classList.toggle('on');
        });
        pick.appendChild(chip);
      });

      modal({
        title: isNew ? '新建情节' : '编辑情节', width: '700px',
        body: h('div', { class: 'col', style: { gap: '10px' } },
          h('div', { class: 'field' }, h('label', {}, '情节名'), titleIn),
          h('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } },
            h('div', { class: 'field', style: { flex: '2' } }, h('label', {}, '章节（对应章节写作里的稿件）'), chapSel),
            h('div', { class: 'field', style: { flex: '1' } }, h('label', {}, '时间点'), tpIn)),
          h('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } },
            h('div', { class: 'field', style: { flex: '2' } }, h('label', {}, '地点'), placeIn),
            h('div', { class: 'field', style: { flex: '1' } }, h('label', {}, '状态'), statusSel)),
          h('div', { class: 'field' }, h('label', {}, '摘要'), sumTa),
          h('div', { class: 'field' }, h('label', {}, '相关人物'), pick),
          h('div', { class: 'tiny muted' },
            presetTime == null
              ? '时间点决定节点在时间轴上的次序，可以带小数；保存后会按前后顺序自动校正成不冲突的值。'
              : '已按你双击的位置预填时间点 ' + fmtTp(presetTime) + '，可以在这里再改；保存后按前后顺序自动校正。')),
        okText: '保存',
        onOk: () => {
          const title = titleIn.value.trim();
          if (!title) { toast('请填写情节名', 'err'); return false; }
          const chapter = chapSel.value || '';
          /* 只认标题完全相同的那条；章号兜底要两个号都非零才算，否则会误配到第一篇 */
          const chNo = chNum(chapter);
          const hit = msList.find(m => m.title === chapter) || (chNo ? msList.find(m => chNum(m.title) === chNo) : null);
          model.title = title;
          model.chapter = hit ? hit.title : chapter;
          model.chapterNo = hit ? chNum(hit.title) : chNo;
          const tpVal = Number(tpIn.value);
          model.timePoint = isFinite(tpVal) ? round2(Math.max(0, tpVal)) : nextTp();
          model.place = placeIn.value.trim();
          model.status = statusSel.value;
          model.summary = sumTa.value.trim();
          /* 只动当前这一条：别的情节的时间点一概不碰（和拖动保持一致）。
           * 撞到别人的时间点就让自己让开 0.02 的整数倍。 */
          const target = isNew ? model : plot;
          if (!isNew) Object.assign(plot, model);
          const others = doc.plots.filter(q => q.id !== target.id).map(tpNum);
          if (others.some(v => Math.abs(v - target.timePoint) < 0.011)) {
            const base = target.timePoint;
            let v = base;
            for (let k = 0; k < 200; k++) {
              v = round2(base + (k + 1) * 0.02);
              if (!others.some(o => Math.abs(o - v) < 0.011)) break;
            }
            target.timePoint = Math.max(0, v);
          }
          if (isNew) doc.plots.push(target);
          st.selId = model.id;
          touch();
          renderAll();
          toast(isNew ? '已新建情节节点' : '情节已保存', 'ok');
        }
      });
      setTimeout(() => titleIn.focus(), 40);
    }

    /* ================= 删除 = 移到废案 ================= */
    function scrapPlot(p) {
      const i = doc.plots.findIndex(x => x.id === p.id);
      if (i < 0) return;
      doc.plots.splice(i, 1);
      doc.scraps.unshift({
        id: uid('x'), kind: 'plot', title: p.title,
        origin: p.chapter || '未标章节', reason: '手动删除',
        removedAt: new Date().toISOString(),
        summary: p.summary || '',
        payload: JSON.parse(JSON.stringify(p))
      });
      if (st.selId === p.id) {
        const next = byTime()[0];
        st.selId = next ? next.id : null;
      }
      touch();
      renderAll();
      toast('已移入废案回收站', 'ok');
    }

    /* ================= 废案回收站 ================= */
    function openDrawer() {
      st.drawer = true;
      layer.classList.add('on');
      renderDrawer();
    }
    function closeDrawer() {
      st.drawer = false;
      layer.classList.remove('on');
    }

    function restoreScrap(s) {
      if (!s.payload) { toast('这条废案没有保存原始数据，无法恢复', 'err'); return; }
      const rest = JSON.parse(JSON.stringify(s.payload));
      if (doc.plots.some(p => p.id === rest.id)) rest.id = uid('g');
      doc.plots.push(rest);
      doc.scraps = doc.scraps.filter(x => x.id !== s.id);
      st.selId = rest.id;
      touch();
      renderAll();
      toast('已恢复为情节节点', 'ok');
    }

    function discardScrap(s) {
      doc.scraps = doc.scraps.filter(x => x.id !== s.id);
      touch();
      renderHead();
      renderDrawer();
      toast('已彻底删除', 'ok');
    }

    function clearScraps() {
      const n = doc.scraps.length;
      if (!n) return;
      modal({
        title: '清空回收站', width: '430px',
        body: h('div', { class: 'col' },
          h('p', { class: 'small sub', style: { margin: 0, lineHeight: '1.85' } },
            '将彻底删除回收站里的 ' + n + ' 条废案，删除后无法恢复。'),
          h('p', { class: 'tiny muted', style: { margin: 0 } }, '若只是暂时不想看到它们，直接关闭抽屉即可。')),
        okText: '确认清空',
        onOk: () => {
          doc.scraps = [];
          touch();
          renderAll();
          toast('回收站已清空', 'ok');
        }
      });
    }

    function scrapRow(s) {
      return h('div', { class: 'pl-scrap' },
        h('div', { class: 'pl-sbody' },
          h('div', { class: 'pl-st' },
            h('span', { class: 'pl-stitle', title: s.title }, s.title || '未命名'),
            h('span', { class: 'pill grey' }, KIND_LABEL[s.kind] || '其他'),
            h('span', { class: 'pl-ago' }, ago(s.removedAt) || '日期未知')),
          h('div', { class: 'pl-smeta' },
            h('span', { class: 'pl-origin' }, '原位置 · ' + (s.origin || '—')),
            h('span', { class: 'pl-reason' }, s.reason || '未注明原因')),
          h('p', { class: 'pl-ssum' }, s.summary || '（没有摘要）')),
        h('div', { class: 'pl-sacts' },
          h('button', {
            class: 'btn xs', disabled: !s.payload,
            title: s.payload ? '恢复到情节' : '这条废案没有保存原始数据，只能删除',
            onclick: () => restoreScrap(s)
          }, '恢复'),
          h('button', { class: 'btn xs', onclick: () => discardScrap(s) }, '彻底删除')));
    }

    function renderDrawer() {
      clear(drawer);
      const all = doc.scraps;
      const f = FILTERS.find(x => x.k === st.filter) || FILTERS[0];
      const hit = all.filter(s => !f.kinds || f.kinds.includes(s.kind));

      drawer.appendChild(h('div', { class: 'pl-dhead' },
        h('h3', {}, '废案回收站'),
        h('span', { class: 'pill gold' }, all.length + ' 条'),
        h('span', { class: 'pl-x', onclick: closeDrawer, title: '关闭' }, '✕')));
      drawer.appendChild(h('div', { class: 'pl-dnote' },
        '从时间轴移除的情节会先落到这里，可随时恢复；90 天后自动清理。'));
      drawer.appendChild(h('div', { class: 'pl-fchips' },
        FILTERS.map(x => h('span', {
          class: 'pl-fchip' + (st.filter === x.k ? ' on' : ''),
          onclick: () => { st.filter = x.k; renderDrawer(); }
        }, x.label))));

      const listEl = h('div', { class: 'pl-slist' });
      if (!hit.length) {
        listEl.appendChild(h('div', { class: 'pl-empty' },
          st.filter === 'all' ? '回收站是空的，删掉的情节会先落到这里' : '这一类还没有废案'));
      }
      hit.forEach(s => listEl.appendChild(scrapRow(s)));
      drawer.appendChild(listEl);

      drawer.appendChild(h('div', { class: 'pl-sfoot' },
        h('button', {
          class: 'btn', style: { width: '100%', justifyContent: 'center' },
          disabled: !all.length, onclick: clearScraps
        }, '清空回收站')));
    }

    /* ================= 保留期：与抽屉里的「90 天后自动清理」一致 ================= */
    const KEEP_DAYS = 90;
    function purgeExpired() {
      const limit = Date.now() - KEEP_DAYS * 864e5;
      const keep = [];
      let gone = 0;
      doc.scraps.forEach(s => {
        const t = new Date(s.removedAt).getTime();
        if (isFinite(t) && t < limit) gone += 1; else keep.push(s);
      });
      if (!gone) return 0;
      doc.scraps = keep;
      touch();
      return gone;
    }

    /* ================= 渲染与选中 ================= */
    function select(id) {
      st.selId = id;
      renderTimeline();
      renderList();
      renderDetail();
    }
    function renderAll() {
      renderHead();
      renderTimeline();
      renderList();
      renderDetail();
      if (st.drawer) renderDrawer();
    }

    const first = byTime()[0];
    st.selId = params.id && doc.plots.some(p => p.id === params.id) ? params.id : (first ? first.id : null);
    const expired = purgeExpired();
    renderAll();
    if (expired) toast('已清理 ' + expired + ' 条超过 ' + KEEP_DAYS + ' 天的废案', 'ok');

    const onKey = e => { if (e.key === 'Escape' && st.drawer) closeDrawer(); };
    window.addEventListener('keydown', onKey);
    this._cleanup = () => window.removeEventListener('keydown', onKey);
  }
};
