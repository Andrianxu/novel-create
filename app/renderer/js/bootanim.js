/* 启动动画：把冷启动那几秒盖住。
 *
 * 时间线（真实时长，全部集中在 TWEAK 里调；--slow=N 仅供自动化抓帧时整体放慢）：
 *   0.00 – 0.55  ① 图标居中（圆角底 + 两条黑折线 + 红箭头，就是软件图标本身）
 *   0.55 – 1.45  ② 两条折线各自飞出去：右上角那条飞向右上，左下角那条飞向左下
 *   1.45 – 1.75  ③ 图标本体淡出，红箭头留在原位（从图标里脱出来）
 *   1.75 – 2.37  ④ 红箭头顺时针转 90° 并左移，停在文字左边
 *   2.37 – 3.57  ⑤ 逐字打出「欢迎来到您创造的世界」，120ms/字
 *   3.57 – 3.99  ⑥ 整块画面淡出 → 主界面出现
 *
 * 数据只要 5ms 就加载完，所以这里「谁慢等谁」：动画播完还没就绪就停在最后一帧等；
 * 数据早好了也照样把动画播完 —— 这就是它存在的意义。
 * 点击 / 按任意键可跳过。开关关掉时不演，遮罩直接收掉。
 */

/* 逐字打出来的那句。默认「欢迎来到您创造的世界」，设置 → 启动动画 里可以改成自己的话。
 * 只有「没有 splash 窗口、在主界面里补演一遍」这条兜底路径会用到它；正常启动是 splash.js 演的。 */
const DEFAULT_TEXT = '欢迎来到您创造的世界';
let TEXT = DEFAULT_TEXT;

/* 图标坐标（viewBox 240）里的中心 */
const ICON_C = 120;
/* 文字最多占多宽：超了就缩字号（舞台宽 700，箭头与余量之后再让出一点） */
const TEXT_MAX_W = 470;
const TEXT_MIN_FS = 13;

export const TWEAK = {
  fs: 20,            /* 字号 px */
  line: 34,          /* 行高 px */
  rectW: 700,        /* 舞台宽（决定两条线飞多远） */
  rectH: 300,        /* 舞台高 */
  icon: 132,         /* 图标边长 px */
  typeMs: 120,       /* 每个字的间隔（毫秒，真实时间） */
  speed: 1           /* 时间倍率：>1 表示放慢，仅供自动化抓帧 */
};

const real = ms => ms * TWEAK.speed;
/* 可被跳过的等待：跳过时立刻返回，不用等这一段定时器走完 */
let skipWaiter = null;
const sleep = ms => new Promise(r => {
  const t = setTimeout(() => { skipWaiter = null; r(); }, real(ms));
  skipWaiter = () => { clearTimeout(t); skipWaiter = null; r(); };
});
const dur = (s, ease) => (s * TWEAK.speed).toFixed(3) + 's' + (ease ? ' ' + ease : '');
/* 先让浏览器把当前样式刷出去，再改状态，transition 才会真的演 */
const flush = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

/**
 * 跑启动动画。
 * @param {{ready: Promise<any>, enabled: boolean, speed?: number}} opts
 * @returns Promise，遮罩移除后 resolve（数据也已就绪）
 */
