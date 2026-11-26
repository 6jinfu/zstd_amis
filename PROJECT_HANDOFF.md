# 人才发展原型项目交接

2026-11-26 下一期五大功能与自检优化落地（优先于下方旧边界）：
1. **无等级能力指标**：`app/indicator-data.js`、`app/indicator-import.js`、`app/vocabulary.html` 支持为能力指标配置“分级指标（1–10 级）”或“无等级指标”（导入 1–10 级列全空自动识别为无等级）；补齐管理端标准编辑器与 AI 草稿 L1–L10 等级下拉；无等级能力在人才标准展示“不分级”、不计入雷达轴，360 评估按指标定义出题，人才库能力导入要求留空等级＋必填得分（0–999），档案/对比展示原始分且不计算等级差距。同时修复指标库类别管理与删除持久化、LAN HTTP `UI.uid` 兼容、`localStorage` 安全解析及 `.conclusion` 禁令单边色条清理。
2. **人才标准模板**：`app/settings.html#templates`、`app/settings-editor.js`、`app/talent-settings-data.js` 支持维护多套标准模板（自由勾选五类维度，至少 1 项，允许不含能力要求）；新建标准与标准 AI 帮建选择模板后生成 `enabledDimensions` 快照，修改模板不影响存量标准；无能力维度的标准在 360 评估与学习方案中自动拦截，下游详情/档案/对比/学员端按快照裁剪未启用维度。
3. **学习方案合一与四步 AI 帮建学习资源**：`app/learning-plan.html` 合并原设计页成为唯一正式页（`app/learning-plan-design.html` 重定向），统一按 `[positionId, standardId]` 保存在 `talent-learning-plan-design-v1`，移除旧单岗位扁平表与前后测入口；保留自定义阶段分组并将 `capabilities`（1..N）绑定到每条课程/项目/实践活动，支持四步 AI 配课抽屉（含无匹配现成课程时的实践承接显式说明与卡片级能力编辑）。
4. **人才中心深化**：`app/talent-dashboard.html` 升级为“组织视角（合并关键岗位储备）/ 群体视角 / 个人视角”三视图；人才档案新增只读“用户履历”分区，按 UC 真实截图字段展示工作经历、参与记录、授课记录与培训协议；`app/talent-list.html` 新增 `app/talent-ai-finder.js` 一步式“AI 帮找人才”抽屉，按“满足 X/Y 项”结合评鉴证据、盘点分类与 UC 履历推荐候选人并跳转人才对比。
5. **学员端 Web + H5 适配（`student-client/`）**：“人才画像”原样保留未动；`student.html` 与 `mobile/` 岗位详情同步适配标准模板裁剪、Web 双栏/H5 单列自适应 L1–L5/L1–L10 雷达与无等级能力展开、动力/潜力特质释义卡，以及阶段分组、能力胶囊筛选与资源级关联能力标签展示的学习方案。当前 AI 帮建/寻访、UC 履历及跨端数据仍为本地确定性规则与静态演示，未调用收费模型，未接通正式后端。

2026-11-19：按用户反馈“AI帮建能力要求均为L1”，仅优化1127版Dify工作流生成提示词：综合管理员排序、重要性评分、岗位职责以及能力实际配置的等级和指标描述判断各项要求等级，不默认首级，不将重要性分机械映射为等级；保留原输出协议及校验。新版DSL及说明见 `deliverables/20261119-standard-ai-levels/`。尚未在目标Dify导入或测试真实模型，不能保证提示词调整已解决实际全为L1问题；原型下拉仍限L1–L5，本轮未修改页面、后端，未调用收费模型。

2026-11-18 原型适配：系统设置隐藏“人才标准维度”入口，原型固定开放五类人才标准内容；保留“能力指标维度自定义”Tab，本地保存仍为演示，胜任力管理参考功能及新接口尚未接入。人才标准、能力指标、人才库能力、盘点绩效／外部测评及图谱逐项能力导入移除数据预览和额外确认；本地校验通过即更新相应演示数据，失败可下载报错Excel。正式接口、后端写入及正式报错文件尚未接通，盘点和图谱结果仍非真实计算。浏览器验证设置页、人才标准错误及人才库能力错误／成功；28项相关Node测试通过；飞书原型状态说明同步并回读至 revision 198。

