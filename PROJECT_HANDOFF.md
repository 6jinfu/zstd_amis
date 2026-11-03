# 人才发展原型项目交接

最后核对：2026-11-03。先读 [AGENTS.md](AGENTS.md) 和本文，再按任务阅读[当前 PRD](newprd/11_人才发展系统_当前版本PRD.md) V1.101 对应小节。用户最新明确结论优先；设计目标与已实现功能必须区分。

## 1. 接手先确认

```sh
git status -sb
git log -3 --oneline
```

- 仓库：<https://github.com/6jinfu/zstd_amis/tree/main>，当前分支为main；本机目录为 `/Users/jeff/Documents/Codex/cc_zstd_amis`，换机使用实际克隆目录。
- 本轮产品代码核对基线为 `d87e056`（2026-11-03）；前序 `f99654d` 包含组织结构、标准AI、评鉴及盘点更新。后续最新状态查Git，不将此处基线当作永久最新提交。
- 本轮开始时仅 `promo-site/` 三张宣传图片未跟踪，按此前约定不上传；不属于漏推业务代码。接手时仍须重新检查工作区，禁止重置、清空或覆盖无关改动。
- 当前没有用户确认的下一步开发任务；下文未实现事项是边界，不是授权立即扩展的待办。

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
| 2026-11-02，随 `d87e056` 提交 | 学员头部；Web选择器240×32px；H5标签列56px、间距8px，选择器最大240×32px/14px；删除无来源简介 | `deliverables/frontend-review/2026-11-02-student-header/`、`2026-11-02-mobile-standard-selector/`；`student-client/QA.md` |
| 2026-10-29相关实现，随 `f99654d` 提交 | 组织默认5×5、标准能力雷达、AI排序评分/需求理解、360逐能力生成记录、宫格人才分层 | `tests/org-grid.test.cjs`、`standard-radar.test.cjs`、`standard-ai-priority.test.cjs`、`standard-brief.test.cjs`、`assessment-ai-generation.test.cjs`、`review-layering.test.cjs`；当天验收目录 |
| 2026-10-28，随 `a4e668b` 提交 | 共用人才池与筛选、创建人/状态列调整、LAN HTTP UUID兼容；学员整套标准切换；旧导航删除 | `tests/talent-pools.test.cjs`、`navigation.test.cjs`、`student-client/tests/requirements.test.cjs`；当天验收目录 |

浏览器记录为既有验收证据，不代表11月3日重测全部页面/视口。2026-11-03推送前实际通过：48项Node＋56项Python回归；管理端297处、学员端28处资源指纹；学员交付清单286份文件哈希。离线工作流测试替换了模型输出，不证明真实模型效果。测试数量会变，以当次输出为准。

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
