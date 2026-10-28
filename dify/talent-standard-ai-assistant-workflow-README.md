# 人才标准 AI 帮建：分阶段 Dify Workflow

更新：2026-10-26（修正固定插件包导致的导入依赖问题）。当前交付入口是 [`talent-standard-ai-assistant-workflow.yml`](talent-standard-ai-assistant-workflow.yml)。为区分此前已下载的文件，另提供内容完全相同的 [`talent-standard-ai-assistant-workflow-import-fix.yml`](talent-standard-ai-assistant-workflow-import-fix.yml)。旧 `talent-standard-ai-assistant-chatflow.yml` 保留供追溯，生产接入以本文和新 Workflow 为准。

## 1. 导入与运行

1. 在 Dify 工作室选择「导入 DSL 文件」，上传上述 `.yml`，创建 **Workflow** 应用。
2. 文件使用 `dependencies: []`，导入时不要求下载某个固定版本的插件包。运行前，在模型供应商中确认已安装官方通义插件、存在 **`qwen3.6-plus`**，并配置百炼凭据；已有可用配置可继续使用。如果尚未安装通义插件，先在当前实例的插件市场安装兼容版本。文件不包含任何密钥，也不会安装模型服务或替你配置凭据。
3. 五个 LLM 节点统一使用 `langgenius/tongyi/tongyi` → `qwen3.6-plus`。结构化输出开启；思考模式和联网搜索显式关闭；temperature=0.2。没有隐式备用模型或自动付费重试。
4. 先检查画布并保存。开始节点已填入一份无附件、无岗位、仅职责和经历的示例；点击测试会真实调用模型并消耗对应额度，确认额度后再运行。
5. 使用本文的调用样例验证三条路径，发布后再通过 `POST /v1/workflows/run` 接入业务服务。

DSL 使用 `0.4.0` 格式，节点字段按 Dify **1.9.2** 官方定义核对；建议使用 1.9.2 或更新版本，并安装包含 Qwen3.6 Plus 定义的通义插件。没有获得目标 Dify 实例的版本、地址和账号，因此本次做了本地结构和节点逻辑验证，未在目标实例实际导入、发布或调用模型。低版本若报告 DSL 不兼容，应先核对版本，不要仅改版本号绕过检查。

当前项目仍是静态原型，`serve.py` 不提供 Dify 代理接口。本交付提供可独立导入的工作流和接入契约，没有把页面伪装成已接通真实生成。

### 遇到 Plugin load error 时

旧交付文件锁定了 `langgenius/tongyi:0.2.24` 及具体包哈希，导入可能先进入该插件包的安装/元数据加载环节。2026-10-26修正版只移除了这项安装依赖，未改模型、DSL版本、节点、确认步骤或输出协议。Dify 1.9.2官方导入代码对本文件的0.4.0格式在dependencies为空时不会按旧版DSL逻辑自动补齐依赖。

请重新选择带 `import-fix` 后缀的新文件导入。若原应用画布已经创建成功，也可先检查五个LLM节点的通义供应商及Qwen3.6 Plus选择状态，不必重复创建应用。此修改消除工作流对固定插件包的安装要求，并不修复实例本身的插件服务、网络或模型凭据；若单独安装插件仍报错，需要结合Dify版本、插件名及具体加载日志继续定位。仅凭“Plugin load error / This plugin will not be installed”不能确定底层原因。

## 2. 严格对应当前原型的步骤

阶段名称直接采用 `app/standard-ai-assistant.js` 中的 `welcome / review / outline / scope`。页面中的短暂 `thinking` 只是加载状态，不作为一个业务确认步骤。

| 页面步骤 | 页面行为与调用时机 | 工作流动作 |
| --- | --- | --- |
| 首页提交需求 `welcome` | 可选目标岗位，输入建模需求，可上传资料。没有岗位也能继续 | `analyze_brief` |
| 确认建模信息 `review` | 选择新建或更新已有标准，确认目标岗位、岗位层级、管理范围和生成维度。有补充输入时先处理调整、再次确认 | 有调整时调用 `analyze_brief`；空输入点击「确认，继续」由代码进入 `outline` |
| 确认内容侧重 `outline` | 选择简洁/常规、均衡/工作交付/协同沟通/团队管理，可补充业务场景，再点击「生成草稿」 | `generate_draft`，必须携带 `brief_confirmed=true` 和 `focus_confirmed=true` |
| 草稿预览与调整 `scope` | 查看全文、局部手工编辑，或输入具体修改要求。未发送的修改文字优先提交，不能直接当作应用范围确认 | 自然语言修改调用 `revise_draft`；手工编辑由业务代码更新当前草稿 |
| 确认应用范围 `scope` | 新建：仅当前岗位/同类岗位/暂不关联；无岗位：暂不关联；更新：保留原应用范围 | 不调用模型，由代码依据真实岗位数据确定范围 |
| 更新已有标准 | 明确选择「直接覆盖」或「保留更新」，展示条目数量与同名能力等级变化，不预选策略 | 不调用模型，由代码复用现有合并规则 |
| 带入编辑页并保存 | 带入仍为未保存状态，用户在编辑器确认后保存 | 不调用模型，正常业务保存 |

