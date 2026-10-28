# 人才发展学员端独立源码

打包日期：2026-10-28。可直接作为新的 Codex 项目目录继续开发。
包含当前 Web 学员端和移动学员端，不包含管理端、历史备份或设计实验。

已于2026-10-28复制到人才发展主项目`student-client/`作为修改副本。当前主项目预览使用`python3 serve.py --port 4182`：Web为`http://127.0.0.1:4182/student.html`，H5为`http://127.0.0.1:4182/mobile/index.html`；脚本默认端口4181保持不变。服务监听0.0.0.0，同一局域网可将127.0.0.1替换为本机IP。

岗位详情顶部的人才标准统一控制“岗位要求”和“学习方案”：五类要求与对应课程、项目、实践内容同步切换，保留当前页签。使用独立业务演示数据，12个岗位14套标准均分别配置方案，产品经理与销售经理可切换两套标准。当前未接管理端实时数据或真实学习执行。

## 启动

需要 Python 3；不需要 npm、构建或安装依赖。

macOS 可双击 `启动预览.command`。也可在本目录运行：

```sh
python3 serve.py
```

- Web 端：http://127.0.0.1:4181/student.html
- 移动端：http://127.0.0.1:4181/mobile/index.html

移动端在宽屏浏览器中按最大 430px 手机画布显示。请通过 HTTP 预览，移动端需要读取 JSON，不能直接用 file:// 打开。
端口占用时运行 `python3 serve.py --port 4182` 并使用相应端口。终端按 Ctrl+C 停止。

## 继续修改

在 Codex 中将解压后的整个文件夹添加为新项目，并从本目录开始工作。

| 文件 | 用途 |
| --- | --- |
| `student.html` | Web入口与其他页面交互；岗位要求使用下列共用资源 |
| `requirements.js`、`requirements.css` | 两端共用的标准要求、等级雷达、独立方案展示与旧字段映射 |
| `requirements-data.js` | 12个岗位、14套标准及对应方案的业务演示数据，使用明确节点ID映射，不改原接口快照 |
| `assets/` | Web 图片与移动端共用的地图人物图片 |
| `mobile/index.html` | 移动端入口、资源加载 |
| `mobile/app.js` | 移动端本地路由、接口快照适配、原组件接入 |
| `mobile/loader.js` | 原 webpack 模块加载器 |
| `mobile/local.css` | 移动端本地主题、阶梯地图、布局适配 |
| `mobile/detail-canvas.css` | 详情按手机画布比例缩放的样式 |
| `mobile/source/` | 原站编译后的 JS/CSS，包括 Vue、Vant、ECharts |
| `mobile/data.json` | 388 个原站只读响应快照 |
| `mobile/assets.json`、`mobile/assets/`、`mobile/img/` | 图片映射与本地素材 |
| `mobile/provenance.json`、`mobile/verify.mjs` | 来源记录与完整性检查 |
| `mobile/verification/` | 历史验收截图与记录 |
| `学员端功能说明.md`、`mobile/FUNCTIONS.md` | 两端功能范围 |
| `AGENTS.md` | 新项目协作边界与修改入口 |
| `QA.md` | 本次打包验证记录 |

Web 端使用原生HTML/CSS/JS，岗位要求共用上述三个资源文件。移动端保留采集到的原Vue编译代码，并非完整的Vue单文件组件工程；岗位详情通过app.js本地组件适配，原编译文件不改。
两端数据实现独立，当前没有互通后端。

## 已知边界

- Web 图片已全部改为包内相对路径；移动端组件、数据、图标、封面已随包保存。
- 这是静态复原与本地数据快照，不包含生产后端、真实登录或权限。
- 移动端课程、考试、学习项目与 IDP 详情会打开真实原站独立应用，需要原站登录；本包不包含对应播放器、试卷或后端。
- `mobile/capture.mjs` 与 `download-assets.mjs` 为后续只读再采集工具，正常运行不需要执行。没有打包登录态或会话凭证。
- Web 功能说明为已有页面说明；以当前源码与实际页面为准。历史截图仅供对照，不代表本次逐项回归。

## 完整性检查

需要 Node.js 20.11 或更新版本：

```sh
node --check mobile/app.js
node --check mobile/loader.js
node mobile/verify.mjs
```

`交付清单.sha256` 记录包内文件校验值。运行 verify.mjs 会重新生成 provenance.json。
