(function () {
  const MOBILE_MAX = 682;
  const TABLET_MAX = 1050;

  const existenceCache = new Map(); // url -> true/false

  function getVariantSuffix() {
    const w = window.innerWidth;
    if (w <= MOBILE_MAX) return "-mobile";
    if (w <= TABLET_MAX) return "-tablet";
    return "";
  }

  function buildResponsiveSrc(originalSrc, suffix) {
    const match = originalSrc.match(/^([^?#]+?)(\.[^./?#]+)(\?[^#]*)?(#.*)?$/);
    if (!match) return originalSrc;

    const [, pathWithoutExt, ext, query = "", hash = ""] = match;
    return `${pathWithoutExt}${suffix}${ext}${query}${hash}`;
  }

  async function urlExists(url) {
    if (existenceCache.has(url)) return existenceCache.get(url);

    try {
      const res = await fetch(url, { method: "HEAD" });
      const ok = res.ok;
      existenceCache.set(url, ok);
      return ok;
    } catch {
      existenceCache.set(url, false);
      return false;
    }
  }

  async function updateVideo(video) {
    const originalSrc =
      video.dataset.baseSrc ||
      video.getAttribute("src") ||
      video.currentSrc;

    if (!originalSrc) return;

    if (!video.dataset.baseSrc) {
      video.dataset.baseSrc = originalSrc;
    }

    const suffix = getVariantSuffix();

    // Desktop → always use base
    if (!suffix) {
      if (video.getAttribute("src") !== video.dataset.baseSrc) {
        swapVideo(video, video.dataset.baseSrc);
      }
      return;
    }

    const candidate = buildResponsiveSrc(video.dataset.baseSrc, suffix);

    const exists = await urlExists(candidate);

    const finalSrc = exists ? candidate : video.dataset.baseSrc;

    if (video.getAttribute("src") === finalSrc) return;

    swapVideo(video, finalSrc);
  }

  function swapVideo(video, newSrc) {
    const wasPlaying = !video.paused && !video.ended && video.readyState > 2;
    const currentTime = video.currentTime || 0;

    video.setAttribute("src", newSrc);
    video.load();

    video.addEventListener(
      "loadedmetadata",
      function restore() {
        try {
          if (currentTime && isFinite(currentTime)) {
            video.currentTime = Math.min(currentTime, video.duration || currentTime);
          }
        } catch (_) {}

        if (wasPlaying) {
          video.play().catch(() => {});
        }
      },
      { once: true }
    );
  }

  async function updateAllVideos() {
    const videos = document.querySelectorAll("video[src]");
    await Promise.all([...videos].map(updateVideo));
  }

  let resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateAllVideos, 150);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateAllVideos);
  } else {
    updateAllVideos();
  }

  window.addEventListener("resize", onResize);
})();
