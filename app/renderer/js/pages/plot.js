import { h, clear, toast, modal, injectStyle, uid, ago, STATUS } from '../util.js';

injectStyle('plot', `
/* ===== 情节页 · pl- ===== */
.pl-wrap{flex:1;min-width:0;display:flex;flex-direction:column;gap:10px;padding:12px 16px 14px;overflow:hidden}

/* ---- 顶部工具行 ---- */
.pl-head{flex:none;display:flex;align-items:center;gap:12px}
.pl-hgroup{display:flex;align-items:baseline;gap:12px;min-width:0}
.pl-title{font-family:var(--kai);font-size:23px;line-height:1;letter-spacing:.1em;margin:0;font-weight:400}
.pl-sub{font-size:11px;color:var(--muted);white-space:nowrap}
.pl-headacts{margin-left:auto;display:flex;gap:8px;flex:none}

/* ---- 时间轴卡片 ---- */
.pl-tl{flex:none;padding:10px 16px 12px;position:relative}
.pl-tlhead{display:flex;align-items:center;gap:14px;color:var(--sub)}
.pl-tlhead h3{font-family:var(--kai);font-size:13.5px;margin:0;font-weight:400;letter-spacing:.08em;color:var(--ink)}
.pl-lg{display:inline-flex;align-items:center;gap:5px;font-size:10.5px}
.pl-lg i{width:8px;height:8px;border-radius:50%;display:inline-block;background:var(--jade)}
.pl-lg i.later{border:1.5px dashed #C9973C;background:transparent}
.pl-lg i.ending{width:7px;height:7px;border-radius:1.5px;background:var(--seal);transform:rotate(45deg)}
.pl-hint{margin-left:auto;font-size:10px;color:var(--muted)}
.pl-track{position:relative;height:104px;margin-top:6px}
.pl-axis{position:absolute;left:0;right:0;top:58px;height:2px;border-radius:2px;background:linear-gradient(90deg,#2F6F63,#B98A3C 58%,#A8322A)}
.pl-vol{position:absolute;top:24px;bottom:18px;border-left:1px dashed #E6DAC4}
.pl-volname{position:absolute;top:82px;font-size:9.5px;color:#B6A98F;white-space:nowrap;letter-spacing:.04em}
.pl-node{position:absolute;top:58px;width:0;height:0;cursor:pointer}
.pl-node i{position:absolute;left:0;top:0;width:11px;height:11px;margin:-5.5px 0 0 -5.5px;border-radius:50%;border:2px solid var(--jade);background:#FFFCF5;display:block;transition:box-shadow .12s}
.pl-node.done i{background:var(--jade)}
.pl-node.later i{border-color:#C9973C;border-style:dashed;background:#FFFCF5}
.pl-node.ending i{width:9px;height:9px;margin:-4.5px 0 0 -4.5px;border-radius:2px;background:var(--seal);border-color:var(--seal);transform:rotate(45deg)}
.pl-node:hover i{box-shadow:0 0 0 4px rgba(47,111,99,.13)}
.pl-node.later:hover i{box-shadow:0 0 0 4px rgba(201,151,60,.18)}
.pl-node.ending:hover i{box-shadow:0 0 0 4px rgba(168,50,42,.18)}
.pl-node.on i{box-shadow:0 0 0 4px rgba(47,111,99,.22)}
.pl-node.later.on i{box-shadow:0 0 0 4px rgba(201,151,60,.26)}
.pl-node.ending.on i{box-shadow:0 0 0 4px rgba(168,50,42,.24)}
.pl-node b{position:absolute;left:0;bottom:9px;transform:translateX(-50%);font-size:10px;font-weight:400;color:#201C18;white-space:nowrap;line-height:1.2;padding:0 2px}
.pl-node.on b{color:#7C291F}
.pl-node s{position:absolute;left:0;top:10px;transform:translateX(-50%);font-size:9px;color:#8C8272;text-decoration:none;white-space:nowrap}
.pl-track{cursor:crosshair}
.pl-track.dragging{cursor:grabbing}
.pl-node{cursor:grab;user-select:none}
.pl-track.dragging .pl-node{transition:none}
.pl-node.dragging{z-index:5}
.pl-node.dragging i{box-shadow:0 0 0 6px rgba(47,111,99,.2);transform:scale(1.25)}
.pl-node.dragging.later i{transform:scale(1.25)}
.pl-node.dragging b{color:#7C291F}
.pl-tick{position:absolute;top:58px;width:1px;height:7px;margin-top:-3px;background:#D8CBB2;pointer-events:none}
.pl-tick.tp-label{top:66px;height:auto;margin-top:0;background:none;font-size:8.5px;color:#B6A98F;transform:translateX(-50%);white-space:nowrap}
.pl-ghost{position:absolute;top:58px;width:0;height:0;pointer-events:none;z-index:4}
.pl-ghost i{position:absolute;left:0;top:0;width:13px;height:13px;margin:-6.5px 0 0 -6.5px;border-radius:50%;border:2px dashed var(--seal);background:#FFFCF5}
.pl-ghost b{position:absolute;left:0;bottom:12px;transform:translateX(-50%);font-size:10px;font-weight:400;color:var(--seal);white-space:nowrap;background:#FFFCF5;border:1px dashed #E0B9A8;border-radius:5px;padding:0 5px;line-height:1.5}
.pl-track .pl-drop-hint{position:absolute;right:0;top:0;font-size:9.5px;color:var(--muted)}

/* ---- 主线 / 暗线泳道 ---- */
.pl-board{position:relative;margin-top:6px;display:flex;flex-direction:column;gap:4px}
.pl-ruler{position:relative;height:15px;margin-left:106px;margin-right:70px}
.pl-rl{position:absolute;top:0;font-size:9px;color:#B6A98F;letter-spacing:.04em;white-space:nowrap;transform:translateX(-1px)}
.pl-lane{display:flex;align-items:center;gap:8px;border-radius:9px;padding:1px 0}
.pl-lane.on{background:rgba(47,111,99,.045)}
.pl-lanetag{flex:none;width:96px;display:flex;align-items:center;gap:5px;cursor:pointer;
  font-size:10.5px;color:#5B5348;padding:3px 6px;border-radius:7px;min-width:0}
.pl-lanetag:hover{background:rgba(255,255,255,.6)}
.pl-lane.side .pl-lanetag{color:#8A6421}
.pl-lanedot{width:7px;height:7px;border-radius:50%;flex:none;background:var(--jade)}
.pl-lane.side .pl-lanedot{background:#C9973C}
.pl-lanename{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700}
.pl-lanecnt{font-size:9px;color:#A99C84;flex:none}
.pl-merge{flex:none;font-size:8.5px;padding:0 5px;border-radius:999px;background:#F3EBDA;color:#7A6A4E;white-space:nowrap}
.pl-merge.pend{background:transparent;border:1px dashed #DCC9A2;color:#A08A5C}
.pl-laneacts{flex:none;width:70px;display:flex;gap:3px;justify-content:flex-end}
.pl-laneacts .btn{padding:1px 5px;font-size:9.5px;line-height:1.5}
.pl-lane .pl-track{flex:1;min-width:0;height:52px;margin-top:0}
.pl-lane.side .pl-track{height:44px}
.pl-axis.side{top:26px;height:2px;background:linear-gradient(90deg,#D9C39A,#C9973C);}
.pl-lane .pl-node{top:26px}
.pl-lane.main .pl-node{top:26px}
.pl-lane .pl-node b{bottom:8px}
.pl-lane .pl-node s{top:9px}
.pl-lane .pl-tick{top:26px}
.pl-lane .pl-tick.tp-label{top:33px}
.pl-lane .pl-ghost{top:26px}
.pl-laneempty{position:absolute;left:8px;top:19px;font-size:9.5px;color:#C3B79F;pointer-events:none}
.pl-lane-pill{font-size:9.5px;padding:0 7px;border-radius:999px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  background:#E2EEEA;color:#23604F;justify-self:start}
.pl-lane-pill.side{background:#F7EBD3;color:#8A6421}

/* ---- 带刻度的轴 + 树状分支 ---- */
.pl-canvas{position:relative}
.pl-branches{position:absolute;left:0;top:0;pointer-events:none;overflow:visible;z-index:0}
.pl-br{fill:none;stroke-width:1.4;stroke-linecap:round}
.pl-br.fork{stroke:#C9973C;stroke-dasharray:5 3;opacity:.85}
.pl-br.merge{stroke:#2F6F63;stroke-dasharray:none;opacity:.85}
.pl-br.stem{stroke:#C9973C;stroke-dasharray:3 3;opacity:.55}
.pl-brdot{stroke-width:1.5}
.pl-brdot.fork{fill:#FFFCF5;stroke:#C9973C}
.pl-brdot.merge{fill:#2F6F63;stroke:#2F6F63}
.pl-lane{position:relative;z-index:1;background:transparent}
.pl-lane.on{background:rgba(47,111,99,.045)}
.pl-track .pl-tick.tp-label{font-size:8px;color:#C0B49B}
.pl-node.dim{opacity:.38}
.pl-node.dim i{box-shadow:none}
.pl-lanefilter{font-size:10px;height:22px;padding:0 4px;border:1px solid var(--line2);border-radius:6px;
  background:#FFFDF8;color:#5B5348;max-width:170px;cursor:pointer;font-family:inherit}
.pl-lanefilter:hover{border-color:#CBB894}
.pl-lrow.flash{animation:plFlash .9s ease}
@keyframes plFlash{0%{background:#F3E4C4;box-shadow:inset 3px 0 0 var(--seal)}100%{background:transparent}}

/* ---- 右下角 AI 构思助手（和章节写作同一套外观） ---- */
.pl-ai{position:fixed;right:18px;bottom:40px;z-index:60;display:flex;flex-direction:column;align-items:flex-end;gap:10px}
.pl-ai-fab{width:54px;height:54px;border-radius:50%;border:1px solid #CBB894;background:var(--ink);color:var(--paper);
  font-family:var(--kai);font-size:15px;letter-spacing:.06em;cursor:pointer;box-shadow:0 10px 26px rgba(50,35,20,.26);transition:transform .12s}
.pl-ai-fab:hover{background:#2E2823;transform:translateY(-1px)}
.pl-ai-panel{width:376px;max-height:min(640px,74vh);display:none;flex-direction:column;background:var(--panel);
  border:1px solid #DFD4BF;border-radius:14px;box-shadow:0 24px 60px rgba(50,35,20,.24);overflow:hidden}
.pl-ai.open .pl-ai-panel{display:flex}
.pl-ai.open .pl-ai-fab{display:none}
.pl-ai-h{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #EAE1CF;background:#FBF6EA}
.pl-ai-h h3{margin:0;font-family:var(--kai);font-size:13.5px;letter-spacing:.08em;color:#201C18}
.pl-ai-model{font-size:9.5px;color:#8C8272;background:#F1EADA;border:1px solid #EAE1CF;border-radius:999px;padding:1px 7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px}
.pl-ai-x{margin-left:auto;cursor:pointer;color:var(--muted);font-size:14px;line-height:1;padding:0 2px}
.pl-ai-x:hover{color:var(--ink)}
.pl-ai-log{flex:1;min-height:140px;overflow:auto;padding:11px 12px;display:flex;flex-direction:column;gap:9px;background:#FFFDF8}
.pl-ai-item{display:flex;flex-direction:column;gap:3px;max-width:100%}
.pl-ai-item.user{align-items:flex-end}
.pl-ai-item.assistant,.pl-ai-item.note{align-items:flex-start}
.pl-ai-msg{font-size:12px;line-height:1.78;padding:7px 10px;border-radius:9px;white-space:pre-wrap;word-break:break-word;max-width:100%}
.pl-ai-item.user .pl-ai-msg{background:#F1E7D3;border:1px solid #E4D6B9;color:#3B342C}
.pl-ai-item.assistant .pl-ai-msg{background:#FFF;border:1px solid #EAE1CF;color:#2A2521}
.pl-ai-item.note .pl-ai-msg{background:transparent;border:1px dashed #E4DCCB;color:var(--muted);font-size:10.5px;line-height:1.7;padding:6px 9px}
.pl-ai-tools{display:flex;gap:10px;font-size:10.5px;color:var(--jade)}
.pl-ai-tools span{cursor:pointer;text-decoration:underline}
.pl-ai-tools span:hover{color:#23604F}
.pl-ai-quick{display:flex;gap:5px;flex-wrap:wrap;padding:8px 12px 0;background:#FBF6EA}
.pl-ai-chip{font-size:10.5px;padding:3px 8px;border-radius:999px;border:1px solid #DFD4BF;background:#FFFDF8;color:#5B5348;cursor:pointer}
.pl-ai-chip:hover{background:#F7EBD3;border-color:#CBB894}
.pl-ai-f{padding:8px 12px 10px;background:#FBF6EA;display:flex;flex-direction:column;gap:6px}
.pl-ai-in{width:100%;min-height:54px;max-height:120px;resize:vertical;font:inherit;font-size:12px;line-height:1.7;
  padding:7px 9px;border:1px solid var(--line2);border-radius:8px;background:#FFFDF8;color:#2A2521;outline:none}
.pl-ai-in:focus{border-color:#C2A97D;box-shadow:0 0 0 3px rgba(185,138,60,.12)}
.pl-ai-row{display:flex;align-items:center;gap:8px;font-size:10px;color:#8C8272}

/* ---- 悬停气泡 ---- */
.pl-tip{position:fixed;left:0;top:0;z-index:8300;width:252px;display:none;background:rgba(38,32,26,.96);color:#F2EBDB;border-radius:9px;padding:10px 12px;box-shadow:0 12px 30px rgba(40,30,20,.32);pointer-events:none}
.pl-tip.on{display:block}
.pl-tip-h{display:flex;align-items:center;gap:8px;margin-bottom:5px}
.pl-tip-h b{font-family:var(--kai);font-size:13px;font-weight:400;letter-spacing:.04em;line-height:1.35}
.pl-tip-h .pill{font-size:9.5px;padding:1px 7px}
.pl-tip-m{font-size:10.5px;color:#BCB1A0;line-height:1.65}
.pl-tip-s{margin-top:6px;padding-top:6px;border-top:1px solid rgba(246,241,230,.14);font-size:11px;line-height:1.7;color:#E4DACA;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}

/* ---- 两栏 ---- */
.pl-cols{flex:1;min-height:0;display:flex;gap:10px}
.pl-list{flex:1.4;min-width:0;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.pl-detail{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;overflow:auto}
.pl-chead{flex:none;display:flex;align-items:center;gap:8px;padding:9px 12px;border-bottom:1px solid var(--line)}
.pl-chead h3{font-family:var(--kai);font-size:13px;margin:0;font-weight:400;letter-spacing:.06em}
.pl-cnt{font-size:10px;color:var(--muted)}
.pl-chead .r{margin-left:auto;font-size:10px;color:var(--muted)}

/* ---- 情节列表 ---- */
.pl-lhead,.pl-lrow{display:grid;grid-template-columns:30px minmax(0,1fr) 62px 76px minmax(0,1.05fr) 92px;align-items:center;gap:8px}
.pl-lhead{flex:none;padding:6px 12px;font-size:9.5px;letter-spacing:.08em;color:var(--muted);border-bottom:1px solid var(--line)}
.pl-lhead .rt{text-align:right}
.pl-lbody{flex:1;min-height:0;overflow:auto;padding:2px 6px 8px}
.pl-lrow{padding:6px;border-bottom:1px dashed #EFE7D7;cursor:pointer;font-size:12px;border-radius:7px}
.pl-lrow:hover{background:#FBF6EA}
.pl-lrow.on{background:#F7F0DF;box-shadow:inset 3px 0 0 var(--jade)}
.pl-lrow.drop-before{box-shadow:inset 0 3px 0 var(--seal);background:#FBEEE8}
.pl-lrow[draggable="true"]{cursor:grab}
.pl-lrow.dragging-row{opacity:.45}
.pl-idx{font-family:var(--mono);font-size:10px;color:#B3A78F}
.pl-ptitle{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pl-lrow.on .pl-ptitle{font-weight:700;color:#7C291F}
.pl-chap{font-family:var(--mono);font-size:10.5px;color:#5B5348;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pl-who{font-size:10.5px;color:#8C8272;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pl-rowacts{display:flex;gap:4px;justify-content:flex-end}
.pl-rowacts .btn{padding:2px 7px;font-size:10.5px}

/* ---- 详情卡 ---- */
.pl-din{padding:12px 14px;display:flex;flex-direction:column;gap:9px;flex:1}
.pl-dtop{display:flex;align-items:center;gap:8px;min-width:0}
.pl-dtop h2{font-family:var(--kai);font-size:17px;margin:0;font-weight:400;letter-spacing:.06em;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pl-dmeta{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:10.5px;color:var(--muted)}
.pl-dmeta b{font-weight:400;color:var(--sub)}
.pl-dsum{margin:0;font-size:12.5px;line-height:1.85;color:#332C25}
.pl-dsec{font-size:9.5px;letter-spacing:.1em;color:var(--muted)}
.pl-dchips{display:flex;flex-wrap:wrap;gap:6px}
.pl-chip{display:inline-flex;align-items:center;gap:5px;font-size:11px;background:#F8F2E4;border:1px solid var(--line);border-radius:999px;padding:2px 9px 2px 2px;cursor:pointer}
.pl-chip:hover{border-color:#CBB894}
.pl-chip i{width:17px;height:17px;border-radius:50%;color:#fff;font-style:normal;display:grid;place-items:center;font-size:9px;font-family:var(--kai)}
.pl-dacts{margin-top:auto;padding-top:10px;border-top:1px dashed var(--line);display:flex;gap:8px}

/* ---- 废案抽屉 ---- */
.pl-layer{display:none}
.pl-layer.on{display:block}
.pl-scrim{position:fixed;inset:0;background:rgba(40,32,24,.26);z-index:8400}
.pl-drawer{position:fixed;right:0;top:0;bottom:0;width:420px;z-index:8410;background:var(--panel);border-left:1px solid var(--line2);box-shadow:-20px 0 50px rgba(50,35,20,.18);display:flex;flex-direction:column}
.pl-dhead{flex:none;display:flex;align-items:center;gap:8px;padding:14px 16px 10px}
.pl-dhead h3{font-family:var(--kai);font-size:15px;margin:0;font-weight:400;letter-spacing:.08em}
.pl-x{margin-left:auto;cursor:pointer;color:var(--muted);font-size:14px;line-height:1;padding:2px 4px}
.pl-x:hover{color:var(--ink)}
.pl-dnote{flex:none;padding:0 16px 10px;font-size:10.5px;line-height:1.75;color:var(--muted)}
.pl-fchips{flex:none;display:flex;gap:6px;padding:0 16px 10px;border-bottom:1px solid var(--line)}
.pl-fchip{font-size:11px;padding:3px 10px;border-radius:999px;border:1px solid var(--line2);color:var(--sub);cursor:pointer;background:#FFFDF8;user-select:none}
.pl-fchip:hover{border-color:#CBB894}
.pl-fchip.on{background:var(--ink);border-color:var(--ink);color:var(--paper)}
.pl-slist{flex:1;min-height:0;overflow:auto;padding:4px 16px 10px}
.pl-scrap{display:flex;gap:10px;padding:11px 0;border-bottom:1px dashed var(--line)}
.pl-sbody{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}
.pl-st{display:flex;align-items:center;gap:6px;min-width:0}
.pl-stitle{font-size:12.5px;font-weight:700;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pl-ago{margin-left:auto;font-size:10px;color:var(--muted);white-space:nowrap;flex:none}
.pl-smeta{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.pl-origin{font-size:9.5px;padding:1px 7px;border-radius:999px;background:#F0E9DA;color:#5B5348;white-space:nowrap}
.pl-reason{font-size:9.5px;padding:1px 7px;border-radius:999px;background:#F7EBD3;color:#8A6421;white-space:nowrap}
.pl-ssum{margin:0;font-size:11.5px;line-height:1.7;color:#5B5348;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.pl-sacts{flex:none;display:flex;flex-direction:column;gap:5px;justify-content:center}
.pl-sacts .btn{padding:2px 8px;font-size:10.5px}
.pl-sfoot{flex:none;padding:10px 16px 14px;border-top:1px solid var(--line)}
.pl-empty{padding:28px 0;text-align:center;color:var(--muted);font-size:11.5px}

/* ---- 表单：相关人物多选 ---- */
.pl-pick{display:flex;flex-wrap:wrap;gap:6px;max-height:120px;overflow:auto;border:1px solid var(--line2);border-radius:8px;padding:8px;background:#FFFDF8}
.pl-pickchip{display:inline-flex;align-items:center;gap:5px;font-size:11px;padding:2px 10px 2px 2px;border-radius:999px;border:1px solid var(--line2);background:#FFFCF5;color:var(--sub);cursor:pointer;user-select:none}
.pl-pickchip:hover{border-color:#CBB894}
.pl-pickchip.on{background:#E2EEEA;border-color:#9CC3B7;color:#23604F}
.pl-pickchip i{width:17px;height:17px;border-radius:50%;color:#fff;font-style:normal;display:grid;place-items:center;font-size:9px;font-family:var(--kai)}

/* ---- 滚动条 ---- */
.pl-lbody::-webkit-scrollbar,.pl-detail::-webkit-scrollbar,.pl-slist::-webkit-scrollbar,.pl-pick::-webkit-scrollbar{width:8px}
.pl-lbody::-webkit-scrollbar-thumb,.pl-detail::-webkit-scrollbar-thumb,.pl-slist::-webkit-scrollbar-thumb,.pl-pick::-webkit-scrollbar-thumb{background:#E2D7C2;border-radius:5px;border:2px solid var(--panel)}
`);

