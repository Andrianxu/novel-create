import { h, clear, toast, modal, injectStyle, uid, debounce, words, ago, aiFabFace } from '../util.js';

injectStyle('chapter', `
.ch-wrap{flex:1;min-width:0;display:flex}
.ch-side{width:252px;flex:none;background:#F1EADA;border-right:1px solid #DFD4BF;display:flex;flex-direction:column;padding:10px 9px;gap:4px;overflow:hidden}
.ch-sidelist{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:4px}
/* 侧栏顶部常驻的操作条：不随列表滚动，「新的章节」永远在第一屏一眼能看见 */
.ch-sidehead{display:flex;align-items:center;gap:6px;flex:none;padding:0 2px 8px;margin-bottom:2px;border-bottom:1px solid #E3D8C3}
.ch-sidehead .lab{font-size:12px;font-weight:700;color:#3B342C}
.ch-new{font-family:var(--kai);font-size:12.5px;letter-spacing:.04em;display:inline-flex;align-items:center;gap:5px;
  padding:6px 11px;border-radius:8px;border:1px solid var(--seal);background:var(--seal);color:#FFF8EE;cursor:pointer;
  box-shadow:0 2px 8px rgba(168,50,42,.22);transition:transform .1s,box-shadow .15s,background .15s;white-space:nowrap}
.ch-new .plus{font-size:14px;line-height:1;font-weight:400}
.ch-new:hover{background:#8E2A23;border-color:#8E2A23;transform:translateY(-1px);box-shadow:0 4px 12px rgba(168,50,42,.3)}
.ch-new:active{transform:translateY(0)}
.ch-sidehead .btn.xs{font-size:11px;padding:4px 8px}
.ch-headrow{display:flex;align-items:center;gap:6px}
.ch-newrow{display:flex;align-items:center;gap:7px;margin-top:7px}
.ch-newrow .ch-new{width:100%;justify-content:center}
/* 章条目右侧的行内「＋」：平时很淡，hover 时显形，点它就在这一章后面插一章 */
.ch-ins-line{flex:none;width:16px;height:16px;line-height:14px;text-align:center;border-radius:5px;font-size:11px;
  color:#A99C84;border:1px solid transparent;opacity:.3;transition:opacity .12s,background .12s,color .12s}
.ch-doc:hover .ch-ins-line{opacity:1}
.ch-ins-line:hover{background:#F7EBD3;border-color:#DCCBA8;color:#8A6421}
.ch-vol{display:flex;align-items:center;gap:7px;padding:6px 7px;border-radius:8px;cursor:pointer;font-size:12px}
.ch-vol:hover{background:rgba(255,255,255,.5)}
.ch-vol.on{background:#FFFCF5;box-shadow:inset 0 0 0 1px #DFD4BF}
.ch-vol small{margin-left:auto;font-size:9.5px;color:#8C8272}
.ch-doc{display:flex;gap:6px;align-items:center;padding:5px 7px 5px 20px;border-radius:7px;cursor:pointer;font-size:11.5px;color:#5B5348}
.ch-doc:hover{background:rgba(255,255,255,.55)}
.ch-doc.on{background:#FFFCF5;box-shadow:inset 0 0 0 1px #DFD4BF;color:#201C18}
/* 卷末的「＋ 加上一章」：比正文条目更淡，但给一圈虚线，一眼看出是「加」不是「一篇」 */
.ch-doc-add{color:#8A6421;border:1px dashed #DCCBA8;background:rgba(255,252,245,.5);margin:2px 0 4px 12px;font-size:11px}
.ch-doc-add:hover{background:#FBF3DF;border-color:#CBB894;color:#5B4A22}
.ch-doc .grow{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* 章节行左边的收起 / 展开记号：有情节的章才显示，收起时变成「＋」 */
.ch-fold{flex:none;width:12px;text-align:center;font-size:11px;line-height:1;color:#A99C84;display:none}
.ch-doc .ch-fold:not(.off){display:inline}
.ch-doc.folded .ch-fold{display:inline;color:#8A6421}
.ch-doc:hover .ch-fold{color:#5B5348}
/* 收起后的小提示行：看得出这里藏着几条情节，点一下展开 */
.ch-folded{display:flex;align-items:center;gap:6px;padding:2px 7px 2px 27px;font-size:9.5px;color:#B0A491;cursor:pointer}
.ch-folded:hover{color:#7A6A4E}
.ch-folded .lnk{color:var(--jade);text-decoration:underline}
.ch-folded:hover .lnk{color:#23604F}
.ch-plots{display:flex;flex-direction:column;gap:1px;padding:2px 0 4px 34px}
.ch-plot{display:flex;align-items:center;gap:6px;padding:3px 7px;border-radius:6px;cursor:pointer;font-size:10.5px;color:#6B6357;min-width:0}
.ch-plot:hover{background:rgba(255,255,255,.6);color:#201C18}
.ch-plot.on{background:#F3EBDA;color:#201C18;box-shadow:inset 2px 0 0 var(--gold)}
.ch-plot i{width:6px;height:6px;border-radius:50%;flex:none;background:var(--jade)}
.ch-plot.later i{border:1px dashed #C9973C;background:transparent}
.ch-plot.ending i{border-radius:1px;background:var(--seal);transform:rotate(45deg)}
.ch-plot span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ch-plot small{margin-left:auto;font-size:9px;color:#A99C84;flex:none}
.ch-vplot{display:flex;align-items:center;gap:6px;padding:2px 7px 2px 20px;border-radius:6px;cursor:pointer;font-size:10px;color:#8C8272;min-width:0}
.ch-vplot:hover{background:rgba(255,255,255,.55);color:#5B5348}
.ch-vplot.on{background:#F3EBDA;color:#3B342C}
.ch-vplot span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* 两种情节条目「正在标着」时都用同一种标记：左侧一道细金竖条 + 略深的底 */
[data-plot].on{box-shadow:inset 2px 0 0 var(--gold)}
.ch-main{flex:1;min-width:0;display:flex;flex-direction:column;padding:12px 18px 0}
.ch-top{display:flex;align-items:center;gap:10px;padding-bottom:10px;border-bottom:1px solid #EAE1CF}
.ch-title{font-family:var(--kai);font-size:21px;border:none;background:transparent;outline:none;flex:1;min-width:0;color:#201C18;letter-spacing:.04em}
/* 标题左边的章号：系统自动编号，只读展示 */
.ch-no{font-family:var(--kai);font-size:16px;color:#8A6421;background:#F7EBD3;border:1px solid #E7D6AF;
  border-radius:7px;padding:2px 7px;white-space:nowrap;flex:none;letter-spacing:.04em}
.ch-title::placeholder{color:#B6AB98}
.ch-editor{flex:1;min-height:0;width:100%;border:none;outline:none;resize:none;background:transparent;
  font-family:var(--kai);font-size:17px;line-height:2.05;color:#2A2521;padding:18px 2px;letter-spacing:.02em}
.ch-editor::placeholder{color:#BDB3A0}
.ch-foot{display:flex;align-items:center;gap:14px;padding:8px 2px;border-top:1px solid #EAE1CF;font-size:10.5px;color:#8C8272}
.ch-focus .ch-side{display:none}
.ch-focus .ch-editor{font-size:19px;max-width:820px;margin:0 auto;padding-top:28px}
.ch-focus .ch-top,.ch-focus .ch-foot{max-width:820px;margin:0 auto;width:100%}
.ch-empty{flex:1;display:grid;place-items:center;color:#8C8272;font-size:12px}
/* 正文里标出的情节对应内容：textarea 下面垫一层高亮影子，字色透明只露底色
 * 质感 = 「荧光玻璃」：只有底色，不碰文字——
 *   暖琥珀底（比纸色沉一档）+ 上下细细的亮边（玻璃厚度）+ 极缓的荧光呼吸；
 *   行内文字仍由 textarea 自己渲染，影子层里的字一律透明，绝不叠加描边或发光。 */
.ch-ed{position:relative;flex:1;min-height:0;display:flex}
.ch-ed-hl{position:absolute;inset:0;overflow:hidden;pointer-events:none;padding:18px 2px;
  font-family:var(--kai);font-size:17px;line-height:2.05;letter-spacing:.02em;white-space:pre-wrap;word-break:break-word;
  color:transparent;background:transparent}
.ch-ed-hl mark{position:relative;color:transparent;border-radius:5px;padding:1px 3px;margin:0 -3px;
  background:linear-gradient(180deg, rgba(226,201,157,.42) 0%, rgba(233,213,173,.54) 38%, rgba(228,204,158,.60) 100%);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.92), inset 0 -1px 0 rgba(201,151,60,.20),
    0 0 0 1px rgba(201,151,60,.20), 0 2px 7px rgba(185,138,60,.13);
  -webkit-box-decoration-break:clone;box-decoration-break:clone;
  animation:chGlassIn .66s cubic-bezier(.22,.9,.28,1), chGlassBreathe 3.4s ease-in-out .66s infinite}
/* 落下：先亮成一块发光玻璃，再退回安静的稳定态 */
@keyframes chGlassIn{
  0%{background-color:rgba(255,246,224,.80);box-shadow:inset 0 1px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(201,151,60,.3),
     0 0 0 1px rgba(201,151,60,.40), 0 0 22px 7px rgba(255,234,182,.85)}
  60%{background-color:rgba(238,218,180,.50)}
  100%{background-color:rgba(0,0,0,0);box-shadow:inset 0 1px 0 rgba(255,255,255,.92), inset 0 -1px 0 rgba(201,151,60,.20),
     0 0 0 1px rgba(201,151,60,.20), 0 2px 7px rgba(185,138,60,.13)}
}
/* 常驻：只让外轮廓那圈荧光极缓起伏，底色不动，不打扰阅读 */
@keyframes chGlassBreathe{
  0%,100%{box-shadow:inset 0 1px 0 rgba(255,255,255,.92), inset 0 -1px 0 rgba(201,151,60,.20),
    0 0 0 1px rgba(201,151,60,.20), 0 2px 7px rgba(185,138,60,.13)}
  50%{box-shadow:inset 0 1px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(201,151,60,.24),
    0 0 0 1px rgba(206,160,74,.32), 0 3px 11px rgba(201,155,76,.20)}
}
@media (prefers-reduced-motion: reduce){ .ch-ed-hl mark{animation:chGlassIn .3s ease} }
.ch-focus .ch-ed-hl{font-size:19px;max-width:820px;margin:0 auto;padding-top:28px}
/* 标出情节时页面上不再出现任何说明条 / 徽标：只有正文里那层荧光玻璃 */

/* ---------- 右下角 AI 写作助手 ---------- */
.ch-ai{position:fixed;right:18px;bottom:40px;z-index:60;display:flex;flex-direction:column;align-items:flex-end;gap:10px}
.ch-ai-fab{width:54px;height:54px;border-radius:50%;border:1px solid #CBB894;background:var(--ink);color:var(--paper);
  font-family:var(--kai);font-size:15px;letter-spacing:.06em;cursor:pointer;box-shadow:0 10px 26px rgba(50,35,20,.26);transition:transform .12s;
  padding:0;overflow:hidden;display:flex;align-items:center;justify-content:center}
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

const page = {
  id: 'chapter', label: '章节写作',
  statusText(doc) { return '稿件 ' + ((doc.manuscripts || []).length) + ' 篇 · 共 ' + ((doc.manuscripts || []).reduce((a, m) => a + words(m.content), 0)) + ' 字'; },
  unmount() {
    /* 页面要拆掉了：先把作者此刻的视角（选中哪章、光标和正文滚到哪儿、侧栏滚到哪儿）抄下来。
     * 撤销会让这一页原地重挂，闭包里的局部状态跟着丢，只能记在页面对象上再放回去。 */
    if (this._capture) { try { this._capture(); } catch (e) {} this._capture = null; }
    if (this._cleanup) { this._cleanup(); this._cleanup = null; }
    /* 右下角 AI 助手的 Ctrl+J 原来绑在 document 上，换页也不解绑，会越堆越多 */
    if (this._keyOff) { this._keyOff(); this._keyOff = null; }
  },
  mount(root, ctx) {
    const { doc, NF } = ctx;
    doc.manuscripts = doc.manuscripts || [];
    doc.chapters = doc.chapters || [];
    /* 这一页的视角记在页面对象上，重挂时接回来（撤销 / 同步都会让页面原地重画）。 */
    const ui = page._ui || (page._ui = {
      vol: null, id: null, focus: false, folds: Object.create(null), sideTop: 0
    });
    const params = ctx.params || {};
    const st = { vol: (doc.chapters[0] || {}).id || null, id: null, focus: !!ui.focus };
    /* 从情节页「在章节里定位」之类带着参数过来时按参数走；
     * 撤销后的原地重画则沿用重画前作者正看着的那一卷 / 那一章。 */
    if (!ctx.refresh && params.id && doc.manuscripts.some(m => m.id === params.id)) {
      st.id = params.id;
      const pm = doc.manuscripts.find(m => m.id === params.id);
      if (pm && pm.volumeId && doc.chapters.some(v => v.id === pm.volumeId)) st.vol = pm.volumeId;
    } else if (ui.id && doc.manuscripts.some(m => m.id === ui.id)) {
      st.id = ui.id;
      const um = doc.manuscripts.find(m => m.id === ui.id);
      if (um && um.volumeId && doc.chapters.some(v => v.id === um.volumeId)) st.vol = um.volumeId;
      else if (ui.vol && doc.chapters.some(v => v.id === ui.vol)) st.vol = ui.vol;
    } else if (ui.vol && doc.chapters.some(v => v.id === ui.vol)) {
      st.vol = ui.vol;
    }
    if (!st.id) {
      const first = doc.manuscripts.find(m => m.volumeId === st.vol) || doc.manuscripts[0];
      st.id = first ? first.id : null;
      if (first && first.volumeId) st.vol = first.volumeId;
    }

    const wrap = h('div', { class: 'ch-wrap' + (st.focus ? ' ch-focus' : '') });
    const side = h('aside', { class: 'ch-side', 'data-probe': 'chapter-side' });
    /* 侧栏只滚列表本身，头顶那排按钮（新的章节 / 卷 / 情节）不跟着滚走 */
    const sideHead = h('div', { class: 'ch-sidehead' });
    const sideList = h('div', { class: 'ch-sidelist' });
    side.appendChild(sideHead); side.appendChild(sideList);
    const main = h('main', { class: 'ch-main', 'data-probe': 'chapter-main' });
    wrap.appendChild(side); wrap.appendChild(main); root.appendChild(wrap);

    const cur = () => doc.manuscripts.find(m => m.id === st.id);
    const saveDebounced = debounce(() => NF.save(), 700);
    /* 哪几章的情节被收起了：{ [稿件id]: true }。不写进数据，但跟着页面视角一起留着：
     * 撤销重挂后，作者收起的那几组不会突然全弹开。 */
    const foldSet = ui.folds || (ui.folds = Object.create(null));

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
    /* 卷内按章号排序：手写「第五章」和自动生成的「第八章」混在一起也能排对 */
    const byNo = (a, b) => (manuscriptNo(a) || 1e9) - (manuscriptNo(b) || 1e9);
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
    let hlRef = null;        /* { start, end, plotId } 当前标出的区间；null = 没有标记 */

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
      /* textarea 末尾的换行会被吃掉，补一个换行让影子高度对齐。
       * 影子层里的文字只用来占位（全透明），不会在正文上叠任何额外的字或描边。 */
      box.innerHTML = before + '<mark data-plot="' + escHtml(String(hlRef.plotId || '')) + '">' + hit + '</mark>' + after + '\n';
      /* 重新触发一次「荧光亮起」：点同一情节、或从一条情节换到另一条，都会再亮一下作为反馈。
       * 先清掉动画、读一次布局，浏览器才会把新挂上的动画当成一次全新的播放。 */
      box.querySelectorAll('mark').forEach(mk => {
        mk.style.animation = 'none';
        void mk.offsetWidth;
        mk.style.animation = '';
      });
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
      /* 只把视线带过去，不选中文字：选中会盖一层蓝底、也会让「选中了就是当前情节」的错觉
       * 把内容标记和编辑状态混在一起。要标记的只是那层荧光玻璃。 */
      ed2.blur();
      ed2.focus({ preventScroll: true });
      const at = Math.min(hlRef.start, val.length);
      ed2.setSelectionRange(at, at);
    }
    /* 关掉荧光玻璃：清数据 + 清影子层。不再有常驻的提示条，页面上一句话都不留 */
    function clearHl() {
      hlRef = null;
      if (hlLayer) clear(hlLayer);
    }
    /* 侧栏里只让「正在用荧光玻璃标出的那一条」有标记 */
    function syncSideOn() {
      side.querySelectorAll('.ch-plot, .ch-vplot').forEach(el => {
        const on = !!(hlRef && el.dataset.plot === hlRef.plotId);
        el.classList.toggle('on', on);
        el.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
    /* 点侧栏情节：标正文（没有选中，只有一层荧光玻璃） */
    function focusPlot(p) {
      if (!p) return;
      /* 再点一次正在标着的那条 = 关掉特效 */
      if (hlRef && hlRef.plotId === p.id) {
        clearHl();
        syncSideOn();
        toast('已收起荧光玻璃标记', 'ok');
        return;
      }
      /* 若这篇情节不在当前稿件里，先切到它对应的稿件 */
      const curM = cur();
      if (curM) {
        const target = plotManuscript(p, curM.volumeId || st.vol);
        if (target && target !== curM.id) {
          const tm = doc.manuscripts.find(x => x.id === target);
          if (tm) {
            st.id = tm.id; st.vol = tm.volumeId;
            renderSide(); renderMain();
            /* 重画过页面后重新查一次这条情节的落点 */
            const r2 = findRange((cur() || {}).content || '', p);
            if (!r2) { clearHl(); syncSideOn(); toast('这一章正文里还没找到「' + (p.title || '该情节') + '」对应的内容，先写出来再点我', 'err'); return; }
            hlRef = { start: r2.start, end: r2.end, plotId: p.id };
            paintHl(); scrollToHl(); syncSideOn();
            return;
          }
        }
      }
      const m2 = cur();
      const text = (m2 && m2.content) || '';
      const r = findRange(text, p);
      if (!r) {
        clearHl();
        syncSideOn();
        toast('这一章正文里还没找到「' + (p.title || '该情节') + '」对应的内容，先写出来再点我', 'err');
        return;
      }
      hlRef = { start: r.start, end: r.end, plotId: p.id };
      paintHl();
      scrollToHl();
      syncSideOn();
    }

    /* 切卷：卷选中了，正文也得跟着切过去（以前只重画左栏，右半屏还停在上一个卷的章节上） */
    function selectVolume(id) {
      const vms = doc.manuscripts.filter(m => m.volumeId === id).slice().sort(byNo);
      st.vol = id;
      st.id = vms.length ? vms[0].id : null;
      renderSide(); renderMain();
    }

    function renderSide() {
      /* 只清列表：顶部操作条是常驻节点，清掉它按钮就跟着没了 */
      const plots = plotsSorted();
      /* ---- 顶部操作条（常驻，不随列表滚动）---- */
      clear(sideHead);
      /* 第一行：标题 + ＋卷 + 情节；第二行：新建章节（点开填章号和标题名） */
      const headRow = h('div', { class: 'ch-headrow' });
      headRow.appendChild(h('span', { class: 'lab' }, '正文'));
      headRow.appendChild(h('span', { class: 'grow' }));
      headRow.appendChild(h('button', { class: 'btn xs', onclick: addVolume, title: '新建一卷' }, '＋ 卷'));
      headRow.appendChild(h('button', { class: 'btn xs', onclick: () => NF.go('plot'), title: '去情节页管理时间轴' }, '情节 ' + (doc.plots || []).length));
      sideHead.appendChild(headRow);

      sideHead.appendChild(h('div', { class: 'ch-newrow' },
        h('button', {
          class: 'ch-new', title: '填「第几章 + 标题名」；插入后本卷章号 ≥ 这个号的章节统一顺延一位', onclick: () => addDoc()
        }, h('span', { class: 'plus' }, '＋'), '新的章节')));

      /* ---- 卷 / 章列表 ---- */
      clear(sideList);
      doc.chapters.forEach(v => {
        const range = volumeRange(v.id);
        const volPlots = plots.filter(p => {
          const no = chNum(p.chapter);
          return range && no >= range.min && no <= range.max && plotManuscript(p, v.id) === null;
        });
        const vms = doc.manuscripts.filter(m => m.volumeId === v.id).sort(byNo);
        sideList.appendChild(h('div', { class: 'ch-vol' + (v.id === st.vol ? ' on' : ''), title: '点一下切到这一卷', onclick: () => selectVolume(v.id) },
          h('span', {}, v.title),
          h('small', {}, vms.length + ' 篇')));
        if (v.id === st.vol) {
          vms.forEach(m => {
            const mine = plots.filter(p => plotManuscript(p, v.id) === m.id);
            const folded = !!foldSet[m.id];
            const row = h('div', {
              class: 'ch-doc' + (m.id === st.id ? ' on' : '') + (folded ? ' folded' : ''),
              title: mine.length ? (folded ? '点一下展开这一章的情节' : '点一下收起这一章的情节') : '',
              onclick: () => {
                /* 点这一章：切到这一章；若它挂着情节，同时收起 / 展开情节。
                 * 收起只影响侧栏列表，不动正文里那层荧光玻璃。 */
                st.id = m.id;
                if (mine.length) foldSet[m.id] = !folded;
                renderSide(); renderMain();
              }
            },
              h('span', { class: 'ch-fold' + (folded ? ' off' : '') }, folded ? '＋' : '−'),
              h('span', { class: 'grow' }, m.title || '未命名'),
              h('span', { class: 'tiny muted' }, words(m.content) + ' 字'),
              /* 行内「插一章」：在这一章后面原地加一章，章号自动顺延 */
              h('span', {
                class: 'ch-ins-line', title: '在「' + (m.title || '这一章') + '」后面插一章（章号自动顺延）',
                onclick: (e) => { e.stopPropagation(); addDoc({ mode: 'after:' + m.id }); }
              }, '＋'));
            sideList.appendChild(row);
            /* 这一章挂的情节，点一下在正文里标出；收起后整组不渲染 */
            if (mine.length && !folded) {
              sideList.appendChild(h('div', { class: 'ch-plots' }, mine.map(p => h('div', {
                class: 'ch-plot ' + plotStatusCls(p),
                dataset: { plot: p.id },
                title: (p.summary || p.title) + ' · 时间点 ' + (p.timePoint == null ? '—' : p.timePoint) + '（点一下在正文里标出，再点一下收起）',
                onclick: () => focusPlot(p)
              }, h('i', {}), h('span', {}, p.title), h('small', {}, plotStatusLabel(p))))));
            }
            /* 收起时在章名下面留一行淡淡的提示，看得出这里藏着几条情节 */
            if (mine.length && folded) {
              sideList.appendChild(h('div', { class: 'ch-folded', onclick: () => { foldSet[m.id] = false; renderSide(); } },
                h('span', {}, '情节 ' + mine.length + ' 条已收起'), h('span', { class: 'lnk' }, '展开')));
            }
          });
          /* 卷末再放一个小号入口，写完一章顺手往下加；每一章下面也能原地插一章 */
          sideList.appendChild(h('div', { class: 'ch-doc ch-doc-add', title: '在本卷末尾新增一章', onclick: () => addDoc({ mode: 'end' }) },
            h('span', { class: 'grow' }, '＋ 加上一章')));
          /* 标了卷但没对上具体章节的情节，单独列在卷底下 */
          if (volPlots.length) {
            sideList.appendChild(h('div', { class: 'ch-vplot', style: { cursor: 'default', fontSize: '9px', letterSpacing: '.1em' } }, '本卷情节（未对上章节）'));
            volPlots.forEach(p => sideList.appendChild(h('div', {
              class: 'ch-vplot',
              dataset: { plot: p.id },
              title: (p.summary || p.title) + '（点一下在正文里标出，再点一下收起）',
              onclick: () => focusPlot(p)
            }, h('i', { style: { width: '6px', height: '6px', borderRadius: '50%', background: p.status === 'ending' ? 'var(--seal)' : p.status === 'later' ? '#C9973C' : 'var(--jade)', flex: 'none' } }), h('span', {}, p.title), h('small', { style: { marginLeft: 'auto', fontSize: '9px', color: '#A99C84' } }, p.chapter || ''))));
          }
        }
      });
      /* 重画侧栏后，把「正在标着的那条」重新挂上标记 */
      syncSideOn();
      sideList.appendChild(h('div', { style: { marginTop: 'auto' } },
        h('div', { class: 'tiny muted', style: { lineHeight: '1.7', padding: '8px 4px' } },
          '写的时候按 Ctrl+S 立刻保存，按 Ctrl+Z 撤销上一步；关掉软件也会自动存。每 5 分钟生成一份备份，可在设置里恢复。')));
    }

    function renderMain() {
      rememberCaret();
      clear(main);
      const m = cur();
      if (!m) {
        /* 空白分两种：整本书一篇都还没有 / 这一卷还没有章节（刚建完卷就是这种） */
        const v = (doc.chapters || []).find(x => x.id === st.vol);
        main.appendChild(h('div', { class: 'ch-empty' },
          v ? '「' + v.title + '」还没有章节：点侧栏的「＋ 新的章节」往里加第一章'
            : '左边还没有章节。点侧栏顶上的「＋ 新的章节」开始写，章号会自动排'));
        return;
      }
      /* 标题框只写「章名」：「第N章」是稿件创建时定下的编号，删除别的章节不会重排，
       * 只有插入新章时才会把 ≥ 插入号的章号顺延一位。这里只显、只改章名那一截。 */
      const no = manuscriptNo(m);
      const titleIn = h('input', {
        class: 'ch-title',
        value: titleOf(m),
        placeholder: no ? '这一章的章名（如：雨夜入冢）' : '章节标题'
      });
      titleIn.addEventListener('input', () => {
        const name = titleIn.value.replace(/^[·、.．:：\-—\s]+/u, '');
        const n2 = manuscriptNo(m) || no;
        m.title = n2 ? ('第' + intToCn(n2) + '章' + (name.trim() ? ' · ' + name : '')) : name;
        saveDebounced(); renderSideSoon();
      });
      /* 失焦时把框里残留的前缀清干净，保证框内永远只有章名 */
      titleIn.addEventListener('blur', () => { const t2 = titleOf(m); if (titleIn.value !== t2) titleIn.value = t2; });
      /* 正文的撤销走全篇那一套（app.js 的 Ctrl+Z）：连续打一段算一步，撤到打之前的样子 */
      const ed = h('textarea', { class: 'ch-editor', placeholder: '从这里开始写…', spellcheck: 'false', autocomplete: 'off' });
      ed.value = m.content || '';
      edRef = ed;
      /* 高亮影子层：和 textarea 同样字号排版，只用来露底色 */
      const hl = h('div', { class: 'ch-ed-hl', 'aria-hidden': 'true' });
      hlLayer = hl;
      const cnt = h('span', {}, '');
      const upd = () => {
        const w = words(ed.value);
        cnt.textContent = w.toLocaleString() + ' 字 · ' + ed.value.split('\n').length + ' 段';
      };
      ed.addEventListener('input', () => {
        m.content = ed.value; m.updatedAt = new Date().toISOString(); upd(); if (hlRef) paintHl();
        /* 不逐字记撤销：等手停下来由 saveDebounced 报一次，整段连续打字才算一步；
         * 若作者没等就按了 Ctrl+Z，撤销入口会先补一次 save，一样撤得回来。 */
        saveDebounced();
      });
      ed.addEventListener('scroll', () => { if (hlLayer) hlLayer.scrollTop = ed.scrollTop; });
      upd();
      const delBtn = h('button', { class: 'btn xs', onclick: () => {
        /* 用弹窗确认，不用原生 confirm（原生对话框会卡住整个界面，而且风格和别处不一样） */
        const dlg = modal({
          title: '移入废案篓', width: '440px', okText: '移入废案篓',
          body: h('div', { class: 'col', style: { gap: '8px' } },
            h('div', { class: 'small', style: { lineHeight: '1.8' } },
              '把「', h('b', {}, titleOf(m) || m.title || '这一篇'), '」移入废案篓？'),
            h('div', { class: 'tiny muted', style: { lineHeight: '1.8' } },
              '正文一个字都不会丢：情节页的废案篓里随时可以恢复；按 Ctrl+Z 也能撤销这一步。',
              h('br'),
              '章号创建后固定：删掉这一章不会让后面的章节前移，空号会留着。')),
          onOk: () => {
            doc.scraps = doc.scraps || [];
            doc.scraps.unshift({ id: uid('x'), kind: 'chapter', title: m.title, origin: '章节写作', reason: '手动移入', removedAt: new Date().toISOString(), summary: (m.content || '').slice(0, 60), payload: m });
            doc.manuscripts = doc.manuscripts.filter(x => x.id !== m.id);
            st.id = (doc.manuscripts.find(x => x.volumeId === st.vol) || {}).id || null;
            NF.save(); renderSide(); renderMain(); toast('已移入废案篓', 'ok');
          }
        });
        return dlg;
      } }, '移入废案');
      main.appendChild(h('div', { class: 'ch-top' },
        no ? h('span', { class: 'ch-no', title: '章号创建后固定；删除不重排，插入新章时 ≥ 插入号的章号顺延' }, '第' + intToCn(no) + '章') : null,
        titleIn,
        h('span', { class: 'pill' }, ago(m.updatedAt)),
        h('button', { class: 'btn xs', onclick: () => { st.focus = !st.focus; wrap.classList.toggle('ch-focus', st.focus); } }, '专注'),
        delBtn));
      main.appendChild(h('div', { class: 'ch-ed' }, hl, ed));
      main.appendChild(h('div', { class: 'ch-foot' },
        cnt,
        h('span', {}, '自动保存'),
        h('span', { class: 'grow' }),
        h('span', { class: 'tiny' }, 'Ctrl+S 立即保存 · Ctrl+Z 撤销')));
      /* 先摆一次：重挂后的第一帧就在原来的位置，不会闪一下文首 / 文末。
       * focus() 会把正文滚到光标处（新挂的 textarea 光标默认在末尾），所以聚焦之后再摆一次，
       * 撤销时视角才真的停在作者刚才看到的那一段。 */
      restoreCaret(ed);
      setTimeout(() => { ed.focus(); restoreCaret(ed); }, 30);
      if (aiReady && dock.classList.contains('open')) renderLog();
    }

    /* 编辑区的光标与滚动位置：重画前记一次，撤销后接着写不会跳回文首。
     * 记在页面对象上而不是这个闭包里——撤销会让页面重挂一次，闭包变量会跟着丢。 */
    const caretMem = page._caret || (page._caret = { id: null, start: 0, end: 0, top: 0 });
    function rememberCaret() {
      const e2 = edRef;
      if (!e2 || !cur()) return;
      caretMem.id = st.id;
      caretMem.start = e2.selectionStart || 0;
      caretMem.end = e2.selectionEnd || 0;
      caretMem.top = e2.scrollTop || 0;
    }
    function restoreCaret(e2) {
      if (caretMem.id !== st.id) return;
      const n = (e2.value || '').length;
      e2.setSelectionRange(Math.min(caretMem.start, n), Math.min(caretMem.end, n));
      e2.scrollTop = caretMem.top || 0;
      if (hlLayer) hlLayer.scrollTop = e2.scrollTop;
    }
    /* 拆页面之前抄一遍视角：选中项、专注模式、正文光标 / 滚动、侧栏滚动。
     * 撤销 / 重做走的是「解绑 → 清空 → 重挂」，不抄就走回第一章末尾。 */
    page._capture = function () {
      rememberCaret();
      ui.vol = st.vol;
      ui.id = st.id;
      ui.focus = st.focus;
      if (sideList) ui.sideTop = sideList.scrollTop || 0;
    };

    let sideTimer = null;
    const renderSideSoon = () => { clearTimeout(sideTimer); sideTimer = setTimeout(renderSide, 400); };

    /* ---------- 新建章节：章号自动接上、自动插到正确顺序位 ---------- */
    const CN_DIGIT = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    /* 1 → 一，10 → 十，12 → 十二，20 → 二十，25 → 二十五，105 → 一百零五 */
    function intToCn(n) {
      n = Math.max(0, Math.floor(Number(n) || 0));
      if (n < 10) return CN_DIGIT[n];
      if (n < 20) return '十' + (n % 10 ? CN_DIGIT[n % 10] : '');
      if (n < 100) return CN_DIGIT[Math.floor(n / 10)] + '十' + (n % 10 ? CN_DIGIT[n % 10] : '');
      let s = '', rest = n, hit = false;
      for (const u of [[1000, '千'], [100, '百']]) {
        const d = Math.floor(rest / u[0]);
        if (d) { s += CN_DIGIT[d] + u[1]; rest -= d * u[0]; hit = true; }
        else if (hit && rest) s += '零';
      }
      if (rest) s += n > 100 && rest < 10 ? '零' + CN_DIGIT[rest] : CN_DIGIT[rest];
      return s;
    }
    /* 从标题里摘出「章名」本身（去掉「第五章 · 」这种前缀）；标题不是章节体就原样返回 */
    function titleOf(m) {
      const raw = String((m && m.title) || '');
      const t = raw.replace(/^\s*第?\s*[〇零一二三四五六七八九十百千0-9]+\s*[章回节]\s*[·、.．:：\-—]?\s*/u, '').trim();
      return t || '';
    }
    /* 章号一旦建好就固定：删除章节不会让后面的章号前移，空号会留着。
     * 只有插入新章时才按章号顺延：本卷所有 ≥ 插入号的稿件 +1，新章占住插入号。 */
    function maxChapterNo(vid) {
      return doc.manuscripts.reduce((mx, m) => m.volumeId === vid ? Math.max(mx, manuscriptNo(m) || 0) : mx, 0);
    }
    function addDoc(opts) {
      if (!st.vol) { toast('先点「＋ 卷」建一卷，再往里加章节', 'err'); return; }
      /* 默认插在「本卷最大章号 + 1」后面，中间的空号不会被悄悄填掉 */
      let dftNo = maxChapterNo(st.vol) + 1;
      if (opts && opts.mode && opts.mode.indexOf('after:') === 0) {
        const id = opts.mode.split(':')[1];
        const target = doc.manuscripts.find(x => x.id === id && x.volumeId === st.vol);
        if (target) dftNo = (manuscriptNo(target) || maxChapterNo(st.vol)) + 1;
      }
      openNewChapterDialog(dftNo);
    }

    /* 「第几章」+ 章名 的输入框：弹窗和目录都用同一个（中文数字、阿拉伯数字、「第3章」都认） */
    function openNewChapterDialog(dftNo) {
      const numIn = h('input', { class: 'input', inputmode: 'numeric', value: String(dftNo), style: { width: '96px' } });
      const nameIn = h('input', { class: 'input', placeholder: '这一章的标题名，例如：雨夜入冢' });
      const hint = h('div', { class: 'tiny muted', style: { lineHeight: '1.8', marginTop: '2px', minHeight: '16px' } });
      const vms = () => doc.manuscripts.filter(m => m.volumeId === st.vol)
        .slice().sort((a, b) => (manuscriptNo(a) || 1e9) - (manuscriptNo(b) || 1e9));

      const preview = () => {
        const want = parseChapterNo(numIn.value);
        if (!want) { hint.textContent = '请输入要插入的章号（1、2、3…）'; hint.style.color = '#A9542A'; return; }
        const list = vms();
        const name = nameIn.value.trim();
        const label = '第' + intToCn(want) + '章' + (name ? ' · ' + name : '');
        const maxNo = list.reduce((mx, m) => Math.max(mx, manuscriptNo(m) || 0), 0);
        const ge = list.filter(m => (manuscriptNo(m) || 0) >= want);
        hint.style.color = '';
        if (!ge.length) {
          hint.textContent = '本卷现有章号到 ' + maxNo + ' → 会作为「' + label + '」加在末尾。'
            + (want > maxNo + 1 ? '中间空出的章号会留着，不补章。' : '');
        } else {
          const exact = ge.find(m => manuscriptNo(m) === want);
          const first = ge[0];
          hint.textContent = exact
            ? '第 ' + want + ' 章现在是「' + (titleOf(exact) || exact.title || '未命名') + '」→ 新章占第 ' + want + ' 章，'
              + '它和后面 ' + (ge.length - 1) + ' 章的章号都 +1，章名不变。'
            : '第 ' + want + ' 章现在是空号（下一位是第 ' + manuscriptNo(first) + ' 章）→ 新章占第 ' + want + ' 章，'
              + '这 ' + ge.length + ' 章的章号都 +1，章名不变。';
        }
      };
      numIn.addEventListener('input', preview);
      nameIn.addEventListener('input', preview);

      const dlg = modal({
        title: '新建章节', okText: '新建',
        body: h('div', { class: 'col', style: { gap: '10px' } },
          h('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-end' } },
            h('div', { class: 'field' }, h('label', {}, '插入到第几章'), numIn),
            h('div', { class: 'field', style: { flex: '1' } }, h('label', {}, '标题名'), nameIn)),
          h('div', { class: 'tiny muted', style: { lineHeight: '1.7' } },
            '章号创建后固定：删除章节不会重排；插入新章时，本卷章号 ≥ 插入号的章节依次 +1。'),
          hint),
        onOk: () => {
          const want = parseChapterNo(numIn.value);
          if (!want) { toast('章号要填数字（1、2、3…）', 'err'); return false; }
          const name = nameIn.value.trim();
          const mm = {
            id: uid('m'), volumeId: st.vol, chapterNo: want,
            title: '第' + intToCn(want) + '章' + (name ? ' · ' + name : ''),
            content: '', updatedAt: new Date().toISOString()
          };
          /* 先把原章节往后挪，再插新章：这样新章独占 want，原来 ≥ want 的一律 +1 */
          const changed = shiftVolumeFrom(st.vol, want);
          const before = vms().find(m => (manuscriptNo(m) || 0) > want);
          const at = before ? doc.manuscripts.findIndex(x => x.id === before.id) : doc.manuscripts.length;
          doc.manuscripts.splice(Math.max(0, at), 0, mm);
          st.id = mm.id;
          NF.save();
          renderSide(); renderMain();
          toast('已新建「' + mm.title + '」' + (changed ? '，后面 ' + changed + ' 章的章号已顺延' : ''), 'ok');
        }
      });
      /* 回车 = 确定：两个输入框都绑上 */
      [numIn, nameIn].forEach(el => el.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); const b = dlg.box.querySelector('.modal-f .btn.pri'); if (b) b.click(); }
      }));
      setTimeout(() => { preview(); nameIn.focus(); }, 30);
    }
    /* 把「1」「第3章」「第三章」「十二」都读成数字；读不出返回 0 */
    function parseChapterNo(v) {
      const t = String(v || '').trim();
      if (!t) return 0;
      const ar = t.match(/(\d+)/);
      if (ar) return Math.min(9999, Number(ar[1]));
      const cn = t.match(/[〇零一二三四五六七八九十百千]+/u);
      if (cn) return Math.min(9999, cnToInt(cn[0]));
      return 0;
    }
    /* 本卷章号 ≥ from 的稿件统一 +1：chapterNo 和标题里的「第N章」一起改，章名保留。
     * 删除章节不走这里，所以不会有「删一章、后面全往前挤」的事。返回改动篇数。 */
    function shiftVolumeFrom(vid, from) {
      let n = 0;
      for (const m of doc.manuscripts) {
        if (m.volumeId !== vid) continue;
        const no = manuscriptNo(m) || 0;
        if (no < from) continue;
        const name = titleOf(m);
        const nextNo = no + 1;
        const next = '第' + intToCn(nextNo) + '章' + (name ? ' · ' + name : '');
        m.chapterNo = nextNo;
        m.title = next;
        n++;
      }
      return n;
    }
    /* 新建一卷。
     * 注意：以前这里用的是 window.prompt()，而 Electron 里 prompt 是"不支持"的
     * （控制台只报一句 Uncaught Error: prompt() is not supported.），
     * 所以点「＋ 卷」看起来就是完全没反应。改成和其它地方一样的弹窗，并给个默认卷名。 */
    function addVolume() {
      const list = doc.chapters || (doc.chapters = []);
      const dft = '卷' + intToCn(list.length + 1);
      const nameIn = h('input', { class: 'input', value: dft, placeholder: '例如：卷四 · 无界海' });
      const hint = h('div', { class: 'tiny muted', style: { lineHeight: '1.8' } },
        '卷只是目录分组：章号在卷内自己排，所以建完这卷要从「＋ 新的章节」开始加。');
      const dlg = modal({
        title: '新建一卷', width: '460px', okText: '新建',
        body: h('div', { class: 'col', style: { gap: '10px' } },
          h('div', { class: 'field' }, h('label', {}, '卷名'), nameIn),
          hint),
        onOk: () => {
          const t = nameIn.value.trim();
          if (!t) { toast('卷名不能为空', 'err'); return false; }
          if ((doc.chapters || []).some(v => v.title === t)) { toast('已经有一卷叫「' + t + '」了，换个名字', 'err'); return false; }
          const v = { id: uid('v'), title: t, status: 'plan', words: 0 };
          doc.chapters.push(v);
          /* 建完直接切到这卷：左边选中、右边显示"这卷还没有章节"的提示 */
          st.vol = v.id;
          st.id = null;
          NF.save(); renderSide(); renderMain();
          toast('已新建「' + t + '」，点「＋ 新的章节」往里加第一章', 'ok');
        }
      });
      nameIn.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); const b = dlg.box.querySelector('.modal-f .btn.pri'); if (b) b.click(); }
      });
      setTimeout(() => { nameIn.focus(); nameIn.select(); }, 30);
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
      /* 标题用世界观页里作者自己起的名字（没改就是「修为体系」） */
      const realmTitle = (p && p.realmTitle || '').trim() || '修为体系';
      return [
        AI_PROMPT,
        '',
        '【当前章节】' + (m.title || '未命名'),
        realms ? '【' + realmTitle + '】' + realms : '',
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
        h('button', { class: 'ch-ai-fab', title: 'AI 写作助手（Ctrl+J）', onclick: () => toggleDock() }, aiFabFace('chapter')),
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
      const onKey = (ev) => {
        if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'j') { ev.preventDefault(); toggleDock(); setTimeout(() => ta.focus(), 30); }
      };
      document.addEventListener('keydown', onKey);
      page._keyOff = () => document.removeEventListener('keydown', onKey);   /* 换页时解绑 */
    }

    /* 从情节页点「在章节里定位」之类跳过来时，直接选中对应章节：
     * params.id 就是稿件 id；只有 params.plot 时按情节的章节号找稿件 */
    if (!ctx.refresh && ctx.params && ctx.params.plot && !ctx.params.id) {
      const p = (doc.plots || []).find(x => x.id === ctx.params.plot);
      if (p) {
        const no = (String(p.chapter || '').match(/(\d+)/) || [])[0];
        const hit = no ? doc.manuscripts.find(m => (m.chapterNo || 0) === Number(no) || (String(m.title || '').match(/(\d+)/) || [])[0] === String(Number(no))) : null;
        if (hit) { st.id = hit.id; st.vol = hit.volumeId; }
      }
    }

    renderSide();
    if (ui.sideTop) sideList.scrollTop = ui.sideTop;   /* 侧栏视角也接回原处 */
    renderMain();
    buildDock();
    /* Ctrl/⌘+S 由外壳统一处理（app.js），这里不再重复绑定，避免双份 toast */
  }
};

export default page;
