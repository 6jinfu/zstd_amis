(function(){
  const params=new URLSearchParams(location.search),session=params.get('session'),key=params.get('project');
  let projects=[];try{projects=JSON.parse(localStorage.getItem(session)||'[]');}catch{}
  const platform=document.body.classList.contains('platform-monitor');
  const example={name:'基础管理者360评估',records:[
    {name:'王瑜',employeeId:'0696',department:'S49',position:'管理者岗',score:5},
    {name:'陈梦蝶',employeeId:'4131',department:'S49',position:'运营顾问',score:5},
    {name:'陆梦瑶',employeeId:'4433',department:'S49',position:'运营顾问',score:2},
    {name:'姚丽君',employeeId:'4132',department:'S49',position:'运营顾问',score:1.5}
  ]};
  const project=platform?{...example,name:params.get('projectName')||example.name}:(!session&&!key?example:projects.find(item=>item.key===key)),records=project?.records||[];
  const $=id=>document.getElementById(id),body=$('rows'),form=$('filters'),name=$('name'),department=$('department'),position=$('position');
  let filtered=records,page=1,pageSize=10;
  if(project){$('project-name').textContent=project.name;document.title=project.name+(platform?' · 360 评估监控':' · 外部测评监控');}
  if(platform)$('copy-link').addEventListener('click',async()=>{await navigator.clipboard.writeText(location.href);$('copy-link').textContent='已复制';});
  for(const [select,field] of [[department,'department'],[position,'position']]) [...new Set(records.map(record=>record[field]).filter(Boolean))].forEach(value=>{const option=document.createElement('option');option.value=value;option.textContent=value;select.append(option);});
  function render(){
    const pages=Math.max(1,Math.ceil(filtered.length/pageSize));page=Math.max(1,Math.min(page,pages));body.replaceChildren();
    filtered.slice((page-1)*pageSize,page*pageSize).forEach(record=>{const row=document.createElement('tr'),box=document.createElement('input');box.type='checkbox';box.setAttribute('aria-label','选择'+record.name);const check=document.createElement('td');check.append(box);row.append(check);const values=[record.name,record.employeeId,record.department||'—',record.position||'—',record.score];if(platform)values.push(record.score);values.forEach(value=>{const cell=document.createElement('td');cell.textContent=value;row.append(cell);});if(platform){const cell=document.createElement('td'),button=document.createElement('button');button.type='button';button.className='monitor-view';button.textContent='查看';button.disabled=true;cell.append(button);row.append(cell);}body.append(row);});
    if(!filtered.length){const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=platform?8:6;cell.className='empty';cell.textContent=project?'暂无符合条件的数据':'未找到测评结果';row.append(cell);body.append(row);}
    $('total').textContent='共 '+filtered.length+' 条';$('page').textContent=page;$('page-input').value=page;$('page-input').max=pages;$('previous').disabled=page===1;$('next').disabled=page===pages;$('select-all').checked=false;
  }
  form.addEventListener('submit',event=>{event.preventDefault();const query=name.value.trim().toLowerCase();filtered=records.filter(item=>(!query||item.name.toLowerCase().includes(query))&&(!department.value||item.department===department.value)&&(!position.value||item.position===position.value));page=1;render();});
  form.addEventListener('reset',()=>{filtered=records;page=1;render();});
  $('page-size').addEventListener('change',event=>{pageSize=Number(event.target.value);page=1;render();});$('previous').addEventListener('click',()=>{page--;render();});$('next').addEventListener('click',()=>{page++;render();});$('page-input').addEventListener('change',event=>{page=Number(event.target.value)||1;render();});$('select-all').addEventListener('change',event=>body.querySelectorAll('input[type=checkbox]').forEach(input=>{input.checked=event.target.checked;}));render();
})();