2026-11-18：用户澄清1127期需求：人才标准维度自定义暂不做，后续考虑模板；系统设置“能力指标维度自定义”Tab保留，技能、素养、知识文案自定义功能参照胜任力管理系统设置，技术需新写接口，不擅自假定数据同步方式。各导入按现有规范上传、校验，有问题提供报错Excel，不设置导入预览。飞书1127文档已更新并回读至 revision 197；原型后续适配见上条。

2026-11-17：用户要求人才标准 AI 帮建暂时隐藏“同类岗位”。原型应用范围仅显示“仅当前岗位”和“暂不关联”；更新已有标准仍保留原应用范围。1127版 Dify 工作流的应用范围组件同步不返回 similar 选项，底层相似岗位处理保留以备恢复；工作流尚未在目标 Dify 导入或真实模型测试。飞书1127文档已同步并回读 revision 180，新版YML附件下载后与本地逐字节一致，旧附件标注为追溯版本。

2026-11-16 最新补漏与AI工作流交付（优先于下方旧边界）：飞书1127明细已补回25格全部名称、说明、发展建议，恢复分档默认比例、20字名称限制、结果联动、项目选择规则及此前记录的标准导出／图谱逐项能力导入／发展序列导入导出，后三类保持未完成或待核对。原有22张截图、五份Excel全部保留，新增两张AI流程图。用户最新确认：先复用平台已有能力，无合适项再建议新能力；用户确认后同时新增指标库／能力指标默认“AI 生成”类别；已有能力定制等级描述仅存当前标准，保留更新以新描述更新同一能力，其他能力保留。Dify已生成schema3.0、23节点29连线、10份完整请求及16项离线回归；源码dify/talent-standard-ai-assistant-v3/，旧版归档dify/_archive/20261026/。工作流只返回检索请求/保存计划，真实平台检索、建类、新指标与标准保存、页面扩展字段、目标Dify导入及真实模型尚未接通；本轮无收费调用。当前PRD V1.127，飞书回读revision172；维护资料deliverables/1127-ai-workflow-20261116/。最后用户确认飞书人员能力模板保留单表版，已原样同步app/templates/talent-person-ability.xlsx和outputs/1127-update/，移除校验提示对不存在填写参考表的引用；不补回该表。其余页面未改。

2026-11-16 本轮1127更新（本条优先于下方同日旧状态）：用户确认交付为原型、模板及飞书PRD，解析、校验及业务规则说明写飞书，不继续推进本机文件选择上传实测。标准编号改为默认当前时间戳文本、可自定义、最多20字符；历史标准补号，复制生成新号；导入只新增，已有编号拒绝。能力指标按附件改为横向最多十级、一行一能力，名称＋类别新增或覆盖更新；新版设置名称为“能力指标维度自定义”，参考胜任力管理技能/素养/知识三个名称修改（各20字符），不新增、排序、删除维度。五模板说明统一第1行内换行、第2行表头；标准第3–5行示例、第6行填写，其余第3行示例、第4行填写，统一.xlsx。人员能力六列不含来源，系统记录人才库导入。外部六列使用“测评项目名称”“测评得分”；按结束日期最新、同日最后导入取分，本地活动快照保留选分；两类监控新页打开，平台按钮“监控360评估”。宫格及图谱绩效统一三列分数，低中高展示兼容1/2/3。25格结果仍为示例汇总，未接正式排名和落位，不将本地解析、存储或快照当成正式导入服务。飞书原文档已重写并回读至revision135，12张新截图、5份新模板及保留的AI资料齐全。详细正文及12张本轮截图在deliverables/1127-update-20261116/，五份模板在outputs/1127-update/和app/templates/。本轮没有调用收费模型；AI工作流及相似岗位等既有待接入目标保持原边界。

更早的阶段性记录已移至 [历史交接记录](newprd/_archive/PROJECT_HANDOFF_2026-11-25_history.md)，仅供追溯。

最后核对：2026-11-26（本地当前 PRD V1.128 与交接说明同步更新；飞书文档未在本次重新核验）。先读 [AGENTS.md](AGENTS.md) 和本文，再按任务阅读[当前 PRD](newprd/11_人才发展系统_当前版本PRD.md) 对应小节。用户最新明确结论优先；设计目标与已实现功能必须区分。

