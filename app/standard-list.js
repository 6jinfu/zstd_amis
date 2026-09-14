(function () {
  const S=window.Standards, $=s=>document.querySelector(s);
  const e = UI.escape;
  let data;
  try { data=S.read(); } catch(err) { showToast('无法读取标准，请检查浏览器存储权限'); return; }
  function persist() { try { S.write(data); return true; } catch(err) { showToast('保存失败，请检查浏览器存储空间与权限'); return false; } }
  const button=(label,attr='',cls='btn btn-secondary')=>`<button type="button" class="${cls}" ${attr}>${label}</button>`;
  const {dialog, pick, preview} = window.StandardUI;
  if($('[data-standard-list]')) {
    let category='',query='',page=1;
    const collapsed=new Set();
    const tree=()=>data.categoryTree||data.categories.map(name=>({name}));
    const namesFor=node=>[node.name,...(node.children||[])];
    const matchesCategoryFor=(s,name)=>{if(!name)return true;const node=tree().find(item=>item.name===name);return node?namesFor(node).includes(s.category):s.category===name;};
    const matchesCategory=s=>matchesCategoryFor(s,category);
    const categoryButton=(name,label,extra='',reserveToggle=true)=>`<button type="button" class="cat-tree-item std-category ${extra} ${name===category?'active':''}" data-category="${e(name)}">${reserveToggle?'<span class="std-category-toggle-slot" aria-hidden="true"></span>':''}<span class="std-category-label">${e(label)}</span></button>`;
    function render(focusTarget) {
      const all=`<button type="button" class="cat-tree-item std-category ${!category?'active':''}" data-category=""><span class="std-category-toggle-slot" aria-hidden="true"></span><span class="std-category-label">全部</span></button>`;
      const categoryHtml=tree().map(node=>{
        const children=node.children||[];
        if(!children.length)return categoryButton(node.name,node.name);
        const expanded=!collapsed.has(node.name);
        return `<div class="std-category-group"><div class="std-category-parent-row${node.name===category?' active':''}"><button type="button" class="std-category-toggle" data-toggle-category="${e(node.name)}" aria-label="${expanded?'收起':'展开'}${e(node.name)}" aria-expanded="${expanded}"><span class="std-category-chevron" aria-hidden="true"></span></button>${categoryButton(node.name,node.name,'std-category-parent',false)}</div><div class="std-category-children"${expanded?'':' hidden'}>${children.map(name=>categoryButton(name,name,'std-category-child')).join('')}</div></div>`;
      }).join('');
      $('#std-categories').innerHTML=all+categoryHtml;
      const rows=data.standards.filter(s=>matchesCategory(s)&&(!query||s.name.toLowerCase().includes(query.toLowerCase())));
      page=Math.min(page,Math.max(1,Math.ceil(rows.length/10)));
      $('#std-rows').innerHTML=rows.slice((page-1)*10,page*10).map(s=>`<tr><td><a class="std-table-name" href="standard-detail.html?id=${e(s.id)}">${e(s.name)}</a></td><td class="std-object-count">${e(S.applicableObjectLabel(data,s))}</td><td><div class="flex gap-sm"><a class="btn-text" href="standard-detail.html?id=${e(s.id)}">编辑</a>${button('复制',`data-copy="${e(s.id)}"`,'btn-text')}${button('删除',`data-delete="${e(s.id)}"`,'btn-text danger')}</div></td></tr>`).join('')||'<tr><td colspan="3"><div class="empty-state">没有符合条件的标准</div></td></tr>';
      $('#std-count').textContent=`共 ${rows.length} 条 · 每页 10 条`;$('#std-page').textContent=`${page} / ${Math.max(1,Math.ceil(rows.length/10))}`;
      $('#std-prev').disabled=page===1;$('#std-next').disabled=page*10>=rows.length;
      if(focusTarget){
        const key=focusTarget.kind==='toggle'?'toggleCategory':'category';
        const selector=focusTarget.kind==='toggle'?'[data-toggle-category]':'[data-category]';
        const target=[...$('#std-categories').querySelectorAll(selector)].find(node=>node.dataset[key]===focusTarget.value);
        if(target)target.focus();
      }
    }
    $('#std-filter').onsubmit=ev=>{ev.preventDefault();query=$('#std-search').value.trim();page=1;render();};
    $('#std-filter').onreset=()=>{query='';page=1;render();};
    $('#std-categories').onclick=ev=>{const toggle=ev.target.closest('[data-toggle-category]');if(toggle){const name=toggle.dataset.toggleCategory;if(collapsed.has(name))collapsed.delete(name);else collapsed.add(name);render(ev.detail===0?{kind:'toggle',value:name}:null);return;}const b=ev.target.closest('[data-category]');if(b){category=b.dataset.category;page=1;render(ev.detail===0?{kind:'category',value:category}:null);}};
    $('#std-prev').onclick=()=>{page--;render();};$('#std-next').onclick=()=>{page++;render();};
    $('#std-rows').onclick=ev=>{
      const copy=ev.target.closest('[data-copy]'),del=ev.target.closest('[data-delete]');
      if(copy) location.href='standard-detail.html?copy='+encodeURIComponent(copy.dataset.copy);
      if(del){const s=data.standards.find(x=>x.id===del.dataset.delete);const used=s.positions.length||Object.values(data.links).some(ids=>ids.includes(s.id))||Object.values(data.selected).includes(s.id);
        if(used){dialog('标准仍被引用','<p>请先解除岗位关联及学习方案、人才档案的标准选择，再删除。</p>','知道了',()=>{});return;}
        dialog('删除标准',`<p>确定删除“${e(s.name)}”？${s.mode==='rules'?'删除后，符合条件的人员将不再匹配此标准。':''}</p>`,'删除',()=>{data.standards=data.standards.filter(x=>x.id!==s.id);if(!persist())return false;render();showToast('标准已删除');});
      }
    };
    $('#std-manage-categories').onclick = () => UI.openCategoryManager({
      items: data.categories.map(name => ({id:name, name, count:data.standards.filter(s => s.category === name).length})),
      onConfirm(items) {
        const names = new Map(items.map(item => [item.id, item.name]));
        data.standards.forEach(standard => { if (names.has(standard.category)) standard.category = names.get(standard.category); });
        data.categories = items.map(item => item.name);
        const renames = new Map(items.map(item => [item.id, item.name]));
        const existingTree = data.categoryTree || data.categories.map(name => ({name}));
        data.categoryTree = existingTree.map(node => ({name:renames.get(node.name)||node.name,children:(node.children||[]).map(name=>renames.get(name)||name)}));
        const treeNames = new Set(data.categoryTree.flatMap(node=>[node.name,...(node.children||[])]));
        data.categories.forEach(name=>{if(!treeNames.has(name))data.categoryTree.push({name});});
        category = '';
        if (!persist()) return false;
        render();
      }
    });
    render();
  }
})();
