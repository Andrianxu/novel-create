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
.set-provider{border:1px solid #E0C79B;border-radius:9px;background:#FFFCF5;padding:9px 11px;font-size:11.5px;line-height:1.75;color:#5B5348}
.set-provider b{color:#8A6421}
.set-provider ol{margin:6px 0 0;padding-left:18px}
.set-provider li{margin:2px 0}
.set-provider .hint{margin-top:6px;color:#8C8272}
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
/* 存储位置：一行「标签 + 路径 + 按钮」，路径要能换行（自定义目录可能很长） */
.dir-row{display:flex;align-items:flex-start;gap:8px;font-size:11.5px}
.dir-row .lab{width:88px;flex:none;color:#8C8272;font-size:11px;padding-top:2px}
.dir-row .val{flex:1;min-width:0;word-break:break-all;font-size:11.5px;color:#332C25;line-height:1.7}
.dir-acts{display:flex;gap:6px;flex-wrap:wrap;margin-top:2px}
.dir-warn{margin-top:6px}
.dirlive{margin-top:6px;border:1px solid var(--line);border-radius:9px;background:#FFFCF5;padding:2px 10px 6px}
/* 启动文字的预览：跟启动动画一个字体，字一个个亮起来 */
.splash-preview{flex:1;min-width:0;height:30px;display:flex;align-items:center;gap:0;border:1px dashed #E0C79B;border-radius:8px;background:#FBF3E6;padding:0 10px;cursor:pointer;overflow:hidden}
.splash-preview .pv{font-family:'Songti SC','STSong','SimSun','Noto Serif CJK SC',serif;font-size:15px;letter-spacing:.08em;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-block}
.splash-preview .pv .ch{opacity:0;transition:opacity .12s linear}
.splash-preview .pv .ch.on{opacity:1}
.splash-preview .caret-blk{width:2px;height:16px;background:var(--seal);margin-right:3px;flex:none;
  animation:setCaret 1s steps(1,end) infinite}
@keyframes setCaret{0%,49%{opacity:1}50%,100%{opacity:0}}
/* AI 助手图标：预览就是按钮本体的缩小版，上传后立刻能看到贴上去的效果 */
.ai-icon-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dashed #EAE1CF}
.ai-icon-row:last-of-type{border-bottom:none}
.ai-icon-prev{width:46px;height:46px;flex:none;border-radius:50%;border:1px solid #CBB894;background:var(--ink);
  color:var(--paper);font-family:var(--kai);font-size:14px;letter-spacing:.06em;display:flex;align-items:center;justify-content:center;overflow:hidden}
.ai-icon-prev img{width:100%;height:100%;object-fit:cover;display:block}
.ai-icon-info{flex:1;min-width:0}
.ai-icon-name{font-size:12px;color:#332C25}
.ai-icon-state{font-size:10px;color:var(--muted);margin-top:2px}
.ai-icon-acts{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
/* AI 人设审阅：阈值滑块 + 数字框，数字跟着滑杆走，改完即存 */
.rev-row{display:flex;align-items:center;gap:9px}
.rev-range{flex:1;min-width:0;accent-color:var(--seal)}
.rev-num{width:72px;flex:none}
.rev-val{width:38px;flex:none;text-align:right;font-size:12px;font-weight:700;color:#8A6421}
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

/* 百度 / 夸克 / 迅雷没有公开 WebDAV，也不能在没授权的情况下直连它们的私有接口。
 * 这三种「连接方式」= 用各自电脑客户端的同步文件夹，卷帙只负责把 novelfolio.sync
 * 写进那个文件夹，上传交给客户端。下面只放引导文案，传输层仍按 folder 处理。 */
const CLOUD_DRIVES = {
  baidu: {
    label: '百度网盘',
    hint: '常见文件夹名：BaiduNetdisk、百度网盘、同步空间。找不到就回到客户端的同步设置里看它显示的本地路径。',
    steps: [
      '电脑上安装并登录百度网盘客户端，开启它的同步 / 备份文件夹功能；',
      '在同步文件夹里新建一个专门放书稿的目录（例如「卷帙」），记下电脑上的路径；',
      '在这里点「选择…」选中该目录，再点「测试连接」确认可读写；',
      '另一台设备登录同一账号、同步同一个云端目录，选中它对应的本地路径。'
    ]
  },
  quark: {
    label: '夸克网盘',
    hint: '常见文件夹名：夸克网盘、QuarkCloudDrive。若客户端版本没有同步文件夹功能，请改用 WebDAV 或普通本地文件夹。',
    steps: [
      '电脑上安装并登录夸克网盘客户端，找到同步文件夹 / 本地同步入口；',
      '在同步目录里新建一个专门放书稿的目录（例如「卷帙」）；',
      '在这里点「选择…」选中它，再点「测试连接」；',
      '另一台设备登录同一账号，同步同一个云端目录后选它对应的本地路径。'
    ]
  },
  xunlei: {
    label: '迅雷网盘',
    hint: '常见文件夹名：迅雷云盘、迅雷网盘、云盘同步。找不到就先看客户端设置里的「同步目录」。',
    steps: [
      '电脑上安装并登录迅雷客户端，开启云盘同步 / 同步文件夹；',
      '在同步目录里新建一个专门放书稿的目录（例如「卷帙」）；',
      '在这里点「选择…」选中它，再点「测试连接」；',
      '另一台设备登录同一账号，同步同一个云端目录后选它对应的本地路径。'
    ]
  }
};
const isFolderKind = k => k === 'folder' || !!CLOUD_DRIVES[k];
const driveLabel = k => (CLOUD_DRIVES[k] && CLOUD_DRIVES[k].label) || '同步文件夹';

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


    /* ---------- 同步（书稿放进你自己的网盘） ---------- */
    const sy = Object.assign({ enabled: false, kind: 'folder', folder: '', url: '', user: '', encrypt: false, autoMinutes: 0 },
      (NF.settings && NF.settings.sync) || {});
    const syPill = h('span', { class: 'pill ' + (sy.enabled ? 'jade' : 'seal') }, sy.enabled ? '已开启' : '未开启');

    const curKind = sy.kind || 'folder';
    const kindSel = h('select', { class: 'input', 'data-probe': 'sync-kind' },
      h('option', { value: 'folder', selected: curKind === 'folder' }, '本地同步文件夹（OneDrive / 坚果云 / iCloud）'),
      h('option', { value: 'baidu', selected: curKind === 'baidu' }, '百度网盘（客户端同步文件夹）'),
      h('option', { value: 'quark', selected: curKind === 'quark' }, '夸克网盘（客户端同步文件夹）'),
      h('option', { value: 'xunlei', selected: curKind === 'xunlei' }, '迅雷网盘（客户端同步文件夹）'),
      h('option', { value: 'webdav', selected: curKind === 'webdav' }, 'WebDAV（坚果云 / 群晖 NAS / Nextcloud）'));

    const folderByKind = Object.assign({}, sy.folders || {});
    if (curKind && !folderByKind[curKind] && sy.folder) folderByKind[curKind] = sy.folder;
    let lastKind = curKind;
    const folderIn = h('input', { class: 'input', value: folderByKind[curKind] || sy.folder || '', placeholder: '例如 C:\\Users\\我\\OneDrive\\卷帙' });
    const urlIn2 = h('input', { class: 'input', value: sy.url || '', placeholder: 'https://dav.jianguoyun.com/dav/你的目录' });
    const userIn = h('input', { class: 'input', value: sy.user || '', placeholder: '坚果云账号邮箱' });
    const passIn = h('input', { class: 'input', type: 'password', placeholder: sy.hasDavPass ? '已保存（留空则不修改）' : '应用密码（不是登录密码）' });
    const passIn2 = h('input', { class: 'input', type: 'password', placeholder: sy.hasPass ? '已保存（留空则不修改）' : '设置一个同步口令，至少 8 位' });
    const encChk = h('input', { type: 'checkbox', checked: !!sy.encrypt });

    const folderLab = h('label', {}, '同步文件夹');
    const folderRow = h('div', { class: 'field' },
      folderLab,
      h('div', { class: 'krow' }, folderIn,
        h('button', { class: 'btn xs', 'data-probe': 'sync-pick', onclick: async () => {
          try {
            const k = kindSel.value;
            const label = CLOUD_DRIVES[k] ? driveLabel(k) : '';
            const r = await window.nf.sync.pickFolder(label ? { label } : undefined);
            if (r && r.folder) folderIn.value = r.folder;
          } catch (e) { toast(e.message, 'err'); }
        } }, '选择…')));
    const providerGuide = h('div', { class: 'set-provider', 'data-probe': 'sync-guide' });
    const davRow = h('div', { class: 'field-col' },
      h('div', { class: 'field' }, h('label', {}, 'WebDAV 地址'), urlIn2),
      h('div', { class: 'krow' },
        h('div', { class: 'field' }, h('label', {}, '账号'), userIn),
        h('div', { class: 'field' }, h('label', {}, '密码 / 应用密码'), passIn)));

    function paintKind() {
      const kind = kindSel.value;
      const isDav = kind === 'webdav';
      const meta = CLOUD_DRIVES[kind];
      folderRow.hidden = isDav;
      davRow.hidden = !isDav;
      providerGuide.hidden = !meta;
      if (meta) {
        clear(providerGuide);
        providerGuide.appendChild(h('b', {}, meta.label + '怎么接进来'));
        providerGuide.appendChild(h('ol', {}, ...meta.steps.map(s => h('li', {}, s))));
        providerGuide.appendChild(h('div', { class: 'hint' }, meta.hint));
      }
      folderLab.textContent = meta ? meta.label + '同步文件夹' : '同步文件夹';
      folderIn.placeholder = meta ? ('例如 D:\\' + meta.label + '\\卷帙') : '例如 C:\\Users\\我\\OneDrive\\卷帙';
    }
    kindSel.addEventListener('change', () => {
      folderByKind[lastKind] = folderIn.value.trim();
      lastKind = kindSel.value;
      folderIn.value = folderByKind[lastKind] || '';
      paintKind();
    });

    const syOut = h('div', { class: 'tiny muted', 'data-probe': 'sync-out' }, '');

    function collectSync() {
      const kind = kindSel.value;
      folderByKind[kind] = folderIn.value.trim();
      lastKind = kind;
      return {
        enabled: true,
        kind,
        folder: folderByKind[kind],
        folders: Object.assign({}, folderByKind),
        url: urlIn2.value.trim(),
        user: userIn.value.trim(),
        encrypt: encChk.checked,
        autoMinutes: 0
      };
    }

    async function saveSync(showToast) {
      const patch = collectSync();
      if (isFolderKind(patch.kind) && !patch.folder) throw new Error('请先选择' + (CLOUD_DRIVES[patch.kind] ? driveLabel(patch.kind) + '的同步文件夹' : '同步文件夹'));
      if (patch.kind === 'webdav' && !patch.url) throw new Error('请先填 WebDAV 地址');
      if (passIn.value.trim()) await window.nf.settings.setSyncSecret('davPass', passIn.value.trim());
      if (passIn2.value.trim()) {
        if (passIn2.value.trim().length < 8) throw new Error('同步口令至少 8 位');
        await window.nf.settings.setSyncSecret('syncPass', passIn2.value.trim());
      }
      NF.settings = await window.nf.settings.set({ sync: patch });
      syPill.textContent = '已开启';
      syPill.className = 'pill jade';
      /* 顶栏状态点要跟着亮起来：它是按 NF.settings 判断显不显示的 */
      if (window.NF && typeof NF.paintSync === 'function') NF.paintSync('busy', '已就绪，点「立即同步」');
      passIn.value = ''; passIn2.value = '';
      const cur = NF.settings.sync || {};
      passIn.placeholder = cur.hasDavPass ? '已保存（留空则不修改）' : '应用密码（不是登录密码）';
      passIn2.placeholder = cur.hasPass ? '已保存（留空则不修改）' : '设置一个同步口令，至少 8 位';
      if (showToast) toast('同步设置已保存', 'ok');
    }

    const syTest = h('button', { class: 'btn', 'data-probe': 'sync-test', onclick: async () => {
      syTest.disabled = true;
      syOut.textContent = '正在连接…';
      try { await saveSync(false); } catch (e) { syOut.textContent = e.message; syTest.disabled = false; return; }
      try {
        const r = await window.nf.sync.test();
        syOut.textContent = r.ok ? ('连接成功：' + r.detail + (r.hasRemote ? ' · 云端已有书稿' : ' · 云端还没有书稿（第一次同步会建立）')) : ('连接失败：' + r.message);
        toast(r.ok ? '网盘连接正常' : '连接失败：' + r.message, r.ok ? 'ok' : 'err');
      } catch (e) { syOut.textContent = '连接失败：' + ipcErr(e); toast('连接失败', 'err'); }
      syTest.disabled = false;
    } }, '测试连接');

    const syNow = h('button', { class: 'btn pri', 'data-probe': 'sync-now', onclick: async () => {
      syNow.disabled = true;
      syOut.textContent = '同步中…';
      const off = window.nf.on('sync:progress', m => { syOut.textContent = m; });
      try { await saveSync(false); } catch (e) { syOut.textContent = e.message; syNow.disabled = false; if (typeof off === 'function') off(); return; }
      try {
        /* 先把当前数据交主进程落盘：同步合并的是那份，别把刚改的漏掉 */
        try { await window.nf.data.save(NF.doc); } catch (e) {}
        const r = await window.nf.sync.now();
        if (r.ok) {
          syOut.textContent = r.message + (r.changed ? '（本机数据已更新，界面刷新中）' : '');
          toast(r.message, r.conflicts && r.conflicts.length ? '' : 'ok');
          if (window.NF && typeof NF.paintSync === 'function') NF.paintSync(r.conflicts && r.conflicts.length ? 'warn' : 'ok', r.message);
          if (r.changed) {
            try { NF.doc = await window.nf.data.load(); } catch (e) {}
            if (window.NF && typeof NF.refresh === 'function') NF.refresh();
          }
        } else {
          syOut.textContent = '同步失败：' + r.message;
          toast('同步失败：' + r.message, 'err');
          if (window.NF && typeof NF.paintSync === 'function') NF.paintSync('err', r.message);
        }
      } catch (e) { syOut.textContent = '同步失败：' + ipcErr(e); toast('同步失败', 'err'); }
      if (typeof off === 'function') off();
      syNow.disabled = false;
    } }, '立即同步');

    const syOff = h('button', { class: 'btn', onclick: async () => {
      NF.settings = await window.nf.settings.set({ sync: { enabled: false } });
      syPill.textContent = '未开启';
      syPill.className = 'pill seal';
      syOut.textContent = '同步已关闭；网盘里已有的书稿不会被删除。';
      toast('同步已关闭', 'ok');
    } }, '关闭同步');

    left.appendChild(h('div', { class: 'card' },
      h('div', { class: 'set-h' }, h('h3', {}, '多设备同步'), syPill),
      h('div', { class: 'set-b' },
        h('div', { class: 'set-note safe' },
          h('b', {}, '数据存在你自己的网盘里：'),
          '卷帙不经过任何服务器，也不保存你的稿子。电脑和手机填同一个网盘目录，就自动同步；两边都改过的同一章会',
          h('b', {}, '各留一份'),
          '，不会覆盖。'),
        h('div', { class: 'field' }, h('label', {}, '连接方式'), kindSel),
        providerGuide,
        folderRow,
        davRow,
        h('div', { class: 'field' },
          h('label', {}, '端到端加密'),
          h('label', { class: 'ai-opt', style: { display: 'inline-flex', gap: '7px', alignItems: 'center' } },
            encChk,
            h('span', {}, '加密后上传（网盘服务商也看不到正文；' + '忘记口令将无法恢复）'))),
        h('div', { class: 'field' }, h('label', {}, '同步口令'), passIn2),
        h('div', { class: 'row' }, syOut),
        h('div', { class: 'row' }, h('div', { class: 'grow' }), syOff, syTest, syNow),
        h('div', { class: 'tiny muted' },
          '文件会以 ', h('code', { class: 'mono tiny' }, 'novelfolio.sync'), ' 的名字放在你选的网盘目录里。',
          '百度 / 夸克 / 迅雷走客户端同步文件夹，卷帙不碰账号、不存网盘密码；',
          '它们的客户端没有同步文件夹功能时，请改用 WebDAV 或本地文件夹。',
          '本机始终保留 30 份备份，网盘出问题也不会丢稿。'))));

    paintKind();

    /* ---------- 存储位置（自定义数据目录） ----------
     * 书稿（书库 + 每本书 + 立绘 + 地图 + 备份）默认放在 %APPDATA%\novelfolio\data。
     * 这里可以让它搬到别的盘 / 同盘别的文件夹 / 已经放进网盘的文件夹：
     *   主进程把整个 data/ 复制过去、核对数量与字节数，再记下「以后用那个目录」，重启生效。
     * 原来那块**不删**（删稿不该由一次「换个位置」顺手做了），页面上会告诉你去哪儿删。 */
    function storeBlock() {
      const store = (window.nf.data && window.nf.data.store) || null;
      const wrap = h('div', { class: 'col', style: { gap: '4px', padding: '9px 0 3px', borderBottom: '1px dashed #EAE1CF' } });
      if (!store) { wrap.appendChild(h('div', { class: 'tiny muted' }, '当前版本不支持自定义存储位置')); return wrap; }
      const val = h('div', { class: 'val mono' }, ((NF.info && (NF.info.dataDir || NF.info.userData)) || '…'));
      const acts = h('div', { class: 'dir-acts' });
      const note = h('div', { class: 'tiny muted' }, '');
      const warnBox = h('div', { class: 'col', style: { gap: '6px' } });
      wrap.appendChild(h('div', { class: 'dir-row' },
        h('span', { class: 'lab' }, '存储位置'), val,
        h('span', { class: 'pill' + ((NF.info && NF.info.dataCustom) ? ' jade' : ' grey'), style: { flex: 'none' } },
          (NF.info && NF.info.dataCustom) ? '自定义' : '默认')));
      wrap.appendChild(acts);
      wrap.appendChild(note);
      wrap.appendChild(warnBox);

      function paint(st) {
        if (!st) return;
        const now = st.current || '';
        const isDefault = storeSame(now, st.defaultDir);
        val.textContent = now || '—';
        const pill = wrap.querySelector('.pill');
        if (pill) {
          pill.textContent = isDefault ? '默认' : '自定义';
          pill.className = 'pill' + (isDefault ? ' grey' : ' jade');
        }
        const mb = n => n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
        note.textContent = (st.files != null ? '约 ' + st.files + ' 个文件 · ' + mb(st.size || 0) + ' · ' : '')
          + (st.writable === false ? '写不进去，请尽快换一个位置' : '可以正常读写');
        if (st.writable === false) note.style.color = '#A8322A'; else note.style.color = '';
        clear(warnBox);
        if (st.missing) {
          warnBox.appendChild(h('div', { class: 'set-note' },
            h('b', {}, '上次设置的数据目录找不到了：'), '现在临时用默认位置。可能是移动硬盘没插或者文件夹被挪走了——插回来重启就好；也可以点「更改…」重新指定。'));
        }
        if (st.pending) {
          warnBox.appendChild(h('div', { class: 'set-note safe' },
            h('b', {}, '新位置已登记：'), '重启后会用 ',
            h('code', { class: 'mono tiny' }, st.pointer),
            ' 里的数据。'));
        }
        clear(acts);
        acts.appendChild(h('button', { class: 'btn xs', onclick: () => openDirPicker(st) },
          isDefault ? '更改…' : '换回默认位置'));
        acts.appendChild(h('button', { class: 'btn xs', onclick: async () => {
          try { await window.nf.files.openPath(now); } catch (e) { toast(e.message, 'err'); }
        } }, '打开文件夹'));
      }

      async function refresh() {
        try {
          const st = await store.info();
          NF.storeInfo = st;
          paint(st);
          return st;
        } catch (e) { note.textContent = '读取失败：' + ipcErr(e); note.style.color = '#A8322A'; return null; }
      }

      function storeSame(a, b) {
        const n = p => String(p || '').replace(/[\\/]+$/, '').toLowerCase();
        return n(a) === n(b);
      }

      function openDirPicker(st) {
        const isDefault = storeSame(st.current, st.defaultDir);
        const dirIn = h('input', { class: 'input', placeholder: '例如 D:\\卷帙数据（不存在会自动新建）', value: isDefault ? '' : st.current });
        const status = h('div', { class: 'tiny muted', style: { minHeight: '16px' } }, '');
        const live = h('div', { class: 'dirlive' });
        const moving = h('div', { class: 'set-note safe' }, '');
        const backChk = h('input', { type: 'checkbox' });
        const backRow = h('label', { class: 'ai-opt tiny', style: { display: 'inline-flex', gap: '6px', alignItems: 'center', marginTop: '2px' } },
          backChk, h('span', {}, '搬回这个软件默认的数据位置（' + st.defaultDir + '）'));
        backRow.hidden = isDefault;
        backChk.addEventListener('change', () => {
          if (backChk.checked) { dirIn.value = ''; dirIn.disabled = true; inspect(''); }
          else { dirIn.disabled = false; inspect(dirIn.value); }
        });

        async function inspect(dirPath) {
          clear(live);
          status.textContent = '';
          status.style.color = '';
          const p = String(dirPath || '').trim();
          if (!p) return;
          try {
            const r = await store.isDataDir(p);
            if (r && r.isData) {
              live.appendChild(h('div', { class: 'tiny', style: { color: '#8A6421', padding: '6px 0' } },
                h('b', {}, '这个文件夹里已经有一份卷帙数据。'),
                '换过去之后会接着用那里面的书（不会复制、也不会覆盖）。'));
            }
          } catch (e) { /* 只是提示，出错就什么都不显示 */ }
        }

        const pickBtn = h('button', { class: 'btn xs', onclick: async () => {
          try {
            const r = await store.pick();
            if (r && r.folder) {
              dirIn.disabled = false; backChk.checked = false; backRow.hidden = false;
              dirIn.value = r.folder;
              inspect(r.folder);
            }
          } catch (e) { toast(e.message, 'err'); }
        } }, '选择文件夹…');

        function paintBack() {
          /* 现在不在默认位置时，「换回默认位置」是有内容的（那边还留着老数据） */
          clear(moving);
          const isDef = storeSame(st.current, st.defaultDir);
          if (isDef) {
            moving.appendChild(document.createTextNode('书稿会被复制到新位置，原来那块原样留着；重启后生效。'));
            return;
          }
          moving.appendChild(h('b', {}, '说明：'));
          moving.appendChild(document.createTextNode('在默认位置 '));
          moving.appendChild(h('code', { class: 'mono tiny' }, st.defaultDir));
          moving.appendChild(document.createTextNode(' 还留着一份原来的数据，换回去就是接着用它（不会复制）。'));
        }
        paintBack();

        const body = h('div', { class: 'col', style: { gap: '10px' } },
          h('div', { class: 'set-note' },
            h('b', {}, '数据存在哪儿：'),
            '书库、每本书的正文、人物立绘、地图底图和备份都在这个文件夹里。想换到别的盘、或者放进 OneDrive 这类会同步的文件夹，从这里改；换电脑时整块拷走就行。'),
          h('div', { class: 'field' }, h('label', {}, '新的存储位置'), h('div', { class: 'krow' }, dirIn, pickBtn)),
          live, status, backRow, moving,
          h('div', { class: 'tiny muted' }, '换位置时会把整个文件夹复制过去并逐个核对；原位置的东西不会删，确认新位置没问题后可以自己去删掉。'));

        dirIn.addEventListener('change', () => inspect(dirIn.value));

        const m = modal({
          title: '更改数据存储位置', body, okText: '复制并切换', width: '660px',
          onOk: async () => {
            const target = backChk.checked ? '' : dirIn.value.trim();
            let reuse = false;
            if (!backChk.checked && target) {
              try { reuse = !!(await store.isDataDir(target)).isData; } catch (e) { reuse = false; }
            }
            status.textContent = '正在复制，请不要关掉软件…';
            status.style.color = '';
            let r;
            try { r = await store.set({ dir: target, reuse }); }
            catch (e) { r = { ok: false, message: ipcErr(e) }; }
            if (!r || !r.ok) {
              status.textContent = '没能换过去：' + ((r && r.message) || '未知错误');
              status.style.color = '#A8322A';
              return false;                 /* 不关弹窗：让作者改个位置再试 */
            }
            if (!r.changed) {
              status.textContent = r.message || '数据本来就在这个位置';
              await refresh();
              return false;
            }
            await refresh();
            /* 主进程已经当场切过去了：这里把界面上的数据也换成新位置的，立刻就能接着写。
             * NF.info 也重取一次 —— 状态栏、设置页里的路径都按它显示。 */
            try {
              const fresh = await window.nf.info();
              if (fresh) NF.info = fresh;
              NF.library = await window.nf.books.list();
              const d = await window.nf.data.load();
              if (d) { NF.adoptBook({ doc: d, library: NF.library }); }
              const sr = document.getElementById('statRight');
              if (sr && NF.info) sr.textContent = 'v' + NF.info.version + ' · 数据在 ' + NF.info.dataDir
                + (NF.info.encrypt ? ' · 密钥已系统加密' : ' · 系统不支持加密');
            } catch (e) { console.error('[settings] reload after dir move failed', e); }
            await refresh();
            modal({
              title: '已切换存储位置', width: '560px', cancelText: false, okText: '知道了',
              body: h('div', {},
                h('p', { class: 'small' }, r.reused
                  ? '已切换到这个文件夹里原有的数据。'
                  : '已复制 ' + r.copied + ' 个文件到新位置，并逐个核对过。'),
                h('p', { class: 'tiny muted', style: { wordBreak: 'break-all' } }, '新位置：' + r.to),
                h('p', { class: 'small' }, '现在就可以接着写，改动会直接存到新位置。'),
                h('p', { class: 'tiny muted' }, '原来那个文件夹里的东西没有删，确认新位置没问题后可以自己去删掉；想搬回来点「换回默认位置」。'))
            });
            return true;
          }
        });
        inspect(dirIn.value);
        setTimeout(() => dirIn.focus(), 40);
        return m;
      }

      refresh();
      return wrap;
    }

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
              modal({ title: '从备份恢复', body: h('div', {}, h('p', { class: 'small' }, '将用 ' + fmtDate(b.mtime) + ' 的备份写回它所属的那本书，当前那本会再备份一次。'), h('p', { class: 'tiny muted' }, '建议先点「立即备份」。')), okText: '恢复',
                onOk: async () => {
                  /* 备份里记着是哪本书就写回哪本；恢复后让界面整页重来一次 */
                  await window.nf.data.backupNow();
                  await window.nf.data.restore(b.name);
                  try { NF.library = await window.nf.books.list(); } catch (e) {}
                  NF.doc = await window.nf.data.load();
                  try { NF.history.clear(); NF.history.prime(); } catch (e) {}
                  toast('已恢复，正在刷新', 'ok');
                  NF.repaint();
                  NF.go('characters');
                } });
            } }, '恢复')));
        });
      } catch (e) { bkBox.appendChild(h('div', { class: 'tiny' }, '读取备份失败：' + e.message)); }
    }
    loadBackups();
    right.appendChild(h('div', { class: 'card' },
      h('div', { class: 'set-h' }, h('h3', {}, '本地数据'), h('span', { class: 'pill jade' }, '仅本机')),
      h('div', { class: 'set-b' },
        storeBlock(),
        h('div', { class: 'set-row' }, h('span', { class: 'lab' }, '设置与密钥'), h('span', { class: 'val mono tiny' }, NF.info ? NF.info.userData : '')),
        h('div', { class: 'set-row' }, h('span', { class: 'lab' }, '最近保存'), h('span', { class: 'val' }, (doc.meta && doc.meta.updatedAt) ? fmtDate(doc.meta.updatedAt) : '—')),
        h('div', { class: 'set-row' }, h('span', { class: 'lab' }, '当前书籍'), h('span', { class: 'val' }, '《' + ((doc.meta && doc.meta.title) || '未命名') + '》 · 书库共 ' + (((NF.library || {}).books || []).length) + ' 本')),
        h('div', { class: 'set-row' }, h('span', { class: 'lab' }, '规模'), h('span', { class: 'val' }, doc.characters.length + ' 个人物 · ' + doc.plots.length + ' 条情节 · ' + (doc.scraps || []).length + ' 条废案')),
        h('div', { class: 'sep' }),
        h('div', { class: 'row' },
          h('button', { class: 'btn xs', onclick: () => NF.openLibrary() }, '书库…'),
          h('button', { class: 'btn xs', onclick: async () => { await window.nf.data.backupNow(); toast('已备份', 'ok'); loadBackups(); } }, '立即备份'),
          h('button', { class: 'btn xs', onclick: async () => { const r = await window.nf.data.exportJson(); if (!r.canceled) toast('已导出', 'ok'); } }, '导出 JSON'),
          h('button', { class: 'btn xs', title: '导入的 JSON 会收成书库里的一本新书，不会覆盖现在这本', onclick: async () => {
            try {
              const d = await window.nf.data.importJson();
              if (!d || d.canceled) return;
              await NF.adoptBook({ doc: d, library: await window.nf.books.list() });
              toast('已导入为一本新书并切换过去', 'ok');
            } catch (e) { toast('导入失败：' + ipcErr(e), 'err'); }
          } }, '导入 JSON')),
        h('div', { class: 'tiny muted', style: { marginTop: '4px' } }, '备份列表（最多 30 份，自动轮换）'),
        bkBox)));

    /* ---------- 启动动画：开关 + 自定义文字 ---------- */
    const animChk = h('input', { type: 'checkbox', checked: !(S.ui && S.ui.launchAnim === false) });
    animChk.addEventListener('change', async () => {
      try {
        NF.settings = await window.nf.settings.set({ ui: { launchAnim: animChk.checked } });
        toast(animChk.checked ? '下次启动会播放启动动画' : '下次启动直接进入主界面', 'ok');
      } catch (e) { animChk.checked = !animChk.checked; toast(e.message, 'err'); }
    });

    /* 启动文字：动画最后逐字打出来的那句。存在 config.json 的 ui.splashText 里，
     * 留空 = 默认的「欢迎来到您创造的世界」。字数上限和主进程保持一致（最多 40 个字）。 */
    const SPLASH_DEFAULT = '欢迎来到您创造的世界';
    const SPLASH_MAX = 40;
    let savedText = (S.ui && S.ui.splashText) || '';
    const textIn = h('input', { class: 'input', value: savedText, maxlength: String(SPLASH_MAX), placeholder: SPLASH_DEFAULT });
    const counter = h('span', { class: 'tiny muted' }, '');
    const preview = h('div', { class: 'splash-preview' }, h('i', { class: 'caret-blk' }), h('span', { class: 'pv' }, ''));
    const saveTextBtn = h('button', { class: 'btn xs pri' }, '保存文字');
    const resetTextBtn = h('button', { class: 'btn xs' }, '恢复默认');

    function flashPreview() {
      const t = textIn.value.trim() || SPLASH_DEFAULT;
      const pv = preview.querySelector('.pv');
      /* 空文字预览默认那句；否则把字逐个点亮一次，所见即所得 */
      pv.textContent = '';
      const chars = Array.from(t);
      const nodes = chars.map(ch => { const s = h('span', { class: 'ch' }, ch); pv.appendChild(s); return s; });
      /* 每次预览都是新建的节点（上面先清空了），所以直接排定时器点亮就行 */
      nodes.forEach((el, i) => { setTimeout(() => el.classList.add('on'), 40 + i * 90); });
    }
    function paintTextState() {
      const cur = textIn.value;
      const left = SPLASH_MAX - cur.length;
      counter.textContent = (cur.trim() ? '' : '留空 = 默认那句「' + SPLASH_DEFAULT + '」 · ') + '还可以写 ' + left + ' 个字';
      counter.style.color = left < 0 ? '#A8322A' : '';
      const dirty = cur.trim() !== (savedText || '');
      saveTextBtn.disabled = !dirty || cur.trim().length > SPLASH_MAX;
      saveTextBtn.classList.toggle('pri', dirty);
      resetTextBtn.disabled = !dirty && !savedText;
    }
    async function saveText() {
      const t = textIn.value.replace(/\s+/g, ' ').trim();
      if (t.length > SPLASH_MAX) { toast('启动文字最多 ' + SPLASH_MAX + ' 个字', 'err'); return false; }
      try {
        NF.settings = await window.nf.settings.set({ ui: { splashText: t } });
        savedText = (NF.settings.ui && NF.settings.ui.splashText) || '';
        textIn.value = savedText;
        paintTextState();
        toast(t ? '启动文字已保存，下次启动生效' : '已恢复默认的那句，下次启动生效', 'ok');
        return true;
      } catch (e) { toast(ipcErr(e), 'err'); return false; }
    }
    textIn.addEventListener('input', paintTextState);
    textIn.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (!saveTextBtn.disabled) saveText(); } });
    saveTextBtn.onclick = () => saveText();
    resetTextBtn.onclick = () => { textIn.value = ''; paintTextState(); saveText(); };
    preview.onclick = flashPreview;
    preview.title = '点一下看一遍打字效果';
    setTimeout(flashPreview, 200);
    paintTextState();

    right.appendChild(h('div', { class: 'card' },
      h('div', { class: 'set-h' }, h('h3', {}, '启动动画')),
      h('div', { class: 'set-b' },
        h('div', { class: 'set-row' },
          h('span', { class: 'lab' }, '启动动画'),
          h('span', { class: 'val' },
            h('label', {
              class: 'ai-opt',
              style: { display: 'inline-flex', gap: '7px', alignItems: 'center', cursor: 'pointer' }
            },
            animChk,
            h('span', {}, '启动时播放')))),
        h('div', { class: 'tiny muted' },
          '关掉后启动直接进入主界面。启动慢的时候动画会把这段等待盖住；动画播放中点击或按任意键可以跳过。'),
        h('div', { class: 'sep' }),
        h('div', { class: 'field' },
          h('div', { class: 'field-h' }, h('label', {}, '启动文字（动画里逐字打出来的那句）'), counter),
          textIn,
          h('div', { class: 'row' }, preview, h('div', { class: 'grow' }), resetTextBtn, saveTextBtn)),
        h('div', { class: 'tiny muted' }, '点上面的预览可以再看一遍打字效果。字多的时候会按宽度自动缩小，最多 ' + SPLASH_MAX + ' 个字符。'))));

    /* ---------- AI 人设审阅 ----------
     * 开关与阈值存在 config.json 的 aiReview 里（所有书通用），不随书稿同步。
     * 关掉之后章节页连模型都不会调；阈值只决定「多大的变化值得提醒作者」。 */
    const revCfg = S.aiReview || {};
    const clampRev = v => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.min(100, Math.max(1, Math.round(n))) : 50;
    };
    const revChk = h('input', { type: 'checkbox', checked: revCfg.enabled !== false, 'data-probe': 'ai-review-enabled' });
    const revPill = h('span', { class: 'pill' }, revChk.checked ? '已开启' : '已关闭');
    const revRange = h('input', { type: 'range', min: '1', max: '100', step: '1', class: 'rev-range',
      value: String(clampRev(revCfg.threshold)), 'data-probe': 'ai-review-threshold' });
    const revNum = h('input', { class: 'input rev-num', type: 'number', min: '1', max: '100', step: '1',
      value: String(clampRev(revCfg.threshold)), 'data-probe': 'ai-review-threshold-num' });
    const revVal = h('span', { class: 'rev-val' }, revNum.value + '%');
    const paintRev = () => { revVal.textContent = clampRev(revNum.value) + '%'; };
    async function saveRev(patch, hint) {
      const snapshot = { enabled: revChk.checked, threshold: clampRev(revNum.value) };
      try {
        NF.settings = await window.nf.settings.set({ aiReview: patch });
        const saved = NF.settings.aiReview || {};
        const t = clampRev(saved.threshold);
        revChk.checked = saved.enabled !== false;
        revPill.textContent = revChk.checked ? '已开启' : '已关闭';
        revRange.value = String(t); revNum.value = String(t); paintRev();
        if (hint) toast(hint, 'ok');
      } catch (e) {
        revChk.checked = snapshot.enabled;
        revRange.value = String(snapshot.threshold); revNum.value = String(snapshot.threshold);
        revPill.textContent = revChk.checked ? '已开启' : '已关闭';
        paintRev();
        toast('保存 AI 审阅设置失败：' + ipcErr(e), 'err');
      }
    }
    revChk.addEventListener('change', () => saveRev(
      { enabled: revChk.checked }, revChk.checked ? '已开启 AI 人设审阅' : '已关闭 AI 人设审阅'));
    revRange.addEventListener('input', () => { revNum.value = revRange.value; paintRev(); });
    revRange.addEventListener('change', () => saveRev(
      { threshold: clampRev(revRange.value) }, '审阅阈值已设为 ' + clampRev(revRange.value) + '%'));
    revNum.addEventListener('change', () => saveRev(
      { threshold: clampRev(revNum.value) }, '审阅阈值已设为 ' + clampRev(revNum.value) + '%'));

    right.appendChild(h('div', { class: 'card' },
      h('div', { class: 'set-h' }, h('h3', {}, 'AI 人设审阅'), revPill),
      h('div', { class: 'set-b' },
        h('div', { class: 'set-row' },
          h('span', { class: 'lab' }, '自动审阅'),
          h('span', { class: 'val' },
            h('label', { class: 'ai-opt', style: { display: 'inline-flex', gap: '7px', alignItems: 'center', cursor: 'pointer' } },
              revChk, h('span', {}, '写完一章、新建下一章后自动审阅')))),
        h('div', { class: 'set-row' },
          h('span', { class: 'lab' }, '变化阈值'),
          h('span', { class: 'val' }, h('div', { class: 'rev-row' }, revRange, revNum, revVal))),
        h('div', { class: 'tiny muted' },
          '人设变化幅度超过阈值才提醒你决定；不超过阈值（默认 50%）就当作无需修改。每次修改都会弹窗由你选择采纳或忽略，AI 不会自动改人设。'),
        h('div', { class: 'set-note' },
          h('b', {}, '隐私：'), '审阅只把这一章正文和人物小传发给你在「模型接口」里配置的服务；不想用就关掉开关。'))));

    /* ---------- AI 助手图标 ----------
     * 章节写作 / 情节页右下角的悬浮按钮原本只能显示「AI」两个字。这里分别给它们换一张图：
     * 点上传走系统文件框 → 主进程压缩后存到配置目录的 ai-icons/ → 新的 settings 回包里带 data URL，
     * 于是预览当场刷新，之后两个页面挂载时直接读 NF.settings 就能贴上，不再多走一趟 IPC。 */
    const AI_ICON_FILTERS = [{ name: '图片（PNG / JPG / WebP）', extensions: ['png', 'jpg', 'jpeg', 'webp'] }];
    function aiIconRow(kind, label) {
      const prev = h('div', { class: 'ai-icon-prev', 'data-probe': 'ai-icon-prev-' + kind });
      const state = h('div', { class: 'ai-icon-state' });
      const up = h('button', { class: 'btn xs', 'data-probe': 'ai-icon-upload-' + kind });
      const reset = h('button', { class: 'btn xs', 'data-probe': 'ai-icon-reset-' + kind });

      function paint() {
        const icons = (NF.settings && NF.settings.ui && NF.settings.ui.aiIcons) || {};
        const src = icons[kind] || '';
        clear(prev);
        if (src) prev.appendChild(h('img', { src, alt: '', draggable: 'false' }));
        else prev.appendChild(document.createTextNode('AI'));
        state.textContent = src ? '已换成自定义图片（保存在本机）' : '当前是默认「AI」字标';
        reset.disabled = !src;
      }
      up.textContent = '上传图片…';
      up.onclick = async () => {
        up.disabled = true;
        try {
          const r = await window.nf.files.pick({ title: '选择「' + label + '」图标', filters: AI_ICON_FILTERS });
          if (!r || r.canceled || !r.file) return;
          NF.settings = await window.nf.settings.setAiIcon(kind, r.file);
          paint();
          toast(label + '图标已更新', 'ok');
        } catch (e) { toast('图标上传失败：' + ipcErr(e), 'err'); }
        finally { up.disabled = false; }
      };
      reset.textContent = '恢复默认';
      reset.onclick = async () => {
        reset.disabled = true;
        try {
          NF.settings = await window.nf.settings.clearAiIcon(kind);
          toast(label + '图标已恢复默认', 'ok');
        } catch (e) { toast(ipcErr(e), 'err'); }
        paint();
      };
      paint();
      return h('div', { class: 'ai-icon-row' },
        prev,
        h('div', { class: 'ai-icon-info' }, h('div', { class: 'ai-icon-name' }, label), state),
        h('div', { class: 'ai-icon-acts' }, up, reset));
    }

    right.appendChild(h('div', { class: 'card' },
      h('div', { class: 'set-h' }, h('h3', {}, 'AI 助手图标')),
      h('div', { class: 'set-b' },
        h('div', { class: 'set-note safe' },
          h('b', {}, '两个助手可以各用一张图：'),
          '章节写作右下角的「写作助手」和情节页右下角的「情节构思」分开设置。图片只存在这台电脑，不上传、不随书稿同步。'),
        aiIconRow('chapter', '章节写作 · 写作助手'),
        aiIconRow('plot', '情节页 · 构思助手'),
        h('div', { class: 'tiny muted' },
          '支持 PNG / JPG / WebP，上传后自动缩到 192 像素以内。恢复默认就变回原来的「AI」字标。'))));

    right.appendChild(h('div', { class: 'card' },
      h('div', { class: 'set-h' }, h('h3', {}, '在线更新'), h('span', { class: 'pill', id: 'updPill' }, '未检查')),
      h('div', { class: 'set-b', id: 'updBox' })));

    right.appendChild(h('div', { class: 'card' },
      h('div', { class: 'set-h' }, h('h3', {}, '关于')),
      h('div', { class: 'set-b' },
        h('div', { class: 'set-row' }, h('span', { class: 'lab' }, '版本'), h('span', { class: 'val' }, '卷帙 NovelFolio v' + (NF.info ? NF.info.version : '0.1.0'))),
        h('div', { class: 'set-row' }, h('span', { class: 'lab' }, '运行时'), h('span', { class: 'val tiny' }, NF.info ? ('Electron ' + NF.info.electron + ' · Chromium ' + NF.info.chrome + ' · Node ' + NF.info.node) : '')),
        h('div', { class: 'set-note' }, h('b', {}, '离线承诺：'), '除了你自己配置的模型接口，软件不向外发送任何数据；没有账号、没有统计、没有崩溃上报。'))));

    /* ---------- 在线更新 ----------
     * 便携版是一个 exe，发出去就没法自己变。这里让它自己去 GitHub Releases 查最新版：
     * 有新的就下载下来（校验 SHA256）、换掉自己再重启。全程只在用户点按钮时才联网。
     * 状态机：idle（还没查）→ checking → latest / available（有新版）→ downloading → staged（下好了）→ applying */
    function mountUpdateCard() {
      const box = document.getElementById('updBox');
      const pill = document.getElementById('updPill');
      if (!box) return;
      const W = window.nf.update;
      let st = { phase: 'idle' };        /* 本卡的状态 */
      let info = null;                    /* 最近一次 update:state / check 的结果 */
      let prog = null;                    /* 下载进度 */
      const setPill = (text, kind) => { pill.textContent = text; pill.className = 'pill' + (kind ? ' ' + kind : ''); };
      const pctText = p => Number.isFinite(p) ? Math.floor(p * 100) + '%' : '';
      const mb = n => (n / 1048576).toFixed(1) + ' MB';
      const relDate = iso => { try { return fmtDate(iso); } catch (e) { return ''; } };
      /* 下载完的校验结果：github = GitHub 公布的摘要，notes = 发布说明里的 SHA256 */
      const verifyText = v => ({
        'github': '已核对 GitHub 公布的 SHA256',
        'notes': '已核对发布说明的 SHA256',
        'github+notes': '已核对 SHA256（GitHub + 发布说明）',
        'size-only': '按文件大小核对（这次发布没提供摘要）'
      })[v] || '已校验';

      async function refreshState() {
        try { info = await W.state(); } catch (e) { info = null; }
        if (st.phase !== 'idle') { draw(); return; }
        /* 启动时主进程做过一次静默检查（app.js 里做的），结果在 lastCheck 里 —— 直接接着用，
         * 用户一进设置页就能看到「有新版本」，不用再点一次 */
        const lc = info && info.lastCheck;
        if (info && info.staged) st = { phase: 'staged', version: info.staged.version, verified: info.staged.verified };
        else if (lc && lc.dev) st = { phase: 'dev' };
        else if (lc && lc.ok === false) st = { phase: 'error', message: lc.message || '检查失败' };
        else if (lc && lc.hasUpdate) st = { phase: 'available', release: lc.release, latest: lc.latest };
        else if (lc && lc.ok && lc.skipped) st = { phase: 'skipped', version: lc.latest };
        else if (lc && lc.ok) st = { phase: 'latest', latest: lc.latest };
        draw();
      }

      async function doCheck() {
        st = { phase: 'checking' };
        setPill('检查中…');
        draw();
        let r;
        try { r = await W.check({}); } catch (e) { r = { ok: false, message: ipcErr(e) }; }
        info = Object.assign(info || {}, { lastCheck: r });
        if (!r || r.dev) { st = { phase: 'dev' }; }
        else if (!r.ok) { st = { phase: 'error', message: (r && r.message) || '检查失败' }; }
        else if (r.staged) { st = { phase: 'staged', version: r.staged.version, verified: r.staged.verified }; }
        else if (r.hasUpdate) { st = { phase: 'available', release: r.release, latest: r.latest }; }
        else { st = { phase: 'latest', latest: r.latest }; }
        draw();
      }

      async function doDownload() {
        const rel = st.release;
        if (!rel) return;
        st = { phase: 'downloading', release: rel, latest: rel.version };
        prog = { pct: 0 };
        draw();
        let r;
        try { r = await W.download(rel); } catch (e) { r = { ok: false, message: ipcErr(e) }; }
        prog = null;
        if (r && r.ok) { st = { phase: 'staged', version: r.version, verified: r.verified }; }
        else { st = { phase: 'error', message: (r && r.message) || '下载失败', release: rel }; }
        draw();
      }

      async function doInstall() {
        const version = st.version || (st.release && st.release.version) || '';
        st = { phase: 'applying', version };
        draw();
        let r;
        try { r = await W.apply(); } catch (e) { r = { ok: false, message: ipcErr(e) }; }
        if (!r || !r.ok) {
          st = { phase: 'error', message: (r && r.message) || '安装失败', version };
          draw();
          return;
        }
        /* 安装器已经在等本进程退出：倒数几秒给用户一个交代，然后自己关 */
        let n = 3;
        st = { phase: 'closing', version, left: n };
        draw();
        const tick = setInterval(async () => {
          n -= 1;
          st.left = n;
          draw();
          if (n <= 0) {
            clearInterval(tick);
            try { await W.quit(); } catch (e) {}
          }
        }, 1000);
      }

      async function doSkip() {
        const v = (st.release && st.release.version) || st.latest || '';
        try { await W.skip(v); } catch (e) {}
        st = { phase: 'skipped', version: v };
        draw();
      }

      function openReleases() {
        const url = (info && info.releasesUrl) || 'https://github.com/Andrianxu/novel-create/releases/latest';
        try { window.nf.image.openExternal(url); } catch (e) {}
      }

      function draw() {
        clear(box);
        const dev = info && info.dev;
        const cur = 'v' + ((info && info.current) || (NF.info ? NF.info.version : '0.1.0'));
        const progLine = () => {
          const p = prog && prog.phase === 'download' ? prog : null;
          const v = p ? pctText(p.pct) : (prog && prog.phase === 'verify' ? '正在校验' : '');
          const size = p && p.total ? (' ' + mb(p.received) + ' / ' + mb(p.total)) : '';
          return h('div', { class: 'tiny muted', style: { marginTop: '2px' } },
            '正在下载 v' + ((st.release && st.release.version) || '') + (size ? size : '') + (v ? ' · ' + v : ''));
        };
        const row = (...kids) => h('div', { class: 'set-row' }, ...kids);

        if (dev || st.phase === 'dev') {
          setPill('开发态', 'muted');
          box.appendChild(row(h('span', { class: 'lab' }, '当前版本'), h('span', { class: 'val' }, cur + '（源码运行）')));
          box.appendChild(h('div', { class: 'tiny muted' }, '开发态不检查更新；打包成 exe 之后，这里会自动去 GitHub 找最新版。'));
          return;
        }

        if (st.phase === 'idle') {
          setPill('未检查', 'muted');
          box.appendChild(row(h('span', { class: 'lab' }, '当前版本'), h('span', { class: 'val' }, cur)));
          box.appendChild(h('div', { class: 'presets' },
            h('span', { onclick: doCheck }, '检查更新'),
            h('span', { class: 'add', onclick: openReleases }, '打开发布页')));
          box.appendChild(h('div', { class: 'tiny muted' }, '点「检查更新」才会连 GitHub；不点就不联外网。'));
          return;
        }
        if (st.phase === 'checking') {
          setPill('检查中…');
          box.appendChild(row(h('span', { class: 'lab' }, '当前版本'), h('span', { class: 'val' }, cur)));
          box.appendChild(h('div', { class: 'tiny muted' }, '正在问 GitHub 有没有新版本…'));
          return;
        }
        if (st.phase === 'latest') {
          setPill('已是最新', 'ok');
          box.appendChild(row(h('span', { class: 'lab' }, '当前版本'), h('span', { class: 'val' }, cur)));
          box.appendChild(row(h('span', { class: 'lab' }, '最新版本'), h('span', { class: 'val' }, 'v' + (st.latest || ''))));
          box.appendChild(h('div', { class: 'presets' },
            h('span', { onclick: doCheck }, '再查一次'),
            h('span', { class: 'add', onclick: openReleases }, '打开发布页')));
          return;
        }
        if (st.phase === 'available') {
          const rel = st.release || {};
          setPill('有新版 v' + (rel.version || ''), 'new');
          box.appendChild(row(h('span', { class: 'lab' }, '当前版本'), h('span', { class: 'val' }, cur)));
          box.appendChild(row(h('span', { class: 'lab' }, '最新版本'),
            h('span', { class: 'val' }, 'v' + (rel.version || '')),
            h('span', { class: 'tiny muted' },
              [rel.size ? mb(rel.size) : '', rel.publishedAt ? relDate(rel.publishedAt) : ''].filter(Boolean).join(' · '))));
          box.appendChild(h('div', { class: 'presets' },
            h('span', { class: 'on', onclick: doDownload }, '下载并更新'),
            h('span', { onclick: doSkip }, '这个版本先不更新'),
            h('span', { class: 'add', onclick: openReleases }, '打开发布页')));
          box.appendChild(h('div', { class: 'set-note' }, h('b', {}, '怎么装：'),
            '下载的新版会先核对 SHA256，再替换掉这个 exe 并自动重启。书稿存在 %APPDATA%\\novelfolio，不受影响。'));
          return;
        }
        if (st.phase === 'downloading') {
          setPill('下载中…');
          box.appendChild(row(h('span', { class: 'lab' }, '当前版本'), h('span', { class: 'val' }, cur)));
          box.appendChild(progLine());
          box.appendChild(h('div', { class: 'tiny muted' }, '下载过程中可以继续写作，进度会一直在右边这里显示。'));
          return;
        }
        if (st.phase === 'skipped') {
          setPill('已忽略该版本', 'muted');
          box.appendChild(row(h('span', { class: 'lab' }, '当前版本'), h('span', { class: 'val' }, cur)));
          box.appendChild(h('div', { class: 'tiny muted' }, 'v' + (st.version || '') + ' 已经标记为「先不更新」，下次启动不会再提醒；想装的时候点「检查更新」就能重新看到它。'));
          box.appendChild(h('div', { class: 'presets' },
            h('span', { onclick: doCheck }, '检查更新'),
            h('span', { class: 'add', onclick: openReleases }, '打开发布页')));
          return;
        }
        if (st.phase === 'staged') {
          setPill('可以安装', 'ok');
          const v = st.version || '';
          box.appendChild(row(h('span', { class: 'lab' }, '当前版本'), h('span', { class: 'val' }, cur)));
          box.appendChild(row(h('span', { class: 'lab' }, '已下载'), h('span', { class: 'val' }, 'v' + v + '  '),
            h('span', { class: 'tiny muted' }, '校验：' + verifyText(st.verified))));
          box.appendChild(h('div', { class: 'presets' },
            h('span', { class: 'on', onclick: doInstall }, '立即重启安装'),
            h('span', { class: 'add', onclick: openReleases }, '打开发布页')));
          box.appendChild(h('div', { class: 'tiny muted' }, '点「立即重启安装」会关掉卷帙，换上新版后自动重新打开。'));
          return;
        }
        if (st.phase === 'applying' || st.phase === 'closing') {
          setPill('安装中');
          box.appendChild(row(h('span', { class: 'lab' }, '正在安装'), h('span', { class: 'val' }, 'v' + (st.version || ''))));
          box.appendChild(h('div', { class: 'tiny muted' }, st.phase === 'closing'
            ? ('卷帙会在 ' + Math.max(0, st.left || 0) + ' 秒后关闭，换好新版再自己打开。书稿都已经保存好了。')
            : '正在准备退出…'));
          return;
        }
        /* error */
        setPill('出错了', 'err');
        box.appendChild(row(h('span', { class: 'lab' }, '当前版本'), h('span', { class: 'val' }, cur)));
        box.appendChild(h('div', { class: 'set-note' }, h('b', {}, '没能更新：'), st.message || '未知错误'));
        box.appendChild(h('div', { class: 'presets' },
          h('span', { onclick: doCheck }, '重新检查'),
          h('span', { class: 'add', onclick: openReleases }, '打开发布页手动下载')));
      }

      /* 下载进度事件（主进程推过来的），不在下载态时忽略 */
      try {
        window.nf.on('update:progress', d => {
          if (!d) return;
          if (d.phase === 'applying') return;
          if (st.phase !== 'downloading') return;
          prog = d;
          draw();
        });
      } catch (e) {}

      refreshState();
    }
    mountUpdateCard();
  }
};
