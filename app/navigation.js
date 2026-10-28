/* Shared current navigation, rendered before the page body is parsed. */
(function () {
  const app=document.currentScript.parentElement;
  const base=document.currentScript.src;
  const module=document.body.dataset.module;
  const page=document.body.dataset.page==='positions'?'standards':document.body.dataset.page;
  const icons={
  standard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  assess: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5h6"/><path d="M9 3h6a2 2 0 0 1 2 2v1h2a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2V5a2 2 0 0 1 2-2Z"/><path d="m8 14 2.5 2.5L16 11"/></svg>',
  develop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M3 19h18"/><path d="m4 9 6-4 6 7 4-4"/></svg>',
  talent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2"/><path d="M16 15a5 5 0 0 1 5 5"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>'
};
  const primary=[['standard','standards.html','人才标准'],['assess','assess-projects.html','评鉴中心'],['develop','position-map.html','发展中心'],['talent','talent-list.html','人才中心'],['settings','settings.html','系统设置']];
  const menus={
    standard:[['org-structure','org-structure.html','组织结构'],['key-position','key-position.html','关键岗位分析'],['standards','standards.html','人才标准'],['vocabulary','vocabulary.html','指标库']],
    assess:[['assess-projects','assess-projects.html','评鉴工具'],['review-projects','review-projects.html','人才盘点']],
    develop:[['position-map','position-map.html','岗位地图']],
    talent:[['talent-list','talent-list.html','人才库'],['talent-pool','talent-pool.html','人才池'],['talent-dashboard','talent-dashboard.html','人才看板']],
    settings:[['level','#level','职级管理'],['dimensions','#dimensions','岗位标准维度'],['learner','#learner','功能设置']]
  };
  const href=value=>value.startsWith('#')?value:new URL(value,base).href;
  const primaryLinks=primary.map(([id,url,label])=>`<a class="primary-item${id===module?' active':''}" data-module="${id}" href="${href(url)}" aria-label="${label}" title="${label}" ${id===module?'aria-current="page"':''}>${icons[id]}<span>${label}</span></a>`).join('');
  const businessLinks=(menus[module]||[]).map(([id,url,label])=>{
    const active=module==='settings'?id===(location.hash.slice(1)||'level'):id===page;
    return `<a class="business-item${active?' active':''}" ${module==='settings'?'data-tab':'data-page'}="${id}" href="${href(url)}" ${active?'aria-current="page"':''}>${label}</a>`;
  }).join('');
  const brand=`<div class="brand"><span class="logo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 18l5-11 4 7 7-4"/></svg></span><span class="name">人才发展</span></div>`;
  app.insertAdjacentHTML('afterbegin',`<header class="topbar">${brand.replace('class="brand"','class="brand mobile-brand"')}<nav class="mobile-primary-nav" aria-label="一级导航">${primaryLinks}</nav><nav class="business-nav" aria-label="业务菜单" ${module==='settings'?'data-anchor-tabs data-default="level"':''}>${businessLinks}</nav><div class="right"><button class="icon-btn" type="button" aria-label="查看通知"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg><span class="dot"></span></button><div class="user"><span class="avatar">李</span><span class="uname">李文静</span></div></div></header><aside class="sidenav">${brand}<nav class="primary-nav" id="primary-navigation" aria-label="一级导航">${primaryLinks}</nav><button type="button" class="nav-collapse-toggle" aria-controls="primary-navigation" aria-expanded="true" aria-label="收起导航" title="收起导航"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg><span>收起导航</span></button></aside>`);
  const toggle=app.querySelector('.nav-collapse-toggle');
  toggle.addEventListener('click',()=>{
    const collapsed=app.classList.toggle('nav-collapsed');
    const label=collapsed?'展开导航':'收起导航';
    toggle.setAttribute('aria-expanded',String(!collapsed));
    toggle.setAttribute('aria-label',label);
    toggle.title=label;toggle.querySelector('span').textContent=label;
  });
})();
