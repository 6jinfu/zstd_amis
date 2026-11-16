(function () {
  const numbers=['一','二','三','四','五','六','七','八','九','十'];
  const headers=['名称','类别','维度','定义',...numbers.flatMap(number=>[number+'级-分级描述',number+'级-行为表现'])];
  function categories() {
    const paths=new Map();
    function visit(nodes,parent=[]){nodes.forEach(node=>{const path=[...parent,node.name];paths.set(path.join('.'),node.id);visit(node.children||[],path);});}
    visit(IndicatorDemo.categories);return paths;
  }
  function validate(rows) {
    const records=[],errors=[],seen=new Set(), paths=categories(), dimensions=TalentSettings.read().abilityDimensions;
    const filled=rows.filter(row=>row.formula||row.cells.some(value=>String(value??'').trim()));
    if(filled.length>2000)return {records,errors:['每次最多导入 2000 条，请拆分文件']};
    filled.forEach(row=>{
      const values=headers.map((_,i)=>String(row.cells[i]??'').trim()), [name,path,dimension,description]=values, problems=[];
      if(!name||name.length>20)problems.push('名称必填，最多 20 个字符');
      if(!paths.has(path))problems.push('类别不存在，请填写完整类别路径');
      if(!dimensions.includes(dimension))problems.push('维度不存在，请在系统设置中维护');
      if(description.length>1000)problems.push('定义最多 1000 个字符');
      if(values.slice(4).some(value=>value.length>2000))problems.push('分级描述和行为表现最多 2000 个字符');
      if(row.formula)problems.push('请填写实际值，不使用公式');
      const key=JSON.stringify([name,path]), matches=IndicatorDemo.items.cap.filter(item=>item.name===name&&item.categoryId===paths.get(path));
      if(matches.length>1)problems.push('已有能力匹配不唯一');
      if(seen.has(key))problems.push('同一名称和类别重复');seen.add(key);
      const levels=numbers.map((_,index)=>({level:index+1,description:values[index*2+4],behavior:values[index*2+5]}));
      if(problems.length)errors.push(`第 ${row.number} 行：${problems.join('；')}`);
      else records.push({id:matches[0]?.id||'cap-'+crypto.randomUUID(),name,categoryId:paths.get(path),dimension,dimensionIndex:dimensions.indexOf(dimension),description,levels,preview:[name,path,dimension,matches.length?'更新':'新增']});
    });
    if(!filled.length)errors.push('没有填写能力，请在示例行后填写');
    return {records,errors};
  }
  document.addEventListener('click',event=>{
    if(!event.target.closest('[data-indicator-import]'))return;
    ImportDialog.open({title:'导入能力',template:'indicator-ability-import.xlsx',headers:['能力名称','类别','维度','操作'],read:file=>ReviewScoreImport.read(file,{headers}),validate,save(records){
      const items=IndicatorDemo.items.cap.map(item=>({...item}));
      records.forEach(({preview,...record})=>{const index=items.findIndex(item=>item.id===record.id);if(index<0)items.push(record);else items[index]=record;});
      localStorage.setItem('talent-indicators-v1',JSON.stringify({categories:IndicatorDemo.categories,items}));
    }});
  });
  window.IndicatorImport={headers,validate};
})();
