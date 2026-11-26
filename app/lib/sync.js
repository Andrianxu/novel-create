'use strict';
/* 同步传输层：把书稿放进用户自己的网盘 / 本地同步盘
 *
 * 两种后端：
 *   folder —— 本地文件夹。本地同步盘（OneDrive、坚果云、iCloud）和
 *             百度网盘 / 夸克网盘 / 迅雷网盘的电脑客户端同步文件夹都走这里：
 *             卷帙只写本地文件，上传交给网盘客户端。
 *   webdav —— 坚果云、群晖 NAS、Nextcloud 等任何支持 WebDAV 的服务
 *
 * 百度 / 夸克 / 迅雷没有公开的 WebDAV，也不做未授权的私有 API 对接，
 * 所以它们的「连接方式」就是各自客户端的同步文件夹，配置里记成 kind。
 *
 * 上传的内容：
 *   novelfolio.sync     书稿（JSON，可选端到端加密）
 *   novelfolio.images/  立绘、地图底图这类图片（按需，本次先只传书稿）
 *
 * 设计原则：所有网络与磁盘错误都转成人话，界面直接显示。
 */
const fs = require('fs');
const path = require('path');
const cryptoMgr = require('./crypto');

const SYNC_FILE = 'novelfolio.sync';

/* 走本地文件夹后端的 kind。新增网盘预设只要加在这里和设置页的说明里，
 * 传输 / 合并 / 加密逻辑全都不用动。 */
const FOLDER_KINDS = {
  folder: '同步文件夹',
  baidu: '百度网盘',
  quark: '夸克网盘',
  xunlei: '迅雷网盘'
};
function isFolderKind(kind) { return Object.prototype.hasOwnProperty.call(FOLDER_KINDS, String(kind || '')); }
function folderLabel(kind) { return FOLDER_KINDS[String(kind || '')] || FOLDER_KINDS.folder; }

/* ---------------- 本地文件夹后端 ---------------- */
function folderConn(conf) {
  const dir = String((conf && conf.folder) || '').trim();
  if (!dir) throw new Error('还没有选择同步文件夹');
  return {
    kind: 'folder',
    dir,
    async read() {
      const p = path.join(dir, SYNC_FILE);
      try { return fs.readFileSync(p); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
    },
    async write(buf) {
      fs.mkdirSync(dir, { recursive: true });
      const p = path.join(dir, SYNC_FILE);
      const tmp = p + '.tmp-' + process.pid;
      fs.writeFileSync(tmp, buf);
      fs.renameSync(tmp, p);           /* 先写临时文件再改名：同步盘不会读到写了一半的稿 */
      return { bytes: buf.length, file: p };
    },
    async test() {
      let st;
      try { st = fs.statSync(dir); } catch (e) { throw new Error('文件夹不存在：' + dir); }
      if (!st.isDirectory()) throw new Error('这不是一个文件夹：' + dir);
      try { fs.accessSync(dir, fs.constants.W_OK); } catch (e) { throw new Error('这个文件夹不可写：' + dir); }
      const kind = (conf && conf.kind) || 'folder';
      const who = isFolderKind(kind) && kind !== 'folder' ? folderLabel(kind) + '同步文件夹' : '文件夹';
      return { ok: true, detail: who + '可读写：' + dir };
    }
  };
}

/* ---------------- WebDAV 后端 ---------------- */
function normalizeDav(u) {
  let s = String(u || '').trim();
  if (!s) throw new Error('还没有填 WebDAV 地址');
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  return s.replace(/\/+$/, '');
}
function basicAuth(user, pass) {
  return 'Basic ' + Buffer.from(String(user || '') + ':' + String(pass || '')).toString('base64');
}
function davConn(conf) {
  const base = normalizeDav(conf && conf.url);
  const headers = { Authorization: basicAuth(conf && conf.user, conf && conf.pass) };
  const fileUrl = base + '/' + SYNC_FILE;

  function explain(status, text) {
    if (status === 401 || status === 403) return '账号或密码不对，或者没有权限（HTTP ' + status + '）';
    if (status === 404) return '地址不存在（HTTP 404），检查一下 WebDAV 地址';
    if (status === 507) return '网盘空间不足（HTTP 507）';
    return 'WebDAV 返回 HTTP ' + status + (text ? '：' + String(text).slice(0, 200) : '');
  }

  return {
    kind: 'webdav',
    async read() {
      const res = await fetch(fileUrl, { method: 'GET', headers });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(explain(res.status, await res.text().catch(() => '')));
      return Buffer.from(await res.arrayBuffer());
    },
    async write(buf) {
      const res = await fetch(fileUrl, { method: 'PUT', headers: Object.assign({ 'Content-Type': 'application/octet-stream' }, headers), body: buf });
      if (!res.ok) throw new Error(explain(res.status, await res.text().catch(() => '')));
      return { bytes: buf.length, file: fileUrl };
    },
    async test() {
      /* 先确认目录可达（对目录发 PROPFIND，depth 0） */
      const res = await fetch(base, { method: 'PROPFIND', headers: Object.assign({ Depth: '0', 'Content-Type': 'application/xml' }, headers) });
      if (res.status === 401 || res.status === 403) throw new Error(explain(res.status));
      if (res.status === 404) throw new Error('地址不存在（HTTP 404）：' + base);
      if (!res.ok && res.status !== 207) throw new Error(explain(res.status));
      /* 再探一下能否写（PUT 一个探测文件再删掉） */
      const probe = base + '/.novelfolio-probe';
      const put = await fetch(probe, { method: 'PUT', headers: Object.assign({ 'Content-Type': 'text/plain' }, headers), body: 'probe' });
      if (!put.ok) throw new Error('目录可以读，但不能写：' + explain(put.status));
      await fetch(probe, { method: 'DELETE', headers }).catch(() => {});
      return { ok: true, detail: '连接成功，可读可写：' + base };
    }
  };
}

function open(conf) {
  const kind = (conf && conf.kind) || 'folder';
  if (kind === 'webdav') return davConn(conf);
  return folderConn(conf);   /* folder / baidu / quark / xunlei：都写本地同步文件夹 */
}

/* ---------------- 打包 / 解包 ---------------- */
function pack(doc, passphrase) {
  const payload = { kind: 'novelfolio-sync', version: 1, savedAt: new Date().toISOString(), doc };
  const buf = Buffer.from(JSON.stringify(payload), 'utf8');
  return passphrase ? cryptoMgr.encrypt(buf, passphrase) : buf;
}

function unpack(buf, passphrase) {
  if (!buf) return null;
  const plain = cryptoMgr.isEncrypted(buf) ? cryptoMgr.decrypt(buf, passphrase) : buf;
  let obj;
  try { obj = JSON.parse(plain.toString('utf8')); } catch (e) { throw new Error('网盘上的文件不是卷帙的同步文件'); }
  if (obj && obj.kind === 'novelfolio-sync' && obj.doc) return obj.doc;
  /* 兼容：直接是原始书稿 JSON */
  if (obj && Array.isArray(obj.characters)) return obj;
  throw new Error('网盘上的文件格式不对');
}

function isEncrypted(buf) { return cryptoMgr.isEncrypted(buf); }
function fingerprint(p) { return cryptoMgr.fingerprint(p); }

module.exports = { open, pack, unpack, isEncrypted, fingerprint, SYNC_FILE, normalizeDav, FOLDER_KINDS, isFolderKind, folderLabel };
