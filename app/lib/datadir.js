'use strict';
/* 数据目录的「换地方」与「体检」。
 *
 * 书稿全在 data/ 里（library.json + books/ + portraits/ + maps/ + backups/ + trash/）。
 * 设置 → 本地数据 → 存储位置 可以把这一整块搬到作者挑的目录：
 *   · 整块复制（保留原来的目录结构），不是逐个文件挑
 *   · 先查目标能不能写、有没有别人的卷帙数据、是不是自己嵌在自己里面
 *   · 复制完再核对一遍（文件数 + 总字节数），对上了才改指针
 *   · 原来那块**留着不删**：删稿这种事不该由一次「换个位置」顺手做了，
 *     要清理由作者自己按提示去删；想搬回来就是再指回默认位置（那边的东西一直都在）
 *
 * 真正的「换」要重启才生效（见 paths.js 里的说明），所以这里只负责：搬文件 + 改指针 + 报告搬了什么。 */
const fs = require('fs');
const path = require('path');
const P = require('./paths');

/* data/ 下要跟着走的东西。其它零碎（临时文件、半截的 .tmp-）不复制 */
const COPY_SKIP = /(\.tmp-|\.broken-|\.crdownload$)/i;

function defaultDataDir() { return path.join(P.defaultRoot(), 'data'); }
function sameDir(a, b) {
  const n = p => path.resolve(String(p || '')).replace(/[\\/]+$/, '').toLowerCase();
  return n(a) === n(b);
}
/* 两个目录是不是「一个套在另一个里面」——那种情况两边都会写，怎么复制都是错 */
function nested(a, b) {
  const na = path.resolve(a).replace(/[\\/]+$/, '').toLowerCase() + path.sep;
  const nb = path.resolve(b).replace(/[\\/]+$/, '').toLowerCase() + path.sep;
  return na.startsWith(nb) || nb.startsWith(na);
}

function isDataDir(dir) {
  try {
    const st = fs.statSync(dir);
    if (!st.isDirectory()) return false;
    return fs.existsSync(path.join(dir, 'library.json')) || fs.existsSync(path.join(dir, 'novelfolio.data.json'));
  } catch (e) { return false; }
}

/* 目标目录是不是空的。非空又不像数据目录时拒绝 —— 免得把自己的东西铺进人家的文件夹 */
function isEmptyDir(dir) {
  try { return fs.readdirSync(dir).length === 0; } catch (e) { return true; }
}

/* 能不能在里面写：真的写一个文件再删掉，比只看权限位靠谱 */
function writable(dir) {
  const probe = '.nf-write-test-' + Date.now();
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, probe), 'ok', 'utf8');
    fs.unlinkSync(path.join(dir, probe));
    return true;
  } catch (e) {
    try { fs.unlinkSync(path.join(dir, probe)); } catch (e2) {}
    return false;
  }
}

/* 数一下一块目录里有多少文件、占多少字节，复制完拿它对账 */
function treeStat(dir) {
  let files = 0, bytes = 0;
  (function walk(d) {
    let list = [];
    try { list = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const it of list) {
      const p = path.join(d, it.name);
      if (COPY_SKIP.test(it.name)) continue;
      if (it.isDirectory()) walk(p);
      else if (it.isFile()) {
        files++;
        try { bytes += fs.statSync(p).size; } catch (e) {}
      }
    }
  })(dir);
  return { files, bytes };
}

function copyTree(src, dst, progress) {
  let done = 0;
  fs.mkdirSync(dst, { recursive: true });
  (function walk(d, out) {
    let list = [];
    try { list = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const it of list) {
      if (COPY_SKIP.test(it.name)) continue;
      const from = path.join(d, it.name);
      const to = path.join(out, it.name);
      if (it.isDirectory()) { fs.mkdirSync(to, { recursive: true }); walk(from, to); }
      else if (it.isFile()) {
        fs.copyFileSync(from, to);
        done++;
        if (progress && done % 20 === 0) { try { progress(done); } catch (e) {} }
      }
    }
  })(src, dst);
  return done;
}

