/**
 * CanvasController – per-canvas visibility detection, pause/play, and fullscreen.
 *
 * Attaches to a <canvas> element and provides:
 *   • Default-paused — user must click the large centered ▶ to start.
 *   • Large centered play button overlay when paused.
 *   • Small top-right pause + fullscreen buttons when playing.
 *   • Automatic pause when the canvas is not visible (slider tab inactive
 *     or section scrolled out of view).
 *   • An `isPlaying` property that demos check each frame.
 *
 * Integration pattern (in each demo’s render loop):
 *
 *   const ctrl = new CanvasController(canvas);
 *
 *   function frame(time) {
 *       requestAnimationFrame(frame);
 *       if (ctrl.isPlaying) {
 *           // … sim step …
 *       }
 *       // Always render the static scene so the canvas is never blank.
 *       renderer.draw(entities);
 *   }
 */

export class CanvasController {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {object}            [opts]
     * @param {boolean}           [opts.startPaused=true]  – begin paused (default true)
     */
    constructor(canvas, opts = {}) {
        this.canvas = canvas;
        this._userPaused = opts.startPaused !== false;   // default true

        // ── internal state ───────────────────────────────────────────
        this._viewportVisible = true;
        this._articleActive    = true;
        this._callbacks        = [];
        this._lastToggle       = 0;

        // ── wrap canvas in a shell if needed ─────────────────────────
        this._wrap();

        // ── build overlay + control buttons ──────────────────────────
        this._createOverlay();
        this._createControls();

        // ── initial UI state ─────────────────────────────────────────
        this._updateUI();

        // ── visibility observers ─────────────────────────────────────
        this._setupVisibility();

        // ── fullscreen change listener ───────────────────────────────
        this._onFullscreenChange = () => {
            this._updateFullscreenIcon();
            if (!document.fullscreenElement) {
                // Force a synchronous layout so clientWidth / clientHeight
                // reflect the post-fullscreen container size.
                void this.canvas.offsetHeight;
                // Nudge the internal buffer to a valid-but-wrong size so
                // the next resizeCanvasToDisplaySize call detects a
                // mismatch and resizes to the real container dimensions.
                // (0 × 0 kills the drawing buffer; 1 × 1 keeps it alive.)
                if (this.canvas.width  !== 1) this.canvas.width  = 1;
                if (this.canvas.height !== 1) this.canvas.height = 1;
            }
        };
        document.addEventListener('fullscreenchange', this._onFullscreenChange);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Public API
    // ═══════════════════════════════════════════════════════════════════

    /** True when the demo should be running (visible AND not paused). */
    get isPlaying() {
        return !this._userPaused && this.isVisible;
    }

    /** True when the canvas is actually on-screen and its slide is active. */
    get isVisible() {
        return this._viewportVisible && this._articleActive;
    }

    /** Programmatically play (clear user pause). */
    play() {
        if (this._userPaused) {
            var now = Date.now();
            if (now - this._lastToggle < 500) return;
            this._lastToggle = now;
            this._userPaused = false;
            this._updateUI();
            this._fireCallbacks();
        }
    }

    /** Programmatically pause (set user pause). */
    pause() {
        if (!this._userPaused) {
            var now = Date.now();
            if (now - this._lastToggle < 500) return;
            this._lastToggle = now;
            this._userPaused = true;
            this._updateUI();
            this._fireCallbacks();
        }
    }

    /** Toggle user pause. */
    toggle() {
        if (this._userPaused) this.play();
        else this.pause();
    }

    /**
     * Register a callback invoked whenever `isPlaying` changes.
     * @param {(playing: boolean) => void} fn
     * @returns {() => void} deregister function
     */
    onStateChange(fn) {
        this._callbacks.push(fn);
        return () => {
            const i = this._callbacks.indexOf(fn);
            if (i !== -1) this._callbacks.splice(i, 1);
        };
    }

    /** Remove all DOM nodes, observers, and listeners created by this controller. */
    destroy() {
        if (this._viewportObserver) {
            this._viewportObserver.disconnect();
            this._viewportObserver = null;
        }
        if (this._classObserver) {
            this._classObserver.disconnect();
            this._classObserver = null;
        }
        document.removeEventListener('fullscreenchange', this._onFullscreenChange);
        if (this._overlay) this._overlay.remove();
        if (this._pauseBar) this._pauseBar.remove();
        this._overlay = null;
        this._pauseBar = null;
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Shell / DOM wrapping
    // ═══════════════════════════════════════════════════════════════════

    _wrap() {
        const canvas = this.canvas;
        const parent = canvas.parentElement;
        if (!parent) return;

        let shell = canvas.closest('.canvas-shell');
        if (!shell) {
            shell = document.createElement('div');
            shell.className = 'canvas-shell';
            Object.assign(shell.style, {
                position: 'relative',
                width: '100%',
                minHeight: '200px',
            });
            parent.insertBefore(shell, canvas);
            shell.appendChild(canvas);
        }
        this._shell = shell;
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Large centered play overlay (shown when paused)
    // ═══════════════════════════════════════════════════════════════════

    _createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'canvas-pause-overlay';
        overlay.setAttribute('data-no-drag', '');
        Object.assign(overlay.style, {
            position: 'absolute',
            inset: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
            zIndex: '500',
            cursor: 'pointer',
        });

        // Large centered play button
        const btn = document.createElement('button');
        btn.className = 'canvas-center-play-btn';
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Play');
        Object.assign(btn.style, {
            width: '5rem',
            height: '5rem',
            padding: '0',
            border: '2px solid rgba(255,255,255,0.4)',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.65)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.15s, background 0.15s',
        });
        btn.style.setProperty('pointer-events', 'auto', 'important');
        btn.style.setProperty('cursor', 'pointer', 'important');

        // CSS-border play triangle — perfectly centered in the circle.
        const tri = document.createElement('span');
        tri.setAttribute('aria-hidden', 'true');
        Object.assign(tri.style, {
            display: 'inline-block',
            width: '0',
            height: '0',
            borderTop:    '0.85rem solid transparent',
            borderBottom: '0.85rem solid transparent',
            borderLeft:   '1.4rem solid #fff',
            // Visual centre adjustment: the triangle's centroid is 1/3 from
            // the left edge, so nudge it right by ~0.15rem.
            marginLeft: '0.15rem',
        });
        btn.appendChild(tri);

        // Clicking the overlay or the button starts play.
        // Only pointerdown — no click, to avoid ghost-clicks on mobile
        // when the overlay appears under a finger lifting from the pause btn.
        const onPlay = (e) => {
            e.stopImmediatePropagation();
            this.play();
        };
        overlay.addEventListener('pointerdown', onPlay, { capture: true });
        btn.addEventListener('pointerdown',     onPlay, { capture: true });

        overlay.appendChild(btn);
        this._shell.appendChild(overlay);
        this._overlay = overlay;
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Small top-right controls (pause + fullscreen, shown when playing)
    // ═══════════════════════════════════════════════════════════════════

    _createControls() {
        // ── bar (top-right) ──────────────────────────────────────
        const bar = document.createElement('div');
        bar.className = 'canvas-controls';
        bar.setAttribute('data-no-drag', '');
        Object.assign(bar.style, {
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            display: 'flex',
            gap: '0.4rem',
        });
        bar.style.setProperty('z-index', '999', 'important');
        bar.style.setProperty('pointer-events', 'auto', 'important');

        const btnStyle = {
            width: '2.25rem',
            height: '2.25rem',
            padding: '0',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '5px',
            background: 'rgba(0,0,0,0.7)',
            color: '#eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.1rem',
            lineHeight: '1',
        };

        // ── pause button ─────────────────────────────────────────
        this._playBtn = document.createElement('button');
        this._playBtn.className = 'canvas-control-btn canvas-play-btn';
        this._playBtn.type = 'button';
        this._playBtn.title = 'Pause';
        this._playBtn.setAttribute('aria-label', 'Pause');
        Object.assign(this._playBtn.style, btnStyle);
        this._playBtn.style.setProperty('cursor', 'pointer', 'important');
        this._playBtn.style.setProperty('pointer-events', 'auto', 'important');

        // CSS-rendered pause bars (no Unicode emoji issues on mobile).
        this._pauseBars = [createBar(), createBar()];
        this._playBtn.append(this._pauseBars[0], this._pauseBars[1]);

        // Debounced handler — prevents double-fire from pointerdown + click on mobile.
        var _pauseTs = 0;
        var onPause = function (e) {
            e.stopImmediatePropagation();
            var now = Date.now();
            if (now - _pauseTs < 200) return;
            _pauseTs = now;
            this.pause();
        }.bind(this);
        this._playBtn.addEventListener('pointerdown', onPause, { capture: true });
        bar.appendChild(this._playBtn);

        // ── fullscreen button ────────────────────────────────────
        this._fsBtn = document.createElement('button');
        this._fsBtn.className = 'canvas-control-btn canvas-fs-btn';
        this._fsBtn.type = 'button';
        this._fsBtn.title = 'Fullscreen';
        this._fsBtn.setAttribute('aria-label', 'Toggle fullscreen');
        Object.assign(this._fsBtn.style, btnStyle);
        this._fsBtn.style.setProperty('cursor', 'pointer', 'important');
        this._fsBtn.style.setProperty('pointer-events', 'auto', 'important');

        var _fsTs = 0;
        var onFS = function (e) {
            e.stopImmediatePropagation();
            var now = Date.now();
            if (now - _fsTs < 200) return;
            _fsTs = now;
            this._toggleFullscreen();
        }.bind(this);
        this._fsBtn.addEventListener('pointerdown', onFS, { capture: true });
        bar.appendChild(this._fsBtn);

        this._shell.appendChild(bar);
        this._pauseBar = bar;

        this._updateFullscreenIcon();
    }

    // ═══════════════════════════════════════════════════════════════════
    //  UI state synchronisation
    // ═══════════════════════════════════════════════════════════════════

    _updateUI() {
        // Show the overlay only when the article is active AND the demo
        // is not playing.  This prevents inactive-slide overlays from
        // stacking on top of the active slide and stealing clicks.
        const showOverlay = this._articleActive && !this.isPlaying;
        if (this._overlay) {
            this._overlay.style.display = showOverlay ? 'flex' : 'none';
        }
        if (this._playBtn) {
            this._playBtn.style.display = this.isPlaying ? '' : 'none';
        }
    }

    _updateFullscreenIcon() {
        if (!this._fsBtn) return;
        var isFS = !!document.fullscreenElement;
        this._fsBtn.textContent = isFS ? '\u2715' : '\u26F6';   // ✕ / ⛶
    }

    _toggleFullscreen() {
        if (!document.fullscreenElement) {
            this._shell.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen();
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Visibility detection
    // ═══════════════════════════════════════════════════════════════════

    _setupVisibility() {
        const article = this.canvas.closest('.article');
        this._article = article;

        const viewport = article?.closest('.section-slider-viewport');
        const target = viewport || this.canvas;

        this._viewportObserver = new IntersectionObserver((entries) => {
            const wasVisible = this.isVisible;
            this._viewportVisible = entries[0].isIntersecting;
            if (wasVisible !== this.isVisible) {
                this._updateUI();
                this._fireCallbacks();
            }
        }, { threshold: 0 });

        this._viewportObserver.observe(target);

        if (article) {
            this._articleActive = article.classList.contains('is-active');

            this._classObserver = new MutationObserver(() => {
                const wasVisible = this.isVisible;
                this._articleActive = article.classList.contains('is-active');
                if (wasVisible !== this.isVisible) {
                    this._updateUI();
                    this._fireCallbacks();
                }
            });
            this._classObserver.observe(article, {
                attributes: true,
                attributeFilter: ['class'],
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Callbacks
    // ═══════════════════════════════════════════════════════════════════

    _fireCallbacks() {
        const playing = this.isPlaying;
        for (const fn of this._callbacks) {
            fn(playing);
        }
    }
}

/** A single vertical pause bar (CSS-rendered, no emoji issues). */
function createBar() {
    var bar = document.createElement('span');
    bar.setAttribute('aria-hidden', 'true');
    Object.assign(bar.style, {
        display: 'inline-block',
        width: '0.22rem',
        height: '0.9rem',
        margin: '0 0.12rem',
        background: '#eee',
        borderRadius: '1px',
    });
    return bar;
}
