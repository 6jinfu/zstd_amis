# 线上人才发展 UI 对齐（2026-10-20）

## 来源与边界

用户提供的[线上入口](https://tbcnp.21tb.com/rtr-admin-frontend/appIframe?appCode=m_aiApp_talent&jumpUrl=%252Fai-apps%252Ftalent%252Fposition%252Fkey-position)。通过已登录Chrome识别内层iframe，提取实际HTML、组件类名、计算样式；另在独立临时页直接打开已观察到的功能URL进行只读浏览。没有复制平台网络学院、BD / OD / LD、应用切换、全局搜索、切换学员或用户头像。

获取的实际资源：

- 人才发展CSS：`https://v4static.21tb.com/ai-apps/apps/talent/20261012175249/index.css?v=20261012175249`
- 组件CSS：`https://v4static.21tb.com/ai-apps/base/20261010160739/assets/setup-BRH9Viac.css`
- 同人才发展版本的`pages/position/KeyPositionPage.js`、`chunks/components/CategoryTree.js`。
- `reference/key-position-rendered.html`为实际渲染DOM源码，包含功能区域；其余下载原件、样式规则摘录、指标页实测、关键岗位列表 / 创建表单实测均在reference目录。下载资源只用于对照，没有导入线上运行时或业务接口。

## 统一规格

| 组件 | 线上实测及本地适配 |
| --- | --- |
| 主导航 | 148px、40px文字项、4px间隔、品牌蓝12%浅底选中；去除本地品牌、中心图标、折叠及合成头像通知栏 |
| 内部业务导航 | 49px栏、14px文字、32px间隔、24px左右留白、32×3px居中选中线 |
| 页面胶囊 | 52px行、28px选项、12px文字、16px间隔、蓝底白字 |
| 常规按钮 / 输入框 / 确认 | 32px、14px文字、4px圆角、平面边框；文字操作28px /14px |
| 分类范围栏 | 220px、16px内边距、32px条目、与主区间隔24px、8px完整圆角边框；保留本地树内容及操作 |
| 列表 | 普通单行46px、14px文字、22px行高、灰表头#F5F5F5、单元格9px 16px 8px；多行真实数据允许增高 |
| 分页 | 32px、4px圆角、中性浅底，选中蓝底白字 |
| 详情和弹窗 | 160px分区导航、32px行密度；修复旧详情标题sticky偏移与遮挡；4px弹窗、24px正文留白 |
| 整体 | 外围#F8F8F8、8px间隙、白色主体、24px内容留白、取消控件彩色阴影 |

原型独有的标准帮建、360问卷对话、人才池闭环、人才图谱、岗位地图、标准维度与职级编辑复用以上基础组件；没有照抄线上业务字段、记录或覆盖本地草稿。详情结构和生成流程按当前PRD保留，不声称业务结构与线上逐像素相同。

`app/production-ui.css`为针对现有静态组件的统一适配层，在全部33个引用页的页面样式之后加载，版本20261020ap。保留原框架与页面脚本；app.js仅取消桌面旧折叠记忆对新导航的影响，版本20261020ai。PRD V1.48与PROJECT_HANDOFF已同步，最新线上规格高于此前本地密度迭代记录。

## 实际 Jev 判断

调用一次TypeSafe System One，返回`jev-1.13.0`；输入1693、输出237 tokens。只发送匿名组件尺寸、原型差异和设计约束，没有发送线上实际业务记录。Jev支持只映射内层UI、采用线上组件规格和分类宽度、统一列表、保留独有功能、采用28px胶囊；完整问题、概率和响应保存在jev-request.json与jev-response.json。该调用是基于提取参数做方案判断，没有把截图发给模型，也不是逐像素视觉评分。接口依据[官方Choice说明](https://docs.typesafe.ai/primitives/choice)。

## 验证

- 1280×720桌面浏览器复核32个页面状态：所有已采样主导航148px、内部业务栏49px、普通按钮32px /14px /4px；页面均无横向溢出。长表保留内部滚动，真实多行资料自然增高。
- 单独复查指标、360、人才测评、考试、宫格、图谱、人才看板及分析视角选中态，均为28px蓝底白字。修复指标库高优先级基础规则覆盖选中背景的问题。
- 关键岗位查询得到1条匹配；编辑弹窗打开 /取消、真实主导航切换、职级P4搜索正常。没有提交线上或本地业务写操作。
- 标准帮建从示例进入信息确认，再进入内容侧重；确认表单三个下拉框均为32px /14px /4px。
- 360帮建选择销售经理标准、确认范围与能力，完整问卷在对话中展开5个能力组；创建与调整能力按钮32px /14px /4px，未创建保存。
- 4个详情页标题区复查：首屏y73px、正常文档流，不再因旧sticky top72px产生空白和遮挡；分区栏160px，无页面溢出。
- 33个适配样式链接均存在且在页面样式最后，缓存版本一致；共享脚本node --check及任务文件git diff --check通过。

未逐一验证每个隐藏弹窗与全部业务状态，也没有执行移动端验收或业务新增删除。线上原始页面保留未改动，临时参考页和本地检查页已关闭。

## 证据

- measurements.json、tab-states.json、detail-layouts.json：实际尺寸、选中态和详情布局。
- interactions.json、validation.json：交互和资源检查，含源码SHA256。
- key-position-after.png、standards-after.png、vocabulary-after.png、settings-after.png、talent-pool-after.png、ai-standard.png、ai-assessment.png：本地实际浏览器截图。
- reference目录：源码与线上截图。
