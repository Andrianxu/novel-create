import { h, clear, toast, modal, injectStyle } from '../util.js';
import { openLibrary, findBookByName } from '../library.js';

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
/* ---------- 入库选项弹窗 ---------- */
.bk-cm-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.bk-cm-tab{border:1px solid #DFD4BF;border-radius:10px;background:#FFFCF5;padding:10px 12px;cursor:pointer;display:flex;flex-direction:column;gap:3px;transition:all .12s;min-width:0}
.bk-cm-tab:hover{border-color:#CBB894;background:#FFFDF8}
.bk-cm-tab.on{border-color:#201C18;background:#F6F1E6;box-shadow:inset 0 0 0 1px #201C18}
.bk-cm-tab b{font-size:12.5px;font-weight:400;font-family:var(--kai);letter-spacing:.04em;display:flex;align-items:center;gap:6px}
.bk-cm-tab b em{font-style:normal;font-size:9px;font-family:var(--mono);color:#A79C89;letter-spacing:.06em}
.bk-cm-tab small{font-size:10px;color:#8C8272;line-height:1.6}
.bk-cm-menu{display:flex;flex-wrap:wrap;gap:4px}
.bk-cm-menu span{font-size:10.5px;color:#5B5348;border:1px solid #DFD4BF;background:#FFFDF8;border-radius:999px;padding:1px 9px;cursor:pointer;user-select:none}
.bk-cm-menu span:hover{border-color:#C2A97D;background:#F6F1E6}
.bk-cm-menu span.on{background:#201C18;border-color:#201C18;color:#F6F1E6}
.bk-cm-tip{font-size:10.5px;color:#8C8272;line-height:1.65}
.bk-cm-tip.warn{color:#A8322A}
.bk-cm-sec{border-top:1px dashed #E0D4BE;padding-top:9px;display:flex;flex-direction:column;gap:6px}
.bk-cm-sec:first-child{border-top:none;padding-top:0}
.bk-cm-sec .bk-cm-h{display:flex;align-items:center;gap:7px;font-size:11.5px;color:#5B5348}
.bk-cm-sec .bk-cm-h b{font-weight:400;font-size:12px;color:#201C18;font-family:var(--kai);letter-spacing:.04em}
.bk-cm-sec .bk-cm-h .grow{flex:1}
.bk-cm-cnt{display:flex;flex-wrap:wrap;gap:5px}
.bk-cm-cnt i{font-style:normal;font-size:10px;color:#5B5348;background:#F5EEDF;border:1px solid #EAE1CF;border-radius:5px;padding:1px 7px;font-family:var(--mono)}
.bk-cm-mini{width:100%;max-height:176px;overflow:auto;border:1px solid #EAE1CF;border-radius:8px;background:#FFFDF8}
.bk-cm-ch{display:flex;align-items:center;gap:7px;padding:4px 9px;border-bottom:1px solid #F4EDDD;font-size:11px;cursor:pointer}
.bk-cm-ch:last-child{border-bottom:none}
.bk-cm-ch:hover{background:#FBF6E9}
.bk-cm-ch .bk-no{font-family:var(--mono);font-size:9.5px;color:#A2957E;width:22px;text-align:right;flex:none}
.bk-cm-ch .bk-ttl{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bk-cm-ch .bk-num{font-size:9.5px;color:#8C8272;font-family:var(--mono);flex:none}
.bk-cm-bk{width:100%;max-height:168px;overflow:auto;border:1px solid #EAE1CF;border-radius:8px;background:#FFFDF8;display:flex;flex-direction:column}
.bk-cm-bk .lib-row{border:none;border-bottom:1px solid #F4EDDD;border-radius:0;background:transparent}
.bk-cm-bk .lib-row:hover{background:#FBF6E9}
.bk-cm-bk .lib-row.on{background:#FCF5E4;box-shadow:none}
.bk-cm-bk .lib-row .lib-acts{display:none!important}
.bk-cm-sum{border:1px dashed #E0C79B;background:#FBF3E6;border-radius:9px;padding:8px 12px;font-size:11.5px;line-height:1.8;color:#5B5348}
.bk-cm-sum b{color:#8A6421;font-weight:400}
.bk-cm-sum .warn{color:#A8322A}
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
/* 模块级：记住上次勾了哪几章 / 选了哪几条 / 上次入库到哪里（切页不丢） */
const uiMemo = new Map();

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
      commitTo: null,       /* 上次入库到哪本书（'current' 或书号），入库弹窗默认选它 */
      progress: null,
      lastErr: null
    };
    let alive = true;
    let refs = {};
    disposeMount = () => { alive = false; };
    const book = () => doc.books.find(b => b.id === st.bookId) || null;
    const hasKey = () => !!(NF.settings && NF.settings.hasApiKey);
    const curBookTitle = () => ((doc.meta && doc.meta.title) || '当前书籍');
    const curBookId = () => ((NF.library && NF.library.activeId) || '');
    /* 新书书名候选：base+tag 被书库占用了就往后加序号，保证推出来的名字点一下就能用 */
    const freeBookTitle = (base, tag) => {
      const stem = String(base || '未命名').trim() || '未命名';
      let t = stem + (tag || '');
      for (let i = 2; i <= 20 && findBookByName(NF, t); i++) t = stem + (tag || '') + ' ' + i;
      return t;
    };

    /* 勾了什么、选了哪几条存在书里：切走 / 关掉软件再回来还是原样 */
    function initBookState(b) {
      st.rule = (b && b.rule) || 'chapter';
      /* 告诉主进程现在看的是哪本：入库要按它把拆书结果找回来（界面切页不丢） */
      if (b) { try { window.nf.book.touch(b.id).catch(() => {}); } catch (e) { /* ignore */ } }
      const memo = (b && uiMemo.get(b.id)) || {};
      const an = (b && b.analysis) || null;
      st.sel = {};
      /* 勾选以数据里的 kept 为准（主进程按书存下来的，重开软件也在）；
       * 没存过 kept 的书（老数据 / 刚导入）才按"全选"来。 */
      const anyKept = ((b && b.chapters) || []).some(c => c.kept !== undefined);
      ((b && b.chapters) || []).forEach(c => {
        if (anyKept) st.sel[c.idx] = !!c.kept;
        else if (c.preface && c.idx === 1) st.sel[c.idx] = true;   /* 前言默认带上 */
        else st.sel[c.idx] = memo.sel ? !!memo.sel[c.idx] : true;
      });
      const tab = (an && an.tab) || null;
      st.pickP = new Set((tab && tab.people) || ((an && an.people) || []).map(p => p.name));
      st.pickPl = new Set((tab && tab.plots) || ((an && an.plots) || []).map(p => p.title));
      st.tab = (memo.tab === 'plots' ? 'plots' : 'people');
      st.analyzing = false;
      st.committed = false;
      st.commitTo = null;
      st.progress = null;
      snapSel(b);
    }
    /* 章表重排（主进程会给老书同步章表，比如多出一个「前言」）以后，勾选要按标题搬过去：
     * 勾选是按序号存的，序号一挪就会串成「前言勾上了、最后一章反而掉勾」——踩过一次。 */
    let selSnap = null;
    function snapSel(b) {
      selSnap = ((b && b.chapters) || []).map(c => ({ t: String(c.title || ''), on: !!st.sel[c.idx] }));
    }
    function remapSel(b) {
      const list = (b && b.chapters) || [];
      if (!selSnap) { snapSel(b); return false; }
      const now = list.map(c => String(c.title || ''));
      if (now.length === selSnap.length && now.every((t, i) => t === selSnap[i].t)) return false;
      const byTitle = new Map();
      selSnap.forEach(s => byTitle.set(s.t, s.on));
      const next = {};
      list.forEach(c => {
        const k = String(c.title || '');
        next[c.idx] = byTitle.has(k) ? byTitle.get(k) : true;   /* 没见过的新章默认勾上 */
      });
      st.sel = next;
      snapSel(b);
      return true;
    }
    /* 把当前勾选存回数据（NF.save 只管落盘，这里顺手记一下页面状态） */
    function persistTab() {
      const b = book();
      if (!b) return;
      b.chapters = (b.chapters || []).map(c => Object.assign({}, c, { kept: !!st.sel[c.idx] }));
      if (b.analysis) {
        b.analysis.tab = {
          people: Array.from(st.pickP), plots: Array.from(st.pickPl), at: new Date().toISOString()
        };
      }
    }
    /* 勾选变了：记下来（切页不丢）并落盘，下次打开还是这个勾法 */
    function touchSel() {
      const b = book();
      if (!b) return;
      uiMemo.set(b.id, { sel: Object.assign({}, st.sel), tab: st.tab });
      snapSel(b);
      persistTab();
      NF.save(b.chapters, '勾选章节');
      /* 页面状态再单独存一份进书里（撤销快照里不一定有它），下次打开还是这个样子 */
      const bid = b.id;
      const sel = (b.chapters || []).filter(c => st.sel[c.idx]);
      window.nf.book.tab({
        bookId: bid, keep: sel.map(c => c.idx), keepTitles: sel.map(c => c.title || ''),
        people: Array.from(st.pickP), plots: Array.from(st.pickPl)
      }).catch(() => { /* 存不上不影响当前操作 */ });
    }
    const selChapters = () => {
      const b = book();
      return b ? (b.chapters || []).filter(c => st.sel[c.idx]) : [];
    };
    const keepIndexes = () => selChapters().map(c => c.idx);
    /* 真正的章节 = 标题里认得出「第X章 / 回 / 节」；前言 / 卷首这种没有章号的会并进第一章开头，
     * 所以算「会导进去几章」时不算它（以前按每章都带 preface 标记数，结果全都不带就数错了）。 */
    const isRealChapter = c => /^\s*第\s*[0-9零〇一二三四五六七八九十百千万两]+\s*[章回节]/.test(String((c && c.title) || ''));
    const chapPlanCount = () => selChapters().filter(isRealChapter).length;
    const pickCount = () => st.pickP.size + st.pickPl.size;
    /* 能不能入库：有分析结果（人物 / 情节），或者至少分了章（只导正文） */
    const canCommit = (b) => {
      const bk = b || book();
      if (!bk) return false;
      return hasResult(bk) || (bk.chapters || []).length > 0;
    };

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
      /* 导入整本书 + 去书籍库建书 / 切书（入库时要把正文放进哪本书，得先有那本书） */
      aside.appendChild(h('div', { style: { display: 'flex', gap: '5px', alignItems: 'stretch' } },
        h('div', { style: { flex: '1', minWidth: '0', display: 'flex' } }, importButton()),
        h('button', {
          class: 'btn xs', title: '打开书籍库：新建 / 切换 / 改名 / 复制书籍',
          style: { flex: 'none' }, onclick: () => openLibrary(NF)
        }, '书籍库 ›')));
      aside.appendChild(h('div', { class: 'tiny muted', style: { padding: '0 3px', lineHeight: '1.6' } },
        '正在写作：《' + curBookTitle() + '》'));
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
            h('small', { style: { color: analyzed ? '#23604F' : '#A2957E' } }, analyzed ? '已拆解 · 可入库' : (chN ? '待分析 · 正文可入库' : '待分析'))),
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
        h('div', { style: { color: '#A2957E' } }, '入库时人物 · 情节 · 章节正文一起导进书籍')));
    }

    /* ---------------- 空状态 ---------------- */
    function renderEmpty() {
      const drop = h('div', { class: 'bk-drop', 'data-probe': 'bk-drop' },
        h('div', { class: 'bk-eyebrow' }, '书 籍 分 析'),
        h('div', { class: 'bk-glyph' }, '⤓'),
        h('h2', {}, '把整本书拖进来'),
        h('p', {}, '支持 .txt 与 .docx 整本小说。导入后自动按「第X章」切分章节，再从你勾选的章节里抽人物、抽情节；入库时可以把人物、情节和章节正文一起导进当前这本书，或者导进一本新的书。'),
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
      if (canCommit(b)) {
        const n = pickCount();
        const hasT = (b.chapters || []).length > 0;
        elAct.appendChild(h('button', {
          class: 'btn pri',
          disabled: st.committing || (!n && !hasT),
          title: '选把人物 · 情节 · 章节正文导进当前这本书，还是导进一本新书',
          onclick: openCommitDialog
        }, st.committing ? h('span', { class: 'spin' }) : ('入库…' + (n ? ' ' + n : ''))));
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
        { k: '正文', s: (b.chapters || []).length ? 'done' : 'todo' },
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
      foot.appendChild(h('span', { class: 'tiny', style: { color: '#A2957E' } }, '勾的章节用来分析，也会作为正文入库'));

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
          touchSel();
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
      touchSel();
    }
    /* 反选：逐章取反 */
    function invertChapters() {
      const b = book();
      if (!b || st.analyzing) return;
      b.chapters.forEach(c => { st.sel[c.idx] = !st.sel[c.idx]; });
      renderMain();
      touchSel();
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
            onclick: () => { st.tab = k; renderMain(); touchSel(); }
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
            touchSel();
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
            touchSel();
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
      touchSel();
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
      const box = h('div', { class: 'bk-commit' + (canCommit(b) ? '' : ' off'), 'data-probe': 'bk-commit' });
      refs.commitText = h('span');
      if (!canCommit(b)) {
        box.appendChild(h('span', {}, '分析完成后可入库：勾选的人物写进人物页、情节写进情节页、章节正文写进章节写作。'));
        box.appendChild(h('span', { class: 'grow' }));
        box.appendChild(h('span', { class: 'bk-ck-t' }, '入库前会自动备份当前数据'));
        return box;
      }
      box.appendChild(refs.commitText);
      box.appendChild(h('span', { class: 'grow' }));
      box.appendChild(h('span', { class: 'bk-ck-t' }, an ? '入库时会问：导进当前这本书，还是新开一本' : '还没分析 · 也可以只把正文导进章节写作'));
      refreshSelection();
      return box;
    }

    /* ---------------- 选择联动刷新 ---------------- */
    /* 入库会写进哪本书：上次选的当前书 / 新书；预览也按那本来算（有没有重名的人） */
    function commitTarget() {
      const to = st.commitTo;
      if (to && to !== 'current') {
        const b = findBookByName(NF, to.title || '');
        if (b) return { kind: 'new', existing: b, title: b.title, id: b.id };
        return { kind: 'new', existing: null, title: to.title || '', id: '' };
      }
      return { kind: 'current', existing: null, title: curBookTitle(), id: curBookId() };
    }
    function commitPreview() {
      const b = book();
      const an = b && b.analysis;
      const target = commitTarget();
      const names = new Set(((target.existing ? ((target.existing.characters || [])) : (doc.characters || []))).map(c => c.name));
      let addC = 0, mergeC = 0;
      ((an && an.people) || []).forEach(p => {
        if (!st.pickP.has(p.name)) return;
        if (names.has(p.name)) mergeC++; else addC++;
      });
      /* 主进程入库情节时不去重，勾选的都会新增一条 */
      const addP = st.pickPl.size;
      const sel = selChapters();
      const addM = sel.filter(isRealChapter).length;
      const textChars = sel.reduce((a, c) => a + (c.chars || 0), 0);
      return { addC, mergeC, addP, addM, textChars, preface: sel.some(c => !isRealChapter(c) && !!(c.title || '').trim()) };
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
        const tgt = commitTarget();
        const add = (label, n) => {
          refs.commitText.appendChild(document.createTextNode(label));
          refs.commitText.appendChild(h('b', {}, String(n)));
        };
        refs.commitText.textContent = '';
        refs.commitText.appendChild(document.createTextNode('将导进「'));
        refs.commitText.appendChild(h('b', {}, tgt.title || '未命名'));
        refs.commitText.appendChild(document.createTextNode('」：'));
        add('人物 +', pv.addC);
        add(' / 更新 ', pv.mergeC);
        add(' / 情节 +', pv.addP);
        add(' / 正文 ', pv.addM);
        refs.commitText.appendChild(document.createTextNode(' 章'));
        if (pv.textChars) refs.commitText.appendChild(document.createTextNode('（' + fmtChars(pv.textChars) + '）'));
        if (pv.preface) refs.commitText.appendChild(h('span', { class: 'tiny', style: { color: '#A2957E' } }, ' · 前言并入首章'));
      }
      const btns = elAct ? Array.from(elAct.querySelectorAll('.btn')) : [];
      const commitBtn = btns[btns.length - 1];
      if (commitBtn && canCommit(b) && !st.analyzing) {
        const n = pickCount();
        commitBtn.textContent = '入库…' + (n ? ' ' + n : '');
        commitBtn.disabled = st.committing || (!n && !selChapters().length);
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
      } catch (e) { toast('打开文件选择框失败：' + (e.message || e), 'err'); st.importing = false; return; }
      if (!picked || picked.canceled) { st.importing = false; return; }
      await createBook(picked.file);
    }

    async function createBook(file) {
      st.importing = true;
      renderSide();
      renderMain();
      try {
        /* 同一本书拖两次：直接打开书库里已有的那本，不重复占地方、也不丢已经分析好的结果 */
        const name = String(file || '').split(/[\\/]/).pop().replace(/\.[^.]+$/, '');
        const dup = name ? doc.books.find(x => x.title === name) : null;
        if (dup) {
          st.bookId = dup.id;
          initBookState(dup);
          toast('《' + dup.title + '》已经在书库里了，直接打开它', 'ok');
          return;
        }
        const nb = await window.nf.book.create(file);
        doc.books.push(nb);
        st.bookId = nb.id;
        initBookState(nb);
        const chN = (nb.chapters || []).length;
        if (chN <= 1) toast('已导入《' + nb.title + '》，但没找到「第X章」标题，可切换到「按空行」重新切分', 'err');
        else toast('已导入《' + nb.title + '》· ' + chN + ' 章 · ' + fmtChars(nb.chars) + ' · 分析后可以把正文导进章节写作', 'ok');
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

    /* 主进程那份 doc 重新读回来：入库 / 分析之后界面要和磁盘对齐 */
    async function reloadDoc() {
      try {
        const fresh = await window.nf.data.load();
        for (const k of ['characters', 'plots', 'books', 'manuscripts', 'chapters', 'meta']) {
          if (fresh[k] !== undefined) doc[k] = fresh[k];
        }
      } catch (e) { toast('同步数据失败：' + (e.message || e), 'err'); }
      /* 主进程可能在分析 / 入库时把章表重排过（老书会多出「前言」）：勾选按标题搬一次，
       * 否则界面上勾的和实际要导的不是同一批章 */
      const b = book();
      if (b && remapSel(b)) {
        try {
          persistTab();
          NF.save(b.chapters, '重排章节勾选');
          window.nf.book.tab({ bookId: b.id, keep: b.chapters.filter(c => st.sel[c.idx]).map(c => c.idx) }).catch(() => {});
        } catch (e) { /* 勾选搬不过来不影响入库 */ }
      }
    }

    /* ---------------- 动作：入库 ----------------
     * 「导到哪里」有两种：
     *   current  现在展示的这本书 —— 直接写进 NF.doc，界面就地刷新；
     *   new      新导入一个书籍     —— 先在主进程里建一本独立的书（书名取整本书的标题），
     *                                 再按书号把人物 / 情节 / 章节正文写进那本，最后切过去。
     * 两种都走 book:commit，正文（章节全文）只在主进程里读，不经过 JSON。 */
    /* 入库选项弹窗：选导到哪本书 + 勾要导什么，底部实时算"会变成什么样" */
    function openCommitDialog() {
      const b = book();
      if (!b || st.committing) return;
      const an = hasResult(b) ? b.analysis : null;
      const hasText = (b.chapters || []).length > 0;
      const bookTitle = String(b.title || '未命名').trim() || '未命名';
      const same = findBookByName(NF, bookTitle);
      const pick = {
        target: st.commitTo && st.commitTo !== 'current' ? 'new' : 'current',
        newTitle: same ? freeBookTitle(bookTitle, '（拆书）') : bookTitle,
        text: hasText,
        people: !!an,
        plots: !!an,
        kind: 'blank'
      };
      let m = null;

      const body = h('div', { class: 'col', style: { gap: '11px' } });
      const sum = h('div', { class: 'bk-cm-sum', 'data-probe': 'bk-cm-sum' });

      function targetPreview() {
        if (pick.target === 'current') return { id: curBookId(), title: curBookTitle(), existing: null };
        const hit = findBookByName(NF, pick.newTitle);
        return { id: hit ? hit.id : '', title: pick.newTitle || '未命名', existing: hit };
      }

      function paintSummary() {
        const tgt = targetPreview();        const ppl = pick.people ? st.pickP.size : 0;
        const pls = pick.plots ? st.pickPl.size : 0;
        const sel = pick.text ? selChapters() : [];
        const chaps = sel.filter(isRealChapter).length;
        const chars = sel.reduce((a, c) => a + (c.chars || 0), 0);
        const names = new Set((tgt.existing ? (tgt.existing.characters || []) : (doc.characters || [])).map(c => c.name));
        let add = 0, merge = 0;
        if (pick.people) ((an && an.people) || []).forEach(p => { if (!st.pickP.has(p.name)) return; if (names.has(p.name)) merge++; else add++; });
        clear(sum);
        sum.appendChild(document.createTextNode(pick.target === 'current' ? '导进当前这本书《' : '导进《'));
        sum.appendChild(h('b', {}, tgt.title));
        sum.appendChild(document.createTextNode('》：'));
        const bits = [];
        if (an) {
          if (pick.people) bits.push('人物 +' + add, '更新 ' + merge + ' 人');
          if (pick.plots) bits.push('情节 +' + pls + ' 条');
        }
        if (pick.text && chaps) bits.push('正文 ' + chaps + ' 章（' + fmtChars(chars) + '）');
        if (!bits.length) sum.appendChild(document.createTextNode('还没勾选要导入的内容。'));
        else sum.appendChild(h('b', {}, bits.join(' · ')));
        if (pick.text && !sel.length) {
          sum.appendChild(h('div', { class: 'warn' }, '勾了「章节正文」但一章都没选：这次不会导正文。'));
        }
        if (pick.target === 'new' && tgt.existing) {
          sum.appendChild(h('div', { class: 'warn' }, '书库里已经有《' + tgt.existing.title + '》，出于安全不会覆盖它：请改个书名，或者选「存到现在的展示书籍」。'));
        } else if (pick.target === 'new') {
          sum.appendChild(h('div', {}, '会新建一本「' + (pick.kind === 'demo' ? '带示例内容' : '空白') + '」的书并切过去。'));
        }
        if (!an) sum.appendChild(h('div', { style: { color: '#8C8272' } }, '还没分析过：这次只会导入章节正文。'));
        refreshOk();
      }

      /* 主按钮状态：一样都没勾（或勾了正文却没选章）就禁掉；文案跟着「导到哪里」变 */
      function refreshOk() {
        if (!m) return;
        const okb = m.box.querySelector('.modal-f .btn.pri');
        if (!okb) return;
        okb.textContent = pick.target === 'new' ? '新建并导入' : '存入这本书';
        okb.disabled = !(pick.people && st.pickP.size) && !(pick.plots && st.pickPl.size)
          && !(pick.text && selChapters().length);
      }

      function repaint() {
        clear(body);
        /* ① 导到哪里 */
        const tabs = h('div', { class: 'bk-cm-tabs', 'data-probe': 'bk-cm-target' });
        const tab = (k, title, note) => h('div', {
          class: 'bk-cm-tab' + (pick.target === k ? ' on' : ''), 'data-target': k,
          onclick: () => {
            pick.target = k;
            /* 「导什么」每次都从当前的勾选重新来：上次入库把人物勾掉了，这里再选中一次，
             * 新开的书里才有全套人物 —— 不然只剩正文，看着像没导成功。 */
            if (an) { pick.people = true; pick.plots = true; }
            pick.text = hasText;
            repaint();
          }
        }, h('b', {}, title), h('small', {}, note));
        tabs.appendChild(tab('current', '存到现在的展示书籍', '人物 · 情节 · 正文追加进《' + curBookTitle() + '》'));
        tabs.appendChild(tab('new', '新导入一个书籍', '另建一本独立的书，内容互不影响'));
        body.appendChild(h('div', { class: 'bk-cm-sec' },
          h('div', { class: 'bk-cm-h' }, h('b', {}, '① 导到哪里')),
          tabs));

        /* ② 新书的名字 / 骨架 */
        if (pick.target === 'new') {
          const nameIn = h('input', {
            class: 'input', value: pick.newTitle || '', placeholder: '新书书名', maxlength: '40',
            oninput: e => { pick.newTitle = e.target.value; paintMenu(); paintSummary(); }
          });
          /* 书名候选：默认沿用整本书的标题；撞名了就推几个没被占用的备选，
           * 点一下即可填进输入框（以前这里写死了几个书名，纯属测试残留）。 */
          const menu = h('div', { class: 'bk-cm-menu' });
          function paintMenu() {
            clear(menu);
            const cur = String(pick.newTitle || '').trim();
            const cands = [];
            const push = t => { if (t && !findBookByName(NF, t) && cands.indexOf(t) < 0) cands.push(t); };
            push(cur);
            push(freeBookTitle(bookTitle, ''));
            push(freeBookTitle(bookTitle, '（拆书）'));
            push(freeBookTitle(bookTitle, '（下）'));
            cands.slice(0, 4).forEach(n => {
              menu.appendChild(h('span', {
                class: cur === n ? 'on' : '', title: '用这个作书名',
                onclick: () => { nameIn.value = n; pick.newTitle = n; paintMenu(); paintSummary(); }
              }, n));
            });
          }
          paintMenu();
          const kinds = h('div', { class: 'bk-cm-tabs', style: { marginTop: '5px' } },
            [['blank', '空白书', '人物、世界观、情节、卷都从零开始'], ['demo', '演示书 · 临水问剑', '带一整套示例内容，照着改最快']].map(([k, t, d]) => h('div', {
              class: 'bk-cm-tab' + (pick.kind === k ? ' on' : ''), 'data-kind': k,
              onclick: () => { pick.kind = k; repaint(); }
            }, h('b', {}, t), h('small', {}, d))));
          body.appendChild(h('div', { class: 'bk-cm-sec' },
            h('div', { class: 'bk-cm-h' }, h('b', {}, '② 新书的名字'), h('span', { class: 'grow' }),
              h('span', { class: 'tiny muted' }, '沿用整本书的标题，也可以改')),
            h('div', { class: 'field' }, nameIn),
            menu,
            kinds,
            h('div', { class: 'bk-cm-tip' }, '建好后会立刻切到新书；拆书结果仍留在「书籍分析」里，随时可以再入库。')));
        }

        /* ③ 导什么 */
        const counts = [];
        if (an) {
          counts.push(h('i', {}, '人物 ' + st.pickP.size + ' / ' + (an.people || []).length));
          counts.push(h('i', {}, '情节 ' + st.pickPl.size + ' / ' + (an.plots || []).length));
        } else {
          counts.push(h('i', {}, '还没分析 · 只有正文可导'));
        }
        if (hasText) counts.push(h('i', {}, '正文 ' + chapPlanCount() + ' 章'));
        const what = h('div', { class: 'bk-cm-cnt' }, counts);
        const rows = [];
        if (an) {
          rows.push(h('label', { class: 'bk-cm-ch' },
            h('input', { type: 'checkbox', checked: pick.people, style: { accentColor: '#2F6F63' }, onchange: e => { pick.people = e.target.checked; paintSummary(); } }),
            h('span', { class: 'bk-ttl' }, '人物 ' + st.pickP.size + ' 人 → 人物页'),
            h('span', { class: 'bk-num' }, '新的建档案，同名的补全信息')));
          rows.push(h('label', { class: 'bk-cm-ch' },
            h('input', { type: 'checkbox', checked: pick.plots, style: { accentColor: '#2F6F63' }, onchange: e => { pick.plots = e.target.checked; paintSummary(); } }),
            h('span', { class: 'bk-ttl' }, '情节 ' + st.pickPl.size + ' 条 → 情节页'),
            h('span', { class: 'bk-num' }, '按批次顺序排时间点')));
        }
        if (hasText) {
          rows.push(h('label', { class: 'bk-cm-ch' },
            h('input', { type: 'checkbox', checked: pick.text, style: { accentColor: '#2F6F63' }, onchange: e => { pick.text = e.target.checked; paintSummary(); } }),
            h('span', { class: 'bk-ttl' }, '章节正文 ' + chapPlanCount() + ' 章 → 章节写作'),
            h('span', { class: 'bk-num' }, fmtChars(selChapters().reduce((a, c) => a + (c.chars || 0), 0)))));
        }
        const chList = h('div', { class: 'bk-cm-mini', 'data-probe': 'bk-cm-chaps' },
          hasText
            ? (b.chapters || []).map(c => {
              const ck = h('input', {
                type: 'checkbox', checked: !!st.sel[c.idx], style: { accentColor: '#2F6F63' },
                onchange: e => {
                  st.sel[c.idx] = e.target.checked;
                  ck.checked = !!st.sel[c.idx];
                  touchSel();
                  repaint();
                }
              });
              return h('label', { class: 'bk-cm-ch' }, ck,
                h('span', { class: 'bk-no' }, c.idx),
                h('span', { class: 'bk-ttl', title: c.title }, c.title || '（无标题）'),
                h('span', { class: 'bk-num' }, fmtNum(c.chars) + ' 字'));
            })
            : h('div', { class: 'empty', style: { padding: '12px' } }, '这本书没有分章，不能导入正文'));
        body.appendChild(h('div', { class: 'bk-cm-sec' },
          h('div', { class: 'bk-cm-h' }, h('b', {}, '③ 导什么'), what, h('span', { class: 'grow' }),
            hasText ? h('button', {
              class: 'btn xs', onclick: () => {
                const all = selChapters().length === (b.chapters || []).length;
                (b.chapters || []).forEach(c => { st.sel[c.idx] = !all; });
                touchSel(); repaint();
              }
            }, '全选 / 全不选') : null),
          rows.length ? h('div', { class: 'col', style: { gap: '3px' } }, rows) : null,
          chList,
          h('div', { class: 'bk-cm-tip' }, '勾选的章节既是分析依据，也是导进章节写作的正文；「前言」会并进第一章开头。')));

        paintSummary();
        body.appendChild(sum);
        /* 主按钮的文案 / 能不能点，统一由 paintSummary → refreshOk 管 */
      }

      m = modal({
        title: '入库', width: '680px', okText: '存入这本书', dismissable: false,
        body,
        onOk: () => runCommit(pick, targetPreview(), () => { if (m) { m.close(); m = null; } })
      });
      repaint();
    }

    /* 真正动手：建书（需要的话）→ 入库 → 切过去（新书）→ 收尾 */
    async function runCommit(pick, tgt, closeBox) {
      const b = book();
      if (!b || st.committing) return false;
      const people = pick.people ? Array.from(st.pickP) : [];
      const plots = pick.plots ? Array.from(st.pickPl) : [];
      /* 勾「章节正文」但一章都没选时，别把「导正文」这个意图传下去 ——
       * 主进程看到空勾选会当成「没指定 = 全导」，那就和界面上看到的不一致了 */
      const keep = pick.text && keepIndexes().length ? keepIndexes() : [];
      const wantText = pick.text && keep.length > 0;
      if (!people.length && !plots.length && !wantText) {
        toast('至少勾选一样要导入的内容（人物 / 情节 / 章节正文）', 'err');
        return false;
      }
      st.committing = true;
      renderActions();
      try {
        let targetId = tgt.id || '';
        let newBook = false;
        let title = tgt.title || '';
        if (pick.target === 'new') {
          if (tgt.existing) {
            /* 书库里已有同名的书：不能悄悄往人家身上写，提示作者改个名 */
            toast('书库里已经有《' + tgt.existing.title + '》：改个新书名，或者选「存到现在的展示书籍」', 'err');
            return false;
          }
          /* 新书：先落盘当前这本，再建；建好后 book:commit 按书号写入，最后一起切过去 */
          title = String(pick.newTitle || '').trim() || String(b.title || '未命名').trim() || '导入的书';
          let cr;
          try {
            await NF.flush();
            cr = await window.nf.books.create({ title, kind: pick.kind || 'blank' });
          } catch (e) {
            toast('新建书籍失败：' + (e && e.message || e), 'err');
            return false;
          }
          targetId = cr.book.id;
          title = cr.book.title;
          newBook = true;
        }
        st.commitTo = newBook ? { title } : 'current';
        const r = await window.nf.book.commit({
          bookId: b.id, targetBookId: targetId || undefined, newBook,
          people: people.map(name => ({ name })), plots, text: wantText, keep
        });
        /* 入库后：有分析结果时把人物 / 情节重新选上（那是"可以入库的全部"，不是已入库的），
         * 这样再导进另一本书时不会因为勾选被清空而只导了正文 */
        const an2 = b.analysis;
        if (an2) {
          st.pickP = new Set((an2.people || []).map(p => p.name));
          st.pickPl = new Set((an2.plots || []).map(p => p.title));
        }
        st.committed = true;
        if (closeBox) closeBox();

        const parts = [];
        if (r.addedC) parts.push('人物 +' + r.addedC);
        if (r.mergedC) parts.push('更新 ' + r.mergedC + ' 人');
        if (r.addedP) parts.push('情节 +' + r.addedP);
        if (r.addedM) parts.push('正文 ' + r.addedM + ' 章');
        if (r.filledM) parts.push('已填 ' + r.filledM + ' 章空稿');
        const where = '《' + (r.title || title || curBookTitle()) + '》';

        if (r.switched) {
          /* 新书：交给 app.js 换数据并整页重画（顺便清撤销栈，免得把两本书搅一起） */
          let fresh = null;
          try { fresh = await window.nf.data.load(); } catch (e) { /* adoptBook 会自己再读一次 */ }
          try { NF.library = await window.nf.books.list(); } catch (e) { /* 顶栏数量下次再刷 */ }
          await NF.adoptBook({ doc: fresh || undefined, library: NF.library });
          toast(parts.length ? ('已导进新书' + where + '：' + parts.join(' / ') + ' · 已切换过去') : ('已创建' + where + '并切换过去'), 'ok');
          return true;
        }
        await reloadDoc();
        /* 落选的章表可能刚被主进程重排过：reloadDoc 里 remapSel 把勾选按标题搬好了，
         * 这里再落一次盘（顺序不能反 —— 先 touchSel 会把旧序号的勾选写回新表，最后一章会掉勾） */
        touchSel();
        if (alive) { renderSide(); renderMain(); }
        toast(parts.length ? ('已导进' + where + '：' + parts.join(' / ')) : '没有可导入的内容', parts.length ? 'ok' : 'err');
        return true;
      } catch (e) {
        toast('入库失败：' + (e && e.message || e), 'err');
        return false;
      } finally {
        st.committing = false;
        if (alive) { renderActions(); refreshSelection(); }
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