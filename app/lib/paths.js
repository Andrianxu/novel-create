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
function portraitsDir() { return ensureDir(path.join(dataDir(), 'portraits')); }
function mapsDir() { return ensureDir(path.join(dataDir(), 'maps')); }
function configFile() { ensureDir(root()); return path.join(root(), 'config.json'); }
function secretsFile() { ensureDir(root()); return path.join(root(), 'secrets.bin'); }
function logFile() { ensureDir(root()); return path.join(root(), 'app.log'); }
module.exports = { root, dataDir, ensureDir, dataFile, backupDir, portraitsDir, mapsDir, configFile, secretsFile, logFile };
