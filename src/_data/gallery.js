/* Auto-discover gallery assets from img/<slug>/ and vid/<slug>/ folders.
   Returns { [slug]: [ {type, src, poster?, caption} ] }
   - Images/GIFs in img/<slug>/ -> type: "image"
   - Videos in vid/<slug>/       -> type: "video" (poster: img/<slug>/<video-stem>.jpg
                                   or, as fallback, the shared img/posters/<video-stem>.jpg —
                                   auto-generated with ffmpeg at build time if neither
                                   exists; delete a poster jpg to regenerate it)
   - Order: videos FIRST, then images — each group alphabetical by filename.
     (Videos are the hero media; renaming files only reorders within a type.)
   - Caption derived from filename stem (kebab/snake -> Title Case)
   - Manual `gallery` in products.json takes precedence if present. */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function slugifyStem(stem) {
  return stem
    .replace(/^[0-9]+[-_]/, "")
    .replace(/[-_]/g, " ")
    .replace(/([a-zA-Z])(\d+)/g, "$1 $2") // "render2" -> "Render 2", "render3_x" -> "Render 3 X"
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* Best-effort poster generation: extract a non-black 1280px frame from the
   video into img/posters/<stem>.jpg via ffmpeg (preinstalled on the GitHub
   Actions runner). Runs only when no curated poster exists; failures warn
   and leave the poster empty — a missing poster never breaks the build. */
function generatePoster(videoFile, outFile) {
  try {
    const dur = Number(
      spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", videoFile], { encoding: "utf8" }).stdout.trim()
    );
    // Candidate timestamps, capped inside the video (2s, 5s, 10s, 20s)
    const cands = [2, 5, 10, 20]
      .map((t) => Math.min(t, (dur || 30) * 0.8))
      .filter((t, i, a) => t > 0.5 && a.indexOf(t) === i);
    let picked = cands[cands.length - 1] || 5;

    // Prefer the first candidate whose frame isn't near-black (intro fades skipped)
    for (const t of cands) {
      const r = spawnSync("ffmpeg", ["-v", "error", "-ss", String(t), "-i", videoFile, "-frames:v", "1", "-vf", "signalstats,metadata=print:key=lavfi.signalstats.YAVG", "-f", "null", "-"], { encoding: "utf8" });
      const out = (r.stdout || "") + (r.stderr || "");
      const m = out.match(/YAVG=([0-9.]+)/);
      if (r.status === 0 && m && Number(m[1]) > 16) { picked = t; break; }
    }

    const out = spawnSync("ffmpeg", ["-y", "-v", "error", "-ss", String(picked), "-i", videoFile, "-frames:v", "1", "-vf", "scale=1280:-2", "-q:v", "4", outFile], { encoding: "utf8" });
    if (out.status !== 0) throw new Error(out.stderr || "ffmpeg extraction failed");
    return fs.existsSync(outFile);
  } catch (e) {
    console.warn(`[gallery] poster auto-gen skipped for ${videoFile}: ${e.message}`);
    return false;
  }
}

function discoverGallery() {
  const imgRoot = path.resolve(__dirname, "../../img");
  const vidRoot = path.resolve(__dirname, "../../vid");
  const images = {}; // slug -> [image frames]
  const videos = {}; // slug -> [video frames]

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

      if (frames.length) images[slug] = frames;
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
        else if (generatePoster(path.join(vidRoot, slug, file), absSharedPoster)) {
          frame.poster = sharedPosterPath;
        }

        if (!videos[slug]) videos[slug] = [];
        videos[slug].push(frame);
      }
    }
  }

  // Combine: videos first, then images (each group alphabetical within type).
  // A manual `gallery` array in products.json overrides this order per product.
  const gallery = {};
  const allSlugs = Array.from(new Set([...Object.keys(images), ...Object.keys(videos)]));
  for (const slug of allSlugs) {
    const frames = [...(videos[slug] || []), ...(images[slug] || [])];
    if (frames.length) gallery[slug] = frames;
  }
  return gallery;
}

module.exports = discoverGallery();
