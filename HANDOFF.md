# 卷帙 NovelFolio · 交接说明（2026-11-22）

> 这是一个可以先放着不管的交接备忘：新窗口接上以后，照着往下做就行。

## 一、项目在哪、怎么跑

| 项 | 值 |
| --- | --- |
| 项目根目录 | `E:\novel` |
| 技术栈 | Electron 45.4.1；渲染层是**原生 ES module**（无打包器、无框架），主进程是 `'use strict'` 的 CommonJS |
| 入口 | `app/main.js`（主进程 / IPC）、`preload.js`（contextBridge → `window.nf.*`）、`app/renderer/js/app.js`（`NF` 对象、路由） |
| 页面 | `app/renderer/js/pages/{characters,world,plot,chapter,book,importer,settings}.js` |
| 人的界面 | `app/renderer/index.html` + `app/renderer/css/` |
| 数据 | 本机 `userData/data/novelfolio.data.json`（`doc` 对象），设置单独存 |
| 打包产物 | `dist\NovelFolio-0.1.0-portable.exe`（单文件便携版） |

### 构建（约 3.5 分钟）

```powershell
# 必须先关掉正在运行的便携版，否则 EBUSY
taskkill /F /IM NovelFolio-0.1.0-portable.exe

# 注意：一定要给 ELECTRON_BUILDER_CACHE，否则默认缓存目录 C:\Users\Administrator
# 会 EPERM: operation not permitted, mkdir
$env:ELECTRON_BUILDER_CACHE="E:\novel\_scratch\ebcache"
$env:CSC_IDENTITY_AUTO_DISCOVERY="false"
$env:USERNAME="Administrator"
C:\Program Files\nodejs\node.exe E:\novel\node_modules\electron-builder\cli.js --win portable
```

### Git

`D:\Git\cmd\git.exe -c safe.directory=E:/novel -c user.name=Andrianxu -c user.email=2686445597@qq.com`

## 二、已完成（都已提交、都跑过真实鼠标/键盘事件验证、都已打进 exe）

最近四个提交：

```
a40afbc 情节页：圆点串在轴线上、暗线改为引出点/收敛点两端（可键入时间点、选章节、轴上取点）
4977523 情节页：时间轴按刻度定位、拖拽松手定格、暗线树状分叉收敛、列表线筛选、AI 构思
84c6c36 时间轴改为纯排先后，新增暗线时间线并可收敛回主线
6511e95 拖动情节只改被拖的那一条，其它情节不动
```

需求逐条对照：

1. **主线时间轴要能把圆点串起来** —— 已改：轴线 `.pl-axis` 与每个 `.pl-node` 的圆点都垂直居中在轨道 `top:50%`，实测 10 个圆点圆心与轴线中心偏差 `0.40px`（判定阈值 2px）。轴线横跨第一个到最后一个圆点。
2. **暗线要有「引出点」和「收敛点」** —— 已改：`plotLines[]` 上新增 `forkTp / forkChapter / mergeTp / mergeChapter`，新建（`addLane`）和修改（`editLane`，轨道右侧「引出/收敛」按钮）表单都是两栏端点：
   - 每栏一个**数字框**（键入时间点）、一个**章节下拉**（选项来自「章节写作」的稿件）、一个「**轴上取点**」按钮；
   - 点「轴上取点」→ 卡片顶部出现提示条 `.pl-pickhint`、主线轨道加 `.picking` 类 → 在**主线上点一下**就把该处的时间点填进去（Esc 取消）；
   - 保存前校验「引出点不能晚于收敛点」。
3. **引出点以树状图引出、收敛点以树状图合并回主线** —— 已改：`drawBranches()` 在 `.pl-canvas` 里的 SVG 上画
   - `path.pl-br.fork`：从主线上引出点的圆点（`circle.pl-brdot.fork`）弯下去接暗线起点；
   - `path.pl-br.merge`：从暗线末端弯上来接主线上收敛点的实心圆点（`.pl-brdot.merge`）；
   - 没设收敛点时画虚线 `.pl-br.pending` 示意；
   - 暗线起始/结束情节与端点不在同一时间点时，用 `line.pl-brstem.side` 横杆接上；
   - 名牌徽标显示 `引出点→收敛点`（如 `4→12`）。
4. **时间轴不能吸附** —— 拖动时节点严格跟手，松手按落点定格（`round2`），只改被拖的那一条；其它节点在拖动过程中被强制还回原位。
5. **情节列表**：左上角下拉 `#plot-lane-filter` 可在「全部 / 主线 / 某条暗线」间筛选；时间轴上点情节，列表会滚到那一行并加 `.flash` 高亮；筛选不到时自动切回「全部」。
6. **右下角 AI 情节构思**：和章节页同一套挂件（`.pl-ai`，`Ctrl/⌘ + J` 开合）。
7. **章节页**：点情节直接在正文里标出对应段落（`.ch-ed-hl mark`），章节字段是下拉框。

### 本轮验证结果（现在想复现可以重写脚本，原来的临时脚本已删）

