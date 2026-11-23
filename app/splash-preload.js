'use strict';
/* splash 窗口专用的 preload：只做两件事 —— 动画播完时告诉主进程、接住自定义的启动文字。
 * 它不碰文件、不碰数据，权限极小。 */
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('__splashBridge', {
  done: () => { try { ipcRenderer.send('splash:anim-done'); } catch (e) {} },
  /* 主进程把「设置里自定义的那句话」推过来。正常情况下 splash.js 已经从内联的
   * window.__nfSplash 里拿到了，这条只是兜底（页面走 loadFile 加载时那条走不通）。 */
  text: (fn) => {
    ipcRenderer.on('splash:config', (e, d) => { try { fn(d && d.text || ''); } catch (err) {} });
  }
});
