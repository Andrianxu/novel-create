/* 导入导出：把 CSV / Excel / Word 里现成的人物、情节、世界观导进软件，并提供整库导出与备份。
 * 解析走 window.nf.imp.parse；导入动作在渲染层完成，改写 ctx.doc 后调 ctx.NF.save()。 */
import { h, clear, toast, modal, injectStyle, uid, words, ALIGN } from '../util.js';

injectStyle('importer', `.imp{flex:1;min-width:0;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:12px;padding:14px 18px 22px}
.imp-head{display:flex;align-items:flex-end;gap:18px;flex-wrap:wrap}
.imp-head h1{font-family:var(--kai);font-size:27px;line-height:1.05;margin:0;letter-spacing:.08em}
.imp-head p{margin:5px 0 0;font-size:11.5px;color:#8C8272;line-height:1.6}
.imp-grid{display:grid;grid-template-columns:minmax(0,1fr) 272px;gap:14px;align-items:stretch;flex:1 0 auto;min-height:0}
.imp-col{display:flex;flex-direction:column;gap:12px;min-width:0}
.imp-host{display:flex;flex-direction:column;gap:12px;min-width:0;flex:1 0 auto}
/* 拖拽区 */
.imp-drop{border:1.5px dashed #CBB894;border-radius:11px;background:#FFFCF5;flex:1 0 auto;min-height:214px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;cursor:pointer;padding:20px;text-align:center;transition:background .15s,border-color .15s,box-shadow .15s}
.imp-drop:hover{background:#FFFDF8;border-color:#B98A3C}
.imp-drop.over{background:#F8F1E0;border-color:#A8322A;box-shadow:inset 0 0 0 3px rgba(168,50,42,.06)}
.imp-ico{width:42px;height:42px;border-radius:10px;background:#201C18;color:#F6F1E6;display:grid;place-items:center;font-size:19px;line-height:1}
.imp-drop .t1{font-size:13px;letter-spacing:.02em}
.imp-drop .t2{font-size:11px;color:#8C8272}
.imp-tags{display:flex;gap:5px;flex-wrap:wrap;justify-content:center;margin-top:4px}
.imp-tag{font-size:9.5px;letter-spacing:.1em;color:#5B5348;background:#F4EEE2;border:1px solid #EAE1CF;border-radius:4px;padding:1px 6px;font-family:var(--mono)}
/* 说明卡 */
.imp-tips{padding:11px 14px;display:flex;flex-direction:column;gap:5px}
.imp-tips b{font-size:11px;font-weight:400;color:#5B5348;letter-spacing:.06em}
.imp-tips div{font-size:11px;color:#8C8272;display:flex;gap:7px;line-height:1.6}
.imp-tips i{color:#B98A3C;font-style:normal}
/* 状态卡：加载 / 错误 / 整本书提示 */
.imp-state{padding:22px 24px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;text-align:center;flex:1 0 auto;min-height:190px}
.imp-state .t1{font-size:13px;font-family:var(--kai);letter-spacing:.04em}
.imp-state .msg{font-size:11.5px;color:#8C8272;line-height:1.75;max-width:560px}
.imp-state .acts{display:flex;gap:8px;margin-top:4px}
/* 向导 */
.imp-wiz{overflow:hidden;display:flex;flex-direction:column;flex:1 0 auto}
.imp-steps{display:flex;align-items:center;padding:10px 14px;border-bottom:1px solid #EAE1CF;background:#FBF6EA}
.imp-step{display:flex;align-items:center;gap:7px;font-size:11.5px;color:#8C8272;white-space:nowrap}
.imp-step i{width:19px;height:19px;border-radius:50%;border:1px solid #DFD4BF;background:#FFFCF5;display:grid;place-items:center;font-size:10px;font-style:normal;color:#8C8272}
.imp-step.on{color:#201C18}
.imp-step.on i{background:#201C18;border-color:#201C18;color:#F6F1E6}
.imp-step.done i{background:#2F6F63;border-color:#2F6F63;color:#FFFCF5}
.imp-stepline{flex:1;height:1px;background:#E2D7C1;margin:0 10px;min-width:16px}
.imp-wbody{padding:12px 15px 13px;display:flex;flex-direction:column;gap:9px;min-height:206px;flex:1 0 auto}
.imp-wbody.c{justify-content:center}
.imp-wfoot{display:flex;align-items:center;gap:8px;padding:10px 15px;border-top:1px solid #EAE1CF;background:#FBF6EA}
.imp-file{display:flex;align-items:center;gap:10px;background:#FBF6EA;border:1px solid #EAE1CF;border-radius:9px;padding:9px 11px}
.imp-file .nm{font-size:12px;font-weight:700;word-break:break-all}
.imp-file .meta{font-size:10.5px;color:#8C8272;margin-top:2px}
/* 类别单选 */
.imp-cats{display:flex;gap:8px;flex-wrap:wrap}
.imp-cat{display:flex;align-items:center;gap:7px;border:1px solid #DFD4BF;background:#FFFDF8;border-radius:9px;padding:7px 12px;cursor:pointer;font-size:12px;user-select:none}
.imp-cat:hover{border-color:#C2A97D}
.imp-cat.on{border-color:#201C18;background:#F6F1E6;box-shadow:inset 0 0 0 1px #201C18}
.imp-cat i{width:13px;height:13px;border-radius:50%;border:1px solid #C2A97D;flex:none;position:relative}
.imp-cat.on i{border-color:#201C18}
.imp-cat.on i:after{content:'';position:absolute;inset:2px;border-radius:50%;background:#201C18}
.imp-cat small{color:#8C8272;font-size:10px}
/* 列映射 */
.imp-map{display:flex;flex-direction:column;gap:5px}
.imp-maprow{display:grid;grid-template-columns:minmax(0,1fr) 178px;gap:10px;align-items:center;border:1px solid #EAE1CF;background:#FFFDF8;border-radius:8px;padding:3px 9px}
.imp-maprow .src{display:flex;flex-direction:column;gap:1px;min-width:0}
.imp-maprow .src b{font-weight:400;font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.imp-maprow .src small{font-size:10px;color:#A79C89;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.imp-maprow .select{padding:2px 7px;font-size:11.5px}
.imp-maprow.off{background:#FBF8F0}
.imp-maprow.off .src b{color:#8C8272}
/* 预览表：宽表横向滚动 */
.imp-tblwrap{overflow:auto;max-height:326px;border:1px solid #EAE1CF;border-radius:9px;background:#FFFDF8}
.imp-tbl{border-collapse:separate;border-spacing:0;width:100%;min-width:max-content;font-size:11.5px}
.imp-tbl th{position:sticky;top:0;z-index:1;background:#F6EFE0;color:#5B5348;font-weight:400;font-size:10.5px;letter-spacing:.06em;text-align:left;padding:6px 9px;border-bottom:1px solid #E2D7C1;white-space:nowrap}
.imp-tbl td{padding:5px 9px;border-bottom:1px solid #F4EDDD;white-space:nowrap;max-width:190px;overflow:hidden;text-overflow:ellipsis;color:#332C25}
.imp-tbl tr:last-child td{border-bottom:none}
.imp-tbl th.c,.imp-tbl td.c{text-align:center;width:32px;padding-left:6px;padding-right:6px}
.imp-tbl td.no{color:#A79C89;font-size:10px}
.imp-tbl tr.err td{background:#FBF1EF}
.imp-tbl tr.warn td{background:#FBF5E9}
.imp-iss{display:inline-flex;gap:4px}
.imp-flag{font-size:9.5px;border-radius:4px;padding:1px 5px;white-space:nowrap;letter-spacing:.02em}
.imp-flag.e{background:#F6E3DF;color:#8E2A23}
.imp-flag.w{background:#F7EBD3;color:#8A6421}
.imp-flag.ok{background:#E2EEEA;color:#23604F}
.imp-cnt{font-size:11.5px;color:#5B5348}
.imp-cnt b{font-weight:700;color:#201C18}
.imp-note{font-size:10.5px;color:#8C8272;line-height:1.6}
.imp-tbl input[type=checkbox]{accent-color:#2F6F63;width:13px;height:13px;cursor:pointer;vertical-align:-2px}
/* 导入记录 */
.imp-sec{padding:11px 14px 10px;display:flex;flex-direction:column;gap:7px}
.imp-rec{flex:1 0 auto;min-height:120px}
.imp-sec .empty{flex:1;justify-content:center;gap:5px}
.imp-sec h3,.imp-side h3{font-family:var(--kai);font-size:14px;font-weight:400;margin:0;letter-spacing:.06em}
.imp-rtbl{width:100%;border-collapse:collapse;font-size:11px}
.imp-rtbl th{text-align:left;font-weight:400;color:#8C8272;font-size:10px;letter-spacing:.08em;padding:3px 6px;border-bottom:1px solid #EAE1CF;white-space:nowrap}
.imp-rtbl td{padding:5px 6px;border-bottom:1px solid #F4EDDD;color:#332C25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:260px}
.imp-rtbl tr:last-child td{border-bottom:none}
.imp-rtbl .pill{margin-right:4px}
/* 导出 / 备份 */
.imp-side{padding:12px 14px;display:flex;flex-direction:column;gap:8px}
.imp-side p{margin:0;font-size:10.5px;line-height:1.75;color:#8C8272}
.imp-side .btn{width:100%;justify-content:center}
.imp-bk{border-top:1px solid #EAE1CF;padding-top:9px;display:flex;flex-direction:column;gap:6px;margin-top:auto}
.imp-bks{display:flex;flex-direction:column;gap:3px;max-height:176px;overflow:auto}
.imp-bkrow{display:flex;align-items:center;gap:6px;font-size:10.5px;color:#5B5348;padding:2px 0}
.imp-bkrow .t{font-family:var(--mono);font-size:10px;white-space:nowrap}
.imp-bkrow .s{color:#A79C89;font-size:9.5px;white-space:nowrap}
.imp-bkrow .btn{padding:1px 7px;font-size:10px}
@media (max-width:1320px){.imp-grid{grid-template-columns:minmax(0,1fr)}}
`);

