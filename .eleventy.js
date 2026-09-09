// Eleventy config — input: src/, output: dist/
// Media/styles/scripts stay at the repo ROOT and are passthrough-copied
// (project-root-relative) so legacy URLs (/img, /vid, /assets, /styles,
// /scripts) are preserved in the built site.

module.exports = function (eleventyConfig) {
  // Product visual monogram: first letters of title words (skip "Extropian")
  eleventyConfig.addFilter("glyph", function (title) {
    var words = String(title || "").replace(/^Extropian\s+/, "").split(/\s+/).slice(0, 2);
    var g = words.map(function (w) { return w.charAt(0) || ""; }).join("").toUpperCase();
    return g || "E";
  });

  // Active-nav helper: does this page URL begin with the nav item URL?
  eleventyConfig.addFilter("startswith", function (str, prefix) {
    return typeof str === "string" && str.indexOf(prefix) === 0;
  });

  // Product-card "related" chips: map a slug back to its title
  eleventyConfig.addFilter("findTitle", function (arr, slug) {
    if (!arr) return slug;
    var hit = arr.find(function (p) { return p.fileSlug === slug; });
    return hit ? hit.data.title : slug;
  });
  // Static passthrough sources (resolved relative to the project root)
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("vid");
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("styles");
  eleventyConfig.addPassthroughCopy("scripts");
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy(".nojekyll");

  return {
    dir: {
      input: "src",
      output: "dist",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