不能把 Workflow 的一个运行理解成从首页到保存的全程：**每次只完成一个 AI 动作后返回，等待用户在原页面操作。** `next_ui` 是固定业务建议，业务服务仍负责校验当前阶段后渲染，不能由模型回复决定跳步。

用户返回修改岗位、场景、层级、管理范围或生成维度时，代码应使原确认失效，重新经过 `review → outline`。草稿阶段要求修改这些参数、范围或更新方式时，修改计划节点提示回到相应页面操作，不在正文修改分支偷偷执行。新增附件也必须回到建模信息确认。

## 3. 画布如何组织

公共入口：开始 → 页面步骤/数据校验 → 无效输入直接返回；有效输入 → 有新资料才解析 → 汇合有效上下文 → 按动作分支。

- **整理分支**：Qwen 整理/调整建模信息 → 代码校验岗位、维度及依据 → 返回确认卡。不会在这一轮产生标准草稿。
- **生成分支**：Qwen 形成工作交付与职责逻辑 → 所选维度含能力/动力/潜力时，第二个 Qwen 节点匹配企业指标和等级 → 代码映射编辑器字段、核验依据、输出草稿。只选职责/经历时跳过第二个模型。
- **修改分支**：Qwen 先定位修改对象与方向 → 代码检查目标是否在允许范围内 → 不明确则直接澄清；明确则由第二个 Qwen 节点改写目标分项 → 代码保留其他分项及基本信息、计算实际变化。

各分支最终汇合到统一 Output。全图 26 个节点、31 条连线、5 个模型节点；单次正常调用只经过1或2个模型节点，不会遍历全部模型。

没有引入 Agent 自主规划、工具循环或外部检索依赖。企业候选和相关资料由业务服务随请求传入，先保障过程可复现；未来资料量大时，可以在候选准备环节增加受租户限制的检索。

## 4. 开始节点的三个输入

| 字段 | 类型 | 规则 |
| --- | --- | --- |
| `action` | Select | `analyze_brief / generate_draft / revise_draft` |
| `payload_json` | Paragraph | 将下面的业务对象序列化成 JSON 字符串，最多60000字，不是把对象直接塞入此字段 |
| `reference_files` | File List，可选 | 最多10份新增文档，仅在整理建模信息时传入；PDF/DOCX/XLSX/CSV/TXT/MD |

调用示例位于 [`talent-standard-ai-assistant-examples/`](talent-standard-ai-assistant-examples/)，均为不含密钥的完整 API 请求体：

1. `01-analyze-brief.request.json`：首页输入。
2. `02-generate-draft.request.json`：两张确认卡都确认后生成。
3. `03-revise-draft.request.json`：以最新手工编辑后的草稿执行局部修改。
4. `04-update-existing.request.json`：生成已有标准的更新候选，最终策略仍由页面确认。

文件中的企业、岗位、指标及等级解释均为测试示例，正式接入必须替换成当前租户数据。可以把 `inputs.payload_json` 解码后编辑，再重新序列化；Dify 的测试面板则直接粘贴解码后的 JSON 文本。

### payload_json 内容

