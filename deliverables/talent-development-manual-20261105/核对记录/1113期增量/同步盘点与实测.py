from pathlib import Path
import json,re,hashlib,xml.etree.ElementTree as ET,shutil
p=Path('deliverables/talent-development-manual-20261105');patch=p/'核对记录/1113期增量';f=p/'人才发展管理端操作手册.md';s=f.read_text()
def md(name):
 root=ET.fromstring('<root>'+(patch/name).read_text()+'</root>');out=[]
 for e in root:
  text=''.join(e.itertext()).strip()
  if e.tag=='h3':out.append('#### '+text)
  elif e.tag=='p':out.append(text)
  elif e.tag=='ol':out.append('\n'.join(f'{i}. '+''.join(x.itertext()).strip() for i,x in enumerate(e,1)))
  elif e.tag=='img':out.append('![](图片和附件/'+Path(e.attrib['path']).name+')')
 return '\n\n'.join(out)+'\n\n'
s=s.replace('根据需要调整每项能力的题型与数量。页面默认单选题 3 题、多选题 1 题、打分题 1 题、问答题 1 题；在输入框描述评估场景后发送生成请求。','根据需要调整每项能力的题型与数量。页面默认单选题 3 题、多选题 1 题、打分题 1 题、问答题 1 题；输入评估场景并发送后，在确认页面勾选或取消本次使用的能力，核对标准、岗位和题数，点击「确认」生成问卷。')
s=s.replace('生成后核对题目和选项，再进入问卷编辑页面继续编辑和保存。','生成后核对题目和选项，点击「创建问卷」进入问卷编辑页，检查带入的维度和题目后继续编辑并保存。')
s=s.replace('图 2.1-12　选择人才标准：按类别或名称查找标准\n\n','图 2.1-12　选择人才标准：按类别或名称查找标准\n\n'+md('360实测补图.xml'))
s=s.replace('图 2.2-9　项目人才池：核对已带入的来源项目并设置期望人数\n\n','图 2.2-9　项目人才池：核对已带入的来源项目并设置期望人数\n\n'+md('人才池组建.xml'))
f.write_text(s)
doc=json.loads((patch/'飞书回读.json').read_text())['data']['document'];root=ET.fromstring('<root>'+doc['content']+'</root>');cloud={}
for a,b in zip(root,list(root)[1:]):
 if a.tag=='img' and b.tag=='p':
  m=re.match(r'图\s+(\d+\.\d+-\d+(?:（续）)?)\s*　?\s*(.*)',''.join(b.itertext()).strip())
  if m:cloud[m.group(1)]=(a,b,m.group(2))
new={'2.2-7':('管理端-人才盘点-宫格结果.jpg','盘点结果'),'2.2-10':('管理端-人才盘点-项目人才池列表.jpg','项目人才池'),'2.2-11':('管理端-人才盘点-组建人才池.jpg','人才池组建'),'2.2-11（续）':('管理端-人才盘点-绩效分层.jpg','人才池绩效分层'),'2.1-13':('管理端-360评估-确认评估能力.jpg','360确认指标'),'2.1-14':('管理端-360评估-生成题本.jpg','360生成题本'),'2.1-15':('管理端-360评估-AI题本编辑.jpg','360问卷编辑')}
idx=p/'核对记录/配图元数据.json';data=json.loads(idx.read_text());mapping={x['figure']:x for x in data};raw=p/'核对记录/原始截图'
for fig,(name,source) in new.items():
 a,b,caption=cloud[fig];sha=hashlib.sha256((p/'图片和附件'/name).read_bytes()).hexdigest();orig=p/'核对记录'/f'{source}-本轮原图.png';target=raw/(Path(name).stem+'-20261117.png');shutil.copyfile(orig,target);x=mapping.get(fig,{})
 x.update(figure=fig,file=name,caption=caption,size=[1730,872],sha256=sha,lark_image_block_id=a.get('id'),lark_caption_block_id=b.get('id'),lark_image_token=a.get('src'),cloud_synced_sha256=sha,last_verified_revision=doc['revision_id'],annotated=True,raw_file=str(target.relative_to(p)),raw_sha256=hashlib.sha256(orig.read_bytes()).hexdigest())
 if fig not in mapping:data.append(x)
idx.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');statepath=p/'维护状态.json';state=json.loads(statepath.read_text());state['lark']['last_verified_revision']=doc['revision_id'];state['images']['total']=len(data);state['images']['annotated']=sum(bool(x.get('annotated')) for x in data);state['online_system']='https://tbcnp.21tb.com/rtr-admin-frontend/appIframe?appCode=m_aiApp_talent';state['iteration_pending']='人才标准AI完整流程和学员端岗位地图切换待核验；360选项分数提示与迭代文档存在差异';statepath.write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n');print('回读版本',doc['revision_id'],'图片',len(data))
