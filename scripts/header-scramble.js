
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
});

// ── Scramble hero text — deferred until loading screen is gone ─────
function startScramble() {
    gsap.to(document.getElementById('hero'),  { duration: 1, scrambleText: 'Wes Cramblitt' });
    gsap.to(document.getElementById('hero2'), { duration: 1, scrambleText: 'Scientific Software Engineer' });
    gsap.to(document.getElementById('hero3'), { duration: 1, scrambleText: 'C++ | OpenGL | Javascript | Python' });
}

if (document.getElementById('loading-screen')) {
    document.addEventListener('loading-screen-done', startScramble, { once: true });
} else {
    // No loading screen — run on DOMContentLoaded as before.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startScramble, { once: true });
    } else {
        startScramble();
    }
}
