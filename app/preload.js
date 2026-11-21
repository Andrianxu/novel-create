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
    importJson: () => call('data:importJson')
  },
  settings: {
    get: () => call('settings:get'),
    set: (patch) => call('settings:set', patch),
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
    chat: (messages, opts) => call('llm:chat', messages, opts)
  },
  book: {
    create: (file) => call('book:create', file),
    resplit: (bookId, rule) => call('book:resplit', bookId, rule),
    analyze: (opts) => call('book:analyze', opts),
    cancel: () => call('book:cancel'),
    commit: (opts) => call('book:commit', opts),
    remove: (bookId) => call('book:remove', bookId)
  },
  clip: {
    write: (text) => call('clipboard:write', text)
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
      'book:progress': (e, d) => fn(d)
    }[evt];
    if (!m) return () => {};
    ipcRenderer.on(evt, m);
    return () => ipcRenderer.removeListener(evt, m);
  }
});
