'use strict';
/* 在线更新：查 GitHub Releases → 下载新版免安装 exe → 校验 → 换掉自己 → 重开
 *
 * 为什么要有这个文件：
 *   便携版是「一个 exe」，用户手里那份从发布那一刻起就不会自己变。
 *   以前仓库里的下载入口写死了文件名（NovelFolio-0.1.0-portable.exe），
 *   新版本一发布，旧链接还指着 0.1.0，下载到的还是老版本。
 *   现在 exe 自己会去 GitHub 查最新版，有新的就下载下来换掉自己。
 *
 * 几条必须守住的规矩：
 *   1. 只在打包后的 exe 里真的去找更新（开发态一律说「开发态，不检查」），
 *      免得 npm start 的时候平白多一次网络请求，也免得把开发机上的东西换掉。
 *   2. 版本号只认 GitHub 上的 tag（v0.2.0 → 0.2.0）；tag 高于当前版本才算「有更新」，
 *      同版本 / 更旧的 tag 一律忽略 —— 不回滚。
 *   3. 下载完先核 SHA256：GitHub 公布的摘要（API 的 digest / 资源摘要页）优先，
 *      发布说明里作者写的「SHA256 xxx」也核。两条都拿不到就只按大小核，并在结果里如实说明。
 *   4. 换 exe 这一步不能在本进程里做：Windows 上程序正开着那个 exe，改不了。
 *      所以起一个脱离本进程的小脚本（用 Electron 自己的 ELECTRON_RUN_AS_NODE 模式跑），
 *      等本进程退出后把新 exe 摆到用户双击的那个位置，再重开它。
 *
 * 隐私：只有用户点「检查更新 / 下载并安装」时才会联网，而且只连 GitHub；不传任何书稿数据。
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { app, net, BrowserWindow } = require('electron');
const P = require('./paths');
const settings = require('./settings');

const REPO = 'Andrianxu/novel-create';
const API = 'https://api.github.com/repos/' + REPO;
const RELEASES_PAGE = 'https://github.com/' + REPO + '/releases/latest';

/* Release 里的资产名。故意不带版本号：下载地址才能写成
 * releases/latest/download/<名字>，永远指向最新那一次发布；
 * 应用里查更新时也不靠文件名拼版本，版本一律认 tag。 */
const ASSET_NAME = 'NovelFolio-portable.exe';
const UA = 'NovelFolio-Updater';
/* ---------------- 版本号 ---------------- */
function parseVer(v) {
  const m = String(v || '').trim().replace(/^v/i, '').match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2] || 0), Number(m[3] || 0)];
}
function compareVer(a, b) {
  const x = parseVer(a), y = parseVer(b);
  if (!x || !y) return 0;
  for (let i = 0; i < 3; i++) { if (x[i] !== y[i]) return x[i] > y[i] ? 1 : -1; }
  return 0;
}

/* ---------------- 落盘位置 ---------------- */
function updateDirPath() { return path.join(P.root(), 'updates'); }
function updateDir() { return P.ensureDir(updateDirPath()); }
/* 正在下 / 下好的新版。固定名字：同一时间只有一份「待安装的新版」 */
/* 注意用 updateDirPath()：existsSync 只查、不建目录 */
function stagedExe() { return path.join(updateDirPath(), 'NovelFolio-new.exe'); }
function stateFile() { return path.join(updateDirPath(), 'update-state.json'); }
function readState() {
  try { return JSON.parse(fs.readFileSync(stateFile(), 'utf8')); } catch (e) { return {}; }
}
function writeState(st) {
  try { fs.writeFileSync(stateFile(), JSON.stringify(st, null, 1), 'utf8'); } catch (e) {}
}

/* ---------------- 当前是什么形态 ---------------- */
function isDevelopment() { return !app.isPackaged; }
/* 便携版运行时会先把 exe 解到临时目录再执行，PORTABLE_EXECUTABLE_FILE 指向用户双击的那个文件；
 * 安装版没有这两个变量，process.execPath 就是真正的程序。 */
