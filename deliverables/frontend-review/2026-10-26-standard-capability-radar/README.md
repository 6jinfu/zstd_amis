# 人才标准帮建能力雷达图验证

日期：2026-10-26。页面：`http://127.0.0.1:8766/standards.html` 的 AI 帮建草稿预览。

- 三项原始草稿：算法设计 L4、模型工程 L4、特征工程 L3。图名、词条、等级及编辑入口清晰可见，见 `three-capabilities.png`。
- 编辑为五项，并将算法设计从 L4 调至 L5：图形及标签同步变化，见 `five-capabilities.png`。
- 编辑为二十项：使用编号轴及完整词条/等级对照列表，见 `twenty-capabilities.png`。全部二十项可在预览区滚动查看。
- 编辑为单项：显示“算法设计 L4”列表；清空后显示“0 项 / 暂无内容”，不补造雷达图维度。
- 沿用原确认与生成步骤；验证过程仅编辑临时草稿，没有保存或覆盖人才标准。
- `node --check app/standard-ai-assistant.js`、248处资源指纹检查通过。`python3 -m unittest discover -s tests -p 'test_preview_assets.py' -v` 共5项通过；缓存测试需本机临时端口，已在允许端口绑定的环境完成。

未接通或调用真实 AI 模型。现有移动端隐藏右侧预览的策略保持不变，本轮未扩展移动端预览。
