# 360评估问卷 AI 帮建：Dify Workflow

更新：2026-10-26。导入文件：[assessment-ai-assistant-workflow.yml](assessment-ai-assistant-workflow.yml)。模型统一为 **`qwen3.6-plus`**。

本工作流按已确认的四步设计：**选择岗位或人才标准 → 在对话中勾选评估能力、设置题型和题数 → 确认生成问卷 → 点击创建问卷进入编辑页。** 不增加内容侧重卡、逐项确认或强制修改回合。

## 1. 导入后先做一次短测试

1. 在Dify工作室选择「导入DSL文件」，上传上述YAML，创建 **Workflow** 应用。
2. 在模型供应商中配置官方通义供应商，确保能选到 **Qwen3.6 Plus / `qwen3.6-plus`**。两个LLM节点都已使用 `langgenius/tongyi/tongyi`，无需改成其他模型。
3. 文件为 **DSL 0.4.0**，节点字段和迭代结构依据Dify **1.9.2** 官方代码/测试样例核对，建议使用1.9.2或更新版本。`dependencies: []`，不绑定特定插件版本、哈希或自动安装包，避免此前的固定插件包导入问题；运行仍需要已安装且可用的通义供应商。
4. 开始节点已预填一份短测试：两项能力，每项单选/多选/打分/问答各1题，共 **8题**，表示用户已经在页面完成一次确认。可以保留默认值测试。
5. 若测试面板没有自动带出默认值，`action`选择 `generate_questionnaire`，将 [quick-test-payload.json](assessment-ai-assistant-examples/quick-test-payload.json) 的完整正文粘贴到 `payload_json`。
6. 检查输出：`status=ok`、`can_create=true`、解析 `result_json` 后的 `question_count=8`；`question_batches`应有两项，每项包含一项能力的4道题及选项。

点击Dify测试会真实调用模型并消耗该账号的模型额度；上述短测试会调用两次Qwen。本次交付没有调用用户的Dify或百炼额度，也没有在目标实例实际导入、发布或模型实测。本地验证使用固定模型输出，不能替代目标环境测试。

工作流不含密钥、租户URL、知识库ID、外部HTTP工具或依赖包安装动作。若目标实例仍提示插件加载错误，请在该实例单独检查通义插件与Dify版本；不要用降低DSL版本号或关闭校验来掩盖不兼容。

## 2. 四个用户步骤如何衔接

| 用户步骤 | 工作流/页面处理 | 是否调用模型 |
| --- | --- | --- |
| 选择评估入口及标准 | `prepare_assessment`读取可信岗位和标准快照，明确本次标准和实际范围 | 否 |
| 对话中勾选能力 | 返回可点击的能力选项、要求等级及当前勾选值；页面直接更新选择与题数，文字补充可选 | 否 |
| 确认并生成问卷 | 页面将最终选择传入`generate_questionnaire`；内部逐能力生成并统一校验 | 每项已选能力一次 |
| 创建问卷进入编辑页 | 页面校验来源/问卷版本，合并输出批次与编辑页基础数据，再带入现有编辑器 | 否 |

普通Workflow的一次运行完成一个动作。对话、勾选状态和问卷版本由业务服务保存，用户点击已有控件后传入下一次请求。**Dify测试面板展示输入和结构化结果，不会凭DSL自动变成原型中的勾选卡或跳转本机页面。** 接入时由现有前端根据`ui.abilities`渲染原来的checkbox，不需要重做页面，也不增加一轮“方案是否接受”。

当前静态原型的标准入口及页面布局保持原样，本轮没有接通真实模型或新增岗位入口UI。此文件已支持两种入口的后端契约，岗位入口落地时需接入相应数据选择与校验。

### 岗位入口

- 业务服务传入选中岗位和其关联标准候选，包括显式关联。
- 只关联一个标准时直接采用；关联多个时返回`needs_selection`和标准选项，用户点击选一个即可。
- 不能由模型猜测或创建岗位/标准关联。
- 本次评估范围限定为所选岗位，不扩展成该标准涉及的全部岗位。
- 按条件匹配的标准不能因为某一员工符合条件，就被当成整个岗位的标准；岗位入口需要明确的岗位关联。