function isPortable() {
  return !!(process.env.PORTABLE_EXECUTABLE_FILE || process.env.PORTABLE_EXECUTABLE_DIR);
}
function targetPath() {
  if (process.env.PORTABLE_EXECUTABLE_FILE) return path.resolve(process.env.PORTABLE_EXECUTABLE_FILE);
  return process.execPath;
}
/* 磁盘上那个 exe 的版本（Windows 文件版本号）。读不到就返回空串 */
function fileVersion(exePath) {
  try {
    if (process.platform !== 'win32') return '';
    if (!exePath) return '';
    const cp = require('child_process');
    const out = cp.execFileSync('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-Command',
      '(Get-Item -LiteralPath ' + JSON.stringify(exePath) + ').VersionInfo.ProductVersion'
    ], { windowsHide: true, timeout: 8000, encoding: 'utf8' });
    return String(out || '').trim();
  } catch (e) { return ''; }
}

/* ---------------- 网络：走 Electron 的 net（Chromium 网络栈）
 * 用 net 而不是 node 的 https：系统代理它自己认，公司网络 / 代理后面也能查。
 * 顺便统一加超时和 UA。 */
function timeoutSignal(ms) {
  const AC = typeof AbortController === 'function' ? AbortController : null;
  if (!AC) return { signal: undefined, done() {} };
  const c = new AC();
  const t = setTimeout(() => { try { c.abort(); } catch (e) {} }, ms);
  return { signal: c.signal, done() { clearTimeout(t); } };
}

async function fetchJson(url, ms) {
  const tm = timeoutSignal(ms || 15000);
  try {
    const r = await net.fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'application/vnd.github+json' },
      signal: tm.signal,
      bypassCustomProtocolHandlers: true
    });
    if (!r.ok) {
      const err = new Error(r.status === 404 ? '这个仓库还没有发布过任何版本' : ('GitHub 返回 HTTP ' + r.status));
      err.status = r.status;
      throw err;
    }
    return await r.json();
  } finally { tm.done(); }
}

/* ---------------- 发布信息 ---------------- */
function parseSha256(text) {
  if (!text) return '';
  const m = String(text).match(/(?:SHA-?256|sha-?256)\s*[:：]?\s*([0-9a-f]{64})\b/);
  return m ? m[1].toLowerCase() : '';
}

function digestOf(asset) {
  /* API 有 digest 字段（sha256:xxx）就直接用；没有就留空，下载后再去 Release 资源摘要页拿 */
  const d = asset && (asset.digest || asset.sha256);
  const m = d && String(d).match(/^(?:sha256:)?([0-9a-f]{64})$/i);
  return m ? m[1].toLowerCase() : '';
}

function normalizeRelease(rel) {
  if (!rel || !rel.tag_name) return null;
  const assets = Array.isArray(rel.assets) ? rel.assets : [];
  const asset = assets.find(a => a && a.name === ASSET_NAME) ||
    assets.find(a => a && /-portable\.exe$/i.test(a.name)) ||
    assets.find(a => a && /\.exe$/i.test(a.name) && !/setup/i.test(a.name)) || null;
  return {
    tag: String(rel.tag_name),
    version: String(rel.tag_name).replace(/^v/i, ''),
    name: rel.name || rel.tag_name,
    notes: String(rel.body || '').trim(),
    publishedAt: rel.published_at || '',
    pageUrl: rel.html_url || RELEASES_PAGE,
    prerelease: !!rel.prerelease,
    /* 下载一定走 latest/download/<资产名>：GitHub 的「最新版」入口，不靠 tag 拼 */
    /* 两条下载路，按顺序试：
     *   apiUrl —— api.github.com/repos/.../releases/assets/<id>（带 Accept: octet-stream），
     *             GitHub 会 302 到 release-assets.githubusercontent.com；这条在 api.github.com
     *             能连、github.com 连不上的网络里也能下载。
     *   url    —— 网页那条（releases/latest/download/<资产名>），作为回退。 */
    apiUrl: asset && asset.id ? (API + '/releases/assets/' + asset.id) : '',
    url: asset ? ('https://github.com/' + REPO + '/releases/latest/download/' + encodeURIComponent(asset.name)) : '',
    assetId: asset && asset.id ? asset.id : 0,
    assetName: asset ? asset.name : '',
    size: asset ? Number(asset.size || 0) : 0,
    sha256: asset ? digestOf(asset) : '',
    notesSha256: parseSha256(rel.body)
  };
}

