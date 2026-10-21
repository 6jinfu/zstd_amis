# 人才发展高保真原型

这是一个静态 HTML 业务原型，覆盖岗位中心、评鉴中心、发展中心、人才中心和系统设置等模块。

后续接手或继续迭代时，先阅读 [`PROJECT_HANDOFF.md`](PROJECT_HANDOFF.md)；完整需求再按任务定向查看当前 PRD，无需从历史资料开始通读。

## 下载与换机接手

最新完整交接版本为 [`v2026.10.21-all`](https://github.com/6jinfu/zstd_amis/releases/tag/v2026.10.21-all)。代码、PRD、交接和常规成果在仓库中；宣传片完整素材放在该版本的三个 ZIP 附件中。下载范围、恢复、校验及接手顺序见 [`MIGRATION.md`](MIGRATION.md)。

## 本地预览

项目不需要安装前端依赖，运行：

```bash
cd 你的项目目录
python3 serve.py
```

本机访问 <http://127.0.0.1:8766/>；同一局域网的其他电脑使用启动日志显示的 `http://本机局域网IP:8766/`。

`serve.py` 默认监听所有本机网络接口，`8766` 是本项目的默认端口；如需临时使用其他端口，可执行 `python3 serve.py 端口号`。

开发服务器对页面与资源统一禁用缓存；启动时自动核对本地 CSS / JS 是否存在，并更新 HTML 中的内容指纹，不再手写或复用日期版本号。修改资源后可手动同步并检查：

```bash
python3 scripts/asset_versions.py --write
python3 scripts/asset_versions.py
python3 -m unittest discover -s tests -v
```

第二条命令只检查、不修改文件；指纹过期或资源缺失会返回失败。静态打包前也应运行这两条资源命令。

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
