// 给每页 slide XML 注入自动换页计时，实现"一键全程自动播放"
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PPTX = path.join(__dirname, '卷帙介绍.pptx');
const WORK = path.join(__dirname, '_autoplay');

// 每页自动换页时间（毫秒）—— 覆盖该页所有动画播完
const ADVANCE_MS = [8000, 8500, 7500, 7500, 8000, 8500, 8000, 8000, 8500, 8500, 9000];

// 清理工作目录并重新解压（工作目录是临时产物，可安全删除）
fs.rmSync(WORK, { recursive: true, force: true });
fs.mkdirSync(WORK, { recursive: true });
execFileSync('unzip', ['-q', PPTX, '-d', WORK]);

for (let i = 1; i <= 11; i++) {
  const rel = path.join('ppt', 'slides', `slide${i}.xml`);
  const f = path.join(WORK, rel);
  let xml = fs.readFileSync(f, 'utf8');
  if (xml.includes('<p:transition')) {
    xml = xml.replace(/<p:transition[^>]*\/>/, `<p:transition spd="slow" advTm="${ADVANCE_MS[i - 1]}" advClick="1"/>`);
  } else {
    const trans = `<p:transition spd="slow" advTm="${ADVANCE_MS[i - 1]}" advClick="1"/>`;
    if (xml.includes('<p:timing')) {
      xml = xml.replace('<p:timing', trans + '<p:timing');
    } else {
      xml = xml.replace('</p:sld>', trans + '</p:sld>');
    }
  }
  fs.writeFileSync(f, xml, 'utf8');
  console.log(`slide${i}.xml -> advTm=${ADVANCE_MS[i - 1]}ms`);
}

// 直接在原 pptx 归档中更新修改过的 11 个 slide 文件（不删除原文件）
const changed = [];
for (let i = 1; i <= 11; i++) {
  changed.push(path.posix.join('ppt', 'slides', `slide${i}.xml`));
}
execFileSync('zip', ['-q', PPTX, ...changed], { cwd: WORK });
console.log('updated:', PPTX, fs.statSync(PPTX).size, 'bytes');