/* =========================================================================
 * 一、类别与字段
 * 每个字段给出中文列名常用别名，用于自动猜列映射（同名优先，其次包含关系）。
 * ========================================================================= */
const CATS = {
  characters: {
    key: 'characters', label: '人物', unit: '人',
    fields: [
      { key: 'name', label: '姓名', req: true, aliases: ['姓名', '名字', '名称', '人名', '角色', '角色名', '人物名'] },
      { key: 'aliases', label: '别名', aliases: ['别名', '别称', '外号', '又称', '曾用名'] },
      { key: 'age', label: '年龄', aliases: ['年龄', '岁数', '年纪'] },
      { key: 'identity', label: '身份', aliases: ['身份', '职位', '出身', '所属', '门派', '来历'] },
      { key: 'persona', label: '人设', aliases: ['人设', '性格', '简介', '介绍', '描述', '画像', '设定'] },
      { key: 'realm', label: '目前修为', aliases: ['修为', '境界', '实力', '等级'] },
      { key: 'ending', label: '最终结局', aliases: ['结局', '下场', '归宿', '最后'] },
      { key: 'group', label: '分组', aliases: ['分组', '分类', '组别', '类型', '阵营'] }
    ]
  },
  plots: {
    key: 'plots', label: '情节', unit: '条',
    fields: [
      { key: 'title', label: '情节名', req: true, aliases: ['情节', '事件', '事件名', '标题', '名称', '桥段', '剧情'] },
      { key: 'chapter', label: '章节', aliases: ['章节', '章', '回', '所在章', '章节名'] },
      { key: 'timePoint', label: '时间点', aliases: ['时间点', '时间', '序号', '顺序', '节点', '排序'] },
      { key: 'place', label: '地点', aliases: ['地点', '场景', '位置', '场所'] },
      { key: 'characterNames', label: '相关人物', aliases: ['相关人物', '人物', '角色', '登场人物', '涉及人物', '出场人物'] },
      { key: 'status', label: '状态', aliases: ['状态', '进度', '阶段'] },
      { key: 'summary', label: '摘要', aliases: ['摘要', '简介', '内容', '梗概', '描述', '说明'] }
    ]
  },
  world: {
    key: 'world', label: '世界观', unit: '条',
    fields: [
      { key: 'plane', label: '位面', aliases: ['位面', '世界', '界面', '位面名'] },
      { key: 'continent', label: '大陆', aliases: ['大陆', '洲', '州', '地域', '区域'] },
      { key: 'sect', label: '宗门', req: true, aliases: ['宗门', '门派', '势力', '组织', '教派', '家族', '帮派'] },
      { key: 'desc', label: '描述', aliases: ['描述', '简介', '说明', '备注', '介绍'] },
      { key: 'align', label: '阵营', aliases: ['阵营', '立场', '正邪', '善恶', '性质'] }
    ]
  }
};
const CAT_KEYS = ['characters', 'plots', 'world'];
const PALETTE = ['#2F6F63', '#3D7F71', '#8A6A2F', '#6B2B4A', '#2F4A6F', '#A8322A', '#7C5C8C', '#4A5E8C'];
const PREVIEW_ROWS = 12;

/* 本次会话内的导入记录（模块级，切换页面不丢） */
const history = [];
let cleanup = null;

/* =========================================================================
 * 二、通用小工具
 * ========================================================================= */
