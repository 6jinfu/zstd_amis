# 人才标准 AI 帮建：1127版

2026-11-16 更新。普通 Workflow、DSL 0.4.0；沿用原有 tongyi / qwen3.6-plus 模型配置，23节点、29连线、5个按动作执行的模型节点。未调用模型、未在目标 Dify 实例导入，不能据本文件声称已接通平台。

当前导入文件：[talent-standard-ai-assistant-workflow.yml](talent-standard-ai-assistant-workflow.yml)。`workflow-import-fix.yml` 同内容，兼容旧文件名。旧版已存入 `_archive/20261026/`，不是当前接入契约。

## 正常流程

输入建模要求（岗位选填）→确认生成设置→五档生成偏好→检索平台能力→优先复用已有能力，无合适项才建议新能力→排序→核对可修改的1–5重要性分→生成草稿及全部实际等级描述→局部调整→确认应用范围或更新方式→明确确认新增能力→带入编辑页→保存。

未选择能力要求时跳过能力检索、排序和评分。若已选能力但资料不足，不把空候选当成功，返回需补资料或错误。检索未完成时绝不直接生成新能力。

五档 `concise/essential/regular/expanded/detailed` 的能力上限分别6/10/14/18/20。三种描述结构为 `behavior/context_behavior/context_behavior_result`，分别对应只写行为、带上情境、包含成果；不补造能力等级，必须覆盖平台实际配置的全部等级（支持L1–L10，数量不限于五级）。

## 输入与调用

开始节点三个变量：`action`、`payload_json`（JSON字符串，≤120000字符）、`reference_files`（可选文档数组）。每次运行只处理一个明确动作；前端及业务服务负责跨轮状态。完整请求样例在 [talent-standard-ai-assistant-v3/requests/](talent-standard-ai-assistant-v3/requests/)，全为虚构测试数据。

| action | phase | 返回内容 |
|---|---|---|
| analyze_brief | welcome/review | generation_settings，整理需求及可选附件 |
| confirm_settings | review | generation_preferences，不调用模型 |
| prepare_capabilities | outline | 未检索时返回业务检索请求；检索完成后返回 capability_sort |
| confirm_sort | rank | capability_rating，建议分默认回显，不调用模型 |
| generate_draft | compare（含能力）/outline（无能力） | draft_preview + application_scope/update_strategy |
| revise_draft | scope | 只修改明确指定分项，其余手工修改保留 |
| suggest_similar_positions | scope | similar_position_selection，须真实资料和明确选定ID |
| prepare_apply | scope | new_capability_confirmation 或 editor_handoff + save_plan，不调用模型 |

公共字段包括 request_id、session_id、operation（new/update）、phase、draft_version、user_message、brief、enabled_sections、selected_sections、reference_context、catalog。后续动作须 settings_confirmed、preferences_confirmed 为true及合法 generation_preferences。草稿阶段须 draft、expected_draft_version；更新还须 source_standard（id/version/content及完整能力身份元数据）。

`catalog` 至少包含 version、positions、categories、cap、pow、pot。业务服务只提供当前租户和权限范围内的真实数据，每类候选≤500；大词典须由业务服务先检索，不可传截断的随机候选并标为完整检索。能力 cap 项包含稳定id、name、definition、dimension、category_path及levels数组，每级含level（如L1、L3、L10）和已有描述。新能力使用平台的 ability_dimensions 与 new_capability_levels，不能让模型自定等级数量。动力和潜力只可复用。

### 平台能力检索

`prepare_capabilities` 未收到 `capability_lookup.complete=true` 时返回 `status=needs_data` 和 `service_requests[0].type=search_platform_capabilities`。这是接入请求，不是已经执行的查询。业务服务须真实检索名称、定义及工作语义，更新 catalog.cap 和 version，再携带同版本的 `capability_lookup={complete:true,request_id:...,catalog_version:...}`重调。检索失败或资料不足不得标记complete。

