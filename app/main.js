'use strict';
const __PROC_T0 = Date.now();
/* 只在自动化测试时打启动耗时，正常启动安静 */
const T = (label) => { if (process.argv.some(a => /^--(eval|probe|shot)=/.test(a))) console.log('TIMING ' + label + '=' + (Date.now() - __PROC_T0)); };
const { app, BrowserWindow, ipcMain, dialog, shell, safeStorage, clipboard } = require('electron');
const fs = require('fs');
const path = require('path');
const P = require('./lib/paths');
const bookcase = require('./lib/bookcase');
const store = require('./lib/store');
const settings = require('./lib/settings');
const llm = require('./lib/llm');
const parse = require('./lib/parse');
const exportdoc = require('./lib/exportdoc');
const syncer = require('./lib/syncer');

let win = null;
let doc = null;
function getDoc() { if (!doc) doc = store.load(); return doc; }
function persist() { if (doc) store.save(doc); }
/* 当前打开的是哪本书：书库登记表说了算 */
function currentBookId() { return bookcase.activeId(); }
/* 书库现状，顺手给渲染层带上每本书的规模，切换器里能直接看到 */
function libraryInfo() {
  const lib = bookcase.listBooks();
  const map = new Map(lib.books.map(b => [b.id, b]));
  return {
    activeId: lib.activeId,
    books: lib.books.map(b => {
      let stats = { characters: 0, plots: 0, chapters: 0 };
      try {
        const d = bookcase.readJson(bookcase.bookFile(b.id), null);
        if (d) stats = {
          characters: (d.characters || []).length,
          plots: (d.plots || []).length,
          chapters: (d.chapters || []).length
        };
      } catch (e) {}
      return Object.assign({}, map.get(b.id) || b, stats);
    })
  };
}

const shotArg = process.argv.find(a => a.startsWith('--shot='));
const pageArg = process.argv.find(a => a.startsWith('--page='));
const probeArg = process.argv.find(a => a.startsWith('--probe='));
const evalArg = process.argv.find(a => a.startsWith('--eval='));
const clickArg = process.argv.find(a => a.startsWith('--click='));
const outArg = process.argv.find(a => a.startsWith('--out='));
const udArg = process.argv.find(a => a.startsWith('--ud='));
/* 脚本化验证专用：给了这个目录，导出就不弹保存框，直接写进该目录。
 * 和 --shot / --probe / --ud 一样，只为在真窗口里跑自动化测试时用；正常启动不会带它。 */
const exportDirArg = process.argv.find(a => a.startsWith('--export-dir='));
/* 同上：--slow=10 把启动动画放慢 10 倍，方便自动化逐帧抓图。正常启动不带这个参数。 */
const slowArg = process.argv.find(a => a.startsWith('--slow='));
const bootSlowMs = (() => {
  const n = slowArg ? parseFloat(slowArg.split('=')[1]) : 1;
  return Number.isFinite(n) && n > 0 && n <= 50 ? n : 1;
})();
if (udArg) {
  const dir = udArg.split('=').slice(1).join('=');
  try { fs.mkdirSync(dir, { recursive: true }); app.setPath('userData', dir); } catch (e) { console.error(e); }
}

async function runProbe() {
  const out = probeArg.split('=').slice(1).join('=');
  try {
    const res = await win.webContents.executeJavaScript(PROBE_JS);
    fs.writeFileSync(out, JSON.stringify(res, null, 1));
    console.log('probe ' + JSON.stringify(res).slice(0, 1500));
  } catch (e) { console.error('probe failed', e); }
}
const PROBE_JS = "(function(){\n  var rects={};\n  document.querySelectorAll('[data-probe]').forEach(function(e){\n    var b=e.getBoundingClientRect();\n    rects[e.getAttribute('data-probe')]=[Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)];\n  });\n  var v=document.querySelector('#view');\n  return {docH:document.documentElement.scrollHeight,docW:document.documentElement.scrollWidth,\n          winH:innerHeight,winW:innerWidth,\n          viewScrollH:v?v.scrollHeight:0,viewClientH:v?v.clientHeight:0,\n          hash:location.hash,rects:rects};\n})()";

async function runEval() {
  const src = evalArg.split('=').slice(1).join('=');
  const dst = outArg ? outArg.split('=').slice(1).join('=') : null;
  try {
    const code = fs.readFileSync(src, 'utf8');
    /* 脚本没写 return 时结果是 undefined，照样要收尾，不能让它把整轮验证卡住 */
    const res = await win.webContents.executeJavaScript('(async()=>{' + code + '})()', true).then(v => v === undefined ? null : v);
    const text = JSON.stringify(res, null, 1);
    if (dst) fs.writeFileSync(dst, text);
    console.log('eval ' + (text || '').slice(0, 4000));
  } catch (e) {
    const msg = JSON.stringify({ error: String(e && e.message || e) }, null, 1);
    if (dst) fs.writeFileSync(dst, msg);
    console.error('eval failed ' + String(e && e.message || e));
  }
}

/* ---------------- 启动动画窗口 ----------------
 * 点 exe 到主界面出第一帧要三四秒（Electron 起渲染进程 + 解析约 500KB 的页面脚本），
 * 这段时间如果什么都不显示，用户看到的就是白屏 —— 那才是「启动慢」的真正体感。
 * 所以先开一个极简的 splash 窗口（splash.html/js，几十 KB，几百毫秒就能画出来），
 * 主窗口在它后面偷偷加载，加载完再切换。 */
