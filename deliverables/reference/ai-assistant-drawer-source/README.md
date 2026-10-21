# AI 帮建抽屉源码采集说明

- 采集时间：2026-09-20
- 外层页面：`https://tbc.21tb.com/rtr-admin-frontend/appIframe?appCode=apaas_apb-job-sys`
- 人才发展子应用：`https://tbc.21tb.com/apaas-apps/micro-app/apb-job-sys/index.html?pageCode=apb_cpm_GWZX_TABS&current_app_id=596abb267c8e42e0a80c457a1ad1bc5c`
- AI 帮建页面：`https://tbc.21tb.com/job-sys/amis/AICreateQuestion?current_app_id=596abb267c8e42e0a80c457a1ad1bc5c&isAmis=true`

## 已保存内容

- `original.html`：AI 帮建页面返回的原始 HTML，包含 Webpack 运行时和资源映射。
- `assets/js/`：浏览器当前已加载的 AI 帮建相关 JavaScript 文件。
- `assets/css/`：浏览器当前已加载的 AI 帮建相关样式文件。

当前采集目录约 13 MB。页面为 Vue/Webpack 应用，原始 HTML 只提供加载骨架，主要界面实现在 `assets/js/chunk-018c5eee.0f96c8ca.js` 和 `tbc-ai-kit.umd.js` 中。

## 已确认的页面结构

- 页面以抽屉对话框打开，抽屉内再嵌入独立 iframe。
- 左侧为可展开的历史会话栏，包含“新建会话”和历史会话列表。
- 主区域顶部为“AI 帮建”和会话控制。
- 欢迎区包含欢迎语、说明文字和三条快捷提问。
- 底部包含岗位选择、岗位要求输入区以及 AI 内容免责声明。
- 当前页面使用 `tbc-ai-kit` 作为会话 UI，页面自身负责岗位选择、快捷问题、消息拦截及建模结果渲染。

## 复原注意事项

- 采集文件仅用于界面和交互结构研究，不能直接脱离原系统运行；原页面依赖登录态、后端接口、SSE 会话服务和父页面 `postMessage`。
- 后续复原应按本项目现有静态原型方式重写，不直接引入生产系统压缩包。
- 当前浏览器中的动态 DOM 约 254 KB；原始 HTML 为约 13 KB 的加载骨架。