| 字段 | 用途与约束 |
| --- | --- |
| `request_id / session_id` | 本次请求与业务会话标识，非空字符串，最长128。服务端负责请求去重和租户隔离 |
| `phase` | 当前页面业务阶段；整理仅 `welcome/review`，生成仅 `outline`，修改仅 `scope` |
| `user_message` | 本轮需求或补充修改，最长3000；整理和修改必填。生成时可放内容侧重卡补充的场景要求 |
| `operation` | `new/update`，对应建模确认卡的「本次操作」 |
| `brief` | `scenario / position_id / level / management`。岗位可为空；未知层级和管理范围使用「未指定」 |
| `enabled_sections` | 当前企业启用维度，非空无重复数组 |
| `selected_sections` | 本次生成维度，必须属于启用维度，且至少一项 |
| `brief_confirmed / focus_confirmed` | 生成、修改必须都严格为布尔 `true`；不能用字符串或模型判断替代用户点击确认 |
| `detail` | `concise/regular`，对应简洁/常规 |
| `focus` | `balanced/delivery/collaboration/leadership`，对应四种内容侧重 |
| `draft_version` | 业务会话中当前草稿的非负整数版本；首次生成通常为0 |
| `expected_draft_version` | 仅修改需要，必须与 `draft_version` 相等且大于0 |
| `draft` | 修改时传当前完整草稿，必须包括用户最新的手工编辑 |
| `draft_evidence_notes` | 可选，当前草稿的依据元数据；修改后保留非目标分项的依据 |
| `source_standard` | 更新时必填：原标准 `id/version/name/category/description/mode/positions/groups/content`。version是字符串。新建时不传 |
| `catalog` | 当前租户合法候选：`positions/categories/cap/pow/pot`，每类最多200项。至少提供所选指标维度的候选；新建还需合法标准类别 |
| `reference_context` | 可选，已解析的相关资料数组，每份包含 `id/name/text`。最多10份，文本总计最多40000字；仍受payload总体60000字限制 |

维度固定为 `duty/exp/cap/pow/pot`。层级固定为「未指定、基层/初级、中层/中级、高层/高级」；管理范围固定为「未指定、不带团队、带团队」，与当前原型选项完全一致。

候选的公共字段为 `id/name`。能力候选还必须提供非空 `levels`，其中每项含合法 `level`（L1–L5）与 `description`。模型在这些实际定义中选等级，不自动默认为L3。动力和潜力只选择指标，不生成等级。候选不足时返回待确认建议，不擅自创建新指标。

`brief` 是用户最新确认的信息，不能每轮继续传首页尚未纠正的旧岗位。内容侧重卡补充文本作为本次生成要求，但不能静默覆盖已确认的岗位和管理范围；冲突应提出问题。

### 附件与来源缓存

仅在新上传文件时传 `reference_files`。按 Dify 的文件上传 API 获取 `upload_file_id` 后，放入文件类型输入：

```json
{
  "type": "document",
  "transfer_method": "local_file",
  "upload_file_id": "实际上传返回的文件ID"
}
```

有文件时使用 Document Extractor。返回的 `reference_context` 保留逐文件文本，新增文件编号为 `file:1` 等，重名时生成新编号，不覆盖旧来源；显示名称为按顺序的「本轮附件1」等，业务服务可按上传顺序补上实际文件名。后续保存并传回 `reference_context`，不要每轮重传同一文件。

普通解析针对可提取文本的文档；扫描件先OCR。空白、超长、数量超限或在错误阶段上传新附件会停止本轮执行，不能无声忽略资料后继续生成。很长的资料应由业务服务先筛选相关段落，不静默截断。

## 5. 输出与编辑器映射

`data.outputs` 包含 `status / reply / can_apply / result_json`。前三项便于调用方判断；完整结构以反序列化后的 `result_json` 为准，不再从自然语言或HTML注释提取数据。

通用结果包含 `schema_version=2.0`、动作、请求/会话ID、当前阶段、草稿基础版本、来源标准ID/版本、状态、问题、依据及可选草稿。

| 状态 | 业务服务的处理 |
| --- | --- |
| `needs_confirmation` | 整理分支正常返回确认卡；草稿分支则展示待确认问题。不得自动视为已确认 |
| `ok` | 可采用的草稿/修改建议。仍然需要原型中的范围确认、更新方式选择和编辑保存 |
| `needs_clarification` | 展示具体问题，保留当前草稿，等待补充后再次调用 |
| `invalid` | 输入或结果校验失败，`can_apply=false`、`draft=null`，保留原草稿 |
| Dify运行失败 | 模型、解析器或结构化输出失败会使运行失败；业务服务处理错误，不以默认草稿冒充成功 |

`can_apply=true` 只表示本次内容候选通过本工作流校验，**不是保存、发布或覆盖原标准的授权**。`needs_confirmation` 中的草稿可以供用户审阅；业务服务需记录用户对问题的明确处理，不能仅因存在draft字段就采用。

草稿与当前编辑器保持同形：

```json
{
  "name": "人才标准名称",
  "category": "当前合法类别名称",
  "description": "标准说明",
  "mode": "none",
  "positions": [],
  "groups": [],
  "content": {
    "duty": [{"n": "职责名称", "t": ["任务"]}],
    "exp": ["经历要求"],
    "cap": [["企业指标准确名称", "L3"]],
    "pow": ["企业动力指标名称"],
    "pot": ["企业潜力指标名称"]
  }
}
```

