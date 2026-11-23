'use strict';
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

/* ---------------- 数据放在哪 ----------------
 *
 * 默认还是 Electron 的 userData（Windows 上是 %APPDATA%\novelfolio），数据在它下面的 data/。
 * 但作者可以把「数据目录」指到自己挑的地方（设置 → 本地数据 → 存储位置），
 * 比如 D 盘、移动硬盘，或者已经放进 OneDrive 的文件夹 —— 换机器时整块拷走就行。
 *
 * 「搬去哪儿了」这件事本身不能再存在 data/ 里（那正是要搬走的东西），
 * 所以只在**默认位置**留一张极小的指针 config.json：{ dataDir: '<新位置>' }。
 *   默认位置（root）
 *   ├─ config.json      界面的其它设置 + 这张指针（dataDir 有值 = 数据不在默认位置）
 *   ├─ secrets.bin      API Key / 同步口令（跟着应用走，不跟着数据走）
 *   ├─ app.log / sync-state.json / updates/
 *   └─ data/            这里才是书稿：设置成别的目录后，这块原封不动留着当「搬回来的路」
 *
 * openDir() 在启动的最开头（app.whenReady）调一次；之后所有路径都用这里定下的 dataDir()。
 * 换位置用 setDataDir()：主进程里所有路径都是现拼的、没有缓存，所以换完当场就按新位置读写，
 * 不需要重启（重启只是让渲染层也从头读一遍，界面会自己重拉数据）。 */
const CONFIG_NAME = 'config.json';
/* 别把数据往这些地方放：系统关键目录、程序自己的目录（打包后是临时解开的 asar，下次启动就没了） */
const SYS_DENY = (process.env.SystemRoot || process.env.windir || 'C:\\Windows');
let dataOverride = '';

function defaultRoot() { return app.getPath('userData'); }
/* 老代码（以及 secrets.bin / 日志 / 更新缓存）认的「应用目录」：永远是默认位置 */
function root() { return defaultRoot(); }

/* 指针文件：只在默认位置那一份里读，别去自定义目录里找（那样就绕回来了） */
function readPointer() {
  try {
    const o = JSON.parse(fs.readFileSync(path.join(defaultRoot(), CONFIG_NAME), 'utf8'));
    return o && typeof o.dataDir === 'string' ? o.dataDir.trim() : '';
  } catch (e) { return ''; }
}
function writePointer(dir) {
  const f = path.join(defaultRoot(), CONFIG_NAME);
  fs.mkdirSync(defaultRoot(), { recursive: true });
  let o = {};
  try { o = JSON.parse(fs.readFileSync(f, 'utf8')) || {}; } catch (e) { o = {}; }
  if (dir) o.dataDir = dir; else delete o.dataDir;
  if (!o || typeof o !== 'object' || Array.isArray(o)) o = dir ? { dataDir: dir } : {};
  /* 先写临时文件再改名：写到一半断电也不会把整份设置（连同密钥配置）写坏 */
  const tmp = f + '.tmp-' + process.pid;
  fs.writeFileSync(tmp, JSON.stringify(o, null, 1), 'utf8');
  fs.renameSync(tmp, f);
  return o;
}

/* 作者挑的目录能不能当数据目录：盘符 / 共享路径、别是系统目录、别是程序自己所在的目录。
 * 这些检查失败时都是「拒绝并说人话」，不静默回退 —— 否则用户以为换过去了，稿子其实还在老地方。 */
