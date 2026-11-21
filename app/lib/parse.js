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

/* 按「第X章 / 卷」切分长文 */
function splitChapters(text, rule) {
  const src = String(text || '').replace(/\r\n/g, '\n');
  let parts = [];
  if (rule === 'blank') {
    parts = src.split(/\n\s*\n+/).map(s => s.trim()).filter(Boolean);
  } else if (rule === 'size') {
    const CH = 3000;
    for (let i = 0; i < src.length; i += CH) parts.push(src.slice(i, i + CH));
  } else {
    const re = /^[ \t]*(第[零一二三四五六七八九十百千0-9]+[章回节][^\n]*|卷[零一二三四五六七八九十百千0-9]+[^\n]*)$/gm;
    const idx = [];
    let m;
    while ((m = re.exec(src)) !== null) idx.push({ at: m.index, title: m[1].trim(), end: m.index + m[0].length });
    if (idx.length === 0) {
      return splitChapters(src, 'blank');
    }
    for (let i = 0; i < idx.length; i++) {
      const body = src.slice(idx[i].end, i + 1 < idx.length ? idx[i + 1].at : src.length).trim();
      parts.push(idx[i].title + '\n' + body);
    }
  }
  return parts.map((p, i) => {
    const lines = p.split('\n');
    const title = lines[0].length <= 40 ? lines[0].trim() : '第 ' + (i + 1) + ' 段';
    return {
      idx: i + 1,
      title: title,
      text: p,
      chars: p.replace(/\s/g, '').length
    };
  });
}

module.exports = { parseFile, parseCsv, splitChapters, xlsxSheets, docxText, guessCategory };
