import { h, clear, toast, modal, injectStyle } from '../util.js';

injectStyle('book', `
.bk-wrap{display:flex;flex:1;min-width:0;min-height:0;height:100%}
/* ---------- 左栏：书库 ---------- */
.bk-side{width:240px;flex:none;min-height:0;background:#F1EADA;border-right:1px solid #DFD4BF;display:flex;flex-direction:column;gap:7px;padding:10px 9px}
.bk-sidehead{display:flex;align-items:center;gap:8px;padding:0 3px 2px}
.bk-sidehead b{font-size:12px;letter-spacing:.02em}
.bk-books{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:3px}
.bk-book{display:flex;gap:8px;align-items:flex-start;padding:7px 8px;border-radius:8px;border:1px solid transparent;cursor:pointer;min-width:0}
.bk-book:hover{background:rgba(255,255,255,.55)}
.bk-book.on{background:#FFFCF5;border-color:#DFD4BF}
.bk-book .bk-sp{width:3px;align-self:stretch;border-radius:2px;background:#D9CDB8;flex:none}
.bk-book.on .bk-sp{background:#A8322A}
.bk-book .bk-bt{min-width:0;flex:1}
.bk-book .bk-bt b{display:block;font-size:12px;font-weight:400;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bk-book .bk-bt small{display:block;font-size:9.5px;color:#8C8272;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bk-book .bk-del{flex:none;color:#B6A98F;font-size:12px;line-height:1;padding:2px 3px;border-radius:4px;opacity:0}
.bk-book:hover .bk-del{opacity:1}
.bk-book .bk-del:hover{background:#F6E3DF;color:#A8322A}
.bk-sidefoot{flex:none;border-top:1px dashed #DFD4BF;padding:8px 4px 1px;font-size:10px;line-height:1.7;color:#8C8272}
.bk-sidefoot em{font-style:normal;color:#5B5348}
/* ---------- 主区 ---------- */
.bk-main{flex:1;min-width:0;height:100%;overflow:auto;display:flex;flex-direction:column;gap:9px;padding:12px 16px 14px}
.bk-crumb{display:flex;align-items:center;gap:7px;font-size:11px;color:#8C8272;flex:none}
.bk-crumb i{font-style:normal;color:#C6B99F}
.bk-crumb b{font-weight:400;color:#5B5348}
.bk-head{display:flex;align-items:flex-start;gap:14px;flex:none}
.bk-head .bk-ht{min-width:0;flex:1}
.bk-head h1{font-family:var(--kai);font-size:27px;line-height:1.15;margin:0;letter-spacing:.04em;font-weight:400;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bk-head .bk-sub{font-size:11.5px;color:#5B5348;margin-top:3px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.bk-head .bk-sub .bk-dot{color:#C6B99F}
.bk-head .bk-act{display:flex;gap:7px;align-items:center;flex:none;padding-top:4px}
/* ---------- 流水线 ---------- */
.bk-pipe{padding:9px 12px 10px;display:flex;flex-direction:column;gap:8px;flex:none}
.bk-steps{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.bk-step{display:inline-flex;align-items:center;gap:6px;border:1px solid #EAE1CF;background:#FBF8EF;border-radius:7px;padding:3px 9px;font-size:11px;color:#8C8272;transition:all .18s}
.bk-step i{width:13px;height:13px;border-radius:4px;border:1px solid #DFD4BF;background:#FFFDF8;display:grid;place-items:center;font-style:normal;font-size:8px;line-height:1;color:#B6A98F;flex:none}
.bk-step.done{border-color:#C9DFD8;background:#E9F1EE;color:#23604F}
.bk-step.done i{border-color:#2F6F63;background:#2F6F63;color:#fff}
.bk-step.doing{border-color:#E3C89A;background:#FAF0DC;color:#8A6421;box-shadow:0 0 0 3px rgba(185,138,60,.1)}
.bk-step.doing i{border-color:#B98A3C;color:#B98A3C;animation:bkPulse 1.1s ease-in-out infinite}
@keyframes bkPulse{0%,100%{opacity:1}50%{opacity:.32}}
.bk-arw{color:#C6B99F;font-size:10px}
.bk-pipefoot{display:flex;align-items:center;gap:10px}
.bk-pipefoot .bar{flex:1;max-width:340px}
.bk-pipefoot .bk-st{font-size:11px;color:#5B5348;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bk-pipefoot .bk-pc{font-size:10px;color:#8C8272;font-family:var(--mono);flex:none}
/* ---------- 统计 ---------- */
.bk-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;flex:none}
.bk-stat{background:#FFFCF5;border:1px solid #EAE1CF;border-radius:10px;padding:6px 11px 7px;display:flex;flex-direction:column;gap:0}
.bk-stat b{font-family:var(--kai);font-size:19px;font-weight:400;line-height:1.25;color:#201C18}
.bk-stat small{font-size:9.5px;letter-spacing:.1em;color:#8C8272}
.bk-stat.gold b{color:#8A6421}
.bk-stat.jade b{color:#23604F}
/* ---------- 两栏 ---------- */
.bk-cols{flex:1;min-height:0;display:flex;gap:10px;align-items:stretch}
.bk-card{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.bk-chead{flex:none;display:flex;align-items:center;gap:7px;padding:8px 10px;border-bottom:1px solid #EAE1CF;background:#FCF8EE;flex-wrap:wrap}
.bk-chead h3{margin:0;font-size:12.5px;font-family:var(--kai);letter-spacing:.06em;font-weight:400}
.bk-chead .bk-n{font-size:10px;color:#8C8272}
.bk-cbody{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column}
.bk-cfoot{flex:none;display:flex;align-items:center;gap:8px;padding:6px 10px;border-top:1px solid #EAE1CF;background:#FCF8EE;font-size:10.5px;color:#8C8272}
/* ---------- 章节表 ---------- */
.bk-row{display:grid;grid-template-columns:20px 44px minmax(0,1fr) 56px minmax(0,1.1fr);gap:8px;align-items:center;padding:5px 10px;border-bottom:1px solid #F4EDDD;font-size:11.5px;cursor:pointer;min-height:25px}
.bk-row:hover{background:#FBF6E9}
.bk-row.on{background:#FCF5E4}
.bk-row-h{position:sticky;top:0;z-index:2;background:#F8F2E2;color:#8C8272;font-size:9.5px;letter-spacing:.1em;cursor:default;border-bottom:1px solid #EAE1CF}
.bk-row-h:hover{background:#F8F2E2}
.bk-ck{width:13px;height:13px;border-radius:4px;border:1px solid #D3C4A8;background:#FFFDF8;display:grid;place-items:center;font-size:8px;line-height:1;color:transparent;flex:none}
.bk-ck.on{background:#2F6F63;border-color:#2F6F63;color:#fff}
.bk-row .bk-no{font-family:var(--mono);font-size:10px;color:#A2957E}
.bk-row .bk-ttl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bk-row .bk-num{font-family:var(--mono);font-size:10px;color:#8C8272;text-align:right}
.bk-row .bk-ex{font-size:10.5px;color:#9C907C;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* ---------- 抽取结果 ---------- */
.bk-tabs{display:flex;gap:2px;background:#F1EADA;border-radius:8px;padding:2px}
.bk-tabs span{font-size:11px;padding:3px 10px;border-radius:6px;color:#5B5348;cursor:pointer;user-select:none;white-space:nowrap}
.bk-tabs span.on{background:#201C18;color:#F6F1E6}
.bk-tabs span em{font-style:normal;font-size:9.5px;opacity:.7;margin-left:3px}
.bk-prow{display:grid;grid-template-columns:24px minmax(0,1fr) auto;gap:9px;align-items:center;padding:6px 10px;border-bottom:1px solid #F4EDDD;cursor:pointer}
.bk-prow:hover{background:#FBF6E9}
.bk-prow.on{background:#FCF5E4}
.bk-pname{display:flex;align-items:baseline;gap:7px;min-width:0}
.bk-pname b{font-size:12px;font-weight:400;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bk-pname small{font-size:10px;color:#8C8272;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bk-pmeta{display:flex;align-items:center;gap:6px;flex:none;font-size:10px;color:#8C8272;font-family:var(--mono)}
.bk-plrow{display:grid;grid-template-columns:26px minmax(0,1fr) 20px;gap:9px;align-items:start;padding:7px 10px;border-bottom:1px solid #F4EDDD;cursor:pointer}
.bk-plrow:hover{background:#FBF6E9}
.bk-plrow.on{background:#FCF5E4}
.bk-plrow .bk-pin{font-family:var(--mono);font-size:10px;color:#A2957E;padding-top:2px;text-align:right}
.bk-plrow .bk-plname{font-size:12px;line-height:1.4}
.bk-plrow .bk-plsum{font-size:10.5px;color:#8C8272;line-height:1.6;margin-top:1px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.bk-plrow .bk-plch{display:flex;gap:4px;flex-wrap:wrap;margin-top:3px}
.bk-plrow .bk-plch i{font-style:normal;font-size:9.5px;color:#5B5348;background:#F5EEDF;border:1px solid #EAE1CF;border-radius:999px;padding:0 6px}
/* ---------- 引导 / 空状态 ---------- */
.bk-guide{margin:auto;max-width:420px;display:flex;flex-direction:column;align-items:center;gap:7px;text-align:center;padding:24px 16px}
.bk-guide h4{margin:0;font-family:var(--kai);font-size:15px;font-weight:400;letter-spacing:.05em}
.bk-guide p{margin:0;font-size:11.5px;line-height:1.9;color:#5B5348}
.bk-glyph{font-family:var(--kai);font-size:38px;line-height:1;color:#A8322A;opacity:.8}
.bk-glyph.sm{font-size:26px;color:#B98A3C}
.bk-empty{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:18px}
.bk-drop{width:min(660px,86%);border:1px dashed #DCCBA9;border-radius:14px;background:#FFFCF5;display:flex;flex-direction:column;align-items:center;gap:11px;padding:38px 34px;text-align:center;transition:all .18s}
.bk-drop.over{border-color:#2F6F63;background:#F3F8F5;box-shadow:0 0 0 4px rgba(47,111,99,.09)}
.bk-drop h2{margin:0;font-family:var(--kai);font-size:24px;font-weight:400;letter-spacing:.1em;color:#201C18}
.bk-drop p{margin:0;font-size:11.5px;line-height:1.95;color:#5B5348;max-width:440px}
.bk-drop .bk-hint{font-size:10px;color:#8C8272;letter-spacing:.02em}
.bk-drop .bk-glyph{font-size:44px;margin-top:2px}
.bk-empty .bk-eyebrow{font-size:9.5px;letter-spacing:.28em;color:#B6A98F}
/* ---------- 入库提示 ---------- */
.bk-commit{flex:none;display:flex;align-items:center;gap:10px;border:1px dashed #E0C79B;background:#FBF3E6;border-radius:9px;padding:7px 12px;font-size:11.5px;color:#5B5348}
.bk-commit b{font-weight:400;color:#8A6421}
.bk-commit .bk-ck-t{font-size:10px;color:#8C8272}
.bk-commit.off{border-style:solid;border-color:#EAE1CF;background:#FAF6EC;color:#8C8272}
`);

