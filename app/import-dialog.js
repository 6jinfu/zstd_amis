(function () {
  function open({ title, template, read, validate, save }) {
    let busy = false;
    const e = UI.escape;
    const dialog = UI.openDialog({ title, confirmLabel: '关闭', cancelLabel: '', body: `
      <section class="tai-step"><h4>第一步：下载模板并填写</h4><a class="btn btn-secondary" href="templates/${e(template)}" download>下载导入模板</a></section>
      <section class="tai-step"><h4>第二步：上传文件</h4><p>支持 .xlsx，不超过 5 MB，每次最多 2000 条。上传后自动校验，存在问题可下载报错 Excel。</p><button class="btn btn-primary" type="button" data-import-upload>上传文件</button><input type="file" accept=".xlsx" data-import-file hidden><p data-import-status role="status">尚未选择文件</p></section><section data-import-result hidden></section>` });
    dialog.classList.add('talent-ability-import');
    const input=dialog.querySelector('[data-import-file]'), upload=dialog.querySelector('[data-import-upload]'), status=dialog.querySelector('[data-import-status]'), result=dialog.querySelector('[data-import-result]');
    upload.onclick=()=>input.click();
    input.onchange=async()=>{
      const file=input.files[0];if(!file||busy)return;
      busy=true;upload.disabled=true;result.hidden=true;dialog.showError('');status.textContent='正在校验：'+file.name;
      try {
        const checked=validate(await read(file));
        if(!dialog.isConnected)return;
        if(checked.errors.length){
          status.textContent=`校验未通过，共 ${checked.errors.length} 处错误，请下载报错 Excel。`;
          ReviewScoreImport.showErrors(result,checked.errors);
        }else{
          save(checked.records);
          status.textContent=`导入成功，共 ${checked.records.length} 项。`;
          showToast('导入成功');
          location.reload();
        }
      }catch(error){status.textContent='导入未完成，请下载报错 Excel。';ReviewScoreImport.showErrors(result,[error.message||'文件处理失败']);}
      finally{busy=false;upload.disabled=false;input.value='';}
    };
  }
  window.ImportDialog={open};
})();
