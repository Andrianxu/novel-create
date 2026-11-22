'use strict';
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

function root() {
  return app.getPath('userData');
}
function dataDir() { return path.join(root(), 'data'); }
function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); return p; }
function dataFile() { ensureDir(dataDir()); return path.join(dataDir(), 'novelfolio.data.json'); }
function backupDir() { return ensureDir(path.join(dataDir(), 'backups')); }
/* 老数据文件（单文件时代）：只读入，用来长出书库里的第一本书 */
function legacyDataFile() { return path.join(dataDir(), 'novelfolio.data.json'); }
/* 图片目录：传了书号就是那本书自己的子目录，不传就是老位置（按书分目录见 bookcase.js） */
function portraitsDir(bookId) { return bookId ? ensureDir(path.join(dataDir(), 'portraits', bookId)) : ensureDir(path.join(dataDir(), 'portraits')); }
function mapsDir(bookId) { return bookId ? ensureDir(path.join(dataDir(), 'maps', bookId)) : ensureDir(path.join(dataDir(), 'maps')); }
function configFile() { ensureDir(root()); return path.join(root(), 'config.json'); }
function secretsFile() { ensureDir(root()); return path.join(root(), 'secrets.bin'); }
function logFile() { ensureDir(root()); return path.join(root(), 'app.log'); }
module.exports = {
  root, dataDir, ensureDir, dataFile, legacyDataFile,
  backupDir, portraitsDir, mapsDir, configFile, secretsFile, logFile
};
