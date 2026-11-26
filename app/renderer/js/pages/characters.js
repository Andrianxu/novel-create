import { h, clear, toast, modal, injectStyle, uid, debounce, STATUS, words, groupOf, groupList, GROUP_DEFAULT, GROUP_UNFILED } from '../util.js';

injectStyle('characters', `
.cwrap{display:flex;width:100%;min-width:0}
.clist{width:236px;flex:none;background:#F1EADA;border-right:1px solid #DFD4BF;display:flex;flex-direction:column;padding:10px 9px;gap:3px;overflow:auto}
.cllist{flex:1;min-height:0;display:flex;flex-direction:column;gap:2px}
.cgroup{font-size:9.5px;letter-spacing:.12em;color:#8C8272;padding:8px 6px 3px;display:flex;align-items:center;gap:6px}
.cgroup .cg-n{color:#B6A98F;letter-spacing:0}
/* 分类选择器：左边是现成分类的小胶囊（点一下即选），右边可以手填新分类 */
.gsel{display:flex;flex-direction:column;gap:5px}
.gsel .gchips{display:flex;gap:4px;flex-wrap:wrap}
.gsel .gchip{font-size:10.5px;padding:2px 8px;border-radius:999px;background:#F5EEDF;border:1px solid #EAE1CF;color:#5B5348;cursor:pointer;user-select:none;white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis}
.gsel .gchip:hover{background:#FFFDF8;border-color:#CBB894}
.gsel .gchip.on{background:#E2EEEA;border-color:#BFDACF;color:#23604F}
/* 视图切换胶囊：选中那个像盖了个墨印 */
.gsel .btn.on{background:var(--ink);color:var(--paper);border-color:var(--ink);font-weight:700}
/* 列表行右侧的小删除：平时不显眼，鼠标移上去或选中时才亮出来 */
.crow{position:relative}
.crow .crow-del{position:absolute;right:4px;top:50%;transform:translateY(-50%);width:19px;height:19px;border-radius:5px;display:grid;place-items:center;
  font-size:11px;line-height:1;color:#B6A98F;opacity:0;transition:opacity .12s,background .12s,color .12s}
.crow:hover .crow-del,.crow.on .crow-del{opacity:1}
.crow .crow-del:hover{background:#F6E3DF;color:#A8322A}
.crow:hover{padding-right:26px}
/* 删除人物按钮：浅红描边，点开的是带影响清单的确认框 */
.btn.danger{color:#A8322A;border-color:#EBCFC9}
.btn.danger:hover{background:#F6E3DF;border-color:#D9A79F;color:#8E2A23}
/* 删除确认框里的影响清单 */
.del-list{font-size:11.5px;line-height:1.9;color:#5B5348}
.del-list b{color:#201C18;font-weight:400}
.del-list .del-none{color:#8C8272}
.crow{display:flex;align-items:center;gap:8px;padding:6px;border-radius:8px;cursor:pointer}
.crow:hover{background:rgba(255,255,255,.5)}
.crow.on{background:#FFFCF5;box-shadow:inset 0 0 0 1px #DFD4BF}
.crow b{display:block;font-size:12px}
.crow small{font-size:10px;color:#8C8272}
.cmain{flex:1;min-width:0;padding:12px 16px 24px;display:flex;flex-direction:column;gap:10px}
.hero{display:flex;gap:14px}
.pt{width:200px;height:262px;flex:none;border-radius:11px;border:1px solid #C9B491;position:relative;overflow:hidden;background:linear-gradient(150deg,#FFFDF8 0%,#F4E9D4 45%,#E2CEA9 100%)}
.pt img{width:100%;height:100%;object-fit:cover;display:block}
.pt .ph{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}
.pt .gl{font-family:var(--kai);font-size:62px;line-height:1.05;color:#7C291F;text-align:center;letter-spacing:.04em;padding:0 10px}
.pt .ptxt{font-size:9px;letter-spacing:.24em;color:#7C291F}
.pt .tools{position:absolute;left:0;right:0;bottom:0;display:flex;gap:4px;padding:5px;background:rgba(32,28,24,.72);justify-content:center}
.pt .tools .btn{padding:2px 7px;font-size:10px;background:rgba(255,255,255,.92);border-color:transparent}
.info{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.nameline{display:flex;align-items:baseline;gap:10px}
.nameline h1{font-family:var(--kai);font-size:34px;line-height:1.05;margin:0;letter-spacing:.05em}
.fgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;margin-top:4px}
/* 档案标题本身也是输入框：平时看着像小标题，鼠标移上去 / 聚焦才浮出边框。
 * 和世界观卡片的「修为体系」一个手感，改的是作者给这一格起的名字，不改字段名。 */
.field>input.flabel,.endbar>input.flabel{font-family:inherit;font-size:10px;letter-spacing:.08em;color:var(--muted);
  background:transparent;border:1px solid transparent;border-radius:4px;padding:0 3px;margin-left:-3px;
  width:auto;min-width:52px;max-width:150px;height:17px;line-height:15px}
.field>input.flabel::placeholder,.endbar>input.flabel::placeholder{color:#B3A790}
.field>input.flabel:hover,.endbar>input.flabel:hover{background:#FFFCF5;border-color:#EAE1CF;color:#8A6421}
.field>input.flabel:focus,.endbar>input.flabel:focus{background:#FFFDF8;border-color:#C2A97D;outline:none;box-shadow:0 0 0 2px rgba(185,138,60,.12);color:#6A4A16}
.endbar>input.flabel{flex:none;width:70px;min-width:70px;color:#8C8272}
.endbar{font-size:12px;line-height:1.55;background:#F6EEDC;border:1px solid #E2D3B5;border-radius:8px;padding:7px 10px}
.tlcard{padding:10px 14px 4px}
.tlhead{display:flex;align-items:center;gap:10px;font-size:12px}
.tlhead h3{font-size:13px;margin:0}
.legend{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;color:#5B5348}
.legend i{width:7px;height:7px;border-radius:50%;display:inline-block}
.track{position:relative;height:118px;margin-top:6px;user-select:none;-webkit-user-select:none}
.axis{position:absolute;left:0;right:0;top:70px;height:2px;background:linear-gradient(90deg,#2F6F63,#B98A3C 62%,#A8322A);border-radius:2px}
.tick{position:absolute;top:70px;width:11px;height:11px;margin-left:-5.5px;margin-top:-4.5px;border-radius:50%;background:#FFFCF5;border:2px solid #2F6F63;cursor:grab}
.tick.done{background:#2F6F63}
.tick.later{border-style:dashed;border-color:#C9973C;background:#FFFCF5}
.tick.ending{background:#A8322A;border-color:#A8322A;width:13px;height:13px;margin-left:-6.5px;margin-top:-5.5px}
.tick.on{box-shadow:0 0 0 4px rgba(47,111,99,.2)}
.tick b{position:absolute;left:50%;transform:translateX(-50%);top:-19px;font-size:10px;font-weight:400;color:#201C18;white-space:nowrap}
.tick s{position:absolute;left:50%;transform:translateX(-50%);top:12px;font-size:9px;color:#8C8272;text-decoration:none;white-space:nowrap}
/* 拖动中：正在拖的那个放大变亮，别的淡下去（和情节页时间轴一个手感） */
.tick.dragging{cursor:grabbing;z-index:6;box-shadow:0 0 0 5px rgba(47,111,99,.22)}
.track.dragging .tick:not(.dragging){opacity:.5}
/* 拖动时跟着鼠标的小气泡：「时间点 7」 */
.tp-hint{position:absolute;top:99px;transform:translateX(-50%);z-index:7;font-size:10px;line-height:1.5;background:#201C18;color:#F6F1E6;border-radius:5px;padding:1px 7px;white-space:nowrap;pointer-events:none}
/* 相关人物胶囊：选中的高亮（新建情节时默认带上当前这位） */
.chip.on{background:#E2EEEA;border-color:#BFDACF;color:#23604F}
.chip.on i{box-shadow:0 0 0 2px rgba(47,111,99,.25)}
.detail{padding:12px 14px;display:flex;flex-direction:column;gap:6px;min-height:130px}
.dhead{display:flex;align-items:center;gap:8px}
.dhead h3{font-family:var(--kai);font-size:15px;margin:0}
.detail p{margin:2px 0 0;font-size:12.5px;line-height:1.85;color:#332C25}
.dmeta{display:flex;gap:16px;font-size:10.5px;color:#8C8272;margin-top:auto;padding-top:8px;border-top:1px dashed #EAE1CF;flex-wrap:wrap}
.dmeta b{color:#201C18;font-weight:400}
.relrow{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.chip{display:inline-flex;align-items:center;gap:5px;font-size:11px;background:#F7F1E3;border:1px solid #EAE1CF;border-radius:999px;padding:2px 8px 2px 2px;cursor:pointer}
.chip i{width:17px;height:17px;border-radius:50%;color:#fff;font-style:normal;display:grid;place-items:center;font-size:9px;font-family:var(--kai)}
.chip small{color:#8C8272;font-size:9.5px}
.genbox{background:#FBF3E6;border:1px dashed #E0C79B;border-radius:9px;padding:10px 12px;font-size:11.5px;line-height:1.7;color:#5B5348}
/* ---------------- 展示视图：卡片滑转 / 3D 翻转 ----------------
 * 一套「舞台 + 双面卡片」：卡片有两个面（A/B），两面各自背对背。
 * 换人时把内容写进当前背着的那一面，再把整张卡转 180°，背的那面就转到正面来；
 * 上一张 / 下一张分别是 −180° / +180°，于是左右方向都对。旋转过程中两面都不重画，
 * 所以看着是一张卡真的在翻，而不是两张卡换图。 */
.showwrap{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:10px;padding:6px 0 0}
.showtop{display:flex;align-items:center;gap:10px;width:100%;max-width:820px}
.showtop h2{font-family:var(--kai);font-size:20px;margin:0;letter-spacing:.18em;color:#7C291F}
.showtop .st-sub{font-size:10px;letter-spacing:.24em;color:var(--muted)}
.showtop .st-ctr{margin-left:auto;font-size:11px;color:#8C8272;font-variant-numeric:tabular-nums}
/* 舞台：perspective 只给舞台，卡片才有近大远小的透视感 */
.showstage{width:100%;max-width:820px;flex:1;min-height:300px;display:grid;place-items:center;perspective:1500px;position:relative}
.showstage::before,.showstage::after{content:'';position:absolute;top:8px;bottom:8px;width:1px;background:linear-gradient(180deg,transparent,#DFD4BF 18%,#DFD4BF 82%,transparent);pointer-events:none}
.showstage::before{left:6px}.showstage::after{right:6px}
.showcard{position:relative;width:min(560px,88%);height:min(330px,100%);min-height:250px;transform-style:preserve-3d;
  transition:transform .78s cubic-bezier(.2,.72,.18,1);will-change:transform}
.showcard.driving{transition:none}          /* 首帧摆位不要动画 */
.showface{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:14px;overflow:hidden;
  border:1px solid #C9B491;background:linear-gradient(150deg,#FFFCF5 0%,#F6EEDC 55%,#E8D8B8 100%);
  box-shadow:0 16px 40px rgba(60,44,20,.14),inset 0 0 0 5px rgba(255,253,248,.55);display:flex}
.showface.b{transform:rotateY(180deg)}
.sf-pic{width:41%;flex:none;position:relative;overflow:hidden;background:linear-gradient(160deg,#EFE3C9,#D9C39B)}
.sf-pic img{width:100%;height:100%;object-fit:cover;display:block}
.sf-pic .sf-glyph{position:absolute;inset:0;display:grid;place-items:center;font-family:var(--kai);font-size:96px;color:#7C291F;opacity:.85}
.sf-pic .sf-nopic{position:absolute;left:0;right:0;bottom:10px;text-align:center;font-size:9px;letter-spacing:.3em;color:#7C5A32}
.sf-body{flex:1;min-width:0;padding:20px 20px 16px;display:flex;flex-direction:column;position:relative}
.sf-body .sf-kicker{font-size:9.5px;letter-spacing:.3em;color:#9A8B72}
.sf-body h3{font-family:var(--kai);font-size:40px;line-height:1.1;letter-spacing:.08em;margin:6px 0 0;color:#7C291F}
.sf-rule{height:1px;background:linear-gradient(90deg,#B98A3C,rgba(185,138,60,0));margin:11px 0 12px}
.sf-tags{display:flex;flex-wrap:wrap;gap:6px}
.sf-tags span{font-size:10.5px;padding:3px 9px;border:1px solid #DFD4BF;border-radius:999px;background:rgba(255,255,255,.6);color:#5B5348}
.sf-role{font-size:12px;color:#5B5348;margin-top:9px;line-height:1.6;max-height:3.2em;overflow:hidden}
.sf-persona{font-size:12.5px;line-height:1.85;color:#332C25;margin-top:10px;overflow:auto;flex:1}
.sf-foot{font-size:10px;color:#8C8272;border-top:1px dashed #DFD4BF;padding-top:8px;margin-top:8px}
.sf-seal{position:absolute;right:14px;top:14px;width:30px;height:30px;border:2px solid #A8322A;border-radius:5px;
  color:#A8322A;font-family:var(--kai);font-size:12px;display:grid;place-items:center;transform:rotate(-9deg);opacity:.82}
.showbar{display:flex;align-items:center;gap:10px;width:100%;max-width:820px;justify-content:center;padding-bottom:4px}
.showbar .btn.min{padding:3px 12px;font-size:11px}
.showdots{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center;max-width:560px}
.showdots i{width:8px;height:8px;border-radius:50%;background:#D9CDB8;cursor:pointer;transition:background .18s,transform .18s}
.showdots i:hover{background:#B98A3C}
.showdots i.on{background:#A8322A;transform:scale(1.35)}
.showhint{font-size:10px;color:#9A8B72;letter-spacing:.06em;text-align:center}
/* ---------------- 详情视图：左侧立绘 + 右侧立体关系网 ---------------- */
.dwrap{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px;padding:4px 0 0}
.dhead{display:flex;align-items:baseline;gap:10px}
.dhead h2{font-family:var(--kai);font-size:20px;margin:0;letter-spacing:.18em;color:#7C291F}
.dhead .sub{font-size:10px;letter-spacing:.22em;color:var(--muted)}
.dhead .grow{flex:1}
.dbody{flex:1;min-height:0;display:flex;gap:12px}
/* 左：立绘大图 */
.dport{width:228px;flex:none;border-radius:12px;border:1px solid #C9B491;overflow:hidden;position:relative;
  background:linear-gradient(150deg,#FFFDF8 0%,#F4E9D4 45%,#E2CEA9 100%);display:flex;flex-direction:column}
.dport .dp-pic{flex:1;min-height:0;position:relative;overflow:hidden}
.dport .dp-pic img{width:100%;height:100%;object-fit:cover;display:block}
.dport .dp-glyph{position:absolute;inset:0;display:grid;place-items:center;font-family:var(--kai);font-size:118px;color:#7C291F;opacity:.85}
.dport .dp-none{position:absolute;left:0;right:0;bottom:12px;text-align:center;font-size:9px;letter-spacing:.3em;color:#7C5A32}
.dport .dp-foot{padding:10px 12px 12px;border-top:1px solid #DFD4BF;background:rgba(255,253,248,.7)}
.dport .dp-foot h3{font-family:var(--kai);font-size:24px;margin:0 0 3px;letter-spacing:.08em;color:#7C291F}
.dport .dp-foot p{margin:0;font-size:11px;line-height:1.6;color:#5B5348}
.dport .dp-foot .dp-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}
.dport .dp-foot .dp-tags span{font-size:10px;padding:2px 7px;border:1px solid #DFD4BF;border-radius:999px;background:rgba(255,255,255,.6);color:#5B5348}
/* 右：立体关系网 */
.dgraph{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.gscene{flex:1;min-height:300px;position:relative;overflow:hidden;border-radius:12px;border:1px solid #DFD4BF;
  background:radial-gradient(circle at 50% 46%,#FFFDF8 0%,#F6EEDC 58%,#EADFC8 100%);cursor:grab;touch-action:none}
.gscene.dragging{cursor:grabbing}
.gscene::before{content:'';position:absolute;inset:0;pointer-events:none;
  background-image:radial-gradient(#C9B491 0.6px,transparent 0.6px);background-size:20px 20px;opacity:.35}
.ggalaxy{position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d;will-change:transform}
.gline{position:absolute;left:0;top:0;height:2px;transform-origin:0 50%;border-radius:2px;
  background:linear-gradient(90deg,rgba(47,111,99,.85),rgba(185,138,60,.45));pointer-events:none}
.gline.l2{height:1px;background:linear-gradient(90deg,rgba(168,50,42,.3),rgba(185,138,60,.12))}
/* 星系轨道：SVG 椭圆环，随镜头俯仰压扁；中心恒星带光晕 */
.gorbit{fill:none;stroke:rgba(185,138,60,.42);stroke-width:1.2;stroke-dasharray:3 5;pointer-events:none}
.gorbit.inner{stroke:rgba(47,111,99,.4)}
.gstar-glow{fill:rgba(168,50,42,.1)}
.gnode.center .gn-dot{background:radial-gradient(circle at 36% 32%,#D4695C 0%,#A8322A 55%,#7C2019 100%);
  box-shadow:0 0 0 6px rgba(168,50,42,.13),0 0 22px 6px rgba(210,140,90,.35),0 6px 18px rgba(60,44,20,.25)}
.gnode.center .gn-in::before{content:'';position:absolute;left:50%;top:22px;width:92px;height:92px;transform:translate(-50%,-50%);
  border-radius:50%;background:radial-gradient(circle,rgba(210,140,90,.28),rgba(210,140,90,0) 70%);pointer-events:none;z-index:-1}
.glabel{position:absolute;left:0;top:0;font-size:10px;padding:1px 6px;border-radius:999px;white-space:nowrap;
  background:rgba(255,253,248,.92);border:1px solid #DFD4BF;color:#6A4A16;pointer-events:none}
.glabel.l2{color:#9A8B72;font-size:9px;background:rgba(255,253,248,.75)}
.gnode{position:absolute;left:0;top:0;width:0;height:0;transform-style:preserve-3d;cursor:pointer}
.gnode .gn-in{position:absolute;left:0;top:0;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:3px}
.gnode .gn-dot{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;color:#fff;font-family:var(--kai);font-size:19px;
  border:2px solid rgba(255,255,255,.9);box-shadow:0 4px 14px rgba(60,44,20,.22);transition:box-shadow .18s,filter .18s}
.gnode.center .gn-dot{width:62px;height:62px;font-size:26px;border-color:#A8322A;box-shadow:0 0 0 5px rgba(168,50,42,.12),0 6px 18px rgba(60,44,20,.25)}
.gnode.l2 .gn-dot{width:34px;height:34px;font-size:14px;opacity:.78}
.gnode:hover .gn-dot{box-shadow:0 0 0 5px rgba(185,138,60,.28),0 6px 18px rgba(60,44,20,.25);filter:brightness(1.08)}
.gnode .gn-name{font-size:10.5px;color:#332C25;white-space:nowrap;padding:1px 5px;border-radius:4px;background:rgba(255,253,248,.8)}
.gnode.center .gn-name{font-family:var(--kai);font-size:13px;color:#7C291F;background:rgba(255,253,248,.92)}
.gnode.l2 .gn-name{font-size:9px;color:#8C8272}
.gfoot{display:flex;align-items:center;gap:12px;font-size:10px;color:#8C8272;flex-wrap:wrap}
.gfoot b{font-weight:400;color:#5B5348}
.gfoot .lg{display:inline-flex;align-items:center;gap:5px}
.gfoot .lg i{width:8px;height:8px;border-radius:50%;display:inline-block}
`);

