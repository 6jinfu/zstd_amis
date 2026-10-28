const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'../app');
const source=fs.readFileSync(path.join(root,'navigation.js'),'utf8');
function render(module,page,hash='',base='http://172.21.1.14:8766/navigation.js?v=current') {
  let html='',click;
  const attributes={},classes=new Set();
  const label={textContent:''};
  const toggle={addEventListener:(type,handler)=>{click=handler;},setAttribute:(key,value)=>{attributes[key]=value;},querySelector:()=>label};
  const app={insertAdjacentHTML:(position,value)=>{html=value;},querySelector:()=>toggle,classList:{toggle:key=>{if(classes.has(key)){classes.delete(key);return false;}classes.add(key);return true;}}};
  vm.runInNewContext(source,{URL,location:{hash},document:{body:{dataset:{module,page}},currentScript:{src:base,parentElement:app}}});
  return {html,click:()=>click(),attributes,label};
}

test('五个中心均直接生成新版导航，活动菜单正确且没有旧结构',()=>{
  const cases=[['standard','positions','人才标准'],['assess','review-projects','人才盘点'],['develop','position-map','岗位地图'],['talent','talent-pool','人才池'],['settings','settings','职级管理']];
  for(const [module,page,title] of cases) {
    const {html}=render(module,page);
    assert.ok(!/nav-main|nav-item/.test(html));
    assert.equal((html.match(/id="primary-navigation"/g)||[]).length,1);
    assert.match(html,new RegExp('class="business-item active"[^>]*>'+title+'<'));
    assert.ok(html.includes('class="mobile-primary-nav"'));
    assert.ok(html.includes('http://172.21.1.14:8766/standards.html'));
  }
});

test('设置页保留分区切换契约，首次直达功能设置正确选中',()=>{
  const {html}=render('settings','settings','#learner');
  assert.ok(html.includes('data-anchor-tabs data-default="level"'));
  assert.match(html,/class="business-item active" data-tab="learner" href="#learner"/);
});

test('导航路径从脚本位置解析，嵌套原型及文件预览不拼错目录',()=>{
  const {html}=render('assess','review-projects','','file:///project/app/navigation.js?v=current');
  assert.ok(html.includes('href="file:///project/app/review-projects.html"'));
});

test('导航折叠状态与按钮语义一起更新',()=>{
  const result=render('talent','talent-pool');
  result.click();assert.equal(result.attributes['aria-expanded'],'false');assert.equal(result.label.textContent,'展开导航');
  result.click();assert.equal(result.attributes['aria-expanded'],'true');assert.equal(result.label.textContent,'收起导航');
});

test('全部32个入口在主内容前同步加载唯一新版导航，旧转换代码和隐藏补丁已删除',()=>{
  const files=fs.readdirSync(root,{recursive:true}).filter(file=>file.endsWith('.html'));
  const pages=files.map(file=>fs.readFileSync(path.join(root,file),'utf8')).filter(html=>/src="[^"]*navigation\.js/.test(html));
  assert.equal(pages.length,32);
  for(const html of pages) {
    assert.ok(html.includes('class="app shell-v2"'));
    assert.ok(!html.includes('nav-main'));
    assert.ok(html.indexOf('navigation.js')<html.indexOf('<main'));
    assert.equal((html.match(/<script src="[^"]*navigation\.js/g)||[]).length,1);
    assert.ok(!/<script[^>]+(?:defer|async)[^>]+navigation\.js/.test(html));
  }
  const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  assert.ok(!/applyReleaseScope|initShellNavigation|nav-main|nav-item/.test(app));
  assert.ok(!fs.readFileSync(path.join(root,'talent-center.css'),'utf8').includes('.app:not(.shell-v2)'));
});

test('共享及人才页不再混用跨文档过渡开关',()=>{
  for(const name of ['styles.css','talent-center.css']) {
    assert.ok(!/view-transition|page-shell-enter/.test(fs.readFileSync(path.join(root,name),'utf8')),name);
  }
});
