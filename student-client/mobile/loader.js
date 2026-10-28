(function () {
  const modules = {};
  const cache = {};
  function require(id) {
    if (cache[id]) return cache[id].exports;
    if (!modules[id]) throw new Error('Missing original module: ' + id);
    const module = cache[id] = { i: id, l: false, exports: {} };
    modules[id].call(module.exports, module, module.exports, require);
    module.l = true;
    return module.exports;
  }
  require.m = modules;
  require.c = cache;
  require.o = (object, property) => Object.prototype.hasOwnProperty.call(object, property);
  require.d = (exports, name, getter) => {
    if (!require.o(exports, name)) Object.defineProperty(exports, name, { enumerable: true, get: getter });
  };
  require.r = exports => {
    if (typeof Symbol !== 'undefined' && Symbol.toStringTag) Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    Object.defineProperty(exports, '__esModule', { value: true });
  };
  require.n = module => {
    const getter = module && module.__esModule ? () => module.default : () => module;
    require.d(getter, 'a', getter);
    return getter;
  };
  require.t = (value, mode) => {
    if (mode & 1) value = require(value);
    if (mode & 8 || mode & 4 && typeof value === 'object' && value && value.__esModule) return value;
    const ns = Object.create(null);
    require.r(ns);
    Object.defineProperty(ns, 'default', { enumerable: true, value });
    if (mode & 2 && typeof value !== 'string') for (const k in value) require.d(ns, k, () => value[k]);
    return ns;
  };
  require.p = './';
  require.e = () => Promise.resolve();
  require.hmd = module => module;
  require.nmd = module => module;
  window.webpackJsonp = [];
  window.webpackJsonp.push = chunk => Object.assign(modules, chunk[1]);
  window.originalRequire = require;
  window.__TBC_I18N = { locale: 'zh_CN', t: value => value };
  window.i18n = { $t: value => value };
  window.$cookies = { get: name => name === 'local_' ? 'zh-CN' : name === 'corp_code' || name === 'corpCode' ? 'tbc.com' : '' };
})();