/* 哪个版本算「最新」：
 *   稳定通道 = 所有非预发布里 tag 最高的那个。GitHub 的 releases 列表按发布时间倒序、不按版本号，
 *   所以不能直接取第一个 —— 补发的 0.1.1 发布时间可能比 0.2.0 还晚，取第一个就会「降级」。
 *   一次正常发布都没有时，退回 /releases/latest。 */
async function latestRelease() {
  let list = null;
  try { list = await fetchJson(API + '/releases?per_page=30', 15000); } catch (e) {
    if (e.status && e.status !== 403) throw e;   /* 403 = 限流 / 私有仓库，交给下面回退 */
  }
  if (Array.isArray(list)) {
    const stable = list.filter(r => r && !r.prerelease && r.tag_name && parseVer(r.tag_name));
    if (stable.length) {
      stable.sort((a, b) => compareVer(b.tag_name, a.tag_name));
      return normalizeRelease(stable[0]);
    }
  }
  const rel = await fetchJson(API + '/releases/latest', 15000);
  return normalizeRelease(rel);
}
/* ---------------- 检查更新 ---------------- */
let lastCheck = null;

async function checkForUpdate(opts) {
  const cur = app.getVersion();
  const skipVer = (opts && opts.skipVersion) || settings.skipVersion();
  const out = {
    ok: false, dev: isDevelopment(), portable: isPortable(),
    current: cur, latest: '', hasUpdate: false, silent: !!(opts && opts.silent),
    message: '', release: null, at: new Date().toISOString()
  };
  if (out.dev) {
    out.message = '开发态（没打包），不检查更新';
    lastCheck = out;
    return out;
  }
  try {
    const rel = await latestRelease();
    out.ok = true;
    if (!rel) { out.message = '这个仓库还没有发布过任何版本'; lastCheck = out; return out; }
    out.latest = rel.version;
    out.release = rel;
    out.hasUpdate = compareVer(rel.version, cur) > 0;
    /* 待安装的新版还在（上次下好了没装），直接告诉界面「可以装」。
     * 注意这里必须用【刚下载的版本】判定，不能用磁盘上那个 exe 的版本（便携版尤其不能）：
     * 用户正跑着 0.1.0、刚下好 0.2.0，旧 exe 的版本号当然还是 0.1.0。
     * 用 cleanupApplied() 而不是 readState()：换装成功以后（暂存文件已删 / 磁盘版本已到位）
     * 那一轮就该判为结束，否则「检查更新」会一直说「新版本已经下载好」。 */
    const st = cleanupApplied();
    const staged = !!(st.targetVersion && compareVer(st.targetVersion, cur) > 0 && fs.existsSync(stagedExe()));
    out.staged = staged ? { version: st.targetVersion, size: st.size || 0, verified: st.verified || '', at: st.at || '' } : null;
    if (staged) out.hasUpdate = true;
    /* 用户点过「这个版本先不更新」：启动时静默检查不再弹提示（手动检查照样如实报告） */
    out.skipped = !!(rel.version && skipVer && compareVer(rel.version, skipVer) <= 0 && !staged);
    if (out.skipped && out.silent) out.hasUpdate = false;
    out.message = out.hasUpdate
      ? (staged ? ('新版本 v' + st.targetVersion + ' 已经下载好，可以直接安装') : ('发现新版本 v' + rel.version))
      : (out.skipped ? ('v' + rel.version + ' 已按你的选择暂时忽略') : '已经是最新版本');
  } catch (e) {
    out.message = '检查失败：' + shortErr(e);
  }
  lastCheck = out;
  return out;
}

