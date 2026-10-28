# 移动学员端

本目录来自当前移动端实现，打包于 2026-10-28。
在项目根目录运行 `python3 serve.py`，打开 http://127.0.0.1:4181/mobile/index.html。
不要用 file:// 打开；页面需要读取 data.json 和 assets.json。

使用原站 Vue、Vant、ECharts 编译组件、19 份 JS/CSS 与 388 个只读查询响应。
本地代码负责模块加载、路由、接口快照和蓝白阶梯地图主题；宽屏预览最大 430px。
source/ 原件、data.json、assets.json、assets/、img/、provenance.json 均保留。
local.css 还引用项目根目录 assets/ 中两张人物图片，移动端不能只复制本目录。

岗位详情在app.js本地组件中统一切换整套人才标准及对应学习方案，共用上级requirements.js/css与requirements-data.js；原编译组件和快照保留。职级仍使用原组件。
修改入口及完整启动说明见根目录 README.md；功能边界见 FUNCTIONS.md。
历史验收图片保留在 verification/。旧备份与设计实验未打包。

校验：在项目根目录执行 `node mobile/verify.mjs`，需要 Node.js 20.11 或更新版本。
该脚本检查原文件、模块、素材、节点数据及会话凭证，并重新生成 provenance.json。

课程、考试、学习项目与 IDP 详情按真实路由打开原站独立应用，需要登录。
本地不会提交学习记录、考试结果或修改计划状态；没有离线播放器或考试后端。
