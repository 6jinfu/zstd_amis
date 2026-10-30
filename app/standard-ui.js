/* Standard-specific preview; generic controls live in UI. */
(function () {
  const S = window.Standards, e = UI.escape;
  function dialog(title, body, action, onAction) {
    return UI.openDialog({title, body, confirmLabel:action || '关闭', onConfirm:onAction,
      cancelLabel:['关闭','知道了'].includes(action) ? '' : '取消'});
  }
  function pick(title, items, selected, done, maxSelected = Infinity, options = {}) {
    return UI.openPicker({title, items:items.map(item => ({id:item.id, label:item.name, description:item.note || item.description, categoryId:item.categoryId})), selectedIds:selected, onConfirm:done, maxSelected, ...options});
  }
  function pickIndicators(title, items, selected, done, maxSelected = Infinity, options = {}) {
    const config = window.IndicatorDemo || {};
    return pick(title, items, selected, done, maxSelected, {
      variant:'indicator',
      categories:options.categories || config.categories || [],
      treeTitle:options.treeTitle || '指标',
      nameLabel:options.nameLabel || '名称',
      keepParent:options.keepParent || false
    });
  }
  function capabilityRadar(items,name){
    if(items.length<3)return `<ul>${items.map(([name,level])=>`<li>${e(name)}<span class="std-radar-level-value">${e(level)}</span></li>`).join('')||'<li>暂无内容</li>'}</ul>`;
    const dense=items.length>8||items.some(([name])=>name.length>12),cx=160,cy=142,radius=82;
    const point=(index,r)=>{const angle=-Math.PI/2+index*2*Math.PI/items.length;return [cx+Math.cos(angle)*r,cy+Math.sin(angle)*r];};
    const polygon=r=>items.map((_,index)=>point(index,r).join(',')).join(' ');
    const grid=Array.from({length:5},(_,index)=>`<polygon class="std-radar-ring" points="${polygon(radius*(index+1)/5)}"/>`).reverse().join('');
    const axes=items.map((_,index)=>{const [x,y]=point(index,radius);return `<line class="std-radar-axis" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`;}).join('');
    const values=items.map(([,level],index)=>point(index,radius*Number(level.slice(1))/5));
    const labels=items.map(([name,level],index)=>{
      const [x,y]=point(index,116),lines=dense?[String(index+1)]:(name.match(/.{1,6}/gu)||[]);
      return `<text class="std-radar-label" x="${x}" y="${y-(lines.length-1)*8}" text-anchor="middle">${lines.map((line,i)=>`<tspan x="${x}" dy="${i?17:0}">${e(line)}</tspan>`).join('')}${dense?'':`<tspan class="std-radar-level" x="${x}" dy="19">${e(level)}</tspan>`}</text>`;
    }).join('');
    const scale=Array.from({length:5},(_,index)=>`<text class="std-radar-scale" x="${cx+7}" y="${cy-radius*(index+1)/5+4}">${index+1}</text>`).join('');
    const description=items.map(([term,level],index)=>`${dense?index+1+'、':''}${term} ${level}`).join('；');
    return `<figure class="std-radar"><figcaption>${e(name)}</figcaption><svg viewBox="0 0 320 284" role="img" aria-label="${e(name+'，等级范围 L1 至 L5；'+description)}"><g aria-hidden="true">${grid}${axes}<polygon class="std-radar-area" points="${values.map(p=>p.join(',')).join(' ')}"/>${values.map(([x,y])=>`<circle class="std-radar-point" cx="${x}" cy="${y}" r="4"/>`).join('')}${scale}${labels}</g></svg>${dense?`<ol class="std-radar-legend">${items.map(([term,level])=>`<li><span>${e(term)}</span><span class="std-radar-level-value">${e(level)}</span></li>`).join('')}</ol>`:''}</figure>`;
  }
  function preview(s) {
    const matched=S.people.filter(p=>S.match(s,p)===true), unknown=S.people.filter(p=>S.match(s,p)===null);
    dialog('匹配人员',`<p class="std-dialog-note">${e(S.summary(s))}</p><p class="text-sm">当前可用人员 ${S.people.length} 人 · 匹配 ${matched.length} 人 · 待确认 ${unknown.length} 人</p><div class="table-wrap"><table class="t"><thead><tr><th>姓名</th><th>现岗位</th><th>匹配依据</th></tr></thead><tbody>${matched.map(p=>`<tr><td>${e(p.name)}</td><td>${e(p.position)}</td><td>${e(s.mode==='positions'?'岗位已关联':s.groups.filter(g=>S.match({...s,groups:[g]},p)===true).map(g=>g.map(r=>S.fields[r.field]+'：'+(r.field==='critical'?(p.critical?'是':'否'):p[r.field])).join('，')).join('；'))}</td></tr>`).join('')||'<tr><td colspan="3">暂无匹配人员</td></tr>'}${unknown.map(p=>`<tr><td>${e(p.name)}</td><td>${e(p.position)}</td><td>待确认：匹配属性缺失</td></tr>`).join('')}</tbody></table></div>`,'关闭',()=>{});
  }
  window.StandardUI = {dialog, pick, pickIndicators, capabilityRadar, preview, escape:e};
})();
