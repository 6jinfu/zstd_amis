from pathlib import Path
import json,re,xml.etree.ElementTree as ET,hashlib,shutil
p=Path('deliverables/talent-development-manual-20261105'); patch=p/'核对记录/1113期增量'; f=p/'人才发展管理端操作手册.md'; s=f.read_text()
def md(name):
 root=ET.fromstring('<root>'+ (patch/name).read_text()+'</root>'); out=[]
 for e in root:
  text=''.join(e.itertext()).strip()
  if e.tag in ('h2','h3'): out.append(('#'*(int(e.tag[1])+1))+' '+text)
  elif e.tag=='p': out.append(text)
  elif e.tag=='ol': out.append('\n'.join(f'{i}. '+''.join(x.itertext()).strip() for i,x in enumerate(e,1)))
  elif e.tag=='img': out.append('![](图片和附件/'+Path(e.attrib['path']).name+')')
 return '\n\n'.join(out)+'\n\n'
s=s.replace('**操作入口**：「人才标准」→「岗位管理」。','**操作入口**：「人才标准」→「人才标准」→「按岗位查看」。')
s=s.replace('点击对应行的「编辑」「岗位标准」或「学习方案」，进入该岗位的相关配置。','点击对应行的「编辑」维护岗位信息，或点击「适用标准」查看和维护该岗位关联的标准。')
s=s.replace('图片和附件/管理端-岗位管理-关键岗位列表.jpg','图片和附件/管理端-人才标准-按岗位查看.jpg').replace('图 1.3-1　岗位管理：查询关键岗位并进入标准或学习方案','图 1.3-1　按岗位查看：查询岗位并进入适用标准')
s=s.replace('### 1.4 岗位标准','### 1.4 人才标准').replace('**操作入口**：「人才标准」→「岗位管理」→目标岗位的「岗位标准」。','**操作入口**：「人才标准」→「人才标准」。\n\n'+md('标准补充.xml').rstrip())
s=s.replace('图 1.4-1　岗位标准：按职责组织任务，并逐条维护经历要求','图 1.4-1　职责任务：按职责组织任务')
s=s.replace('图 2.1-1　360评估：查看完成率、状态和项目操作入口\n\n','图 2.1-1　360评估：查看完成率、状态和项目操作入口\n\n'+md('360补充.xml'))
s=s[:s.index('### 4.2 人才档案')]+md('人才档案.xml')+s[s.index('### 4.3 人才对比'):]
s=s[:s.index('### 5.1 职级管理')]+md('职级管理.xml')+s[s.index('### 5.2 功能设置'):]
s=s.replace('图 4.4-2　新建人才池：明确选择来源盘点项目','图 4.4-2　新建人才池：选择来源并设置期望人数')
s=s.replace('**与项目内新建的区别**：项目内新建时来源已带入；从人才中心新建时，需要主动选择来源。两种入口都应核对来源项目，期望人数与实际人数分别阅读。','**期望人数**：默认 10 人，可设置为 1–9999 人。期望人数与实际入池人数分别统计，实际人数可以超过期望人数。\n\n项目内新建时来源已带入；从人才中心新建时，需要选择来源盘点项目。')
f.write_text(s)
# Match image and caption blocks from the verified cloud document.
r=json.loads((patch/'飞书回读.json').read_text()); doc=r['data']['document']; root=ET.fromstring('<root>'+doc['content']+'</root>'); cloud={}
for a,b in zip(root, list(root)[1:]):
 if a.tag=='img' and b.tag=='p':
  caption=''.join(b.itertext()).strip(); m=re.match(r'图\s+(\d+\.\d+-\d+(?:（续）)?)\s*　?\s*(.*)',caption)
  if m: cloud[m.group(1)]=(a,b,m.group(2))
idx=p/'核对记录/配图元数据.json'; data=json.loads(idx.read_text()); mapping={x['figure']:x for x in data}
figfiles={'1.3-1':'管理端-人才标准-按岗位查看.jpg','1.4-1':'管理端-岗位标准-职责任务与经历.jpg','1.4-2':'管理端-岗位标准-选择能力.jpg','1.4-3':'管理端-人才标准-按岗位查看.jpg','1.4-4':'管理端-人才标准-按标准查看.jpg','1.4-5':'管理端-人才标准-应用范围.jpg','2.1-11':'管理端-360评估-AI帮建.jpg','2.1-12':'管理端-360评估-选择人才标准.jpg','4.2-1':'管理端-人才中心-档案概览.jpg','4.2-2':'管理端-人才中心-标准与差距.jpg','4.2-2（续）':'管理端-人才中心-标准比较明细.jpg','4.2-3':'管理端-人才中心-评鉴与盘点.jpg','4.4-2':'管理端-人才中心-新建人才池.jpg','5.1-1':'管理端-系统设置-职级管理-新版.jpg','5.1-2':'管理端-系统设置-新增职级序列-新版.jpg'}
for fig,name in figfiles.items():
 a,b,caption=cloud[fig]; image=p/'图片和附件'/name; sha=hashlib.sha256(image.read_bytes()).hexdigest(); x=mapping.get(fig,{})
 x.update(figure=fig,file=name,caption=caption,size=[1730,872],sha256=sha,lark_image_block_id=a.get('id'),lark_caption_block_id=b.get('id'),lark_image_token=a.get('src'),cloud_synced_sha256=sha,last_verified_revision=doc['revision_id'],annotated=fig!='4.2-3')
 if fig not in mapping: data.append(x)
idx.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
statepath=p/'维护状态.json'; state=json.loads(statepath.read_text());state['updated']='2026-11-17';state['lark']['last_verified_revision']=doc['revision_id'];state['images']['total']=len(data);state['images']['annotated']=sum(bool(x.get('annotated')) for x in data);state['latest_cloud_verification']='核对记录/1113期增量/飞书回读.json';state['online_system']='https://tbc.21tb.com/rtr-admin-frontend/appIframe?appCode=m_aiApp_talent';state['iteration_pending']='盘点结果及项目人才池、人才标准AI完整流程、360题本生成和学员端切换未完成核验';statepath.write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n')
print('revision',doc['revision_id'],'figures',len(data),'local refs',len(re.findall(r'!\[\]\(图片和附件/',s)))
