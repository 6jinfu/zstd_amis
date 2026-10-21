# 360 项目名称遮挡修复

## 原因

表格 1120px，名称列 240.3px、操作列约 371.9px；表格可用宽度缩小到 650px 时，sticky 操作列浮到名称内容上，只剩开头一个字。另有旧的三层选择器将横向 overflow 设为 hidden，导致无法滚到右侧。

## 修复

在原 360 项目表格样式区域直接补齐滚动规则，使用与父级布局相同的明确选择器覆盖 overflow；用容器查询在表格宽度 ≤900px 时让操作列随内容滚动，>900px 保留 sticky。名称列及数据未修改，其他列表不受影响。临时测试页面已删除。

## 验证

通过临时复制正式页面并限定工作台容器宽度，在浏览器测量 650 / 824 / 960px 三种真实表格布局，不修改用户浏览器窗口。

- 650px（对应用户截图右侧表格宽度）：名称列 240.3px，完整落在容器内，操作 static；横向滚动 470px 后操作列右边缘与容器右边缘同为 1074px，按钮可访问。
- 824px：名称完整，操作 static，overflow-x:auto。
- 960px：名称完整，操作 sticky，overflow-x:auto，操作区不覆盖名称。
- 正式页面搜索“研发”显示 3 个匹配项目，重置恢复；草稿项目同样完整显示。
- 资源指纹检查 248 处 / 0 过期；git diff --check 通过。PRD V1.62 与交接同步。

证据：width-checks.json、search-check.json、narrow-after.png、narrow-actions-after.png、assess-projects-after.png。
