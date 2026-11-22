# 卷帙 NovelFolio · 交接说明（2026-11-22 第六轮更新）

> 这一轮加的是**书库：自定义创建书籍 + 自主切换书籍**。每本书的数据各存一份文件，
> 但书里的"大框架"完全不变（人物 · 世界观 · 情节 · 卷 · 正文 · 拆书），页面代码一行都没动。
> 入口在左上角书名：点一下是书库，可以新建 / 切换 / 改名 / 复制 / 删除。
>
> 上一轮（第五轮）的撤销 / 重做（Ctrl+Z / Ctrl+Y）仍在，见第七节摘要；
> 第四轮的情节时间轴暗线树状图改动见第五节。

## 〇、书库怎么做的（本轮重点）

### 1. 数据长什么样

```
%APPDATA%\novelfolio\data\
├─ library.json            书库登记表：有哪几本书、现在打开的是哪一本
├─ books\
│  ├─ bkxxxx.json          一本书的全部数据（结构与老版本完全一样）
│  ├─ bkxxxx.json.bak-*    每次覆盖前的上一版（每本留 5 份）
│  └─ bkxxxx.txt           拆书导入的原文副本
├─ portraits\<书号>\       立绘按书分目录（老图仍在 portraits\ 根上，地址不变）
├─ maps\<书号>\            地图底图同理
├─ trash\                  删掉的书文件挪到这里（不直接删）
├─ backups\                全局备份，文件名带书号，恢复时按书号写回
└─ novelfolio.data.json    老版本的单文件数据：**只读入一次，不动它**
```

- **每本书的 JSON 结构和以前一模一样**（`version / meta / characters / planes / plots / scraps /
  chapters / manuscripts / books / settings`），所以 characters / world / plot / chapter / book /
  importer 六个页面**一行都没改**，它们只认 `NF.doc`。
- **老用户无损升级**：第一次启动时，书库里没有登记表，就把 `novelfolio.data.json` 原样复制成
  "默认书籍"（书名、作者、内容全部沿用），老文件留在原地不删。万一哪里不对，删掉 `library.json`
  就回到单文件时代。全新安装则建一本和老版本首次启动时一样的演示书《临水问剑》。
- 取书号用登记表里的 id，文件名做一次安全过滤；所有写盘都是"先写 .tmp 再 rename"。

### 2. 代码在哪

| 文件 | 作用 |
| --- | --- |
| `app/lib/bookcase.js`（新，~390 行） | 书库登记表、每本书的读写、新建/复制/改名/删除、老数据迁移、按书分目录的图片路径 |
| `app/lib/store.js` | 原来只认一个文件，现在改成"当前这本书"的 load/save/backup；打戳逻辑照旧 |
| `app/main.js` | 新增 `books:list / create / switch / rename / delete`；`data:importJson` 改成"收成一本新书"；拆书原文本与图片都按当前书写 |
| `app/preload.js` | 暴露 `window.nf.books.{list,create,switch,rename,remove}` |
| `app/renderer/js/library.js`（新，~270 行） | 顶栏书名刷新、切换逻辑、书库弹窗（新建 / 改名 / 复制 / 删除） |
| `app/renderer/js/app.js` | `NF.flush()`（立刻落盘并等写完）、`NF.adoptBook()`、`NF.repaint()`、`NF.paintChrome()`，顶栏绑定书库 |
| `app/renderer/index.html`、`css/app.css` | 顶栏标题改成可点的书籍入口 + 书库弹窗样式 |
| `app/renderer/js/util.js` | `modal()` 多返回一个 `ok()`，需要"等这一步做完再接着做"的地方可以 `await` |

### 3. 切换一本书时发生了什么（顺序不能乱）

1. `NF.flush()`：**先停掉 450ms 自动保存的定时器、等正在写的那一笔写完**。
   少这一步，切完之后那笔 setTimeout 会把上一本的内容写进刚切过去的那一本（主进程按"当前书"落盘）。
2. `books:switch`：主进程先把内存里的 doc 存回上一本，再改登记表里的 `activeId`，作废内存缓存，
   读回新书；顺带把上一本的书名/作者/编辑时间写回登记表。
3. 界面换 `NF.doc`、换 `NF.library`，**清空撤销栈再重新 prime**——
   撤销栈里是上一本的快照，带着它按 Ctrl+Z 会把两本书的内容搅在一起。
4. `NF.repaint()` 整页重建（滚动位置、选中项归零，正好是"翻开另一本书"该有的样子）。

新建 / 复制 / 删除走的是同一个入口（`NF.adoptBook`），只是主进程那边已经把 activeId 换好了。

### 4. 顺手改动的几处

- **导入 JSON 不再覆盖当前书**：收成书库里的一本新书并切过去（设置页和导入页都改了）。
- **从备份恢复**：备份文件名里带书号，恢复会写回它原来那本书，是别的书就自动切过去；
  以后恢复不会再"用 A 书的备份盖掉 B 书"。
- **书名唯一**：新建 / 改名撞名自动补序号（`临水问剑（2）`），不会出现两本同名的分不清。
- **删除保护**：书库里至少要留一本；删除前自动往 `backups/` 留一份，书文件挪进 `trash/`。
- 作者名改完会同步到顶栏和书库登记表；`beforeunload` 时把没落盘的那一笔补上。

### 5. 本轮验证（脚本跑完已删，方法记在这里）

