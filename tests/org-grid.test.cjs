const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../app/app.js'),'utf8');
const storage=new Map();
const context={window:{},localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)}};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('const ORG_GRID_DRAFT_KEY'),source.indexOf('function renderOrgMatrix')),context);

test('首次默认5×5，已有版本和用户选择仍沿用自身规格',()=>{
  assert.equal(context.readOrgGridConfig('active').sequenceCount,5);
  assert.equal(context.readOrgGridConfig('active').levelCount,5);
  context.writeOrgGridConfig('active',{sequenceCount:3,levelCount:2});
  assert.equal(context.readOrgGridConfig('active').sequenceCount,3);
  assert.equal(context.readOrgGridConfig('active').levelCount,2);
  storage.clear();
});

test('5×5的岗位和人数由明细汇总，22个岗位族、3个空格、34岗位165人',()=>{
  const cells=context.orgGridCells({sequenceCount:5,levelCount:5});
  assert.equal(cells.length,25);
  assert.equal(cells.filter(Boolean).length,22);
  assert.equal(cells.filter(cell=>!cell).length,3);
  const names=new Set();
  for(const cell of cells.filter(Boolean)) {
    assert.equal(cell.jobs,cell.positions.length);
    assert.equal(cell.people,cell.positions.reduce((sum,position)=>sum+position[1],0));
    for(const [name,people,score] of cell.positions) {
      assert.ok(!names.has(name),name); names.add(name);
      assert.ok(Number.isInteger(people)&&people>0,name);
      assert.ok(score>=1&&score<=5,name);
    }
  }
  assert.equal(names.size,34);
  assert.equal(cells.reduce((sum,cell)=>sum+(cell?.people||0),0),165);
  assert.equal(cells.slice(0,5).reduce((sum,cell)=>sum+(cell?.people||0),0),3);
});

test('1–5各规格保留34岗位165人的总量及既有3×3样例',()=>{
  for(let sequenceCount=1;sequenceCount<=5;sequenceCount++) {
    for(let levelCount=1;levelCount<=5;levelCount++) {
      const cells=context.orgGridCells({sequenceCount,levelCount});
      assert.equal(cells.length,sequenceCount*levelCount);
      assert.equal(cells.reduce((sum,cell)=>sum+(cell?.jobs||0),0),34);
      assert.equal(cells.reduce((sum,cell)=>sum+(cell?.people||0),0),165);
    }
  }
  const legacy=context.orgGridCells({sequenceCount:3,levelCount:3});
  assert.equal(legacy[3].jobs,7);
  assert.equal(legacy[3].people,36);
  assert.equal(legacy[2],null);
});

test('确认生效保存规格及就绪状态，普通访问不会凭空产生结果',()=>{
  const init=source.slice(source.indexOf('function initApp()'),source.indexOf('// 底部脚本立即初始化'));
  for(const name of init.matchAll(/^  ([a-zA-Z]+)\(\);/gm)) context[name[1]]=()=>{};
  context.URLSearchParams=URLSearchParams;
  context.document={body:{dataset:{page:'org-structure'}},querySelectorAll:()=>[]};
  context.location={search:''};
  vm.runInContext(init,context);
  context.initApp();
  assert.equal(storage.get('talent-org-analysis-ready-v5'),undefined);
  context.writeOrgGridConfig('draft',{sequenceCount:5,levelCount:5});
  context.location.search='?effective=1';
  context.initApp();
  assert.equal(storage.get('talent-org-analysis-ready-v5'),'true');
  assert.equal(context.readOrgGridConfig('active').sequenceCount,5);
  assert.equal(context.readOrgGridConfig('active').levelCount,5);
  storage.clear();
});
