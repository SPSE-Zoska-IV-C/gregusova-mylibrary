(function(){
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
