from pathlib import Path
import json,xml.etree.ElementTree as E
from html import escape
import zipfile
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).resolve().parent
before=json.load(open('/private/tmp/1127-audit-before.json'))['data']['document']
r=list(E.fromstring('<root>'+before['content']+'</root>'))
def p(t):return '<p>'+escape(t)+'</p>'
def h(t,n=3):return f'<h{n}>'+escape(t)+f'</h{n}>'
def ul(rows):return '<ul>'+''.join('<li>'+escape(x)+'</li>' for x in rows)+'</ul>'
def table(headers,rows):return '<table><thead><tr>'+''.join('<th>'+p(v)+'</th>' for v in headers)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+p(v)+'</td>' for v in row)+'</tr>' for row in rows)+'</tbody></table>'
def write(name,s):
 E.fromstring('<root>'+s+'</root>');(OUT/(name+'.xml')).write_text(s)
write('01-流程',p('人才标准列表打开AI帮建 → 输入建模要求（岗位选填）→ 确认生成设置与偏好 → 平台能力优先匹配，无合适项再生成建议 → 能力排序与重要性评分 → 草稿审阅及修改 → 确认范围或更新方式 → 如有新能力，明确确认新增指标库 → 带入编辑页并保存。')+
 '<img path="@./deliverables/1127-ai-workflow-20261116/AI帮建流程.png" caption="AI帮建主流程；未选能力要求时跳过检索、排序和评分。"/>'+ul([
 '首页：岗位选填；未选岗位仍可按通用场景生成，默认暂不关联。示例只描述建模要求，点击直接发送；用户也可自行输入。附件入口保留，当前页面未接真实解析。',
 '生成设置：选择新建或更新已有标准，核对目标岗位和业务场景，在已启用维度中至少选择一项。需求理解卡仍隐藏，不把内部整理说成已向用户展示。',
 '生成偏好：简洁、精要、适中、充实、详细五档，默认简洁；包含能力要求时，选择只写行为、带上情境、包含成果，默认只写行为。能力项上限依次6/10/14/18/20，不为凑数增加无关能力。',
 '平台能力优先：业务服务先检索当前租户有权限的已有能力，工作流优先按定义、类别和岗位工作内容复用；仅完成检索且无合适项时提出新能力，区分已有能力和待新增建议。检索失败、资料不足或匹配歧义应提示，不直接当作无匹配。',
 '能力排序与评分：按用户排序确认，再核对工作流返回的1–5分建议初始分，允许修改；最终分数降序，同分沿用用户顺序。排序使用拖拽并保留键盘操作，不显示上下箭头。未选择能力时跳过；已选择但缺资料时提示，不能以空候选冒充完成。',
 '草稿：按实际配置等级生成每项能力的全部等级描述，不强制五级。支持分项编辑及明确的定向修改，保留其他手工编辑。新建确认范围；更新保留原基本信息和范围，须明确选择直接覆盖或保留更新，无默认选择。',
 '保留更新：以新生成的描述更新本次涉及的同一能力，保留未涉及的其他能力。已有能力的定制描述只存当前标准；不覆盖已有共享指标。',
 '新能力入库：新能力经用户明确核对确认后，同时新增至指标库／能力指标默认“AI 生成”类别。确认清单包括定义、维度及实际等级描述；带入编辑页不等于保存，最终编辑保存时由业务服务保存标准和已确认新能力。取消不入库。']))
replacements={
 'doxcn4BFJb7s5VM0uxqEwEW9LWb':'目标链路：业务服务提供真实且有权限的岗位、配置与指标候选 → 工作流整理需求 → 用户确认生成设置和五档偏好 → 业务服务检索平台能力 → 先匹配已有项，无合适项再建议新能力 → 用户排序并核对建议重要性分 → 生成全等级草稿 → 审阅、修改、确认范围或更新策略 → 明确确认新增能力 → 带入编辑页，最终保存时重新校验并写入。',
 'doxcn19PwNK5On840KTaF1Pcf3d':'描述存储：已有能力的岗位定制等级描述只保存在当前标准，不覆盖共享指标；新生成能力经用户确认后，首次定义、维度及等级描述可新增至指标库“AI 生成”类别。保留更新以新描述更新同一能力，未涉及能力保留；直接覆盖只替换本次所选维度。每套标准合并后仍最多20项能力。',
 'doxcnneKt250BSVIQNaHRHztSic':'当前边界：本地页面仍按规则和示例生成，尚未接真实模型、平台能力检索或新能力入库。1127版Dify文件现已补入动作、组件、检索门禁、候选排序评分、全等级描述、相似岗位与保存计划；不将离线文件和测试等同于目标环境联调或正式存储。',
 'doxcnAltpEQYJD7u51atXC7yS2g':'已确认：找不到合适平台能力才生成；新能力经用户确认同时入库，默认类别为“AI 生成”；保留更新使用新生成描述更新同一能力，保留未涉及能力。上述不再列为待确认。',
 'doxcnUhs3YeJQP0bJa2Gd4OJpJc':'现状和接入：相似岗位候选生成及真实引文校验已写入1127版工作流，当前页面仍沿用按类别选择的旧演示；正式岗位检索、候选展示、用户选择及保存仍须接入。工作流不按同类别自动扩大范围，不伪造岗位ID或相似度概率。',
 'doxcng4H8O3Sur0KBBLJg6KDCgf':'工作流交付：附件为1127版普通Workflow（schema_version=3.0），沿用tongyi／qwen3.6-plus配置，23节点、29连线，按动作运行；下附10份完整请求及接入说明。已完成16项离线契约与分支回归，未在目标Dify实例导入或执行真实模型；本轮未产生模型费用。',
 'doxcnsJKtI9bWnprlhk8ybwPA8e':'尚需接入：真实平台检索、类别及指标创建、标准保存、租户权限及并发版本复验；页面组件渲染和capability_requirements等新字段持久化；目标Dify环境导入及模型效果验证。工作流只返回检索请求或保存计划，不包含虚构接口，不声称已执行数据库操作。',
}
start=next(i for i,n in enumerate(r) if n.get('id')=='doxcnhxtNHFJi5BHYqwk2wtbfRd')
end=next(i for i,n in enumerate(r) if n.get('id')=='doxcnDzGaNItnhwvJXrnCVwFmMc')
parts=[]
for n in r[start:end]:
 if n.get('id') in replacements:parts.append(p(replacements[n.get('id')]))
 elif n.tag=='figure':parts.append('<source path="@./dify/talent-standard-ai-assistant-workflow.yml" name="人才标准AI帮建工作流_1127版.yml"/>')
 else:
  # Retain content, formatting and headings, without replaying obsolete block IDs.
  for child in n.iter():child.attrib.pop('id',None)
  parts.append(E.tostring(n,encoding='unicode'))
