/* 小工具：极简 hyperscript + 常用 UI */
export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) {
    for (const k in props) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === 'class' || k === 'className') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'value') el.value = v;
      else if (k === 'checked' || k === 'disabled' || k === 'selected') el[k] = !!v;
      else el.setAttribute(k, v);
    }
  }
  for (const kid of kids.flat(9)) {
    if (kid == null || kid === false) continue;
    el.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}
export const $ = (s, r) => (r || document).querySelector(s);
export const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
export function uid(p) { return (p || 'id') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
export function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms || 400); }; }
export function injectStyle(id, css) {
  if (document.getElementById('st-' + id)) return;
  const s = document.createElement('style'); s.id = 'st-' + id; s.textContent = css;
  document.head.appendChild(s);
}
export function toast(msg, kind) {
  const root = document.getElementById('toastRoot');
  const t = h('div', { class: 'toast ' + (kind || '') }, msg);
  root.appendChild(t);
  requestAnimationFrame(() => t.classList.add('on'));
  setTimeout(() => { t.classList.remove('on'); setTimeout(() => t.remove(), 220); }, kind === 'err' ? 4400 : 2200);
}
export function modal(opts) {
  const root = document.getElementById('modalRoot');
  const close = () => { root.classList.remove('on'); clear(root); };
  /* 「确定」按钮的点击结果也交出去：需要等这一步跑完再接着做事的地方（例如导完 JSON 立刻刷新）
   * 可以 await m.ok()；自己不放按钮（footer:false）的弹窗，也可以调 m.ok() 走同一套流程。 */
  const runOk = async () => {
    if (!opts.onOk) { close(); return true; }
    const r = await opts.onOk();
    /* 注意顺序：onOk 里可能要打开另一个对话框（例如"新建书籍"成功后再看详情），
     * 那种情况会自己 close()；这里再 close 一次会把刚打开的那个一起清掉。
     * 所以只在 root 还挂着本弹窗时才收尾，而且放到下一拍——让 onOk 里 await 之后的代码先跑完。 */
    if (r !== false && root.contains(box)) { await new Promise(res => setTimeout(res, 0)); if (root.contains(box)) close(); }
    return r;
  };
  const foot = opts.footer === false ? null : h('div', { class: 'modal-f' },
    opts.cancelText === false ? null : h('button', { class: 'btn', onclick: close }, opts.cancelText || '取消'),
    opts.okText ? h('button', { class: 'btn pri', onclick: runOk }, opts.okText) : null);
  const body = typeof opts.body === 'string' ? h('div', { class: 'modal-b', html: opts.body }) : h('div', { class: 'modal-b' }, opts.body);
  const box = h('div', { class: 'modal', style: { width: opts.width || '560px' } },
    h('div', { class: 'modal-h' }, h('h3', {}, opts.title || ''), h('span', { class: 'x', onclick: close }, '\u2715')),
    body, foot);
  clear(root);
  root.appendChild(h('div', { class: 'scrim', onclick: opts.dismissable === false ? null : close }));
  root.appendChild(box);
  root.classList.add('on');
  return { close, box, body, ok: runOk };
}
export function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  } catch (e) { return ''; }
}
export function ago(iso) {
  const n = Date.now() - new Date(iso).getTime();
  if (!isFinite(n)) return '';
  const d = Math.floor(n / 864e5);
  if (d <= 0) return '今天';
  if (d === 1) return '昨天';
  if (d < 30) return d + ' 天前';
  if (d < 365) return Math.floor(d / 30) + ' 个月前';
  return Math.floor(d / 365) + ' 年前';
}
export function words(s) { return String(s || '').replace(/[ \t\r\n\u3000]/g, '').length; }
export function nameOf(doc, id) { const c = (doc.characters || []).find(x => x.id === id); return c ? c.name : ''; }
export function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export const ALIGN = { good: { label: '正道', color: '#2F6F63' }, neutral: { label: '中立', color: '#B98A3C' }, evil: { label: '邪道', color: '#A8322A' }, hidden: { label: '隐世', color: '#5A6B8C' } };
export const STATUS = { done: { label: '已发生', cls: 'jade' }, later: { label: '后续计划', cls: 'gold' }, ending: { label: '结局节点', cls: 'seal' } };
