'use strict';
const fs = require('fs');
const { safeStorage } = require('electron');
const P = require('./paths');

const DEFAULTS = {
  llm: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    temperature: 0.3,
    maxTokens: 2000,
    provider: 'OpenAI 兼容接口',
    /* 用户自己加的服务：{ id, name, baseUrl, model }，只存本机 config.json */
    customModels: []
  },
  privacy: {
    sendFullText: false,
    redactNames: false,
    logRequests: false
  },
  /* 界面偏好 */
  ui: {
    launchAnim: true         /* 启动动画：关掉就直接进主界面 */
  },
  /* 同步：书稿放在用户自己的网盘 / 本地同步盘里，卷帙不经过任何服务器 */
  sync: {
    enabled: false,
    kind: 'folder',          /* folder | webdav */
    folder: '',
    url: '',
    user: '',
    encrypt: false,          /* 端到端加密开关 */
    autoMinutes: 0           /* 0 = 只在手动 / 启动时同步 */
  }
};

function deepMerge(a, b) {
  const o = Object.assign({}, a);
  for (const k of Object.keys(b || {})) {
    if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) o[k] = deepMerge(a[k] || {}, b[k]);
    else o[k] = b[k];
  }
  return o;
}

function readConfig() {
  try { return JSON.parse(fs.readFileSync(P.configFile(), 'utf8')); } catch (e) { return {}; }
}

function getConfig() {
  return deepMerge(DEFAULTS, readConfig());
}

function setConfig(patch) {
  const next = deepMerge(getConfig(), patch);
  fs.writeFileSync(P.configFile(), JSON.stringify(next, null, 1), 'utf8');
  return next;
}

/* ---- API Key：只存本机，DPAPI 加密，永不进仓库、永不回传渲染层 ----
 * Electron 45 起 safeStorage 的同步接口已废弃（encryptString / decryptString /
 * isEncryptionAvailable），这里优先用异步接口，旧版本自动退回同步接口。 */
let keyCache = '';

async function encAvailable() {
  try {
    if (typeof safeStorage.isAsyncEncryptionAvailable === 'function') return !!(await safeStorage.isAsyncEncryptionAvailable());
  } catch (e) { /* 落到同步接口 */ }
  try { return !!safeStorage.isEncryptionAvailable(); } catch (e) { return false; }
}

async function encryptText(text) {
  if (typeof safeStorage.encryptStringAsync === 'function') return await safeStorage.encryptStringAsync(text);
  return safeStorage.encryptString(text);
}

async function decryptText(buf) {
  if (typeof safeStorage.decryptStringAsync === 'function') {
    let r = await safeStorage.decryptStringAsync(buf);
    if (r && typeof r === 'object' && 'result' in r) {
      if (r.shouldReEncrypt) {
        try { r = await safeStorage.decryptStringAsync(buf); } catch (e) { /* 用第一次的结果 */ }
      }
      return r.result;
    }
    return String(r);
  }
  return safeStorage.decryptString(buf);
}

async function keyStore() {
  let raw;
  try { raw = fs.readFileSync(P.secretsFile()); } catch (e) { return null; }
  if (!raw || !raw.length) return null;
  try { return JSON.parse(await decryptText(raw)); } catch (e) { return null; }
}

async function setApiKey(key) {
  const obj = (await keyStore()) || {};
  if (!key) delete obj.apiKey;
  else obj.apiKey = key;
  keyCache = obj.apiKey || '';
  const plain = JSON.stringify(obj);
  if (await encAvailable()) fs.writeFileSync(P.secretsFile(), await encryptText(plain));
  else fs.writeFileSync(P.secretsFile(), JSON.stringify({ plain: obj }), 'utf8');
  return true;
}

async function getApiKey() {
  const env = process.env.NF_API_KEY;
  if (env) { keyCache = env; return env; }
  const k = await keyStore();
  keyCache = (k && k.apiKey) || '';
  return keyCache;
}

/* 同步镜像，仅供日志脱敏这类「不能 await」的地方使用 */
function getApiKeySync() { return process.env.NF_API_KEY || keyCache; }

/* ---- 同步凭据：WebDAV 密码与端到端加密口令，和 API Key 同一套加密存储 ----
 * 口令不落明文、不回渲染层；界面只能看到「有没有设过」和口令指纹。 */
async function setSyncCredential(name, value) {
  const obj = (await keyStore()) || {};
  if (!value) delete obj[name];
  else obj[name] = String(value);
  const plain = JSON.stringify(obj);
  if (await encAvailable()) fs.writeFileSync(P.secretsFile(), await encryptText(plain));
  else fs.writeFileSync(P.secretsFile(), JSON.stringify({ plain: obj }), 'utf8');
  return true;
}

async function getSyncCredential(name) {
  const k = await keyStore();
  return (k && k[name]) || '';
}

function maskKey(k) {
  if (!k) return '';
  if (k.length <= 8) return '****';
  return k.slice(0, 4) + '****' + k.slice(-4);
}

/* 给渲染层的安全视图：绝不含明文 key */
async function publicSettings() {
  const cfg = getConfig();
  const key = await getApiKey();
  const enc = await encAvailable();
  /* 同步设置：口令和密码一律不外发，只告诉界面「设没设过」 */
  const sync = cfg.sync || {};
  const syncPass = await getSyncCredential('syncPass');
  const davPass = await getSyncCredential('davPass');
  return {
    llm: cfg.llm,
    privacy: cfg.privacy,
    ui: cfg.ui || { launchAnim: true },
    sync: {
      enabled: !!sync.enabled, kind: sync.kind || 'folder', folder: sync.folder || '',
      url: sync.url || '', user: sync.user || '', encrypt: !!sync.encrypt, autoMinutes: sync.autoMinutes || 0,
      hasDavPass: !!davPass, hasPass: !!syncPass,
      passFingerprint: syncPass ? require('./crypto').fingerprint(syncPass) : ''
    },
    hasApiKey: !!key,
    keyMasked: maskKey(key),
    keyFromEnv: !!process.env.NF_API_KEY,
    keyStorage: enc ? '系统加密（DPAPI）' : '本地明文（系统不支持加密）'
  };
}

module.exports = {
  getConfig, setConfig, publicSettings, getApiKey, getApiKeySync, setApiKey, maskKey, encAvailable,
  setSyncCredential, getSyncCredential
};