let splashWin = null;
/* splash 真的显示过没有 —— 页面里据此决定还要不要再演一遍动画 */
let splashRan = false;
function createSplash() {
  splashWin = new BrowserWindow({
    width: 640, height: 400,
    frame: false,
    resizable: false,
    movable: true,
    show: false,
    backgroundColor: '#F6F1E6',
    skipTaskbar: false,
    title: '卷帙 NovelFolio',
    webPreferences: {
      /* 专门的 preload：动画播完时通过 IPC 告诉主进程。
       * 比轮询 / 读 console 都可靠。 */
      preload: path.join(__dirname, 'splash-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });
  /* 立刻显示窗口（不等 ready-to-show）：backgroundColor 先把整块纸色撑起来，
   * 页面画好了自然就顶上来。等 ready-to-show 会白白晚好几百毫秒。 */
  try { splashWin.center(); } catch (e) {}
  splashWin.show();
  splashRan = true;
  T('splash_shown');
  splashWin.webContents.once('did-finish-load', () => {
    T('splash_loaded');
  });

  /* 内联成 data URL 加载：省掉一次文件系统往返，实测比 loadFile 快 0.5~0.9 秒 ——
   * splash 要抢的就是这几百毫秒，它必须比主界面早得多地出现在屏幕上。 */
  try {
    const fsx = require('fs');
    const dir = path.join(__dirname, 'renderer');
    const inlined = fsx.readFileSync(path.join(dir, 'splash.html'), 'utf8')
      .replace('<script src="splash.js"></script>',
        () => '<script>' + fsx.readFileSync(path.join(dir, 'splash.js'), 'utf8') + '</script>');
    splashWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(inlined));
  } catch (e) {
    splashWin.loadFile(path.join(__dirname, 'renderer', 'splash.html'));
  }
  splashWin.on('closed', () => { splashWin = null; });
  return splashWin;
}

/* 换场：主窗口顶上来，splash 关掉。
 * 只有「主界面就绪」和「splash 动画播完」两个条件都满足才切 —— 谁慢等谁。 */
let mainReady = false;      /* 主界面首帧画好了 */
let splashDone = false;     /* splash 的动画完整播完了 */
let swapped = false;

function trySwap() {
  if (swapped || !mainReady || !splashDone) return;
  swapped = true;
  T('swap');
  const s = splashWin;
  /* splash 自己是淡出收场的，这里先把它淡掉；300ms 后关掉它、露出主窗口 */
  try {
    if (s && !s.isDestroyed()) s.webContents.executeJavaScript('window.__splashFadeOut && window.__splashFadeOut();').catch(() => {});
  } catch (e) {}
  setTimeout(() => {
    if (win && !win.isDestroyed()) {
      try { win.show(); win.focus(); } catch (e) {}
    }
    if (s && !s.isDestroyed()) { try { s.destroy(); } catch (e) {} }
    splashWin = null;
  }, 320);
}

/* splash 那边的动画播完了，通知主进程 */
function onSplashDone() {
  if (splashDone) return;
  splashDone = true;
  T('splash_done');
  trySwap();
}

/* 主界面就绪了：只记标志，等 splash 把动画演完再换场 */
function onMainReady() {
  if (mainReady) return;
  mainReady = true;
  T('main_ready');
  trySwap();
  /* 兜底：万一 splash 那边没报「播完」（比如它崩了），6 秒后强制换场，不让用户卡住 */
  setTimeout(() => { if (!swapped) { splashDone = true; trySwap(); } }, 6000);
}

function createWindow() {
  /* 主窗口先不显示：等主界面真的画好了（ready-to-show）再顶上来，那时 splash 已经淡出 */
  win = new BrowserWindow({
    width: 1600, height: 1000, minWidth: 1180, minHeight: 720,
    backgroundColor: '#F6F1E6',
    show: false,
    autoHideMenuBar: true,
    title: '卷帙 NovelFolio',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, spellcheck: false }
  });
  if (evalArg || probeArg) {
    win.webContents.on('console-message', (...args) => {
      const ev = args[0];
      const o = ev && typeof ev === 'object' && typeof ev.message === 'string'
        ? ev : { level: args[1], message: args[2], lineNumber: args[3], sourceId: args[4] };
      console.log('[renderer:' + o.level + '] ' + o.message + '  @' + String(o.sourceId || '').replace(/^.*[\\/]/, '') + ':' + o.lineNumber);
    });
  }
  const hash = pageArg ? '#' + pageArg.split('=')[1] : '';
  /* 主界面首帧画好 → 记下，等 splash 动画播完再一起换场（见 trySwap） */
  win.once('ready-to-show', onMainReady);
  /* 主界面迟迟画不出来也别让 splash 永远停着：8 秒后按「就绪」处理 */
  setTimeout(onMainReady, 8000);
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'), { hash });

  /* 自动化测试（--shot / --probe / --eval）不要 splash 挡着，直接关掉它让测试跑在主窗口上。
   * --withsplash 可以强行保留它，用来测 splash 本身。 */
  if ((shotArg || probeArg || evalArg) && !process.argv.some(a => a === '--withsplash')) {
    if (splashWin && !splashWin.isDestroyed()) { try { splashWin.destroy(); } catch (e) {} splashWin = null; }
  }
  if (shotArg || probeArg || evalArg) {
    win.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        try { win.setContentSize(1600, 1000); } catch (e) {}
        await new Promise(r => setTimeout(r, 350));
        if (probeArg) await runProbe();
        if (clickArg) {
          const [cx, cy] = clickArg.split('=')[1].split(',').map(Number);
          if (Number.isFinite(cx) && Number.isFinite(cy)) {
            win.webContents.sendInputEvent({ type: 'mouseMove', x: cx, y: cy });
            win.webContents.sendInputEvent({ type: 'mouseDown', x: cx, y: cy, button: 'left', clickCount: 1 });
            win.webContents.sendInputEvent({ type: 'mouseUp', x: cx, y: cy, button: 'left', clickCount: 1 });
            await new Promise(r => setTimeout(r, 700));
            console.log('clicked ' + cx + ',' + cy + ' -> ' + (await win.webContents.executeJavaScript('location.hash')));
          }
        }
        if (evalArg) await runEval();
        if (shotArg) {
          const out = shotArg.split('=').slice(1).join('=');
          try {
            const img = await win.webContents.capturePage();
            fs.writeFileSync(out, img.toPNG());
            console.log('shot saved ' + out);
          } catch (e) { console.error(e); }
        }
        app.quit();
      }, 2400);
    });
  }
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.novelfolio.app');
  T('whenReady');
  /* 设置里关掉启动动画就不开 splash（读配置是同步的，不用等 IPC） */
  let animOn = true;
  try {
    const ui = settings.getConfig().ui;
    animOn = !(ui && ui.launchAnim === false);
  } catch (e) {}
  const wantSplash = animOn &&
    (!(shotArg || probeArg || evalArg) || process.argv.some(a => a === '--withsplash'));
  /* 两个窗口同时建：渲染进程并行创建。splash 立刻 show（只靠 backgroundColor 先撑住），
   * 主窗口藏在后面加载 —— 先等 splash ready 再建主窗口会让主界面更晚出来。 */
  if (wantSplash) createSplash();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

/* ---------------- app / data ---------------- */
/* splash 窗口：动画播完了 */
ipcMain.on('splash:anim-done', () => { onSplashDone(); });

ipcMain.handle('app:info', async () => ({
  version: app.getVersion(), electron: process.versions.electron, chrome: process.versions.chrome,
  node: process.versions.node, userData: P.root(), encrypt: await settings.encAvailable(),
  /* 只有自动化测试带 --slow=N；正常启动恒为 1 */
  bootSlow: bootSlowMs,
  /* 启动动画是否已经由 splash 窗口播过了（播过了页面里的就别再演一遍） */
  splashPlayed: splashRan
}));
ipcMain.handle('data:load', () => getDoc());
ipcMain.handle('data:save', (e, incoming) => {
  if (!incoming || typeof incoming !== 'object') throw new Error('无效数据');
  doc = incoming; return store.save(doc);
});
ipcMain.handle('data:backups', () => store.listBackups());
ipcMain.handle('data:restore', (e, name) => { doc = null; return store.restore(name); });
ipcMain.handle('data:backupNow', () => { const f = store.backup(getDoc()); return { file: f }; });
ipcMain.handle('data:exportJson', async () => {
  const r = await dialog.showSaveDialog(win, {
    title: '导出数据', defaultPath: (getDoc().meta && getDoc().meta.title ? getDoc().meta.title : 'novelfolio') + '.nfdata.json',
    filters: [{ name: '卷帙数据', extensions: ['json'] }]
  });
  if (r.canceled || !r.filePath) return { canceled: true };
  fs.writeFileSync(r.filePath, JSON.stringify(getDoc(), null, 1), 'utf8');
  return { file: r.filePath };
});
/* 导出文档：按「范围 + 格式」把当前这本书写成 txt / md / docx / json
 * 渲染在 exportdoc.js 里（内容和排版都在那），这里只负责弹保存框和落盘。 */
