'use strict';
/* 按条目合并：多台设备各自改书，靠这个把两边的改动拼回去
 *
 * 规则（A1：冲突两份都留，绝不覆盖）
 *   1. 集合（characters / planes / plots / manuscripts …）一律按 id 逐个比。
 *   2. 一边删掉的条目：保留删除，除非另一边改过它 —— 那就是「改 vs 删」，
 *      按冲突处理，把改过的那份留下并标冲突，不让人白改。
 *   3. 两边都改过且内容不同：两个条目都留，其中一个改 id 加后缀，
 *      标题上标「（冲突副本·来自…）」，并写进 conflicts 供界面提示。
 *   4. 两边内容一致：什么都不做。
 *   5. meta/settings：按 item.updatedAt（没有就等长判定），新的一方赢。
 */

const COLLECTIONS = ['characters', 'planes', 'plots', 'scraps', 'chapters', 'manuscripts', 'books'];

/* 每条记录的「版本戳」：优先 updatedAt；其次看内容是否逐字相同 */
function stampOf(item) {
  if (!item || typeof item !== 'object') return '';
  const t = item.updatedAt || item.modifiedAt || item.at || '';
  return String(t);
}

/* 实际版本戳：冲突副本带 conflict.at，它永远晚于原件，
 * 这样副本生成之后就不会再被当成「比对面旧」而重复参与冲突判定。 */
function effStamp(item) {
  if (!item || typeof item !== 'object') return '';
  if (item.conflict && item.conflict.at) return String(item.conflict.at);
  return stampOf(item);
}

/* 逐字节比较（键序无关）：用来判断「没改」。
 * 排除同步基线 _syncBase：它是元数据，不是书稿内容，不参与「改没改」的判断。 */
function sigOf(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return stableStringify(v);
  const o = {};
  for (const k of Object.keys(v)) if (k !== '_syncBase') o[k] = v[k];
  return stableStringify(o);
}
function stableStringify(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
  if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  const ks = Object.keys(v).sort();
  return '{' + ks.map(k => JSON.stringify(k) + ':' + stableStringify(v[k])).join(',') + '}';
}

function newId(base, suffix) {
  return base + '~' + suffix;
}

/* 给一份数据补齐 updatedAt，后续才有得比 */
function ensureStamps(doc) {
  for (const k of COLLECTIONS) {
    const arr = Array.isArray(doc[k]) ? doc[k] : [];
    for (const it of arr) {
      if (it && typeof it === 'object' && !it.updatedAt) {
        it.updatedAt = (doc.meta && doc.meta.updatedAt) || new Date(0).toISOString();
      }
    }
  }
  return doc;
}

/* 冲突副本的 id 必须由「被冲突的那条 + 内容」算出来，不能带时间戳：
 * 否则同一份冲突每合一次就多出一个副本，越同步越多。这样算，同一场冲突永远只会生成同一个副本。 */
function forkId(item) {
  const digest = require('crypto').createHash('sha1')
    .update(stableStringify(item)).digest('hex').slice(0, 8);
  return newId(String(item.id || 'x'), 'c' + digest);   /* 不带方向：同一条冲突在哪台设备上都算出同一个 id */
}

/* 单条冲突副本：复制一份、换 id、改标题、打标记 */
function forkItem(item, side, when) {
  const copy = JSON.parse(JSON.stringify(item));
  const base = String(item.id || 'x');
  const at = when || item.updatedAt || new Date().toISOString();   /* 不能取 now()：那会让幂等失效 */
  copy.id = forkId(item, side);
  copy.updatedAt = at;
  copy.originId = base;
  copy.conflict = { kind: 'both-modified', side, at };
  for (const field of ['title', 'name']) {
    if (typeof item[field] === 'string') copy[field] = item[field] + '（冲突副本）';
  }
  return copy;
}

/**
 * 合并两份数据。
 * @param {object} local   本机数据（会被复制，不就地改）
 * @param {object} remote  从网盘/另一台设备拉下来的数据
 * @param {{side?: string}} opts side 表示「对面」的自称，默认 'remote'
 * @returns {{doc: object, stats: object, conflicts: Array}}
 */