export default {
  id: 'characters', label: '人物',
  statusText(doc) { return '人物 ' + doc.characters.length + ' · 情节节点 ' + doc.plots.length; },
  unmount() { if (this._cleanup) { this._cleanup(); this._cleanup = null; } },
  mount(root, ctx) {
    const { doc, params, NF } = ctx;
    const st = { id: params.id || (doc.characters[0] && doc.characters[0].id) || null, q: '', selPlot: null,
      /* 视图：edit=编辑档案 / show=卡片翻转展示 / detail=立绘+关系网详情。
       * turn 是卡片累计转过的 180° 次数（正=下一位，负=上一位），决定哪一面朝前。 */
      mode: 'edit', turn: 0, showing: null, flipping: false,
      /* 关系网镜头：rx/ry 是旋转角（度），z 是缩放；auto 是自动旋转开关，raf 是动画句柄 */
      grot: { rx: -34, ry: 24, z: 1 }, gauto: true, graf: null };
    let netCleanupRef = null;
    const wrap = h('div', { class: 'cwrap' });
    const aside = h('aside', { class: 'clist', 'data-probe': 'charlist' });
    const main = h('main', { class: 'cmain', 'data-probe': 'charmain' });
    wrap.appendChild(aside); wrap.appendChild(main); root.appendChild(wrap);

    const getChar = () => doc.characters.find(c => c.id === st.id);
    const touch = () => { NF.save(); };

    /* 人物档案里六个小标题都能改：年龄 / 身份 / 目前修为 / 分类 / 人设 / 最终结局。
     * 作者起的名字存在这个人自己的 fieldLabels 里，留空就回到默认叫法；
     * 改的只是显示标题，age / identity 这些字段名不动，导出和 AI 上下文照旧。
     * 手感和世界观页的「修为体系」标题一致：平时像普通小字，点进去才浮出边框。 */
    const FIELD_LABELS = { age: '年龄', identity: '身份', realm: '目前修为', group: '分类', persona: '人设', ending: '最终结局' };
    const fieldLabelOf = (c, key) => {
      const v = c.fieldLabels && c.fieldLabels[key];
      return typeof v === 'string' && v.trim() ? v.trim() : FIELD_LABELS[key];
    };
    const putLabel = (c, key, v) => {
      if (v && v !== FIELD_LABELS[key]) {
        c.fieldLabels = c.fieldLabels || {};
        c.fieldLabels[key] = v;
      } else if (c.fieldLabels) {
        delete c.fieldLabels[key];
        if (!Object.keys(c.fieldLabels).length) delete c.fieldLabels;
      }
    };
    function editableLabel(c, key, probe) {
      const def = FIELD_LABELS[key] || '';
      const val = fieldLabelOf(c, key);
      const inp = h('input', {
        class: 'flabel', value: val, size: Math.max(3, Math.min(14, val.length + 1)),
        placeholder: def, title: '点这里改标题（回车确认，Esc 撤销）；清空后恢复默认「' + def + '」',
        spellcheck: 'false'
      });
      if (probe) inp.setAttribute('data-probe', probe);
      let before = null;
      inp.addEventListener('focus', () => { before = c.fieldLabels && c.fieldLabels[key] || ''; });
      inp.addEventListener('input', () => {
        const v = String(inp.value || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 24);
        putLabel(c, key, v);
        touch();
      });
      const settle = () => { inp.value = fieldLabelOf(c, key); };
      inp.addEventListener('change', settle);
      inp.addEventListener('blur', settle);
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); inp.blur(); return; }
        if (e.key !== 'Escape') return;
        e.preventDefault();
        putLabel(c, key, before);
        inp.value = fieldLabelOf(c, key);
        touch();
        inp.blur();
      });
      return inp;
    }

    /* ---------------- 情节时间轴用的小工具 ----------------
     * 人物页这条轴和情节页那条是同一套规矩：位置 = 时间点在刻度上的百分比、
     * 轴左右各留 2%、拖动松手才落库、时间点取整数刻度。
     * 两边改的是同一份 doc.plots，所以在这儿拖完，情节页那边立刻就是新的。 */
    const AXIS_PAD = 2, AXIS_SPAN = 94;
    const tpNum = p => { const n = Number(p && p.timePoint); return isFinite(n) ? n : 0; };
    const fmtTp = v => {
      const n = Number(v);
      if (!isFinite(n)) return '—';
      return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
    };
    /* 鼠标横坐标 → 时间点（按整条轴的总刻度反算，整数） */
    function timeAt(track, clientX, maxT) {
      const r = track.getBoundingClientRect();
      const pct = Math.max(AXIS_PAD, Math.min(100, ((clientX - r.left) / (r.width || 1)) * 100));
      return Math.max(0, Math.round(((pct - AXIS_PAD) / AXIS_SPAN) * Math.max(1, maxT)));
    }
    /* 稿件标题里的章号：「第18章」「第十八章」都认。新建情节时按章节写 chapterNo，
     * 章节页靠它把情节挂到对应那一篇上 */
    const CN_NUM = { '〇': 0, '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9 };
    function chNo(s) {
      const t = String(s || '');
      const ar = t.match(/第\s*(\d+)\s*[章回节]/);
      if (ar) return Number(ar[1]);
      const cn = t.match(/第\s*([〇零一二三四五六七八九十百两]+)\s*[章回节]/);
      if (!cn) return 0;
      let total = 0, cur = 0;
      for (const ch of cn[1]) {
        if (ch === '百') { total += (cur || 1) * 100; cur = 0; }
        else if (ch === '十') { total += (cur || 1) * 10; cur = 0; }
        else if (CN_NUM[ch] != null) cur = CN_NUM[ch];
      }
      return total + cur;
    }
    /* 拖完松手浏览器还会补一个 click：用它挡掉那次"选中 / 打开编辑" */
    let suppressClick = false;

    /* 拖动轴上的圆点：跟手走，松手按落点刻度改时间点（只改这一条，别的节点不动）。
     * 拖动过程中视口锁死（maxT 用按下那一刻的），否则时间点一变整条轴重新缩放，圆点会漂。 */
    function startTickDrag(ev, p, node) {
      if (ev.button !== 0) return;
      ev.preventDefault();
      const track = node.parentNode;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const maxT = Math.max(1, ...doc.plots.map(tpNum));
      const left0 = node.style.left;
      const startX = Number(ev.clientX) || rect.left + (rect.width || 0) / 2;
      let moved = false, lastPct = null;
      node.classList.add('dragging');
      track.classList.add('dragging');
      const hint = h('div', { class: 'tp-hint' });
      track.appendChild(hint);
      const paint = x => {
        const pct = Math.max(0, Math.min(100, ((x - rect.left) / (rect.width || 1)) * 100));
        lastPct = pct;
        node.style.left = pct.toFixed(2) + '%';
        hint.textContent = '时间点 ' + timeAt(track, x, maxT);
        hint.style.left = pct.toFixed(2) + '%';
      };
      paint(startX);
      const move = e => {
        const x = Number(e.clientX) || startX;
        if (Math.abs(x - startX) > 2) moved = true;
        paint(x);
      };
      const up = () => {
        window.removeEventListener('mousemove', move);
        window.removeEventListener('mouseup', up);
        node.classList.remove('dragging');
        track.classList.remove('dragging');
        hint.remove();
        /* 没真的挪动：当成单击，恢复原位即可（菜单/选中交给 click 处理） */
        if (!moved || lastPct == null) { node.style.left = left0; return; }
        suppressClick = true;
        setTimeout(() => { suppressClick = false; }, 350);
        const tp = timeAt(track, rect.left + (lastPct / 100) * (rect.width || 0), maxT);
        const before = tpNum(p);
        if (tp === before) { renderMain(); return; }
        p.timePoint = tp;
        touch();
        st.selPlot = p.id;
        renderMain();
        toast('「' + (p.title || '情节') + '」时间点改为 ' + fmtTp(tp), 'ok');
      };
      window.addEventListener('mousemove', move);
      window.addEventListener('mouseup', up);
    }

    /* 左栏的"壳"（标题 + 搜索框）只建一次，下面只换人物列表。
     * 以前每次输入都整块重画，搜索框刚敲一个字就丢焦点，只能点一下再敲一个字。 */
    const listTitle = h('div', { style: { fontSize: '12px', fontWeight: '700' } });
    const search = h('input', { class: 'input', placeholder: '搜索姓名 / 别名', style: { height: '28px', fontSize: '11.5px' } });
    search.addEventListener('input', () => { st.q = search.value; renderList(); });
    aside.appendChild(h('div', { class: 'row', style: { padding: '0 4px 2px' } },
      listTitle,
      h('div', { class: 'grow' }),
      h('button', { class: 'btn xs', onclick: addChar }, '＋ 新建')));
    aside.appendChild(search);
    /* 编辑 / 展示 / 关系 三个胶囊互斥：
     * 展示视图点卡片可进关系详情，关系详情里左栏照常能点人换中心。 */
    const editTab = h('button', { class: 'btn xs on', 'data-probe': 'mode-edit', title: '回到可编辑的人物档案', onclick: () => setMode('edit') }, '✎ 编辑');
    const showTab = h('button', { class: 'btn xs', 'data-probe': 'mode-show', title: '卡片翻转式人物展示', onclick: () => setMode('show') }, '▤ 展示');
    const netTab = h('button', { class: 'btn xs', 'data-probe': 'mode-net', title: '立绘 + 立体关系网', onclick: () => setMode('detail') }, '✧ 关系');
    const modeRow = h('div', { class: 'gsel', style: { padding: '5px 2px 2px' } },
      h('div', { class: 'row', style: { gap: '4px' } },
        h('span', { class: 'tiny muted', style: { letterSpacing: '.1em' } }, '视图'),
        h('div', { class: 'grow' }), editTab, showTab, netTab));
    aside.appendChild(modeRow);
    function setMode(m) {
      if (st.mode === m) return;
      if (st.mode === 'detail' && st.graf) { cancelAnimationFrame(st.graf); st.graf = null; }
      st.mode = m;
      editTab.classList.toggle('on', m === 'edit');
      showTab.classList.toggle('on', m === 'show');
      netTab.classList.toggle('on', m === 'detail');
      if (m === 'show') { st.turn = 0; st.showing = st.id; }
      renderMain();
    }
    /* 左栏点人：展示视图里只高亮 + 翻卡（卡片的 flipTo 会同步 st.id 与圆点），
     * 关系详情里整块重画关系网（换中心人物），编辑视图照旧。 */
    function pickChar(id) {
      if (st.mode === 'show' && !st.flipping) {
        const card = main.querySelector('[data-probe="show-card"]');
        if (card && id !== st.id) {
          card.__flipTo ? card.__flipTo(id) : (st.id = id, renderList(), renderMain());
          return;
        }
      }
      if (st.mode === 'detail') { st.id = id; renderList(); renderMain(); return; }
      st.id = id; st.selPlot = null; renderList(); renderMain();
    }
    const listHost = h('div', { class: 'cllist' });
    aside.appendChild(listHost);

    function renderList() {
      listTitle.textContent = '人物 · ' + doc.characters.length;
      if (search.value !== st.q) search.value = st.q;
      clear(listHost);
      const list = h('div', { class: 'cllist' });
      /* 分组的先后按 groupList（人多在前，同数按首次出现）—— 和"改分类"里的胶囊同一套顺序 */
      const groups = {};
      const order = groupList(doc).map(g => g.name);
      doc.characters.filter(c => !st.q || c.name.includes(st.q) || (c.aliases || []).some(a => a.includes(st.q)))
        .forEach(c => { const g = groupOf(c); (groups[g] = groups[g] || []).push(c); });
      const keys = Object.keys(groups).sort((a, b) => {
        const ia = order.indexOf(a), ib = order.indexOf(b);
        return (ia < 0 ? 1e9 : ia) - (ib < 0 ? 1e9 : ib);
      });
      for (const g of keys) {
        list.appendChild(h('div', { class: 'cgroup' }, h('span', {}, g.toUpperCase()), h('span', { class: 'cg-n' }, '· ' + groups[g].length)));
        groups[g].forEach(c => {
          const hasP = !!c.portrait;
          list.appendChild(h('div', { class: 'crow' + (c.id === st.id ? ' on' : ''), 'data-char-row': c.id, onclick: () => pickChar(c.id) },
            h('div', { class: 'avatar', style: { width: '28px', height: '28px', background: c.color || '#2F6F63', fontSize: '13px' } }, c.name.slice(0, 1)),
            h('div', { style: { minWidth: 0 } },
              h('b', {}, c.name),
              h('small', {}, (c.identity || '未填身份').slice(0, 12) + (hasP ? '' : ' · 无立绘'))),
            h('span', {
              class: 'crow-del', title: '删除「' + c.name + '」', 'data-char-del': c.id,
              onclick: e => { e.stopPropagation(); removeChar(c); }
            }, '⌫')));
        });
      }
      if (!doc.characters.length) list.appendChild(h('div', { class: 'empty' }, '还没有人物，点右上角新建'));
      else if (st.q && !Object.keys(groups).length) list.appendChild(h('div', { class: 'empty' }, '没有找到「' + st.q + '」'));
      listHost.appendChild(list);
    }

    /* 分类选择器：现成分类点一下即选，也可以手填一个新分类。
     * 手填时和已有分类忽略首尾空格比较，避免「主线」和「主线 」分成两组。 */
    function groupSelect(c) {
      const input = h('input', {
        class: 'input', value: c.group || '', placeholder: GROUP_DEFAULT,
        style: { fontSize: '12.5px' }, 'data-probe': 'char-group-input'
      });
      const chips = h('div', { class: 'gchips' });
      /* 候选 = 书里已经用过的分类，"正在打的这个"如果还不是已有分类就补在最后。
       * 只用输入框里的字判断，不看 c.group —— 打字时不落盘，其他胶囊的顺序就不会跳。 */
      const cands = () => {
        const cur = String(input.value || '').trim();
        const list = groupList(doc).map(g => g.name).filter(g => g !== GROUP_UNFILED);
        return cur && list.indexOf(cur) < 0 ? list.concat([cur]) : list;
      };
      const paintChips = () => {
        clear(chips);
        const cur = String(input.value || '').trim();
        const list = cands();
        list.forEach(name => chips.appendChild(h('span', {
          class: 'gchip' + (name === cur ? ' on' : ''), title: '点一下改用「' + name + '」',
          onclick: () => { input.value = name; apply(name); }
        }, name)));
        if (!list.length) chips.appendChild(h('span', { class: 'tiny muted', style: { lineHeight: '1.8' } }, '还没有分类，直接在下面填一个'));
      };
      const apply = v => {
        const val = String(v || '').trim();
        if (val && val !== String(c.group || '').trim()) {
          c.group = val;
          touch();
        }
        renderList();                 /* 分类变了，左栏的分组跟着动 */
        paintChips();
      };
      /* 打字过程中什么都不重排：一旦改 c.group，当前这个人的分类占比就变了，
       * 胶囊和左栏分组会在脚下重新排序；等确定（回车 / 失焦 / 点胶囊）时再一次性重排。 */
      input.addEventListener('input', () => { paintChips(); });   /* 只更新胶囊高亮，不动数据 */
      input.addEventListener('change', () => {
        const val = input.value.trim() || GROUP_DEFAULT;
        input.value = val;
        apply(val);
      });
      paintChips();
      return h('div', { class: 'gsel' }, chips, input);
    }

    /* 人物档案里的小字段：点进去就能直接键入，改一个字存一个字（不弹窗、不用按保存）。
     * label 可以是字符串，也可以是 editableLabel() 给出的标题输入框；传 null 就只要输入框。 */
    function fieldChar(label, key, opts) {
      const c = getChar();
      const o = opts || {};
      const input = h(o.area ? 'textarea' : 'input', {
        class: o.area ? 'ta' : 'input',
        value: c[key] || '',
        placeholder: o.ph || '',
        style: o.area ? { minHeight: '52px', fontSize: '12px' } : { fontSize: '12.5px' }
      });
      if (o.probe) input.setAttribute('data-probe', o.probe);
      const lab = typeof label === 'string' ? h('label', { title: '点一下就能改，改完自动保存' }, label) : label;
      if (lab && lab.tagName === 'LABEL') {
        lab.addEventListener('click', () => {
          input.focus();
          try { const n = input.value.length; input.setSelectionRange(n, n); } catch (e) {}
        });
      }
      input.addEventListener('input', () => { c[key] = input.value; touch(); });
      const box = h('div', { class: 'field' }, lab, input);
      if (o.list) {
        const dl = h('datalist', { id: 'dl-' + key }, o.list.map(x => h('option', { value: x })));
        input.setAttribute('list', 'dl-' + key);
        box.appendChild(dl);
      }
      return box;
    }

    /* ---------------- 展示视图：卡片滑转 / 翻转 ----------------
     * 舞台上一张双面卡：A 面、B 面背对背。当前朝前的是哪面由 st.turn 的奇偶决定
     * （偶数=A、奇数=B，负数取绝对值也一样）。换人时：
     *   ① 算出新落点的 turn（下一位 +1 / 上一位 −1 / 直接点某人取最短方向）；
     *   ② 把新人物写进「转完之后会朝前」的那一面；
     *   ③ 给卡片设置 rotateY(turn*180deg)，CSS 过渡把这张卡真的翻过去。
     * 首帧（driving）先关掉过渡摆好位置，下一拍再打开，避免初始化时闪一下动画。 */
    function faceHtml(c, i, total) {
      const plane = doc.planes[0] || { realms: [] };
      const pic = h('div', { class: 'sf-pic' });
      if (c.portrait) {
        const img = h('img', { alt: c.name });
        window.nf.image.absolute(c.portrait).then(url => { img.src = url; });
        pic.appendChild(img);
      } else {
        pic.appendChild(h('div', { class: 'sf-glyph' }, c.name.slice(0, 1)));
        pic.appendChild(h('div', { class: 'sf-nopic' }, '尚 未 立 绘'));
      }
      const tags = [
        c.age ? '年 · ' + c.age : null,
        c.realm ? '修为 · ' + c.realm : null,
        c.group ? groupOf(c) : null
      ].filter(Boolean);
      const body = h('div', { class: 'sf-body' },
        h('div', { class: 'sf-kicker' }, groupOf(c).toUpperCase()),
        h('h3', {}, c.name),
        h('div', { class: 'sf-rule' }),
        h('div', { class: 'sf-tags' }, ...tags.map(t => h('span', {}, t))),
        h('div', { class: 'sf-role' }, c.identity || '（未填身份）'),
        h('div', { class: 'sf-persona' }, c.persona || '（还没有写人设）'),
        h('div', { class: 'sf-foot' }, (c.ending ? '结局 · ' + c.ending : '结局未定') + '  ·  ' + (i + 1) + ' / ' + total),
        h('div', { class: 'sf-seal' }, '卷'));
      return [pic, body];
    }
    function fillFace(face, c) {
      clear(face);
      const list = doc.characters;
      /* appendChild 只收一个节点：这里要用 append 把「图片 + 文字」两块一起放进去 */
      face.append(...faceHtml(c, Math.max(0, list.indexOf(c)), list.length));
    }
    function renderShowcase() {
      const list = doc.characters;
      const showwrap = h('div', { class: 'showwrap', 'data-probe': 'showcase' });
      showwrap.appendChild(h('div', { class: 'showtop' },
        h('h2', {}, '人 物 志'),
        h('span', { class: 'st-sub' }, 'CHARACTERS'),
        h('span', { class: 'grow' }),
        h('span', { class: 'st-ctr', 'data-probe': 'show-count' })));
      const stage = h('div', { class: 'showstage' });
      const card = h('div', { class: 'showcard driving', 'data-probe': 'show-card', title: '点卡片查看人物关系网',
        onclick: () => { if (!st.flipping) setMode('detail'); } });
      const fa = h('div', { class: 'showface a', 'data-face': 'a' });
      const fb = h('div', { class: 'showface b', 'data-face': 'b' });
      card.appendChild(fa); card.appendChild(fb);
      stage.appendChild(card);
      showwrap.appendChild(stage);

      const dots = h('div', { class: 'showdots' });
      const bar = h('div', { class: 'showbar' },
        h('button', { class: 'btn xs min', title: '上一位（←）', onclick: () => flipBy(-1) }, '‹ 上一位'),
        dots,
        h('button', { class: 'btn xs min', title: '下一位（→）', onclick: () => flipBy(1) }, '下一位 ›'));
      showwrap.appendChild(bar);
      showwrap.appendChild(h('div', { class: 'showhint' }, '点卡片看关系网 · 点左栏人物 / 圆点翻卡 · ← → 换人'));
      main.appendChild(showwrap);

      st.showing = st.id;
      st.turn = 0;
      /* 首帧摆正：A 面朝前、卡片 0°，关掉过渡后再恢复，避免一进展示视图就翻一下 */
      fillFace(fa, getChar());
      card.style.transform = 'rotateY(0deg)';
      requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('driving')));
      paintShowChrome();

      function paintShowChrome() {
        const ctr = showwrap.querySelector('[data-probe="show-count"]');
        if (ctr) ctr.textContent = (Math.max(0, list.indexOf(getChar())) + 1) + ' / ' + list.length;
        clear(dots);
        list.forEach(x => dots.appendChild(h('i', {
          class: x.id === st.id ? 'on' : '', title: x.name, 'data-dot': x.id,
          onclick: () => flipTo(x.id)
        })));
      }
      function flipBy(step) {
        if (!list.length) return;
        const i = Math.max(0, list.findIndex(x => x.id === st.id));
        const n = (i + step + list.length) % list.length;
        flipTo(list[n].id, step);
      }
      function flipTo(id, prefer) {
        if (st.flipping || id === st.id) return;
        const next = list.find(x => x.id === id);
        if (!next) return;
        const i = list.indexOf(next), cur = Math.max(0, list.indexOf(getChar()));
        /* 点左栏 / 圆点取最短方向（往后近就 +1，往前近就 −1）；上/下一位按钮指定方向 */
        let step = prefer || (i > cur ? 1 : -1);
        st.turn += step;
        /* 转完之后：turn 偶数 → A 朝前，奇数 → B 朝前（负奇数同样朝 B） */
        const front = Math.abs(st.turn) % 2 === 0 ? fa : fb;
        fillFace(front, next);
        st.flipping = true;
        st.id = id;
        st.showing = id;
        card.style.transform = 'rotateY(' + (st.turn * 180) + 'deg)';
        paintShowChrome();
        const done = () => { st.flipping = false; card.removeEventListener('transitionend', done); };
        card.addEventListener('transitionend', done);
        setTimeout(done, 950);   /* 兜底：过渡事件没来也别把卡片锁住 */
      }
      /* 暴露给左栏点击 / ← → 键用：卡片每次重绘都是新节点，引用跟着节点走，不会留旧闭包 */
      card.__flipTo = flipTo;
      card.__flipBy = flipBy;
    }

    /* ---------------- 详情视图：立绘 + 立体关系网 ----------------
     * 关系数据来自 c.relations（出边）和别人 relations 里指向 c 的（入边），合成无向网。
     * 节点用「球面螺旋」摆位（斐波那契球），中心人物在球心、一度关系在球面上；
     * 一度人物再往外扩一圈二度节点（淡色），让网有纵深。
     * 整个 galaxy 容器做 rotateX/rotateY/scale：鼠标拖 = 转镜头、滚轮 = 远近、
     * 点节点 = 换中心人物重画。节点字幕用反向旋转抵消镜头，始终正对读者。 */
    function netEdges(c) {
      const byId = new Map();
      const add = (other, label, from) => {
        if (!other || other.id === c.id) return;
        const e = byId.get(other.id) || { c: other, labels: [], from: from };
        if (label && e.labels.indexOf(label) < 0) e.labels.push(label);
        if (from === 1) e.from = 1;
        byId.set(other.id, e);
      };
      (c.relations || []).forEach(r => add(doc.characters.find(x => x.id === r.targetId), r.label || '', 1));
      doc.characters.forEach(o => {
        if (o.id === c.id) return;
        (o.relations || []).forEach(r => { if (r.targetId === c.id) add(o, r.label || '', 1); });
      });
      const first = Array.from(byId.values());
      /* 二度：一度人物各自的关系里，不是中心也不是一度的那些 */
      const ids = new Set([c.id].concat(first.map(e => e.c.id)));
      const second = new Map();
      first.forEach(e => (e.c.relations || []).forEach(r => {
        const t = doc.characters.find(x => x.id === r.targetId);
        if (!t || ids.has(t.id)) return;
        const s = second.get(t.id) || { c: t, labels: [], via: e.c.name };
        if (r.label && s.labels.indexOf(r.label) < 0) s.labels.push(r.label);
        second.set(t.id, s);
      }));
      return { first, second: Array.from(second.values()) };
    }
    function renderDetail() {
      if (st.graf) { cancelAnimationFrame(st.graf); st.graf = null; }
      const c = getChar();
      const edges = netEdges(c);
      const nodes = [{ c, depth: 0, label: '' }]
        .concat(edges.first.map(e => ({ c: e.c, depth: 1, label: e.labels.join(' / ') })))
        .concat(edges.second.map(e => ({ c: e.c, depth: 2, label: e.labels.join(' / ') + '（经 ' + e.via + '）' })));
      const wrap = h('div', { class: 'dwrap', 'data-probe': 'net-detail' });
      wrap.appendChild(h('div', { class: 'dhead' },
        h('h2', {}, '人 物 关 系'),
        h('span', { class: 'sub' }, 'RELATION NETWORK'),
        h('span', { class: 'grow' }),
        h('button', { class: 'btn xs', 'data-probe': 'net-back', onclick: () => setMode('show') }, '‹ 返回卡片')));

      const body = h('div', { class: 'dbody' });
      /* ---- 左：立绘 ---- */
      const port = h('div', { class: 'dport', 'data-probe': 'net-portrait' });
      const pic = h('div', { class: 'dp-pic' });
      if (c.portrait) {
        const img = h('img', { alt: c.name });
        window.nf.image.absolute(c.portrait).then(url => { img.src = url; });
        pic.appendChild(img);
      } else {
        pic.appendChild(h('div', { class: 'dp-glyph' }, c.name.slice(0, 1)));
        pic.appendChild(h('div', { class: 'dp-none' }, '尚 未 立 绘'));
      }
      const plane = doc.planes[0] || { realms: [] };
      const tags = [c.age ? '年 · ' + c.age : null, c.realm ? '修为 · ' + c.realm : null, groupOf(c)].filter(Boolean);
      port.appendChild(pic);
      port.appendChild(h('div', { class: 'dp-foot' },
        h('h3', {}, c.name),
        h('p', {}, c.identity || '（未填身份）'),
        h('div', { class: 'dp-tags' }, ...tags.map(t => h('span', {}, t))),
        h('p', { style: { marginTop: '7px', fontSize: '11px', lineHeight: '1.75' } }, c.persona || '（还没有写人设）')));
      body.appendChild(port);

      /* ---- 右：星系关系网 ---- */
      const R1 = 152, R2 = 258;   /* 内轨 / 外轨半径，建轨道环与摆位都要用，先定义 */
      const graph = h('div', { class: 'dgraph' });
      const scene = h('div', { class: 'gscene', 'data-probe': 'net-scene' });
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible');
      scene.appendChild(svg);
      /* 轨道环：水平圆（y=0）经投影后是椭圆，随镜头俯仰实时变形 */
      const orbitPaths = [R1, R2].map((radius, k) => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'gorbit' + (k === 0 ? ' inner' : ''));
        svg.appendChild(path);
        return { path, radius };
      });
      const galaxy = h('div', { class: 'ggalaxy', 'data-probe': 'net-galaxy' });
      scene.appendChild(galaxy);

      /* 星系结构：所有行星躺在同一个水平轨道盘（y=0），x/z 构成同心圆轨道。
       * 镜头俯仰（rx）把圆盘压成椭圆，于是看着像行星绕恒星公转的星系。
       * 一度在内轨、二度在外轨；每个行星带一点公转角差，避免内外圈正好对齐。 */
      const place = (arr, radius, offset) => {
        const N = Math.max(1, arr.length), base = offset || 0;
        arr.forEach((nd, i) => {
          const th = base + (i / N) * Math.PI * 2;
          nd.x = Math.cos(th) * radius;
          nd.y = 0;
          nd.z = Math.sin(th) * radius;
        });
      };
      const firstNodes = nodes.filter(n => n.depth === 1), secondNodes = nodes.filter(n => n.depth === 2);
      place(firstNodes, R1, -Math.PI / 2);
      place(secondNodes, R2, -Math.PI / 2 + .4);
      nodes[0].x = nodes[0].y = nodes[0].z = 0;

      /* 建节点 DOM：位置留给 paint() 算（要投影到 2D），这里只建壳 */
      const views = nodes.map(nd => {
        const el = h('div', { class: 'gnode' + (nd.depth === 0 ? ' center' : nd.depth === 2 ? ' l2' : ''),
          'data-node': nd.c.id, title: nd.label || nd.c.name });
        const inn = h('div', { class: 'gn-in' },
          h('div', { class: 'gn-dot', style: { background: nd.c.color || '#2F6F63' } }, nd.c.name.slice(0, 1)),
          h('div', { class: 'gn-name' }, nd.c.name));
        el.appendChild(inn);
        galaxy.appendChild(el);
        nd.el = el; nd.inn = inn;
        el.addEventListener('click', () => {
          if (nd.c.id === st.id) return;
          /* 点谁就把谁设成新的网心：左栏跟着高亮，整块重画 */
          st.id = nd.c.id; renderList(); renderMain();
        });
        return nd;
      });
      /* 连线：中心→一度、一度→二度（后者淡），标签挂在中点 */
      const lines = [];
      const addLine = (a, b, cls, label) => {
        const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        ln.setAttribute('class', 'gline' + (cls ? ' ' + cls : ''));
        ln.setAttribute('stroke', cls === 'l2' ? 'rgba(168,50,42,.34)' : 'rgba(47,111,99,.72)');
        ln.setAttribute('stroke-width', cls === 'l2' ? '1' : '2');
        svg.appendChild(ln);
        const lab = label ? h('div', { class: 'glabel' + (cls ? ' ' + cls : '') }, label) : null;
        if (lab) galaxy.appendChild(lab);
        lines.push({ a, b, ln, lab });
      };
      const first = views.filter(n => n.depth === 1), second = views.filter(n => n.depth === 2);
      first.forEach(n => addLine(views[0], n, '', n.label));
      second.forEach(n => {
        /* 二度挂到它可能的一度父节点上（按 via 名字找） */
        const via = n.label.match(/经 (.+?)）/);
        const p = via && first.find(f => f.c.name === via[1]);
        addLine(p || views[0], n, 'l2', '');
      });

      const autoBtn = h('button', { class: 'btn xs', 'data-probe': 'net-auto', title: '暂停 / 继续自动旋转' }, st.gauto ? '⏸ 暂停' : '▶ 旋转');
      const resetBtn = h('button', { class: 'btn xs', onclick: () => { st.grot = { rx: -34, ry: 24, z: 1 }; paint(); } }, '⌂ 复位');
      graph.appendChild(scene);
      graph.appendChild(h('div', { class: 'gfoot' },
        h('span', {}, '拖拽旋转 · 滚轮缩放 · 点节点换位'),
        h('span', { class: 'lg' }, h('i', { style: { background: '#2F6F63' } }), h('b', {}, '一度关系 ' + first.length)),
        h('span', { class: 'lg' }, h('i', { style: { background: '#A8322A', opacity: '.55' } }), h('b', {}, '二度 ' + second.length)),
        h('span', { class: 'grow' }), autoBtn, resetBtn));
      body.appendChild(graph);
      wrap.appendChild(body);
      main.appendChild(wrap);

      autoBtn.addEventListener('click', () => {
        st.gauto = !st.gauto;
        autoBtn.textContent = st.gauto ? '⏸ 暂停' : '▶ 旋转';
      });

      /* 3D → 2D 投影：先绕 Y 转 ry、再绕 X 转 rx，按 z 做透视缩放 */
      const P = 640;
      function project(nd, W, H) {
        const { rx, ry, z } = st.grot;
        const cy = Math.cos(ry * Math.PI / 180), sy = Math.sin(ry * Math.PI / 180);
        const cxr = Math.cos(rx * Math.PI / 180), sxr = Math.sin(rx * Math.PI / 180);
        const x1 = nd.x * cy + nd.z * sy, z1 = -nd.x * sy + nd.z * cy;
        const y2 = nd.y * cxr - z1 * sxr, z2 = nd.y * sxr + z1 * cxr;
        const k = z * P / (P - z2);
        /* galaxy 容器已 left/top:50% 居中，节点/标签用相对它的偏移；
         * SVG 连线铺在 scene 上（left:0），要另外加半宽半高才是 scene 内坐标。 */
        return { x: x1 * k, y: y2 * k, ax: W / 2 + x1 * k, ay: H / 2 + y2 * k, k, z2 };
      }
      let painted = false;
      function paint() {
        const W = scene.clientWidth || 600, H = scene.clientHeight || 360;
        const pos = views.map(nd => ({ nd, p: project(nd, W, H) })).sort((a, b) => a.p.z2 - b.p.z2);
        pos.forEach(({ nd, p }) => {
          nd.el.style.transform = 'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,0)';
          nd.el.style.zIndex = String(100 + Math.round(p.k * 10));
          /* 字幕反向抵消镜头旋转，始终正对读者；透视缩放用 scale 走 2D，避免 3D 层叠错位 */
          nd.inn.style.transform = 'translate(-50%,-50%) scale(' + Math.min(1.3, Math.max(.75, p.k)).toFixed(3) + ')';
        });
        /* 轨道环：水平圆上采 72 点投影成闭合 path，俯仰时自然压成椭圆 */
        orbitPaths.forEach(({ path, radius }) => {
          let d = '';
          for (let i = 0; i <= 72; i++) {
            const th = (i / 72) * Math.PI * 2;
            const p = project({ x: Math.cos(th) * radius, y: 0, z: Math.sin(th) * radius }, W, H);
            d += (i ? 'L' : 'M') + p.ax.toFixed(1) + ' ' + p.ay.toFixed(1);
          }
          path.setAttribute('d', d + 'Z');
        });
        lines.forEach(L => {
          const a = project(L.a, W, H), b = project(L.b, W, H);
          L.ln.setAttribute('x1', a.ax.toFixed(1)); L.ln.setAttribute('y1', a.ay.toFixed(1));
          L.ln.setAttribute('x2', b.ax.toFixed(1)); L.ln.setAttribute('y2', b.ay.toFixed(1));
          if (L.lab) {
            L.lab.style.transform = 'translate3d(' + ((a.x + b.x) / 2).toFixed(1) + 'px,' + ((a.y + b.y) / 2).toFixed(1) + 'px,0) translate(-50%,-50%)';
          }
        });
        painted = true;
      }

      /* 拖镜头：按下记起点，移动改 rx/ry（限制俯仰别翻过头），松手解绑 */
      let drag = null;
      scene.addEventListener('mousedown', ev => {
        if (ev.button !== 0) return;
        drag = { x: ev.clientX, y: ev.clientY, rx: st.grot.rx, ry: st.grot.ry };
        scene.classList.add('dragging');
      });
      window.addEventListener('mousemove', onDragMove);
      window.addEventListener('mouseup', onDragUp);
      function onDragMove(ev) {
        if (!drag) return;
        st.grot.ry = drag.ry + (ev.clientX - drag.x) * .55;
        st.grot.rx = Math.max(-70, Math.min(70, drag.rx - (ev.clientY - drag.y) * .45));
        paint();
      }
      function onDragUp() { if (drag) { drag = null; scene.classList.remove('dragging'); } }
      scene.addEventListener('wheel', ev => {
        ev.preventDefault();
        st.grot.z = Math.max(.5, Math.min(1.9, st.grot.z * (ev.deltaY > 0 ? .9 : 1.1)));
        paint();
      }, { passive: false });
      window.addEventListener('resize', paint);
      netCleanupRef = () => {
        window.removeEventListener('mousemove', onDragMove);
        window.removeEventListener('mouseup', onDragUp);
        window.removeEventListener('resize', paint);
        if (st.graf) { cancelAnimationFrame(st.graf); st.graf = null; }
      };

      paint();
      const tick = () => {
        if (!galaxy.isConnected) { st.graf = null; return; }
        if (st.gauto && !drag) { st.grot.ry += .12; paint(); }
        st.graf = requestAnimationFrame(tick);
      };
      st.graf = requestAnimationFrame(tick);
    }

    function renderMain() {
      /* 关系网的拖拽/自动旋转监听是挂在 window 上的，整块重画前先解掉，免得越积越多 */
      if (netCleanupRef) { netCleanupRef(); netCleanupRef = null; }
      clear(main);
      const c = getChar();
      if (!c) { main.appendChild(h('div', { class: 'empty' }, '左边还没有人物')); return; }
      if (st.mode === 'show') { renderShowcase(); return; }
      if (st.mode === 'detail') { renderDetail(); return; }
      const plane = doc.planes[0] || { realms: [] };

      /* ---- hero ---- */
      const pt = h('div', { class: 'pt', 'data-probe': 'portrait' });
      if (c.portrait) {
        const img = h('img', { alt: c.name });
        window.nf.image.absolute(c.portrait).then(url => { img.src = url; });
        pt.appendChild(img);
      } else {
        pt.appendChild(h('div', { class: 'ph' },
          h('div', { class: 'gl' }, c.name),
          h('div', { class: 'ptxt' }, '尚 未 立 绘')));
      }
      pt.appendChild(h('div', { class: 'tools' },
        h('button', { class: 'btn xs', onclick: () => genImage(c) }, '✧ 去生图'),
        h('button', { class: 'btn xs', onclick: () => uploadPortrait(c) }, '上传'),
        h('button', { class: 'btn xs', onclick: () => pastePortrait(c) }, '粘贴')));

      const info = h('div', { class: 'info' },
        h('div', { class: 'nameline' },
          h('h1', {}, c.name),
          h('span', { class: 'pill ' + (c.portrait ? 'jade' : 'grey') }, c.portrait ? '已有立绘' : '文字占位'),
          h('span', { class: 'grow' }),
          h('button', { class: 'btn xs', onclick: () => renameChar(c) }, '改名'),
          h('button', { class: 'btn xs', onclick: () => openGenModal(c) }, '✧ 生成立绘'),
          h('button', { class: 'btn xs danger', 'data-probe': 'char-delete', title: '删除这个人物（相关引用会一并清理，并留一份在废案篓里）', onclick: () => removeChar(c) }, '⌫ 删除')),
        h('div', { class: 'fgrid' },
          fieldChar(editableLabel(c, 'age', 'label-age'), 'age', { ph: '十九', probe: 'char-age' }),
          fieldChar(editableLabel(c, 'identity', 'label-identity'), 'identity', { ph: '临水剑冢 · 第三峰首徒', probe: 'char-identity' }),
          fieldChar(editableLabel(c, 'realm', 'label-realm'), 'realm', { ph: '练气九层', probe: 'char-realm', list: (plane.realms || []).map(r => r.name) }),
          h('div', { class: 'field' }, editableLabel(c, 'group', 'label-group'), groupSelect(c))),
        fieldChar(editableLabel(c, 'persona', 'label-persona'), 'persona', { area: true, ph: '一句话说清这个人' }),
        h('div', { class: 'endbar' },
          editableLabel(c, 'ending', 'label-ending'),
          fieldChar(null, 'ending', { area: false, ph: '他最后怎么了' }).lastChild));
      main.appendChild(h('div', { class: 'hero' }, pt, info));

      /* ---- relations ---- */
      if ((c.relations || []).length) {
        main.appendChild(h('div', { class: 'relrow' },
          h('span', { class: 'tiny muted' }, '相关人物'),
          ...c.relations.map(r => {
            const t = doc.characters.find(x => x.id === r.targetId);
            if (!t) return null;
            return h('span', { class: 'chip', onclick: () => { st.id = t.id; st.selPlot = null; renderList(); renderMain(); } },
              h('i', { style: { background: t.color } }, t.name.slice(0, 1)), t.name, h('small', {}, r.label || ''));
          })));
      }

      /* ---- timeline ----
       * 这个人物的情节节点，画法/手感都跟情节页那条轴对齐：
       *   · 拖动圆点 → 改时间点（跟手走、松手才落库，别的节点不动）；
       *   · 轴上空白处双击 → 在这个刻度新建一条（默认把当前人物算进相关人物）；
       *   · 点一下选中看详情，再点一下正在选中的圆点 = 打开编辑框。
       * 数据是同一份 doc.plots，人物页改完情节页那边立刻就是新的。 */
      const mine = doc.plots
        .filter(p => (p.characterIds || []).includes(c.id))
        .slice().sort((a, b) => tpNum(a) - tpNum(b));
      const maxT = Math.max(1, ...doc.plots.map(tpNum));
      const track = h('div', { class: 'track', 'data-probe': 'timeline' });
      track.appendChild(h('div', { class: 'axis' }));
      /* 同一刻度上挤了好几条时往右错开一点，名字才不会叠成一团（和情节页的 MIN_GAP 一个意思） */
      const MIN_GAP = 2.2;
      const spots = [];
      const tickOf = p => {
        let x = 2 + (Math.min(maxT, Math.max(0, tpNum(p))) / maxT) * 94;
        spots.forEach(q => { if (Math.abs(q - x) < MIN_GAP) x = Math.min(97, q + MIN_GAP); });
        spots.push(x);
        const cls = p.status === 'ending' ? 'ending' : p.status === 'later' ? 'later' : 'done';
        const tick = h('div', {
          class: 'tick ' + cls + (st.selPlot === p.id ? ' on' : ''),
          style: { left: x.toFixed(2) + '%' },
          dataset: { plot: p.id },
          title: (p.title || '未命名') + ' · 时间点 ' + fmtTp(tpNum(p)) + '（拖动改时间点 · 再点一下编辑）',
          onclick: () => {
            if (suppressClick) { suppressClick = false; return; }
            if (st.selPlot === p.id) { openPlotForm(p); return; }
            st.selPlot = p.id; renderMain();
          },
          onmousedown: ev => startTickDrag(ev, p, tick)
        }, h('b', {}, p.title), h('s', {}, p.chapter || ''));
        return tick;
      };
      mine.forEach(p => track.appendChild(tickOf(p)));
      /* 空白处双击 = 在这个刻度新建（只认轴那条带子，双击名字/标签不算） */
      track.addEventListener('dblclick', ev => {
        if (ev.target.closest('.tick')) return;
        openPlotForm(null, { timePoint: timeAt(track, ev.clientX, maxT), charId: c.id });
      });
      main.appendChild(h('div', { class: 'card tlcard' },
        h('div', { class: 'tlhead' },
          h('h3', {}, '情节时间轴'),
          h('span', { class: 'legend' }, h('i', { style: { background: '#2F6F63' } }), '已发生'),
          h('span', { class: 'legend' }, h('i', { style: { background: '#C9973C', border: '1px dashed #C9973C' } }), '后续计划'),
          h('span', { class: 'legend' }, h('i', { style: { background: '#A8322A' } }), '结局'),
          h('span', { class: 'grow' }),
          h('button', { class: 'btn xs', title: '新建一条和这个人物有关的情节', onclick: () => openPlotForm(null, { charId: c.id }) }, '＋ 情节'),
          h('button', { class: 'btn xs', onclick: () => NF.go('plot') }, '在情节页管理 ›')),
        track,
        h('div', { class: 'tiny muted', style: { paddingBottom: '6px' } }, mine.length
          ? '共 ' + mine.length + ' 个节点 · 拖圆点改时间点 · 双击轴空白处新建 · 点圆点看详情'
          : '这个人物还没有情节节点：双击上面的轴就能新建一条')));

      /* ---- detail ---- */
      const sel = mine.find(p => p.id === st.selPlot) || mine.find(p => p.status === 'done') || mine[0];
      if (sel) {
        main.appendChild(h('div', { class: 'card detail', 'data-probe': 'detail' },
          h('div', { class: 'dhead' },
            h('h3', {}, (sel.chapter ? sel.chapter + ' · ' : '') + sel.title),
            h('span', { class: 'pill ' + (STATUS[sel.status] || {}).cls }, (STATUS[sel.status] || {}).label || sel.status),
            h('span', { class: 'grow' }),
            h('button', { class: 'btn xs', onclick: () => openPlotForm(sel) }, '编辑情节'),
            h('button', { class: 'btn xs pri', onclick: () => NF.go('chapter') }, '跳转正文')),
          h('p', {}, sel.summary || '（还没有写摘要）'),
          h('div', { class: 'dmeta' },
            h('span', {}, '地点：', h('b', {}, sel.place || '—')),
            h('span', {}, '相关人物：', h('b', {}, (sel.characterIds || []).map(id => (doc.characters.find(x => x.id === id) || {}).name).filter(Boolean).join(' · ') || '—')),
            h('span', {}, '章节：', h('b', {}, sel.chapter || '—')))));
      }
      main.setAttribute('data-char', c.name);
    }

    async function uploadPortrait(c) {
      try {
        const r = await window.nf.image.pickPortrait(c.id);
        if (r.canceled) return;
        if (r.portrait) c.portrait = r.portrait;
        NF.save();
        renderList(); renderMain(); toast('立绘已更新', 'ok');
      } catch (e) { toast(e.message, 'err'); }
    }
    async function pastePortrait(c) {
      try {
        const r = await window.nf.image.pastePortrait(c.id);
        if (r && r.portrait) c.portrait = r.portrait;
        NF.save();
        renderList(); renderMain(); toast('已从剪贴板粘贴立绘', 'ok');
      } catch (e) { toast(e.message || '剪贴板里没有图片', 'err'); }
    }
    function buildPrompt(c) {
      const im = (doc.settings && doc.settings.image) || {};
      const base = [c.name, c.age ? c.age + '岁' : '', c.identity, c.persona].filter(Boolean).join('，');
      return base + '。' + (im.style || '国风写实，水墨质感') + '。竖构图，半身像，' + (im.size || '768x1024') + '，无文字';
    }
    function genImage(c) {
      const prompt = buildPrompt(c);
      const im = (doc.settings && doc.settings.image) || {};
      window.nf.clip.write(prompt).then(() => toast('提示词已复制', 'ok')).catch(() => {});
      try { window.nf.image.openExternal(im.url || 'https://jimeng.jianying.com/ai-tool/home'); } catch (e) {}
      toast('已打开生图网站，提示词在剪贴板里，粘贴即可', 'ok');
    }
    function openGenModal(c) {
      const im = (doc.settings && doc.settings.image) || {};
      const ta = h('textarea', { class: 'ta', style: { minHeight: '96px', fontSize: '12px' } }, buildPrompt(c));
      const sizeSel = h('select', { class: 'select' }, ['768x1024', '832x1216', '1024x1024'].map(s => h('option', { value: s, selected: s === (im.size || '768x1024') }, s)));
      const urlIn = h('input', { class: 'input', value: im.url || '' });
      const m = modal({
        title: '为「' + c.name + '」生成立绘', width: '640px',
        body: h('div', { class: 'col' },
          h('div', { class: 'genbox' }, '流程：① 点「复制提示词并打开网站」② 在生图网站里粘贴提示词出图 ③ 把图存到本地 ④ 回来点下面的「上传本地图」设成立绘。'),
          h('div', { class: 'field' }, h('label', {}, '提示词（可改）'), ta),
          h('div', { class: 'row' },
            h('div', { class: 'field', style: { flex: '1' } }, h('label', {}, '尺寸'), sizeSel),
            h('div', { class: 'field', style: { flex: '2' } }, h('label', {}, '生图网站地址'), urlIn))),
        okText: '复制提示词并打开', cancelText: '关闭',
        onOk: async () => {
          doc.settings = doc.settings || {};
          doc.settings.image = Object.assign({}, im, { url: urlIn.value, size: sizeSel.value });
          NF.save();
          try { await window.nf.clip.write(ta.value); } catch (e) {}
          try { await window.nf.image.openExternal(urlIn.value); } catch (e) { toast(e.message, 'err'); }
          toast('提示词已复制，网站已打开', 'ok');
        }
      });
      m.body.appendChild(h('div', { class: 'row', style: { marginTop: '10px' } },
        h('button', { class: 'btn jade', onclick: async () => { m.close(); await uploadPortrait(c); } }, '上传本地图'),
        h('button', { class: 'btn', onclick: async () => { m.close(); await pastePortrait(c); } }, '从剪贴板粘贴')));
    }
    function renameChar(c) {
      const i = h('input', { class: 'input', value: c.name });
      modal({ title: '改名', body: h('div', { class: 'field' }, h('label', {}, '姓名'), i), okText: '保存',
        onOk: () => { const v = i.value.trim(); if (!v) return false; c.name = v; touch(); renderList(); renderMain(); } });
    }
    /* ---------------- 删除人物 ----------------
     * 人物不算孤立的条目：情节、宗门、别的角色的"相关人物"都按 id 指着它。
     * 直接 splice 掉会留下指向空 id 的引用（时间轴少节点、宗门列表里出现空位之类），
     * 所以这里一次性把引用清干净，删之前先把影响算出来给作者看。
     * 删掉的人物进「废案篓」（和情节一样），90 天内可以找回。 */
    function refsOf(c) {
      const plots = (doc.plots || []).filter(p => (p.characterIds || []).includes(c.id));
      const sects = [];
      (doc.planes || []).forEach(pl => (pl.sects || []).forEach(s => {
        if ((s.characterIds || []).includes(c.id)) sects.push({ plane: pl, sect: s });
      }));
      const rels = [];
      (doc.characters || []).forEach(other => {
        if (other.id === c.id) return;
        (other.relations || []).forEach(r => { if (r.targetId === c.id) rels.push({ other, rel: r }); });
      });
      return { plots, sects, rels };
    }

    /* 把一个人物从数据里摘掉，返回影响清单 */
    function purgeChar(c) {
      const refs = refsOf(c);
      doc.characters = doc.characters.filter(x => x.id !== c.id);
      refs.plots.forEach(p => { p.characterIds = (p.characterIds || []).filter(id => id !== c.id); });
      refs.sects.forEach(({ sect }) => { sect.characterIds = (sect.characterIds || []).filter(id => id !== c.id); });
      refs.rels.forEach(({ other, rel }) => { other.relations = (other.relations || []).filter(r => r !== rel); });
      /* 自己身上的关系随人物一起删，不留悬空引用 */
      return refs;
    }

    function removeChar(c) {
      if (!c) return;
      const refs = refsOf(c);
      const relTxt = refs.rels.map(({ other, rel }) => other.name + (rel.label ? '（' + rel.label + '）' : ''));
      const sectTxt = refs.sects.map(({ plane, sect }) => sect.name + (plane && plane.name ? ' · ' + plane.name : ''));
      const affected = refs.plots.length + refs.sects.length + refs.rels.length;
      const body = h('div', { class: 'col', style: { gap: '9px' } },
        h('div', { class: 'small', style: { lineHeight: '1.8' } },
          '把人物「', h('b', {}, c.name), '」从这本书里删掉？'),
        h('div', { class: 'card', style: { padding: '9px 12px', background: '#FBF3E6', borderColor: '#E0C79B' } },
          h('div', { class: 'tiny muted', style: { letterSpacing: '.1em', marginBottom: '4px' } }, '会一起处理'),
          h('div', { class: 'del-list' },
            h('div', {}, '人物资料、立绘引用：', h('b', {}, '删除')),
            h('div', {}, '情节节点里的相关人物：', h('b', {}, refs.plots.length + ' 条'), ' 会自动去掉这个名字' +
              (refs.plots.length ? '（情节本身保留）' : '')),
            h('div', {}, '宗门成员：', h('b', {}, refs.sects.length + ' 处'), ' 会从这个人物身上解除关联'),
            h('div', {}, '别的人物对他的关系：', h('b', {}, refs.rels.length + ' 条'), ' 会一并移除'),
            refs.plots.length ? h('div', { class: 'del-none', style: { paddingLeft: '2px' } }, '涉及：' + refs.plots.slice(0, 6).map(p => p.title || '未命名').join(' · ') + (refs.plots.length > 6 ? ' 等' : '')) : null,
            sectTxt.length ? h('div', { class: 'del-none', style: { paddingLeft: '2px' } }, '宗门：' + sectTxt.join(' · ')) : null,
            relTxt.length ? h('div', { class: 'del-none', style: { paddingLeft: '2px' } }, '关系：' + relTxt.join(' · ')) : null)),
        h('div', { class: 'tiny muted', style: { lineHeight: '1.8' } },
          '删掉的人会先放进「情节」页的废案篓（人物分类），那儿可以找回；按 Ctrl+Z 也能撤销这一步。'),
        h('div', { class: 'tiny', style: { color: '#A8322A' } }, affected ? '请确认：以上 ' + affected + ' 处引用都会被改写。' : '没有其他内容引用这个人物。'));
      modal({
        title: '删除人物', width: '520px', body,
        okText: '删除「' + c.name + '」',
        onOk: () => {
          const idxBefore = Math.max(0, doc.characters.findIndex(x => x.id === c.id));
          purgeChar(c);
          /* 先记一笔废案：字段和"情节待恢复"用同一套结构，情节页的废案篓直接就能显示 */
          doc.scraps = doc.scraps || [];
          doc.scraps.unshift({
            id: uid('x'), kind: 'character', title: c.name,
            origin: groupOf(c) + ' · ' + (c.identity || '未填身份'),
            reason: '手动删除',
            removedAt: new Date().toISOString(),
            summary: (c.persona || c.identity || '（没有填人设）') + (c.age ? ' · ' + c.age : ''),
            payload: JSON.parse(JSON.stringify(c))
          });
          /* 选中项挪到原位置的下一个人（删的是最后一个就往上找） */
          const next = doc.characters[Math.min(idxBefore, doc.characters.length - 1)];
          st.id = next ? next.id : null;
          st.selPlot = null;
          touch();
          renderList(); renderMain();
          toast('已删除「' + c.name + '」' + (affected ? '，' + affected + ' 处引用已处理' : '') + ' · 可在废案篓找回', 'ok');
        }
      });
    }

    function addChar() {
      /* 新人物默认落在「当前选中的那个人的分类」里：连着建同组人物时不用每次改分类 */
      const cur = getChar();
      const c = {
        id: uid('c'), name: '新人物', aliases: [], age: '', identity: '', realm: '', persona: '', ending: '',
        group: (cur && cur.group) || GROUP_DEFAULT, color: '#2F6F63', portrait: null, relations: []
      };
      doc.characters.push(c); st.id = c.id; st.selPlot = null; touch(); renderList(); renderMain();
      setTimeout(() => renameChar(c), 50);
    }
    /* ---------------- 新建 / 编辑情节 ----------------
     * 人物页这边也要能改「时间点」和「相关人物」，所以字段和情节页的表单对齐：
     * 情节名 / 章节 / 时间点 / 状态 / 地点 / 摘要 / 相关人物。
     * preset.timePoint 是双击轴上空白处落下来的刻度，preset.charId 是当前人物（默认算在场）。
     * 不去碰 lane（属于哪条暗线）这类人物页管不到的字段，编辑时原样保留。 */
    function openPlotForm(p, preset) {
      const isNew = !p;
      const c = getChar();
      /* 新建时时间点默认接在这个人物最后一条情节后面（双击轴的话用落点刻度） */
      const dftTp = preset && typeof preset.timePoint === 'number'
        ? preset.timePoint
        : Math.round(Math.max(0, ...(doc.plots || [])
          .filter(q => c && (q.characterIds || []).includes(c.id)).map(tpNum))) + 1;
      const seed = isNew ? {
        title: '', summary: '', place: '', chapter: '', status: 'later',
        timePoint: dftTp,
        characterIds: preset && preset.charId ? [preset.charId] : (c ? [c.id] : [])
      } : p;
      const ids = (seed.characterIds || []).slice();
      const titleIn = h('input', { class: 'input', value: seed.title || '', placeholder: '例如：雪夜断桥' });
      const chapSel = h('select', { class: 'select' },
        [h('option', { value: '' }, '（不指定章节）')].concat(
          (doc.manuscripts || []).map(m => h('option', { value: m.title, selected: m.title === (seed.chapter || '') }, m.title))));
      /* 老数据里的章节名可能不在稿件列表里：补一条，别把已有值弄丢 */
      if (seed.chapter && !(doc.manuscripts || []).some(m => m.title === seed.chapter)) {
        chapSel.appendChild(h('option', { value: seed.chapter, selected: true }, seed.chapter + '（原有，未对上稿件）'));
      }
      const tpIn = h('input', { class: 'input', type: 'number', min: '0', step: '1', value: String(fmtTp(seed.timePoint) === '—' ? 0 : fmtTp(seed.timePoint)) });
      const statusSel = h('select', { class: 'select' },
        Object.keys(STATUS).map(k => h('option', { value: k, selected: k === (seed.status || 'later') }, (STATUS[k] || {}).label || k)));
      const placeIn = h('input', { class: 'input', value: seed.place || '', placeholder: '例如：临水 · 断桥' });
      const sumTa = h('textarea', { class: 'ta', style: { minHeight: '72px' } }, seed.summary || '');
      const pick = h('div', { class: 'relrow' });
      if (!(doc.characters || []).length) pick.appendChild(h('span', { class: 'small muted' }, '还没有人物'));
      (doc.characters || []).forEach(cc => {
        const on = ids.indexOf(cc.id) >= 0;
        const chip = h('span', { class: 'chip' + (on ? ' on' : ''), title: '点一下加入 / 移出相关人物' },
          h('i', { style: { background: cc.color || '#2F6F63' } }, cc.name.slice(0, 1)), cc.name);
        chip.addEventListener('click', () => {
          const i = ids.indexOf(cc.id);
          if (i >= 0) { ids.splice(i, 1); chip.classList.remove('on'); }
          else { ids.push(cc.id); chip.classList.add('on'); }
        });
        pick.appendChild(chip);
      });
      const dlg = modal({
        title: isNew ? '新建情节' : '编辑情节', width: '660px',
        body: h('div', { class: 'col', style: { gap: '9px' } },
          h('div', { class: 'field' }, h('label', {}, '情节名'), titleIn),
          h('div', { class: 'row', style: { gap: '10px' } },
            h('div', { class: 'field', style: { flex: '2' } }, h('label', {}, '章节（对应章节写作里的稿件）'), chapSel),
            h('div', { class: 'field', style: { flex: '0.8' } }, h('label', {}, '时间点'), tpIn),
            h('div', { class: 'field', style: { flex: '1' } }, h('label', {}, '状态'), statusSel)),
          h('div', { class: 'field' }, h('label', {}, '地点'), placeIn),
          h('div', { class: 'field' }, h('label', {}, '摘要'), sumTa),
          h('div', { class: 'field' }, h('label', {}, '相关人物'), pick),
          h('div', { class: 'tiny muted' },
            '时间点 = 情节在这条轴上的位置（整数刻度）；也可以直接拖轴上的圆点，松手即按落点改。')),
        okText: isNew ? '新建' : '保存',
        onOk: () => {
          const title = titleIn.value.trim();
          if (!title) { toast('请填写情节名', 'err'); return false; }
          const tpRaw = Number(tpIn.value);
          const patch = {
            title, summary: sumTa.value.trim(), place: placeIn.value.trim(),
            chapter: chapSel.value || '', chapterNo: chNo(chapSel.value || ''),
            status: statusSel.value,
            timePoint: isFinite(tpRaw) ? Math.max(0, Math.round(tpRaw)) : 0,
            characterIds: ids.slice()
          };
          if (isNew) {
            const np = Object.assign({ id: uid('g'), lane: '' }, patch);
            doc.plots.push(np);
            st.selPlot = np.id;
          } else {
            Object.assign(p, patch);
            st.selPlot = p.id;
          }
          touch(); renderMain();
          toast(isNew ? '已新建情节节点（时间点 ' + fmtTp(patch.timePoint) + '）' : '情节已保存', 'ok');
        }
      });
      titleIn.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); const b = dlg.box.querySelector('.modal-f .btn.pri'); if (b) b.click(); }
      });
      setTimeout(() => titleIn.focus(), 40);
    }

    renderList(); renderMain();
    const onKey = e => {
      if (e.key === 'Escape') { st.selPlot = null; return; }
      if (st.mode !== 'show') return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      /* 输入框里打字时别抢方向键 */
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      const card = main.querySelector('[data-probe="show-card"]');
      if (card && card.__flipBy) { e.preventDefault(); card.__flipBy(e.key === 'ArrowRight' ? 1 : -1); }
    };
    window.addEventListener('keydown', onKey);
    this._cleanup = () => {
      window.removeEventListener('keydown', onKey);
      if (netCleanupRef) { netCleanupRef(); netCleanupRef = null; }
    };
  }
};
