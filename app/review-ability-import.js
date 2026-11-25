(function () {
  const headers = ['工号', '姓名', '能力编号', '能力名称', '能力得分', '能力等级', '测评日期', '来源说明'];
  const xml = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const text = node => node?.textContent || '';
  const column = ref => [...ref.match(/^[A-Z]+/)[0]].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
  const parseXml = value => {
    const doc = new DOMParser().parseFromString(value, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('文件内容无法读取');
    return doc;
  };
  async function template(people) {
    const zip = new JSZip();
    const rows = [
      ['填写说明：模板已带入当前盘点人员；每人每项能力填写一行。'],
      ['能力编号或能力名称填写一项；得分和等级至少填写一项。'],
      ['等级填写 L1–L10，测评日期填写 YYYY-MM-DD；未填写能力结果的人员行不会导入。'],
      headers, ...people.map(person => [person.id, person.name, '', '', '', '', '', ''])
    ];
    const sheet = rows.map((row, i) => `<row r="${i + 1}">${row.map((value, j) => `<c r="${String.fromCharCode(65 + j)}${i + 1}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`).join('')}</row>`).join('');
    zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
    zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    zip.file('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="能力数据" sheetId="1" r:id="rId1"/></sheets></workbook>');
    zip.file('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
    zip.file('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheet}</sheetData></worksheet>`);
    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  async function readFile(file) {
    if (!file.name.toLowerCase().endsWith('.xlsx')) throw new Error('请选择 .xlsx 文件');
    if (file.size > 5 * 1024 * 1024) throw new Error('文件不能超过 5 MB');
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const sheet = zip.file('xl/worksheets/sheet1.xml');
    if (!sheet) throw new Error('未找到能力数据工作表');
    const sharedFile = zip.file('xl/sharedStrings.xml');
    const shared = sharedFile ? [...parseXml(await sharedFile.async('string')).getElementsByTagName('si')].map(si => [...si.getElementsByTagName('t')].map(text).join('')) : [];
    const doc = parseXml(await sheet.async('string'));
    const rows = [...doc.getElementsByTagName('row')].map(row => {
      const cells = [];
      [...row.getElementsByTagName('c')].forEach(cell => {
        const ref = cell.getAttribute('r');
        if (!ref || !/^[A-Z]+\d+$/.test(ref)) return;
        const type = cell.getAttribute('t'), value = text(cell.getElementsByTagName('v')[0]);
        cells[column(ref)] = type === 's' ? shared[Number(value)] || '' : type === 'inlineStr' ? [...cell.getElementsByTagName('t')].map(text).join('') : value;
      });
      return { number: Number(row.getAttribute('r')), cells };
    });
    const first = rows.find(row => headers.every((header, i) => String(row.cells[i] || '').replace(/^\*/, '').trim() === header));
    if (!first) throw new Error('表头不匹配，请使用本页面下载的模板');
    return rows.filter(row => row.number > first.number);
  }
  function dateValue(value) {
    if (/^\d+(\.\d+)?$/.test(value)) {
      const n = Number(value);
      if (n >= 1 && n < 2958466) return new Date(Math.round((n - 25569) * 86400000)).toISOString().slice(0, 10);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
    const d = new Date(value + 'T00:00:00Z');
    return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === value ? value : '';
  }
  function validate(rows, people) {
    const persons = new Map(people.map(p => [p.id, p]));
    const indicators = window.IndicatorDemo.items.cap;
    const records = [], errors = [], seen = new Set();
    rows.forEach(row => {
      const [id, name, indicatorId, indicatorName, score, level, date, source] = headers.map((_, i) => String(row.cells[i] || '').trim());
      if (![indicatorId, indicatorName, score, level, date, source].some(Boolean)) return;
      const problems = [], person = persons.get(id);
      if (!person) problems.push('工号不属于本次盘点人员');
      else if (name && name !== person.name) problems.push('姓名与工号不一致');
      const matched = indicatorId ? indicators.filter(item => item.id === indicatorId) : indicators.filter(item => item.name === indicatorName);
      if (matched.length !== 1 || (indicatorName && matched[0]?.name !== indicatorName)) problems.push('能力编号或名称不匹配指标库');
      if (!score && !level) problems.push('能力得分和等级至少填写一项');
      if (score && (!Number.isFinite(Number(score)) || Number(score) < 0)) problems.push('能力得分须为非负数值');
      if (level && !/^L(?:10|[1-9])$/i.test(level)) problems.push('能力等级须为 L1–L10');
      const measured = dateValue(date);
      if (!measured) problems.push('测评日期无效');
      const key = `${id}\u0000${matched[0]?.id}\u0000${measured}`;
      if (seen.has(key)) problems.push('同一人员、能力和测评日期重复');
      seen.add(key);
      if (problems.length) errors.push(`第 ${row.number} 行：${problems.join('；')}`);
      else records.push({ employeeId: id, name: person.name, indicatorId: matched[0].id, indicatorName: matched[0].name, score: score ? Number(score) : null, level: level.toUpperCase(), measured, source });
    });
    if (!records.length && !errors.length) errors.push('没有填写能力数据');
    return { records, errors };
  }
  window.ReviewAbilityImport = {
    mount(root, personSelector) {
      let records = [];
      const status = root.querySelector('[data-ability-status]'), input = root.querySelector('[data-ability-file]');
      const errorOutput = document.createElement('div'); errorOutput.hidden = true; status.after(errorOutput);
      const people = () => [...document.querySelectorAll(personSelector)].map(row => ({ id: row.cells[1]?.textContent.trim(), name: row.cells[2]?.textContent.trim() })).filter(person => person.id && person.name);
      root.querySelector('[data-ability-template]').addEventListener('click', async () => {
        const selected = people();
        if (!selected.length) { status.textContent = '请先选择盘点人员'; return; }
        try { const blob = await template(selected), url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = '盘点能力数据模板.xlsx'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
        catch { status.textContent = '模板生成失败，请重试'; }
      });
      input.addEventListener('change', async () => {
        if (!input.files[0]) return;
        errorOutput.hidden = true;
        try {
          const result = validate(await readFile(input.files[0]), people());
          if (result.errors.length) { status.textContent = `校验未通过，共 ${result.errors.length} 处错误，请下载报错 Excel。`; ReviewScoreImport.showErrors(errorOutput, result.errors); return; }
          records = result.records;
          status.textContent = `已导入 ${records.length} 条能力数据，覆盖 ${new Set(records.map(record => record.employeeId)).size} 人。`;
        } catch (error) { status.textContent = '校验未通过，请下载报错 Excel。'; ReviewScoreImport.showErrors(errorOutput, [error.message]); }
        finally { input.value = ''; }
      });
      return { getRecords: () => records.slice() };
    }
  };
})();
