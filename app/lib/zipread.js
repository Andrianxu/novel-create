'use strict';
const zlib = require('zlib');

/* 读取 ZIP（docx / xlsx 都是 zip），零依赖 */
function readZip(buf) {
  let eocd = -1;
  const min = Math.max(0, buf.length - 66000);
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('不是有效的 zip/OOXML 文件');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const entries = {};
  for (let n = 0; n < count; n++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nameLen).toString('utf8');
    entries[name] = { method, compSize, localOff };
    p += 46 + nameLen + extraLen + commentLen;
  }
  return {
    names: Object.keys(entries),
    read(name) {
      const e = entries[name];
      if (!e) return null;
      const lo = e.localOff;
      if (buf.readUInt32LE(lo) !== 0x04034b50) return null;
      const nl = buf.readUInt16LE(lo + 26);
      const el = buf.readUInt16LE(lo + 28);
      const start = lo + 30 + nl + el;
      const raw = buf.slice(start, start + e.compSize);
      if (e.method === 0) return raw;
      if (e.method === 8) return zlib.inflateRawSync(raw);
      throw new Error('不支持的压缩方式 ' + e.method);
    },
    readText(name) {
      const b = this.read(name);
      return b ? b.toString('utf8') : null;
    }
  };
}
module.exports = { readZip };