function shortErr(e) {
  const msg = String((e && e.message) || e);
  if (/ENOTFOUND|EAI_AGAIN|ERR_NAME_NOT_RESOLVED/i.test(msg)) return '连不上 GitHub（检查网络或代理）';
  if (/ERR_INTERNET_DISCONNECTED|ENETUNREACH/i.test(msg)) return '网络没有连接';
  if (/aborted|timeout|ETIMEDOUT/i.test(msg)) return '连 GitHub 超时';
  if (/HTTP 403/.test(msg)) return 'GitHub 限流了，过一会儿再试';
  return msg.slice(0, 200);
}

/* ---------------- 下载 ---------------- */
let downloading = null;

function sendProgress(data) {
  try {
    for (const w of BrowserWindow.getAllWindows()) { if (!w.isDestroyed()) w.webContents.send('update:progress', data); }
  } catch (e) {}
}

/* 流式算 SHA256：100MB 的 exe 不能整个读进内存 */
function sha256File(file) {
  return new Promise((resolve, reject) => {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    const s = fs.createReadStream(file);
    s.on('data', c => hash.update(c));
    s.on('error', reject);
    s.on('end', () => resolve(hash.digest('hex')));
  });
}

/* 下载资产的响应头：按 apiUrl → url 的顺序试。
 *   网络里 github.com:443 经常连不上（国内尤其），但 api.github.com 能连 ——
 *   API 那条 302 到 release-assets.githubusercontent.com，正好绕开 github.com。
 *   两条都失败时，把「具体哪条失败、为什么」拼进错误里，界面上能看出是哪一环卡住。 */
async function fetchAsset(rel, signal) {
  const tries = [];
  if (rel.apiUrl) tries.push({ url: rel.apiUrl, accept: 'application/octet-stream', tag: 'API' });
  if (rel.url) tries.push({ url: rel.url, accept: 'application/octet-stream', tag: '网页' });
  const fails = [];
  for (const t of tries) {
    try {
      const r = await net.fetch(t.url, {
        headers: { 'User-Agent': UA, 'Accept': t.accept },
        signal,
        redirect: 'follow',
        bypassCustomProtocolHandlers: true
      });
      if (r.ok) return r;
      fails.push(t.tag + ' HTTP ' + r.status);
      /* 401 / 403 / 404 这条没戏就试下一条；其它状态码也试，反正最后还是要把两个原因都说出来 */
    } catch (e) {
      const c = e && e.cause && (e.cause.code || e.cause.message);
      fails.push(t.tag + ' ' + (c || (e && e.message) || e));
    }
    if (signal && signal.aborted) break;
  }
  const err = new Error('下载失败：' + (fails.join('；') || '没有可用的下载地址'));
  err.fails = fails;
  throw err;
}
/* 拿不到 API 摘要时，去「Release 资源摘要页」读（和 GitHub 网页上点资产旁的小图标是同一页） */
async function releaseDigest(rel) {
  const url = rel.assetId ? (API + '/releases/assets/' + rel.assetId) : rel.url.replace('/latest/download/', '/downloads/');
  const tm = timeoutSignal(12000);
  try {
    const r = await net.fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' }, signal: tm.signal, bypassCustomProtocolHandlers: true });
    if (!r.ok) return '';
    const list = await r.json();
    const first = Array.isArray(list) && list[0];
    const s = first && String(first.digest || first.sha256 || '').match(/^(?:sha256:)?([0-9a-f]{64})$/i);
    return s ? s[1].toLowerCase() : '';
  } catch (e) { return ''; } finally { tm.done(); }
}

async function downloadUpdate(rel) {
  if (downloading) return downloading;
  downloading = doDownload(rel).finally(() => { downloading = null; });
  return downloading;
}

