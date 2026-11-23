import { h, clear, toast, modal, $ } from './util.js';
import { createHistory, pickFileName } from './undo.js';
import characters from './pages/characters.js';
import world from './pages/world.js';
import plot from './pages/plot.js';
import chapter from './pages/chapter.js';
import book from './pages/book.js';
import importer from './pages/importer.js';
import settings from './pages/settings.js';
import { paintBookChip, openLibrary, switchTo } from './library.js';
import { runBootAnimation } from './bootanim.js';

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
NF.modal = modal;                    /* 给页面 / 调试脚本直接用（书库弹窗也是这一套） */

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

/* ---------------- 保存 ----------------
 * 自动保存是「450ms 后再写」的定时器；切书时必须先把它落盘再切，
 * 而且切书的这一段要等它真的写完 —— 所以除了定时器，还要留住"正在写的那一笔"，
 * flush() 把两者都等完才算数。 */
let saveTimer = null;
let inflight = null;

async function writeNow() {
  const docTodo = NF.doc;
  if (!docTodo) return;
  const p = window.nf.data.save(docTodo);
  inflight = p;
  try {
    await p;
    NF.status('已保存 · ' + new Date().toLocaleTimeString('zh-CN', { hour12: false }));
  } catch (e) {
    toast('保存失败：' + e.message, 'err');
    NF.status('保存失败');
    throw e;
  } finally {
    if (inflight === p) inflight = null;
  }
}

function markDirty() {
  const el = document.getElementById('statRight');
  if (el) el.dataset.dirty = '1';
  NF.status('正在保存…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { saveTimer = null; writeNow().catch(() => {}); }, 450);
}

/* 立刻落盘并等写完：切书、新建、同步、关窗之前都走这里 */
NF.flush = async function () {
  clearTimeout(saveTimer);
  saveTimer = null;
  if (inflight) { try { await inflight; } catch (e) { /* 上面已经提示过 */ } }
  await writeNow();
};

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

/* ---------------- 书籍：新建 / 切换 / 删除 ----------------
 * 主进程切书时会把「当前书」换掉；界面这边要做的只有三件事：
 * 换 NF.doc、换书库登记、清掉撤销栈再整页重画。
 * 撤销栈必须清：里面存的是上一本书的快照，带着它按 Ctrl+Z 会把两本书的内容搅到一起。
 *
 * 参数写全、别收一个"大包"：{ doc, library, activeId } 这种结构里 doc 是真数据，
 * 之前把整个包当 doc 传进来，界面就显示成空壳了。 */
NF.adoptBook = async function (opts) {
  const o = opts || {};
  if (o.library) NF.library = o.library;
  let doc = o.doc || null;
  if (!doc) {
    try { doc = await window.nf.data.load(); } catch (e) { console.error('[adoptBook] load failed', e); }
  }
  if (doc) NF.doc = doc;
  try { NF.history.clear(); NF.history.prime(); } catch (e) { console.error(e); }
  paintChrome();
  NF.repaint();
};

NF.paintChrome = paintChrome;
NF.openLibrary = function () { openLibrary(NF); };
NF.switchBook = function (id) { return switchTo(NF, id); };

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

/* 顶栏与标题栏：书名、作者名、书库入口。切书、改名、改作者之后都要重画一次。
 * 只改顶栏文字，不动页面内容，所以撤销 / 切书后可以放心调用。 */
function paintChrome() {
  paintBookChip(NF);
  paintAuthor();
  const doc = NF.doc || {};
  document.title = (((doc.meta && doc.meta.title) || '未命名') + ' · 卷帙 NovelFolio');
  const chip = document.getElementById('authorChip');
  if (chip) chip.title = '点这里改作者名（当前：「' + ((doc.meta && doc.meta.author) || '我') + '」）';
}

/* 整页重画：换了一本书 / 删掉了当前书 / 从备份恢复之后用。
 * 和 route() 里"同一页就地重画"的快捷路径不冲突：这里直接把页面重建一遍，滚动位置与选中项都归零，
 * 正好是"翻开另一本书"该有的样子。 */
NF.repaint = function () {
  const view = document.getElementById('view');
  if (NF.view && typeof NF.view.unmount === 'function') { try { NF.view.unmount(); } catch (e) {} }
  NF.view = null;
  NF.viewParams = null;
  if (view) clear(view);
  route();
  paintChrome();
};

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
  nav.appendChild(starButton());
}

/* 顶栏「设置」右边的一键 star：跳到本项目的 GitHub 仓库。
 * 渲染进程跑在 contextIsolation 下，window.open 出不去；和生图网站一样走 IPC shell.openExternal
 * （main.js 那边只放行 http/https）。窗口露出来时顺手把按钮点亮，点过之后就一直是亮的。
 * 不带数字、不拉 GitHub API（CSP 里 connect-src 'none'，而且离线也要能用）——就是去点颗星。 */
