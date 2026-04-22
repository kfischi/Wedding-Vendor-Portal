/**
 * Category tiles for the homepage Bento grid.
 *
 * NOTE: Image URLs are currently Unsplash as an interim source inherited
 * from the previous AnimatedCategories component. Per the WeddingPro
 * orchestration conventions ("Cloudinary only in production"), these need
 * to be migrated to Cloudinary. Do not ship to production until a curator
 * has uploaded 9 category hero images — one per tile below — and swapped
 * the `image` field here.
 */

export interface CategoryTile {
  slug: string;
  name: string;
  image: string;
  /** Bento-grid size class: large spans more columns/rows than medium/small. */
  size: "large" | "medium" | "small";
}

export const categoryTiles: CategoryTile[] = [
  {
    slug: "venue",
    name: "אולמות ומקומות",
    image:
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1600&q=80&fit=crop",
    size: "large",
  },
  {
    slug: "photography",
    name: "צילום חתונות",
    image:
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1000&q=80&fit=crop",
    size: "medium",
  },
  {
    slug: "wedding-dress-designers",
    name: "מעצבי שמלות כלה",
    image:
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&q=80&fit=crop",
    size: "medium",
  },
  {
    slug: "catering",
    name: "קייטרינג",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80&fit=crop",
    size: "large",
  },
  {
    slug: "flowers",
    name: "פרחים ועיצוב",
    image:
      "https://images.unsplash.com/photo-1490750967868-88df5691cc8c?w=1000&q=80&fit=crop",
    size: "medium",
  },
  {
    slug: "makeup",
    name: "איפור ושיער",
    image:
      "https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=1000&q=80&fit=crop",
    size: "medium",
  },
  {
    slug: "music",
    name: "מוזיקה חיה",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1000&q=80&fit=crop",
    size: "small",
  },
  {
    slug: "dj",
    name: "DJ",
    image:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1000&q=80&fit=crop",
    size: "small",
  },
  {
    slug: "cake",
    name: "עוגות חתונה",
    image:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1000&q=80&fit=crop",
    size: "small",
  },
];
