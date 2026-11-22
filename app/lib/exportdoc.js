'use strict';
/* 导出文档：把一本书按"范围 + 格式"渲染成 txt / md / docx / json。
 *
 * 为什么先统一成"块"再分别渲染：
 *   txt、Markdown、Word 三者排版差别很大，但结构是同一套（标题 / 小标题 / 正文 / 引用 / 分隔线）。
 *   各范围只负责产出内容块，最后交给三个渲染器 —— 排版逻辑只写一遍。
 *
 *   { t:'title', text }   文档大标题
 *   { t:'h1' | 'h2' | 'h3', text }
 *   { t:'p', text }       正文段落
 *   { t:'meta', text }    灰色小字（作者、字数、时间这类）
 *   { t:'rule' }          分隔线
 *
 * 层级约定：每个范围函数只产出"内容"，不含书名那种大标题。
 *   · 只导一个范围  → 书名做 Title，范围内容用 h1 起
 *   · 导多个范围    → 书名做 Title，每个范围一个 h1，内容整体降一级（h1→h2，h2→h3）
 * 这样不管选几个范围，Word 里的大纲层级都是连贯的，导航窗格里不会出现一排并列的 Title。
 */
const { writeZip } = require('./zipwrite');

/* ---------------- 范围定义 ----------------
 * key 同时是 JSON 导出里的键名（manuscripts / characters…），
 * 这样"只导出其中几块"的 JSON 和书本身的数据结构对得上。 */
const SCOPES = [
  { key: 'manuscripts', label: '正文', desc: '章节稿件全文' },
  { key: 'characters', label: '人物', desc: '人物档案与关系' },
  { key: 'world', label: '世界观', desc: '位面、板块、宗门、修为、设定' },
  { key: 'plots', label: '情节', desc: '情节节点与摘要' },
  { key: 'volumes', label: '卷目录', desc: '卷 / 篇的目录结构' },
  { key: 'scraps', label: '废案', desc: '废案篓里的条目' },
  { key: 'bookanalysis', label: '拆书结果', desc: '拆书抽出的人物与情节' }
];
const ALL_SCOPES = SCOPES.map(s => s.key);

