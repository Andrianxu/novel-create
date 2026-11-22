'use strict';
const fs = require('fs');
const path = require('path');
const P = require('./paths');
const makeSeed = require('./seed');
const bookcase = require('./bookcase');

const MAX_BACKUPS = 30;
let lastBackupAt = 0;

/* ---- 自动打戳：谁改了条目，就给它盖上「改过」的时间 ----
 *
 * 为什么需要：各页面改数据时大多直接改字段、再调 NF.save()，并不管 updatedAt。
 * 同步按 updatedAt 判断新旧，条目没戳就会被当成「没改过」而被云端覆盖 —— 这是丢稿的路。
 *
 * 做法：每次落盘前，把每条内容与「上次落盘时的样子」比对；内容变了的就更新 updatedAt。
 * 保存路径只有这一个，所以任何页面、任何改法都能覆盖到。
 */
const COLLECTIONS = ['characters', 'planes', 'plots', 'scraps', 'chapters', 'manuscripts', 'books'];
const lastSig = new Map();          /* "集合/id" -> 内容签名 */

function itemSig(it) {
  if (!it || typeof it !== 'object') return '';
  const copy = {};
  for (const k of Object.keys(it)) if (k !== 'updatedAt') copy[k] = it[k];
  return JSON.stringify(copy, Object.keys(copy).sort());
}

function stampChanges(doc) {
  const now = new Date().toISOString();
  const seen = new Set();
  for (const key of COLLECTIONS) {
    const arr = Array.isArray(doc[key]) ? doc[key] : [];
    for (const it of arr) {
      if (!it || it.id == null) continue;
      const id = key + '/' + it.id;
      seen.add(id);
      const sig = itemSig(it);
      const prev = lastSig.get(id);
      if (prev !== undefined && prev !== sig) it.updatedAt = now;   /* 改过：盖新戳 */
      lastSig.set(id, sig);
    }
  }
  /* 被删掉的条目不再跟踪 */
  for (const id of Array.from(lastSig.keys())) if (!seen.has(id)) lastSig.delete(id);
}

/* 载入后先把每条的现状记成基线，免得启动时把所有条目都当「刚改过」 */
function primeSignatures(doc) {
  lastSig.clear();
  for (const key of COLLECTIONS) {
    const arr = Array.isArray(doc[key]) ? doc[key] : [];
    for (const it of arr) { if (it && it.id != null) lastSig.set(key + '/' + it.id, itemSig(it)); }
  }
}

function seed() { return makeSeed(); }

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; }
}

function writeAtomic(file, obj) {
  const tmp = file + '.tmp-' + process.pid;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 1), 'utf8');
  fs.renameSync(tmp, file);
}

/* ---------------- 书库 ----------------
 * 每本书一个数据文件，现在打开的是哪一本由「书库登记表」说了算。
 * 这里只负责「当前这一本」的读写与打戳；书库本身的增删改在 bookcase.js。 */
function currentId() { return bookcase.activeId(); }

function load() {
  const doc = bookcase.loadBook();
  primeSignatures(doc);
  return doc;
}

function save(doc) {
  const id = currentId();
  doc.meta = doc.meta || {};
  stampChanges(doc);                 /* 改过的条目自动盖新戳，同步才不会把它当旧的 */
  const r = bookcase.saveBook(id, doc);
  doc.meta.updatedAt = r.updatedAt;
  const now = Date.now();
  if (now - lastBackupAt > 5 * 60 * 1000) { lastBackupAt = now; try { backup(doc); } catch (e) {} }
  return { ok: true, updatedAt: doc.meta.updatedAt, bookId: id };
}

/* 全局备份：放在 data/backups/ 下，文件名里带书号，恢复时按书号归位 */
function backup(doc) {
  const id = currentId() || 'book';
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const f = path.join(P.backupDir(), 'backup-' + id + '-' + stamp + '.json');
  fs.writeFileSync(f, JSON.stringify(Object.assign({ bookId: id }, doc), null, 1), 'utf8');
  const list = listBackups();
  for (const old of list.slice(MAX_BACKUPS)) { try { fs.unlinkSync(old.path); } catch (e) {} }
  return f;
}

function listBackups() {
  const dir = P.backupDir();
  return fs.readdirSync(dir).filter(n => n.endsWith('.json')).map(n => {
    const p = path.join(dir, n); const st = fs.statSync(p);
    return { name: n, path: p, size: st.size, mtime: st.mtime.toISOString(), bookId: n.startsWith('backup-') ? n.slice(7).replace(/-\d{4}-.*$/, '') : '' };
  }).sort((a, b) => (a.mtime < b.mtime ? 1 : -1));
}

/* 恢复：备份里记着是哪本书，就写回那本书；没记（老备份）就写回当前这本 */
function restore(name) {
  const p = path.join(P.backupDir(), path.basename(name));
  if (!fs.existsSync(p)) throw new Error('备份不存在');
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  const bookId = raw && raw.bookId && bookcase.listBooks().books.some(b => b.id === raw.bookId) ? raw.bookId : currentId();
  const doc = Object.assign({}, raw);
  delete doc.bookId;
  if (!bookId) throw new Error('这本书已经不在书库里了');
  bookcase.saveBook(bookId, doc);
  if (bookId !== currentId()) bookcase.switchBook(bookId);
  return bookcase.loadBook(bookId);
}

/* 导入一份 JSON：收成一本新书，并切过去（不再覆盖当前的书）。
 *
 * 「导出…」里可以只导其中几块，那种 JSON 不是完整备份 —— 直接导进来会得到一本
 * 缺了正文/人物的书，还以为是恢复成功了。所以这里认一下 scopes：
 * 只带部分范围的 JSON 直接拒掉，并告诉作者该怎么办。 */
const ALL_SCOPES_N = 7;
function importAsBook(incoming) {
  if (!incoming || typeof incoming !== 'object') throw new Error('不是卷帙数据文件');
  if (Array.isArray(incoming.scopes) && incoming.scopes.length < ALL_SCOPES_N) {
    const labels = incoming.scopes.map(k => ({
      manuscripts: '正文', characters: '人物', world: '世界观', plots: '情节',
      volumes: '卷目录', scraps: '废案', bookanalysis: '拆书结果'
    }[k] || k)).join('、');
    throw new Error('这份 JSON 只包含「' + labels + '」，不是完整备份，导入会得到一本缺内容的书。'
      + '要恢复整本，请在「导出…」里全选后导出 JSON，或用「设置 → 导出 JSON」。');
  }
  if (!Array.isArray(incoming.characters) && !Array.isArray(incoming.manuscripts) && !Array.isArray(incoming.plots)) {
    throw new Error('不是卷帙数据文件');
  }
  const title = (incoming.meta && incoming.meta.title) || '导入的书';
  const r = bookcase.createBook({ title, author: (incoming.meta && incoming.meta.author) || '', fromDoc: incoming });
  return { book: r.book, doc: bookcase.loadBook(r.book.id) };
}

module.exports = {
  seed, load, save, backup, listBackups, restore, writeAtomic, primeSignatures, stampChanges, importAsBook,
  currentId
};
