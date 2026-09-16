# 「绘事工作台」微信小程序设计稿 · 交接文档

> 更新时间：2026-09-16 13:45（v17）
> 用途：交给下一个模型/会话继续设计。请务必基于 **当前版**继续，不要回退到任何旧版本。

---

## 一、唯一最新版本（以此为准）

| 文件 | 说明 |
|---|---|
| `build/index.html` | **源文件（权威版本）**，所有修改先改这里 |
| `designer-mp-prototype.html` | 根目录预览副本，每次改完从 build 复制同步 |
| `publish/index.html` | 发布副本，已同步到最新 |

- 三份文件当前 MD5 一致：`4cf7d954cd4bb4ed51d25a74ab2fdee4`（约 321KB）
- 客户问卷页 `build/client.html` / `publish/client.html` 两份 MD5 一致：`c05432ec2b08133816ba84620dbe773a`（约 24KB）
- 预览方式：本地服务 `http://127.0.0.1:8000/designer-mp-prototype.html`（Python http.server 8000，工作目录为本工作区根目录）；手机同 WiFi 访问 `http://192.168.3.4:8000/designer-mp-prototype.html`
- 数据持久化：浏览器 localStorage，key = `huishi_workbench_v1`

## 二、项目是什么

设计师/画师接单管理后台的微信小程序高保真可交互原型，单文件 HTML/CSS/JS（无框架、无构建）。
hash 路由 SPA：`#/home` `#/schedule` `#/warehouse` `#/me`；加单/设置/费用设置为模态或二级页。

## 三、设计规范

- 风格：简约小清新
- 配色：薄荷绿 `#8EC9A8` / 深薄荷 `#5FA47C` / 暖橘 `#E8A87C` / 奶油白 `#FAF7F2` / 淡粉 `#F4D9D9` / 米色外底 `#E9E3D8`
- 布局（v3 定稿，勿改回旧版）：
  - **无手机边框**（用户明确放弃 iPhone 外壳）
  - `.stage`：max-width 420px、height 100vh、margin 居中、display:flex column、overflow:hidden、外层 body 背景 `#E9E3D8` + 舞台淡阴影
  - `.page`：flex:1 + min-height:0 + overflow-y:auto（舞台内滚动）
  - `.tab-bar`：普通 flex 子项（flex-shrink:0，高 80px），**不用 sticky/absolute**
  - 抽屉弹窗（编辑制品）：position:fixed 覆盖视口
- 底部 Tab 5 项：首页/排单/加单(中间凸起+)/仓库/我的

## 四、已实现功能（按页面）

**首页**：本年度总收入金额卡（¥12,580 卡片）、本月单数/待完成/本月新增客户数 三格、2026 年度收入柱状图（含金额标签）
**排单**：日历仅显示截稿日（深薄荷背景）、日历图例（正常/加急/已完成/多点=多单）、点击日期动态显示当天订单卡；列表视图（空态）；历史排单模块已按用户要求**整体删除**
**加单**（三步）：①加单信息（企划名/平台/费用信息=支付方式+手续费/是否公开/是否加急/其他费用动态行/下单与截稿日期/备注）②制品信息（从仓库下拉选制品、数量、用途、自动带出单价「¥200/组」、小计=数量×单价×用途倍率×加急倍率×公开倍率）③清单打印（热敏纸小票：票头含订单号=下单日期+4位随机、制品明细、应付/优惠/实付/定金/尾款、温馨提示）
**仓库**：添加制品（名称/单价/单位/分类可输入下拉+历史分类 chip/6色选择）+ 制品管理（列表、编辑抽屉：删除/取消/保存）
**我的**：头像资料、客户管理/意见反馈/使用说明/设置；设置→费用设置（4 类：手续费%/用途倍率/加急倍率/公开倍率，增删改+保存按钮+脏状态高亮，保存后实时同步加单页下拉）
**数据**：全部 localStorage 持久化（products/categories/feeSettings/orders），默认项为空数组（无预置演示数据）

## 五、最近一轮变更（v5，2026-09-08 上午，8项）

1. **日历**：只有「今天」显示 #8EC9A8 背景（白字），不再有任何其他色块高亮
2. **待交稿标签**：#5FA47C 绿字 / 淡绿底 / 10px
3. **历史订单筛选**：按年=最近3年+数据中出现过的年份 chips；按月=年份 chips + 全部 1~12 月 chips（先选年再选月）
4. **订单详情页**（新页面 page-order-detail，无 Tab Bar）：历史订单行 / 日历当天订单卡点击进入；顶部操作按钮：编辑、结单、跑单、废稿、删除、小票；下方三张卡（订单信息 / 制品明细 / 金额）
5. **废稿弹窗**：废稿比例%（默认20，预定实收×比例）+ 其他费用逐项勾选计入；计算参考实时更新；废稿费应收可手改；确认→status='scrapped'
6. **跑单弹窗**：退全款 / 收跑单费（radio）+ 已退款金额 + 备注；应退款 = 已收定金 − 跑单费；确认→status='failed'
7. **结单弹窗**：优惠原因 3 行（延期补偿/老客优惠/其他，各带 减去⇄折扣 分段切换 + 数值），实收=(应收−减去之和)×折扣系数乘积；本次收款默认=尾款；结算参考（应收/优惠后应收/已收定金/本次收款/已结清或差额）；确认→balance 结清置 done
8. **小票弹窗**：buildTicketHtml(o) 直接从订单数据生成热敏小票

新增订单字段：status(''/done/failed/scrapped)、remark、scrapFee、failMode/failFee/failRefunded/failRemark、settlePaid。orderStatus(o) 统一推导状态（显式 status 优先，否则尾款/加急推导）。编辑模式：editOrderId 非 null 时 submitOrder 更新原订单（保留订单号/状态/结算记录），prefillOrderForm 回填整表（含制品行重建）。

## 五·prev、v4（2026-09-08 早晨）

1. **排单页**：删除「日历/列表」切换控件和列表视图（`#view-list`、`switchScheduleView`、`.list-view/.list-group/.list-item`、`.seg-control` CSS 全部移除），只保留日历
2. **新增「历史排单」模块**（排单日历下方）：
   - 标题旁小字显示「共 N 条」（随筛选和搜索实时变化）
   - 列表行：企划名称（副行：单主昵称 · 联系方式 · 截稿日）+ 实付金额 + 状态（已完成/进行中/加急中，判定：balance>0 未完成，加急看 rushRate>1）
   - 搜索框：按企划名称 / 单主昵称 / 联系方式模糊搜索（不区分大小写）
   - 筛选 tab：全部 / 按年（年份 chip）/ 按月（月份 chip）/ 未完成 / 自定义（起止日期输入）
   - JS：setHsTab / pickHsYear / pickHsMonth / renderHsSubrows / getFilteredOrders / renderHistory；init 和 submitOrder 后都会调 renderHistory()
3. **加单表单 step1 新增两个字段**（「接单平台」下方一行两列）：单主昵称（`#oCustomer`）、联系方式（`#oContact`），submitOrder 存入 order.customer / order.contact——此前订单没有这两个字段，为支持搜索而加

## 五·prev、v3（2026-09-08 凌晨）

1. 修复重大 DOM 嵌套断裂：删 .phone/.screen 时 div 配对破坏，导致 .stage 提前闭合、Tab Bar/保存按钮泄漏为 body 子元素。已重建正确嵌套（.stage > [status-bar, pages..., toast, tab-bar]）
2. 布局定稿：420px 舞台 + flex 方案（见上）
3. 费用设置"保存"按钮移回 page-fee-settings 内部（受页面隐藏控制）
4. 删除全部演示数据：排单页示例订单卡（林夕/阿白）、列表视图静态项（柚子/小鹿/江野）、日历假截稿日圆点（DEFAULT_CAL）
5. 删除整个"历史排单"模块（HTML+JS setHsTab/getFilteredOrders/renderHistory+CSS）

## 六、开发铁律（踩过的坑，务必遵守）

1. **改完必跑语法校验**：`node -e "new Function(html.match(/<script>([\s\S]*?)<\/script>)[1])"`，防 Edit 工具截断函数产生孤儿代码
2. **Edit 大段替换时 old_string 必须覆盖到函数完整结尾**，曾因截断导致整页点击无反应
3. **改 HTML 结构必须核对 div 开/闭数量守恒**；改完用逐行 depth 统计脚本或 headless Chrome 截图验证
4. **改完 build/index.html 必须同步复制**到根目录 designer-mp-prototype.html（和 publish/index.html），用户看的是根目录那份
5. 无头 Chrome 截图验证时 URL hash 不能带 query（parseRoute 不识别 `#schedule?x=1`）
6. `.stage` 上不要用 `overflow-x:hidden`（会隐式把 overflow-y 变 auto，破坏 sticky）——当前方案已规避
7. 用户偏好：界面简洁专业；反馈紧凑，按编号逐项修；时间只显示年月日；倍率为 0 不显示；删除按钮不能被裁切

## 七、待办 / 可能的下一步（未明确，供接手参考）

- 首页柱状图数据目前仍是静态示例值（3.2k...12.6k），尚未接入真实订单统计
- 排单日历仍是写死的 2026 年 9 月（renderCal 无真实月份切换逻辑）
- 订单详情页、客户管理页、意见反馈页还是 toast 占位
- 加单表单的昵称/联系方式输入后不会在重新打开时清空（原型行为）
- 用户计划：GitHub + Vercel 部署 + 自有域名（https://www.lambstar.top/），Web+桌面双形态
- 用户接下来会换模型继续设计——请从 v3 现状出发，先读本文档和 `build/index.html`，不要凭旧记忆重做旧版布局（尤其不要恢复手机边框、历史排单、演示数据）

## 八、v4 第四轮（2026-09-08 上午）

1. **历史订单 年/月选择改为下拉框**：按年 → 一个 `.hs-select` 年份下拉；按月 → 年份 + 月份两个下拉。样式：奶油白底 #FFFCF5、圆角 12px、右侧灰色 chevron（SVG data URI）、聚焦变薄荷绿描边。chips 行（hs-chip）不再用于年月，`hs-divider` 已弃用但 CSS 保留
2. renderHsSubrows 改为输出 `<select onchange="pickHsYear/pickHsMonthYear/pickHsMonth(this.value)">`，筛选逻辑不变；种子数据实测：按月选 8 月 → 共 1 条正确
3. 语法 + div 配对校验通过，三份文件已同步（MD5 一致）
- 补充（同日上午）：日历卡片底部新增「当前待交稿件：N 件」统计行（.cal-due-total + #dueTotal，getDueTotal()：endTime≥今天且 status 非 done/failed/scrapped 的订单数），renderCal 时刷新

## 九、v4 第五轮（2026-09-08 上午·首页改版）

1. **柱状图**：金额标签从柱底移到柱顶（.bar-val 在 .bar 之前），去掉 k 缩写改为完整金额（3,200 / 12,580，8px nowrap），副标题「单位：千元」→「单位：元」，柱高整体下调防溢出（峰值 76%），chart-bars 高 140→160
2. **统计卡改版**：原 3 张静态卡（本月单数/待完成/本月新增客户数）→ 8 张数据卡（订单数/客户数/收入金额/优惠金额/手续费/跑单数/废稿数/未结单金额），网格 2 列（.stat-grid），顶部 周/月/年 筛选 chips（.sf-chip，statRange，按 endTime 过滤，周=本周一起）
   - JS：setStatRange / statRangeDates / orderReceived / orderFeeAmt / fmtMoney / renderHomeStats；saveAll() 和 init 都会调 renderHomeStats()
   - 口径：收入=orderReceived（done→actual；failed→fee模式收failFee否则0；scrapped→scrapFee；进行中→已收定金，尾款不计）；优惠=Σmax(0,payable-actual)；手续费=feeAmt（下单时存入 order.feeAmt，旧单按 payable/feePct/extras 反推）；未结单=非 done/failed/scrapped 的 balance 合计；客户数=customer||contact 去重
