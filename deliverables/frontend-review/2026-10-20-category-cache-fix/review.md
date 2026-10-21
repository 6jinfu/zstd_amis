# 分类组件缓存错配修复

## 复现和原因

用户原标签 IAB 38 的 production-ui.css 引用仍为 20261020ap，实测搜索 SVG 为 186×186px / position:static，分类行高 66 / 94px；新开同路由的 az 版本实测 SVG 14×14px / absolute、节点 32px。此前复用历史版本号，immutable 缓存提供了不含新分类适配规则的旧 CSS，新 DOM 与旧 CSS 不匹配。

## 修复

共享 styles.css、production-ui.css、ui/components.js 的 33 个引用分别改用各自文件 SHA-256 内容指纹；不修改分类业务、UI 尺寸和现有数据。交接和 PRD V1.59 同步规定不得复用版本。修复前用户标签的现场 DOM 与截图已检查，未写入业务数据。用户在工作中切到设置页，后续验证使用独立标签避免打断。

## 验证

- 人才库修复后 SVG 14px、行高 32px，部门销售筛选仅展示王芳，重绘正常。
- 浏览器复查 11 个路由状态：人才库、关键岗位、标准、能力库、360、人才测评、考试、宫格盘点、图谱盘点、岗位地图、岗位列表；分类面板 220px、搜索图标 14px、条目 32px / 14px，零尺寸偏差。
- 指标库动力、潜力标签再次切换检查通过。
- 3 类资源各 33 个引用，内容指纹一致性检查通过；git diff --check 通过。
- 页面样式未另外改写；先前确认的职级树 16px 名称 / 40px 行高规则保留。

截图 talent-list-after.png，数据 checks.json、additional-checks.json。
