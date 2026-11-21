import { h, clear, toast, injectStyle, uid, debounce, words, ago } from '../util.js';

injectStyle('chapter', `
.ch-wrap{flex:1;min-width:0;display:flex}
.ch-side{width:252px;flex:none;background:#F1EADA;border-right:1px solid #DFD4BF;display:flex;flex-direction:column;padding:10px 9px;gap:4px;overflow:auto}
.ch-vol{display:flex;align-items:center;gap:7px;padding:6px 7px;border-radius:8px;cursor:pointer;font-size:12px}
.ch-vol:hover{background:rgba(255,255,255,.5)}
.ch-vol.on{background:#FFFCF5;box-shadow:inset 0 0 0 1px #DFD4BF}
.ch-vol small{margin-left:auto;font-size:9.5px;color:#8C8272}
.ch-doc{display:flex;gap:6px;align-items:center;padding:5px 7px 5px 20px;border-radius:7px;cursor:pointer;font-size:11.5px;color:#5B5348}
.ch-doc:hover{background:rgba(255,255,255,.55)}
.ch-doc.on{background:#FFFCF5;box-shadow:inset 0 0 0 1px #DFD4BF;color:#201C18}
.ch-doc .grow{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ch-plots{display:flex;flex-direction:column;gap:1px;padding:2px 0 4px 34px}
.ch-plot{display:flex;align-items:center;gap:6px;padding:3px 7px;border-radius:6px;cursor:pointer;font-size:10.5px;color:#6B6357;min-width:0}
.ch-plot:hover{background:rgba(255,255,255,.6);color:#201C18}
.ch-plot.on{background:#F3EBDA;color:#201C18}
.ch-plot i{width:6px;height:6px;border-radius:50%;flex:none;background:var(--jade)}
.ch-plot.later i{border:1px dashed #C9973C;background:transparent}
.ch-plot.ending i{border-radius:1px;background:var(--seal);transform:rotate(45deg)}
.ch-plot span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ch-plot small{margin-left:auto;font-size:9px;color:#A99C84;flex:none}
.ch-vplot{display:flex;align-items:center;gap:6px;padding:2px 7px 2px 20px;border-radius:6px;cursor:pointer;font-size:10px;color:#8C8272;min-width:0}
.ch-vplot:hover{background:rgba(255,255,255,.55);color:#5B5348}
.ch-vplot span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ch-main{flex:1;min-width:0;display:flex;flex-direction:column;padding:12px 18px 0}
.ch-top{display:flex;align-items:center;gap:10px;padding-bottom:10px;border-bottom:1px solid #EAE1CF}
.ch-title{font-family:var(--kai);font-size:21px;border:none;background:transparent;outline:none;flex:1;min-width:0;color:#201C18;letter-spacing:.04em}
.ch-title::placeholder{color:#B6AB98}
.ch-editor{flex:1;min-height:0;width:100%;border:none;outline:none;resize:none;background:transparent;
  font-family:var(--kai);font-size:17px;line-height:2.05;color:#2A2521;padding:18px 2px;letter-spacing:.02em}
.ch-editor::placeholder{color:#BDB3A0}
.ch-foot{display:flex;align-items:center;gap:14px;padding:8px 2px;border-top:1px solid #EAE1CF;font-size:10.5px;color:#8C8272}
.ch-focus .ch-side{display:none}
.ch-focus .ch-editor{font-size:19px;max-width:820px;margin:0 auto;padding-top:28px}
.ch-focus .ch-top,.ch-focus .ch-foot{max-width:820px;margin:0 auto;width:100%}
.ch-empty{flex:1;display:grid;place-items:center;color:#8C8272;font-size:12px}
/* 正文里标出的情节对应内容：textarea 下面垫一层高亮影子，字色透明只露底色 */
.ch-ed{position:relative;flex:1;min-height:0;display:flex}
.ch-ed-hl{position:absolute;inset:0;overflow:hidden;pointer-events:none;padding:18px 2px;
  font-family:var(--kai);font-size:17px;line-height:2.05;letter-spacing:.02em;white-space:pre-wrap;word-break:break-word;
  color:transparent;background:transparent}
.ch-ed-hl mark{background:rgba(201,151,60,.30);color:transparent;border-radius:3px;
  box-shadow:0 0 0 1px rgba(201,151,60,.55);animation:chHlIn .5s ease}
@keyframes chHlIn{from{background:rgba(201,151,60,.72)}to{background:rgba(201,151,60,.30)}}
.ch-focus .ch-ed-hl{font-size:19px;max-width:820px;margin:0 auto;padding-top:28px}
.ch-hlbar{display:flex;align-items:center;gap:8px;font-size:10.5px;color:#7A6A4E;background:#FBF3DF;
  border:1px solid #E7D6AF;border-radius:8px;padding:5px 9px;margin:8px 0 0}
.ch-hlbar b{font-weight:700;color:#201C18}
.ch-hlbar .x{margin-left:auto;cursor:pointer;color:#A99C84;font-size:13px;line-height:1;padding:0 2px}
.ch-hlbar .x:hover{color:var(--ink)}
.ch-hlbar .miss{color:#A9542A}

/* ---------- 右下角 AI 写作助手 ---------- */
.ch-ai{position:fixed;right:18px;bottom:40px;z-index:60;display:flex;flex-direction:column;align-items:flex-end;gap:10px}
.ch-ai-fab{width:54px;height:54px;border-radius:50%;border:1px solid #CBB894;background:var(--ink);color:var(--paper);
  font-family:var(--kai);font-size:15px;letter-spacing:.06em;cursor:pointer;box-shadow:0 10px 26px rgba(50,35,20,.26);transition:transform .12s}
.ch-ai-fab:hover{background:#2E2823;transform:translateY(-1px)}
.ch-ai-panel{width:376px;max-height:min(640px,74vh);display:none;flex-direction:column;background:var(--panel);
  border:1px solid #DFD4BF;border-radius:14px;box-shadow:0 24px 60px rgba(50,35,20,.24);overflow:hidden}
.ch-ai.open .ch-ai-panel{display:flex}
.ch-ai.open .ch-ai-fab{display:none}
.ch-ai-h{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #EAE1CF;background:#FBF6EA}
.ch-ai-h h3{margin:0;font-family:var(--kai);font-size:13.5px;letter-spacing:.08em;color:#201C18}
.ch-ai-model{font-size:9.5px;color:#8C8272;background:#F1EADA;border:1px solid #EAE1CF;border-radius:999px;padding:1px 7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px}
.ch-ai-x{margin-left:auto;cursor:pointer;color:var(--muted);font-size:14px;line-height:1;padding:0 2px}
.ch-ai-x:hover{color:var(--ink)}
.ch-ai-log{flex:1;min-height:140px;overflow:auto;padding:11px 12px;display:flex;flex-direction:column;gap:9px;background:#FFFDF8}
.ch-ai-item{display:flex;flex-direction:column;gap:3px;max-width:100%}
.ch-ai-item.user{align-items:flex-end}
.ch-ai-item.assistant,.ch-ai-item.note{align-items:flex-start}
.ch-ai-msg{font-size:12px;line-height:1.78;padding:7px 10px;border-radius:9px;white-space:pre-wrap;word-break:break-word;max-width:100%}
.ch-ai-item.user .ch-ai-msg{background:#F1E7D3;border:1px solid #E4D6B9;color:#3B342C}
.ch-ai-item.assistant .ch-ai-msg{background:#FFF;border:1px solid #EAE1CF;color:#2A2521}
.ch-ai-item.note .ch-ai-msg{background:transparent;border:1px dashed #E4DCCB;color:var(--muted);font-size:10.5px;line-height:1.7;padding:6px 9px}
.ch-ai-tools{display:flex;gap:10px;font-size:10.5px;color:var(--jade)}
.ch-ai-tools span{cursor:pointer;text-decoration:underline}
.ch-ai-tools span:hover{color:#23604F}
.ch-ai-quick{display:flex;gap:5px;flex-wrap:wrap;padding:8px 12px 0;background:#FBF6EA}
.ch-ai-chip{font-size:10.5px;padding:3px 8px;border-radius:999px;border:1px solid #DFD4BF;background:#FFFCF5;color:#5B5348;cursor:pointer}
.ch-ai-chip:hover{background:#F7EBD3;border-color:#CBB894}
.ch-ai-f{padding:8px 12px 10px;background:#FBF6EA;display:flex;flex-direction:column;gap:6px}
.ch-ai-in{width:100%;min-height:54px;max-height:120px;resize:vertical;font:inherit;font-size:12px;line-height:1.7;padding:6px 8px;
  border:1px solid #DFD4BF;border-radius:8px;background:#FFFDF8;outline:none;color:#2A2521}
.ch-ai-in:focus{border-color:#C2A97D;box-shadow:0 0 0 3px rgba(185,138,60,.12)}
.ch-ai-row{display:flex;align-items:center;gap:8px;font-size:10px;color:#8C8272}
.ch-ai-opt{display:inline-flex;align-items:center;gap:5px;cursor:pointer;font-size:10.5px;color:#5B5348}
.ch-ai-opt input{width:12px;height:12px;accent-color:#2F6F63;margin:0}
`);