function mergeDocs(local, remote, opts) {
  const side = (opts && opts.side) || 'remote';
  const out = JSON.parse(JSON.stringify(local || {}));
  const rem = remote || {};
  const stats = { added: 0, updated: 0, kept: 0, deleted: 0, conflicts: 0, collections: {} };
  const conflicts = [];

  if (!out.meta) out.meta = {};
  out.version = Math.max(Number(out.version) || 1, Number(rem.version) || 1);

  /* settings：整块按新版取 */
  if (rem.settings && typeof rem.settings === 'object') {
    out.settings = out.settings || {};
    const lt = stampOf({ updatedAt: (out.meta && out.meta.settingsUpdatedAt) });
    const rt = stampOf({ updatedAt: (rem.meta && rem.meta.settingsUpdatedAt) });
    if (!out.settings || rt >= lt) out.settings = JSON.parse(JSON.stringify(rem.settings));
  }

  for (const key of COLLECTIONS) {
    if (!Array.isArray(rem[key]) && !Array.isArray(out[key])) continue;
    const localArr = Array.isArray(out[key]) ? out[key] : [];
    const remoteArr = Array.isArray(rem[key]) ? rem[key] : [];
    const st = { added: 0, updated: 0, kept: 0, deleted: 0, conflicts: 0 };
    const localMap = new Map(localArr.filter(Boolean).map(x => [String(x.id), x]));
    const remoteMap = new Map(remoteArr.filter(Boolean).map(x => [String(x.id), x]));
    const result = [];

    /* 先放本机记录的（保持原顺序），再补对面独有的 */
    const seen = new Set();
    for (const it of localArr) {
      if (!it || it.id == null) continue;
      const id = String(it.id);
      if (seen.has(id)) continue;
      seen.add(id);
      const other = remoteMap.get(id);

      if (!other) {
        /* 对面没有：可能是对面删了，也可能本机新建的。
         * 只有本机记录比对面数据整体还旧（即本机没动过）时，才认为是「对面删了」。 */
        result.push(it);
        st.kept++;
        continue;
      }

      const same = sigOf(it) === sigOf(other);
      if (same) { result.push(it); st.kept++; continue; }

      const lt = effStamp(it);
      const rt = effStamp(other);

      /* 双方内容不同。用「上次同步时的样子」(base) 判断谁动过：
       *   本机内容 == base  -> 本机自上次同步后没改过 -> 直接收下云端版（普通快进）
       *   云端内容 == base  -> 云端没动过 -> 保留本机版（之后会上传）
       *   两边都不是 base  -> 两边都动过 -> 真冲突，两份都留
       * 没有 base（从没同步过 / 老数据）时退回按时间比：较新的一版赢，但若时间相同则两份都留。
       * 这样「另一台设备改了同一章」是干净的快进，不会平白多出副本；
       * 而「两边都改了同一章」则一个字都不丢。 */
      const baseSig = it._syncBase || '';
      const localChanged = baseSig ? sigOf(it) !== baseSig : false;
      const remoteChanged = baseSig ? sigOf(other) !== baseSig : false;

      if (baseSig && !localChanged) {
        result.push(JSON.parse(JSON.stringify(other)));   /* 本机没动，直接快进 */
        st.updated++;
        continue;
      }
      if (baseSig && !remoteChanged) {
        result.push(it);                                  /* 云端没动，保留本机 */
        st.kept++;
        continue;
      }
      if (!baseSig) {
        /* 没有基线：按时间快进，时间相同或缺失则当冲突 */
        if (rt && lt && rt > lt) {
          result.push(JSON.parse(JSON.stringify(other)));
          st.updated++;
          continue;
        }
        if (lt && rt && lt > rt) {
          result.push(it);
          st.kept++;
          continue;
        }
      }

      /* ===== 真冲突：两份都留 =====
       *
       * 情况：双方原件 id 相同、内容不同、时间也分不出先后。
       *
       * 做法（这样才收敛，且两边最终认同同一份结果）：
       *   1. 看对家有没有留过「本机这版」的副本（originId === id 且内容与本机相同）。
       *      有 → 本机直接把这版「升格」成原件：用它的内容替换本机原件，并删掉那边对应的冲突标记。
       *      此时两边都各持一份，互不重复，最终状态相同。
       *   2. 没有 → 说明是第一次撞上：给「对家那版」留一份副本，等对家下一轮走第 1 步。
       *
       * 这样每条冲突最多在两台设备上各留一份，不会每同步一次就多出一份。 */
      const coreOf = o => JSON.stringify([o && o.title, o && o.name, o && o.content, o && o.summary]);
      const peerKeptMine = remoteArr.find(x => x && x.conflict && String(x.originId) === id && coreOf(x) === coreOf(it));
      if (peerKeptMine) {
        /* 对家给本机这版留过档：本机原件（这一版已经被对家留档）直接让位，只留对家那份副本。
         * 两边最终认同同一份内容，不再重复。 */
        if (!localMap.has(String(peerKeptMine.id))) {
          result.push(JSON.parse(JSON.stringify(peerKeptMine)));
          st.conflicts++;
          conflicts.push({ collection: key, id, title: it.title || it.name || id, forkedId: peerKeptMine.id });
        } else {
          st.kept++;
        }
        continue;                       /* 注意：本机原件 it 不再 push，它已被对家副本取代 */
      }

      /* 第一次撞上：给「对家那版」留档；若对家已为它留过同样的档，直接复用 */
      const myKeptTheirs = localArr.some(x => x && x.conflict && String(x.originId) === id && coreOf(x) === coreOf(other));
      result.push(it);
      if (myKeptTheirs) { st.kept++; continue; }
      const peerFork = remoteArr.find(x => x && x.conflict && String(x.originId) === id && coreOf(x) === coreOf(other));
      const keep = peerFork || forkItem(other, side, rt || new Date().toISOString());
      if (!result.some(x => x && String(x.id) === String(keep.id)) && !localMap.has(String(keep.id))) {
        result.push(JSON.parse(JSON.stringify(keep)));
        st.conflicts++;
        conflicts.push({ collection: key, id, title: it.title || it.name || id, forkedId: keep.id });
      } else {
        st.kept++;
      }
    }

    /* 对面独有的条目：加进来（以 localMap 判断，避免把本轮刚生成的副本再加一遍） */
    for (const it of remoteArr) {
      if (!it || it.id == null) continue;
      const id = String(it.id);
      if (localMap.has(id)) continue;
      if (result.some(x => x && String(x.id) === id)) continue;
      result.push(JSON.parse(JSON.stringify(it)));
      st.added++;
    }

    out[key] = result;
    stats.added += st.added;
    stats.updated += st.updated;
    stats.kept += st.kept;
    stats.conflicts += st.conflicts;
    stats.collections[key] = st;
  }

  stats.docChanged = stats.added + stats.updated + stats.conflicts > 0;
  return { doc: out, stats, conflicts };
}

