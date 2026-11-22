'use strict';
const { app, BrowserWindow, ipcMain, dialog, shell, safeStorage, clipboard } = require('electron');
const fs = require('fs');
const path = require('path');
const P = require('./lib/paths');
const store = require('./lib/store');
const settings = require('./lib/settings');
const llm = require('./lib/llm');
const parse = require('./lib/parse');
const syncer = require('./lib/syncer');

let win = null;
let doc = null;
function getDoc() { if (!doc) doc = store.load(); return doc; }
function persist() { if (doc) store.save(doc); }

const shotArg = process.argv.find(a => a.startsWith('--shot='));
const pageArg = process.argv.find(a => a.startsWith('--page='));
const probeArg = process.argv.find(a => a.startsWith('--probe='));
const evalArg = process.argv.find(a => a.startsWith('--eval='));
const clickArg = process.argv.find(a => a.startsWith('--click='));
const outArg = process.argv.find(a => a.startsWith('--out='));
const udArg = process.argv.find(a => a.startsWith('--ud='));
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
    const res = await win.webContents.executeJavaScript('(async()=>{' + code + '})()', true);
    const text = JSON.stringify(res, null, 1);
    if (dst) fs.writeFileSync(dst, text);
    console.log('eval ' + (text || '').slice(0, 4000));
  } catch (e) {
    const msg = JSON.stringify({ error: String(e && e.message || e) }, null, 1);
    if (dst) fs.writeFileSync(dst, msg);
    console.error('eval failed ' + String(e && e.message || e));
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1600, height: 1000, minWidth: 1180, minHeight: 720,
    backgroundColor: '#F6F1E6',
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
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'), { hash });
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
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

/* ---------------- app / data ---------------- */
ipcMain.handle('app:info', async () => ({
  version: app.getVersion(), electron: process.versions.electron, chrome: process.versions.chrome,
  node: process.versions.node, userData: P.root(), encrypt: await settings.encAvailable()
}));
ipcMain.handle('data:load', () => getDoc());
ipcMain.handle('data:save', (e, incoming) => {
  if (!incoming || typeof incoming !== 'object') throw new Error('无效数据');
  doc = incoming; return store.save(doc);
});
ipcMain.handle('data:backups', () => store.listBackups());
ipcMain.handle('data:restore', (e, name) => { doc = store.restore(name); return doc; });
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
ipcMain.handle('data:importJson', async () => {
  const r = await dialog.showOpenDialog(win, { title: '导入数据', properties: ['openFile'], filters: [{ name: '卷帙数据', extensions: ['json'] }] });
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  const incoming = JSON.parse(fs.readFileSync(r.filePaths[0], 'utf8'));
  if (!incoming || !Array.isArray(incoming.characters)) throw new Error('不是卷帙数据文件');
  doc = incoming; store.save(doc);
  return doc;
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

/* ---------------- book (拆书) ---------------- */
let cancelFlag = false;
function bookDir() { return P.ensureDir(path.join(P.dataDir(), 'books')); }
function bookTextPath(id) { return path.join(bookDir(), id + '.txt'); }

ipcMain.handle('book:create', async (e, file) => {
  const parsed = parse.parseFile(file);
  if (parsed.kind !== 'text') throw new Error('拆书需要整本书的纯文本 / docx 文件');
  const id = 'bk' + Date.now().toString(36);
  fs.writeFileSync(bookTextPath(id), parsed.text, 'utf8');
  const chapters = parse.splitChapters(parsed.text, 'chapter');
  const book = {
    id, title: parsed.filename.replace(/\.[^.]+$/, ''), filename: parsed.filename,
    chars: parsed.text.replace(/\s/g, '').length,
    rule: 'chapter', createdAt: new Date().toISOString(), status: 'ready',
    chapters: chapters.map(c => ({ idx: c.idx, title: c.title, chars: c.chars, excerpt: c.text.replace(/\s+/g, ' ').slice(0, 40) })),
    analysis: null
  };
  getDoc().books.push(book); persist();
  return book;
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
  try { fs.unlinkSync(bookTextPath(bookId)); } catch (err) {}
  persist(); return { ok: true };
});
ipcMain.handle('book:cancel', () => { cancelFlag = true; return { ok: true }; });

ipcMain.handle('book:analyze', async (e, opts) => {
  const { bookId, keepIndexes, steps } = opts || {};
  const book = getDoc().books.find(b => b.id === bookId);
  if (!book) throw new Error('找不到这本书');
  const text = fs.readFileSync(bookTextPath(bookId), 'utf8');
  let chapters = parse.splitChapters(text, book.rule || 'chapter');
  if (Array.isArray(keepIndexes) && keepIndexes.length) chapters = chapters.filter(c => keepIndexes.includes(c.idx));
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

ipcMain.handle('book:commit', (e, opts) => {
  const d = getDoc();
  const book = d.books.find(b => b.id === (opts && opts.bookId));
  if (!book || !book.analysis) throw new Error('还没有分析结果');
  const pickP = new Set((opts.people || []).map(x => x.name));
  const pickPl = new Set(opts.plots || []);
  const byName = new Map(d.characters.map(c => [c.name, c]));
  let addedC = 0, mergedC = 0, addedP = 0;
  const idOf = name => {
    const c = byName.get(name);
    return c ? c.id : null;
  };
  for (const p of book.analysis.people) {
    if (!pickP.has(p.name)) continue;
    const exist = byName.get(p.name);
    if (exist) {
      if (!exist.identity && p.identity) exist.identity = p.identity;
      if (!exist.persona && p.persona) exist.persona = p.persona;
      for (const a of p.aliases) if (exist.aliases.indexOf(a) < 0) exist.aliases.push(a);
      mergedC++;
    } else {
      const nc = {
        id: 'ch' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: p.name, aliases: p.aliases.slice(), age: p.age || '', identity: p.identity || '',
        realm: '', persona: p.persona || '', ending: '', group: '拆书导入',
        color: '#8A6A2F', portrait: null, relations: [], source: { book: book.title, count: p.count }
      };
      d.characters.push(nc); byName.set(nc.name, nc); addedC++;
    }
  }
  for (const p of book.analysis.plots) {
    if (!pickPl.has(p.title)) continue;
    d.plots.push({
      id: 'pl' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: p.title, summary: p.summary, place: p.place, chapter: p.chapter,
      chapterNo: 0, timePoint: p.batch, status: 'done',
      characterIds: (p.characters || []).map(idOf).filter(Boolean),
      source: { book: book.title }
    });
    addedP++;
  }
  persist();
  return { addedC, mergedC, addedP };
});

/* ---------------- images ---------------- */
function saveImageBuffer(charId, buf, ext) {
  const name = charId + '-' + Date.now().toString(36) + '.' + ext;
  const dest = path.join(P.portraitsDir(), name);
  fs.writeFileSync(dest, buf);
  return 'portraits/' + name;
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
  fs.writeFileSync(path.join(P.mapsDir(), name), fs.readFileSync(r.filePaths[0]));
  const plane = getDoc().planes.find(p => p.id === planeId);
  if (plane) { plane.baseImage = 'maps/' + name; persist(); }
  return { baseImage: 'maps/' + name };
});