async function doDownload(rel) {
  const cur = app.getVersion();
  if (!rel || !(rel.url || rel.apiUrl)) throw new Error('这个版本没有可下载的 exe');
  if (compareVer(rel.version, cur) <= 0) throw new Error('这个版本不比现在的新');
  const dest = stagedExe();
  updateDir();     /* 先建目录：stagedExe() 只拼路径不建目录 */
  const part = dest + '.part';
  sendProgress({ phase: 'connect', version: rel.version, received: 0, total: rel.size || 0, pct: 0 });

  /* 等响应头单独给 60 秒超时；真的开始流式下载以后不再掐总时长（大文件慢一点是正常的） */
  const tm = timeoutSignal(60000);
  let resp;
  try {
    resp = await fetchAsset(rel, tm.signal);
  } finally { tm.done(); }
  if (!resp.ok) throw new Error('下载失败：GitHub 返回 HTTP ' + resp.status + (resp.status === 404 ? '（发布里的资产名可能变了）' : ''));

  const total = Number(resp.headers.get('content-length') || rel.size || 0);
  let received = 0;
  let lastTick = 0;
  const fh = await fs.promises.open(part, 'w');
  try {
    const reader = resp.body && resp.body.getReader ? resp.body.getReader() : null;
    if (reader) {
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        await fh.write(Buffer.from(chunk.value));
        received += chunk.value.length;
        const now = Date.now();
        if (now - lastTick > 120) {
          lastTick = now;
          sendProgress({ phase: 'download', version: rel.version, received, total, pct: total ? received / total : 0 });
        }
      }
    } else {
      const buf = Buffer.from(await resp.arrayBuffer());
      await fh.write(buf);
      received = buf.length;
    }
  } finally {
    try { await fh.close(); } catch (e) {}
  }
  if (total && received !== total) {
    try { fs.rmSync(part, { force: true }); } catch (e) {}
    throw new Error('下载不完整（' + received + ' / ' + total + ' 字节），已丢弃');
  }

  sendProgress({ phase: 'verify', version: rel.version, received, total, pct: 1 });
  const actual = await sha256File(part);
  /* 优先：GitHub 自己的摘要（API digest / 资源摘要页）—— 来自 GitHub，不来自作者；
   * 其次：发布说明里作者写的 SHA256。两者都有就都要过。 */
  const ghSha = rel.sha256 || await releaseDigest(rel);
  let verified = '';
  if (ghSha && actual !== ghSha) {
    try { fs.rmSync(part, { force: true }); } catch (e) {}
    throw new Error('文件内容和 GitHub 公布的 SHA256 对不上，已丢弃（请重试一次）');
  }
  if (ghSha) verified = 'github';
  if (rel.notesSha256 && actual !== rel.notesSha256) {
    try { fs.rmSync(part, { force: true }); } catch (e) {}
    throw new Error('文件内容和发布说明里的 SHA256 对不上，已丢弃（请重试一次）');
  }
  if (rel.notesSha256) verified = verified ? 'github+notes' : 'notes';

  /* 原子落位：先写 .part 再改名，中途断网也不会留下半个 exe 冒充新版 */
  try { fs.rmSync(dest, { force: true }); } catch (e) {}
  await fs.promises.rename(part, dest);
  writeState({
    targetVersion: rel.version, tag: rel.tag, at: new Date().toISOString(),
    file: dest, size: received, sha256: actual, verified: verified || 'size-only'
  });
  sendProgress({ phase: 'done', version: rel.version, received, total, pct: 1 });
  return { ok: true, version: rel.version, file: dest, size: received, sha256: actual, verified: verified || 'size-only' };
}
/* ---------------- 换掉自己（安装器） ---------------- */
/* 安装器不是本进程里的一段代码，而是一个独立 .js：本进程 spawn 它，把「老进程 pid」和配置交给它。
 * 用独立文件而不是 spawn -e '<一大段代码>'：后者在 Windows 上引号转义很容易翻车。 */
