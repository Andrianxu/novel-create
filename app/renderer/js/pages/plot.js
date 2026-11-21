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
.pl-track{position:relative;height:104px;margin-top:6px;--ts:1}
/* 树状分叉的跑道：轨道底部留白 = 子线树杈往下长的地方。
 * 轴线/节点/刻度全部按「内容区」居中（内容区 = 高度 - 底部留白），彼此对齐不受影响。 */
.pl-track{box-sizing:border-box;--pb:16px;--cy:calc((100% - var(--pb)) / 2)}
.pl-axis{position:absolute;left:0;right:0;top:var(--cy);margin-top:-1px;height:2px;border-radius:2px;background:linear-gradient(90deg,#2F6F63,#B98A3C 58%,#A8322A)}
.pl-vol{position:absolute;top:24px;bottom:18px;border-left:1px dashed #E6DAC4}
.pl-volname{position:absolute;top:82px;font-size:9.5px;color:#B6A98F;white-space:nowrap;letter-spacing:.04em}
.pl-node{position:absolute;top:var(--cy);width:0;height:0;cursor:pointer;z-index:2}
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
.pl-node b{position:absolute;left:0;bottom:8px;transform:translateX(-50%);font-size:10px;font-weight:400;color:#201C18;white-space:nowrap;line-height:1.2;padding:0 2px}
.pl-node.on b{color:#7C291F}
/* 和邻居的名字挤在一起时：只留小方块，名字靠 hover 的 tooltip 看 */
.pl-node.txt-off b,.pl-node.txt-off s{display:none}
.pl-node.txt-off i{box-shadow:0 0 0 3px rgba(201,151,60,.12)}
.pl-node s{position:absolute;left:0;top:9px;transform:translateX(-50%);font-size:9px;color:#8C8272;text-decoration:none;white-space:nowrap}
.pl-track{cursor:crosshair}
.pl-track.dragging{cursor:grabbing}
.pl-node{cursor:grab;user-select:none}
.pl-track.dragging .pl-node{transition:none}
.pl-node.dragging{z-index:5}
.pl-node.dragging i{box-shadow:0 0 0 6px rgba(47,111,99,.2);transform:scale(1.25)}
.pl-node.dragging.later i{transform:scale(1.25)}
.pl-node.dragging b{color:#7C291F}
.pl-tick{position:absolute;top:var(--cy);width:1px;height:7px;margin-top:-3px;background:#D8CBB2;pointer-events:none}
.pl-tick.tp-label{top:calc(var(--cy) + 7px);height:auto;margin-top:0;background:none;font-size:8.5px;color:#B6A98F;transform:translateX(-50%);white-space:nowrap}
.pl-ghost{position:absolute;top:var(--cy);width:0;height:0;pointer-events:none;z-index:4}
.pl-ghost i{position:absolute;left:0;top:0;width:13px;height:13px;margin:-6.5px 0 0 -6.5px;border-radius:50%;border:2px dashed var(--seal);background:#FFFCF5}
.pl-ghost b{position:absolute;left:0;bottom:12px;transform:translateX(-50%);font-size:10px;font-weight:400;color:var(--seal);white-space:nowrap;background:#FFFCF5;border:1px dashed #E0B9A8;border-radius:5px;padding:0 5px;line-height:1.5}
.pl-track .pl-drop-hint{position:absolute;right:0;top:0;font-size:9.5px;color:var(--muted)}

/* ---- 主线 / 暗线泳道 ---- */
.pl-board{position:relative;margin-top:6px;display:flex;flex-direction:column;gap:4px}
.pl-ruler{position:relative;height:15px;margin-left:106px;margin-right:70px}
.pl-rl{position:absolute;top:0;font-size:9px;color:#B6A98F;letter-spacing:.04em;white-space:nowrap;transform:translateX(-1px)}
/* 树状缩进：子线在父线下面往右递进一层（父上子下、层层往右），像树杈一样铺开。
 * 行级 padding-left 由 layoutTreeIndent() 按树算，兄弟子线再各占一栏，不会叠在一起。
 * 右端留一手给最深的几层。 */
.pl-lane{display:flex;align-items:center;gap:8px;border-radius:9px;padding:1px 24px 1px 0;box-sizing:border-box}
.pl-lane.on{background:rgba(47,111,99,.045)}
.pl-lanetag{flex:0 0 auto;width:auto;max-width:200px;display:flex;align-items:center;gap:5px;cursor:pointer;
  font-size:10.5px;color:#5B5348;padding:3px 6px;border-radius:7px;min-width:0}
.pl-lanetag:hover{background:rgba(255,255,255,.6)}
.pl-lane.side .pl-lanetag{color:#8A6421}
.pl-lanedot{width:7px;height:7px;border-radius:50%;flex:none;background:var(--jade)}
.pl-lane.side .pl-lanedot{background:#C9973C}
.pl-lanename{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700;max-width:104px}
.pl-lanecnt{font-size:9px;color:#A99C84;flex:none}
/* 是否显示端点徽标交给布局决定（行太窄就不显示，免得把名牌挤没） */
.pl-merge{flex:none;display:none;font-size:8.5px;padding:0 5px;border-radius:999px;background:#F3EBDA;color:#7A6A4E;white-space:nowrap}
.pl-merge.pend{background:transparent;border:1px dashed #DCC9A2;color:#A08A5C}
/* 是否显示端点徽标交给布局决定（行太窄就不显示，免得把名牌挤没） */
.pl-board.showep .pl-merge{display:inline-block}
.pl-laneacts{flex:none;display:flex;gap:3px;justify-content:flex-end;margin-left:auto}
.pl-laneacts .btn{padding:1px 5px;font-size:9.5px;line-height:1.5}
/* ---- 嵌套暗线：往右缩进一层，左边带个肘形符号 ---- */
.pl-lanetag{transition:margin-left .12s}
.pl-lanetag.nested{color:#7A6A4E}
.pl-lanetag.nested .pl-lanedot{width:6px;height:6px;background:#D8BE86}
.pl-laneelbow{flex:none;color:#C9B58C;font-size:10px;line-height:1;letter-spacing:-1px}
.pl-lane .pl-track{flex:1;min-width:0;height:80px;margin-top:0;overflow:visible}
.pl-lane.side .pl-track{height:68px}
.pl-axis.side{background:#C9973C;border-radius:2px}
/* 暗线自己的那段横线：默认不画，量到「第一个情节 … 最后一个情节」之后才由 JS 设 left/right 显示。
 * 这样空暗线不会拖一条横贯整行的长线，有内容时横线也绝不会长到引出点/收敛点之外。 */
.pl-lane.side .pl-axis{display:none}
.pl-laneempty{position:absolute;left:8px;top:var(--cy);transform:translateY(-50%);font-size:9.5px;color:#C3B79F;pointer-events:none}
.pl-lane-pill{font-size:9.5px;padding:0 7px;border-radius:999px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  background:#E2EEEA;color:#23604F;justify-self:start}
.pl-lane-pill.side{background:#F7EBD3;color:#8A6421}

/* ---- 带刻度的轴 + 树状分支 ---- */
.pl-canvas{position:relative}
.pl-branches{position:absolute;left:0;top:0;pointer-events:none;overflow:visible;z-index:0}
.pl-br{fill:none;stroke-width:1.4;stroke-linecap:round}
.pl-br.fork{stroke:#C9973C;stroke-dasharray:5 3;opacity:.9}
.pl-br.merge{stroke:#2F6F63;stroke-dasharray:none;opacity:.9}
.pl-brdot{stroke-width:1.5}
.pl-brdot.fork{fill:#FFFCF5;stroke:#C9973C;stroke-width:1.8}
.pl-brdot.merge{fill:#2F6F63;stroke:#2F6F63}
.pl-brdot.pending{fill:#FFFCF5;stroke:#CBB894;stroke-dasharray:2 1.5}
.pl-lane{position:relative;z-index:1;background:transparent}
.pl-lane.on{background:rgba(47,111,99,.045)}
.pl-track .pl-tick.tp-label{font-size:8px;color:#C0B49B}
/* ---- 视口外的情节收起来；轴两端标个「还有」 ---- */
.pl-node.out{display:none}
.pl-cut{position:absolute;top:var(--cy);transform:translateY(-50%);font-size:11px;color:#C9973C;pointer-events:none;line-height:1;font-weight:700}
.pl-cut.lo{left:-2px}
.pl-cut.hi{right:-2px}
/* ---- 缩放工具条 ---- */
.pl-zoombar{display:flex;align-items:center;gap:2px;flex:none;margin-left:6px}
.pl-zbtn{font-family:inherit;font-size:10px;line-height:1;height:19px;min-width:19px;padding:0 5px;cursor:pointer;
  border:1px solid #E2D6BE;border-radius:5px;background:#FFFDF8;color:#5B5348;transition:background .12s,border-color .12s}
.pl-zbtn:hover{background:#F7EFDD;border-color:#CBB894;color:#7C291F}
.pl-zbtn:active{background:#F0E4CB}
.pl-zbtn.wide{min-width:auto}
.pl-zpct{font-family:var(--mono);font-size:9.5px;color:#8A6421;min-width:26px;text-align:center;white-space:nowrap}
.pl-zsep{width:1px;height:12px;background:#E6DAC4;margin:0 3px;flex:none}
.pl-node.dim{opacity:.38}
.pl-node.dim i{box-shadow:none}
.pl-lanefilter{font-size:10px;height:22px;padding:0 4px;border:1px solid var(--line2);border-radius:6px;
  background:#FFFDF8;color:#5B5348;max-width:170px;cursor:pointer;font-family:inherit}
.pl-lanefilter:hover{border-color:#CBB894}

/* ---- 暗线的引出点 / 收敛点 ---- */
.pl-ep{flex:1;min-width:0;border:1px solid var(--line2);border-radius:9px;padding:8px 10px;background:#FFFDF8;display:flex;flex-direction:column;gap:6px}
.pl-ep>label{font-size:10.5px;color:#7A6A4E;letter-spacing:.04em;font-weight:700}
.pl-eprow{display:flex;align-items:center;gap:6px}
.pl-eplab{font-size:9.5px;color:#A99C84;width:34px;flex:none}
.pl-eprow .input,.pl-eprow .select{flex:1;min-width:0;height:26px;font-size:11.5px;padding:2px 7px}
.pl-eprow .btn{flex:none;white-space:nowrap}
.pl-pickhint{position:absolute;left:50%;top:2px;transform:translateX(-50%);z-index:20;
  font-size:11px;background:var(--ink);color:var(--paper);padding:4px 12px;border-radius:999px;
  box-shadow:0 6px 18px rgba(40,30,20,.28)}
.pl-track.picking{outline:2px dashed #C9973C;outline-offset:2px;cursor:crosshair}
.pl-track.picking .pl-node{pointer-events:none}

/* ---- 端点手柄：引出点 / 收敛点可以直接在父线轴上拖 ----
 * SVG 本身 pointer-events:none，所以只给手柄开命中；手柄画得比圆点大一圈，好抓。 */
.pl-brdot{pointer-events:none}
.pl-brdot.fork,.pl-brdot.merge,.pl-brdot.pending{pointer-events:auto;cursor:ew-resize}
.pl-brdot.fork:hover,.pl-brdot.merge:hover,.pl-brdot.pending:hover{stroke-width:2.8}
.pl-branches.epdrag{pointer-events:none}
.pl-ephint{position:absolute;top:calc(var(--cy) - 22px);z-index:30;pointer-events:none;
  font-size:10px;background:var(--ink);color:var(--paper);padding:2px 8px;border-radius:999px;white-space:nowrap;
  box-shadow:0 4px 12px rgba(40,30,20,.26);transform:translateX(-50%)}
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
    /* 暗线要收敛到哪条线（默认主线）；主线自己不需要。
     * 允许收敛到另一条暗线 → 暗线可以一层套一层地嵌套；成环的照旧退回主线。 */
    const mergeTarget = l => {
      if (!l || l.kind === 'main') return null;
      if (!l.mergeInto) return mainLine();
      const t = lineById(l.mergeInto);
      if (!t || t.id === l.id || t.kind === 'main') return t && t.kind === 'main' ? t : mainLine();
      return isAncestor(l.id, t.id) ? mainLine() : t;
    };
    /* 把一条线插到它收敛目标的那一行下面 → 树状缩进；成环/找不到的挂最后一层 */
    const depthOf = l => {
      let d = 0, cur = l, seen = new Set();
      while (cur && cur.kind !== 'main' && cur.mergeInto && d < 12) {
        if (seen.has(cur.id)) break;
        seen.add(cur.id);
        const p = lineById(cur.mergeInto);
        if (!p || p.kind === 'main') break;
        cur = p; d += 1;
      }
      return d;
    };
    /* x 是不是 y 的祖先（用来挡「A 收敛进 B、B 又收敛进 A」这种环） */
    function isAncestor(x, y) {
      let cur = lineById(y), guard = 0;
      while (cur && cur.mergeInto && guard++ < 12) {
        if (cur.mergeInto === x) return true;
        cur = lineById(cur.mergeInto);
      }
      return false;
    }
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
    /* 时间轴卡片节点：只在 mount 时建一次；后面要重画就现找 DOM（页面重绘会换节点） */
    let tlCardEl;
    const wrap = h('div', { class: 'pl-wrap' });
    const head = h('div', { class: 'pl-head', 'data-probe': 'plot-head' });
    tlCardEl = h('div', { class: 'card pl-tl', 'data-probe': 'plot-axis' });
    const listCard = h('div', { class: 'card pl-list', 'data-probe': 'plot-list' });
    const detailCard = h('div', { class: 'card pl-detail', 'data-probe': 'plot-detail' });
    const tip = h('div', { class: 'pl-tip' });
    wrap.appendChild(head);
    wrap.appendChild(tlCardEl);
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

    /* 这条线的时间点范围（缩放后所有线共用同一套刻度，这里只为兼容老调用保留） */
    function laneMax(lane) { return viewSpan().b; }
    /* 这条线在轴上要画的刻度：视口内、这条线自己踩到的时间点 + 好读的整数刻度。
     * 缩放后一格可能是 0.1 甚至更小，所以步长跟着视口宽度自动选（1/2/5×10^n）。 */
    function laneTicks(lane, n) {
      const v = viewSpan();
      const span = v.b - v.a;
      const want = Math.max(3, n || 8);
      let step = Math.pow(10, Math.floor(Math.log10(Math.max(1e-6, span / want))));
      const m = span / want / step;
      if (m >= 5) step *= 5; else if (m >= 2) step *= 2;
      const set = new Set();
      for (let k = Math.ceil(v.a / step); k * step <= v.b + 1e-9 && set.size < 400; k++) {
        set.add(round2(k * step));
      }
      /* 这条线上情节真正踩的时间点也标出来（哪怕不是整数） */
      onLane(lane).forEach(p => {
        const t = round2(tpNum(p));
        if (t >= v.a - 1e-9 && t <= v.b + 1e-9) set.add(t);
      });
      const ticks = Array.from(set).sort((x, y) => x - y);
      return { ticks, max: v.b, step };
    }
    /* 时间点 → 百分比（按当前视口） */
    function tpPct(tp, max) { return pctK(tp); }
    /* 百分比 → 时间点（按当前视口反算；不吸附到整数，拖动时落到哪算哪） */
    function pctTp(pct, max) {
      const v = viewSpan();
      const t = Math.max(SPAN_LO, Math.min(SPAN_HI, Number(pct) || 0));
      return round2(v.a + ((t - SPAN_LO) / (SPAN_HI - SPAN_LO)) * (v.b - v.a));
    }
    /* 这条线上每个情节的百分比（按时间点；同一时间点的按顺序错开一点） */
    function laneSpots(lane) {
      const arr = lanePlots(lane);
      const out = [];
      arr.forEach(p => {
        let x = tpPct(tpNum(p));
        /* 和前面重叠就右移，但不越过轴的右端；缩得很小时这种错开仍然有用 */
        for (let k = 0; k < out.length; k++) {
          if (Math.abs(out[k] - x) < MIN_GAP_PCT) x = Math.min(SPAN_HI, out[k] + MIN_GAP_PCT);
        }
        out.push(x);
      });
      return { spots: out, items: arr, max: viewSpan().b };
    }
    /* 视口外的情节：收起来不画（但列表里照样有） */
    function inView(p) {
      const v = viewSpan(), t = tpNum(p);
      return t >= v.a - 1e-9 && t <= v.b + 1e-9;
    }

    /* ---- 缩放动作 ---- */
    /* 以某个百分比位置（默认正中）为锚点缩放 factor 倍：>1 放大，<1 缩小 */
    function zoomBy(factor, focusPct) {
      initViewIfNeeded();
      const v = viewSpan();
      const f = typeof focusPct === 'number' ? Math.max(SPAN_LO, Math.min(SPAN_HI, focusPct)) : 50;
      const anchorTp = pctTp(f);
      const cur = v.b - v.a;
      const want = Math.max(MIN_WIN, Math.min(axisMax(), cur / factor));
      const ratio = (anchorTp - v.a) / Math.max(1e-9, cur);
      setView(clampView(anchorTp - ratio * want, anchorTp - ratio * want + want));
      renderTimeline();
    }
    function zoomFit() {
      setView({ a: 0, b: Infinity });      /* 全轴：以后数据变了也跟着变 */
      renderTimeline();
    }
    function zoomUsed() {
      const r = usedRange();
      const before = viewSpan();
      setView({ a: r[0], b: r[1] });      /* r 已经是合法视口，不用再夹 */
      renderTimeline();
      const now = viewSpan();
      if (Math.abs((now.b - now.a) - (before.b - before.a)) < 0.05) {
        toast('情节已经铺满整条轴，没有多余空白可以省', 'ok');
      } else {
        toast('已缩到情节实际用到的 ' + fmtTp(now.a) + ' – ' + fmtTp(now.b), 'ok');
      }
    }
    /* 平移：按视口宽度的比例挪 */
    function panBy(frac) {
      initViewIfNeeded();
      const v = viewSpan();
      const w = v.b - v.a;
      setView(clampView(v.a + w * frac, v.b + w * frac));
      renderTimeline();
    }
    /* 滚轮：默认横向缩放（鼠标所在处当锚点），按住 Shift 平移；non-passive 才能 preventDefault */
    function onWheel(ev) {
      if (!ev.deltaY && !ev.deltaX) return;
      ev.preventDefault();
      initViewIfNeeded();
      if (ev.shiftKey) { panBy((ev.deltaY || ev.deltaX) > 0 ? 0.15 : -0.15); return; }
      const track = ev.target.closest ? ev.target.closest('.pl-track') : null;
      let pct = 50;
      if (track) {
        const r = track.getBoundingClientRect();
        pct = Math.max(0, Math.min(100, ((ev.clientX - r.left) / (r.width || 1)) * 100));
      }
      zoomBy((ev.deltaY || 0) > 0 ? 0.88 : 1.14, pct);
    }

    /* 时间轴卡片：页面重绘会换掉节点，所以每次都现找，别缓存旧节点 */
    const tlCard = () => document.querySelector('.pl-tl');

    /* 缩放工具条：− / 比例 / ＋ / 左右平移 / 「实际用到」/「全部」 */
    function zoomBar() {
      const v = viewSpan();
      const full = axisMax();
      const ratio = full > 0 ? full / Math.max(1e-9, v.b - v.a) : 1;
      const pctText = ratio <= 1.01 ? '全部' : '×' + (Math.round(ratio * 10) / 10);
      const mk = (txt, tip, fn, cls) => h('button', {
        class: 'pl-zbtn' + (cls ? ' ' + cls : ''), type: 'button', title: tip,
        onclick: ev => { ev.stopPropagation(); fn(); }
      }, txt);
      return h('div', { class: 'pl-zoombar', 'data-probe': 'plot-zoom' },
        mk('−', '缩小（也可以直接把鼠标放在轴上滚滚轮）', () => zoomBy(1 / 1.6)),
        h('span', { class: 'pl-zpct', title: '当前显示 ' + fmtTp(v.a) + ' – ' + fmtTp(v.b) + '（时间点）' }, pctText),
        mk('＋', '放大（滚轮向上）', () => zoomBy(1.6)),
        h('span', { class: 'pl-zsep' }),
        mk('◀', '往左平移（视口的 1/3）', () => panBy(-1 / 3)),
        mk('▶', '往右平移（视口的 1/3）', () => panBy(1 / 3)),
        h('span', { class: 'pl-zsep' }),
        mk('实际用到', '只显示情节真正用到的刻度范围', zoomUsed),
        mk('全部', '回到完整时间轴', zoomFit, 'wide'));
    }

    /* ================= 时间轴（主线 + 暗线，树状引出 / 收敛） ================= */

    /* ---- 横向缩放 / 平移 ----
     * 所有线共用一套刻度（= 主线的 0 .. 最大时间点），这样上下对齐、树枝也不会画歪。
     * 缩放只是「把这段刻度放大铺满轨道」，情节的时间点本身一律不动；
     * 拖到视口外面的就收起来（.out），免得贴着轨道两边堆成一团。
     * view = { a, b }：当前视口对应的刻度区间，a < b，b - a >= MIN_WIN。 */
    const MIN_WIN = 0.5;              /* 一屏至少显示多少个时间点（再放大就太挤） */
    const zoomState = { a: null, b: null };   /* null = 还没定，首帧自动算 */

    /* 全轴该到多少：最小 10，最大时间点之外多留一个刻度（5%）的呼吸空间；
     * 精度按 0.5 向上取，避免 17 变成 17.85 这种尾巴数。 */
    function axisMax() {
      let m = 10;
      doc.plots.forEach(p => { const v = tpNum(p); if (v > m) m = v; });
      lines().forEach(l => {
        if (l.kind === 'main') return;
        m = Math.max(m, forkTpOf(l), hasMerge(l) ? Number(l.mergeTp) : 0);
      });
      return round2(Math.ceil((m + Math.min(0.5, m * 0.05)) * 2) / 2);
    }

    /* 视口 → 实际区间。b === Infinity 表示「全轴」：每次都按当前数据重算，跟着数据走 */
    function viewSpan() {
      if (zoomState.b === Infinity) return { a: 0, b: axisMax() };
      return { a: zoomState.a, b: zoomState.b };
    }
    /* 「实际用到」直接给出一个合法视口：[0, max] 或收紧到情节占用的那一段。
     * 只收两端，中间的空档一律保留（空档本身也是信息）。 */
    function usedRange() {
      const arr = doc.plots.map(tpNum).sort((x, y) => x - y);
      const max = axisMax();
      if (!arr.length) return [0, max];
      /* 暗线的端点也算「用到了」：引出/收敛点落在父线上，裁掉就看不见树枝了 */
      const marks = arr.slice();
      lines().forEach(l => {
        if (l.kind === 'main') return;
        marks.push(forkTpOf(l));
        if (hasMerge(l)) marks.push(Number(l.mergeTp));
      });
      marks.sort((x, y) => x - y);
      const lo0 = marks[0], hi0 = marks[marks.length - 1];
      /* 使用范围本身已经占满大半条轴：没什么可省的，就维持全轴 */
      if ((hi0 - lo0) >= max * 0.7) return [0, max];
      /* 两端各留 8% 的呼吸空间（按幅度算，纯比例的话数据越远留得越少） */
      const pad = Math.max(1, (hi0 - lo0) * 0.08);
      const lo = Math.max(0, lo0 - pad), hi = Math.min(max, hi0 + pad);
      return [round2(lo), round2(hi)];
    }
    /* 把视口夹到合法范围：不能超出 0..axisMax，窗口也不能小于 MIN_WIN。
     * 注意这是「缩放锚点」用的夹取：窗口比轴还长时贴左边，否则保持宽度往轴里挪。
     * 「实际用到」「全部」这种自带合法边界的视口别走这里（会被撑回全轴），直接 setView。 */
    function clampView(a, b) {
      const max = axisMax();
      if (b === Infinity) return { a: 0, b: max };
      let w = Math.max(MIN_WIN, Math.min(max, b - a));
      let lo = Math.max(0, a);
      if (lo + w > max) lo = Math.max(0, max - w);
      return { a: round2(lo), b: round2(lo + w) };
    }
    function initViewIfNeeded() {
      if (zoomState.b === Infinity) { zoomState.a = 0; return; }
      if (!isFinite(zoomState.a) || !isFinite(zoomState.b) || !(zoomState.b > zoomState.a)) {
        /* 首帧：先按「实际用到」给一个不空的视口，免得一堆情节挤在左端 */
        const r = usedRange();
        zoomState.a = r[0]; zoomState.b = r[1];
        return;
      }
      const v = clampView(zoomState.a, zoomState.b);
      zoomState.a = v.a; zoomState.b = v.b;
    }
    function setView(v) { zoomState.a = v.a; zoomState.b = v.b; }

    /* 轨道内容区那一块的宽度/尺寸。padding 用百分比写（相对轨道内容区，不会反过来喂宽），
     * 所以「内容区」= 轨道宽度 - 左右两个百分比 × max(内容区, 背景区) —— 解这个方程就行。
     * 树状缩进会把轨道压窄，按整条轨道宽度去算 margin 的老写法会把可画宽度挤成负数。 */
    function trackContent(track) {
      const W = track.clientWidth || 0;
      const H = track.clientHeight || track.offsetHeight || 0;
      const cs = getComputedStyle(track);
      const ts = Math.max(0.3, Math.min(1, parseFloat(cs.getPropertyValue('--ts')) || 1));
      const plp = parseFloat(cs.paddingLeft) || 0, prp = parseFloat(cs.paddingRight) || 0;
      const pbp = parseFloat(cs.getPropertyValue('--pb')) || 0;
      const ptp = parseFloat(cs.paddingTop) || 0;
      const pad = plp + prp;
      let cw;
      if (pad < 100) {
        let s = W;
        for (let i = 0; i < 6; i++) s = W - (pad / 100) * Math.max(0, s);
        cw = s;
      } else {
        cw = Math.max(0, W * (100 - pad) / 100);
      }
      /* 轴线 y：内容区竖直方向居中（和 --cy 的算法一致），再按 --ts 缩放一下 */
      const contentH = Math.max(0, H - ptp - pbp);
      /* border-box：轴线离轨道顶部的距离（CSS 里 --cy 用 top 算，这是同一个数） */
      const axisTop = ptp + contentH / 2;
      return { W, H, cw: Math.max(0, cw) * ts, cy: axisTop * ts, axisTop };
    }
    /* 元素在 offsetParent（.pl-canvas 是 position:relative）里的纵坐标：把中间各层的 offsetTop 加起来 */
    function topIn(el, root) {
      let y = 0, n = el;
      while (n && n !== root) { y += n.offsetTop || 0; n = n.offsetParent; }
      return y;
    }
    /* 量每条线自己的节点：圆点位置**严格按时间点**（和刻度同一套 pctK），一丝都不挪 ——
     * 圆点必须压在刻度上，拖节点才不会漂；名字挤在一起时只把名字藏起来。
     *   · sync()        —— 把圆点位置写回 DOM，并藏掉放不下的名字
     *   · span()        —— 这条线内容的左右边界（轨道内容区像素）
     *   · viewport(root) —— 画布坐标里的轴线 y / 轨道左边 / 内容宽度，画树枝用 */
    function measureLane(track, items, els) {
      if (!items || !items.length || !els || els.length !== items.length) return null;
      const tc = trackContent(track);
      const used = Math.max(1, tc.cw);
      const blocks = items.map((it, i) => ({ u: it.u, el: els[i], tp: it.tp, w: it.w, px: it.u * used }));
      let sl = null;
      return {
        blocks, track, used,
        span() {
          if (!sl) {
            sl = { L: blocks[0].px, R: Math.max(blocks[0].px + 18, blocks[blocks.length - 1].px) };
          }
          return sl;
        },
        sync() {
          let lastR = -1e9;
          blocks.forEach(b => {
            const n = b.el;
            const bEl = n.querySelector('b'), sEl = n.querySelector('s');
            /* 节点本身是个 0 尺寸的锚点，圆点/名字都用负 margin 或 translateX(-50%) 自居中，
             * 所以 left 直接写时间点对应的 px，圆点中心就正好压在刻度上 */
            n.style.left = b.px + 'px';
            /* 名字的锚点 = 圆点（节点自身宽高为 0，只当圆心用） */
            if (bEl) bEl.style.left = '5.5px';
            if (sEl) sEl.style.left = '5.5px';
            /* 名字放不下（和上一个名字挤在一起）：藏起来，但小圆点还在，hover 能看全 */
            const hits = b.px < lastR + 2;
            n.classList.toggle('txt-off', hits);
            if (!hits) lastR = b.px + b.w;
          });
        },
        viewport(root) {
          /* 用屏幕矩形相减来定位（offsetLeft 会因为「轨道是不是 offsetParent」而差一个缩进量，
           * 树状缩进正好是行上的 padding-left，用 offsetLeft 会整段偏移） */
          const tr = track.getBoundingClientRect();
          const rr = root.getBoundingClientRect();
          const sx = root.scrollLeft || 0, sy = root.scrollTop || 0;
          const left = tr.left - rr.left + sx;
          const top = tr.top - rr.top + sy;
          const cy = tc.axisTop;
          const sp = this.span();
          return { y: top + cy, top, left, used, cy, L: left + sp.L, R: left + sp.R };
        }
      };
    }

    /* 时间点 → 百分比（按当前视口）。
     * ⚠ 这里返回的是「轨道内容区」的百分比：树状缩进把轨道压窄之后，原来按整条轨道长度
     * 算出来的 margin-left / 圆形内边距会把可画宽度占掉一大截，改用内容区百分比最稳。
     * 轨道内容区由 --ts 决定（整轴横向缩放：暗线多、缩进深时略缩一点，见 layoutTreeIndent）。 */
    function pctK(tp) {
      const v = viewSpan();
      const w = v.b - v.a;
      if (!(w > 0)) return 50;
      const t = Math.max(v.a, Math.min(v.b, Number(tp) || 0));
      const raw = SPAN_LO + ((t - v.a) / w) * (SPAN_HI - SPAN_LO);
      return Number.isFinite(raw) ? raw : 50;
    }
    /* 时间点钳到当前视口里（树状缩进按屏幕上看得见的位置算，看不见的一律贴边） */
    function clipTp(t) {
      const v = viewSpan();
      return Math.max(v.a, Math.min(v.b, Number(t) || 0));
    }
    /* 暗线在父线上「最强的那个点」：引出点、收敛点哪个更靠右边。
     * 子线排在哪一栏，就看它从父线的哪个位置分出去 / 并回去 —— 这样排出来是树枝，
     * 不是所有子线都顶在最左边伸一条长枝出来。 */
    function anchorTp(l) {
      const f = clipTp(forkTpOf(l));
      const m = clipTp(mergeTpOf(l));
      return Math.max(f, m);
    }
    function renderTimeline() {
      /* 只清卡片里的内容，别动卡片本身 */
      if (!document.querySelector('.pl-tl')) return;
      initViewIfNeeded();          /* 缩放后/第一次画之前，先保证视口合法 */
      clear(tlCard());
      hideTip();
      ghostAt = null;
      const all = byTime();
      const ln = lines();

      tlCard().appendChild(h('div', { class: 'pl-tlhead' },
        h('h3', {}, '时间轴'),
        h('span', { class: 'pl-lg' }, h('i', {}), '已发生'),
        h('span', { class: 'pl-lg' }, h('i', { class: 'later' }), '后续计划'),
        h('span', { class: 'pl-lg' }, h('i', { class: 'ending' }), '结局'),
        zoomBar(),
        h('span', { class: 'pl-hint' }, all.length
          ? '拖节点改时间点 · 单击选中 · 双击空白处新建 · 滚轮缩放 · 拖端点圆点改引出/收敛点 · 暗线可层层嵌套'
          : '双击时间轴空白处新建情节；也可以开一条暗线')));

      /* 主线在上面，暗线整行缩进：「父线在上、子线在下、层层往右」，缩进修成树状图的样子 */
      const main = mainLine();
      const sideLines = orderedSideLines();
      /* 缩进要先算：laneRow 里量「轨道还剩多宽」要用到它 */
      layoutTreeIndent();
      const board = h('div', { class: 'pl-board' });
      /* 暗线多了就让它自己滚，别把整个情节页撑爆 */
      const canvas = h('div', { class: 'pl-canvas', style: { maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' } });
      /* ★ 树状图：每一行就是树的一个节点（行 = 线），整行按层级往右缩进、左边接一个肘形 ↵；
       *   父子关系由行条上的小圆点和肘形指示，树枝由 layoutBranches 按暗线自己的引出/收敛点弯过去。 */
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'pl-branches');
      canvas.appendChild(svg);
      /* ★ 树状图按「画布坐标」画（绝对定位），整个画布滚到哪树枝就跟到哪，不会被裁掉 */
      svg.style.position = 'absolute';
      svg.style.left = '0';
      svg.style.top = '0';
      const rows = [];
      const byLine = new Map();
      const addRow = (l, isMain) => {
        const row = laneRow(l, isMain);
        canvas.appendChild(row.el);
        rows.push(row);
        byLine.set(l.id, row);
      };
      addRow(main, true);
      sideLines.forEach(l => addRow(l, false));

      board.appendChild(canvas);
      tlCard().appendChild(board);
      /* 滚轮缩放 / 平移：挂在画布上（轨道是每次重画的，挂外层就不用反复解绑） */
      canvas.addEventListener('wheel', onWheel, { passive: false });

      /* 树状跑道：有子线的行往下加高，树杈各自占一条道 */
      layoutTreeTracks();
      /* 树状缩进再按真实 DOM 刷一遍（行宽可能跟预排的不一样） */
      layoutTreeIndent();

      /* 刻度密度按「这一行实际能画多宽」挑，缩进吃掉宽度之后自动变稀，标签不叠 */
      rows.forEach(r => {
        const cw = trackContent(r.track).cw;
        r.relabel(Math.max(22, Math.min(90, cw * 0.05)));
      });

      /* 量布局 + 把情节节点摆到不叠的位置（名字多长都按可见宽度排） */
      const meas = new Map();
      rows.forEach(r => {
        const m = measureLane(r.track, r.mItems, r.nodeEls, r.line.id);
        if (m) { m.sync(); meas.set(r.line.id, m); }
      });
      /* —— 尺寸拿到之后才画 SVG（要真实坐标） —— */
      layoutBranches(svg, rows, main, sideLines, meas);
      /* 之后窗口一变、或者暗线增删导致换行，重画一次 */
      scheduleRebranch(svg, rows, main, sideLines);

      trackEl = rows[0] ? rows[0].track : null;
    }

    /* 树状跑道的排布：一条线有几个子线，就往下多给几条「副轨道」。
     * 每行默认只够放自己的内容，子线多的时候树杈会挤成一坨；
     * 这里按子线数量（最多按 3 条算，再多就不无限加高）给父线行增加下边距，
     * 让每条子线的收敛/引出树杈各自占一条道，看起来才像树杈而不是一束线。 */
    function layoutTreeTracks() {
      const perParent = new Map();
      lines().forEach(l => {
        if (l.kind === 'main') return;
        const p = mergeTarget(l);
        const pid = p ? p.id : (mainLine() || {}).id;
        perParent.set(pid, (perParent.get(pid) || 0) + 1);
      });
      document.querySelectorAll('.pl-canvas .pl-lane').forEach(rowEl => {
        const id = rowEl.getAttribute('data-line');
        const track = rowEl.querySelector('.pl-track');
        if (!track) return;
        const n = perParent.get(id) || 0;
        /* 底部留白 = 树杈往下生长的跑道；子线越多跑道越长（最多按 3 条算） */
        const pb = n > 1 ? 18 + Math.min(n, 3) * 16 : (n ? 26 : 22);
        track.style.paddingBottom = pb + 'px';
        track.style.setProperty('--pb', pb + 'px');
        rowEl.classList.toggle('forking', n > 0);
        rowEl.setAttribute('data-kids', String(n));
      });
    }

    /* 暗线排成树：父线一定在自己的子线上面；同层按引出点先后。
     * 先按数据顺序做一次 DFS，收敛目标找不到/成环的兜底挂到主线下面。 */
    let rowOrderCache = [];
    function orderedSideLines() {
      const all = lines().filter(l => l.kind !== 'main');
      const kids = new Map();          /* 父线 id → 子线数组 */
      const orphans = [];
      all.forEach(l => {
        const p = mergeTarget(l);
        const pid = p ? p.id : (mainLine() || {}).id;
        if (!kids.has(pid)) kids.set(pid, []);
        kids.get(pid).push(l);
      });
      const out = [];
      const seen = new Set();
      const walk = (pid, depth) => {
        (kids.get(pid) || []).forEach(l => {
          if (seen.has(l.id)) return;
          seen.add(l.id);
          out.push({ line: l, depth });
          walk(l.id, depth + 1);
        });
      };
      walk((mainLine() || {}).id, 0);
      /* 没被走到的（成环 / 父线被删）直接补在最后，保证一条线都不丢 */
      all.forEach(l => { if (!seen.has(l.id)) { seen.add(l.id); out.push({ line: l, depth: 0 }); } });
      /* 兄弟子线按「引出点先后」排（引出点一样就看收敛点），这样树杈从左到右依次叉开、不交叉 */
      const kidsOf = pid => (kids.get(pid) || []).slice().sort((a, b) => (anchorTp(a) - anchorTp(b)) || (clipTp(mergeTpOf(a)) - clipTp(mergeTpOf(b))));
      const reorder = [];
      const walk2 = (pid, depth) => {
        kidsOf(pid).forEach(l => {
          if (reorder.some(x => x.line.id === l.id)) return;
          reorder.push({ line: l, depth });
          walk2(l.id, depth + 1);
        });
      };
      const rootIds = new Set();
      walk2((mainLine() || {}).id, 0);
      /* 兜底：DFS 从主线走不到的（环），原样补在最后 */
      out.forEach(x => { if (!reorder.some(y => y.line.id === x.line.id)) reorder.push(x); });
      rowOrderCache = reorder;
      return reorder.map(x => x.line);
    }
    const depthIn = id => {
      const hit = rowOrderCache.find(x => x.line.id === id);
      return hit ? hit.depth : 0;
    };

    /* 树状缩进：按「父线 → 子线」的树，每下一层整行右移一个栏距。
     * 栏位按父线上「引出点 / 收敛点更靠右的那一个」排序，兄弟子线各自占一段宽度，
     * 免得同一条父线下面几条子线叠在同一栏里（原来一律缩进 14px，兄弟间会压在一起）。
     * 缩进是「树状图」的骨架：父线在上、子线在下、往右递进，右端留一手把最深的几层也放得下。 */
    let indentCache = new Map();     /* 线 id → 缩进 px */
    const TREE_TS = 1;               /* 横向不缩放：缩进之后轨道变窄，刻度与名字自己会变少/压窄，不靠 transform */
    function layoutTreeIndent() {
      const main = mainLine();
      const sideLines = orderedSideLines();
      const indent = new Map();      /* 线 id → 缩进 px */
      const off = new Map();         /* 父线 id → 它下面已经排到哪一段 */
      const STEP = 26, GAP = 8;
      if (main) indent.set(main.id, 0);
      /* orderedSideLines() 是 DFS 序：父线一定排在子线前面，所以这里按顺序累加就行 */
      sideLines.forEach(l => {
        const p = mergeTarget(l) || main;
        const pid = p ? p.id : null;
        const pi = pid != null && indent.has(pid) ? indent.get(pid) : 0;
        const slot = (pid != null && off.get(pid)) || 0;
        indent.set(l.id, pi + STEP + slot);
        if (pid != null) off.set(pid, slot + GAP);
      });
      indent.forEach((v, k) => indent.set(k, Math.round(v) + GAP));
      indentCache = indent;
      document.querySelectorAll('.pl-canvas .pl-lane').forEach(el => {
        const idv = el.getAttribute('data-line');
        el.style.paddingLeft = (indent.get(idv) || 0) + 'px';
      });
      document.querySelectorAll('.pl-canvas .pl-track').forEach(el => {
        el.style.setProperty('--ts', String(TREE_TS));
      });
      /* 行太窄（暗线多、缩进深）就把端点徽标收进 title，别把名牌挤成省略号 */
      const canvas = document.querySelector('.pl-canvas');
      const board = document.querySelector('.pl-board');
      if (canvas && board) board.classList.toggle('showep', canvas.clientWidth >= 980);
    }

    /* ================= 树状树枝 =================
     * 整套图是一棵树：主线是根，每条暗线是父线上的一个分叉。
     *
     *   · 引出点 A、收敛点 B **都画在父线（主线或上层暗线）的轴上**，位置是引出时间 / 收敛时间；
     *   · 从 A 弯一条枝下来，落到这条暗线的第一个情节；最后一个情节再弯一条枝上去接 B；
     *   · 暗线自己那一行**只有一小段横线**，正好在「第一个情节 … 最后一个情节」之间，
     *     横线两端之外什么都不画 —— 所以除了引出点、收敛点之间的那一段，暗线行上没有直线，
     *     也没有原来那种横贯整行的长横杆；
     *   · 还没有情节的暗线：整行不画线，只在名牌上标出「引出点 → 收敛点」。
     *
     * 坐标全在 .pl-canvas 里按「该行轨道现在实际用的刻度宽度」量：圆点、刻度、情节节点
     * 用的是同一套 pctK，所以三者永远对齐。 */
    function layoutBranches(svg, rows, main, sideLines, meas) {
      const canvas = svg && svg.parentNode;
      if (!canvas || !rows.length) return;
      /* 画布尺寸：用「内容尺寸」而不是可视尺寸，滚动时树杈不会被裁掉 */
      const W = canvas.clientWidth || canvas.getBoundingClientRect().width;
      const H = canvas.scrollHeight || canvas.clientHeight || canvas.getBoundingClientRect().height;
      if (!W || !H) return;
      svg.setAttribute('width', String(W));
      svg.setAttribute('height', String(H));
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.style.height = H + 'px';
      clear(svg);
      const byId = new Map(rows.map(r => [r.line.id, r]));
      const vp = l => {
        const r = byId.get(l.id);
        const m = r && meas.get(l.id);
        return r && m ? m.viewport(canvas) : null;
      };
      /* 轨道内容区里的百分比 → 画布坐标（轨道左边 + 内容宽 × 百分比） */
      const Xp = (g, pct) => g.left + (pct / 100) * g.used;

      sideLines.forEach(l => {
        const row = byId.get(l.id);
        const parent = (mergeTarget(l) || main);
        const g = vp(parent), s = vp(l);
        const m = meas.get(l.id);
        if (!row || !g || !s || !m || !m.blocks.length) {
          /* 没有情节的暗线：整行不画横线（也不画枝） */
          if (row && row.axis) row.axis.style.display = 'none';
          return;
        }
        /* 这条暗线自己的内容段（第一个情节 → 最后一个情节），再夹进 [引出点, 收敛点]，
         * 保证这段横线绝不长到两端之外。 */
        const fTp = clipTp(forkTpOf(l)), mTp = clipTp(mergeTpOf(l));
        const loTp = clipTp(m.blocks[0].tp), hiTp = clipTp(m.blocks[m.blocks.length - 1].tp);
        const lo = Math.min(Math.max(loTp, Math.min(fTp, mTp)), Math.max(fTp, mTp));
        const hi = Math.max(Math.min(hiTp, Math.max(fTp, mTp)), lo);
        const pLo = pctK(lo), pHi = pctK(hi);
        /* 暗线自己的那一段横线：只画在 lo…hi 之间 */
        if (row.axis) {
          row.axis.style.display = 'block';
          row.axis.style.left = pLo + '%';
          row.axis.style.right = (100 - pHi) + '%';
        }
        const ax = Xp(g, pctK(fTp));       /* A：父线上的引出点 */
        const bx = Xp(g, pctK(mTp));       /* B：父线上的收敛点 */
        const lx = Xp(s, pLo), rx = Xp(s, pHi);
        /* ① 引出：A → 暗线第一个情节 */
        addBranch(svg, ax, g.y, lx, s.y, 'fork', 1.6);
        /* ② 收敛：暗线最后一个情节 → B */
        addBranch(svg, rx, s.y, bx, g.y, 'merge', 1.6);
        /* 端点手柄：A、B 都在父线轴上，可以拖着改引出/收敛时间 */
        addDot(svg, ax, g.y, 'fork', l.id, 'fork');
        addDot(svg, bx, g.y, 'merge', l.id, 'merge');
      });
      if (!svg.__epWired) { svg.__epWired = true; wireEndpointDots(svg); }
    }

    /* 树状枝：从 (x0,y0) 弯到 (x1,y1)，像树杈一样先顺着长出去、再拐向目标。
     * ★ 一律画成曲线，绝不出现直线（不出现 L/H/V，也不用「零长控制点」那种假曲线）：
     *   - 两端横向错开够大 → 标准三次贝塞尔，两头各自水平伸出、中间平滑过渡；
     *   - 两端几乎同列（引出点和第一个情节同刻）→ 一朵向外鼓的树杈弧（两段 C/S 拼成）。 */
    function addBranch(svg, x0, y0, x1, y1, cls, tw) {
      const NS = 'http://www.w3.org/2000/svg';
      const path = document.createElementNS(NS, 'path');
      const dy = y1 - y0, dx = x1 - x0;
      const h = Math.abs(dy) || 24;
      let d;
      if (Math.abs(dx) < 14) {
        /* 近垂直：一朵向外鼓的树杈弧（两段三次曲线） */
        const bow = Math.max(20, h * 0.55);
        const y1q = y0 + dy * 0.58;
        d = 'M ' + x0 + ' ' + y0 +
            ' C ' + (x0 + bow) + ' ' + (y0 + dy * 0.08) + ', ' + (x0 + bow) + ' ' + y1q + ', ' +
            (x0 + bow * 0.55) + ' ' + y1q +
            ' S ' + (x1 + bow * 0.55) + ' ' + (y1 - dy * 0.08) + ', ' + x1 + ' ' + y1;
      } else {
        /* 树杈式：贴着「树干」那一头离得陡、落到「枝头」那一头放平，
         * 看起来是从主干上长出去的一根枝，而不是一条斜直线。
         * dy>0 = 从父线往下长到暗线；dy<0 = 从暗线往上收进父线。 */
        const dxa = Math.abs(dx), sgn = dx >= 0 ? 1 : -1;
        const steep = Math.min(dxa * 0.30, 40);
        const flat = Math.max(dxa * 0.35, 18);
        let c1x, c1y, c2x, c2y;
        if (dy > 0) {
          c1x = x0 + sgn * steep; c1y = y0 + dy * 0.55;
          c2x = x1 - sgn * flat; c2y = y1;
        } else {
          c1x = x0 + sgn * flat; c1y = y0;
          c2x = x1 - sgn * steep; c2y = y1 - dy * 0.55;
        }
        d = 'M ' + x0 + ' ' + y0 + ' C ' + c1x + ' ' + c1y + ',' + c2x + ' ' + c2y + ',' + x1 + ' ' + y1;
      }
      path.setAttribute('d', d);
      path.setAttribute('class', 'pl-br ' + cls);
      if (tw) path.setAttribute('stroke-width', String(tw));
      svg.appendChild(path);
      return path;
    }
    function addDot(svg, x, y, cls, lineId, kind) {
      const NS = 'http://www.w3.org/2000/svg';
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', String(x)); c.setAttribute('cy', String(y));
      /* 行首接枝点画小一号，免得和旁边情节的圆点混淆 */
      c.setAttribute('r', cls === 'join' ? '4.4' : '5.6');
      c.setAttribute('class', 'pl-brdot ' + cls);
      /* 端点手柄：告诉拖动逻辑「这是哪条线的哪一端」。
       * 行首接枝点不给 data-line：它跟着暗线的起点走，不是可拖的端点。 */
      if (lineId && cls !== 'join') { c.setAttribute('data-line', lineId); c.setAttribute('data-end', kind); }
      svg.appendChild(c);
      return c;
    }
    /* 拖端点时浮在轴上方的小气泡：「引出点 6.8」 */
    function showEpHint(track, pct, text) {
      if (!epHint) epHint = h('div', { class: 'pl-ephint' });
      epHint.textContent = text;
      epHint.style.left = pct + '%';
      if (epHint.parentNode !== track) track.appendChild(epHint);
    }
    function hideEpHint() { if (epHint && epHint.parentNode) epHint.remove(); }
    let epHint = null;

    /* 端点手柄的交互挂载点：drawBranches 画完把「手柄 → 归属信息」放进 svg.__eps，
     * 由 renderTimeline 统一的 pointer 监听来拖。 */
    function wireEndpointDots(svg) {
      svg.addEventListener('pointerdown', ev => {
        const dot = ev.target && ev.target.closest ? ev.target.closest('.pl-brdot[data-line]') : null;
        if (!dot || ev.button !== 0) return;
        ev.preventDefault();
        ev.stopPropagation();
        startEndpointDrag(ev, dot.getAttribute('data-line'), dot.getAttribute('data-end'));
      });
      svg.addEventListener('mousemove', ev => {
        if (epDrag) return;
        const dot = ev.target && ev.target.closest ? ev.target.closest('.pl-brdot[data-line]') : null;
        const info = dot ? epInfoOf(dot.getAttribute('data-line')) : null;
        if (dot && info) {
          dot.setAttribute('r', '7');
          svg.title = '';
        } else if (!dot) {
          svg.querySelectorAll('.pl-brdot[data-line]').forEach(c => c.setAttribute('r', '5.6'));
        }
      });
      svg.addEventListener('mouseleave', () => {
        if (epDrag) return;
        svg.querySelectorAll('.pl-brdot[data-line]').forEach(c => c.setAttribute('r', '5.6'));
      });
      /* 双击端点 = 改回「跟情节走」（清掉手填的端点） */
      svg.addEventListener('dblclick', ev => {
        const dot = ev.target && ev.target.closest ? ev.target.closest('.pl-brdot[data-line]') : null;
        if (!dot) return;
        ev.preventDefault(); ev.stopPropagation();
        resetEndpoint(dot.getAttribute('data-line'), dot.getAttribute('data-end'));
      });
    }
    const epInfoOf = id => { const l = lineById(id); return l && l.kind !== 'main' ? l : null; };

    /* 把某一端改回「自动」：引出点跟暗线第一个情节，收敛点跟最后一个 */
    function resetEndpoint(lineId, kind) {
      const l = epInfoOf(lineId);
      if (!l) return;
      if (kind === 'fork') { delete l.forkTp; l.forkChapter = ''; }
      else { delete l.mergeTp; l.mergeChapter = ''; }
      touch();
      renderAll();
      toast('「' + (l.title || '暗线') + '」的' + (kind === 'fork' ? '引出点' : '收敛点') + '已改回跟随情节', 'ok');
    }

    /* 拖动端点手柄：只改这一条暗线的这一端，父线刻度当尺子。
     * 松手才落库（touch），拖的过程中只重画树枝和提示，情节节点一个都不动。 */
    /* 拖端点手柄（A = 引出点、B = 收敛点，两个都画在父线轴上，都能拖）：
     * 只改这一条暗线的这一端，松手才落库（touch），拖的过程中只重画提示。 */
    function startEndpointDrag(ev, lineId, kind) {
      const l = epInfoOf(lineId);
      if (!l) return;
      const parent = mergeTarget(l) || mainLine();
      const row = document.querySelector('.pl-lane[data-line="' + parent.id + '"] .pl-track');
      const svg = document.querySelector('.pl-branches');
      if (!row || !svg) return;
      const rect = row.getBoundingClientRect();
      const vs = viewSpan();
      const ccw = trackContent(row).cw || rect.width || 1;
      const pctOfX = x => Math.max(0, Math.min(100, ((x - rect.left) / ccw) * 100));
      const tpAt = clientX => round2(pctTp(pctOfX(clientX)));
      const label = kind === 'fork' ? '引出点' : '收敛点';
      epDrag = { l, kind, svg };
      svg.classList.add('epdrag');
      let moved = false;
      let lastX = Number(ev.clientX) || rect.left + ccw / 2;
      let value = kind === 'fork' ? forkTpOf(l) : mergeTpOf(l);
      const paint = x => {
        const pct = pctOfX(x);
        value = tpAt(x);
        showEpHint(row, pct, label + ' ' + fmtTp(value));
      };
      paint(lastX);
      const move = e => {
        if (!epDrag) return;
        const x = Number(e.clientX) || lastX;
        if (Math.abs(x - lastX) > 2) moved = true;
        lastX = x;
        paint(x);
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        hideEpHint();
        if (svg) svg.classList.remove('epdrag');
        epDrag = null;
        if (!moved) {
          /* 没挪动：当成「单击」→ 打开这条暗线的端点设置，省得去轨道右边找按钮 */
          renderTimeline();
          editLane(l);
          return;
        }
        /* 引出点不能晚于收敛点：卡住，不许拖过头 */
        const other = kind === 'fork' ? (hasMerge(l) ? Number(l.mergeTp) : null) : forkTpOf(l);
        if (other != null && kind === 'fork' && value > other) {
          value = other;
          toast('引出点不能晚于收敛点（' + fmtTp(other) + '），已停在收敛点', 'err');
        }
        if (other != null && kind === 'merge' && value < other) {
          value = other;
          toast('收敛点不能早于引出点（' + fmtTp(other) + '），已停在引出点', 'err');
        }
        if (kind === 'fork') l.forkTp = value; else l.mergeTp = value;
        touch();
        renderAll();
        toast('「' + (l.title || '暗线') + '」' + label + '拖到 ' + fmtTp(value), 'ok');
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    }

    /* 一条线 = 一行：左边名牌，右边带刻度的轨道。
     * 暗线按嵌套层级往右缩进，一眼看得出它是从哪条线分出去的。 */
    function laneRow(l, isMain) {
      const mine = lanePlots(l.id);
      const max = laneMax(l.id);
      const depth = isMain ? 0 : depthIn(l.id);
      const parent = isMain ? null : (mergeTarget(l) || mainLine());
      const row = h('div', {
        class: 'pl-lane' + (isMain ? ' main' : ' side') + (st.lane === l.id ? ' on' : ''),
        'data-line': l.id
      });

      const tag = h('div', {
        class: 'pl-lanetag' + (depth ? ' nested' : ''),
        /* 层级缩进交给 layoutTreeIndent() 给整行加 padding-left；名牌本身保持同一宽度 */
        style: {},
        onclick: () => { st.lane = l.id; renderTimeline(); },
        title: isMain ? '主线' : (depth
          ? '第 ' + (depth + 1) + ' 层暗线 · 引出点 ' + fmtTp(forkTpOf(l)) + ' → 收敛点 ' + fmtTp(mergeTpOf(l)) +
            '（画在「' + ((parent || {}).title || '主线') + '」上）；点一下把它设为当前编辑的线'
          : '暗线 · 引出点 ' + fmtTp(forkTpOf(l)) + ' → 收敛点 ' + fmtTp(mergeTpOf(l)) + '；点一下把它设为当前编辑的线')
      },
        depth ? h('span', { class: 'pl-laneelbow', title: '第 ' + (depth + 1) + ' 层（从上面那条线分出来）' }, '↳') : null,
        h('span', { class: 'pl-lanedot' }),
        h('span', { class: 'pl-lanename' }, l.title || (isMain ? '主线' : '暗线')),
        isMain ? null : h('span', { class: 'pl-lanecnt' }, mine.length ? mine.length + ' 节' : '空'),
        !isMain ? h('span', { class: 'pl-merge' + (hasMerge(l) ? '' : ' pend'),
          title: '引出点 ' + fmtTp(forkTpOf(l)) + ' → 收敛点 ' + fmtTp(mergeTpOf(l)) +
            (parent ? '（画在「' + (parent.title || '主线') + '」上）' : '') },
          fmtTp(forkTpOf(l)) + '→' + (hasMerge(l) ? fmtTp(mergeTpOf(l)) : '?')) : null);
      row.appendChild(tag);

      const track = h('div', { class: 'pl-track', 'data-lane': l.id });
      /* 轨道底部留白：最下面那条暗线的树杈要有地方长出去 */
      track.style.paddingBottom = '12px';
      /* 轴线：主线是贯穿整行的「树干」；暗线只画内容段（见 layoutBranches 里的 left/right），
       * 默认隐藏，量到内容之后才显示 —— 免得空暗线也拖一条横贯整行的长线。 */
      const axis = h('div', { class: 'pl-axis' + (isMain ? '' : ' side') });
      track.appendChild(axis);

      /* 刻度：先按默认密度画好，等行宽量出来之后再按可见宽度重排（relabel） */
      const tickEls = h('span', { style: { display: 'contents' } });
      track.appendChild(tickEls);
      /* 视口比全轴窄时，在两端标一下「左边还有 / 右边还有」 */
      const vw = viewSpan();
      const cutLo = vw.a > 0.001, cutHi = vw.b < axisMax() - 0.001;
      if (cutLo) track.appendChild(h('span', { class: 'pl-cut lo', title: '左边还有情节（往左拖或缩小）' }, '‹'));
      if (cutHi) track.appendChild(h('span', { class: 'pl-cut hi', title: '右边还有情节（往右拖或缩小）' }, '›'));

      const { spots, items } = laneSpots(l.id);
      const nodeEls = [];
      /* 节点先挂到轨道上，才能量名字多宽（下面当「一格」的宽度用） */
      items.forEach((p, i) => {
        const visible = inView(p);
        const node = h('div', {
          class: 'pl-node ' + nodeCls(p) + (p.id === st.selId ? ' on' : '') + (visible ? '' : ' out'),
          style: { left: spots[i] + '%' },
          title: p.title + ' · 时间点 ' + fmtTp(tpNum(p)) + '（拖我改时间点）',
          onclick: () => { if (!drag || !drag.moved) select(p.id); },
          onmouseenter: () => { if (!drag && visible) showTip(p, node); },
          onmouseleave: hideTip,
          onmousedown: ev => { if (visible) startDrag(ev, p, items, node); }
        }, h('b', {}, p.title), h('s', {}, p.chapter || ''), h('i', {}));
        track.appendChild(node);
        nodeEls.push(node);
      });
      /* 名字宽度：量一次节点里的 <b>（节点自身宽高是 0，量不出东西） */
      const W0 = trackContent(track).cw || 500;
      const mItems = items.map((p, i) => {
        const b = nodeEls[i].querySelector('b');
        const w = b ? b.offsetWidth : 0;
        return { u: pctK(tpNum(p)) / 100, w: w || 30, tp: tpNum(p) };
      });
      /* 别让名字把整条轴顶得歪七扭八：错开量最多是「可用宽度的 6%」，
       * 剩下的交给「相邻太近就换行显示」（sync 里按真实宽度折叠） */
      const kCap = 0.06;
      mItems.forEach(it => { it.k = Math.min(it.k, kCap); });

      /* 刻度密度跟着「这一行实际能画多宽」走：缩进把轨道压窄了也不会叠成一团 */
      function relabel(stepPx) {
        clear(tickEls);
        const W = trackContent(track).cw || track.clientWidth || 500;
        const { ticks } = laneTicks(l.id, Math.max(3, Math.min(24, Math.round(W / Math.max(34, stepPx)))));
        /* 标签太密就隔几个标一次（预算：每个标签至少占 30px） */
        const labelStep = Math.max(1, Math.ceil((ticks.length * 30) / Math.max(60, W)));
        ticks.forEach((t, i) => {
          const left = pctK(t) + '%';
          tickEls.appendChild(h('span', { class: 'pl-tick', style: { left } }));
          if (i % labelStep === 0 || i === ticks.length - 1) {
            tickEls.appendChild(h('span', { class: 'pl-tick tp-label', style: { left } }, fmtTp(t)));
          }
        });
        /* 端点徽标太挤（按名牌长度 + 端点文字估）就收起来，只剩 title */
        const epW = isMain ? 0 : 58 + String(fmtTp(forkTpOf(l))).length * 4 + String(fmtTp(mergeTpOf(l))).length * 4;
        const board = document.querySelector('.pl-board');
        if (board) board.classList.toggle('showep', W > epW + 150);
      }
      relabel(56);

      if (!items.length) {
        track.appendChild(h('span', { class: 'pl-laneempty' }, isMain ? '双击空白处新建第一个情节' : '双击这条暗线可以往里加情节'));
      } else if (!items.some(inView)) {
        /* 这条线在当前视口里一个情节都没有：给句提示，别让人以为数据丢了 */
        track.appendChild(h('span', { class: 'pl-laneempty' }, '这一屏没有情节（点「全部」或缩小看看）'));
      }

      /* 客户端坐标 → 这一行的时间点：按「轨道内容区」换算（和画刻度用的是同一个公式） */
      const pctOf = ev => {
        const r = track.getBoundingClientRect();
        const cw = trackContent(track).cw || r.width || 1;
        return Math.max(0, Math.min(100, ((ev.clientX - r.left) / cw) * 100));
      };
      track.addEventListener('click', ev => {
        if (ev.target.closest('.pl-node')) return;
        if (track.classList.contains('picking')) return;   /* 正在轴上取点 */
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
        !isMain ? h('button', {
          class: 'btn xs', title: '改名字、引出点、收敛点', onclick: e => { e.stopPropagation(); editLane(l); }
        }, '引出/收敛') : null,
        !isMain ? h('button', {
          class: 'btn xs', title: '删除这条暗线（里面的情节会移到主线）'
          , onclick: e => { e.stopPropagation(); removeLane(l); }
        }, '删除') : null));

      return { el: row, track, axis, line: l, items, nodeEls, mItems, relabel };
    }

    /* 重画树枝。布局量过之后节点已经摆好；但窗口一变、暗线一增删、行宽就会变，
     * 所以用 ResizeObserver 看着画布和每一行的轨道，变了就重新量、重新画一遍（节流）。 */
    let rebranchJob = null;
    function scheduleRebranch(svg, rows, main, sideLines) {
      const canvas = svg && svg.parentNode;
      if (!canvas) return;
      const again = () => {
        if (rebranchJob) return;
        rebranchJob = true;
        requestAnimationFrame(() => {
          rebranchJob = false;
          if (!svg.isConnected || !canvas.isConnected) return;
          layoutTreeIndent();
          rows.forEach(r => { r.relabel(Math.max(22, Math.min(90, trackContent(r.track).cw * 0.05))); });
          const meas = new Map();
          rows.forEach(r => {
            const m = measureLane(r.track, r.mItems, r.nodeEls, r.line.id);
            if (m) { m.sync(); meas.set(r.line.id, m); }
          });
          layoutBranches(svg, rows, main, sideLines, meas);
        });
      };
      if (typeof ResizeObserver === 'undefined') return;
      const ro = new ResizeObserver(again);
      ro.observe(canvas);
      rows.forEach(r => ro.observe(r.track));
      svg.__ro = ro;
      again();
    }

    let trackEl = null;
    let drag = null;
    let ghostAt = null;
    let epDrag = null;       /* 正在拖的端点手柄 { l, kind, svg } */

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
      /* 可画的宽度是「轨道内容区」；缩进已经在行上，track 自身的左边缘就是内容起点 */
      const cw = trackContent(track).cw || rect.width || 1;
      const pctAtClient = cx => Math.max(0, Math.min(100, ((cx - rect.left) / cw) * 100));
      /* 拖动期间视口锁死（否则时间点一变，整条轴重新缩放，节点就漂了） */
      const max = laneMax(laneOf(p));
      const vs = viewSpan();
      const vA = vs.a, vB = vs.b;
      const tpAtPct = pct => {
        const t = Math.max(SPAN_LO, Math.min(SPAN_HI, pct));
        return round2(vA + ((t - SPAN_LO) / (SPAN_HI - SPAN_LO)) * (vB - vA));
      };
      /* 用 mousedown 那一刻的鼠标位置算起点（合成事件常常不带 clientX，movementX 兜底） */
      const startX = Number(ev.clientX) || rect.left + cw / 2;
      const restX = [];      /* 其它节点原来停在哪儿，松手后原样还回去 */
      const startY = Number(ev.clientY) || rect.top + rect.height / 2;
      drag = { p, moved: false };
      const myEl = nodeEl;
      const myLeft0 = myEl ? myEl.style.left : '';
      track.classList.add('dragging');
      if (myEl) myEl.classList.add('dragging');
      /* 拖动期间把这条线的其它节点淡一点，突出正在拖的 */
      Array.from(track.querySelectorAll('.pl-node')).forEach(el => {
        if (el === myEl) return;
        el.classList.add('dim');
        restX.push({ el, left: el.style.left });
      });

      let lastX = startX;
      const move = e => {
        if (!drag) return;
        const x = Number(e.clientX) || (lastX + (Number(e.movementX) || 0));
        lastX = x;
        if (Math.abs(x - startX) > 2) drag.moved = true;
        const pct = pctAtClient(x);
        drag.pct = pct;
        drag.tp = tpAtPct(pct);
        /* 节点就是跟着鼠标走，不吸附、不回弹（left 按轨道内容区的 px 算） */
        if (myEl) myEl.style.left = ((pct / 100) * cw) + 'px';
        /* 别的节点一动不动（取点提示浮层会插进轨道里，别让它把布局挤歪） */
        restX.forEach(o => { o.el.style.left = o.left; });
      };
      const up = e => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
        track.classList.remove('dragging');
        if (myEl) myEl.classList.remove('dragging');
        Array.from(track.querySelectorAll('.pl-node')).forEach(el => el.classList.remove('dim'));
        const d = drag; drag = null;
        if (!d || !d.moved || d.pct == null) { if (myEl) myEl.style.left = myLeft0; renderTimeline(); return; }
        /* 定格：落点就是终点，绝不回弹。时间点按落点刻度算出来写进去。 */
        p.timePoint = Math.max(0, round2(d.tp));
        touch();
        renderAll();
        select(p.id);
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
      const filterSel = h('select', { class: 'pl-lanefilter', id: 'plot-lane-filter', 'data-probe': 'plot-lane-filter' });
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

    /* ---------- 暗线两端的端点 ---------- */
    /* 有收敛点就算「能并回主线」；引出点缺省用暗线第一个情节的位置 */
    const hasMerge = l => l && l.mergeTp != null && l.mergeTp !== '';
    const forkTpOf = l => {
      if (l && l.forkTp != null && l.forkTp !== '') return Number(l.forkTp);
      const arr = l ? lanePlots(l.id) : [];
      return arr.length ? tpNum(arr[0]) : 0;
    };
    const mergeTpOf = l => {
      if (hasMerge(l)) return Number(l.mergeTp);
      const arr = l ? lanePlots(l.id) : [];
      return arr.length ? tpNum(arr[arr.length - 1]) : forkTpOf(l);
    };

    /* ================= 暗线（从主线引出 → 收敛回主线） =================
     * 一条暗线有两个端点，都落在主线上：
     *   forkTp / forkChapter —— 引出点：暗线从主线的这个时间点分出去（树状分叉）
     *   mergeTp / mergeChapter —— 收敛点：暗线的结果在这个时间点并回主线（树状合并）
     * 两端都可以手填时间点、选章节，也可以直接点「在时间轴上点」，然后在主线上点一下取点。 */

    /* 章节下拉：选项来自「章节写作」里的稿件 */
    function chapterSelect(value) {
      const sel = h('select', { class: 'select' });
      sel.appendChild(h('option', { value: '' }, '（不指定章节）'));
      (doc.manuscripts || []).forEach(m => {
        sel.appendChild(h('option', { value: m.title, selected: value === m.title }, msLabel(m)));
      });
      if (value && !(doc.manuscripts || []).some(m => m.title === value)) {
        sel.appendChild(h('option', { value, selected: true }, value + '（原有）'));
      }
      sel.value = value || '';
      return sel;
    }

    /* 在主线轴上点一下取时间点：打开一个覆盖层，点哪儿就把 tp 写到回调里 */
    function pickOnMain(cb) {
      const mainLane = mainLine();
      const track = trackEl || document.querySelector('.pl-track');
      if (!track) { toast('找不到主线轨道', 'err'); return; }
      const max = laneMax(mainLane.id);
      /* 钉在卡片顶部，点一下就知道要干嘛 */
      const banner = h('div', { class: 'pl-pickhint' }, '在主线上点一下取它的时间点（Esc 取消）');
      const card = document.querySelector('.pl-card') || document.body;
      card.insertBefore(banner, card.firstChild);
      track.classList.add('picking');
      let done = false;
      const finish = ok => {
        if (done) return;
        done = true;
        track.classList.remove('picking');
        if (banner.parentNode) banner.remove();
        track.removeEventListener('mousedown', onDown, true);
        track.removeEventListener('click', onClick, true);
        window.removeEventListener('keydown', onEsc, true);
        if (!ok) toast('已取消取点', 'err');
      };
      const tpAt = ev => {
        const r = track.getBoundingClientRect();
        const pct = Math.max(0, Math.min(100, ((ev.clientX - r.left) / (r.width || 1)) * 100));
        return round2(pctTp(pct, max));
      };
      /* mousedown 就吃掉，免得落到情节节点上开始拖拽 */
      const onDown = ev => { ev.preventDefault(); ev.stopPropagation(); };
      const onClick = ev => {
        ev.preventDefault(); ev.stopPropagation();
        const tp = tpAt(ev);
        finish(true);           /* 先拆监听，再回填，避免触发行上的单击幽灵 */
        cb(tp);
      };
      const onEsc = ev => { if (ev.key === 'Escape') { ev.stopPropagation(); ev.preventDefault(); finish(false); } };
      track.addEventListener('mousedown', onDown, true);
      track.addEventListener('click', onClick, true);
      window.addEventListener('keydown', onEsc, true);
    }

/* 一个「时间点 + 章节 + 在轴上取点」的小组合控件 */
    function endpointField(label, tpValue, chValue, tip) {
      const tpIn = h('input', { class: 'input', type: 'number', min: '0', step: '1', value: String(fmtTp(tpValue)) });
      const chSel = chapterSelect(chValue);
      const pickBtn = h('button', {
        class: 'btn xs', type: 'button', title: tip || '在主线上点一下取时间点'
      }, '轴上取点');
      const wrap = h('div', { class: 'pl-ep' },
        h('label', {}, label),
        h('div', { class: 'pl-eprow' },
          h('span', { class: 'pl-eplab' }, '时间点'), tpIn, pickBtn),
        h('div', { class: 'pl-eprow' },
          h('span', { class: 'pl-eplab' }, '章节'), chSel));
      pickBtn.addEventListener('click', () => pickOnMain(tp => {
        tpIn.value = String(fmtTp(tp));
        toast((tip || '时间点') + '取为 ' + fmtTp(tp), 'ok');
      }));
      return { wrap, tpIn, chSel };
    }

    /* 新建暗线：名字 + 引出点 + 收敛点 */
    function addLane() {
      const nameIn = h('input', { class: 'input', placeholder: '例如：云无咎的身世' });
      const mainId = (mainLine() || {}).id;
      const mainMax = laneMax(mainId);
      const fork = endpointField('引出点（暗线从这里分出去）', 0, '', '引出点');
      const merge = endpointField('收敛点（暗线在这里并回主线）', mainMax, '', '收敛点');
      modal({
        title: '开一条暗线', width: '620px',
        body: h('div', { class: 'col', style: { gap: '12px' } },
          h('div', { class: 'field' }, h('label', {}, '暗线名'), nameIn),
          h('div', { class: 'row', style: { gap: '12px', alignItems: 'flex-start' } }, fork.wrap, merge.wrap),
          h('div', { class: 'tiny muted' },
            '引出点是这条暗线在主线上「分叉出去」的位置，收敛点是它「并回主线」的位置，两处都会画成树状枝。' +
            '可以在时间轴上点，也可以直接填时间点、选章节。')),
        okText: '创建',
        onOk: () => {
          const t = (nameIn.value || '').trim();
          if (!t) { toast('请填写暗线名', 'err'); return false; }
          const fTp = Number(fork.tpIn.value), mTp = Number(merge.tpIn.value);
          if (isFinite(fTp) && isFinite(mTp) && fTp > mTp) { toast('引出点不能晚于收敛点', 'err'); return false; }
          const l = {
            id: uid('ln'), title: t, kind: 'side', note: '', mergeInto: '',
            forkTp: isFinite(fTp) ? round2(Math.max(0, fTp)) : 0, forkChapter: fork.chSel.value || '',
            mergeTp: isFinite(mTp) ? round2(Math.max(0, mTp)) : mainMax, mergeChapter: merge.chSel.value || ''
          };
          doc.plotLines.push(l);
          st.lane = l.id;
          touch();
          renderAll();
          toast('已开暗线「' + t + '」，双击这条暗线可以往里加情节', 'ok');
        }
      });
      setTimeout(() => nameIn.focus(), 40);
    }

    /* 修改暗线的名字、引出点、收敛点 */
    function editLane(l) {
      if (!l) return;
      const mainId = (mainLine() || {}).id;
      const nameIn = h('input', { class: 'input', value: l.title || '' });
      const noteIn = h('textarea', { class: 'ta', style: { minHeight: '56px' } }, l.note || '');
      const fork = endpointField('引出点（从主线分出去）', l.forkTp != null ? l.forkTp : 0, l.forkChapter || '');
      const merge = endpointField('收敛点（并回主线）', l.mergeTp != null ? l.mergeTp : laneMax(mainId), l.mergeChapter || '');
      /* 收敛到哪条线（默认主线；也可以并到另一条暗线 → 暗线可以嵌套）。
       * 不能选自己和自己的子孙，否则会形成环。 */
      const intoSel = h('select', { class: 'select', id: 'pl-into-sel' });
      intoSel.appendChild(h('option', { value: '' }, '主线'));
      const blocked = new Set([l.id]);
      lines().filter(x => x.kind !== 'main').forEach(x => { if (isAncestor(l.id, x.id)) blocked.add(x.id); });
      lines().filter(x => x.kind !== 'main' && !blocked.has(x.id)).forEach(x => {
        const d = depthOf(x);
        intoSel.appendChild(h('option', { value: x.id, selected: l.mergeInto === x.id },
          (d ? '└ 第 ' + (d + 1) + ' 层 · ' : '') + (x.title || '未命名')));
      });
      intoSel.value = l.mergeInto || '';
      modal({
        title: '暗线设置 · ' + (l.title || '未命名'), width: '620px',
        body: h('div', { class: 'col', style: { gap: '12px' } },
          h('div', { class: 'field' }, h('label', {}, '暗线名'), nameIn),
          h('div', { class: 'row', style: { gap: '12px', alignItems: 'flex-start' } }, fork.wrap, merge.wrap),
          h('div', { class: 'row', style: { gap: '12px', alignItems: 'flex-start' } },
            h('div', { class: 'field', style: { flex: '1' } }, h('label', {}, '收敛回哪条线'), intoSel),
            h('div', { class: 'field', style: { flex: '2' } }, h('label', {}, '备注'), noteIn))),
        okText: '保存',
        onOk: () => {
          const t = (nameIn.value || '').trim();
          if (!t) { toast('请填写暗线名', 'err'); return false; }
          l.title = t;
          l.note = noteIn.value.trim();
          l.mergeInto = intoSel.value || '';
          const fTp = Number(fork.tpIn.value), mTp = Number(merge.tpIn.value);
          if (isFinite(fTp) && isFinite(mTp) && fTp > mTp) { toast('引出点不能晚于收敛点', 'err'); return false; }
          if (isFinite(fTp)) l.forkTp = round2(Math.max(0, fTp));
          if (isFinite(mTp)) l.mergeTp = round2(Math.max(0, mTp));
          l.forkChapter = fork.chSel.value || '';
          l.mergeChapter = merge.chSel.value || '';
          touch(); renderAll();
          toast('暗线已更新', 'ok');
        }
      });
      setTimeout(() => nameIn.focus(), 40);
    }

    function removeLane(l) {
      if (!l || l.kind === 'main') return;
      const mine = lanePlots(l.id);
      const parent = mergeTarget(l) || mainLine();
      const childCount = lines().filter(x => x.mergeInto === l.id).length;
      modal({
        title: '删除暗线「' + l.title + '」', width: '480px',
        body: h('div', { class: 'col' },
          h('p', { class: 'small sub', style: { margin: 0, lineHeight: '1.85' } },
            '这条暗线上有 ' + mine.length + ' 个情节，删除后它们会移到「' + ((parent || {}).title || '主线') + '」，不会丢。' +
            (childCount ? '它下面还挂着 ' + childCount + ' 条暗线，会自动往上挂一层。' : ''))),
        okText: '删除',
        onOk: () => {
          const mainId = (mainLine() || {}).id;
          const parentId = (parent && lineById(parent.id) ? parent.id : mainId);
          mine.forEach(p => { p.lane = parentId === mainId ? '' : parentId; });
          /* 它的子线改挂到它的父线上，别变成孤儿 */
          lines().forEach(x => { if (x.mergeInto === l.id) x.mergeInto = l.mergeInto || ''; });
          doc.plotLines = doc.plotLines.filter(x => x.id !== l.id);
          if (st.lane === l.id) st.lane = parentId;
          touch(); renderAll();
          toast('已删除暗线，情节移到「' + ((parent || {}).title || '主线') + '」', 'ok');
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
      /* 时间点：轴上落点的刻度值，可以手改（不吸附整数，小数点也收） */
      const tpSeed = isNew
        ? (presetTime != null ? presetTime : round2(onLane(laneSeed).reduce((m, q) => Math.max(m, tpNum(q)), 0) + 1))
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
