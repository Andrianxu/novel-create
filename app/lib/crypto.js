'use strict';
/* 端到端加密：书稿离开本机之前先上锁
 *
 * 设计要点
 *   · 口令只在内存里用，不落盘、不上传；忘记口令 = 数据找不回（这是端到端的代价，设置页要写清楚）。
 *   · scrypt(口令, salt) → 32 字节密钥；AES-256-GCM 加密，附带 integrity tag。
 *   · 文件头写明版本与参数，将来换参数也能读老文件。
 *   · 不加密对小文件更友好：仍给出统一的 pack/unpack 两个入口。
 */
const crypto = require('crypto');

const MAGIC = 'NFENC1';
const KDF = { N: 16384, r: 8, p: 1, keylen: 32 };

function deriveKey(passphrase, saltBuf) {
  return crypto.scryptSync(String(passphrase), saltBuf, KDF.keylen, { N: KDF.N, r: KDF.r, p: KDF.p });
}

/**
 * 加密一段 Buffer / 字符串。
 * @returns {Buffer} 形如 NFENC1 + [salt(16)] + [iv(12)] + [tag(16)] + 密文
 */
function encrypt(plain, passphrase) {
  if (!passphrase) throw new Error('没有口令，无法加密');
  const data = Buffer.isBuffer(plain) ? plain : Buffer.from(String(plain), 'utf8');
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveKey(passphrase, salt);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from(MAGIC, 'utf8'), salt, iv, tag, body]);
}

function isEncrypted(buf) {
  if (!buf || buf.length < MAGIC.length) return false;
  try { return buf.slice(0, MAGIC.length).toString('utf8') === MAGIC; } catch (e) { return false; }
}

/**
 * 解密；口令不对或文件被改过会抛「口令不对或文件损坏」。
 */
function decrypt(buf, passphrase) {
  if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf || []);
  if (!isEncrypted(buf)) return buf;            /* 没加密的，原样返回 */
  if (!passphrase) throw new Error('这份数据是加密的，需要口令');
  const salt = buf.slice(6, 22);
  const iv = buf.slice(22, 34);
  const tag = buf.slice(34, 50);
  const body = buf.slice(50);
  const key = deriveKey(passphrase, salt);
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]);
  } catch (e) {
    throw new Error('口令不对，或文件已损坏');
  }
}

/* 口令指纹：让另一台设备在不解密的情况下就知道「口令是不是同一个」 */
function fingerprint(passphrase) {
  const salt = Buffer.from('novelfolio-sync-v1');
  const key = crypto.scryptSync(String(passphrase), salt, 16, { N: KDF.N, r: KDF.r, p: KDF.p });
  return key.toString('hex').slice(0, 12);
}

module.exports = { encrypt, decrypt, isEncrypted, fingerprint, MAGIC };
