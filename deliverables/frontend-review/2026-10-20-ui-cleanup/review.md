# 样式清理与缓存防回归

2026-10-20，保持现有界面和业务不变。

## 清理

- 将关键岗位独有的类别树选择器限定为 #kp-tree，不再重复覆盖 scope-category 共用组件。
- 删除 styles.css 与 production-ui.css 中的职级树桌面覆盖；设置页桌面尺寸、状态和操作统一归 settings-editor.css 维护。
- 合并两份相同搜索 SVG 定义，搜索、文件 / 文件夹和箭头增加固有宽高，避免无样式时 SVG 按容器宽度放大。
- 不清理其他历史模块或更改业务数据。

## 防回归

- scripts/asset_versions.py 默认只校验，--write 同步；所有 HTML 的本地 CSS / JS 引用用内容指纹，不再手写日期。检查实际文件存在，缺失时整批不写入。
- serve.py 启动自动同步 248 处引用；导入不启动服务 / 切换工作目录。本地预览统一 no-store，带旧 v 参数也不返回 immutable。
- 已核实旧进程 cwd 为本项目 app 后重启 8766；新进程启动验证 248 处引用且 0 过期。旧 production-ui.css?v=20261020ap 实际返回 HTTP 200、Cache-Control: no-store, must-revalidate / Pragma: no-cache / Expires: 0。
- README、交接和 PRD V1.60 同步运行和检查方式。

## 验证

- 5 项 unittest 全通过：过期引用只检查失败、内容变更导致新指纹、缺失文件阻止部分写入、嵌套 / 根路径与 URL 参数及外链保持、实际 HTTP 旧版本 URL 禁用缓存且响应新文件内容。
- 13 个页面清理前后逐项比较组件宽高、字体、行高、padding、display、颜色，style-diff.json 为空，布局与外观完全一致。
- 人才部门销售筛选只剩王芳；范围搜索匹配研发中心；职级收起后剩管理序列 2 行，展开与选中正常；标准类别抽屉 560px、搜索 14px、文件 / 文件夹 16px、无页级 footer，搜索产品保留父级。
- Node 语法检查共用组件通过；资源检查 248 处 / 0 过期；git diff --check 通过。
- 未验证移动端；本轮样式整理限定既有桌面媒体规则。

证据：before.json、after.json、style-diff.json、interactions.json、talent-list-after.png、settings-after.png、category-manager-after.png。
