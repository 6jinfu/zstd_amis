(function () {
  function abilityBand(score) {
    if (!Number.isFinite(score)) return '';
    return score >= 80 ? 'high' : score >= 60 ? 'mid' : 'low';
  }
  function matchesPerson(person, filters) {
    const value = filters.field === 'ability' ? abilityBand(person.ability) : person[filters.field];
    return person.name.includes(filters.name.trim()) &&
      (!filters.department || person.department === filters.department) &&
      (!filters.value || value === filters.value);
  }
  document.addEventListener('DOMContentLoaded', function () {
    const panel = document.querySelector('.grid-layering');
    if (!panel) return;
    const e = UI.escape, form = panel.querySelector('form'), table = panel.querySelector('tbody');
    const name = form.elements.namedItem('name'), department = form.elements.namedItem('department');
    const field = form.elements.namedItem('field'), value = form.elements.namedItem('value');
    const people = Array.from(document.querySelectorAll('#review-people tbody tr')).map(row => ({
      name: row.cells[0].textContent.trim(), department: row.cells[1].textContent.trim(),
      position: row.cells[2].textContent.trim(), ability: parseFloat(row.cells[3].textContent),
      performance: row.cells[4].textContent.trim(), classification: row.cells[5].textContent.trim(),
      url: row.querySelector('a').getAttribute('href')
    }));
    const options = items => '<option value="">全部</option>' + items.map(([key, label]) => `<option value="${e(key)}">${e(label)}</option>`).join('');
    const unique = key => [...new Set(people.map(person => person[key]))].map(item => [item, item]);
    const values = {
      ability: [['high', '高 · 80 分及以上'], ['mid', '中 · 60 至不足 80 分'], ['low', '低 · 不足 60 分']],
      performance: [['高', '高'], ['中', '中'], ['低', '低']],
      classification: unique('classification'), position: unique('position')
    };
    department.innerHTML = options(unique('department'));
    panel.querySelector('[data-layer-total]').textContent = String(people.length);
    function updateValues() { value.innerHTML = options(values[field.value]); }
    function render() {
      const filters = {name: name.value, department: department.value, field: field.value, value: value.value};
      const rows = people.filter(person => matchesPerson(person, filters));
      table.innerHTML = rows.map(person => {
        const band = abilityBand(person.ability), scoreClass = {high:'score-hi', mid:'score-mid', low:'score-low'}[band] || '';
        const performanceClass = person.performance === '高' ? 'tag-success' : person.performance === '低' ? 'tag-draft' : '';
        const placementClass = person.classification === '核心人才' ? 'tag-primary' : person.classification === '重点关注' ? 'tag-danger' : ['关键人才','骨干人才'].includes(person.classification) ? 'tag-success' : '';
        return `<tr><td>${e(person.name)}</td><td>${e(person.department)}</td><td>${e(person.position)}</td><td><span class="score-cell ${scoreClass}">${band ? person.ability.toFixed(1) : '—'}</span></td><td><span class="tag ${performanceClass}">${e(person.performance)}</span></td><td><span class="tag ${placementClass}">${e(person.classification)}</span></td><td class="ops" style="justify-content:flex-end"><a class="btn-text btn-sm" href="${e(person.url)}">查看</a></td></tr>`;
      }).join('') || '<tr><td colspan="7" class="text-center muted">暂无符合条件的人员，请调整筛选条件</td></tr>';
      panel.querySelector('[data-layer-count]').textContent = `匹配 ${rows.length} 人 · 共 ${people.length} 名代表人员`;
    }
    form.addEventListener('submit', function (event) { event.preventDefault(); render(); });
    form.addEventListener('change', function (event) { if (event.target === field) updateValues(); render(); });
    name.addEventListener('input', render);
    form.addEventListener('reset', function () { setTimeout(function () { updateValues(); render(); }); });
    updateValues(); render();
  });
})();
