/*
 * 山田 太郎 自己紹介ページ: 動きの担当（素の JavaScript / 外部依存なし）
 * 即時関数で包み、グローバルを汚さない。要素が無くてもエラーで止まらない。
 */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var bodyEl = doc.body;
  var hasIO = 'IntersectionObserver' in window;
  var reduceMotion = false;

  try {
    reduceMotion = !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) {
    reduceMotion = false;
  }

  var raf = window.requestAnimationFrame
    ? function (fn) { return window.requestAnimationFrame(fn); }
    : function (fn) { return window.setTimeout(function () { fn(Date.now()); }, 16); };

  // localStorage は file:// などで例外になることがあるので try/catch で包む
  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function storageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* 保存できなくても動作は続ける */ }
  }

  function qs(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function addClass(el, c) { if (el) el.classList.add(c); }
  function removeClass(el, c) { if (el) el.classList.remove(c); }

  // 一度だけ画面に入ったら cb(target) を呼ぶ（IO 非対応時は即実行）
  function whenVisibleOnce(el, options, cb) {
    if (!el) return;
    if (!hasIO) { cb(el); return; }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          obs.unobserve(entry.target);
          cb(entry.target);
        }
      });
    }, options);
    io.observe(el);
  }

  /* ---------- 1. テーマ切り替え ---------- */
  var themeBtn = doc.getElementById('theme-toggle');
  var themeIcon = qs('.theme-toggle-icon');
  var currentTheme = 'light';

  function getInitialTheme() {
    var saved = storageGet('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) { /* 判定できなければ light */ }
    return 'light';
  }

  function applyTheme(theme) {
    var isDark = theme === 'dark';
    root.setAttribute('data-theme', theme);
    if (themeIcon) {
      // ライト時は月、ダーク時は太陽
      themeIcon.textContent = isDark ? '☀️' : '🌙';
    }
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      themeBtn.setAttribute('aria-label',
        isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え');
    }
  }

  currentTheme = getInitialTheme();
  applyTheme(currentTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(currentTheme);
      storageSet('theme', currentTheme);
    });
  }

  /* ---------- 2. タイプライター ---------- */
  var typeEl = doc.getElementById('typewriter');
  if (typeEl) {
    var fullText = typeEl.getAttribute('data-text') || '';
    if (reduceMotion || !fullText) {
      typeEl.textContent = fullText;
    } else {
      typeEl.textContent = '';
      var chars = Array.from(fullText);
      var pos = 0;
      window.setTimeout(function () {
        var timer = window.setInterval(function () {
          typeEl.textContent += chars[pos];
          pos += 1;
          if (pos >= chars.length) window.clearInterval(timer);
        }, 90);
      }, 600);
    }
  }

  /* ---------- 3. スクロール出現 (.reveal) ---------- */
  function showReveal(el) { addClass(el, 'is-visible'); }

  var reveals = qsa('.reveal');
  if (reveals.length) {
    if (reduceMotion || !hasIO) {
      reveals.forEach(showReveal);
    } else {
      var revealIO = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            showReveal(entry.target);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      reveals.forEach(function (el) { revealIO.observe(el); });
    }
  }

  /* ---------- 4. カウントアップ (#mountain-counter) ---------- */
  function runCountUp(el) {
    var target = parseInt(el.getAttribute('data-target'), 10);
    if (isNaN(target)) return;
    if (reduceMotion) {
      el.textContent = String(target);
      return;
    }
    var duration = 1600;
    var startTime = null;
    function ease(t) { return 1 - Math.pow(1 - t, 3); } // easeOutCubic
    function frame(now) {
      if (startTime === null) startTime = now;
      var p = Math.min((now - startTime) / duration, 1);
      el.textContent = String(Math.round(target * ease(p)));
      if (p < 1) raf(frame);
    }
    raf(frame);
  }

  whenVisibleOnce(doc.getElementById('mountain-counter'), { threshold: 0.5 }, runCountUp);

  /* ---------- 5. スキルバー (#skills) ---------- */
  function fillSkillBars(section) {
    qsa('.skill-bar-fill', section).forEach(function (fill, i) {
      var level = parseFloat(fill.getAttribute('data-level'));
      if (isNaN(level)) return;
      var width = level + '%';
      if (reduceMotion) {
        fill.style.width = width;
      } else {
        window.setTimeout(function () { fill.style.width = width; }, i * 150);
      }
    });
  }

  whenVisibleOnce(doc.getElementById('skills'), { threshold: 0.2 }, fillSkillBars);

  /* ---------- 6. ナビの現在地強調 ---------- */
  var navLinks = qsa('.nav-link');
  var sections = qsa('section[id]');

  function setActiveNav(id) {
    navLinks.forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var on = !!id && href === '#' + id;
      if (on) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'true');
      } else {
        link.classList.remove('is-active');
        link.removeAttribute('aria-current');
      }
    });
  }

  if (navLinks.length && sections.length) {
    if (hasIO) {
      var inBand = {};
      var navIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          inBand[entry.target.id] = entry.isIntersecting;
        });
        var activeId = null;
        for (var i = 0; i < sections.length; i++) {
          if (inBand[sections[i].id]) { activeId = sections[i].id; break; }
        }
        // #hero が中央のときは id に一致する .nav-link が無いので全部外れる
        setActiveNav(activeId);
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      sections.forEach(function (sec) { navIO.observe(sec); });
    } else {
      // IO 非対応時の代替：画面中央線との交差で判定
      var updateNavByScroll = function () {
        var mid = window.innerHeight * 0.5;
        var activeId = null;
        for (var i = 0; i < sections.length; i++) {
          var r = sections[i].getBoundingClientRect();
          if (r.top <= mid && r.bottom > mid) { activeId = sections[i].id; break; }
        }
        setActiveNav(activeId);
      };
      window.addEventListener('scroll', updateNavByScroll, { passive: true });
      window.addEventListener('resize', updateNavByScroll);
      updateNavByScroll();
    }
  }

  /* ---------- 7. ヘッダーの影 (.site-header) ---------- */
  var headerEl = qs('.site-header');

  function updateHeader() {
    if (!headerEl) return;
    var y = window.scrollY || window.pageYOffset || 0;
    if (y > 10) addClass(headerEl, 'is-scrolled');
    else removeClass(headerEl, 'is-scrolled');
  }

  if (headerEl) {
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  /* ---------- 8. ライトボックス ---------- */
  var lb = doc.getElementById('lightbox');
  var lbArt = doc.getElementById('lightbox-art');
  var lbTitle = doc.getElementById('lightbox-title');
  var lbDesc = doc.getElementById('lightbox-desc');
  var lbClose = doc.getElementById('lightbox-close');
  var cards = qsa('.gallery-card');
  var lbTrigger = null;
  var lbOpen = false;
  var lbHideTimer = null;

  function getMountainClass(el) {
    var list = el.classList;
    for (var i = 0; i < list.length; i++) {
      if (/^mountain-\d+$/.test(list[i])) return list[i];
    }
    return '';
  }

  function openLightbox(card) {
    if (!lb || lbOpen) return;
    lbOpen = true;
    lbTrigger = card;
    if (lbHideTimer) {
      window.clearTimeout(lbHideTimer);
      lbHideTimer = null;
    }

    var mt = getMountainClass(card);
    if (lbTitle) lbTitle.textContent = card.getAttribute('data-title') || '';
    if (lbDesc) lbDesc.textContent = card.getAttribute('data-desc') || '';
    if (lbArt) lbArt.className = 'lightbox-art' + (mt ? ' ' + mt : '');

    // 表示 (hidden を外す) → 次フレームで is-open を付けてトランジションさせる
    lb.removeAttribute('hidden');
    addClass(bodyEl, 'is-locked');
    raf(function () {
      raf(function () {
        addClass(lb, 'is-open');
        if (lbClose) lbClose.focus();
      });
    });
  }

  function closeLightbox() {
    if (!lb || !lbOpen) return;
    lbOpen = false;
    removeClass(lb, 'is-open');
    removeClass(bodyEl, 'is-locked');

    // トランジション後に hidden を戻す
    var trigger = lbTrigger;
    lbHideTimer = window.setTimeout(function () {
      lb.setAttribute('hidden', '');
      lbHideTimer = null;
      if (trigger && typeof trigger.focus === 'function') trigger.focus();
    }, reduceMotion ? 0 : 300);
  }

  // Tab をライトボックス内に閉じ込める
  function trapFocus(e) {
    if (!lb) return;
    var focusables = qsa(
      'button:not([disabled]), a[href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      lb
    );
    if (!focusables.length) { e.preventDefault(); return; }
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    var active = doc.activeElement;
    if (e.shiftKey) {
      if (active === first || !lb.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last || !lb.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  cards.forEach(function (card) {
    card.addEventListener('click', function () { openLightbox(card); });
  });

  if (lb) {
    // [data-close="true"]（背景・×ボタン）のクリックで閉じる
    lb.addEventListener('click', function (e) {
      var t = e.target;
      if (t && typeof t.closest === 'function' && t.closest('[data-close="true"]')) {
        closeLightbox();
      }
    });
  }

  doc.addEventListener('keydown', function (e) {
    if (!lbOpen) return;
    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      closeLightbox();
    } else if (e.key === 'Tab') {
      trapFocus(e);
    }
  });

  /* ---------- 9. ダミーリンク ---------- */
  qsa('a[data-dummy="true"]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });
})();