const REPO_URL = 'https://github.com/Andrianxu/novel-create';
let starred = false;
function starButton() {
  return h('div', {
    class: 'mtab star' + (starred ? ' on' : ''),
    'data-probe': 'nav-star',
    title: starred ? '已经去点过星了，谢谢你 ☆' : '喜欢的话给「卷帙」点颗 star 吧 → ' + REPO_URL,
    onclick: async () => {
      try {
        await window.nf.image.openExternal(REPO_URL);
        starred = true;
        toast('已打开 GitHub，点右上角的 ★ Star 就好', 'ok');
        route();                          /* 重画导航：按钮变亮 */
      } catch (e) { toast('打开链接失败：' + e.message, 'err'); }
    }
  }, '★ Star');
}

/* 原地重画前把「滚到哪儿了」抄一份：clear(root) 之后这些容器都会归零，
 * 重挂后按原样放回去，撤销时页面视角才不跳。
 * 用「从 .page 往下的子元素序号」定位，不依赖深色选择器 / id——页面每次都是同一套结构重画。 */
function captureScroll(root) {
  const out = [];
  if (root) {
    (function walk(el, path) {
      if (el.scrollTop || el.scrollLeft) out.push({ path, top: el.scrollTop, left: el.scrollLeft, tag: el.tagName });
      const kids = el.children;
      for (let i = 0; i < kids.length; i++) walk(kids[i], path.concat(i));
    })(root, []);
  }
  const view = document.getElementById('view');
  return { items: out, view: view ? { top: view.scrollTop, left: view.scrollLeft } : null };
}
function restoreScroll(root, saved) {
  if (!saved) return;
  for (const item of saved.items) {
    if (!root) break;
    let el = root;
    for (const i of item.path) { el = el && el.children[i]; }
    if (!el || el.tagName !== item.tag) continue;
    if (item.left) el.scrollLeft = item.left;
    if (item.top) el.scrollTop = item.top;
  }
  const view = document.getElementById('view');
  if (view && saved.view) { view.scrollLeft = saved.view.left; view.scrollTop = saved.view.top; }
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
      const saved = captureScroll(root);
      if (typeof view.unmount === 'function') { try { view.unmount(); } catch (e) {} }
      clear(root);
      try { view.mount(root, { doc: NF.doc, params: NF.viewParams || {}, NF, refresh: true }); }
      catch (e) { console.error(e); }
      /* refresh: true 让页面知道这是「原地重画」：章节页据此接回作者刚才那一章，而不是回到第一章。 */
      restoreScroll(root, saved);
      return;
    }
  }
  NF.viewParams = null;
  const { id, params } = parseHash();
  const page = PAGES.find(p => p.id === id) || PAGES[0];
  renderNav(page.id);
  paintChrome();
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

/* ---------------- 顶栏：同步状态 + 作者名 ---------------- */

function paintSyncDot(state, title) {
  const el = document.getElementById('syncDot');
  if (!el) return;
  const s = NF.settings && NF.settings.sync;
  if (!s || !s.enabled) { el.hidden = true; return; }
  el.hidden = false;
  el.className = 'sync-dot ' + (state || '');
  el.title = '同步：' + (title || '已就绪');
}

async function runSync(silent) {
  const s = NF.settings && NF.settings.sync;
  if (!s || !s.enabled) return null;
  paintSyncDot('busy', '正在同步…');
  try {
    /* 先把界面里最新的数据落盘。主进程同步用的是它自己缓存的那份 doc，
     * 渲染层刚改、还没来得及自动保存的内容必须先交过去，否则会被云端覆盖掉。 */
    await NF.flush();                 /* 先把界面里最新的这一笔写完，再交给主进程去同步 */
    const r = await window.nf.sync.now();
    if (!r.ok) { paintSyncDot('err', r.message || '同步失败'); if (!silent) toast('同步失败：' + r.message, 'err'); return r; }
    if (r.changed) {
      /* 云端带来了新内容：换一份新数据并原地重画，别丢焦点和滚动位置 */
      try {
        const d = await window.nf.data.load();
        NF.doc = d;
        if (NF.current) history.prime && history.prime();
        NF.refresh();
      } catch (e) { console.error(e); }
    }
    paintSyncDot(r.conflicts && r.conflicts.length ? 'warn' : 'ok', r.message);
    if (!silent) toast(r.message, r.conflicts && r.conflicts.length ? '' : 'ok');
    return r;
  } catch (e) {
    paintSyncDot('err', e.message || '同步失败');
    if (!silent) toast('同步失败：' + e.message, 'err');
    return { ok: false, message: e.message };
  }
}
NF.runSync = runSync;
NF.paintSync = paintSyncDot;
NF.paintAuthor = paintAuthor;

