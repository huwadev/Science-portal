const API_BASE = process.env.NEXT_PUBLIC_NEWSLETTER_API_URL || "https://hewa.ethiosss.org/api/v2";


export interface BlogCategory {
  name: string;
  slug: string;
  description?: string;
  posts_count?: number;
}

export interface BlogAuthor {
  name: string;
  avatar: string | null;
  slug: string | null;
}

export interface BlogStats {
  views: number;
  likes: number;
}

export interface BlogArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content?: string | null;
  cover_image: string | null;
  category: BlogCategory | null;
  categories: BlogCategory[];
  tags: string[];
  read_time: number;
  published_at: string;
  published_at_formatted: string;
  is_featured: boolean;
  is_exclusive: boolean;
  author: BlogAuthor;
  stats: BlogStats;
  sources?: string | null;
  references?: string | null;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ScienceBlogsResponse {
  success: boolean;
  data: BlogArticle[];
  meta?: {
    pagination: PaginationMeta;
    portal?: string;
    active_category?: string;
  };
  message?: string;
}

export interface SingleBlogResponse {
  success: boolean;
  data?: BlogArticle;
  related_articles?: BlogArticle[];
  message?: string;
}

/**
 * Fetch blogs pre-filtered for Science Portal categories (Astronomy, Aerospace, Satellites, etc.)
 */
export async function fetchScienceBlogs(params?: {
  category?: string;
  search?: string;
  page?: number;
  perPage?: number;
  lang?: string;
}): Promise<ScienceBlogsResponse> {
  const queryParams = new URLSearchParams();

  if (params?.category && params.category.toLowerCase() !== "all") {
    queryParams.set("category", params.category.toLowerCase());
  }
  // Remove search param from API request to avoid 500 error. Handled on client side.
  if (params?.page) {
    queryParams.set("page", params.page.toString());
  }
  if (params?.perPage) {
    queryParams.set("per_page", params.perPage.toString());
  }

  const url = `${API_BASE}/portals/science/blogs?${queryParams.toString()}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 60 }, // Cache on edge/Next SSR for 60 seconds
      headers: {
        Accept: "application/json",
        "Accept-Language": params?.lang === "am" ? "am" : "en",
      },
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Failed to fetch science blogs from v2 API:", error);
    return {
      success: false,
      data: [],
      message: "Could not fetch publications.",
    };
  }
}

/**
 * Fetch a single blog article by slug with related articles.
 */
export async function fetchBlogBySlug(slug: string): Promise<SingleBlogResponse> {
  const url = `${API_BASE}/blogs/${encodeURIComponent(slug)}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 120 },
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return { success: false, message: "Article not found" };
    }

    return await res.json();
  } catch (error) {
    console.error(`Failed to fetch article '${slug}':`, error);
    return { success: false, message: "Network error loading article" };
  }
}

/**
 * Fetch public categories.
 */
export async function fetchCategories() {
  const url = `${API_BASE}/categories`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) return { success: false, data: [] };
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return { success: false, data: [] };
  }
}
