# 卷帙 NovelFolio · 交接说明（2026-11-22 第二轮更新）

> 这是一个可以先放着不管的交接备忘：新窗口接上以后，照着往下做就行。
> 上一轮（时间轴圆点串轴、暗线引出/收敛点、轴取点）见文末「历史」一节；本轮做的是它「还能继续做的事」里的前三项。

## 一、项目在哪、怎么跑

| 项 | 值 |
| --- | --- |
| 项目根目录 | `E:\novel` |
| 技术栈 | Electron 45.4.1；渲染层是**原生 ES module**（无打包器、无框架），主进程是 `'use strict'` 的 CommonJS |
| 入口 | `app/main.js`（主进程 / IPC）、`preload.js`（contextBridge → `window.nf.*`）、`app/renderer/js/app.js`（`NF` 对象、路由） |
| 页面 | `app/renderer/js/pages/{characters,world,plot,chapter,book,importer,settings}.js` |
| 人的界面 | `app/renderer/index.html` + `app/renderer/css/` |
| 数据 | 本机 `userData/data/novelfolio.data.json`（`doc` 对象），设置单独存 |
| 打包产物 | `dist\NovelFolio-0.1.0-portable.exe`（单文件便携版，105.4MB，2026-11-22 00:59 重新打包） |

### 构建（约 3.5 分钟）

```powershell
# 必须先关掉正在运行的便携版，否则 EBUSY
taskkill /F /IM NovelFolio-0.1.0-portable.exe

# ⚠ 两个坑都要避开：
#  1) 一定要给 ELECTRON_BUILDER_CACHE，否则默认缓存目录 C:\Users\Administrator 会 EPERM
#  2) 缓存目录要指向「已经填好的」那个，指到空目录会去网上下 7zip，
#     然后因为网络抖动 read ECONNRESET 直接失败（本轮就撞上了）
$env:ELECTRON_BUILDER_CACHE="$env:LOCALAPPDATA\electron-builder\Cache"   # 已含 7zip@1.0.0 / nsis-3.0.4.1
$env:CSC_IDENTITY_AUTO_DISCOVERY="false"
$env:USERNAME="Administrator"
C:\Program Files\nodejs\node.exe E:\novel\node_modules\electron-builder\cli.js --win portable
```

> 如果 `$LOCALAPPDATA\electron-builder\Cache` 里没有 `7zip@1.0.0\*\bin\7za.exe`，就先联网跑一次让它下载；本机现在已经有，用这个路径不用联网。

### Git

`D:\Git\cmd\git.exe -c safe.directory=E:/novel -c user.name=Andrianxu -c user.email=2686445597@qq.com`

## 二、本轮做了什么（三条「还能继续做的事」全做完）

### A. 时间轴横向缩放 / 平移

- 所有线**共用一套刻度**（视口 `zoomState = { a, b }`），缩放只是把这段刻度放大铺满轨道，**不改任何时间点**；
- 工具条 `.pl-zoombar`（`[data-probe=plot-zoom]`）：`−` `＋` 缩放、比例文字 `.pl-zpct`（`全部` / `×2.6`，`title` 里写着「当前显示 0 – 17.5」）、`◀` `▶` 平移、`实际用到`、`全部`；
- **滚轮缩放**（以鼠标所在处为锚点）、**Shift + 滚轮平移**；`wheel` 监听挂在 `.pl-canvas` 上且 `{ passive: false }`（轨道每次重画，挂外层不用反复解绑）；
- 视口外的情节加 `.out` 收起；轴两端出现 `‹` `›` 提示；整条线在视口内一个情节都没有时显示「这一屏没有情节（点「全部」或缩小看看）」；
- 刻度步长随视口自动选 `1/2/5 × 10^n`，放得很大时一格是 0.2 甚至更细；
- 拖动节点时**视口在 mousedown 那一刻冻结**（`vA/vB`），否则时间点一变整条轴重缩放，节点会漂；
- **`实际用到`**：只收两端（`usedRange()`），中间空档一律保留；「使用范围本身 ≥ 全轴 70%」时就是全轴（按钮会给 toast「已经铺满整条轴」）；
- 全轴的终点 `axisMax()` = 最大时间点 + 最多 0.5（按 0.5 向上取整），不再无限撑尾。

### B. 暗线嵌套（分支套分支，任意层）

