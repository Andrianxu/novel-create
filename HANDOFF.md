# 卷帙 NovelFolio · 交接说明（2026-11-22 第五轮更新）

> 这一轮加的是**撤销 / 重做**：全篇一套历史（Ctrl+Z 撤销、Ctrl+Y 或 Ctrl+Shift+Z 重做），
> 人物、世界观、情节、正文、导入都在里面；状态栏左下角也有「↶ 撤销 / ↷ 重做」两个按钮。
>
> 上一轮（第四轮）的情节时间轴暗线树状图改动仍在，见第五节。

## 〇、撤销怎么做的（本轮重点）

新增 `app/renderer/js/undo.js`，约 190 行，不依赖任何页面：

| 概念 | 说明 |
| --- | --- |
| 快照 | 整篇数据的 JSON 串（先把数据复制成纯对象，**绝不钉住活数据**，否则记录之后再改会跟着变） |
| 栈 | 撤销 / 重做各 100 步；单张快照超过 6MB 就放弃记录（防止把内存撑爆） |
| 记点 | 页面照旧只调 `NF.save()`；`app.js` 把它包成 `history.tick()` + 原保存 |
| 合并 | 只有「正在输入框里打字」才把连续的改动并成一步（600ms 内、同一处）；点按钮不合并，一下一步 |

### 为什么记的不是「改完之后」

页面几乎全是「先改数据、再 `NF.save()`」，收到信号时改动已经发生。所以历史里留一个 **baseline**
（上一次拍下的样子），每次 `NF.save()` 时把 baseline 收进栈——它就是这一步要撤回去的「改之前」。
启动时 `history.prime()` 先拍一张原始数据，于是第一笔改动也有地方可回。

### 撤销时页面怎么更新

`replaceDoc()` 换一整份新数据 → `NF.doc = d` → `NF.refresh()`。`route()` 里有一条快捷路径：
同一个页面、同一份新数据时**复用原来的 `.page` 容器**（滚到哪里还停在哪里），但会先 `unmount()`
解绑监听、`clear(root)` 清空容器再 `mount()`——这两步少一个就会叠出两份页面、监听越堆越多（踩过）。

撤销后的数据照样落盘（`markDirty()`），不然关掉软件就白撤了。

### 顺带修的两个老问题

- 章节页的 Ctrl+J 绑在 `document` 上从不解绑，换页越堆越多 → 改成记 `page._keyOff`，`unmount()` 里解掉。
- 章节页正文的撤销：连续打字按一段算一步，撤销后光标回到原处（`page._caret`，记在页面对象上，重挂不丢）。

### 想给某一步起个名字

裸调 `NF.save()` 会按调用栈里的页面文件名推断（人物 / 世界观 / 情节 / 正文…，见 `DEFAULT_LABEL`）。
更准的写法是 `NF.save(对象, '改名')`：对象按字段认出属于哪一块数据，名字直接进撤销提示的「」里。

### 本轮验证（脚本跑完已删，方法记在这里）

用 `--eval` 在真窗口里驱动真 DOM（`node _scratch/launch.js --disable-gpu --page=<页> --eval=… --ud=<临时数据目录>`）：

| 覆盖 | 结果 |
| --- | --- |
| 人物改名 → Ctrl+Z → Ctrl+Y → 再撤 | 数据与界面都回到原值；连打三次只需一次撤销 |
| 新建人物 / 世界观删一境 / 情节改标题 / 正文打字 | 每个页面都撤得回来，列表、时间轴、正文都重画正确 |
| 世界观点五次「＋ 一境」再撤五次 | 五次各自独立，五次都能单独退回（按钮不合并） |
| 章节打字后**不等**自动保存直接 Ctrl+Z | 正文回到打字之前，光标还在正文里 |
| 来回撤重各 6 次 | 输入框数量、人物数量都不变（页面没叠层），无 JS 报错 |
| 七页冒烟 + 撤销后读回数据文件 | 0 报错；撤销结果确实写进了 `novelfolio.data.json` |
| 打包后的 `dist\win-unpacked\NovelFolio.exe` 跑同一套脚本 | 7 项全通过；状态栏能看到「↶ 撤销 / ↷ 重做」 |

## 一、项目在哪、怎么跑（没变）

