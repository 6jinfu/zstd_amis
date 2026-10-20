(function(){
  var table=document.getElementById('review-people');
  var matrix=document.getElementById('review-grid-matrix');
  if(!table||!matrix)return;
  var names=['张明','李华','王芳','赵琳','陈强','周凯','林雪','赵毅','吴楠','郑涛','孙悦','徐冉','马睿','朱航','胡欣','郭磊','何倩','罗晨','梁宇','宋嘉','谢文','唐敏','韩松','冯静','于浩','董琳','萧然','程远','傅一诺','沈佳音','蒋文清','潘若溪','吕志成','姚思远','范怡','苏婉宁','魏子安','贾明宇','邱雨桐','秦致远','杜承泽','欧阳明远'];
  var roles=['大区销售总监','战略客户总监','区域销售经理','大客户销售经理','渠道经理','销售顾问','华东大区战略客户拓展与区域协同负责人'];
  var performanceByIndex=['低','中','高'];
  var labels={'y2-x0':'重点提升','y2-x1':'关键人才','y2-x2':'核心人才','y1-x0':'关注发展','y1-x1':'稳定贡献','y1-x2':'骨干人才','y0-x0':'重点关注','y0-x1':'待观察','y0-x2':'能力错配'};
  var tone={'核心人才':'tag-primary','关键人才':'tag-success','重点关注':'tag-danger'};
  var tbody=table.querySelector('tbody'),nextName=0,usedNames=new Set(Array.from(table.querySelectorAll('tbody tr')).map(function(row){return row.cells[0].textContent.trim()}));
  Array.from(matrix.querySelectorAll('.cell')).forEach(function(cell){
    var key=cell.dataset.cell,count=Number(cell.dataset.count),existing=tbody.querySelectorAll('tr[data-cell="'+key+'"]'),position=key.match(/^y(\d)-x(\d)$/);
    if(!position)return;
    var y=Number(position[1]),x=Number(position[2]),category=labels[key]||cell.dataset.cellName,score=x===0?52:x===1?72:88,performance=performanceByIndex[y];
    for(var index=existing.length;index<count;index++){
      var row=document.createElement('tr');row.dataset.cell=key;
      var personName='';while(!personName||usedNames.has(personName)){personName=names[nextName++%names.length]}usedNames.add(personName);var role=(x===2&&y===2&&index===existing.length)?roles[6]:roles[(x+y+index)%6];
      [personName,'销售中心',role,score+'%',performance].forEach(function(value){var td=document.createElement('td');td.textContent=value;row.appendChild(td)});
      var categoryCell=document.createElement('td'),tag=document.createElement('span');tag.className='tag '+(tone[category]||'');tag.textContent=category;categoryCell.appendChild(tag);row.appendChild(categoryCell);
      var action=document.createElement('td');action.className='ops';action.style.justifyContent='flex-end';var link=document.createElement('a');link.className='btn-text btn-sm';link.href='../../talent-profile.html';link.textContent='查看人才';action.appendChild(link);row.appendChild(action);tbody.appendChild(row);
    }
  });
  var selected=matrix.querySelector('.cell[aria-pressed="true"]');if(selected)selected.click();
})();