3. **总金额卡**：label 改「总金额 · 所有订单实际收入」，金额实时计算 #totalIncome（全量订单 orderReceived 之和），趋势 pill 改「未结单金额不计入」
4. 语法 + div 配对校验通过；种子数据实测 8 项指标与手算一致；三份文件已同步
- 调整（同日）：统计筛选删「周」，新增「总」（statRange='total'，statRangeDates 返回 null → 不过滤全部订单）；种子实测通过，三份已同步

## 十、v4 第六轮（2026-09-08 上午·大批改版）

1. **统计卡 4 个一行**：`.stat-grid` 改 `grid-template-columns:repeat(4,1fr)`，字号缩小（v 14px/9px），padding 缩小
2. **柱状图接入真实订单数据**：静态 12 根柱替换为 `<div id="chartBars">` 容器；`renderChart()` 按 `orderReceived` 汇总当年每月实际收入动态渲染（高度按 max 比例、金额标签在柱顶显示完整整数）；标题随年份更新
3. **备注框宽度**：`.textarea-row .ta` width 从 280px 改为 100% + box-sizing:border-box
4. **删除跑单弹窗备注**：移除 odFailed 模块中「备注（可选）」m-field 及 failRemark 存储
5. **制品行加加价费/实际单价**：
   - pl-grid 扩展为 3 列（数量/用途/单价），新增 pl-grid2 2 列（加价费 input / 实际单价 readonly）
   - calcLineSub：读取 markup → actualPrice = price + markup → sub = qty × actualPrice × usageRate × rushRate × pubRate
   - 数据流：getProdLinesData / submitOrder / prefillOrderForm / renderTicket / buildTicketHtml / renderOrderDetail 全链路支持 markup & actualPrice
6. **费用设置新增定金模块**：在手续费上方添加「定金设置」卡片（fc-deposit），输入 % 存入 feeSettings.depositPct（默认 30%）
   - 小票定金自动计算：renderTicket 中若 pDeposit 为空/0 且 depositPct>0，自动填 payable × depositPct%
7. **设置页结构**：已确认 settings 页已有「费用设置」→ page-fee-settings 子页结构；新增「客户管理」set-item 入口
8. **客户管理页**：新增 page-customers（no-tab），从历史订单聚合客户列表（昵称/合作次数/合作金额），点击弹窗详情含订单列表+可编辑客户喜好/分组标签/描述并保存到 customers store；我的菜单和设置页均链接至此页
9. 校验：JS 语法 OK、div 配对平衡、四视图 headless 截图验证通过（首页 4 列统计+动态月度图、加单制品行加价费/实际单价、费用设置定金模块、客户管理列表）

## 十一、v4 第七轮（2026-09-08 10:39）

1. **删除设置页「客户管理」入口**：我的页已有客户管理入口（me-stat + menu-item），设置页 set-item 中的客户管理块替换为注释 `<!-- 客户管理已移至我的页 -->`；`refreshCustCounts()` 中对 `custSettingsCount` 的引用保留 if 保护（元素不存在时跳过，不报错）
2. **小票背景改为纯白色**：`.ticket` 的 background 从 `#FFFCF5` 改为 `#FFFFFF`；顶部/底部锯齿边 ::before / ::after 的 radial-gradient 终止色同步改为 `#FFFFFF`
3. **修正小计计算公式**：`calcLineSub()` 中原公式 `qty × actualPrice × usageRate × rushRate × pubRate` 多乘了加急/公开倍率，改为 `qty × actualPrice × usageRate`（与用户确认的公式一致：数量×实际单价×用途倍率）。以截图数据验证：数量1 × 实际单价105 × 商用倍率2 = ¥210 ✓
4. 三份文件已同步（MD5: `48867fdf38840e3aa5724d82f5afc75b`），JS 语法校验通过

## 十二、v4 第八轮（2026-09-08 12:11）

1. **定金默认值自动填充**：`renderTicket()` 中计算完 `depDefault`（应付×定金比例%）后，当输入框值为 0 时将默认值回写到 `pDepEl.value`，用户打开步骤3小票即可看到预填的定金金额，也可手动修改；尾款 = 实付-定金 自动重算
2. **删除小票底部备注**：移除「您可以选择全款支付，也可以选择定金+尾款的形式，尾款需要在交付前支付。」提示行
3. **制品明细格式重构**：
   - 新增 CSS：`.tk-prod-item`（纵向布局）、`.tk-prod-body`/`.tk-prod-price`/`.tk-prod-meta`（单价/元信息分层）、`.tk-old-price`（浅灰#B8B0A0 + 删除线）、`.tk-actual-price`（金色#C18A2B 加粗）
   - 制品行改为两行：第一行=制品名；第二行分左右——左为单价区（有加价费时显示划线原价+实际单价，无加价费时显示正常单价），右为元信息行（数量/单位 · 用途 + 小计金额）
   - 同时更新 `renderTicket()`（加单表单小票）和 `buildTicketHtml()`（订单详情小票）两处渲染逻辑
4. 三份文件已同步（MD5: `eb8f99cc0d103841cf8051ee39687dab`），JS 语法校验通过

## 十四、v4 第九轮（2026-09-08 12:38）

1. **定金显示百分比+金额**：`renderTicket()` 定金行重构为两块——主行显示「定金（比例%） ¥金额」+ 手动标签；下方单独一行「手动修改」输入框（placeholder 显示默认金额）。逻辑：`isManual = 输入框有非0值`，是则用输入值并在主行标「手动」，否则用应付×比例%自动算。尾款=实付-定金自动重算
2. **小票外观样式**：新增 4 套主题（classic 经典收据 / modern 简约现代 / warm 暖色卡片 / vintage 复古票据），每套独立 CSS 覆盖 `.ticket` 字体/背景/分隔线/强调色
3. **样式选择器**：费用设置页新增「小票外观」卡片，含 4 个可点选项（带小预览方块+名称+描述+选中圈）；`renderTicketStylePicker()` 渲染、`selectTicketStyle()` 切换并实时预览
4. **持久化**：`DEFAULT_FEE_SETTINGS` 加 `ticketStyle:'classic'`，init 补默认；`renderTicket()`/`buildTicketHtml()` 均应用 `ticket-<style>` 类
5. 三份文件同步（MD5: `7012148212789440301e7f1d96ecbda1`），JS 语法 OK；puppeteer 实测：定金30%→¥63、手动50→标「手动」、4 选项、切 vintage 后加单页与订单详情小票均生效

### 补丁记录（第七轮续）

5. **修复编辑按钮无反应**：上一轮改小计公式时残留 `dataset.rushRate/pubRate` 赋值引用已删除变量 → ReferenceError。已删除残留
6. **修复加价费输入后小计不更新**：加价费 input 的 oninput 含嵌套双引号导致 HTML 解析失败。改为 `calcLineSub(this)` + 函数内自行从行内读数量框
7. **修复编辑时加急/公开/支付方式回填失败**：`odEdit()` 先 prefill 再 goTab('add')，goTab 触发 syncOrderFormSelects 重建 select 覆盖值。调换顺序修复
8. **修复小票不同步加急/公开/支付**：`syncOrderFormSelects()` 无条件重建三个 select innerHTML 清空已选值。改为重建前记住 value、重建后按值还原；同时补齐 `buildTicketHtml()` 缺失的加急/公开行

## 十二、v4 第七轮补丁（2026-09-08 10:46）

1. **修复「编辑」按钮无反应**：上一轮修改小计公式时删除了 `rushRate`/`pubRate` 变量定义，但 `calcLineSub()` 中残留的 `line.dataset.rushRate = rushRate; line.dataset.pubRate = pubRate;` 两行未同步删除，导致 `ReferenceError` 崩溃——`odEdit()` → `prefillOrderForm()` → `calcLineSub()` 在此处中断，后续 `goTab('add')` 未执行。已删除这两行残留赋值
2. 三份文件已同步（MD5: `afd126a70e97d454c50a748234b778b0`），JS 语法校验通过

## 十三、v4 第七轮补丁2（2026-09-08 10:57）

1. **修复加价费输入后小计金额错误**：加价费 input 的 `oninput="calcLineSub(this)"` 把自身（值=5）传给函数，`calcLineSub` 将其当作 `qty` 读取，导致小计 = 5×105×2=1050。改为 `oninput="calcLineSub(this.closest('.prod-line').querySelector('input[type=\"number\"]'))"` —— 始终传入数量输入框，与用途下拉的调用方式一致
2. 三份文件已同步（MD5: `58c4e3b4326692191d72e3714c8ae1f8`），JS 语法校验通过

## 十四、v4 第七轮补丁3（2026-09-08 11:03）

1. **修复输入加价费后小计不实时更新（真因）**：上一轮把加价费 input 的 oninput 写成 `calcLineSub(this.closest('.prod-line').querySelector('input[type=\"number\"]'))`——HTML 属性内的双引号会提前闭合 oninput，整段 handler 成为非法 JS，事件触发时 `Invalid or unexpected token` 报错，故输入加价费「无反应」（重新选用途走 `<script>` 内合法字符串所以能算）。已用 puppeteer-core 连真实 Chrome 实测复现并确认修复
2. 修复方案：`calcLineSub()` 改为从行内 `input[type="number"]` 自行读取数量，不再依赖传入的 input；加价费/数量 input 均用 `oninput="calcLineSub(this)"`，彻底规避引号嵌套。实测：输入加价费 5 后小计 ¥300→¥305 实时更新，无报错
3. 三份文件已同步（MD5: `9e7dd7aee4bf8323fd0428060144a0a4`），JS 语法校验通过

## 十五、v4 第七轮补丁4（2026-09-08 11:20）

1. **修复编辑时加急/公开/支付方式无法回显**：`odEdit()` 中执行顺序为 `prefillOrderForm(o)` → `goTab('add')`，而 `goTab('add')` 触发 `initAddForm()` → `syncOrderFormSelects()` 重建三个 select 的 innerHTML，把 prefill 刚设的值覆盖回"请选择"。已调换顺序：先 `goTab('add')`（重建选项），再 `prefillOrderForm(o)`（赋值）
2. 三份文件已同步（MD5: `6b96326a951e034f0ea8f90251fc55ee`），JS 语法校验通过

## 十六、v4 第七轮补丁5（2026-09-08 11:55）

1. **修复小票支付方式/加急/公开不同步**：`goStep(n===2||3)` 调用 `syncOrderFormSelects()`，该函数无条件重建三个 select 的 innerHTML，把用户已选的值重置回默认——故步骤1填完→进步骤3，选择被清空，小票读到空值。用 puppeteer-core + 真实 Chrome 实测复现（选中特急/全公开/闲鱼，步骤3小票却显示不加急/不公开/—）
2. 修复：`syncOrderFormSelects()` 重建前记住 oPay/oRush/oPublic 的已选 value，重建后按 value 还原（匹配不到说明该费用项已删，回退默认），并还原 dataset.rate。实测步骤3小票正确显示「闲鱼(5%) / 特急×2 / 全公开×2」、应付¥315
3. **补齐订单详情「订单小票」(buildTicketHtml) 缺失的加急/公开行**：原 buildTicketHtml 只有「平台/支付」，无加急/公开。已补上与 renderTicket 一致的加急/公开 pair 行，使用 o.rushName/o.rushRate/o.pubName/o.pubRate。实测订单小票弹窗正确显示
4. 三份文件已同步（MD5: `a40af9ac564549e5d5c681e50a28d431`），JS 语法校验通过