### 人才标准入口

- 选定标准后使用其完整应用范围。
- 指定岗位同时包含标准直接配置和业务服务给出的显式关联岗位。
- 按条件匹配保留原条件：组内AND、组间OR，不把条件交给模型推断或扩张。
- 没有配置范围或没有能力时提示先完善标准；已有条件但当前匹配人员数为0，不等于没有配置范围，不阻止构建问卷。

## 3. 正常路径与可选调整

画布共 **13个节点、13条连线**，只有两个LLM节点，均为Qwen3.6 Plus：

- 公共入口：解析入口、来源标准、范围、能力及确认状态，失败时直接返回问题，不调用模型。
- 准备分支：直接返回标准选择项或能力勾选卡。
- 生成分支：Iteration按选中能力顺序执行「Qwen生成当前能力题目 → 代码校验题数/题型/选项并绑定能力」，最后汇总为完整问卷。
- 可选调整分支：仅在用户主动输入调整要求时，用Qwen理解场景和题数变化；未修改的值保留。不自动重新生成。

生成使用顺序迭代，配置`error_handle_mode=terminated`，没有模型自动重试或备用模型。节点数不等于模型调用次数：普通准备不调用模型，生成N项能力调用N次；手动勾选或调整数量控件不用调用AI。

### 用户主动调整时

`adjust_request`只负责理解“单选题改为2题”“场景改为跨团队技术评审”等请求。

- 生成前：返回更新后的配置，继续使用原确认卡，不额外确认每一个字段。
- 已有问卷：返回待重新生成的配置和`replacement_required`，沿用原型已有的替换提醒。用户取消则保留现有问卷；确认后再调用生成动作。
- 能力选择仍在对话卡片点击完成；逐题修改在编辑页完成。超出支持范围或确实含糊的要求才澄清。
- 用户不提出调整时，正常生成后即可点击创建，不主动开启修改对话。

## 4. 开始节点输入

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `action` | Select | `prepare_assessment / generate_questionnaire / adjust_request` |
| `payload_json` | Paragraph | 序列化业务状态的JSON文本，最多60000字，不含NaN/Infinity |

完整输入样例位于 [assessment-ai-assistant-examples/](assessment-ai-assistant-examples/)。`*.input.json`可直接作为Workflow API请求的`inputs`对象；测试面板需要把其中的`payload_json`值作为文本粘贴，不能把整个inputs对象放进该文本框。

| 测试文件 | 预期 |
| --- | --- |
| `01-prepare-standard.input.json` | 根据人才标准返回能力checkbox选项，不调用模型 |
| `02-prepare-position.input.json` | 根据岗位采用唯一关联标准，范围只保留该岗位 |
| `03-select-one-standard.input.json` | 岗位关联多个标准时返回选择项，不自动选择 |
| `04-generate-questionnaire.input.json` | 已确认两项能力，生成8题 |
| `05-adjust-on-request.input.json` | 只解释主动调整，不生成新问卷 |
| `06-regenerate-confirmed.input.json` | 用户已确认替换，按两项能力、每项3题生成6题 |
| `07-prepare-rules.input.json` | 保留按条件匹配标准的AND/OR应用范围 |
| `quick-test-payload.json` | 未序列化的短测试正文，可直接粘贴到测试面板 |

这些岗位、标准、版本和题目配置均为演示数据，正式调用必须替换为当前租户的业务快照。

### payload_json字段