export function runBootAnimation(opts) {
  const o = opts || {};
  const root = document.getElementById('boot');
  const ready = Promise.resolve(o.ready);
  if (o.speed && o.speed > 0) TWEAK.speed = o.speed;
  if (!root) return ready;

  /* 开关关掉：不演，直接收 */
  if (o.enabled === false) {
    root.remove();
    return ready;
  }

  /* 设置里自定义过的那句话（默认就用 DEFAULT_TEXT） */
  TEXT = String((o && o.text) || '').replace(/\s+/g, ' ').trim() || DEFAULT_TEXT;

  let done = false;
  let skipped = false;
  function onSkip() {
    if (skipped) return;
    skipped = true;
    if (skipWaiter) skipWaiter();      /* 立刻放开当前这一段等待 */
  }
  const cleanup = () => {
    if (done) return;
    done = true;
    try {
      root.removeEventListener('pointerdown', onSkip);
      window.removeEventListener('keydown', onSkip, true);
    } catch (e) {}
  };
  root.addEventListener('pointerdown', onSkip);
  window.addEventListener('keydown', onSkip, true);

  /* 收场：固定用真实速度（不受 --slow 影响），等数据真就绪再把遮罩淡出 */
  const end = () => {
    cleanup();
    const realSleep = ms => new Promise(r => setTimeout(r, ms));
    return ready.then(() => {
      root.style.transition = 'opacity .30s ease';
      root.style.opacity = '0';
      return realSleep(300).then(() => { root.remove(); });
    });
  };

  return animate().catch(e => {
    /* 动画自己出岔子绝不能拖住启动 */
    console.error('[boot] 启动动画出错，直接进入主界面：', e);
    cleanup();
    root.remove();
    return ready;
  });

  async function animate() {
    const stack = document.getElementById('btStack');
    const tile = document.getElementById('btTile');
    const lineTR = document.getElementById('btLineTR');
    const lineBL = document.getElementById('btLineBL');
    const arrow = document.getElementById('btArrow');
    const typeEl = document.getElementById('btType');
    const caret = document.getElementById('btCaret');
    if (!stack || !tile || !lineTR || !lineBL || !arrow || !typeEl || !caret) {
      throw new Error('启动动画的节点没找齐');
    }

    /* ---------- 舞台与图标尺寸 ---------- */
    const bw = TWEAK.rectW, bh = TWEAK.rectH;
    root.style.setProperty('--bt-icon', TWEAK.icon + 'px');
    const stage = root.querySelector('.bt-stage');
    stage.style.width = bw + 'px';
    stage.style.height = bh + 'px';

    /* ---------- 折线飞行的位移 ----------
     * 折线 svg 铺满图标框（132×132），内部 viewBox 240 —— 所以 1 个图标单位 = 132/240 像素。
     * 目标：右上那条的中心飞到舞台右上角、左下那条飞到左下角。 */
    const unit = TWEAK.icon / 240;
    const cx = bw / 2, cy = bh / 2;
    /* 两条折线在图标坐标里的重心（用包围盒中点近似，和视觉重心一致） */
    const trCenter = { x: (66 + 162) / 2, y: (62 + 118) / 2 };    /* ≈114,90 偏右上 */
    const blCenter = { x: (78 + 174) / 2, y: (122 + 178) / 2 };    /* ≈126,150 偏左下 */
    /* 舞台里的目标点：右上角、左下角各留一点边距 */
    const margin = 40;
    const trTarget = { x: bw - margin, y: margin };
    const blTarget = { x: margin, y: bh - margin };
    /* 位移 = 目标 - 当前绝对位置。当前绝对位置 = 舞台中心 + (重心 - 图标中心) * unit */
    const trDx = trTarget.x - (cx + (trCenter.x - ICON_C) * unit);
    const trDy = trTarget.y - (cy + (trCenter.y - ICON_C) * unit);
    const blDx = blTarget.x - (cx + (blCenter.x - ICON_C) * unit);
    const blDy = blTarget.y - (cy + (blCenter.y - ICON_C) * unit);

    /* ---------- 字幕：字先全部建好（透明占位），后面只翻 .on ---------- */
    typeEl.textContent = '';
    const chars = [...TEXT].map(ch => {
      const s = document.createElement('span');
      s.className = 'bt-ch';
      s.textContent = ch;
      typeEl.appendChild(s);
      return s;
    });
    typeEl.appendChild(caret);

    /* 箭头落点：舞台左侧偏内，垂直居中；文字紧跟其右 */
    const textLeft = 96;
    const textTop = Math.round(cy - TWEAK.line / 2 + 8);
    typeEl.style.left = textLeft + 'px';
    typeEl.style.top = textTop + 'px';

    /* 自定义的句子长短不一：从设定字号往回收，直到不超出舞台右侧（最小 13px）。
     * 默认那句本来就不超，测下来还是原字号。位置先摆好再量，量出来的宽度才对。 */
    const fs0 = parseFloat(getComputedStyle(root).getPropertyValue('--bt-fs')) || TWEAK.fs;
    let fs = fs0;
    const textW = () => {
      if (!chars.length) return 0;
      const box = typeEl.getBoundingClientRect();
      let w = 0;
      for (let i = 0; i < chars.length; i++) {
        const r = chars[i].getBoundingClientRect();
        w = r.right - box.left;
        if (i > 0) w += Math.max(0, r.left - chars[i - 1].getBoundingClientRect().right);
      }
      return (w > 0 && isFinite(w)) ? w : 0;   /* 还没排版时别拿来算字号 */
    };
    /* 注意：每降一档都要真的把字号写上去再量 —— 只改 fs 不写样式的话，
     * textW() 量的一直是原来的宽度，循环会一路缩到最小值（踩过一次）。 */
    const fits = () => { typeEl.style.fontSize = fs + 'px'; return textW() <= TEXT_MAX_W; };
    while (fs > TEXT_MIN_FS && !fits()) fs -= 1;
    typeEl.style.fontSize = fs + 'px';

    /* 箭头落点：文字左边同一水平线。
     * 注意箭头「图形」中心在 240 坐标的 (120,110)，比图标中心 (120,120) 高 10 个单位，
     * 而 transform-origin 也设成了那个点 —— 所以位移直接按图形中心算，旋转不会带出额外偏移。 */
    const ARROW_CY_ICON = 110;                       /* 箭头图形中心（240 坐标） */
    const arrowEndX = textLeft - 42;
    const arrowEndY = textTop + TWEAK.line / 2;
    /* 图形中心在舞台里的初始位置 */
    const arrowStartX = cx + (ICON_C - ICON_C) * unit;             /* x: 120 → 居中 */
    const arrowStartY = cy + (ARROW_CY_ICON - ICON_C) * unit;      /* y: 110 比 120 高 10 单位 */
    const arrowDx = arrowEndX - arrowStartX;
    const arrowDy = arrowEndY - arrowStartY;

    await flush();

    /* ---------- ① 图标先静置一下，让人看清它 ---------- */
    await sleep(550);
    if (skipped) return end();

    /* ---------- ② 两条折线各飞向自己的对角 ---------- */
    lineTR.style.transition = 'transform ' + dur(0.9, 'cubic-bezier(.34,.05,.36,1)');
    lineBL.style.transition = 'transform ' + dur(0.9, 'cubic-bezier(.34,.05,.36,1)');
    void lineTR.getBoundingClientRect();
    lineTR.style.transform = 'translate(' + trDx + 'px,' + trDy + 'px)';
    lineBL.style.transform = 'translate(' + blDx + 'px,' + blDy + 'px)';
    await sleep(900);
    if (skipped) return end();

    /* ---------- ③ 图标本体淡出（圆角底彻底消失），箭头留下 ---------- */
    tile.style.transition = 'opacity ' + dur(0.3, 'ease');
    tile.style.opacity = '0';
    await sleep(300);
    if (skipped) return end();

    /* ---------- ④ 箭头：顺时针 90° + 左移，一步到位 ---------- */
    arrow.style.transition = 'none';
    arrow.style.transform = 'translate(0px,0px) rotate(0deg)';
    void arrow.getBoundingClientRect();
    arrow.style.transition = 'transform ' + dur(0.62, 'cubic-bezier(.45,.05,.35,1)');
    arrow.style.transform = 'translate(' + arrowDx + 'px,' + arrowDy + 'px) rotate(90deg)';
    await sleep(620);
    if (skipped) return end();

    /* ---------- ⑤ 逐字打出 ---------- */
    caret.classList.add('on');
    for (let i = 0; i < chars.length; i++) {
      if (skipped) return end();
      chars[i].classList.add('on');
      await sleep(TWEAK.typeMs);
    }
    if (skipped) return end();

    /* ---------- ⑥ 打完直接淡出，切主界面 ---------- */
    caret.classList.remove('on');
    await end();
  }
}