const SWAP_SCRIPT = [
  "'use strict';",
  '/* 由 updater.js 写出来并启动：第一个参数是「老进程的 pid」，之后是 JSON 配置。',
  ' * 老进程退出以后，把新版的 exe 摆到用户双击的那个位置，再重开它。 */',
  "const fs = require('fs');",
  "const path = require('path');",
  "const { spawn } = require('child_process');",
  '',
  'const pid = Number(process.argv[2]);',
  "const cfg = JSON.parse(process.argv[3] || '{}');",
  'const sleep = ms => new Promise(r => setTimeout(r, ms));',
  '',
  'function say(msg) {',
  "  try { fs.appendFileSync(cfg.log, '[' + new Date().toISOString() + '] ' + msg + String.fromCharCode(10)); } catch (e) {}",
  '}',
  'function isAlive(p) {',
  "  try { process.kill(p, 0); return true; } catch (e) { return e.code === 'EPERM'; }",
  '}',
  'function rm(p) { try { fs.rmSync(p, { force: true }); } catch (e) {} }',
  '',
  '(async () => {',
  "  say('换装开始 pid=' + pid + ' target=' + cfg.target + ' new=' + cfg.newExe);",
  '  /* 1. 等老进程真的退出（最多 60 秒） */',
  '  for (let i = 0; i < 120 && isAlive(pid); i++) await sleep(500);',
  "  say('老进程已退出（或超时）');",
  "  if (!fs.existsSync(cfg.newExe)) { say('新 exe 不见了，放弃'); process.exit(1); }",
  '',
  '  /* 2. 拿新 exe 覆盖 target。',
  '   *    「正在运行的那个文件」有时就是 target，有时是别的路径（刚换完、还开着旧副本）。',
  '   *    所以先把新 exe 复制到 target 旁边（文件名带时间戳，绝不碰正在用的任何文件），',
  '   *    再把「正在运行的那个文件」改名挪开（路径不同才做），最后复制到 target；',
  '   *    被占用就重试，最多 40 次 x 750ms = 30 秒。 */',
  '  const exeDir = path.dirname(cfg.target);',
  "  const stagedName = path.join(exeDir, '.novelfolio-new-' + Date.now() + '.exe');",
  '  try { fs.copyFileSync(cfg.newExe, stagedName); } catch (e) {',
  "    say('复制新 exe 到目标目录失败：' + e.message);",
  '    process.exit(1);',
  '  }',
  '  let ok = false;',
  "  let moved = '';",
  '  for (let attempt = 0; attempt < 40; attempt++) {',
  '    try {',
  '      if (!moved && cfg.execPath && path.resolve(cfg.execPath).toLowerCase() !== path.resolve(cfg.target).toLowerCase()) {',
  "        try { fs.renameSync(cfg.execPath, cfg.execPath + '.novelfolio-stale'); moved = cfg.execPath + '.novelfolio-stale'; say('已挪开正在运行的旧文件'); } catch (e) { say('挪开旧文件失败（不影响覆盖）：' + e.message); }",
  '      }',
  '      rm(cfg.target);',
  '      fs.copyFileSync(stagedName, cfg.target);',
  '      ok = true;',
  '      break;',
  '    } catch (e) {',
  '      /* EBUSY / EPERM / EACCES：老进程的句柄还没释放干净，等一会儿再来 */',
  "      if (attempt === 0) say('覆盖被挡（多半是被占用），开始重试：' + e.message);",
  '      await sleep(750);',
  '    }',
  '  }',
  '  rm(stagedName);',
  '  if (!ok) {',
  "    say('替换失败（被占用 30 秒），新版留在：' + cfg.newExe);",
  '    process.exit(2);',
  '  }',
  "  say('替换完成');",
  '  rm(cfg.newExe);',
  '',
  '  /* 3. 重开：先试 target（真正的新版）；万一它起不来（例如被安全软件拦了），',
  '   *    再用那份「挪开的旧文件」兜底，至少让用户能继续干活。 */',
  '  let fallback = moved;',
  '  if (!fallback) {',
  "    fallback = path.join(exeDir, '.novelfolio-old-' + Date.now() + '.exe');",
  '    try { fs.copyFileSync(cfg.execPath, fallback); } catch (e) { fallback = \'\'; }',
  '  }',
  '  let launched = false;',
  '  for (const p of [cfg.target, fallback]) {',
  '    if (launched || !p) continue;',
  '    try {',
  '      if (!fs.existsSync(p)) continue;',
  '      const c = spawn(p, [], { detached: true, stdio: \'ignore\', cwd: path.dirname(p) });',
  '      c.unref();',
  '      launched = true;',
  "      say('已重开：' + p);",
  "    } catch (e) { say('重开失败 ' + p + '：' + e.message); }",
  '  }',
  "  if (!launched) say('没能自动重开，请手动双击 ' + cfg.target);",
  '  await sleep(5000);',
  '  /* 新实例起来以后，那份挪开的旧文件就可以清了（还被占用就留给下次） */',
  '  if (fallback) rm(fallback);',
  '  process.exit(0);',
  "})().catch(e => { say('异常：' + (e && e.stack || e)); process.exit(3); });",
  ''
].join(String.fromCharCode(10));

