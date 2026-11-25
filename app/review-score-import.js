(function () {
  const configs = {
    ability: { title: '能力测评结果', headers: ['工号', '姓名', '测评项目名称', '项目开始日期', '项目结束日期', '测评得分'], template: 'review-external-ability-score.xlsx' },
    performance: { title: '绩效数据', headers: ['工号', '姓名', '绩效得分'], template: 'review-performance.xlsx' }
  };
  const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const templateBase=typeof document==='undefined'?'templates/':new URL('templates/',document.currentScript.src).href;
  function parse(value) {
    const doc = new DOMParser().parseFromString(value, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('文件内容无法读取');
    return doc;
  }
  function validScore(value) {
    return /^\d+(?:\.\d{1,2})?$/.test(String(value)) && Number(value) >= 0 && Number(value) <= 999;
  }
  function performanceScore(value) {
    const legacy={低:1,中:2,高:3};
    return Object.hasOwn(legacy,value)?legacy[value]:validScore(value)?Number(value):null;
  }
  function latestScores(records) {
    const latest=new Map();
    records.forEach((record,index)=>{const previous=latest.get(record.employeeId),order=record.importOrder??index;if(!previous||record.endDate>previous.record.endDate||(record.endDate===previous.record.endDate&&order>=previous.order))latest.set(record.employeeId,{record,order});});
    return [...latest.values()].map(item=>item.record);
  }
  function dateValue(value) {
    const raw=String(value).trim();
    if (/^\d+(?:\.\d+)?$/.test(raw)) {
      const days=Number(raw);
      if(days>=1&&days<2958466)return new Date(Math.round((days-25569)*86400000)).toISOString().slice(0,10);
      return '';
    }
    if(!/^\d{4}-\d{2}-\d{2}$/.test(raw))return '';
    const date=new Date(raw+'T00:00:00Z');
    return !Number.isNaN(date.valueOf())&&date.toISOString().slice(0,10)===raw?raw:'';
  }
  function validate(rows, people, kind) {
    const config = configs[kind], persons = new Map(people.map(p => [p.id, p]));
    const records = [], errors = [], seen = new Set();
    if (rows.filter(row => row.formula || row.cells.slice(2).some(value => String(value ?? '').trim())).length > 2000) return { records, errors: ['每次最多导入 2000 条，请拆分文件'] };
    rows.forEach(row => {
      const values = config.headers.map((_, i) => String(row.cells[i] ?? '').trim());
      const [id, name] = values, score = values.at(-1);
      const projectName=kind==='ability'?values[2]:'', startDate=kind==='ability'?dateValue(values[3]):'', endDate=kind==='ability'?dateValue(values[4]):'';
      if (!values.slice(2).some(Boolean) && !row.formula) return;
      const problems = [], person = persons.get(id);
      if (!person) problems.push('工号不属于本次盘点人员');
      else if (name !== person.name) problems.push('姓名与工号不一致');
      if(kind==='ability') {
        if(!projectName)problems.push('请填写项目名称');
        if(!startDate||!endDate)problems.push('请填写有效的项目起止日期');
        else if(startDate>endDate)problems.push('项目开始日期不能晚于结束日期');
      }
      if (!validScore(score)) problems.push('得分须为 0–999 的数值，最多两位小数');
      if (row.formula) problems.push('请填写实际值，不使用公式');
      const key=kind==='ability'?[id,projectName,startDate,endDate].join('\u0000'):id;
      if (seen.has(key)) problems.push(kind==='ability'?'同一人员和项目重复':'同一工号重复');
      seen.add(key);
      if (problems.length) errors.push(`第 ${row.number} 行：${problems.join('；')}`);
      else records.push({ employeeId: id, name: person.name, score: Number(score), ...(kind === 'ability' ? {projectName,startDate,endDate} : {}) });
    });
    if (!records.length && !errors.length) errors.push('没有填写得分');
    return { records, errors };
  }
  async function readWorkbook(file) {
    if (!file.name.toLowerCase().endsWith('.xlsx')) throw new Error('请选择 .xlsx 文件');
    if (file.size > 5 * 1024 * 1024) throw new Error('文件不能超过 5 MB');
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const sharedFile = zip.file('xl/sharedStrings.xml');
    const strings = sharedFile ? [...parse(await sharedFile.async('string')).getElementsByTagNameNS(ns, 'si')].map(node => [...node.getElementsByTagNameNS(ns, 't')].map(t => t.textContent).join('')) : [];
    const workbook = parse(await zip.file('xl/workbook.xml').async('string'));
    const relationships = parse(await zip.file('xl/_rels/workbook.xml.rels').async('string'));
    const sheets = {};
    for (const entry of workbook.getElementsByTagNameNS(ns, 'sheet')) {
      const id = entry.getAttribute('r:id');
      const target = [...relationships.getElementsByTagName('Relationship')].find(rel => rel.getAttribute('Id') === id)?.getAttribute('Target');
      const path = target?.startsWith('/') ? target.slice(1) : 'xl/' + target;
      const sheet = zip.file(path);
      if (!sheet) throw new Error('未找到数据工作表');
      const rows = [...parse(await sheet.async('string')).getElementsByTagNameNS(ns, 'row')].map(row => {
      const cells = [];
      [...row.getElementsByTagNameNS(ns, 'c')].forEach(cell => {
        const ref = cell.getAttribute('r'), type = cell.getAttribute('t');
        if (!/^[A-Z]+\d+$/.test(ref || '')) return;
        const index = [...ref.match(/^[A-Z]+/)[0]].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
        const value = cell.getElementsByTagNameNS(ns, 'v')[0]?.textContent ?? '';
        cells[index] = type === 's' ? strings[Number(value)] : type === 'inlineStr' ? [...cell.getElementsByTagNameNS(ns, 't')].map(t => t.textContent).join('') : value;
      });
      return { number: Number(row.getAttribute('r')), cells, formula: row.getElementsByTagNameNS(ns, 'f').length > 0 };
    });
      sheets[entry.getAttribute('name')] = rows;
    }
    return sheets;
  }
  function dataRows(rows, config) {
    const normalize = value => String(value ?? '').replace(/\*/g, '').trim();
    const header = rows?.find(row => config.headers.every((name, i) => normalize(row.cells[i]) === normalize(name)) && row.cells.filter(Boolean).length === config.headers.length);
    if (!header) throw new Error('表头不匹配，请使用本页面下载的模板并保留说明和示例行');
    return rows.filter(row => row.number > header.number + (config.sampleRows ?? 1));
  }
  async function read(file, config) {
    const sheets = await readWorkbook(file);
    return dataRows(config.sheetName ? sheets[config.sheetName] : Object.values(sheets)[0], config);
  }
  async function template(config, people) {
    const response = await fetch(templateBase + config.template, { cache: 'no-store' });
    if (!response.ok) throw new Error('模板读取失败');
    const zip = await JSZip.loadAsync(await response.arrayBuffer());
    const doc = parse(await zip.file('xl/worksheets/sheet1.xml').async('string')), data = doc.getElementsByTagNameNS(ns, 'sheetData')[0];
    people.forEach((person, i) => {
      const number = i + 4;
      let row = [...data.children].find(row => Number(row.getAttribute('r')) === number);
      if (!row) { row = doc.createElementNS(ns, 'row'); row.setAttribute('r', String(number)); data.append(row); }
      [person.id, person.name].forEach((value, index) => {
        const ref = String.fromCharCode(65 + index) + number;
        let cell = [...row.children].find(cell => cell.getAttribute('r') === ref);
        if (!cell) { cell = doc.createElementNS(ns, 'c'); cell.setAttribute('r', ref); row.append(cell); }
        cell.replaceChildren();
        cell.setAttribute('t', 'inlineStr');
        const inline = doc.createElementNS(ns, 'is'), text = doc.createElementNS(ns, 't');
        text.textContent = value;
        inline.append(text);
        cell.append(inline);
      });
    });
    zip.file('xl/worksheets/sheet1.xml', new XMLSerializer().serializeToString(doc));
    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function render(target, records, kind) {
    if (!target) return;
    const body = target.querySelector('tbody');
    body.replaceChildren();
    records.forEach(record => {
      const row = document.createElement('tr');
      const values = [record.employeeId, record.name, ...(kind === 'ability' ? [record.projectName,record.startDate,record.endDate] : []), record.score];
      values.forEach(value => { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); });
      body.append(row);
    });
    target.hidden = !records.length;
  }
  async function errorWorkbook(errors) {
    const zip = new JSZip();
    const escape = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const rows = [['行号', '错误说明'], ...errors.map(error => typeof error === 'string' ? ['', error] : [error.row, error.message])];
    const sheet = rows.map((row, i) => `<row r="${i + 1}">${row.map((value, j) => `<c r="${String.fromCharCode(65 + j)}${i + 1}" t="inlineStr"><is><t xml:space="preserve">${escape(value)}</t></is></c>`).join('')}</row>`).join('');
    zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
    zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    zip.file('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="错误说明" sheetId="1" r:id="rId1"/></sheets></workbook>');
    zip.file('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
    zip.file('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheet}</sheetData></worksheet>`);
    return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function showErrors(container, errors) {
    container.replaceChildren();
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'btn btn-secondary'; button.textContent = '下载报错 Excel';
    button.onclick = async () => {
      button.disabled = true;
      try {
        const url = URL.createObjectURL(await errorWorkbook(errors)), link = document.createElement('a');
        link.href = url; link.download = '导入报错.xlsx'; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch { showToast('报错文件生成失败，请重试'); }
      finally { button.disabled = false; }
    };
    container.append(button);
    container.hidden = false;
  }
  window.ReviewScoreImport = {
    validScore, performanceScore, latestScores, validate, read, readWorkbook, dataRows, errorWorkbook, showErrors,
    generateTemplate: (kind, people) => template(configs[kind], people),
    mount(root, personSelector, kind, onImport) {
      const config = configs[kind], input = root.querySelector('[data-score-file]'), status = root.querySelector('[data-score-status]');
      const errorOutput = document.createElement('div'); errorOutput.hidden = true; status.after(errorOutput);
      let records = [], reading = false;
      const people = () => [...document.querySelectorAll(personSelector)].map(row => ({ id: row.cells[1].textContent.trim(), name: row.cells[2].textContent.trim(), department:row.cells[3].textContent.trim(), position:row.cells[4].textContent.trim() }));
      root.querySelector('[data-score-template]').addEventListener('click', async () => {
        const selected = people();
        if (!selected.length) { status.textContent = '请先选择盘点人员'; return; }
        try {
          const blob = await template(config, selected), url = URL.createObjectURL(blob), link = document.createElement('a');
          link.href = url;
          link.download = config.title + '导入模板.xlsx';
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) { status.textContent = error.message; }
      });
      input.addEventListener('change', async () => {
        const file = input.files[0];
        if (!file || reading) return;
        reading = true;
        errorOutput.hidden = true;
        try {
          const result = validate(await read(file, config), people(), kind);
          if (result.errors.length) { status.textContent = `校验未通过，共 ${result.errors.length} 处错误，请下载报错 Excel。`; showErrors(errorOutput, result.errors); return; }
          records = result.records;
          if(kind==='ability'&&onImport){const byId=new Map(people().map(person=>[person.id,person]));onImport(records.map(record=>({...record,department:byId.get(record.employeeId)?.department||'',position:byId.get(record.employeeId)?.position||''})));}
          if (kind === 'performance') {
            const table = document.querySelector('[data-performance-results]');
            render(table, records, kind);
          }
          status.textContent = `已导入 ${records.length} 条${config.title}，覆盖 ${new Set(records.map(record=>record.employeeId)).size} 人。`;
        } catch (error) { status.textContent = '校验未通过，请下载报错 Excel。'; showErrors(errorOutput, [error.message]); }
        finally { input.value = ''; reading = false; }
      });
      return { getRecords: () => records.slice() };
    }
  };
})();
