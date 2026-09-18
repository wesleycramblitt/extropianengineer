/* Auto-discover gallery assets from img/<slug>/ and vid/<slug>/ folders.
   Returns { [slug]: [ {type, src, poster?, caption} ] }
   - Images/GIFs in img/<slug>/ -> type: "image"
   - Videos in vid/<slug>/       -> type: "video" (poster: img/<slug>/<video-stem>.jpg
                                   or, as fallback, the shared img/posters/<video-stem>.jpg)
   - Sorted alphabetically by filename
   - Caption derived from filename stem (kebab/snake -> Title Case)
   - Manual `gallery` in products.json takes precedence if present. */
const fs = require("fs");
const path = require("path");

function slugifyStem(stem) {
  return stem
    .replace(/^[0-9]+[-_]/, "")
    .replace(/[-_]/g, " ")
    .replace(/([a-zA-Z])(\d+)$/, "$1 $2") // "render2" -> "Render 2"
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function discoverGallery() {
  const imgRoot = path.resolve(__dirname, "../../img");
  const vidRoot = path.resolve(__dirname, "../../vid");
  const gallery = {};

  // Discover image frames
  if (fs.existsSync(imgRoot)) {
    const slugs = fs.readdirSync(imgRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .filter((s) => !["icons", "posters"].includes(s));

    for (const slug of slugs) {
      const slugDir = path.join(imgRoot, slug);
      const frames = [];

      // Images/GIFs. Prefer SVG over a same-stem raster (dependency-graph.svg
      // wins over dependency-graph.png) so vector posters are the primary frame.
      const imgFiles = fs.readdirSync(slugDir)
        .filter((f) => /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f))
        .sort();

      const byStem = {};
      for (const file of imgFiles) {
        const ext = path.extname(file).toLowerCase();
        const stem = path.parse(file).name;
        const prev = byStem[stem];
        // SVG outranks all rasters; otherwise first (alphabetical) wins.
        if (!prev || (ext === ".svg" && prev.ext !== ".svg")) {
          byStem[stem] = { file, ext };
        }
      }

      for (const stem of Object.keys(byStem).sort()) {
        const { file } = byStem[stem];
        frames.push({
          type: "image",
          src: `/img/${slug}/${file}`,
          caption: slugifyStem(stem),
        });
      }

      if (frames.length) gallery[slug] = frames;
    }
  }

  // Discover videos + posters
  if (fs.existsSync(vidRoot)) {
    const slugs = fs.readdirSync(vidRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const slug of slugs) {
      const slugDir = path.join(vidRoot, slug);
      const vidFiles = fs.readdirSync(slugDir)
        .filter((f) => /\.(webm|mp4|mov)$/i.test(f))
        .sort();

      for (const file of vidFiles) {
        const stem = path.parse(file).name;
        const posterPath = `/img/${slug}/${stem}.jpg`;
        const absPoster = path.join(imgRoot, slug, `${stem}.jpg`);
        const sharedPosterPath = `/img/posters/${stem}.jpg`;
        const absSharedPoster = path.join(imgRoot, "posters", `${stem}.jpg`);

        const frame = {
          type: "video",
          src: `/vid/${slug}/${file}`,
          caption: slugifyStem(stem),
        };
        if (fs.existsSync(absPoster)) frame.poster = posterPath;
        else if (fs.existsSync(absSharedPoster)) frame.poster = sharedPosterPath;

        if (!gallery[slug]) gallery[slug] = [];
        gallery[slug].push(frame);
      }
    }
  }

  return gallery;
}

module.exports = discoverGallery();