// Eleventy config — input: src/, output: dist/
// Media/styles/scripts stay at the repo ROOT and are passthrough-copied
// (project-root-relative) so legacy URLs (/img, /vid, /assets, /styles,
// /scripts) are preserved in the built site.
//
// Products single source of truth: src/_data/products.json drives
// src/product-pages.njk (pagination, one page per product). All per-product
// fields are hoisted to top-level page data via src/product-pages.11tydata.js
// so templates read item.data.* directly — no productmeta.json lookup.

module.exports = function (eleventyConfig) {
  // Validate products.json on every build (local + CI). Throws -> build fails loudly.
  validateProducts();

  var MarkdownIt = require("markdown-it");
  var md = new MarkdownIt({ html: true });
  eleventyConfig.addFilter("markdown", function (s) {
    return md.render(String(s || ""));
  });

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
      var cat = p.data.category;
      var ks = Array.isArray(cat) ? cat : [cat];
      ks.forEach(function (k) { if (k && seen.indexOf(k) < 0) seen.push(k); });
    });
    return seen.map(function (k) { return { key: k, name: catNames[k] || k }; });
  });

  // Products collection sorted by `order` from products.json
  eleventyConfig.addCollection("productsByOrder", function (collectionApi) {
    return collectionApi
      .getFilteredByTag("products")
      .sort(function (a, b) {
        var ao = a.data.order ?? 99;
        var bo = b.data.order ?? 99;
        return ao - bo;
      });
  });

  // CSS-safe slug for badge values ("End user product" -> "end-user-product");
  // arrays map to per-element slugs (multi-category products)
  eleventyConfig.addFilter("badgeClass", function (v) {
    if (Array.isArray(v)) return v.map(function (x) { return badgeSlug(x); });
    return badgeSlug(v);
  });
  function badgeSlug(v) {
    return String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

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

  // "Built for" chip values present in a (possibly filtered) product list
  eleventyConfig.addFilter("pbBuiltFors", function (list, featuredOnly) {
    var seen = [];
    (list || []).forEach(function (p) {
      if (featuredOnly && !p.data.featuredOnHome) return;
      var k = p.data.builtFor;
      if (k && seen.indexOf(k) < 0) seen.push(k);
    });
    return seen;
  });

  // Display label for "Built for" keys — WHO it is built for
  eleventyConfig.addFilter("builtForLabel", function (k) {
    return { build: "Software teams", buy: "Engineering & research teams" }[k] || k;
  });

  // Category key -> display name
  eleventyConfig.addFilter("catName", function (k) {
    try {
      var cfg = require("./src/_data/site.json");
      var hit = cfg.productCategories.find(function (c) { return c.key === k; });
      if (hit) return hit.name;
    } catch (e) {}
    return k;
  });

  // Product-card "related" chips: map a slug back to its title
  eleventyConfig.addFilter("findTitle", function (arr, slug) {
    if (!arr) return slug;
    var hit = arr.find(function (p) { return (p.data.slug || p.fileSlug) === slug; });
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

// Single-source validation: products.json must be self-consistent.
// Runs synchronously at config load so `npx eleventy` and `npm run build`
// enforce it identically (no pre-build step to bypass in CI).
function validateProducts() {
  var products = require("./src/_data/products.json");
  var site = require("./src/_data/site.json");
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error("products.json: must be a non-empty array");
  }
  var validCats = {};
  (site.productCategories || []).forEach(function (c) { validCats[c.key] = true; });
  var slugs = {};
  var orders = {};
  products.forEach(function (p, i) {
    var where = "products.json[" + i + (p && p.slug ? ":" + p.slug : "") + "]";
    ["slug", "title", "description", "tagline", "type", "builtFor", "body"].forEach(function (f) {
      if (!p[f] || (typeof p[f] !== "string")) {
        throw new Error(where + ": required string field `" + f + "` missing/empty");
      }
    });
    if (!/^[a-z0-9-]+$/.test(p.slug)) {
      throw new Error(where + ": slug must match ^[a-z0-9-]+$");
    }
    if (slugs[p.slug]) throw new Error(where + ": duplicate slug `" + p.slug + "`");
    slugs[p.slug] = true;
    if (typeof p.order !== "number") throw new Error(where + ": `order` must be a number");
    if (orders[p.order]) throw new Error(where + ": duplicate order `" + p.order + "`");
    orders[p.order] = true;
    if (typeof p.featuredOnHome !== "boolean") {
      throw new Error(where + ": `featuredOnHome` must be boolean");
    }
    if (p.builtFor !== "build" && p.builtFor !== "buy") {
      throw new Error(where + ": `builtFor` must be 'build' or 'buy'");
    }
    ["category", "licensing", "capabilities", "related"].forEach(function (f) {
      if (!Array.isArray(p[f]) || (f !== "related" && p[f].length === 0)) {
        throw new Error(where + ": `" + f + "` must be a non-empty array");
      }
    });
    if (!Array.isArray(p.foundation)) {
      throw new Error(where + ": `foundation` must be an array (may be empty)");
    }
    p.category.forEach(function (k) {
      if (!validCats[k]) {
        throw new Error(where + ": unknown category `" + k + "` (not in site.json productCategories)");
      }
    });
    if (p.body.indexOf("{{") >= 0 || p.body.indexOf("{%") >= 0) {
      throw new Error(where + ": body must not contain Nunjucks tokens {{ or {% (page uses markdownTemplateEngine njk)");
    }
  });
  products.forEach(function (p) {
    (p.related || []).forEach(function (r) {
      if (!slugs[r]) {
        throw new Error("products.json:" + p.slug + ": related slug `" + r + "` does not exist");
      }
      if (r === p.slug) {
        throw new Error("products.json:" + p.slug + ": related must not self-reference");
      }
    });
  });
}
