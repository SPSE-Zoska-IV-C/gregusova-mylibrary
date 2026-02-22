(function(){
  // Apply bar heights from data attributes (prevents template inline-style parse errors)
  const bars = document.querySelectorAll('.bar[data-pct]');
  bars.forEach((bar) => {
    const pct = Number(bar.getAttribute('data-pct') || 0);
    const safePct = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;
    bar.style.height = `${safePct}%`;
  });

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
  }

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

  function updateBars(container, series, kind) {
    // kind: 'daily' or 'monthly'
    const chart = container.querySelector(kind === 'daily' ? '.chart-daily' : '.chart-monthly');
    if (!chart) return;
    chart.innerHTML = '';
    if (kind === 'daily') {
      series.forEach(item => {
        const wrap = document.createElement('div');
        wrap.className = 'bar-item';
        wrap.title = `Day ${item.day}: ${item.pages} pages`;
        wrap.innerHTML = `
          <div class="bar-wrap"><div class="bar" data-pct="${item.pct}"></div></div>
          <div class="bar-label">${item.day}</div>
          <div class="bar-pages">${item.pages}</div>
        `;
        chart.appendChild(wrap);
      });
    } else {
      series.forEach(item => {
        const wrap = document.createElement('div');
        wrap.className = 'bar-item';
        wrap.title = `${item.label}: ${item.pages} pages`;
        wrap.innerHTML = `
          <div class="bar-wrap"><div class="bar" data-pct="${item.pct}"></div></div>
          <div class="bar-label">${item.label}</div>
          <div class="bar-pages">${item.pages}</div>
        `;
        chart.appendChild(wrap);
      });
    }
    // Re-apply heights
    chart.querySelectorAll('.bar[data-pct]').forEach((bar) => {
      const pct = Number(bar.getAttribute('data-pct') || 0);
      const safePct = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;
      bar.style.height = `${safePct}%`;
    });
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
        updateBars(container, data.daily, 'daily');
        updateNav(container, data, 'daily');
      } else {
        updateBars(container, data.monthly, 'monthly');
        updateNav(container, data, 'monthly');
      }

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