## 1. 接手先确认

```sh
git status -sb
git log -3 --oneline
```

- 仓库：<https://github.com/6jinfu/zstd_amis/tree/main>，当前分支为main；本机目录为 `/Users/jeff/Documents/Codex/cc_zstd_amis`，换机使用实际克隆目录。
- 本轮文档核对的产品代码基线为 `6c5c642`（`v2026.11.09`），包含学习方案设计页、标准双视图和命名调整；后续最新状态查 Git，不将此处基线当作永久最新提交。
- 2026-11-04版本标签为 `v2026.11.04`，包含标准AI生成设置及生成偏好调整和对应PRD；`promo-site/` 三张宣传图片按此前约定不上传。接手时仍须重新检查工作区，禁止重置、清空或覆盖无关改动。
- 当前用户要求暂隐藏标准AI需求理解展示、保留生成设置和确认，内容详略使用五档滑块，原能力侧重改为三档能力描述方式；非结构化需求整理与补充引导的交互仍待确定。下文未实现事项是边界，不是授权立即扩展的待办。

## 2. 运行与部署

两端均为静态前端，普通预览需要Python 3.9+，无需npm安装、Dify或业务后端。在根目录的两个终端分别运行：

```sh
python3 serve.py
python3 student-client/serve.py --port 4182
```

| 端 | 入口 | 工作目录 |
| --- | --- | --- |
| 管理端 | `http://127.0.0.1:8766/`，默认进入人才标准 | `app/` |
| 学员Web | `http://127.0.0.1:4182/student.html` | `student-client/` |
| 学员H5 | `http://127.0.0.1:4182/mobile/index.html` | `student-client/mobile/` |

两服务监听0.0.0.0，LAN访问用运行机器的实际IP，不能照抄旧IP。管理端可用 `python3 serve.py 8080` 改端口；学员脚本默认4181，以上命令显式使用约定的4182。先查端口再启动，不假定旧服务仍在运行，不停止他人的进程。

管理端启动会同步CSS/JS内容指纹，HTML及资源均no-store。静态部署见 [DEPLOYMENT.md](DEPLOYMENT.md)。用户要求的管理端部署ZIP只装 `app/` 内容，解压根目录直接为index.html，不混入学员端、工作流、PRD和历史交付物；旧桌面ZIP不能冒充最新代码。

## 3. 按任务定位

路径相对仓库根目录；先读实际页面加载的脚本，不必通读整个仓库。

人才发展操作手册在本机的 `deliverables/talent-development-manual-20261105/` 维护，先读其中的 `维护说明.md`；同目录 `维护索引.py` 提供精简状态、按图号查询和图片差异检查。该目录当前未纳入 Git，其他检出环境不保证存在，需先取得手册维护资料。后续只增量更新受影响章节及图片。当前配图已同步 iA Writer 和飞书，正文精简版及人工核验仍待用户确认。

| 任务 | 主要入口 | PRD小节 |
| --- | --- | --- |
| 导航、公共UI | `app/navigation.js`；`styles.css`、`production-ui.css`；`app/ui/components.js/css` | §3、§14 |
| 组织结构、关键岗位 | `app/org-*.html`、`key-position*.html`；`app/app.js`的组织矩阵/分析流程 | §6.1–6.2；涉及后端再读[10号接口文档](newprd/10_组织与关键岗位分析_Dify工作流接口.md) |
| 标准列表/编辑/范围/雷达 | `app/standards.html`、`standard-detail.html`；`standards-data.js`、`standard-seeds.js`、`standard-list.js`、`standard-editor.js`、`standard-ui.js`、`standard-radar.css` | §6.5 |
| 标准AI、360 AI | `app/standard-ai-assistant.js`、`standard-ai-flow.css`；`assessment-ai-assistant.js/css`、`assessment-builder.js/css`、`assessment-data.js` | §6.5、§7.1、§13 |
| 宫格/人才分层/图谱 | `app/review-detail.html`、`review-layering.js/css`；`review-map-*.html`、`review-map-charts.js` | §7.3 |
| 人才库/档案/对比/池/看板/AI找人 | `app/talent-*.html`、`talent-center.js/css`、`talent-data.js`、`talent-pools.js`、`talent-ai-finder.js` | §9，池重点读§9.4 |
| 管理端岗位地图/学习方案/AI配课 | `app/position-map.js/html/css`、`learning-plan.html`、`learning-plan-design.js/css`、`learning-plan-ai.js/css`、`standard-references.js` | §8.1–8.2 |
| 职级/标准模板/维度/功能设置 | `app/settings.html`、`settings-editor.js/css`、`talent-settings-data.js` | §10 |
| 学员岗位要求/整套标准/方案 | `student-client/requirements-data.js`、`requirements.js/css`；Web接入 `student.html`，H5接入 `mobile/app.js` | §8；另读 `student-client/README.md`、`QA.md` |

