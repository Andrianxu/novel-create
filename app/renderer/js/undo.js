/* 撤销（Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y）
 *
 * 思路：给整篇数据拍快照，栈里只存 JSON 字符串——快照和活数据绝不共用对象，记录之后再改也不会串味。
 *
 * 页面里照旧只调 NF.save()。它其实是「刚改完一处」的信号，这里据此推进撤销栈（tick）：
 *   数据是就地改的，等收到 NF.save() 时改动已经发生；但上一拍留下的基准（baseline）
 *   正好是这一拍之前的模样，所以记下来的永远是真正的「改之前」。
 *   · 连续打字（两次 NF.save 间隔很短、改的还是同一处）只算一步；
 *   · 停手 MERGE_MS 之后、或者换了地方改，就是新的一步。
 *
 * 撤销后换一整份新数据交给页面重画；同 id 的对象会接回原来那个，页面里捏着的引用不用重找。
 */
export const MERGE_MS = 600;      /* 连续打字时，停顿多久算另一步 */

const UNDO_CAP = 100;
const REDO_CAP = 100;
const SNAP_MAX = 6 * 1024 * 1024;
const ACTIVE_CAP = 3000;

const TAG = '__nfRef__';          /* 占位节点：恢复时按 id 接回原来那个对象 */
const KEEP_REFS = new Set(['images', 'blobs', 'raw', 'preview']);   /* 大块素材按引用带过，不复制 */

const DEFAULT_LABEL = { settings: '设置', characters: '人物', planes: '世界观', plots: '情节', manuscripts: '正文', chapters: '卷目录', scraps: '废案', books: '拆书', meta: '书名' };

/* ---------- 快照 ---------- */
function clone(v, active) {
  if (v === null || typeof v !== 'object') return v;
  if (typeof v.toJSON === 'function') return v.toJSON();
  const id = v.id;
  if (id != null && (typeof id === 'string' || typeof id === 'number') && active && active.has(id)) return { [TAG]: id };
  if (Array.isArray(v)) {
    const out = new Array(v.length);
    for (let i = 0; i < v.length; i++) out[i] = clone(v[i], active);
    return out;
  }
  if (Object.prototype.toString.call(v) !== '[object Object]') return v;
  const out = {};
  for (const k in v) {
    const x = v[k];
    if (x === undefined) continue;
    out[k] = KEEP_REFS.has(k) ? x : clone(x, active);
  }
  return out;
}
function restore(c, active) {
  if (c === null || typeof c !== 'object') return c;
  if (Array.isArray(c)) { for (let i = 0; i < c.length; i++) c[i] = restore(c[i], active); return c; }
  if (c[TAG] !== undefined) { const hit = active && active.get(c[TAG]); return hit || c; }
  for (const k in c) c[k] = restore(c[k], active);
  return c;
}
/* 按 id 收回「活着的」对象：撤销之后页面里的引用还能接上原来那个对象 */
function collect(doc) {
  const map = new Map();
  let n = 0;
  (function walk(v) {
    if (!v || typeof v !== 'object' || n >= ACTIVE_CAP) return;
    if (Array.isArray(v)) { for (const x of v) walk(x); return; }
    if (Object.prototype.toString.call(v) !== '[object Object]') return;
    if (v.id != null && !map.has(v.id)) { map.set(v.id, v); n++; }
    for (const k in v) { const x = v[k]; if (x && typeof x === 'object') walk(x); }
  })(doc);
  return map;
}
/* 快照里只有纯对象，绝不钉住活数据（否则记录之后再改，快照会跟着一起变） */
function snapshot(doc) {
  try {
    const s = JSON.stringify(clone(doc, null));
    return s && s.length <= SNAP_MAX ? s : null;
  } catch (e) { return null; }
}

/* 作者此刻是不是正在输入框里打字？——只有这种情况才把连续的改动并成一步；
 * 点按钮这类离散动作（每下都该能单独撤回）不合并。 */
function typingNow() {
  let el = null;
  try { el = document.activeElement; } catch (e) {}
  if (!el || !el.matches) return false;
  return el.matches('input, textarea, [contenteditable=""], [contenteditable="true"]');
}