## 十七、v4 第十轮（2026-09-13）：自定义订单模板

需求：用户可提前设置「添加订单模板」（需要填写哪些信息项），加单时选择用哪个模板；上一次使用的模板作为下次默认。

实现：
1. **数据模型**：新增 `orderTemplates`（模板数组 `[{id,name,fields:[{key,label,type,required,options?}]}]`）与 `lastTemplateId`（上次使用），均经 loadStore/saveStore 持久化，并在 `saveAll()` 中写入。
2. **路由**：`pages` 与 `noTabPages` 增加 `templates`；设置页新增「订单模板」set-item 跳至 `page-templates`（含新建按钮与模板列表，支持编辑/删除/设为默认）。
3. **模板编辑器**：复用通用弹窗 `openModal`，支持模板名称 + 动态字段行（名称/类型 text·textarea·number·date·select / 必填 / 下拉候选项），增删字段、保存。
4. **加单页接入**：step1 顶部新增「订单模板」下拉（`#oTemplate`）+ `#customFields` 容器；`refreshTemplateSelector()` 填充选项；`renderCustomFields(tplId, values)` 按模板动态渲染字段；`initAddForm()` 对新建订单默认应用 `lastTemplateId`；`onTemplateChange()` 切换模板实时重渲染并记忆。
5. **提交与详情**：`submitOrder()` 收集 `templateId/templateName/customFields`，并对必填字段做校验拦截（toast 提示），成功后将 `lastTemplateId` 记为本次模板（下次默认）；`renderOrderDetail()` 展示模板字段卡片；`prefillOrderForm()` 编辑时恢复模板并回填自定义字段（模板被删也能用存储值回显）。
6. **校验**：JS 语法 OK；puppeteer-core + 真实 Chrome 实测：①新建模板→列表+1 ②默认模板自动选中并渲染 3 个字段 ③填字段提交→订单含 templateId/自定义字段值 ④详情正确展示 ⑤必填为空拦截提交并提示 ⑥填好后正常创建。仅 favicon 404 无害。
7. 三份文件已同步（MD5: `738686e77c0851cc3b368b47c2090b8b`），JS 语法校验通过

---

## 十一、v4 第十一轮：客户问卷独立页（2026-09-13）

### 需求
用户希望有一个**单独的页面**给客户填写问卷：客户只能看到发给他的页面、看不到后台；问卷内容 = 添加订单所需字段；客户填完提交后，后台订单列表能同步看到对方填写内容，且可编辑修改。

### 改动
1. **新建独立客户页 `build/client.html`（+`publish/client.html`）**
   - 独立 HTML 文件，无后台导航/TabBar，客户打开只能看到问卷，看不到其他页面。
   - 复用同一 `STORAGE_KEY = 'huishi_workbench_v1'`，与后台共享 localStorage，客户提交即写入 `orders`。
   - 字段与加单页一致：企划名称、客户昵称、联系方式、接单平台、下单/截稿日期、制品需求（名称/单价/加价费/数量/单位/用途，实时算实际单价与小计）、加急/公开/支付（取自后台费用设置，未配置则用默认）、备注。
   - 支持 `?tpl=<模板id>`：锁定该模板并隐藏模板选择器，自动渲染模板自定义字段（含必填校验）；无参数时显示模板选择器（含「自由填写」）。
   - 提交时计算 payable/定金(按费用设置定金%)/尾款，订单写入 `source:'client'`、`status:'client'`，并给出回执单号（CL 前缀）。
2. **后台识别与展示（build/index.html）**
   - `orderStatus()` 新增分支：`source==='client'` → 状态 `待确认`（class `client`）。
   - 订单列表 `renderHistory()`：客户订单加「客户填写」标签 + 待确认状态。
   - 订单详情 `renderOrderDetail()`：状态旁显示「客户填写」徽标，并提示「由客户通过问卷提交，可直接编辑修改」。
   - 新增 CSS：`.h-tag.client` / `.h-st.client` / `.od-badge.client`。
   - 设置页新增「客户问卷链接」入口 → `openClientLinkModal()`：可选绑定模板，生成 `client.html`（或 `?tpl=`）链接并可一键复制（`copyClientLink`）。
3. **编辑链路**：客户订单沿用与后台订单一致的字段形状，`odEdit()` / `prefillOrderForm()` 可直接回填，后台可照常编辑修改。

### 校验（puppeteer-core + 真实 Chrome 全链路实测）
- 客户页填写提交 → 成功页显示回执单号（格式 `CL20260913-xxxx`）✅
- localStorage 写入订单：`source:'client'`、`status:'client'`、字段正确、定金按 30% 自动算（700×30%=210）✅
- 后台订单列表出现该订单，带「客户填写」「待确认」✅
- 订单详情显示「客户填写」✅
- 点「编辑」→ 加单页 `#oName/#oCustomer/#oContact` 与制品行正确回填 ✅
- JS 语法 OK；`build/index.html`、`designer-mp-prototype.html`、`publish/index.html` 三份同步；`client.html` 同步至 `publish/`。

---

## 十二、v4 第十二轮：小程序版 → 网页版（响应式自适应 手机/iPad/电脑）

### 需求
把当前的「小程序/手机原型」外观改为真正的**网页版**，并自适应手机端、iPad 端、电脑端。

### 改动（build/index.html，纯 CSS 改造，不动业务逻辑）
1. **拆掉手机外壳**
   - `.stage` 去掉 `max-width:420px` 与外阴影 → 铺满视口；`height:100dvh`（移动端地址栏自适应，保留 `100vh` 回退）。
   - `html,body` 背景由原型底 `#E9E3D8` 改为应用色 `#FAF7F2`。
   - 隐藏原型里的「手机状态栏」`.status-bar`（9:41/信号/电量），网页版由浏览器提供。
2. **导航随屏幕变化（复用同一个 `.tab-bar` DOM）**
   - 手机（<768px）：保持底部 Tab Bar（原样）。
   - iPad（≥768px）：`.stage` 转 `flex-direction:row`，Tab Bar 变**左侧图标栏**（88px，图标+文字竖排，hover/选中底色），并 `order:-1` 排到左侧；宽屏下 `.tab-bar.hidden{display:flex}` 保证二级页也有导航。
   - 电脑（≥1024px）：侧栏展开为 **220px 带文字导航**（图标+文字横排），用 `::before` 加「绘事工作台」品牌名；中间的 `+` 按钮用 `::after` 变成「新建订单」按钮。
3. **内容宽度控制**：`.page > *` 设 `max-width` 并水平居中——iPad 900px / 电脑 1080px / 大屏(≥1440) 1200px，避免宽屏被拉长。
4. **多列适配**：仓库制品列表 `.prod-list` 由单列 flex 改为网格——iPad 2 列 / 电脑 3 列 / 大屏 4 列（空状态原本就带 `grid-column:1/-1`，兼容）。
5. **弹层适配**：抽屉 `.drawer` 在宽屏由「全宽底部抽屉」改为**居中弹层**（540px、圆角、阴影），并隐藏移动端拖拽手柄；Toast 在宽屏用 `left: calc(50% + 侧栏一半)` 避开侧栏居中。

### 校验（puppeteer-core + 真实 Chrome，三种视口实测）
| 视口 | 结果 |
|------|------|
| 手机 390×844 | `.stage` column、底部 Tab Bar（y=764,w=390）、无横向溢出、状态栏隐藏 ✅ |
| iPad 820×1180 | `.stage` row、左侧栏 w=88 h=1180、制品 2 列、无溢出 ✅ |
| 电脑 1440×900 | 侧栏 w=220、内容区 1220、卡片 1200、制品 4 列、无溢出 ✅ |
- 桌面端切换「排单」页正常；JS 语法 OK；无 pageerror。
- 三份文件已同步（MD5: `7b438224c6b7e3d118be53bbd85098e9`）。

---

## 十三、v4 第十三轮：电脑端专属布局（仅改布局，功能不变）

### 需求
上一轮只是把手机布局放宽居中，电脑端日历被拉成巨型方格、观感差。要求电脑端采用**不一样、适配宽屏的布局**，所有功能与交互保持不变。

### 改动（build/index.html，仍为纯 CSS；仅新增/调整 @media 规则）
1. **排单页（≥1024px）**：改为两栏网格 `440px | 1fr`——
   - 左：日历卡（单元格 ≈57px，不再是巨型方格）
   - 右：当天排单 `.day-detail`
   - 下：历史订单 `.history-section` 通栏
   - 通过 `#page-schedule > #view-cal { display: contents }` 把内部两块提升为网格项，无需改 HTML。
2. **首页（≥1024px）**：仪表盘两栏布局——
   - 左列：收入卡 + 统计筛选
   - 右列：年度收入图表（图表高度 190px）
   - 通栏：4 个统计卡（`.stat-grid`）
3. **我的（≥1024px）**：左资料卡 + 右菜单两栏；页脚（版本号）通栏。
4. **仓库（≥1024px）**：内容收窄至 960px 居中（列表仍为多列网格）。
5. **iPad 竖屏（768–1023px）**：日历区收窄至 560px 居中，避免 iPad 上格子过大。

### 关键坑
`#page-schedule { display: grid }` 这种 **ID 选择器优先级高于 `.page.hidden { display:none }`**，导致切换 Tab 后页面不隐藏、多个页面同时显示并挤在弹性行里（表现为每页只剩 ~400px 宽）。修复：所有添加的 ID 布局规则改用 `#page-xxx:not(.hidden)`。

### 校验（puppeteer-core + 真实 Chrome）
| 检查 | 结果 |
|------|------|
| 1440 排单：网格 380–440px + 1fr，单元格 57px，当天排单在日历右侧，历史通栏 1156 | ✅ |
| 1440 首页：收入卡 400 + 图表 728，统计栏 1156（4 列） | ✅ |
| 1440 我的：资料卡 400 + 菜单 728 | ✅ |
| 820 排单：日历区 560，单元格 69 | ✅ |
| 390 排单：仍为单列 + 底部 Tab Bar | ✅ |
| 1024 / 1440 / 1920 × 全部 9 个页面：均无横向溢出、无 JS 报错 | ✅ |
- 三份文件已同步（MD5: `33c81a01d91e2c0921119642e48e155a`）。
- 附带预览截图：`preview-desktop-schedule.png`、`preview-desktop-home.png`、`preview-desktop-warehouse.png`、`preview-ipad-schedule.png`。

---

## 十四、v4 第十四轮：订单模板页「新建模板」按钮修正

### 问题
订单模板页的「+ 新建模板」显示为一个 68px 宽的小药丸，文字紧贴圆角边缘（观感挤）。

### 根因
通用 `.btn` 是为「通栏按钮」设计的：`flex:1` + 无内边距 + `border-radius:22px`。
在 `.tpl-toolbar`（普通块级容器）里单独使用时，按钮 `width:auto` 收缩到内容宽度（68px），
而 `padding:0` 导致文字两端没有任何留白。

### 改动（build/index.html）
1. 按钮内文字拆为 `<span class="ic">+</span>新建模板`，便于控制图标与文字间距。
2. 新增样式（放在 `.tpl-toolbar-tip` 之后）：
   - `手机`：通栏 CTA —— `width:100%; height:44px; border-radius:12px; gap:7px;`
   - `≥768px`：紧凑按钮 —— `width:auto; min-width:132px; height:42px; padding:0 20px;`
   - `.ic` 字号 17px、微调垂直位置。