- `plotLines[i].mergeInto` 现在真的能指向**另一条暗线**（原来 UI 里有下拉，但 `drawBranches` 只认主线）；
- `mergeTarget(l)`：解析父线，**找不到 / 指向自己 / 成环 → 自动退回主线**（`isAncestor()` 挡环）；
- `orderedSideLines()`：按父线做 DFS 排序（父在子前），缩进 `depthIn()`，同一层按数据顺序；
- `laneRow()`：按层往右缩进 14px、名牌宽度自适应、前面加 `└` 肘形符号、title 写「第 N 层暗线 · 收敛进「X」」；
- `drawBranches()`：对每条暗线找**它自己的父线**当基准（`geo(parent)` / `geo(l)`），端点圆点画在父线轴上，所以 A→B→C 三级也能连对；
- `editLane()` 的「收敛回哪条线」下拉**排除自己和自己的子孙**（防止绕环），其余显示成 `└ 第 N 层 · 名字`；
- `removeLane()`：删除时里面的情节移到**父线**（不再是写死的主线），它下面的子线**往上挂一层**（`x.mergeInto = l.mergeInto`），不会再出现孤儿。

### C. 引出点 / 收敛点在轴上直接拖

- SVG 树是 `pointer-events: none`，只给端点圆点开命中（`.pl-brdot[data-line]`，半径 5.6px ≈ 11×11 命中区，`cursor: ew-resize`，hover 放大到 r=7）；
- `wireEndpointDots(svg)` 用 pointerdown 委托 → `startEndpointDrag(ev, lineId, kind)`，挂在 svg 上只挂一次（`svg.__epWired`）；
- 拖动时轴上方浮出 `.pl-ephint`「引出点 6.8 / 收敛点 12」，**松手才落库**（`touch()`）；
- 越界会被卡住并 toast 提示（引出点不能晚于收敛点，反之亦然）；
- **单击端点圆点** = 打开这条暗线的端点设置（`editLane`）；**双击** = 改回跟随情节（`delete forkTp/mergeTp`）。

## 三、验证（本轮脚本都在 `_scratch/`，跑完要删）

### ⚠ 先说怎么跑起来（比上一轮多两个坑）

1. **这台机器的 shell 里 `ELECTRON_RUN_AS_NODE=1`**：直接跑 `electron.exe` 会退化成纯 Node，报 `app.setPath` / `app.whenReady` undefined。启动器里必须 `delete env.ELECTRON_RUN_AS_NODE`。
2. **不要用 `cmd /c ... > file 2>&1` 之类重定向**：Electron 的 stdout 接管道会整段憋住不输出，表现为「进程不退、日志全空」。用 Node 的 `spawn(..., { stdio: 'inherit' })`。
3. DSH 的 workspace-write 沙箱下 Electron 起不来（mojo `platform_channel.cc` `0x5` access denied）；本会话已切到 danger-full-access。
4. `--eval` 的脚本里**没有 `sleep`**，要自己定义；`Set-Content` 默认会写 BOM（Node 读 BOM 会生成 `\uFEFFawait`，报 `Invalid or unexpected token`）。

`_scratch\launch.js` 已经有现成的启动器（已处理 1、2）：

```powershell
node E:\novel\_scratch\launch.js --disable-gpu --page=plot --eval=E:\novel\_scratch\t1.js `
  --out=E:\novel\_scratch\t1.json --ud=E:\novel\_scratch\ud
