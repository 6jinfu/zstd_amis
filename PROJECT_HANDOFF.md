# 人才发展原型项目交接

最后核对：2026-11-09（校正已提交状态及当前 PRD 的实现边界）。先读 [AGENTS.md](AGENTS.md) 和本文，再按任务阅读[当前 PRD](newprd/11_人才发展系统_当前版本PRD.md) 对应小节。用户最新明确结论优先；设计目标与已实现功能必须区分。

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
| 人才库/档案/对比/池/看板 | `app/talent-*.html`、`talent-center.js/css`、`talent-data.js`、`talent-pools.js` | §9，池重点读§9.4 |
| 管理端岗位地图/学习方案 | `app/position-map.js/html/css`、`learning-plan.html`、`standard-references.js` | §8.1–8.2 |
| 职级/维度/功能设置 | `app/settings.html`、`settings-editor.js/css`、`talent-settings-data.js` | §10 |
| 学员岗位要求/整套标准/方案 | `student-client/requirements-data.js`、`requirements.js/css`；Web接入 `student.html`，H5接入 `mobile/app.js` | §8；另读 `student-client/README.md`、`QA.md` |

## 4. 不要误判的当前状态

- **标准与方案**：岗位和标准多对多，各套标准独立；学员顶层选择整套标准，同时切换五类要求和对应方案。已确认设计为每个“岗位＋标准”独立配置，但**管理端仍在 `standard-references.js` 用 `data.plans[positionId]` 保存岗位单份资源**。学员本地有独立示例方案，管理端组合持久化及跨端实时同步尚未实现；PRD §8.2明确为待实现设计。
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
