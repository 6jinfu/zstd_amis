(function () {
  const defaults = { 2: [50, 50], 3: [60, 20, 20], 4: [40, 20, 20, 20], 5: [20, 20, 20, 20, 20] };
  const labels = window.ReviewGridContent.bands;
  function balance(values, index, value) {
    const next = values.slice(), count = values.length;
    next[index] = Math.min(100 - (count - 1) * 5, Math.max(5, Math.round(Number(value) || 5)));
    const delta = next[index] - values[index];
    let remaining = Math.abs(delta);
    for (let i = 0; i < count && remaining; i++) {
      if (i === index) continue;
      const amount = Math.min(remaining, delta > 0 ? next[i] - 5 : 100 - next[i]);
      next[i] += delta > 0 ? -amount : amount;
      remaining -= amount;
    }
    return next;
  }
  window.ReviewDistribution = {
    balance,
    mount(root, getCount, getPeopleCount, onChange) {
      const state = {}, name = root.dataset.distributionDimension === 'ability' ? '能力' : '绩效';
      const bar = root.querySelector('[data-distribution-bar]'), controls = root.querySelector('[data-distribution-controls]');
      const getShares = () => (state[getCount()] || defaults[getCount()]).slice();
      function render() {
        const count = getCount(), names = labels[count], values = getShares();
        bar.replaceChildren();
        bar.style.gridTemplateColumns = values.slice().reverse().map(value => value + 'fr').join(' ');
        controls.replaceChildren();
        controls.dataset.count = String(count);
        controls.style.gridTemplateColumns = 'repeat(' + Math.min(count, 3) + ',minmax(0,1fr))';
        let cumulative = 0;
        names.slice().reverse().forEach((label, reverseIndex) => {
          const index = count - 1 - reverseIndex, start = cumulative, end = start + values[index];
          const tone = reverseIndex === 0 ? 'high' : reverseIndex === count - 1 ? 'low' : 'mid';
          const item = document.createElement('span');
          item.className = tone;
          item.textContent = label + ' ' + values[index] + '%';
          bar.append(item);
          const card = document.createElement('div');
          card.className = 'distribution-card';
          card.innerHTML = '<div class="distribution-card-head"><label>' + label + '档占比</label><span>' + (reverseIndex === 0 ? '前 ' + end + '%' : '排名 ' + start + '%–' + end + '%') + '</span></div><div class="distribution-stepper"><button type="button" data-band-index="' + index + '" data-step="-5" aria-label="减少' + name + label + '档占比">−</button><div class="distribution-value"><input type="number" min="5" max="' + (100 - (count - 1) * 5) + '" step="5" data-band-share="' + index + '" value="' + values[index] + '" aria-label="' + name + label + '档占比"><span>%</span></div><button type="button" data-band-index="' + index + '" data-step="5" aria-label="增加' + name + label + '档占比">＋</button></div><small>约 ' + Math.round(getPeopleCount() * values[index] / 100) + ' 人</small>';
          controls.append(card);
          cumulative = end;
        });
        root.querySelector('[data-distribution-total]').textContent = values.reduce((total, value) => total + value, 0) + '%';
      }
      function setShare(index, value) { state[getCount()] = balance(getShares(), index, value); render(); onChange(); }
      controls.addEventListener('click', event => {
        const button = event.target.closest('[data-band-index]');
        if (button) setShare(Number(button.dataset.bandIndex), Number(button.closest('.distribution-card').querySelector('input').value) + Number(button.dataset.step));
      });
      controls.addEventListener('change', event => {
        if (event.target.matches('[data-band-share]')) setShare(Number(event.target.dataset.bandShare), event.target.value);
      });
      root.querySelector('[data-rule-reset]').addEventListener('click', () => { state[getCount()] = defaults[getCount()].slice(); render(); onChange(); });
      return { render, getShares };
    }
  };
})();
