document.addEventListener('DOMContentLoaded', () => {
  const panel = document.getElementById('bookPanel');
  const cards = document.querySelectorAll('.book-card[data-book]');
  const wishlistCards = document.querySelectorAll('.wishlist-item[data-book]:not(.wishlist-item-add)');
  const bookGrid = document.querySelector('.book-grid');
  const searchInput = document.getElementById('bookSearch');
  const searchFeedback = document.getElementById('searchFeedback');
  const closeTargets = panel ? panel.querySelectorAll('[data-panel-close]') : [];
  const panelCard = panel ? panel.querySelector('.panel-card') : null;
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
  const completionControls = document.getElementById('completionControls');
  const finishDateInput = document.getElementById('finishDateInput');
  const markFinishedInput = document.getElementById('markFinished');
  const completionRatingWrapper = document.getElementById('completionRating');
  const completionRatingInput = document.getElementById('completionRatingInput');
  const completionStars = completionRatingWrapper ? completionRatingWrapper.querySelectorAll('.star') : [];

  const todayISO = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  };

  const clearCompletionExtras = () => {
    if (finishDateInput) {
      finishDateInput.value = '';
    }
    if (completionRatingInput) {
      completionRatingInput.value = '';
    }
    completionStars.forEach((star) => {
      star.classList.remove('selected', 'hovered');
    });
  };

  const setCompletionState = (isComplete) => {
    if (completionControls) {
      completionControls.hidden = !isComplete;
    }
    if (markFinishedInput) {
      markFinishedInput.value = isComplete ? 'true' : 'false';
    }

    if (isComplete) {
      if (finishDateInput && !finishDateInput.value) {
        finishDateInput.value = todayISO();
      }
    } else {
      clearCompletionExtras();
    }
  };

  const updateCompletionStars = (value) => {
    if (!completionStars.length) {
      return;
    }
    completionStars.forEach((star) => {
      const starValue = Number(star.dataset.value);
      star.classList.toggle('selected', starValue <= value);
    });
  };

  completionStars.forEach((star) => {
    star.addEventListener('click', () => {
      const value = Number(star.dataset.value);
      if (completionRatingInput) {
        completionRatingInput.value = value;
      }
      updateCompletionStars(value);
    });
    star.addEventListener('mouseover', () => {
      const value = Number(star.dataset.value);
      completionStars.forEach((s) => {
        s.classList.toggle('hovered', Number(s.dataset.value) <= value);
      });
    });
    star.addEventListener('mouseout', () => {
      completionStars.forEach((s) => s.classList.remove('hovered'));
    });
  });

  const getBookData = (card) => {
    if (!card) {
      return {};
    }
    if (!card._bookData) {
      try {
        card._bookData = card.dataset.book ? JSON.parse(card.dataset.book) : {};
      } catch (err) {
        console.error('Could not parse book data', err);
        card._bookData = {};
      }
    }
    return card._bookData;
  };

  const openPanel = (data) => {
    if (!panel) return;
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
    const totalPages = Number(data.pages) || 0;
    const readPages = Number(data.pages_read) || 0;
    const status = (data.status || '').toLowerCase();
    if (totalPages > 0) {
      const displayRead = status === 'already read' ? totalPages : readPages;
      pagesEl.textContent = `${displayRead}/${totalPages}`;
    } else {
      pagesEl.textContent = readPages ? `${readPages}` : '—';
    }

    if (data.rating) {
      const rating = Math.min(5, Math.max(0, Number(data.rating)));
      const filled = '★'.repeat(rating);
      const empty = '☆'.repeat(5 - rating);
      ratingEl.innerHTML = `
        <span class="rating-stars" aria-hidden="true">${filled}${empty}</span>
        <span class="rating-value">${rating}/5</span>
      `;
    } else {
      ratingEl.textContent = '—';
    }
    startEl.textContent = data.start_date || '—';
    finishEl.textContent = data.finish_date || '—';
    notesEl.textContent = data.notes && data.notes.trim().length ? data.notes : 'No notes yet.';

    // Set up panel action forms
    const panelStatusForm = document.getElementById('panelStatusForm');
    const panelDeleteForm = document.getElementById('panelDeleteForm');
    if (panelStatusForm && data.id) {
      panelStatusForm.action = `/book/${data.id}/change_status`;
      const statusSelect = panelStatusForm.querySelector('select');
      if (statusSelect) {
        statusSelect.value = '';
      }
    }
    if (panelDeleteForm && data.id) {
      panelDeleteForm.action = `/delete/${data.id}`;
    }

    const isReading = status === 'reading now';
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
      setCompletionState(sliderMax > 0 && safeValue >= sliderMax);
    } else {
      progressSection.hidden = true;
      progressForm.action = '';
      setCompletionState(false);
    }

    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('panel-open');
    panelCard.focus();
  };

  const closePanel = () => {
    if (!panel) return;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('panel-open');
  };

  if (panel) {
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const data = getBookData(card);
        openPanel(data);
      });
    });

    wishlistCards.forEach((card) => {
      card.addEventListener('click', (e) => {
        // Don't open panel if clicking delete button or add to library link
        if (e.target.closest('.wishlist-delete-form') || e.target.closest('.wishlist-add-library-btn')) {
          return;
        }
        const data = getBookData(card);
        openPanel(data);
      });
    });

    closeTargets.forEach((el) => el.addEventListener('click', closePanel));
    document.addEventListener('keydown', (evt) => {
      if (evt.key === 'Escape' && panel.classList.contains('open')) {
        closePanel();
      }
    });
  }

  if (slider && sliderValue) {
    slider.addEventListener('input', () => {
      sliderValue.textContent = `${slider.value}/${slider.max}`;
      const current = Number(slider.value) || 0;
      const max = Number(slider.max) || 0;
      setCompletionState(max > 0 && current >= max);
    });
  }

  const applySearchFilter = (value = '') => {
    if (!bookGrid || !cards.length) {
      return;
    }
    const query = value.trim().toLowerCase();
    let visibleCount = 0;
    cards.forEach((card) => {
      const data = getBookData(card);
      const haystack = `${data.title || ''} ${data.author || ''}`.toLowerCase();
      const matches = !query || haystack.includes(query);
      card.hidden = !matches;
      card.classList.toggle('is-hidden', !matches);
      if (matches) {
        visibleCount += 1;
      }
    });
    if (searchFeedback) {
      searchFeedback.hidden = !(query && visibleCount === 0);
    }
  };

  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      applySearchFilter(event.target.value);
    });
    if (searchInput.value) {
      applySearchFilter(searchInput.value);
    }
  }

  // Filter toggle functionality
  const filterToggle = document.getElementById('filterToggle');
  const filterPanel = document.getElementById('filterPanel');
  const filterReset = document.getElementById('filterReset');

  if (filterToggle && filterPanel) {
    filterToggle.addEventListener('click', () => {
      const isHidden = filterPanel.hasAttribute('hidden');
      if (isHidden) {
        filterPanel.removeAttribute('hidden');
        filterToggle.setAttribute('aria-expanded', 'true');
      } else {
        filterPanel.setAttribute('hidden', '');
        filterToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (filterReset) {
    filterReset.addEventListener('click', () => {
      // Reset to default URL without filters
      window.location.href = window.location.pathname;
    });
  }

  // Status dropdown toggle
  document.querySelectorAll('.status-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = btn.parentElement.querySelector('.status-menu');
      if (menu) {
        const isHidden = menu.hasAttribute('hidden');
        // Close all other menus first
        document.querySelectorAll('.status-menu').forEach((m) => m.setAttribute('hidden', ''));
        // Toggle this menu
        if (isHidden) {
          menu.removeAttribute('hidden');
        }
      }
    });
  });

  // Close status menus when clicking outside
  document.addEventListener('click', () => {
    document.querySelectorAll('.status-menu').forEach((menu) => {
      menu.setAttribute('hidden', '');
    });
  });

  // Prevent menu close when clicking inside it
  document.querySelectorAll('.status-menu').forEach((menu) => {
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });

});