/* 模块级：只保留一个 book:progress 监听，避免 route() 重挂载时重复注册 */
let unsubscribeProgress = null;
/* 模块级：当前挂载页的销毁钩子，避免离开页面后异步回调继续改 DOM */
let disposeMount = null;

const RULES = [
  { k: 'chapter', label: '按第X章' },
  { k: 'blank', label: '按空行' },
  { k: 'size', label: '按字数' }
];
const AVATAR_COLORS = ['#2F6F63', '#8A6A2F', '#6B2B4A', '#2F4A6F', '#7C5C8C', '#A8322A', '#3D7F71', '#4A5E8C'];

function fmtNum(n) { return (Number(n) || 0).toLocaleString('zh-CN'); }
function fmtChars(n) {
  const v = Number(n) || 0;
  return v >= 10000 ? (v / 10000).toFixed(1) + ' 万字' : fmtNum(v) + ' 字';
}
function fmtAt(iso) {
  const d = new Date(iso);
  if (!iso || isNaN(d.getTime())) return '';
  const p = x => String(x).padStart(2, '0');
  return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
/* 只有真的抽到东西，才算拆解过（全失败的一轮主进程也会落一个空结果） */
function hasResult(b) {
  const an = b && b.analysis;
  return !!(an && (((an.people || []).length) || ((an.plots || []).length)));
}

/* 置信度只是按「出现次数」估的参考值，不是模型给的概率 */
function confidenceOf(count) {
  return Math.min(99, 72 + Math.min(27, Math.round(Math.sqrt(Math.max(1, count || 1)) * 6)));
}

export default {
  id: 'book', label: '书籍分析',
  statusText(doc) {
    const list = doc.books || [];
    if (!list.length) return '书籍分析 · 书库为空，可导入整本小说';
    const done = list.filter(b => hasResult(b)).length;
    return '书库 ' + list.length + ' 本 · 已拆解 ' + done + ' 本 · 人物 ' + (doc.characters || []).length + ' · 情节 ' + (doc.plots || []).length;
  },
  unmount() {
    if (disposeMount) { try { disposeMount(); } catch (e) { /* ignore */ } disposeMount = null; }
    if (unsubscribeProgress) { try { unsubscribeProgress(); } catch (e) { /* ignore */ } unsubscribeProgress = null; }
  },
  mount(root, ctx) {
    const { doc, params, NF } = ctx;
    if (!Array.isArray(doc.books)) doc.books = [];

    const st = {
      bookId: params.book || (doc.books[0] && doc.books[0].id) || null,
      rule: 'chapter',
      sel: {},
      pickP: new Set(),
      pickPl: new Set(),
      tab: 'people',
      analyzing: false,
      importing: false,
      resplitting: false,
      committing: false,
      committed: false,
      progress: null,
      lastErr: null
    };
    let alive = true;
    let refs = {};
    disposeMount = () => { alive = false; };
    const book = () => doc.books.find(b => b.id === st.bookId) || null;
    const hasKey = () => !!(NF.settings && NF.settings.hasApiKey);

    /* ---------------- 状态 ---------------- */
    function initBookState(b) {
      st.rule = (b && b.rule) || 'chapter';
      st.sel = {};
      ((b && b.chapters) || []).forEach(c => { st.sel[c.idx] = true; });
      const an = (b && b.analysis) || null;
      st.pickP = new Set(((an && an.people) || []).map(p => p.name));
      st.pickPl = new Set(((an && an.plots) || []).map(p => p.title));
      st.tab = 'people';
      st.analyzing = false;
      st.committed = false;
      st.progress = null;
    }
    const selChapters = () => {
      const b = book();
      return b ? b.chapters.filter(c => st.sel[c.idx]) : [];
    };
    const pickCount = () => st.pickP.size + st.pickPl.size;

    /* ---------------- 骨架 ---------------- */
    const wrap = h('div', { class: 'bk-wrap' });
    const aside = h('aside', { class: 'bk-side', 'data-probe': 'bk-side' });
    const main = h('main', { class: 'bk-main', 'data-probe': 'bk-main' });
    wrap.appendChild(aside);
    wrap.appendChild(main);
    root.appendChild(wrap);

    /* ---------------- 左栏 ---------------- */
    function importButton() {
      if (st.importing) {
        return h('button', { class: 'btn xs', disabled: true, title: '正在读取整本书' },
          h('span', { class: 'spin' }), '导入中…');
      }
      return h('button', { class: 'btn xs', title: '选择 txt / docx 整本小说', onclick: importBook }, '＋ 导入整本书');
    }

    function renderSide() {
      clear(aside);
      const list = doc.books;
      const head = h('div', { class: 'bk-sidehead' },
        h('b', {}, '书库'),
        h('span', { class: 'bk-n small muted' }, '· ' + list.length));
      aside.appendChild(head);
      aside.appendChild(importButton());
      const box = h('div', { class: 'bk-books', 'data-probe': 'bk-books' });
      if (!list.length) {
        box.appendChild(h('div', { class: 'empty', style: { padding: '22px 8px', fontSize: '11px', lineHeight: '1.8' } }, '还没有书', h('span', { class: 'tiny' }, '导入整本小说后会出现在这里')));
      }
      for (const b of list) {
        const chN = (b.chapters || []).length;
        const analyzed = hasResult(b);
        const row = h('div', {
          class: 'bk-book' + (b.id === st.bookId ? ' on' : ''),
          'data-book': b.id,
          onclick: () => selectBook(b.id),
          title: b.filename || b.title
        },
          h('span', { class: 'bk-sp' }),
          h('div', { class: 'bk-bt' },
            h('b', {}, b.title || '未命名'),
            h('small', {}, chN + ' 章 · ' + fmtChars(b.chars)),
            h('small', { style: { color: analyzed ? '#23604F' : '#A2957E' } }, analyzed ? '已拆解' : '待分析')),
          h('span', {
            class: 'bk-del', title: '移出书库',
            onclick: e => { e.stopPropagation(); removeBook(b); }
          }, '⌫'));
        box.appendChild(row);
      }
      aside.appendChild(box);
      aside.appendChild(h('div', { class: 'bk-sidefoot' },
        h('div', {}, '仅本地存储 · 原文件只读'),
        h('div', {}, '分析时只把', h('em', {}, '勾选的章节片段'), '发给你的 API'),
        h('div', { style: { color: '#A2957E' } }, 'API Key 加密保存在本机，不会回传')));
    }

    /* ---------------- 空状态 ---------------- */
    function renderEmpty() {
      const drop = h('div', { class: 'bk-drop', 'data-probe': 'bk-drop' },
        h('div', { class: 'bk-eyebrow' }, '书 籍 分 析'),
        h('div', { class: 'bk-glyph' }, '⤓'),
        h('h2', {}, '把整本书拖进来'),
        h('p', {}, '支持 .txt 与 .docx 整本小说。导入后自动按「第X章」切分章节，再从你勾选的章节里抽人物、抽情节，确认后一键入库。'),
        h('button', { class: 'btn pri', disabled: st.importing, onclick: importBook },
          st.importing ? h('span', { class: 'spin' }) : '＋ 选择整本小说',
          st.importing ? ' 读取中…' : ''),
        h('div', { class: 'bk-hint' }, '也可以直接点这里选文件 · 副本存在本机，原文件不会被改动'));
      drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
      drop.addEventListener('dragleave', () => drop.classList.remove('over'));
      drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); dropImport(e); });
      return h('div', { class: 'bk-empty', 'data-probe': 'bk-empty' }, drop);
    }

    /* ---------------- 主区 ---------------- */
    let elAct = null, elPipe = null;

    function renderMain() {
      clear(main);
      refs = {};
      elAct = null;
      elPipe = null;
      const b = book();
      if (!b) { main.appendChild(renderEmpty()); return; }

      /* 面包屑 */
      main.appendChild(h('div', { class: 'bk-crumb', 'data-probe': 'bk-crumb' },
        h('span', {}, '书籍分析'), h('i', {}, '›'), h('b', {}, b.title || '未命名'), h('i', {}, '›'), h('span', { style: { color: '#5B5348' } }, '拆书结果')));

      /* 标题行 */
      elAct = h('div', { class: 'bk-act' });
      const selN = selChapters().length;
      main.appendChild(h('div', { class: 'bk-head', 'data-probe': 'bk-head' },
        h('div', { class: 'bk-ht' },
          h('h1', { title: b.title }, b.title || '未命名'),
          h('div', { class: 'bk-sub' },
            h('span', {}, (b.chapters || []).length + ' 章'),
            h('span', { class: 'bk-dot' }, '·'),
            h('span', {}, fmtChars(b.chars)),
            h('span', { class: 'bk-dot' }, '·'),
            h('span', {}, '已选 ' + selN + ' 章'),
            h('span', { class: 'bk-dot' }, '·'),
            h('span', { class: 'tiny muted' }, (b.filename || '') + (hasResult(b) ? ' · 已拆解 ' + fmtAt(b.analysis.at) : ' · 待分析')))),
        elAct));

      /* 流水线 */
      elPipe = h('div', { class: 'card bk-pipe', 'data-probe': 'bk-pipe' });
      main.appendChild(elPipe);

      /* 统计 */
      const an = hasResult(b) ? b.analysis : null;
      const sCh = h('b', {}, fmtNum((b.chapters || []).length));
      refs.statPending = h('b', {}, String(pickCount()));
      main.appendChild(h('div', { class: 'bk-stats', 'data-probe': 'bk-stats' },
        h('div', { class: 'bk-stat' }, sCh, h('small', {}, '章节')),
        h('div', { class: 'bk-stat jade' }, h('b', {}, an ? fmtNum((an.people || []).length) : '—'), h('small', {}, '识别人物')),
        h('div', { class: 'bk-stat jade' }, h('b', {}, an ? fmtNum((an.plots || []).length) : '—'), h('small', {}, '情节要点')),
        h('div', { class: 'bk-stat gold' }, refs.statPending, h('small', {}, '待确认'))));

      /* 两栏 */
      main.appendChild(h('div', { class: 'bk-cols', 'data-probe': 'bk-cols' },
        renderChapters(b), renderResults(b)));

      /* 入库前检查 */
      main.appendChild(renderCommit(b));

      renderPipe();
      renderActions();
    }

    function renderActions() {
      const b = book();
      if (!elAct || !b) return;
      clear(elAct);
      if (st.analyzing) {
        elAct.appendChild(h('button', { class: 'btn', onclick: cancelAnalyze }, '取消'));
        elAct.appendChild(h('button', { class: 'btn pri', disabled: true },
          h('span', { class: 'spin' }), '分析中…'));
        return;
      }
      elAct.appendChild(h('button', {
        class: 'btn', disabled: st.resplitting || st.committing,
        title: '按当前规则再切一次章节',
        onclick: () => applyRule(st.rule, true)
      }, st.resplitting ? h('span', { class: 'spin' }) : '重新切分'));
      elAct.appendChild(h('button', {
        class: 'btn' + (hasResult(b) ? '' : ' pri'),
        disabled: st.committing,
        title: hasKey() ? '把勾选的章节发给你的模型接口' : '先在设置里配置模型接口与 API Key',
        onclick: startAnalyze
      }, '开始分析'));
      if (hasResult(b)) {
        const n = pickCount();
        elAct.appendChild(h('button', {
          class: 'btn pri',
          disabled: !n || st.committing,
          title: n ? '把勾选的人物与情节写进人物页 / 情节页' : '先勾选要入库的条目',
          onclick: commitAll
        }, st.committing ? h('span', { class: 'spin' }) : '一键入库 ' + n));
      }
    }

    function renderPipe() {
      const b = book();
      if (!elPipe || !b) return;
      clear(elPipe);
      const an = hasResult(b) ? b.analysis : null;
      const steps = [
        { k: '导入', s: 'done' },
        { k: '分章', s: (b.chapters || []).length ? 'done' : 'doing' },
        { k: '人物', s: st.analyzing ? 'doing' : (an && (an.people || []).length ? 'done' : 'todo') },
        { k: '情节', s: st.analyzing ? 'doing' : (an && (an.plots || []).length ? 'done' : 'todo') },
        { k: '入库', s: st.committed ? 'done' : (st.committing ? 'doing' : 'todo') }
      ];
      const row = h('div', { class: 'bk-steps' });
      steps.forEach((s, i) => {
        if (i) row.appendChild(h('span', { class: 'bk-arw' }, '→'));
        row.appendChild(h('div', { class: 'bk-step ' + s.s, 'data-step': s.k },
          h('i', {}, s.s === 'done' ? '✓' : (s.s === 'doing' ? '·' : '')),
          s.k));
      });
      const total = st.progress && st.progress.total ? st.progress.total : 0;
      const done = st.progress && st.progress.done != null ? st.progress.done : 0;
      const pct = st.analyzing && total ? Math.round((done / total) * 100) : (an ? 100 : 0);
      let status;
      if (st.analyzing) status = (st.progress && st.progress.message) || '正在读取章节…';
      else if (an) status = '已拆解 · 人物 ' + (an.people || []).length + ' · 情节 ' + (an.plots || []).length + ' · ' + fmtAt(an.at);
      else status = hasKey() ? '尚未拆解 · 勾选章节后点「开始分析」' : '尚未拆解 · 需要先在设置里配置模型接口';
      elPipe.appendChild(row);
      elPipe.appendChild(h('div', { class: 'bk-pipefoot' },
        h('div', { class: 'bar' }, h('i', { style: { width: pct + '%' } })),
        h('span', { class: 'bk-st tiny', 'data-probe': 'bk-status' }, status),
        h('span', { class: 'grow' }),
        h('span', { class: 'bk-pc' }, st.analyzing && total ? done + '/' + total + ' 批' : pct + '%')));
    }

    /* ---------------- 章节列表 ---------------- */
    function renderChapters(b) {
      const card = h('section', { class: 'card bk-card', 'data-probe': 'bk-chaps' });
      const tabs = h('div', { class: 'bk-tabs' });
      RULES.forEach(r => tabs.appendChild(h('span', {
        class: r.k === st.rule ? 'on' : '',
        title: '换一种切分规则会重新切分这本书',
        onclick: () => { if (r.k !== st.rule) applyRule(r.k); }
      }, r.label)));
      const body = h('div', { class: 'bk-cbody', 'data-probe': 'bk-chapbody' });
      const foot = h('div', { class: 'bk-cfoot' });
      refs.chapFoot = h('span');
      foot.appendChild(refs.chapFoot);
      foot.appendChild(h('span', { class: 'grow' }));
      foot.appendChild(h('span', { class: 'tiny', style: { color: '#A2957E' } }, '默认全选 · 只分析勾选的章节'));

      card.appendChild(h('div', { class: 'bk-chead' },
        h('h3', {}, '章节列表'),
        h('span', { class: 'bk-n' }, '· ' + (b.chapters || []).length + ' 章'),
        h('span', { class: 'grow' }),
        tabs,
        h('button', { class: 'btn xs', onclick: () => setAllChapters(true) }, '全选'),
        h('button', { class: 'btn xs', title: '逐章取反', onclick: invertChapters }, '反选')));

      const head = h('div', { class: 'bk-row bk-row-h' },
        h('span', { class: 'bk-ck' + (allChaptersOn() ? ' on' : ''), onclick: () => setAllChapters(!allChaptersOn()) }, '✓'),
        h('span', {}, '章'),
        h('span', {}, '标题'),
        h('span', { style: { textAlign: 'right' } }, '字数'),
        h('span', {}, '摘要首句'));
      body.appendChild(head);
      (b.chapters || []).forEach(c => {
        const ck = h('span', { class: 'bk-ck' + (st.sel[c.idx] ? ' on' : '') }, '✓');
        const row = h('div', { class: 'bk-row' + (st.sel[c.idx] ? ' on' : ''), 'data-ch': c.idx },
          ck,
          h('span', { class: 'bk-no' }, c.idx),
          h('span', { class: 'bk-ttl', title: c.title }, c.title || '（无标题）'),
          h('span', { class: 'bk-num' }, fmtNum(c.chars)),
          h('span', { class: 'bk-ex', title: c.excerpt || '' }, c.excerpt || '—'));
        row.addEventListener('click', () => {
          st.sel[c.idx] = !st.sel[c.idx];
          row.classList.toggle('on', !!st.sel[c.idx]);
          ck.classList.toggle('on', !!st.sel[c.idx]);
          head.firstChild.classList.toggle('on', allChaptersOn());
          refreshSelection();
        });
        body.appendChild(row);
      });
      card.appendChild(body);
      card.appendChild(foot);
      refreshSelection();
      return card;
    }

    function allChaptersOn() {
      const b = book();
      if (!b || !b.chapters.length) return false;
      return b.chapters.every(c => st.sel[c.idx]);
    }
    function setAllChapters(on) {
      const b = book();
      if (!b || st.analyzing) return;
      b.chapters.forEach(c => { st.sel[c.idx] = !!on; });
      renderMain();
    }
    /* 反选：逐章取反 */
    function invertChapters() {
      const b = book();
      if (!b || st.analyzing) return;
      b.chapters.forEach(c => { st.sel[c.idx] = !st.sel[c.idx]; });
      renderMain();
    }

    /* ---------------- 抽取结果 ---------------- */
    function renderResults(b) {
      const an = hasResult(b) ? b.analysis : null;
      const card = h('section', { class: 'card bk-card', 'data-probe': 'bk-res' });
      const head = h('div', { class: 'bk-chead' }, h('h3', {}, '抽取结果'));
      if (an) {
        const tabs = h('div', { class: 'bk-tabs' });
        [['people', '人物', (an.people || []).length], ['plots', '情节', (an.plots || []).length]].forEach(([k, label, n]) => {
          tabs.appendChild(h('span', {
            class: st.tab === k ? 'on' : '',
            onclick: () => { st.tab = k; renderMain(); }
          }, label, h('em', {}, String(n))));
        });
        head.appendChild(h('span', { class: 'bk-n' }, '· ' + (st.tab === 'people' ? '按出现次数排序' : '按分析批次排序')));
        head.appendChild(h('span', { class: 'grow' }));
        head.appendChild(tabs);
        head.appendChild(h('button', {
          class: 'btn xs', title: '勾选 / 取消勾选全部',
          onclick: () => toggleAllPicks(!allPicksOn())
        }, allPicksOn() ? '全不选' : '全选'));
      }
      const body = h('div', { class: 'bk-cbody', 'data-probe': 'bk-resbody' });
      const foot = h('div', { class: 'bk-cfoot' });
      refs.resFoot = h('span');
      foot.appendChild(refs.resFoot);
      foot.appendChild(h('span', { class: 'grow' }));
      foot.appendChild(h('span', { class: 'tiny', style: { color: '#A2957E' } }, an ? '置信度按出现次数估算，仅供参考' : '分析结果只存在本机'));
      card.appendChild(head);

      if (!an) {
        body.appendChild(hasKey() ? guideNoResult() : guideNoKey());
      } else if (st.tab === 'people') {
        const people = (an.people || []);
        if (!people.length) body.appendChild(h('div', { class: 'empty' }, '这一轮没有抽到人物'));
        people.forEach((p, i) => {
          const on = st.pickP.has(p.name);
          const ck = h('span', { class: 'bk-ck' + (on ? ' on' : '') }, '✓');
          const conf = confidenceOf(p.count);
          const row = h('div', { class: 'bk-prow' + (on ? ' on' : ''), 'data-person': p.name },
            h('div', { class: 'avatar', style: { width: '24px', height: '24px', background: AVATAR_COLORS[i % AVATAR_COLORS.length], fontSize: '12px', borderRadius: '6px' } }, (p.name || '?').slice(0, 1)),
            h('div', { class: 'bk-pname' },
              h('b', {}, p.name),
              h('small', {}, (p.aliases || []).length ? '亦作 ' + p.aliases.join('、') : (p.identity || '—')),
              h('small', { style: { marginLeft: 'auto' } }, '出现 ' + (p.count || 1) + ' 次')),
            h('div', { class: 'bk-pmeta' },
              h('span', { class: 'pill ' + (conf >= 90 ? 'jade' : conf >= 80 ? 'gold' : 'grey'), title: '按出现次数估算的置信度' }, conf + '%'),
              ck));
          row.addEventListener('click', () => {
            if (st.pickP.has(p.name)) st.pickP.delete(p.name); else st.pickP.add(p.name);
            row.classList.toggle('on', st.pickP.has(p.name));
            ck.classList.toggle('on', st.pickP.has(p.name));
            refreshSelection();
          });
          body.appendChild(row);
        });
      } else {
        const plots = (an.plots || []);
        if (!plots.length) body.appendChild(h('div', { class: 'empty' }, '这一轮没有抽到情节'));
        plots.forEach((p, i) => {
          const on = st.pickPl.has(p.title);
          const ck = h('span', { class: 'bk-ck' + (on ? ' on' : '') }, '✓');
          const row = h('div', { class: 'bk-plrow' + (on ? ' on' : ''), 'data-plot': p.title },
            h('span', { class: 'bk-pin' }, String(i + 1).padStart(2, '0')),
            h('div', {},
              h('div', { class: 'bk-plname' }, p.title),
              h('div', { class: 'bk-plsum' }, p.summary || '（暂无摘要）'),
              ((p.characters || []).length || p.chapter) ? h('div', { class: 'bk-plch' },
                (p.characters || []).slice(0, 5).map(n => h('i', {}, n)),
                p.chapter ? h('i', { style: { color: '#8C8272', background: 'transparent', borderStyle: 'dashed' } }, p.chapter) : null) : null),
            ck);
          row.addEventListener('click', () => {
            if (st.pickPl.has(p.title)) st.pickPl.delete(p.title); else st.pickPl.add(p.title);
            row.classList.toggle('on', st.pickPl.has(p.title));
            ck.classList.toggle('on', st.pickPl.has(p.title));
            refreshSelection();
          });
          body.appendChild(row);
        });
      }
      card.appendChild(body);
      card.appendChild(foot);
      refreshSelection();
      return card;
    }

    function allPicksOn() {
      const b = book();
      const an = b && b.analysis;
      if (!an) return false;
      const list = st.tab === 'people' ? (an.people || []) : (an.plots || []);
      if (!list.length) return false;
      return st.tab === 'people' ? list.every(p => st.pickP.has(p.name)) : list.every(p => st.pickPl.has(p.title));
    }
    function toggleAllPicks(on) {
      const b = book();
      const an = b && b.analysis;
      if (!an) return;
      if (st.tab === 'people') {
        st.pickP = on ? new Set((an.people || []).map(p => p.name)) : new Set();
      } else {
        st.pickPl = on ? new Set((an.plots || []).map(p => p.title)) : new Set();
      }
      renderMain();
    }

    function guideNoKey() {
      return h('div', { class: 'bk-guide', 'data-probe': 'bk-guide' },
        h('div', { class: 'bk-glyph sm' }, '✧'),
        h('h4', {}, '还没有配置模型接口'),
        h('p', {}, '拆书要用你自己的大模型 API：填好接口地址、模型名和 API Key，勾选章节后就能开始分析。只把勾选的章节片段发出去，原文件不会上传，Key 加密保存在本机。'),
        h('button', { class: 'btn pri', onclick: () => NF.go('settings') }, '去设置接口 ›'),
        h('div', { class: 'tiny muted' }, '没有 Key 之前不会发起任何网络请求'));
    }
    function guideNoResult() {
      return h('div', { class: 'bk-guide', 'data-probe': 'bk-guide' },
        h('div', { class: 'bk-glyph sm' }, '✧'),
        h('h4', {}, '还没有拆解结果'),
        h('p', {}, '左边勾选要分析的章节，点右上角「开始分析」。分析按每批约 6000 字分批发送，进度会显示在上方，中途可以取消。'),
        h('div', { class: 'tiny muted' }, '当前已选 ' + selChapters().length + ' 章'));
    }

    /* ---------------- 入库前检查 ---------------- */
    function renderCommit(b) {
      const an = hasResult(b) ? b.analysis : null;
      const box = h('div', { class: 'bk-commit' + (an ? '' : ' off'), 'data-probe': 'bk-commit' });
      refs.commitText = h('span');
      if (!an) {
        box.appendChild(h('span', {}, '分析完成后可一键入库：导入的人物写进人物页，情节写进情节页。'));
        box.appendChild(h('span', { class: 'grow' }));
        box.appendChild(h('span', { class: 'bk-ck-t' }, '入库前会自动备份当前数据'));
        return box;
      }
      box.appendChild(refs.commitText);
      box.appendChild(h('span', { class: 'grow' }));
      box.appendChild(h('span', { class: 'bk-ck-t' }, '原数据会先自动备份，可随时回滚'));
      refreshSelection();
      return box;
    }

    /* ---------------- 选择联动刷新 ---------------- */
    function commitPreview() {
      const b = book();
      const an = b && b.analysis;
      if (!an) return { addC: 0, mergeC: 0, addP: 0 };
      const names = new Set((doc.characters || []).map(c => c.name));
      let addC = 0, mergeC = 0;
      (an.people || []).forEach(p => {
        if (!st.pickP.has(p.name)) return;
        if (names.has(p.name)) mergeC++; else addC++;
      });
      /* 主进程入库情节时不去重，勾选的都会新增一条 */
      const addP = st.pickPl.size;
      return { addC, mergeC, addP };
    }

    function refreshSelection() {
      const b = book();
      if (!b) return;
      const total = (b.chapters || []).length;
      const selN = selChapters().length;
      if (refs.chapFoot) refs.chapFoot.textContent = '已选 ' + selN + ' / ' + total + ' 章';
      if (refs.statPending) refs.statPending.textContent = String(pickCount());
      if (refs.resFoot) {
        const an = hasResult(b) ? b.analysis : null;
        if (!an) refs.resFoot.textContent = '—';
        else if (st.tab === 'people') refs.resFoot.textContent = '已选 ' + st.pickP.size + ' / ' + (an.people || []).length + ' 人';
        else refs.resFoot.textContent = '已选 ' + st.pickPl.size + ' / ' + (an.plots || []).length + ' 条';
      }
      if (refs.commitText) {
        const pv = commitPreview();
        refs.commitText.textContent = '';
        refs.commitText.appendChild(document.createTextNode('将新增 '));
        refs.commitText.appendChild(h('b', {}, String(pv.addC)));
        refs.commitText.appendChild(document.createTextNode(' 人 / 更新 '));
        refs.commitText.appendChild(h('b', {}, String(pv.mergeC)));
        refs.commitText.appendChild(document.createTextNode(' 人 / 新增 '));
        refs.commitText.appendChild(h('b', {}, String(pv.addP)));
        refs.commitText.appendChild(document.createTextNode(' 条情节'));
      }
      const btns = elAct ? Array.from(elAct.querySelectorAll('.btn')) : [];
      const commitBtn = btns[btns.length - 1];
      if (commitBtn && hasResult(b) && !st.analyzing) {
        const n = pickCount();
        commitBtn.textContent = '一键入库 ' + n;
        commitBtn.disabled = !n || st.committing;
      }
    }

    /* ---------------- 动作：导入 ---------------- */
    async function importBook() {
      if (st.importing) return;
      let picked;
      try {
        picked = await window.nf.files.pick({
          title: '选择整本小说（.txt / .docx）',
          filters: [{ name: '小说文本', extensions: ['txt', 'docx'] }]
        });
      } catch (e) { toast('打开文件选择框失败：' + (e.message || e), 'err'); return; }
      if (!picked || picked.canceled) return;
      await createBook(picked.file);
    }

    async function createBook(file) {
      st.importing = true;
      renderSide();
      renderMain();
      try {
        const nb = await window.nf.book.create(file);
        doc.books.push(nb);
        st.bookId = nb.id;
        initBookState(nb);
        const chN = (nb.chapters || []).length;
        if (chN <= 1) toast('已导入《' + nb.title + '》，但没找到「第X章」标题，可切换到「按空行」重新切分', 'err');
        else toast('已导入《' + nb.title + '》· ' + chN + ' 章 · ' + fmtChars(nb.chars), 'ok');
      } catch (e) {
        toast('导入失败：' + (e && e.message || e), 'err');
      } finally {
        st.importing = false;
        if (alive) { renderSide(); renderMain(); }
      }
    }

    function dropImport(e) {
      const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      let p = '';
      try { p = f && window.nf.files.pathFor ? window.nf.files.pathFor(f) : ''; } catch (err) { p = ''; }
      if (!p) p = (f && f.path) || '';
      if (!p) { toast('拖放取不到文件路径，请点「选择整本小说」选文件', 'err'); return; }
      const ok = /\.(txt|docx)$/i.test(p);
      if (!ok) { toast('只支持 .txt 与 .docx 整本小说', 'err'); return; }
      createBook(p);
    }

    /* ---------------- 动作：切分 ---------------- */
    async function applyRule(rule, force) {
      const b = book();
      if (!b || st.analyzing || st.resplitting) return;
      if (!force && rule === st.rule) return;
      st.resplitting = true;
      renderActions();
      try {
        const nb = await window.nf.book.resplit(b.id, rule);
        Object.assign(b, nb);
        st.rule = nb.rule || rule;
        st.sel = {};
        (nb.chapters || []).forEach(c => { st.sel[c.idx] = true; });
        st.pickP = new Set(((nb.analysis && nb.analysis.people) || []).map(p => p.name));
        st.pickPl = new Set(((nb.analysis && nb.analysis.plots) || []).map(p => p.title));
        toast('已重新切分：' + (nb.chapters || []).length + ' 章（' + ((RULES.find(r => r.k === st.rule) || {}).label || st.rule) + '）' + (nb.analysis ? '，原拆解结果保留，可重新分析' : ''), 'ok');
      } catch (e) {
        toast('重新切分失败：' + (e && e.message || e), 'err');
      } finally {
        st.resplitting = false;
        if (alive) { renderSide(); renderMain(); }
      }
    }

    /* ---------------- 动作：分析 ---------------- */
    async function startAnalyze() {
      const b = book();
      if (!b || st.analyzing) return;
      if (!hasKey()) {
        toast('还没有配置模型接口：请在设置里填好接口地址、模型和 API Key', 'err');
        return;
      }
      const keep = selChapters().map(c => c.idx);
      if (!keep.length) { toast('至少勾选一章再开始分析', 'err'); return; }
      st.analyzing = true;
      st.committed = false;
      st.lastErr = null;
      st.progress = { phase: 'start', done: 0, total: 0, message: '准备把 ' + keep.length + ' 章分批发送…' };
      renderMain();
      try {
        const nb = await window.nf.book.analyze({ bookId: b.id, keepIndexes: keep, steps: ['people', 'plots'] });
        Object.assign(b, nb);
        const an = nb.analysis || { people: [], plots: [] };
        st.pickP = new Set((an.people || []).map(p => p.name));
        st.pickPl = new Set((an.plots || []).map(p => p.title));
        st.analyzing = false;
        st.tab = 'people';
        if (!(an.people || []).length && !(an.plots || []).length) {
          toast('这一轮没有抽到内容' + (st.lastErr ? '：' + st.lastErr : '，可能是接口报错或章节太少'), 'err');
          st.lastErr = null;
        } else {
          toast('拆解完成：人物 ' + (an.people || []).length + ' · 情节 ' + (an.plots || []).length, 'ok');
        }
      } catch (e) {
        const msg = String((e && e.message) || e);
        st.analyzing = false;
        if (/已取消|cancel/i.test(msg)) toast('已取消分析');
        else toast('分析失败：' + msg, 'err');
      } finally {
        if (!alive) return;
        st.progress = null;
        renderSide();
        renderMain();
      }
    }

    async function cancelAnalyze() {
      try {
        await window.nf.book.cancel();
        toast('已请求取消，当前批次结束后会停下');
      } catch (e) { toast('取消失败：' + (e && e.message || e), 'err'); }
    }

    /* ---------------- 动作：入库 ---------------- */
    async function reloadDoc() {
      try {
        const fresh = await window.nf.data.load();
        for (const k of ['characters', 'plots', 'books']) if (Array.isArray(fresh[k])) doc[k] = fresh[k];
      } catch (e) { toast('同步数据失败：' + (e.message || e), 'err'); }
    }

    async function commitAll() {
      const b = book();
      if (!b || !hasResult(b) || st.committing) return;
      const people = Array.from(st.pickP);
      const plots = Array.from(st.pickPl);
      if (!people.length && !plots.length) { toast('还没有勾选要入库的条目', 'err'); return; }
      st.committing = true;
      renderActions();
      try {
        const r = await window.nf.book.commit({ bookId: b.id, people: people.map(name => ({ name })), plots });
        await reloadDoc();
        st.pickP = new Set();
        st.pickPl = new Set();
        st.committed = true;
        toast('已入库：新增 ' + r.addedC + ' 人 / 更新 ' + r.mergedC + ' 人 / 新增 ' + r.addedP + ' 条情节', 'ok');
      } catch (e) {
        toast('入库失败：' + (e && e.message || e), 'err');
      } finally {
        st.committing = false;
        if (alive) { renderSide(); renderMain(); }
      }
    }

    /* ---------------- 动作：切书 / 移出 ---------------- */
    function selectBook(id) {
      if (id === st.bookId || st.analyzing) {
        if (id === st.bookId) return;
        toast('正在分析，等这一轮结束再切换书籍');
        return;
      }
      st.bookId = id;
      initBookState(book());
      renderSide();
      renderMain();
    }

    function removeBook(b) {
      modal({
        title: '移出书库', width: '460px',
        body: h('div', { class: 'col' },
          h('div', {}, '把《' + (b.title || '未命名') + '》移出书库？'),
          h('div', { class: 'small muted' }, '这本书的分章与拆解结果会一起移除，本机副本也会删除；已经入库的人物和情节不受影响。')),
        okText: '移出',
        onOk: async () => {
          try {
            await window.nf.book.remove(b.id);
            doc.books = doc.books.filter(x => x.id !== b.id);
            if (st.bookId === b.id) {
              st.bookId = (doc.books[0] && doc.books[0].id) || null;
              initBookState(book());
            }
            if (alive) { renderSide(); renderMain(); }
            toast('已移出书库', 'ok');
          } catch (e) { toast('移出失败：' + (e && e.message || e), 'err'); return false; }
        }
      });
    }

    /* ---------------- 进度监听：全页只注册一次 ---------------- */
    if (unsubscribeProgress) { try { unsubscribeProgress(); } catch (e) { /* ignore */ } unsubscribeProgress = null; }
    unsubscribeProgress = window.nf.on('book:progress', d => {
      if (!alive || !d) return;
      if (!st.analyzing) {
        /* 不是本页发起的分析：只在开始时接管，其余忽略 */
        if (d.phase !== 'start') return;
        st.analyzing = true;
      }
      st.progress = d;
      if (d.phase === 'batch-error') st.lastErr = d.message;
      renderPipe();
    });

    /* ---------------- 首屏 ---------------- */
    initBookState(book());
    renderSide();
    renderMain();

  }
};