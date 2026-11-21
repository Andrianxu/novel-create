'use strict';
const S = require('./settings');

function redact(s) {
  const key = S.getApiKeySync();
  if (key && typeof s === 'string') return s.split(key).join('***');
  return s;
}

function normalizeBase(u) {
  let b = (u || '').trim().replace(/\/+$/, '');
  if (!b) throw new Error('未设置接口地址');
  if (!/^https?:\/\//i.test(b)) b = 'https://' + b;
  if (!/\/v1$|\/v\d+$|\/api\//.test(b)) b += '/v1';
  return b;
}

async function chat(messages, opts) {
  const cfg = S.getConfig().llm;
  const key = await S.getApiKey();
  if (!key) throw new Error('还没有配置 API Key（设置 → 模型接口）');
  const base = normalizeBase(opts && opts.baseUrl ? opts.baseUrl : cfg.baseUrl);
  const body = {
    model: (opts && opts.model) || cfg.model,
    messages,
    temperature: opts && opts.temperature != null ? opts.temperature : cfg.temperature,
    max_tokens: (opts && opts.maxTokens) || cfg.maxTokens,
    stream: false
  };
  if (opts && opts.json) body.response_format = { type: 'json_object' };

  const url = base + '/chat/completions';
  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), (opts && opts.timeout) || 120000);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
        body: JSON.stringify(body),
        signal: ac.signal
      });
      clearTimeout(timer);
      const text = await res.text();
      if (!res.ok) {
        const msg = redact(text).slice(0, 500);
        if (res.status === 429 || res.status >= 500) { lastErr = new Error('HTTP ' + res.status + '：' + msg); await sleep(1200 * (attempt + 1)); continue; }
        throw new Error('HTTP ' + res.status + '：' + msg);
      }
      let j;
      try { j = JSON.parse(text); } catch (e) { throw new Error('接口返回的不是 JSON：' + redact(text).slice(0, 300)); }
      const content = j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content : '';
      return { content: content || '', usage: j.usage || null, model: j.model || body.model };
    } catch (e) {
      lastErr = new Error(redact(e.message || String(e)));
      if (/abort/i.test(String(e))) { lastErr = new Error('请求超时'); }
      if (attempt === 2) break;
      await sleep(800 * (attempt + 1));
    }
  }
  throw lastErr || new Error('请求失败');
}

/* 读接口的模型列表：OpenAI 兼容的 GET /models
 * 返回 { baseUrl, models: ['模型名', ...] }，只用来帮用户填「模型名」，不落盘 */
async function listModels(opts) {
  const cfg = S.getConfig().llm;
  const key = (opts && opts.apiKey) || await S.getApiKey();
  if (!key) throw new Error('还没有配置 API Key（设置 → 模型接口）');
  const base = normalizeBase(opts && opts.baseUrl ? opts.baseUrl : cfg.baseUrl);
  const url = base + '/models';
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), (opts && opts.timeout) || 20000);
  let res, text;
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + key, Accept: 'application/json' },
      signal: ac.signal
    });
    text = await res.text();
  } catch (e) {
    if (/abort/i.test(String(e))) throw new Error('读取模型列表超时（' + url + '）');
    throw new Error('连不上 ' + url + '：' + redact(e.message || String(e)));
  } finally { clearTimeout(timer); }
  if (!res.ok) throw new Error('HTTP ' + res.status + '：' + redact(text).slice(0, 200));
  let j;
  try { j = JSON.parse(text); } catch (e) { throw new Error('接口返回的不是 JSON：' + redact(text).slice(0, 160)); }
  const raw = Array.isArray(j) ? j : (Array.isArray(j.data) ? j.data : (Array.isArray(j.models) ? j.models : []));
  const models = [];
  for (const it of raw) {
    const id = typeof it === 'string' ? it : (it && (it.id || it.model || it.name)) || '';
    const name = String(id || '').trim();
    if (name && models.indexOf(name) < 0) models.push(name);
    if (models.length >= 400) break;
  }
  return { baseUrl: base, models };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* 从模型输出里稳健地取出 JSON */
function extractJson(text) {
  if (!text) throw new Error('模型没有返回内容');
  let t = text.trim();
  t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const i = t.search(/[\[{]/);
  if (i < 0) throw new Error('模型没有返回 JSON');
  const open = t[i];
  const close = open === '[' ? ']' : '}';
  let depth = 0, inStr = false, esc = false;
  for (let k = i; k < t.length; k++) {
    const c = t[k];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return JSON.parse(t.slice(i, k + 1)); }
  }
  throw new Error('JSON 不完整');
}

module.exports = { chat, listModels, extractJson, normalizeBase, redact };
