'use strict';
const fs = require('fs');
const path = require('path');
const P = require('./paths');
const makeSeed = require('./seed');

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

function load() {
  const f = P.dataFile();
  if (!fs.existsSync(f)) { const d = seed(); writeAtomic(f, d); return d; }
  const doc = readJson(f, null);
  if (!doc || typeof doc !== 'object') {
    try { fs.copyFileSync(f, f + '.broken-' + Date.now()); } catch (e) {}
    const d = seed(); writeAtomic(f, d); return d;
  }
  for (const k of ['characters', 'planes', 'plots', 'scraps', 'chapters', 'books']) if (!Array.isArray(doc[k])) doc[k] = [];
  if (!doc.settings) doc.settings = seed().settings;
  primeSignatures(doc);
  return doc;
}

function save(doc) {
  doc.meta = doc.meta || {};
  doc.meta.updatedAt = new Date().toISOString();
  stampChanges(doc);                 /* 改过的条目自动盖新戳，同步才不会把它当旧的 */
  writeAtomic(P.dataFile(), doc);
  const now = Date.now();
  if (now - lastBackupAt > 5 * 60 * 1000) { lastBackupAt = now; try { backup(doc); } catch (e) {} }
  return { ok: true, updatedAt: doc.meta.updatedAt };
}

function backup(doc) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const f = path.join(P.backupDir(), 'backup-' + stamp + '.json');
  fs.writeFileSync(f, JSON.stringify(doc, null, 1), 'utf8');
  const list = listBackups();
  for (const old of list.slice(MAX_BACKUPS)) { try { fs.unlinkSync(old.path); } catch (e) {} }
  return f;
}

function listBackups() {
  const dir = P.backupDir();
  return fs.readdirSync(dir).filter(n => n.endsWith('.json')).map(n => {
    const p = path.join(dir, n); const st = fs.statSync(p);
    return { name: n, path: p, size: st.size, mtime: st.mtime.toISOString() };
  }).sort((a, b) => (a.mtime < b.mtime ? 1 : -1));
}

function restore(name) {
  const p = path.join(P.backupDir(), path.basename(name));
  if (!fs.existsSync(p)) throw new Error('备份不存在');
  const doc = JSON.parse(fs.readFileSync(p, 'utf8'));
  writeAtomic(P.dataFile(), doc);
  return doc;
}

module.exports = { seed, load, save, backup, listBackups, restore, writeAtomic, primeSignatures, stampChanges };
