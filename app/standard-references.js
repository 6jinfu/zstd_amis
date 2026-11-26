/* 岗位与人才从同一标准记录读取要求，学习方案统一按“岗位 + 标准”配置。 */
(function () {
  const S=window.Standards,U=window.StandardUI,$=s=>document.querySelector(s),e=U.escape;
  const planStorageKey='talent-learning-plan-design-v1';
  let data=S.read();
  function save(){try{S.write(data);return true;}catch(err){showToast('保存失败，请检查浏览器存储权限');return false;}}
  const isPosition=!!$('#position-standard-links');
  const positionId = isPosition ? window.POSITION_DEMO.code : new URLSearchParams(location.search).get('position') || 'RD-302';

  function planSummary(posId, std) {
    try {
      const saved = JSON.parse(localStorage.getItem(planStorageKey) || '{}')[JSON.stringify([posId, std.id])];
      if (saved?.groups) {
        const resCount = saved.groups.reduce((n, g) => n + (g.activities?.length || 0), 0);
        const capCovered = new Set(saved.groups.flatMap(g => (g.activities || []).flatMap(a => a.capabilities || []))).size;
        return `${saved.groups.length} 个阶段 · ${resCount} 项学习资源 · 覆盖 ${capCovered}/${std.content.cap.length} 项能力`;
      }
    } catch {}
    if (['std-sales','std-architecture','std-algorithm'].includes(std.id)) {
      return `已内置示例阶段方案 · 共 ${std.content.cap.length} 项标准能力`;
    }
    return `待配置学习方案 · 共 ${std.content.cap.length} 项标准能力`;
  }

  if(isPosition){
    const p=S.positions.find(p=>p.id===positionId);
    $('#position-new-standard').href='standard-detail.html?position='+encodeURIComponent(positionId);
    function render(){
      const linked=S.associated(data,positionId);
      $('#position-standard-links').innerHTML=linked.map(s=>{
        const url='standard-detail.html?id='+encodeURIComponent(s.id)+'&position='+encodeURIComponent(positionId);
        const hasCap=!S.hasDimension||S.hasDimension(s,'cap');
        const planUrl=`learning-plan.html?position=${encodeURIComponent(positionId)}&standard=${encodeURIComponent(s.id)}&from=position`;
        return `<div class="std-link-row"><div><a class="std-table-name" href="${url}">${e(s.name)}</a><p>${e(S.applicableObjectLabel(data,s))}</p></div><a class="btn-text" href="${url}">编辑标准</a>${hasCap?`<a class="btn-text" href="${planUrl}">学习方案</a>`:''}<button class="btn-text danger" data-unlink="${e(s.id)}">解除关联</button></div>`;
      }).join('')||'<div class="empty-state">尚未关联标准</div>';
      const planHost = $('#position-plan-standards');
      if (planHost) {
        const capStandards = linked.filter(s => !S.hasDimension || S.hasDimension(s, 'cap'));
        planHost.innerHTML = capStandards.length
          ? capStandards.map(s => `<div class="std-link-row"><div><b>${e(s.name)}</b><p>${e(planSummary(positionId, s))}</p></div><a class="btn btn-secondary" href="learning-plan.html?position=${encodeURIComponent(positionId)}&amp;standard=${encodeURIComponent(s.id)}&amp;from=position">配置学习方案</a></div>`).join('')
          : '<div class="empty-state">当前岗位尚未关联包含“能力要求”的人才标准，请先在“适用标准”中添加或新建标准。</div>';
      }
    }
    $('#position-link-standard').onclick=()=>{const selected=S.associated(data,positionId).map(s=>s.id);U.pick('关联人才标准',data.standards.filter(s=>!selected.includes(s.id)).map(s=>({id:s.id,name:s.name,note:S.modes[s.mode]||'暂未关联'})),[],ids=>{data.links[positionId]=[...new Set([...(data.links[positionId]||[]),...ids])];if(save()){render();showToast('已关联标准');}});};
    $('#position-standard-links').onclick=ev=>{const b=ev.target.closest('[data-unlink]');if(!b)return;const s=data.standards.find(s=>s.id===b.dataset.unlink);U.dialog('解除关联',`<p>解除“${e(s.name)}”与本岗位的关联？标准内容会保留。</p>`,'解除关联',()=>{s.positions=s.positions.filter(id=>id!==positionId);if(s.mode==='positions'&&!s.positions.length)s.mode='none';data.links[positionId]=(data.links[positionId]||[]).filter(id=>id!==s.id);if(data.selected['plan-'+positionId]===s.id)delete data.selected['plan-'+positionId];if(!save())return false;render();});};
    if(p){const tag=$('.detail-bar .tag');if(tag)tag.hidden=!p.critical;const check=$('[data-section=info] input[type=checkbox]');if(check)check.checked=p.critical;}
    render();
  }
})();