### 校验
| 视口 | 按钮尺寸 |
|------|----------|
| 手机 390 | w=350（通栏）h=44 圆角 12px ✅ |
| 电脑 1440 | w=132（min-width 生效）h=42 内边距 20px ✅ |
- 两视口均无横向溢出；JS 语法 OK。
- 三份文件已同步（MD5: `f28f297a5ae4e12aa79729689d6b7359`）。
- 截图：`preview-template-button-mobile.png`、`preview-template-button-desktop.png`。

---

## 十五、v4 第十五轮：修复网页端底部残留的 24px 抽屉白边

### 问题
电脑端页面最底部露出一个「多余且显示不全」的条状元素（红框处）。

### 根因（定位过程）
遍历视口底部 80px 内所有元素并打印盒模型，锁定为：
```
[div#editDrawer .drawer] pos=fixed transform=matrix(1,0,0,1,-270,439)
  box y=876 h=439   ← 视口高 900，顶部 876 ⇒ 露出 24px
```
「编辑制品」抽屉原本用 `bottom:0 + translateY(100%)` 的写法滑出屏幕外隐藏；
上一轮做网页版时给它加了 `bottom:24px`（悬浮卡片观感），
但 `translateY(100%)` 只下移自身高度，于是顶部停在 `视口高 - 24`，**底部留下 24px 白边**。

### 修复
```css
/* ≥768px */
.drawer { bottom: 24px; transform: translate(-50%, calc(100% + 24px)); }
.drawer.show { transform: translate(-50%, 0); }
```
`calc(100% + 24px)` 与 `bottom` 偏移量精确抵消，且因是百分比+固定值，抽屉高度变化也始终完全隐藏。

### 校验（三种视口，含隐藏态 + 展开态）
| 视口 | 隐藏态 top / vh | 展开态 |
|------|----------------|--------|
| 电脑 1440 | top=900 / vh=900 → 完全隐藏 ✅ | top=437 bottom=876（视口内）✅ |
| iPad 820 | top=1180 / vh=1180 ✅ | top=717 bottom=1156 ✅ |
| 手机 390 | top=844 / vh=844 ✅ | top=381 bottom=844 ✅ |
- JS 语法 OK；三份文件已同步（MD5: `03af5ac3adf412fb7ce383b472de6f8f`）。
- 截图：`preview-order-detail-bottom.png`。

### 经验
凡是「靠 transform 位移来隐藏」的浮层，若同时改了它的 `top/bottom/left/right` 偏移，
必须把偏移量补进位移里，否则会露出固定大小的边。

---

## 十六、v4 第十六轮：电脑端「设置工作台」（左侧二级导航 + 右侧内容面板）

### 背景
上一轮只是把手机页面放宽居中，电脑端骨架仍是「手机页 + 逐级跳转」。用户选定先改造**设置类页面**。

### 目标形态
电脑端：设置 / 费用设置 / 订单模板 / 客户管理 **不再逐级跳转新页面**，改为左侧二级导航 + 右侧内容面板（网页后台模式）。
手机 / 平板：**完全保持原来的逐页跳转**，不改动任何交互。

### 实现
1. **HTML**：给三个设置页的内容加包裹容器
   - `#page-fee-settings` → 内容包进 `#feeBody`
   - `#page-templates` → 内容包进 `#tplBody`
   - `#page-customers` → 内容包进 `#custBody`
   （`.sub-head` 保留在各自页面里，不搬动）
   设置页新增工作台结构：`#setWorkbench` = `#setNav`（4 项导航）+ `#setPanel`（含 `#setPlaceholder` 占位）。
   原手机端提示文案加 `.set-mobile-tip`，宽屏隐藏。
2. **JS（路由）**
   - `isSettingsWorkbench()` = `innerWidth >= 1024`
   - `mountSettingsPanels() / unmountSettingsPanels()`：把三个 `#xxxBody` 在「各自页面」与「右侧面板」之间来回搬运；因为用的是 `getElementById`，搬走后所有既有逻辑（ID 绑定、inline onclick）照常工作。
   - `openSettingsSection(key)`：宽屏 → 停留在设置页、高亮导航、切换面板显示、执行分区初始化；窄屏 → 回落调用原来的 `openFeeSettings/openTemplates/openCustomers`（逐页跳转）。
   - `openFeeSettings/openTemplates/openCustomers` 开头加宽屏分支；`openSettings()` 宽屏时恢复上次分区，否则显示占位。
   - `resize` 监听（150ms 防抖）：跨断点时重新挂载；若当前正停在某个设置子页（如 fee-settings），切到宽屏会自动接管进工作台对应分区，**避免出现空白页**。
3. **CSS（≥1024）**
   - 隐藏手机端 `.set-group` 与提示；工作台 `grid-template-columns: 264px minmax(0,1fr)`；左侧导航 sticky。
   - 导航项白色圆角卡片 + hover/active 态（active 为浅绿 `#E3F2E9`）；每项含图标、名称、说明文字。
   - 面板内去掉手机端 20px 边距；**费用设置卡片改为两列排布**，保存按钮通栏。

### 校验（puppeteer-core + 真实 Chrome，实测 19 项全过）
- 电脑端：工作台 display=grid、手机列表隐藏、三个分区已挂载到 `#setPanel`、占位提示显示、导航 4 项 ✅
- 费用设置：面板显示、定金比例回填 30、卡片两列（424px × 2）、停留在设置页未跳页、导航高亮 ✅
- 订单模板 / 客户管理：切换后面板正确显示、其余隐藏、新建模板按钮与客户列表存在 ✅
- 功能回归：改定金比例为 45 → `saveFeeSettings()` → localStorage 读到 45 ✅
- 手机端：工作台隐藏、入口列表显示、内容回到原页面、`openFeeSettings/openTemplates` 仍逐页跳转 ✅
- 尺寸切换：390 → 1440 时自动接管到工作台订单模板面板，无空白页 ✅
- JS 语法 OK；三份文件已同步（MD5: `716a623f0767d5192f903e5a0ce7bf49`）。
- 截图：`preview-desktop-settings-empty / -fee / -templates / -customers.png`。

### 备注
本轮按用户选择**只改设置类页面**；加单双栏、订单详情双栏、全局字号放大暂未做。

---

## 十七、v5 第十七轮：全页面电脑端布局改造（首页 / 加单 / 订单详情 / 排单）

### 背景
上一轮（十六）只把**设置类页面**改成了电脑端工作台，首页 / 加单 / 订单详情 / 排单仍是「手机页直接拉宽居中」，用户反馈「你并没有改好，无变化」。
经澄清：用户打开的是根目录 `designer-mp-prototype.html`，而上一轮**三份文件未同步**，原型仍是旧版；且即便在 build 里，主页面也确实没做桌面化。
本轮目标：**所有可见主页面都改成电脑端形态**（仅改布局，功能 / 交互 / 文案 / 字段 / 计算规则一律不动）。

### 改造清单（仅 CSS 布局 + 极少 DOM 结构，无逻辑改动）
1. **全局**：`.page > *` 内容最大宽度 1080px → 1240px；`@1440` 下 1200px → 1400px（放宽电脑端内容区）。
2. **首页（`#/home`）**：收入卡 `min-height:268px` 纵向居中；柱状图 `height:264px`；统计格 `.stat-grid` 改 `repeat(4,minmax(0,1fr))`、卡片 `padding:20px 18px` 圆角 14px（收敛底部空白）。
3. **加单（`#page-add`）**：桌面端 `grid-template-areas` 三行双栏——`ahead`(标题) / `asteps`(步骤条) / `abody`(表单) 在左，`aside`(实时摘要) 在右 360px 固定列；`.add-side` sticky 吸顶、白卡阴影。
   - 新增 `<aside class="add-side" id="addSide">` 容器；JS `calcAddSummary()` 复算应付/实付/定金/尾款并 `renderAddSide()` 渲染（企划名、步骤进度、费用明细、金额汇总）。
   - `goStep()` 末尾与 `initAddForm()` 末尾调用 `renderAddSide()`；`page-add` 上 `input/change` + `window.resize` 防抖（120ms）实时刷新。
   - 基础规则 `.add-side{display:none}`；`@media (min-width:1024px){.add-side{display:block}}`，手机端回退单栏且清空侧栏内容。
4. **订单详情（`#page-order-detail`）**：`#odBody` 改 `grid-template-columns:minmax(0,1fr) minmax(300px,350px)` 双栏；原卡片包进 `.od-main`，金额卡片移到 `.od-side` sticky 吸顶。
5. **排单（`#page-schedule`）**：`.cal-card` sticky 吸顶；隐藏手机表头 `.hs-thead`；`#hsList` 改两列 `grid repeat(2,minmax(0,1fr))`；`.hs-row` 去掉 `margin-top`、`grid-template-columns:minmax(0,1fr) 88px 62px`。
6. **设置工作台 bug 修复**：桌面端首次进入时三块分区（费用/模板/客户）曾被同时搬入 `#setPanel` 导致叠在占位提示下方。
   - 抽出统一显隐函数 `applySettingsVisibility(key)`：`SET_SECTIONS` 遍历设 `display`、`#setPlaceholder` 反相、`#setNav .set-nav-item` 高亮。
   - `syncSettingsWorkbench()` 调 `applySettingsVisibility(curSetSection)`，首次无 `curSetSection` 只显示占位；`openSettings()` 宽屏分支简化为 `if (isSettingsWorkbench()) syncSettingsWorkbench()`。

### 校验（puppeteer-core@23 + 真实 Chrome，全量 test3.js，0 报错）
| 检查项 | 结果 |
|------|------|
| 设置页首次进入 | 工作台 `grid`、fee/tpl/cust 均 `none`、占位 `flex`、三块已挂载到 `setPanel` ✅ |
| 加单页桌面端 | `display:grid`、右侧 `addSide` `display:block`、HTML 长度 1083 ✅ |
| 加单实时摘要 | 输入「测试企划 X」后侧栏即时刷新（企划名称行出现）✅ |
| 订单详情桌面端 | `display:grid`、列 `782px 350px`、`.od-main` 卡片 3 / `.od-side` 卡片 1 ✅ |
| 手机端加单页 | `display:block`、`.add-side` `display:none`、内容清空 ✅ |
- JS 语法 OK；**三份文件已同步**（MD5 `f20c794257a0a66475e4b41d5423d8ba`）。
- 截图：`shot-home.png` `shot-add.png` `shot-detail.png` `shot-schedule.png` `shot-set-empty.png` `shot-set-fee.png` `shot-mobile-add.png`。

### 关键教训
- **改完 build 必须同步根目录与 publish 两份副本**：用户实际预览的是 `designer-mp-prototype.html`，只改 build 不改副本 = 「无变化」。后续每轮收尾一律三份同步 + 校验 MD5。
- 桌面化一律走 `ID:not(.hidden)` 选择器 + `grid-template-areas` + `position:sticky`，避免与 `.page.hidden{display:none}` 冲突；功能逻辑零改动。

---

## 十八、v6 第十八轮：微信一键登录 + 云端同步 + 资料编辑

### 背景
用户要求加登录：微信一键登录、云端同步、登录后可改昵称/头像；未登录时把「自由插画师 · 接单中」换成「当前未登录，所有信息不会保存。」，登录后换成「当前已登录，已自动开启云端保存」。

