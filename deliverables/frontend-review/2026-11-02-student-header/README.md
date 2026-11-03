# 学员岗位详情头部优化

2026-11-02，按用户浏览器标记调整岗位详情头部。仅修改student-client/requirements.css及Web/H5资源指纹，业务代码和数据保持不变。

- 白底头部，标题下16px展示标准；说明位于选择器下方8px，与选中内容左沿对齐。
- 选择器320px/44px，手机全宽；返回按钮桌面至少40px高、窄屏44px。
- Web：产品经理双标准、说明与方案同步切换；产品专员单标准；返回通道。
- H5：390px无横向溢出；1280px下画布430px；标准/方案切换及返回地图。
- node --test student-client/tests/requirements.test.cjs：10项通过。
- scripts.asset_versions.sync_assets("student-client")：28处检查通过，无过期指纹。
- 未验证外部课程/项目执行、真实学习进度或管理端实时数据。

截图：desktop.png、mobile-390.png。

## 用户反馈后收紧选择器

桌面最终为240×32px、14px常规字重、4px圆角、14px箭头和浅中性边框。手机保持全宽、44px高、16px字号。浏览器已验证长名称与切换、390px无溢出和1280px画布430px；最终桌面截图见compact-desktop.png，前述desktop.png为首次优化记录。

## 来源纠正

删除requirements-data.js中14套无真实来源的标准简介及14份重复方案目标，无说明则不显示该行。Web确认简介节点为0，10项既有回归通过。其余五类要求与方案仍为本地演示；此次未重新验证H5布局。最终截图见no-unverified-description.png，早先截图仅为历史样式记录。
