'use strict';

/* electron-builder 默认会先问 npm / pnpm 要一份依赖树，再据此挑出要打进包里的
 * node_modules。卷帙没有生产依赖——app/ 下 require 的全是 Electron 与 Node 内置
 * 模块，所以这一步纯属多余；而且它必须 spawn 一个 npm，在 .cmd 的 stdout 抓不到、
 * 或者 PowerShell 版本比较老的环境里会直接把构建搞挂。
 *
 * 返回 false = 「node_modules 由我们自己处理」，electron-builder 会跳过整个依赖
 * 收集阶段，asar 里只放 files 里列出的 app/ 与 package.json。
 * 以后真加了生产依赖，让这个钩子返回 true（或把 beforeBuild 删掉）即可恢复。 */
module.exports = async function beforeBuild() {
  return false;
};