function swapScriptFile() {
  const f = path.join(updateDir(), 'apply-update.js');
  fs.writeFileSync(f, SWAP_SCRIPT, 'utf8');
  return f;
}

/* 打包后的 Electron 里没有 Node 可执行文件，但 Electron 自己可以当 Node 用：
 * 加环境变量 ELECTRON_RUN_AS_NODE=1，process.execPath（那个 exe）就只跑脚本、不起窗口。 */
function spawnInfo() {
  const env = Object.assign({}, process.env, { ELECTRON_RUN_AS_NODE: '1' });
  return { exe: process.execPath, env };
}

let applying = false;
async function applyUpdate() {
  if (applying) return { ok: false, busy: true, message: '正在安装' };
  applying = true;
  try {
    const st = readState();
    const cur = app.getVersion();
    if (!st.targetVersion || compareVer(st.targetVersion, cur) <= 0) throw new Error('没有下载好的新版');
    if (!fs.existsSync(stagedExe())) throw new Error('下载好的新版不见了（可能被清理过），请重新检查更新');
    if (!isPortable()) throw new Error('当前是安装版；自动替换只对免安装 exe 生效，请到发布页下载新版安装包');
    const target = targetPath();
    if (!target || !fs.existsSync(target)) throw new Error('找不到当前正在运行的 exe 文件');

    /* 先确认当前 exe 真的可写：没有权限就现在告诉用户，
     * 别等到重启以后才发现没换成 */
    try { fs.accessSync(target, fs.constants.W_OK); } catch (e) {
      throw new Error('这个 exe 没有写权限（' + path.dirname(target) + ' 可能是只读目录），请先把它挪到自己的文件夹');
    }

    const script = swapScriptFile();
    const cfg = {
      target,
      execPath: process.execPath,
      newExe: stagedExe(),
      log: path.join(updateDir(), 'update.log')
    };
    const sp = spawnInfo();
    const child = spawn(sp.exe, [script, String(process.pid), JSON.stringify(cfg)], {
      detached: true, stdio: 'ignore', windowsHide: true, cwd: os.tmpdir(), env: sp.env
    });
    child.unref();
    writeState(Object.assign({}, st, { applyStartedAt: new Date().toISOString(), pid: process.pid }));
    /* 给 spawn 一点时间确认它没当场挂掉 */
    await new Promise(r => setTimeout(r, 600));
    if (child.exitCode !== null && child.exitCode !== 0) {
      throw new Error('安装程序没能启动（代码 ' + child.exitCode + '），请到发布页手动下载');
    }
    return { ok: true, version: st.targetVersion, willQuit: true };
  } finally { applying = false; }
}

