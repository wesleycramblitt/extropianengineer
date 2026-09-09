/* Click-to-play video tiles (.vid-tile) — keeps heavy videos off the wire
   until requested. Used on /portfolio/ (and anywhere a tile is rendered). */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function playTile(tile) {
    if (tile._pbInited) return;
    tile._pbInited = true;

    var src = tile.getAttribute("data-src");
    if (!src) { tile._pbInited = false; return; }

    var video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.controls = true;
    if (tile.getAttribute("data-poster")) {
      video.poster = tile.getAttribute("data-poster");
    }
    video.setAttribute("src", src);
    video.load();

    // drop the poster image + play overlay so the video is the only child
    tile.innerHTML = "";
    tile.appendChild(video);
    tile.classList.add("is-playing");

    // force a style flush so the video is definitely visible before play()
    void video.offsetWidth;

    var p = video.play();
    if (p && typeof p.catch === "function") {
      p.catch(function (err) {
        // playback blocked (e.g. autoplay policy edge case): the video is
        // still in the DOM with controls, so the user can start it manually
        console.warn("vid-tile autoplay blocked:", src, err);
      });
    }
  }

  ready(function () {
    document.querySelectorAll(".vid-tile").forEach(function (tile) {
      tile.addEventListener("click", function () { playTile(tile); });
      tile.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          playTile(tile);
        }
      });
    });
  });
})();
