/**
 * Loading screen — shows immediately (CSS), hides when ready.
 *
 * Wrapped in DOMContentLoaded because this script runs in <head>
 * before the #loading-screen element exists in the DOM.
 *
 * Triggers (whichever fires first):
 *   1. window.load         — all assets finished.
 *   2. Fallback timer       — 4 s after DOMContentLoaded.
 *   3. Safety timeout       — 8 s after DOMContentLoaded.
 */
document.addEventListener('DOMContentLoaded', function () {
    var screen = document.getElementById('loading-screen');
    if (!screen) return;

    var done = false;

    function hide() {
        if (done) return;
        done = true;

        if (typeof gsap !== 'undefined') {
            gsap.to(screen, {
                opacity: 0,
                duration: 0.55,
                ease: 'power2.inOut',
                onComplete: remove,
            });
        } else {
            remove();
        }
    }

    function remove() {
        if (screen.parentNode) screen.remove();
        document.dispatchEvent(new CustomEvent('loading-screen-done'));
    }

    // ── primary: window.load ─────────────────────────────────────
    window.addEventListener('load', function () {
        setTimeout(hide, 150);
    });

    // ── fallback: force-hide 4 s after DOM ready ──────────────────
    setTimeout(function () {
        if (!done) hide();
    }, 4000);

    // ── safety: absolute deadline 8 s after DOM ready ────────────
    setTimeout(function () {
        if (!done) hide();
    }, 8000);
});