### 实现（仅新增，未改任何原有功能/文案/计算）
1. **数据层**：复用现有 `loadStore/saveStore('user', …)`（同一 `huishi_workbench_v1`）。原型无真实微信后端，`wx.login()+getUserProfile` 以 localStorage 模拟「云端」——真机应改为 `wx.login()` 取 code → 后端换 openid，并把 user 写入微信云开发/自有后端。
2. **Me 页头部 HTML**：`.me-avatar/#meAvatar`、`.nm/#meName`、`.desc/#meDesc` 加 id；新增 `.me-login-row` 含「微信一键登录」按钮（微信绿 `#07C160`）+「编辑资料」按钮；`.me-top` 点击触发 `onMeTopClick()`（未登录→授权弹窗，已登录→编辑资料）。
3. **`renderUser()`**：按登录态切换头像（dataURL 图 / 预设渐变+首字 / 灰色人形默认）、昵称（未登录显示「未登录」）、状态文案与样式（`.desc.off` 琥珀警告色）、登录/编辑按钮显隐。
4. **授权弹窗** `openWechatLogin()`：微信图标 + 「绘事工作台 申请获取你的微信头像、昵称」+ 微信绿「微信一键登录」按钮。
5. **`doWechatLogin()`**：模拟登录→生成默认 user（昵称「微信用户」+ 随机预设头像 + openid）→落库→`renderUser`→若不在「我的」页则跳过去→toast。
6. **`openEditProfile()` / `saveProfile()`**：弹窗含昵称 input + 6 个预设头像网格 + 「上传图片」(FileReader→DataURL) + 保存/取消 + 退出登录；保存即落库并 `renderUser`。
7. **`logoutUser()`**：清 user → `renderUser` → 回未登录态。
8. **CSS**：`.wx-login-btn`、`.me-edit-btn`、`.wx-auth-icon`、头像网格 `.av-opt/.avatar-grid/.av-upload`、`.desc.off` 等，沿用薄荷绿/微信绿配色。

### 校验（puppeteer-core + 真实 Chrome，test5.js，0 报错）
| 检查项 | 结果 |
|------|------|
| 未登录 | desc=「当前未登录，所有信息不会保存。」、name=未登录、登录按钮显、编辑按钮隐、默认人形头像 ✅ |
| 授权弹窗 | 标题「微信授权登录」、含微信一键登录按钮 ✅ |
| 登录后 | desc=「当前已登录，已自动开启云端保存」、name=微信用户、登录隐/编辑显、预设头像、弹窗关闭 ✅ |
| 编辑资料 | 改昵称「木木工作室」+ 选预设头像 p4 → 保存后 name 更新、头像更新、localStorage.user.nickname=木木工作室 ✅ |
| 刷新持久 | reload 后仍为登录态、昵称保留（云端同步生效）✅ |
| 退出登录 | 回未登录态、登录按钮重现 ✅ |
| 手机端(390) | 未登录文案与登录按钮正常 ✅ |
- 三份文件已同步（MD5 `c745a5dddb70077eef316d2f924e2111`）。
- 截图：`shot-login-empty / -auth / -logged / -edit / -mobile.png`。

---

## Round 19（2026-09-15 13:55）：登录方式由微信一键登录改为邮箱登录

### 背景
用户要求：把登录方式从「微信一键登录」改成「邮箱登录」，其余需求（云端同步、登录后可改昵称/头像、未登录/已登录文案）保持不变。

### 实现（仅替换登录入口与校验逻辑，未改业务/文案/计算）
1. **登录入口**：Me 页「微信一键登录」按钮（微信绿 `#07C160`+微信图标）→「邮箱登录」按钮（蓝色 `#2D6CDF`+信封图标），`onclick` 由 `openWechatLogin()` 改为 `openEmailLogin()`。
2. **登录弹窗** `openEmailLogin()`：信封蓝图标 + 「使用邮箱登录 / 注册」文案 + 邮箱 input(`#emEmail`) + 密码 input(`#emPwd`) + 错误提示 `#emErr` + 「登录 / 注册」按钮 + 「首次使用的邮箱将自动创建账号」提示。
3. **校验/落库** `doEmailLogin()`：邮箱正则校验、密码至少 6 位；以邮箱为键查 `accounts` 账号库（`loadStore('accounts',{})`）——已存在则校验密码（错误提示「密码错误，请重试」），不存在则自动注册（默认昵称=邮箱前缀、随机预设头像、存密码）。登录态写入 `user`（含 email）。
4. **云端同步语义**：`saveProfile()` 保存资料时同步写入 `accounts[email]`，保证同一邮箱再次登录取回最新昵称/头像。
5. **其它**：`onMeTopClick()`、`openEditProfile()` 兜底由 `openWechatLogin()` 改为 `openEmailLogin()`；`.m-field` 样式扩展覆盖 `input[type=email/password]`；新增 `.email-login-btn / .email-auth-icon / .email-err / .email-hint` CSS；`openWechatLogin/doWechatLogin` 及全部微信相关代码已移除，无残留引用。

### 校验（puppeteer-core + 真实 Chrome，test6.js，0 报错）
| 检查项 | 结果 |
|------|------|
| 未登录 | desc=「当前未登录，所有信息不会保存。」、name=未登录、登录按钮「邮箱登录」、默认人形头像 ✅ |
| 邮箱弹窗 | 标题「邮箱登录」、含邮箱/密码输入框、「登录 / 注册」按钮、错误提示区 ✅ |
| 非法邮箱 | 提示「请输入有效的邮箱地址」✅ |
| 短密码 | 提示「密码至少 6 位」✅ |
| 新邮箱登录(自动注册) | desc=「当前已登录，已自动开启云端保存」、name=邮箱前缀(`artist`)、预设头像、弹窗关闭、账号落库 ✅ |
| 编辑资料 | 改昵称「木木工作室」+ 选预设头像 → 保存后 user 与 accounts 均更新 ✅ |
| 刷新持久 | reload 后仍登录、昵称保留（云端同步生效）✅ |
| 退出登录 | 回未登录态、登录按钮重现 ✅ |
| 同邮箱再登录 | 取回已编辑昵称/头像（云端同步语义）✅ |
| 密码错误 | 提示「密码错误，请重试」✅ |
| 手机端(390) | 未登录文案与登录按钮正常 ✅ |
- 三份文件已同步（MD5 `78f3be1736c4dd38f8e9b4da0d9a730d`）。
- 截图：`shot-email-empty / -modal / -logged / -edit / -mobile.png`。
- 说明：仍为设计原型，`accounts/user` 用 localStorage 模拟「云端」；真机改为邮箱+密码请求自有后端（校验/注册），并把 user/accounts 写入后端/云数据库，UI 层可不动。

---

## Round 20（2026-09-15 14:57）：云端自动保存 · 待交稿口径统一 · 小票外观独立页 · 下载小票图片

### 需求（用户 4 条）
1. 所有用户添加的数据信息都要保存云端。
2. 点击历史订单中的订单会跳转到新详情页；「待交稿」数量要同步「未完成」订单数。
3. 把「设置-费用设置」里的小票外观，移动到独立页面（设置一级项）。
4. 订单的清单打印中，添加「下载小票图片」功能，下载的图片与预览完全一致。

### 实现
1. **云端自动保存**（新增 `cloudSave()` / `cloudSaveDebounced(delay=500)`，紧随 `saveAll()`）
   - 此前订单/制品/分类/模板/客户/账号本就即时落库；**唯一缺口是费用设置**（`addFeeItem/updateFeeItem/deleteFeeItem/onDepositPctChange/selectTicketStyle` 只 `markFeeDirty`，必须点「保存」才写库）。
   - 现全部改为改动即持久化：编辑类用 `cloudSaveDebounced()`，删除/切换类用 `cloudSave()`；「保存」按钮保留（再次落库 + toast），并弹出右上角「已保存到云端」轻提示（`.cloud-saved-tip`，1.4s 自动消失）。
2. **待交稿口径统一**（`getDueTotal()` + `orderStatus()`）
   - `getDueTotal()` 改为与历史订单「未完成」筛选**完全同口径**：`(o.balance||0) > 0 && !['done','failed','scrapped'].includes(o.status)`。原口径按截稿日≥今天，会出现「首页待交稿数与未完成列表条数不一致」。
   - `orderStatus()` 非结束分支统一显示 **「未交稿」**（原来显示「进行中 / 加急中」）；加急仅保留配色（class `urgent`/`ongoing`）不变。
   - 结单 / 跑单 / 废稿 / 删除已有 `saveAll(); renderOrderDetail(); renderHistory(); renderCal();` 链路，计数随状态实时刷新。
   - 「点击历史订单 → 跳新详情页」为 v5 已实现（`openOrderDetail(id)` → `goTab('order-detail')`），本轮仅修数据口径。
3. **小票外观独立成页**
   - 从 `#feeBody` 移除 `#fc-ticket-style` 卡片；新增二级页 `#page-ticket-style`（含 `#ticketBody` 包 `#ticketStylePicker`）。
   - 「我的 → 设置」列表在「订单模板」后新增一级项「小票外观」（`onclick=openTicketStyle()`，右侧 tag 显示当前样式名 `#ticketStyleTag`）。
   - 电脑端工作台：`SET_SECTIONS` 增加 `{key:'ticket', bodyId:'ticketBody', pageId:'page-ticket-style'}`；`#setNav` 增加 `data-sec="ticket"` 导航项；`openSettingsSection('ticket')` 渲染选择器并刷新 tag；`resize` 跨断点也接管 ticket；费用设置导航说明去掉「小票样式」。
   - `pages` / `noTabPages` / `goTab` 二级页来源记忆均加入 `ticket-style`；`initFeeSettingsPanel()` 不再渲染选择器。
4. **下载小票图片**（新增 `downloadTicketImage(sourceEl, fileName)`，在加单步骤3 与 订单详情小票弹窗各加一枚「下载小票图片」按钮）
   - 原理：克隆小票 DOM（保留主题 class）→ 把 `input` 换成等值文本（消除输入框在图片中的不确定性）→ 套进 `<svg><foreignObject>`，**只内嵌小票相关 CSS**（`.ticket` / `.tk-*` + 全局 `*{box-sizing}`，见下方坑）→ `XMLSerializer` 序列化 → `Image` → `canvas`（2 倍分辨率，先铺小票外围背景色 `ticketSurroundBg`）→ `toBlob` 导出 PNG 下载。
   - 文件名：加单页 `小票_<企划名>.png`，详情页 `小票_<企划名/订单号>.png`（`safeFileName()` 过滤非法字符）。

### 关键坑（务必牢记）
- **blob: 图源 + foreignObject 会污染画布**：Chrome 下 `new Image(); img.src = URL.createObjectURL(svgBlob)`（SVG 含 `foreignObject`）→ `canvas.toBlob` 抛 `SecurityError: Tainted canvases may not be exported`。
  **改用 data URL**（`'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr)`）即可正常导出（实测 data URL `pxOk=true`，blob URL `pxOk=false`）。这是本轮最关键的排错点。
- **不要内嵌整份样式表**：整份 `<style>` 里的 `background-image:url("data:image/svg+xml,...")` 规则同样会污染画布；必须只挑 `.ticket`/`.tk-` 相关规则（外加全局 `*` 盒模型规则，否则小票会从 border-box 变 content-box 而布局错位）。
- **本地 `file://` 打开无法导出 PNG**：也会因画布受污染失败（故代码内置 SVG 回退：污染时改为下载 `.svg`，内容与预览一致）。验证/预览请走 `http://`。
- **headless 验证下载别用固定 sleep**：图片解码 + canvas 导出是异步的，需轮询等待；且可用「覆写 `HTMLAnchorElement.prototype.click` 捕获 blob」的方式取字节直接校验，免依赖浏览器下载目录。