```

> 每次跑之前 `Stop-Process -Name electron` 并删掉 `_scratch\ud`，否则上一次的数据会串进来。
> `_scratch/run-tests.ps1` 是一次跑全部用例的批处理。

### 本轮结果

| 脚本 | 覆盖 | 结果 |
| --- | --- | --- |
| `t0` | 圆点/轴线对齐、单击选中、双击新建、拖节点、列表筛选、AI 开关、废案抽屉、七页冒烟 | 全部通过，对齐偏差 **0.00px**；拖「雪夜」→ `7.83`，其它节点不动，拖完仍在轴线上（0.00px）；七页 0 报错 |
| `t1` | 缩放工具条、滚轮放大/缩小、Shift 滚轮平移、`◀`、`实际用到`→`全部` 复位、缩放后拖节点 | 全部通过：×2.6 时视口 `5.33–12.17`、10 个节点收成 3 个、两端 `‹›` 出现；缩放后拖动得到 `7.22`（小数精度）；`全部` 复位后位置与初始完全一致；时间点数组未被改动 |
| `t2` | 走真实按钮建暗线、设「收敛进另一条暗线」 | 通过，`mergeInto` 正确指向暗线 A |
| `t3` | 端点手柄拖拽、越界卡住、双击复位、稀疏时间轴上 `实际用到` | 通过：引出点 112 → 拖到 115 被收敛点挡住、徽标 `115→115`、树枝起点 x 与圆点 cx 一致；双击收敛点后 `mergeTp` 被清空、徽标变 `115→?`；`实际用到` 把 `0–117.5` 收成 `99.72–117.5`（×6.6） |
| `t4` | `实际用到` / `全部` 往返 | 通过：`0–1117.5` → `1099.72–1117.5` → 回 `0–1117.5`；真数据下无空白时给「已经铺满」提示 |
| `t5` | **三级嵌套** 主线→A→B→C、环防护、数据里手写环、删中间层 | 通过：行序 `主线 > A > B > C`、缩进 `0/14/28`；B 的两端都落在 A 的 y 上、C 的都落在 B 的 y 上（±1px）；A 的下拉里不含 B/C；手写环不崩（退回主线）；删 B 后 C 自动挂到 A、B 里的情节移到 A |
| `t6` | 全 UI 路径：建 A/B/C 线、看下拉层级、两种取点、保存 | 通过，`console.error` 为空 |
| 打包 | `app.asar` 里 `plot.js` 与源码**逐字节一致**（108257 bytes、0 个 CRLF，8 个新符号全在） | 通过 |
| 产物 | `win-unpacked\NovelFolio.exe` 与 `NovelFolio-0.1.0-portable.exe` 各跑一次冒烟 | 均 exit 0、0 报错；缩放条 `−|＋|◀|▶|实际用到|全部` 在、三级嵌套行 `主线 > 冒烟暗线 > 冒烟子线` 在、2 fork + 2 merge、4 个端点手柄、数据文件已写出 |

## 四、改动集中在哪（`app/renderer/js/pages/plot.js`，约 2017 行）

| 区域 | 关键函数 | 说明 |
| --- | --- | --- |
| 视口（新） | `axisMax` `usedRange` `viewSpan` `clampView` `initViewIfNeeded` `setView` | `zoomState={a,b}`；`b===Infinity` 表示「全轴」 |
| 缩放动作（新） | `zoomBy` `zoomFit` `zoomUsed` `panBy` `onWheel` `zoomBar` | 工具条 + 滚轮 |
| 坐标换算 | `pctK` `pctTp` `tpPct` `laneTicks` `laneSpots` `inView` | 全部改成走视口；`pctTp` 不再吸附整数 |
| 嵌套（新） | `mergeTarget` `depthOf` `isAncestor` `orderedSideLines` `depthIn` | 父线解析、DFS 排序、缩进、环防护 |
| 端点拖拽（新） | `wireEndpointDots` `startEndpointDrag` `resetEndpoint` `showEpHint` `addDot(…, lineId, kind)` | SVG 指针委托 + 实时读数 |
| 渲染 | `renderTimeline` `laneRow` `drawBranches` `addBranch` `addStem` | 树枝按父线画 |
| 拖节点 | `startDrag` | 用 mousedown 时刻冻结的 `vA/vB` 换算 |
| 暗线管理 | `chapterSelect` `pickOnMain` `endpointField` `addLane` `editLane` `removeLane` | 删线改为移到父线、子线上移 |

### 踩过的坑（别再踩）

- 上一轮那几条仍然有效：`tlCard` **不能缓存节点**、`h()` 的 style 要写驼峰、`.pl-canvas` 的 `maxHeight`、合成 MouseEvent 的 `clientX:0`。
- **`clampView()` 只用于「以锚点缩放」，不能拿来夹 `实际用到` 的结果**：窗口比轴长时它会把窗口撑成整条轴，`实际用到` 永远等于 `全部`（这个坑本轮踩了很久）。
- **判断「有没有可省的空白」要用「使用范围 vs 全轴」比较**，不要用「左右留白加起来」：留白是按比例算的，数据越远留白看起来越小，结果是阈值永远过不了。
- 调试时**给 A 赋值不代表 A 会执行**：本轮有两次把 `console.log` 塞进了早已被换掉的代码分支，看到「没有日志」就误判成「函数没跑」，白绕很多圈。加日志要加在**当前真正的那行**上。
- 用 PowerShell 批量改 JS 时要小心 `String.Replace` 匹配不到（CRLF/缩进差异）——本轮就出现过一次「替换成功但只替换了半截」，留下语法错误。改完一定查 `braces` 平衡和 `console.log` 残留。

## 五、还能继续做的事

- [ ] 情节时间轴**导出成图片 / PDF**（`webContents.capturePage` 已有现成工具）；
- [ ] 时间轴**纵向**也挤（暗线多了要滚动），可以做成列表式虚拟滚动；
- [ ] 端点拖拽目前只支持水平（时间点），配合缩放已经够用；
- [ ] README 里「待办」一节的其他项。

## 六、历史（上一轮已完成，仍然有效）

1. 主线时间轴把圆点串在轴线上（圆心与轴线偏差实测 0.40px）；
2. 暗线有「引出点」「收敛点」，可键入时间点、选章节、轴上取点，保存前校验引出点 ≤ 收敛点；
3. 引出点/收敛点以树状枝引出与收敛，未设收敛点时用虚线示意；
4. 时间轴不吸附，拖动松手定格、只改被拖的那一条；
5. 情节列表可按线筛选，点轴上情节列表跟随滚动高亮；
6. 右下角 AI 情节构思助手；7. 章节页点情节在正文里标出对应段落。