| 字段 | 用途与规则 |
| --- | --- |
| `request_id / session_id` | 本次请求与业务会话的非空标识，最长128字 |
| `phase` | `welcome/review/draft`；准备接受welcome/review，生成与调整接受review/draft |
| `entry` | `{type:"standard",standard_id:"…"}`，或`{type:"position",position_id:"…",standard_id:"…"}`；岗位关联唯一标准时可省standard_id |
| `standards` | 最多100份当前可用标准快照；每份含`id/version/name/mode/positions/groups/content`；version为字符串；content保留五类完整数组，但只用cap选择出题能力 |
| `positions` | 本次相关岗位快照：`id/name/standard_ids`；standard_ids包含业务服务确认的显式关联，不能由模型提供 |
| `selected_abilities` | 标准能力名称数组；准备时省略则沿用原型默认全选，传空数组表示用户尚未勾选；生成至少一项，最多20项，不允许标准以外能力 |
| `counts` | 每项能力的`single/multi/score/essay`四个整数，均为0–5；省略时默认3/1/1/1；生成时至少一种题型大于0 |
| `purpose / scenario` | 可选目的与场景，最多3000字；未填场景时沿用purpose，再无内容则使用一般工作情境，不强制补充文字 |
| `title` | 可选问卷名称，默认“标准名称 360 评估”，最多100字 |
| `confirmed` | 生成时必须严格为布尔true，代表用户已点击原确认卡的生成按钮 |
| `expected_standard_version` | 生成或调整时必须等于当前标准快照version；不符则返回stale_source并回到原确认卡 |
| `questionnaire_version` | 当前问卷的非负整数版本，首次生成通常为0 |
| `expected_questionnaire_version` | 替换已有问卷时与当前版本一致 |
| `replace_confirmed` | 替换已有问卷时必须为布尔true，代表已有替换提醒已确认 |
| `user_message` | 仅调整动作必填，本轮主动提出的调整要求，最长3000字 |
| `turns` | 可选现有对话，最多100项`{role:"user/assistant",text:"…"}`，原样带入编辑页基础数据 |
| `ability_definitions` | 可选能力解释：`name/description/levels`，levels为`[{level:"L4",description:"…"}]`。提供时按实际等级定义出题；没有定义时不编造企业官方等级条款 |

标准中`cap`仍使用当前原型的`[["系统架构","L4"],…]`形式。工作流不把职责、经历、动力或潜力当成额外评估维度，也不新增能力指标。

传入的是可信业务快照，不是让模型选择的数据库。岗位范围、租户权限、人员匹配和源版本读取均由服务端负责。工作流不需要、也不接收全量人员档案。

## 5. 输出与问卷编辑页

Output返回：

- `status`：业务状态。
- `reply`：可直接展示的简短回复。
- `can_create`：只有完整问卷通过校验才为true，不代表已经保存或发布。
- `result_json`：JSON字符串，包含确认卡、配置、来源版本、题目总数及编辑器基础信息。
- `question_batches`：每项能力一个JSON字符串。批次含`ability/questions/question_metadata`，按标准中的能力顺序返回。

分批输出避免把最大400道题挤进代码节点的一条超长字符串，也避免漏掉被截断的题目。完整题目必须读取全部批次，不要只取第一项。

`questions`每题严格对应当前编辑器：

```json
{
  "id": "q-代码生成的稳定编号",
  "ability": "系统架构",
  "type": "single",
  "text": "题目正文",
  "options": ["行为表现一", "行为表现二", "缺少观察，无法判断"]
}
```

单选/多选需要2至6个非空且不重复的选项。打分/问答的options为空数组；打分量表继续由页面显示1–5分及“无法判断”。本问卷是工作行为评估，不输出正确答案、考试判分、员工得分或L等级换算。

`question_metadata`另存题目对应的能力、来源标准/版本、要求等级与观察行为，不能用模型生成的行为摘要冒充企业既有条款。不将这部分元数据塞进当前编辑器题干。

### 创建按钮的接入示例

以下仅说明与已有页面的数据连接方式，本轮未修改现有前端代码：

```javascript
const result = JSON.parse(outputs.result_json);
if (outputs.status !== 'ok' || !outputs.can_create) return;

const questions = outputs.question_batches.flatMap(raw => JSON.parse(raw).questions);
const editorDraft = { ...result.editor_base, questions };

// 在实际点击创建时，先由业务服务检查来源与问卷版本仍然一致。
sessionStorage.setItem('talent-assessment-ai-draft-v1', JSON.stringify(editorDraft));
location.href = result.editor_path; // assess-new.html?ai=1
```

