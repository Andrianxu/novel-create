/* AI 人设审阅的界面流程
 *
 * 只在「写完一章 → 新建下一章」时被调用。这里不碰模型细节，也不偷偷改书稿：
 * 主进程给出建议后逐条弹窗，作者点「采纳修改」才写回 persona 并走 NF.save()（可撤销）。 */
import { h, toast, modal, injectStyle } from './util.js';

injectStyle('ai-review', `
.airev-b{display:flex;flex-direction:column;gap:10px}
.airev-top{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.airev-name{font-family:var(--kai);font-size:15px;color:#201C18}
.airev-pct{font-size:10.5px;color:#8A6421;background:#F7EBD3;border:1px solid #E7D6AF;border-radius:999px;padding:2px 9px}
.airev-reason{font-size:11.5px;color:#5B5348;line-height:1.75}
.airev-cols{display:flex;gap:10px}
.airev-col{flex:1;min-width:0;border:1px solid #EAE1CF;border-radius:9px;background:#FFFCF5;padding:9px 10px}
.airev-col.new{border-color:#D8BF93;background:#FBF3E6}
.airev-col .lab{font-size:10px;letter-spacing:.08em;color:#8C8272;margin-bottom:6px}
.airev-col .txt{font-size:12px;line-height:1.8;color:#332C25;white-space:pre-wrap;word-break:break-word;max-height:180px;overflow:auto}
.airev-foot{display:flex;align-items:center;gap:8px;border-top:1px dashed #EAE1CF;padding-top:10px}
.airev-hint{font-size:10.5px;color:#8C8272;line-height:1.6}
`);

let busy = false;

function config() {
  const s = (window.NF && window.NF.settings && window.NF.settings.aiReview) || {};
  const n = Number(s.threshold);
  return {
    enabled: s.enabled !== false,
    threshold: Number.isFinite(n) ? Math.min(100, Math.max(1, Math.round(n))) : 50
  };
}

const ipcErr = e => String((e && e.message) || e || '').replace(/^Error invoking remote method '[^']*':\s*(?:Error:\s*)?/, '');

/* 人物多的时候只送最相关的 40 人：按姓名 / 别名在正文里出现的次数排，避免重要角色被截断 */
function pickCharacters(doc, content) {
  return (doc.characters || []).map(c => {
    const names = [c.name].concat(Array.isArray(c.aliases) ? c.aliases : []).filter(Boolean).map(String);
    let hits = 0;
    for (const name of names) if (name) hits += content.split(name).length - 1;
    return { c, hits };
  }).sort((a, b) => b.hits - a.hits).slice(0, 40)
    .map(x => ({
      id: x.c.id, name: x.c.name, aliases: x.c.aliases || [],
      identity: x.c.identity || '', persona: x.c.persona || ''
    }));
}

/* 逐条问作者。返回 'all' 表示「全部忽略」，后面的不再弹。 */
function askOne(review, NF, doc) {
  return new Promise(resolve => {
    let dlg = null;
    const done = v => { if (dlg) dlg.close(); resolve(v); };
    const accept = () => {
      const c = (doc.characters || []).find(x => x.id === review.characterId);
      if (!c) {
        toast('这本书里已经找不到「' + review.name + '」了，这条已跳过', 'err');
        done(false);
        return;
      }
      c.persona = review.persona;
      NF.save();                       // 同一条保存通道：落盘 + 进撤销栈
      toast('已采纳「' + c.name + '」的人设修改 · Ctrl+Z 可撤销', 'ok');
      done(true);
    };
    const body = h('div', { class: 'airev-b' },
      h('div', { class: 'airev-top' },
        h('span', { class: 'airev-name' }, review.name || '人物'),
        h('span', { class: 'airev-pct' }, '人设变化 ' + (review.percent != null ? review.percent : '?') + '%')),
      h('div', { class: 'airev-reason' }, review.reason || '这一章给出了新的人设信息。'),
      h('div', { class: 'airev-cols' },
        h('div', { class: 'airev-col' },
          h('div', { class: 'lab' }, '现在的人设'),
          h('div', { class: 'txt' }, review.oldPersona || '（还没有写人设）')),
        h('div', { class: 'airev-col new' },
          h('div', { class: 'lab' }, '建议改为'),
          h('div', { class: 'txt' }, review.persona || ''))),
      h('div', { class: 'airev-foot' },
        h('span', { class: 'airev-hint grow' }, '只有你点「采纳修改」才会写入人设；忽略不会改动任何内容。'),
        h('button', { class: 'btn', 'data-probe': 'ai-review-ignore-all', onclick: () => done('all') }, '全部忽略'),
        h('button', { class: 'btn', 'data-probe': 'ai-review-ignore', onclick: () => done(false) }, '忽略'),
        h('button', { class: 'btn pri', 'data-probe': 'ai-review-accept', onclick: accept }, '采纳修改')));
    dlg = modal({ title: 'AI 人设审阅建议', width: '640px', footer: false, dismissable: false, body });
    dlg.box.dataset.probe = 'ai-review-modal';
  });
}

async function presentAll(list, NF, doc) {
  toast('AI 审阅发现 ' + list.length + ' 处人设建议，请逐条决定', 'ok');
  for (const review of list) {
    /* 书稿可能在弹窗期间被撤销 / 切书：已存在的人设当快照留着给人看，采纳时再核对 id */
    const c = (doc.characters || []).find(x => x.id === review.characterId);
    if (c && !review.oldPersona) review.oldPersona = c.persona || '';
    const decision = await askOne(review, NF, doc);
    if (decision === 'all') { toast('已忽略其余审阅建议'); break; }
  }
}

/* 入口：写完的那一章 + 当前书稿 + 外壳。整段是异步的，新建章节不用等它。 */
export function runChapterReview({ doc, NF, manuscript }) {
  const cfg = config();
  if (!cfg.enabled) return Promise.resolve({ skipped: 'disabled' });
  if (busy) { toast('上一章还在审阅中，请稍候', 'err'); return Promise.resolve({ skipped: 'busy' }); }
  const m = manuscript || {};
  const content = String(m.content || '');
  if (content.trim().length < 30) {
    toast('这一章还没写多少字，跳过 AI 审阅');
    return Promise.resolve({ skipped: 'short' });
  }
  if (!NF.settings || !NF.settings.hasApiKey) {
    toast('未配置 API Key，已跳过 AI 审阅（设置 → 模型接口）', 'err');
    return Promise.resolve({ skipped: 'no-key' });
  }

  busy = true;
  const name = m.title || '这一章';
  toast('AI 正在审阅「' + name + '」的人物…');
  return window.nf.review.chapter({
    title: name, content,
    characters: pickCharacters(doc, content),
    threshold: cfg.threshold
  }).then(async result => {
    if (!result || result.skipped) {
      if (result && result.skipped && result.skipped !== 'disabled') toast('AI 审阅：' + result.skipped);
      return result || {};
    }
    const list = Array.isArray(result.reviews) ? result.reviews : [];
    if (!list.length) {
      const tail = result.belowCount
        ? '（' + result.belowCount + ' 处变化未超过 ' + cfg.threshold + '%）'
        : '';
      toast('AI 审阅完成：人设无需修改' + tail, 'ok');
      return result;
    }
    await presentAll(list, NF, doc);
    return result;
  }).catch(e => {
    toast('AI 审阅失败：' + ipcErr(e), 'err');
    return { error: ipcErr(e) };
  }).finally(() => { busy = false; });
}
