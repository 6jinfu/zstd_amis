(function () {
  const root=document.querySelector('[data-assessment-project-list]');
  if(!root)return;
  const projects=AssessmentDrafts.read(),e=UI.escape;
  const body=root.querySelector('tbody');
  projects.slice().reverse().forEach(project=>{
    const row=document.createElement('tr');row.dataset.cat='通用能力';
    const url='assess-new.html?id='+encodeURIComponent(project.id);
    row.innerHTML=`<td class="check-cell"><input type="checkbox" data-row-check aria-label="选择${e(project.title)}"></td><td>${e(project.id)}</td><td><a class="table-link" href="${url}">${e(project.title)}</a></td><td>李文静</td><td class="muted">—</td><td>草稿</td><td class="ops"><a class="btn-text btn-sm" href="${url}">项目设置</a></td>`;
    body.prepend(row);
  });
  if(projects.length){const total=root.querySelector('.assess-page-total');if(total)total.textContent='共 '+(Number(root.dataset.total)+projects.length)+' 条';}
})();