parts.append(h('平台能力匹配与新能力入库'))
parts.append('<img path="@./deliverables/1127-ai-workflow-20261116/能力匹配与入库.png" caption="优先复用平台能力；新能力由用户确认后随标准保存。"/>')
parts.append(h('工作流动作、组件与输入'))
parts.append(table(['动作','输入阶段','主要输出'],[
 ['analyze_brief','welcome/review','generation_settings：整理需求及可选参考资料'],
 ['confirm_settings','review','generation_preferences：五档详略与三档描述方式'],
 ['prepare_capabilities','outline','未检索返回search_platform_capabilities；检索完成返回capability_sort'],
 ['confirm_sort','rank','capability_rating：每项可修改的建议初始分'],
 ['generate_draft','compare（有能力）／outline（无能力）','draft_preview及application_scope／update_strategy'],
 ['revise_draft','scope','仅更新明确指定分项，保留其余手工内容'],
 ['suggest_similar_positions','scope','similar_position_selection：真实岗位与可核对依据'],
 ['prepare_apply','scope','new_capability_confirmation或editor_handoff与save_plan']]))
parts.append(p('开始节点输入action、payload_json及可选reference_files。业务服务维护request_id、session_id、operation、phase、draft_version及确认状态；提供真实catalog与version、已启用和所选维度、brief、generation_preferences。排序回传完整能力ID顺序，评分为每项1–5整数；草稿阶段回传draft及expected_draft_version，更新须含source_standard及版本。组件统一为type、version、data，输出schema_version=3.0。'))
parts.append(p('平台检索：检索未完成时只返回needs_data及search_platform_capabilities请求，不运行能力生成模型。业务服务真实检索后将capability_lookup.complete设为true，回传同版本词典；缺少平台新能力等级配置时提示补齐，不默认L1–L5。候选快照绑定需求、偏好和词典版本，变更后重新匹配。'))
parts.append(p('新能力确认：返回待新增清单及confirmation_token；用户确认后回传完整新能力ID与该令牌。定义或描述变化后旧确认失效。save_plan仅供最终编辑保存执行：复验权限、源标准和词典版本，复查现有能力，使用或创建“AI 生成”类别，将临时ID替换为正式ID并保存标准及新能力；失败不留半份数据，重试不重复创建。已有能力写入清单始终为空。'))
parts.append(p('草稿兼容原编辑器content.cap的名称、要求等级、雷达图名称三元组；新增capability_requirements保存能力ID、来源、实际等级及描述，generationPreferences保存偏好。当前编辑器和正式存储尚未接此扩展，不得丢弃扩展字段后声称等级描述已保存。10份请求均为虚构示例，不是生产数据或模型实测结果。'))
parts.append('<source path="@./deliverables/1127-ai-workflow-20261116/工作流输入与接入说明.zip" name="1127_AI工作流输入与接入说明.zip"/>')
write('02-工作流及接入','\n'.join(parts))
write('03-验收',h('四、验收与待确认',2)+ul([
 '入口与确认：岗位可空，至少一项生成维度；五档详略、三档描述方式及用户补充传递一致，跳过确认不能生成或保存。',
 '能力与描述：先完成真实平台检索再匹配；已有项复用，无合适项才建议新能力；建议分可改，评分排序同分稳定；全部实际等级描述完整，不补造等级；最多20项。',
 '更新与入库：同一能力用新描述更新，其他能力保留；已有共享指标不覆盖；新能力明确确认后才随编辑保存入“AI 生成”；取消、失败及重复保存不产生错误记录。',
 '岗位与局部修改：只用真实岗位依据，明确选择范围；版本变化拒绝旧结果；定向修改保留其他手工内容；带入不等于保存。'])+p('仍需确认：相似岗位正式业务判定口径、可取得的岗位字段、候选默认勾选及是否固定包含目标岗位；需求理解卡隐藏后是否增加补充引导交互；目标Dify环境及正式接入范围。能力无匹配的处理、新能力类别、保留更新描述规则已经确认，不再重复待确认。')+p('当前验证仅为离线契约与流程测试，不包含目标Dify导入、真实模型效果或平台后端联调；后续收费模型调用须另行取得明确授权。'))
