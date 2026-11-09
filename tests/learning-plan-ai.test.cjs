const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../app/learning-plan-ai.js'),'utf8'),context);
const {parseTitles,abilityNames,targetGroup,unmatchedAbilities,autoAssociate} = context.window.LearningPlanAI;
const plain = value => JSON.parse(JSON.stringify(value));

test('学习分组名称、数量和顺序来自本次对话，不预设三个阶段',() => {
  assert.deepEqual(plain(parseTitles('分为需求访谈、价值验证')),['需求访谈','价值验证']);
  assert.deepEqual(plain(parseTitles('分成四个阶段：准备、试做、独立交付、分享')),['准备','试做','独立交付','分享']);
  assert.deepEqual(plain(parseTitles('先认识客户\n再验证方案\n共同推进交付')),['先认识客户','再验证方案','共同推进交付']);
});
test('只给数量或泛泛需求时追问名称，不补造阶段',() => {
  assert.deepEqual(plain(parseTitles('分成三个阶段')),[]);
  assert.deepEqual(plain(parseTitles('帮我设计一份学习方案')),[]);
});
test('关联能力限定来源标准，混合未知词条不能静默部分采用',() => {
  const names = ['算法设计','模型工程','特征工程'];
  assert.deepEqual(plain(abilityNames('关联模型工程、特征工程',names)),['模型工程','特征工程']);
  assert.deepEqual(plain(abilityNames('领导力',names)),[]);
  assert.deepEqual(plain(unmatchedAbilities('算法设计、领导力',names)),['领导力']);
  assert.deepEqual(plain(abilityNames('全部能力',names)),names);
  assert.deepEqual(plain(abilityNames('第一组关联全部能力',names)),names);
});
test('分组可按实际名称或任意数字序号定位，重名片段优先最长名称',() => {
  const groups = Array.from({length:12},(_,i) => ({title:'专题'+(i+1)}));
  assert.equal(targetGroup('第12组关联算法设计',groups),11);
  assert.equal(targetGroup('第13组',groups),-1);
  assert.equal(targetGroup('把基础学习改为准备', [{title:'基础'},{title:'基础学习'}]),1);
});
test('分组确认后批量匹配来源能力，不随机分配或补造词条',() => {
  const abilities = [['算法设计','L4'],['模型工程','L4'],['特征工程','L3'],['编程能力','L4'],['业务理解','L3']];
  const groups = ['基础学习','岗位实践','复盘分享','其他专题'].map(title => ({title,capabilities:[],activities:[]}));
  const result = plain(autoAssociate(groups,abilities));
  assert.deepEqual(result[0].capabilities,['算法设计','特征工程','业务理解']);
  assert.deepEqual(result[1].capabilities,['算法设计','模型工程','特征工程','编程能力']);
  assert.deepEqual(result[2].capabilities,['业务理解']);
  assert.deepEqual(result[3].capabilities,[]);
  assert.deepEqual(result.map(group => group.title),groups.map(group => group.title));
  assert.deepEqual(groups[0].capabilities,[]);
});
test('自动匹配保留手工调整及明确清空，只保留来源标准中的能力',() => {
  const groups = [{title:'基础学习',capabilities:['模型工程','领导力'],confirmed:true},{title:'岗位实践',capabilities:[],confirmed:true}];
  const result = plain(autoAssociate(groups,[['算法设计','L4'],['模型工程','L4']]));
  assert.deepEqual(result[0].capabilities,['模型工程']);
  assert.deepEqual(result[1].capabilities,[]);
});