ipcMain.handle('data:exportDoc', async (e, opts) => {
  const o = opts || {};
  let built;
  try {
    built = exportdoc.build(getDoc(), o.scopes, o.format);
  } catch (err) {
    throw new Error('生成导出内容失败：' + (err.message || err));
  }
  const fmt = (exportdoc.FORMATS.find(f => f.key === o.format) || exportdoc.FORMATS[0]);
  let r;
  if (exportDirArg) {
    /* 自动化验证：不弹框，直接写到 --export-dir 指定的目录 */
    const dir = exportDirArg.split('=').slice(1).join('=');
    P.ensureDir(dir);
    r = { canceled: false, filePath: path.join(dir, built.name) };
  } else {
    r = await dialog.showSaveDialog(win, {
      title: '导出「' + built.scopeLabels.join(' / ') + '」为 ' + fmt.label,
      defaultPath: built.name,
      filters: [{ name: fmt.label + '（*.' + built.ext + '）', extensions: [built.ext] }]
    });
  }
  if (r.canceled || !r.filePath) return { canceled: true };
  fs.writeFileSync(r.filePath, built.data);
  return {
    file: r.filePath,
    bytes: built.data.length,
    chars: built.chars,
    format: fmt.key,
    scopes: built.scopeLabels
  };
});
/* 导入 JSON：收成书库里的一本新书并切过去 —— 不覆盖正在写的那本 */
ipcMain.handle('data:importJson', async () => {
  const r = await dialog.showOpenDialog(win, { title: '导入数据', properties: ['openFile'], filters: [{ name: '卷帙数据', extensions: ['json'] }] });
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  const incoming = JSON.parse(fs.readFileSync(r.filePaths[0], 'utf8'));
  const out = store.importAsBook(incoming);
  doc = out.doc;
  return doc;
});

/* ---------------- 书库（自定义创建 / 切换 / 管理） ---------------- */
ipcMain.handle('books:list', () => libraryInfo());
ipcMain.handle('books:create', (e, opts) => {
  /* 复制 / 导入要先落盘当前这本，否则抄到的是内存里还没保存的旧样子 */
  if (doc) { try { store.save(doc); } catch (err) {} }
  doc = null;
  const r = bookcase.createBook(opts || {});
  return Object.assign(r, { library: libraryInfo(), doc: getDoc() });
});
ipcMain.handle('books:switch', (e, id) => {
  /* 切走之前先落盘：界面里的改动不能因为换了本书就丢 */
  if (doc) { try { store.save(doc); } catch (err) { console.error('[books:switch] save failed', err); } }
  const lib = bookcase.switchBook(id);
  doc = null;
  return { activeId: lib.activeId, doc: getDoc(), library: libraryInfo() };
});
ipcMain.handle('books:rename', (e, id, patch) => {
  const r = bookcase.renameBook(id, patch || {});
  /* 改的是当前这本：内存里那份也要跟着改，不然下次保存会把旧书名写回去 */
  if (doc && id === currentBookId()) {
    /* 用登记表里最终定下的书名（撞名时主进程会自动补序号），别用界面上送来的原值 */
    doc.meta = doc.meta || {};
    doc.meta.title = r.book.title;
    doc.meta.author = r.book.author;
  }
  return { book: r.book, library: libraryInfo() };
});
ipcMain.handle('books:delete', (e, id) => {
  if (id === currentBookId() && doc) { try { store.save(doc); } catch (err) {} }
  const r = bookcase.deleteBook(id);
  doc = null;                       /* 删的正是当前这本：内存里的那份也一并作废 */
  return Object.assign(r, { library: libraryInfo(), doc: getDoc() });
});

/* ---------------- 同步（书稿放进用户自己的网盘） ---------------- */
ipcMain.handle('sync:test', (e, conf) => syncer.testConnection(conf));
ipcMain.handle('sync:status', () => syncer.status());
ipcMain.handle('sync:now', async (e) => {
  /* 以磁盘上的最新数据为准：渲染层刚落盘的内容才不会被内存里的旧 doc 覆盖 */
  try { const onDisk = store.load(); if (onDisk) doc = onDisk; } catch (err) {}
  const r = await syncer.syncNow({ doc: getDoc(), onProgress: m => { if (win && !win.isDestroyed()) win.webContents.send('sync:progress', m); } });
  if (r && r.ok && r.doc) { doc = r.doc; persist(); }     /* 只有成功才换本机数据 */
  return { ok: r.ok, changed: !!r.changed, message: r.message, conflicts: r.conflicts || [], stats: r.stats || null };
});
ipcMain.handle('sync:pickFolder', async () => {
  const r = await dialog.showOpenDialog(win, { title: '选择同步文件夹', properties: ['openDirectory', 'createDirectory'] });
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  return { folder: r.filePaths[0] };
});

/* ---------------- settings ---------------- */
ipcMain.handle('settings:get', () => settings.publicSettings());
ipcMain.handle('settings:set', async (e, patch) => { settings.setConfig(patch); return await settings.publicSettings(); });
ipcMain.handle('settings:setApiKey', async (e, k) => {
  await settings.setApiKey(String(k || '').trim());
  return await settings.publicSettings();
});
/* 同步凭据：WebDAV 密码 / 端到端加密口令，加密后存进 secrets.bin，不回传界面 */
ipcMain.handle('settings:setSyncSecret', async (e, name, value) => {
  if (!['davPass', 'syncPass'].includes(name)) throw new Error('未知的凭据类型');
  await settings.setSyncCredential(name, String(value || ''));
  return await settings.publicSettings();
});

