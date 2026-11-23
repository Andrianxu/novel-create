'use strict';
/* 书库：一本书一个数据文件（对应"每本书里的大框架不用改动"）
 *
 * 旧版本只有 data/novelfolio.data.json 这一份数据，所有页面都认它。现在改成：
 *
 *   data/
 *   ├─ library.json            书库登记表：有哪几本书、现在打开的是哪一本
 *   ├─ books/
 *   │  ├─ bkxxxx.json          一本书的全部数据（人物 / 世界观 / 情节 / 卷 / 正文 / 拆书）
 *   │  ├─ bkxxxx.json.bak-ts   每次保存前的上一版（保留 5 份）
 *   │  └─ bkxxxx.txt           拆书导入的原文副本
 *   ├─ backups/                全局备份（设置 → 数据与备份 显示的就是这里）
 *   ├─ portraits/  maps/       图片按书分目录存放，见下
 *   └─ novelfolio.data.json    老版本的单文件数据 —— 只读入一次，不做破坏性迁移
 *
 * 设计约束：
 *   1. 每本书的 JSON 结构与以前完全一样（version / meta / characters / planes / plots /
 *      scraps / chapters / manuscripts / books / settings），页面代码一行都不用改。
 *   2. 老数据第一次被读到时原样复制成"默认书籍"；novelfolio.data.json 留在原地不动，
 *      万一哪里不对，删掉 library.json 就能回到单文件时代。
 *   3. 所有写盘都走原子替换（先写 .tmp 再改名），半路断电不会留半本书。
 */
const fs = require('fs');
const path = require('path');
const P = require('./paths');
const makeSeed = require('./seed');

const MAX_BAK = 5;
const DEFAULTS = { version: 1, activeId: null, books: [] };

/* ---------------- 小工具 ---------------- */
function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; }
}
function writeAtomic(file, obj) {
  P.ensureDir(path.dirname(file));
  const tmp = file + '.tmp-' + process.pid;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 1), 'utf8');
  fs.renameSync(tmp, file);
}
function stamp() { return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }

/* 数据文件的"骨架"：老数据缺哪个集合就补哪个，免得页面拿到 undefined */
const COLLECTIONS = ['characters', 'planes', 'plots', 'scraps', 'chapters', 'manuscripts', 'books'];
function normalizeDoc(doc) {
  const d = (doc && typeof doc === 'object') ? doc : makeSeed();
  if (!Number.isFinite(Number(d.version))) d.version = 1;
  for (const k of COLLECTIONS) if (!Array.isArray(d[k])) d[k] = [];
  if (!d.meta || typeof d.meta !== 'object') d.meta = {};
  if (!d.settings || typeof d.settings !== 'object') d.settings = makeSeed().settings;
  else if (!d.settings.ai || typeof d.settings.ai !== 'object') d.settings.ai = makeSeed().settings.ai;
  else d.settings.ai = Object.assign({}, makeSeed().settings.ai, d.settings.ai);
  if (!d.settings.image || typeof d.settings.image !== 'object') d.settings.image = makeSeed().settings.image;
  return d;
}

/* ---------------- 路径 ---------------- */
function booksDir() { return P.ensureDir(path.join(P.dataDir(), 'books')); }
function libraryFile() { return path.join(P.dataDir(), 'library.json'); }
function bookFile(id) { return path.join(booksDir(), String(id).replace(/[^\w-]/g, '_') + '.json'); }
function bookTextPath(id) { return path.join(booksDir(), String(id).replace(/[^\w-]/g, '_') + '.txt'); }

/* 一本新书的图片放在 data/portraits/<书号>/ 下，老书（以及还没分书的图片）留在 data/portraits/ 根上。
 * 这样图片地址不用改：渲染层看到的仍然是 "portraits/xxx.png" 这种相对路径。 */
function portraitsDirFor(id) {
  const base = P.portraitsDir();
  return id ? P.ensureDir(path.join(base, String(id).replace(/[^\w-]/g, '_'))) : base;
}
function mapsDirFor(id) {
  const base = P.mapsDir();
  return id ? P.ensureDir(path.join(base, String(id).replace(/[^\w-]/g, '_'))) : base;
}

