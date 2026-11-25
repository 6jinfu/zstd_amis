import fs from 'node:fs/promises';
import { Workbook, SpreadsheetFile, FileBlob } from '@oai/artifact-tool';
const output=new URL('.',import.meta.url).pathname;
const source=JSON.parse(await fs.readFile('/private/tmp/1127-source/data.json','utf8'));
const names=['人才标准导入模板','能力指标导入模板','人员能力数据导入模板','能力测评结果导入模板','绩效数据导入模板'];
const targets=['talent-standard-import','indicator-ability-import','talent-person-ability','review-external-ability-score','review-performance'];
const common='请保留工作表名、表头和示例行；示例不参与导入。文件另存为 .xlsx，不超过 5 MB，每次最多 2000 行。';
await fs.mkdir(output,{recursive:true});
if(process.argv.includes('--source-preview')){
  for(let i=0;i<source.length;i++){
    const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(source[i].file));
    const sheet=source[i].sheets[0];
    const preview=await wb.render({sheetName:sheet.name,range:'A1:F9',scale:1,format:'png'});
    await fs.writeFile(output+`source-${i}.png`,new Uint8Array(await preview.arrayBuffer()));
  }
  process.exit(0);
}
for(let i=0;i<source.length;i++){
  const wb=Workbook.create();
  for(const original of source[i].sheets){
    const ref=original.name==='填写参考',sheet=wb.worksheets.add(original.name);
    sheet.showGridLines=false;
    let headers,examples,instructions;
    if(ref){
      for(const [row,values] of original.rows)sheet.getRangeByIndexes(Number(row)-1,0,1,values.length).values=[values];
      sheet.getRange('A1:G15').format.font={name:'Arial',size:11,color:'#253247'};
      sheet.getRange('A1:G15').format.rowHeight=26;
      sheet.getRange('A1:G15').format.columnWidth=23;
    }else{
      const header=original.rows.find(([,values])=>values.some(value=>/^(\*)?(标准编号|工号|名称)$/.test(value)));
      headers=header[1];
      examples=original.rows.filter(([number])=>Number(number)>Number(header[0])).slice(0,i===0?3:1).map(([,values])=>[...values]);
      if(i===0){
        examples.forEach((row,index)=>{row[0]=index===2?'STD202611110002':'STD202611110001';if(original.name==='基本信息和岗位'&&row[4]==='指定岗位')row[6]='研发';});
        if(original.name==='动力要求')examples[1][3]='持续成长';
        instructions=['本表填写'+original.name+'；* 为必填项。同一标准的编号、名称和类别须与基本信息表一致。','第 3–5 行为示例，不参与导入；从第 6 行开始填写。标准编号必填、最多 20 个字符，已存在的编号拒绝导入。',original.name==='基本信息和岗位'?'指定岗位时一行一个岗位，编号、完整类别路径和名称须匹配；暂不关联时岗位信息留空。':original.name==='能力要求'?'能力组名称用于雷达图分组；能力须已存在，要求等级 L1–L10，每套标准最多 20 项能力。':'内容按填写顺序导入，不需要时留空填写区；不通过导入新建岗位或指标。',common].join('\n');
      }else if(i===1){
        examples=[['团队管理','技能.管理能力','技能','带领团队达成目标并持续提升','理解团队目标并安排自身工作','按计划完成分配任务']];
        instructions=['* 为必填项；第 3 行为示例，不参与导入，从第 4 行开始填写，一行一项能力。','类别填写已存在的完整路径，用英文句号连接；维度填写系统设置中已维护的名称。','名称最多 20 字，定义最多 1000 字，各级分级描述和行为表现最多 2000 字，支持最多十级。','名称＋类别匹配已有能力时更新该能力的定义、维度及等级描述，其余能力保留。',common].join('\n');
      }else if(i===2){
        instructions=['第 3 行为示例，不参与导入；从第 4 行开始填写，每人每项能力一行。','工号、姓名、能力类别、能力名称、能力等级必填；能力得分选填。工号按文本保存，保留前导零。','人员须已存在且姓名匹配；能力类别为完整路径，与能力名称匹配。等级为 1–10 的整数。','得分为 0–999，最多两位小数；0 有效，空白不等于 0。确认后追加记录，采用最新有效等级。',common].join('\n');
      }else if(i===3){
        instructions=['第 3 行为示例，不参与导入；从第 4 行开始填写，每行一名人员在一个外部测评项目中的结果。','下载时自动带入本次盘点人员的工号、姓名；可以复制人员行填写多个项目，无需关联平台项目。','六列均为必填；日期为 YYYY-MM-DD，开始日期不能晚于结束日期。','测评得分为 0–999，最多两位小数，0 有效；同一人员同一项目及起止日期不可重复。',common].join('\n');
      }else{
        instructions=['第 3 行为示例，不参与导入；从第 4 行开始填写，每人一行。','工号、姓名、绩效得分必填；下载时自动带入本次盘点人员，工号按文本保存，保留前导零。','绩效得分为 0–999，最多两位小数；0 有效，空白不等于 0。同一工号不可重复。','只预填工号、姓名且未填写得分的行不参与导入；不再填写绩效等级。',common].join('\n');
      }
      if(i>=2)examples.forEach(row=>{const scoreColumn=i===4?2:5;row[scoreColumn]=Number(row[scoreColumn]);if(i===2)row[4]=Number(row[4]);});
      const count=headers.length,last=String.fromCharCode(64+count),end=i===0?6:4;
      sheet.getRange(`A1:${last}${end+20}`).format={font:{name:'Arial',size:11,color:'#253247'},verticalAlignment:'center',rowHeight:28,columnWidth:23};
      const noteLast=i===1?'F':last;
      sheet.mergeCells(`A1:${noteLast}1`);
      sheet.getRange('A1').values=[[instructions]];
      sheet.getRange(`A1:${last}1`).format={fill:'#F2F5F9',wrapText:true,rowHeight:132,verticalAlignment:'center'};
      sheet.getRangeByIndexes(1,0,1,count).values=[headers];
      sheet.getRange(`A2:${last}2`).format={fill:'#2459A6',font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},horizontalAlignment:'center',rowHeight:34};
      examples.forEach((row,index)=>{sheet.getRangeByIndexes(index+2,0,1,count).values=[Array.from({length:count},(_,col)=>row[col]??'')];});
      sheet.getRange(`A3:${last}${end-1}`).format={fill:'#F0F1F3',wrapText:true,rowHeight:i===1?72:42};
      sheet.getRange(`A${end}:${last}${end+20}`).setNumberFormat('@');
      sheet.getRange(`A3:A${end+20}`).setNumberFormat('@');
      if(i===0){sheet.getRange(`B2:B${end+20}`).format.columnWidth=29;sheet.getRange(`D2:D${end+20}`).format.columnWidth=34;}
      if(i===1)sheet.getRange('D2:X24').format.columnWidth=32;
      if(i===2){sheet.getRange(`C2:D${end+20}`).format.columnWidth=29;sheet.getRange(`E${end}:E${end+20}`).dataValidation={rule:{type:'whole',operator:'between',formula1:1,formula2:10}};}
      if(i>=2){
        const col=i===4?'C':'F';sheet.getRange(`${col}${end}:${col}${end+20}`).setNumberFormat('0.##');
        sheet.getRange(`${col}${end}:${col}${end+20}`).dataValidation={rule:{type:'decimal',operator:'between',formula1:0,formula2:999}};
      }
      sheet.freezePanes.freezeRows(2);
    }
    wb.recalculate();
    const range=ref?'A1:G12':`A1:${String.fromCharCode(64+Math.min(headers.length,8))}${i===0?7:5}`;
    const preview=await wb.render({sheetName:original.name,range,scale:1.2,format:'png'});
    await fs.writeFile(output+`${targets[i]}-${original.name}.png`,new Uint8Array(await preview.arrayBuffer()));
  }
  console.log((await wb.inspect({kind:'sheet',include:'id,name',maxChars:1200})).ndjson);
  const file=await SpreadsheetFile.exportXlsx(wb);await file.save(output+names[i]+'.xlsx');
  await fs.copyFile(output+names[i]+'.xlsx',new URL('../../app/templates/'+targets[i]+'.xlsx',import.meta.url));
}