## 4. 不要误判的当前状态

- **标准模板与无等级能力**：模板在 `settings.html#templates` 维护，新建标准时写入 `enabledDimensions` 快照，修改模板不回溯改动旧标准；能力指标支持 1–10 级分级或无等级，无等级项不参与雷达图和等级差距计算。
- **标准与方案**：岗位和标准多对多，各套标准独立；管理端 `learning-plan.html` 已合并为唯一正式页并按 `[positionId, standardId]` 保存在当前浏览器 `talent-learning-plan-design-v1`（`learning-plan-design.html` 仅做跳转兼容），每条学习资源绑定 `capabilities`。学员本地有同步结构的独立演示方案，管理端与学员端之间的后端实时同步仍未接通。
- **UC 用户履历与 AI 帮找人才**：人才档案“用户履历”为只读同步展示（工作经历、参与记录、授课记录、培训协议），不在 TD 内提供编辑维护；AI 帮找人才为本地确定性拆解与证据匹配演示，尚未对接真实 UC 接口或大模型服务。
- **人才池**：两入口复用 `TalentPools.form/build` 和同一池/成员记录。项目内新建绑定本项目；人才中心新建需选择一个来源项目。再从该来源项目按姓名、能力/绩效/宫格落位与分层选人，确认后新增去重，不覆盖已有成员。字段为创建人；组建无状态列；池内培养/复评暂缓。旧无来源池保留记录，不猜来源。详见§9.4。
- **示例分母**：人才中心基础人物5名；来源项目代表名单为年度4人、销售10人，不能把结果页35/42人汇总当作全量花名册。组织5×5也是具名原型示例，不是客户实测。
- **学员内容**：`requirements-data.js`为本地业务演示，不能冒充管理端接口。11月2日已删除无真实来源的14套标准简介和重复方案目标，不为UI补造。能力解释、课程和项目仍有演示数据，不能宣称所有说明字段均被删除。
- **AI与服务**：标准/360帮建为本地规则及演示生成。`dify/`有DSL、契约和离线回归；没有证据证明目标Dify实例导入、真实模型生成或联调已成功。接入分别读 `dify/talent-standard-ai-assistant-workflow-README.md`、`dify/assessment-ai-assistant-workflow-README.md`；`mcp-apps/`是另行配置的可选服务。收费或消耗余额的调用必须先获明确确认。
- **未接通**：正式业务数据库/权限、管理端与学员端实时数据、真实学习进度/执行，不得由静态示例推断完成。外部课程/项目入口可能需原站登录；不自动向原站提交学习、报名或记录。
- **前后测**：当前标准/方案适配不采用前后测及效果对比。旧编译组件、职级页和历史PRD中的相关字样不能作为新增功能依据，课程完成不等于能力提升。

## 5. 最新改动与验证证据

