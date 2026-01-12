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
});
