(function(){
  function mountOverview(){
    var matrix=document.getElementById('review-grid-matrix');
    var analysis=document.querySelector('.review-grid-analysis');
    if(!matrix||!analysis||document.querySelector('.proto-overview'))return;
    var cells=Array.from(matrix.querySelectorAll('.cell'));
    var abilityCount=Math.max(1,...cells.map(function(cell){return Number(cell.dataset.abilityIndex)+1}));
    var coreAndKey=cells.filter(function(cell){return Number(cell.dataset.performanceIndex)===2&&Number(cell.dataset.abilityIndex)>=abilityCount-2}).reduce(function(total,cell){return total+Number(cell.dataset.count)},0);
    var risk=cells.filter(function(cell){return Number(cell.dataset.performanceIndex)===0&&Number(cell.dataset.abilityIndex)===0}).reduce(function(total,cell){return total+Number(cell.dataset.count)},0);
    var calibrationTasks=document.querySelectorAll('#calibration-table tbody tr').length;
    var overview=document.createElement('div');overview.className='proto-overview';overview.setAttribute('aria-label','盘点摘要');
    [
      {label:'核心及关键人才',value:coreAndKey,tone:'primary'},
      {label:'重点关注',value:risk,tone:'risk'},
      {label:'校准记录',value:calibrationTasks,tone:'neutral'}
    ].forEach(function(item){
      var card=document.createElement('div');card.className='proto-overview-card';card.dataset.tone=item.tone;
      var label=document.createElement('span');label.className='proto-overview-label';label.textContent=item.label;
      var value=document.createElement('strong');value.className='proto-overview-value';value.textContent=String(item.value);
      card.append(label,value);overview.appendChild(card);
    });
    analysis.parentNode.insertBefore(overview,analysis);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountOverview,{once:true});else mountOverview();
})();