/* 退出前调用：老进程一走，安装程序接着干 */
function quitForUpdate() {
  try { app.removeAllListeners('window-all-closed'); } catch (e) {}
  for (const x of BrowserWindow.getAllWindows()) { try { x.destroy(); } catch (e) {} }
  setTimeout(() => { try { app.exit(0); } catch (e) {} }, 150);
  setTimeout(() => { try { process.exit(0); } catch (e) {} }, 3000);
}

/* ---------------- 给界面用的一览 ---------------- */
function safeTarget() { try { return targetPath() || ''; } catch (e) { return ''; } }

/* 换装完以后把「待安装」的状态清掉，别让它下次检查又报「已经下载好」。
 *
 * 三种「这一轮已经结束了」的情况：
 *   1. 暂存的 exe 已经不在（apply-update.js 换装成功后会 rm 掉它）—— 直接清。这是最可靠的判据，
 *      便携版 / 安装版都适用：换装脚本跑完第一件事就是把 NovelFolio-new.exe 删掉。
 *   2. 磁盘上那个 exe 的版本已经 ≥ 目标版本 —— 装上了。
 *   3. applyStartedAt 过去很久、暂存文件也没了 —— 上次换装半路失败，别再拿这个状态卡住用户。
 *
 * 以前这里只在「非便携版」判断，便携版永远跳过：author 的便携版换装成功、
 * NovelFolio-new.exe 都被删了，update-state.json 里的 targetVersion 却一直留着，
 * 于是每次「检查更新」都说「新版本已经下载好，可以直接安装」—— 正是用户遇到的现象。
 * 读文件版本要起一个 PowerShell（约 1 秒），所以放在 update:state 里做，不进「检查更新」的快路径。 */
function cleanupApplied() {
  const st = readState();
  if (!st || !st.targetVersion) return st || {};
  const cur = app.getVersion();
  const hasStaged = fs.existsSync(stagedExe());

  /* 1. 暂存文件已经没了：这一轮一定结束了（换装成功，或者被清理掉了） */
  if (!hasStaged) {
    const next = Object.assign({}, st, {
      applied: true, appliedAt: st.appliedAt || new Date().toISOString(), targetVersion: '', file: ''
    });
    writeState(next);
    return next;
  }

  /* 2. 还留着暂存文件时看磁盘上的 exe：版本已经到位就算装上了。
   *    便携版不能拿 process.execPath 判（那是临时解包目录里的中间层），
   *    但 targetPath() 对便携版返回的就是用户双击的那个 exe，读它的版本是对的。 */
  if (compareVer(st.targetVersion, cur) > 0) {
    const onDisk = fileVersion(targetPath());
    if (onDisk && compareVer(onDisk, st.targetVersion) >= 0) {
      try { fs.rmSync(stagedExe(), { force: true }); } catch (e) {}
      const next = Object.assign({}, st, { applied: true, appliedAt: new Date().toISOString(), targetVersion: '', file: '' });
      writeState(next);
      return next;
    }
  }
  return st;
}

function state() {
  const st = cleanupApplied();
  const cur = app.getVersion();
  const staged = !!(st.targetVersion && compareVer(st.targetVersion, cur) > 0 && fs.existsSync(stagedExe()));
  return {
    current: cur,
    dev: isDevelopment(),
    portable: isPortable(),
    runningFrom: process.execPath,
    target: safeTarget(),
    repo: REPO,
    releasesUrl: RELEASES_PAGE,
    lastCheck,
    staged: staged ? { version: st.targetVersion, size: st.size || 0, verified: st.verified || '', at: st.at || '' } : null,
    appliedAt: st.applied ? st.at : ''
  };
}

module.exports = {
  REPO, ASSET_NAME, API, RELEASES_PAGE,
  compareVer, parseVer,
  checkForUpdate, downloadUpdate, applyUpdate, quitForUpdate, state,
  onProgress: sendProgress,
  _paths: { stagedExe, stateFile, updateDir }
};