/* Shared indicator demo vocabulary used by the indicator library and standard pickers. */
(function () {
  const capabilityCategories = [
    {id:'skill', name:'技能', children:[
      {id:'management', name:'管理能力'},
      {id:'general', name:'通用能力'},
      {id:'sales-build', name:'销售能力建设'},
      {id:'professional', name:'专业能力', children:[
        {id:'technology', name:'技术簇'},
        {id:'production', name:'生产簇'},
        {id:'quality', name:'质量簇'},
        {id:'finance', name:'财务簇'},
        {id:'market', name:'市场簇'},
        {id:'service', name:'客服簇'},
        {id:'administration', name:'行政簇'},
        {id:'procurement', name:'采购簇'},
        {id:'hr', name:'人力资源簇'},
        {id:'product', name:'产品簇'},
        {id:'sales', name:'销售簇'},
        {id:'testing', name:'测试'}
      ]},
      {id:'cloud', name:'云端技能', children:[{id:'ecommerce', name:'电商'}]}
    ]},
    {id:'knowledge', name:'知识', children:[
      {id:'industry-knowledge', name:'行业知识'},
      {id:'company-knowledge', name:'公司知识'},
      {id:'professional-knowledge', name:'专业知识'}
    ]},
    {id:'literacy', name:'素养', children:[
      {id:'self-awareness', name:'自我认知'},
      {id:'collaboration', name:'组织协同'},
      {id:'customer-orientation', name:'客户导向'}
    ]},
    {id:'new-product', name:'新品导入与开发', children:[
      {id:'product-planning', name:'产品规划'},
      {id:'pilot-launch', name:'试点推进'}
    ]}
  ];

  const capabilityItems = [
    ['cap-communication','沟通','general','清晰传达、倾听并推动共识'],
    ['cap-problem-analysis','问题分析','general','识别、拆解并厘清复杂问题'],
    ['cap-collaboration','协同推进','general','协调相关方共同完成目标'],
    ['cap-management','团队管理','management','带领团队达成目标并持续提升'],
    ['cap-coaching','辅导下属','management','通过反馈、示范和授权促进成长'],
    ['cap-sales-strategy','销售策略制定','sales-build','基于市场和客户洞察制定销售策略'],
    ['cap-business-negotiation','商务谈判','sales-build','围绕目标、价值和风险推进谈判'],
    ['cap-solution-design','解决方案设计','technology','理解业务需求并形成可落地方案'],
    ['cap-system-architecture','系统架构','technology','完成系统设计与关键技术决策'],
    ['cap-technical-selection','技术选型','technology','比较技术方案并做出合理决策'],
    ['cap-data-analysis','数据分析','technology','从数据中识别规律并支持判断'],
    ['cap-production-planning','生产计划','production','组织生产资源并保障交付节奏'],
    ['cap-quality-control','质量管理','quality','识别质量风险并建立改进机制'],
    ['cap-cost-management','成本管理','finance','识别成本结构并推动成本优化'],
    ['cap-market-insight','市场洞察','market','跟踪行业趋势、竞品和客户变化'],
    ['cap-customer-service','客户服务','service','理解客户诉求并持续改善服务体验'],
    ['cap-process-optimization','流程优化','administration','梳理流程并降低协作成本'],
    ['cap-supplier-management','供应商管理','procurement','建立供应商协作与评价机制'],
    ['cap-talent-development','人才发展','hr','识别人才需求并推动培养落地'],
    ['cap-product-planning','产品规划','product','定义产品方向、范围和阶段目标'],
    ['cap-sales-management','销售管理','sales','管理销售过程、目标和资源配置'],
    ['cap-test-design','测试设计','testing','设计测试策略并保障交付质量'],
    ['cap-ecommerce-operation','电商运营','ecommerce','规划电商渠道运营和转化提升'],
    ['cap-industry-knowledge','行业知识应用','industry-knowledge','理解行业生态、趋势与关键参与者'],
    ['cap-company-knowledge','公司知识应用','company-knowledge','理解公司业务、产品与经营规则'],
    ['cap-professional-knowledge','专业知识整合','professional-knowledge','将专业知识应用于实际业务判断'],
    ['cap-self-awareness','自我认知','self-awareness','理解自身优势、边界与发展方向'],
    ['cap-organizational-collaboration','组织协同','collaboration','在组织内建立有效协作关系'],
    ['cap-customer-orientation','客户导向','customer-orientation','持续从客户价值出发做出判断'],
    ['cap-product-launch','新品导入','product-planning','推动新品从规划到市场验证'],
    ['cap-pilot-promotion','试点推进','pilot-launch','组织试点、验证并沉淀推广经验']
  ].map(([id, name, categoryId, description]) => ({id, name, categoryId, description}));

  const traitCategories = {
    pow: [
      {id:'achievement', name:'成就与发展'},
      {id:'relationship', name:'关系与利他'},
      {id:'value', name:'价值与意义'},
      {id:'security', name:'安全与平衡'}
    ],
    pot: [
      {id:'thinking', name:'思维方式'},
      {id:'interaction', name:'人际互动'},
      {id:'emotion', name:'自我情绪'}
    ]
  };
  const traitItems = {
    pow: [
      ['pow-achievement','成就导向','achievement','追求把事情做成并达成可衡量的成果'],
      ['pow-challenge','挑战难度','achievement','愿意承担有难度、有挑战的目标'],
      ['pow-growth','持续成长','achievement','持续学习并追求能力与成果提升'],
      ['pow-influence','影响他人','relationship','通过影响和带动他人实现共同目标'],
      ['pow-collaboration','协作共赢','relationship','重视合作关系与共同成果'],
      ['pow-belonging','稳定归属','relationship','在稳定关系和团队中持续投入'],
      ['pow-value','价值认同','value','追求工作与个人价值观保持一致'],
      ['pow-autonomy','自主独立','value','重视自主判断和掌控工作方式'],
      ['pow-power','掌控权力','value','愿意承担决策责任并影响关键结果'],
      ['pow-security','稳定安全','security','重视稳定预期、秩序和风险可控'],
      ['pow-balance','工作平衡','security','关注工作投入与个人生活的平衡']
    ],
    pot: [
      ['pot-strategy','战略思维','thinking','能够从全局和长期视角理解问题'],
      ['pot-learning','学习敏锐','thinking','快速吸收新信息并迁移到新场景'],
      ['pot-complexity','复杂决策','thinking','在不确定和复杂情境下形成判断'],
      ['pot-change','变革推动','interaction','推动团队接受变化并形成行动'],
      ['pot-cross-boundary','跨界整合','interaction','连接不同专业和资源形成新方案'],
      ['pot-resilience','坚韧抗压','emotion','在压力和挫折中保持稳定并持续推进'],
      ['pot-empathy','情绪感知','emotion','识别自身与他人情绪并调整互动方式']
    ]
  };
  Object.keys(traitItems).forEach(key => {
    traitItems[key] = traitItems[key].map(([id, name, categoryId, description]) => ({id, name, categoryId, description}));
  });

  window.IndicatorDemo = {
    categories: capabilityCategories,
    items: {cap: capabilityItems, pow: traitItems.pow, pot: traitItems.pot},
    traitCategories
  };
})();