| 时间/代码提交 | 已落地内容 | 定向证据 |
| --- | --- | --- |
| 2026-11-09，已提交 | 统一“人才标准”命名：系统设置导航、说明、无障碍名称与反馈，评鉴来源提示、关键岗位配置入口、旧页面标题/面包屑及学员端10个示例标准名称。“岗位要求”“岗位序列标准”保留，不改ID、关联、存储或用户已保存名称 | PRD §10.3、§14.4；核验见 `deliverables/frontend-review/2026-11-09-standard-naming/README.md` |
| 2026-11-06，已提交 | 岗位详情移除条件匹配标准及查看匹配人员区块，只展示显式关联标准。两种查看方式的编辑标准均复用同一标准详情编辑器，默认打开基本信息；岗位来源仅影响返回及新建默认关联 | PRD §6.5；同日双视图验收记录 |
| 2026-11-06，已提交 | 岗位范围切换的斜切随左右选中状态镜像变化，删除切换区底部分隔线；不改筛选逻辑 | PRD §6.5；同日双视图验收截图 |
| 2026-11-06，已提交 | 双视图标签文案统一为“按岗位查看 / 按标准查看”，两页一致；页面和关联逻辑继续复用 | PRD §6.5；同日双视图验收截图 |
| 2026-11-06，已提交 | 双视图二级标签与下方内容间距对齐指标库：公共规则移除标签容器额外16px下外边距，两视图同步适配 | PRD §6.5；同日双视图验收记录与截图 |
| 2026-11-06，已提交 | 岗位范围切换按用户线上截图移至类别面板顶部、标题和搜索之前；中性灰底、选中白底蓝字、斜切衔接，无数量角标/阴影。类别组件明确保留头部控件，不再把范围切换收入树内容区，类别搜索不隐藏范围切换 | PRD §6.5；同日双视图验收记录与截图 |
| 2026-11-06，已提交 | 按双视角会议增加岗位/人才标准视图切换，直接复用现有二级标签（选中实心品牌蓝、白字、圆角，无包边或阴影），沿用原岗位列表与同一标准编辑页。岗位内读取全部关联标准并可新建，新增默认关联当前岗位且可自由调整；已有标准回显全部显式岗位，保存同步清理旧额外关联。返回/取消保留岗位上下文，暂不关联后只在标准总列表查看。纪要“精能洞见”经用户确认为经历、能力、动力、潜力，不新增模块 | PRD §6.5；`tests/standard-views.test.cjs`；验收记录 `deliverables/frontend-review/2026-11-06-standard-views/README.md` |
| 2026-11-06，已提交 | 帮建确认分组后自动匹配能力并统一预览，取消逐组必经确认。标签可直接移除，能力可按需多选调整；保留人工修改、滚动与焦点，不匹配则待调整。当前为本地关键词规则，未调用模型 | `app/learning-plan-ai.js/css`；6项定向测试及同日浏览器核验 |
| 2026-11-06，已提交 | 学习方案AI帮建欢迎区增加新员工、业务项目、业务骨干三条需求示例，分别展示3/2/4个分组；点击填入输入框，可继续修改，不自动提交 | `app/learning-plan-ai.js/css`；PRD §8.2；同日示例核验记录 |
| 2026-11-06，已提交 | 学习方案增加AI帮建，复用标准帮建抽屉与样式，通过对话确认自定义分组及逐组能力，支持资源选择、实时预览、追加到页面后手工保存；已有内容保留，防止重复应用。当前为本地规则演示，未调用付费模型，不具备任意语义理解 | `app/learning-plan-ai.js/css`、`app/learning-plan-design.html/js`；PRD §8.2；`tests/learning-plan-ai.test.cjs`与同日核验记录 |
| 2026-11-06，已提交 | 删除学习方案的交互设计稿说明、实现性保存文案、空态长说明和重复侧栏信息；保存按钮与状态简化，空方案仅一个添加入口。存储及分组行为不变 | PRD §8.2；同日核验记录的文案精简补充与 `compact-empty.jpg` |
| 2026-11-06，已提交，替代当日初版布局 | 学习方案以自定义分组组织：自定标题/数量/顺序，每组选相关能力后直接关联资源。删除按能力导航与必填任务层；能力仅表达关联，不作为阶段。设计草稿读取时将原tasks一对一承接为groups并保留字段，保存才写入；来源标准仍继承入口且不可切换。预览入口改称“查看方案设计版” | `app/learning-plan-design.html/js/css`、`app/standard-editor.js`；PRD §8.2；同日核验记录的最新补充 |
| 2026-11-06，已提交 | 学习方案在来源人才标准下配置；设计页移除标准选择与切换，缺失/非法来源不默认套用其他标准。旧独立资源页从标准进入时同样只读展示来源；保留原存储键、已有草稿及岗位直接进入的旧路径 | `app/learning-plan-design.html/js/css`、`app/standard-references.js`；PRD §8.2；同日能力方案核验记录 |
| 2026-11-06，已提交 | 新增按能力构建的学习方案交互设计页，标准详情关联岗位行增加预览入口。实际标准能力＋培养任务路线，支持共享任务、活动编辑排序、课程/项目选择、结构检查及整体预览；设计草稿按岗位＋标准独立保存在新存储键，不替换原方案或接通学员端，不新增固定阶段、不调用付费模型 | `app/learning-plan-design.html/js/css`、`app/standard-editor.js`；PRD §8.2；核验见 `deliverables/frontend-review/2026-11-06-capability-learning-plan/README.md` |
| 2026-11-05，已提交 | 人才档案评鉴记录操作改为“查看报告”，移除原分项依据抽屉；当前无关联报告页面，点击暂提示“报告暂未接入” | `app/talent-center.js`；PRD §9.2；核验见 `deliverables/frontend-review/2026-11-05-profile-report/README.md` |
| 2026-11-05，已提交 | 移除人才档案顶部“加入人才池”和“导出档案”按钮，仅保留返回、姓名；其他页面入池入口及已有成员记录不变 | `app/talent-center.js`；PRD §9.2；浏览器证据见 `deliverables/frontend-review/2026-11-05-profile-actions/README.md` |
| 2026-11-05，已提交 | 人才档案评鉴记录的完成日期、有效至两列替换为总分，按用户最新要求暂固定展示“5 分”，仅作原型示例，不写入评鉴数据或自行换算。日期及有效期仍保留在记录中用于有效性判断，盘点记录不变 | `app/talent-center.js`；PRD §9.2；浏览器及检查记录见 `deliverables/frontend-review/2026-11-05-profile-total-score/README.md` |
| 2026-11-04，已提交 | 独立学习方案资源卡片上移，添加项目下拉提供已有项目选择和新标签页打开培训平台新建入口；修复删除副标题后的初始化异常，标准选择区位于操作栏下。未改变岗位单份保存或接入外部项目回填 | `app/learning-plan.html`、`app/standard-references.js`；验证见 `deliverables/frontend-review/2026-11-04-learning-plan-actions/README.md` |
| 2026-11-04，已提交 | 两组生成偏好滑块改为连续跟手、松开240ms缓动吸附，按压放大与柔和光晕；保留离散档位、键盘和减少动态效果支持 | `app/standard-ai-assistant.js`、`app/standard-ai-flow.css`；验证见 `deliverables/frontend-review/2026-11-04-slider-motion/README.md` |
| 2026-11-04，已提交 | 原能力侧重替换为只写行为/带上情境/包含成果三档能力描述方式，复用详略滑块，示例实时切换及220ms过渡；移除原候选侧重排序。选择进入确认记录及草稿generationPreferences，尚无正式能力描述字段/真实生成，不改Dify | `app/standard-ai-assistant.js`、`app/standard-ai-flow.css`；验证见 `deliverables/frontend-review/2026-11-04-description-structure/README.md` |
| 2026-11-04，已提交 | 内容详略改为简洁/精要/适中/充实/详细五档滑块，拖动/刻度点击/键盘即时反馈，返回保留、新会话重置；原型条目上限实际联动且不补造内容，不改能力等级或Dify契约 | `app/standard-ai-assistant.js`、`app/standard-ai-flow.css`；验证见 `deliverables/frontend-review/2026-11-04-detail-slider/README.md` |
| 2026-11-04，已提交 | 暂隐藏标准AI背景/行动/成果理解展示及后续理解回看，生成设置独立可见，保留底部补充输入和确认继续；输入按钮改为提交补充。内部需求整理及原型生成保留；替代交互待定 | `app/standard-ai-assistant.js`；验证记录见 `deliverables/frontend-review/2026-11-04-hide-standard-brief/README.md` |
| 2026-11-03，随 `v2026.11.04` 归档 | 标准AI生成设置移除岗位层级/管理范围；内容侧重改为生成偏好，区分详略与能力侧重，明确下一步 | `app/standard-ai-assistant.js`、`app/standard-ai-flow.css`；11月3日定向浏览器核验，11月4日推送前未重测浏览器 |
| 2026-11-02，随 `d87e056` 提交 | 学员头部；Web选择器240×32px；H5标签列56px、间距8px，选择器最大240×32px/14px；删除无来源简介 | `deliverables/frontend-review/2026-11-02-student-header/`、`2026-11-02-mobile-standard-selector/`；`student-client/QA.md` |
| 2026-10-29相关实现，随 `f99654d` 提交 | 组织默认5×5、标准能力雷达、AI排序评分/需求理解、360逐能力生成记录、宫格人才分层 | `tests/org-grid.test.cjs`、`standard-radar.test.cjs`、`standard-ai-priority.test.cjs`、`standard-brief.test.cjs`、`assessment-ai-generation.test.cjs`、`review-layering.test.cjs`；当天验收目录 |
| 2026-10-28，随 `a4e668b` 提交 | 共用人才池与筛选、创建人/状态列调整、LAN HTTP UUID兼容；学员整套标准切换；旧导航删除 | `tests/talent-pools.test.cjs`、`navigation.test.cjs`、`student-client/tests/requirements.test.cjs`；当天验收目录 |