function baseName(p) { return String(p || '').split(/[\\/]/).pop(); }
function cell(v) { return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
function clip(s, n) { const t = cell(s); return t.length > n ? t.slice(0, n) + '…' : t; }
function splitList(v) { return String(v || '').split(/[、,，;；/|]+|\s+/).map(s => s.trim()).filter(Boolean); }
function numOf(v) { const m = String(v == null ? '' : v).match(/\d+(\.\d+)?/); return m ? Number(m[0]) : 0; }
function normKey(s) { return String(s || '').replace(/[\s\u3000]/g, '').replace(/[（(【\[].*?[）)】\]]/g, '').toLowerCase(); }
function pad2(n) { return String(n).padStart(2, '0'); }
function clockOf(ts) { const d = new Date(ts); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds()); }
function stampOf(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return (d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}
function sizeOf(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round((n || 0) / 1024)) + ' KB'; }
function extOf(name) { const m = /\.([^.]+)$/.exec(String(name || '')); return m ? m[1].toUpperCase() : '文件'; }
/* 主进程抛回来的错误会带 "Error invoking remote method 'import:parse': Error: " 前缀，展示时去掉 */
function cleanErr(msg) {
  return String(msg == null ? '' : msg).replace(/^Error invoking remote method '[^']*':\s*/, '').replace(/^Error:\s*/, '').trim();
}

/* 兜底：拖拽进来的文件在渲染层直接读出内容时，按 app/lib/parse.js 的同样规则识别类别 */
function guessCategoryByHeaders(headers) {
  const t = headers.join(',').toLowerCase();
  const has = function () { return Array.prototype.some.call(arguments, function (k) { return t.indexOf(k) >= 0; }); };
  if (has('姓名', '名字', '年龄', '身份', '人设', '修为')) return 'characters';
  if (has('情节', '章节', '时间点', '地点')) return 'plots';
  if (has('位面', '大陆', '宗门', '势力', '境界')) return 'world';
  return 'unknown';
}
/* 兜底：与 app/lib/parse.js 的 parseCsv 同一套规则（逗号 / 制表符 / 引号 / 换行） */
function parseCsvText(text) {
  const rows = [];
  let row = [], buf = '', quote = false;
  const src = String(text || '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === '"') { if (src[i + 1] === '"') { buf += '"'; i++; } else quote = false; } else buf += c;
    } else if (c === '"') quote = true;
    else if (c === ',' || c === '\t') { row.push(buf); buf = ''; }
    else if (c === '\r') { /* 忽略 */ }
    else if (c === '\n') { row.push(buf); rows.push(row); row = []; buf = ''; }
    else buf += c;
  }
  if (buf.length || row.length) { row.push(buf); rows.push(row); }
  return rows.filter(function (r) { return r.some(function (x) { return String(x).trim() !== ''; }); });
}

/* 按列名猜一次映射：完全同名 → 别名同名 → 互相包含 */
function guessMapping(headers, category) {
  const fields = CATS[category].fields;
  const pool = fields.map(function (f) { return { f: f, keys: [f.label].concat(f.aliases || []).map(normKey) }; });
  const map = headers.map(function () { return ''; });
  const used = {};
  headers.forEach(function (hd, i) {
    const n = normKey(hd);
    if (!n) return;
    const free = pool.filter(function (x) { return !used[x.f.key]; });
    let hit = free.filter(function (x) { return x.keys[0] === n; })[0];
    if (!hit) hit = free.filter(function (x) { return x.keys.some(function (k) { return k === n; }); })[0];
    if (!hit) hit = free.filter(function (x) {
      return x.keys.some(function (k) { return k.length >= 2 && (n.indexOf(k) >= 0 || k.indexOf(n) >= 0); });
    })[0];
    if (hit) { map[i] = hit.f.key; used[hit.f.key] = true; }
  });
  return map;
}

/* 解析结果 → 当前工作表（xlsx 可有多张） */
function tableOf(data, sheet) {
  if (!data) return { headers: [], rows: [] };
  if (Array.isArray(data.sheets) && data.sheets.length) {
    const s = data.sheets[sheet] || data.sheets[0] || { rows: [] };
    const rows = s.rows || [];
    return { headers: (rows[0] || []).map(cell), rows: rows.slice(1) };
  }
  return { headers: (data.headers || []).map(cell), rows: data.rows || [] };
}

/* 状态文字 → doc.plots[].status */
function mapStatus(v) {
  const s = String(v || '');
  if (/(结局|终章|结尾|收束)/.test(s)) return 'ending';
  if (/(后续|计划|待写|未来|未发生|打算)/.test(s)) return 'later';
  return 'done';
}
/* 阵营文字 → doc.planes[].sects[].align */
function mapAlign(v) {
  const s = String(v || '').trim();
  for (const k in ALIGN) if (s.indexOf(ALIGN[k].label) >= 0) return k;
  if (/(中|平)/.test(s)) return 'neutral';
  if (/(正|善|白)/.test(s)) return 'good';
  if (/(邪|恶|魔|黑)/.test(s)) return 'evil';
  if (/(隐|避|世外)/.test(s)) return 'hidden';
  return 'neutral';
}

/* 已有数据里的名字，用于判断「已存在（会更新）」 */
function existingNames(doc, category) {
  if (category === 'characters') return new Set((doc.characters || []).map(function (c) { return c.name; }));
  if (category === 'plots') return new Set((doc.plots || []).map(function (p) { return p.title; }));
  const set = new Set();
  (doc.planes || []).forEach(function (pl) { (pl.sects || []).forEach(function (s) { set.add(s.name); }); });
  return set;
}

/* 按映射把表格行整理成待导入模型，并逐行校验：
 *   缺少必填 → 红；已存在 / 表格内重名 → 黄；缺人设 / 摘要 / 描述 → 黄 */
function buildRows(doc, category, headers, rows, mapping) {
  const fields = CATS[category].fields;
  const reqKey = (fields.filter(function (f) { return f.req; })[0] || fields[0]).key;
  const softKey = category === 'plots' ? 'summary' : category === 'world' ? 'desc' : 'persona';
  const known = existingNames(doc, category);
  const seen = new Set();
  return rows.map(function (raw, i) {
    const vals = {};
    fields.forEach(function (f) { vals[f.key] = ''; });
    headers.forEach(function (_, c) { const k = mapping[c]; if (k) vals[k] = cell(raw[c]); });
    const model = { i: i, vals: vals, issues: [], checked: true, short: (raw || []).length < headers.length };
    const name = vals[reqKey];
    if (!name) model.issues.push({ lv: 'e', text: '缺少必填' });
    else if (known.has(name)) model.issues.push({ lv: 'w', text: '已存在（会更新）' });
    else if (seen.has(name)) model.issues.push({ lv: 'w', text: '表格内重名' });
    if (name) seen.add(name);
    if (!vals[softKey]) model.issues.push({ lv: 'w', text: '信息不全' });
    model.checked = model.issues.length === 0;
    return model;
  });
}

