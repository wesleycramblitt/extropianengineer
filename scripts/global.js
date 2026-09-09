/* Shared behavior for the multi-page site.
   - nav / footer year
   - scramble-text accent over REAL markup text (H1s stay crawlable)
   Loaded on every page after page-specific scripts (e.g. GSAP). */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    // Footer year
    document.querySelectorAll(".js-year").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });

    // Scramble accent — only if GSAP + ScrambleText are present.
    // The element's final text is already in the markup (SEO/a11y safe):
    // this animates the reveal.
    var els = document.querySelectorAll("[data-scramble]");
    if (els.length && window.gsap && window.ScrambleText) {
      gsap.registerPlugin(ScrambleText);
      els.forEach(function (el) {
        if (el.dataset.scrambled) return;
        el.dataset.scrambled = "1";
        var final = el.getAttribute("data-scramble") || el.textContent.trim();
        gsap.to(el, {
          duration: 1.1,
          ease: "power2.out",
          delay: 0.25,
          scrambleText: { text: final, chars: "upperAndLowerCase", speed: 0.6 }
        });
      });
    }
  });
})();