已有匹配返回真实ID，沿用名称和实际等级；无合适项才提出临时proposal-ID、定义、维度和未匹配原因。已有同名能力不能绕开复用而新建。歧义返回澄清问题。能力候选通过快照绑定需求、偏好、词典版本等；设置变化须重新匹配。

### 排序、评分、草稿

将返回的 capability_bundle 原样随业务状态保存。排序确认传 sorted_capability_ids 和 sort_confirmed=true；评分确认传每项 importance_scores（1–5整数）与 ratings_confirmed=true。最终按分数降序，同分保持用户顺序。建议分不是岗位要求等级、员工得分或已验证事实。

草稿保留旧编辑器 `content.cap=[[名称,要求等级,雷达图名称],...]`，另返回 `capability_requirements`，保存真实/临时ID、来源、定义、维度、各实际等级描述与重要性。生成偏好置于 generationPreferences。**当前页面及数据库尚未接此扩展**，业务服务/编辑器必须同时保存新元数据，不能只保存旧三元组后宣称描述已持久化。

已有能力的定制等级描述只存本人才标准，不覆盖共享指标。新能力经用户确认，可将首次定义、维度及等级描述新增至指标库默认“AI 生成”类别。

### 更新与应用范围

更新必须显式传 update_strategy=replace/merge，无默认。replace仅替换所选维度；merge追加新条目、同名职责任务去重、同一能力用新等级及新生成描述更新，保留未涉及能力和其他维度。原基本信息、编号和应用范围保留；合并后最多20能力。历史标准缺身份/描述元数据须先由业务服务补齐，不能按同名猜测。

新建 scope_choice=position/similar/none。similar须 confirmed_position_ids，不能按类别自动全选。相似岗位节点核对duties/tasks/description真实引文；不生成岗位ID或伪造匹配概率，资料不足返回明确提示。目标岗位是否固定包含、候选默认勾选及正式相似口径仍待产品确认，本版只要求显式选择，不擅自扩展。

### 新能力确认与最终保存

prepare_apply先返回待入库清单，用户确认后回传 new_capabilities_confirmed=true、完整 confirmed_new_capability_ids、原 new_capability_confirmation_token。描述变化会使确认失效，须重新核对。

确认后只返回save_plan，execute_on=editor_save，不执行数据库写入。业务服务在用户最终保存编辑器时重验权限、源标准版本及词典版本；复查并发新增的相同能力，使用或创建“AI 生成”真实类别、创建已确认能力、将proposal映射为正式ID并保存标准，作为一个原子业务操作，失败不留半份记录；用idempotency_key防止重复保存。existing_capability_writes始终为空。编辑阶段若变更新能力内容，重新核对确认快照，不沿用旧确认。真实平台检索/建类/创建指标/标准保存API均尚未接入，不存在虚构URL。

## 输出及错误

结束节点返回result_json、status、reply、can_apply。result_json schema_version=3.0；组件统一 `{type,version:"1.0",data:{...}}`，业务服务按type渲染，记录确认值。status包括ok、needs_confirmation、needs_data、needs_clarification、invalid。can_apply仅表示可带入编辑页，不代表已保存。

错误返回issues并保留调用方原草稿；不自动重试付费模型，不输出半份可采用草稿。附件只在analyze_brief接受，最多10份有效文本、总计40000字符；扫描件需先OCR，后续动作新增附件须先回到设置确认。模型或提取服务报错由接入服务展示并保留原内容。

## 离线验证与维护

```sh
python3 dify/talent-standard-ai-assistant-v3/build.py
python3 dify/talent-standard-ai-assistant-v3/examples.py
python3 -m unittest discover -s tests -p test_talent_standard_workflow.py
```

16项离线回归执行实际DSL代码节点和分支，仅用显式替身替代模型及文档提取；覆盖检索门禁、候选身份、排序评分、实际等级、确认快照、保留更新、相似依据和手工编辑保护，10份请求可解析。不能代替目标Dify导入、插件兼容、真实模型效果与正式数据保存验证。当前未执行收费调用。

维护源为v3/runtime.py和build.py；修改源后重新生成两份DSL，不手改嵌入代码。请求由examples.py生成。