`editor_base`包含当前编辑器读取的`title/standardId/standardName/scope/scopeLabel/sourceContent/purpose/scenario/counts/turns`，合并questions后才是完整带入对象。进入编辑页后继续支持修改、预览和保存草稿，不自动保存。

岗位入口新增的“实际岗位范围”与来源标准的原始范围可能不同。工作流分别返回`review.scope`和`source_snapshot.scope`；后续接入岗位入口时，业务服务/编辑器应以来源版本或source_snapshot核对标准变化，以实际范围确定本次对象，不能沿用“实际范围必须等于原标准完整范围”的旧比较逻辑。本轮没有把未接入的岗位流程宣称成现有页面已经支持。

### 状态处理

| 状态 | 页面行为 |
| --- | --- |
| `needs_selection` | 在当前对话内展示标准选项，用户点击选择后继续 |
| `needs_confirmation` | 渲染已有能力勾选卡及题型数量控件，不额外插入新步骤 |
| `ok` | 调整分支更新配置；生成分支展示完整问卷，只有can_create=true时允许创建 |
| `replacement_required` | 沿用已有替换提醒；确认后再生成，取消保留现有问卷 |
| `needs_clarification` | 只有不能执行的具体歧义才提问，不强迫用户回复无关问题 |
| `stale_source / stale_questionnaire` | 不调用出题模型、不替换旧内容，重新读取并确认对应信息 |
| `invalid` | 展示业务错误，保留现有问卷，不采用部分批次 |
| Dify运行失败 | 模型/解析失败时整体运行失败，由业务服务处理；不使用虚构题目或半份问卷兜底 |

## 6. 校验与版本边界

- 每个能力的四种题型数量逐项核对，总数相等仍不能掩盖题型缺失。
- 代码绑定能力和题目ID，模型不能通过输出字段更换能力；同一请求重试得到稳定ID。
- 校验空题、空选项、重复选项、非法题型、重复题干、缺失能力和超长内容；失败时`can_create=false`，不返回可采用的部分问卷。
- 输入版本检查发生在模型调用前。调用期间的数据库变化仍需服务端在接收结果、创建和保存时再次核对；工作流无法自行观察外部数据库。
- 服务端保存会话、选择、对话与问卷版本，按request_id去重，防止重复生成和过期结果覆盖手工编辑。
- 手工改数量/勾选不需要调用adjust_request；直接将最终选择传入生成即可。未发送文字不由本工作流擅自提交。
- 配置为不联网、不展示模型推理、不自动重试；不要将迭代节点或内部检查转成新的用户确认步骤。

## 7. 本地验证

```bash
python3 -m unittest discover -s tests -p test_assessment_workflow.py -v
```

本地测试读取交付YAML，实际执行其中Python代码节点，并按节点连线模拟分支和迭代；Qwen输出用固定样例替代。覆盖双入口、标准多选一、checkbox数据、可选补充、确认门禁、源版本、替换提醒、精确题数、400题分批、选项合法性、重复题干和编辑器字段。

## 8. 官方格式依据

- [Dify Iteration节点](https://docs.dify.ai/en/cloud/use-dify/nodes/iteration)
- [Dify LLM结构化输出](https://docs.dify.ai/en/cloud/use-dify/nodes/llm)
- [Dify Workflow API](https://docs.dify.ai/en/api-reference/workflow-runs/run-workflow)
- [Dify 1.9.2迭代节点字段](https://github.com/langgenius/dify/blob/1.9.2/api/core/workflow/nodes/iteration/entities.py)
- [Dify 1.9.2官方迭代DSL样例](https://github.com/langgenius/dify/blob/1.9.2/api/tests/fixtures/workflow/array_iteration_formatting_workflow.yml)
- [官方通义插件Qwen3.6 Plus定义](https://github.com/langgenius/dify-official-plugins/blob/main/models/tongyi/models/llm/qwen3.6-plus.yaml)
