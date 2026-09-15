/* Auto-discover gallery assets from img/<slug>/ and vid/<slug>/ folders.
   Returns { [slug]: [ {type, src, poster?, caption} ] }
   - Images/GIFs in img/<slug>/ -> type: "image"
   - Videos in vid/<slug>/       -> type: "video" (poster: img/<slug>/<video-stem>.jpg if exists)
   - Sorted alphabetically by filename
   - Caption derived from filename stem (kebab/snake -> Title Case)
   - Manual `gallery` in products.json takes precedence if present. */
const fs = require("fs");
const path = require("path");

function slugifyStem(stem) {
  return stem
    .replace(/^[0-9]+[-_]/, "")
    .replace(/[-_]/g, " ")
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

      // Images/GIFs
      const imgFiles = fs.readdirSync(slugDir)
        .filter((f) => /\.(png|jpg|jpeg|webp|gif)$/i.test(f))
        .sort();

      for (const file of imgFiles) {
        const stem = path.parse(file).name;
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

        const frame = {
          type: "video",
          src: `/vid/${slug}/${file}`,
          caption: slugifyStem(stem),
        };
        if (fs.existsSync(absPoster)) frame.poster = posterPath;

        if (!gallery[slug]) gallery[slug] = [];
        gallery[slug].push(frame);
      }
    }
  }

  return gallery;
}

module.exports = discoverGallery();