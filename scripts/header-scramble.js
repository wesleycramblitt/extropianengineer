
// ── Register GSAP plugins once the DOM is ready ────────────────────
// (MotionPathHelper and others need the document body to exist.)
document.addEventListener('DOMContentLoaded', function () {
    gsap.registerPlugin(
        Draggable, DrawSVGPlugin, EaselPlugin, Flip, GSDevTools,
        InertiaPlugin, MotionPathHelper, MotionPathPlugin, MorphSVGPlugin,
        Observer, Physics2DPlugin, PhysicsPropsPlugin, PixiPlugin,
        ScrambleTextPlugin, ScrollTrigger, ScrollSmoother, ScrollToPlugin,
        SplitText, TextPlugin, RoughEase, ExpoScaleEase, SlowMo,
        CustomEase, CustomBounce, CustomWiggle
    );

    // Defer scramble until loading screen is gone (if one exists).
    if (document.getElementById('loading-screen')) {
        document.addEventListener('loading-screen-done', startScramble, { once: true });
    } else {
        startScramble();
    }
});

// ── Scramble hero text ─────────────────────────────────────────────
function startScramble() {
    gsap.to(document.getElementById('hero'),  { duration: 1, scrambleText: 'Wes Cramblitt' });
    gsap.to(document.getElementById('hero2'), { duration: 1, scrambleText: 'Turning complex models into fast, interactive engineering systems.' });
}
