document.addEventListener('DOMContentLoaded', () => {
  const panel = document.getElementById('bookPanel');
  if (!panel) return;

  const cards = document.querySelectorAll('.book-card[data-book]');
  const closeTargets = panel.querySelectorAll('[data-panel-close]');
  const panelCard = panel.querySelector('.panel-card');
  const coverImg = document.getElementById('panelCover');
  const statusEl = document.getElementById('panelStatus');
  const titleEl = document.getElementById('panelTitle');
  const authorEl = document.getElementById('panelAuthor');
  const genreEl = document.getElementById('panelGenre');
  const pagesEl = document.getElementById('panelPages');
  const ratingEl = document.getElementById('panelRating');
  const startEl = document.getElementById('panelStart');
  const finishEl = document.getElementById('panelFinish');
  const notesEl = document.getElementById('panelNotes');
  const progressSection = document.getElementById('panelProgressSection');
  const progressForm = document.getElementById('progressForm');
  const slider = document.getElementById('progressSlider');
  const sliderValue = document.getElementById('progressValue');
  const notesField = document.getElementById('progressNotes');

  const openPanel = (data) => {
    coverImg.src = data.cover_url || '';
    coverImg.alt = `${data.title || 'Book'} cover`;
    statusEl.textContent = data.status || '';
    statusEl.className = 'panel-status status-pill';
    if (data.status) {
      statusEl.classList.add(`status-${data.status.toLowerCase().replace(/\s+/g, '-')}`);
    }
    titleEl.textContent = data.title || 'Untitled';
    authorEl.textContent = data.author ? `by ${data.author}` : '';
    genreEl.textContent = data.genre || '—';
    pagesEl.textContent = data.pages ? `${data.pages_read || 0}/${data.pages}` : (data.pages_read || '—');
    ratingEl.textContent = data.rating ? `${data.rating}/5` : '—';
    startEl.textContent = data.start_date || '—';
    finishEl.textContent = data.finish_date || '—';
    notesEl.textContent = data.notes && data.notes.trim().length ? data.notes : 'No notes yet.';

    const isReading = (data.status || '').toLowerCase() === 'reading now';
    if (isReading) {
      progressSection.hidden = false;
      const sliderMax = data.pages && data.pages > 0 ? data.pages : Math.max(data.pages_read || 0, 1);
      slider.max = sliderMax;
      const safeValue = Math.min(sliderMax, data.pages_read || 0);
      slider.value = safeValue;
      slider.disabled = sliderMax === 0;
      sliderValue.textContent = `${safeValue}/${sliderMax}`;
      notesField.value = data.notes || '';
      progressForm.action = `/book/${data.id}/progress`;
    } else {
      progressSection.hidden = true;
      progressForm.action = '';
    }

    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('panel-open');
    panelCard.focus();
  };

  const closePanel = () => {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('panel-open');
  };

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      try {
        const data = JSON.parse(card.dataset.book);
        openPanel(data);
      } catch (err) {
        console.error('Could not parse book data', err);
      }
    });
  });

  closeTargets.forEach((el) => el.addEventListener('click', closePanel));
  document.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape' && panel.classList.contains('open')) {
      closePanel();
    }
  });

  slider.addEventListener('input', () => {
    sliderValue.textContent = `${slider.value}/${slider.max}`;
  });
});