新建草稿先设为 `mode=none`；岗位识别不等于用户已经确认应用范围。页面稍后按选择把岗位ID写入 `positions`，或继续暂不关联。同类岗位必须用业务主数据展开，不能让模型列举岗位。

更新已有标准时，结果保留原基本信息及范围；生成候选只包含本次选择维度的内容，其他维度为空。业务代码在用户确认 `replace/merge` 后复用 `TalentSettings.mergeContent`：覆盖仅替换所选维度；保留更新追加条目、同名职责合并任务、同名能力采用草稿等级。不能拿生成候选的空数组直接覆盖未选择维度。

按当前编辑器入口，最终带入时业务代码补充 `targetId / updateStrategy / generatedSections`；新建时配置用户明确选择的范围。工作流不输出这些最终决策。

局部修改结果是基于当前完整草稿的副本，只替换已定位的目标分项，保留其他内容、名称、说明、类别和范围。`change_summary` 中的 `before/after/added/removed/modified` 由代码按实际条目计算；同名职责内任务变化或同名能力等级变化计为modified，文本经历的改写计为删旧加新。完全没有变化时返回澄清，不宣称执行成功。

## 6. 依据、版本和失败处理

- 每条生成要求保留 `section/item/basis/source_ids/quote/confidence`。资料依据必须能在指定来源核对原文；生成建议用 `inference`，不冒充资料事实。依据数据不写入原编辑器content，业务服务另存。
- 模型分数只是辅助判断，不是校准后的统计概率。当前低于0.65的内容需确认；岗位未指定且分数0是合法的通用标准场景。
- Schema、岗位ID、类别、指标ID、等级、维度与数量均会校验；非法等级不强制补成L3，非法结果不自动清洗成“成功”。
- 每次手工编辑都应由业务服务递增草稿版本。调用前固化当前版本，收到结果后再比较请求ID、草稿版本、源标准版本；不同则丢弃过期结果并提示重新生成。工作流只核对传入快照的一致性，不能知道调用期间数据库是否改变。
- 新附件或返回建模信息后的修改应使后续确认失效。服务端应保存对话、确认值、资料上下文和草稿；普通Workflow不会替业务系统持久化会话。
- 不向模型传全量人员档案。租户、权限、候选归属、签名文件地址、密钥及最终保存仍在业务服务中处理。
- 使用SSE可显示「正在整理建模信息…」「正在生成人才标准…」。不要把节点名称、内部推理或虚拟百分比作为用户步骤。JSON校验完成后再整体更新预览，避免采用半份草稿。
- 本文件关闭模型自动重试；需要重试时由业务服务明确触发，控制请求去重和费用。不会自动更换模型。

## 7. 本地验证

```bash
python3 -m unittest discover -s tests -p test_talent_standard_workflow.py -v
```

测试使用当前环境已有的 PyYAML 读取实际交付DSL，逐个执行其中的Python代码节点；模型和文档解析输出使用固定样例。覆盖画布可达性、无环、分支handle、变量引用、结构化样例、确认门禁、附件缓存、指标合法性、依据来源、局部编辑保留、版本冲突和更新候选。测试不访问Dify、百炼或任何付费生成API，不能替代目标实例导入和模型实测。

## 8. 官方格式依据

- [Dify Workflow 与 Chatflow](https://docs.dify.ai/en/cloud/use-dify/build/workflow-chatflow)
- [Dify LLM结构化输出](https://docs.dify.ai/en/cloud/use-dify/nodes/llm)
- [Dify Workflow调用API](https://docs.dify.ai/en/api-reference/workflow-runs/run-workflow)
- [Dify文档解析节点](https://docs.dify.ai/en/cloud/use-dify/nodes/doc-extractor)
- [Dify 1.9.2 的DSL版本与导入实现](https://github.com/langgenius/dify/blob/1.9.2/api/services/app_dsl_service.py)
- [Dify 1.9.2 的LLM节点字段](https://github.com/langgenius/dify/blob/1.9.2/api/core/workflow/nodes/llm/entities.py)
- [官方通义插件Qwen3.6 Plus模型定义](https://github.com/langgenius/dify-official-plugins/blob/main/models/tongyi/models/llm/qwen3.6-plus.yaml)
- [官方通义插件市场页](https://marketplace.dify.ai/plugin/langgenius/tongyi)