以上11月6日及9日改动收录于 `6c5c642`；11月4日至5日改动见 `5d35fa6` 及相关历史提交。浏览器记录为既有验收证据，不代表本次文档核对重测全部页面或视口。2026-11-03推送前实际通过：48项Node＋56项Python回归；管理端297处、学员端28处资源指纹；学员交付清单286份文件哈希。离线工作流测试替换了模型输出，不证明真实模型效果。测试数量会变，以当次输出为准。

2026-11-04标签归档前复核：48项Node＋56项Python回归全部通过；管理端297处、学员端28处资源指纹一致；JS语法与`git diff --check`通过。本轮未重测浏览器，也未调用真实模型。

2026-11-05推送前复核：48项Node＋56项Python回归全部通过；管理端297处、学员端28处资源指纹一致；本次变更JS语法及`git diff --check`通过。人才档案浏览器核验见当天验收记录；未重测其他页面全部交互，未调用真实模型。本次提交包含11月4日标准AI、学习方案调整及11月5日人才档案改动和对应文档、测试、验收记录；未跟踪的 `deliverables/talent-development-10min-20261021/` 演示PPT及构建文件不纳入代码提交。

```sh
# 仅读取检查；将write=False改成True才会更新引用。
python3 -c "from scripts.asset_versions import sync_assets; print(sync_assets('app', write=False)); print(sync_assets('student-client', write=False))"
# JS回归使用Node.js 20.11+。
node --test tests/*.test.cjs student-client/tests/*.test.cjs
# 工作流测试需PyYAML；缓存测试需要允许绑定本机临时端口。
python3 -m unittest discover -s tests -p 'test_*.py'
git diff --check
```