/* ---------------- 小工具 ---------------- */
const CN_NUM = { '〇': 0, 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
function cnToInt(cn) {
  if (!cn) return 0;
  let total = 0, cur = 0;
  for (const ch of String(cn)) {
    if (ch === '十') { total += (cur || 1) * 10; cur = 0; }
    else if (ch === '百') { total += (cur || 1) * 100; cur = 0; }
    else if (CN_NUM[ch] != null) cur = CN_NUM[ch];
  }
  return total + cur;
}
/* 「第X章 / 第5回」里的章号，用来把稿件排成书的顺序 */
function chNum(v) {
  const t = String(v || '');
  const ar = t.match(/第\s*(\d+)\s*[章回节]/);
  if (ar) return Number(ar[1]);
  const cn = t.match(/第\s*([〇零一二三四五六七八九十百]+)\s*[章回节]/);
  if (cn) return cnToInt(cn[1]);
  const bare = t.match(/(\d+)/);
  return bare ? Number(bare[1]) : 0;
}
const manuscriptNo = m => chNum(m && m.title) || Number((m && m.chapterNo) || 0);
const clean = s => String(s == null ? '' : s).replace(/\r\n/g, '\n');
const oneLine = s => clean(s).replace(/\s+/g, ' ').trim();
const wordsOf = s => clean(s).replace(/[ \t\r\n\u3000]/g, '').length;
const STATUS_LABEL = { done: '已发生', later: '后续计划', ending: '结局节点' };
const SCRAP_KIND = { plot: '情节', character: '人物', ending: '结局', world: '设定' };
const ALIGN_LABEL = { good: '正道', neutral: '中立', evil: '邪道', hidden: '隐世' };
const VOL_STATUS = { done: '已完成', writing: '进行中', plan: '计划中' };

function fmtDate(iso) {
  const d = new Date(iso || Date.now());
  if (isNaN(d.getTime())) return '';
  const p = x => String(x).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

/* 多行文本 → 多个 p 块。空行不产出空段落。 */
function paras(text) {
  const out = [];
  for (const line of clean(text).split('\n')) {
    const s = line.replace(/[ \t]+$/, '');
    if (s.trim()) out.push({ t: 'p', text: s });
  }
  return out;
}
/* 层级整体降一级：多范围拼成一篇时用，保证标题层级不打架 */
const DEMOTE = { title: 'h1', h1: 'h2', h2: 'h3', h3: 'h3' };
function demote(blocks, times) {
  let out = blocks;
  for (let i = 0; i < (times || 1); i++) out = out.map(b => (DEMOTE[b.t] ? { t: DEMOTE[b.t], text: b.text } : b));
  return out;
}

/* ---------------- 各范围 → 内容块（不含书名那种大标题） ---------------- */
function bodyManuscripts(doc) {
  const out = [];
  const vols = Array.isArray(doc.chapters) ? doc.chapters : [];
  const all = Array.isArray(doc.manuscripts) ? doc.manuscripts : [];
  const used = new Set();
  const sorted = arr => arr.slice().sort((a, b) => (manuscriptNo(a) || 1e9) - (manuscriptNo(b) || 1e9));
  const emit = m => {
    out.push({ t: 'h2', text: m.title || '未命名' });
    const body = clean(m.content).trim();
    if (!body) out.push({ t: 'meta', text: '（这一篇还没有正文）' });
    else out.push(...paras(body));
  };

  for (const v of vols) {
    const mine = sorted(all.filter(m => m.volumeId === v.id));
    if (!mine.length) continue;
    out.push({ t: 'h1', text: v.title || '未命名卷' });
    mine.forEach(m => { used.add(m.id); emit(m); });
  }
  /* 没有对上卷的稿件（卷被删过 / 老数据）：不能悄悄丢掉，单独归到「未分卷」 */
  const rest = sorted(all.filter(m => !used.has(m.id)));
  if (rest.length) {
    out.push({ t: 'h1', text: '未分卷' });
    rest.forEach(emit);
  }
  if (!all.length) out.push({ t: 'meta', text: '（这本书还没有正文）' });
  return out;
}

function bodyCharacters(doc) {
  const out = [];
  const list = Array.isArray(doc.characters) ? doc.characters : [];
  if (!list.length) { out.push({ t: 'meta', text: '（还没有人物）' }); return out; }
  const nameOf = id => (list.find(x => x.id === id) || {}).name || '';
  /* 按分类分组，组内保持原顺序 */
  const groups = new Map();
  for (const c of list) {
    const g = String(c.group || '').trim() || '未分组';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(c);
  }
  for (const [g, arr] of groups) {
    out.push({ t: 'h1', text: g + '（' + arr.length + ' 人）' });
    for (const c of arr) {
      out.push({ t: 'h2', text: c.name || '未命名' });
      const bits = [];
      if (c.age) bits.push('年龄 ' + c.age);
      if (c.identity) bits.push('身份 ' + oneLine(c.identity));
      if (c.realm) bits.push('修为 ' + oneLine(c.realm));
      if (c.aliases && c.aliases.length) bits.push('别名 ' + c.aliases.join('、'));
      if (bits.length) out.push({ t: 'meta', text: bits.join(' · ') });
      if (c.persona) out.push({ t: 'p', text: '人设：' + oneLine(c.persona) });
      if (c.ending) out.push({ t: 'p', text: '结局：' + oneLine(c.ending) });
      /* 关系里指向的人可能已被删掉，nameOf 取不到就跳过 */
      const rels = (c.relations || [])
        .map(r => { const n = nameOf(r.targetId); return n ? n + (r.label ? '（' + r.label + '）' : '') : ''; })
        .filter(Boolean);
      if (rels.length) out.push({ t: 'p', text: '相关人物：' + rels.join('、') });
    }
  }
  return out;
}

function bodyWorld(doc) {
  const out = [];
  const planes = Array.isArray(doc.planes) ? doc.planes : [];
  if (!planes.length) { out.push({ t: 'meta', text: '（还没有世界观）' }); return out; }
  const charName = id => ((doc.characters || []).find(c => c.id === id) || {}).name || '';

  for (const p of planes) {
    out.push({ t: 'h1', text: p.name || '未命名位面' });
    if (p.note) out.push({ t: 'meta', text: oneLine(p.note) });

    const conts = p.continents || [];
    if (conts.length) {
      out.push({ t: 'h2', text: '板块（' + conts.length + '）' });
      conts.forEach(c => out.push({ t: 'p', text: '· ' + (c.name || '未命名') + (c.note ? ' —— ' + oneLine(c.note) : '') }));
    }
    const sects = p.sects || [];
    if (sects.length) {
      const contName = id => (conts.find(c => c.id === id) || {}).name || '';
      out.push({ t: 'h2', text: '宗门（' + sects.length + '）' });
      for (const s of sects) {
        const bits = [ALIGN_LABEL[s.align] || '中立'];
        if (Number(s.size)) bits.push('第 ' + Number(s.size) + ' 等');
        if (contName(s.continentId)) bits.push(contName(s.continentId));
        if (s.members) bits.push(oneLine(s.members));
        out.push({ t: 'h3', text: s.name || '未命名宗门' });
        out.push({ t: 'meta', text: bits.join(' · ') });
        if (s.desc) out.push({ t: 'p', text: oneLine(s.desc) });
        const members = (s.characterIds || []).map(charName).filter(Boolean);
        if (members.length) out.push({ t: 'p', text: '相关人物：' + members.join('、') });
      }
    }
    const realms = p.realms || [];
    if (realms.length) {
      out.push({ t: 'h2', text: '修为体系' });
      out.push({ t: 'p', text: realms.map(r => (r.name || '未命名') + (r.note ? '（' + oneLine(r.note) + '）' : '')).join(' → ') });
    }
    const lore = p.lore || [];
    if (lore.length) {
      out.push({ t: 'h2', text: '关键设定' });
      lore.forEach(l => { if ((l.text || '').trim()) out.push({ t: 'p', text: (l.tag ? '【' + l.tag + '】' : '') + oneLine(l.text) }); });
    }
  }
  return out;
}

function bodyPlots(doc) {
  const out = [];
  const list = (Array.isArray(doc.plots) ? doc.plots : []).slice()
    .sort((a, b) => (Number(a.timePoint) || 0) - (Number(b.timePoint) || 0));
  if (!list.length) { out.push({ t: 'meta', text: '（还没有情节）' }); return out; }
  const nameOf = id => ((doc.characters || []).find(c => c.id === id) || {}).name || '';
  list.forEach((p, i) => {
    out.push({ t: 'h1', text: String(i + 1).padStart(2, '0') + ' ' + (p.title || '未命名') });
    const bits = [];
    if (p.chapter) bits.push('章节 ' + p.chapter);
    if (p.timePoint != null) bits.push('时间点 ' + p.timePoint);
    if (p.place) bits.push('地点 ' + oneLine(p.place));
    bits.push(STATUS_LABEL[p.status] || p.status || '未标注');
    out.push({ t: 'meta', text: bits.join(' · ') });
    if (p.summary) out.push({ t: 'p', text: oneLine(p.summary) });
    const who = (p.characterIds || []).map(nameOf).filter(Boolean);
    if (who.length) out.push({ t: 'p', text: '相关人物：' + who.join('、') });
  });
  return out;
}

function bodyVolumes(doc) {
  const out = [];
  const vols = Array.isArray(doc.chapters) ? doc.chapters : [];
  const all = Array.isArray(doc.manuscripts) ? doc.manuscripts : [];
  if (!vols.length) { out.push({ t: 'meta', text: '（还没有分卷）' }); return out; }
  for (const v of vols) {
    const mine = all.filter(m => m.volumeId === v.id)
      .sort((a, b) => (manuscriptNo(a) || 1e9) - (manuscriptNo(b) || 1e9));
    const chars = mine.reduce((n, m) => n + wordsOf(m.content), 0);
    out.push({ t: 'h1', text: v.title || '未命名卷' });
    out.push({ t: 'meta', text: (VOL_STATUS[v.status] || '未标注') + ' · ' + mine.length + ' 篇 · 约 ' + chars.toLocaleString('zh-CN') + ' 字' });
    mine.forEach((m, i) => {
      out.push({ t: 'p', text: (i + 1) + '. ' + (m.title || '未命名') + '（' + wordsOf(m.content).toLocaleString('zh-CN') + ' 字）' });
    });
  }
  return out;
}

function bodyScraps(doc) {
  const out = [];
  const list = Array.isArray(doc.scraps) ? doc.scraps : [];
  if (!list.length) { out.push({ t: 'meta', text: '（废案篓是空的）' }); return out; }
  for (const s of list) {
    out.push({ t: 'h1', text: s.title || '未命名' });
    const bits = [SCRAP_KIND[s.kind] || '其他'];
    if (s.origin) bits.push('原位置 ' + oneLine(s.origin));
    if (s.reason) bits.push(oneLine(s.reason));
    if (s.removedAt) bits.push(fmtDate(s.removedAt));
    out.push({ t: 'meta', text: bits.join(' · ') });
    if (s.summary) out.push({ t: 'p', text: oneLine(s.summary) });
  }
  return out;
}

function bodyBookAnalysis(doc) {
  const out = [];
  const books = Array.isArray(doc.books) ? doc.books : [];
  if (!books.length) { out.push({ t: 'meta', text: '（书库里还没有导入整本书）' }); return out; }
  for (const b of books) {
    out.push({ t: 'h1', text: b.title || '未命名' });
    out.push({
      t: 'meta',
      text: (b.chapters || []).length + ' 章 · ' + Number(b.chars || 0).toLocaleString('zh-CN') + ' 字'
        + (b.analysis && b.analysis.at ? ' · 拆解于 ' + fmtDate(b.analysis.at) : '')
    });
    const an = b.analysis;
    if (!an) { out.push({ t: 'p', text: '（这本还没有拆解）' }); continue; }
    const people = an.people || [];
    if (people.length) {
      out.push({ t: 'h2', text: '人物（' + people.length + '）' });
      people.forEach(p => {
        const bits = [];
        if (p.identity) bits.push(oneLine(p.identity));
        if (p.age) bits.push(p.age);
        if (p.firstSeen) bits.push('初见于 ' + p.firstSeen);
        bits.push('出现 ' + (p.count || 1) + ' 次');
        out.push({ t: 'p', text: '· ' + (p.name || '未命名') + (p.aliases && p.aliases.length ? '（' + p.aliases.join('、') + '）' : '') + ' —— ' + bits.join(' · ') });
        if (p.persona) out.push({ t: 'p', text: '　　' + oneLine(p.persona) });
      });
    }
    const plots = an.plots || [];
    if (plots.length) {
      out.push({ t: 'h2', text: '情节（' + plots.length + '）' });
      plots.forEach((p, i) => {
        out.push({ t: 'p', text: (i + 1) + '. ' + (p.title || '未命名') + (p.chapter ? '（' + p.chapter + '）' : '') });
        if (p.summary) out.push({ t: 'p', text: '　　' + oneLine(p.summary) });
      });
    }
  }
  return out;
}

const BODIES = {
  manuscripts: bodyManuscripts,
  characters: bodyCharacters,
  world: bodyWorld,
  plots: bodyPlots,
  volumes: bodyVolumes,
  scraps: bodyScraps,
  bookanalysis: bodyBookAnalysis
};

/* 标题行：作者 · 范围 · 规模 · 时间 */
function headerMeta(doc, picked) {
  const bits = ['作者 ' + ((doc.meta && doc.meta.author) || '—')];
  if (picked.length === 1) {
    const s = SCOPES.find(x => x.key === picked[0]);
    if (s) bits.push(s.label + ' ' + countOf(doc, picked[0]));
  } else {
    bits.push('导出 ' + picked.map(k => (SCOPES.find(x => x.key === k) || {}).label || k).join('、'));
  }
  bits.push('导出于 ' + fmtDate());
  return bits.join(' · ');
}
/* 每个范围的"有多少"（写在页眉那行灰字里） */
function countOf(doc, key) {
  if (key === 'manuscripts') {
    const all = doc.manuscripts || [];
    return all.length + ' 篇 / 约 ' + all.reduce((n, m) => n + wordsOf(m.content), 0).toLocaleString('zh-CN') + ' 字';
  }
  if (key === 'characters') return (doc.characters || []).length + ' 人';
  if (key === 'world') return (doc.planes || []).length + ' 个位面';
  if (key === 'plots') return (doc.plots || []).length + ' 条';
  if (key === 'volumes') return (doc.chapters || []).length + ' 卷 / ' + (doc.manuscripts || []).length + ' 篇';
  if (key === 'scraps') return (doc.scraps || []).length + ' 条';
  if (key === 'bookanalysis') return (doc.books || []).length + ' 本';
  return '';
}

/* 把选中的范围合成一串块 */
function buildBlocks(doc, scopes) {
  const picked = (scopes && scopes.length ? scopes : ALL_SCOPES).filter(k => BODIES[k]);
  const title = ((doc.meta && doc.meta.title) || '未命名').trim();
  const out = [{ t: 'title', text: title }, { t: 'meta', text: headerMeta(doc, picked) }, { t: 'rule' }];

  if (picked.length === 1) {
    out.push(...BODIES[picked[0]](doc));
    return out;
  }
  picked.forEach((k, i) => {
    if (i > 0) out.push({ t: 'rule' });
    out.push({ t: 'h1', text: (SCOPES.find(s => s.key === k) || {}).label || k });
    out.push(...demote(BODIES[k](doc), 1));
  });
  return out;
}

/* ---------------- 渲染：纯文本 ---------------- */
function renderTxt(blocks) {
  const lines = [];
  for (const b of blocks) {
    switch (b.t) {
      case 'title': lines.push(b.text, '='.repeat(Math.min(56, Math.max(8, wordsOf(b.text) * 2))), ''); break;
      case 'h1': lines.push('', '【' + b.text + '】', ''); break;
      case 'h2': lines.push('', b.text, '-'.repeat(Math.min(48, Math.max(6, wordsOf(b.text) * 2)))); break;
      case 'h3': lines.push('· ' + b.text); break;
      case 'meta': lines.push('  ' + b.text); break;
      case 'p': lines.push(b.text); break;
      case 'rule': lines.push('', '— — —', ''); break;
      default: break;
    }
  }
  return lines.join('\n').replace(/\n{4,}/g, '\n\n\n').trim() + '\n';
}

/* ---------------- 渲染：Markdown ---------------- */
function renderMd(blocks) {
  const lines = [];
  for (const b of blocks) {
    switch (b.t) {
      case 'title': lines.push('# ' + b.text, ''); break;
      case 'h1': lines.push('', '## ' + b.text, ''); break;
      case 'h2': lines.push('', '### ' + b.text, ''); break;
      case 'h3': lines.push('', '**' + b.text + '**', ''); break;
      case 'meta': lines.push('> ' + b.text, ''); break;
      case 'p': lines.push(b.text, ''); break;
      case 'rule': lines.push('', '---', ''); break;
      default: break;
    }
  }
  return lines.join('\n').replace(/\n{4,}/g, '\n\n\n').trim() + '\n';
}

/* ---------------- 渲染：Word（docx） ---------------- */
function xmlEsc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
    /* XML 1.0 不允许这些控制字符，写进去 Word 会报"文件已损坏" */
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

const DOCX_STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr>
<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="宋体"/>
<w:sz w:val="24"/><w:szCs w:val="24"/>
</w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:line="360" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/>
<w:pPr><w:jc w:val="center"/><w:spacing w:before="240" w:after="360"/></w:pPr>
<w:rPr><w:rFonts w:eastAsia="黑体"/><w:b/><w:sz w:val="52"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:qFormat/>
<w:pPr><w:spacing w:before="360" w:after="160"/><w:outlineLvl w:val="0"/></w:pPr>
<w:rPr><w:rFonts w:eastAsia="黑体"/><w:b/><w:sz w:val="36"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:qFormat/>
<w:pPr><w:spacing w:before="280" w:after="120"/><w:outlineLvl w:val="1"/></w:pPr>
<w:rPr><w:rFonts w:eastAsia="黑体"/><w:b/><w:sz w:val="30"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:qFormat/>
<w:pPr><w:spacing w:before="200" w:after="80"/><w:outlineLvl w:val="2"/></w:pPr>
<w:rPr><w:rFonts w:eastAsia="黑体"/><w:b/><w:sz w:val="26"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:qFormat/>
<w:pPr><w:ind w:left="240"/><w:spacing w:before="60" w:after="60"/></w:pPr>
<w:rPr><w:color w:val="666666"/><w:sz w:val="21"/></w:rPr></w:style>
</w:styles>`;

function docxPara(style, text, opts) {
  const o = opts || {};
  const pPr = [];
  if (o.indent) pPr.push('<w:ind w:firstLine="' + o.indent + '"/>');
  return '<w:p><w:pPr>' + (style ? '<w:pStyle w:val="' + style + '"/>' : '') + pPr.join('') + '</w:pPr>'
    + '<w:r><w:t xml:space="preserve">' + xmlEsc(text) + '</w:t></w:r></w:p>';
}

function renderDocx(blocks) {
  const body = [];
  for (const b of blocks) {
    switch (b.t) {
      case 'title': body.push(docxPara('Title', b.text)); break;
      case 'h1': body.push(docxPara('Heading1', b.text)); break;
      case 'h2': body.push(docxPara('Heading2', b.text)); break;
      case 'h3': body.push(docxPara('Heading3', b.text)); break;
      case 'meta': body.push(docxPara('Quote', b.text)); break;
      /* 正文段落首行缩进两字：中文小说的排版习惯 */
      case 'p': body.push(docxPara('', b.text, { indent: 480 })); break;
      case 'rule': body.push('<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="1" w:color="DDDDDD"/></w:pBdr></w:pPr></w:p>'); break;
      default: break;
    }
  }
  const documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    + '<w:body>' + body.join('') + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
    + '<w:pgMar w:top="1440" w:right="1418" w:bottom="1440" w:left="1418" w:header="851" w:footer="992" w:gutter="0"/>'
    + '</w:sectPr></w:body></w:document>';

  return writeZip([
    {
      name: '[Content_Types].xml',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        + '<Default Extension="xml" ContentType="application/xml"/>'
        + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
        + '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
        + '</Types>'
    },
    {
      name: '_rels/.rels',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
        + '</Relationships>'
    },
    {
      name: 'word/_rels/document.xml.rels',
      data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
        + '</Relationships>'
    },
    { name: 'word/styles.xml', data: DOCX_STYLES },
    { name: 'word/document.xml', data: documentXml }
  ]);
}

/* ---------------- 渲染：JSON（只取选中的部分） ---------------- */
function buildJson(doc, scopes) {
  const picked = (scopes && scopes.length ? scopes : ALL_SCOPES);
  const out = { version: doc.version || 1, exportedAt: new Date().toISOString(), scopes: picked.slice() };
  /* 书名/作者总是带上，否则导入回去不知道是哪本 */
  out.meta = Object.assign({}, doc.meta || {});
  if (picked.indexOf('characters') >= 0) out.characters = doc.characters || [];
  if (picked.indexOf('world') >= 0) out.planes = doc.planes || [];
  if (picked.indexOf('plots') >= 0) out.plots = doc.plots || [];
  if (picked.indexOf('scraps') >= 0) out.scraps = doc.scraps || [];
  if (picked.indexOf('bookanalysis') >= 0) out.books = doc.books || [];
  /* 正文离不开卷目录：只导正文时把 chapters 一起带上，否则稿件挂在哪个卷就丢了 */
  if (picked.indexOf('manuscripts') >= 0) {
    out.manuscripts = doc.manuscripts || [];
    out.chapters = doc.chapters || [];
  } else if (picked.indexOf('volumes') >= 0) {
    out.chapters = doc.chapters || [];
  }
  return Buffer.from(JSON.stringify(out, null, 1), 'utf8');
}

/* ---------------- 对外 ---------------- */
const FORMATS = [
  { key: 'txt', label: '纯文本', ext: 'txt', hint: '任何编辑器都能开，适合投稿 / 备份' },
  { key: 'md', label: 'Markdown', ext: 'md', hint: '带标题层级，适合笔记软件 / 静态站' },
  { key: 'docx', label: 'Word', ext: 'docx', hint: '带样式与首行缩进，可直接打印 / 投稿' },
  { key: 'json', label: 'JSON', ext: 'json', hint: '结构化数据，可以再导回软件' }
];

/* 文件名里不能出现 Windows 的保留字符 */
function safeName(s) {
  return String(s || '').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 60) || '未命名';
}

/**
 * @param {object} doc       整本书的数据
 * @param {string[]} scopes  要导出的范围（SCOPES 里的 key）
 * @param {string} format    txt | md | docx | json
 * @returns {{ data: Buffer, ext: string, name: string, chars: number, scopeLabels: string[] }}
 */
function build(doc, scopes, format) {
  const fmt = FORMATS.find(f => f.key === format) || FORMATS[0];
  const picked = (scopes && scopes.length ? scopes : ALL_SCOPES).filter(k => BODIES[k]);
  const title = ((doc.meta && doc.meta.title) || '未命名').trim();
  const base = safeName(title);
  const labels = picked.map(k => (SCOPES.find(s => s.key === k) || {}).label || k);

  if (fmt.key === 'json') {
    const data = buildJson(doc, picked);
    return { data, ext: 'json', name: base + '.nfdata.json', chars: data.length, scopeLabels: labels };
  }
  const blocks = buildBlocks(doc, picked);
  const chars = blocks.reduce((n, b) => n + (b.text ? wordsOf(b.text) : 0), 0);
  const data = fmt.key === 'txt' ? Buffer.from(renderTxt(blocks), 'utf8')
    : fmt.key === 'md' ? Buffer.from(renderMd(blocks), 'utf8')
      : renderDocx(blocks);
  /* 单范围时文件名带范围名，《临水问剑-正文.docx》；多范围就叫《临水问剑.docx》 */
  const tag = picked.length === 1 ? safeName(labels[0] || '') : '';
  return {
    data, chars, scopeLabels: labels,
    ext: fmt.ext,
    name: base + (tag ? '-' + tag : '') + '.' + fmt.ext
  };
}

module.exports = {
  SCOPES, ALL_SCOPES, FORMATS, build, buildBlocks, renderTxt, renderMd, renderDocx, buildJson, safeName
};
