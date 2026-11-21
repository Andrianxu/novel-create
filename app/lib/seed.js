'use strict';
/* 首次启动的演示数据：一本书、几个主要人物、一片三洲四海、若干情节 */
const C = (id, name, o) => Object.assign({
  id, name, aliases: [], age: '', identity: '', realm: '', persona: '', ending: '',
  group: '主线', color: '#2F6F63', portrait: null, relations: []
}, o || {});

module.exports = function seed() {
  return {
    version: 1,
    meta: { title: '临水问剑', author: '墨明', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    characters: [
      C('c1', '沈砚清', { age: '十九', identity: '临水剑冢 · 第三峰首徒', realm: '练气九层', group: '主线', color: '#2F6F63',
        persona: '少言寡语，听雨成癖；剑意如雨，落而不乱。',
        ending: '斩断界门 · 封天坠河',
        relations: [{ targetId: 'c2', label: '同门' }, { targetId: 'c3', label: '所慕·已故' }, { targetId: 'c4', label: '宿敌' }] }),
      C('c2', '云无咎', { age: '二十二', identity: '浮云观 · 剑修', realm: '筑基后期', group: '主线', color: '#3D7F71',
        persona: '狂妄张扬，护短成性，认死理。', ending: '界门前断臂，后归隐浮云观',
        relations: [{ targetId: 'c1', label: '结义' }] }),
      C('c3', '宁疏影', { age: '二十', identity: '听潮楼 · 暗子', realm: '筑基初期', group: '主线', color: '#8A6A2F',
        persona: '外柔内烈，以血引雷，从不言悔。', ending: '第十九章 · 雪夜身殒',
        relations: [{ targetId: 'c1', label: '相护' }] }),
      C('c4', '秦无涯', { age: '三十七', identity: '太虚秦氏 · 家主', realm: '元婴中期', group: '反派', color: '#6B2B4A',
        persona: '执念于开界门，视苍生为柴薪。', ending: '界门前被斩',
        relations: [{ targetId: 'c1', label: '世仇' }] }),
      C('c5', '陶大士', { age: '三百余', identity: '临水剑冢 · 老祖', realm: '化神初期', group: '长辈', color: '#2F4A6F',
        persona: '白日饮酒，夜里磨剑，只说两个字。', ending: '守冢至老，尸解于第三峰' }),
      C('c6', '曲红绡', { age: '二十五', identity: '赤烬火宗 · 圣女', realm: '金丹初期', group: '南荒', color: '#A8322A',
        persona: '毒舌，爱红裳，火法烧得比自己还急。', ending: '终章南荒自立' }),
      C('c7', '裴无咎', { age: '二十八', identity: '散修 · 阵师', realm: '金丹后期', group: '旁支', color: '#7C5C8C',
        persona: '话痨，布阵如做菜，什么料都敢放。', ending: '守南荒关，不知所终' }),
      C('c8', '江雪衣', { age: '二十三', identity: '游侠 · 刀客', realm: '筑基中期', group: '旁支', color: '#4A5E8C',
        persona: '只认朋友不认理，刀比话快。', ending: '随沈砚清入界门' })
    ],
    planes: [{
      id: 'p1', name: '青冥界', note: '3 洲 · 10 宗门 · 正文所在', baseImage: null,
      continents: [
        { id: 'k1', name: '苍梧洲', note: '东陆 · 4 宗门', color: '#EFE2C6', cx: 716, cy: 292, rx: 168, ry: 138 },
        { id: 'k2', name: '昆吾洲', note: '西陆 · 3 宗门', color: '#EFE2C6', cx: 232, cy: 344, rx: 126, ry: 150 },
        { id: 'k3', name: '赤烬洲', note: '南荒 · 2 宗门', color: '#F0DCC4', cx: 596, cy: 662, rx: 150, ry: 60 },
        { id: 'k4', name: '北境雪原', note: '冰原 · 1 宗门', color: '#EDF1F0', cx: 418, cy: 82, rx: 88, ry: 34 }
      ],
      sects: [
        { id: 's1', name: '临水剑冢', continentId: 'k1', x: 716, y: 292, align: 'good', size: 3, members: '弟子 1,200', desc: '剑修宗门 · 老祖陶大士', characterIds: ['c1', 'c5'] },
        { id: 's2', name: '太虚秦氏', continentId: 'k1', x: 792, y: 236, align: 'evil', size: 3, members: '元婴 3 人', desc: '苍梧洲最大的世家', characterIds: ['c4'] },
        { id: 's3', name: '听潮楼', continentId: 'k1', x: 632, y: 352, align: 'neutral', size: 2, members: '分号 9', desc: '情报买卖，中立', characterIds: ['c3'] },
        { id: 's4', name: '青灯寺', continentId: 'k1', x: 786, y: 372, align: 'good', size: 2, members: '僧众 400', desc: '度亡僧，不问世事', characterIds: [] },
        { id: 's5', name: '浮云观', continentId: 'k2', x: 232, y: 332, align: 'good', size: 2, members: '剑修 86', desc: '云无咎师门', characterIds: ['c2'] },
        { id: 's6', name: '散修盟', continentId: 'k2', x: 176, y: 408, align: 'neutral', size: 1, members: '无定所', desc: '散修抱团，谁给钱帮谁', characterIds: ['c7'] },
        { id: 's7', name: '九幽引', continentId: 'k2', x: 296, y: 246, align: 'evil', size: 2, members: '炼魂 47', desc: '以生魂炼器', characterIds: [] },
        { id: 's8', name: '赤烬火宗', continentId: 'k3', x: 596, y: 654, align: 'evil', size: 3, members: '南荒霸主', desc: '火法一脉，与秦氏暗通', characterIds: ['c6'] },
        { id: 's9', name: '万骨窟', continentId: 'k3', x: 676, y: 668, align: 'evil', size: 1, members: '散修聚集', desc: '杀人夺宝之地', characterIds: [] },
        { id: 's10', name: '玄冰宫', continentId: 'k4', x: 418, y: 82, align: 'hidden', size: 2, members: '封山中', desc: '北境隐世', characterIds: [] }
      ],
      sectRelations: [
        { a: 's1', b: 's5', kind: 'ally', label: '盟约 · 三百年' },
        { a: 's1', b: 's2', kind: 'enemy', label: '世仇' },
        { a: 's2', b: 's8', kind: 'secret', label: '暗通' }
      ],
      realms: [
        { name: '练气', note: '1–9 层 · 主角起点' }, { name: '筑基', note: '初 / 中 / 后 · 云无咎' },
        { name: '金丹', note: '当前战力上限' }, { name: '元婴', note: '秦无涯 · 老祖级' },
        { name: '化神', note: '陶大士' }, { name: '炼虚', note: '—' },
        { name: '合体', note: '—' }, { name: '大乘', note: '传说' }, { name: '渡劫', note: '终章 · 封天' }
      ],
      lore: [
        { tag: '地理', text: '三洲之间隔无界海，渡海需灵舟' },
        { tag: '灵脉', text: '苍梧洲七条，秦氏独占其三' },
        { tag: '禁忌', text: '界门不可双向开启' },
        { tag: '天时', text: '雨夜剑鸣，三年一度' }
      ]
    }],
    plots: [
      { id: 'g1', title: '雨夜入冢', chapterNo: 1, chapter: '第1章', timePoint: 1, place: '临水剑冢 · 山门', characterIds: ['c1'], status: 'done', summary: '沈砚清雨中入山门，第一次听到剑鸣。' },
      { id: 'g2', title: '初试剑心', chapterNo: 3, chapter: '第3章', timePoint: 2, place: '第三峰 · 剑坪', characterIds: ['c1', 'c5'], status: 'done', summary: '陶大士只说了两个字：拔剑。' },
      { id: 'g3', title: '听雨断剑', chapterNo: 5, chapter: '第5章', timePoint: 3, place: '临水 · 听雨楼', characterIds: ['c1', 'c2'], status: 'done', summary: '与云无咎一战，剑折半柄，从此改练听雨。' },
      { id: 'g4', title: '剑冢失守', chapterNo: 10, chapter: '第10章', timePoint: 5, place: '临水剑冢 · 第三峰', characterIds: ['c1', 'c4', 'c5'], status: 'done', summary: '秦氏破山门，老祖重伤，沈砚清携断剑下山。' },
      { id: 'g5', title: '雪夜', chapterNo: 18, chapter: '第18章', timePoint: 7, place: '临水 · 断桥', characterIds: ['c1', 'c3', 'c4'], status: 'done', summary: '宁疏影以血引雷挡下秦无涯一掌，身殒雪夜。' },
      { id: 'g6', title: '重铸听雨', chapterNo: 31, chapter: '第31章', timePoint: 9, place: '南荒 · 赤烬火山', characterIds: ['c1', 'c6'], status: 'later', summary: '借南荒地火重铸断剑，剑魂归来。' },
      { id: 'g7', title: '界门初现', chapterNo: 46, chapter: '第46章', timePoint: 11, place: '青冥界 · 界门外', characterIds: ['c1', 'c2'], status: 'later', summary: '无界海上浮出半扇石门，三洲震动。' },
      { id: 'g8', title: '三人对峙', chapterNo: 62, chapter: '第62章', timePoint: 13, place: '界门 · 门内', characterIds: ['c1', 'c2', 'c4'], status: 'later', summary: '秦无涯揭开界门之秘：门后不是仙界，是坟场。' },
      { id: 'g9', title: '斩秦无涯', chapterNo: 78, chapter: '第78章', timePoint: 15, place: '界门 · 门内', characterIds: ['c1', 'c4'], status: 'later', summary: '一剑听雨，斩尽秦氏三代执念。' },
      { id: 'g10', title: '封天坠河', chapterNo: 88, chapter: '终章', timePoint: 17, place: '无界河', characterIds: ['c1'], status: 'ending', summary: '斩断界门，以剑意封天，坠入无界河。' }
    ],
    scraps: [
      { id: 'x1', kind: 'plot', title: '血月试剑', origin: '第62章 · 卷二', reason: '改线 · 与雪夜重复', removedAt: new Date(Date.now() - 2 * 864e5).toISOString(), summary: '沈砚清于血月夜独自试剑，重伤垂死，被宁疏影所救。' },
      { id: 'x2', kind: 'plot', title: '秦无涯幼年旧事', origin: '插叙 · 卷三', reason: '改线 · 节奏拖沓', removedAt: new Date(Date.now() - 5 * 864e5).toISOString(), summary: '本想用插叙交代反派动机，后改为借听潮楼之口带过。' },
      { id: 'x3', kind: 'character', title: '江雪衣（旧人设）', origin: '人物 · 已拆分', reason: '人物拆分', removedAt: new Date(Date.now() - 12 * 864e5).toISOString(), summary: '原设定为男扮女装的皇子，后拆成江雪衣与姜雪两个人物。' },
      { id: 'x4', kind: 'ending', title: '沈砚清 · 第一版结局', origin: '结局 · 已替换', reason: '结局改写', removedAt: new Date(Date.now() - 30 * 864e5).toISOString(), summary: '最早写的是力竭而亡、剑埋临水，与全书传说感不符。' }
    ],
    chapters: [
      { id: 'v1', title: '卷一 · 雨夜入冢', status: 'done', words: 41200 },
      { id: 'v2', title: '卷二 · 问剑三峰', status: 'writing', words: 38600 },
      { id: 'v3', title: '卷三 · 界门将开', status: 'plan', words: 8200 }
    ],
    manuscripts: [
      { id: 'm1', volumeId: 'v1', title: '第一章 · 雨夜入冢', updatedAt: new Date().toISOString(),
        content: '雨下了三天。\n临水城外的官道上没有一个人，只有一盏灯在走。\n沈砚清提灯上山的时候，听见了剑鸣。\n那声音从山门里传出来，像有人在很远的地方敲了一下铁，余音散在水汽里，久久不落。\n他停下脚步，把灯往前递了递。\n山门上悬着一块旧匾，匾上两个字被雨水泡得发白——剑冢。\n“来者何人。”门里有人问，声音很轻。\n“沈砚清。”他说，“来学剑。”\n门开了一条缝，里面黑洞洞的，看不见人。' },
      { id: 'm2', volumeId: 'v1', title: '第五章 · 听雨断剑', updatedAt: new Date(Date.now() - 864e5).toISOString(),
        content: '两人在听雨楼上站了一炷香，谁也没先动手。\n云无咎先笑：“你剑上有锈。”\n“锈在心里。”沈砚清说。\n剑光起时，雨忽然停了。' },
      { id: 'm3', volumeId: 'v2', title: '第十八章 · 雪夜', updatedAt: new Date(Date.now() - 2 * 864e5).toISOString(),
        content: '雪落临水，三十六盏剑灯尽灭。\n宁疏影以血引雷，替沈砚清挡下秦无涯的一掌。\n“你若还听得见雨，就替我活下去。”' },
      { id: 'm4', volumeId: 'v2', title: '第十九章 · 断桥', updatedAt: new Date(Date.now() - 3 * 864e5).toISOString(), content: '' }
    ],
    books: [],
    settings: {
      image: { provider: '即梦 AI', url: 'https://jimeng.jianying.com/ai-tool/home', size: '768x1024',
        style: '国风写实，水墨质感，半身像，淡雅背景，丁达尔光' },
      /* 章节页右下角的 AI 写作助手 */
      ai: { mode: 'caret', ctxLimit: 4000, autoInsert: false, temperature: 0.8, maxTokens: 1400 }
    }
  };
};
