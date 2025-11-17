// script.js — improved & resilient version

// -- Theme toggle (keeps the user's preference) --
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const storedTheme = localStorage.getItem('theme');
if (storedTheme) root.classList.toggle('light', storedTheme === 'light');
themeToggle?.addEventListener('click', () => {
  const isLight = root.classList.toggle('light');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
});

// -- Year (defensive) --
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// -- Background orbital particles (kept as-is; defensive checks added) --
(() => {
  const canvas = document.getElementById('orbital');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  let w, h, particles = [];

  function resize() {
    w = canvas.width = canvas.offsetWidth * DPR;
    h = canvas.height = canvas.offsetHeight * DPR;
    if (particles.length === 0) {
      for (let i = 0; i < 40; i++) {
        particles.push({
          r: 40 + Math.random() * Math.min(w, h) * 0.25,
          a: Math.random() * Math.PI * 2,
          s: 0.0015 + Math.random() * 0.003,
          size: 1 + Math.random() * 2,
          hue: 200 + Math.random() * 80
        });
      }
    }
  }
  function tick() {
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    particles.forEach(p => {
      p.a += p.s;
      const x = Math.cos(p.a) * p.r;
      const y = Math.sin(p.a) * p.r;
      ctx.beginPath();
      ctx.arc(x, y, p.size * DPR, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},70%,60%,0.35)`;
      ctx.fill();
    });
    ctx.restore();
    requestAnimationFrame(tick);
  }
  window.addEventListener('resize', resize);
  resize();
  tick();
})();

// -- Scroll animations (defensive) --
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1 });
document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));

// -- Filtering (keeps behaviour, small fix: show 'no results' message) --
const filterButtons = document.querySelectorAll('.filter-btn');
const cards = document.querySelectorAll('.video-card');
const portfolioGrid = document.getElementById('portfolioGrid');

function applyFilter(category) {
  let anyVisible = false;
  cards.forEach(card => {
    const match = category === 'all' || card.dataset.category === category;
    card.style.display = match ? '' : 'none';
    if (match) anyVisible = true;
  });

  // optional: show a friendly message if no items match
  let noEl = document.querySelector('.no-results');
  if (!anyVisible) {
    if (!noEl) {
      noEl = document.createElement('div');
      noEl.className = 'no-results';
      noEl.textContent = 'No items found for this category.';
      portfolioGrid?.appendChild(noEl);
    }
  } else {
    if (noEl) noEl.remove();
  }
}
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.filter-btn.active')?.classList.remove('active');
    btn.classList.add('active');
    applyFilter(btn.dataset.filter);
  });
});

// -- Reliable fallback video sources (public sample files) --
// The script will swap in these if the original source errors.
const FALLBACKS = {
  generic: [
    "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
    "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4"
  ],
  // category-specific fallback hints (optional)
  gaming: [
    "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4"
  ],
  // you can add more category-specific arrays if you like
};

// helper to pick fallback (round-robin)
const fallbackCounters = {};
function getFallback(category) {
  const list = FALLBACKS[category] || FALLBACKS.generic;
  fallbackCounters[category] = (fallbackCounters[category] || 0) % list.length;
  return list[fallbackCounters[category]++];
}

// -- Lightbox modal & safe play handling --
const modal = document.getElementById('lightbox');
const modalVideo = document.getElementById('lightboxVideo');
function openLightbox(src) {
  if (!modal || !modalVideo) return;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  // set src safely and attempt to play
  modalVideo.src = src || '';
  modalVideo.load();
  modalVideo.play().catch(()=>{ /* autoplay blocked — user will have to press play */ });
}
function closeLightbox() {
  if (!modal || !modalVideo) return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  modalVideo.pause();
  modalVideo.removeAttribute('src');
  modalVideo.load();
}
modal?.addEventListener('click', (e) => {
  if (e.target.dataset.close === 'lightbox' || e.target.classList.contains('modal-close')) {
    closeLightbox();
  }
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

// -- Card interactions: hover play, hover out pause+reset, click toggle, play button opens lightbox --
// plus: if the card's video source errors, swap in a fallback and retry.
document.querySelectorAll('.video-card').forEach(card => {
  const video = card.querySelector('video');
  if (!video) return;
  const source = video.querySelector('source');
  const btn = card.querySelector('.play-btn');
  const category = card.dataset.category || 'generic';

  // if source fails to load, swap to fallback and try again
  function onSourceError() {
    const fallback = getFallback(category);
    if (!source) {
      video.src = fallback;
    } else {
      source.setAttribute('src', fallback);
    }
    // reload and try
    try {
      video.load();
      // try autoplay (might be blocked)
      video.play().catch(()=>{});
    } catch (err) {
      // ignore
    }
  }
  // listen for error on the video element
  video.addEventListener('error', (ev) => {
    // only run fallback once per video to avoid loop
    if (!card.dataset.fallbacked) {
      card.dataset.fallbacked = '1';
      onSourceError();
    }
  });

  // Hover behavior
  card.addEventListener('mouseenter', () => {
    try {
      video.muted = true;
      video.play().catch(()=>{});
    } catch (e) {}
  });
  card.addEventListener('mouseleave', () => {
    try {
      video.pause();
      video.currentTime = 0;
    } catch (e) {}
  });

  // Click to toggle pause/play on the inline card
  card.addEventListener('click', (e) => {
    // if the click was on the explicit Play Preview button, ignore here
    if (e.target.closest('.play-btn')) return;
    try {
      if (video.paused) {
        video.play().catch(()=>{});
      } else {
        video.pause();
      }
    } catch (err) {}
  });

  // Open lightbox with explicit Play Preview button
  btn?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    // prefer the <source> src, otherwise the video's src attr
    const src = (source && source.getAttribute('src')) || video.getAttribute('src') || getFallback(category);
    openLightbox(src);
  });

  // Accessibility: allow keyboard to trigger the play button
  btn?.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      btn.click();
    }
  });
});
  
// -- Contact form validation (keeps behaviour; small defensive tweaks) --
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (form.name?.value || '').trim();
    const email = (form.email?.value || '').trim();
    const message = (form.message?.value || '').trim();

    const errors = {
      name: name.length < 2 ? 'Please enter your full name.' : '',
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Enter a valid email.',
      message: message.length < 10 ? 'Message should be at least 10 characters.' : ''
    };

    Object.entries(errors).forEach(([key, val]) => {
      const el = form.querySelector(`.error[data-for="${key}"]`);
      if (el) el.textContent = val;
    });

    const hasError = Object.values(errors).some(Boolean);
    if (!hasError) {
      // open default mail client (front-end demo)
      window.location.href = `mailto:editkaroofficial@gmail.com?subject=New%20Project%20Inquiry%20from%20${encodeURIComponent(name)}&body=${encodeURIComponent(message)}%0A%0AContact:%20${encodeURIComponent(email)}`;
      form.reset();
    }
  });
}
