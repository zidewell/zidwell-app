// app/context/BlogContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content?: string;
  categories: string[];
  tags?: string[];
  featured_image: string | null;
  is_published: boolean;
  author_id: string;
  author: {
    id: string;
    name: string;
    avatar: string | null;
    bio: string | null;
  };
  published_at: string | null;
  created_at: string;
  updated_at: string;
  view_count: number;
  likes_count: number;
  comments_count: number;
  comment_count?: number;
}

interface BlogContextType {
  posts: BlogPost[];
  isLoading: boolean;
  error: string | null;
  refreshPosts: () => Promise<void>;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error('useBlog must be used within BlogProvider');
  }
  return context;
};

interface BlogProviderProps {
  children: ReactNode;
}

export const BlogProvider: React.FC<BlogProviderProps> = ({ children }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPosts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching posts from API...');
      
      // Skip cache to get fresh data
      const response = await fetch('/api/blog/posts?cache=false&limit=100');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API response structure:', Object.keys(data));
      
      // Your API returns { posts: [...], pagination: {...} }
      let fetchedPosts: any[] = [];
      
      if (data.posts && Array.isArray(data.posts)) {
        fetchedPosts = data.posts;
        console.log(`Found ${fetchedPosts.length} posts in 'posts' property`);
      } else if (Array.isArray(data)) {
        fetchedPosts = data;
        console.log(`Found ${fetchedPosts.length} posts directly in array`);
      } else {
        console.error('Unexpected API response format:', data);
        setError('Invalid response format from server');
        setPosts([]);
        return;
      }
      
      console.log('First post sample:', fetchedPosts[0] ? {
        id: fetchedPosts[0].id,
        title: fetchedPosts[0].title,
        is_published: fetchedPosts[0].is_published,
        author: fetchedPosts[0].author
      } : 'No posts');
      
      // Transform posts to match the expected format
      const transformedPosts = fetchedPosts.map((post: any) => {
        // Handle different author formats
        const authorName = post.author?.name || 
                          post.author_name || 
                          (post.author && typeof post.author === 'object' ? post.author.name : 'Unknown Author');
        
        const authorId = post.author?.id || 
                        post.author_id || 
                        (post.author && typeof post.author === 'object' ? post.author.id : '');
        
        return {
          id: post.id || '',
          title: post.title || 'Untitled',
          slug: post.slug || '',
          excerpt: post.excerpt || null,
          content: post.content || '',
          categories: post.categories || [],
          tags: post.tags || [],
          featured_image: post.featured_image || null,
          is_published: post.is_published || false,
          author_id: authorId,
          author: {
            id: authorId,
            name: authorName,
            avatar: post.author?.avatar || post.author_avatar || null,
            bio: post.author?.bio || post.author_bio || null
          },
          published_at: post.published_at || null,
          created_at: post.created_at || new Date().toISOString(),
          updated_at: post.updated_at || post.created_at || new Date().toISOString(),
          view_count: post.view_count || 0,
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || post.comment_count || 0
        };
      });
      
      console.log(`Transformed ${transformedPosts.length} posts`);
      setPosts(transformedPosts);
      
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch posts on initial load
  useEffect(() => {
    refreshPosts();
  }, []);

  return (
    <BlogContext.Provider value={{
      posts,
      isLoading,
      error,
      refreshPosts,
    }}>
      {children}
    </BlogContext.Provider>
  );
};