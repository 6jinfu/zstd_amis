from pathlib import Path
import json,re,hashlib,shutil,zipfile
from PIL import Image
p=Path('deliverables/talent-development-manual-20261105'); md=p/'人才发展管理端操作手册.md'; s=md.read_text(); idx=p/'核对记录/配图元数据.json'; data=json.loads(idx.read_text()); raw=p/'核对记录/原始截图'; raw.mkdir(exist_ok=True)
rawnames={'管理端-人才标准-按岗位查看.jpg':'标准列表','管理端-人才标准-按标准查看.jpg':'按标准查看','管理端-人才标准-应用范围.jpg':'应用范围','管理端-360评估-AI帮建.jpg':'360AI帮建','管理端-360评估-选择人才标准.jpg':'360选择标准','管理端-人才中心-档案概览.jpg':'人才档案概览','管理端-人才中心-标准与差距.jpg':'标准与差距','管理端-人才中心-标准比较明细.jpg':'标准比较明细','管理端-人才中心-评鉴与盘点.jpg':'评鉴与盘点','管理端-人才中心-新建人才池.jpg':'新建人才池','管理端-系统设置-职级管理-新版.jpg':'职级列表','管理端-系统设置-新增职级序列-新版.jpg':'职级新增','管理端-岗位标准-职责任务与经历.jpg':'职责任务','管理端-岗位标准-选择能力.jpg':'选择能力'}
for x in data:
 name=x['file']
 if name in rawnames:
  source=p/'核对记录'/f'{rawnames[name]}-本轮原图.png'; target=raw/(Path(name).stem+'-20261117.png');shutil.copyfile(source,target);x['raw_file']=str(target.relative_to(p));x['raw_sha256']=hashlib.sha256(source.read_bytes()).hexdigest()
idx.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
refs=re.findall(r'!\[\]\(图片和附件/([^\)]+)\)',s); missing=[n for n in refs if not (p/'图片和附件'/n).is_file()]; assert not missing,missing
for n in refs:
 with Image.open(p/'图片和附件'/n) as im: assert im.size==(1730,872),(n,im.size)
(p/'图片对应清单.md').write_text('# 图片对应清单\n\n'+''.join(f"- 图 {x['figure']}：{x['caption']} — {x['file']}\n" for x in data))
zpath=p.parent/'人才发展管理端操作手册_20261105.zip'
with zipfile.ZipFile(zpath,'w',zipfile.ZIP_DEFLATED) as z:
 for n in ['人才发展管理端操作手册.md','图片对应清单.md','交付说明.md','核对清单.md']: z.write(p/n,'人才发展管理端操作手册/'+n)
 for n in dict.fromkeys(refs): z.write(p/'图片和附件'/n,'人才发展管理端操作手册/图片和附件/'+n)
with zipfile.ZipFile(zpath) as z: assert z.testzip() is None
print('图片引用',len(refs),'唯一文件',len(set(refs)),'缺失',len(missing),'ZIP 文件数',len(zipfile.ZipFile(zpath).namelist()))
