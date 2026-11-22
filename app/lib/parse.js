'use strict';
const fs = require('fs');
const path = require('path');
const { readZip } = require('./zipread');

function decodeEntities(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, '&').replace(/&#(\d+);/g, (m, d) => String.fromCharCode(+d));
}

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else q = false;
      } else cell += c;
    } else {
      if (c === '"') q = true;
      else if (c === ',' || c === '\t') { row.push(cell); cell = ''; }
      else if (c === '\r') { /* skip */ }
      else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => String(x).trim() !== ''));
}

function docxText(buf) {
  const zip = readZip(buf);
  const xml = zip.readText('word/document.xml');
  if (!xml) throw new Error('docx 里找不到正文');
  const paras = xml.split(/<\/w:p>/);
  const out = [];
  for (const p of paras) {
    const t = p.replace(/<w:tab[^>]*\/>/g, '\t');
    const txt = (t.match(/<w:t[^>]*>[\s\S]*?<\/w:t>/g) || []).map(s => s.replace(/<[^>]+>/g, '')).join('');
    if (txt.trim()) out.push(decodeEntities(txt));
  }
  return out.join('\n');
}

/* A1 引用 → 列序号（A=0） */
function colIndex(ref) {
  const m = /^([A-Z]+)/.exec(String(ref || '').toUpperCase());
  if (!m) return -1;
  let n = 0;
  for (const ch of m[1]) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/* 从 workbook.xml + rels 还原工作表真实名字 */
function sheetNames(zip) {
  const map = {};
  const wb = zip.readText('xl/workbook.xml');
  const rels = zip.readText('xl/_rels/workbook.xml.rels');
  if (!wb || !rels) return map;
  const ridPath = {};
  for (const m of (rels.match(/<Relationship\b[^>]*>/g) || [])) {
    const id = (m.match(/Id="([^"]+)"/) || [])[1];
    const tgt = (m.match(/Target="([^"]+)"/) || [])[1];
    if (id && tgt) ridPath[id] = 'xl/' + tgt.replace(/^\/?xl\//, '').replace(/^\.\//, '');
  }
  for (const m of (wb.match(/<sheet\b[^>]*>/g) || [])) {
    const name = (m.match(/name="([^"]*)"/) || [])[1];
    const rid = (m.match(/r:id="([^"]+)"/) || [])[1];
    if (name && rid && ridPath[rid]) map[ridPath[rid]] = decodeEntities(name);
  }
  return map;
}

function xlsxSheets(buf) {
  const zip = readZip(buf);
  let shared = [];
  const ssXml = zip.readText('xl/sharedStrings.xml');
  if (ssXml) {
    shared = (ssXml.match(/<si>[\s\S]*?<\/si>/g) || []).map(si =>
      decodeEntities((si.match(/<t[^>]*>[\s\S]*?<\/t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join(''))
    );
  }
  const nameMap = sheetNames(zip);
  const sheetFiles = zip.names
    .filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
    .sort((a, b) => (parseInt(a.replace(/\D+/g, ''), 10) || 0) - (parseInt(b.replace(/\D+/g, ''), 10) || 0));
  const sheets = [];
  for (const sn of sheetFiles) {
    const xml = zip.readText(sn);
    const rows = [];
    for (const r of (xml.match(/<row\b[\s\S]*?<\/row>/g) || [])) {
      const cells = [];
      for (const c of (r.match(/<c\b[^>]*\/>|<c\b[^>]*>[\s\S]*?<\/c>/g) || [])) {
        const head = c.slice(0, c.indexOf('>') + 1);
        const ref = (head.match(/r="([A-Z]+\d+)"/) || [])[1];
        const t = (head.match(/t="([^"]+)"/) || [])[1] || '';
        let v = '';
        if (t === 'inlineStr') {
          v = decodeEntities((c.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [])
            .map(s => s.replace(/<[^>]+>/g, '')).join(''));
        } else {
          const vm = c.match(/<v>([\s\S]*?)<\/v>/);
          v = vm ? decodeEntities(vm[1]) : '';
          if (t === 's' && v !== '') v = shared[+v] || '';
        }
        const at = ref ? colIndex(ref) : -1;
        if (at >= 0) { while (cells.length < at) cells.push(''); cells[at] = v; }
        else cells.push(v);
      }
      if (cells.some(x => String(x).trim() !== '')) rows.push(cells);
    }
    sheets.push({ name: nameMap[sn] || ('工作表 ' + (sheets.length + 1)), rows });
  }
  return sheets;
}

function guessCategory(headers) {
  const h = headers.join(',').toLowerCase();
  const has = (...ks) => ks.some(k => h.indexOf(k) >= 0);
  if (has('姓名', '名字', '年龄', '身份', '人设', '修为')) return 'characters';
  if (has('情节', '章节', '时间点', '地点')) return 'plots';
  if (has('位面', '大陆', '宗门', '势力', '境界')) return 'world';
  return 'unknown';
}

function parseFile(file) {
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file);
  if (ext === '.csv' || ext === '.txt' || ext === '.md') {
    const text = fs.readFileSync(file, 'utf8');
    if (ext === '.csv') {
      const rows = parseCsv(text);
      const headers = rows[0] || [];
      return { kind: 'table', filename: base, headers, rows: rows.slice(1), text, category: guessCategory(headers) };
    }
    return { kind: 'text', filename: base, text, category: 'book' };
  }
  if (ext === '.docx') {
    const text = docxText(fs.readFileSync(file));
    return { kind: 'text', filename: base, text, category: 'book' };
  }
  if (ext === '.xlsx') {
    const sheets = xlsxSheets(fs.readFileSync(file));
    const s0 = sheets[0] || { rows: [] };
    const headers = s0.rows[0] || [];
    return { kind: 'table', filename: base, headers, rows: s0.rows.slice(1), sheets, category: guessCategory(headers) };
  }
  throw new Error('暂不支持的文件类型：' + ext);
}

/* 按「第X章 / 卷」切分长文
 *
 * 返回的每一项：
 *   idx    1 起的序号
 *   title  标题行（「第一章 下个路口见」这种原样保留）；卷前的那一小段叫「前言」
 *   text   标题 + 正文（拆书分析发给模型的就是它）
 *   body   去掉标题行、收拾过空白之后的纯正文（导入章节写作时写进 manuscript.content 的就是它）
 *   chars  正文净字数
 *
 * 两条规矩（都是踩出来的）：
 *   1. 只有「第X章 / 第X回 / 第X节」才算章节标题。原来的正则把「卷三 · 无界海」也当成章节，
 *      一本三十章的书会被一切成 1 段，书页还会提示"没找到第X章"；
 *   2. 第一个章节标题之前的内容（书名、作者、简介）单独成一段「前言」，不混进第一章。 */
const CHAPTER_HEAD = /^[ \t]*(第\s*[零〇一二三四五六七八九十百千万两0-9]+\s*[章回节][^\n]*|卷\s*[零〇一二三四五六七八九十百千万两0-9]+[^\n]*)$/gm;
const CHAPTER_TITLE = /^[ \t]*第\s*[零〇一二三四五六七八九十百千万两0-9]+\s*[章回节]/;
const VOLUME_TITLE = /^[ \t]*卷\s*[零〇一二三四五六七八九十百千万两0-9]+/;

/* 正文收拾：统一换行，去掉每行行首全角缩进，行尾空格清掉，压掉多余空行。
 * 正文里本来就有的段落分隔（单个换行）原样保留 —— 章节页按「\n」数段。 */
function tidyContent(s) {
  return String(s || '')
    .replace(/\r\n?/g, '\n')
    .replace(/^[ \t\u3000]+/gm, '')
    .replace(/[ \t\u3000]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* 从正文里剥掉开头那行标题（可能因为全角空格缩进而落在第二行） */
function stripTitle(body, title) {
  let lines = String(body || '').split('\n');
  const key = String(title || '').trim();
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    if (key && lines[i].trim() === key) { lines = lines.slice(i + 1); break; }
  }
  return tidyContent(lines.join('\n'));
}

function packChapter(i, title, bodyText) {
  const t = String(title || '').replace(/\s+/g, ' ').trim() || ('第 ' + i + ' 段');
  let body = tidyContent(bodyText);
  /* 切分边界上可能把书皮里的「作者：xxx」留在下一个片段的开头，这里顺手清掉 */
  body = body.replace(/^(?:书名|作者|编者|类别|标签|简介|内容简介|字数|状态)\s*[:：][^\n]*\n?/, '');
  body = tidyContent(body);
  const text = body ? (t + '\n' + body) : t;
  return { idx: i, title: t, text, body, chars: body.replace(/\s/g, '').length };
}

function headingHits(src) {
  const idx = [];
  let m;
  const re = new RegExp(CHAPTER_HEAD.source, 'gm');
  while ((m = re.exec(src)) !== null) {
    const head = m[1].trim();
    if (!CHAPTER_TITLE.test(head) && !VOLUME_TITLE.test(head)) continue;
    idx.push({ at: m.index, title: head, end: m.index + m[0].length });
  }
  return idx;
}

/* 第一行要是书名 / 作者 / 简介这类"书皮"，就算前言：
 * 没有标点、不超过 40 字、或者带书名号 / 「作者：」这种前缀。正文第一句会很长，不会被误判。 */
function looksLikeCover(head) {
  const h = String(head || '').trim();
  if (!h) return false;
  if (h.length > 40) return false;
  if (/(书名|书名[:：]|作者[:：]|编者|简介|内容简介|简介[:：]|著)/.test(h)) return true;
  if (/^《.*》$/.test(h)) return true;
  return !/[，。！？；：、,.!?;:"'“”‘’]/.test(h);
}

function pickPrefaces(lines) {
  const out = [];
  for (const ln of lines) {
    const t = String(ln || '').trim();
    if (!t) { if (out.length) out.push(''); continue; }
    if (!looksLikeCover(t)) break;
    out.push(t);
  }
  while (out.length && out[out.length - 1] === '') out.pop();
  return out.join('\n');
}

function splitChapters(text, rule) {
  const src = String(text || '').replace(/\r\n?/g, '\n');
  if (rule === 'blank' || rule === 'size') {
    let parts = [];
    if (rule === 'blank') {
      parts = src.split(/\n\s*\n+/).map(s => s.trim()).filter(Boolean);
    } else {
      /* 按字数切是给"整本没有空行"的大文件用的：先认章节，认不出再硬切 */
      const CH = 3000;
      if (!headingHits(src).length) {
        for (let i = 0; i < src.length; i += CH) parts.push(src.slice(i, i + CH));
      }
    }
    if (!parts.length) {
      /* 整本书没有空行可切：退回按「第X章」切 */
      const idx = headingHits(src);
      if (!idx.length) return null;
      for (let i = 0; i < idx.length; i++) {
        parts.push(idx[i].title + '\n' + src.slice(idx[i].end, i + 1 < idx.length ? idx[i + 1].at : src.length));
      }
    }
    const out = parts.map((p, i) => {
      const lines = p.split('\n');
      const title = lines[0].length <= 40 ? lines[0].trim() : '第 ' + (i + 1) + ' 段';
      return packChapter(i + 1, title, lines.slice(1).join('\n'));
    });
    /* 按空行切只切出一段 = 整本书挤在一起，这一眼看不出章节；这种情况交给「第X章」规则 */
    if (rule === 'blank' && out.length <= 1) {
      const chapters = splitByHeading(src);
      if (chapters && chapters.length > out.length) return chapters;
    }
    /* 书皮别混进第一段正文：第一段是书名 / 作者 / 简介时，把它拎成「前言」，
     * 剩下的正文单独成一段「正文」—— 不这么做，这段书皮会被并进第一章开头。
     * 判断只看「这一段自己就是一行书皮」（段首第一行），正文中间不会出现这种行。 */
    if (out.length > 1 && !CHAPTER_TITLE.test(String(out[0].title || ''))) {
      const cover = pickPrefaces([out[0].title]);
      if (cover) {
        const whole = !String(out[0].body || '').trim();
        const rest = whole ? '' : String(out[0].body || '');
        out[0] = packChapter(1, cover, cover);
        if (rest) out.splice(1, 0, packChapter(2, '正文', rest));
        out.forEach((c, i) => { c.idx = i + 1; });
      }
    }
    return out;
  }
  const chapters = splitByHeading(src);
  /* 一个「第X章」都没有：按空行切，每段取首行当标题（短书 / 散章都能用） */
  if (!chapters) return splitChapters(src, 'blank') || [];
  return chapters;
}

/* 按「第X章 / 第X回 / 第X节」切；「卷」只当分隔点，不当章节 */
function splitByHeading(src) {
  const idx = headingHits(src);
  if (!idx.length) return null;

  const out = [];
  let firstChapter = -1;
  for (let i = 0; i < idx.length; i++) if (CHAPTER_TITLE.test(idx[i].title)) { firstChapter = i; break; }
  if (firstChapter < 0) firstChapter = 0;

  const preface = src.slice(0, idx[firstChapter].at).trim();
  if (preface) out.push(packChapter(1, '前言', preface));

  const chapters = idx.slice(firstChapter);
  chapters.forEach((it, i) => {
    /* 卷标题：单独成段（标题就是卷名），下一章紧跟其后时它就是"卷首注" */
    const body = src.slice(it.end, i + 1 < chapters.length ? chapters[i + 1].at : src.length);
    out.push(packChapter(out.length + 1, it.title, body));
  });
  return out;
}

module.exports = { parseFile, parseCsv, splitChapters, tidyContent, stripTitle, xlsxSheets, docxText, guessCategory };