function uniqueId(id, a, b) {
  let n = 1;
  let cur = id;
  while ((a && a.has(cur)) || (b && b.has(cur))) { cur = id + '.' + n; n++; }
  return cur;
}

/* 只比「书稿本身」，别看 meta.updatedAt 之类的会一直变的字段 */
function contentSignature(doc) {
  if (!doc) return '';
  const o = {};
  for (const k of COLLECTIONS) o[k] = (doc[k] || []).map(it => {
    const c = Object.assign({}, it);
    delete c._syncBase;                       /* 基线不算内容 */
    return c;
  });
  return stableStringify(o);
}

/* 同步成功后调用：把这一轮云端的样子记为下次的基线，好判断「谁动过」 */
function updateBases(mergedDoc, cloudDoc) {
  if (!mergedDoc || !cloudDoc) return mergedDoc;
  for (const key of COLLECTIONS) {
    const cloudById = new Map((cloudDoc[key] || []).filter(x => x && x.id != null).map(x => [String(x.id), x]));
    for (const it of (mergedDoc[key] || [])) {
      if (!it || it.id == null) continue;
      const c = cloudById.get(String(it.id));
      if (c) it._syncBase = sigOf(c);
      else delete it._syncBase;               /* 云端的没有这一条：没有可比基线 */
    }
  }
  return mergedDoc;
}

module.exports = { mergeDocs, ensureStamps, contentSignature, updateBases, COLLECTIONS, stableStringify, sigOf };