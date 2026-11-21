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
    const cfg = { baseUrl: llm.baseUrl || '', model: llm.model || '', temperature: llm.temperature != null ? llm.temperature : 0.3, maxTokens: llm.maxTokens || 2000 };

    const presetRow = h('div', { class: 'presets' });
    const baseIn = h('input', { class: 'input', value: cfg.baseUrl, placeholder: 'https://api.deepseek.com/v1' });
    const modelIn = h('input', { class: 'input', value: cfg.model, placeholder: 'deepseek-chat' });
    const tempIn = h('input', { class: 'input', type: 'number', step: '0.1', min: '0', max: '1.5', value: String(cfg.temperature) });
    const tokenIn = h('input', { class: 'input', type: 'number', step: '100', min: '200', max: '8000', value: String(cfg.maxTokens) });

    PRESETS.forEach(p => {
      const sp = h('span', { class: cfg.baseUrl === p.baseUrl ? 'on' : '' }, p.name);
      sp.onclick = () => {
        baseIn.value = p.baseUrl; modelIn.value = p.model;
        Array.from(presetRow.children).forEach(c => c.classList.remove('on'));
        sp.classList.add('on');
      };
      presetRow.appendChild(sp);
    });

    const keyIn = h('input', { class: 'input', type: 'password', placeholder: S.hasApiKey ? '已保存：' + S.keyMasked + '（留空则不修改）' : 'sk-…' });
    const keyState = h('span', { class: 'kbadge' },
      h('span', { class: 'dot', style: { background: S.hasApiKey ? '#2F6F63' : '#A8322A' } }),
      S.hasApiKey ? '已配置 ' + S.keyMasked : '未配置');
    const testOut = h('div', { class: 'tiny muted' }, '');

    const saveBtn = h('button', { class: 'btn pri', onclick: async () => {
      saveBtn.disabled = true;
      try {
        if (keyIn.value.trim()) await window.nf.settings.setApiKey(keyIn.value.trim());
        NF.settings = await window.nf.settings.set({
          llm: { baseUrl: baseIn.value.trim(), model: modelIn.value.trim(), temperature: parseFloat(tempIn.value) || 0.3, maxTokens: parseInt(tokenIn.value, 10) || 2000 }
        });
        keyIn.value = '';
        keyState.innerHTML = '';
        keyState.appendChild(h('span', { class: 'dot', style: { background: NF.settings.hasApiKey ? '#2F6F63' : '#A8322A' } }));
        keyState.appendChild(document.createTextNode(NF.settings.hasApiKey ? '已配置 ' + NF.settings.keyMasked : '未配置'));
        keyIn.placeholder = NF.settings.hasApiKey ? '已保存：' + NF.settings.keyMasked + '（留空则不修改）' : 'sk-…';
        toast('接口设置已保存（只存在本机）', 'ok');
      } catch (e) { toast(e.message, 'err'); }
      saveBtn.disabled = false;
    } }, '保存设置');

    const testBtn = h('button', { class: 'btn', onclick: async () => {
      testBtn.disabled = true;
      testOut.textContent = '正在连接…';
      try {
        await window.nf.settings.setApiKey(keyIn.value.trim() || '');
        await window.nf.settings.set({ llm: { baseUrl: baseIn.value.trim(), model: modelIn.value.trim() } });
        NF.settings = await window.nf.settings.get();
        const r = await window.nf.llm.test();
        testOut.textContent = '连接成功 · 模型返回「' + r.reply + '」· ' + r.baseUrl;
        toast('接口可用', 'ok');
      } catch (e) {
        testOut.textContent = '连接失败：' + e.message;
        toast('接口不可用：' + e.message, 'err');
      }
      testBtn.disabled = false;
    } }, '测试连接');

    const clearKeyBtn = h('button', { class: 'btn', onclick: async () => {
      await window.nf.settings.clearApiKey();
      NF.settings = await window.nf.settings.get();
      keyState.innerHTML = '';
      keyState.appendChild(h('span', { class: 'dot', style: { background: '#A8322A' } }));
      keyState.appendChild(document.createTextNode('未配置'));
      toast('已清除本机保存的 Key', 'ok');
    } }, '清除 Key');

    left.appendChild(h('div', { class: 'card' },
      h('div', { class: 'set-h' }, h('h3', {}, '模型接口（拆书用）'), h('span', { class: 'pill ' + (S.hasApiKey ? 'jade' : 'seal') }, S.hasApiKey ? '可用' : '未配置')),
      h('div', { class: 'set-b' },
        h('div', { class: 'set-note safe' },
          h('b', {}, '关于隐私：'),
          '这个 Key 只保存在你自己电脑上的 ',
          h('code', { class: 'mono tiny' }, NF.info ? NF.info.userData + '\\secrets.bin' : '本机用户目录'),
          '（经系统 DPAPI 加密），',
          h('b', {}, '不会写进项目目录、不会进 Git、也不会回传到界面或日志'),
          '。仓库里只有 .gitignore 和 .env.example，克隆下来的人必须自己填 Key 才能用拆书。'),
        h('div', { class: 'presets-wrap' }, h('div', { class: 'tiny muted', style: { marginBottom: '5px' } }, '常用服务（都是 OpenAI 兼容接口）'), presetRow),
        h('div', { class: 'field' }, h('label', {}, '接口地址 Base URL'), baseIn),
        h('div', { class: 'field' }, h('label', {}, '模型名'), modelIn),
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