/* =========================================================================
 * 三、写入 doc（导入动作全部在渲染层完成）
 * ========================================================================= */
function importCharacters(doc, picked, res) {
  doc.characters = doc.characters || [];
  const byName = new Map(doc.characters.map(function (c) { return [c.name, c]; }));
  picked.forEach(function (m) {
    const v = m.vals;
    const name = v.name;
    const aliases = splitList(v.aliases);
    const ex = byName.get(name);
    if (ex) {
      if (v.age) ex.age = v.age;
      if (v.identity) ex.identity = v.identity;
      if (v.persona) ex.persona = v.persona;
      if (v.realm) ex.realm = v.realm;
      if (v.ending) ex.ending = v.ending;
      if (v.group) ex.group = v.group;
      ex.aliases = ex.aliases || [];
      aliases.forEach(function (a) { if (ex.aliases.indexOf(a) < 0) ex.aliases.push(a); });
      res.updated++;
      return;
    }
    const c = {
      id: uid('c'), name: name, aliases: aliases, age: v.age, identity: v.identity, realm: v.realm,
      persona: v.persona, ending: v.ending, group: v.group || '导入',
      color: PALETTE[doc.characters.length % PALETTE.length], portrait: null, relations: []
    };
    doc.characters.push(c);
    byName.set(name, c);
    res.added++;
  });
}

function importPlots(doc, picked, res) {
  doc.plots = doc.plots || [];
  const byTitle = new Map(doc.plots.map(function (p) { return [p.title, p]; }));
  const nameToId = new Map((doc.characters || []).map(function (c) { return [c.name, c.id]; }));
  let maxT = 0;
  doc.plots.forEach(function (p) { if ((p.timePoint || 0) > maxT) maxT = p.timePoint; });
  picked.forEach(function (m) {
    const v = m.vals;
    const title = v.title;
    const ids = [];
    splitList(v.characterNames).forEach(function (n) {
      const id = nameToId.get(n);
      if (id) { if (ids.indexOf(id) < 0) ids.push(id); } else res.missing++;
    });
    const chapter = v.chapter;
    const chapterNo = numOf(chapter);
    const tp = numOf(v.timePoint);
    const ex = byTitle.get(title);
    if (ex) {
      if (v.summary) ex.summary = v.summary;
      if (chapter) { ex.chapter = chapter; ex.chapterNo = chapterNo || ex.chapterNo || 0; }
      if (v.place) ex.place = v.place;
      if (tp) ex.timePoint = tp;
      if (v.status) ex.status = mapStatus(v.status);
      if (ids.length) {
        const merged = (ex.characterIds || []).slice();
        ids.forEach(function (id) { if (merged.indexOf(id) < 0) merged.push(id); });
        ex.characterIds = merged;
      }
      res.updated++;
      return;
    }
    let timePoint = tp;
    if (!timePoint) { maxT += 1; timePoint = maxT; }
    const plot = {
      id: uid('g'), title: title, chapterNo: chapterNo, chapter: chapter,
      timePoint: timePoint, place: v.place, characterIds: ids,
      status: mapStatus(v.status), summary: v.summary
    };
    doc.plots.push(plot);
    byTitle.set(title, plot);
    res.added++;
  });
}

function newPlane(name) {
  return {
    id: uid('ap'), name: name || '导入位面', note: '导入数据', baseImage: null,
    continents: [], sects: [], sectRelations: [], realms: [], lore: []
  };
}
function planeFor(doc, name) {
  doc.planes = doc.planes || [];
  if (!doc.planes.length) { const p = newPlane(name); doc.planes.push(p); return p; }
  const n = cell(name);
  if (!n) return doc.planes[0];
  const hit = doc.planes.filter(function (p) { return p.name === n; })[0];
  if (hit) return hit;
  const p = newPlane(n);
  doc.planes.push(p);
  return p;
}
function continentFor(plane, name) {
  plane.continents = plane.continents || [];
  const n = cell(name);
  if (!n) return null;
  const hit = plane.continents.filter(function (c) { return c.name === n; })[0];
  if (hit) return hit;
  const i = plane.continents.length;
  const c = {
    id: uid('ak'), name: n, note: '导入', color: '#EFE2C6',
    cx: 200 + (i % 3) * 240, cy: 210 + Math.floor(i / 3) * 190, rx: 120, ry: 96
  };
  plane.continents.push(c);
  return c;
}
function importWorld(doc, picked, res) {
  picked.forEach(function (m) {
    const v = m.vals;
    const plane = planeFor(doc, v.plane);
    const name = v.sect;
    plane.sects = plane.sects || [];
    const align = v.align ? mapAlign(v.align) : '';
    const ex = plane.sects.filter(function (s) { return s.name === name; })[0];
    if (ex) {
      if (v.desc) ex.desc = v.desc;
      if (align) ex.align = align;
      res.updated++;
      return;
    }
    const cont = v.continent ? continentFor(plane, v.continent) : null;
    const n = plane.sects.length;
    plane.sects.push({
      id: uid('as'), name: name, continentId: cont ? cont.id : '',
      x: cont ? cont.cx + 46 : 260 + (n % 5) * 58,
      y: cont ? cont.cy + 34 : 280 + Math.floor(n / 5) * 56,
      align: align || 'neutral', size: 1, members: '', desc: v.desc, characterIds: []
    });
    res.added++;
  });
}

function doImport(doc, category, picked) {
  const res = { added: 0, updated: 0, skipped: 0, missing: 0 };
  if (category === 'characters') importCharacters(doc, picked, res);
  else if (category === 'plots') importPlots(doc, picked, res);
  else importWorld(doc, picked, res);
  return res;
}

/* =========================================================================
 * 四、页面
 * ========================================================================= */
