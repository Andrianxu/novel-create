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
    provider: 'OpenAI 兼容接口'
  },
  privacy: {
    sendFullText: false,
    redactNames: false,
    logRequests: false
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

/* ---- API Key：只存本机，DPAPI 加密，永不进仓库、永不回传渲染层 ---- */
function keyStore() {
  try {
    const raw = fs.readFileSync(P.secretsFile());
    if (!safeStorage.isEncryptionAvailable()) return null;
    return JSON.parse(safeStorage.decryptString(raw));
  } catch (e) { return null; }
}

function setApiKey(key) {
  const obj = keyStore() || {};
  if (!key) delete obj.apiKey;
  else obj.apiKey = key;
  if (safeStorage.isEncryptionAvailable()) {
    fs.writeFileSync(P.secretsFile(), safeStorage.encryptString(JSON.stringify(obj)));
  } else {
    fs.writeFileSync(P.secretsFile(), JSON.stringify({ plain: obj }), 'utf8');
  }
  return true;
}

function getApiKey() {
  const env = process.env.NF_API_KEY;
  if (env) return env;
  const k = keyStore();
  return (k && k.apiKey) || '';
}

function maskKey(k) {
  if (!k) return '';
  if (k.length <= 8) return '****';
  return k.slice(0, 4) + '****' + k.slice(-4);
}

/* 给渲染层的安全视图：绝不含明文 key */
function publicSettings() {
  const cfg = getConfig();
  const key = getApiKey();
  return {
    llm: cfg.llm,
    privacy: cfg.privacy,
    hasApiKey: !!key,
    keyMasked: maskKey(key),
    keyFromEnv: !!process.env.NF_API_KEY,
    keyStorage: safeStorage.isEncryptionAvailable() ? '系统加密（DPAPI）' : '本地明文（系统不支持加密）'
  };
}

module.exports = { getConfig, setConfig, publicSettings, getApiKey, setApiKey, maskKey };