/* 设置页要显示的现状。从来没有设置过自定义目录时指针是空的，一切按默认位置走。
 *
 * 指针和当前目录不一致有两种情况，它们要分开报，界面上说法完全不同：
 *   pending —— 刚搬完、还没重启（或者别的窗口改过指针）：目标目录好端端在那儿，重启就切过去
 *   missing —— 目标目录不见了（移动硬盘没插 / 文件夹被删）：现在临时用默认位置，指针先留着 */
function info() {
  const cur = P.dataDir();
  const def = defaultDataDir();
  const pointer = P.readPointer();
  const r = { current: cur, defaultDir: def, custom: !sameDir(cur, def), pointer, missing: false, pending: false, writable: true };
  r.writable = writable(cur);
  if (pointer && !sameDir(pointer, cur)) {
    /* 目标目录在、而且里面确实有书 = 只差重启（pending）；否则就是找不到了（missing） */
    let there = false;
    try { there = fs.statSync(pointer).isDirectory(); } catch (e) { there = false; }
    if (there && isDataDir(pointer)) r.pending = true;
    else r.missing = true;
  }
  try {
    const st = treeStat(cur);
    r.files = st.files;
    r.size = st.bytes;
  } catch (e) {}
  return r;
}

/* 换到 target（传空 or 默认位置 = 搬回默认）。
 * opts.move 为 false / 目标里已经有一份数据时只改指针，不复制（「接着用那里面已有的书」）。 */
function migrate(target, opts) {
  const o = opts || {};
  const from = P.dataDir();
  const def = defaultDataDir();
  const to = String(target || '').trim() ? P.checkDirs(target).abs : def;
  if (sameDir(from, to)) {
    /* 本来就在这个位置：只需要把指针理顺（在默认位置时干脆清掉，省得以后看着像「自定义」） */
    P.writePointer(sameDir(to, def) ? '' : to);
    return { ok: true, changed: false, from, to, copied: 0, message: '数据本来就在这个位置' };
  }
  if (nested(from, to)) throw new Error('新位置不能和现在的数据目录互相包含（会把数据套进自己里面）');
  if (!writable(to)) throw new Error('这个文件夹写不进去，请换一个位置（或者检查一下硬盘权限 / 是不是只读盘）');
  const targetHasData = isDataDir(to);
  if (!targetHasData && !isEmptyDir(to)) {
    throw new Error('这个文件夹不是空的，也不是卷帙的数据目录。请挑一个空文件夹，免得把它里面原有的东西搅进来。');
  }
  if (targetHasData && !o.reuse) {
    throw new Error('这个文件夹里已经有一份卷帙数据（可能是以前用过的）。要换过去用它里面已有的书，请选「使用这里已有的数据」。');
  }

  let copied = 0;
  let bytes = 0;
  if (targetHasData) {
    /* 那边本来就有书：不复制、不覆盖，直接切过去用它的。
     * 切回默认位置时指针顺手清掉（不留一个「指着默认位置的自定义指针」）。 */
    P.writePointer(sameDir(to, def) ? '' : to);
    return { ok: true, changed: true, reused: true, from, to, copied: 0, message: '已切换到该文件夹里原有的数据' };
  }

  const srcStat = treeStat(from);
  if (o.onProgress) { try { o.onProgress({ phase: 'copy', done: 0, total: srcStat.files }); } catch (e) {} }
  copyTree(from, to, n => { if (o.onProgress) { try { o.onProgress({ phase: 'copy', done: n, total: srcStat.files }); } catch (e) {} } });
  copied = srcStat.files;

  /* 对账：复制出来的文件数和字节数要和源一样，否则宁可报错也不改指针（改了指针 = 指向半份数据） */
  const dstStat = treeStat(to);
  if (dstStat.files !== srcStat.files || dstStat.bytes !== srcStat.bytes) {
    throw new Error('复制后的文件对不上（' + dstStat.files + '/' + srcStat.files + ' 个文件，'
      + dstStat.bytes + '/' + srcStat.bytes + ' 字节），已取消。请检查硬盘空间后重试。');
  }
  bytes = srcStat.bytes;
  P.writePointer(to);
  return { ok: true, changed: true, from, to, copied, bytes, message: '已复制 ' + copied + ' 个文件到新位置，并逐个核对过' };
}

module.exports = { defaultDataDir, sameDir, nested, isDataDir, writable, treeStat, copyTree, info, migrate };
