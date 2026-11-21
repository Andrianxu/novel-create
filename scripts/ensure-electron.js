#!/usr/bin/env node
'use strict';
/* Electron 45 起，npm 包不再自带 postinstall 去下载运行时，
 * 而是让你自己调 install.js / install-electron。这个脚本把这件事补上：
 *   - 运行时已就绪：直接退出（npm start 不会多花时间）
 *   - 缺运行时或版本不对：跑官方 install.js 下载（支持 ELECTRON_MIRROR 镜像） */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const pkgDir = path.join(root, 'node_modules', 'electron');

let want = '';
try {
  want = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8')).version;
} catch (e) {
  console.error('找不到 node_modules/electron，先运行：npm install');
  process.exit(1);
}

let have = '';
try {
  have = fs.readFileSync(path.join(pkgDir, 'dist', 'version'), 'utf8').trim().replace(/^v/, '');
} catch (e) { /* 还没下载 */ }

if (have === want) {
  console.log('Electron 运行时已就绪：' + want);
  process.exit(0);
}

console.log('正在准备 Electron 运行时 ' + want + '（首次需要下载，约 100+ MB）…');
if (!process.env.ELECTRON_MIRROR && process.platform === 'win32') {
  console.log('提示：国内网络慢可以设置镜像后重试，例如');
  console.log('  $env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"');
}

const res = spawnSync(process.execPath, [path.join(pkgDir, 'install.js')], {
  cwd: pkgDir, stdio: 'inherit', env: process.env
});
if (res.status !== 0) {
  console.error('Electron 运行时准备失败（退出码 ' + res.status + '）。');
  process.exit(res.status === null ? 1 : res.status);
}
console.log('Electron 运行时准备完成：' + want);
