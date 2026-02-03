import { BlogPost } from "../components/blog-components/blog/types/blog"; 

export const calculateReadTime = (content: string): number => {
  if (!content) return 3;
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

export const formatDate = (dateString: string, formatType: 'short' | 'long' = 'short'): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Recent";
  
  if (formatType === 'short') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

export const getExcerpt = (content: string, maxLength: number = 150): string => {
  const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

export const validateUrl = (url: string): boolean => {
  if (!url.trim()) return true;
  
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

export const getContentParts = (content: string) => {
  if (!content) return { firstHalf: '', secondHalf: '' };
  const contentParts = content.split("</p>");
  const midPoint = Math.max(1, Math.floor(contentParts.length / 2));
  const firstHalf = contentParts.slice(0, midPoint).join("</p>") + "</p>";
  const secondHalf = contentParts.slice(midPoint).join("</p>") || content;
  return { firstHalf, secondHalf };
};

export const transformApiPostToBlogPost = (apiPost: any): any => {
  return {
    id: apiPost.id || '',
    title: apiPost.title || 'Untitled',
    slug: apiPost.slug || '',
    excerpt: apiPost.excerpt || '',
    content: apiPost.content || '',
    featuredImage: apiPost.featured_image || "/default-blog-image.png",
    author: {
      id: apiPost.author_id || apiPost.author?.id || 'default-author-id',
      name: apiPost.author?.name || apiPost.author_name || 'Author',
      avatar: apiPost.author?.avatar || apiPost.author_avatar || "/default-avatar.png",
      bio: apiPost.author?.bio || apiPost.author_bio || null,
      isZidwellUser: apiPost.author?.isZidwellUser || false,
    },
    categories: Array.isArray(apiPost.categories) 
      ? apiPost.categories.map((cat: string | any, index: number) => ({
          id: typeof cat === 'object' ? cat.id : `cat-${index}`,
          name: typeof cat === 'object' ? cat.name : cat,
          slug: typeof cat === 'object' ? cat.slug : cat.toLowerCase().replace(/\s+/g, '-'),
          postCount: 0
        }))
      : [],
    tags: apiPost.tags || [],
    createdAt: apiPost.created_at || new Date().toISOString(),
    updatedAt: apiPost.updated_at || apiPost.created_at || new Date().toISOString(),
    readTime: apiPost.read_time || calculateReadTime(apiPost.content || ''),
    isPublished: apiPost.is_published || false,
    viewCount: apiPost.view_count || 0,
    likeCount: apiPost.likes_count || 0,
    commentCount: apiPost.comments_count || 0,
  };
};