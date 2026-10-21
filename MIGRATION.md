# 换机恢复与继续开发

完整交接版本：[`v2026.10.21-all`](https://github.com/6jinfu/zstd_amis/releases/tag/v2026.10.21-all)，归档日期 2026-10-21。产品功能与当前 PRD V1.62 保持 2026-10-20 基线。

## 下载内容

从上述 Release 下载以下四个 ZIP 和 `SHA256SUMS.txt`。四个 ZIP 都使用 `zstd_amis-v2026.10.21-all/` 作为顶层目录。

| 附件 | 内容 |
| --- | --- |
| `talent-development-v2026.10.21-all.zip` | 代码、全部 PRD、交接规则、工作流、检查工具、学员端参考包、验收证据、方案、演示文稿、客户参考资料及宣传片源码文稿 |
| `promo-01-v2026.10.21-all.zip` | AI 帮建片头片尾、五分钟剪辑资料、章节与片头片尾素材 |
| `promo-02-v2026.10.21-all.zip` | title-intro 与 title-intro-v2 的源码、字体、视频、渲染帧及截图 |
| `promo-03-v2026.10.21-all.zip` | title-intro-v3 与 title-intro-v4 的源码、视频、渲染帧及截图 |

只继续管理端代码与 PRD 工作时，主 ZIP 或克隆仓库即可。要恢复本项目目录中全部已归档成果，需同时下载三个宣传素材包；GitHub 自动提供的 Source code ZIP 不包含这些大体积素材。

## 解压和检查

需要 Python 3.9 或更高版本。将四个 ZIP 放入一个空目录，在该目录执行：

```bash
python3 -m zipfile -e talent-development-v2026.10.21-all.zip .
python3 -m zipfile -e promo-01-v2026.10.21-all.zip .
python3 -m zipfile -e promo-02-v2026.10.21-all.zip .
python3 -m zipfile -e promo-03-v2026.10.21-all.zip .
cd zstd_amis-v2026.10.21-all
python3 scripts/verify_migration.py
python3 scripts/asset_versions.py
python3 -m unittest discover -s tests -v
python3 serve.py
```

浏览器访问 `http://127.0.0.1:8766/`。无需安装前端依赖，详细部署方式见 [DEPLOYMENT.md](DEPLOYMENT.md)。逐文件清单包含相对路径、字节数、SHA-256 及所在附件；校验脚本在文件缺失或内容不符时返回失败。清单不校验自身，附件整体校验值在 `SHA256SUMS.txt`。

希望保留版本历史并继续提交时，可以改用：

```bash
git clone https://github.com/6jinfu/zstd_amis.git
cd zstd_amis
git switch -c continue-from-2026-10-21 v2026.10.21-all
```

三个宣传素材包解压后，将其顶层目录下的 `deliverables/talent-development-promo/` 合并到克隆目录的同一路径，再执行上述检查。宣传片二进制文件有定向忽略规则，源码、文稿与验证记录仍由 Git 管理。

## 接手顺序和当前边界

1. 阅读 [AGENTS.md](AGENTS.md) 与 [PROJECT_HANDOFF.md](PROJECT_HANDOFF.md)，执行已有设计禁令与修改范围约束。
2. 按任务阅读 [当前 PRD](newprd/11_人才发展系统_当前版本PRD.md)，不要从 `prd/` 或 `newprd/_archive/` 推导当前需求。
3. 对照 `app/` 确认已实现状态；验收记录位于 `deliverables/frontend-review/`，不把历史截图当作当前规格。
4. 学员端参考包在 `deliverables/student-client-package/`，尚未并入 `app/`；首期按发展首页、我的画像、发展通道、我的发展计划重构。
5. 标准与 360 帮建仍为本地示例及规则流程，没有接通真实生成、附件解析和发布执行。真实后端按 `dify/`、当前 PRD 及 10 号接口文档另行接入；`mcp-apps/README.md` 说明独立扩展运行方式。
6. 宣传片最新口径在 `deliverables/talent-development-promo/five-minute-v2/`：已有字幕、剪辑指令与镜头安排，实际粗剪、音乐编排和补录待继续完成。历史带配音文稿仍保留追溯，不覆盖最新“纯音乐、画面、字幕、无人声”的结论。

## 迁移范围

本次归档覆盖项目工作区中的 Git 文件和此前未提交的项目成果；包含历史参考材料，当前需求优先级仍以交接文档和当前 PRD 为准。未修改产品功能、业务规则或 UI。

不迁移 `.git`（ZIP 下载时）、`node_modules/`、`.DS_Store`、`.claude/`、Python 缓存、`.env`、访问密钥及其他机器私有配置。按需在新电脑重新安装独立扩展的依赖、配置账号和环境变量。机器目录之外的录屏、Paper 画布、云端 Dify 应用与聊天记录不会自动随 GitHub 下载。

当前浏览器 localStorage 中临时新增的人才标准、评估草稿、人才池和设置不在这些文件中；新电脑初次打开使用代码内置示例。如需这些临时记录，应在原电脑的相同站点另行导出并迁移，不能把本次文件快照理解为已备份浏览器数据。
