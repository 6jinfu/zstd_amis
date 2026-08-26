(function () {
  'use strict';

  if (!window.echarts) {
    console.error('ECharts 未加载，人才图谱无法渲染');
    return;
  }

  var rootStyle = getComputedStyle(document.documentElement);
  function token(name, fallback) {
    return rootStyle.getPropertyValue(name).trim() || fallback;
  }

  var color = {
    primary: token('--primary-600', '#1668dc'),
    primaryMid: token('--primary-500', '#2f7de1'),
    primarySoft: token('--primary-300', '#83afea'),
    primaryPale: token('--primary-100', '#dceafd'),
    warning: token('--warning', '#d79a2b'),
    ink: token('--neutral-800', '#252b33'),
    text: token('--neutral-500', '#737b87'),
    axis: token('--neutral-300', '#cdd2d9'),
    grid: token('--hairline', '#e8ebef'),
    surface: token('--surface-raised', '#ffffff'),
    neutral: token('--neutral-400', '#a7adb7'),
    neutralSoft: token('--neutral-200', '#dfe3e8')
  };

  var charts = [];
  var mapChartsReady = false;
  var layerChartsReady = false;

  var fontFamily = rootStyle.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  var textStyle = { color: color.text, fontFamily: fontFamily, fontSize: 10 };
  var tooltip = {
    trigger: 'item',
    confine: true,
    backgroundColor: color.surface,
    borderColor: color.grid,
    borderWidth: 1,
    textStyle: { color: color.ink, fontSize: 11 },
    extraCssText: 'box-shadow:0 8px 24px rgba(20,32,48,.10);border-radius:7px;'
  };

  function valueAxis(name, min, max, interval) {
    return {
      type: 'value',
      name: name || '',
      nameLocation: 'middle',
      nameGap: 30,
      min: min,
      max: max,
      interval: interval,
      axisLabel: textStyle,
      nameTextStyle: textStyle,
      axisLine: { show: true, lineStyle: { color: color.axis } },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: color.grid } }
    };
  }

  function categoryAxis(data, name) {
    return {
      type: 'category',
      data: data,
      name: name || '',
      nameLocation: 'middle',
      nameGap: 26,
      axisLabel: textStyle,
      nameTextStyle: textStyle,
      axisLine: { lineStyle: { color: color.axis } },
      axisTick: { show: false }
    };
  }

  function makeChart(id, option) {
    var element = document.getElementById(id);
    if (!element) return null;
    var chart = echarts.init(element, null, { renderer: 'canvas' });
    chart.setOption(Object.assign({ animationDuration: 450, textStyle: { fontFamily: fontFamily } }, option));
    charts.push(chart);
    return chart;
  }

  function scatterSeries(name, data, open) {
    return {
      name: name,
      type: 'scatter',
      data: data,
      symbolSize: 7,
      itemStyle: open
        ? { color: color.surface, borderColor: color.primaryMid, borderWidth: 1.5 }
        : { color: color.primaryMid, opacity: 0.78, borderColor: color.surface, borderWidth: 1 }
    };
  }

  function lineSeries(name, data, options) {
    var extra = options || {};
    return Object.assign({
      name: name,
      type: 'line',
      data: data,
      showSymbol: false,
      smooth: true,
      lineStyle: { color: color.primary, width: 2 },
      itemStyle: { color: color.primary }
    }, extra);
  }

  function initMapCharts() {
    if (mapChartsReady) {
      charts.forEach(function (chart) { chart.resize(); });
      return;
    }
    mapChartsReady = true;

    makeChart('map-chart-1', {
      grid: { left: 48, right: 18, top: 18, bottom: 42 },
      tooltip: tooltip,
      xAxis: valueAxis('司龄（年）', 0, 14, 2),
      yAxis: Object.assign(valueAxis('层级', 1, 4, 1), { axisLabel: { color: color.text, fontSize: 10, formatter: 'L{value}' } }),
      series: [
        scatterSeries('盘点人员', [[1,1],[2,1],[2.5,2],[3,1],[3.5,2],[4,2],[4.5,3],[5,2],[5.5,3],[6,2],[6.5,3],[7,3],[8,3],[9,4],[10,3],[11,4],[12,4]]),
        lineSeries('等级趋势', [[1,1.2],[4,1.8],[7,2.6],[10,3.3],[13,3.8]], { tooltip: { show: false } })
      ]
    });

    makeChart('map-chart-2', {
      grid: { left: 36, right: 12, top: 18, bottom: 36 },
      tooltip: Object.assign({}, tooltip, { trigger: 'axis' }),
      xAxis: categoryAxis(['本科','硕士','博士']),
      yAxis: Object.assign(valueAxis('人数', 0, 20, 5), { nameGap: 25, splitLine: { show: false } }),
      series: [{ name: '人数', type: 'bar', data: [17,13,5], barWidth: '48%', label: { show: true, position: 'top', color: color.ink, fontSize: 10 }, itemStyle: { color: function (p) { return p.dataIndex === 1 ? color.primaryMid : color.primaryPale; }, borderColor: color.primarySoft, borderWidth: 1, borderRadius: [4,4,0,0] } }]
    });

    makeChart('map-chart-3', {
      color: ['#cbd5e1', color.primaryPale, color.primaryMid],
      grid: { left: 76, right: 18, top: 38, bottom: 30 },
      tooltip: Object.assign({}, tooltip, { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: function (value) { return value + '%'; } }),
      legend: { top: 2, itemWidth: 12, itemHeight: 7, textStyle: textStyle },
      xAxis: Object.assign(valueAxis('占比', 0, 100, 25), { axisLabel: { color: color.text, fontSize: 10, formatter: '{value}%' } }),
      yAxis: Object.assign(categoryAxis(['职能中台','销售中心','研发中心']), { axisLabel: { color: color.text, fontSize: 10 } }),
      series: [
        { name: '低', type: 'bar', stack: 'performance', data: [20,17,13], barWidth: 22, itemStyle: { color: '#cbd5e1', borderRadius: [4,0,0,4] } },
        { name: '中', type: 'bar', stack: 'performance', data: [50,50,47], itemStyle: { color: color.primaryPale } },
        { name: '高', type: 'bar', stack: 'performance', data: [30,33,40], itemStyle: { color: color.primaryMid, borderRadius: [0,4,4,0] } }
      ]
    });

    makeChart('map-chart-4', {
      grid: { left: 54, right: 18, top: 20, bottom: 42 },
      tooltip: tooltip,
      xAxis: categoryAxis(['研发中心','销售中心','职能中台'], '部门'),
      yAxis: categoryAxis(['低','中','高'], '绩效等级'),
      visualMap: { min: 1, max: 7, dimension: 2, show: false, inRange: { color: ['#eef2f7', '#dbeafe', '#60a5fa'] } },
      series: [{ name: '人数', type: 'heatmap', data: [[0,0,2],[0,1,7],[0,2,6],[1,0,2],[1,1,6],[1,2,4],[2,0,2],[2,1,5],[2,2,3]], label: { show: true, color: color.ink, fontSize: 10 }, itemStyle: { borderColor: color.surface, borderWidth: 4, borderRadius: 5 } }]
    });

    makeChart('map-chart-5', {
      grid: { left: 48, right: 18, top: 18, bottom: 42 },
      tooltip: tooltip,
      xAxis: valueAxis('系统架构（能力）', 40, 100, 10),
      yAxis: valueAxis('前瞻性（潜力）', 40, 100, 10),
      series: [
        scatterSeries('盘点人员', [[45,48],[51,55],[55,63],[59,57],[64,68],[68,65],[72,77],[77,72],[81,84],[85,78],[90,91],[94,86]], true),
        lineSeries('拟合趋势', [[43,48],[55,58],[67,68],[79,77],[91,87]], { tooltip: { show: false } })
      ]
    });

    makeChart('map-chart-6', {
      color: [color.primary, color.warning, color.neutral],
      grid: { left: 34, right: 12, top: 38, bottom: 30 },
      tooltip: Object.assign({}, tooltip, { trigger: 'axis' }),
      legend: { top: 2, itemWidth: 12, itemHeight: 6, textStyle: textStyle },
      xAxis: valueAxis('', 35, 95, 10),
      yAxis: { type: 'value', axisLabel: { show: false }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { show: false } },
      series: [
        lineSeries('系统架构（能力）', [[40,.2],[50,1.8],[60,5.2],[70,8.4],[80,4.1],[90,.6]], { lineStyle: { color: color.primary, width: 2 } }),
        lineSeries('学习成长（动力）', [[40,.3],[50,1.4],[60,4.1],[70,6.9],[80,4.7],[90,1.1]], { lineStyle: { color: color.warning, width: 1.8, type: 'dashed' } }),
        lineSeries('前瞻性（潜力）', [[40,.5],[50,2.2],[60,4.8],[70,5.5],[80,3.8],[90,.9]], { lineStyle: { color: color.neutral, width: 1.8, type: 'dotted' } })
      ]
    });

    makeChart('map-chart-7', {
      color: ['#cbd5e1', color.primaryPale, color.primaryMid],
      grid: { left: 36, right: 12, top: 38, bottom: 34 },
      tooltip: Object.assign({}, tooltip, { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: function (value) { return value + '%'; } }),
      legend: { top: 2, itemWidth: 12, itemHeight: 7, textStyle: textStyle },
      xAxis: categoryAxis(['L1','L2','L3','L4']),
      yAxis: Object.assign(valueAxis('占比', 0, 100, 25), { axisLabel: { color: color.text, fontSize: 10, formatter: '{value}%' }, splitLine: { show: false } }),
      series: [
        { name: '低', type: 'bar', stack: 'performance', data: [28,18,9,6], barWidth: '54%', itemStyle: { color: '#cbd5e1', borderRadius: [0,0,3,3] } },
        { name: '中', type: 'bar', stack: 'performance', data: [56,55,48,38], itemStyle: { color: color.primaryPale } },
        { name: '高', type: 'bar', stack: 'performance', data: [16,27,43,56], itemStyle: { color: color.primaryMid, borderRadius: [3,3,0,0] } }
      ]
    });

    makeChart('map-chart-8', {
      grid: { left: 48, right: 18, top: 18, bottom: 42 },
      tooltip: tooltip,
      xAxis: categoryAxis(['低','中','高'], '绩效等级'),
      yAxis: valueAxis('司龄（年）', 0, 14, 2),
      series: [{ name: '司龄分布', type: 'boxplot', data: [[1,2,3,4,6],[2,4,6,8,11],[3,6,8,10,13]], itemStyle: { color: color.primaryPale, borderColor: color.primaryMid, borderWidth: 1.4 } }]
    });

    makeChart('map-chart-9', {
      grid: { left: 48, right: 18, top: 18, bottom: 42 },
      tooltip: tooltip,
      xAxis: categoryAxis(['低','中','高'], '绩效等级'),
      yAxis: valueAxis('系统架构（能力）', 40, 100, 10),
      series: [{ name: '系统架构得分', type: 'boxplot', data: [[43,47,51,56,62],[52,61,68,74,82],[68,78,86,90,95]], itemStyle: { color: color.primaryPale, borderColor: color.primaryMid, borderWidth: 1.4 } }]
    });

    makeChart('map-chart-10', {
      grid: { left: 34, right: 12, top: 18, bottom: 38 },
      tooltip: Object.assign({}, tooltip, { trigger: 'axis' }),
      xAxis: categoryAxis(['低绩效','中绩效','高绩效']),
      yAxis: Object.assign(valueAxis('', 0, 100, 20), { axisLabel: { show: false }, splitLine: { show: false } }),
      series: [
        { name: '系统架构均值', type: 'bar', data: [47,68,86], barWidth: '52%', itemStyle: { color: function (p) { return p.dataIndex === 2 ? color.primaryMid : color.primaryPale; }, borderColor: color.primarySoft, borderWidth: 1 } },
        lineSeries('组间趋势', [47,68,86], { showSymbol: true, symbolSize: 6, lineStyle: { color: color.primary, width: 1.8 } })
      ]
    });

    makeChart('map-chart-11', {
      grid: { left: 48, right: 12, top: 20, bottom: 34 },
      tooltip: tooltip,
      xAxis: categoryAxis(['L1','L2','L3+']),
      yAxis: categoryAxis(['职能','销售','研发']),
      visualMap: { min: 45, max: 85, dimension: 2, show: false, inRange: { color: ['#eef2f7', '#dbeafe', '#93c5fd'] } },
      series: [{ name: '前瞻性均值', type: 'heatmap', data: [[0,0,49],[1,0,61],[2,0,70],[0,1,55],[1,1,64],[2,1,76],[0,2,62],[1,2,71],[2,2,84]], label: { show: true, color: color.ink, fontSize: 10 }, itemStyle: { borderColor: color.surface, borderWidth: 3, borderRadius: 4 } }]
    });

    makeChart('map-chart-12', {
      grid: { left: 74, right: 18, top: 18, bottom: 34 },
      tooltip: tooltip,
      xAxis: valueAxis('前瞻性（潜力）', 40, 100, 10),
      yAxis: categoryAxis(['职能中台','销售中心','研发中心']),
      series: [{ name: '群体分布', type: 'boxplot', data: [[43,51,59,67,76],[48,57,65,73,82],[55,64,73,82,93]], itemStyle: { color: color.primaryPale, borderColor: color.primaryMid, borderWidth: 1.4 } }]
    });
  }

  function initLayerCharts() {
    if (layerChartsReady) {
      charts.forEach(function (chart) { chart.resize(); });
      return;
    }
    layerChartsReady = true;

    makeChart('map-chart-funnel', {
      tooltip: Object.assign({}, tooltip, { formatter: '{b}<br/>人数：{c}' }),
      series: [{
        type: 'funnel',
        left: '8%', right: '8%', top: 4, bottom: 4,
        min: 0, max: 35, minSize: '38%', maxSize: '100%',
        sort: 'descending', gap: 6,
        label: { show: true, position: 'inside', formatter: '{b}  {c}', color: color.ink, fontSize: 11 },
        labelLine: { show: false },
        itemStyle: { borderColor: color.surface, borderWidth: 1, borderRadius: 3 },
        data: [
          { value: 35, name: '全部人员', itemStyle: { color: color.primaryPale } },
          { value: 28, name: 'C 类及以上 · 前 80%', itemStyle: { color: '#bfd6f7' } },
          { value: 14, name: 'B 类及以上 · 前 40%', itemStyle: { color: color.primarySoft } },
          { value: 5, name: 'A 类 · 前 15%', itemStyle: { color: color.primary }, label: { color: '#fff' } }
        ]
      }]
    });

    makeChart('map-chart-13', {
      grid: { left: 34, right: 16, top: 28, bottom: 30 },
      tooltip: Object.assign({}, tooltip, { trigger: 'axis' }),
      xAxis: categoryAxis(['40','45','50','55','60','65','70','75','80','85','90']),
      yAxis: Object.assign(valueAxis('', 0, 9, 3), { axisLabel: { show: false }, splitLine: { show: false } }),
      series: [
        { name: '人数', type: 'bar', data: [1,2,4,6,8,9,7,5,3,2,1], barWidth: '76%', itemStyle: { color: function (p) { return p.dataIndex === 5 ? color.primaryMid : color.primaryPale; }, borderColor: color.primarySoft, borderWidth: 1 } },
        lineSeries('分布曲线', [0.6,1.6,3.6,6.2,8.1,8.8,7.4,5.2,3.1,1.5,.6], { lineStyle: { color: color.primary, width: 1.8 }, markLine: { silent: true, symbol: 'none', lineStyle: { color: color.neutral, width: 1, type: 'dashed' }, label: { color: color.text, fontSize: 9, formatter: '{b}' }, data: [{ xAxis: '55', name: 'D/C' },{ xAxis: '70', name: 'C/B' },{ xAxis: '85', name: 'B/A' }] } })
      ]
    });

    makeChart('map-chart-class-strip', {
      grid: { left: 0, right: 0, top: 5, bottom: 5, containLabel: false },
      tooltip: Object.assign({}, tooltip, { trigger: 'item', formatter: '{a}：{c}%' }),
      xAxis: { type: 'value', min: 0, max: 100, show: false },
      yAxis: { type: 'category', data: [''], show: false },
      series: [
        { name: 'A 类', type: 'bar', stack: 'class', data: [15], barWidth: 34, label: { show: true, position: 'inside', formatter: 'A 15%', color: '#fff', fontSize: 10 }, itemStyle: { color: color.primary, borderRadius: [6,0,0,6] } },
        { name: 'B 类', type: 'bar', stack: 'class', data: [25], label: { show: true, position: 'inside', formatter: 'B 25%', color: color.ink, fontSize: 10 }, itemStyle: { color: color.primaryPale } },
        { name: 'C 类', type: 'bar', stack: 'class', data: [40], label: { show: true, position: 'inside', formatter: 'C 40%', color: color.ink, fontSize: 10 }, itemStyle: { color: color.neutralSoft } },
        { name: 'D 类', type: 'bar', stack: 'class', data: [20], label: { show: true, position: 'inside', formatter: 'D 20%', color: color.ink, fontSize: 10 }, itemStyle: { color: color.axis, borderRadius: [0,6,6,0] } }
      ]
    });
  }

  function visibleSection() {
    return document.querySelector('.d-section.active');
  }

  function initializeVisibleCharts() {
    var target = location.hash.replace('#', '');
    if (target === 'layering') {
      initLayerCharts();
      return;
    }
    if (target === 'talent-map' || !target) {
      initMapCharts();
      return;
    }
    var section = visibleSection();
    if (section && section.dataset.section === 'talent-map') initMapCharts();
    if (section && section.dataset.section === 'layering') initLayerCharts();
  }

  document.querySelectorAll('.anchor-nav a').forEach(function (link) {
    link.addEventListener('click', function () {
      window.setTimeout(function () {
        if (link.getAttribute('href') === '#talent-map') initMapCharts();
        if (link.getAttribute('href') === '#layering') initLayerCharts();
      }, 30);
    });
  });

  window.addEventListener('resize', function () {
    charts.forEach(function (chart) { chart.resize(); });
  });

  if ('ResizeObserver' in window) {
    var observer = new ResizeObserver(function () {
      charts.forEach(function (chart) { chart.resize(); });
    });
    var main = document.querySelector('.detail-main');
    if (main) observer.observe(main);
  }

  window.setTimeout(initializeVisibleCharts, 50);
})();
