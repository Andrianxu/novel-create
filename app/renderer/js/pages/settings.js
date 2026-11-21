import { h, clear, toast, modal, injectStyle, fmtDate, ago } from '../util.js';

injectStyle('settings', `
.set-wrap{flex:1;min-width:0;display:flex;padding:14px 20px 28px;gap:16px;align-items:flex-start;overflow:auto;justify-content:center}
.set-col{flex:1.55;min-width:0;display:flex;flex-direction:column;gap:12px;max-width:760px}
.set-col.side{flex:1;max-width:460px}
.set-h{display:flex;align-items:center;gap:9px;padding:11px 14px;border-bottom:1px solid #EAE1CF}
.set-h h3{margin:0;font-size:13px;font-family:var(--kai);letter-spacing:.06em}
.set-h .pill{margin-left:auto}
.set-b{padding:13px 14px;display:flex;flex-direction:column;gap:11px}
.set-note{font-size:11.5px;line-height:1.75;color:#5B5348;background:#FBF3E6;border:1px dashed #E0C79B;border-radius:9px;padding:9px 11px}
.set-note b{color:#8A6421}
.set-note.safe{background:#EEF5F2;border-color:#BFDACF}
.set-note.safe b{color:#23604F}
.krow{display:flex;gap:8px;align-items:flex-end}
.krow>.field{flex:1}
.presets{display:flex;gap:5px;flex-wrap:wrap}
.presets span{font-size:11px;padding:4px 9px;border-radius:999px;border:1px solid #DFD4BF;background:#FFFCF5;color:#5B5348;cursor:pointer}
.presets span.on{background:#201C18;color:#F6F1E6;border-color:#201C18}
.presets span.add{border-style:dashed;background:#FBF3E6;color:#8A6421}
.presets span.add:hover{border-color:#C2A97D;background:#F7EBD3}
.presets span.xdel{border:0;background:transparent;padding:0 0 0 5px;font-size:10px;line-height:1;color:#A8322A;opacity:.6}
.presets span.xdel:hover{opacity:1}
.presets span.on .xdel{color:#F6F1E6;opacity:.7}
.field-h{display:flex;align-items:center;gap:8px}
.field-h>label{flex:1;font-size:10px;letter-spacing:.08em;color:var(--muted)}
.kbadge{display:inline-flex;align-items:center;gap:6px;font-size:11px}
.dot{width:7px;height:7px;border-radius:50%;display:inline-block}
.set-row{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px dashed #EAE1CF;font-size:12px}
.set-row:last-child{border-bottom:none}
.set-row .lab{width:88px;flex:none;color:#8C8272;font-size:11px}
.set-row .val{flex:1;min-width:0;word-break:break-all;font-size:11.5px;color:#332C25}
.bkrow{display:flex;align-items:center;gap:8px;font-size:11.5px;padding:5px 0;border-bottom:1px dashed #EAE1CF}
.bkrow:last-child{border-bottom:none}
.bkrow .grow{min-width:0}
`);