/* ---------------- files ---------------- */
ipcMain.handle('file:pick', async (e, opts) => {
  const r = await dialog.showOpenDialog(win, {
    title: (opts && opts.title) || '选择文件',
    properties: ['openFile'],
    filters: (opts && opts.filters) || [{ name: '全部文件', extensions: ['*'] }]
  });
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  return { file: r.filePaths[0] };
});
ipcMain.handle('file:openPath', (e, p) => shell.openPath(p));
ipcMain.handle('file:showInFolder', (e, p) => { shell.showItemInFolder(p); });
ipcMain.handle('shell:openExternal', (e, url) => {
  if (!/^https?:\/\//i.test(String(url || ''))) throw new Error('只允许 http/https 链接');
  return shell.openExternal(url);
});

/* ---------------- import ---------------- */
ipcMain.handle('import:parse', (e, file) => {
  const r = parse.parseFile(file);
  return Object.assign({ file }, r);
});

/* ---------------- llm ---------------- */
ipcMain.handle('llm:test', async () => {
  const cfg = settings.getConfig().llm;
  const r = await llm.chat([{ role: 'user', content: '只回复两个字：可用' }], { maxTokens: 20, temperature: 0 });
  return { ok: true, model: r.model, reply: (r.content || '').trim().slice(0, 40), baseUrl: llm.normalizeBase(cfg.baseUrl) };
});
ipcMain.handle('llm:chat', (e, messages, opts) => llm.chat(messages, opts || {}));
ipcMain.handle('llm:models', (e, opts) => llm.listModels(opts || {}));

/* ---------------- book (拆书) ----------------
 * 「书籍分析」这条流水线：导入整本书 → 分章 → 抽人物 / 情节 → 入库。
 * 书页上那一本书的原文副本存在 data/books/<书号>.txt（bookcase.bookTextPath），
 * 正文只在入库那一刻从主进程读出来 —— 几十万字不走 IPC。
 *
 * 一个容易踩的坑：入库前如果为了"新开一本书"调了 books:create，主进程缓存的那份 doc 会被作废、
 * 重新从「当前书」读（那时当前书可能已经换掉了）。所以这里记住界面最近在看哪本书，
 * 入库时优先用「当前书 > 界面正在看的那本」里真正有这本书的那一份。
 */
let cancelFlag = false;
function bookTextPath(id) { return bookcase.bookTextPath(id); }

/* 界面最近一次上报「我正在看哪本书」 */
const bookTouched = new Map();
function touchBook(id) {
  if (!id) return;
  for (const [k] of bookTouched) bookTouched.delete(k);       /* 只留最新那一本 */
  bookTouched.set(String(id), Date.now());
}

/* 找到哪份 doc 里有这本书。顺序：当前书 → 界面正在看的那本（可能只在磁盘上，刚被 books:create 作废过）
 * → 书库里最近改过的那些（books:create 每建一本就会把主进程的缓存作废一次，那时候内存里已经没这本书了）。 */
function resolveBookDoc(bookId) {
  const id = String(bookId || '');
  if (!id) return null;
  const cur = getDoc();
  const inCur = cur && (cur.books || []).find(b => b.id === id);
  if (inCur) return { doc: cur, book: inCur, ownerId: currentBookId() };
  const tryLoad = bid => {
    if (!bid || bid === currentBookId()) return null;
    try {
      const other = bookcase.loadBook(bid);
      const hit = other && (other.books || []).find(b => b.id === id);
      return hit ? { doc: other, book: hit, ownerId: bid } : null;
    } catch (err) { return null; }
  };
  for (const bid of bookTouched.keys()) {
    const r = tryLoad(bid);
    if (r) return r;
  }
  const lib = bookcase.listBooks();
  const order = (lib.books || []).slice()
    .sort((a, b) => String(b.lastEditedAt || '').localeCompare(String(a.lastEditedAt || '')))
    .map(b => b.id);
  for (const bid of order) {
    if (bid === currentBookId()) continue;
    const r = tryLoad(bid);
    if (r) return r;
  }
  return null;
}

/* 章标题拆成「第几章」+ 章名；拆不出数字的（前言 / 卷首 / 按空行切出来的）返回 null */
const CN_D = { '〇': 0, '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };
function cnInt(s) {
  let total = 0, cur = 0;
  for (const ch of String(s || '')) {
    if (ch === '万') { total += (cur || 1) * 10000; cur = 0; }
    else if (ch === '千') { total += (cur || 1) * 1000; cur = 0; }
    else if (ch === '百') { total += (cur || 1) * 100; cur = 0; }
    else if (ch === '十') { total += (cur || 1) * 10; cur = 0; }
    else if (CN_D[ch] != null) cur = CN_D[ch];
    else return 0;
  }
  return total + cur;
}
function cnNum(s) {
  const m = /第\s*([0-9]+)/.exec(String(s || ''));
  if (m) return Number(m[1]);
  const c = /第\s*([零〇一二三四五六七八九十百千万两]+)/.exec(String(s || ''));
  return c ? cnInt(c[1]) : 0;
}
/* 「第一章 下个路口见」→「下个路口见」；章号后面什么都没有就返回空串 */
function chapterNameOf(title) {
  return String(title || '').replace(/^\s*第\s*[零〇一二三四五六七八九十百千万两0-9]+\s*[章回节]\s*[·、.．:：\-—]?\s*/u, '').trim();
}
function chapterNoOf(title) {
  const t = String(title || '').trim();
  if (!/^第\s*[零〇一二三四五六七八九十百千万两0-9]+\s*[章回节]/.test(t)) return null;
  return { no: cnNum(t), name: chapterNameOf(t) };
}
/* 数字 → 中文（1 → 一，12 → 十二）；章节页那边用的是同一套写法 */
function cnIntTo(n) {
  const D = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  n = Math.max(0, Math.floor(Number(n) || 0));
  if (n < 10) return D[n];
  if (n < 20) return '十' + (n % 10 ? D[n % 10] : '');
  if (n < 100) return D[Math.floor(n / 10)] + '十' + (n % 10 ? D[n % 10] : '');
  let s = '', rest = n, hit = false;
  for (const u of [[1000, '千'], [100, '百']]) {
    const dd = Math.floor(rest / u[0]);
    if (dd) { s += D[dd] + u[1]; rest -= dd * u[0]; hit = true; }
    else if (hit && rest) s += '零';
  }
  if (rest) s += (n > 100 && rest < 10) ? '零' + D[rest] : D[rest];
  return s;
}
/* 这一段正文的"指纹"：去掉空白后的前 80 字，用来挡住同一段被重复导入 */
function contentKey(s) { return String(s || '').replace(/\s+/g, '').slice(0, 80); }

/* 把一段原文排进章节页：能认出章号的按章号依次编号；第一个章号之前的内容（书名 / 卷首 / 前言）
 * 并进第一章开头，中间那些认不出章号的（第二卷 这种卷头）并进上一章末尾 ——
 * 章节页每篇都是「第N章」，没有章号的位置放不进去，但正文一个字都不能丢。 */
function planManuscripts(chapters) {
  const out = [];
  let head = '';
  for (const c of chapters) {
    const hit = chapterNoOf(c.title);
    /* 纯正文从 body 取；前言 / 卷首这种"标题就是正文"的片段，整个 text 都是内容 */
    const body = String((c.body && c.body.trim()) ? c.body : c.text || '').trim();
    if (!hit) {
      if (!out.length) head += (head && body ? '\n\n' : '') + body;
      else if (body) out[out.length - 1].content += (out[out.length - 1].content ? '\n\n' : '') + body;
      continue;
    }
    out.push({ title: hit.name, content: body });
  }
  if (head && out.length) out[0].content = (head + (out[0].content ? '\n\n' : '') + out[0].content).trim();
  else if (head) out.push({ title: '', content: head });
  return out;
}

/* 章表自愈：老版本导入的书，章表和现在这套分章算法可能对不上（卷首 / 前言的位置变过）。
 * 分析 / 入库前先按当前算法重排一遍，勾选状态按标题搬过去 —— 不然界面上的「第 3 章」
 * 和主进程算出来的「第 3 章」不是同一段，导进去的正文会整体错位（这一轮踩过，且很难看出来）。
 * 返回的 stored 是重排之前的那张表：界面上的勾选序号是按它报上来的。 */
function syncBookChapters(book) {
  let fresh;
  try { fresh = splitBook(book.id, book.rule || 'chapter', false).chapters; } catch (err) { return null; }
  const old = book.chapters || [];
  const same = old.length === fresh.length
    && old.every((c, i) => String(c.title || '') === String(fresh[i].title || ''));
  if (same) return { chapters: fresh, stored: old, changed: false };
  const keptByTitle = new Map();
  old.forEach(c => { if (c.kept !== undefined) keptByTitle.set(String(c.title || ''), !!c.kept); });
  book.chapters = fresh.map(c => {
    const t = String(c.title || '');
    return {
      idx: c.idx, title: c.title, chars: c.chars,
      excerpt: (c.body || c.text || '').replace(/\s+/g, ' ').slice(0, 40),
      /* 同名章节沿用原来的勾选；新冒出来的（多半是「前言」）默认勾上，不然会悄悄漏导 */
      kept: keptByTitle.has(t) ? keptByTitle.get(t) : true
    };
  });
  return { chapters: fresh, stored: old, changed: true };
}

/* 界面报上来的勾选是「书里存的章节序号」；重排过以后序号可能变了，所以按标题对到这次分出来的块。
 * tables 按可信度排：先试界面当时显示的那张表，对不上再试重排后的。 */
function pickByKeep(tables, fresh, keepIdx) {
  if (!keepIdx || !keepIdx.size) return fresh;
  const norm = t => String(t || '').replace(/\s+/g, '').trim();
  const isChapter = fresh.map(c => chapterNoOf(c.title) != null);
  const tryTable = stored => {
    const want = new Set();
    (stored || []).forEach(c => { if (keepIdx.has(c.idx)) want.add(norm(c.title)); });
    if (!want.size) return null;
    const onOf = i => want.has(norm(fresh[i].title));
    const out = [];
    fresh.forEach((c, i) => {
      if (isChapter[i]) { if (onOf(i)) out.push(c); return; }
      let on = false;
      for (let j = i + 1; j < fresh.length && !on; j++) if (isChapter[j]) on = onOf(j);
      if (!on) for (let j = i - 1; j >= 0 && !on; j--) if (isChapter[j]) on = onOf(j);
      if (on) out.push(c);
    });
    return out;
  };
  for (const t of (Array.isArray(tables) ? tables : [tables])) {
    const out = tryTable(t);
    if (out && out.length) return out;
  }
  return fresh;
}


/* 界面报告「我正在看哪本书」：入库时主进程要靠它把拆书结果找回来（见 resolveBookDoc） */
ipcMain.handle('book:touch', (e, bookId) => { touchBook(bookId); return { ok: true }; });

/* 拆书用的那份分块：正文只在主进程里用，不往渲染层送 */
function splitBook(bookId, rule, pages) {
  const text = fs.readFileSync(bookTextPath(bookId), 'utf8');
  const chapters = parse.splitChapters(text, rule || 'chapter');
  const pre = /^前言/.test((chapters[0] || {}).title || '');
  return {
    chapters: (chapters || []).map(c => Object.assign({}, c, { preface: !!pre })),
    pages: pages === false ? null : (chapters || []).map(c => ({
      idx: c.idx, title: c.title, chars: c.chars,
      excerpt: (c.body || c.text).replace(/\s+/g, ' ').slice(0, 40)
    }))
  };
}

/* 新导入的一本书：唯一的书号（不再只靠毫秒，连点两下也不会撞） */
function newBookId() { return 'bk' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

ipcMain.handle('book:create', async (e, file) => {
  const parsed = parse.parseFile(file);
  if (parsed.kind !== 'text') throw new Error('拆书需要整本书的纯文本 / docx 文件');
  const id = newBookId();
  fs.writeFileSync(bookTextPath(id), parsed.text, 'utf8');
  const chapters = parse.splitChapters(parsed.text, 'chapter');
  const book = {
    id, title: parsed.filename.replace(/\.[^.]+$/, ''), filename: parsed.filename,
    chars: parsed.text.replace(/\s/g, '').length,
    rule: 'chapter', createdAt: new Date().toISOString(), status: 'ready',
    chapters: (chapters || []).map(c => ({ idx: c.idx, title: c.title, chars: c.chars, excerpt: (c.body || c.text).replace(/\s+/g, ' ').slice(0, 40) })),
    analysis: null
  };
  getDoc().books.push(book); persist();
  touchBook(currentBookId());
  return book;
});

/* 分析勾选了什么就存什么：关掉页面 / 切走再回来，勾选不会丢 */
ipcMain.handle('book:tab', (e, opts) => {
  const o = opts || {};
  const found = resolveBookDoc(o.bookId);
  const book = found && found.book;
  if (!book) return { ok: false };
  if (Array.isArray(o.keep)) {
    const norm = t => String(t || '').replace(/\s+/g, '').trim();
    const titles = (book.chapters || []).map(c => norm(c.title));
    const wantT = Array.isArray(o.keepTitles) ? o.keepTitles.map(norm) : null;
    /* 优先按标题对：界面上的勾选是"哪几章"，序号只是它当时看到的排序。
     * 章表被重排过（老书会多出「前言」）时，按序号写回去会让最后一章掉勾（踩过）。 */
    if (wantT && wantT.every(t => titles.indexOf(t) >= 0)) {
      const want = new Set(wantT);
      book.chapters = (book.chapters || []).map(c => Object.assign({}, c, { kept: want.has(norm(c.title)) }));
    } else if (!wantT) {
      const set = new Set(o.keep);
      book.chapters = (book.chapters || []).map(c => Object.assign({}, c, { kept: set.has(c.idx) }));
    }
    /* 标题一个都对不上 = 界面拿的是旧章表：这一笔先不写，等界面重排后再报一次 */
  }
  if (book.analysis) {
    book.analysis.tab = {
      people: Array.isArray(o.people) ? o.people : ((book.analysis.tab && book.analysis.tab.people) || []),
      plots: Array.isArray(o.plots) ? o.plots : ((book.analysis.tab && book.analysis.tab.plots) || []),
      at: new Date().toISOString()
    };
  }
  if (found.doc !== getDoc() && found.ownerId) { try { bookcase.saveBook(found.ownerId, found.doc); } catch (err) {} }
  else persist();
  return { ok: true };
});
ipcMain.handle('book:resplit', (e, bookId, rule) => {
  const book = getDoc().books.find(b => b.id === bookId);
  if (!book) throw new Error('找不到这本书');
  const text = fs.readFileSync(bookTextPath(bookId), 'utf8');
  const chapters = parse.splitChapters(text, rule);
  book.rule = rule;
  book.chapters = chapters.map(c => ({ idx: c.idx, title: c.title, chars: c.chars, excerpt: c.text.replace(/\s+/g, ' ').slice(0, 40) }));
  persist();
  return book;
});
ipcMain.handle('book:remove', (e, bookId) => {
  const d = getDoc();
  d.books = d.books.filter(b => b.id !== bookId);
  persist();
  /* 这条拆书记录可能在别的书里也有一份（入库到新书时会复制过去）：都删干净了才删原文 */
  let others = 0;
  try {
    const lib = bookcase.listBooks();
    for (const b of (lib.books || [])) {
      if (b.id === currentBookId()) continue;
      try { if ((bookcase.loadBook(b.id).books || []).some(x => x.id === bookId)) others++; } catch (err) {}
    }
  } catch (err) {}
  if (!others) { try { fs.unlinkSync(bookTextPath(bookId)); } catch (err) {} }
  return { ok: true };
});
ipcMain.handle('book:cancel', () => { cancelFlag = true; return { ok: true }; });

ipcMain.handle('book:analyze', async (e, opts) => {
  const { bookId, keepIndexes, steps } = opts || {};
  const book = getDoc().books.find(b => b.id === bookId);
  if (!book) throw new Error('找不到这本书');
  /* 章表和当前分章算法对不上时先重排（老版本导入的书），勾选按标题搬过去 */
  const synced = syncBookChapters(book);
  let chapters = (synced && synced.chapters) || splitBook(bookId, book.rule || 'chapter', false).chapters;
  if (Array.isArray(keepIndexes) && keepIndexes.length) chapters = pickByKeep([synced && synced.stored, book.chapters], chapters, new Set(keepIndexes));
  if (!chapters.length) throw new Error('没有选中任何章节');

  cancelFlag = false;
  const send = d => { if (win && !win.isDestroyed()) win.webContents.send('book:progress', d); };
  const doPeople = !steps || steps.includes('people');
  const doPlots = !steps || steps.includes('plots');

  const batches = [];
  let cur = [], curLen = 0;
  for (const c of chapters) {
    if (curLen + c.chars > 6000 && cur.length) { batches.push(cur); cur = []; curLen = 0; }
    cur.push(c); curLen += c.chars;
  }
  if (cur.length) batches.push(cur);

  const people = new Map();
  const plots = [];
  send({ phase: 'start', done: 0, total: batches.length, message: '共 ' + batches.length + ' 批，开始分析' });

  for (let i = 0; i < batches.length; i++) {
    if (cancelFlag) { send({ phase: 'canceled', done: i, total: batches.length, message: '已取消' }); throw new Error('已取消'); }
    const batchText = batches[i].map(c => c.text.slice(0, 4200)).join('\n\n').slice(0, 12000);
    send({ phase: 'batch', done: i, total: batches.length, message: '正在分析第 ' + (i + 1) + '/' + batches.length + ' 批' });
    const prompt = [
      '你是一名小说拆书助手。下面是长篇小说的一部分原文，请抽取其中的【人物】与【情节】。',
      '严格只输出 JSON 对象，不要任何解释、不要 markdown 代码块。格式：',
      '{"characters":[{"name":"","aliases":[],"identity":"","age":"","persona":"一句话人设","firstSeen":""}],',
      ' "plots":[{"title":"情节名(8字内)","summary":"40字内摘要","characters":["人名"],"place":"","chapter":""}]}',
      '规则：1) 只抽原文真实出现的人物，姓名用原文写法；2) 同一人物不要重复，别名放 aliases；',
      '3) 情节 3~8 条，按时间顺序；4) 信息不足的字段留空字符串，不要编造。',
      '',
      '【原文】',
      batchText
    ].join('\n');
    let obj;
    try {
      const r = await llm.chat([{ role: 'user', content: prompt }], { json: true, maxTokens: 2600, temperature: 0.2 });
      obj = llm.extractJson(r.content);
    } catch (err) {
      send({ phase: 'batch-error', done: i, total: batches.length, message: '第 ' + (i + 1) + ' 批失败：' + err.message });
      continue;
    }
    if (doPeople && Array.isArray(obj.characters)) {
      for (const c of obj.characters) {
        const name = String(c.name || '').trim();
        if (!name || name.length > 12) continue;
        const prev = people.get(name);
        if (prev) {
          for (const a of (c.aliases || [])) if (a && prev.aliases.indexOf(a) < 0) prev.aliases.push(a);
          if (!prev.identity && c.identity) prev.identity = c.identity;
          if (!prev.persona && c.persona) prev.persona = c.persona;
          prev.count++;
        } else {
          people.set(name, {
            name, aliases: (c.aliases || []).filter(Boolean).slice(0, 4),
            identity: c.identity || '', age: c.age || '', persona: c.persona || '',
            firstSeen: c.firstSeen || '', count: 1
          });
        }
      }
    }
    if (doPlots && Array.isArray(obj.plots)) {
      for (const p of obj.plots) {
        const title = String(p.title || '').trim();
        if (!title) continue;
        plots.push({
          title, summary: String(p.summary || '').slice(0, 120),
          characters: (p.characters || []).filter(Boolean).slice(0, 6),
          place: p.place || '', chapter: p.chapter || '',
          batch: i + 1, picked: true
        });
      }
    }
    send({ phase: 'batch-done', done: i + 1, total: batches.length, message: '已处理 ' + (i + 1) + '/' + batches.length + ' 批' });
  }

  book.analysis = {
    at: new Date().toISOString(),
    people: Array.from(people.values()).sort((a, b) => b.count - a.count),
    plots,
    stats: { chapters: chapters.length, batches: batches.length }
  };
  book.status = 'analyzed';
  persist();
  send({ phase: 'done', done: batches.length, total: batches.length, message: '分析完成' });
  return book;
});

/* 入库。
 *
 * 「存到现在的展示书籍」= 不传 targetBookId，写进当前打开的那本；
 * 「新导入一个书籍」= 传 targetBookId（刚建好的新书）+ newBook，写进那本并切过去。
 * 写入按书号来，不依赖"主进程此刻缓存的是哪一本"，所以先建书再入库也不会串。
 *
 * 除了人物与情节，勾了正文时还会把这本书的章节正文写进章节写作：
 * 能认出章号的按章号顺序落一篇稿子，认不出章号的（前言 / 卷首）并进前一篇的开头。
 * 同一段正文重复入库不会落成两份（按标题 + 正文前 80 字挡）。 */
ipcMain.handle('book:commit', (e, opts) => {
  const o = opts || {};
  const found = resolveBookDoc(o.bookId);
  if (!found) throw new Error('找不到这本书的拆书结果：它可能已经被移出书库，请重新导入整本书');
  const book = found.book;
  const hasAn = !!(book.analysis && ((book.analysis.people || []).length || (book.analysis.plots || []).length));
  const wantText = !!o.text;
  if (!hasAn && !wantText) throw new Error('还没有分析结果');
  if (!hasAn && !(book.chapters || []).length) throw new Error('还没有分析结果');

  /* 章表自愈：老版本导入的书，章表可能和现在的分章算法对不上（见 syncBookChapters）。
   * 要放在下面"先把有这本书的那份 doc 落盘"之前，重排结果才会跟着写回去。 */
  const synced = (hasAn || wantText) ? syncBookChapters(book) : null;

  /* 写进哪一本 */
  const lib = bookcase.listBooks();
  const curId = lib.activeId;
  const targetId = o.targetBookId || curId;
  if (!lib.books.some(b => b.id === targetId)) throw new Error('要写入的那本书不在书库里');
  /* 先把「有这本书的那份 doc」落盘：界面为了新开一本书调过 books:create 时，
   * 主进程内存里那份已经作废、重新读的是当前书，别让分析结果跟着丢 */
  try {
    if (found.doc === getDoc()) { store.save(found.doc); }
    else if (!found.ownerId || found.ownerId !== curId) { if (found.ownerId) bookcase.saveBook(found.ownerId, found.doc); }
  } catch (err) { console.error('[book:commit] save failed', err); }
  const target = targetId === curId ? getDoc() : bookcase.loadBook(targetId);
  /* 新导入的书里也放一份拆书记录：不然切过去以后「书籍分析」是空的，作者会以为分析结果丢了，
   * 也没法从新书这边再入库。原文（data/books/<书号>.txt）本来就是共用的，两份按同一份原文重读。 */
  if (o.newBook) {
    target.books = target.books || [];
    if (!target.books.some(x => x.id === book.id)) {
      try { target.books.push(JSON.parse(JSON.stringify(book))); } catch (err) { console.error('[book:commit] copy record failed', err); }
    }
  }

  /* ---- 人物 ---- */
  const pickP = new Set((o.people || []).map(x => (x && typeof x === 'object' ? x.name : x)));
  const pickPl = new Set(o.plots || []);
  target.characters = target.characters || [];
  const byName = new Map(target.characters.map(c => [c.name, c]));
  let addedC = 0, mergedC = 0, addedP = 0;
  const idOf = name => { const c = byName.get(name); return c ? c.id : null; };
  const analysis = book.analysis || { people: [], plots: [] };
  for (const p of analysis.people || []) {
    if (!pickP.has(p.name)) continue;
    const exist = byName.get(p.name);
    if (exist) {
      if (!exist.identity && p.identity) exist.identity = p.identity;
      if (!exist.persona && p.persona) exist.persona = p.persona;
      if (!exist.age && p.age) exist.age = p.age;
      exist.aliases = exist.aliases || [];
      for (const a of (p.aliases || [])) if (exist.aliases.indexOf(a) < 0) exist.aliases.push(a);
      mergedC++;
    } else {
      const nc = {
        id: 'ch' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: p.name, aliases: (p.aliases || []).slice(), age: p.age || '', identity: p.identity || '',
        realm: '', persona: p.persona || '', ending: '', group: '拆书导入',
        color: '#8A6A2F', portrait: null, relations: [], source: { book: book.title, count: p.count }
      };
      target.characters.push(nc); byName.set(nc.name, nc); addedC++;
    }
  }

  /* ---- 情节 ---- */
  target.plots = target.plots || [];
  for (const p of analysis.plots || []) {
    if (!pickPl.has(p.title)) continue;
    target.plots.push({
      id: 'pl' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: p.title, summary: p.summary, place: p.place, chapter: p.chapter,
      chapterNo: cnNum(p.chapter), timePoint: p.batch, status: 'done',
      characterIds: (p.characters || []).map(idOf).filter(Boolean),
      source: { book: book.title }
    });
    addedP++;
  }

  /* ---- 正文：章节原文 → 章节写作的稿件 ---- */
  let addedM = 0, filledM = 0, textChars = 0;
  if (wantText) {
    /* 勾选按标题对到这次分出来的块（见 pickByKeep）：界面上勾的 idx 可能来自重排前的章表 */
    const all = (synced && synced.chapters) || (() => {
      try { return splitBook(book.id, book.rule || 'chapter', false).chapters; }
      catch (err) { throw new Error('读不到这本书的原文，没法导入正文：' + (err && err.message || err)); }
    })();
    const keep = Array.isArray(o.keep) && o.keep.length ? new Set(o.keep) : null;
    const picked = keep ? pickByKeep([synced && synced.stored, book.chapters], all, keep) : all;
    const plans = planManuscripts(picked);

    /* 落在哪一卷：已经有「导入的正文」那一卷就接着往里加；否则落进章号最大的那一卷
     * （= 书里最后那一卷，接着往后排章号），一卷都没有才新建「导入的正文」 */
    target.chapters = target.chapters || [];
    target.manuscripts = target.manuscripts || [];
    const volWithLastChapter = () => {
      let best = null, bestNo = -1;
      for (const v of target.chapters) {
        const mx = target.manuscripts.filter(m => m.volumeId === v.id)
          .reduce((a, m) => Math.max(a, Number(m.chapterNo) || cnNum(m.title)), -1);
        if (mx > bestNo) { bestNo = mx; best = v; }
      }
      return best;
    };
    let vol = target.chapters.find(v => v.imported) || volWithLastChapter() || target.chapters[target.chapters.length - 1];
    if (!vol) {
      vol = { id: 'vo' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: '导入的正文', status: 'plan', words: 0, imported: true };
      target.chapters.push(vol);
    }
    const volId = vol.id;
    /* 章号接着这一卷现有的往下排 */
    let no = target.manuscripts.filter(m => m.volumeId === volId)
      .reduce((mx, m) => Math.max(mx, Number(m.chapterNo) || cnNum(m.title)), 0);
    const stampAt = new Date().toISOString();
    /* 这一卷现有的稿件，按两种键找：「第N章 · 章名」和「正文前 80 字」 */
    const bySig = new Map();
    target.manuscripts.filter(m => m.volumeId === volId).forEach(m => {
      bySig.set('t:' + String(m.title || ''), m);
      const k = contentKey(m.content);
      if (k) bySig.set('c:' + k, m);
    });
    plans.forEach(plan => {
      const title = '第' + cnIntTo(no + 1) + '章' + (plan.title ? ' · ' + plan.title : '');
      const sig = contentKey(plan.content);
      const hit = bySig.get('t:' + title) || (sig ? bySig.get('c:' + sig) : null);
      if (hit) {
        no++;
        /* 已有的不动；空稿才把正文填进去 */
        if (!String(hit.content || '').trim() && plan.content) {
          hit.content = plan.content; hit.updatedAt = stampAt;
          textChars += plan.content.length; filledM++;
        }
        return;
      }
      no++;
      const m = {
        id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        volumeId: volId, chapterNo: no, title, content: plan.content,
        imported: true, source: { book: book.title }, updatedAt: stampAt
      };
      target.manuscripts.push(m);
      bySig.set('t:' + title, m);
      if (sig) bySig.set('c:' + sig, m);
      addedM++; textChars += plan.content.length;
    });
    vol.words = target.manuscripts.filter(m => m.volumeId === volId).reduce((a, m) => a + String(m.content || '').replace(/\s/g, '').length, 0);
    /* 情节里的「第N章」对上篇名，章节页点情节就能在正文里标出来 */
    for (const pl of target.plots) {
      if (!pl || !(pl.chapterNo > 0) || pl.manuscriptId) continue;
      const hit = target.manuscripts.find(m => m.volumeId === volId && (m.chapterNo || 0) === pl.chapterNo);
      if (hit) { pl.manuscriptId = hit.id; pl.chapter = pl.chapter || hit.title; }
    }
  }

  /* ---- 落盘 ---- */
  if (targetId === curId) {
    persist();
  } else {
    bookcase.saveBook(targetId, target);
  }

  let switched = false;
  if (o.newBook) {
    /* 新开的书：切过去，界面下一轮拿到的就是这本书 */
    bookcase.switchBook(targetId);
    doc = null;
    switched = true;
  }
  let title = '';
  try { title = (bookcase.listBooks().books.find(b => b.id === targetId) || {}).title || ''; } catch (err) {}
  return { addedC, mergedC, addedP, addedM, filledM, textChars, targetId, switched, title };
});

/* ---------------- images ---------------- */
/* 图片按书分目录：portraits/<书号>/xxx.png。
 * 老书（升级前就在 portraits 根目录里的图）地址不变，仍然读得到。 */
function saveImageBuffer(charId, buf, ext) {
  const name = charId + '-' + Date.now().toString(36) + '.' + ext;
  const id = currentBookId();
  const dest = path.join(P.portraitsDir(id), name);
  fs.writeFileSync(dest, buf);
  return id ? 'portraits/' + id + '/' + name : 'portraits/' + name;
}
ipcMain.handle('image:pickPortrait', async (e, charId) => {
  const r = await dialog.showOpenDialog(win, {
    title: '选择立绘', properties: ['openFile'],
    filters: [{ name: '图片', extensions: ['png', 'jpg', 'jpeg', 'webp'] }]
  });
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  const ext = path.extname(r.filePaths[0]).slice(1).toLowerCase();
  const rel = saveImageBuffer(charId, fs.readFileSync(r.filePaths[0]), ext);
  const ch = getDoc().characters.find(c => c.id === charId);
  if (ch) { ch.portrait = rel; persist(); }
  return { portrait: rel, file: r.filePaths[0] };
});
ipcMain.handle('image:importDataUrl', (e, charId, dataUrl) => {
  const m = /^data:image\/(png|jpe?g|webp);base64,(.+)$/i.exec(String(dataUrl || ''));
  if (!m) throw new Error('剪贴板里没有图片');
  const ext = m[1].toLowerCase() === 'jpeg' ? 'jpg' : m[1].toLowerCase();
  const rel = saveImageBuffer(charId, Buffer.from(m[2], 'base64'), ext);
  const ch = getDoc().characters.find(c => c.id === charId);
  if (ch) { ch.portrait = rel; persist(); }
  return { portrait: rel };
});
ipcMain.handle('clipboard:write', async (e, text) => { await clipboard.writeText(String(text || '')); return true; });

/* 读剪贴板里的图片：
 * - Electron < 45：clipboard.readImage() 同步返回 NativeImage
 * - Electron >= 45：clipboard 改成 W3C 风格，read() 返回 ClipboardItem[]，用 getType 取 Blob */
async function readClipboardImage() {
  if (typeof clipboard.readImage === 'function') {
    const img = clipboard.readImage();
    if (img && !img.isEmpty()) return img.toPNG();
    return null;
  }
  if (typeof clipboard.read !== 'function') return null;
  const items = (await clipboard.read()) || [];
  for (const item of items) {
    const types = (item && item.types) || [];
    const mime = types.find(t => /^image\/png$/i.test(t)) || types.find(t => /^image\//i.test(t));
    if (!mime) continue;
    const blob = await item.getType(mime);
    if (!blob) continue;
    if (/^image\/png$/i.test(mime)) return Buffer.from(await blob.arrayBuffer());
    // 非 PNG 交给 nativeImage 转一次，保证落盘统一是 PNG
    const buf = Buffer.from(await blob.arrayBuffer());
    const { nativeImage } = require('electron');
    const ni = nativeImage.createFromBuffer(buf);
    if (ni && !ni.isEmpty()) return ni.toPNG();
    return buf;
  }
  return null;
}

ipcMain.handle('image:pastePortrait', async (e, charId) => {
  const png = await readClipboardImage();
  if (!png) throw new Error('剪贴板里没有图片');
  const rel = saveImageBuffer(charId, png, 'png');
  const ch = getDoc().characters.find(c => c.id === charId);
  if (ch) { ch.portrait = rel; persist(); }
  return { portrait: rel };
});
ipcMain.handle('image:absolute', (e, rel) => {
  if (!rel) return '';
  const p = path.join(P.dataDir(), rel);
  return 'file:///' + p.replace(/\\/g, '/');
});
ipcMain.handle('image:pickMapBase', async (e, planeId) => {
  const r = await dialog.showOpenDialog(win, { title: '导入地图底图', properties: ['openFile'], filters: [{ name: '图片', extensions: ['png', 'jpg', 'jpeg', 'webp'] }] });
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  const ext = path.extname(r.filePaths[0]).slice(1).toLowerCase();
  const name = 'map-' + (planeId || 'plane') + '-' + Date.now().toString(36) + '.' + ext;
  const id = currentBookId();
  fs.writeFileSync(path.join(P.mapsDir(id), name), fs.readFileSync(r.filePaths[0]));
  const rel = id ? 'maps/' + id + '/' + name : 'maps/' + name;
  const plane = getDoc().planes.find(p => p.id === planeId);
  if (plane) { plane.baseImage = rel; persist(); }
  return { baseImage: rel };
});