按修改范围选择检查；不要把环境缺依赖写成业务失败，也不要跳过后宣称全部通过。UI修改还须浏览器验证目标页、视口、交互、溢出及控制台，记录未验证项。业务或关键UI结论变化须同步当前PRD与本文，更新日期。

## 6. 数据与改动边界

- localStorage键：`talent-standards-v1`（`standards-data.js`）、`talent-center-v1`（`talent-data.js`）、`talent-assessment-drafts-v1`（`assessment-data.js`）、`talent-settings-v1`（`talent-settings-data.js`）；组织矩阵另查 `app/app.js`。不随意清空、换键或覆盖用户记录。
- localStorage按协议/主机/端口隔离，localhost、LAN IP、不同端口不自动同步。Git/ZIP不包含浏览器临时新增记录。LAN HTTP编号兼容在 `talent-data.js`，不能回退成只调用crypto.randomUUID。
- `student-client/mobile/source/`为已有编译代码，不是完整Vue单文件组件工程；`mobile/data.json`是接口快照。优先改适配层，保留原包。改学员文件后同步两入口资源指纹和 `student-client/交付清单.sha256`，沿用清单格式和范围。
- 正式导航唯一实现在 `app/navigation.js`，不恢复旧DOM、运行后重建或隐藏补丁。样式按真实引用定位，禁止无关重构、重复实现和补丁层叠。
- 禁止单边装饰色条卡片、装饰性小字标签及英文副标。正文、真实数据及必要提示用正常可读层级。
- `v2026.10.21-project`、`MIGRATION.md`、旧ZIP为历史交接，不是当前main。原490行交接已原样[归档](newprd/_archive/PROJECT_HANDOFF_2026-11-02.md)并加历史提示；旧结论仅用于追溯。`prd/`、`newprd/_archive/`及旧 `deliverables/student-client-package/`不作为当前修改依据。