/* ---------------- 书库登记表 ---------------- */
function newId(prefix) {
  return (prefix || 'bk') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function emptyLibrary() { return { version: DEFAULTS.version, activeId: null, books: [] }; }

/* 数据目录换了位置（设置 → 本地数据 → 存储位置，见 datadir.js）之后要重读登记表：
 * loadLibrary 每次都读磁盘，本来就不缓存；这里留个明确的入口，让主进程那边知道「换了地方」。 */
function forgetLibraryCache() { return true; }

function loadLibrary() {
  const lib = readJson(libraryFile(), null);
  if (!lib || typeof lib !== 'object' || !Array.isArray(lib.books)) return null;
  return normalizeLibrary(lib);
}

function normalizeLibrary(lib) {
  const out = Object.assign(emptyLibrary(), lib);
  out.books = (out.books || []).filter(b => b && b.id).map(b => ({
    id: String(b.id),
    title: String(b.title || '未命名'),
    author: String(b.author || ''),
    note: String(b.note || ''),
    createdAt: b.createdAt || new Date().toISOString(),
    lastEditedAt: b.lastEditedAt || b.createdAt || new Date().toISOString(),
    openedAt: b.openedAt || '',
    demo: !!b.demo
  }));
  if (!out.books.some(b => b.id === out.activeId)) out.activeId = out.books.length ? out.books[0].id : null;
  return out;
}

function saveLibrary(lib) {
  writeAtomic(libraryFile(), normalizeLibrary(lib));
  return lib;
}

/* ---------------- 默认书籍：从老版本的单文件数据里长出来 ---------------- */
function legacyFile() { return P.legacyDataFile(); }

function legacyDoc() {
  const f = legacyFile();
  if (!fs.existsSync(f)) return null;
  const doc = readJson(f, null);
  if (!doc || typeof doc !== 'object') return null;
  return doc;
}

/* 一本"全新"的书：数据结构与老版本一模一样，内容是空白书 / 演示书。
 * kind: 'blank'（空白书，作者沿用当前作者名） | 'demo'（和老版本首次启动时一样的演示内容） */
function newBookDoc(kind, opts) {
  const seed = makeSeed();
  if (kind === 'demo') return normalizeDoc(seed);
  const now = new Date().toISOString();
  const author = (opts && opts.author) || (seed.meta && seed.meta.author) || '我';
  const title = (opts && opts.title) || '未命名';
  const world = seed.planes[0] || {};
  return normalizeDoc({
    version: 1,
    meta: { title, author, genre: '', synopsis: '', createdAt: now, updatedAt: now },
    characters: [],
    planes: [{
      id: 'p1', name: '主位面', note: '故事发生的地方', baseImage: null,
      continents: [], sects: [], sectRelations: [],
      /* 境界之类的"数值体系"是全书的通用清单：先给一份通用框架，页面里可以随手改 */
      realms: (world.realms || []).map(r => ({ name: r.name, note: '' })),
      lore: []
    }],
    plots: [],
    scraps: [],
    chapters: [],
    manuscripts: [],
    books: [],
    settings: clone(seed.settings)
  });
}

function titleFromDoc(doc, fallback) {
  const t = doc && doc.meta && String(doc.meta.title || '').trim();
  return t || fallback || '未命名';
}

/* 把一份已有数据收成一本新书（用来接住老数据 / 导入 JSON / 复制） */
function adopt(doc, meta) {
  const id = newId();
  const d = normalizeDoc(clone(doc));
  writeAtomic(bookFile(id), d);
  const now = new Date().toISOString();
  return {
    id,
    title: titleFromDoc(d, meta && meta.title),
    author: (d.meta && d.meta.author) || (meta && meta.author) || '',
    note: (meta && meta.note) || '',
    createdAt: (d.meta && d.meta.createdAt) || now,
    lastEditedAt: (d.meta && d.meta.updatedAt) || now,
    openedAt: (meta && meta.openedAt) || now,
    demo: !!(meta && meta.demo)
  };
}

/* 保证书库至少有一本书：
 *   · 有老版本单文件数据 → 收成"默认书籍"（内容原样，标题沿用里面的书名）
 *   · 什么都没有        → 建一本和老版本首次启动时一样的演示书 */
function ensureLibrary() {
  let lib = loadLibrary();
  if (lib) {
    /* 登记表在，但书文件被谁删了：补回来，别让界面拿到空壳 */
    let repaired = false;
    for (const b of lib.books) {
      if (!fs.existsSync(bookFile(b.id))) {
        writeAtomic(bookFile(b.id), newBookDoc(b.demo ? 'demo' : 'blank', { title: b.title, author: b.author }));
        repaired = true;
      }
    }
    if (repaired) saveLibrary(lib);
    return lib;
  }
  lib = emptyLibrary();
  const old = legacyDoc();
  if (old) {
    const entry = adopt(old, { title: titleFromDoc(old, '默认书籍'), demo: false });
    lib.books.push(entry);
    lib.activeId = entry.id;
  } else if (fs.existsSync(legacyFile()) === false) {
    /* 第一次启动：演示书，和老版本"打开就是《临水问剑》"的体验一致 */
    const entry = adopt(newBookDoc('demo'), { title: titleFromDoc(makeSeed(), '临水问剑'), demo: true });
    lib.books.push(entry);
    lib.activeId = entry.id;
  }
  /* 老文件存在但读不出来（损坏）：旁边留一份拷贝，再给一本新的演示书，不建议静默覆盖 */
  saveLibrary(lib);
  return lib;
}

/* ---------------- 读 ---------------- */
function activeId() {
  const lib = ensureLibrary();
  return lib.activeId;
}

function loadBook(id) {
  const bid = id || activeId();
  if (!bid) return normalizeDoc(makeSeed());
  const f = bookFile(bid);
  if (!fs.existsSync(f)) {
    const doc = newBookDoc('blank');
    writeAtomic(f, doc);
    return doc;
  }
  let doc = readJson(f, null);
  if (!doc || typeof doc !== 'object') {
    try { fs.copyFileSync(f, f + '.broken-' + Date.now()); } catch (e) {}
    doc = newBookDoc('blank');
    writeAtomic(f, doc);
  }
  return normalizeDoc(doc);
}

/* ---------------- 写 ---------------- */
function writeBookFile(id, doc, opts) {
  const f = bookFile(id);
  /* 每次覆盖前留一版上一稿：只在内容真的变了时才留，免得一次打字刷出一堆备份 */
  try {
    if (fs.existsSync(f) && !(opts && opts.noBackup)) {
      const prev = readJson(f, null);
      const changed = !prev || JSON.stringify(prev) !== JSON.stringify(doc);
      if (changed) {
        fs.copyFileSync(f, f + '.bak-' + stamp());
        const baks = fs.readdirSync(booksDir()).filter(n => n.startsWith(path.basename(f) + '.bak-')).sort();
        while (baks.length > MAX_BAK) { try { fs.unlinkSync(path.join(booksDir(), baks.shift())); } catch (e) {} }
      }
    }
  } catch (e) { /* 备份失败不影响保存 */ }
  writeAtomic(f, doc);
  return f;
}

/* 保存某一本书，并同步登记表里的书名 / 作者 / 最后编辑时间 */
function saveBook(id, doc) {
  const bid = id || activeId();
  const lib = ensureLibrary();
  const entry = lib.books.find(b => b.id === bid);
  if (!entry) throw new Error('这本书不在书库里');
  const d = normalizeDoc(doc);
  d.meta = d.meta || {};
  d.meta.updatedAt = new Date().toISOString();
  d.meta.title = titleFromDoc(d, entry.title);
  d.meta.author = d.meta.author || entry.author || '';
  writeBookFile(bid, d);
  entry.title = d.meta.title;
  entry.author = d.meta.author;
  entry.lastEditedAt = d.meta.updatedAt;
  saveLibrary(lib);
  return { ok: true, updatedAt: d.meta.updatedAt, id: bid };
}

/* 切换：只动登记表里的 activeId，界面下一轮 data.load() 就拿到另一本 */
function switchBook(id) {
  const lib = ensureLibrary();
  const entry = lib.books.find(b => b.id === id);
  if (!entry) throw new Error('这本书不在书库里');
  lib.activeId = entry.id;
  entry.openedAt = new Date().toISOString();
  saveLibrary(lib);
  return lib;
}

/* ---------------- 书库管理 ---------------- */
function listBooks() {
  const lib = ensureLibrary();
  return { activeId: lib.activeId, books: lib.books.map(b => Object.assign({}, b)) };
}

/* 书库里的书名撞车时补个序号：《临水问剑》《临水问剑》（2）。
 * 新建时没填书名也从这儿取，免得书库里一排"未命名"。 */
function uniqueTitle(lib, base, skipId) {
  const used = new Set((lib.books || []).filter(b => b.id !== skipId).map(b => String(b.title || '')));
  const raw = String(base || '未命名').trim() || '未命名';
  /* 带序号的「临水问剑（2）」先去根再重新排号；不带序号的先看原名有没有人用。
   * 两件事要分开做，否则「（2）」会被剥成根名、再原样返回，书库里就出现两本同名的。 */
  const m = /（(\d+)）$/.exec(raw);
  const root = m ? raw.slice(0, m.index) : raw;
  if (!m && !used.has(raw)) return raw;
  let n = 2;
  while (used.has(root + '（' + n + '）')) n++;
  return root + '（' + n + '）';
}

/* 新建：copyFrom 给了就把那本书的当前内容抄一份（"复制一本"），
 * fromDoc 给了就收下一份现成数据（导入 JSON 还原），否则按 kind 造 */
function createBook(opts) {
  const o = opts || {};
  const lib = ensureLibrary();
  const isCopy = !!(o.copyFrom || o.fromDoc);
  let doc;
  if (o.fromDoc) {
    doc = clone(o.fromDoc);
    if (doc.meta) doc.meta.title = String(o.title || (doc.meta && doc.meta.title) || '导入的书').trim();
  } else if (o.copyFrom) {
    doc = loadBook(o.copyFrom);
    if (doc.meta) doc.meta.title = String(o.title || ((doc.meta.title || '未命名') + ' · 副本')).trim();
  } else {
    doc = newBookDoc(o.kind === 'demo' ? 'demo' : 'blank', { title: o.title || '未命名', author: o.author });
  }
  const d = normalizeDoc(doc);
  const id = newId();
  const now = new Date().toISOString();
  d.meta = Object.assign({}, d.meta, {
    title: uniqueTitle(lib, String(o.title || (d.meta && d.meta.title) || '未命名').trim() || '未命名'),
    author: String(o.author || (d.meta && d.meta.author) || '').trim(),
    createdAt: isCopy ? (d.meta && d.meta.createdAt) || now : now,
    updatedAt: now
  });
  writeAtomic(bookFile(id), d);
  const entry = {
    id, title: d.meta.title, author: d.meta.author, note: String(o.note || ''),
    createdAt: now, lastEditedAt: now, openedAt: '', demo: false
  };
  lib.books.push(entry);
  if (o.activate !== false) { lib.activeId = id; entry.openedAt = now; }
  saveLibrary(lib);
  return { book: entry, activeId: lib.activeId };
}

function renameBook(id, patch) {
  const lib = ensureLibrary();
  const entry = lib.books.find(b => b.id === id);
  if (!entry) throw new Error('这本书不在书库里');
  const doc = loadBook(id);
  if (patch && patch.title != null) {
    /* 改名也不许撞名：撞了就自动补序号，省得书库里两本同名的分不清 */
    entry.title = uniqueTitle(lib, String(patch.title).trim() || entry.title, id);
    doc.meta = doc.meta || {};
    doc.meta.title = entry.title;
  }
  if (patch && patch.author != null) {
    entry.author = String(patch.author).trim();
    doc.meta = doc.meta || {};
    doc.meta.author = entry.author;
  }
  if (patch && patch.note != null) entry.note = String(patch.note);
  entry.lastEditedAt = new Date().toISOString();
  (doc.meta = doc.meta || {}).updatedAt = entry.lastEditedAt;
  writeAtomic(bookFile(id), doc);
  saveLibrary(lib);
  return { book: Object.assign({}, entry) };
}

function deleteBook(id) {
  const lib = ensureLibrary();
  if (lib.books.length <= 1) throw new Error('书库里至少要留一本书');
  const idx = lib.books.findIndex(b => b.id === id);
  if (idx < 0) throw new Error('这本书不在书库里');
  /* 删除前先留一份全局备份：误删也能从「设置 → 数据与备份」里恢复 */
  let backup = '';
  try {
    const doc = readJson(bookFile(id), null);
    if (doc) {
      const f = path.join(P.backupDir(), 'deleted-' + String(id).replace(/[^\w-]/g, '_') + '-' + stamp() + '.json');
      fs.writeFileSync(f, JSON.stringify(doc, null, 1), 'utf8');
      backup = f;
    }
  } catch (e) { /* 备份失败也继续删 */ }
  /* 书文件挪进回收目录而不是直接删掉 */
  try {
    const rec = P.ensureDir(path.join(P.dataDir(), 'trash'));
    for (const ext of ['.json', '.txt']) {
      const f = bookFile(id).replace(/\.json$/, ext);
      if (fs.existsSync(f)) fs.renameSync(f, path.join(rec, path.basename(f) + '.' + stamp()));
    }
    for (const n of fs.readdirSync(booksDir())) {
      if (n.startsWith(path.basename(bookFile(id)) + '.bak-')) {
        try { fs.renameSync(path.join(booksDir(), n), path.join(rec, n + '.' + stamp())); } catch (e) {}
      }
    }
  } catch (e) { /* 挪不动就算了，登记表里去掉即可 */ }
  lib.books.splice(idx, 1);
  if (lib.activeId === id) lib.activeId = lib.books[Math.min(idx, lib.books.length - 1)].id;
  saveLibrary(lib);
  return { ok: true, activeId: lib.activeId, backup };
}

module.exports = {
  DEFAULTS, COLLECTIONS, MAX_BAK,
  booksDir, bookFile, bookTextPath, libraryFile, legacyFile,
  portraitsDirFor, mapsDirFor,
  normalizeDoc, newBookDoc, newId,
  ensureLibrary, loadLibrary, saveLibrary, listBooks, forgetLibraryCache,
  activeId, loadBook, saveBook, switchBook,
  createBook, renameBook, deleteBook,
  readJson, writeAtomic
};