function paintAuthor() {
  const name = ((NF.doc && NF.doc.meta && NF.doc.meta.author) || '我');
  const n = document.getElementById('authorName');
  const a = document.getElementById('authorAv');
  if (n) n.textContent = name;
  if (a) a.textContent = name.slice(0, 1);
}

function bindAuthorChip() {
  const chip = document.getElementById('authorChip');
  if (!chip) return;
  chip.addEventListener('click', () => {
    const cur = ((NF.doc && NF.doc.meta && NF.doc.meta.author)) || '';
    const inp = h('input', { class: 'input', value: cur, placeholder: '你的名字（显示在右上角）', maxlength: '24' });
    const m = modal({
      title: '作者名', body: h('div', {}, inp,
        h('div', { class: 'tiny muted', style: { marginTop: '8px' } }, '只是显示用的名字，不是账号，也不影响书稿内容。')),
      okText: '保存',
      onOk: () => {
        NF.doc.meta = NF.doc.meta || {};
        NF.doc.meta.author = inp.value.trim() || '我';
        paintChrome();                  /* 顶栏头像、作者名、书库里的作者一起跟上 */
        NF.save(); toast('作者名已更新', 'ok');
      }
    });
    setTimeout(() => inp.focus(), 30);
  });
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

/* 数据加载：启动动画和它并行跑，谁慢等谁。
 * info / settings 由 boot() 先取（它要拿开关状态），这里只取书库和正文。 */
async function loadAll() {
  /* 书库：先拿登记表（哪几本、现在开哪本），再按"当前书"读数据 */
  NF.library = await window.nf.books.list();
  NF.doc = await window.nf.data.load();
}

async function boot() {
  /* 动画只是「盖住等待」：它和加载同时开始，不占额外时间。
   * 这里的 catch 只负责把失败显示出来，动画照常收场，不让用户卡在启动页。 */
  let loadErr = null;
  const loading = loadAll().catch(e => { loadErr = e; });

  /* 开关要先知道（关了的话根本不该起动画）。
   * info / settings 是加载链最前面两步、各只要 1~2ms，等它们不会让启动变慢。 */
  const info = await window.nf.info().catch(() => null);
  const cfg = await window.nf.settings.get().catch(() => null);
  if (info) NF.info = info;
  if (cfg) NF.settings = cfg;
  const animOn = !(cfg && cfg.ui && cfg.ui.launchAnim === false);
  /* 启动动画已经由独立的 splash 窗口播过了（它比这个页面早好几秒出现），
   * 这里只等数据加载完、把遮罩收掉，不再重复演一遍 —— 否则用户会先看 splash 演完，
   * 再来看主界面又演一遍，等于开两次机。
   * 只有「没有 splash 撑场」的情况（自动化测试 / 开关关闭）才走原来的完整动画。 */
  if (info && info.splashPlayed) {
    await loading;
    const bootEl = document.getElementById('boot');
    if (bootEl) bootEl.remove();
  } else {
    /* info.bootSlow：只有自动化测试带 --slow=N 时才不是 1 */
    await runBootAnimation({ ready: loading, enabled: animOn, speed: (info && info.bootSlow) || 1 });
  }

  if (loadErr) {
    const root = document.getElementById('app');
    root.hidden = false;
    root.innerHTML = '';
    root.appendChild(Object.assign(document.createElement('div'),
      { className: 'boot', style: 'position:static;color:var(--muted);padding:40px;line-height:1.9' ,
        textContent: '启动失败：' + loadErr.message + '（这个界面需要在卷帙桌面程序里打开）' }));
    return;
  }
  paintChrome();
  bindAuthorChip();
  /* 顶栏的书名就是书库入口：点开可以新建 / 切换 / 改名 / 复制 / 删除 */
  const bookChip = document.getElementById('bookChip');
  if (bookChip) {
    bookChip.setAttribute('tabindex', '0');
    bookChip.setAttribute('role', 'button');
    bookChip.addEventListener('click', () => openLibrary(NF));
    bookChip.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLibrary(NF); } });
  }
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

  /* 关窗之前把没落盘的那一笔写完，顺手等主进程回一声 —— 否则关得快一点就丢一段 */
  window.addEventListener('beforeunload', () => {
    if (saveTimer || inflight) { try { window.nf.data.save(NF.doc); } catch (e) { /* ignore */ } }
  });

  /* 开了同步：启动后悄悄拉一次，把别的设备改过的内容并进来 */
  const syn = NF.settings && NF.settings.sync;
  NF.status(syn && syn.enabled ? '已就绪 · 书稿在你的网盘里同步' : '已就绪 · 数据只存在本机');
  if (syn && syn.enabled) {
    paintSyncDot('busy', '正在同步…');
    setTimeout(() => { runSync(true); }, 800);
  }
}
boot();
