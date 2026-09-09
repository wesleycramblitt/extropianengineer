/* Product browser component + standalone slideshows.
   - [data-pb] browsers: category chips + text search filter the product
     list rail; the stage shows the active product with a slideshow
   - .pb-slideshow elements outside a browser (product detail pages)
     get slideshow behavior automatically
   All content is server-rendered; this script only toggles/enhances. */
(function () {
  "use strict";

  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  /* ── slideshow core ─────────────────────────────────────────────── */
  function setupSlideshow(ss) {
    if (!ss || ss._inited) return;
    ss._inited = true;

    var frames = Array.prototype.slice.call(ss.querySelectorAll(".pb-frame"));
    var dots = ss.querySelector(".pb-dots");
    var prev = ss.querySelector(".pb-prev");
    var next = ss.querySelector(".pb-next");
    var countEl = ss.querySelector(".pb-frame-count");
    var idx = 0;
    ss._idx = idx;

    if (frames.length < 2) {
      if (dots) dots.style.display = "none";
      if (prev) prev.style.display = "none";
      if (next) next.style.display = "none";
      if (countEl) countEl.textContent = "1 / 1";
    } else {
      if (dots) {
        frames.forEach(function (_, i) {
          var d = document.createElement("button");
          d.type = "button";
          d.className = "pb-dot" + (i === 0 ? " is-on" : "");
          d.setAttribute("aria-label", "Image " + (i + 1));
          d.addEventListener("click", function () { show(i); });
          dots.appendChild(d);
        });
      }
      if (countEl) countEl.textContent = "1 / " + frames.length;
    }

    function render(i) {
      idx = (i + frames.length) % frames.length;
      ss._idx = idx;
      frames.forEach(function (f, j) {
        var on = j === idx;
        f.classList.toggle("is-on", on);
        var v = f.querySelector("video");
        if (v) {
          if (on) { v.currentTime = 0; v.play().catch(function () {}); }
          else v.pause();
        }
      });
      if (dots) {
        Array.prototype.forEach.call(dots.children, function (d, j) {
          d.classList.toggle("is-on", j === idx);
        });
      }
      if (countEl) countEl.textContent = (idx + 1) + " / " + frames.length;
    }

    function show(i) { render(i); }
    function advance(dir) { render(idx + dir); }
    if (prev) prev.addEventListener("click", function () { advance(-1); });
    if (next) next.addEventListener("click", function () { advance(1); });

    var timer = null;
    function startTimer() {
      stopTimer();
      if (frames.length > 1 && !REDUCED && ss.dataset.autoplay !== "false") {
        timer = setInterval(function () {
          if (!ss._paused) advance(1);
        }, 4200);
      }
    }
    function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
    ss._startTimer = startTimer;
    ss._stopTimer = stopTimer;
    ss._show = show;

    if (ss.dataset.autoplay !== "false") {
      ss.addEventListener("pointerenter", function () { ss._paused = true; });
      ss.addEventListener("pointerleave", function () { ss._paused = false; });
      ss.addEventListener("focusin", function () { ss._paused = true; });
      ss.addEventListener("focusout", function () { ss._paused = false; });
    }

    render(0);
    if (ss.dataset.autoplay !== "false") startTimer();
  }

  /* ── product browser ────────────────────────────────────────────── */
  function initBrowser(root) {
    var panels = Array.prototype.slice.call(root.querySelectorAll(".pb-panel"));
    var items = Array.prototype.slice.call(root.querySelectorAll(".pb-item"));
    var chips = Array.prototype.slice.call(root.querySelectorAll(".pb-chip"));
    var search = root.querySelector(".pb-search");
    var countEl = root.querySelector(".pb-count");
    var active = null;
    var activeSS = null;

    function visibleList() {
      var q = (search && search.value ? search.value : "").trim().toLowerCase();
      var chip = root.querySelector(".pb-chip.is-on");
      var cat = chip ? chip.dataset.pbCat : "";
      var vis = panels.map(function (p) {
        var ok = (!cat || p.dataset.pbCat === cat) && (!q || (p.dataset.pbSearch || "").indexOf(q) > -1);
        p.classList.toggle("pb-hidden", !ok);
        return { slug: p.dataset.pbPanel, ok: ok };
      });
      items.forEach(function (b) {
        var hit = null;
        vis.forEach(function (v) { if (v.slug === b.dataset.pbSlug) hit = v; });
        var ok = hit && hit.ok;
        b.classList.toggle("pb-hidden", !ok);
      });
      var shown = vis.filter(function (v) { return v.ok; });
      if (countEl) countEl.textContent = shown.length + " / " + panels.length;
      if (active && shown.some(function (v) { return v.slug === active; })) return;
      select(shown.length ? shown[0].slug : null);
    }

    function select(slug) {
      if (activeSS) { activeSS._stopTimer(); activeSS = null; }
      active = slug;
      panels.forEach(function (p) { p.classList.toggle("is-active", p.dataset.pbPanel === slug); });
      items.forEach(function (b) {
        var on = b.dataset.pbSlug === slug;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      var p = null;
      panels.forEach(function (x) { if (x.dataset.pbPanel === slug) p = x; });
      if (p) {
        var ss = p.querySelector(".pb-slideshow");
        if (ss) { setupSlideshow(ss); ss._startTimer(); activeSS = ss; }
      }
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("is-on"); });
        chip.classList.add("is-on");
        visibleList();
      });
    });
    if (search) search.addEventListener("input", visibleList);
    items.forEach(function (b) {
      b.addEventListener("click", function () { select(b.dataset.pbSlug); });
    });

    select(panels.length ? panels[0].dataset.pbPanel : null);
  }

  ready(function () {
    document.querySelectorAll("[data-pb]").forEach(initBrowser);
    // standalone slideshows (e.g. product detail pages).
    // Browser panels are already inited above; setupSlideshow is idempotent.
    document.querySelectorAll(".pb-slideshow").forEach(function (ss) {
      setupSlideshow(ss);
    });
  });
})();
