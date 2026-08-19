
export interface EventItem {
  id: number;
  title: string;
  description: string;
  image?: string;
  event_date: string;
  event_time?: string;
  location: string;
  category?: string;
  slug: string;
  sort_order?: number;
}

export type NewsItem = {
  id: number;
  title: string;
  excerpt?: string;
  description?: string;
  summary?: string;
  content?: string;
  image?: string;
  thumbnail?: string;
  cover_image?: string;
  featured_image?: string;
  category?: string;
  type?: string;
  is_featured?: boolean | number;
  featured?: boolean | number;
  published_at?: string;
  date?: string;
  created_at?: string;
  slug?: string;
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PageSettings {
  hero_headline: string;
  hero_description: string;
  hero_image?: string;
}

export interface NewsArticle {
  id: number;
  title: string;
  content: string;
  image?: string;
  category: string;
  date: string;
  slug: string;
  featured?: boolean;
  sort_order?: number;
}


//deployment