启动器 `_scratch/launch.js`：`node _scratch/launch.js --disable-gpu --page=<页> --eval=<js> --out=<json> --ud=<临时数据目录>`
（**必须删掉环境变量 `ELECTRON_RUN_AS_NODE`**，否则 electron 会退化成 node，报 `app.whenReady is not a function`）

| 覆盖 | 结果 |
| --- | --- |
| 全新安装：自动建演示书《临水问剑》，顶栏显示书名 | 通过 |
| 老版本升级：只有 `novelfolio.data.json`（书名/作者/3 个人物改过）→ 变成"默认书籍"，内容与改名都在 | 通过，老文件字节未动 |
| UI 新建空白书 → 书名 / 2 个人物 / 主位面 / 书库列表正确，弹窗自动关闭 | 通过 |
| 两本书各加一个人物 → 来回切换 → 各归各的，互不串 | 通过 |
| 切换后撤销栈清空（不会把两本书搅在一起） | 通过 |
| 改名（当前书）：顶栏、登记表、doc.meta 三处同步 | 通过 |
| 复制一本：内容全抄，原书不受影响；删除当前书后自动切到另一本 | 通过 |
| 最后一本不能删 / 删不存在的书 / 切到不存在的书：只报错不崩 | 通过 |
| 重启后记住上次打开的书、书库数量、内容 | 通过 |
| 同名新建 / 改名 → 自动补（2）（3），书库里没有重复书名 | 通过 |
| 拆书：两本书各自的 `books[]` 不串；原文副本按书写入 | 通过 |
| 立绘：存到 `portraits/<书号>/`，切书后地址仍能解到原文件 | 通过 |
| 备份列表带书号；恢复只写回原来那本书 | 通过 |
| 七页冒烟 + 书库弹窗 / 新建弹窗渲染：0 个渲染层报错；顶栏书名与导航不重叠 | 通过 |
| 改完立刻切书（不保存）→ 改动仍在 | 通过（flush 生效） |
| 完整 UI 流程：新建 → 加人物 → 切回演示书（不含新人物）→ 切回新书（含）→ 改名 → 复制 → 删除当前书 → 重启 | 全部通过，0 个渲染层报错 |
| 弹窗语义：onOk 返回 false 不关 / 取消能关 / onOk 里嵌套新弹窗不会被一起清掉 / ok() 直调 | 5 项全过 |

### 踩过的两个坑（都已在代码里写好注释）

1. **`modal()` 关闭时会把后开的弹窗一起清掉**：`onOk` 里 `await` 之后又调 `modal()` 的地方，
   旧的实现会在 onOk 返回后再 `clear(#modalRoot)`，刚打开的那个对话框就消失了。
   现在只在"根节点里还是本弹窗"时才收尾，并且放到下一拍；书库那几层弹窗自己显式 `closeBoxes()`。
2. **`NF.adoptBook` 收一个大包**：`{ activeId, doc, library }` 整个当 doc 传进去，
   界面就显示成空壳（实际数据没错，只是界面拼错了）。现在参数写成 `{ doc, library }`，
   没传 doc 就自己 `data.load()` 一次兜底。

## 七、第五轮：撤销 / 重做（仍然有效）

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
| 数据 | 本机 `userData/data/`：`library.json`（书库）+ `books/<书号>.json`（每本书一份）；老的单文件 `novelfolio.data.json` 只在升级时读一次 |
| 打包产物 | `dist\NovelFolio-0.1.0-portable.exe`（本轮已重新打包；`app.asar` 里的 `app.js` / `undo.js` / `chapter.js` 与源码逐字节一致） |

构建命令（必须关掉正在运行的便携版，`ELECTRON_BUILDER_CACHE` 必给、`ELECTRON_RUN_AS_NODE` 必删）：

```powershell
taskkill /F /IM NovelFolio-0.1.0-portable.exe
$env:ELECTRON_BUILDER_CACHE="$env:LOCALAPPDATA\electron-builder\Cache"
$env:CSC_IDENTITY_AUTO_DISCOVERY="false"; $env:USERNAME="Administrator"
C:\Program Files\nodejs\node.exe E:\novel\node_modules\electron-builder\cli.js --win portable
```

Git：`D:\Git\cmd\git.exe -c safe.directory=E:/novel ...`

## 二、第四轮做了什么（`app/renderer/js/pages/plot.js`）

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

- [ ] 书库：书多了以后加搜索 / 按最近编辑排序、单本书导出成 `.nfbook` 文件（现在是导出整份 JSON）；
- [ ] 书库：把「当前书」也接进多设备同步（现在是整份数据同步，书库里只有当前这本会跟着走）；
- [ ] 时间轴导出图片 / PDF、纵向虚拟滚动（前几轮遗留）；
- [ ] 暗线很多时缩进会把轨道压得很窄，可以考虑折叠第 3 层以后的暗线；
- [ ] 收敛点如果被改到最后一个情节之前，横线会跟着缩短（现在的行为），要不要提示由产品定；
- [ ] README 的待办。

## 六、历史（前几轮，仍然有效）

1. 主线时间轴圆点串在轴线上；2. 暗线引出点/收敛点可键入、选章节、轴上取点；3. 引出/收敛以树状枝示意；
4. 时间轴不吸附，拖动松手定格；5. 情节列表筛选、点轴高亮；6. AI 构思助手；7. 章节页点情节在正文标段落；
8. 横向缩放/平移（共用刻度、滚轮缩放、`实际用到`/`全部`）；9. 暗线嵌套（`mergeInto` 指向另一条暗线、环防护）；
10. 端点圆点在父线轴上可拖（A/B 都能拖，双击复位）。