export default {
  id: 'chapter', label: '章节写作',
  statusText(doc) { return '稿件 ' + ((doc.manuscripts || []).length) + ' 篇 · 共 ' + ((doc.manuscripts || []).reduce((a, m) => a + words(m.content), 0)) + ' 字'; },
  unmount() { if (this._cleanup) { this._cleanup(); this._cleanup = null; } },
  mount(root, ctx) {
    const { doc, NF } = ctx;
    doc.manuscripts = doc.manuscripts || [];
    doc.chapters = doc.chapters || [];
    const st = { vol: (doc.chapters[0] || {}).id || null, id: ctx.params.id || null, focus: false };
    if (!st.id) {
      const first = doc.manuscripts.find(m => m.volumeId === st.vol) || doc.manuscripts[0];
      st.id = first ? first.id : null;
    }

    const wrap = h('div', { class: 'ch-wrap' });
    const side = h('aside', { class: 'ch-side', 'data-probe': 'chapter-side' });
    const main = h('main', { class: 'ch-main', 'data-probe': 'chapter-main' });
    wrap.appendChild(side); wrap.appendChild(main); root.appendChild(wrap);

    const cur = () => doc.manuscripts.find(m => m.id === st.id);
    const saveDebounced = debounce(() => NF.save(), 700);

    /* AI 助手用到的几个可变引用：编辑器、面板、聊天记录和请求状态 */
    let edRef = null;      /* 当前正文 textarea，AI 改完要回写它 */
    let dock = null;       /* 整个右下角挂件 */
    let logBox = null;     /* 对话滚动区 */
    let busy = false;      /* 正在等模型回复 */
    let aiReady = false;   /* 挂件是否已经建好 */
    let abortCtrl = null;
    const aiHistory = [];  /* { role:'user'|'assistant', content }，只在本页存活 */

    /* ---------- 情节 ↔ 章节的对照 ----------
     * 情节页只用一个自由字段记录「第几章」，这里在需要时把它解析成章号去匹配稿件标题。
     * 匹配不到就归到卷级，至少还能看见。 */
    const CN_NUM = { 〇: 0, 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
    function cnToInt(cn) {
      if (!cn) return 0;
      let total = 0, cur = 0;
      for (const ch of cn) {
        if (ch === '十') { total += (cur || 1) * 10; cur = 0; }
        else if (ch === '百') { total += (cur || 1) * 100; cur = 0; }
        else if (CN_NUM[ch] != null) cur = CN_NUM[ch];
        else return 0;
      }
      return total + cur;
    }
    /* 「第18章」「第十八章」「18」都能认出章号 */
    function chNum(v) {
      const t = String(v || '');
      const ar = t.match(/第\s*(\d+)\s*[章回节]/);
      if (ar) return Number(ar[1]);
      const cn = t.match(/第\s*([〇零一二三四五六七八九十百]+)\s*[章回节]/);
      if (cn) return cnToInt(cn[1]);
      const bare = t.match(/(\d+)/);
      return bare ? Number(bare[1]) : 0;
    }
    const plotById = id => (doc.plots || []).find(p => p.id === id);
    const plotsSorted = () => (doc.plots || []).slice().sort((a, b) => (Number(a.timePoint) || 0) - (Number(b.timePoint) || 0));
    function plotStatusCls(p) { return p.status === 'ending' ? 'ending' : p.status === 'done' ? 'done' : 'later'; }
    function plotStatusLabel(p) { return p.status === 'ending' ? '结局' : p.status === 'done' ? '已发生' : '计划'; }
    const manuscriptNo = m => chNum(m.title) || (m.chapterNo || 0);
    /* 卷 → 这些稿件的章号区间（取卷内最小 / 最大章号） */
    function volumeRange(vid) {
      const ms = doc.manuscripts.filter(m => m.volumeId === vid).map(manuscriptNo).filter(Boolean);
      if (!ms.length) return null;
      return { min: Math.min(...ms), max: Math.max(...ms) };
    }
    /* 这个情节属于哪一篇稿件（返回稿件 id 或 null=卷级） */
    function plotManuscript(p, vid) {
      const no = chNum(p.chapter);
      if (!no) return null;
      const hit = doc.manuscripts.find(m => m.volumeId === vid && manuscriptNo(m) === no);
      return hit ? hit.id : null;
    }
    /* ================= 点情节 → 在正文里标出对应内容 =================
     * 不再跳到情节页：在正文 textarea 下面垫一层同样排版的影子（ch-ed-hl），
     * 把命中的段落包进 <mark>，正文里那块底色就亮起来，且会把视角滚过去。 */
    let hlLayer = null;      /* 正文下面的高亮影子层 */
    let hlHost = null;       /* 放提示条的小容器 */
    let hlRef = null;        /* { start, end, plotId } 当前标出的区间 */
    let hlBar = null;        /* 正文上方的提示条 */

    /* 在正文里找这一段情节对应的文字：
     * 1) 摘要里的一句话 / 情节名，能在正文里原样找到 → 命中那句
     * 2) 否则按关键词出现次数挑段落（关键词 = 情节名 + 摘要里的二字词 + 人物名） */
    const PUNCT = /[\s，。！？、；：“”‘’（）《》…—·\-"'.,!?;:()\[\]{}]/;
    function findRange(text, p) {
      if (!text) return null;
      const probes = [];
      const sum = String(p.summary || '').trim();
      const ttl = String(p.title || '').trim();
      if (sum) {
        sum.split(/[。！？\n；]/).map(s => s.trim()).filter(s => s.length >= 4).forEach(s => probes.push(s));
      }
      if (ttl.length >= 2) probes.push(ttl);
      for (const pr of probes) {
        const at = text.indexOf(pr);
        if (at >= 0) return { start: at, end: at + pr.length, kind: 'quote', text: pr };
      }
      /* 关键词打分：按段落切 */
      const kw = new Set();
      if (ttl.length >= 2) kw.add(ttl);
      (sum.match(/[\u4e00-\u9fa5]{2,4}/g) || []).forEach(w => { if (w.length >= 2) kw.add(w); });
      (p.characterIds || []).forEach(id => { const c = (doc.characters || []).find(x => x.id === id); if (c && c.name) kw.add(c.name); });
      const keys = Array.from(kw);
      if (!keys.length) return null;
      const paras = [];
      let off = 0;
      text.split('\n').forEach(line => {
        if (line.trim()) paras.push({ start: off, end: off + line.length, line });
        off += line.length + 1;
      });
      let best = null, bestScore = 0;
      paras.forEach(pa => {
        let sc = 0;
        keys.forEach(k => { let i = pa.line.indexOf(k); while (i >= 0) { sc += k.length >= 3 ? 2 : 1; i = pa.line.indexOf(k, i + 1); } });
        if (sc > bestScore) { bestScore = sc; best = pa; }
      });
      if (!best || !bestScore) return null;
      return { start: best.start, end: best.end, kind: 'para', text: best.line };
    }

    function escHtml(s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    /* 重画高亮影子 */
    function paintHl() {
      const box = hlLayer;
      if (!box) return;
      const ed2 = edRef;
      if (!ed2) { clear(box); return; }
      const val = ed2.value || '';
      if (!hlRef) { clear(box); return; }
      const s = Math.max(0, Math.min(val.length, hlRef.start));
      const e2 = Math.max(s, Math.min(val.length, hlRef.end));
      const before = escHtml(val.slice(0, s));
      const hit = escHtml(val.slice(s, e2));
      const after = escHtml(val.slice(e2));
      /* textarea 末尾的换行会被吃掉，补一个换行让影子高度对齐 */
      box.innerHTML = before + '<mark>' + hit + '</mark>' + after + '\n';
    }
    function scrollToHl() {
      const ed2 = edRef;
      if (!ed2 || !hlRef) return;
      const val = ed2.value || '';
      if (!val) return;
      /* 用「影子层里 mark 的位置」换算成滚动距离：按行号估算更稳 */
      const idx = Math.min(hlRef.start, val.length);
      const upto = val.slice(0, idx);
      const lines = upto.split('\n').length - 1;
      const lineH = 2.05 * 17;
      const top = Math.max(0, lines * lineH - ed2.clientHeight * 0.3);
      ed2.scrollTop = top;
      if (hlLayer) hlLayer.scrollTop = top;
      ed2.blur();
      ed2.focus({ preventScroll: true });
      ed2.setSelectionRange(hlRef.start, hlRef.end);
    }
    function clearHl() {
      hlRef = null;
      if (hlLayer) clear(hlLayer);
      if (hlBar && hlBar.parentNode) hlBar.remove();
      hlBar = null;
    }
    /* 点侧栏情节：标正文 */
    function focusPlot(p) {
      if (!p) return;
      /* 若这篇情节不在当前稿件里，先切到它对应的稿件 */
      const curM = cur();
      if (curM) {
        const target = plotManuscript(p, curM.volumeId || st.vol);
        if (target && target !== curM.id) {
          const tm = doc.manuscripts.find(x => x.id === target);
          if (tm) { st.id = tm.id; st.vol = tm.volumeId; renderSide(); renderMain(); }
        }
      }
      const m2 = cur();
      const text = (m2 && m2.content) || '';
      const r = findRange(text, p);
      if (!r) {
        clearHl();
        toast('这一章正文里还没找到「' + (p.title || '该情节') + '」对应的内容，先写出来再点我', 'err');
        return;
      }
      hlRef = { start: r.start, end: r.end, plotId: p.id };
      paintHl();
      scrollToHl();
      renderHlBar(p, r);
    }
    function renderHlBar(p, r) {
      if (hlBar && hlBar.parentNode) hlBar.remove();
      hlBar = h('div', { class: 'ch-hlbar' },
        h('b', {}, '情节「' + p.title + '」'),
        h('span', {}, r.kind === 'quote' ? '已在正文里标出对应文字' : '正文里没找到原句，已标出最相关的一段'),
        h('span', { class: 'grow' }),
        h('span', { class: 'x', title: '取消标记', onclick: () => { clearHl(); if (hlHost && hlHost.parentNode) hlHost.style.display = 'none'; } }, '✕'));
      if (hlHost) { clear(hlHost); hlHost.appendChild(hlBar); hlHost.style.display = ''; }
    }

    function renderSide() {
      clear(side);
      const plots = plotsSorted();
      side.appendChild(h('div', { class: 'row', style: { padding: '0 4px 6px' } },
        h('div', { style: { fontSize: '12px', fontWeight: '700' } }, '正文'),
        h('div', { class: 'grow' }),
        h('button', { class: 'btn xs', onclick: () => NF.go('plot'), title: '去情节页管理时间轴' }, '情节 ' + (doc.plots || []).length),
        h('button', { class: 'btn xs', onclick: addVolume }, '＋ 卷')));
      doc.chapters.forEach(v => {
        const range = volumeRange(v.id);
        const volPlots = plots.filter(p => {
          const no = chNum(p.chapter);
          return range && no >= range.min && no <= range.max && plotManuscript(p, v.id) === null;
        });
        side.appendChild(h('div', { class: 'ch-vol' + (v.id === st.vol ? ' on' : ''), onclick: () => { st.vol = v.id; renderSide(); } },
          h('span', {}, v.title),
          h('small', {}, (doc.manuscripts.filter(m => m.volumeId === v.id).length) + ' 篇')));
        if (v.id === st.vol) {
          doc.manuscripts.filter(m => m.volumeId === v.id).forEach(m => {
            side.appendChild(h('div', { class: 'ch-doc' + (m.id === st.id ? ' on' : ''), onclick: () => { st.id = m.id; renderSide(); renderMain(); } },
              h('span', { class: 'grow' }, m.title || '未命名'),
              h('span', { class: 'tiny muted' }, words(m.content) + ' 字')));
            /* 这一章挂的情节，点一下跳去情节页 */
            const mine = plots.filter(p => plotManuscript(p, v.id) === m.id);
            if (mine.length) {
              side.appendChild(h('div', { class: 'ch-plots' }, mine.map(p => h('div', {
                class: 'ch-plot ' + plotStatusCls(p),
                title: (p.summary || p.title) + ' · 时间点 ' + (p.timePoint == null ? '—' : p.timePoint) + '（点击在正文里标出）',
                onclick: () => focusPlot(p)
              }, h('i', {}), h('span', {}, p.title), h('small', {}, plotStatusLabel(p))))));
            }
          });
          side.appendChild(h('div', { class: 'ch-doc', style: { color: '#2F6F63' }, onclick: addDoc }, '＋ 新的章节'));
          /* 标了卷但没对上具体章节的情节，单独列在卷底下 */
          if (volPlots.length) {
            side.appendChild(h('div', { class: 'ch-vplot', style: { cursor: 'default', fontSize: '9px', letterSpacing: '.1em' } }, '本卷情节（未对上章节）'));
            volPlots.forEach(p => side.appendChild(h('div', {
              class: 'ch-vplot',
              title: (p.summary || p.title) + '（点击在正文里标出）',
              onclick: () => focusPlot(p)
            }, h('i', { style: { width: '6px', height: '6px', borderRadius: '50%', background: p.status === 'ending' ? 'var(--seal)' : p.status === 'later' ? '#C9973C' : 'var(--jade)', flex: 'none' } }), h('span', {}, p.title), h('small', { style: { marginLeft: 'auto', fontSize: '9px', color: '#A99C84' } }, p.chapter || ''))));
          }
        }
      });
      side.appendChild(h('div', { style: { marginTop: 'auto' } },
        h('div', { class: 'tiny muted', style: { lineHeight: '1.7', padding: '8px 4px' } },
          '写的时候按 Ctrl+S 立刻保存；关掉软件也会自动存。每 5 分钟生成一份备份，可在设置里恢复。')));
    }

    function renderMain() {
      clear(main);
      const m = cur();
      if (!m) {
        main.appendChild(h('div', { class: 'ch-empty' }, '左边还没有章节，点「＋ 卷」再「＋ 新的章节」开始写'));
        return;
      }
      const titleIn = h('input', { class: 'ch-title', value: m.title || '', placeholder: '章节标题' });
      titleIn.addEventListener('input', () => { m.title = titleIn.value; saveDebounced(); renderSideSoon(); });
      const ed = h('textarea', { class: 'ch-editor', placeholder: '从这里开始写…', spellcheck: 'false' });
      ed.value = m.content || '';
      edRef = ed;
      /* 高亮影子层：和 textarea 同样字号排版，只用来露底色 */
      const hl = h('div', { class: 'ch-ed-hl', 'aria-hidden': 'true' });
      hlLayer = hl;
      hlHost = h('div', { style: { display: 'none' } });
      const cnt = h('span', {}, '');
      const upd = () => {
        const w = words(ed.value);
        cnt.textContent = w.toLocaleString() + ' 字 · ' + ed.value.split('\n').length + ' 段';
      };
      ed.addEventListener('input', () => { m.content = ed.value; m.updatedAt = new Date().toISOString(); upd(); saveDebounced(); if (hlRef) paintHl(); });
      ed.addEventListener('scroll', () => { if (hlLayer) hlLayer.scrollTop = ed.scrollTop; });
      upd();
      const delBtn = h('button', { class: 'btn xs', onclick: () => {
        if (!confirm('把这篇移入废案篓？内容会保留，可以恢复。')) return;
        doc.scraps = doc.scraps || [];
        doc.scraps.unshift({ id: uid('x'), kind: 'chapter', title: m.title, origin: '章节写作', reason: '手动移入', removedAt: new Date().toISOString(), summary: (m.content || '').slice(0, 60), payload: m });
        doc.manuscripts = doc.manuscripts.filter(x => x.id !== m.id);
        st.id = (doc.manuscripts.find(x => x.volumeId === st.vol) || {}).id || null;
        NF.save(); renderSide(); renderMain(); toast('已移入废案篓', 'ok');
      } }, '移入废案');
      main.appendChild(h('div', { class: 'ch-top' },
        titleIn,
        h('span', { class: 'pill' }, ago(m.updatedAt)),
        h('button', { class: 'btn xs', onclick: () => { st.focus = !st.focus; wrap.classList.toggle('ch-focus', st.focus); } }, '专注'),
        delBtn));
      main.appendChild(hlHost);
      main.appendChild(h('div', { class: 'ch-ed' }, hl, ed));
      main.appendChild(h('div', { class: 'ch-foot' },
        cnt,
        h('span', {}, '自动保存'),
        h('span', { class: 'grow' }),
        h('span', { class: 'tiny' }, 'Ctrl+S 立即保存')));
      setTimeout(() => ed.focus(), 30);
      if (aiReady && dock.classList.contains('open')) renderLog();
    }

    let sideTimer = null;
    const renderSideSoon = () => { clearTimeout(sideTimer); sideTimer = setTimeout(renderSide, 400); };

    function addDoc() {
      const m = { id: uid('m'), volumeId: st.vol, title: '新章节', content: '', updatedAt: new Date().toISOString() };
      doc.manuscripts.push(m); st.id = m.id; NF.save(); renderSide(); renderMain();
    }
    function addVolume() {
      const t = prompt('卷名（例如：卷四 · 无界海）');
      if (!t) return;
      const v = { id: uid('v'), title: t, status: 'plan', words: 0 };
      doc.chapters.push(v); st.vol = v.id; NF.save(); renderSide();
    }

    /* ================= 右下角 AI 写作助手 ================= */
    const AI_QUICK = ['续写 300 字', '按上一段风格接着写', '把这段改得更有画面感', '精简这段，去掉套话', '写一个过渡段'];
    const AI_PROMPT = [
      '你是中文长篇小说写作助手，正和作者在写作软件里协作。',
      '你的输出会被**直接写进正文**，所以：',
      '1) 只输出小说正文本身，不要任何解释、前言、标题、markdown 标记或「好的」之类的客套；',
      '2) 严格延续作者的文风、人称、时态与人物口吻，与已有正文自然衔接；',
      '3) 除作者明确要求缩短外，不要用省略号敷衍带过；对话另起一段；',
      '4) 作者给了要求就照要求写，没给要求就顺着上下文往下写。'
    ].join('\n');

    function plane() { return (doc.planes && doc.planes[0]) || null; }

    /* 拼给模型的上下文：当前正文（按需截尾）+ 出场人物 + 修为体系 */
    function buildContext(m) {
      const content = (m.content || '').trim();
      const limit = (doc.settings && doc.settings.ai && doc.settings.ai.ctxLimit) || 4000;
      const tail = content.length > limit ? '（前文过长，只节选最后 ' + limit + ' 字）\n' + content.slice(-limit) : content;
      const p = plane();
      const people = (doc.characters || []).slice(0, 24).map(c => {
        const bits = [c.name];
        if (c.identity) bits.push(c.identity);
        if (c.persona) bits.push(c.persona);
        return '- ' + bits.join('：');
      }).join('\n');
      const realms = p && p.realms && p.realms.length ? p.realms.map(r => r.name).filter(Boolean).join(' → ') : '';
      return [
        AI_PROMPT,
        '',
        '【当前章节】' + (m.title || '未命名'),
        realms ? '【修为体系】' + realms : '',
        people ? '【人物】\n' + people : '',
        tail ? '【当前正文】\n' + tail : '【当前正文】（还是空的，这是新章节，请直接开篇）'
      ].filter(Boolean).join('\n');
    }

    function renderLog() {
      if (!logBox) return;
      clear(logBox);
      if (!aiHistory.length) {
        logBox.appendChild(h('div', { class: 'ch-ai-item note' },
          h('div', { class: 'ch-ai-msg' },
            '告诉我你想写什么，比如「续写：沈砚清进入听雨楼，遇到云无咎」。' +
            '\n写好的内容会直接插进正文；如果选中了一段文字，就插在选中处，没选中就接在文末。')));
        return;
      }
      aiHistory.forEach((msg, i) => {
        if (msg.role === 'user') {
          logBox.appendChild(h('div', { class: 'ch-ai-item user' }, h('div', { class: 'ch-ai-msg' }, msg.content)));
        } else if (msg.role === 'note') {
          logBox.appendChild(h('div', { class: 'ch-ai-item note' },
            h('div', { class: 'ch-ai-msg' }, msg.content),
            h('div', { class: 'ch-ai-tools' }, h('span', { onclick: retryLast }, '重试'))));
        } else {
          const tools = h('div', { class: 'ch-ai-tools' },
            h('span', { onclick: () => insertIntoText(msg.content) }, '插入正文'),
            h('span', { onclick: () => { msg.content = ''; renderLog(); }, title: '扔掉这一段' }, '丢弃'));
          logBox.appendChild(h('div', { class: 'ch-ai-item assistant' },
            h('div', { class: 'ch-ai-msg' }, msg.content || '（已丢弃）'), tools));
        }
      });
      logBox.scrollTop = logBox.scrollHeight;
    }

    /* 请求失败后重试：把最后一条作者要求再发一次 */
    function retryLast() {
      if (busy) { toast('还在等上一轮回复', 'err'); return; }
      for (let i = aiHistory.length - 1; i >= 0; i--) {
        if (aiHistory[i].role === 'user') {
          const last = aiHistory[aiHistory.length - 1];
          if (last && last.role === 'note') aiHistory.pop();
          send(aiHistory[i].content);
          return;
        }
      }
      toast('没有可以重试的内容', 'err');
    }

    /* 把 AI 写的一段插进当前正文
     * - 「追加」：接在文末
     * - 有选区：插在选区处（可用 selectedText 直接替换原文）
     * - 否则：插在光标处；光标也没动过就接在文末 */
    function insertIntoText(text) {
      const ed = edRef, m = cur();
      if (!ed || !m) { toast('先打开一个章节', 'err'); return; }
      let value = text || '';
      if (!value.trim()) return;
      const raw = ed.value;
      const rec = { start: ed.selectionStart, end: ed.selectionEnd, wasFocused: dock.dataset.lastFocus === '1' };
      const gap = v => (!v ? '' : v.endsWith('\n') ? '' : '\n');
      let start, end, insert;
      if (doc.settings && doc.settings.ai && doc.settings.ai.mode === 'append') {
        start = end = raw.length;
        insert = gap(raw) + value;
      } else if (rec.start !== rec.end) {
        start = rec.start; end = rec.end;
        insert = value;
      } else if (rec.wasFocused) {
        start = end = rec.start;
        insert = value;
      } else {
        start = end = raw.length;
        insert = gap(raw) + value;
      }
      ed.value = raw.slice(0, start) + insert + raw.slice(end);
      ed.dispatchEvent(new Event('input'));
      const caret = start + insert.length;
      ed.focus();
      ed.setSelectionRange(caret, caret);
      toast('已插入正文 · 回复可撤销', 'ok');
    }

    /* 和模型对话：历史 + 本章上下文一起发过去，回复作为下一条 assistant 记下来 */
    async function send(msg) {
      const m = cur();
      if (!m) { toast('左边还没有章节，先新建一篇再让 AI 写', 'err'); return; }
      if (busy) { toast('正在等模型回复…', 'err'); return; }
      if (!msg) return;
      busy = true;
      abortCtrl = new AbortController();
      paintBusy();
      try {
        /* 历史只带作者的指令和 AI 的正文；章节上下文放最后一条 user 里（快照式，不随对话膨胀） */
        const messages = aiHistory
          .filter(x => (x.role === 'user' || x.role === 'assistant') && x.content)
          .slice(-8)
          .map(x => ({ role: x.role, content: x.content }));
        messages.push({ role: 'user', content: buildContext(m) + '\n\n【作者要求】' + msg });
        const ai = Object.assign({ temperature: 0.8, maxTokens: 1400 }, (doc.settings && doc.settings.ai) || {});
        const r = await window.nf.llm.chat(messages, { maxTokens: ai.maxTokens, temperature: ai.temperature });
        const text = String((r && r.content) || '').trim();
        if (!text) throw new Error('模型没有返回内容');
        aiHistory.push({ role: 'assistant', content: text });
        renderLog();
        toast('AI 写好了 · 点「插入正文」或直接点插入', 'ok');
      } catch (e) {
        const err = String((e && e.message) || e).replace(/^Error invoking remote method '[^']*':\s*(?:Error:\s*)?/, '');
        aiHistory.push({ role: 'note', content: '请求失败：' + err + '（检查 设置 → 模型接口 后，点「重试」）' });
        /* 这一轮的作者要求留在历史末尾，重试时直接复用，不用重打 */
        renderLog();
      }
      busy = false;
      abortCtrl = null;
      paintBusy();
    }

    function ask(text) {
      const msg = String(text || '').trim();
      if (!msg) return;
      aiHistory.push({ role: 'user', content: msg });
      renderLog();
      const auto = doc.settings && doc.settings.ai && doc.settings.ai.autoInsert;
      if (auto) {
        /* 直接写入模式：等回复回来再把正文接上去 */
        const before = aiHistory.length;
        send(msg).then(() => {
          const last = aiHistory[aiHistory.length - 1];
          if (last && last.role === 'assistant' && aiHistory.length === before + 1) insertIntoText(last.content);
        });
      } else {
        send(msg);
      }
    }

    function paintBusy() {
      if (!dock) return;
      const sendBtn = dock.querySelector('[data-role="send"]');
      if (sendBtn) {
        sendBtn.disabled = busy;
        sendBtn.textContent = busy ? '写作中…' : '发送';
      }
      dock.classList.toggle('busy', busy);
      const stopBtn = dock.querySelector('[data-role="stop"]');
      if (stopBtn) stopBtn.style.display = busy ? '' : 'none';
    }

    function toggleDock(open) {
      const on = typeof open === 'boolean' ? open : !dock.classList.contains('open');
      dock.classList.toggle('open', on);
      if (on) renderLog();
    }

    function buildDock() {
      const aiCfg = (doc.settings && doc.settings.ai) || {};
      const modelTag = h('span', { class: 'ch-ai-model', title: '在设置 → 模型接口 里切换模型' },
        (NF.settings && NF.settings.llm && NF.settings.llm.model) || '未配置模型');

      logBox = h('div', { class: 'ch-ai-log', 'data-probe': 'ai-log' });
      const ta = h('textarea', { class: 'ch-ai-in', placeholder: '让 AI 写什么…（Ctrl+Enter 发送）', 'data-probe': 'ai-input' });
      ta.addEventListener('focus', () => { dock.dataset.lastFocus = '0'; });
      ta.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); const v = ta.value; ta.value = ''; ask(v); }
      });

      const modeWrap = h('span', { class: 'row', style: { gap: '10px' } });
      const modeSel = { append: '接在文末', caret: '插在光标 / 选中处' };
      Object.keys(modeSel).forEach(k => {
        const r = h('input', { type: 'radio', name: 'ch-ai-mode', value: k, checked: (aiCfg.mode || 'caret') === k });
        r.addEventListener('change', () => {
          doc.settings = doc.settings || {};
          doc.settings.ai = Object.assign({ ctxLimit: 4000, mode: 'caret' }, doc.settings.ai, { mode: r.value });
          NF.save();
        });
        modeWrap.appendChild(h('label', { class: 'ch-ai-opt' }, r, modeSel[k]));
      });

      const ctxSel = h('select', { class: 'select', style: { width: 'auto', fontSize: '10px', padding: '1px 4px', height: '20px' } },
        [['2000', '上下文 2000 字'], ['4000', '上下文 4000 字'], ['8000', '上下文 8000 字'], ['12000', '上下文 12000 字']]
          .map(([v, t]) => h('option', { value: v, selected: String(aiCfg.ctxLimit || 4000) === v }, t)));
      ctxSel.addEventListener('change', () => {
        doc.settings = doc.settings || {};
        doc.settings.ai = Object.assign({ ctxLimit: 4000, mode: 'caret' }, doc.settings.ai, { ctxLimit: Number(ctxSel.value) });
        NF.save();
      });

      const autoBox = h('input', { type: 'checkbox', checked: !!aiCfg.autoInsert });
      autoBox.addEventListener('change', () => {
        doc.settings = doc.settings || {};
        doc.settings.ai = Object.assign({ ctxLimit: 4000, mode: 'caret' }, doc.settings.ai, { autoInsert: autoBox.checked });
        NF.save();
      });

      const quick = h('div', { class: 'ch-ai-quick' }, AI_QUICK.map(t => h('span', { class: 'ch-ai-chip', onclick: () => ask(t) }, t)));
      const sendBtn = h('button', { class: 'btn pri', style: { padding: '4px 14px', fontSize: '11.5px' }, 'data-role': 'send', onclick: () => { const v = ta.value; ta.value = ''; ask(v); } }, '发送');
      const stopBtn = h('button', { class: 'btn', style: { padding: '4px 10px', fontSize: '11px', display: 'none' }, 'data-role': 'stop', onclick: () => { if (abortCtrl) abortCtrl.abort(); } }, '停止');
      const clearBtn = h('button', { class: 'btn', style: { padding: '4px 10px', fontSize: '11px' }, onclick: () => { aiHistory.length = 0; renderLog(); } }, '清空对话');

      dock = h('div', { class: 'ch-ai', 'data-probe': 'ai-dock' },
        h('button', { class: 'ch-ai-fab', title: 'AI 写作助手（Ctrl+J）', onclick: () => toggleDock() }, 'AI'),
        h('div', { class: 'ch-ai-panel' },
          h('div', { class: 'ch-ai-h' },
            h('h3', {}, '写作助手'),
            modelTag,
            h('span', { class: 'ch-ai-x', title: '收起', onclick: () => toggleDock(false) }, '✕')),
          logBox,
          quick,
          h('div', { class: 'ch-ai-f' },
            ta,
            h('div', { class: 'ch-ai-row' },
              h('label', { class: 'ch-ai-opt', title: '勾上后，AI 一写完就直接插进正文' }, autoBox, '写完直接写入'),
              h('span', { class: 'row', style: { gap: '8px' } }, modeWrap)),
            h('div', { class: 'ch-ai-row' },
              stopBtn, clearBtn,
              h('span', { class: 'grow' }),
              ctxSel,
              h('span', { class: 'tiny muted', style: { fontSize: '9.5px' } }, 'Ctrl+↵ 发送'),
              sendBtn))));
      aiReady = true;
      wrap.appendChild(dock);
      renderLog();
      document.addEventListener('keydown', (ev) => {
        if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'j') { ev.preventDefault(); toggleDock(); setTimeout(() => ta.focus(), 30); }
      });
    }

    /* 从情节页点「在章节里定位」之类跳过来时，直接选中对应章节：
     * params.id 就是稿件 id；只有 params.plot 时按情节的章节号找稿件 */
    if (ctx.params && ctx.params.plot && !ctx.params.id) {
      const p = (doc.plots || []).find(x => x.id === ctx.params.plot);
      if (p) {
        const no = (String(p.chapter || '').match(/(\d+)/) || [])[0];
        const hit = no ? doc.manuscripts.find(m => (m.chapterNo || 0) === Number(no) || (String(m.title || '').match(/(\d+)/) || [])[0] === String(Number(no))) : null;
        if (hit) { st.id = hit.id; st.vol = hit.volumeId; }
      }
    }

    renderSide(); renderMain();
    buildDock();
    /* Ctrl/⌘+S 由外壳统一处理（app.js），这里不再重复绑定，避免双份 toast */
  }
};
