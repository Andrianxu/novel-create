'use strict';
/* splash 窗口专用的 preload：只做一件事 —— 动画播完时告诉主进程。
 * 它不碰文件、不碰数据，权限极小。 */
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('__splashBridge', {
  done: () => { try { ipcRenderer.send('splash:anim-done'); } catch (e) {} }
});
