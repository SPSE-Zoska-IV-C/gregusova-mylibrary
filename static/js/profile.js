// Instagram-style tab switching
document.addEventListener('DOMContentLoaded', () => {
  // Apply progress bar widths from data attributes (keeps templates free of inline Jinja styles)
  const fills = document.querySelectorAll('.progress-fill[data-pct]');
  fills.forEach((fill) => {
    const pct = Number(fill.getAttribute('data-pct') || 0);
    const safePct = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;
    fill.style.width = `${safePct}%`;
  });

  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  const activateTab = (targetTab) => {
    if (!targetTab) return;
    const btn = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`);
    const targetContent = document.getElementById(`${targetTab}Tab`);
    if (!btn || !targetContent) return;

    tabButtons.forEach((b) => b.classList.remove('active'));
    tabContents.forEach((c) => c.classList.remove('active'));
    btn.classList.add('active');
    targetContent.classList.add('active');
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      // Remove active class from all buttons and contents
      tabButtons.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));

      // Add active class to clicked button
      btn.classList.add('active');

      // Show corresponding content
      const targetContent = document.getElementById(`${targetTab}Tab`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });

  // Deep-link support: /profile?tab=wishlist
  const url = new URL(window.location.href);
  const tabParam = url.searchParams.get('tab');
  if (tabParam) {
    activateTab(tabParam);
  }

  // Wishlist form toggle (embedded in Profile)
  const toggleBtn = document.getElementById('toggleWishForm');
  const toggleBtnCard = document.getElementById('toggleWishFormCard');
  const cancelBtn = document.getElementById('cancelWishForm');
  const cancelBtn2 = document.getElementById('cancelWishForm2');
  const formWrapper = document.getElementById('wishFormWrapper');
  const emptyCta = document.getElementById('wishEmptyCta');

  const openWishForm = () => {
    if (!formWrapper) return;
    formWrapper.hidden = false;
    const title = document.getElementById('wish_title');
    if (title) title.focus();
  };

  const closeWishForm = () => {
    if (!formWrapper) return;
    formWrapper.hidden = true;
  };

  if (toggleBtn && formWrapper) {
    toggleBtn.addEventListener('click', () => {
      formWrapper.hidden = !formWrapper.hidden;
      if (!formWrapper.hidden) {
        const title = document.getElementById('wish_title');
        if (title) title.focus();
      }
    });
  }

  if (toggleBtnCard) {
    toggleBtnCard.addEventListener('click', openWishForm);
  }

  if (emptyCta) {
    emptyCta.addEventListener('click', openWishForm);
  }

  [cancelBtn, cancelBtn2].forEach((btn) => {
    if (btn) btn.addEventListener('click', closeWishForm);
  });

  const wishlistCards = Array.from(document.querySelectorAll('.wishlist-item[data-book]'));
  const wishlistSearchInput = document.getElementById('wishlistSearchInput');
  const wishlistFeedback = document.getElementById('wishlistSearchFeedback');
  const wishlistFilterToggle = document.getElementById('wishlistFilterToggle');
  const wishlistFilterPanel = document.getElementById('wishlistFilterPanel');
  const wishlistGenreFilter = document.getElementById('wishlistGenreFilter');
  const wishlistNotesFilter = document.getElementById('wishlistNotesFilter');
  const wishlistApplyFilters = document.getElementById('wishlistApplyFilters');
  const wishlistResetFilters = document.getElementById('wishlistResetFilters');

  const getWishlistBookData = (card) => {
    if (!card) return {};
    if (!card._wishlistData) {
      try {
        card._wishlistData = card.dataset.book ? JSON.parse(card.dataset.book) : {};
      } catch (error) {
        card._wishlistData = {};
      }
    }
    return card._wishlistData;
  };

  const applyWishlistFilters = () => {
    if (!wishlistCards.length) return;

    const query = (wishlistSearchInput?.value || '').trim().toLowerCase();
    const selectedGenre = (wishlistGenreFilter?.value || '').trim().toLowerCase();
    const notesMode = wishlistNotesFilter?.value || 'all';
    let visibleCount = 0;

    wishlistCards.forEach((card) => {
      const data = getWishlistBookData(card);
      const title = (data.title || '').toLowerCase();
      const author = (data.author || '').toLowerCase();
      const genre = (data.genre || '').toLowerCase();
      const notes = (data.notes || '').trim();

      const matchesQuery = !query || `${title} ${author}`.includes(query);
      const matchesGenre = !selectedGenre || genre === selectedGenre;
      const matchesNotes = notesMode === 'all' || (notesMode === 'with' ? Boolean(notes) : !notes);
      const isVisible = matchesQuery && matchesGenre && matchesNotes;

      card.hidden = !isVisible;
      if (isVisible) {
        visibleCount += 1;
      }
    });

    if (wishlistFeedback) {
      wishlistFeedback.hidden = visibleCount !== 0;
    }
  };

  if (wishlistGenreFilter && wishlistCards.length) {
    const genres = Array.from(new Set(
      wishlistCards
        .map((card) => (getWishlistBookData(card).genre || '').trim())
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right))
    ));

    genres.forEach((genre) => {
      const option = document.createElement('option');
      option.value = genre;
      option.textContent = genre;
      wishlistGenreFilter.appendChild(option);
    });
  }

  if (wishlistFilterToggle && wishlistFilterPanel) {
    wishlistFilterPanel.setAttribute('hidden', '');
    wishlistFilterToggle.setAttribute('aria-expanded', 'false');

    wishlistFilterToggle.addEventListener('click', () => {
      const isHidden = wishlistFilterPanel.hasAttribute('hidden');
      if (isHidden) {
        wishlistFilterPanel.removeAttribute('hidden');
        wishlistFilterToggle.setAttribute('aria-expanded', 'true');
      } else {
        wishlistFilterPanel.setAttribute('hidden', '');
        wishlistFilterToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (wishlistSearchInput) {
    wishlistSearchInput.addEventListener('input', applyWishlistFilters);
  }

  if (wishlistApplyFilters) {
    wishlistApplyFilters.addEventListener('click', applyWishlistFilters);
  }

  if (wishlistGenreFilter) {
    wishlistGenreFilter.addEventListener('change', applyWishlistFilters);
  }

  if (wishlistNotesFilter) {
    wishlistNotesFilter.addEventListener('change', applyWishlistFilters);
  }

  if (wishlistResetFilters) {
    wishlistResetFilters.addEventListener('click', () => {
      if (wishlistSearchInput) wishlistSearchInput.value = '';
      if (wishlistGenreFilter) wishlistGenreFilter.value = '';
      if (wishlistNotesFilter) wishlistNotesFilter.value = 'all';
      applyWishlistFilters();
    });
  }

  // Avatar editor panel
  const avatarTile = document.getElementById('avatarTile');
  const avatarImg = document.getElementById('avatarImg');
  const avatarEditBtn = document.getElementById('avatarEditBtn');
  const avatarPanel = document.getElementById('avatarPanel');
  const avatarPreview = document.getElementById('avatarPreview');
  const avatarPreviewImg = document.getElementById('avatarPreviewImg');
  const bgInput = document.getElementById('pfpBg');
  const avatarResetBtn = document.getElementById('avatarResetBtn');
  const avatarChoiceRadios = document.querySelectorAll('#avatarPanel input[name="pfp"]');

  const applyBg = (element, value) => {
    if (!element) return;
    element.style.backgroundColor = value || '';
  };

  const setImg = (imgEl, src) => {
    if (!imgEl || !src) return;
    imgEl.src = src;
  };

  if (avatarTile) {
    applyBg(avatarTile, avatarTile.getAttribute('data-bg') || '');
  }

  if (avatarPreview) {
    applyBg(avatarPreview, avatarPreview.getAttribute('data-bg') || '');
  }

  const openAvatarPanel = () => {
    if (!avatarPanel) return;
    avatarPanel.classList.add('open');
    avatarPanel.setAttribute('aria-hidden', 'false');
    document.body.classList.add('panel-open');
    if (bgInput) bgInput.focus();
  };

  const closeAvatarPanel = () => {
    if (!avatarPanel) return;
    avatarPanel.classList.remove('open');
    avatarPanel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('panel-open');
  };

  if (avatarEditBtn) {
    avatarEditBtn.addEventListener('click', openAvatarPanel);
  }

  document.querySelectorAll('[data-avatar-close]').forEach((el) => {
    el.addEventListener('click', closeAvatarPanel);
  });

  if (bgInput) {
    bgInput.addEventListener('input', () => {
      applyBg(avatarPreview, bgInput.value);
      applyBg(avatarTile, bgInput.value);
    });
  }

  if (avatarResetBtn && bgInput) {
    avatarResetBtn.addEventListener('click', () => {
      const defaultBg = (avatarPreview && avatarPreview.getAttribute('data-bg')) || '#e2c9bf';
      bgInput.value = defaultBg;
      applyBg(avatarPreview, defaultBg);
      applyBg(avatarTile, defaultBg);
    });
  }

  avatarChoiceRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      const label = radio.closest('.avatar-choice');
      const src = label ? label.getAttribute('data-src') : '';
      if (src) {
        setImg(avatarPreviewImg, src);
        setImg(avatarImg, src);
      }
    });

    if (radio.checked) {
      const label = radio.closest('.avatar-choice');
      const src = label ? label.getAttribute('data-src') : '';
      if (src) {
        setImg(avatarPreviewImg, src);
        setImg(avatarImg, src);
      }
    }
  });
});