| 项 | 值 |
| --- | --- |
| 项目根目录 | `E:\novel` |
| 技术栈 | Electron 45.4.1；渲染层原生 ES module，主进程 CommonJS |
| 入口 | `app/main.js`、`preload.js`、`app/renderer/js/app.js`；页面 `app/renderer/js/pages/*.js` |
| 数据 | 本机 `userData/data/novelfolio.data.json` |
| 打包产物 | `dist\NovelFolio-0.1.0-portable.exe`（本轮已重新打包；`app.asar` 里的 `app.js` / `undo.js` / `chapter.js` 与源码逐字节一致） |

构建命令（必须关掉正在运行的便携版，`ELECTRON_BUILDER_CACHE` 必给、`ELECTRON_RUN_AS_NODE` 必删）：

```powershell
taskkill /F /IM NovelFolio-0.1.0-portable.exe
$env:ELECTRON_BUILDER_CACHE="$env:LOCALAPPDATA\electron-builder\Cache"
$env:CSC_IDENTITY_AUTO_DISCOVERY="false"; $env:USERNAME="Administrator"
C:\Program Files\nodejs\node.exe E:\novel\node_modules\electron-builder\cli.js --win portable
```

Git：`D:\Git\cmd\git.exe -c safe.directory=E:/novel ...`

## 二、本轮做了什么（`app/renderer/js/pages/plot.js`）

### 1. 树的形状（按用户标注图）

```
主线（树干，整行一条渐变轴）
  ●A 引出点 ──┐                        ┌── ●B 收敛点
              ╰──(曲线)─── ●首 ─────── ●末 ─(曲线)──╯
暗线行：        └──── 只在首末情节之间画一条短横线 ────┘      之外什么都没有
```

- **A（引出点）和 B（收敛点）都画在父线（主线或上层暗线）的轴上**，横坐标就是引出/收敛时间点对应的刻度；
  两轮前 B 被画在暗线行尾，这一轮改回父线轴。
- 从 A 弯一条枝下来落到这条暗线的**第一个情节**；从**最后一个情节**再弯一条枝上去接 B。
- 暗线自己那一行的横线**只画在「第一个情节 → 最后一个情节」之间**，并且再夹进 [引出点, 收敛点]，
  绝不会长到两端之外（实现：`.pl-lane.side .pl-axis{display:none}` 默认隐藏，`layoutBranches` 量到内容后用
  `left/right` 百分比显示这一段）。
- **没有情节的暗线：整行不画线**（原来会拖一条横贯整行的长横杆，就是用户红 × 的位置），也不画枝。
- 主线轴保持贯穿整行（它是树干）。

### 2. 顺带修掉的坐标 bug

| bug | 现象 | 修法 |
| --- | --- | --- |
| `measureLane` 里 `left = x0 + u*used`（x0 与 u 都是绝对位置） | 所有情节节点整体右移约一倍 | `left = u*used` |
| `sync()` 里 `left = px - 5.5`、拖动时 `left = pct*cw - 5.5` | 圆点比刻度左偏 5.5px | 节点是 0 尺寸锚点，直接写 `px` |
| `X()`/拖拽里 `+D`（缩进）又减一次 | 树枝端点比暗线内容偏移一个缩进量（34px 这类） | 缩进在行上，`track.getBoundingClientRect()` 已经包含，去掉 D |
| `viewport()` 用 `track.offsetLeft` | 轨道是行（`position:relative`）的子元素，`offsetLeft` 少了行 padding | 改成屏幕矩形相减 + `scrollLeft/Top` |
| 同刻情节被强行推开（`minStep`）、整行按 `fit` 压窄 | 圆点离开刻度、拖拽漂移 | 取消位移与压窄：圆点严格按时间点，名字放不下就隐藏（`.txt-off`，hover 有提示） |

### 3. 树枝形状

`addBranch()` 只出 `M…C`（没有 `L/H/V`）：贴着树干那头切得陡、落到枝头那头放平，像从主干上长出去的一根枝；
两端几乎同列时退化成「一朵往外鼓的树杈弧」（两段 `C/S`）。
A、B 圆点是端点手柄（`data-line` + `data-end`），两个都能在父线轴上左右拖，双击复位为「跟随情节」。

## 三、验证（脚本在 `_scratch/`，跑完请删）

启动器：`node E:\novel\_scratch\launch.js --disable-gpu --page=plot --eval=... --out=... --ud=E:\novel\_scratch\ud`
（每次跑前 `Stop-Process -Name electron`、删 `_scratch\ud`）

