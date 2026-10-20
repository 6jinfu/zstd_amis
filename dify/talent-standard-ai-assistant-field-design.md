# 人才标准 AI 帮建：Dify 字段与流程设计

对应可导入文件：`dify/talent-standard-ai-assistant-chatflow.yml`

## 1. 为什么使用 Advanced Chatflow

当前人才标准帮建不是单轮生成，而是连续对话：

1. 用户提交岗位和业务场景。
2. AI 返回建模信息确认卡。
3. 用户确认后，AI 才生成标准草稿。
4. 用户可以针对某一类内容继续修改，未指定的内容尽量保留。
5. 用户确认应用范围后，前端才把草稿带入人才标准新建页；Dify 不负责保存或发布。

因此使用 Dify 的 `advanced-chat` 导出格式，依靠对话上下文识别“确认 / 生成 / 修改 / 应用范围”阶段。若只用 `workflow`，需要由业务服务端额外保存并传回整份状态，和当前原型的交互不一致。

## 2. 首轮输入字段

| 字段 | Dify 类型 | 必填 | 约束 | 说明 |
| --- | --- | --- | --- | --- |
| `target_position` | text-input | 否 | 最长 128 | 页面已选岗位；为空时由 AI 从需求或资料中识别，无法确认就保留未知 |
| `business_scenario` | paragraph | 是 | 最长 3000 | 业务场景、岗位目标、任职背景和希望生成的内容；不能只写“优化一下” |
| `reference_files` | file-list | 否 | 最多 10 个 | 岗位说明书、组织材料、业务资料等，支持 PDF / DOCX / XLSX / CSV / TXT / MD |

`business_scenario` 只作为建模需求，不直接等于标准内容。岗位层级、管理范围、生成内容由 AI 提取后放入确认结果，用户确认后再进入生成阶段。参考资料为空时走“无参考资料”分支，不把空值直接传给文档解析节点；有资料时才解析，并将多文件文本合并为 `array[string]`。

## 3. 结构化结果

Dify 对话回复由两部分组成：

- 面向用户的简短中文 `reply`；
- HTML 注释 `TALENT_STANDARD_RESULT`，里面是服务端可解析的 JSON。

核心结果结构如下。`page_state` 按当前 AI 帮建页面的字段命名设计，`page_state.draft` 按 `standard-editor.js` 实际接收的对象设计：

```json
{
  "schema_version": "1.0",
  "stage": "modeling_confirmation",
  "action": "confirm_modeling",
  "status": "pending_confirmation",
  "page_state": {
    "brief": {"scenario": "", "level": "基层/初级", "management": "不带团队"},
    "selected_position": {"id": "", "name": "", "source": "user", "confidence": 0.9},
    "generated_sections": ["duty", "exp", "cap", "pow", "pot"],
    "draft": {
      "name": "",
      "category": "通用标准",
      "description": "",
      "mode": "positions",
      "positions": ["SA-201"],
      "groups": [],
      "content": {
        "duty": [{"n": "职责名称", "t": ["任务一", "任务二"]}],
        "exp": ["经历或任职条件"],
        "cap": [["能力指标", "L3"]],
        "pow": ["动力指标"],
        "pot": ["潜力指标"]
      }
    },
    "evidence_notes": [],
    "scope": {
      "status": "pending",
      "selection": "position",
      "mode": "positions",
      "positions": ["SA-201"],
      "groups": [],
      "confirmation_text": ""
    }
  },
  "validation": {
    "status": "needs_confirmation",
    "issues": [],
    "missing_evidence": [],
    "conflicts": []
  }
}
```

## 4. 与当前页面和人才标准编辑器的映射

| Dify 结果 | 当前编辑器字段 | 处理规则 |
| --- | --- | --- |
| `page_state.brief.scenario` | 建模信息卡“业务场景” | 对应页面内部 `brief.scenario` |
| `page_state.brief.level` | 建模信息卡“岗位层级” | 对应页面内部 `brief.level` |
| `page_state.brief.management` | 建模信息卡“管理范围” | 对应页面内部 `brief.management` |
| `page_state.selected_position` | 建模信息卡“目标岗位” | 岗位 ID 和名称都必须来自页面或业务主数据，不能由模型编造 ID |
| `page_state.generated_sections` | 建模信息卡“生成内容” | 只允许 `duty / exp / cap / pow / pot`，至少保留一类 |
| `page_state.draft.name` | 新建页 `name` | 进入新建页后仍可编辑 |
| `page_state.draft.category` | 新建页 `category` | 仅允许当前类别树中的合法类别 |
| `page_state.draft.description` | 新建页 `description` | 作为标准说明，不替代业务场景 |
| `page_state.draft.mode` | 新建页 `mode` | 只允许 `positions / rules / none` |
| `page_state.draft.positions` | 新建页 `positions` | 字符串数组，保存岗位 ID，不是岗位对象数组 |
| `page_state.draft.groups` | 新建页 `groups` | 组内 AND、组间 OR；字段只允许部门、现岗位、岗位类别、关键岗位 |
| `page_state.draft.content.duty` | 新建页 `content.duty` | 对象字段为 `n` 和 `t` |
| `page_state.draft.content.exp` | 新建页 `content.exp` | 字符串数组 |
| `page_state.draft.content.cap` | 新建页 `content.cap` | 二元数组 `[指标名, L1-L5]`，最多 20 项 |
| `page_state.draft.content.pow` | 新建页 `content.pow` | 指标名称数组 |
| `page_state.draft.content.pot` | 新建页 `content.pot` | 指标名称数组 |
| `page_state.evidence_notes` | 帮建结果的依据元数据 | 不写入当前标准编辑器对象，仅供前端或服务端展示/记录 |

AI 页面中的应用范围卡使用 `selection=position / category / none`；带入编辑器前再映射成 `mode=positions / rules / none`。其中 `category` 需要业务服务根据当前岗位主数据展开为岗位 ID 数组，不能让模型猜测岗位 ID。带入新建页后必须保持“待确认、未保存”，不能由 Dify 直接写入标准库或发布给人员。

## 5. 确定性边界

- 代码节点只做输入长度校验、闭集字段校验、JSON 清洗和结构输出。
- AI 负责意图识别、资料匹配、字段提取和内容建议。
- AI 不负责应用范围的最终生效、不负责保存发布、不负责权重或阈值计算。
- 岗位、层级、管理范围、内容类别存在冲突或低置信度时，结果必须进入 `needs_confirmation`，由用户确认。
- `duty / exp / cap / pow / pot` 之外不扩展平行标准模型；不在本流程中加入引用已有标准、认证引擎或复杂多等级规则。

## 6. 导入后需要检查的配置

1. Dify 是否已经配置 `langgenius/tongyi/tongyi` 下的 `qwen3.6-plus`；若没有，在导入后替换为当前可用的中文模型。
2. 开启文档解析能力，并确认租户的文件大小、文件数量和远程 URL 权限符合实际部署限制。
3. 先用无附件场景验证三轮对话，再验证 PDF / DOCX 资料抽取。
4. 服务端或前端只消费 `TALENT_STANDARD_RESULT` 中的 JSON，不把 `reply` 当作持久化数据源。
