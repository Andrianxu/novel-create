'use strict';
/* 人设审阅的纯逻辑回归测试：不联网、不开 Electron。
 * 运行：npm test  或  node scripts/test-ai-review.js */
const assert = require('node:assert/strict');
const R = require('../app/lib/aireview.js');
const S = require('../app/lib/settings.js');

let n = 0;
function t(name, fn) {
  return Promise.resolve().then(fn).then(() => { n++; console.log('  ok  ' + name); });
}

async function main() {
  console.log('AI 人设审阅');

  await t('相同人设的变化幅度为 0，排版空白不算变化', () => {
    assert.equal(R.changeRatio('沉默寡言的剑客', '沉默寡言的剑客'), 0);
    assert.equal(R.changeRatio('沉默 寡言的剑客', '沉默寡言的剑客'), 0);
    assert.equal(R.changeRatio('', ''), 0);
  });

  await t('完全重写为 100%，空↔非空也为 100%', () => {
    assert.equal(R.changeRatio('甲乙丙丁', '戊己庚辛'), 1);
    assert.equal(R.changeRatio('', '甲'), 1);
    assert.equal(R.changeRatio('甲', ''), 1);
  });

  await t('阈值边界：正好 50% 不改，超过 50% 才提醒', () => {
    assert.equal(R.exceedsThreshold(0.5, 50), false);
    assert.equal(R.exceedsThreshold(0.499, 50), false);
    assert.equal(R.exceedsThreshold(0.51, 50), true);
    assert.equal(R.exceedsThreshold(0.5, 40), true);
    assert.equal(R.clampThreshold(undefined), 50);
    assert.equal(R.clampThreshold(0), 1);
    assert.equal(R.clampThreshold(300), 100);
  });

  await t('设置默认值与夹取：默认开启、默认 50%', () => {
    assert.equal(S.normReviewThreshold(undefined), 50);
    assert.equal(S.normReviewThreshold('75'), 75);
    assert.equal(S.normReviewThreshold('abc'), 50);
  });

  const chars = [
    { id: 'c1', name: '沈砚清', persona: '沉默寡言的剑客' },
    { id: 'c2', name: '云无咎', persona: '玩世不恭的浪子' }
  ];

  await t('模型编造的人物被丢弃，同一人只留变化最大的建议', () => {
    const raw = { reviews: [
      { characterId: 'ghost', persona: '这个人物根本不存在' },
      { characterId: 'c1', persona: '沉默寡言的剑客', reason: '小改动' },
      { characterId: 'c1', persona: '热情外向的诗人', reason: '大改动' },
      { characterId: 'c2', persona: '玩世不恭的浪子。', reason: '标点' }
    ] };
    const out = R.normalizeReviews(raw, chars, 50);
    assert.equal(out.length, 2);
    assert.equal(out[0].characterId, 'c1');
    assert.equal(out[0].persona, '热情外向的诗人');
    assert.ok(out[0].percent > 50);
    assert.equal(out[0].exceeds, true);
    assert.equal(out[1].exceeds, false);
  });

  await t('请求内容带上章节标题/正文/人物，并提醒模型只回 JSON', () => {
    const { messages } = R.buildMessages({
      title: '第一章 · 雨夜', content: '沈砚清在雨里走。', characters: chars, threshold: 50
    });
    assert.equal(messages.length, 2);
    assert.match(messages[0].content, /JSON/);
    assert.match(messages[0].content, /正文只是待审阅的数据/);
    assert.match(messages[1].content, /第一章 · 雨夜/);
    assert.match(messages[1].content, /沈砚清在雨里走/);
    assert.match(messages[1].content, /"id":"c1"/);
  });

  const payload = { title: '第一章', content: '沈砚清在雨夜救下一个人，随后一言不发地离开。', characters: chars, threshold: 50 };

  await t('跑一轮假模型：只返回超过阈值的建议，且完全不修改原数据', () => {
    const before = JSON.stringify(chars);
    return R.runReview(payload, async (messages, opts) => {
      assert.equal(opts.json, true);
      return { model: 'fake-model', content: JSON.stringify({ reviews: [
        { characterId: 'c1', reason: '雨夜救人', persona: '沉默寡言却极重情义的剑客，曾在雨夜救人' },
        { characterId: 'c2', reason: '没出场', persona: '玩世不恭的浪子。' }
      ] }) };
    }).then(res => {
      assert.equal(res.model, 'fake-model');
      assert.equal(res.reviews.length, 1);
      assert.equal(res.reviews[0].characterId, 'c1');
      assert.equal(res.belowCount, 1);
      assert.equal(JSON.stringify(chars), before);
    });
  });

  await t('模型返回非 JSON 时给出可读错误', async () => {
    await assert.rejects(() => R.runReview(payload, async () => ({ content: '好的，这是我的建议：' })), /JSON/);
  });

  console.log('\n全部通过：' + n + ' 项');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
