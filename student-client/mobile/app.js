(async function () {
  const require = window.originalRequire;
  const fixtures = await (await fetch('data.json')).json();
  const assets = await (await fetch('assets.json')).json();
  const Vue = require('2b0e').default;
  Vue.config.productionTip = false;
  Vue.config.devtools = false;
  Vue.use(require('b970').a);
  const dialog = require('2241').a;
  const toast = require('d399').a;
  dialog.setDefaultOptions({ confirmButtonText: '确认', cancelButtonText: '取消' });
  Vue.prototype.$t = value => value;
  Vue.prototype.$openApp = () => {};
  function requestKey(method, url, data = {}) {
    const u = new URL(url, location.href);
    const params = { ...Object.fromEntries(u.searchParams), ...data };
    return `${method} ${u.pathname} ${JSON.stringify(Object.fromEntries(Object.entries(params).sort(([a], [b]) => a.localeCompare(b))))}`;
  }
  function localize(value) {
    if (typeof value === 'string') return assets[value] || value;
    if (Array.isArray(value)) return value.map(localize);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, localize(v)]));
    return value;
  }
  async function query(method, url, data) {
    const k = requestKey(method, url, data);
    if (!fixtures[k]) {
      console.error('Uncaptured original query:', k);
      dialog.alert({ message: '该查询尚未采集到原站数据，不生成模拟内容。' });
      throw new Error('Uncaptured original query: ' + k);
    }
    return localize(JSON.parse(JSON.stringify(fixtures[k])));
  }
  const client = {
    get: (url, config) => query('GET', url, config?.params),
    post: (url, data) => query('POST', url, data),
  };
  const formClient = { post: async (url, data) => ({ data: await query('POST', url, data) }) };
  require.m['1b69'] = (module, exports) => Object.assign(exports, { a: client, b: client, c: client, d: formClient });
  require.m['79fa'] = (module, exports) => { exports.a = value => value; };
  require.m['2b27'] = module => { module.exports = window.$cookies; };
  const MapPage = require('f6c8').default;
  const DetailPage = require('c402').default;
  const AbilityPage = require('a97f').default;
  const SkillsPage = require('3f82').default;
  const radar = DetailPage.components.postbase.components.radarCard;
  const originalDraw = radar.methods.initPositionRadarCharts;
  radar.methods.initPositionRadarCharts = function (first, selected) {
    if (!this.positionRadarList.length) return;
    return originalDraw.call(this, first, selected);
  };
  const requirementSnapshots = new Map();
  for (const [key, response] of Object.entries(fixtures)) {
    const match = key.match(/^POST \/uc\/html\/h5\/position\/(findPositionBaseInfo|findPostQualification|positionSkillsRadarData)\.do (.+)$/);
    if (!match) continue;
    const {positionId} = JSON.parse(match[2]);
    if (!requirementSnapshots.has(positionId)) requirementSnapshots.set(positionId, {});
    requirementSnapshots.get(positionId)[match[1]] = response.bizResult;
  }
  const requirementSelections = new Map();
  const PositionDetail = {
    name: 'postSys',
    data() {
      const {id, title} = this.$route.params;
      const snapshot = requirementSnapshots.get(id) || {};
      const base = snapshot.findPositionBaseInfo || {}, detail = base.positionDetail || {};
      const qualifications = snapshot.findPostQualification?.userDescListVO || {};
      const abilities = ['skillRel','qualityRel','knowledgeRel'].flatMap(key => qualifications[key] || []);
      const definitions = Object.fromEntries(abilities.map(item => [item.qualityName, {definition:item.definition, description:item.needDescription}]));
      const standards = base.standards || LearnerRequirementsData.forPosition(id) || [LearnerRequirements.fromLegacy({
        id, name:title,
        education:detail.academicRestrictionName, experience:detail.professionalExperience, duty:detail.positionDuty,
        abilities:abilities.map(item => ({name:item.qualityName, level:item.needLevel})),
        radars:(snapshot.positionSkillsRadarData || []).map(group => ({items:group.skillsRadarList.map(item => ({name:item.skillName, required:item.skillRequiredLevel}))}))
      }, definitions)];
      return {positionId:id, title, standards, selected:requirementSelections.get(id) || standards[0]?.id || '', tab:0, filter:'all'};
    },
    render(h) {
      const standard = this.standards.find(item => item.id === this.selected) || this.standards[0];
      return h('div', {class:'local-position-detail standard-view'}, [
        h('header', {
          class:'position-standard-context',
          domProps:{innerHTML:`<h1>${LearnerRequirements.escape(this.title)}</h1><div class="position-standard-info">` + (standard ? LearnerRequirements.selector(this.standards,standard.id) : '<p>暂无可用人才标准</p>') + '</div>'},
          on:{change:event => {
            if (!event.target.matches('[data-requirement-standard]')) return;
            this.selected = event.target.value;
            this.filter = 'all';
            requirementSelections.set(this.positionId,this.selected);
            this.$nextTick(() => this.$el.querySelector('select').focus());
          }}
        }),
        h('nav', {class:'standard-detail-tabs',attrs:{'aria-label':'标准内容'}}, ['岗位要求','学习方案'].map((label,index) => h('button', {
          attrs:{type:'button','aria-pressed':this.tab === index},
          on:{click:() => {this.tab = index;}}
        }, label))),
        h('div', {
          class:this.tab === 0 ? 'learner-requirements' : 'standard-learning-plan',
          domProps:{innerHTML:standard ? (this.tab === 0 ? LearnerRequirements.render(standard) : LearnerRequirements.renderPlan(standard,this.filter,'../')) : '<p>暂无可用内容</p>'},
          on:{click:event => {
            const filter = event.target.closest('[data-plan-filter]');
            if (filter) this.filter = filter.dataset.planFilter;
          }}
        })
      ]);
    }
  };
  // The source opens independent LMS applications; local navigation never submits study or exam records.
  function resource(type, record) {
    let url;
    if (type === 'course') url = `https://v4.21tb.com/courseCenter/#/course/detail/${record.courseStandard}/${record.courseId}?type=h5_new&showPalette=false`;
    else if (type === 'exam') url = `https://v4.21tb.com/wxExam/#/details/${record.examId}`;
    else if (type === 'project') url = `https://v4.21tb.com/mix-h5/#/studentDetail?id=${record.id}&projectType=MIX_MAP&showMode=${record.showMode}`;
    else url = `https://v4.21tb.com/idp-h5/#/detail?id=${record.idpProjectId}&activeType=${record.status === 'ENABLE' ? 'TASK' : 'REPORT'}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  const program = DetailPage.components.program;
  program.methods.toCourseDetail = record => resource('course', record);
  program.methods.toExamDetail = record => resource('exam', record);
  program.methods.toFaceDetail = record => resource('project', record);
  program.methods.toIdpDetail = record => resource('idp', record);
  program.methods.startIdp = program.methods.stopIdp = () => dialog.alert({ message: '本地只读复刻不会变更原站个人发展计划状态。' });
  DetailPage.components.examCard.methods.toExamDetail = record => resource('exam', record);
  function readRoute() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    const name = parts[0] || 'jobSysH5';
    if (name === 'postSys') return { name, params: { id: parts[1], title: parts[2], type: parts[3] } };
    if (name === 'baseInfo') return { name, params: { id: parts[1], title: parts[2], quality: parts[3] } };
    if (name === 'skill') return { name, params: { id: parts[1], title: parts[2], needLevel: parts[3] } };
    return { name: 'jobSysH5', params: {} };
  }
  const state = Vue.observable({ route: readRoute() });
  let returnMapType = null;
  const mapPage = () => app.$children.find(child => child.$options.name === 'jobSysH5');
  const router = {
    push({ name, params = {} }) {
      if (state.route.name === 'jobSysH5') {
        const map = app.$children[0];
        if (map?.showPopup) map.showPopup = false;
      }
      const fields = name === 'postSys' ? [params.id, params.title, params.type] : name === 'baseInfo' ? [params.id, params.title, params.quality] : name === 'skill' ? [params.id, params.title, params.needLevel] : [];
      location.hash = '/' + [name, ...fields].map(encodeURIComponent).join('/');
    },
    go: step => history.go(step),
  };
  Object.defineProperty(Vue.prototype, '$route', { get: () => state.route });
  Object.defineProperty(Vue.prototype, '$router', { get: () => router });
  const pages = { jobSysH5: MapPage, postSys: DetailPage, baseInfo: AbilityPage, skill: SkillsPage };
  const app = new Vue({
    el: '#app',
    render(h) {
      const backToMap = state.route.name === 'postSys' ? h('div', { class: 'local-detail-return' }, [h('button', {
        attrs: { type: 'button' },
        on: { click: () => {
          returnMapType = state.route.params.type;
          router.push({ name: 'jobSysH5' });
        } },
      }, `‹ 返回${state.route.params.type === 'rank' ? '职级' : '岗位'}地图`)]) : null;
      return h('div', { attrs: { id: 'app' } }, [backToMap, h('keep-alive', { props: { include: 'jobSysH5,postSys' } }, [h(state.route.name === 'postSys' && state.route.params.type === 'position' ? PositionDetail : pages[state.route.name], { key: state.route.name + (state.route.params.id || ''), class: 'router-view' })])]);
    },
  });
  addEventListener('hashchange', () => {
    state.route = readRoute();
    document.title = state.route.params.title || '人才发展';
    window.scrollTo(0, 0);
    if (state.route.name === 'jobSysH5' && returnMapType) {
      const type = returnMapType;
      returnMapType = null;
      Vue.nextTick(() => {
        const map = mapPage();
        if (map && map.navType !== type) map.changeTopNav(type);
      });
    }
  });
  addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      dialog.close();
      const map = app.$children[0];
      if (map?.showPopup) map.showPopup = false;
    }
  });
})().catch(error => {
  console.error(error);
  document.getElementById('app').textContent = '原站组件加载失败：' + error.message;
  document.getElementById('app').className = 'local-failure';
});
