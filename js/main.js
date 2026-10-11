/* TALA Highland Glamping — portfolio sample (plain JS, no build step) */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.remove('no-js');
  var reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var slowNet = !!(conn && (conn.saveData || /(^|-)2g|3g/.test(conn.effectiveType || '')));

  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }

  /* ---------------- Pricing data ---------------- */
  var STAYS = {
    belltent: { name: 'Bell Tent', rate: 4800, base: 2, max: 3 },
    aframe:   { name: 'A-Frame Cabin', rate: 7500, base: 4, max: 5 },
    dome:     { name: 'Stargazing Dome', rate: 9200, base: 2, max: 3 }
  };
  var EXTRA_GUEST = 900;               // per extra guest, per night
  var ADDONS = {
    bonfire:   { name: 'Bonfire kit', rate: 1200, unit: 'night' },        // per night
    breakfast: { name: 'Sunrise breakfast', rate: 450, unit: 'guestNight' },// per guest per morning
    hike:      { name: 'Guided ridge hike', rate: 650, unit: 'guest' }      // per guest, once
  };
  var MAX_NIGHTS = 14;

  var peso = function (n) { return '₱' + Math.round(n).toLocaleString('en-PH'); };

  /* ---------------- Nav state ---------------- */
  var nav = document.getElementById('nav');
  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------- Hero video ---------------- */
  var layers = { night: document.querySelector('.hero__layer--night'), day: document.querySelector('.hero__layer--day') };
  var videos = { night: layers.night.querySelector('video'), day: layers.day.querySelector('video') };
  var pauseBtn = document.getElementById('videoPause');
  var userPaused = false;
  var videoAllowed = function () { return !reduceMQ.matches && !slowNet; };

  function loadVideo(v) {
    if (!videoAllowed() || v.getAttribute('src')) return;
    v.addEventListener('playing', function () { v.classList.add('is-ready'); }, { once: true });
    v.src = v.dataset.src;
    v.load();
  }
  function playActive() {
    var mode = currentTheme();
    ['night', 'day'].forEach(function (k) {
      var v = videos[k];
      if (!v.getAttribute('src')) return;
      if (k === mode && !userPaused && videoAllowed()) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else if (k !== mode) {
        // let the outgoing video keep playing through the crossfade, then pause it
        setTimeout(function () { if (currentTheme() !== k) v.pause(); }, 2300);
      }
    });
  }

  if (videoAllowed()) {
    pauseBtn.hidden = false;
    // Load the active video first, then the other one once the page is idle
    loadVideo(videos[store('tala-theme') === 'day' ? 'day' : 'night']);
    window.addEventListener('load', function () {
      var idle = window.requestIdleCallback || function (fn) { setTimeout(fn, 1500); };
      idle(function () { loadVideo(videos.night); loadVideo(videos.day); playActive(); });
    });
    // Pause video when the hero is off-screen (saves battery)
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) playActive();
          else { videos.night.pause(); videos.day.pause(); }
        });
      }, { threshold: 0.05 }).observe(document.querySelector('.hero'));
    }
  }
  pauseBtn.addEventListener('click', function () {
    userPaused = !userPaused;
    pauseBtn.classList.toggle('is-paused', userPaused);
    pauseBtn.setAttribute('aria-label', userPaused ? 'Play background video' : 'Pause background video');
    if (userPaused) { videos.night.pause(); videos.day.pause(); } else playActive();
  });
  reduceMQ.addEventListener && reduceMQ.addEventListener('change', function () {
    if (reduceMQ.matches) { videos.night.pause(); videos.day.pause(); pauseBtn.hidden = true; }
  });

  /* ---------------- Day / Night theme ---------------- */
  var toggle = document.getElementById('themeToggle');
  var metaTheme = document.querySelector('meta[name="theme-color"]');
  function currentTheme() { return root.getAttribute('data-theme') === 'day' ? 'day' : 'night'; }
  function setTheme(mode, save) {
    root.setAttribute('data-theme', mode);
    layers.night.classList.toggle('is-active', mode === 'night');
    layers.day.classList.toggle('is-active', mode === 'day');
    toggle.setAttribute('aria-pressed', String(mode === 'day'));
    toggle.setAttribute('aria-label', mode === 'day' ? 'Switch to night mode' : 'Switch to day mode');
    metaTheme.setAttribute('content', mode === 'day' ? '#fbf1e5' : '#070b24');
    if (save) store('tala-theme', mode);
    loadVideo(videos[mode]);
    playActive();
  }
  toggle.addEventListener('click', function () { setTheme(currentTheme() === 'day' ? 'night' : 'day', true); });
  setTheme(store('tala-theme') === 'day' ? 'day' : 'night', false);

  /* ---------------- Reveal on scroll ---------------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMQ.matches) {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var sibs = Array.prototype.indexOf.call(e.target.parentNode.children, e.target);
        e.target.style.transitionDelay = Math.min(sibs, 4) * 0.12 + 's';
        e.target.classList.add('in');
        ro.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { ro.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }
  // clear stagger delay after reveal so hover transitions stay snappy
  document.addEventListener('transitionend', function (e) {
    if (e.target.classList && e.target.classList.contains('reveal') && e.propertyName === 'opacity') e.target.style.transitionDelay = '';
  });

  /* ---------------- Gentle parallax on experience images ---------------- */
  var expBgs = document.querySelectorAll('.exp__bg');
  if (!reduceMQ.matches && expBgs.length) {
    var ticking = false;
    var para = function () {
      var vh = window.innerHeight;
      expBgs.forEach(function (img) {
        var r = img.parentNode.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh; // -1..1
        img.style.transform = 'translate3d(0,' + (-7 - p * 7).toFixed(2) + '%,0)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(para); } }, { passive: true });
    para();
  }

  /* ---------------- Twinkling stars ---------------- */
  function starfield(canvas) {
    var ctx = canvas.getContext('2d');
    var stars = [], w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), running = false, raf = 0;
    function size() {
      var r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.min(220, Math.round(w * h / 6500));
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w, y: Math.random() * h,
          r: Math.random() < 0.08 ? 1.3 + Math.random() * 0.9 : 0.4 + Math.random() * 0.8,
          a: 0.25 + Math.random() * 0.6,
          s: 0.4 + Math.random() * 1.4,
          o: Math.random() * Math.PI * 2,
          dy: 0.02 + Math.random() * 0.05
        });
      }
    }
    function draw(t) {
      var rgb = getComputedStyle(root).getPropertyValue('--star').trim() || '255,246,225';
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var tw = 0.55 + 0.45 * Math.sin(t / 1000 * s.s + s.o);
        s.y -= s.dy; if (s.y < -2) s.y = h + 2;
        ctx.globalAlpha = s.a * tw;
        ctx.fillStyle = 'rgb(' + rgb + ')';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        if (s.r > 1.3) { // soft glow for bright stars
          ctx.globalAlpha = s.a * tw * 0.18;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (running) raf = requestAnimationFrame(draw);
    }
    function start() { if (running || reduceMQ.matches) return; running = true; raf = requestAnimationFrame(draw); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    size();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 200); });
    new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? start() : stop(); }); }).observe(canvas);
    reduceMQ.addEventListener && reduceMQ.addEventListener('change', function () { if (reduceMQ.matches) { stop(); ctx.clearRect(0, 0, w, h); } });
  }
  if (!reduceMQ.matches && 'IntersectionObserver' in window) {
    document.querySelectorAll('canvas.stars').forEach(starfield);
  }

  /* ---------------- Date helpers (UTC to avoid timezone drift) ---------------- */
  function toISO(d) { return d.toISOString().slice(0, 10); }
  function parseISO(s) { if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null; var p = s.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function addDays(d, n) { var c = new Date(d); c.setUTCDate(c.getUTCDate() + n); return c; }
  function fmtDate(s) { var d = parseISO(s); return d ? d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : s; }
  var now = new Date();
  var today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  /* ---------------- Stay estimator ---------------- */
  var estForm = document.getElementById('estForm');
  var estIn = document.getElementById('estIn');
  var estOut = document.getElementById('estOut');
  var guestOut = document.getElementById('estGuests');
  var guestHint = document.getElementById('guestHint');
  var stepBtns = estForm.querySelectorAll('.stepper__btn');
  var sumStay = document.getElementById('sumStay');
  var sumLines = document.getElementById('sumLines');
  var sumTotal = document.getElementById('sumTotal');
  var estError = document.getElementById('estError');
  var bookThis = document.getElementById('bookThis');
  var guests = 2;
  var lastTotal = null;
  var state = null;

  estIn.min = toISO(today);
  estIn.value = toISO(addDays(today, 7));
  estOut.value = toISO(addDays(today, 9));
  estOut.min = toISO(addDays(today, 8));

  function selectedStay() { return estForm.querySelector('input[name="stay"]:checked').value; }
  function selectedAddons() { return Array.prototype.map.call(estForm.querySelectorAll('input[name="addon"]:checked'), function (i) { return i.value; }); }

  function calc() {
    var key = selectedStay();
    var stay = STAYS[key];
    // clamp guests to the stay's max
    if (guests > stay.max) guests = stay.max;
    if (guests < 1) guests = 1;
    guestOut.textContent = guests;
    stepBtns[0].disabled = guests <= 1;
    stepBtns[1].disabled = guests >= stay.max;
    guestHint.textContent = stay.name + ' includes ' + stay.base + ' guest' + (stay.base > 1 ? 's' : '') + ' · maximum ' + stay.max;

    var din = parseISO(estIn.value), dout = parseISO(estOut.value);
    if (din) estOut.min = toISO(addDays(din, 1));
    var nights = din && dout ? Math.round((dout - din) / 864e5) : 0;

    var err = '';
    if (!din || !dout) err = 'Pick a check-in and check-out date.';
    else if (din < today) err = 'Check-in can’t be in the past.';
    else if (nights < 1) err = 'Check-out must be at least one night after check-in.';
    else if (nights > MAX_NIGHTS) err = 'For stays longer than ' + MAX_NIGHTS + ' nights, send an inquiry and we’ll quote you directly.';

    estError.hidden = !err;
    estError.textContent = err;
    bookThis.disabled = !!err;
    sumLines.innerHTML = '';

    if (err) {
      sumStay.textContent = stay.name;
      sumTotal.textContent = '—';
      state = null;
      return;
    }

    var lines = [];
    lines.push([stay.name, peso(stay.rate) + ' × ' + nights + ' night' + (nights > 1 ? 's' : ''), stay.rate * nights]);
    var extra = Math.max(0, guests - stay.base);
    if (extra) lines.push(['Extra guest' + (extra > 1 ? 's' : ''), extra + ' × ' + peso(EXTRA_GUEST) + ' × ' + nights + ' night' + (nights > 1 ? 's' : ''), extra * EXTRA_GUEST * nights]);

    var addons = selectedAddons();
    addons.forEach(function (k) {
      var a = ADDONS[k], qty, detail;
      if (a.unit === 'night') { qty = nights; detail = peso(a.rate) + ' × ' + nights + ' night' + (nights > 1 ? 's' : ''); }
      else if (a.unit === 'guestNight') { qty = guests * nights; detail = guests + ' guest' + (guests > 1 ? 's' : '') + ' × ' + nights + ' morning' + (nights > 1 ? 's' : '') + ' × ' + peso(a.rate); }
      else { qty = guests; detail = guests + ' guest' + (guests > 1 ? 's' : '') + ' × ' + peso(a.rate); }
      lines.push([a.name, detail, a.rate * qty]);
    });

    var total = lines.reduce(function (s, l) { return s + l[2]; }, 0);

    lines.forEach(function (l) {
      var li = document.createElement('li');
      var left = document.createElement('span');
      left.textContent = l[0];
      var small = document.createElement('small');
      small.textContent = l[1];
      left.appendChild(small);
      var right = document.createElement('span');
      right.textContent = peso(l[2]);
      li.appendChild(left); li.appendChild(right);
      sumLines.appendChild(li);
    });

    sumStay.textContent = stay.name + ' · ' + nights + ' night' + (nights > 1 ? 's' : '') + ' · ' + guests + ' guest' + (guests > 1 ? 's' : '');
    sumTotal.textContent = peso(total);
    if (lastTotal !== null && lastTotal !== total) {
      sumTotal.classList.remove('bump'); void sumTotal.offsetWidth; sumTotal.classList.add('bump');
    }
    lastTotal = total;

    state = { stay: key, checkin: estIn.value, checkout: estOut.value, nights: nights, guests: guests, addons: addons, total: total };
  }

  estForm.addEventListener('change', calc);
  estForm.addEventListener('input', calc);
  estIn.addEventListener('change', function () {
    // keep check-out after check-in automatically
    var din = parseISO(estIn.value), dout = parseISO(estOut.value);
    if (din && (!dout || dout <= din)) { estOut.value = toISO(addDays(din, 1)); calc(); }
  });
  stepBtns.forEach(function (b) {
    b.addEventListener('click', function () { guests += +b.dataset.step; calc(); });
  });
  estForm.addEventListener('submit', function (e) { e.preventDefault(); });

  // "Estimate this stay" buttons on stay cards
  document.querySelectorAll('[data-pick]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var r = estForm.querySelector('input[name="stay"][value="' + btn.dataset.pick + '"]');
      r.checked = true;
      calc();
      document.getElementById('estimate').scrollIntoView({ behavior: reduceMQ.matches ? 'auto' : 'smooth' });
      setTimeout(function () { r.focus({ preventScroll: true }); }, 700);
    });
  });

  calc();

  /* ---------------- Book this stay → booking form ---------------- */
  var bookForm = document.getElementById('bookForm');
  var f = {
    name: document.getElementById('fName'), stay: document.getElementById('fStay'),
    inD: document.getElementById('fIn'), outD: document.getElementById('fOut'),
    guests: document.getElementById('fGuests'), notes: document.getElementById('fNotes')
  };
  var prefillNote = document.getElementById('prefillNote');
  var formDone = document.getElementById('formDone');
  f.inD.min = toISO(today);

  function syncGuestMax() { f.guests.max = STAYS[f.stay.value].max; }
  f.stay.addEventListener('change', syncGuestMax);
  syncGuestMax();

  bookThis.addEventListener('click', function () {
    if (!state) return;
    f.stay.value = state.stay;
    syncGuestMax();
    f.inD.value = state.checkin;
    f.outD.value = state.checkout;
    f.guests.value = state.guests;
    var addonNames = state.addons.map(function (k) { return ADDONS[k].name; });
    f.notes.value =
      'From the stay estimator:\n' +
      '• ' + STAYS[state.stay].name + ', ' + fmtDate(state.checkin) + ' → ' + fmtDate(state.checkout) + ' (' + state.nights + ' night' + (state.nights > 1 ? 's' : '') + ')\n' +
      '• ' + state.guests + ' guest' + (state.guests > 1 ? 's' : '') + '\n' +
      '• Add-ons: ' + (addonNames.length ? addonNames.join(', ') : 'none') + '\n' +
      '• Estimated total: ' + peso(state.total);
    prefillNote.hidden = false;
    formDone.hidden = true;
    document.getElementById('book').scrollIntoView({ behavior: reduceMQ.matches ? 'auto' : 'smooth' });
    setTimeout(function () { f.name.focus({ preventScroll: true }); }, 800);
  });

  /* ---------------- Booking inquiry (demo only) ---------------- */
  function checkDates() {
    var din = parseISO(f.inD.value), dout = parseISO(f.outD.value);
    f.outD.setCustomValidity(din && dout && dout <= din ? 'Check-out must be after check-in.' : '');
  }
  f.inD.addEventListener('change', checkDates);
  f.outD.addEventListener('change', checkDates);

  bookForm.addEventListener('submit', function (e) {
    e.preventDefault();
    checkDates();
    bookForm.classList.add('was-validated');
    if (!bookForm.checkValidity()) {
      bookForm.reportValidity();
      return;
    }
    // Portfolio demo: nothing is sent anywhere.
    formDone.hidden = false;
    formDone.scrollIntoView({ behavior: reduceMQ.matches ? 'auto' : 'smooth', block: 'nearest' });
  });

  /* ---------------- FAQ accordion ---------------- */
  document.querySelectorAll('.qa__q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.qa');
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      item.classList.toggle('is-open', !open);
    });
  });
})();
