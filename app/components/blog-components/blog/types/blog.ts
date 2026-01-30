// types/blog.ts

export interface Author {
  id: string;
  name: string;
  avatar: string | null;
  isZidwellUser?: boolean; 
  bio?: string | null; 
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  postCount: number;
}

export interface Comment {
  id: string;
  content: string;
  author: Author;
  createdAt: string;
  isApproved?: boolean; // Make optional
  replies?: Comment[]; // Add replies support
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: Author;
  categories: Category[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  readTime: number;
  audioUrl?: string;
  isPublished: boolean;
  comments?: Comment[]; 
  viewCount?: number; 
  likeCount?: number;
  commentCount?: number;
}

export interface Archive {
  month: string;
  year: number;
  count: number;
  label: string;
}

// Additional types for API responses
export interface ApiBlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  categories: string[];
  tags: string[];
  is_published: boolean;
  author_id: string;
  author_name?: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  view_count: number;
  likes_count: number;
  comments_count: number;
}