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
      nameLabel:options.nameLabel || '名称'
    });
  }
  function preview(s) {
    const matched=S.people.filter(p=>S.match(s,p)===true), unknown=S.people.filter(p=>S.match(s,p)===null);
    dialog('匹配人员',`<p class="std-dialog-note">${e(S.summary(s))}</p><p class="text-sm">当前可用人员 ${S.people.length} 人 · 匹配 ${matched.length} 人 · 待确认 ${unknown.length} 人</p><div class="table-wrap"><table class="t"><thead><tr><th>姓名</th><th>现岗位</th><th>匹配依据</th></tr></thead><tbody>${matched.map(p=>`<tr><td>${e(p.name)}</td><td>${e(p.position)}</td><td>${e(s.mode==='positions'?'岗位已关联':s.groups.filter(g=>S.match({...s,groups:[g]},p)===true).map(g=>g.map(r=>S.fields[r.field]+'：'+(r.field==='critical'?(p.critical?'是':'否'):p[r.field])).join('，')).join('；'))}</td></tr>`).join('')||'<tr><td colspan="3">暂无匹配人员</td></tr>'}${unknown.map(p=>`<tr><td>${e(p.name)}</td><td>${e(p.position)}</td><td>待确认：匹配属性缺失</td></tr>`).join('')}</tbody></table></div>`,'关闭',()=>{});
  }
  window.StandardUI = {dialog, pick, pickIndicators, preview, escape:e};
})();
