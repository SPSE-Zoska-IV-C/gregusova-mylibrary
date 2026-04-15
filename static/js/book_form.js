document.addEventListener('DOMContentLoaded', () => {
  const readingBtn = document.getElementById('reading-btn');
  const readBtn = document.getElementById('read-btn');
  const statusInput = document.getElementById('status');
  const pagesReadSection = document.getElementById('pages-read-section');
  const startDateReadingGroup = document.getElementById('start-date-reading');
  const startDateReading = document.getElementById('start_date_reading');
  const alreadyReadSection = document.getElementById('already-read-section');
  const startDateRead = document.getElementById('start_date_read');
  const finishDate = document.getElementById('finish_date');

  if (
    readingBtn &&
    readBtn &&
    statusInput &&
    pagesReadSection &&
    startDateReading &&
    alreadyReadSection &&
    startDateRead &&
    finishDate
  ) {
    const activateReadingNow = () => {
      alreadyReadSection.style.display = 'none';
      pagesReadSection.style.display = 'block';
      if (startDateReadingGroup) startDateReadingGroup.style.display = 'block';

      statusInput.value = 'Reading Now';

      startDateReading.disabled = false;
      startDateReading.required = true;

      startDateRead.disabled = true;
      startDateRead.required = false;
      startDateRead.value = '';
      finishDate.disabled = true;
      finishDate.required = false;
      finishDate.value = '';

      readingBtn.classList.add('active');
      readBtn.classList.remove('active');
    };

    const activateAlreadyRead = () => {
      alreadyReadSection.style.display = 'block';
      pagesReadSection.style.display = 'none';
      if (startDateReadingGroup) startDateReadingGroup.style.display = 'none';

      statusInput.value = 'Already Read';

      startDateReading.disabled = true;
      startDateReading.required = false;

      startDateRead.disabled = false;
      startDateRead.required = true;
      finishDate.disabled = false;
      finishDate.required = true;

      readBtn.classList.add('active');
      readingBtn.classList.remove('active');
    };

    readingBtn.addEventListener('click', activateReadingNow);
    readBtn.addEventListener('click', activateAlreadyRead);

    if ((statusInput.value || '').toLowerCase() === 'already read') {
      activateAlreadyRead();
    } else {
      activateReadingNow();
    }
  }

  const starRating = document.getElementById('star-rating');
  if (starRating) {
    const stars = starRating.querySelectorAll('.star');
    const ratingInput = document.getElementById('rating');
    stars.forEach((star) => {
      star.addEventListener('click', () => {
        const value = star.getAttribute('data-value');
        if (ratingInput) {
          ratingInput.value = value;
        }
        stars.forEach((s) => s.classList.toggle('selected', s.getAttribute('data-value') <= value));
      });
      star.addEventListener('mouseover', () => {
        const value = star.getAttribute('data-value');
        stars.forEach((s) => s.classList.toggle('hovered', s.getAttribute('data-value') <= value));
      });
      star.addEventListener('mouseout', () => {
        stars.forEach((s) => s.classList.remove('hovered'));
      });
    });
  }

  // Cover selection with color dots
  const coverRadios = document.querySelectorAll('input[name="cover"]');
  const designCards = document.querySelectorAll('.cover-design-card');

  const customCoverRadio = document.getElementById('custom-cover-radio');
  const customCoverFile = document.getElementById('custom-cover-file');
  const customCoverCard = document.querySelector('.cover-design-card--custom');

  const updateCoverPreview = (radio) => {
    if (!radio || !radio.dataset.previewSrc) return;
    
    const designId = radio.dataset.design;
    const previewMain = document.querySelector(`.cover-preview-main[data-design="${designId}"]`);
    
    if (previewMain) {
      previewMain.src = radio.dataset.previewSrc;
    }
  };

  const updateSelectionState = (targetInput) => {
    if (!targetInput) return;
    
    // Update all color dots
    document.querySelectorAll('.color-dot').forEach((dot) => {
      dot.classList.remove('selected');
    });
    
    // Mark selected dot
    const selectedDot = targetInput.nextElementSibling;
    if (selectedDot && selectedDot.classList.contains('color-dot')) {
      selectedDot.classList.add('selected');
    }
    
    // Update cover preview
    updateCoverPreview(targetInput);

    // Custom upload card selected state
    if (customCoverCard && customCoverRadio) {
      customCoverCard.classList.toggle('is-selected', customCoverRadio.checked);
    }
  };

  coverRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      updateSelectionState(radio);
    });
    
    if (radio.checked) {
      updateSelectionState(radio);
    }
  });

  // Initialize first selection if none selected
  if (!document.querySelector('input[name="cover"]:checked') && coverRadios.length) {
    coverRadios[0].checked = true;
    updateSelectionState(coverRadios[0]);
  }

  // Click on color dot to select
  document.querySelectorAll('.color-dot').forEach((dot) => {
    dot.addEventListener('click', (e) => {
      const wrapper = dot.closest('.color-dot-wrapper');
      if (wrapper) {
        const radio = wrapper.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          updateSelectionState(radio);
        }
      }
    });
  });

  // Custom cover: selecting a file should select the custom radio option
  if (customCoverFile && customCoverRadio) {
    customCoverFile.addEventListener('change', () => {
      if (customCoverFile.files && customCoverFile.files.length) {
        customCoverRadio.checked = true;
        updateSelectionState(customCoverRadio);
      }
    });
  }

  // =====================
  // Genre tag selection
  // =====================
  const mainGenres = [
    'Fiction',
    'Non-fiction',
    'Fantasy',
    'Science Fiction',
    'Romance',
    'Mystery / Crime',
    'Thriller / Suspense',
    'Horror',
    'Historical',
    'Children’s / Young Adult'
  ];

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
    'Children’s / Young Adult': ['Picture books', 'Middle grade', 'Young adult fiction', 'Educational', 'Coming-of-age']
  };

  const MAX_TAGS = 5;
  // Base/selected colors per main genre; adjust to your palette
  
  const mainList = document.getElementById('genre-main-list');
  const subList = document.getElementById('genre-sub-list');
  const selectedWrap = document.getElementById('genre-selected');
  const genresInput = document.getElementById('genre');

  if (mainList && subList && selectedWrap && genresInput) {
    // Reverse lookup tag->group for prefill
    const tagToGroup = new Map();
    mainGenres.forEach((g) => tagToGroup.set(g, g));
    Object.entries(subGenres).forEach(([g, subs]) => subs.forEach((t) => tagToGroup.set(t, g)));

    const initialGenres = (window.__MYLIBRARY__?.initialGenres && window.__MYLIBRARY__.initialGenres.length)
      ? window.__MYLIBRARY__.initialGenres
      : (genresInput.value || '')
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);

    const selected = new Map(); // tag -> group
    initialGenres.forEach((t) => {
      const grp = tagToGroup.get(t) || null;
      selected.set(t, grp);
    });

    function applyColors(el, group) {
    // Colors are controlled purely via CSS using data-group attributes.
    }

    function renderSelected() {
      selectedWrap.innerHTML = '';
      if (!selected.size) return;
      selected.forEach((group, tag) => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'tag-pill selected';
        pill.setAttribute('aria-pressed', 'true');
        pill.innerHTML = `${tag}<span class="tag-remove" aria-label="Remove">×</span>`;
        pill.dataset.group = group || '';
        pill.addEventListener('click', () => {
          selected.delete(tag);
          syncHidden();
          renderSelected();
          renderMain();
          renderSub(currentMain);
        });
        selectedWrap.appendChild(pill);
      });
    }

    function syncHidden() {
      genresInput.value = Array.from(selected.keys()).join(', ');
      // basic validity: require at least 1 tag
      if (genresInput.value.trim().length === 0) {
        genresInput.setCustomValidity('Please select at least one genre');
      } else {
        genresInput.setCustomValidity('');
      }
    }

    function addTag(tag, group) {
      if (selected.has(tag)) return;
      if (selected.size >= MAX_TAGS) {
        // brief visual feedback
        selectedWrap.classList.add('limit-shake');
        setTimeout(() => selectedWrap.classList.remove('limit-shake'), 400);
        return;
      }
      selected.set(tag, group || null);
      syncHidden();
      renderSelected();
      renderMain();
      renderSub(currentMain);
    }

    function makePill(text, isSelected, groupForSub) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tag-pill' + (isSelected ? ' is-active' : '');
      b.textContent = text;
      b.dataset.group = groupForSub || '';
      if (!isSelected) b.addEventListener('click', () => addTag(text, groupForSub));
      return b;
    }

    function renderMain() {
      mainList.innerHTML = '';
      mainGenres.forEach((g) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const isTagSelected = selected.has(g);
        btn.className = 'tag-pill main-selector' + (g === currentMain ? ' is-current' : '') + (isTagSelected ? ' is-active' : '');
        btn.textContent = g;
        btn.dataset.group = g;
        btn.addEventListener('click', () => {
          // Just open/toggle the rollout - don't select the main genre
          if (currentMain === g) {
            // Clicking same main genre closes the rollout
            currentMain = null;
          } else {
            currentMain = g;
          }
          renderMain();
          renderSub(currentMain);
        });
        mainList.appendChild(btn);
      });
    }

    function renderSub(main) {
      subList.innerHTML = '';
      if (!main || !subGenres[main]) { subList.hidden = true; return; }
      subList.hidden = false;
      // Add the main genre as first option in the subgenres list
      const isMainSel = selected.has(main);
      const mainPill = makePill(main, isMainSel, main);
      mainPill.classList.add('sub-main-option');
      subList.appendChild(mainPill);
      // Then add all subgenres
      subGenres[main].forEach((sg) => {
        const isSel = selected.has(sg);
        subList.appendChild(makePill(sg, isSel, main));
      });
    }

    let currentMain = null; // Start with no rollout open
    // Initial render
    renderMain();
    renderSelected();
    renderSub(currentMain);
    syncHidden();
  }
});
