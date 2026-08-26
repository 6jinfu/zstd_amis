# 人才发展分析 MCP Apps

该服务把两份 Dify Chatflow 包装为符合 MCP Apps 扩展的交互工具：

- `organization-structure-analysis` → `ui://talent-analysis/organization-structure.html`
- `key-position-analysis` → `ui://talent-analysis/key-position.html`
- `upload-analysis-file` → 将 MCP App 中选择的材料上传至对应 Dify 应用

HTML 资源使用 `text/html;profile=mcp-app`，由支持 MCP Apps 的宿主在沙箱 iframe 中渲染。Dify 只负责 Qwen3.6-Plus 分析和 `RESULT_JSON`，不再生成页面组件定义。

## 准备 Dify 应用

分别导入：

- `../dify/organization-structure-analysis-chatflow.yml`
- `../dify/key-position-analysis-chatflow.yml`

发布两个应用，并获得各自的 API Key。

## 启动

```bash
cd mcp-apps
npm install
cp .env.example .env
```

将 `.env` 中两个 Key 改为真实值，再执行：

```bash
npm run build
set -a
source .env
set +a
npm start
```

HTTP MCP 地址为：

```text
http://127.0.0.1:3001/mcp
```

也可以使用 stdio：

```bash
npm run start:stdio
```

## 数据流

1. 宿主调用分析工具。
2. 工具通过 `_meta.ui.resourceUri` 关联对应 `ui://` HTML 资源。
3. 宿主加载并在沙箱 iframe 中渲染配置向导。
4. 用户在卡片、表单和权重控件中完成配置。
5. UI 通过 `tools/call` 调用同一分析工具，服务端调用对应 Dify Chatflow。
6. 服务端从 Dify 回复中提取 `RESULT_JSON`，作为 `structuredContent` 交给 UI 渲染结果卡片。

不支持 MCP Apps 的 MCP 客户端仍会看到工具返回的文本摘要，但不会显示交互界面。