### 校验（puppeteer-core@23 + 真实 Chrome，test7.js，本地 http 服务，14/14 通过）
| 检查项 | 结果 |
|------|------|
| 小票外观 设置一级项 / 工作台导航 / 已移出费用设置 / 落到 #ticketBody / SET_SECTIONS 含 ticket | ✅ |
| 点击小票外观 → 独立页 `#page-ticket-style` 可见且 4 个样式 | ✅ |
| 待交稿数 = 未完成订单数（均为 2）；`#dueTotal` 同步显示「2 件」 | ✅ |
| 未完成订单状态 = 「未交稿」（普通/加急均同）；已完成仍「已完成」 | ✅ |
| 费用设置改动即时落盘（改 ticketStyle + 加费项后 localStorage 已含） | ✅ |
| 订单详情小票下载 PNG（`小票_下载测试企划.png` 604×1048，305,908 B） | ✅ |
| 加单页清单打印下载 PNG（`小票_加单页测试.png` 764×1130，371,952 B） | ✅ |
| 无 JS 运行时错误 | ✅ |
- JS 语法 OK（`check-syntax.js`，115,545 字符）；**三份文件已同步**（MD5 `209c8d5a136fb3b6403c677a4c9f0e91`）。
- 截图：`preview20-settings-list.png`、`preview20-desktop-ticket.png`、`preview20-desktop-fee.png`、`preview20-ticket-modal.png`、`preview20-add-step3.png`、`preview20-mobile-settings.png`、`preview20-mobile-ticket.png`。
- 辅助脚本：`check-syntax.js`（语法校验）、`test7.js`（功能回归）、`shot20.js` / `shot20m.js`（截图）。

### 备注
- 「云端」仍为 localStorage 模拟；真机应把 `saveAll()` 落点替换为后端/云数据库写入，`cloudSave*` 作为统一入口即可整体切换。

---

## Round 21（2026-09-15 15:10）：新增 16 套小票外观样式

### 背景
用户提供了 16 张小票设计稿（`D:\#设计\惠民超市小票_16_邮票风.png` 等），要求把它们做成「小票外观」里可选的新样式。
（设计稿里的内容/字段与 App 不同——设计稿是超市小票，App 是约稿订单小票——因此本轮**只还原视觉风格**，不改小票的数据字段。）

### 改动（纯 CSS + 数组登记，未动任何业务逻辑）
1. **新增 16 个主题类**（`.ticket.ticket-*`），紧跟在原有 `.style-picker` CSS 之后，分 4 批写入：
   `stamp 邮票风`、`strawberry 草莓奶油`、`bear 小熊便利店`、`cat 猫咪超市`、`journal 手账胶带`、`nightmarket 深色夜市`、`thermal58 58mm热敏`、`thermal80 80mm热敏`、`tech 科技风`、`ancient 古风`、`darkgold 暗黑风`、`retro 年代感`、`magazine 杂志风`、`minimal 极简风`、`cyberpunk 赛博朋克`、`mint 清新薄荷`。
   每套覆盖：背景/圆角、正文字色、标题 `.tk-proj`、`.tk-head` 分隔线、`.tk-divider`、`.tk-section-label`、金额与价格色（`.tk-item .tk-sub`/`.tk-prod-price`/`.tk-payrow .tk-val`）、`.tk-payrow.big` 合计行；部分主题另用 `::before/::after` 加装饰（粉色圆角胶囊、圆耳、胶带、印章、荧光顶线、`SYS.RECEIPT` 芯片、五角星、渐变头图）。
2. **`TICKET_STYLES` 数组**由 4 项扩到 **20 项**（id / name / desc / cls），按「01→15、再 16」编号顺序排列，原 4 套（经典/简约现代/暖色卡片/复古票据）保留在最前。
3. **每个新样式配一个预览色块**（`.style-preview.sp-*`）。
4. **选择器改为响应式网格**：`.style-picker` 由纵向 flex 改为 `grid`，手机 1 列、`≥768px` 2 列（20 项不再是一条很长的一列）。

### 关键坑（新增，务必牢记）
- **复用 `.ticket::before/::after` 做装饰时，必须把定位反向属性置为 `auto` 并清掉背景**：
  基础规则 `.ticket::before` 设了 `left:0; right:0; height:8px; background-image:radial-gradient(...)`（锯齿边）。
  新主题只写 `right:14px` 而不写 `left:auto`，会因「left+right+width 同时存在时 right 被忽略」**跑到左边**；只写 `left:14px` 而不写 `right:auto` 且未给 width，会**被拉伸满宽**；不写 `background:none` 则**残留白色锯齿背景**。
  正确写法（三种都补）：`right:14px; left:auto; width:46px; height:46px; background:none;`
  本次因此修了 3 个主题：`tech`（芯片被拉满宽且高 8px）、`ancient`/`stamp`（印章跑左上 + 残留锯齿）。
- 新主题若用了 `::before/::after`，切记把**不需要的另一半** `display:none`，否则底部仍会出现白色锯齿边（浅色主题尤为明显）。
- 主题类名务必以 `.ticket.` 开头——导出图片的 `collectTicketCss()` 靠 `.ticket` 正则筛选样式规则。

### 校验（puppeteer-core + 真实 Chrome）
| 检查项 | 结果 |
|------|------|
| 小票外观页显示 **20** 个样式，均有预览色块 | ✅ |
| 16 个新样式名称齐全（草莓奶油…邮票风） | ✅ |
| 新样式（赛博朋克）在加单页小票生效（`.ticket-cyberpunk`） | ✅ |
| 加单页/详情页仍可下载 PNG（含新主题：764×1198） | ✅ |
| 其余 Round 20 回归项（云端自动保存 / 待交稿口径 / 小票外观独立页） | ✅ |
| 无 JS 运行时错误 | ✅ |
- JS 语法 OK（117,116 字符）；CSS 花括号平衡校验通过；**三份文件已同步**（MD5 `4648a1444dc8b57e43f016cda9a91459`，约 296KB）。
- 回归脚本 `test7.js` 共 **17/17** 通过。
- 逐样式渲染截图：`preview21-style-<id>.png`（16 张）+ 选择器整页 `preview21-picker-desktop.png`。
- 渲染脚本：`shot21.js`（把每套主题套在真实 `buildTicketHtml()` 数据上、脱离弹窗裁切后整张截图）。

---

## Round 22（2026-09-15 17:37）：「小票外观」页新增实时预览

### 背景
用户希望在「小票外观」页里能**直接看到小票长什么样**（截图红框处），而不是只能靠名称+色块猜。

### 改动
1. **HTML**：`#ticketBody` 内新增 `.tp-layout` 容器，包住两张卡——原来的样式列表卡（`#fc-ticket-style`）+ 新增的预览卡（`.ticket-preview-card`：`.tp-head` 标题「实时预览」/ 副标题 `#ticketPreviewSub` + `.ticket-preview-scroll` + `#ticketPreview`）。
   注意**不能**给预览元素用 `id="ticket"`（那是加单页小票的 id），故用 `#ticketPreview`。
2. **CSS**：`.tp-layout` 用 grid——手机单列且 `.ticket-preview-card { order:-1 }`（预览排在列表**上方**），`≥1024px` 两列 `minmax(0,1fr) 320px` 且预览卡 `position:sticky; top:0`；预览底衬 `#FAF7F2`，滚动容器 `max-height` 分别取 `62vh`（手机）/ `calc(100vh - 150px)`（桌面）。
3. **JS**：新增 `ticketPreviewOrder()`（优先取**最近一张有制品的真实订单**，无订单时用内置示例数据——保证预览永远完整）+ `renderTicketPreview()`（把 `.ticket.ticket-<当前样式>` + `buildTicketHtml(order)` 渲染进 `#ticketPreview`，并更新副标题提示是否为示例数据）。
   调用点 3 处：`selectTicketStyle()`（点样式即时刷新）、`openSettingsSection('ticket')`、`openTicketStyle()`。
4. **顺手修掉一个隐患**：原 `selectTicketStyle()` / `renderTicket()` 里换主题时用的是**写死的 4 个主题类名**（`ticket-classic/modern/warm/vintage`）逐个 remove。加到 20 套后会**残留旧主题类**导致样式串味。抽出通用 `applyTicketTheme(el, styleId)`（清掉所有 `ticket-*` 前缀类再加当前类）替换之。

### 关键坑（新增）
- **样式列表列数要用容器查询、不能用视口媒体查询**：`.style-picker` 原先按 `@media (min-width:768px)` 排 2 列；加入右侧 320px 预览栏后，列表列被挤到 ~368px，2 列会窄到把中文压成竖排（实测截图确认）。
  改为 `#fc-ticket-style { container-type: inline-size; }` + `@container (min-width:430px) { .style-picker { grid-template-columns: repeat(2,minmax(0,1fr)) } }`——列表自身够宽才两列，被挤窄自动回落单列。**列数应跟随容器宽度而非视口宽度**，这在「主区+侧栏」类布局里是通病。
- `.set-panel .pg-body { display:block }` 存在，故**不要**直接给 `#ticketBody` 设 `display:grid`（ID 选择器会赢，但语义冲突）；改成在内部套一层 `.tp-layout` 做 grid，互不干扰。

### 校验（puppeteer-core + 真实 Chrome，shot22.js 7/7）
| 检查项 | 结果 |
|------|------|
| 预览区渲染出真实小票（11 行内容） | ✅ |
| 桌面端两栏（`368px 320px`） | ✅ |
| 点击样式后预览实时切换（classic → cyberpunk） | ✅ |
| 连续切换两次不残留旧主题类（最终 `ticket ticket-thermal80`） | ✅ |
| 手机端预览排在列表上方（order=-1，max-height 生效） | ✅ |
| 无 JS 运行时错误 | ✅ |
- 回归 `test7.js` 仍 **17/17**；导出 PNG 尺寸未变（604×1048 / 764×1198），说明预览 CSS 未污染导出。
- JS 语法 OK；CSS 花括号平衡；**三份文件已同步**（MD5 `c8698d02264fe5c3cf27bed4a9f8c96e`，约 300KB）。
- 截图：`preview22-desktop-preview.png`、`preview22-desktop-preview-cyberpunk.png`、`preview22-mobile-preview.png`；脚本 `shot22.js`。

---

## Round 23（2026-09-15 17:56）：修复费用设置面板「中间缺一块」

### 问题
电脑端「设置 → 费用设置」两列排布，出现明显空洞（用户截图反馈）：
1. **第 3 行只有「公开费」一张卡 → 右半边整块空着**；
2. 「定金设置」比同行「手续费设置」矮，其下方留出一段空白。
根因：`#feeBody` 用的是 `display:grid; grid-template-columns:repeat(2,1fr)`——**grid 的行高按行内最高卡片对齐**，矮卡片下方必然留空；5 张卡片 + 1 个通栏保存条共 6 项，无法两两配对。

### 修复
1. **两列 grid → 多列布局（`columns:2`）**：两列各自独立向下堆叠，卡片高度不齐也不会互相留空。
   - HTML：把 5 张 `.fee-card` 包进 `.fee-grid`；
   - CSS（≥1024）：`#feeBody{display:block}`、`.fee-grid{columns:2;column-gap:16px}`、`.fee-grid > .fee-card{break-inside:avoid;margin:0 0 16px}`。
2. **保存按钮放进右列末尾**：保存条也移入 `.fee-grid`，宽屏改为**白卡样式、`position:static`**（`.fee-grid > .fee-save-bar{...}`），补齐右列下方的空缺；手机端仍是原来的通栏吸底（基础规则未动）。
3. 顺手去掉「公开费」卡片上的**内联** `style="margin-bottom:24px"`——内联样式优先级高于桌面端 `margin:0 0 16px`，会在多列里多留 24px。

