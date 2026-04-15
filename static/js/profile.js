// Instagram-style tab switching
document.addEventListener('DOMContentLoaded', () => {
  // Set max date to today for all date inputs
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(input => {
    input.setAttribute('max', today);
  });

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
    imgEl.classList.remove('avatar-placeholder');
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
      // Reset background color
      const defaultBg = (avatarPreview && avatarPreview.getAttribute('data-bg')) || '#e2c9bf';
      bgInput.value = defaultBg;
      applyBg(avatarPreview, defaultBg);
      applyBg(avatarTile, defaultBg);
      
      // Reset profile picture to first avatar option
      if (avatarChoiceRadios.length > 0) {
        const firstRadio = avatarChoiceRadios[0];
        firstRadio.checked = true;
        const label = firstRadio.closest('.avatar-choice');
        const src = label ? label.getAttribute('data-src') : '';
        if (src) {
          setImg(avatarPreviewImg, src);
          setImg(avatarImg, src);
        }
      }
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

  // Library Search and Filters
  const librarySearchInput = document.getElementById('librarySearchInput');
  const libraryTab = document.getElementById('libraryTab');
  const libraryFilterToggle = document.getElementById('libraryFilterToggle');
  const libraryFilterPanel = document.getElementById('libraryFilterPanel');
  const libraryGenreFilter = document.getElementById('libraryGenreFilter');
  const libraryStatusFilter = document.getElementById('libraryStatusFilter');
  const libraryRatingFilter = document.getElementById('libraryRatingFilter');
  const libraryApplyFilters = document.getElementById('libraryApplyFilters');
  const libraryResetFilters = document.getElementById('libraryResetFilters');
  const libraryNoResults = document.getElementById('libraryNoResults');

  // Custom Dropdown Logic
  const customDropdowns = document.querySelectorAll('.custom-dropdown');
  
  const closeAllDropdowns = (except) => {
    customDropdowns.forEach(dd => {
      if (dd !== except) {
        dd.querySelector('.dropdown-menu')?.classList.remove('show');
        dd.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
      }
    });
  };

  customDropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle');
    const menu = dropdown.querySelector('.dropdown-menu');
    const hiddenInput = dropdown.querySelector('input[type="hidden"]');
    const textSpan = dropdown.querySelector('.dropdown-text');
    const items = dropdown.querySelectorAll('.dropdown-item');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.contains('show');
      closeAllDropdowns(dropdown);
      if (!isOpen) {
        menu.classList.add('show');
        toggle.setAttribute('aria-expanded', 'true');
      } else {
        menu.classList.remove('show');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    items.forEach(item => {
      item.addEventListener('click', () => {
        const value = item.dataset.value;
        const text = item.textContent;
        
        // Update hidden input
        if (hiddenInput) hiddenInput.value = value;
        
        // Update displayed text
        if (textSpan) textSpan.textContent = text;
        
        // Update selected state
        items.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        
        // Close menu
        menu.classList.remove('show');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  });

  // Close dropdowns on outside click
  document.addEventListener('click', () => closeAllDropdowns());

  // Genre hierarchy for filtering
  const subGenres = {
    'Fiction': ['Literary fiction', 'Contemporary fiction', 'Short stories', 'Drama', 'Adventure'],
    'Non-fiction': ['Biography / Memoir', 'Self-help', 'History', 'Science', 'Essays'],
    'Fantasy': ['High fantasy', 'Urban fantasy', 'Dark fantasy', 'Epic fantasy', 'Mythological fantasy'],
    'Science Fiction': ['Dystopian', 'Space opera', 'Cyberpunk', 'Time travel', 'Hard science fiction'],
    'Romance': ['Contemporary romance', 'Historical romance', 'Romantic comedy', 'Paranormal romance', 'Young adult romance'],
    'Mystery / Crime': ['Detective fiction', 'Cozy mystery', 'Police procedural', 'True crime', 'Noir'],
    'Thriller / Suspense': ['Psychological thriller', 'Political thriller', 'Legal thriller', 'Spy thriller', 'Action thriller'],
    'Horror': ['Psychological horror', 'Supernatural horror', 'Gothic horror', 'Monster horror', 'Cosmic horror'],
    'Historical': ['Historical fiction', 'Historical romance', 'Alternate history', 'War fiction', 'Biographical fiction'],
    "Children's / Young Adult": ['Picture books', 'Middle grade', 'Young adult fiction', 'Educational', 'Coming-of-age']
  };

  const matchesGenreFilter = (bookGenre, filterValue) => {
    if (!filterValue) return true;
    if (!bookGenre) return false;
    
    // Check if book genre contains the main genre
    if (bookGenre.includes(filterValue)) return true;
    
    // Check if book genre matches any subgenre of the selected main genre
    const subs = subGenres[filterValue] || [];
    return subs.some(sub => bookGenre.includes(sub));
  };

  const filterLibraryBooks = () => {
    if (!libraryTab) return;

    const query = (librarySearchInput?.value || '').toLowerCase().trim();
    const genreFilter = libraryGenreFilter?.value || '';
    const statusFilter = libraryStatusFilter?.value || '';
    const ratingFilter = libraryRatingFilter?.value || '';

    const cards = libraryTab.querySelectorAll('.book-card');
    const sections = libraryTab.querySelectorAll('.profile-section');
    let totalVisible = 0;

    cards.forEach((card) => {
      let title = '';
      let author = '';
      let genre = '';
      let pages = 0;
      let pagesRead = 0;
      let rating = 0;

      try {
        const data = JSON.parse(card.dataset.book || '{}');
        title = (data.title || '').toLowerCase();
        author = (data.author || '').toLowerCase();
        genre = data.genre || '';
        pages = parseInt(data.pages) || 0;
        pagesRead = parseInt(data.pages_read) || 0;
        rating = parseInt(data.rating) || 0;
      } catch (e) {
        // ignore parse errors
      }

      // Check text search
      const matchesSearch = !query || title.includes(query) || author.includes(query);

      // Check genre filter (match main genre or any of its subgenres)
      const matchesGenre = matchesGenreFilter(genre, genreFilter);

      // Check status filter based on pages read
      // "reading" = pages_read < pages (still reading)
      // "read" = pages_read >= pages (finished the book)
      let matchesStatus = true;
      if (statusFilter === 'reading') {
        matchesStatus = pages > 0 && pagesRead < pages;
      } else if (statusFilter === 'read') {
        matchesStatus = pages > 0 && pagesRead >= pages;
      }

      // Check rating filter
      let matchesRating = true;
      if (ratingFilter) {
        const minRating = parseInt(ratingFilter);
        matchesRating = rating >= minRating;
      }

      const isVisible = matchesSearch && matchesGenre && matchesStatus && matchesRating;
      card.style.display = isVisible ? '' : 'none';

      if (isVisible) totalVisible++;
    });

    // Show/hide sections based on visible cards
    sections.forEach((section) => {
      const visibleCards = section.querySelectorAll('.book-card:not([style*="display: none"])');
      section.style.display = visibleCards.length > 0 ? '' : 'none';
    });

    // Show no results state
    if (libraryNoResults) {
      const hasFiltersOrSearch = query || genreFilter || statusFilter || ratingFilter;
      libraryNoResults.hidden = totalVisible > 0 || !hasFiltersOrSearch;
    }
  };

  // Filter toggle
  if (libraryFilterToggle && libraryFilterPanel) {
    libraryFilterToggle.addEventListener('click', () => {
      const isHidden = libraryFilterPanel.hidden;
      libraryFilterPanel.hidden = !isHidden;
      libraryFilterToggle.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    });
  }

  // Apply filters button
  if (libraryApplyFilters) {
    libraryApplyFilters.addEventListener('click', filterLibraryBooks);
  }

  // Reset filters
  if (libraryResetFilters) {
    libraryResetFilters.addEventListener('click', () => {
      if (librarySearchInput) librarySearchInput.value = '';
      if (libraryGenreFilter) libraryGenreFilter.value = '';
      if (libraryStatusFilter) libraryStatusFilter.value = '';
      if (libraryRatingFilter) libraryRatingFilter.value = '';
      
      // Reset custom dropdown UI
      customDropdowns.forEach(dropdown => {
        const hiddenInput = dropdown.querySelector('input[type="hidden"]');
        const textSpan = dropdown.querySelector('.dropdown-text');
        const items = dropdown.querySelectorAll('.dropdown-item');
        const firstItem = items[0];
        
        if (hiddenInput) hiddenInput.value = '';
        if (textSpan && firstItem) textSpan.textContent = firstItem.textContent;
        items.forEach((item, i) => {
          item.classList.toggle('selected', i === 0);
        });
      });
      
      filterLibraryBooks();
    });
  }

  // Search on input
  if (librarySearchInput) {
    librarySearchInput.addEventListener('input', filterLibraryBooks);
  }
});
