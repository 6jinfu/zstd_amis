(function () {
  const schema = {
    '基本信息和岗位':['标准编号','标准名称','标准类别','标准说明','应用方式','岗位编号','岗位类别','岗位名称'],
    '职责任务':['标准编号','标准名称','标准类别','职责','任务'],
    '经历经验':['标准编号','标准名称','标准类别','经历经验'],
    '能力要求':['标准编号','标准名称','标准类别','能力组名称','能力名称','要求等级'],
    '动力要求':['标准编号','标准名称','标准类别','动力名称'],
    '潜力要求':['标准编号','标准名称','标准类别','潜力名称']
  };
  function validate(sheets, data, library = IndicatorDemo.items) {
    const records=[], errors=[], groups=new Map(), seen=new Set();
    const error=(sheet,row,message)=>errors.push(`${sheet}第 ${row.number} 行：${message}`);
    const clean=row=>row.cells.map(value=>String(value??'').trim());
    let tables;
    try { tables=Object.fromEntries(Object.entries(schema).map(([name,headers])=>[name,ReviewScoreImport.dataRows(sheets[name],{headers,sampleRows:3}).filter(row=>row.formula||row.cells.some(value=>String(value??'').trim()))])); }
    catch(err){return {records,errors:[err.message+'（须包含六张工作表）']};}
    if(Object.values(tables).reduce((total,rows)=>total+rows.length,0)>2000)return {records,errors:['每次最多导入 2000 行，请拆分文件']};
    tables['基本信息和岗位'].forEach(row=>{
      const [code,name,category,description,mode,positionId,positionCategory,positionName]=clean(row), sheet='基本信息和岗位';
      if(row.formula)error(sheet,row,'请填写实际值，不使用公式');
      if(!code||code.length>20)error(sheet,row,'标准编号必填，最多 20 个字符');
      if(!name||name.length>80)error(sheet,row,'标准名称必填，最多 80 个字符');
      if(!data.categories.includes(category))error(sheet,row,'标准类别不存在');
      if(description?.length>2000)error(sheet,row,'标准说明最多 2000 个字符');
      if(!['指定岗位','暂不关联'].includes(mode))error(sheet,row,'应用方式须为指定岗位或暂不关联');
      if(data.standards.some(item=>item.code===code))error(sheet,row,'标准编号已存在，请使用新编号');
      let standard=groups.get(code);
      if(!standard){standard={code,name,category,description:description||'',mode:mode==='指定岗位'?'positions':'none',positions:[],groups:[],content:Standards.emptyContent()};groups.set(code,standard);}
      else if([name,category,description||'',mode==='指定岗位'?'positions':'none'].some((value,i)=>value!==[standard.name,standard.category,standard.description,standard.mode][i]))error(sheet,row,'同一标准编号的基本信息不一致');
      if(mode==='指定岗位'){
        const position=Standards.positions.find(item=>item.id===positionId);
        if(!position||position.name!==positionName||position.category!==positionCategory)error(sheet,row,'岗位编号、类别与名称不匹配');
        else if(standard.positions.includes(positionId))error(sheet,row,'同一标准关联岗位重复');
        else standard.positions.push(positionId);
      }else if(positionId||positionCategory||positionName)error(sheet,row,'暂不关联时请留空岗位信息');
    });
    Object.entries(tables).filter(([name])=>name!=='基本信息和岗位').forEach(([sheet,rows])=>rows.forEach(row=>{
      const [code,name,category,...values]=clean(row), standard=groups.get(code);
      if(row.formula)error(sheet,row,'请填写实际值，不使用公式');
      if(!standard||standard.name!==name||standard.category!==category){error(sheet,row,'标准编号、名称和类别与基本信息表不一致');return;}
      const key=JSON.stringify([code,sheet,sheet==='能力要求'?values[1]:values]);
      if(seen.has(key)){error(sheet,row,'内容重复');return;}seen.add(key);
      if(sheet==='职责任务'){
        if(!values[0])error(sheet,row,'请填写职责');
        let duty=standard.content.duty.find(item=>item.n===values[0]);
        if(!duty){duty={n:values[0],t:[]};standard.content.duty.push(duty);}if(values[1])duty.t.push(values[1]);
      }else if(sheet==='经历经验'){
        if(!values[0])error(sheet,row,'请填写经历经验');else standard.content.exp.push(values[0]);
      }else{
        const kind={'能力要求':'cap','动力要求':'pow','潜力要求':'pot'}[sheet], term=kind==='cap'?values[1]:values[0];
        const matches=(library[kind]||[]).filter(item=>item.name===term);
        if(matches.length!==1){error(sheet,row,'指标不存在或名称匹配不唯一');return;}
        if(kind==='cap'){
          if(!values[0])error(sheet,row,'请填写能力组名称');
          if(!/^L(?:10|[1-9])$/.test(values[2]))error(sheet,row,'要求等级须为 L1–L10');
          standard.content.cap.push([term,values[2],values[0]]);
        }else standard.content[kind].push(term);
      }
    }));
    groups.forEach(standard=>{
      if(standard.content.cap.length>20)errors.push(`${standard.code}：每套标准最多 20 项能力`);
      records.push({...standard,preview:[standard.code,standard.name,standard.category,standard.positions.length+' 个岗位']});
    });
    if(!records.length&&!errors.length)errors.push('没有填写人才标准，请在示例行后填写');
    return {records,errors};
  }
  document.addEventListener('click',event=>{
    if(!event.target.closest('[data-standard-import]'))return;
    ImportDialog.open({title:'导入人才标准',template:'talent-standard-import.xlsx',headers:['标准编号','标准名称','标准类别','关联岗位'],read:ReviewScoreImport.readWorkbook,validate:sheets=>validate(sheets,Standards.read()),save(records){
      const data=Standards.read();
      records.forEach(record=>{if(data.standards.some(item=>item.code===record.code))throw new Error('标准编号已存在，请重新校验');const {preview,...standard}=record;standard.id='std-'+crypto.randomUUID();standard.updated=new Date().toLocaleDateString('sv-SE');Standards.setStandard(data,standard);});
      Standards.write(data);
    }});
  });
  window.StandardImport={schema,validate};
})();
