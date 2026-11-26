# 卷帙 NovelFolio 介绍演示 · 设计方案

## 需求对齐（Step 1）
- **主题**：卷帙 NovelFolio 桌面小说写作软件的功能与卖点介绍
- **目标**：让没用过的人快速看懂"这是什么、能做什么、为什么值得用"，可一键自动播放当宣传片
- **受众**：潜在用户（网文 / 长篇小说作者）
- **页数**：11 页（封面 1 + 功能全景 1 + 界面功能 6 + 卖点 1 + 结尾 1，其中设置页含双图）
- **特殊要求**：一键自动全程播放（页内元素 afterPrevious 自动连播 + 页间 advTm 自动换页）；国风"纸间书桌"调性，贴合软件本身视觉

## 全局视觉约定

### ① 画布与安全区
- 画布 1280×720；padding 上下 60 / 左右 60；内容区 1160×600
- 页脚带 y=670–700（页脚顶边距底 50px，字号 14）

### ② 配色（取自通用配色 9「新中式朱墨」，贴合软件暖纸底+墨字+印章红）
| 槽位 | Hex | 用途 |
| --- | --- | --- |
| 主色 | `#9B2C2C` | 朱红：编号、强调条、印章、主标题点睛 |
| 辅色 | `#C9A961` | 金：细线、卡边、次级装饰 |
| 强调色 | `#1A1A1A` | 墨：巨型数字、核心结论字 |
| 底色 | `#FDFBF7` | 宣纸白：主背景 |
| 正文色 | `#2D2D2D` | 主文字 |
| 浅底 | `#F4EEE2` | 卡片浅底、浅色分区 |

- 面积：底色主导；朱红 ≤10%（仅点睛）；金 ≤15%
- Supporting 页朱红克制（≤5%）；Hero 页朱红可到 15%
- 禁用阴影；层次靠底色 + 1px 线 + 留白

### ③ 字体系统
- 中文标题：**楷体（KaiTi / STKaiti）** —— 尊重软件本身的楷体调性
- 中文正文：**微软雅黑（Microsoft YaHei）**
- 字号阶梯：封面主标 84 / Hero 大字 56–64 / 页面主标 36 / 卡片小标 24 / 正文 19–20 / 注释·页码 14
- 全篇只用这两族；数字跟随文本字体；一页样式组合 ≤4

### ④ 视觉母题（贯穿全篇）
- **标题下 1px 贯通金线**（内容页标题固定在 y=60，线紧随标题底线）—— 全篇复用
- **右上角朱印方角标**：36×36 圆角小方块，朱红底白字"卷帙"，位置全篇固定（x=1160-36, y=40）
- 内容页页脚：`卷帙 NovelFolio · 0X` 固定左对齐 y=670

### ⑤ 配图清单（全部为用户提供的真实界面截图，material，复制到 assets/ 并重命名）
| 文件 | 等级 | 来源 | 真实内容 | 使用页 |
| --- | --- | --- | --- | --- |
| `assets/cover.png`(chapter.png 副本) | L1 | material | 章节写作界面 | P1 封面主视觉 |
| `assets/characters.png` | L2 | material | 人物档案界面 | P3 |
| `assets/world.png` | L2 | material | 世界观舆图界面 | P4 |
| `assets/plot.png` | L1 | material | 情节时间轴界面 | P5 |
| `assets/chapter.png` | L2 | material | 章节写作界面 | P6 |
| `assets/book.png` | L2 | material | 拆书界面 | P7 |
| `assets/importer.png` | L2 | material | 导入导出界面 | P8 |
| `assets/settings1.png` | L2 | material | 设置（模型与本地数据） | P9 |
| `assets/settings2.png` | L2 | material | 设置（同步与 AI 审阅） | P9 |

- 截图统一尺寸 1917×1078（16:9 稍宽），展示时保持比例、加 1px 金色描边 + 8px 圆角，落在浅底卡上
- 全篇图片为真实软件截图，风格一致

## 逐页设计

### P1 封面（cover / hero / peak）
- **版式**：大字报式 + 右侧主视觉截图（非对称，左 55% 文字 / 右 45% 图）
- 主标题「卷帙」超大（84px 楷体，墨色）+ 英文 NOVELFOLIO 小字；副标「为长篇写作准备的一张书桌」；一行说明「人物 · 世界观 · 情节 · 章节，都收在一处」
- 视觉：右侧 `cover.png` 主视觉，金色描边；左下角朱印"卷帙"
- **anti_pattern**：禁止数据看板；禁止页脚；禁止居中对称
- 动画：主标 flyIn → 副标 fadeIn(afterPrevious) → 说明 fadeIn(afterPrevious) → 图 zoom(afterPrevious)

### P2 功能全景（content / supporting / valley）
- **版式**：中心辐射结构图（SVG）——中心"卷帙"，六模块环绕；非对称文字列
- 标题「六个模块，把一本长篇小说安顿好」+ 贯通金线
- 中心圆 + 六节点：人物 / 世界观 / 情节 / 章节写作 / 拆书 / 导入导出，每节点一句短说明
- 右侧竖排列出"为长篇而生的三件事"：记得住人设 / 理得清线索 / 写得完篇章
- **anti_pattern**：禁止等宽六卡网格；禁止用截图
- 动画：中心 zoom → 六节点依次 flyIn(afterPrevious)

