# 人才发展高保真原型

这是一个静态 HTML 业务原型，覆盖岗位中心、评鉴中心、发展中心、人才中心和系统设置等模块。

后续接手或继续迭代时，先阅读 [`PROJECT_HANDOFF.md`](PROJECT_HANDOFF.md)；完整需求再按任务定向查看当前 PRD，无需从历史资料开始通读。

## 本地预览

项目不需要安装前端依赖，运行：

```bash
python3 serve.py
```

然后访问 <http://127.0.0.1:8765/>。

## 目录说明

- `app/`：静态 HTML、CSS 与交互脚本。
- `newprd/`：当前生效的产品需求与接口说明。
- `prd/`：历史需求资料，仅用于追溯。
- `deliverables/`：业务流程图及可编辑交付文件。
- `screenshots/`：原型视觉回归截图。
- `scripts/`：交付物辅助脚本。
- `dify/`：组织结构分析与关键岗位分析的 Dify Chatflow 导入文件。
- `mcp-apps/`：将两份 Dify Chatflow 包装为交互式 MCP Apps 的服务端与 HTML 资源。

当前需求入口见 [`newprd/README.md`](newprd/README.md)。用户在对话中形成的最新明确结论如与旧文档冲突，以最新结论为准，并须同步更新当前 PRD 与交接文档。
