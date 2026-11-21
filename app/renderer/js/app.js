import { h, clear, toast, modal, $ } from './util.js';
import { createHistory, pickFileName } from './undo.js';
import characters from './pages/characters.js';
import world from './pages/world.js';
import plot from './pages/plot.js';
import chapter from './pages/chapter.js';
import book from './pages/book.js';
import importer from './pages/importer.js';
import settings from './pages/settings.js';

const PAGES = [characters, world, plot, chapter, book, importer, settings];
const NAV = ['characters', 'world', 'plot', 'chapter', 'book', 'importer'];

const NF = {
  doc: null, settings: null, info: null, current: null,
  status(t) { const el = document.getElementById('statLeft'); if (el) el.textContent = t || '就绪'; },
  go(id, params) {
    const q = params ? '?' + Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&') : '';
    const next = '#' + id + q;
    if (location.hash === next) route(); else location.hash = next;
  },
  refresh() { route(); },
  save: null,
  undo() { return undoStep(); },     /* 别的页面想自己触发撤销时用 */
  redo() { return redoStep(); }
};
window.NF = NF;

/* ---------------- 撤销（Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y） ---------------- */

function dataRoot(v) {
  if (v && typeof v === 'object') {
    if (v.characterIds || v.timePoint != null || v.summary !== undefined) return 'plots';
    if (v.content !== undefined || v.volumeId !== undefined) return 'manuscripts';
    if (v.sects || v.realms || v.continents) return 'planes';
    if (v.persona !== undefined || v.identity !== undefined || v.relations !== undefined) return 'characters';
  }
  return 'doc';
}
/* 页面自己已经从数据里拿到的对象（人物、情节、稿件…）比按调用文件名猜更准 */
function guessRoot(a, label) {
  if (a && typeof a === 'object') {
    const root = dataRoot(a);
    if (root !== 'doc') return root;
  }
  return pickFileName() || 'doc';
}

let saveTimer = null;
function markDirty() {
  const el = document.getElementById('statRight');
  if (el) el.dataset.dirty = '1';
  NF.status('正在保存…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await window.nf.data.save(NF.doc);
      NF.status('已保存 · ' + new Date().toLocaleTimeString('zh-CN', { hour12: false }));
    } catch (e) { toast('保存失败：' + e.message, 'err'); NF.status('保存失败'); }
  }, 450);
}

const history = createHistory({
  getDoc: () => NF.doc,
  replaceDoc(d) {
    const view = NF.view;
    NF.doc = d;
    if (view && NF.current) view.sameId = { doc: d, id: NF.current };
    NF.refresh();                      /* 交给 route() 原地重画：不动地址栏，也不重建整个 #view */
    markDirty();                       /* 撤销也是改动：照样要落盘，不然关掉软件就白撤了 */
  },
  onChange(st) { paintHistory(st); }
});
NF.history = history;

/* 现有代码里的 NF.save() 都是「刚改完一处」的信号：借这一下把改动记进撤销栈。
 * 传了对象 / 名字就更准（NF.save(role, '改名')），不传也能用。 */
const rawSave = markDirty;
NF.save = function (anchor, label) {
  history.tick(anchor ? guessRoot(anchor, label) : '', label);
  rawSave();
};

function undoStep() {
  history.tick();                    /* 先把刚敲完、还没落栈的那一笔收进来，撤销才连得上 */
  const st = history.peek();
  if (!st.canUndo) { toast('没有可撤销的操作了'); return; }
  const r = history.undo();
  if (r) toast('已撤销「' + r.label + '」 · Ctrl+Y 或 Ctrl+Shift+Z 可重做', 'ok');
}
function redoStep() {
  history.tick();
  const st = history.peek();
  if (!st.canRedo) { toast('没有可重做的操作'); return; }
  const r = history.redo();
  if (r) toast('已重做「' + r.label + '」', 'ok');
}

/* 状态栏右侧的 ↶ / ↷ */
function paintHistory(st) {
  const u = document.getElementById('statUndo');
  if (!u) return;
  const s = st || history.peek();
  u.disabled = !s.canUndo;
  u.title = s.canUndo ? '撤销「' + s.undoLabel + '」（Ctrl+Z）' : '没有可撤销的操作';
  const r = document.getElementById('statRedo');
  if (r) {
    r.disabled = !s.canRedo;
    r.title = s.canRedo ? '重做「' + s.redoLabel + '」（Ctrl+Y）' : '没有可重做的操作';
  }
}
function buildHistoryBar() {
  const foot = document.querySelector('.statusbar');
  if (!foot) return;
  foot.insertBefore(h('span', { class: 'hist' },
    h('button', { id: 'statUndo', class: 'hist-btn', type: 'button', onclick: undoStep }, '↶ 撤销'),
    h('button', { id: 'statRedo', class: 'hist-btn', type: 'button', onclick: redoStep }, '↷ 重做')), foot.firstChild);
  paintHistory();
}


