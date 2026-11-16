(function () {
  function open({ title, template, headers, read, validate, save }) {
    let records = [], busy = false;
    const e = UI.escape;
    const dialog = UI.openDialog({ title, confirmLabel: '确认导入', body: `
      <section class="tai-step"><h4>第一步：下载模板并填写</h4><a class="btn btn-secondary" href="templates/${e(template)}" download>下载导入模板</a></section>
      <section class="tai-step"><h4>第二步：上传文件</h4><p>支持 .xlsx，不超过 5 MB，每次最多 2000 条。校验通过后，确认导入才保存。</p><button class="btn btn-primary" type="button" data-import-upload>上传文件</button><input type="file" accept=".xlsx" data-import-file hidden><p data-import-status role="status">尚未选择文件</p></section><section data-import-result hidden></section>`, onConfirm(d) {
        if (busy || !records.length) return false;
        try { save(records); } catch (error) { d.showError(error.message || '保存失败，请重试'); return false; }
        showToast('导入成功');
        location.reload();
      }
    });
    dialog.classList.add('talent-ability-import');
    const input=dialog.querySelector('[data-import-file]'), upload=dialog.querySelector('[data-import-upload]'), confirm=dialog.querySelector('[data-confirm]'), status=dialog.querySelector('[data-import-status]'), result=dialog.querySelector('[data-import-result]');
    confirm.disabled=true;
    upload.onclick=()=>input.click();
    input.onchange=async()=>{
      const file=input.files[0];if(!file||busy)return;
      busy=true;records=[];confirm.disabled=true;upload.disabled=true;result.hidden=true;dialog.showError('');status.textContent='正在校验：'+file.name;
      try {
        const checked=validate(await read(file));
        if(!dialog.isConnected)return;
        if(checked.errors.length){
          status.textContent=`校验未通过，共 ${checked.errors.length} 处错误，未导入任何数据。`;
          result.innerHTML='<ul>'+checked.errors.slice(0,100).map(error=>`<li>${e(error)}</li>`).join('')+'</ul>';
        }else{
          records=checked.records;status.textContent=`校验通过，共 ${records.length} 项。确认后保存。`;
          result.innerHTML=`<div class="table-wrap"><table class="t"><thead><tr>${headers.map(name=>`<th>${e(name)}</th>`).join('')}</tr></thead><tbody>${records.slice(0,20).map(record=>`<tr>${record.preview.map(value=>`<td>${e(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
          confirm.disabled=false;
        }
        result.hidden=false;
      }catch(error){status.textContent='无法导入：'+error.message;}
      finally{busy=false;upload.disabled=false;input.value='';}
    };
  }
  window.ImportDialog={open};
})();