| 脚本 | 覆盖 | 结果 |
| --- | --- | --- |
| `v1.js` | 节点圆点压刻度、A/B 落在主线轴且横坐标=引出/收敛刻度、暗线横线=首末情节、横线不超出 A..B、无 `line/rect`、所有枝段都是曲线、空暗线不画线不画端点、拖动后/缩放后仍对齐 | **19 项全 PASS**：对齐差 0；A 447 / B 1066 与刻度完全一致；暗线横线 [566,836] = 首末情节；空暗线 `display:none`、0 个端点 |
| `n2.js` | 三级嵌套（LB 收进 LA）：LB 的 A/B 应画在 LA 轴上、两条暗线的横线各自只覆盖自己的内容 | 通过：LB 的 A/B `onLAAxis:true`，LB 横线 [722,919] = 乙一/乙二，LA 横线 [499,1106] = 甲一/甲二 |
| `r2.js` | 双击新建、单击选中、拖 A、拖 B、双击复位、滚轮缩放、列表筛选 | 全部通过（`新建情节` 弹窗、选中断剑、A 4→4.78、B 12→12.52、复位后 `forkTp` 被清空、全部/×1.1、筛选 2/12） |
| `s2.js` | 七页冒烟 + 截图 | 0 报错；`shot3.png` 里暗线行的金线只有 x 712–1037（≈325px），主线轴仍是整行 |
| 像素复核 | 对截图逐行找金色长段 | 只有 2 行是「主线轴整行」，暗线行那条只有 300 多像素（=内容段），两端外侧没有线 |
| 打包 | `app.asar` 里的 `plot.js` 与源码一致 | 见下 |

## 四、改动集中在哪

`app/renderer/js/pages/plot.js`（约 2320 行）：

| 区域 | 关键函数 | 说明 |
| --- | --- | --- |
| 坐标 | `trackContent` `pctK` `clipTp` `measureLane.viewport` | 内容宽、时间→百分比、屏幕矩形定位 |
| 节点 | `measureLane.sync` `laneRow.mItems` | 圆点严格按时间点；名字挤就隐藏 |
| 树枝 | `layoutBranches` `addBranch` `addDot` | A→首情节、末情节→B、暗线横线裁到内容段 |
| 缩进 | `layoutTreeIndent` `orderedSideLines` | 每行 padding-left 按树层级，兄弟错开 |
| 交互 | `startDrag` `startEndpointDrag` | 都按内容区像素换算 |

### 踩过的坑（新增）

- **比较坐标必须同一坐标系**：SVG 里是 canvas 内容坐标，DOM 量的是屏幕坐标；混用会得出「偏 34px」的假结论（本轮先踩了一次）。
- `track.offsetLeft` 在「轨道是 `.pl-lane` 的子元素」时不包含行的 padding-left → 一律用 `getBoundingClientRect` 相减。
- `.pl-node` 是 `width:0;height:0` 的锚点，圆点靠 `margin:-5.5px` 自居中，所以 `left` 要写锚点本身的位置，不能再减半个圆点。
- 空暗线一定要单独处理（`blocks.length === 0`）：否则会留一条 `left:0;right:0` 的整行横线。

## 五、还能继续做的事

- [ ] 时间轴导出图片 / PDF、纵向虚拟滚动（前几轮遗留）；
- [ ] 暗线很多时缩进会把轨道压得很窄，可以考虑折叠第 3 层以后的暗线；
- [ ] 收敛点如果被改到最后一个情节之前，横线会跟着缩短（现在的行为），要不要提示由产品定；
- [ ] README 的待办。

## 六、历史（前几轮，仍然有效）

1. 主线时间轴圆点串在轴线上；2. 暗线引出点/收敛点可键入、选章节、轴上取点；3. 引出/收敛以树状枝示意；
4. 时间轴不吸附，拖动松手定格；5. 情节列表筛选、点轴高亮；6. AI 构思助手；7. 章节页点情节在正文标段落；
8. 横向缩放/平移（共用刻度、滚轮缩放、`实际用到`/`全部`）；9. 暗线嵌套（`mergeInto` 指向另一条暗线、环防护）；
10. 端点圆点在父线轴上可拖（A/B 都能拖，双击复位）。