const PRESETS = [
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { id: 'qwen', name: '通义千问', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  { id: 'glm', name: '智谱 GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash' },
  { id: 'moonshot', name: 'Kimi', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' }
];

/* IPC 报错会带一串「Error invoking remote method 'xxx': Error:」前缀，界面上只留人话部分 */
const ipcErr = e => String((e && e.message) || e || '').replace(/^Error invoking remote method '[^']*':\s*(?:Error:\s*)?/, '');

export default {
  id: 'settings', label: '设置',
  statusText() { return '接口、密钥与本地数据'; },
  unmount() {},
  mount(root, ctx) {
    const { NF } = ctx;
    const S = NF.settings || {};
    const doc = NF.doc;
    const wrap = h('div', { class: 'set-wrap' });
    const left = h('div', { class: 'set-col' });
    const right = h('div', { class: 'set-col side' });
    left.dataset.probe = 'set-left';
    right.dataset.probe = 'set-right';
    wrap.dataset.probe = 'set-wrap';
    wrap.appendChild(left); wrap.appendChild(right); root.appendChild(wrap);

    /* ---------- 模型接口 ---------- */
    const llm = S.llm || {};
    const cfg = {
      baseUrl: llm.baseUrl || '', model: llm.model || '',
      temperature: llm.temperature != null ? llm.temperature : 0.3,
      maxTokens: llm.maxTokens || 2000
    };
    /* 自定义模型：存在本机 config.json 的 llm.customModels 里，和内置预设一样显示成胶囊 */
    let customs = Array.isArray(llm.customModels) ? llm.customModels
      .filter(m => m && m.baseUrl && m.model)
      .map(m => ({
        id: m.id || 'cm' + Math.random().toString(36).slice(2, 8),
        name: m.name || m.model, baseUrl: m.baseUrl, model: m.model
      })) : [];

    const presetRow = h('div', { class: 'presets' });
    const baseIn = h('input', { class: 'input', value: cfg.baseUrl, placeholder: 'https://api.deepseek.com/v1' });
    const modelList = h('datalist', { id: 'nfModelList' });
    const modelIn = h('input', { class: 'input', value: cfg.model, placeholder: 'deepseek-chat', list: 'nfModelList' });
    const tempIn = h('input', { class: 'input', type: 'number', step: '0.1', min: '0', max: '1.5', value: String(cfg.temperature) });
    const tokenIn = h('input', { class: 'input', type: 'number', step: '100', min: '200', max: '8000', value: String(cfg.maxTokens) });
    const MODEL_HINT = '可以手填任意模型名；点「读取模型列表」会向接口要一份可用模型（OpenAI 兼容的 /models）。';
    const modelHint = h('div', { class: 'tiny muted' }, MODEL_HINT);

    function sameUrl(a, b) {
      const n = u => String(u || '').trim().replace(/\/+$/, '').toLowerCase();
      return n(a) === n(b);
    }
    function allEntries() {
      return PRESETS.concat(customs.map(c => ({ custom: true, id: c.id, name: c.name, baseUrl: c.baseUrl, model: c.model })));
    }
    function matchedEntry() {
      const url = baseIn.value, model = modelIn.value.trim();
      return allEntries().find(e => sameUrl(e.baseUrl, url) && e.model === model) || null;
    }
    function applyEntry(p) {
      baseIn.value = p.baseUrl || '';
      modelIn.value = p.model || '';
      renderChips();
      modelHint.textContent = p.custom
        ? '正在使用自定义模型「' + p.name + '」· 改完记得点「保存设置」'
        : MODEL_HINT;
    }
    function renderChips() {
      clear(presetRow);
      const hit = matchedEntry();
      const hitKey = hit ? (hit.baseUrl + '|' + hit.model + '|' + hit.name) : '';
      allEntries().forEach(p => {
        const sp = h('span', { class: (hitKey === p.baseUrl + '|' + p.model + '|' + p.name) ? 'on' : '', title: p.name + ' · ' + p.baseUrl + ' · ' + p.model }, p.name);
        sp.onclick = () => applyEntry(p);
        if (p.custom) {
          sp.dataset.custom = p.id;
          const del = h('span', { class: 'xdel', title: '删除这条自定义模型' }, '✕');
          del.onclick = ev => { ev.stopPropagation(); askRemove(p); };
          sp.appendChild(del);
        }
        presetRow.appendChild(sp);
      });
      const add = h('span', { class: 'add', title: '添加自定义模型：任意 OpenAI 兼容接口都行' }, '＋ 自定义模型');
      add.onclick = () => openCustomDialog();
      presetRow.appendChild(add);
    }

    function askRemove(p) {
      modal({
        title: '删除自定义模型',
        body: h('div', {},
          h('p', { class: 'small' }, '不再保留「' + p.name + '」这个常用项？'),
          h('p', { class: 'tiny muted' }, '只删掉这一条；已经填好的接口地址、模型名和 API Key 都不会动。')),
        okText: '删除',
        onOk: async () => {
          const next = customs.filter(c => c.id !== p.id);
          try {
            NF.settings = await window.nf.settings.set({ llm: { customModels: next } });
            customs = next;
            renderChips();
            toast('已删除「' + p.name + '」', 'ok');
          } catch (e) { toast(e.message, 'err'); return false; }
        }
      });
    }

    function openCustomDialog() {
      const cur = matchedEntry();
      const curCustom = cur && cur.custom ? customs.find(c => c.id === cur.id) : null;
      const nameIn = h('input', { class: 'input', value: curCustom ? curCustom.name : '', placeholder: '给它起个名字，例如 本地 Ollama' });
      const urlIn = h('input', { class: 'input', value: baseIn.value.trim(), placeholder: 'http://127.0.0.1:11434/v1' });
      const idIn = h('input', { class: 'input', value: modelIn.value.trim(), placeholder: 'qwen2.5:7b' });
      const err = h('div', { class: 'tiny', style: { color: '#A8322A', minHeight: '15px' } }, '');
      const body = h('div', { class: 'col', style: { gap: '10px' } },
        h('div', { class: 'set-note' },
          h('b', {}, '自定义模型：'),
          '任何 OpenAI 兼容接口都能接——本地 Ollama（',
          h('code', { class: 'mono tiny' }, 'http://127.0.0.1:11434/v1'),
          '）、LM Studio、vLLM，或者 one-api / new-api 这类中转站。填好后它会出现在上面的常用服务里，点一下就切过去；这条记录只存本机。'),
        h('div', { class: 'field' }, h('label', {}, '名称（显示在常用服务里）'), nameIn),
        h('div', { class: 'field' }, h('label', {}, '接口地址 Base URL'), urlIn),
        h('div', { class: 'field' }, h('label', {}, '模型名（接口的 model 字段）'), idIn),
        err);
      modal({ title: '添加自定义模型', body, okText: '保存并选用', width: '620px', onOk: async () => {
        const baseUrl = urlIn.value.trim();
        const model = idIn.value.trim();
        const name = nameIn.value.trim() || model;
        if (!baseUrl) { err.textContent = '请填接口地址'; return false; }
        if (/\s/.test(baseUrl)) { err.textContent = '接口地址里不能有空格'; return false; }
        if (!model) { err.textContent = '请填模型名；不知道名字就先点「读取模型列表」'; return false; }
        const idx = customs.findIndex(c => c.name === name || (sameUrl(c.baseUrl, baseUrl) && c.model === model));
        const entry = {
          id: idx >= 0 ? customs[idx].id : 'cm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
          name, baseUrl, model
        };
        const next = customs.slice();
        if (idx >= 0) next[idx] = entry; else next.push(entry);
        try {
          /* 存成常用项的同时，把当前选择也切过去：按钮上写的是「保存并选用」 */
          NF.settings = await window.nf.settings.set({
            llm: { customModels: next, baseUrl, model, provider: name }
          });
          customs = next;
          applyEntry(entry);
          toast('已保存并选用「' + name + '」', 'ok');
        } catch (e) { err.textContent = e.message; return false; }
      } });
      setTimeout(() => (nameIn.value ? idIn : nameIn).focus(), 40);
    }

    const fetchBtn = h('button', { class: 'btn xs', onclick: async () => {
      if (fetchBtn.disabled) return;
      const typedKey = keyIn.value.trim();
      fetchBtn.disabled = true;
      const label = fetchBtn.textContent;
      fetchBtn.textContent = '读取中…';
      try {
        const r = await window.nf.llm.models({ baseUrl: baseIn.value.trim(), apiKey: typedKey });
        clear(modelList);
        (r.models || []).forEach(mid => modelList.appendChild(h('option', { value: mid })));
        if (!r.models || !r.models.length) {
          modelHint.textContent = '接口没有返回模型列表，直接手填模型名就行。';
          toast('接口没给模型列表，手填模型名即可', 'err');
        } else {
          modelHint.textContent = '接口返回 ' + r.models.length + ' 个模型 · 点「模型名」输入框可挑选 · 也可以手填';
          if (!modelIn.value.trim()) modelIn.value = r.models[0];
          renderChips();
          toast('读到 ' + r.models.length + ' 个模型', 'ok');
        }
      } catch (e) {
        modelHint.textContent = '读取模型列表失败：' + ipcErr(e).slice(0, 120);
        toast('读取失败：' + ipcErr(e), 'err');
      }
      fetchBtn.textContent = label;
      fetchBtn.disabled = false;
    } }, '读取模型列表');

    baseIn.addEventListener('change', renderChips);
    modelIn.addEventListener('change', renderChips);
    renderChips();

    const keyPill = h('span', { class: 'pill ' + (S.hasApiKey ? 'jade' : 'seal') }, S.hasApiKey ? '可用' : '未配置');
    const keyIn = h('input', { class: 'input', type: 'password', placeholder: S.hasApiKey ? '已保存：' + S.keyMasked + '（留空则不修改）' : 'sk-…' });
    const keyState = h('span', { class: 'kbadge' },
      h('span', { class: 'dot', style: { background: S.hasApiKey ? '#2F6F63' : '#A8322A' } }),
      S.hasApiKey ? '已配置 ' + S.keyMasked : '未配置');
    const testOut = h('div', { class: 'tiny muted' }, '');

    function refreshKeyBadge() {
      const cur = NF.settings || {};
      keyState.innerHTML = '';
      keyState.appendChild(h('span', { class: 'dot', style: { background: cur.hasApiKey ? '#2F6F63' : '#A8322A' } }));
      keyState.appendChild(document.createTextNode(cur.hasApiKey ? '已配置 ' + cur.keyMasked : '未配置'));
      keyIn.value = '';
      keyIn.placeholder = cur.hasApiKey ? '已保存：' + cur.keyMasked + '（留空则不修改）' : 'sk-…';
      keyPill.textContent = cur.hasApiKey ? '可用' : '未配置';
      keyPill.className = 'pill ' + (cur.hasApiKey ? 'jade' : 'seal');
    }

    const saveBtn = h('button', { class: 'btn pri', onclick: async () => {
      saveBtn.disabled = true;
      try {
        if (keyIn.value.trim()) await window.nf.settings.setApiKey(keyIn.value.trim());
        const hit = matchedEntry();
        NF.settings = await window.nf.settings.set({
          llm: {
            baseUrl: baseIn.value.trim(), model: modelIn.value.trim(),
            temperature: parseFloat(tempIn.value) || 0.3, maxTokens: parseInt(tokenIn.value, 10) || 2000,
            provider: hit ? hit.name : '自定义接口',
            customModels: customs
          }
        });
        refreshKeyBadge();
        toast('接口设置已保存（只存在本机）', 'ok');
      } catch (e) { toast(e.message, 'err'); }
      saveBtn.disabled = false;
    } }, '保存设置');

    const testBtn = h('button', { class: 'btn', onclick: async () => {
      testBtn.disabled = true;
      testOut.textContent = '正在连接…';
      try {
        /* 只在真的填了新 Key 时才写：留空表示沿用本机已保存的那把，不能顺手把它清掉 */
        if (keyIn.value.trim()) await window.nf.settings.setApiKey(keyIn.value.trim());
        await window.nf.settings.set({ llm: { baseUrl: baseIn.value.trim(), model: modelIn.value.trim() } });
        NF.settings = await window.nf.settings.get();
        refreshKeyBadge();
        const r = await window.nf.llm.test();
        testOut.textContent = '连接成功 · 模型返回「' + r.reply + '」· ' + r.baseUrl;
        toast('接口可用', 'ok');
      } catch (e) {
        testOut.textContent = '连接失败：' + ipcErr(e);
        toast('接口不可用：' + ipcErr(e), 'err');
      }
      testBtn.disabled = false;
    } }, '测试连接');

    const clearKeyBtn = h('button', { class: 'btn', onclick: async () => {
      await window.nf.settings.clearApiKey();
      NF.settings = await window.nf.settings.get();
      refreshKeyBadge();
      toast('已清除本机保存的 Key', 'ok');
    } }, '清除 Key');

    left.appendChild(h('div', { class: 'card' },
      h('div', { class: 'set-h' }, h('h3', {}, '模型接口（拆书用）'), keyPill),
      h('div', { class: 'set-b' },
        h('div', { class: 'set-note safe' },
          h('b', {}, '关于隐私：'),
          '这个 Key 只保存在你自己电脑上的 ',
          h('code', { class: 'mono tiny' }, NF.info ? NF.info.userData + '\\secrets.bin' : '本机用户目录'),
          '（经系统 DPAPI 加密），',
          h('b', {}, '不会写进项目目录、不会进 Git、也不会回传到界面或日志'),
          '。仓库里只有 .gitignore 和 .env.example，克隆下来的人必须自己填 Key 才能用拆书。'),
        h('div', { class: 'presets-wrap' }, h('div', { class: 'tiny muted', style: { marginBottom: '5px' } }, '模型服务（都是 OpenAI 兼容接口，点一下切换；行尾的「＋ 自定义模型」可以加自己的）'), presetRow),
        h('div', { class: 'field' }, h('label', {}, '接口地址 Base URL'), baseIn),
        h('div', { class: 'field' },
          h('div', { class: 'field-h' }, h('label', {}, '模型名'), fetchBtn),
          modelIn, modelList, modelHint),
        h('div', { class: 'krow' },
          h('div', { class: 'field' }, h('label', {}, '温度 temperature'), tempIn),
          h('div', { class: 'field' }, h('label', {}, '单次最大 token'), tokenIn)),
        h('div', { class: 'field' }, h('label', {}, 'API Key'), keyIn),
        h('div', { class: 'row' }, keyState, h('div', { class: 'grow' }), clearKeyBtn, testBtn, saveBtn),
        testOut,
        h('div', { class: 'tiny muted' }, '密钥存储方式：' + (S.keyStorage || '—') + (S.keyFromEnv ? ' · 当前使用环境变量 NF_API_KEY（优先于本机保存）' : '')))));

    /* ---------- 生图 ---------- */
    const im = (doc.settings && doc.settings.image) || {};
    const provIn = h('input', { class: 'input', value: im.provider || '' });
    const urlIn = h('input', { class: 'input', value: im.url || '' });
    const sizeIn = h('input', { class: 'input', value: im.size || '768x1024' });
    const styleIn = h('textarea', { class: 'ta', style: { minHeight: '58px' } }, im.style || '');
    left.appendChild(h('div', { class: 'card' },
      h('div', { class: 'set-h' }, h('h3', {}, '生图（人物立绘 / 地图底图）'), h('span', { class: 'pill' }, '本地优先')),
      h('div', { class: 'set-b' },
        h('div', { class: 'set-note' },
          h('b', {}, '怎么用：'),
          '在人物页点「去生图」，软件会把自动拼好的提示词放进剪贴板并打开你这里填的网址；你画完把图存到本地，回来点「上传」即可设成立绘。',
          '整个过程软件不联网、不上传任何东西。'),
        h('div', { class: 'krow' },
          h('div', { class: 'field', style: { flex: '1' } }, h('label', {}, '生图服务名'), provIn),
          h('div', { class: 'field', style: { flex: '1' } }, h('label', {}, '默认尺寸'), sizeIn)),
        h('div', { class: 'field' }, h('label', {}, '生图网站 / 本地程序地址'), urlIn),
        h('div', { class: 'field' }, h('label', {}, '画风提示词（会拼进每个人物的提示词后面）'), styleIn),
        h('div', { class: 'row' }, h('div', { class: 'grow' }),
          h('button', { class: 'btn pri', onclick: () => {
            doc.settings = doc.settings || {};
            doc.settings.image = { provider: provIn.value, url: urlIn.value, size: sizeIn.value, style: styleIn.value };
            NF.save(); toast('生图设置已保存', 'ok');
          } }, '保存'),
          h('button', { class: 'btn', onclick: () => {
            try { window.nf.image.openExternal(urlIn.value); } catch (e) { toast(e.message, 'err'); }
          } }, '打开试试')))));

    /* ---------- 数据与备份 ---------- */
    const bkBox = h('div', { class: 'col', style: { gap: '0' } });
    async function loadBackups() {
      clear(bkBox);
      try {
        const list = await window.nf.data.backups();
        if (!list.length) { bkBox.appendChild(h('div', { class: 'tiny muted' }, '还没有备份（保存 5 分钟后会自动生成）')); return; }
        list.slice(0, 8).forEach(b => {
          bkBox.appendChild(h('div', { class: 'bkrow' },
            h('div', { class: 'grow' }, h('b', { style: { fontWeight: '400' } }, ago(b.mtime)), h('span', { class: 'tiny muted', style: { marginLeft: '8px' } }, (b.size / 1024).toFixed(1) + ' KB')),
            h('span', { class: 'link', onclick: async () => {
              modal({ title: '从备份恢复', body: h('div', {}, h('p', { class: 'small' }, '将用 ' + fmtDate(b.mtime) + ' 的备份覆盖当前数据，当前数据会再备份一次。'), h('p', { class: 'tiny muted' }, '建议先点「立即备份」。')), okText: '恢复',
                onOk: async () => { await window.nf.data.backupNow(); const d = await window.nf.data.restore(b.name); NF.doc = d; toast('已恢复，正在刷新', 'ok'); NF.go('characters'); } });
            } }, '恢复')));
        });
      } catch (e) { bkBox.appendChild(h('div', { class: 'tiny' }, '读取备份失败：' + e.message)); }
    }
    loadBackups();
    right.appendChild(h('div', { class: 'card' },
      h('div', { class: 'set-h' }, h('h3', {}, '本地数据'), h('span', { class: 'pill jade' }, '仅本机')),
      h('div', { class: 'set-b' },
        h('div', { class: 'set-row' }, h('span', { class: 'lab' }, '数据文件'), h('span', { class: 'val mono tiny' }, NF.info ? NF.info.userData : '')),
        h('div', { class: 'set-row' }, h('span', { class: 'lab' }, '最近保存'), h('span', { class: 'val' }, (doc.meta && doc.meta.updatedAt) ? fmtDate(doc.meta.updatedAt) : '—')),
        h('div', { class: 'set-row' }, h('span', { class: 'lab' }, '规模'), h('span', { class: 'val' }, doc.characters.length + ' 个人物 · ' + doc.plots.length + ' 条情节 · ' + (doc.scraps || []).length + ' 条废案')),
        h('div', { class: 'sep' }),
        h('div', { class: 'row' },
          h('button', { class: 'btn xs', onclick: async () => { await window.nf.data.backupNow(); toast('已备份', 'ok'); loadBackups(); } }, '立即备份'),
          h('button', { class: 'btn xs', onclick: async () => { const r = await window.nf.data.exportJson(); if (!r.canceled) toast('已导出', 'ok'); } }, '导出 JSON'),
          h('button', { class: 'btn xs', onclick: async () => { const d = await window.nf.data.importJson(); if (d) { NF.doc = d; toast('已导入', 'ok'); NF.go('characters'); } } }, '导入 JSON')),
        h('div', { class: 'tiny muted', style: { marginTop: '4px' } }, '备份列表（最多 30 份，自动轮换）'),
        bkBox)));

    right.appendChild(h('div', { class: 'card' },
      h('div', { class: 'set-h' }, h('h3', {}, '关于')),
      h('div', { class: 'set-b' },
        h('div', { class: 'set-row' }, h('span', { class: 'lab' }, '版本'), h('span', { class: 'val' }, '卷帙 NovelFolio v' + (NF.info ? NF.info.version : '0.1.0'))),
        h('div', { class: 'set-row' }, h('span', { class: 'lab' }, '运行时'), h('span', { class: 'val tiny' }, NF.info ? ('Electron ' + NF.info.electron + ' · Chromium ' + NF.info.chrome + ' · Node ' + NF.info.node) : '')),
        h('div', { class: 'set-note' }, h('b', {}, '离线承诺：'), '除了你自己配置的模型接口，软件不向外发送任何数据；没有账号、没有统计、没有崩溃上报。'))));
  }
};