/* ---------- 撤销栈 ---------- */
export function createHistory(opts) {
  const getDoc = opts.getDoc;                     /* () => 当前数据 */
  const replaceDoc = opts.replaceDoc;             /* (obj) => void，换掉整篇数据 */
  const onChange = opts.onChange || function () {};
  const UNDO = [], REDO = [];
  let recorded = null;   /* 栈顶那一步「改之前」的快照 */
  let baseline = '';     /* 比对基准：上一次「改之后」的样子 */
  let arm = null;        /* 最近一次被明确点名的改动（NF.save(对象) / NF.save(对象, '改名')） */
  let pend = null;       /* { label, root, at, typing }：上一拍的样子，用来判断「还在同一段连续改动里吗」 */
  let applying = 0;      /* >0：正在把撤销/重做的结果铺回页面，这期间的 NF.save() 不算作者的一步 */
  let trailTimer = null; /* 连续打字收尾的那一次补拍 */
  function stopTrail() { clearTimeout(trailTimer); trailTimer = null; }

  function changed() { try { onChange(peek()); } catch (e) { console.error(e); } }
  function push(snap, label, root) {
    if (!snap || snap === recorded) return;
    UNDO.push({ snap, label, root, at: Date.now() });
    while (UNDO.length > UNDO_CAP) UNDO.shift();
    recorded = snap;
    REDO.length = 0;
  }
  /* 这一拍改的是哪儿：没点名就沿用最近一次被点名的 */
  function ctxOf(root, label) {
    if (root) return { root, label: label || DEFAULT_LABEL[root] || '修改' };
    if (arm) return { root: arm.root, label: arm.label };
    return { root: 'doc', label: '修改' };
  }
  /* 手停下后再拍一张：连续打字期间不逐字序列化整本书，等静下来把基准补上。
   * 这一步不新增撤销步骤（那一步在开打时就记过了），只是让「下一步的起点」跟得上。 */
  function trail() {
    clearTimeout(trailTimer);
    trailTimer = setTimeout(function () {
      trailTimer = null;
      if (applying) return;
      const doc = getDoc();
      if (!doc) return;
      const s = snapshot(doc);
      if (!s) return;
      baseline = s;
      if (pend) pend.at = Date.now();
    }, MERGE_MS + 60);
  }

  /* 记点：每次 NF.save() 都走这里。
   *
   * 页面几乎都是「先改数据、再 NF.save()」，所以收到信号时改动已经发生；
   * 上一拍留在 baseline 里的样子才是这一拍之前的模样——它就是这一步要撤回去的地方。
   * 启动时先 prime() 拍一张原始数据，第一笔改动于是也有「改之前」。 */
  function tick(root0, label0) {
    const doc = getDoc();
    if (!doc) return;
    if (root0) arm = { root: root0, label: label0 || DEFAULT_LABEL[root0] || '修改' };
    const ctx = ctxOf(root0, label0);
    const now = Date.now();

    if (applying) {
      const s = snapshot(doc);
      if (s) baseline = s;
      return;
    }
    /* 还在同一段连续打字里：只更新心跳，序列化留到 trail() 里做一次 */
    const typing = typingNow();
    if (pend && typing && pend.typing && now - pend.at <= MERGE_MS && pend.label === ctx.label && pend.root === ctx.root) {
      pend.at = now;
      trail();
      return;
    }
    const snapNow = snapshot(doc);
    if (!snapNow) return;
    if (!baseline) baseline = snapNow;                 /* 兜底：还没拍过基准 */
    else if (baseline !== snapNow) push(baseline, ctx.label, ctx.root);
    baseline = snapNow;
    pend = { label: ctx.label, root: ctx.root, at: now, typing };
    changed();
  }

  /* 启动时拍一张「原封不动」的基准：撤销的第一笔才有地方可回 */
  function prime() {
    const doc = getDoc();
    if (!doc) return;
    const snap = snapshot(doc);
    if (!snap) return;
    baseline = snap;
    pend = null;
    changed();
  }

  function apply(entry) {
    let obj;
    try { obj = JSON.parse(entry.snap); } catch (err) { return null; }
    const target = restore(obj, collect(getDoc()));
    stopTrail();
    applying++;
    try { replaceDoc(target); } finally { applying--; }
    /* 撤销后的样子就是新的基准（页面重挂时若补了什么默认值，以补完的为准） */
    baseline = snapshot(getDoc()) || entry.snap;
    pend = null;
    return target;
  }
  function undo() {
    if (!UNDO.length) { changed(); return null; }
    const doc = getDoc();
    const entry = UNDO.pop();
    const brk = snapshot(doc);
    if (!brk) { UNDO.push(entry); changed(); return null; }
    REDO.push({ snap: brk, label: entry.label, at: Date.now() });
    while (REDO.length > REDO_CAP) REDO.shift();
    recorded = UNDO.length ? UNDO[UNDO.length - 1].snap : null;
    const obj = apply(entry);
    changed();
    return obj ? { label: entry.label, doc: obj } : null;
  }
  function redo() {
    if (!REDO.length) { changed(); return null; }
    const doc = getDoc();
    const entry = REDO.pop();
    const brk = snapshot(doc);
    if (!brk) { REDO.push(entry); changed(); return null; }
    UNDO.push({ snap: brk, label: entry.label, root: entry.root, at: Date.now() });
    while (UNDO.length > UNDO_CAP) UNDO.shift();
    recorded = brk;
    const obj = apply(entry);
    changed();
    return obj ? { label: entry.label, doc: obj } : null;
  }
  function clear() { UNDO.length = 0; REDO.length = 0; pend = null; recorded = null; baseline = ''; changed(); }
  function peek() {
    const u = UNDO.length ? UNDO[UNDO.length - 1] : null;
    const r = REDO.length ? REDO[REDO.length - 1] : null;
    return { canUndo: !!u, canRedo: !!r, undoLabel: u ? u.label : '', redoLabel: r ? r.label : '' };
  }
  return { tick, prime, undo, redo, clear, peek };
}

/* ---------- 和页面打交道的零碎 ---------- */
/* 调用栈里找当前页面文件名：页面裸调 NF.save() 时用它判断改的是哪一块数据 */
export function pickFileName() {
  const stack = String(new Error().stack || '').split('\n');
  for (const line of stack) {
    const m = /pages[\\/]([\w.-]+?)\.js/.exec(line);
    if (m) return m[1];
  }
  return '';
}