| 脚本内容 | 结果 |
| --- | --- |
| 圆点/轴线对齐（t1） | 通过，最大偏差 0.40px |
| 建暗线：两栏端点、轴取点、保存、树枝、徽标（t2） | 通过，`forkTp=6.79 / mergeTp=15 / mergeChapter=第五章`，`path.fork`×1 `path.merge`×1，徽标 `6.79→15` |
| 端点几何（t3） | 通过，引出/收敛圆点横坐标与主线上对应时间点误差 < 1px、都在轴线上 |
| 暗线全生命周期：建→加情节→改端点→删（t4） | 通过，改端点后徽标变 `4→12`，删除后情节 `lane` 复位置空（回主线） |
| 拖拽（按住圆点 / 按住文字标签） | 通过，1 → 3.26 / 3.46，其它节点不动，松手后仍在轴线上 |
| 单击情节 | 通过，只选中、不改时间点 |
| 双击空白新建 | 通过，表单预填落点时间点 12.75 |
| AI 面板开合、暗线筛选、点轴定位（t10） | 通过 |
| 空暗线渲染（t12） | 通过，画出 fork/merge 两条树枝 + 提示「双击这条暗线可以往里加情节」 |
| 七个页面冒烟 | 通过，0 报错（`book`/`importer` 的空状态提示是正常的） |
| 打包产物 | `dist\NovelFolio-0.1.0-portable.exe` 105.4MB，00:11；已从 `app.asar` 抽出 `plot.js` 核对新代码都在；`win-unpacked\NovelFolio.exe` 启动正常并写出了 `data/novelfolio.data.json` |

## 三、改动集中在哪

`app/renderer/js/pages/plot.js`（单文件，约 1600 行）：

| 区域 | 关键函数 / 类 | 说明 |
| --- | --- | --- |
| 时间轴数学 | `laneMax` `laneTicks` `tpPct` `pctTp` `laneSpots` | `SPAN_LO=3`、`SPAN_HI=97`；同一刻度叠多个情节时按 `MIN_GAP_PCT=1.8` 错开 |
| 端点工具 | `hasMerge` `forkTpOf` `mergeTpOf` | 缺省值兜底：没填引出点用暗线第一个情节，没填收敛点用最后一个 |
| 渲染 | `renderTimeline` `laneRow` `drawBranches` `addBranch` `addStem` `addDot` | 主线一行 + 每条暗线一行；SVG 在 `requestAnimationFrame` 里按真实坐标画 |
| 拖拽 | `startDrag` | 不吸附、松手定格、只改一条 |
| 暗线管理 | `chapterSelect` `pickOnMain` `endpointField` `addLane` `editLane` `removeLane` | 本轮新写 |
| 情节表单 | `openForm` | 时间点 / 章节 / 时间线三个字段，预填落点 |
| 列表 | `renderList` `select` `scrollListTo` | 线筛选 + 定位高亮 |
| AI | `buildPlotAi` `askPlot` `renderAiLog` `PLOT_AI_PROMPT` | 和章节页同构 |

**踩过的坑（别再踩）**：

- `tlCard` **不能缓存节点**：`NF.refresh()` 会重建整个页面 DOM，旧节点是野节点，往里 append 等于白画（表现为「时间轴只剩标题」）。现在用 `const tlCard = () => document.querySelector('.pl-tl')` 现找。
- 改了页面骨架时记得给 `tlCardEl` 声明 `let`，漏了就是 `tlCardEl is not defined`，页面整块白掉。
- `h()` 会把 `style` 对象 `Object.assign` 到 `el.style`，所以属性名要写驼峰（`overflowY`），写 `overflow-y` 会被静默丢掉。
- 暗线多了会撑爆页面：`.pl-canvas` 现在加了 `maxHeight: calc(100vh - 340px); overflowY: auto`。
- 合成鼠标事件的 `MouseEvent` 常常带 `clientX:0`，拖拽里用 `Number(ev.clientX) || 兜底` 处理，否则 e2e 里会「拖不动」。

## 四、怎么验证（验证脚本模板）

图形界面没有可用的截图通道，所以一直是「跑 Electron + eval 脚本 + 读 JSON」：

```powershell
E:\novel\node_modules\electron\dist\electron.exe E:\novel ^
  --disable-gpu --page=plot --eval=E:\novel\_scratch\t.js ^
  --out=E:\novel\_scratch\t.json --shot=E:\novel\_scratch\t.png --ud=E:\novel\_scratch\ud
```

脚本内容会被包成 `(async()=>{ ... })()`，所以**要自己定义 `sleep`、用 `return` 返回结果**。
启动后大约要等 **1.2 秒** `window.NF` 才可用；脚本开头先 `await sleep(1500)`。

常用断言抓手：

```js
document.querySelectorAll('.pl-track[data-lane="main"] .pl-node')  // 主线节点
document.querySelector('.pl-branches')                               // 树枝 SVG
svg.querySelectorAll('path.fork / path.merge / line.pl-brstem')
document.querySelectorAll('.pl-lane.side .pl-merge')[0].textContent  // 徽标 "4→12"
document.querySelector('#plot-lane-filter')                          // 列表筛选
document.querySelector('.pl-ep')                                      // 端点控件（每个含 label + input[type=number] + select + 「轴上取点」按钮）
NF.doc.plotLines / NF.doc.plots                                      // 数据真相
```

> 注意：`_scratch/` 是 gitignore 的，验证完要删干净；如果出现 `E:\novel\%SystemDrive%` 目录，用 node 的 `fs.rm` 删（PowerShell 的 `Remove-Item` 会被拒绝）。

## 五、还能继续做的事（没做的）

- [ ] 时间轴目前**没有横向缩放/滚动**，时间点跨度很大时会挤在一起（只做了同刻度错开）；
- [ ] 暗线还没做「再嵌套一层暗线」（分支套分支），`mergeInto` 字段已经在数据里，但画法只支持一层；
- [ ] 引出点/收敛点还没有在时间轴上直接拖拽改（目前只能改表单或轴取点）；
- [ ] 情节时间轴导出成图片 / PDF；
- [ ] README 里「待办」一节的其他项。