### 关键坑（新增）
- **grid 是「行对齐」，不是「列对齐」**：两列里卡片高度不等时，矮卡片下方一定留洞。要「卡片紧贴、各自堆叠」就用 **CSS 多列（`columns` + `break-inside:avoid`）**，或显式两条 flex 列。**`align-items:start` 只能让卡片不被拉伸，不能消除空洞。**
- **内联 style 会盖掉桌面端覆盖规则**：`style="margin-bottom:24px"` 让 `.fee-card{margin:0 0 16px}` 失效。同一元素要在多处复用不同间距时，别用内联 margin。
- 多列布局的列内元素**不要用 `position:sticky`/`left:0`**（列盒不是合适的包含块）：宽屏保存条因此改静态；手机端（非多列）保持吸底不受影响。

### 校验（puppeteer-core + 真实 Chrome，shot23.js 8/8）
| 检查项 | 结果 |
|------|------|
| 桌面端两列（`columnCount=2`，两个列位 left=544 / 904） | ✅ |
| **同列卡片之间无空洞**（逐列校验相邻卡片间距，均 = 16px） | ✅ |
| 保存块落在某一列内（宽 344 < 网格 704，不再通栏） | ✅ |
| 保存块是其所在列的最后一块 | ✅ |
| 手机端仍单列、左边距 20px、纵向递增、无横向溢出 | ✅ |
| 无 JS 运行时错误 | ✅ |
- 实测卡片分布：左列 定金(130)→手续费(279)→用途(263)，右列 加急(209)→公开(209)→保存块(77)，零空洞。

---

## Round 24（2026-09-15 18:06）：模板字段支持备注（不限字数 · 浅色小字）

### 需求
「新建/编辑订单模板」时，可给**每个字段**加一条备注，不限字数，备注用**浅色小号字体**显示。

### 实现
1. **编辑器**（`addTplFieldRow`）：每个 `.tpl-fld` 在字段名一行下方新增
   `<textarea class="tpl-note" rows="1" placeholder="备注（选填）：给客户的填写说明，不限字数" oninput="autoGrowNote(this)">`。
   - 用 `<textarea>` 而非 `<input>`：不限字数、天然多行；**不设 `maxlength`**。
   - 新增 `autoGrowNote(el)`：`el.style.height='auto'; el.style.height=max(30, el.scrollHeight)+'px'`，随内容增高，不出现内部滚动条；**新增行与回填已有备注时都要调用**（回填在后，否则长备注只显示一行）。
   - 样式：白底、无边框、`resize:none`、`overflow:hidden`、`font-size:11.5px`、`color:#A9A192`（浅色）、`line-height:1.6`。
2. **加单页**（`renderCustomFields`）：字段标题下方插入 `<div class="fl-note">备注</div>`，`font-size:11px; color:#B3ACA0; white-space:pre-line`（保留换行）。
3. **存储**：`saveTemplate()` 读取 `.tpl-note` 值（仅 `trim()` 首尾空白），写入 `fields[].note`；模板结构变为 `{ key, label, type, required, options, placeholder, note }`。旧模板无 `note` 时按空处理，无需迁移。
4. **顺手修掉一个既有隐患**：`saveTemplate()` 原本每行都 `key: genId()`，**每次保存都会重新生成字段 key**，导致「改过模板的老订单」按 key 回填值全部失效。现改为行上挂 `row.dataset.key = f.key`，保存时复用 `r.dataset.key || genId()`，**重存模板不再改变字段标识**。

### 校验（puppeteer-core + 真实 Chrome，shot24.js 21/21）
| 检查项 | 结果 |
|------|------|
| 每个字段行都有备注框、`TEXTAREA`、无 `maxlength` | ✅ |
| 备注为小号浅色字（11.5px / `rgb(169,161,146)`） | ✅ |
| 117 字长备注完整接受、保存、回填、落 localStorage | ✅ |
| 备注框随内容自动增高（32px→106px），无内部滚动条 | ✅ |
| 加单页备注显示在字段标题下方（11px / `rgb(179,172,160)` / `pre-line`） | ✅ |
| 重存模板不改变字段 key | ✅ |
| 手机端（390px）弹窗不横向溢出、字段名/类型/必填/删除同一行 | ✅ |
| 无 JS 运行时错误；原 `test7.js` 仍 17/17 | ✅ |

### 关键坑（新增）
- **`<textarea>` 自动增高必须放在 DOM 插入之后**；且**回填值后要再调用一次**，否则已有长备注只渲染一行。
- **给字段行加内容后，窄屏 flex 会重排**：`.tpl-fld-row .tpl-fld-label{min-width:100px}` 在 390px 下会把「删除 ×」挤到第二行；已在 `@media(max-width:430px)` 内把 `min-width` 降到 60px、`flex-basis` 70px，并给 `.tpl-fld-type` 设 `max-width:96px`。
- 模板字段的 `key` 是「订单已填值」与「模板字段」的对应关系，**保存模板时绝不能无条件重新生成**。
- 备注渲染统一走 `escapeAttr()`（仅转义 `"` 与 `<`），与全站其他文案一致，可防标签注入。
- 回归 `test7.js` 仍 **17/17**；JS 语法 OK；CSS 花括号平衡；div 开/闭 765/765 平衡。
- **三份文件已同步**（MD5 `ac749f631fe55dd7dd65457cc3245ff1`，约 301KB）。
- 截图：`preview23-fee-viewport.png`（修复后）、`preview23-fee-body.png`、`preview23-mobile-fee.png`；脚本 `shot23.js`。

## Round 25（2026-09-15 19:17）：全站新增手绘线条插画（小猫咪 / 花花等）

### 需求
给「绘事工作台」整体加手绘风线条插画（小猫咪、花花之类），与奶油色 `#FAF7F2` / 柔和绿 `#5FA47C` 主题协调；覆盖首页、各页标题、我的页、登录弹窗、空状态，营造可爱手绘氛围。

### 实现（纯内联 SVG，零外部依赖）
1. **doodle CSS**：`.doodle{display:inline-block; vertical-align:middle; line-height:0; pointer-events:none; overflow:visible; fill:none; stroke:currentColor; stroke-width:5.5; stroke-linecap:round; stroke-linejoin:round}`；配色类 `.sage/.green/.brown/.pink/.ink/.white`（用 `color` 控制，`currentColor` 描边）；标题区 `.doodle{margin-left:9px}`；`.home-greet`/`.me-header{position:relative}` 供 absolute 装饰定位。
2. **隐藏 sprite**：`<div class="stage">` 后插 `<svg style="display:none"><defs>`，内含 **9 个** `<symbol id="dz-*" viewBox="0 0 100 100">` 手绘描边路径 —— `dz-cat`(站猫) / `dz-catsit`(坐猫) / `dz-paw`(爪印) / `dz-flower`(花) / `dz-sprig`(枝叶) / `dz-star`(星) / `dz-heart`(爱心) / `dz-cloud`(云) / `dz-butterfly`(蝴蝶)；页面各处用 `<use href="#dz-...">` 复用。
3. **24 处装饰落地**：首页问候右上角猫(green) / 收益卡内右下猫(white .5) / 排单标题猫(green)+仓库标题枝叶(green) / 新建订单爪印(brown)+制品清单花(pink)+清单打印爪印(brown) / 我的页右上花(pink .7) / 设置标题枝叶(green) / 5 个设置子页+桌面导航（费用星brown/模板猫green/客户爱心pink/小票花pink/订单详情猫green） / 4 个空状态（排单日坐猫brown/历史搜索爪印brown/客户空花pink/仓库空花pink 替换原灰盒/模板空坐猫green） / 登录弹窗标题猫(green)。

### 校验（puppeteer-core@23 + 真实 Chrome，verify-doodles.js）
| 页面 | 可见 doodle 数 | 页面 | 可见 doodle 数 |
|------|------|------|------|
| 首页 home | 2 | 设置 settings | 5 |
| 排单 schedule | 3 | 费用 fee | 5 |
| 我的 me | 1 | 模板 tpl | 6 |
| 新建 add | 1 | 客户 cust | 6 |
| 仓库 warehouse | 1 | 小票 ticket | 5 |
| 客户页 customers | 6 | 模板页 templates | 6 |
| 登录 login | 6 | | |
- 唯一控制台报错仅 `favicon.ico 404`（无害）；`check-syntax.js` 语法 OK；CSS/div 平衡未变。
- **三份文件已同步**（MD5 `ae3c5ce0cfaac6c49bf35cab99b380f1`，约 310KB）。
- 截图：`preview-doodle-*.png`（逐页）；脚本 `verify-doodles.js`。

### 关键坑（本轮踩过，重要）
- **对 ~310KB 大文件连续并行 Edit 会静默丢失部分改动**（约 8 处标题+空状态没落地，verify 才发现）。必须**单条 Edit 逐个应用**，落地后再 `grep` 复核 `class="doodle` 数量是否等于预期。**这是编辑超大单文件 HTML 的铁律，下次直接照做。**

## Round 26（2026-09-15 19:48）：背景手绘插画层（修正 Round 25 的「标题图标」误解）

### 需求澄清
Round 25 把插画做成了标题/卡片旁的小图标，用户更正：**插画要加到页面背景**做整体氛围。经确认选项：保留标题图标 **+** 新增背景层（用户选此项）。

### 实现
1. **背景层容器**：`.stage` 内首个子元素加 `<div id="bg-doodles" aria-hidden="true">`，CSS `#bg-doodles{position:absolute; inset:0; z-index:0; pointer-events:none; overflow:hidden}` —— 垫在内容之下、不随页面滚动（`.stage` 本身 `overflow:hidden`），不引发滚动条。
2. **13 个散布插画**：复用 Round 25 的 9 个 `<symbol>`（dz-cat/flower/sprig/catsit/paw/butterfly/star/heart/cloud），以 `<svg class="bg-doodle ...">` 散布在四周留白处（top/left/right/bottom 百分比），尺寸 50–92px。CSS `.bg-doodle{position:absolute; fill:none; stroke:currentColor; stroke-width:4.5; stroke-linecap/linejoin:round; opacity:.17}` + 配色类 `.sage/.green/.brown/.pink/.ink`。
3. **为什么只在留白透出**：`.page` 透明、卡片有实底 → 插画只在卡片间隙/页边留白处可见，绝不遮挡文字；`elementFromPoint` 在 doodle 中心返回的是 `tab-bar` 等真实内容节点（非 doodle 自身），证明层级正确。

### 校验（puppeteer-core@23 + 真实 Chrome，verify-bg.js）
| 项 | 结果 |
|------|------|
| `#bg-doodles` 存在、position:absolute、z-index:0、overflow:hidden | ✅ |
| 13 个 bg-doodle 全部可见（尺寸 50–92px、opacity .17、颜色正确） | ✅ |
| 移动端（390px）13/13 可见 | ✅ |
| 层级：doodle 在内容之下（elementFromPoint 返回 tab-bar） | ✅ |
| 回归：INLINE_DOODLES 20（静态）+ 动态空状态/登录弹窗，无丢失 | ✅ |
| 控制台仅 favicon 404（无害）；`check-syntax.js` 仍 OK | ✅ |
- **三份文件已同步**（MD5 `7170f8d224055e871b64da84983b6b12`，约 311KB）。
- 截图：`preview-bg-home.png` / `preview-bg-mobile.png`；脚本 `verify-bg.js`。

## Round 27（2026-09-15 20:35）：新建订单「基本信息」置顶

### 需求
「新建订单」步骤1里，把「基本信息」组移到最上方。

### 现状与实现
- 原 step1 顺序：订单模板(`.tpl-bar`) → 自定义字段(`#customFields`) → **基本信息** → 费用信息 → `.add-foot`。
- 用 node 脚本 `reorder-basicinfo.js` **原子搬移**整块（`<!-- 基本信息组 -->` 到 `<!-- 费用信息组 -->` 之前）插到 `#step1` 开标签之后 → 新顺序：**基本信息 → 订单模板 → 自定义字段 → 费用信息 → 底部按钮**。
- 纯 DOM 顺序调整，**字节数不变**（303164），**未改任何 JS**：表单输入都用 `getElementById` 取值，与 DOM 顺序无关。

