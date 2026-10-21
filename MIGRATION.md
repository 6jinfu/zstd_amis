# 换机恢复与继续开发

最终项目交接版本：[`v2026.10.21-project`](https://github.com/6jinfu/zstd_amis/releases/tag/v2026.10.21-project)，归档日期 2026-10-21。产品功能与当前 PRD V1.62 保持 2026-10-20 基线。

## 下载和运行

从上述 Release 下载 `talent-development-v2026.10.21-project.zip` 和 `SHA256SUMS.txt`。一个 ZIP 已包含代码、全部 PRD、交接规则、工作流、检查工具、学员端参考包、验收证据、方案、演示文稿、客户参考资料及宣传片源码文稿。

按用户最新要求，不再上传宣传视频、字体和渲染素材包。这些文件保留在原电脑，不是管理端原型运行依赖；宣传制作源码若要重新渲染，须另行准备其字体及素材。此前 `v2026.10.21-all` 标签对应范围调整前的提交，请从本版本接手。

需要 Python 3.9 或更高版本，无需安装前端依赖。解压后执行：

```bash
cd zstd_amis-v2026.10.21-project
python3 scripts/verify_migration.py
python3 scripts/asset_versions.py
python3 -m unittest discover -s tests -v
python3 serve.py
```

浏览器访问 `http://127.0.0.1:8766/`。详细部署见 [DEPLOYMENT.md](DEPLOYMENT.md)。逐文件清单在 `deliverables/migration/v2026.10.21-project/manifest.json`，包含相对路径、字节数与 SHA-256；文件缺失或内容不符时校验脚本返回失败。清单不校验自身，附件整体校验值在 `SHA256SUMS.txt`。

希望保留版本历史并继续提交时，改用：

```bash
git clone https://github.com/6jinfu/zstd_amis.git
cd zstd_amis
git switch -c continue-from-2026-10-21 v2026.10.21-project
python3 scripts/verify_migration.py
python3 serve.py
```

## 接手顺序和当前边界

1. 阅读 [AGENTS.md](AGENTS.md) 与 [PROJECT_HANDOFF.md](PROJECT_HANDOFF.md)，执行已有设计禁令与修改范围约束。
2. 按任务阅读 [当前 PRD](newprd/11_人才发展系统_当前版本PRD.md)，不要从 `prd/` 或 `newprd/_archive/` 推导当前需求。
3. 对照 `app/` 确认已实现状态；验收记录位于 `deliverables/frontend-review/`，不把历史截图当作当前规格。
4. 学员端参考包在 `deliverables/student-client-package/`，尚未并入 `app/`；首期按发展首页、我的画像、发展通道、我的发展计划重构。
5. 标准与 360 帮建仍为本地示例及规则流程，没有接通真实生成、附件解析和发布执行。真实后端按 `dify/`、当前 PRD 及 10 号接口文档另行接入；`mcp-apps/README.md` 说明独立扩展运行方式。
6. 宣传片最新文稿在 `deliverables/talent-development-promo/five-minute-v2/`：已有字幕、剪辑指令与镜头安排，实际粗剪、音乐编排和补录待继续完成。历史带配音文稿仅用于追溯，最新口径为纯音乐、画面、字幕、无人声。

## 迁移范围

本次归档包含仓库文件及此前未提交的项目成果，未修改产品功能、业务规则或 UI。历史参考材料保留，当前需求优先级以交接文档和当前 PRD 为准。

除用户取消的宣传二进制素材外，不迁移 `.git`（ZIP 下载时）、`node_modules/`、`.DS_Store`、`.claude/`、Python 缓存、`.env`、访问密钥及其他机器私有配置。独立扩展的依赖、账号和环境变量按需在新电脑配置。机器目录之外的录屏、Paper 画布、云端 Dify 应用与聊天记录不会自动随 GitHub 下载。

浏览器 localStorage 中临时新增的人才标准、评估草稿、人才池和设置不在这些文件中；新电脑初次打开使用代码内置示例。如需这些临时记录，应在原电脑的相同站点另行导出并迁移。
