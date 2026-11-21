import { h, clear, toast, modal, injectStyle, uid, debounce, STATUS, words } from '../util.js';

injectStyle('characters', `
.cwrap{display:flex;width:100%;min-width:0}
.clist{width:236px;flex:none;background:#F1EADA;border-right:1px solid #DFD4BF;display:flex;flex-direction:column;padding:10px 9px;gap:3px;overflow:auto}
.cllist{flex:1;min-height:0;display:flex;flex-direction:column;gap:2px}
.cgroup{font-size:9.5px;letter-spacing:.12em;color:#8C8272;padding:8px 6px 3px}
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
.endbar{font-size:12px;line-height:1.55;background:#F6EEDC;border:1px solid #E2D3B5;border-radius:8px;padding:7px 10px}
.tlcard{padding:10px 14px 4px}
.tlhead{display:flex;align-items:center;gap:10px;font-size:12px}
.tlhead h3{font-size:13px;margin:0}
.legend{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;color:#5B5348}
.legend i{width:7px;height:7px;border-radius:50%;display:inline-block}
.track{position:relative;height:118px;margin-top:6px}
.axis{position:absolute;left:0;right:0;top:70px;height:2px;background:linear-gradient(90deg,#2F6F63,#B98A3C 62%,#A8322A);border-radius:2px}
.tick{position:absolute;top:70px;width:11px;height:11px;margin-left:-5.5px;margin-top:-4.5px;border-radius:50%;background:#FFFCF5;border:2px solid #2F6F63;cursor:pointer}
.tick.done{background:#2F6F63}
.tick.later{border-style:dashed;border-color:#C9973C;background:#FFFCF5}
.tick.ending{background:#A8322A;border-color:#A8322A;width:13px;height:13px;margin-left:-6.5px;margin-top:-5.5px}
.tick.on{box-shadow:0 0 0 4px rgba(47,111,99,.2)}
.tick b{position:absolute;left:50%;transform:translateX(-50%);top:-19px;font-size:10px;font-weight:400;color:#201C18;white-space:nowrap}
.tick s{position:absolute;left:50%;transform:translateX(-50%);top:12px;font-size:9px;color:#8C8272;text-decoration:none;white-space:nowrap}
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

    function renderList() {
      clear(aside);
      aside.appendChild(h('div', { class: 'row', style: { padding: '0 4px 2px' } },
        h('div', { style: { fontSize: '12px', fontWeight: '700' } }, '人物 · ' + doc.characters.length),
        h('div', { class: 'grow' }),
        h('button', { class: 'btn xs', onclick: addChar }, '＋ 新建')));
      const search = h('input', { class: 'input', placeholder: '搜索姓名 / 别名', value: st.q, style: { height: '28px', fontSize: '11.5px' } });
      search.addEventListener('input', () => { st.q = search.value; renderList(); });
      aside.appendChild(search);
      const list = h('div', { class: 'cllist' });
      const groups = {};
      doc.characters.filter(c => !st.q || c.name.includes(st.q) || (c.aliases || []).some(a => a.includes(st.q)))
        .forEach(c => { (groups[c.group || '未分组'] = groups[c.group || '未分组'] || []).push(c); });
      for (const g in groups) {
        list.appendChild(h('div', { class: 'cgroup' }, g.toUpperCase()));
        groups[g].forEach(c => {
          const hasP = !!c.portrait;
          list.appendChild(h('div', { class: 'crow' + (c.id === st.id ? ' on' : ''), onclick: () => { st.id = c.id; st.selPlot = null; renderList(); renderMain(); } },
            h('div', { class: 'avatar', style: { width: '28px', height: '28px', background: c.color || '#2F6F63', fontSize: '13px' } }, c.name.slice(0, 1)),
            h('div', { style: { minWidth: 0 } },
              h('b', {}, c.name),
              h('small', {}, (c.identity || '未填身份').slice(0, 12) + (hasP ? '' : ' · 无立绘')))));
        });
      }
      if (!doc.characters.length) list.appendChild(h('div', { class: 'empty' }, '还没有人物，点右上角新建'));
      aside.appendChild(list);
      aside.appendChild(h('div', { class: 'genbox', style: { marginTop: 'auto', fontSize: '10.5px' } },
        '没有立绘的人物会自动用楷体名字占位。点立绘下方的「去生图」可以跳到生图网站，画好存回本地再点「上传」即可。'));
    }

    function fieldChar(label, key, opts) {
      const c = getChar();
      const input = h(opts && opts.area ? 'textarea' : 'input', {
        class: opts && opts.area ? 'ta' : 'input',
        value: c[key] || '',
        placeholder: (opts && opts.ph) || '',
        style: opts && opts.area ? { minHeight: '52px', fontSize: '12px' } : { fontSize: '12.5px' }
      });
      if (opts && opts.list) {
        const dl = h('datalist', { id: 'dl-' + key }, opts.list.map(x => h('option', { value: x })));
        input.setAttribute('list', 'dl-' + key);
        input.addEventListener('input', () => { c[key] = input.value; touch(); });
        return h('div', { class: 'field' }, h('label', {}, label), input, dl);
      }
      input.addEventListener('input', () => { c[key] = input.value; touch(); });
      return h('div', { class: 'field' }, h('label', {}, label), input);
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
          h('button', { class: 'btn xs', onclick: () => openGenModal(c) }, '✧ 生成立绘')),
        h('div', { class: 'fgrid' },
          fieldChar('年龄', 'age', { ph: '十九' }),
          fieldChar('身份', 'identity', { ph: '临水剑冢 · 第三峰首徒' }),
          fieldChar('目前修为', 'realm', { ph: '练气九层', list: (plane.realms || []).map(r => r.name) }),
          fieldChar('分组', 'group', { ph: '主线' })),
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

      /* ---- timeline ---- */
      const mine = doc.plots.filter(p => (p.characterIds || []).includes(c.id));
      const all = doc.plots.slice().sort((a, b) => (a.timePoint || 0) - (b.timePoint || 0));
      const maxT = Math.max(1, ...all.map(p => p.timePoint || 0));
      const track = h('div', { class: 'track', 'data-probe': 'timeline' });
      track.appendChild(h('div', { class: 'axis' }));
      mine.forEach(p => {
        const left = Math.round(((p.timePoint || 1) / maxT) * 94) + 2;
        const cls = p.status === 'ending' ? 'ending' : p.status === 'later' ? 'later' : 'done';
        track.appendChild(h('div', {
          class: 'tick ' + cls + (st.selPlot === p.id ? ' on' : ''),
          style: { left: left + '%' },
          onclick: () => { st.selPlot = p.id; renderMain(); },
          title: p.title
        }, h('b', {}, p.title), h('s', {}, p.chapter || '')));
      });
      main.appendChild(h('div', { class: 'card tlcard' },
        h('div', { class: 'tlhead' },
          h('h3', {}, '情节时间轴'),
          h('span', { class: 'legend' }, h('i', { style: { background: '#2F6F63' } }), '已发生'),
          h('span', { class: 'legend' }, h('i', { style: { background: '#C9973C', border: '1px dashed #C9973C' } }), '后续计划'),
          h('span', { class: 'legend' }, h('i', { style: { background: '#A8322A' } }), '结局'),
          h('span', { class: 'grow' }),
          h('button', { class: 'btn xs', onclick: () => NF.go('plot') }, '在情节页管理 ›')),
        track,
        h('div', { class: 'tiny muted', style: { paddingBottom: '6px' } }, mine.length ? '共 ' + mine.length + ' 个节点 · 点圆点看详情' : '这个人物还没有情节节点')));

      /* ---- detail ---- */
      const sel = mine.find(p => p.id === st.selPlot) || mine.find(p => p.status === 'done') || mine[0];
      if (sel) {
        main.appendChild(h('div', { class: 'card detail', 'data-probe': 'detail' },
          h('div', { class: 'dhead' },
            h('h3', {}, (sel.chapter ? sel.chapter + ' · ' : '') + sel.title),
            h('span', { class: 'pill ' + (STATUS[sel.status] || {}).cls }, (STATUS[sel.status] || {}).label || sel.status),
            h('span', { class: 'grow' }),
            h('button', { class: 'btn xs', onclick: () => editPlot(sel) }, '编辑情节'),
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
    function addChar() {
      const c = { id: uid('c'), name: '新人物', aliases: [], age: '', identity: '', realm: '', persona: '', ending: '', group: '主线', color: '#2F6F63', portrait: null, relations: [] };
      doc.characters.push(c); st.id = c.id; st.selPlot = null; touch(); renderList(); renderMain();
      setTimeout(() => renameChar(c), 50);
    }
    function editPlot(p) {
      const t = h('input', { class: 'input', value: p.title });
      const s = h('textarea', { class: 'ta', style: { minHeight: '80px' } }, p.summary || '');
      const pl = h('input', { class: 'input', value: p.place || '' });
      modal({ title: '编辑情节', width: '560px',
        body: h('div', { class: 'col' },
          h('div', { class: 'field' }, h('label', {}, '情节名'), t),
          h('div', { class: 'field' }, h('label', {}, '摘要'), s),
          h('div', { class: 'field' }, h('label', {}, '地点'), pl)),
        okText: '保存',
        onOk: () => { p.title = t.value; p.summary = s.value; p.place = pl.value; touch(); renderMain(); } });
    }

    renderList(); renderMain();
    const onKey = e => { if (e.key === 'Escape') st.selPlot = null; };
    window.addEventListener('keydown', onKey);
    this._cleanup = () => window.removeEventListener('keydown', onKey);
  }
};
