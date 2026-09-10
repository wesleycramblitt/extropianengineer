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
    builtFor: (data) => data.product && data.product.builtFor,
    order: (data) => data.product && data.product.order,
    featuredOnHome: (data) => data.product && data.product.featuredOnHome,
    capabilities: (data) => data.product && data.product.capabilities,
    foundation: (data) => data.product && data.product.foundation,
    related: (data) => data.product && data.product.related,
    media: (data) => data.product && data.product.media,
    gallery: (data) => data.product && data.product.gallery
  }
};