### 校验（puppeteer-core@23 + 真实 Chrome，verify-addorder.js）
| 项 | 结果 |
|------|------|
| `#step1` 首个子元素 = 基本信息 form-group | ✅ |
| step1 顺序 = 基本信息 / tpl-bar / customFields / 费用信息 / add-foot | ✅ |
| 视觉：基本信息 y(111) < 订单模板 y(688) | ✅ |
| 输入框仍可用（`oName` 可填、`oPlatform`/`oRemark` 存在） | ✅ |
| 回归 `test7.js` **17/17**；`check-syntax.js` OK | ✅ |
| 控制台仅 favicon 404（无害） | ✅ |
- **三份文件已同步**（MD5 `1ac4bec37048abad415c2527a0eb5b56`，约 311KB）。
- 截图：`preview-addorder-desktop.png` / `preview-addorder-mobile.png`；脚本 `verify-addorder.js`。

### 环境坑（本机，重要）
- 默认 shell PATH 下 coreutils（`ls`/`tail`/`grep`/`cp`/`md5sum`）**不可用**；`export PATH="/c/Program Files/Git/usr/bin:$PATH"` 也不稳（`cp`/`grep` 会 not found）。
- **正确做法：用 node 绝对路径 + node 内置 `fs`/`crypto` 完成「复制三份文件 + 计算 MD5」**，不依赖 shell 工具，最稳。

---

## Round 28（2026-09-16 13:05）：编辑模板的字段支持自行排序（拖动 + ▲▼）

### 需求
用户：「添加好的字段可以自行排序」——「编辑模板」弹窗里已添加的字段要能调整前后顺序。

### 现状与实现（只改 DOM 顺序，不碰数据层）
- 字段行由 `addTplFieldRow()` 动态生成到 `#tplFields`；`saveTemplate()` 按 **DOM 顺序** 读取 → 只要 DOM 顺序可调，保存后顺序自然生效，**数据结构无需改动**。
- 新增排序控件 `.tpl-fld-tools`：拖动手柄 `.tpl-fld-grip`（6 点 SVG，`touch-action:none`）+ 上移/下移 `.tpl-fld-mv.up/.down`（▲▼）。
- 拖动用 **指针事件 pointerdown/move/up**，鼠标与触屏通用：拖动时克隆 `.tpl-fld-ghost`（`position:fixed`，跟随指针），原行加 `.slot` 半透明占位并实时在兄弟节点间 `insertBefore`，落点一目了然；抬手后清理，无残留。
- 抖动阈值 4px：轻点手柄不产生拖影、不改顺序。
- `updateTplFieldTools()`：首行禁用 ▲、末行禁用 ▼（`.off`）。
- 弹窗提示补一句：「拖住左侧手柄或点 ▲▼ 可调整字段顺序」。

### 关键坑（新增，重要）
- **弹窗内字段行可用宽度只有 292px**（卡片 312 − 左右 padding 20）。初版把 60px 控件放**行首**，直接把「必填」从第一行挤到第二行，破坏原版式。
- **正解：控件放行尾**（`必填` 之后、`删除×` 之前）→ 第一行完全恢复原样（名称 159px + 类型 + 必填），第二行变成 `[⠿▲▼][×]`，桌面/手机视觉仍为 **2 行**（与改动前一致）。
- 教训：**在窄容器里加控件，先量可用宽度，再决定插在哪个位置**；插在行首等于挤压主输入框。

### 校验（puppeteer-core@23 + 真实 Chrome，verify-tplsort.js）
| 项 | 结果 |
|------|------|
| 4 个字段各带 1 手柄 + ▲▼；首行 ▲ 禁用、末行 ▼ 禁用 | ✅ |
| 点 ▼：`书名` 下移一位 → `英文标题,书名,作者,原IP` | ✅ |
| 点 ▲：末行 `作者` 上移一位 | ✅ |
| 真实鼠标拖拽：首行拖到末尾 → `书名,原IP,作者,英文标题` | ✅ |
| 拖动中出现 1 个 ghost(fixed) + 1 个 slot；抬手后 0 残留 | ✅ |
| 轻点手柄：顺序不变、无 ghost/slot 残留 | ✅ |
| 保存后顺序落盘（内存 + localStorage `huishi_workbench_v1`） | ✅ |
| 刷新页面重开编辑器：顺序仍为新顺序 | ✅ |
| 加单页自定义字段按新顺序渲染（`#customFields [data-cf]`） | ✅ |
| 版式：桌面/手机均 2 行，字段名输入框 159px / 129px | ✅ |
| 回归 `test7.js` **17/17**；`check-syntax.js` OK（123563 字符） | ✅ |
- **三份文件已同步**（MD5 `4789bf4cdc36564b549d91d8767820f4`，约 317KB）。
- 截图：`preview-tplsort-editor.png`（编辑器）/ `preview-tplsort-addorder.png`（加单页）/ `preview-tplsort-mobile.png`；脚本 `verify-tplsort.js`。

---

## Round 29 · 模板字段新增「单选题 / 多选题」

### 需求
「编辑模板」弹窗里字段类型下拉原本只有 单行文本 / 多行文本 / 数字 / 日期 / 下拉选择，需要补上 **单选题（radio）** 与 **多选题（checkbox）**，并且从模板编辑一直打通到填写端（加单页 + 客户问卷页）。

### 涉及文件与改动点
| 文件 | 改动 |
|---|---|
| `build/index.html` | ① 类型下拉加 `<option value="radio">单选题` / `<option value="checkbox">多选题`；② 新增 `needTplOptions(type)`（select/radio/checkbox 都需要候选项）与 `tplOptsPlaceholder(type)`，`.tpl-fld-opts` 显隐与占位文案随类型变化；③ `onTplTypeChange` 改用上述判断；④ `saveTemplate` 对选择类解析选项，**少于 2 项直接拦截**并 toast；⑤ `renderCustomFields` 新增 radio/checkbox 分支；⑥ `getCustomFieldsData` 改为按 `.form-stack` 顺序收集（先组后单值）；⑦ `.mb-sub` 提示文案更新；⑧ 新增 `.choice-list / .choice-item / .choice-empty` 样式 |
| `build/client.html` + `publish/client.html` | 客户问卷页同样支持：`renderTplFields` 加 radio/checkbox 分支（`.choice-list` + `.ch-item`），`submitQuestionnaire` 的 `customFields` 收集改为按 `.fld` 顺序分组取值 |

### 数据结构（向后兼容，无迁移成本）
字段对象仍是 `{ key, label, type, required, options, placeholder, note }`，只是 `type` 增加了 `radio` / `checkbox` 两个取值，`options` 复用同一字段（逗号分隔存储）。旧模板不受影响，未选类型的字段按原逻辑渲染。

### 交互与取值约定
- 候选项用 **英文逗号分隔**填写，与「下拉选择」一致；单选/多选要求 **≥2 项**，否则保存被拦截并提示「「XX」是单选题，请至少填写 2 个候选项（用逗号分隔）」，同时把焦点移到该输入框。
- 渲染：同组 radio 共用 `name="cf-<key>"`（浏览器原生互斥）；组容器带 `data-cf-group`（字段 key）与 `data-cf-multi`（1=多选）。
- **取值：单选取选中项；多选按勾选顺序用「、」连接**（如 `厚涂、水彩`）。此约定后台与客户页保持一致，订单详情/编辑回填都按同一分隔符拆分。
- 自绘控件：`appearance:none` + 18px 圆角框，选中后 checkbox 打白色对勾、radio 显示实心圆点，主色 `#5FA47C`，与全站奶油/柔绿主题一致（未用原生控件外观）。

### 关键坑（新增，重要）
- **改动多分支 if/else 渲染时不要整段覆盖**：本轮改 `client.html` 的 `renderTplFields` 时，一次 Edit 把 `f.type === 'select'` 分支整体替换掉，导致「下拉选择」类型失效，随即补回。**正确做法：把新分支插在既有分支之前/之后，只新增不覆盖**，改完立刻 `grep` 确认每个分支都在。
- **测试脚本坑**：`closeModal()` 只移除 `#modalMask` 的 `show` 类、**不移除 DOM**，判断「弹窗是否关闭」必须看 `classList.contains('show')`，不能用 `!!document.getElementById('tplFields')`。
- **测试脚本坑**：页面是内部滚动容器，视口外的选项用 `p.mouse.click(坐标)` 点不到。**先 `scrollIntoView({block:'center'})` 再取 `getBoundingClientRect()` 算中心点**。
- **断言坑**：同一 flex 行的控件因垂直居中会有 1~3px 的 `top` 差异，判断「几行」要做容差归并（>6px 才算换行），否则把 1 行算成 4 行。

### 校验（puppeteer-core + 真实 Chrome，`verify-choicefield.js`）—— **43/43 全过**
| 组 | 覆盖项 | 结果 |
|---|---|---|
| A | 下拉含单选题/多选题、类型回填、候选项显隐与占位文案、切类型即时响应、字段行仍为 2 行 | ✅ 7/7 |
| B | 选项 <2 项被拦截（弹窗不关 + toast 文案）、修正后保存、类型/选项/必填落盘、写入 localStorage | ✅ 4/4 |
| C | 填写端单选/多选各 1 组、选项数与文案、`data-cf-group`/`data-cf-multi`、同组 radio 同名、初始无勾选 | ✅ 6/6 |
| D | **真实鼠标点击**：单选互斥、可改选、多选多勾、勾选态为自绘绿块（18×18, `appearance:none`） | ✅ 4/4 |
| E | 取值：单选取选中值、多选 `厚涂、水彩`、收集顺序与模板一致、label 齐全 | ✅ 4/4 |
| F | 单选必填未选 → 拦截提交且订单不入库 | ✅ 1/1 |
| G | 切步骤/被拦截后勾选不丢失、提交落盘、**订单详情展示单选/多选值** | ✅ 4/4 |
| H | **编辑订单回填**（`prefillOrderForm` 真实链路）单选/多选/文本均正确 | ✅ 3/3 |
| I | 重开模板编辑器：类型与候选项仍在 | ✅ 1/1 |
| J | 移动端 390×844：2 组、无横向溢出、选项均可点（无 0 尺寸） | ✅ 2/2 |
| L | **客户问卷页**：渲染、选项文案、多选多勾、单选必填拦截（alert）、提交成功、取值落盘正确 | ✅ 6/6 |
| K | 无 JS 报错 | ✅ 1/1 |
- 回归：`test7.js` **17/17**；`verify-tplsort.js` 全过（排序/版式未受影响）；`check-syntax.js` OK（125695 字符）；`client.html` 内联 JS 语法 OK。
- **文件已同步**：`build/index.html` = `designer-mp-prototype.html` = `publish/index.html`（MD5 `4cf7d954cd4bb4ed51d25a74ab2fdee4`）；`build/client.html` = `publish/client.html`（MD5 `c05432ec2b08133816ba84620dbe773a`）。
- 截图：`preview-choice-editor.png`（模板编辑器）/ `preview-choice-add.png`（加单页填写端）/ `preview-choice-mobile.png`（手机）/ `preview-choice-client.png`（客户问卷页）；脚本 `verify-choicefield.js`。

> 注：客户问卷页共有 **3 份**：`client.html`（根目录预览副本，新增）、`build/client.html`（源文件）、`publish/client.html`（发布副本），三份 MD5 一致 `c05432ec2b08133816ba84620dbe773a`。根目录补这份是为了让 `designer-mp-prototype.html` 里点「客户问卷链接」生成的地址能直接打开（此前根目录无此文件会 404）。