function parseHash() {
  const raw = (location.hash || '#characters').slice(1);
  const [id, qs] = raw.split('?');
  const params = {};
  if (qs) qs.split('&').forEach(kv => { const [k, v] = kv.split('='); if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
  return { id: id || 'characters', params };
}

function renderNav(activeId) {
  const nav = document.getElementById('nav');
  clear(nav);
  for (const id of NAV) {
    const p = PAGES.find(x => x.id === id);
    nav.appendChild(h('div', { class: 'mtab' + (id === activeId ? ' on' : ''), onclick: () => NF.go(id) }, p ? p.label : id));
  }
  nav.appendChild(h('div', { class: 'mtab' + (activeId === 'settings' ? ' on' : ''), onclick: () => NF.go('settings'), title: '设置' }, '设置'));
}

function route() {
  /* 撤销 / 重做换了一份新数据：页面不必重建，直接原地重画，免得输入焦点和滚动位置跳掉 */
  if (NF.view && NF.view.sameId && NF.view.sameId.doc === NF.doc && NF.view.sameId.id === NF.current) {
    const view = NF.view;
    view.sameId = null;
    const root = document.querySelector('#view > .page');
    if (root) {
      /* 复用同一个 .page 容器：滚到哪里还停在哪里。
       * 监听要按规矩先解再挂，容器也要先清空——mount() 只管往里加，不清就会叠出两份页面。 */
      if (typeof view.unmount === 'function') { try { view.unmount(); } catch (e) {} }
      clear(root);
      try { view.mount(root, { doc: NF.doc, params: NF.viewParams || {}, NF }); }
      catch (e) { console.error(e); }
      return;
    }
  }
  NF.viewParams = null;
  const { id, params } = parseHash();
  const page = PAGES.find(p => p.id === id) || PAGES[0];
  renderNav(page.id);
  const view = document.getElementById('view');
  if (NF.view && typeof NF.view.unmount === 'function') { try { NF.view.unmount(); } catch (e) {} }
  clear(view);
  const root = h('div', { class: 'page', 'data-probe': 'page-' + page.id });
  view.appendChild(root);
  NF.current = page.id;
  NF.view = page;
  NF.viewParams = params;
  try { page.mount(root, { doc: NF.doc, params, NF }); }
  catch (e) { console.error(e); root.appendChild(h('div', { class: 'empty' }, '页面出错：' + e.message)); }
  NF.status(page.statusText ? page.statusText(NF.doc) : '就绪');
}

function quickSearch() {
  const list = [];
  (NF.doc.characters || []).forEach(c => list.push({ t: '人物', n: c.name, go: () => NF.go('characters', { id: c.id }) }));
  (NF.doc.plots || []).forEach(p => list.push({ t: '情节', n: p.title + ' · ' + (p.chapter || ''), go: () => NF.go('plot', { id: p.id }) }));
  (NF.doc.planes || []).forEach(pl => (pl.sects || []).forEach(s => list.push({ t: '宗门', n: s.name + ' · ' + pl.name, go: () => NF.go('world', { plane: pl.id, sect: s.id }) })));
  const input = h('input', { class: 'input', placeholder: '输入名字 / 情节 / 宗门…' });
  const box = h('div', { class: 'col', style: { maxHeight: '46vh', overflow: 'auto', marginTop: '10px' } });
  const render = () => {
    const q = input.value.trim();
    clear(box);
    const hit = list.filter(x => !q || x.n.includes(q)).slice(0, 40);
    if (!hit.length) box.appendChild(h('div', { class: 'empty' }, '没有匹配'));
    hit.forEach(x => box.appendChild(h('div', { class: 'row', style: { padding: '6px 8px', borderRadius: '7px', cursor: 'pointer' }, onclick: () => { m.close(); x.go(); } },
      h('span', { class: 'pill' }, x.t), h('span', {}, x.n))));
  };
  input.addEventListener('input', render);
  const m = modal({ title: '快速跳转', body: h('div', {}, input, box), footer: false, width: '600px' });
  render();
  setTimeout(() => input.focus(), 30);
}

async function boot() {
  try {
    NF.info = await window.nf.info();
    NF.settings = await window.nf.settings.get();
    NF.doc = await window.nf.data.load();
  } catch (e) {
    document.getElementById('boot').textContent = '启动失败：' + e.message + '（这个界面需要在卷帙桌面程序里打开）';
    return;
  }
  document.getElementById('bookTitle').textContent = (NF.doc.meta && NF.doc.meta.title) || '卷帙';
  document.getElementById('authorName').textContent = (NF.doc.meta && NF.doc.meta.author) || '我';
  document.getElementById('statRight').textContent =
    'v' + NF.info.version + ' · 数据在 ' + NF.info.userData + (NF.info.encrypt ? ' · 密钥已系统加密' : ' · 系统不支持加密');
  const bootEl = document.getElementById('boot');
  if (bootEl) { bootEl.hidden = true; bootEl.remove(); }
  document.getElementById('app').hidden = false;
  history.prime();                   /* 先把「原封不动」的样子记成基准，第一笔改动才撤得回来 */
  document.getElementById('quickSearch').addEventListener('click', quickSearch);
  window.addEventListener('hashchange', route);
  buildHistoryBar();
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); quickSearch(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); NF.save(); }
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const key = String(e.key || '').toLowerCase();
    if (key === 'z') { e.preventDefault(); if (e.shiftKey) redoStep(); else undoStep(); }
    else if (key === 'y') { e.preventDefault(); redoStep(); }
  });
  /* 菜单栏 / 系统里的撤销、重做也走同一套 */
  window.addEventListener('beforeinput', e => {
    if (!e.inputType) return;
    if (e.inputType === 'historyUndo') { e.preventDefault(); undoStep(); }
    else if (e.inputType === 'historyRedo') { e.preventDefault(); redoStep(); }
  }, true);
  route();
  NF.status('已就绪 · 数据只存在本机');
}
boot();
