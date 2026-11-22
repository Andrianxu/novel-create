/* 书库：创建 / 切换 / 改名 / 复制 / 删除
 *
 * 每本书的"大框架"完全一样（人物 · 世界观 · 情节 · 卷 · 正文 · 拆书），只是一份独立的 data 文件。
 * 所以切换书 = 换一份 NF.doc 再整页重画，页面代码不需要知道"书"这件事。
 *
 * 切换的顺序很重要（踩过的坑记在这里）：
 *   1. 先停掉还没落盘的自动保存，等它写完 —— 否则切完之后那笔 setTimeout 会把上一本的内容
 *      写进刚切过去的那一本（主进程按"当前书"落盘）；
 *   2. 再让主进程换登记表里的 activeId 并读回新书；
 *   3. 最后换 NF.doc、清掉撤销栈、整页重画。
 */
import { h, clear, toast, modal, ago } from './util.js';

const ipcErr = e => String((e && e.message) || e || '').replace(/^Error invoking remote method '[^']*':\s*(?:Error:\s*)?/, '');

function fmtWhen(iso) {
  if (!iso) return '';
  const t = Date.parse(iso);
  if (!isFinite(t)) return '';
  const d = new Date(t);
  const p = x => String(x).padStart(2, '0');
  return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

/* 顶栏那块「当前书名」 */
export function paintBookChip(NF) {
  const title = document.getElementById('bookTitle');
  const scope = document.getElementById('bookScope');
  const doc = NF.doc || {};
  const name = (doc.meta && String(doc.meta.title || '').trim()) || '未命名';
  if (title) title.textContent = name;
  if (scope) {
    const lib = NF.library || {};
    const n = (lib.books || []).length;
    scope.textContent = n > 1 ? '书库 ' + n + ' 本 · NOVELFOLIO' : 'NOVELFOLIO';
    scope.title = n > 1 ? '书库里一共 ' + n + ' 本，点书名可以切换' : '';
  }
}

/* 切换一本书 */
export async function switchTo(NF, id) {
  const lib = NF.library || {};
  if (!id || id === lib.activeId) return false;
  const target = (lib.books || []).find(b => b.id === id);
  /* 1. 先把界面里还没落盘的改动写完 */
  try { await NF.flush(); } catch (e) { console.error('[switch] flush failed', e); }
  let r;
  try { r = await window.nf.books.switch(id); }
  catch (e) { toast('切换失败：' + ipcErr(e), 'err'); return false; }
  /* 2. 换数据、换书库 */
  NF.doc = r.doc;
  NF.library = r.library || lib;
  /* 3. 撤销栈里有上一本书的内容，带着它按 Ctrl+Z 会把两本书搅在一起 —— 清掉 */
  try { NF.history.clear(); NF.history.prime(); } catch (e) { console.error(e); }
  paintBookChip(NF);
  NF.repaint();
  toast('已切换到《' + ((target && target.title) || (r.doc.meta && r.doc.meta.title) || '未命名') + '》', 'ok');
  return true;
}

/* ---------------- 弹窗 ---------------- */

function libraryModal(NF) {
  const books = () => ((NF.library || {}).books || []);
  const activeId = () => (NF.library || {}).activeId;
  const listBox = h('div', { class: 'lib-list', 'data-probe': 'lib-list' });
  const footCount = h('span', {}, '');
  let m = null;                     /* 书库这个弹窗本身 */
  /* 只收「书库」和它上面那层"改名/复制/删除"确认框。
   * 不能顺手把 modalRoot 整个清掉：onOk 里 await 之后可能还有别的弹窗开着（或者正要开）。 */
  function closeBoxes(extra) {
    if (extra && typeof extra.close === 'function') extra.close();
    if (m) m.close();
    m = null;
  }

  function row(b) {
    const on = b.id === activeId();
    const acts = h('div', { class: 'lib-acts' },
      h('button', { class: 'lib-ico', type: 'button', title: '重命名 / 改作者', onclick: e => { e.stopPropagation(); openRename(b); } }, '✎'),
      h('button', { class: 'lib-ico', type: 'button', title: '复制成一本新书', onclick: e => { e.stopPropagation(); openCopy(b); } }, '⧉'),
      h('button', {
        class: 'lib-ico del', type: 'button', title: books().length <= 1 ? '书库里至少要留一本' : '从书库删除',
        disabled: books().length <= 1, onclick: e => { e.stopPropagation(); openRemove(b); }
      }, '⌫'));
    return h('div', {
      class: 'lib-row' + (on ? ' on' : ''), 'data-book': b.id, 'data-active': on ? '1' : '',
      onclick: () => {
        if (on) return;
        /* 切换本身会重画整页，先把书库弹窗收掉 */
        if (m) { m.close(); m = null; }
        switchTo(NF, b.id);
      }
    },
      h('span', { class: 'lib-sp' }),
      h('div', { class: 'lib-txt' },
        h('div', { class: 'lib-nm' },
          h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis' } }, b.title || '未命名'),
          on ? h('span', { class: 'pill seal' }, '当前') : null,
          b.demo ? h('span', { class: 'pill grey', title: '升级前的老数据，或首次启动的演示内容' }, '演示') : null),
        h('div', { class: 'lib-meta' },
          h('span', {}, (b.characters || 0) + ' 人物 · ' + (b.plots || 0) + ' 情节 · ' + (b.chapters || 0) + ' 卷'),
          h('span', {}, '改于 ' + (fmtWhen(b.lastEditedAt) || ago(b.lastEditedAt) || '—')),
          b.author ? h('span', {}, '作者 ' + b.author) : null)),
      acts);
  }

  function paintList() {
    clear(listBox);
    const list = books();
    if (!list.length) listBox.appendChild(h('div', { class: 'empty' }, '书库是空的'));
    list.forEach(b => listBox.appendChild(row(b)));
    footCount.textContent = '书库 ' + list.length + ' 本 · 每本书的数据各存一份，互不影响';
  }

  function openNew() {
    const titleIn = h('input', { class: 'input', value: '', placeholder: '书名，例如 北境十年', maxlength: '40' });
    const authorIn = h('input', { class: 'input', value: (NF.doc.meta && NF.doc.meta.author) || '', placeholder: '作者（可留空，沿用现在的作者名）' });
    const kind = { v: 'blank' };
    const choiceBox = h('div', { class: 'lib-new' });
    function redraw() {
      clear(choiceBox);
      for (const c of [
        { v: 'blank', t: '空白书', d: '人物、世界观、情节、卷全部从零开始（世界观里先给一片"主位面"）' },
        { v: 'demo', t: '演示书 · 临水问剑', d: '带一整套示例人物 / 世界 / 情节，照着改最快' }
      ]) {
        choiceBox.appendChild(h('div', {
          class: 'lib-choice', 'data-kind': c.v,
          style: kind.v === c.v ? { borderColor: 'var(--seal)', background: '#FFF8F4' } : null,
          onclick: () => { kind.v = c.v; redraw(); }
        }, h('b', {}, c.t), h('small', {}, c.d)));
      }
    }
    redraw();
    modal({
      title: '新建书籍', width: '600px',
      body: h('div', { class: 'col', style: { gap: '11px' } },
        h('div', { class: 'field' }, h('label', {}, '书名'), titleIn),
        h('div', { class: 'field' }, h('label', {}, '作者'), authorIn),
        h('div', { class: 'field' }, h('label', {}, '从哪种骨架开始'), choiceBox),
        h('div', { class: 'tiny muted', style: { lineHeight: '1.8' } },
          '每本书的框架都是一样的（人物 · 世界观 · 情节 · 卷 · 正文 · 拆书），内容各自独立存放。建好后会立刻切过去。')),
      okText: '创建并打开',
      onOk: async () => {
        const title = titleIn.value.trim();
        if (!title) { toast('给新书起个名字吧', 'err'); return false; }
        try {
          await NF.flush();
          const r = await window.nf.books.create({ title, author: authorIn.value.trim(), kind: kind.v });
          /* 先收弹窗，再换书：换书会整页重画，弹窗留着会挡在上面 */
          closeBoxes();
          await NF.adoptBook({ doc: r.doc, library: r.library });
          toast('已创建《' + (((r.book && r.book.title) || title)) + '》并切换过去', 'ok');
        } catch (e) { toast('创建失败：' + ipcErr(e), 'err'); return false; }
      }
    });
    setTimeout(() => titleIn.focus(), 30);
  }

  function openRename(b) {
    const titleIn = h('input', { class: 'input', value: b.title || '', maxlength: '40' });
    const authorIn = h('input', { class: 'input', value: b.author || '', placeholder: '作者（留空则不显示）' });
    modal({
      title: '重命名书籍', width: '480px',
      body: h('div', { class: 'col', style: { gap: '10px' } },
        h('div', { class: 'field' }, h('label', {}, '书名'), titleIn),
        h('div', { class: 'field' }, h('label', {}, '作者'), authorIn)),
      okText: '保存',
      onOk: async () => {
        const title = titleIn.value.trim();
        if (!title) { toast('书名不能为空', 'err'); return false; }
        try {
          const r = await window.nf.books.rename(b.id, { title, author: authorIn.value.trim() });
          NF.library = r.library || NF.library;
          Object.assign(b, r.book || {});
          if (b.id === activeId()) {
            /* 书名以主进程定下的为准：撞名时会自动补「（2）」 */
            NF.doc.meta = NF.doc.meta || {};
            NF.doc.meta.title = (r.book && r.book.title) || title;
            NF.doc.meta.author = (r.book && r.book.author) || authorIn.value.trim();
            NF.paintChrome();
          }
          paintList();
          toast(r.book && r.book.title !== title ? ('已重命名 · 书库里已有同名，改成《' + r.book.title + '》') : '已重命名', 'ok');
        } catch (e) { toast('重命名失败：' + ipcErr(e), 'err'); return false; }
      }
    });
    setTimeout(() => { titleIn.focus(); titleIn.select(); }, 30);
  }

  function openCopy(b) {
    const titleIn = h('input', { class: 'input', value: (b.title || '未命名') + ' · 副本', maxlength: '40' });
    const m2 = modal({
      title: '复制成一本新书', width: '470px',
      body: h('div', { class: 'col', style: { gap: '10px' } },
        h('div', { class: 'small sub', style: { lineHeight: '1.8' } }, '会把《' + (b.title || '未命名') + '》现在的全部内容抄一份，另立一本。原书不受影响。'),
        h('div', { class: 'field' }, h('label', {}, '新书名'), titleIn)),
      okText: '复制',
      onOk: async () => {
        const title = titleIn.value.trim();
        if (!title) { toast('新书名不能为空', 'err'); return false; }
        try {
          await NF.flush();
          const r = await window.nf.books.create({ title, copyFrom: b.id });
          closeBoxes(m2);
          await NF.adoptBook({ doc: r.doc, library: r.library });
          toast('已复制成《' + title + '》并打开', 'ok');
        } catch (e) { toast('复制失败：' + ipcErr(e), 'err'); return false; }
      }
    });
    setTimeout(() => { titleIn.focus(); titleIn.select(); }, 30);
  }

  function openRemove(b) {
    const m2 = modal({
      title: '从书库删除', width: '470px',
      body: h('div', { class: 'col', style: { gap: '8px' } },
        h('div', { class: 'small', style: { lineHeight: '1.8' } }, '把《' + (b.title || '未命名') + '》从书库里删掉？'),
        h('div', { class: 'tiny muted', style: { lineHeight: '1.8' } },
          '整本书的内容（人物、世界观、情节、卷、正文、拆书结果）会一起删除。删除前会自动留一份备份，',
          '原文件也挪进数据目录的 trash 文件夹，万一删错还能找回。'),
        h('div', { class: 'tiny', style: { color: 'var(--seal)' } }, '删除后界面里不能撤销，请确认书名。')),
      okText: '删除这本书',
      onOk: async () => {
        try {
          const r = await window.nf.books.remove(b.id);
          closeBoxes(m2);
          await NF.adoptBook({ doc: r.doc, library: r.library });
          toast('已删除《' + (b.title || '未命名') + '》', 'ok');
        } catch (e) { toast('删除失败：' + ipcErr(e), 'err'); return false; }
      }
    });
  }

  const body = h('div', { class: 'lib-wrap' },
    h('div', { class: 'lib-top' },
      h('span', { class: 'lib-h' }, '书库'),
      h('span', { class: 'grow' }),
      h('button', { class: 'btn pri xs', type: 'button', onclick: openNew, 'data-probe': 'lib-new' }, '＋ 新建书籍')),
    listBox,
    h('div', { class: 'lib-foot' },
      h('div', {}, '点任意一本即可切换 · ✎ 改书名/作者 · ⧉ 复制一本 · ⌫ 删除（删前留备份）'),
      h('div', { style: { marginTop: '3px' } }, footCount)));
  m = modal({ title: '书籍', width: '620px', body, footer: h('div', { class: 'modal-f' }, h('button', { class: 'btn', onclick: () => closeBoxes() }, '关闭')) });
  paintList();
}

/* 打开书库弹窗（顶栏那块） */
export function openLibrary(NF) {
  if (document.getElementById('modalRoot').classList.contains('on')) return;
  libraryModal(NF);
}