export default {
  id: 'importer',
  label: '导入导出',
  statusText(doc) {
    return '人物 ' + (doc.characters || []).length + ' · 情节 ' + (doc.plots || []).length + ' · 本次导入 ' + history.length + ' 次';
  },
  unmount() { if (cleanup) { cleanup(); cleanup = null; } },
  mount(root, ctx) {
    const doc = ctx.doc;
    const NF = ctx.NF;

    /* phase: empty | loading | error | text | wizard；step: 1 识别 / 2 列映射 / 3 校验导入 */
    const st = {
      phase: 'empty', data: null, filename: '', error: '', sheet: 0,
      category: 'characters', auto: false, step: 1, mapping: [], rows: []
    };

    const wrap = h('div', { class: 'imp' });
    const head = h('div', { class: 'imp-head', 'data-probe': 'imp-head' },
      h('div', null,
        h('h1', { class: 'kai' }, '导入导出'),
        h('p', null, '把已有的 CSV / Excel / Word 资料导进软件，也可以把全部数据导出成 JSON 备份。')),
      h('div', { class: 'grow' }),
      h('div', { class: 'row' },
        h('button', { class: 'btn pri', onclick: exportData }, '⤓ 导出全部数据（JSON）'),
        h('button', { class: 'btn', onclick: restoreJson }, '⤒ 从 JSON 恢复')));
    const host = h('div', { class: 'imp-host' });
    const recCard = h('section', { class: 'card imp-sec imp-rec', 'data-probe': 'imp-rec' });
    const bkList = h('div', { class: 'imp-bks', 'data-probe': 'imp-backups' });
    const sideCard = h('section', { class: 'card imp-side', 'data-probe': 'imp-export' });
    wrap.appendChild(head);
    wrap.appendChild(h('div', { class: 'imp-grid' },
      h('div', { class: 'imp-col' }, host, recCard),
      sideCard));
    root.appendChild(wrap);

    /* ---------------- 拖拽区 ---------------- */
    function dropCard() {
      const zone = h('div', { class: 'imp-drop', 'data-probe': 'imp-drop', title: '点击选择文件，或把文件拖到这里' },
        h('div', { class: 'imp-ico' }, '⤒'),
        h('div', { class: 't1' }, '把文件拖到这里，或点击选择'),
        h('div', { class: 't2' }, '支持 CSV / XLSX / XLS / DOCX / MD / TXT'),
        h('div', { class: 'imp-tags' }, ['CSV', 'XLSX', 'XLS', 'DOCX', 'MD', 'TXT'].map(function (t) {
          return h('span', { class: 'imp-tag' }, t);
        })));
      zone.addEventListener('click', chooseFile);
      let depth = 0;
      zone.addEventListener('dragenter', function (e) { e.preventDefault(); depth++; zone.classList.add('over'); });
      zone.addEventListener('dragover', function (e) { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; });
      zone.addEventListener('dragleave', function (e) {
        e.preventDefault();
        depth = Math.max(0, depth - 1);
        if (!depth) zone.classList.remove('over');
      });
      zone.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        depth = 0;
        zone.classList.remove('over');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) loadDropped(f);
      });
      return zone;
    }

    function tipsCard() {
      const line = function (k) { return CATS[k].fields.map(function (f) { return f.label; }).join(' · '); };
      return h('section', { class: 'card imp-tips', 'data-probe': 'imp-tips' },
        h('b', null, '导入说明'),
        h('div', null, h('i', null, '·'), '表格第一行须是列名，写成「姓名 / 身份 / 人设」这类常用叫法即可；进入列映射后还能手动改对应关系。'),
        h('div', null, h('i', null, '·'), '人物：' + line('characters')),
        h('div', null, h('i', null, '·'), '情节：' + line('plots')),
        h('div', null, h('i', null, '·'), '世界观：' + line('world')),
        h('div', null, h('i', null, '·'), '同名的行不会重复创建，会更新已有资料；整本书（DOCX / MD / TXT）请到「书籍分析」拆书。'));
    }

    /* ---------------- 加载 / 错误 / 整本书 ---------------- */
    function stateCard(o) {
      const card = h('div', { class: 'card imp-state', 'data-probe': 'imp-state' });
      if (o.spin) card.appendChild(h('span', { class: 'spin' }));
      else if (o.icon) card.appendChild(h('div', { class: 'imp-ico', style: o.iconStyle || null }, o.icon));
      card.appendChild(h('div', { class: 't1' }, o.title));
      if (o.msg) card.appendChild(h('div', { class: 'msg' }, o.msg));
      if (o.actions) card.appendChild(h('div', { class: 'acts' }, o.actions));
      return card;
    }

    function errorCard() {
      const extra = /\.xls$/i.test(st.filename) ? ' 旧版 XLS 需要先在 Excel 里另存为 XLSX 或 CSV。' : '';
      return stateCard({
        icon: '✕', iconStyle: { background: '#A8322A' },
        title: st.filename + ' · 解析失败',
        msg: st.error + '。' + extra + '可以换一个文件再试。',
        actions: [h('button', { class: 'btn', onclick: reset }, '重新选择文件')]
      });
    }

    function textCard() {
      const count = words((st.data && st.data.text) || 0);
      return stateCard({
        icon: '✧', iconStyle: { background: '#B98A3C' },
        title: '这是整本书，请去「书籍分析」里拆书',
        msg: (st.data.filename || st.filename) + ' · 约 ' + count.toLocaleString('zh-CN') + ' 字。这里不做拆分：在书籍分析里导入整本书、按章节切开并分析出人物与情节，再一键入库更稳妥。',
        actions: [
          h('button', { class: 'btn pri', onclick: function () { NF.go('book'); } }, '去书籍分析 ›'),
          h('button', { class: 'btn', onclick: reset }, '重新选择文件')
        ]
      });
    }

    /* ---------------- 向导外壳 ---------------- */
    function stepsBar() {
      const labels = ['识别', '列映射', '校验与导入'];
      const bar = h('div', { class: 'imp-steps', 'data-probe': 'imp-steps' });
      labels.forEach(function (lb, i) {
        const n = i + 1;
        if (i) bar.appendChild(h('div', { class: 'imp-stepline' }));
        bar.appendChild(h('div', { class: 'imp-step' + (st.step === n ? ' on' : st.step > n ? ' done' : '') },
          h('i', null, st.step > n ? '✓' : String(n)),
          h('span', null, lb)));
      });
      bar.appendChild(h('div', { class: 'grow' }));
      bar.appendChild(h('span', { class: 'tiny muted', style: { marginLeft: '10px' } }, clip(st.filename, 30)));
      return bar;
    }

    function counts() {
      const total = st.rows.length;
      const ok = st.rows.filter(function (r) { return r.checked; }).length;
      return { total: total, ok: ok };
    }

    function footBar() {
      const foot = h('div', { class: 'imp-wfoot' });
      if (st.step === 3) {
        const c = counts();
        foot.appendChild(h('span', { class: 'imp-cnt' },
          '共 ', h('b', null, String(c.total)), ' 行 · 可导入 ', h('b', null, String(c.ok)), ' 行 · 跳过 ',
          h('b', null, String(c.total - c.ok)), ' 行'));
        foot.appendChild(h('div', { class: 'grow' }));
        foot.appendChild(h('button', { class: 'btn', onclick: function () { gotoStep(2); } }, '上一步'));
        foot.appendChild(h('button', { class: 'btn', onclick: reset }, '取消'));
        foot.appendChild(h('button', {
          class: 'btn pri', disabled: !c.ok, onclick: runImport
        }, c.ok ? '导入 ' + c.ok + ' 行' : '没有可导入的行'));
        return foot;
      }
      foot.appendChild(h('span', { class: 'imp-note' }, st.step === 1 ? '确认类型和类别后进入列映射' : '列与字段对好后再校验'));
      foot.appendChild(h('div', { class: 'grow' }));
      if (st.step === 2) foot.appendChild(h('button', { class: 'btn', onclick: function () { gotoStep(1); } }, '上一步'));
      foot.appendChild(h('button', { class: 'btn', onclick: reset }, '取消'));
      foot.appendChild(h('button', {
        class: 'btn pri', onclick: function () { gotoStep(st.step + 1); }
      }, st.step === 1 ? '下一步 ›' : '校验数据 ›'));
      return foot;
    }

    function wizardCard() {
      const card = h('section', { class: 'card imp-wiz', 'data-probe': 'imp-wizard' });
      card.appendChild(stepsBar());
      /* 第 1 步内容少，卡片撑高时把内容垂直居中，避免卡片中间空一大块 */
      card.appendChild(h('div', { class: 'imp-wbody' + (st.step === 1 ? ' c' : '') },
        st.step === 1 ? stepIdentify() : st.step === 2 ? stepMapping() : stepCheck()));
      card.appendChild(footBar());
      return card;
    }

    /* ---------------- 第 1 步：识别 ---------------- */
    function sheetPicker() {
      const sel = h('select', { class: 'select', style: { width: 'auto' } },
        st.data.sheets.map(function (s, i) {
          return h('option', { value: String(i), selected: i === st.sheet }, '工作表 ' + (i + 1));
        }));
      sel.addEventListener('change', function () {
        const i = Number(sel.value) || 0;
        const t = tableOf(st.data, i);
        if (!t.headers.length || !t.rows.length) { toast('这个工作表里没有表格数据', 'err'); sel.value = String(st.sheet); return; }
        st.sheet = i;
        /* 类别是自动识别的，换表后重新识一遍；手动选过就保持不动 */
        const guess = guessCategoryByHeaders(t.headers);
        if (st.auto && guess !== 'unknown') st.category = guess;
        st.mapping = guessMapping(t.headers, st.category);
        st.rows = [];
        renderImport();
      });
      return h('div', { class: 'row', style: { gap: '6px' } }, h('span', { class: 'tiny muted' }, '工作表'), sel);
    }

    function catBtn(key) {
      const c = CATS[key];
      return h('div', {
        class: 'imp-cat' + (st.category === key ? ' on' : ''),
        onclick: function () {
          if (st.category === key) return;
          st.category = key;
          st.auto = false;
          st.mapping = guessMapping(tableOf(st.data, st.sheet).headers, key);
          st.rows = [];
          renderImport();
        }
      },
        h('i', null),
        c.label,
        h('small', null, c.fields.length + ' 个字段'));
    }

    function stepIdentify() {
      const t = tableOf(st.data, st.sheet);
      const info = h('div', { class: 'imp-file' },
        h('span', { class: 'pill jade' }, '表格'),
        h('div', { style: { minWidth: 0 } },
          h('div', { class: 'nm' }, st.data.filename || st.filename),
          h('div', { class: 'meta' }, t.headers.length + ' 列 · ' + t.rows.length + ' 行 · ' + extOf(st.data.filename || st.filename))),
        h('div', { class: 'grow' }),
        Array.isArray(st.data.sheets) && st.data.sheets.length > 1 ? sheetPicker() : null);
      return [
        info,
        h('div', { class: 'field' },
          h('label', null, '导入类别'),
          h('div', { class: 'imp-cats' }, CAT_KEYS.map(catBtn))),
        h('div', { class: 'imp-note' }, st.auto
          ? '已按列名自动识别为「' + CATS[st.category].label + '」，不对可以手动改。'
          : '没识别出类别，请手动选一个：人物 / 情节 / 世界观。')
      ];
    }

    /* ---------------- 第 2 步：列映射 ---------------- */
    function stepMapping() {
      const t = tableOf(st.data, st.sheet);
      const fields = CATS[st.category].fields;
      const used = st.mapping.filter(Boolean).length;
      const rows = t.headers.map(function (hd, i) {
        const sel = h('select', { class: 'select' },
          h('option', { value: '' }, '不导入'),
          fields.map(function (f) {
            return h('option', { value: f.key, selected: st.mapping[i] === f.key }, f.label + (f.req ? ' *' : ''));
          }));
        sel.value = st.mapping[i] || '';
        sel.addEventListener('change', function () {
          if (sel.value) {
            st.mapping.forEach(function (k, j) { if (j !== i && k === sel.value) st.mapping[j] = ''; });
          }
          st.mapping[i] = sel.value;
          st.rows = [];
          renderImport();
        });
        const sample = (t.rows[0] || [])[i];
        return h('div', { class: 'imp-maprow' + (st.mapping[i] ? '' : ' off') },
          h('div', { class: 'src' },
            h('b', null, t.headers[i] || ('第 ' + (i + 1) + ' 列')),
            h('small', null, sample ? '示例：' + clip(sample, 22) : '空值')),
          sel);
      });
      const req = (fields.filter(function (f) { return f.req; })[0] || {}).label || '';
      return [
        h('div', { class: 'row' },
          h('span', { class: 'imp-cnt' }, '共 ' + t.headers.length + ' 列 · 已映射 ' + used + ' 列'),
          h('span', { class: 'grow' }),
          h('span', { class: 'imp-note' }, '带 * 为必填（' + req + '），对不上的列选「不导入」')),
        h('div', { class: 'imp-map', 'data-probe': 'imp-mapping' }, rows)
      ];
    }

    /* ---------------- 第 3 步：校验与导入 ---------------- */
    function rowTr(m, fields) {
      const level = m.issues.some(function (x) { return x.lv === 'e'; }) ? 'err' : m.issues.length ? 'warn' : 'ok';
      return h('tr', { class: level },
        h('td', { class: 'c' }, h('input', {
          type: 'checkbox', checked: m.checked,
          onchange: function (e) { m.checked = e.target.checked; renderImport(); }
        })),
        h('td', { class: 'c no' }, String(m.i + 1)),
        fields.map(function (f) {
          const val = m.vals[f.key];
          return h('td', { title: val || '' }, val ? clip(val, 42) : '—');
        }),
        h('td', null, m.issues.length
          ? h('span', { class: 'imp-iss' }, m.issues.map(function (x) {
            return h('span', { class: 'imp-flag ' + (x.lv === 'e' ? 'e' : 'w') }, x.text);
          }))
          : h('span', { class: 'imp-flag ok' }, '通过')));
    }

    function stepCheck() {
      const fields = CATS[st.category].fields.filter(function (f) { return st.mapping.indexOf(f.key) >= 0; });
      const show = fields.length ? fields : CATS[st.category].fields;
      const models = st.rows;
      const shown = models.slice(0, PREVIEW_ROWS);
      const allOn = models.every(function (m) { return m.checked; });
      const head = h('div', { class: 'row' },
        h('span', { class: 'small sub' }, '预览前 ' + Math.min(PREVIEW_ROWS, models.length) + ' 行，逐行给校验结果'),
        h('span', { class: 'grow' }),
        h('button', {
          class: 'btn xs', onclick: function () {
            models.forEach(function (m) { m.checked = !m.issues.some(function (i) { return i.lv === 'e'; }); });
            renderImport();
          }
        }, '勾选无错行'),
        h('button', {
          class: 'btn xs', onclick: function () { models.forEach(function (m) { m.checked = false; }); renderImport(); }
        }, '全不选'));
      const thead = h('thead', null, h('tr', null,
        h('th', { class: 'c' }, h('input', {
          type: 'checkbox', checked: allOn,
          onchange: function (e) {
            const on = e.target.checked;
            models.forEach(function (m) { m.checked = on; });
            renderImport();
          }
        })),
        h('th', { class: 'c' }, '#'),
        show.map(function (f) { return h('th', null, f.label + (f.req ? ' *' : '')); }),
        h('th', null, '校验')));
      const table = h('div', { class: 'imp-tblwrap', 'data-probe': 'imp-preview' },
        h('table', { class: 'imp-tbl' }, thead,
          h('tbody', null, shown.map(function (m) { return rowTr(m, show); }))));
      const shortCount = models.filter(function (m) { return m.short; }).length;
      const tail = shortCount
        ? h('div', { class: 'imp-note' }, '注意：有 ' + shortCount + ' 行的单元格数少于表头（Excel 会跳过空单元格），这类行可能整体左移，请对照预览再勾选。')
        : null;
      return [head, table, tail];
    }

    /* ---------------- 渲染入口 ---------------- */
    function renderImport() {
      clear(host);
      if (st.phase === 'empty') { host.appendChild(dropCard()); host.appendChild(tipsCard()); return; }
      if (st.phase === 'loading') {
        host.appendChild(stateCard({ spin: true, title: '正在解析 ' + st.filename, msg: '读取表头与内容，请稍候…' }));
        return;
      }
      if (st.phase === 'error') { host.appendChild(errorCard()); return; }
      if (st.phase === 'text') { host.appendChild(textCard()); return; }
      host.appendChild(wizardCard());
    }

    /* ---------------- 流程 ---------------- */
    function reset() {
      st.phase = 'empty'; st.data = null; st.filename = ''; st.error = '';
      st.sheet = 0; st.step = 1; st.mapping = []; st.rows = []; st.auto = false;
      renderImport();
    }

    async function chooseFile() {
      try {
        const r = await window.nf.files.pick({
          title: '选择要导入的文件',
          filters: [{ name: '表格 / 文档', extensions: ['csv', 'xlsx', 'xls', 'docx', 'md', 'txt'] }]
        });
        if (!r || r.canceled) return;
        loadFile(r.file);
      } catch (e) { toast('选择文件失败：' + e.message, 'err'); }
    }

    function enterTable(data, fallbackName) {
      const t = tableOf(data, 0);
      if (!t.headers.length || !t.rows.length) throw new Error('没有读到表格数据：第一行需要是列名');
      st.data = data;
      st.sheet = 0;
      st.filename = data.filename || fallbackName || st.filename;
      const known = data.category && data.category !== 'unknown' ? data.category : '';
      st.category = known || 'characters';
      st.auto = !!known;
      st.mapping = guessMapping(t.headers, st.category);
      st.step = 1;
      st.rows = [];
      st.phase = 'wizard';
      renderImport();
    }

    async function loadFile(file) {
      st.phase = 'loading';
      st.filename = baseName(file);
      st.error = '';
      renderImport();
      try {
        const data = await window.nf.imp.parse(file);
        if (!data || !data.kind) throw new Error('没有读到文件内容');
        if (data.kind === 'text') {
          st.data = data;
          st.filename = data.filename || st.filename;
          st.phase = 'text';
          renderImport();
          return;
        }
        enterTable(data, baseName(file));
      } catch (e) {
        st.phase = 'error';
        st.error = cleanErr(e && e.message ? e.message : e);
        renderImport();
      }
    }

    /* 拖拽：Electron 32 起 File.path 被移除，改用 preload 暴露的
     * webUtils.getPathForFile；拿不到路径时文本类文件在渲染层读内容兜底。 */
    async function loadDropped(file) {
      let path = '';
      try { path = (window.nf && window.nf.files && window.nf.files.pathFor) ? window.nf.files.pathFor(file) : ''; } catch (e) { path = ''; }
      if (!path) path = file.path || '';
      if (path) { loadFile(path); return; }
      const name = file.name || '';
      if (!/\.(csv|txt|md)$/i.test(name)) {
        toast('拖入的 Excel / Word 文件拿不到路径，请点「点击选择」挑文件', 'err');
        return;
      }
      st.phase = 'loading';
      st.filename = name;
      renderImport();
      try {
        const text = await file.text();
        if (/\.csv$/i.test(name)) {
          const rows = parseCsvText(text);
          enterTable({
            kind: 'table', filename: name, headers: rows[0] || [], rows: rows.slice(1),
            category: guessCategoryByHeaders(rows[0] || [])
          }, name);
        } else {
          st.data = { kind: 'text', filename: name, text: text, category: 'book' };
          st.phase = 'text';
          renderImport();
        }
      } catch (e) {
        st.phase = 'error';
        st.error = cleanErr(e && e.message ? e.message : e);
        renderImport();
      }
    }

    function gotoStep(n) {
      if (n === 2) {
        if (!tableOf(st.data, st.sheet).headers.length) { toast('没有可映射的列', 'err'); return; }
        st.step = 2;
        renderImport();
        return;
      }
      if (n === 3) {
        if (!st.mapping.filter(Boolean).length) { toast('还没有选择要导入的字段', 'err'); return; }
        const t = tableOf(st.data, st.sheet);
        st.rows = buildRows(doc, st.category, t.headers, t.rows, st.mapping);
        st.step = 3;
        renderImport();
        return;
      }
      st.step = 1;
      renderImport();
    }

    function runImport() {
      const cat = st.category;
      const picked = st.rows.filter(function (r) { return r.checked; });
      if (!picked.length) return;
      let res;
      try {
        res = doImport(doc, cat, picked);
      } catch (e) {
        history.unshift({
          at: Date.now(), filename: st.filename, cat: CATS[cat].label,
          added: 0, updated: 0, skipped: 0, ok: false, note: '导入失败：' + e.message
        });
        renderRecords();
        toast('导入失败：' + e.message, 'err');
        return;
      }
      history.unshift({
        at: Date.now(), filename: st.filename, cat: CATS[cat].label,
        added: res.added, updated: res.updated, skipped: res.skipped, ok: true,
        note: res.missing ? res.missing + ' 个相关人物未匹配' : ''
      });
      NF.save();
      const parts = [];
      if (res.added) parts.push('新增 ' + res.added + ' ' + CATS[cat].unit);
      if (res.updated) parts.push('更新 ' + res.updated + ' ' + CATS[cat].unit);
      if (res.skipped) parts.push('跳过 ' + res.skipped + ' 行');
      toast(parts.length ? parts.join(' / ') : '没有可导入的行', parts.length ? 'ok' : 'err');
      reset();
      renderRecords();
    }

    /* ---------------- 导入记录 ---------------- */
    function renderRecords() {
      clear(recCard);
      recCard.appendChild(h('div', { class: 'row' },
        h('h3', null, '导入记录'),
        h('span', { class: 'tiny muted' }, '本次会话 ' + history.length + ' 条'),
        h('div', { class: 'grow' }),
        history.length ? h('button', {
          class: 'btn xs', onclick: function () { history.length = 0; renderRecords(); }
        }, '清空') : null));
      const cols = ['时间', '文件名', '类别', '结果', '状态'];
      if (!history.length) {
        recCard.appendChild(h('table', { class: 'imp-rtbl' },
          h('thead', null, h('tr', null, cols.map(function (t) { return h('th', null, t); })))));
        recCard.appendChild(h('div', { class: 'empty', style: { fontSize: '11.5px' } },
          '本次会话还没有导入记录',
          h('div', { class: 'tiny muted' }, '导入完成后，这里会记下时间、文件名、类别和新增 / 跳过数量')));
        return;
      }
      recCard.appendChild(h('table', { class: 'imp-rtbl' },
        h('thead', null, h('tr', null, cols.map(function (t) { return h('th', null, t); }))),
        h('tbody', null, history.map(function (r) {
          return h('tr', null,
            h('td', { class: 'muted' }, clockOf(r.at)),
            h('td', { title: r.filename }, clip(r.filename, 28)),
            h('td', null, r.cat),
            h('td', null, '新增 ' + r.added + ' · 更新 ' + r.updated + ' · 跳过 ' + r.skipped),
            h('td', null,
              h('span', { class: 'pill ' + (r.ok ? 'jade' : 'seal') }, r.ok ? '完成' : '失败'),
              r.note ? h('span', { class: 'tiny muted' }, clip(r.note, 22)) : null));
        }))));
    }

    /* ---------------- 导出 / 备份 ---------------- */
    async function exportData() {
      try {
        const r = await window.nf.data.exportJson();
        if (!r || r.canceled) return;
        toast('已导出到 ' + baseName(r.file), 'ok');
      } catch (e) { toast('导出失败：' + e.message, 'err'); }
    }

    async function restoreJson() {
      try {
        const d = await window.nf.data.importJson();
        if (!d || d.canceled) return;
        NF.doc = d;
        toast('已从 JSON 恢复数据', 'ok');
        NF.refresh();
      } catch (e) { toast('恢复失败：' + e.message, 'err'); }
    }

    async function backupNow() {
      try {
        const r = await window.nf.data.backupNow();
        toast('已备份 · ' + baseName(r && r.file), 'ok');
        loadBackups();
      } catch (e) { toast('备份失败：' + e.message, 'err'); }
    }

    function restoreBackup(b) {
      modal({
        title: '恢复备份',
        width: '470px',
        body: h('div', { class: 'col' },
          h('p', { class: 'small sub', style: { margin: 0, lineHeight: '1.8' } },
            '恢复会用这份备份覆盖当前全部数据（人物、情节、世界观、拆书结果）。建议先「立即备份」，留一份现在的。'),
          h('div', { class: 'imp-file' },
            h('div', null,
              h('div', { class: 'nm' }, stampOf(b.mtime) + ' 的备份'),
              h('div', { class: 'meta' }, b.name + ' · ' + sizeOf(b.size))))),
        okText: '恢复',
        onOk: async function () {
          try {
            const d = await window.nf.data.restore(b.name);
            if (!d || typeof d !== 'object') throw new Error('备份内容无效');
            NF.doc = d;
            toast('已恢复到 ' + stampOf(b.mtime) + ' 的备份', 'ok');
            NF.refresh();
          } catch (e) {
            toast('恢复失败：' + e.message, 'err');
            return false;
          }
        }
      });
    }

    async function loadBackups() {
      clear(bkList);
      bkList.appendChild(h('div', { class: 'tiny muted' }, '读取中…'));
      try {
        const list = await window.nf.data.backups();
        clear(bkList);
        if (!list || !list.length) {
          bkList.appendChild(h('div', { class: 'tiny muted' }, '还没有备份，点「立即备份」生成一份'));
          return;
        }
        list.slice(0, 8).forEach(function (b) {
          bkList.appendChild(h('div', { class: 'imp-bkrow' },
            h('span', { class: 't' }, stampOf(b.mtime)),
            h('span', { class: 's' }, sizeOf(b.size)),
            h('span', { class: 'grow' }),
            h('button', { class: 'btn', onclick: function () { restoreBackup(b); } }, '恢复')));
        });
      } catch (e) {
        clear(bkList);
        bkList.appendChild(h('div', { class: 'tiny muted' }, '备份列表读取失败：' + e.message));
      }
    }

    function renderSide() {
      clear(sideCard);
      sideCard.appendChild(h('h3', null, '导出与备份'));
      sideCard.appendChild(h('p', null, '全部数据（人物、情节、世界观、拆书结果、设置）导出成一个 JSON 文件，换机或重装时用它恢复。'));
      sideCard.appendChild(h('button', { class: 'btn pri', onclick: exportData }, '⤓ 导出数据'));
      sideCard.appendChild(h('button', { class: 'btn', onclick: restoreJson }, '⤒ 从 JSON 恢复'));
      sideCard.appendChild(h('div', { class: 'imp-bk' },
        h('div', { class: 'row' },
          h('span', { class: 'small', style: { fontWeight: '700' } }, '备份管理'),
          h('div', { class: 'grow' }),
          h('button', { class: 'btn xs', onclick: backupNow }, '立即备份')),
        bkList,
        h('div', { class: 'tiny muted' }, '保存时自动生成备份，最多保留 30 份')));
      loadBackups();
    }

    /* ---------------- 启动 ---------------- */
    const stopDrag = function (e) { e.preventDefault(); };
    document.addEventListener('dragover', stopDrag);
    document.addEventListener('drop', stopDrag);
    cleanup = function () {
      document.removeEventListener('dragover', stopDrag);
      document.removeEventListener('drop', stopDrag);
    };

    renderImport();
    renderRecords();
    renderSide();
  }
};
