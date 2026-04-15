(function(){
  const AXIS_TICKS = 7;
  const SCALE_BASE = 60;    // Default max scale
  const SCALE_STEP = 30;    // Increment when data exceeds current max

  function buildScale(maxValue) {
    const safeMax = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 0;
    
    // Find the appropriate scale max: 60, 90, 120, 150, etc.
    let scaleMax = SCALE_BASE;
    while (safeMax > scaleMax) {
      scaleMax += SCALE_STEP;
    }
    
    const step = scaleMax / (AXIS_TICKS - 1);
    return { step, max: scaleMax };
  }

  function getPagesFromChart(chartEl) {
    if (!chartEl) return [];
    return Array.from(chartEl.querySelectorAll('.bar-item'))
      .map((el) => {
        // Try data-pages attribute first (daily chart), then .bar-pages text (monthly chart)
        const dataPages = el.dataset.pages;
        if (dataPages !== undefined) return Number(dataPages);
        const pagesEl = el.querySelector('.bar-pages');
        return Number(pagesEl?.textContent || 0);
      })
      .map((value) => (Number.isFinite(value) && value >= 0 ? value : 0));
  }

  function renderAxis(axisEl, maxValue) {
    if (!axisEl) return;
    const scale = buildScale(maxValue);
    axisEl.innerHTML = '';
    for (let i = 0; i < AXIS_TICKS; i += 1) {
      const val = Math.round(scale.step * i);
      const tick = document.createElement('span');
      tick.textContent = String(val);
      axisEl.appendChild(tick);
    }
  }

  function updateChartFrame(container) {
    if (!container) return;
    const frame = container.querySelector('.chart-frame');
    const chart = container.querySelector('.chart');
    const axis = container.querySelector('.chart-yaxis');
    if (!frame || !chart || !axis) return;

    const pages = getPagesFromChart(chart);
    const maxValue = pages.length ? Math.max(...pages) : 0;
    const scale = buildScale(maxValue);
    
    renderAxis(axis, maxValue);
    
    // Recalculate bar heights based on fixed scale
    const bars = chart.querySelectorAll('.bar[data-pct]');
    const barItems = chart.querySelectorAll('.bar-item');
    barItems.forEach((item, i) => {
      const bar = item.querySelector('.bar');
      if (!bar) return;
      const pageVal = pages[i] || 0;
      const pct = scale.max > 0 ? (pageVal / scale.max) * 100 : 0;
      bar.style.height = `${Math.max(0, Math.min(100, pct))}%`;
    });
  }

  function applyBarHeights(root = document) {
    const bars = root.querySelectorAll('.bar[data-pct]');
    bars.forEach((bar) => {
      const pct = Number(bar.getAttribute('data-pct') || 0);
      const safePct = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;
      bar.style.height = `${safePct}%`;
    });
  }

  // Apply bar heights from data attributes (prevents template inline-style parse errors)
  applyBarHeights(document);

  // Apply legend swatch colors from data-color
  const legendItems = document.querySelectorAll('.legend-item[data-color]');
  legendItems.forEach((item) => {
    const color = item.getAttribute('data-color');
    const swatch = item.querySelector('.legend-color');
    if (swatch && color) {
      swatch.style.backgroundColor = color;
    }
  });

  // Daily/Monthly toggle functionality
  const dailyToggle = document.getElementById('dailyToggle');
  const monthlyToggle = document.getElementById('monthlyToggle');
  const dailyChart = document.getElementById('dailyChart');
  const monthlyChart = document.getElementById('monthlyChart');

  if (dailyToggle && monthlyToggle && dailyChart && monthlyChart) {
    function switchView(view) {
      if (view === 'daily') {
        dailyChart.hidden = false;
        monthlyChart.hidden = true;
        dailyToggle.classList.add('active');
        monthlyToggle.classList.remove('active');
      } else {
        dailyChart.hidden = true;
        monthlyChart.hidden = false;
        monthlyToggle.classList.add('active');
        dailyToggle.classList.remove('active');
      }
    }

    dailyToggle.addEventListener('click', () => switchView('daily'));
    monthlyToggle.addEventListener('click', () => switchView('monthly'));

    // Set initial view (default to daily)
    switchView('daily');
    updateChartFrame(dailyChart);
    updateChartFrame(monthlyChart);
  }

  // Chart bar click tooltip (works for both daily and monthly)
  const chartTooltip = document.getElementById('chartTooltip');
  const monthlyTooltip = document.getElementById('monthlyTooltip');
  let selectedBar = null;
  let activeTooltip = null;

  function showTooltip(barItem, isMonthly = false) {
    const tooltip = isMonthly ? monthlyTooltip : chartTooltip;
    if (!tooltip) return;
    const tooltipPages = tooltip.querySelector('.tooltip-pages');
    const tooltipDate = tooltip.querySelector('.tooltip-date');
    if (!tooltipPages || !tooltipDate) return;
    
    const pages = barItem.dataset.pages || '0';
    
    if (isMonthly) {
      const month = barItem.dataset.month || '';
      const year = barItem.dataset.year || '';
      tooltipPages.textContent = `${pages} pages`;
      tooltipDate.textContent = `${month} ${year}`;
    } else {
      const day = barItem.dataset.day || '';
      const monthLabel = barItem.dataset.date || '';
      const parts = monthLabel.split(' ');
      const monthName = parts[0] || '';
      const year = parts[1] || '';
      tooltipPages.textContent = `${pages} pages`;
      tooltipDate.textContent = `${day} ${monthName} ${year}`;
    }
    
    // Position tooltip above the bar
    const barRect = barItem.getBoundingClientRect();
    const frameEl = barItem.closest('.chart-frame');
    const frameRect = frameEl.getBoundingClientRect();
    
    const left = barRect.left + barRect.width / 2 - frameRect.left;
    const top = barRect.top - frameRect.top;
    
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.hidden = false;
    
    // Mark bar as selected
    if (selectedBar) selectedBar.classList.remove('is-selected');
    barItem.classList.add('is-selected');
    selectedBar = barItem;
    activeTooltip = tooltip;
  }

  function hideTooltip() {
    if (activeTooltip) activeTooltip.hidden = true;
    if (chartTooltip) chartTooltip.hidden = true;
    if (monthlyTooltip) monthlyTooltip.hidden = true;
    if (selectedBar) {
      selectedBar.classList.remove('is-selected');
      selectedBar = null;
    }
    activeTooltip = null;
  }

  // Event delegation for chart bars (both daily and monthly)
  document.addEventListener('click', (e) => {
    const dailyBarItem = e.target.closest('.chart-daily .bar-item');
    const monthlyBarItem = e.target.closest('.chart-monthly .bar-item');
    
    if (dailyBarItem) {
      e.stopPropagation();
      if (selectedBar === dailyBarItem) {
        hideTooltip();
      } else {
        showTooltip(dailyBarItem, false);
      }
      return;
    }
    
    if (monthlyBarItem) {
      e.stopPropagation();
      if (selectedBar === monthlyBarItem) {
        hideTooltip();
      } else {
        showTooltip(monthlyBarItem, true);
      }
      return;
    }
    
    // Click outside hides tooltip
    if (!e.target.closest('.chart-tooltip')) {
      hideTooltip();
    }
  });

  // Partial navigation for charts (AJAX update of just the chart containers)
  function toDataUrl(pageUrl) {
    try {
      const u = new URL(pageUrl, window.location.origin);
      u.pathname = '/stats_data';
      return u.toString();
    } catch {
      return pageUrl;
    }
  }

  function updateBars(container, series, kind, monthLabel, chartYear) {
    // kind: 'daily' or 'monthly'
    const chart = container.querySelector(kind === 'daily' ? '.chart-daily' : '.chart-monthly');
    if (!chart) return;
    chart.innerHTML = '';
    const ordinalLabels = {1: '1st', 7: '7th', 14: '14th', 21: '21st', 28: '28th'};
    if (kind === 'daily') {
      series.forEach(item => {
        const wrap = document.createElement('div');
        wrap.className = 'bar-item';
        wrap.dataset.day = item.day;
        wrap.dataset.pages = item.pages;
        wrap.dataset.date = monthLabel || '';
        const labelText = ordinalLabels[item.day] || '';
        wrap.innerHTML = `<div class="bar-wrap"><div class="bar" data-pct="${item.pct}"></div></div>${labelText ? `<span class="day-label">${labelText}</span>` : ''}`;
        chart.appendChild(wrap);
      });
    } else {
      series.forEach(item => {
        const wrap = document.createElement('div');
        wrap.className = 'bar-item';
        wrap.dataset.pages = item.pages;
        wrap.dataset.month = item.label;
        wrap.dataset.year = chartYear || '';
        wrap.innerHTML = `
          <div class="bar-wrap"><div class="bar" data-pct="${item.pct}"></div></div>
          <div class="bar-label">${item.label}</div>
        `;
        chart.appendChild(wrap);
      });
    }
    // Re-apply heights
    applyBarHeights(chart);
  }

  function updateNav(container, data, scope) {
    // scope: 'daily'|'monthly'
    const nav = container.querySelector('.chart-nav');
    const note = nav ? nav.querySelector('.chart-note') : container.querySelector('.chart-note');
    if (scope === 'daily') {
      if (note) note.textContent = data.daily_logs_used ? `${data.month_label} (from page logs)` : `No page logs yet for ${data.month_label}.`;
      const [prevA, nextA] = nav ? nav.querySelectorAll('.nav-arrow') : [];
      if (prevA) prevA.setAttribute('href', data.month_prev_url);
      if (nextA) nextA.setAttribute('href', data.month_next_url);
    } else {
      if (note) note.textContent = data.monthly_logs_used ? `${data.chart_year} (from page logs)` : `No page logs yet for ${data.chart_year}.`;
      const [prevA, nextA] = nav ? nav.querySelectorAll('.nav-arrow') : [];
      if (prevA) prevA.setAttribute('href', data.chart_year_prev_url);
      if (nextA) nextA.setAttribute('href', data.chart_year_next_url);
    }
  }

  // Event delegation for nav arrows
  document.addEventListener('click', async (e) => {
    const a = e.target.closest('.chart-nav .nav-arrow');
    if (!a) return;
    e.preventDefault();

    const container = a.closest('.chart-container');
    if (!container) return;

    const isDaily = container.id === 'dailyChart';
    const dataUrl = toDataUrl(a.getAttribute('href'));
    try {
      const res = await fetch(dataUrl, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) return;
      const data = await res.json();
      if (isDaily) {
        updateBars(container, data.daily, 'daily', data.month_label, null);
        updateNav(container, data, 'daily');
      } else {
        updateBars(container, data.monthly, 'monthly', null, data.chart_year);
        updateNav(container, data, 'monthly');
      }
      updateChartFrame(container);

      // Update the browser address to the non-API URL for shareability
      try {
        const pageUrl = new URL(a.getAttribute('href'), window.location.origin);
        window.history.replaceState({}, '', pageUrl.toString());
      } catch {}
    } catch {
      /* ignore */
    }
  });

  // Legacy comparison panel code (kept for backward compatibility if needed)
  const pagesCard = document.getElementById('pagesCard');
  const panel = document.getElementById('comparisonPanel');
  const closeBtn = document.getElementById('compareClose');

  if(!pagesCard || !panel) return;

  function openPanel(){
    panel.hidden = false;
    panel.setAttribute('aria-hidden','false');
    pagesCard.setAttribute('aria-expanded','true');
  }
  function closePanel(){
    panel.hidden = true;
    panel.setAttribute('aria-hidden','true');
    pagesCard.setAttribute('aria-expanded','false');
  }

  if (pagesCard) {
    pagesCard.addEventListener('click', openPanel);
    pagesCard.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        openPanel();
      }
    });
  }

  if(closeBtn){ closeBtn.addEventListener('click', closePanel); }
  if (panel) {
    panel.addEventListener('click', (e)=>{
      const isOutside = e.target === panel;
      if(isOutside){ closePanel(); }
    });
  }
})();
