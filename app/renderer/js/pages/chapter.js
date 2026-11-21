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

    function renderSide() {
      clear(side);
      side.appendChild(h('div', { class: 'row', style: { padding: '0 4px 6px' } },
        h('div', { style: { fontSize: '12px', fontWeight: '700' } }, '正文'),
        h('div', { class: 'grow' }),
        h('button', { class: 'btn xs', onclick: addVolume }, '＋ 卷')));
      doc.chapters.forEach(v => {
        side.appendChild(h('div', { class: 'ch-vol' + (v.id === st.vol ? ' on' : ''), onclick: () => { st.vol = v.id; renderSide(); } },
          h('span', {}, v.title),
          h('small', {}, (doc.manuscripts.filter(m => m.volumeId === v.id).length) + ' 篇')));
        if (v.id === st.vol) {
          doc.manuscripts.filter(m => m.volumeId === v.id).forEach(m => {
            side.appendChild(h('div', { class: 'ch-doc' + (m.id === st.id ? ' on' : ''), onclick: () => { st.id = m.id; renderSide(); renderMain(); } },
              h('span', { class: 'grow' }, m.title || '未命名'),
              h('span', { class: 'tiny muted' }, words(m.content) + ' 字')));
          });
          side.appendChild(h('div', { class: 'ch-doc', style: { color: '#2F6F63' }, onclick: addDoc }, '＋ 新的章节'));
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
      const cnt = h('span', {}, '');
      const upd = () => {
        const w = words(ed.value);
        cnt.textContent = w.toLocaleString() + ' 字 · ' + ed.value.split('\n').length + ' 段';
      };
      ed.addEventListener('input', () => { m.content = ed.value; m.updatedAt = new Date().toISOString(); upd(); saveDebounced(); });
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
      main.appendChild(ed);
      main.appendChild(h('div', { class: 'ch-foot' },
        cnt,
        h('span', {}, '自动保存'),
        h('span', { class: 'grow' }),
        h('span', { class: 'tiny' }, 'Ctrl+S 立即保存')));
      setTimeout(() => ed.focus(), 30);
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

    renderSide(); renderMain();
    /* Ctrl/⌘+S 由外壳统一处理（app.js），这里不再重复绑定，避免双份 toast */
  }
};
