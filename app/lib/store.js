'use strict';
const fs = require('fs');
const path = require('path');
const P = require('./paths');
const makeSeed = require('./seed');

const MAX_BACKUPS = 30;
let lastBackupAt = 0;

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
  return doc;
}

function save(doc) {
  doc.meta = doc.meta || {};
  doc.meta.updatedAt = new Date().toISOString();
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

module.exports = { seed, load, save, backup, listBackups, restore, writeAtomic };
