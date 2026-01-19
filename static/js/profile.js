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

  if (emptyCta) {
    emptyCta.addEventListener('click', openWishForm);
  }

  [cancelBtn, cancelBtn2].forEach((btn) => {
    if (btn) btn.addEventListener('click', closeWishForm);
  });

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