function checkDirs(dir) {
  const raw = String(dir || '').trim();
  if (!raw) throw new Error('目录为空');
  if (!path.isAbsolute(raw)) throw new Error('要填完整路径，例如 D:\\卷帙数据');
  const abs = path.resolve(raw);
  if (fs.existsSync(abs) && !fs.statSync(abs).isDirectory()) throw new Error('这个路径是一个文件，不是文件夹');
  const norm = abs.replace(/[\\/]+$/, '').toLowerCase();
  const low = p => path.resolve(p).replace(/[\\/]+$/, '').toLowerCase();
  /* 软件自己的配置目录（config.json / secrets.bin / 日志）不能直接拿来当数据目录：
   * 书稿会跟这些文件混在一层里，备份 / 迁移都会把它们一起搅进去。默认位置在它下面的 data/。 */
  if (norm === low(defaultRoot())) throw new Error('这是软件自己的配置目录，请在它下面另建一个文件夹（默认位置是 data 子目录）');
  if (norm === low(path.parse(abs).root)) throw new Error('不能直接放在盘符根目录下，请新建一个文件夹');
  if (norm === low(SYS_DENY) || norm.startsWith(low(SYS_DENY) + path.sep)) throw new Error('不能放在系统目录里');
  /* 程序自己所在的目录也不能用：打包后资源在临时解开的 asar 旁边，更新 / 重装会被一起换掉。
   * 开发态 app.getAppPath() 是项目根，按它判会把整块项目目录都禁掉（测试里就踩到了），
   * 所以只在打包后（真正的 exe 目录）才做这条检查。 */
  if (app.isPackaged) {
    const appDir = low(path.dirname(app.getAppPath()));
    if (norm === appDir || norm.startsWith(appDir + path.sep)) {
      throw new Error('不能放在程序自己所在的目录里（更新或重装时会被一起换掉）');
    }
  }
  return { abs };
}

function dataDir() { return dataOverride || path.join(defaultRoot(), 'data'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); return p; }
function dataFile() { ensureDir(dataDir()); return path.join(dataDir(), 'novelfolio.data.json'); }
function backupDir() { return ensureDir(path.join(dataDir(), 'backups')); }
/* 老数据文件（单文件时代）：只读入，用来长出书库里的第一本书 */
function legacyDataFile() { return path.join(dataDir(), 'novelfolio.data.json'); }
/* 图片目录：传了书号就是那本书自己的子目录，不传就是老位置（按书分目录见 bookcase.js） */
function portraitsDir(bookId) { return bookId ? ensureDir(path.join(dataDir(), 'portraits', bookId)) : ensureDir(path.join(dataDir(), 'portraits')); }
function mapsDir(bookId) { return bookId ? ensureDir(path.join(dataDir(), 'maps', bookId)) : ensureDir(path.join(dataDir(), 'maps')); }
function configFile() { ensureDir(root()); return path.join(root(), CONFIG_NAME); }
function secretsFile() { ensureDir(root()); return path.join(root(), 'secrets.bin'); }
function logFile() { ensureDir(root()); return path.join(root(), 'app.log'); }

/* 运行中直接换（设置页「更改存储位置」成功之后调）。
 * 不重启也能立刻按新位置读写：主进程里所有路径都是现拼的，没有缓存。
 * 传空 = 回默认位置。 */
function setDataDir(abs) {
  const want = String(abs || '').trim();
  if (!want) { dataOverride = ''; return ''; }
  const { abs: real } = checkDirs(want);
  ensureDir(real);
  dataOverride = real;
  return real;
}

/* 启动时调一次：读指针，决定这块进程（以及随后要起的 splash / 主窗口渲染层）用哪个数据目录。 */
function openDir() {
  const want = readPointer();
  if (!want) { dataOverride = ''; return ''; }
  try {
    const { abs } = checkDirs(want);
    /* 这里**绝不能**顺手 mkdir：目录不在（移动硬盘没插 / 文件夹被删）时如果给它建一个空的，
     * 软件就会把默认位置里好好的书稿当成没有，转而在一个空目录里新建一本演示书 —— 看上去就是「稿子没了」。
     * 目录不在就退回默认位置并把 missing 报给界面，指针留着，盘一插回来就又能用。 */
    if (!fs.existsSync(abs)) throw new Error('目录不在了：' + abs);
    dataOverride = abs;
  } catch (e) {
    /* 目录已经不在了（移动硬盘没插、文件夹被删）：先按默认位置起，界面会在设置里提示重设，
     * 这时候绝不能悄悄把指针清掉 —— 那块盘一插回来，数据就还在。 */
    console.error('[paths] 自定义数据目录不可用，暂用默认位置：', e && e.message);
    dataOverride = '';
  }
  return dataOverride;
}

module.exports = {
  root, defaultRoot, dataDir, ensureDir, dataFile, legacyDataFile,
  backupDir, portraitsDir, mapsDir, configFile, secretsFile, logFile,
  readPointer, writePointer, checkDirs, openDir, setDataDir,
  isCustom: () => !!dataOverride
};
