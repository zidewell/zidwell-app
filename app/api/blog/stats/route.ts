// app/api/blog/stats/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseBlog = createClient(
  process.env.BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY!
);

let statsCache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Helper function to clear cache
function clearStatsCache() {
  statsCache = null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skipCache = searchParams.get("skipCache") === "true";
    const forceRefresh = searchParams.get("forceRefresh") === "true";

    // Check cache first
    if (!skipCache && !forceRefresh && statsCache) {
      const now = Date.now();
      const cacheAge = now - statsCache.timestamp;
      
      if (cacheAge < CACHE_DURATION) {
        return NextResponse.json({
          ...statsCache.data,
          cached: true,
          cacheAge: Math.floor(cacheAge / 1000),
          cacheExpiresIn: Math.floor((CACHE_DURATION - cacheAge) / 1000)
        });
      }
    }

    console.log("Fetching fresh blog stats from database...");

    // Fetch all data including comments
    const [
      postsResponse,
      commentsResponse,
      categoriesResponse,
      recentCommentsResponse
    ] = await Promise.allSettled([
      // Fetch all posts
      supabaseBlog
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false }),
      
      // Count all comments
      supabaseBlog
        .from('blog_comments')
        .select('*', { count: 'exact', head: true }),
      
      // Get categories from categories table
      supabaseBlog
        .from('categories')
        .select('*')
        .order('post_count', { ascending: false }),
      
      // Get recent comments
      supabaseBlog
        .from('blog_comments')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    // Process posts data
    let posts: any[] = [];
    if (postsResponse.status === 'fulfilled' && postsResponse.value.data) {
      posts = postsResponse.value.data;
    }

    // Process comments data
    let totalComments = 0;
    let recentComments: any[] = [];
    
    if (commentsResponse.status === 'fulfilled') {
      totalComments = commentsResponse.value.count || 0;
    }
    
    if (recentCommentsResponse.status === 'fulfilled' && recentCommentsResponse.value.data) {
      recentComments = recentCommentsResponse.value.data;
    }

    // Process categories
    let categoriesFromTable: any[] = [];
    if (categoriesResponse.status === 'fulfilled' && categoriesResponse.value.data) {
      categoriesFromTable = categoriesResponse.value.data;
    }

    // Calculate statistics from posts
    const publishedPosts = posts.filter(post => post.is_published);
    const draftPosts = posts.filter(post => !post.is_published);
    const authors = new Set(posts.map(post => post.author_id));
    
    // Calculate category counts from posts
    const categoryCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();
    
    posts.forEach(post => {
      // Count categories from posts
      if (post.categories && Array.isArray(post.categories)) {
        post.categories.forEach((category: any) => {
          if (category && typeof category === 'string') {
            const trimmedCategory = category.trim();
            if (trimmedCategory) {
              categoryCounts.set(trimmedCategory, (categoryCounts.get(trimmedCategory) || 0) + 1);
            }
          }
        });
      }
      
      // Count tags from posts
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag: any) => {
          if (tag && typeof tag === 'string') {
            const trimmedTag = tag.trim();
            if (trimmedTag) {
              tagCounts.set(trimmedTag, (tagCounts.get(trimmedTag) || 0) + 1);
            }
          }
        });
      }
    });

    // Get recent posts (last 10 published)
    const recentPosts = publishedPosts
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    // Get popular posts (by view count)
    const popularPosts = publishedPosts
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 10);

    // Calculate total views
    const totalViews = posts.reduce((sum, post) => sum + (post.view_count || 0), 0);

    // Calculate comment statistics
    const approvedComments = recentComments.filter(comment => comment.is_approved);
    const pendingComments = recentComments.filter(comment => !comment.is_approved);
    
    // Calculate most commented posts
    const postsWithComments = await Promise.all(
      publishedPosts.map(async (post) => {
        const { count } = await supabaseBlog
          .from('blog_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id)
          .eq('is_approved', true);
        
        return {
          ...post,
          comment_count: count || 0
        };
      })
    );
    
    const mostCommentedPosts = postsWithComments
      .sort((a, b) => b.comment_count - a.comment_count)
      .slice(0, 5);

    // Calculate content growth
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    const recentWeekPosts = posts.filter(post => 
      new Date(post.created_at) >= oneWeekAgo
    ).length;
    
    const previousWeekPosts = posts.filter(post => 
      new Date(post.created_at) >= twoWeeksAgo && 
      new Date(post.created_at) < oneWeekAgo
    ).length;
    
    let contentGrowth = "0%";
    if (previousWeekPosts > 0) {
      const growth = ((recentWeekPosts - previousWeekPosts) / previousWeekPosts) * 100;
      contentGrowth = `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;
    } else if (recentWeekPosts > 0) {
      contentGrowth = "+100%";
    }

    // Calculate comment growth
    const recentWeekComments = recentComments.filter(comment => 
      new Date(comment.created_at) >= oneWeekAgo
    ).length;
    
    const previousWeekComments = recentComments.filter(comment => 
      new Date(comment.created_at) >= twoWeeksAgo && 
      new Date(comment.created_at) < oneWeekAgo
    ).length;
    
    let commentGrowth = "0%";
    if (previousWeekComments > 0) {
      const growth = ((recentWeekComments - previousWeekComments) / previousWeekComments) * 100;
      commentGrowth = `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;
    } else if (recentWeekComments > 0) {
      commentGrowth = "+100%";
    }

    // Calculate engagement rate
    const engagementRate = totalViews > 0 
      ? ((totalComments / totalViews) * 100).toFixed(1)
      : "0.0";

    // Prepare categories array
    let categories: Array<{ name: string; count: number; slug?: string }> = [];
    
    if (categoriesFromTable.length > 0) {
      categories = categoriesFromTable.map(cat => ({
        name: cat.name,
        count: cat.post_count || 0,
        slug: cat.slug
      }));
    } else {
      categories = Array.from(categoryCounts.entries()).map(([name, count]) => ({
        name,
        count
      }));
    }

    // Prepare tags array
    const tags = Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Calculate additional metrics
    const avgViewsPerPost = publishedPosts.length > 0 
      ? Math.round(totalViews / publishedPosts.length) 
      : 0;
    
    const avgCommentsPerPost = publishedPosts.length > 0 
      ? Math.round(totalComments / publishedPosts.length) 
      : 0;
    
    const commentApprovalRate = recentComments.length > 0
      ? ((approvedComments.length / recentComments.length) * 100).toFixed(1)
      : "0.0";

    // Get top performing posts (by engagement)
    const topPerformingPosts = postsWithComments
      .map(post => ({
        ...post,
        engagement_score: ((post.comment_count || 0) + (post.view_count || 0))
      }))
      .sort((a, b) => b.engagement_score - a.engagement_score)
      .slice(0, 5);

    // Format recent comments for display
    const formattedRecentComments = recentComments.slice(0, 10).map(comment => ({
      id: comment.id,
      postId: comment.post_id,
      authorName: comment.user_name || 'Anonymous',
      authorEmail: comment.user_email,
      content: comment.content.length > 100 
        ? comment.content.substring(0, 100) + '...' 
        : comment.content,
      createdAt: comment.created_at,
      isApproved: comment.is_approved,
      postTitle: posts.find(p => p.id === comment.post_id)?.title || 'Unknown Post'
    }));

    // Calculate monthly stats
    const monthlyStats = getMonthlyStats(posts, recentComments);

    // Compile all stats
    const statsData = {
      overview: {
        totalPosts: posts.length,
        publishedPosts: publishedPosts.length,
        draftPosts: draftPosts.length,
        totalAuthors: authors.size,
        totalComments,
        totalViews,
        avgViewsPerPost,
        avgCommentsPerPost,
        engagementRate: `${engagementRate}%`,
        contentGrowth,
        commentGrowth
      },
      comments: {
        total: totalComments,
        approved: approvedComments.length,
        pending: pendingComments.length,
        approvalRate: `${commentApprovalRate}%`,
        recentComments: formattedRecentComments
      },
      recentPosts: recentPosts.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        featured_image: post.featured_image,
        author_name: post.author_name,
        author_id: post.author_id,
        created_at: post.created_at,
        is_published: post.is_published,
        view_count: post.view_count || 0,
        comment_count: post.comment_count || 0
      })),
      popularPosts: popularPosts.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        view_count: post.view_count || 0,
        comment_count: post.comment_count || 0,
        created_at: post.created_at
      })),
      mostCommentedPosts: mostCommentedPosts.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        view_count: post.view_count || 0,
        comment_count: post.comment_count || 0,
        created_at: post.created_at
      })),
      topPerformingPosts: topPerformingPosts.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        view_count: post.view_count || 0,
        comment_count: post.comment_count || 0,
        engagement_score: post.engagement_score
      })),
      categories,
      tags,
      timeline: {
        postsLast7Days: recentWeekPosts,
        postsPrevious7Days: previousWeekPosts,
        commentsLast7Days: recentWeekComments,
        commentsPrevious7Days: previousWeekComments,
        monthlyStats
      },
      fetchedAt: new Date().toISOString(),
      cacheInfo: {
        cached: false,
        duration: CACHE_DURATION / 1000
      }
    };

    // Update cache
    statsCache = {
      data: statsData,
      timestamp: Date.now()
    };

    return NextResponse.json(statsData);
  } catch (error) {
    console.error("Error fetching blog stats:", error);
    
    // Return cached data if available
    if (statsCache) {
      console.log("Returning cached data due to error");
      return NextResponse.json({
        ...statsCache.data,
        cached: true,
        error: "Using cached data due to fetch error",
        cacheAge: Math.floor((Date.now() - statsCache.timestamp) / 1000)
      });
    }
    
    return NextResponse.json(
      { 
        error: "Failed to fetch blog statistics",
        overview: {
          totalPosts: 0,
          publishedPosts: 0,
          draftPosts: 0,
          totalAuthors: 0,
          totalComments: 0,
          totalViews: 0,
          avgViewsPerPost: 0,
          avgCommentsPerPost: 0,
          engagementRate: "0%",
          contentGrowth: "0%",
          commentGrowth: "0%"
        },
        comments: {
          total: 0,
          approved: 0,
          pending: 0,
          approvalRate: "0%",
          recentComments: []
        },
        recentPosts: [],
        popularPosts: [],
        mostCommentedPosts: [],
        topPerformingPosts: [],
        categories: [],
        tags: [],
        timeline: {
          postsLast7Days: 0,
          postsPrevious7Days: 0,
          commentsLast7Days: 0,
          commentsPrevious7Days: 0,
          monthlyStats: []
        },
        fetchedAt: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST endpoint to clear cache
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'clearCache') {
      const wasCached = statsCache !== null;
      statsCache = null;
      
      return NextResponse.json({
        success: true,
        message: "Cache cleared successfully",
        wasCached
      });
    }
    
    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error clearing cache:", error);
    return NextResponse.json(
      { error: "Failed to clear cache" },
      { status: 500 }
    );
  }
}

// Helper function to get monthly stats
function getMonthlyStats(posts: any[], comments: any[]) {
  const monthlyData: { [key: string]: { posts: number; comments: number } } = {};
  
  // Process posts by month
  posts.forEach(post => {
    const date = new Date(post.created_at);
    const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = { posts: 0, comments: 0 };
    }
    monthlyData[monthYear].posts++;
  });
  
  // Process comments by month
  comments.forEach(comment => {
    const date = new Date(comment.created_at);
    const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = { posts: 0, comments: 0 };
    }
    monthlyData[monthYear].comments++;
  });
  
  return Object.entries(monthlyData)
    .map(([month, data]) => ({ 
      month, 
      posts: data.posts, 
      comments: data.comments 
    }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 12); // Last 12 months
}