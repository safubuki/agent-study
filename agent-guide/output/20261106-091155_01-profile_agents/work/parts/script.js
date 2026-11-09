/* script.js : 山田 太郎 自己紹介ページ
 * JS のみ。外部ライブラリなし。body 末尾で実行される前提。
 * 要素は spec.md 3章の id / class / data 属性だけを使う。
 */
(function () {
  "use strict";

  var doc = document;
  var html = doc.documentElement;
  var body = doc.body;

  // 1. <html> に js クラスを最初に付与
  html.classList.add("js");

  // ---------- 共通ユーティリティ ----------
  var hasIO = typeof window.IntersectionObserver === "function";

  var reduceMotion = false;
  try {
    reduceMotion = !!(window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  } catch (e) {
    reduceMotion = false;
  }

  var raf = window.requestAnimationFrame
    ? function (cb) { return window.requestAnimationFrame(cb); }
    : function (cb) { return window.setTimeout(function () { cb(Date.now()); }, 16); };

  function getScrollY() {
    return window.pageYOffset || html.scrollTop || body.scrollTop || 0;
  }

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null; // file:// などで使えない環境
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      // 保存できなくても動作は継続
    }
  }

  // ---------- 2. テーマ切替 ----------
  var toggle = doc.getElementById("theme-toggle");

  function applyTheme(theme) {
    var dark = theme === "dark";
    html.setAttribute("data-theme", dark ? "dark" : "light");
    if (!toggle) return;
    toggle.setAttribute("aria-pressed", dark ? "true" : "false");
    toggle.setAttribute("aria-label", dark ? "ライトモードに切り替え" : "ダークモードに切り替え");
    var icon = toggle.querySelector(".theme-toggle-icon");
    if (icon) icon.textContent = dark ? "☀" : "☾";
  }

  function initTheme() {
    var saved = storageGet("theme");
    var theme;
    if (saved === "light" || saved === "dark") {
      theme = saved;
    } else {
      var prefersDark = false;
      try {
        prefersDark = !!(window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      } catch (e) {
        prefersDark = false;
      }
      theme = prefersDark ? "dark" : "light";
    }
    applyTheme(theme);
  }

  initTheme();

  if (toggle) {
    toggle.addEventListener("click", function () {
      var current = html.getAttribute("data-theme") === "dark" ? "dark" : "light";
      var next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      storageSet("theme", next);
    });
  }

  // ---------- 3. ヘッダー is-scrolled ----------
  var header = doc.getElementById("site-header");

  function updateHeader() {
    if (!header) return;
    if (getScrollY() > 10) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }

  // ---------- 4. ナビ現在地 ----------
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll(".nav-link"));
  var sections = Array.prototype.slice.call(doc.querySelectorAll("main > section[id]"));
  var inView = {};        // セクション id -> 画面中央付近に入っているか
  var currentActive = null;

  function setActive(id) {
    if (id === currentActive) return;
    currentActive = id;
    navLinks.forEach(function (link) {
      var isCurrent = id !== null && link.getAttribute("href") === "#" + id;
      if (isCurrent) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "true");
      } else {
        link.classList.remove("is-active");
        link.removeAttribute("aria-current");
      }
    });
  }

  // IO 非対応時用：中央の帯に入っているセクションを幾何で判定
  function measureInView() {
    var mid = window.innerHeight / 2;
    sections.forEach(function (sec) {
      var r = sec.getBoundingClientRect();
      inView[sec.id] = r.top <= mid && r.bottom >= mid;
    });
  }

  function evaluateActive() {
    if (!sections.length) return;
    if (!hasIO) measureInView();

    var docHeight = html.scrollHeight;
    var atBottom = docHeight > window.innerHeight + 4 &&
      getScrollY() + window.innerHeight >= docHeight - 4;

    var id = null;
    if (atBottom) {
      // 最下部では短い末尾セクションが中央に来ないため最後のセクションを採用
      id = sections[sections.length - 1].id;
    } else {
      for (var i = 0; i < sections.length; i++) {
        if (inView[sections[i].id]) {
          id = sections[i].id;
          break;
        }
      }
    }
    if (id === "hero") id = null; // #hero では強調しない
    setActive(id);
  }

  if (hasIO && sections.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        inView[entry.target.id] = entry.isIntersecting;
      });
      evaluateActive();
    }, { root: null, rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    sections.forEach(function (sec) { navObserver.observe(sec); });
  }

  // ---------- 5. .reveal のふわっと表示 ----------
  var reveals = Array.prototype.slice.call(doc.querySelectorAll(".reveal"));

  if (hasIO) {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // ---------- 共通：1回だけ、画面に入ったら callback ----------
  function onceWhenVisible(el, threshold, callback) {
    if (!el) return;
    if (!hasIO) {
      callback(el);
      return;
    }
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          obs.unobserve(entry.target);
          callback(entry.target);
        }
      });
    }, { threshold: threshold });
    io.observe(el);
  }

  // ---------- 6. タイプライター ----------
  var typeEl = doc.getElementById("typewriter");

  function startTypewriter() {
    if (!typeEl) return;
    var text = typeEl.getAttribute("data-text") || "";

    if (reduceMotion) {
      typeEl.textContent = text;
      typeEl.classList.add("is-done");
      return;
    }

    var chars = Array.prototype.slice.call(text); // コードポイント単位
    var i = 0;
    typeEl.textContent = "";

    function step() {
      if (i < chars.length) {
        i++;
        typeEl.textContent = chars.slice(0, i).join("");
        window.setTimeout(step, 90);
      } else {
        typeEl.classList.add("is-done");
      }
    }

    window.setTimeout(step, 600);
  }

  // ---------- 7. カウントアップ ----------
  var countEl = doc.getElementById("mountain-count");

  function countUp(el) {
    var target = parseInt(el.getAttribute("data-target"), 10);
    if (isNaN(target)) target = 0;

    if (reduceMotion) {
      el.textContent = String(target);
      return;
    }

    var duration = 1600;
    var start = null;
    el.textContent = "0";

    function frame(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3); // easeOut (cubic)
      if (t < 1) {
        el.textContent = String(Math.round(target * eased));
        raf(frame);
      } else {
        el.textContent = String(target);
      }
    }

    raf(frame);
  }

  onceWhenVisible(countEl, 0.5, countUp);

  // ---------- 8. スキルバー ----------
  var skillList = doc.getElementById("skill-list");

  function fillSkills(list) {
    var fills = list.querySelectorAll(".skill-bar-fill");
    Array.prototype.forEach.call(fills, function (fill, i) {
      var level = fill.getAttribute("data-level") || "0";
      fill.style.transitionDelay = reduceMotion ? "0ms" : (i * 150) + "ms";
      fill.style.width = level + "%";
    });
  }

  onceWhenVisible(skillList, 0.3, fillSkills);

  // ---------- 9. ライトボックス ----------
  var lightbox = doc.getElementById("lightbox");
  var lbArt = doc.getElementById("lightbox-art");
  var lbTitle = doc.getElementById("lightbox-title");
  var lbMeta = doc.getElementById("lightbox-meta");
  var lbDesc = doc.getElementById("lightbox-desc");
  var lbClose = doc.getElementById("lightbox-close");
  var lbOpen = false;
  var lastTrigger = null;
  var closeTimer = null;

  function openLightbox(card) {
    if (!lightbox || lbOpen) return;
    lbOpen = true;
    lastTrigger = card;

    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }

    var num = card.getAttribute("data-mountain");
    var name = card.querySelector(".gallery-name");
    var meta = card.querySelector(".gallery-meta");

    if (lbArt) lbArt.className = "lightbox-art mountain-" + num;
    if (lbTitle) lbTitle.textContent = name ? name.textContent : "";
    if (lbMeta) lbMeta.textContent = meta ? meta.textContent : "";
    if (lbDesc) lbDesc.textContent = card.getAttribute("data-desc") || "";

    lightbox.hidden = false;
    body.classList.add("is-locked");

    // 次フレームで is-open を付与（フェード用）
    raf(function () {
      if (lbOpen) lightbox.classList.add("is-open");
    });

    if (lbClose) lbClose.focus();
  }

  function closeLightbox() {
    if (!lightbox || !lbOpen) return;
    lbOpen = false;

    lightbox.classList.remove("is-open");
    body.classList.remove("is-locked");

    var finish = function () {
      closeTimer = null;
      if (!lbOpen) lightbox.hidden = true;
      if (lastTrigger && typeof lastTrigger.focus === "function") {
        lastTrigger.focus();
      }
    };

    if (reduceMotion) {
      finish();
    } else {
      closeTimer = window.setTimeout(finish, 250);
    }
  }

  function getFocusable() {
    return Array.prototype.filter.call(
      lightbox.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
      function (el) { return !el.disabled && !el.hidden; }
    );
  }

  Array.prototype.forEach.call(doc.querySelectorAll(".gallery-card"), function (card) {
    card.addEventListener("click", function () { openLightbox(card); });
  });

  if (lightbox) {
    // [data-close]（backdrop・閉じるボタン）クリックで閉じる
    lightbox.addEventListener("click", function (e) {
      if (e.target && e.target.closest && e.target.closest("[data-close]")) {
        closeLightbox();
      }
    });

    doc.addEventListener("keydown", function (e) {
      if (!lbOpen) return;

      if (e.key === "Escape" || e.key === "Esc") {
        e.preventDefault();
        closeLightbox();
        return;
      }

      if (e.key === "Tab") {
        var items = getFocusable();
        if (!items.length) {
          e.preventDefault();
          return;
        }
        var first = items[0];
        var last = items[items.length - 1];
        var active = doc.activeElement;
        var inside = lightbox.contains(active);

        if (e.shiftKey) {
          if (!inside || active === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (!inside || active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });

    // 開いている間はフォーカスをライトボックス外に出さない
    doc.addEventListener("focusin", function (e) {
      if (lbOpen && !lightbox.contains(e.target) && lbClose) {
        lbClose.focus();
      }
    });
  }

  // ---------- スクロール / リサイズ ----------
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    raf(function () {
      ticking = false;
      updateHeader();
      evaluateActive();
    });
  }

  // ---------- 初期化 ----------
  updateHeader();
  evaluateActive();
  startTypewriter();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
})();
