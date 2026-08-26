# 参数直传版 Dify Workflow

这两份文件与原有“对话 + MCP Apps”版本并存，不覆盖原文件：

- `organization-structure-analysis-parameter-workflow.yml`
- `key-position-analysis-parameter-workflow.yml`

参数直传版用于人才发展服务端调用 `POST /v1/workflows/run`。页面负责选择岗位和配置方法，业务服务负责固化岗位快照并把 JSON 参数传给 Dify；Dify 不自行查询或扩大岗位范围。

## 1. 组织结构分析

核心输入：

| 变量 | 内容 |
| --- | --- |
| `run_id` | 本次业务运行 ID |
| `project_name` | 组织结构版本草稿名称 |
| `positions_json` | 管理员已选岗位快照数组 |
| `methods_json` | 已选方法编码数组 |
| `dimension_config_json` | 岗位评价维度和权重 |
| `structure_config_json` | 结构分析指标组开关 |
| `grid_config_json` | 序列数、层级数和可选名称 |
| `method_priority` | 多方法冲突时的优先级 |

支持的方法编码：

- `position_evaluation`
- `structure_analysis`
- `structure_design`
- `position_definition`
- `efficiency_analysis`

`positions_json` 示例：

```json
[
  {
    "position_id": "P001",
    "position_code": "RD-AI-03",
    "position_name": "高级算法工程师",
    "department_id": "D001",
    "department_name": "研发中心",
    "category": "研发",
    "headcount": 6,
    "responsibilities": ["算法平台建设", "复杂模型研发"],
    "qualification": "机器学习与工程化能力",
    "organization_context": "承担核心算法平台建设",
    "dimension_scores": {
      "task": 82,
      "power": 55,
      "environment": 40,
      "professional": 92,
      "interpersonal": 60,
      "thinking": 90
    }
  }
]
```

流程只允许返回 `positions_json` 中的岗位。结果包含序列、层级、岗位族、逐岗位归类、未归类岗位和人工校准项。

## 2. 关键岗位分析

核心输入：

| 变量 | 内容 |
| --- | --- |
| `run_id` | 本次业务运行 ID |
| `project_name` | 分析项目名称 |
| `org_version_id` | 引用的生效组织结构版本 |
| `positions_json` | 管理员已选的具体岗位快照 |
| `views_json` | `economic`、`ability` 至少一个 |
| `view_weights_json` | 双视角权重；只选一个时自动归一为 100% |
| `art_config_json` | ART 变量开关和分组权重 |
| `key_threshold` | 关键系数建议阈值，范围 0～1 |

`positions_json` 示例：

```json
[
  {
    "position_id": "P001",
    "position_code": "RD-AI-03",
    "position_name": "高级算法工程师",
    "group_code": "G-S1-L2",
    "group_name": "研发·骨干",
    "economic": {
      "demand_score": 90,
      "supply_score": 25
    },
    "ability": {
      "art": {
        "innovation": 3,
        "decision": 2.8,
        "problem": 3,
        "collaboration": 2.5,
        "team": 2,
        "technology": 3,
        "professional": 3
      },
      "time_cost_score": 90
    },
    "facts": ["算法人才紧缺", "培养到胜任需要较长周期"]
  }
]
```

确定性公式：

```text
经济E得分 = demand_score × (1 - supply_score)
ART分组得分 = 已启用变量的组内均值
能力A得分 = ART综合得分 × time_cost_score
关键系数 = 已选视角得分按管理员权重加权
建议关键岗位 = 关键系数 ≥ key_threshold 且所选视角数据完整
```

页面可使用 0～1 或 0～100 的经济和时间成本分数；ART 变量固定为 1～3。Qwen3.6-Plus 只生成业务理由，不修改代码节点计算出的关键系数和阈值判断。

## 3. 调用方式

```json
{
  "inputs": {
    "run_id": "KPAR_20260807_001",
    "project_name": "2026年度关键岗位分析",
    "org_version_id": "ORGV2",
    "positions_json": "[{...}]",
    "views_json": "[\"economic\",\"ability\"]",
    "view_weights_json": "{\"economic\":50,\"ability\":50}",
    "art_config_json": "{...}",
    "key_threshold": 0.75
  },
  "response_mode": "blocking",
  "user": "tenant:T001:operator:U001"
}
```

JSON 类型参数在 Dify Start 节点中使用 paragraph，因此调用时应序列化为 JSON 字符串。业务服务收到 `result_json` 后仍须执行 Schema、岗位范围和重复 ID 校验，再保存草稿或进入人工确认。
