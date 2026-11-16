(function () {
  const headers = ['工号', '姓名', '能力类别', '能力名称', '能力等级', '能力得分'];
  function catalog() {
    const paths = new Map();
    function visit(nodes, parent = []) {
      nodes.forEach(node => { const path = [...parent, node.name]; paths.set(node.id, path.join('.')); visit(node.children || [], path); });
    }
    visit(IndicatorDemo.categories);
    return IndicatorDemo.items.cap.map(item => ({ ...item, category: paths.get(item.categoryId) }));
  }
  function validate(rows, people, abilities = catalog()) {
    const persons = new Map(people.map(p => [p.employeeId, p])), seen = new Set(), records = [], errors = [];
    const filled = rows.filter(row => row.formula || row.cells.some(value => String(value ?? '').trim()));
    if (filled.length > 2000) return { records, errors: [{ row: '文件', message: '每次最多导入 2000 条，请拆分文件' }] };
    filled.forEach(row => {
      const [employeeId, name, category, ability, level, score] = headers.map((_, i) => String(row.cells[i] ?? '').trim());
      const person = persons.get(employeeId), matched = abilities.filter(item => item.category === category && item.name === ability), problems = [];
      if (!person) problems.push('工号不存在');
      else if (name !== person.name) problems.push('姓名与工号不一致');
      if (matched.length !== 1) problems.push('能力类别与名称不匹配，请核对指标库中的能力类别与名称');
      if (!/^(?:10|[1-9])$/.test(level)) problems.push('能力等级须为 1–10 的整数');
      if (score && !ReviewScoreImport.validScore(score)) problems.push('能力得分须为 0–999，最多两位小数');
      if (row.formula) problems.push('请填写实际值，不使用公式');
      const key = employeeId + '\u0000' + matched[0]?.id;
      if (seen.has(key)) problems.push('同一人员、同一能力在文件中重复');
      seen.add(key);
      if (problems.length) errors.push({ row: row.number, message: problems.join('；') });
      else records.push({ person: person.id, employeeId, name, category, indicatorId: matched[0].id, ability, level: Number(level), score: score === '' ? null : Number(score), source: '人才库导入' });
    });
    if (!filled.length) errors.push({ row: '文件', message: '没有填写能力数据，请从第 4 行开始填写' });
    return { records, errors };
  }
  function append(data, records, timestamp = new Date().toISOString()) {
    records.forEach(record => data.evidence.push({
      id: Talent.uid('ability-import'), person: record.person, name: '人员能力数据 · ' + record.ability,
      type: '线下导入', date: Talent.today(), validUntil: '', importedAt: timestamp,
      values: [[record.ability, record.level]], abilityImport: { ...record }
    }));
    return data;
  }
  function open(onSaved) {
    const e = UI.escape;
    let records = [], busy = false;
    const dialog = UI.openDialog({ title: '导入人员能力数据', confirmLabel: '确认导入', body: `
      <section class="tai-step"><h4>第一步：下载模板并填写</h4><p>按人员、能力逐行填写工号、姓名、能力类别、能力名称和能力等级；能力得分选填。</p><a class="btn btn-secondary" href="templates/talent-person-ability.xlsx" download="人员能力数据导入模板.xlsx">下载导入模板</a></section>
      <section class="tai-step"><h4>第二步：上传能力数据</h4><p>支持 .xlsx，文件不超过 5 MB，每次最多 2000 条。上传后先校验，确认导入后才保存。</p><button type="button" class="btn btn-primary" data-tai-upload>上传能力数据</button><input type="file" accept=".xlsx" data-tai-file hidden><p data-tai-status role="status">尚未选择文件</p></section>
      <section data-tai-result hidden></section>`, onConfirm(d) {
        if (busy || !records.length) return false;
        try { const data = Talent.read(); append(data, records); Talent.write(data); }
        catch { d.showError('保存失败，请检查浏览器存储空间后重试'); return false; }
        onSaved();
        showToast(`已导入 ${records.length} 条能力数据`);
      }
    });
    dialog.classList.add('talent-ability-import');
    const confirm = dialog.querySelector('[data-confirm]'), upload = dialog.querySelector('[data-tai-upload]'), input = dialog.querySelector('[data-tai-file]'), status = dialog.querySelector('[data-tai-status]'), result = dialog.querySelector('[data-tai-result]');
    confirm.disabled = true;
    upload.onclick = () => input.click();
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      busy = true; records = []; confirm.disabled = true; upload.disabled = true; result.hidden = true; dialog.showError('');
      status.textContent = `正在校验：${file.name}`;
      try {
        const checked = validate(await ReviewScoreImport.read(file, { headers }), Talent.people);
        if (!dialog.isConnected) return;
        if (checked.errors.length) {
          status.textContent = `${file.name} · 校验未通过，未导入任何数据。请修改后重新上传。`;
          result.innerHTML = `<h4>共 ${checked.errors.length} 处错误</h4><div class="table-wrap"><table class="t"><thead><tr><th>行号</th><th>错误说明</th></tr></thead><tbody>${checked.errors.map(error => `<tr><td>${e(error.row)}</td><td>${e(error.message)}</td></tr>`).join('')}</tbody></table></div>`;
        } else {
          records = checked.records;
          status.textContent = `${file.name} · 校验通过，共 ${records.length} 条，涉及 ${new Set(records.map(record => record.person)).size} 人。`;
          result.innerHTML = `<h4>数据预览${records.length > 20 ? '（前 20 条）' : ''}</h4><div class="table-wrap"><table class="t"><thead><tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr></thead><tbody>${records.slice(0, 20).map(record => `<tr>${[record.employeeId, record.name, record.category, record.ability, 'L' + record.level, record.score ?? '—'].map(value => `<td>${e(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
          confirm.disabled = false;
        }
        result.hidden = false;
      } catch (error) { status.textContent = `${file.name} · ${error.message}，未导入任何数据。`; }
      finally { busy = false; upload.disabled = false; input.value = ''; }
    };
  }
  window.TalentAbilityImport = { headers, catalog, validate, append, open };
})();
