import { h, clear, toast, modal, $ } from './util.js';
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
  save: null
};
window.NF = NF;

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
NF.save = markDirty;

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
  document.getElementById('boot').hidden = true;
  document.getElementById('app').hidden = false;
  document.getElementById('quickSearch').addEventListener('click', quickSearch);
  window.addEventListener('hashchange', route);
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); quickSearch(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); markDirty(); }
  });
  route();
  NF.status('已就绪 · 数据只存在本机');
}
boot();