### P3 人物（content / supporting / valley）
- **版式**：左图右文 6:4（非对称）
- 标题「人物：每个角色都有据可查」
- 左：`characters.png`；右：三个要点（立绘+人设字段 / 三态情节时间轴 / 废案篓可回收）+ 底部结论条「人设变了，AI 帮你记着」
- **anti_pattern**：禁止 50:50 等分
- 动画：图 fadeIn → 要点逐条 fadeIn(afterPrevious)

### P4 世界观（content / supporting / valley）
- **版式**：右图左文镜像（与 P3 版式不同）
- 标题「世界观：一张能拖动的舆图」
- 左：要点（多位面 / 可拖动宗门节点 / 修为体系）+ 结论条「设定不再散落在草稿里」；右：`world.png`
- **anti_pattern**：禁止复刻 P3 的左图右文
- 动画：图 zoom → 要点 flyIn(afterPrevious)

### P5 情节（content / hero / peak）
- **版式**：上图下文（大图占 55% 高）+ 大字结论
- 标题「情节：主线与暗线，都在一条轴上」
- 上：`plot.png` 大图铺开；下：巨型短句「时间轴 + 树状暗线」，一行说明「滚轮缩放、拖动端点、悬停看摘要」
- **anti_pattern**：禁止等宽卡片；禁止把大图缩成小图
- 动画：大图 zoom → 大字 flyIn(afterPrevious) → 说明 fadeIn(afterPrevious)

### P6 章节写作与 AI 审阅（content / supporting / valley）
- **版式**：左图右文 + 强调卡（与 P3 区分：右侧加朱红强调条）
- 标题「章节写作：写完这章，下一章自动帮你校对」
- 左：`chapter.png`；右：要点（卷·篇目录 / 楷体编辑器·自动保存 / AI 续写）；朱红强调卡「新建下一章后自动 AI 审阅人设，变化超阈值才征求你同意」
- **anti_pattern**：禁止把强调卡做成等宽卡片之一
- 动画：图 fadeIn → 强调卡 zoom(afterPrevious) → 要点 fadeIn(afterPrevious)

### P7 拆书（content / supporting / valley）
- **版式**：右图左文（与 P4 镜像区分：改为左窄标题色块 + 右内容）——采用左标题色块版式
- 左窄栏（朱红浅底）：章节号感的大字「拆书」+ 一句「把整本书变成你的素材」；右宽栏：`book.png` + 三步流程文字条（导入→自动分章→抽人物情节入库）
- **anti_pattern**：禁止裸表格；禁止等分
- 动画：色块 flyIn → 图 fadeIn(afterPrevious) → 流程条依次 fadeIn(afterPrevious)

### P8 导入导出（content / supporting / valley）
- **版式**：左图右文 + 三栏非等分小卡（与 P3/P6 区分：图占 50%，右侧 3 个错落小卡）
- 标题「导入导出：你的稿子，随时能带走」
- 左：`importer.png`；右：三卡（CSV/Excel/docx 三步导入向导 / TXT·MD·Word·JSON 导出 / JSON 整库备份），底部结论条「格式不锁死，数据在你手里」
- **anti_pattern**：禁止等宽三卡横排
- 动画：图 fadeIn → 三卡依次 flyIn(afterPrevious)

### P9 设置与数据（content / supporting / valley）
- **版式**：上图下文（两张截图并排非等宽 6:4）+ 下方要点带
- 标题「设置：AI 由你掌控，数据留在本地」
- 上：`settings1.png`(60%) + `settings2.png`(40%) 并排，均可点击放大感描边；下：一行要点（自带模型 API Key / Key 不回传不写日志 / WebDAV 同步 / AI 人设审阅开关与阈值）
- **anti_pattern**：禁止两图等宽
- 动画：两图 fadeIn(withPrevious) → 要点带 fadeIn(afterPrevious)

### P10 三大理由（content / hero / peak）
- **版式**：非等宽三栏 + 巨型数字锚点（5:3:3，视觉强）
- 标题「为什么是卷帙」
- 三栏：①「本地优先」数据在你自己的机器；②「AI 加持」续写、拆书、人设审阅都听你的；③「为长篇设计」人物/线索/章节互不散落。每栏一个巨型序号 01/02/03（墨色 72px）
- **anti_pattern**：禁止等宽三卡；禁止形容词堆砌标题
- 动画：三栏依次 flyIn(afterPrevious)，序号先 zoom

### P11 结尾（ending / hero / peak → 克制收尾）
- **版式**：收束金句 + 落款（居中大字，留白）
- 巨型金句「把故事，写进你自己的世界」（楷体大字）；下方一行「卷帙 NovelFolio · 免费开源」；GitHub 地址小字
- 朱印"卷帙"居中压轴；无页脚
- **anti_pattern**：禁止只写"谢谢"；禁止堆功能
- 动画：金句 fadeIn → 落款 fadeIn(afterPrevious) → 朱印 zoom(afterPrevious)

## 自动播放方案
- 页内：所有元素 `startType='afterPrevious'` 自动连播（首元素 click 或 afterPrevious）
- 页间：生成 pptx 后，脚本注入每页 `<p:transition advTm="N" advClick="0"/>`，N 按该页动画时长留足（约 8–12s），实现按 F5 后全自动连续播放
- 全篇动画类型统一以 fadeIn / flyIn / zoom 为主，不混用花哨效果

## 完成检查
- [ ] 无均分构图；非对称版式 ≥40%
- [ ] Hero 页 P1/P5/P10，不相邻
- [ ] 每页有视觉锚点；标题位置稳定；页脚稳定
- [ ] 字号、padding、安全区合规；无文本重叠/溢出
- [ ] 8 张截图风格统一、比例正确
- [ ] 自动播放注入成功
