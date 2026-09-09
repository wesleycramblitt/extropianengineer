/* Click-to-play video tiles (.vid-tile) — keeps heavy videos off the wire
   until requested. Used on /portfolio/ (and anywhere a tile is rendered). */
(function () {
  "use strict";
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function playTile(tile) {
    if (tile.classList.contains("is-playing")) return;
    var src = tile.getAttribute("data-src");
    if (!src) return;
    var video = document.createElement("video");
    video.src = src;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.controls = true;
    tile.appendChild(video);
    tile.classList.add("is-playing");
    video.play().catch(function () {});
  }

  ready(function () {
    document.querySelectorAll(".vid-tile").forEach(function (tile) {
      tile.addEventListener("click", function () { playTile(tile); });
      tile.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); playTile(tile); }
      });
    });
  });
})();
