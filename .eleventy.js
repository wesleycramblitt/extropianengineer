// Eleventy config — input: src/, output: dist/
// Media/styles/scripts stay at the repo ROOT and are passthrough-copied
// (project-root-relative) so legacy URLs (/img, /vid, /assets, /styles,
// /scripts) are preserved in the built site.

module.exports = function (eleventyConfig) {
  // Categories present in a (possibly filtered) product list, for the browser chips
  eleventyConfig.addFilter("pbCats", function (list, featuredOnly) {
    var catNames = {};
    try {
      var cfg = require("./src/_data/site.json");
      cfg.productCategories.forEach(function (c) { catNames[c.key] = c.name; });
    } catch (e) {}
    var seen = [];
    (list || []).forEach(function (p) {
      if (featuredOnly && !p.data.featuredOnHome) return;
      var k = p.data.category;
      if (seen.indexOf(k) < 0) seen.push(k);
    });
    return seen.map(function (k) { return { key: k, name: catNames[k] || k }; });
  });

  // Products collection sorted by front-matter `order` (categories stay grouped)
  eleventyConfig.addCollection("productsByOrder", function (collectionApi) {
    return collectionApi
      .getFilteredByTag("products")
      .sort(function (a, b) { return (a.data.order || 99) - (b.data.order || 99); });
  });

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