write('04-尾部',h('AI帮建本轮确认与接入边界',1)+p('本轮确认已合并到上方流程、工作流及验收，不再保留冲突的旧待确认说法。')+ul([
 '先找平台已有能力，无合适项再生成；用户确认后将新能力新增到指标库／能力指标默认“AI 生成”类别。',
 '已有能力的定制描述只保存当前标准；保留更新以新描述更新本次涉及能力，其他能力保留。',
 'JSON组件协议、重要性建议初始分、默认雷达图名称、拖拽排序、实际全部等级描述均已写入1127版工作流文件和输入样例；正式页面及业务服务接入尚未完成。'])+p('标准编号可自定义、最多20字符，导入只新增且拒绝重复；统一.xlsx；测评结束日期相同按最后导入取分；能力指标维度自定义命名已确认。'))
write('05-宫格补充',h('分档默认值、名称编辑与结果联动',4)+table(['档数','档名（低→高）','默认占比（低→高）'],[
 ['2','低、高','50%、50%'],['3','低、中、高','60%、20%、20%'],['4','低、较低、较高、高','40%、20%、20%、20%'],['5','低、较低、中、较高、高','20%、20%、20%、20%、20%']])+p('两轴按各自分数从高到低排名分档，占比是人数比例，不是原始分数区间。占比支持整数输入和加减，每档最低5%，修改一档时其他档自动平衡，单轴合计100%；恢复默认只作用当前维度，预估人数随本次盘点人数变化。')+p('所有格子支持编辑名称，最多20字，长名称换行完整展示。2/3/4/5档分别从五档表取低/高、低/中/高、低/较低/较高/高及全部行列；两轴独立取值，交换轴只改变方向，不改变名称、解读和建议。')+p('结果页矩阵显示名称及人数；点击某格同步选中名称、人数、占总人数比例、说明、发展建议和人员清单。5×5采用全宽矩阵，解读放在矩阵下方；较高与较低绩效分别使用各自文案。人数和名单当前仍为原型示例，正式计算待接入。'))
write('06-范围补充',h('九、此前已记录的本期事项与边界',2)+p('以下事项在重写前文档已有记录，本轮恢复说明以免丢项；不将其标为本次已实现，也不擅自扩大到已接后端。')+table(['事项','此前记录及本轮状态'],[
 ['人才标准导出','按标准查看、按岗位查看两个列表视角增加导出；导出当前筛选还是已选数据仍须明确。正式导出未实现，不因已有导入模板视为完成。'],
 ['人才图谱逐项能力导入','选择能力项目之外可下载人员模板、导入逐项能力数据，预填本次人员；原型已有下载及本地校验，尚未写入档案或正式盘点结果。它不是宫格外部测评总分模板；当前五份附件不包含这份模板，具体字段及统一口径仍须核对。'],
 ['发展序列导入、导出','发展中心／岗位地图，覆盖序列、职级、通道及岗位挂载；校验引用与重复节点，文件缺行不删除已有节点。岗位地图与设置需统一数据来源，模板和正式功能待设计与核对。'],
 ['岗位标识展示','此前要求岗位信息补充岗位编号与类别完整路径，识别大量同名岗位时用稳定编号；本轮导入规则已写明，页面各入口的展示适配仍须按实际逐处核对，不将单层示例冒充多层验证。']])+p('宫格选择平台项目：搜索并勾选后移入已选列表，可移出；确定后追加，取消不生效，已关联项目不重复添加。清单保留项目名称、类型、关联时间及操作，关联时间是加入本次盘点日期；主表不增加查询。至少一个有效平台项目或有效外部结果后才能继续规则设置。')+p('宫格导入校验通过时展示有效记录和覆盖人数；空白不按0，不合规小数不自动四舍五入；失败保留上次有效预览。导入抽屉的步骤、宽度、按钮及状态反馈保持一致，解析及业务校验逻辑以本文供开发实现。'))
with zipfile.ZipFile(OUT/'工作流输入与接入说明.zip','w',zipfile.ZIP_DEFLATED) as z:
 z.write(ROOT/'dify/talent-standard-ai-assistant-workflow-README.md','接入说明.md')
 for file in sorted((ROOT/'dify/talent-standard-ai-assistant-v3/requests').glob('*.json')):z.write(file,'requests/'+file.name)
print('6 targeted patches and input ZIP ready')
