/* 启动动画（独立 splash 窗口用）。
 *
 * 这个文件属于一个极简页面：它比主界面早得多就能画出来（几百毫秒 vs 三四秒），
 * 所以点击 exe 之后用户第一眼看到的就是它，而不是空白/白屏。
 *
 * 时间线：
 *   0.00 – 0.45  ① 图标静置
 *   0.45 – 1.35  ② 两条折线各飞向自己的对角（左下→左下、右上→右上）
 *   1.35 – 1.65  ③ 图标本体（圆角底）淡出
 *   1.65 – 2.27  ④ 红箭头顺时针转 90° 并左移，到位停住
 *   2.27 – 3.47  ⑤ 逐字打出「欢迎来到您创造的世界」
 *   3.47 –       ⑥ 打完就停在最后一帧等主界面 —— 主界面好了才淡出
 *
 * 「谁慢等谁」在这里尤其重要：主界面要三四秒才加载完，动画两秒多就演完了，
 * 所以最后必须停住等，不能自己先收场留一片空白。
 */
(function () {
  'use strict';

  var TEXT = '欢迎来到您创造的世界';
  var ICON_C = 120;          /* 图标坐标中心 */
  var ARROW_CY = 110;        /* 箭头图形中心（240 坐标） */
  var STEP = 1;              /* 时间倍率，--slow 调试用 */

  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms * STEP); }); };

  function $(id) { return document.getElementById(id); }

  /* 动画完整播完后，通知主进程「我演完了」。
   * 主进程那边还要等主界面就绪，两个都好了才换场（见 main.js 的 trySwap）。 */
  var doneSent = false;
  function notifyDone() {
    if (doneSent) return;
    doneSent = true;
    /* 通过 preload 暴露的 IPC 告诉主进程（splash-preload.js） */
    try {
      if (window.__splashBridge && window.__splashBridge.done) window.__splashBridge.done();
    } catch (e) {
      try { console.error('[splash] 通知主进程失败', e); } catch (e2) {}
    }
  }

  /* 主进程在「该换场了」时调用：淡出整块画面 */
  window.__splashFadeOut = function () {
    var st = document.getElementById('stage');
    if (st) st.classList.add('out');
  };

  /* 主进程万一要硬切（主界面出错等）：直接让动画停 */
  var stopped = false;
  window.__splashStop = function () { stopped = true; };

  function run() {
    var stage = $('stage');
    var tile = $('tile');
    var lineTR = $('lineTR');
    var lineBL = $('lineBL');
    var arrow = $('arrow');
    var typeEl = $('type');
    var caret = $('caret');
    var wrap = stage.querySelector('.wrap');

    /* ---- 几何 ----
     * .icon 是 120×120，内部 viewBox 240 → 1 单位 = 0.5px。
     * 两条线各自飞向自己那一侧的远处，最后围出一块中间区域 ——
     * 箭头和文字要落在这块区域**里面**，居中排。 */
    var iconSize = 120;
    var unit = iconSize / 240;
    var wrapW = wrap.clientWidth || 600;
    var wrapH = wrap.clientHeight || 300;
    var cx = wrapW / 2, cy = wrapH / 2;

    /* 折线在图标坐标里的包围盒中心 */
    var trCenter = { x: 114, y: 90 };      /* 右上那条 */
    var blCenter = { x: 126, y: 150 };     /* 左下那条 */
    /* 目标：各自往对角再推出一段距离（让线离开图标、伸向画面边缘） */
    var pushX = 246, pushY = 82;
    var trDx = (cx + pushX) - (cx + (trCenter.x - ICON_C) * unit);
    var trDy = (cy - pushY) - (cy + (trCenter.y - ICON_C) * unit);
    var blDx = (cx - pushX) - (cx + (blCenter.x - ICON_C) * unit);
    var blDy = (cy + pushY) - (cy + (blCenter.y - ICON_C) * unit);

    /* ---- 两条线飞完之后围出的中间区域 ----
     * TR 折线占 x∈[trL, trR]，BL 折线占 x∈[blL, blR]；
     * 两块之间那条「空」就是文字和箭头能用的地方。 */
    var lineHalfW = (96 * unit) / 2;       /* 折线宽 96 单位（240 坐标）的一半 */
    var lineHalfH = (56 * unit) / 2;
    var trRightX = (cx + pushX) - lineHalfW;   /* TR 的左边缘，即内区右界 */
    var blRightX = (cx - pushX) + lineHalfW;   /* BL 的右边缘，即内区左界 */
    var innerLeft = blRightX;
    var innerRight = trRightX;
    var innerW = innerRight - innerLeft;
    /* 垂直方向：两条线的 y 范围也不重叠，取两者之间的空档 */
    var trBottomY = (cy - pushY) + lineHalfH;
    var blTopY = (cy + pushY) - lineHalfH;
    var innerTop = trBottomY;
    var innerBottom = blTopY;

    /* ---- 先把字建好（透明占位），后面量宽 / 逐字点亮都要用 ---- */
    var fs = 26;                       /* 字号（比之前大） */
    typeEl.style.fontSize = fs + 'px';
    typeEl.style.lineHeight = fs + 'px';
    typeEl.textContent = '';
    var chars = [];
    for (var i = 0; i < TEXT.length; i++) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.textContent = TEXT.charAt(i);
      typeEl.appendChild(s);
      chars.push(s);
    }
    typeEl.appendChild(caret);

    /* ---- 箭头 + 文字整体居中放进内区 ----
     * 先量文字总宽，再把「箭头 + 间距 + 文字」当一整个块来居中。 */
    var arrowW = 30;                   /* 箭头图形缩到多宽 */
    var gap = 14;                      /* 箭头和文字之间 */
    var textW = 0;
    for (var ci = 0; ci < chars.length; ci++) {
      textW += chars[ci].getBoundingClientRect().width;
      /* 字距（letter-spacing）在相邻两个字之间多出来的那段也算上 */
      if (ci > 0) {
        textW += Math.max(0, chars[ci].getBoundingClientRect().left - chars[ci - 1].getBoundingClientRect().right);
      }
    }
    var groupW = arrowW + gap + textW;
    var groupLeft = innerLeft + (innerW - groupW) / 2;
    var groupMidY = (innerTop + innerBottom) / 2;

    /* 文字：方块左边 = 箭头右边 + gap；垂直居中 */
    typeEl.style.left = Math.round(groupLeft + arrowW + gap) + 'px';
    typeEl.style.top = Math.round(groupMidY - fs / 2) + 'px';

    /* 箭头：图形中心停在方块的最左边（半个箭头宽处） */
    var arrowEndX = groupLeft + arrowW / 2;
    var arrowEndY = groupMidY;
    var arrowStartY = cy + (ARROW_CY - ICON_C) * unit;
    var arrowDx = arrowEndX - cx;
    var arrowDy = arrowEndY - arrowStartY;
    var arrowScale = arrowW / (48 * unit);   /* 箭头图形原始宽 48 单位（240 坐标）→ arrowW */

    /* ---- ① 图标静置 ---- */
    function step1() {
      return sleep(450).then(function () {
        if (stopped) return null;
        /* ---- ② 两条折线各飞向对角 ---- */
        var d = (0.9 * STEP).toFixed(3) + 's';
        lineTR.style.transition = 'transform ' + d + ' cubic-bezier(.34,.05,.36,1)';
        lineBL.style.transition = 'transform ' + d + ' cubic-bezier(.34,.05,.36,1)';
        void lineTR.getBoundingClientRect();
        lineTR.style.transform = 'translate(' + trDx + 'px,' + trDy + 'px)';
        lineBL.style.transform = 'translate(' + blDx + 'px,' + blDy + 'px)';
        return sleep(900);
      }).then(function () {
        if (stopped) return null;
        /* ---- ③ 图标圆角底淡出 ---- */
        tile.style.transition = 'opacity ' + (0.3 * STEP).toFixed(3) + 's ease';
        tile.style.opacity = '0';
        return sleep(300);
      }).then(function () {
        if (stopped) return null;
        /* ---- ④ 箭头：顺时针 90° + 左移，一步到位 ---- */
        arrow.style.transition = 'transform ' + (0.62 * STEP).toFixed(3) + 's cubic-bezier(.45,.05,.35,1)';
        void arrow.getBoundingClientRect();
        /* rotate(90deg) 让箭头朝右；scale 把它缩到和内区协调的大小 */
        arrow.style.transform = 'translate(' + arrowDx + 'px,' + arrowDy + 'px) rotate(90deg) scale(' + arrowScale.toFixed(3) + ')';
        return sleep(620);
      }).then(function () {
        if (stopped) return null;
        /* ---- ⑤ 逐字打出 ---- */
        caret.classList.add('on');
        var i = 0;
        function next() {
          if (stopped || i >= chars.length) return Promise.resolve();
          chars[i].classList.add('on');
          i++;
          return sleep(120).then(next);
        }
        return next();
      });
    }

    return step1().then(function () {
      /* ---- ⑥ 演完了：告诉主进程，然后停在这个画面等它叫换场 ---- */
      caret.classList.remove('on');
      notifyDone();
      /* 停在最后一帧不动；主进程会调 __splashFadeOut 收场 */
    });
  }

  /* 主进程告诉放慢倍率（调试用），没有就 1 */
  if (window.__splashSpeed && window.__splashSpeed > 0) STEP = window.__splashSpeed;

  try {
    run().catch(function (e) {
      console.error('[splash] 动画出错', e);
      /* 出错也不能卡住：直接告诉主进程可以关了 */
      if (window.__splashReadyToClose) window.__splashReadyToClose();
    });
  } catch (e) {
    console.error('[splash] 动画起不来', e);
    if (window.__splashReadyToClose) window.__splashReadyToClose();
  }
})();
