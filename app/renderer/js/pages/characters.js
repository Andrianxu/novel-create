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
/* 年龄 / 身份 / 目前修为：鼠标移上去时标签后面浮出一个小笔，点标签也能把光标送进输入框 */
.fgrid .field.editable>label{cursor:pointer}
.fgrid .field.editable>label:hover{color:#8A6421}
.fgrid .field.editable>label::after{content:'✎';margin-left:5px;font-size:9px;color:#B98A3C;opacity:0;transition:opacity .12s}
.fgrid .field.editable:hover>label::after{opacity:.75}
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
`);

export default {
  id: 'characters', label: '人物',
  statusText(doc) { return '人物 ' + doc.characters.length + ' · 情节节点 ' + doc.plots.length; },
  unmount() { if (this._cleanup) { this._cleanup(); this._cleanup = null; } },
  mount(root, ctx) {
    const { doc, params, NF } = ctx;
    const st = { id: params.id || (doc.characters[0] && doc.characters[0].id) || null, q: '', selPlot: null };
    const wrap = h('div', { class: 'cwrap' });
    const aside = h('aside', { class: 'clist', 'data-probe': 'charlist' });
    const main = h('main', { class: 'cmain', 'data-probe': 'charmain' });
    wrap.appendChild(aside); wrap.appendChild(main); root.appendChild(wrap);

    const getChar = () => doc.characters.find(c => c.id === st.id);
    const touch = () => { NF.save(); };

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
          list.appendChild(h('div', { class: 'crow' + (c.id === st.id ? ' on' : ''), 'data-char-row': c.id, onclick: () => { st.id = c.id; st.selPlot = null; renderList(); renderMain(); } },
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
     * 标签也绑了 focus —— 有人习惯先点「年龄」两个字，现在点完光标就在框里。 */
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
      const lab = h('label', { title: label ? '点一下就能改，改完自动保存' : '' }, label);
      if (label) {
        lab.addEventListener('click', () => {
          input.focus();
          try { const n = input.value.length; input.setSelectionRange(n, n); } catch (e) {}
        });
      }
      input.addEventListener('input', () => { c[key] = input.value; touch(); });
      const box = h('div', { class: 'field' + (label ? ' editable' : '') }, lab, input);
      if (o.list) {
        const dl = h('datalist', { id: 'dl-' + key }, o.list.map(x => h('option', { value: x })));
        input.setAttribute('list', 'dl-' + key);
        box.appendChild(dl);
      }
      return box;
    }

    function renderMain() {
      clear(main);
      const c = getChar();
      if (!c) { main.appendChild(h('div', { class: 'empty' }, '左边还没有人物')); return; }
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
          fieldChar('年龄', 'age', { ph: '十九', probe: 'char-age' }),
          fieldChar('身份', 'identity', { ph: '临水剑冢 · 第三峰首徒', probe: 'char-identity' }),
          fieldChar('目前修为', 'realm', { ph: '练气九层', probe: 'char-realm', list: (plane.realms || []).map(r => r.name) }),
          h('div', { class: 'field' }, h('label', {}, '分类'), groupSelect(c))),
        fieldChar('人设', 'persona', { area: true, ph: '一句话说清这个人' }),
        h('div', { class: 'endbar' },
          h('span', { class: 'tiny muted', style: { letterSpacing: '.1em', marginRight: '8px' } }, '最终结局'),
          fieldChar('', 'ending', { area: false, ph: '他最后怎么了' }).lastChild));
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
    const onKey = e => { if (e.key === 'Escape') st.selPlot = null; };
    window.addEventListener('keydown', onKey);
    this._cleanup = () => window.removeEventListener('keydown', onKey);
  }
};
