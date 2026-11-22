'use strict';
/* 写 ZIP（docx 本质就是一个 zip），零依赖：只用 Node 自带的 zlib。
 *
 * zipread.js 负责读（导入 docx / xlsx 用），这里负责写（导出 Word 用）。
 * 只实现够用的一小撮：
 *   - 每个条目单独 deflate（压不动就直接 store，比如已经很短的 xml）
 *   - 文件名统一 UTF-8（通用标志位第 11 位），中文文件名不会乱码
 *   - 不写注释、不写 extra 字段、不支持 zip64（导出的是文档，不会超过 4GB）
 */
const zlib = require('zlib');

/* CRC32 查表：zip 每个条目都要带未压缩数据的校验值 */
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

/* 固定的 DOS 时间戳：不写"现在几点"，同样内容的文档每次导出的字节完全一样，
 * 方便对比两份导出有没有内容差异。 */
const DOS_TIME = 0;
const DOS_DATE = ((2020 - 1980) << 9) | (1 << 5) | 1;

/**
 * @param {Array<{name: string, data: Buffer|string}>} entries
 * @returns {Buffer} 完整的 zip 文件
 */
function writeZip(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const e of entries) {
    const nameBuf = Buffer.from(String(e.name).replace(/\\/g, '/'), 'utf8');
    const raw = Buffer.isBuffer(e.data) ? e.data : Buffer.from(String(e.data), 'utf8');
    const crc = crc32(raw);
    /* 太小的条目压了反而更大（deflate 有固定开销），直接存 */
    let method = 0;
    let body = raw;
    if (raw.length > 128) {
      const deflated = zlib.deflateRawSync(raw, { level: 9 });
      if (deflated.length < raw.length) { method = 8; body = deflated; }
    }

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);      /* 本地文件头签名 */
    local.writeUInt16LE(20, 4);              /* 解压所需版本 2.0 */
    local.writeUInt16LE(0x0800, 6);          /* 标志位：文件名 UTF-8 */
    local.writeUInt16LE(method, 8);          /* 压缩方式 0=store 8=deflate */
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);    /* 压缩后大小 */
    local.writeUInt32LE(raw.length, 22);     /* 原始大小 */
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);              /* extra 长度 */

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);    /* 中央目录签名 */
    central.writeUInt16LE(20, 4);            /* 生成方版本 */
    central.writeUInt16LE(20, 6);            /* 解压所需版本 */
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);            /* extra */
    central.writeUInt16LE(0, 32);            /* 注释 */
    central.writeUInt16LE(0, 34);            /* 起始磁盘号 */
    central.writeUInt16LE(0, 36);            /* 内部属性 */
    central.writeUInt32LE(0, 38);            /* 外部属性 */
    central.writeUInt32LE(offset, 42);       /* 本地头偏移 */

    locals.push(local, nameBuf, body);
    centrals.push(central, nameBuf);
    offset += local.length + nameBuf.length + body.length;
  }

  const centralBuf = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([Buffer.concat(locals), centralBuf, eocd]);
}

module.exports = { writeZip, crc32 };