/* 废案类别 → 中文。设定过滤把「设定」与「结局」两类一起收进来。 */
const KIND_LABEL = { plot: '情节', character: '人物', ending: '结局', world: '设定' };
const FILTERS = [
  { k: 'all', label: '全部', kinds: null },
  { k: 'plot', label: '情节', kinds: ['plot'] },
  { k: 'character', label: '人物', kinds: ['character'] },
  { k: 'world', label: '设定', kinds: ['world', 'ending'] }
];
const STATUS_KEYS = ['done', 'later', 'ending'];

/* 时间点怎么显示：整数原样，小数最多两位 */
function fmtTp(v) {
  const n = Number(v);
  if (!isFinite(n)) return '—';
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

export default {
  id: 'plot', label: '情节',
  statusText(doc) {
    const n = (doc.plots || []).length, s = (doc.scraps || []).length;
    return '情节 ' + n + ' 个节点 · 废案 ' + s + ' 条';
  },
  unmount() { if (this._cleanup) { this._cleanup(); this._cleanup = null; } },

  mount(root, ctx) {
    const { doc, params, NF } = ctx;
    if (!Array.isArray(doc.plots)) doc.plots = [];
    if (!Array.isArray(doc.scraps)) doc.scraps = [];
    /* 时间轴 = 一条主线 + 若干条暗线。老数据没有 plotLines 就自动补一条主线，
     * 已有的 plot.lane 留空 = 跟主线走，所以升级不需要迁移。 */
    if (!Array.isArray(doc.plotLines) || !doc.plotLines.length) {
      doc.plotLines = [{ id: 'main', title: '主线', kind: 'main', note: '', mergeInto: '' }];
    }
    if (!doc.plotLines.some(l => l.kind === 'main')) doc.plotLines.unshift({ id: 'main', title: '主线', kind: 'main', note: '', mergeInto: '' });

    /* ================= 状态与小工具 ================= */
    const st = { selId: null, filter: 'all', drawer: false, lane: 'main', listLane: 'all' };
    const touch = () => NF.save();
    const vols = () => (Array.isArray(doc.chapters) ? doc.chapters : []);
    const chars = () => (Array.isArray(doc.characters) ? doc.characters : []);
    /* 按时间点排序；时间点相同的保持原数组次序（Array#sort 是稳定排序） */
    const byTime = () => doc.plots.slice().sort((a, b) => (Number(a.timePoint) || 0) - (Number(b.timePoint) || 0));

    /* ---------- 主线 / 暗线 ---------- */
    const lines = () => (Array.isArray(doc.plotLines) ? doc.plotLines : []);
    const mainLine = () => lines().find(l => l.kind === 'main') || lines()[0];
    const lineById = id => lines().find(l => l.id === id) || null;
    /* 情节属于哪条线：没标的算主线 */
    const laneOf = p => (p && p.lane && lineById(p.lane)) ? p.lane : (mainLine() ? mainLine().id : 'main');
    const onLane = (lane, list) => (list || doc.plots).filter(p => laneOf(p) === lane);
    /* 暗线要收敛到哪条线（默认主线）；主线自己不需要 */
    const mergeTarget = l => (!l || l.kind === 'main') ? null : (lineById(l.mergeInto) || mainLine());
    /* 暗线是否已经收敛（有收敛章 / 收敛情节） */
    const converged = l => !!(l && (l.convergeChapter || l.convergePlot || l.convergedAt));
    /* 这条线上的情节（按时间点排序） */
    const lanePlots = lane => byTime().filter(p => laneOf(p) === lane);
    /* 它在自己那条线上排第几 */
    const seqNo = p => lanePlots(laneOf(p)).findIndex(q => q.id === p.id) + 1;
    const current = () => doc.plots.find(p => p.id === st.selId) || null;
    const nameOf = id => { const c = chars().find(x => x.id === id); return c ? c.name : ''; };
    const namesOf = p => (p.characterIds || []).map(nameOf).filter(Boolean);
    const statusOf = s => STATUS[s] || { label: s || '未定', cls: 'grey' };
    const nodeCls = p => (STATUS[p.status] ? p.status : 'later');
    /* 稿件标题里的章号：先认阿拉伯数字；「第十八章」这类中文数字也认 */
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
    function chNum(s) {
      const t = String(s || '');
      /* 「第18章」「第18回」「18」 */
      const ar = t.match(/第\s*(\d+)\s*[章回节]/);
      if (ar) return Number(ar[1]);
      const cn = t.match(/第\s*([〇零一二三四五六七八九十百]+)\s*[章回节]/);
      if (cn) return cnToInt(cn[1]);
      const bare = t.match(/(\d+)/);
      return bare ? Number(bare[1]) : 0;
    }

    /* 下拉里一条稿件的写法：卷一 · 第五章 听雨断剑
     * 卷名 / 章名都从「章节写作」里取，不拼编号，避免出现 0 这种码 */
    function msLabel(m) {
      const v = (doc.chapters || []).find(x => x.id === m.volumeId);
      const vt = v && v.title ? String(v.title) : '';
      const mt = m.title || '未命名章';
      /* 卷名里常常已经含章名，重复的就不再叠一遍 */
      return vt && mt.indexOf(vt.split(' · ')[0]) < 0 ? vt + ' · ' + mt : mt;
    }

    /* ================= 骨架 ================= */
    const wrap = h('div', { class: 'pl-wrap' });
    const head = h('div', { class: 'pl-head', 'data-probe': 'plot-head' });
    const tlCard = h('div', { class: 'card pl-tl', 'data-probe': 'plot-axis' });
    const listCard = h('div', { class: 'card pl-list', 'data-probe': 'plot-list' });
    const detailCard = h('div', { class: 'card pl-detail', 'data-probe': 'plot-detail' });
    const tip = h('div', { class: 'pl-tip' });
    wrap.appendChild(head);
    wrap.appendChild(tlCard);
    wrap.appendChild(h('div', { class: 'pl-cols' }, listCard, detailCard));
    wrap.appendChild(tip);
    root.appendChild(wrap);

    const scrim = h('div', { class: 'pl-scrim', onclick: closeDrawer });
    const drawer = h('div', { class: 'pl-drawer', 'data-probe': 'plot-drawer' });
    const layer = h('div', { class: 'pl-layer' }, scrim, drawer);
    root.appendChild(layer);

    /* ================= 顶部工具行 ================= */
    function renderHead() {
      clear(head);
      const cnt = { done: 0, later: 0, ending: 0 };
      doc.plots.forEach(p => { if (cnt[p.status] != null) cnt[p.status] += 1; });
      head.appendChild(h('div', { class: 'pl-hgroup' },
        h('h1', { class: 'pl-title' }, '情节'),
        h('div', { class: 'pl-sub' },
          doc.plots.length + ' 个节点 · 已发生 ' + cnt.done + ' / 计划 ' + cnt.later + ' / 结局 ' + cnt.ending)));
      const sideCount = lines().filter(l => l.kind !== 'main').length;
      head.appendChild(h('div', { class: 'pl-headacts' },
        h('button', { class: 'btn pri', onclick: () => openForm(null) }, '＋ 新建情节'),
        h('button', { class: 'btn', onclick: addLane, title: '再开一条暗线时间轴' }, '＋ 开一条暗线' + (sideCount ? '（' + sideCount + '）' : '')),
        h('button', { class: 'btn', onclick: openDrawer, title: '打开废案回收站' }, '◱ 废案篓 ' + doc.scraps.length)));
    }

    /* ================= 时间轴 ================= */

    function showTip(p, node) {
      const s = statusOf(p.status);
      const who = namesOf(p);
      clear(tip);
      tip.appendChild(h('div', { class: 'pl-tip-h' }, h('b', {}, p.title), h('span', { class: 'pill ' + s.cls }, s.label)));
      tip.appendChild(h('div', { class: 'pl-tip-m' }, '章节 ' + (p.chapter || '—') + ' · 地点 ' + (p.place || '—')));
      tip.appendChild(h('div', { class: 'pl-tip-m' }, '在场 ' + (who.length ? who.join(' · ') : '未标注')));
      tip.appendChild(h('div', { class: 'pl-tip-s' }, p.summary || '（还没有摘要）'));
      tip.classList.add('on');
      /* 默认落在节点下方，靠近光标；下方放不下时才翻到上方 */
      const r = node.getBoundingClientRect();
      const w = tip.offsetWidth, hh = tip.offsetHeight;
      const x = Math.max(10, Math.min(window.innerWidth - w - 10, Math.round(r.left - w / 2)));
      let y = Math.round(r.top + 16);
      if (y + hh > window.innerHeight - 10) y = Math.round(r.top - hh - 14);
      tip.style.left = x + 'px';
      tip.style.top = Math.round(Math.max(8, y)) + 'px';
    }
    function hideTip() { tip.classList.remove('on'); }

    /* ---------- 时间轴 = 一条有刻度的轴 ----------
     * 每个情节落在轴上的位置 = 它的时间点（timePoint）在这条线刻度范围内的百分比。
     * - 空白处双击新建时，时间点直接读鼠标位置对应的刻度值（整数刻度）；
     * - 拖动节点时它跟着鼠标走，松手就定在那儿，然后按落点处的刻度把时间点改掉；
     *   别的节点一动不动。
     * 轴上若某一段是空的，就在这一段里补刻度柱，保证任意位置都能落。 */
    const tpNum = p => { const n = Number(p && p.timePoint); return isFinite(n) ? n : 0; };
    const round2 = v => Math.round(v * 100) / 100;
    const SPAN_LO = 3, SPAN_HI = 97;
    const MIN_GAP_PCT = 1.8;       /* 同一刻度上叠了多个情节时，至少错开这么多 */

    /* 某条线的时间点范围：[0, 最大值向上取整]，至少到 10 */
    function laneMax(lane) {
      const arr = onLane(lane);
      const m = Math.max(0, ...arr.map(tpNum));
      return Math.max(10, Math.ceil(m));
    }
    /* 某条线在轴上的一串刻度：有情节的地方用情节的时间点，空档里补整数刻度 */
    function laneTicks(lane) {
      const arr = onLane(lane);
      const max = laneMax(lane);
      const set = new Set();
      arr.forEach(p => set.add(round2(tpNum(p))));
      set.add(0);
      set.add(max);
      const ticks = Array.from(set).sort((x, y) => x - y);
      const out = [];
      for (let i = 0; i < ticks.length; i++) {
        if (i === 0 || out[out.length - 1] !== ticks[i]) out.push(ticks[i]);
        const nxt = ticks[i + 1];
        if (nxt == null) break;
        const gap = nxt - ticks[i];
        /* 空档太大就每格补一个整数，最多补 40 个，避免稠密到看不清 */
        if (gap > 1.0001) {
          const step = gap > 40 ? Math.ceil(gap / 40) : 1;
          for (let v = ticks[i] + step; v < nxt - 0.0001; v += step) out.push(round2(v));
        }
      }
      return { ticks: out, max };
    }
    /* 时间点 → 百分比 */
    function tpPct(tp, max) {
      if (!(max > 0)) return 50;
      return SPAN_LO + (Math.max(0, Math.min(max, tp)) / max) * (SPAN_HI - SPAN_LO);
    }
    /* 百分比 → 时间点（先算连续值，再吸附到最近的刻度；刻度是整数，所以就是四舍五入） */
    function pctTp(pct, max) {
      if (!(max > 0)) return 0;
      const t = Math.max(SPAN_LO, Math.min(SPAN_HI, SPAN_LO + (pct / 100) * (SPAN_HI - SPAN_LO)));
      return round2(((t - SPAN_LO) / (SPAN_HI - SPAN_LO)) * max);
    }
    /* 这条线上每个情节的百分比（按时间点；同一时间点的按顺序错开一点） */
    function laneSpots(lane) {
      const arr = lanePlots(lane);
      const max = laneMax(lane);
      const out = [];
      arr.forEach((p, i) => {
        let x = tpPct(tpNum(p), max);
        /* 和前面重叠就右移，但不越过轴的右端 */
        for (let k = 0; k < out.length; k++) {
          if (Math.abs(out[k] - x) < MIN_GAP_PCT) x = Math.min(SPAN_HI, out[k] + MIN_GAP_PCT);
        }
        out.push(x);
      });
      return { spots: out, items: arr, max };
    }

    /* ================= 时间轴（主线 + 暗线，树状引出 / 收敛） ================= */
    function renderTimeline() {
      clear(tlCard);
      hideTip();
      ghostAt = null;
      const all = byTime();
      const ln = lines();

      tlCard.appendChild(h('div', { class: 'pl-tlhead' },
        h('h3', {}, '时间轴'),
        h('span', { class: 'pl-lg' }, h('i', {}), '已发生'),
        h('span', { class: 'pl-lg' }, h('i', { class: 'later' }), '后续计划'),
        h('span', { class: 'pl-lg' }, h('i', { class: 'ending' }), '结局'),
        h('span', { class: 'pl-hint' }, all.length
          ? '拖节点改时间点 · 单击选中 · 双击空白处新建 · 暗线以树状分支挂在主线上'
          : '双击时间轴空白处新建情节；也可以开一条暗线')));

      /* 主线在上面，暗线按引出位置排在下面；用 SVG 画「分叉 / 收敛」的树枝 */
      const main = mainLine();
      const sideLines = ln.filter(l => l.kind !== 'main');
      const board = h('div', { class: 'pl-board' });
      const canvas = h('div', { class: 'pl-canvas' });
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'pl-branches');
      canvas.appendChild(svg);

      const rows = [];
      const addRow = (l, isMain) => {
        const row = laneRow(l, isMain);
        canvas.appendChild(row.el);
        rows.push(row);
      };
      addRow(main, true);
      sideLines.forEach(l => addRow(l, false));

      /* 画树枝：暗线从主线的「引出点」分出去，收敛回主线的「收敛点」 */
      board.appendChild(canvas);
      tlCard.appendChild(board);

      /* 尺寸拿到之后才画 SVG（要真实坐标） */
      requestAnimationFrame(() => drawBranches(svg, rows, main, sideLines));

      trackEl = rows[0] ? rows[0].track : null;
    }

    /* SVG 树枝：主线上某点 → 暗线起点（分叉），暗线末端 → 主线上某点（收敛） */
    function drawBranches(svg, rows, main, sideLines) {
      if (!svg || !rows.length) return;
      const box = svg.parentNode.getBoundingClientRect();
      if (!box.width) return;
      svg.setAttribute('width', String(box.width));
      svg.setAttribute('height', String(box.height));
      svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
      clear(svg);
      const mainRow = rows[0];
      const mainBox = mainRow.track.getBoundingClientRect();
      const max = laneMax(main.id);
      const X = pct => mainBox.left - box.left + (pct / 100) * mainBox.width;
      const Y = r => {
        const b2 = r.track.getBoundingClientRect();
        return b2.top - box.top + 26;          /* 轨道轴线的高度 */
      };
      const yMain = Y(mainRow);

      sideLines.forEach((l, i) => {
        const row = rows[i + 1];
        if (!row) return;
        const arr = lanePlots(l.id);
        const ySide = Y(row);
        /* ---- 引出（分叉）----
         * 分叉点在主线上：取暗线第一个情节的时间点（还没有情节就取 0）。
         * 暗线自己的起点在同一时间点的位置上，所以画一条从主线竖直/微斜下来的枝。 */
        const firstTp = arr.length ? tpNum(arr[0]) : 0;
        const forkX = X(tpPct(firstTp, max));
        const startX = forkX;
        addBranchPath(svg, forkX, yMain, startX, ySide, 'fork', 0);
        addDot(svg, forkX, yMain, 'fork');

        /* ---- 收敛 ----
         * 已经标记收敛：从暗线末端弯回主线上的收敛点。 */
        if (converged(l)) {
          const lastTp = arr.length ? tpNum(arr[arr.length - 1]) : firstTp;
          const endX = arr.length ? X(tpPct(lastTp, max)) : startX;
          let convTp = lastTp;
          if (l.convergePlot) {
            const cp = doc.plots.find(x => x.id === l.convergePlot);
            if (cp) convTp = tpNum(cp);
          } else if (l.convergeChapter) {
            const no = chNum(l.convergeChapter);
            const hit = lanePlots(mergeTarget(l) ? mergeTarget(l).id : main.id).find(x => chNum(x.chapter) === no);
            if (hit) convTp = tpNum(hit);
          }
          const toX = X(tpPct(convTp, max));
          addBranchPath(svg, endX, ySide, toX, yMain, 'merge', i + 1);
          addDot(svg, toX, yMain, 'merge');
        } else {
          /* 还没收敛：末端画个开口的小三角，表示这条枝还悬着 */
          const lastTp = arr.length ? tpNum(arr[arr.length - 1]) : firstTp;
          const endX = arr.length ? X(tpPct(lastTp, max)) : startX;
          addBranchPath(svg, startX, ySide, endX, ySide, 'stem', i + 1);
        }
      });
    }
    /* 树状枝：一条水平段（暗线自己的轨道）+ 两段竖直弯头，像树杈 */
    function addBranchPath(svg, x0, y0, x1, y1, cls, idx) {
      const NS = 'http://www.w3.org/2000/svg';
      const path = document.createElementNS(NS, 'path');
      let d;
      if (cls === 'stem') {
        d = 'M ' + x0 + ' ' + y0 + ' L ' + x1 + ' ' + y1;
      } else {
        /* 先沿主线 / 暗线竖直拐一小段，再走水平，再竖直落到对面轴线 */
        const bend = Math.min(26, Math.abs(y1 - y0) / 2) * (y1 > y0 ? 1 : -1);
        const mx = (x0 + x1) / 2;
        if (Math.abs(x1 - x0) < 2) {
          d = 'M ' + x0 + ' ' + y0 + ' L ' + x1 + ' ' + y1;
        } else {
          d = 'M ' + x0 + ' ' + y0 +
            ' C ' + mx + ' ' + y0 + ', ' + mx + ' ' + y1 + ', ' + x1 + ' ' + y1;
        }
      }
      path.setAttribute('d', d);
      path.setAttribute('class', 'pl-br ' + cls);
      svg.appendChild(path);
    }
    function addDot(svg, x, y, cls) {
      const NS = 'http://www.w3.org/2000/svg';
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', String(x)); c.setAttribute('cy', String(y)); c.setAttribute('r', '3');
      c.setAttribute('class', 'pl-brdot ' + cls);
      svg.appendChild(c);
    }

    /* 一条线 = 一行：左边名牌，右边带刻度的轨道 */
    function laneRow(l, isMain) {
      const mine = lanePlots(l.id);
      const max = laneMax(l.id);
      const row = h('div', { class: 'pl-lane' + (isMain ? ' main' : ' side') + (st.lane === l.id ? ' on' : '') });

      const tag = h('div', {
        class: 'pl-lanetag',
        onclick: () => { st.lane = l.id; renderTimeline(); },
        title: isMain ? '主线' : '点一下把它设为当前编辑的线'
      },
        h('span', { class: 'pl-lanedot' }),
        h('span', { class: 'pl-lanename' }, l.title || (isMain ? '主线' : '暗线')),
        isMain ? null : h('span', { class: 'pl-lanecnt' }, mine.length ? mine.length + ' 节' : '空'),
        !isMain && converged(l) ? h('span', { class: 'pl-merge' }, '已收敛') : null,
        !isMain && !converged(l) ? h('span', { class: 'pl-merge pend' }, '分叉中') : null);
      row.appendChild(tag);

      const track = h('div', { class: 'pl-track', 'data-lane': l.id });
      track.appendChild(h('div', { class: 'pl-axis' + (isMain ? '' : ' side') }));

      /* 刻度：整数刻度 + 刻度值标签 */
      const { ticks } = laneTicks(l.id);
      const labelStep = Math.max(1, Math.ceil(ticks.length / 14));   /* 太密就隔几个标一次 */
      ticks.forEach((t, i) => {
        const left = tpPct(t, max) + '%';
        track.appendChild(h('span', { class: 'pl-tick', style: { left } }));
        if (i % labelStep === 0 || i === ticks.length - 1) {
          track.appendChild(h('span', { class: 'pl-tick tp-label', style: { left } }, fmtTp(t)));
        }
      });

      const { spots, items } = laneSpots(l.id);
      items.forEach((p, i) => {
        const node = h('div', {
          class: 'pl-node ' + nodeCls(p) + (p.id === st.selId ? ' on' : ''),
          style: { left: spots[i] + '%' },
          title: p.title + ' · 时间点 ' + fmtTp(tpNum(p)) + '（拖我改时间点）',
          onclick: () => { if (!drag || !drag.moved) select(p.id); },
          onmouseenter: () => { if (!drag) showTip(p, node); },
          onmouseleave: hideTip,
          onmousedown: ev => startDrag(ev, p, items, node)
        }, h('b', {}, p.title), h('s', {}, p.chapter || ''), h('i', {}));
        track.appendChild(node);
      });

      if (!items.length) {
        track.appendChild(h('span', { class: 'pl-laneempty' }, isMain ? '双击空白处新建第一个情节' : '双击这条暗线可以往里加情节'));
      }

      const pctOf = ev => {
        const r = track.getBoundingClientRect();
        return Math.max(0, Math.min(100, ((ev.clientX - r.left) / r.width) * 100));
      };
      track.addEventListener('click', ev => {
        if (ev.target.closest('.pl-node')) return;
        st.lane = l.id;
        const pct = pctOf(ev);
        showGhostAt(track, pct, fmtTp(pctTp(pct, max)));
      });
      track.addEventListener('dblclick', ev => {
        if (ev.target.closest('.pl-node')) return;
        st.lane = l.id;
        const pct = pctOf(ev);
        openForm(null, pctTp(pct, max), { lane: l.id });
      });
      row.appendChild(track);

      row.appendChild(h('div', { class: 'pl-laneacts' },
        !isMain ? h('button', { class: 'btn xs', title: '重命名 / 设置收敛去路', onclick: e => { e.stopPropagation(); editLane(l); } }, '设置') : null,
        !isMain ? h('button', {
          class: 'btn xs',
          title: converged(l) ? '取消收敛标记' : '标记这条暗线已经收敛回主线'
          , onclick: e => { e.stopPropagation(); convergeLane(l); }
        }, converged(l) ? '已收敛' : '收敛') : null,
        !isMain ? h('button', {
          class: 'btn xs', title: '删除这条暗线（里面的情节会移到主线）'
          , onclick: e => { e.stopPropagation(); removeLane(l); }
        }, '删除') : null));

      return { el: row, track, line: l };
    }

    let trackEl = null;
    let drag = null;
    let ghostAt = null;

    function showGhostAt(track, pct, tpText) {
      if (ghostAt && ghostAt.parentNode) ghostAt.remove();
      ghostAt = h('div', { class: 'pl-ghost', style: { left: pct + '%', display: '' } },
        h('b', {}, '双击在此新建 · 时间点约 ' + tpText), h('i', {}));
      track.appendChild(ghostAt);
    }

    /* 拖动时间轴上的节点：拖到哪就停在哪，松手（鼠标左键抬起）即定格。
     * - 拖动过程中节点严格跟着鼠标，不吸附、不回弹；
     * - 松手后按落点处的刻度算时间点（刻度是整数 → 四舍五入到整数），
     *   只改被拖的这一条，别的节点一动不动。 */
    function startDrag(ev, p, list, nodeEl) {
      if (ev.button !== 0) return;
      ev.preventDefault();
      ev.stopPropagation();
      hideTip();
      const track = nodeEl && nodeEl.parentNode ? nodeEl.parentNode : trackEl;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      /* 拖动期间刻度上限锁死（否则时间点一变，整条轴重新缩放，节点就漂了） */
      const max = laneMax(laneOf(p));
      const startX = ev.clientX;
      drag = { p, moved: false };
      const myEl = nodeEl;
      track.classList.add('dragging');
      if (myEl) myEl.classList.add('dragging');
      /* 拖动期间把这条线的其它节点淡一点，突出正在拖的 */
      Array.from(track.querySelectorAll('.pl-node')).forEach(el => { if (el !== myEl) el.classList.add('dim'); });

      const pctOf = e => Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const move = e => {
        if (!drag) return;
        if (Math.abs(e.clientX - startX) > 2) drag.moved = true;
        const pct = pctOf(e);
        drag.pct = pct;
        drag.tp = round2(pctTp(pct, max));
        /* 节点就是跟着鼠标走，不吸附、不回弹 */
        if (myEl) myEl.style.left = pct + '%';
      };
      const up = e => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
        track.classList.remove('dragging');
        if (myEl) myEl.classList.remove('dragging');
        Array.from(track.querySelectorAll('.pl-node')).forEach(el => el.classList.remove('dim'));
        const d = drag; drag = null;
        if (!d || !d.moved || d.pct == null) { renderTimeline(); return; }
        /* 定格：落点就是终点，绝不回弹。时间点按落点刻度算出来写进去。 */
        const finalPct = d.pct;
        const finalTp = d.tp;
        p.timePoint = Math.max(0, round2(finalTp));
        touch();
        renderAll();
        select(p.id);
        /* 重画后，把这条节点按落点百分比**钉住**（重画后轴的最大刻度可能变，
         * 位置会有点漂移；钉住落点才是用户看到的「拖到哪就停在哪」）。
         * 之后任何一次重画都会按新时间点摆位，此刻先保证视觉上不动。 */
        const laneTrack = trackEl && trackEl.dataset.lane === laneOf(p) ? trackEl : null;
        if (laneTrack) {
          const el2 = Array.from(laneTrack.querySelectorAll('.pl-node'))
            .find(n => n.querySelector('b') && n.querySelector('b').textContent === p.title);
          if (el2) el2.style.left = finalPct + '%';
        }
        toast('「' + p.title + '」时间点改为 ' + fmtTp(p.timePoint), 'ok');
      };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
      move(ev);
    }

    /* ---------- 列表拖拽排序 ----------
     * 列表按时间点排序，所以「拖到某一行前面」= 让它和途中经过的那几条交换时间点。
     * 只交换涉及到的这几条，没经过的情节时间点一点都不动。 */
    let listDragId = null;
    function clearRowMarks() {
      listBody.querySelectorAll('.pl-lrow').forEach(r => r.classList.remove('drop-before'));
    }
    function movePlotInList(fromId, toId) {
      const list = byTime();
      const from = list.findIndex(p => p.id === fromId);
      const to = list.findIndex(p => p.id === toId);
      if (from < 0 || to < 0 || from === to) return;
      const moved = list.splice(from, 1)[0];
      let target = to;                    /* 插到目标行之前 */
      if (from < to) target = to - 1;
      list.splice(target, 0, moved);
      /* 只把移动路径上那几条的时间点轮换一圈，其它情节原样不动 */
      const lo = Math.min(from, target), hi = Math.max(from, target);
      const tps = list.slice(lo, hi + 1).map(p => tpNum(p));
      tps.unshift(tps.pop());             /* 末尾那个的时间点挪到最前 */
      list.slice(lo, hi + 1).forEach((p, i) => { p.timePoint = tps[i]; });
      touch();
      renderAll();
      toast('已把「' + moved.title + '」移到第 ' + (target + 1) + ' 位', 'ok');
    }

    /* ================= 情节列表 ================= */
    let listBody = null;
    function renderList() {
      clear(listCard);
      const all = byTime();
      /* 下拉：主线 / 全部 / 每条暗线 分开看 */
      const filterSel = h('select', { class: 'pl-lanefilter', 'data-probe': 'plot-lane-filter' });
      filterSel.appendChild(h('option', { value: 'all' }, '全部时间线' + (lines().length > 1 ? '' : '')));
      lines().forEach(l => {
        filterSel.appendChild(h('option', {
          value: l.id,
          selected: (st.listLane || 'all') === l.id
        }, (l.kind === 'main' ? '主线' : '暗线') + ' · ' + (l.title || '未命名') + '（' + lanePlots(l.id).length + '）'));
      });
      filterSel.value = st.listLane || 'all';
      filterSel.addEventListener('change', () => { st.listLane = filterSel.value; renderList(); });
      const list = (st.listLane && st.listLane !== 'all') ? all.filter(p => laneOf(p) === st.listLane) : all;

      listCard.appendChild(h('div', { class: 'pl-chead' },
        h('h3', {}, '情节列表'),
        filterSel,
        h('span', { class: 'pl-cnt' }, list.length + ' 条'),
        h('span', { class: 'r' }, '按时间点排序')));

      listCard.appendChild(h('div', { class: 'pl-lhead' },
        h('span', {}, '序号'), h('span', {}, '情节名'), h('span', {}, '章节'),
        h('span', {}, '状态'), h('span', {}, '时间线'), h('span', { class: 'rt' }, '操作')));

      const body = h('div', { class: 'pl-lbody' });
      if (!list.length) body.appendChild(h('div', { class: 'empty' }, '还没有情节节点，点右上角「新建情节」'));
      list.forEach((p, i) => {
        const s = statusOf(p.status);
        const who = namesOf(p);
        const row = h('div', {
          class: 'pl-lrow' + (p.id === st.selId ? ' on' : ''),
          'data-plot': p.id,
          draggable: 'true',
          title: '拖动这一行可以调整它在时间上的先后',
          onclick: () => select(p.id),
          ondragstart: ev => {
            listDragId = p.id;
            ev.dataTransfer.effectAllowed = 'move';
            try { ev.dataTransfer.setData('text/plain', p.id); } catch (e) {}
            row.style.opacity = '0.45';
          },
          ondragend: () => { row.style.opacity = ''; listDragId = null; clearRowMarks(); },
          ondragover: ev => {
            if (!listDragId || listDragId === p.id) return;
            ev.preventDefault();
            ev.dataTransfer.dropEffect = 'move';
            clearRowMarks();
            row.classList.add('drop-before');
          },
          ondragleave: () => row.classList.remove('drop-before'),
          ondrop: ev => {
            ev.preventDefault();
            const fromId = listDragId;
            listDragId = null;
            clearRowMarks();
            if (!fromId || fromId === p.id) return;
            movePlotInList(fromId, p.id);
          }
        },
          h('span', { class: 'pl-idx' }, String(i + 1).padStart(2, '0')),
          h('span', { class: 'pl-ptitle', title: p.title }, p.title),
          h('span', { class: 'pl-chap' }, p.chapter || '—'),
          h('span', {}, h('span', { class: 'pill ' + s.cls }, s.label)),
          h('span', { class: 'pl-lane-pill' + (laneOf(p) === (mainLine() || {}).id ? ' main' : ' side'),
            title: '所属时间线：' + ((lineById(laneOf(p)) || {}).title || '主线') + '（点这里只看这条线）',
            onclick: e => { e.stopPropagation(); st.listLane = laneOf(p); renderList(); } },
            (lineById(laneOf(p)) || {}).title || '主线'),
          h('span', { class: 'pl-rowacts' },
            h('button', { class: 'btn xs', onclick: e => { e.stopPropagation(); openForm(p); } }, '编辑'),
            h('button', { class: 'btn xs', onclick: e => { e.stopPropagation(); scrapPlot(p); } }, '删除')));
        body.appendChild(row);
      });
      listBody = body;
      listCard.appendChild(body);
    }

    /* ================= 选中详情 ================= */
    function renderDetail() {
      clear(detailCard);
      const p = current();
      const idx = p ? byTime().findIndex(x => x.id === p.id) + 1 : 0;
      detailCard.appendChild(h('div', { class: 'pl-chead' },
        h('h3', {}, '情节详情'),
        h('span', { class: 'pl-cnt' }, p ? '第 ' + idx + ' / ' + doc.plots.length + ' 个节点' : '')));

      if (!p) {
        detailCard.appendChild(h('div', { class: 'empty' }, '在时间轴或左侧列表里选一个节点'));
        return;
      }
      const s = statusOf(p.status);
      const ids = (p.characterIds || []).filter(id => nameOf(id));
      const chips = ids.map(id => {
        const c = chars().find(x => x.id === id);
        return h('span', { class: 'pl-chip', onclick: () => NF.go('characters', { id: c.id }), title: '在人物页打开' },
          h('i', { style: { background: c.color || '#2F6F63' } }, c.name.slice(0, 1)), c.name);
      });

      detailCard.appendChild(h('div', { class: 'pl-din' },
        h('div', { class: 'pl-dtop' }, h('h2', { title: p.title }, p.title), h('span', { class: 'pill ' + s.cls }, s.label)),
        h('div', { class: 'pl-dmeta' },
          h('span', {}, '章节 ', h('b', {}, p.chapter || '—')),
          h('span', {}, '时间线 ', h('b', {}, (lineById(laneOf(p)) || {}).title || '主线')),
          h('span', {}, '第 ', h('b', {}, String(seqNo(p))), ' 位'),
          h('span', {}, '地点 ', h('b', {}, p.place || '—'))),
        h('p', { class: 'pl-dsum' }, p.summary || '（还没有摘要）'),
        h('div', { class: 'pl-dsec' }, '相关人物'),
        chips.length ? h('div', { class: 'pl-dchips' }, chips) : h('div', { class: 'pl-dmeta' }, '未标注相关人物'),
        h('div', { class: 'pl-dacts' },
          h('button', { class: 'btn xs', onclick: () => openForm(p) }, '编辑'),
          h('button', { class: 'btn xs', onclick: () => NF.go('chapter', { plot: p.id }), title: '跳到章节写作里对应的一章' }, '去章节里写'),
          h('button', { class: 'btn xs', onclick: () => scrapPlot(p) }, '移到废案'))));
    }

    /* ================= 右下角 AI 构思助手 =================
     * 和章节写作页同一套挂件：调设置里配置的模型，帮作者构思情节。
     * 回复可以「插入摘要」（写进当前选中情节的摘要）或「新建情节」（按 AI 给的建议直接建节点）。 */
    let aiDock = null, aiLog = null, aiBusy = false, aiReady = false, aiAbort = null;
    const aiHistory = [];

    const PLOT_AI_PROMPT = [
      '你是中文长篇小说情节构思助手，正和作者一起排情节时间轴。',
      '这次的目标是**设计情节**，不是写正文。',
      '回答要求：',
      '1) 直接给可用的情节设计，不要客套、不要前言；',
      '2) 每条情节写清：情节名 / 一句话梗概 / 牵涉人物 / 它在这条时间线上的位置（在哪些情节之前之后）/ 埋下的伏笔或回收的伏笔；',
      '3) 如果作者要的是「下一步」，就给 3~5 个可选走向，并说明每个走向的代价和冲突；',
      '4) 尊重已有的人物关系、势力与世界观设定，别自行增加未提及的设定；',
      '5) 用简洁的中文，条列清楚，每条约 1~3 行。'
    ].join('\n');

    const PLOT_AI_QUICK = ['下一步情节可以怎么走', '给这条线加一个转折', '这个情节和主线的关联', '埋一个伏笔', '给暗线设计一个收敛点'];

    /* 给模型的上下文：主线 + 暗线上已有情节、人物、世界观 */
    function buildPlotContext() {
      const ln = lines();
      const part = ln.map(l => {
        const arr = lanePlots(l.id);
        const body = arr.length
          ? arr.map((p, i) => '  ' + (i + 1) + '. [' + fmtTp(tpNum(p)) + '] ' + p.title +
            (p.chapter ? '（' + p.chapter + '）' : '') +
            (p.summary ? '：' + p.summary : '')).join('\n')
          : '  （还没有情节）';
        return '【' + (l.kind === 'main' ? '主线' : '暗线 · ' + (l.title || '未命名')) + '】\n' + body;
      }).join('\n\n');
      const people = (doc.characters || []).slice(0, 20).map(c => {
        const bits = [c.name];
        if (c.identity) bits.push(c.identity);
        if (c.persona) bits.push(c.persona);
        return '- ' + bits.join('：');
      }).join('\n');
      const plane = (doc.planes && doc.planes[0]) || null;
      const realms = plane && plane.realms && plane.realms.length ? plane.realms.map(r => r.name).filter(Boolean).join(' → ') : '';
      const cur = current();
      return [
        PLOT_AI_PROMPT,
        '',
        realms ? '【修为体系】' + realms : '',
        people ? '【人物】\n' + people : '',
        '【当前情节时间轴】\n' + part,
        cur ? '【作者正在看的情节】' + cur.title + (cur.summary ? '：' + cur.summary : '') : ''
      ].filter(Boolean).join('\n');
    }

    function renderAiLog() {
      if (!aiLog) return;
      clear(aiLog);
      if (!aiHistory.length) {
        aiLog.appendChild(h('div', { class: 'pl-ai-item note' },
          h('div', { class: 'pl-ai-msg' },
            '说说你想怎么发展，比如「给雪夜之后加一个反转」「云无咎这条暗线该怎么收」。' +
            '\nAI 会基于你现有的主线、暗线和人物给建议；回复可以写进选中情节的摘要，也可以直接建成新情节。')));
        return;
      }
      aiHistory.forEach(msg => {
        if (msg.role === 'user') {
          aiLog.appendChild(h('div', { class: 'pl-ai-item user' }, h('div', { class: 'pl-ai-msg' }, msg.content)));
        } else if (msg.role === 'note') {
          aiLog.appendChild(h('div', { class: 'pl-ai-item note' },
            h('div', { class: 'pl-ai-msg' }, msg.content),
            h('div', { class: 'pl-ai-tools' }, h('span', { onclick: retryPlotAsk }, '重试'))));
        } else {
          aiLog.appendChild(h('div', { class: 'pl-ai-item assistant' },
            h('div', { class: 'pl-ai-msg' }, msg.content || '（已丢弃）'),
            h('div', { class: 'pl-ai-tools' },
              h('span', { onclick: () => applyToSummary(msg.content), title: '写进当前选中情节的摘要' }, '写入摘要'),
              h('span', { onclick: () => makePlotFrom(msg.content), title: '用这段建议新建一个情节节点' }, '新建情节'),
              h('span', { onclick: () => { msg.content = ''; renderAiLog(); } }, '丢弃'))));
        }
      });
      aiLog.scrollTop = aiLog.scrollHeight;
    }

    function retryPlotAsk() {
      if (aiBusy) { toast('还在等上一轮回复', 'err'); return; }
      for (let i = aiHistory.length - 1; i >= 0; i--) {
        if (aiHistory[i].role === 'user') {
          const last = aiHistory[aiHistory.length - 1];
          if (last && last.role === 'note') aiHistory.pop();
          sendPlotAsk(aiHistory[i].content);
          return;
        }
      }
      toast('没有可以重试的内容', 'err');
    }

    /* 把 AI 的建议写进当前选中情节的摘要（追加，不覆盖） */
    function applyToSummary(text) {
      const p0 = current();
      if (!p0) { toast('先选中一个情节', 'err'); return; }
      const add = String(text || '').trim();
      if (!add) return;
      p0.summary = (p0.summary ? p0.summary + '\n' : '') + add;
      touch(); renderAll();
      toast('已写进「' + p0.title + '」的摘要', 'ok');
    }
    /* 用 AI 的建议新建一个情节：预填标题（第一行）与摘要，其余留给作者确认 */
    function makePlotFrom(text) {
      const t = String(text || '').trim();
      const firstLine = (t.split('\n').find(l => l.trim()) || '新情节').replace(/^[\s\d.、\-*]+/, '').trim();
      const title = firstLine.slice(0, 24) || '新情节';
      openForm(null, null, { preset: { title, summary: t } });
    }

    async function sendPlotAsk(msg) {
      if (aiBusy) { toast('正在等模型回复…', 'err'); return; }
      if (!msg) return;
      aiBusy = true; aiAbort = new AbortController(); paintAiBusy();
      try {
        const messages = aiHistory
          .filter(x => (x.role === 'user' || x.role === 'assistant') && x.content)
          .slice(-8)
          .map(x => ({ role: x.role, content: x.content }));
        messages.push({ role: 'user', content: buildPlotContext() + '\n\n【作者要求】' + msg });
        const ai = Object.assign({ temperature: 0.85, maxTokens: 1200 }, (doc.settings && doc.settings.ai) || {});
        const r = await window.nf.llm.chat(messages, { maxTokens: ai.maxTokens, temperature: ai.temperature });
        const text = String((r && r.content) || '').trim();
        if (!text) throw new Error('模型没有返回内容');
        aiHistory.push({ role: 'assistant', content: text });
        renderAiLog();
        toast('AI 回复好了', 'ok');
      } catch (e) {
        const err = String((e && e.message) || e).replace(/^Error invoking remote method '[^']*':\s*(?:Error:\s*)?/, '');
        aiHistory.push({ role: 'note', content: '请求失败：' + err + '（检查 设置 → 模型接口 后点「重试」）' });
        renderAiLog();
      }
      aiBusy = false; aiAbort = null; paintAiBusy();
    }

    function askPlot(text) {
      const msg = String(text || '').trim();
      if (!msg) return;
      aiHistory.push({ role: 'user', content: msg });
      renderAiLog();
      sendPlotAsk(msg);
    }

    function paintAiBusy() {
      if (!aiDock) return;
      const b = aiDock.querySelector('[data-role="send"]');
      if (b) { b.disabled = aiBusy; b.textContent = aiBusy ? '构思中…' : '发送'; }
      aiDock.classList.toggle('busy', aiBusy);
    }

    function togglePlotAi(open) {
      const on = typeof open === 'boolean' ? open : !aiDock.classList.contains('open');
      aiDock.classList.toggle('open', on);
      if (on) renderAiLog();
    }

    function buildPlotAi() {
      const modelTag = h('span', { class: 'pl-ai-model', title: '在设置 → 模型接口 里切换模型' },
        (NF.settings && NF.settings.llm && NF.settings.llm.model) || '未配置模型');
      aiLog = h('div', { class: 'pl-ai-log', 'data-probe': 'plot-ai-log' });
      const ta = h('textarea', { class: 'pl-ai-in', placeholder: '想怎么发展情节…（Ctrl+Enter 发送）', 'data-probe': 'plot-ai-input' });
      ta.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); const v = ta.value; ta.value = ''; askPlot(v); }
      });
      const quick = h('div', { class: 'pl-ai-quick' }, PLOT_AI_QUICK.map(t => h('span', { class: 'pl-ai-chip', onclick: () => askPlot(t) }, t)));
      const sendBtn = h('button', { class: 'btn pri', style: { padding: '4px 14px', fontSize: '11.5px' }, 'data-role': 'send', onclick: () => { const v = ta.value; ta.value = ''; askPlot(v); } }, '发送');
      const stopBtn = h('button', { class: 'btn', style: { padding: '4px 10px', fontSize: '11px', display: 'none' }, 'data-role': 'stop', onclick: () => { if (aiAbort) aiAbort.abort(); } }, '停止');
      aiDock = h('div', { class: 'pl-ai', 'data-probe': 'plot-ai-dock' },
        h('button', { class: 'pl-ai-fab', title: 'AI 情节构思（Ctrl+J）', onclick: () => togglePlotAi() }, 'AI'),
        h('div', { class: 'pl-ai-panel' },
          h('div', { class: 'pl-ai-h' },
            h('h3', {}, '情节构思'),
            modelTag,
            h('span', { class: 'pl-ai-x', title: '收起', onclick: () => togglePlotAi(false) }, '✕')),
          aiLog,
          quick,
          h('div', { class: 'pl-ai-f' },
            ta,
            h('div', { class: 'pl-ai-row' },
              stopBtn,
              h('button', { class: 'btn', style: { padding: '4px 10px', fontSize: '11px' }, onclick: () => { aiHistory.length = 0; renderAiLog(); } }, '清空对话'),
              h('span', { class: 'grow' }),
              h('span', { class: 'tiny muted', style: { fontSize: '9.5px' } }, 'Ctrl+↵ 发送'),
              sendBtn))));
      aiReady = true;
      wrap.appendChild(aiDock);
      renderAiLog();
    }

    /* ================= 暗线（额外的时间轴） =================
     * 一条暗线就是一条并行的支线时间轴，最后可以「收敛」回主线：
     * 标记收敛后，暗线上的情节仍然各自独立，只是视觉上知道这条线已经并回主线了。 */
    function addLane() {
      const nameIn = h('input', { class: 'input', placeholder: '例如：云无咎的身世' });
      modal({
        title: '开一条暗线', width: '520px',
        body: h('div', { class: 'col', style: { gap: '10px' } },
          h('div', { class: 'field' }, h('label', {}, '暗线名'), nameIn),
          h('div', { class: 'tiny muted' },
            '暗线是另一条并行的时间轴，用来放主线里不方便提前交代的线索（身世、阴谋、伏笔）。' +
            '它和主线共用同一个板子，只是各自一条泳道；写完之后可以在线下点「收敛」标记它并回主线。')),
        okText: '创建',
        onOk: () => {
          const t = (nameIn.value || '').trim();
          if (!t) { toast('请填写暗线名', 'err'); return false; }
          const l = { id: uid('ln'), title: t, kind: 'side', note: '', mergeInto: '', convergeChapter: '', convergePlot: '', convergedAt: '' };
          doc.plotLines.push(l);
          st.lane = l.id;
          touch();
          renderAll();
          toast('已开一条暗线「' + t + '」，双击它在的轨道就能往里加情节', 'ok');
        }
      });
      setTimeout(() => nameIn.focus(), 40);
    }

    function editLane(l) {
      if (!l) return;
      const nameIn = h('input', { class: 'input', value: l.title || '' });
      const noteIn = h('textarea', { class: 'ta', style: { minHeight: '62px' } }, l.note || '');
      /* 收敛目标：默认主线，也可以并到另一条暗线 */
      const intoSel = h('select', { class: 'select' });
      intoSel.appendChild(h('option', { value: '' }, '主线'));
      lines().filter(x => x.id !== l.id).forEach(x => {
        intoSel.appendChild(h('option', { value: x.id, selected: l.mergeInto === x.id }, x.title || '未命名'));
      });
      /* 收敛章节：从章节写作里挑一篇 */
      const chSel = h('select', { class: 'select' });
      chSel.appendChild(h('option', { value: '' }, '（还没定）'));
      (doc.manuscripts || []).forEach(m => {
        chSel.appendChild(h('option', { value: m.title, selected: l.convergeChapter === m.title }, msLabel(m)));
      });
      modal({
        title: '暗线设置', width: '580px',
        body: h('div', { class: 'col', style: { gap: '10px' } },
          h('div', { class: 'field' }, h('label', {}, '暗线名'), nameIn),
          h('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } },
            h('div', { class: 'field', style: { flex: '1' } }, h('label', {}, '最后收敛到'), intoSel),
            h('div', { class: 'field', style: { flex: '1.6' } }, h('label', {}, '收敛于哪一章'), chSel)),
          h('div', { class: 'field' }, h('label', {}, '这条线讲了什么（备注）'), noteIn)),
        okText: '保存',
        onOk: () => {
          const t = (nameIn.value || '').trim();
          if (!t) { toast('请填写暗线名', 'err'); return false; }
          l.title = t;
          l.note = noteIn.value.trim();
          l.mergeInto = intoSel.value || '';
          l.convergeChapter = chSel.value || '';
          touch();
          renderAll();
          toast('暗线已更新', 'ok');
        }
      });
      setTimeout(() => nameIn.focus(), 40);
    }

    function convergeLane(l) {
      if (!l) return;
      if (converged(l)) {
        l.convergedAt = ''; l.convergeChapter = ''; l.convergePlot = '';
        touch(); renderAll();
        toast('已取消「' + l.title + '」的收敛标记', 'ok');
        return;
      }
      /* 收敛点默认取这条线最后一个情节 */
      const mine = lanePlots(l.id);
      const last = mine[mine.length - 1];
      const chSel = h('select', { class: 'select' });
      chSel.appendChild(h('option', { value: '' }, '（还没定）'));
      (doc.manuscripts || []).forEach(m => {
        chSel.appendChild(h('option', { value: m.title }, msLabel(m)));
      });
      if (last && last.chapter) chSel.appendChild(h('option', { value: last.chapter, selected: true }, last.chapter + '（这条线最后一节）'));
      if (last && last.chapter) chSel.value = last.chapter;
      const plotSel = h('select', { class: 'select' });
      plotSel.appendChild(h('option', { value: '' }, '（还没定）'));
      mine.forEach(p => plotSel.appendChild(h('option', { value: p.id, selected: !!last && p.id === last.id }, p.title)));
      if (last) plotSel.value = last.id;
      modal({
        title: '「' + l.title + '」收敛到主线', width: '540px',
        body: h('div', { class: 'col', style: { gap: '10px' } },
          h('p', { class: 'small sub', style: { margin: 0, lineHeight: '1.85' } },
            '标记这条暗线已经并回主线。收敛后它的情节照常保留，只是时间轴上会显示「已收敛」，提醒你这条线索已经交代清楚。'),
          h('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } },
            h('div', { class: 'field', style: { flex: '1' } }, h('label', {}, '收敛于哪一章'), chSel),
            h('div', { class: 'field', style: { flex: '1' } }, h('label', {}, '收敛于哪一节'), plotSel))),
        okText: '标记已收敛',
        onOk: () => {
          l.convergeChapter = chSel.value || '';
          l.convergePlot = plotSel.value || '';
          l.convergedAt = new Date().toISOString();
          touch(); renderAll();
          toast('「' + l.title + '」已标记为收敛到主线', 'ok');
        }
      });
    }

    function removeLane(l) {
      if (!l || l.kind === 'main') return;
      const mine = lanePlots(l.id);
      modal({
        title: '删除暗线「' + l.title + '」', width: '480px',
        body: h('div', { class: 'col' },
          h('p', { class: 'small sub', style: { margin: 0, lineHeight: '1.85' } },
            '这条暗线上有 ' + mine.length + ' 个情节，删除后它们会移到主线末尾，不会丢。'),
          h('p', { class: 'tiny muted', style: { margin: 0 } }, '只想不再显示它的话，可以留着不填内容。')),
        okText: '删除并移到主线',
        onOk: () => {
          const mainId = (mainLine() || {}).id;
          mine.forEach(p => { p.lane = mainId; });
          doc.plotLines = doc.plotLines.filter(x => x.id !== l.id);
          /* 别的暗线若指向它，改回主线 */
          lines().forEach(x => { if (x.mergeInto === l.id) x.mergeInto = ''; });
          if (st.lane === l.id) st.lane = mainId;
          touch(); renderAll();
          toast('已删除暗线，情节已移到主线', 'ok');
        }
      });
    }

    /* ================= 新建 / 编辑表单 ================= */
    /* presetTime：在时间轴上双击时传进来的时间点，新建时就落在那儿
     * at：双击位置算出来的插入位次 { index }，保存时按这个位次插进列表再归一化 */
    function openForm(plot, presetTime, at) {
      const isNew = !plot;
      const pre = (at && at.preset) || null;
      const model = isNew
        ? {
          id: uid('g'), title: pre ? pre.title : '', chapter: '', chapterNo: 0, timePoint: 0, lane: '',
          place: '', characterIds: [], status: 'later', summary: pre ? pre.summary : ''
        }
        : Object.assign({}, plot, { characterIds: (plot.characterIds || []).slice() });

      const titleIn = h('input', { class: 'input', value: model.title, placeholder: '例如：雪夜断桥' });
      /* 章节：直接列出「章节写作」里的稿件，选中哪条就关联哪条（不带编号，不会出现 0|标题） */
      const msList = (doc.manuscripts || []).slice();
      const chapSel = h('select', { class: 'select', id: 'pl-chap-sel' });
      chapSel.appendChild(h('option', { value: '' }, '（不指定章节）'));
      /* 认章节：先比标题完全相同，再比章号（章号必须两边都非零，否则空值会误配到第一篇） */
      const wantNo = chNum(model.chapter || '');
      const sameChapter = m => (model.chapter && model.chapter === m.title) || (wantNo > 0 && chNum(m.title) === wantNo);
      msList.forEach(m => {
        chapSel.appendChild(h('option', { value: m.title, selected: !!sameChapter(m) }, msLabel(m)));
      });
      /* 老数据里的章节名不在稿件列表里：补一条，别把已有值弄丢 */
      const matched = msList.some(sameChapter);
      if (model.chapter && !matched) {
        chapSel.appendChild(h('option', { value: model.chapter, selected: true }, model.chapter + '（原有，未对上稿件）'));
      }
      /* 所属时间线：主线 or 某条暗线。新建时默认当前正在编辑的那条线 */
      const laneSeed = isNew ? (st.lane && lineById(st.lane) ? st.lane : (mainLine() || {}).id) : laneOf(plot);
      const laneSel = h('select', { class: 'select', id: 'pl-lane-sel' });
      lines().forEach(l => {
        laneSel.appendChild(h('option', { value: l.id }, (l.kind === 'main' ? '主线' : '暗线') + ' · ' + (l.title || '未命名')));
      });
      laneSel.value = laneSeed;
      /* 时间点：轴上落点的刻度值，可以手改（整数刻度） */
      const tpSeed = isNew
        ? (presetTime != null ? presetTime : Math.max(0, ...onLane(laneSeed).map(tpNum)) + 1)
        : tpNum(plot);
      const tpIn = h('input', { class: 'input', type: 'number', min: '0', step: '1', value: String(fmtTp(tpSeed)) });
      const placeIn = h('input', { class: 'input', value: model.place || '', placeholder: '例如：临水 · 断桥' });
      const statusSel = h('select', { class: 'select' },
        STATUS_KEYS.map(k => h('option', { value: k, selected: k === model.status }, STATUS[k].label)));
      const sumTa = h('textarea', { class: 'ta', style: { minHeight: '74px' } }, model.summary || '');

      const pick = h('div', { class: 'pl-pick' });
      if (!chars().length) pick.appendChild(h('span', { class: 'small muted' }, '还没有人物，可先去「人物」页新建'));
      chars().forEach(c => {
        const chip = h('span', { class: 'pl-pickchip' + (model.characterIds.includes(c.id) ? ' on' : '') },
          h('i', { style: { background: c.color || '#2F6F63' } }, c.name.slice(0, 1)), c.name);
        chip.addEventListener('click', () => {
          const i = model.characterIds.indexOf(c.id);
          if (i >= 0) model.characterIds.splice(i, 1); else model.characterIds.push(c.id);
          chip.classList.toggle('on');
        });
        pick.appendChild(chip);
      });

      modal({
        title: isNew ? '新建情节' : '编辑情节', width: '700px',
        body: h('div', { class: 'col', style: { gap: '10px' } },
          h('div', { class: 'field' }, h('label', {}, '情节名'), titleIn),
          h('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } },
            h('div', { class: 'field', style: { flex: '2' } }, h('label', {}, '章节（对应章节写作里的稿件）'), chapSel),
            h('div', { class: 'field', style: { flex: '1.4' } }, h('label', {}, '时间线'), laneSel),
            h('div', { class: 'field', style: { flex: '0.9' } }, h('label', {}, '时间点'), tpIn)),
          h('div', { class: 'row', style: { gap: '10px', alignItems: 'flex-start' } },
            h('div', { class: 'field', style: { flex: '2' } }, h('label', {}, '地点'), placeIn),
            h('div', { class: 'field', style: { flex: '1' } }, h('label', {}, '状态'), statusSel)),
          h('div', { class: 'field' }, h('label', {}, '摘要'), sumTa),
          h('div', { class: 'field' }, h('label', {}, '相关人物'), pick),
          h('div', { class: 'tiny muted' },
            '时间点 = 情节在时间轴上的位置（整数刻度）。也可以直接在时间轴上拖节点，松手即按落点改时间点。')),
        okText: '保存',
        onOk: () => {
          const title = titleIn.value.trim();
          if (!title) { toast('请填写情节名', 'err'); return false; }
          const chapter = chapSel.value || '';
          /* 只认标题完全相同的那条；章号兜底要两个号都非零才算，否则会误配到第一篇 */
          const chNo = chNum(chapter);
          const hit = msList.find(m => m.title === chapter) || (chNo ? msList.find(m => chNum(m.title) === chNo) : null);
          model.title = title;
          model.chapter = hit ? hit.title : chapter;
          model.chapterNo = hit ? chNum(hit.title) : chNo;
          model.place = placeIn.value.trim();
          model.status = statusSel.value;
          model.summary = sumTa.value.trim();
          const lane = laneSel.value || (mainLine() || {}).id;
          model.lane = lane;
          const tpVal = Number(tpIn.value);
          model.timePoint = isFinite(tpVal) ? round2(Math.max(0, tpVal)) : 0;
          const target = isNew ? model : plot;
          if (!isNew) Object.assign(plot, model);
          /* 同一刻度上已经有别的节点 → 往上找一个空的整数值，只动这一条 */
          const others = onLane(lane).filter(q => q.id !== target.id).map(tpNum);
          if (others.some(v => Math.abs(v - target.timePoint) < 0.5)) {
            const base = target.timePoint;
            for (let k = 1; k <= 200; k++) {
              const up1 = round2(base + k), dn1 = round2(base - k);
              if (!others.some(v => Math.abs(v - up1) < 0.5)) { target.timePoint = up1; break; }
              if (dn1 >= 0 && !others.some(v => Math.abs(v - dn1) < 0.5)) { target.timePoint = dn1; break; }
            }
          }
          if (isNew) doc.plots.push(target);
          st.lane = lane;
          st.selId = model.id;
          touch();
          renderAll();
          toast(isNew ? '已新建情节节点' : '情节已保存', 'ok');
        }
      });
      setTimeout(() => titleIn.focus(), 40);
    }

    /* ================= 删除 = 移到废案 ================= */
    function scrapPlot(p) {
      const i = doc.plots.findIndex(x => x.id === p.id);
      if (i < 0) return;
      doc.plots.splice(i, 1);
      doc.scraps.unshift({
        id: uid('x'), kind: 'plot', title: p.title,
        origin: p.chapter || '未标章节', reason: '手动删除',
        removedAt: new Date().toISOString(),
        summary: p.summary || '',
        payload: JSON.parse(JSON.stringify(p))
      });
      if (st.selId === p.id) {
        const next = byTime()[0];
        st.selId = next ? next.id : null;
      }
      touch();
      renderAll();
      toast('已移入废案回收站', 'ok');
    }

    /* ================= 废案回收站 ================= */
    function openDrawer() {
      st.drawer = true;
      layer.classList.add('on');
      renderDrawer();
    }
    function closeDrawer() {
      st.drawer = false;
      layer.classList.remove('on');
    }

    function restoreScrap(s) {
      if (!s.payload) { toast('这条废案没有保存原始数据，无法恢复', 'err'); return; }
      const rest = JSON.parse(JSON.stringify(s.payload));
      if (doc.plots.some(p => p.id === rest.id)) rest.id = uid('g');
      doc.plots.push(rest);
      doc.scraps = doc.scraps.filter(x => x.id !== s.id);
      st.selId = rest.id;
      touch();
      renderAll();
      toast('已恢复为情节节点', 'ok');
    }

    function discardScrap(s) {
      doc.scraps = doc.scraps.filter(x => x.id !== s.id);
      touch();
      renderHead();
      renderDrawer();
      toast('已彻底删除', 'ok');
    }

    function clearScraps() {
      const n = doc.scraps.length;
      if (!n) return;
      modal({
        title: '清空回收站', width: '430px',
        body: h('div', { class: 'col' },
          h('p', { class: 'small sub', style: { margin: 0, lineHeight: '1.85' } },
            '将彻底删除回收站里的 ' + n + ' 条废案，删除后无法恢复。'),
          h('p', { class: 'tiny muted', style: { margin: 0 } }, '若只是暂时不想看到它们，直接关闭抽屉即可。')),
        okText: '确认清空',
        onOk: () => {
          doc.scraps = [];
          touch();
          renderAll();
          toast('回收站已清空', 'ok');
        }
      });
    }

    function scrapRow(s) {
      return h('div', { class: 'pl-scrap' },
        h('div', { class: 'pl-sbody' },
          h('div', { class: 'pl-st' },
            h('span', { class: 'pl-stitle', title: s.title }, s.title || '未命名'),
            h('span', { class: 'pill grey' }, KIND_LABEL[s.kind] || '其他'),
            h('span', { class: 'pl-ago' }, ago(s.removedAt) || '日期未知')),
          h('div', { class: 'pl-smeta' },
            h('span', { class: 'pl-origin' }, '原位置 · ' + (s.origin || '—')),
            h('span', { class: 'pl-reason' }, s.reason || '未注明原因')),
          h('p', { class: 'pl-ssum' }, s.summary || '（没有摘要）')),
        h('div', { class: 'pl-sacts' },
          h('button', {
            class: 'btn xs', disabled: !s.payload,
            title: s.payload ? '恢复到情节' : '这条废案没有保存原始数据，只能删除',
            onclick: () => restoreScrap(s)
          }, '恢复'),
          h('button', { class: 'btn xs', onclick: () => discardScrap(s) }, '彻底删除')));
    }

    function renderDrawer() {
      clear(drawer);
      const all = doc.scraps;
      const f = FILTERS.find(x => x.k === st.filter) || FILTERS[0];
      const hit = all.filter(s => !f.kinds || f.kinds.includes(s.kind));

      drawer.appendChild(h('div', { class: 'pl-dhead' },
        h('h3', {}, '废案回收站'),
        h('span', { class: 'pill gold' }, all.length + ' 条'),
        h('span', { class: 'pl-x', onclick: closeDrawer, title: '关闭' }, '✕')));
      drawer.appendChild(h('div', { class: 'pl-dnote' },
        '从时间轴移除的情节会先落到这里，可随时恢复；90 天后自动清理。'));
      drawer.appendChild(h('div', { class: 'pl-fchips' },
        FILTERS.map(x => h('span', {
          class: 'pl-fchip' + (st.filter === x.k ? ' on' : ''),
          onclick: () => { st.filter = x.k; renderDrawer(); }
        }, x.label))));

      const listEl = h('div', { class: 'pl-slist' });
      if (!hit.length) {
        listEl.appendChild(h('div', { class: 'pl-empty' },
          st.filter === 'all' ? '回收站是空的，删掉的情节会先落到这里' : '这一类还没有废案'));
      }
      hit.forEach(s => listEl.appendChild(scrapRow(s)));
      drawer.appendChild(listEl);

      drawer.appendChild(h('div', { class: 'pl-sfoot' },
        h('button', {
          class: 'btn', style: { width: '100%', justifyContent: 'center' },
          disabled: !all.length, onclick: clearScraps
        }, '清空回收站')));
    }

    /* ================= 保留期：与抽屉里的「90 天后自动清理」一致 ================= */
    const KEEP_DAYS = 90;
    function purgeExpired() {
      const limit = Date.now() - KEEP_DAYS * 864e5;
      const keep = [];
      let gone = 0;
      doc.scraps.forEach(s => {
        const t = new Date(s.removedAt).getTime();
        if (isFinite(t) && t < limit) gone += 1; else keep.push(s);
      });
      if (!gone) return 0;
      doc.scraps = keep;
      touch();
      return gone;
    }

    /* ================= 渲染与选中 ================= */
    function select(id) {
      st.selId = id;
      renderTimeline();
      renderList();
      renderDetail();
      scrollListTo(id);
    }
    /* 点时间轴上的情节 → 让列表自动滚到那一行并高亮（列表在下半屏，得滚过去才看得见） */
    function scrollListTo(id) {
      if (!id || !listBody) return;
      const row = listBody.querySelector('.pl-lrow[data-plot="' + id + '"]');
      if (row) {
        try { row.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
        catch (e) { row.scrollIntoView(false); }
        row.classList.add('flash');
        setTimeout(() => row.classList.remove('flash'), 900);
        return;
      }
      /* 当前筛选看不到它 → 自动切回「全部」再定位 */
      if (st.listLane && st.listLane !== 'all') {
        const p0 = doc.plots.find(x => x.id === id);
        if (p0) { st.listLane = 'all'; renderList(); scrollListTo(id); }
      }
    }
    function renderAll() {
      renderHead();
      renderTimeline();
      renderList();
      renderDetail();
      if (st.drawer) renderDrawer();
    }

    const first = byTime()[0];
    st.selId = params.id && doc.plots.some(p => p.id === params.id) ? params.id : (first ? first.id : null);
    const expired = purgeExpired();
    renderAll();
    if (expired) toast('已清理 ' + expired + ' 条超过 ' + KEEP_DAYS + ' 天的废案', 'ok');

    buildPlotAi();
    const onKey = e => {
      if (e.key === 'Escape' && st.drawer) closeDrawer();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        togglePlotAi();
        const ta = aiDock && aiDock.querySelector('.pl-ai-in');
        if (ta) setTimeout(() => ta.focus(), 30);
      }
    };
    window.addEventListener('keydown', onKey);
    this._cleanup = () => window.removeEventListener('keydown', onKey);
  }
};
