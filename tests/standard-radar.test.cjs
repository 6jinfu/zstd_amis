const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../app/standard-ui.js'),'utf8');
const context=vm.createContext({e:value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')});
vm.runInContext(source.slice(source.indexOf('  function capabilityRadar'),source.indexOf('  function preview(s)')),context);
const radar=context.capabilityRadar;
const points=html=>html.match(/class="std-radar-area" points="([^"]+)"/)[1].split(' ').map(pair=>pair.split(',').map(Number));
test('五级刻度、能力名称和实际等级进入同一张雷达，修改等级只改变对应顶点',()=>{
  const items=[['算法设计','L4'],['模型工程','L4'],['特征工程','L3'],['编程能力','L4'],['业务理解','L3']];
  const before=JSON.stringify(items),first=radar(items,'算法能力雷达图');
  assert.equal((first.match(/class="std-radar-ring"/g)||[]).length,5);
  assert.equal((first.match(/class="std-radar-axis"/g)||[]).length,5);
  assert.ok(first.includes('算法设计 L4；模型工程 L4；特征工程 L3'));
  assert.equal(points(first)[0][1],76.4);
  const edited=items.map(item=>[...item]);edited[0][1]='L5';
  const second=points(radar(edited,'算法能力雷达图'));
  assert.equal(second[0][1],60);assert.deepEqual(second.slice(1),points(first).slice(1));
  assert.equal(JSON.stringify(items),before);
});
test('零至两项保留实际列表，不补造雷达维度',()=>{
  for(const items of [[],[['能力A','L3']],[['能力A','L3'],['能力B','L5']]]){
    const html=radar(items,'要求');assert.equal(html.includes('<svg'),false);assert.equal((html.match(/<li>/g)||[]).length,items.length||1);
  }
});
test('20项或长名称使用编号轴和完整图例，图文内容转义且坐标有效',()=>{
  const items=Array.from({length:20},(_,i)=>['专业能力'+i,'L'+(i%5+1)]);
  const html=radar(items,'标准要求');
  assert.equal((html.match(/<li>/g)||[]).length,20);assert.equal(points(html).length,20);
  assert.ok(points(html).flat().every(Number.isFinite));assert.ok(html.includes('std-radar-legend'));
  const long=radar([['复杂业务跨团队协同与落地交付能力','L4'],['<能力&名称>','L3'],['模型工程','L2']],'A<B');
  assert.ok(long.includes('std-radar-legend'));assert.ok(long.includes('&lt;能力&amp;名称&gt;'));assert.ok(long.includes('A&lt;B'));assert.equal(long.includes('<能力'),false);
});
