'use strict';
/* 同步流程编排：拉 → 合 → 推
 *
 * 一次 syncNow()：
 *   1. 连上用户的网盘（本地文件夹或 WebDAV）
 *   2. 读云端书稿（有的话）。是密文就用已保存的口令解
 *   3. 与本机数据按条目合并（merge.js：冲突两份都留）
 *   4. 有变化就把合并结果写回云端，并更新本机
 *
 * 任何一步出错都不动本机数据 —— 宁可这次不同步，也不能把书弄坏。
 */
const path = require('path');
const settings = require('./settings');
const store = require('./store');
const sync = require('./sync');
const mergeLib = require('./merge');

let running = false;
let lastResult = null;

/* 上传前把「上次同步基线」摘掉：那是本机自己的参照，不该跟着书稿跑到别的设备上 */
function stripBases(doc) {
  const out = JSON.parse(JSON.stringify(doc));
  for (const key of mergeLib.COLLECTIONS) {
    for (const it of (out[key] || [])) { if (it && it._syncBase) delete it._syncBase; }
  }
  return out;
}

function lastSyncInfoFile() { const P = require('./paths'); return path.join(P.root(), 'sync-state.json'); }
function readState() {
  try { return JSON.parse(require('fs').readFileSync(lastSyncInfoFile(), 'utf8')); } catch (e) { return {}; }
}
function writeState(st) {
  try { require('fs').writeFileSync(lastSyncInfoFile(), JSON.stringify(st, null, 1), 'utf8'); } catch (e) {}
}

/**
 * @param {{doc: object, onProgress?: (msg: string) => void}} opts
 * @returns {Promise<object>} 同步结果
 */
async function syncNow(opts) {
  if (running) return { ok: false, busy: true, message: '正在同步中' };
  running = true;
  const say = msg => { try { if (opts && opts.onProgress) opts.onProgress(msg); } catch (e) {} };
  try {
    const cfg = settings.getConfig();
    const conf = cfg.sync || {};
    if (!conf.enabled) throw new Error('还没有开启同步');
    if (!opts || !opts.doc) throw new Error('本机还没有数据');

    const pass = conf.encrypt ? await settings.getSyncCredential('syncPass') : '';
    if (conf.encrypt && !pass) throw new Error('开启了加密，但还没设置同步口令');

    let creds = Object.assign({}, conf);
    if (conf.kind === 'webdav') {
      creds = Object.assign({}, conf, { pass: await settings.getSyncCredential('davPass') });
    }

    const conn = sync.open(creds);
    say('连接网盘…');
    let remoteBuf = null;
    try { remoteBuf = await conn.read(); } catch (e) { throw new Error('读取云端失败：' + e.message); }

    let remoteDoc = null;
    if (remoteBuf) {
      say('解密云端书稿…');
      remoteDoc = sync.unpack(remoteBuf, pass);
    }

    let localDoc = opts.doc;
    let merged = localDoc;
    let stats = { added: 0, updated: 0, kept: 0, conflicts: 0, docChanged: false };
    let conflicts = [];

    if (remoteDoc) {
      say('合并两边的改动…');
      const r = mergeLib.mergeDocs(localDoc, remoteDoc);
      merged = r.doc;
      stats = r.stats;
      conflicts = r.conflicts;
      /* 记下本轮云端的样子：下次同步才知道「谁动过」 */
      mergeLib.updateBases(merged, remoteDoc);
    }

    /* 比「书稿本身」而不是比 merge 的 stats：
     * 对面新增的条目算 added，但本机内容没变，stats.docChanged 会是 false，
     * 用 stats 判断就会漏传 —— 两边都以为「已是最新」，书却对不上。
     * 用 contentSignature 直接比最终内容，才可靠。 */
    const needPush = !remoteDoc || mergeLib.contentSignature(merged) !== mergeLib.contentSignature(remoteDoc);
    if (!needPush && localDoc !== merged) {
      /* 云端是本机的超集或更新，本机数据被更新了，也算「有变化」 */
      stats.docChanged = mergeLib.contentSignature(localDoc) !== mergeLib.contentSignature(merged);
    }
    if (needPush) {
      say('上传书稿…');
      const buf = sync.pack(stripBases(merged), pass);
      await conn.write(buf);
    }

    const st = {
      ok: true,
      at: new Date().toISOString(),
      pushed: needPush,
      stats, conflicts,
      message: !remoteBuf ? '已建立云端书稿'
        : stats.conflicts ? ('同步完成，有 ' + stats.conflicts + ' 处冲突已保留两份')
        : stats.docChanged ? '同步完成，云端已更新'
        : '已是最新'
    };
    lastResult = st;
    writeState({ at: st.at, message: st.message, conflicts: st.conflicts.length });
    return { ok: true, doc: merged, changed: stats.docChanged, ...st };
  } catch (e) {
    const fail = { ok: false, at: new Date().toISOString(), message: e.message || String(e) };
    lastResult = fail;
    return fail;
  } finally {
    running = false;
  }
}

async function testConnection(conf) {
  try {
    const cfg = settings.getConfig();
    const c = Object.assign({}, cfg.sync || {}, conf || {});
    if (c.kind === 'webdav') c.pass = Object.assign({}, c, { pass: c.pass || await settings.getSyncCredential('davPass') }).pass;
    const conn = sync.open(c);
    const r = await conn.test();
    /* 顺手看一眼云端有没有别人的书稿 */
    let hasRemote = false;
    try { hasRemote = !!(await conn.read()); } catch (e) {}
    return { ok: true, detail: r.detail, hasRemote };
  } catch (e) {
    return { ok: false, message: e.message || String(e) };
  }
}

function status() {
  return lastResult || { ok: null, message: '还没有同步过' };
}

module.exports = { syncNow, testConnection, status };
