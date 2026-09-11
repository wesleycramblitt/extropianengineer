// Directory data for src/product-pages.njk — hoists the paginated `product`
// (from src/_data/products.json, the single source of truth) to top-level
// page data so collection items look like the old frontmatter items.
// Type-preserving functions (NOT "{{ product.x }}" strings, which would
// stringify arrays/numbers/booleans).
module.exports = {
  eleventyComputed: {
    title: (data) => data.product && data.product.title,
    description: (data) => data.product && data.product.description,
    tagline: (data) => data.product && data.product.tagline,
    slug: (data) => data.product && data.product.slug,
    category: (data) => data.product && data.product.category,
    type: (data) => data.product && data.product.type,
    licensing: (data) => data.product && data.product.licensing,
    order: (data) => data.product && data.product.order,
    featuredOnHome: (data) => data.product && data.product.featuredOnHome,
    capabilities: (data) => data.product && data.product.capabilities,
    foundation: (data) => data.product && data.product.foundation,
    uses: (data) => data.product && data.product.uses,
    // "Used by" is derived as the inverse of `uses` so the two can never drift:
    // every product whose `uses` includes this slug, sorted by catalog order.
    usedBy: (data) => {
      if (!data.product) return [];
      var orderOf = {};
      (data.products || []).forEach(function (p) { orderOf[p.slug] = p.order; });
      return (data.products || [])
        .filter(function (p) { return (p.uses || []).indexOf(data.product.slug) >= 0; })
        .map(function (p) { return p.slug; })
        .sort(function (a, b) { return (orderOf[a] ?? 99) - (orderOf[b] ?? 99); });
    },
    media: (data) => data.product && data.product.media,
    gallery: (data) => data.product && data.product.gallery
  }
};
