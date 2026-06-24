(function () {
  'use strict';

  /* =============================
     Configuration
     ============================= */
  const STORAGE_KEY = 'platinumhouse_data';
  const DEFAULT_DATA = {
    restaurantName: 'PLATINUM HOUSE',
    subtitle: 'Изысканная кухня • Атмосфера роскоши • Безупречный сервис',
    badge: 'HOTEL & RESTAURANT',
    address: 'г. Москва, ул. Тверская, 15',
    addressLink: 'https://maps.yandex.ru',
    phone: '+7 (495) 123-45-67',
    phoneRaw: '+74951234567',
    email: 'info@platinumbouse.ru',
    hours: 'Ежедневно: 07:00 — 23:00',
    hoursNote: 'Завтрак: 07:00–11:00',
    whatsapp: 'https://wa.me/74951234567',
    telegram: '',
    menuImages: ['', ''],
    menuLabels: ['Меню — страница 1', 'Меню — страница 2'],
    ogImage: '/img/og-image.jpg'
  };

  let data = {};
  let currentImageIndex = 0;
  let lightboxImages = [];
  let isZoomed = false;
  let zoomLevel = 1;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let lastPinchDist = 0;

  /* =============================
     Helpers
     ============================= */
  function loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        data = JSON.parse(stored);
        if (data.restaurantName && data.restaurantName !== 'PLATINUM HOUSE') {
          data.restaurantName = 'PLATINUM HOUSE';
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
      } else {
        data = { ...DEFAULT_DATA };
      }
    } catch {
      data = { ...DEFAULT_DATA };
    }
  }

  function getImageSrc(index) {
    const src = data.menuImages && data.menuImages[index];
    return src && src.trim() ? src : null;
  }

  /* =============================
     Preloader
     ============================= */
  function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.classList.add('hidden');
    }
  }

  /* =============================
     Navbar
     ============================= */
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    const toggle = document.getElementById('navToggle');
    const links = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!navbar) return;

    let lastScroll = 0;
    window.addEventListener('scroll', function () {
      const current = window.scrollY;
      if (current > 60) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
      lastScroll = current;
    }, { passive: true });

    if (toggle && links) {
      toggle.addEventListener('click', function () {
        toggle.classList.toggle('active');
        links.classList.toggle('active');
      });

      navLinks.forEach(function (link) {
        link.addEventListener('click', function () {
          toggle.classList.remove('active');
          links.classList.remove('active');
        });
      });
    }

    document.addEventListener('click', function (e) {
      if (links && links.classList.contains('active')) {
        if (!e.target.closest('.nav-container')) {
          toggle.classList.remove('active');
          links.classList.remove('active');
        }
      }
    });
  }

  /* =============================
     Content Render
     ============================= */
  function renderContent() {
    loadData();

    document.querySelectorAll('[id^="menuImg"]').forEach(function (img) {
      const index = parseInt(img.id.replace('menuImg', ''));
      const src = getImageSrc(index);
      if (src) {
        img.src = src;
        img.alt = (data.menuLabels && data.menuLabels[index]) || 'Меню';
      } else {
        img.style.display = 'none';
        const wrapper = img.closest('.gallery-img-wrapper');
        if (wrapper) {
          const ph = document.createElement('div');
          ph.className = 'placeholder';
          ph.textContent = 'Нет изображения';
          wrapper.appendChild(ph);
        }
      }
    });

    if (data.restaurantName) {
      document.title = data.restaurantName + ' — Меню';
      document.querySelector('meta[property="og:title"]').content = data.restaurantName + ' — Меню';
      document.querySelector('meta[name="twitter:title"]').content = data.restaurantName + ' — Меню';
    }
    if (data.subtitle) {
      document.querySelector('.hero-subtitle').textContent = data.subtitle;
    }
    if (data.badge) {
      document.querySelector('.hero-badge').textContent = data.badge;
    }

    const addr = document.getElementById('contactAddress');
    const addrLink = document.getElementById('addressLink');
    if (addr) addr.textContent = data.address;
    if (addrLink && data.addressLink) addrLink.href = data.addressLink;

    const phone = document.getElementById('contactPhone');
    const phoneLink = document.getElementById('phoneLink');
    if (phone) phone.textContent = data.phone;
    if (phoneLink && data.phoneRaw) phoneLink.href = 'tel:' + data.phoneRaw;

    const email = document.getElementById('contactEmail');
    const emailLink = document.getElementById('emailLink');
    if (email) email.textContent = data.email;
    if (emailLink && data.email) emailLink.href = 'mailto:' + data.email;

    const hours = document.getElementById('contactHours');
    if (hours) hours.textContent = data.hours;

    const phoneBtn = document.getElementById('phoneBtn');
    if (phoneBtn && data.phoneRaw) phoneBtn.href = 'tel:' + data.phoneRaw;

    const whatsappBtn = document.getElementById('whatsappBtn');
    if (whatsappBtn && data.whatsapp) whatsappBtn.href = data.whatsapp;

    const telegramBtn = document.getElementById('telegramBtn');
    if (telegramBtn && data.telegram) telegramBtn.href = data.telegram;

    const yearEl = document.getElementById('footerYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  /* =============================
     Gallery & Lightbox
     ============================= */
  function initGallery() {
    const items = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const closeBtn = document.getElementById('lightboxClose');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');
    const counter = document.getElementById('lightboxCounter');

    if (!items.length || !lightbox) return;

    lightboxImages = [];
    items.forEach(function (item, index) {
      const src = getImageSrc(index);
      if (src) {
        lightboxImages.push(src);
      } else {
        lightboxImages.push(null);
      }

      const wrapper = item.querySelector('.gallery-img-wrapper');
      if (wrapper) {
        wrapper.addEventListener('click', function () {
          openLightbox(index);
        });
      }
    });

    function openLightbox(index) {
      const src = getImageSrc(index);
      if (!src) return;
      currentImageIndex = index;
      lightboxImg.src = src;
      lightboxImg.alt = (data.menuLabels && data.menuLabels[index]) || 'Меню';
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
      resetZoom();
      updateCounter();
    }

    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
      resetZoom();
    }

    function prevImage() {
      let idx = currentImageIndex;
      for (let i = 0; i < lightboxImages.length; i++) {
        idx = (idx - 1 + lightboxImages.length) % lightboxImages.length;
        if (getImageSrc(idx)) {
          currentImageIndex = idx;
          break;
        }
      }
      const src = getImageSrc(currentImageIndex);
      if (src) {
        lightboxImg.src = src;
        resetZoom();
        updateCounter();
      }
    }

    function nextImage() {
      let idx = currentImageIndex;
      for (let i = 0; i < lightboxImages.length; i++) {
        idx = (idx + 1) % lightboxImages.length;
        if (getImageSrc(idx)) {
          currentImageIndex = idx;
          break;
        }
      }
      const src = getImageSrc(currentImageIndex);
      if (src) {
        lightboxImg.src = src;
        resetZoom();
        updateCounter();
      }
    }

    function updateCounter() {
      if (counter) {
        counter.textContent = (currentImageIndex + 1) + ' / ' + lightboxImages.length;
      }
    }

    function resetZoom() {
      isZoomed = false;
      zoomLevel = 1;
      dragOffsetX = 0;
      dragOffsetY = 0;
      lightboxImg.style.transform = 'scale(1) translate(0, 0)';
      lightboxImg.classList.remove('zoomed', 'grabbing');
    }

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', prevImage);
    if (nextBtn) nextBtn.addEventListener('click', nextImage);

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    });

    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target.closest('.lightbox-content') === null && !e.target.closest('.lightbox-nav') && !e.target.closest('.lightbox-close')) {
        closeLightbox();
      }
    });

    /* Zoom via wheel */
    lightboxImg.addEventListener('wheel', function (e) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      zoomLevel = Math.max(1, Math.min(5, zoomLevel + delta));
      isZoomed = zoomLevel > 1;
      applyZoom();
    }, { passive: false });

    /* Touch pinch zoom */
    lightboxImg.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) {
        lastPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      } else if (e.touches.length === 1 && isZoomed) {
        isDragging = true;
        dragStartX = e.touches[0].clientX - dragOffsetX;
        dragStartY = e.touches[0].clientY - dragOffsetY;
        lightboxImg.classList.add('grabbing');
      }
    }, { passive: true });

    lightboxImg.addEventListener('touchmove', function (e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = (dist - lastPinchDist) * 0.01;
        zoomLevel = Math.max(1, Math.min(5, zoomLevel + delta));
        isZoomed = zoomLevel > 1;
        lastPinchDist = dist;
        applyZoom();
      } else if (e.touches.length === 1 && isDragging) {
        dragOffsetX = e.touches[0].clientX - dragStartX;
        dragOffsetY = e.touches[0].clientY - dragStartY;
        applyZoom();
      }
    }, { passive: false });

    lightboxImg.addEventListener('touchend', function () {
      isDragging = false;
      lightboxImg.classList.remove('grabbing');
    }, { passive: true });

    /* Mouse drag */
    lightboxImg.addEventListener('mousedown', function (e) {
      if (!isZoomed) return;
      isDragging = true;
      dragStartX = e.clientX - dragOffsetX;
      dragStartY = e.clientY - dragOffsetY;
      lightboxImg.classList.add('grabbing');
    });

    document.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      dragOffsetX = e.clientX - dragStartX;
      dragOffsetY = e.clientY - dragStartY;
      applyZoom();
    });

    document.addEventListener('mouseup', function () {
      isDragging = false;
      lightboxImg.classList.remove('grabbing');
    });

    function applyZoom() {
      lightboxImg.style.transform = 'scale(' + zoomLevel + ') translate(' + dragOffsetX / zoomLevel + 'px, ' + dragOffsetY / zoomLevel + 'px)';
      if (isZoomed) {
        lightboxImg.classList.add('zoomed');
      } else {
        lightboxImg.classList.remove('zoomed');
        dragOffsetX = 0;
        dragOffsetY = 0;
      }
    }

    /* Double-click to toggle zoom */
    lightboxImg.addEventListener('dblclick', function (e) {
      e.preventDefault();
      if (isZoomed) {
        resetZoom();
      } else {
        zoomLevel = 2.5;
        isZoomed = true;
        applyZoom();
      }
    });
  }

  /* =============================
     Scroll Animations
     ============================= */
  function initScrollAnimations() {
    const items = document.querySelectorAll('.gallery-item');

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

      items.forEach(function (item) {
        observer.observe(item);
      });
    } else {
      items.forEach(function (item) {
        item.classList.add('visible');
      });
    }
  }

  /* =============================
     Scroll to Top
     ============================= */
  function initScrollTop() {
    const btn = document.getElementById('scrollTop');
    if (!btn) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* =============================
     Initialization
     ============================= */
  function init() {
    loadData();
    renderContent();
    initNavbar();
    initGallery();
    initScrollAnimations();
    initScrollTop();

    setTimeout(hidePreloader, 800);

    /* Register service worker */
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').catch(function () {});
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
