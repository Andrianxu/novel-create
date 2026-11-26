'use strict';
const { contextBridge, ipcRenderer, webUtils } = require('electron');

const call = (ch, ...a) => ipcRenderer.invoke(ch, ...a);

contextBridge.exposeInMainWorld('nf', {
  info: () => call('app:info'),
  data: {
    load: () => call('data:load'),
    save: (doc) => call('data:save', doc),
    backups: () => call('data:backups'),
    restore: (name) => call('data:restore', name),
    backupNow: () => call('data:backupNow'),
    exportJson: () => call('data:exportJson'),
    exportDoc: (opts) => call('data:exportDoc', opts),
    importJson: () => call('data:importJson'),
    /* 存储位置：现在的数据目录在哪、挑一个新目录、换过去（复制 + 对账 + 记指针，当场生效） */
    store: {
      info: () => call('data:dirInfo'),
      pick: () => call('data:pickFolder'),
      isDataDir: (abs) => call('data:dirRelative', abs),
      set: (opts) => call('data:dirSet', opts || {})
    }
  },
  books: {
    list: () => call('books:list'),
    create: (opts) => call('books:create', opts),
    switch: (id) => call('books:switch', id),
    rename: (id, patch) => call('books:rename', id, patch),
    remove: (id) => call('books:delete', id)
  },
  settings: {
    get: () => call('settings:get'),
    set: (patch) => call('settings:set', patch),
    /* AI 助手图标：上传本地图片 / 恢复默认（kind = chapter | plot） */
    setAiIcon: (kind, source) => call('settings:setAiIcon', kind, source),
    clearAiIcon: (kind) => call('settings:clearAiIcon', kind),
    setSyncSecret: (name, value) => call('settings:setSyncSecret', name, value),
    setApiKey: (k) => call('settings:setApiKey', k),
    clearApiKey: () => call('settings:setApiKey', '')
  },
  files: {
    pick: (opts) => call('file:pick', opts),
    pathFor: (f) => { try { return webUtils.getPathForFile(f); } catch (e) { return (f && f.path) || ''; } },
    openPath: (p) => call('file:openPath', p),
    showInFolder: (p) => call('file:showInFolder', p)
  },
  imp: {
    parse: (file) => call('import:parse', file)
  },
  llm: {
    test: () => call('llm:test'),
    chat: (messages, opts) => call('llm:chat', messages, opts),
    models: (opts) => call('llm:models', opts)
  },
  review: {
    /* 人设审阅：正文与人物小传只在本机拼装，结果只含建议，是否写入由作者决定 */
    chapter: (payload) => call('review:chapter', payload)
  },
  book: {
    /* 正文只在入库那一刻由主进程读出来，不走 IPC；这里只加界面真正用到的几个：
     *   touch  —— 报告"正在看哪本书"，入库时主进程靠它找回拆书结果
     *   tab    —— 记住勾了哪几章 / 选了哪几条，切页不丢
     *   analyze —— 起一轮分析（主进程里的 job，切页 / 卸载页面都不会打断它）
     *   job    —— 问主进程「这本书的分析跑到哪了」，切回页面时接上进度 */
    touch: (bookId) => call('book:touch', bookId),
    create: (file) => call('book:create', file),
    resplit: (bookId, rule) => call('book:resplit', bookId, rule),
    analyze: (opts) => call('book:analyze', opts),
    job: (bookId) => call('book:job', bookId),
    cancel: () => call('book:cancel'),
    tab: (opts) => call('book:tab', opts),
    commit: (opts) => call('book:commit', opts),
    remove: (bookId) => call('book:remove', bookId)
  },
  sync: {
    test: (conf) => call('sync:test', conf),
    now: () => call('sync:now'),
    status: () => call('sync:status'),
    pickFolder: (opts) => call('sync:pickFolder', opts)
  },
  clip: {
    write: (text) => call('clipboard:write', text)
  },
  update: {
    /* 在线更新：查 GitHub Releases、下载新版 exe、装上并重启 */
    state: () => call('update:state'),
    check: (opts) => call('update:check', opts || {}),
    download: (rel) => call('update:download', rel),
    apply: () => call('update:apply'),
    quit: () => call('update:quit'),
    skip: (version) => call('update:skip', version)
  },
  image: {
    pickPortrait: (charId) => call('image:pickPortrait', charId),
    pastePortrait: (charId) => call('image:pastePortrait', charId),
    importDataUrl: (charId, dataUrl) => call('image:importDataUrl', charId, dataUrl),
    absolute: (rel) => call('image:absolute', rel),
    openExternal: (url) => call('shell:openExternal', url),
    pickMapBase: (planeId) => call('image:pickMapBase', planeId)
  },
  on: (evt, fn) => {
    const m = {
      'book:progress': (e, d) => fn(d),
      'sync:progress': (e, d) => fn(d),
      'update:progress': (e, d) => fn(d)
    }[evt];
    if (!m) return () => {};
    ipcRenderer.on(evt, m);
    return () => ipcRenderer.removeListener(evt, m);
  }
});
