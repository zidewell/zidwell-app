"use client";

import AdminLayout from "@/app/components/blog-components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"; 
import { Button } from "@/app/components/ui/button";
import { FileText, MessageSquare, Eye, TrendingUp, Plus, Calendar, Users, BarChart, RefreshCw, TrendingUpIcon, Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { format, subDays } from "date-fns";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  author_name: string | null;
  author_id: string;
  created_at: string;
  is_published: boolean;
  view_count: number;
  comment_count: number;
}

interface BlogStats {
  overview: {
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalAuthors: number;
    totalComments: number;
    totalViews: number;
    avgViewsPerPost: number;
    avgCommentsPerPost: number;
    engagementRate: string;
    contentGrowth: string;
  };
  recentPosts: BlogPost[];
  popularPosts: Array<BlogPost & { view_count: number }>;
  topPerformingPosts: Array<BlogPost & { engagement_score: number }>;
  categories: Array<{ name: string; count: number; slug?: string }>;
  tags: Array<{ name: string; count: number }>;
  timeline: {
    postsLast7Days: number;
    postsPrevious7Days: number;
    totalPostsByMonth: Array<{ month: string; count: number }>;
  };
  fetchedAt: string;
  cacheInfo?: {
    cached?: boolean;
    duration?: number;
    cacheAge?: number;
    cacheExpiresIn?: number;
  };
  error?: boolean;
}

const AdminDashboard = () => {
  const router = useRouter();
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<{ 
    cached: boolean; 
    age: number; 
    expiresIn: number 
  } | null>(null);

  // Fetch stats from API
  const fetchStats = async (skipCache = false) => {
    setIsRefreshing(true);
    try {
      const url = `/api/blog/stats${skipCache ? '?skipCache=true' : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch blog stats');
      }
      
      const data: BlogStats = await response.json();
      setStats(data);
      
      // Extract cache info
      if (data.cacheInfo) {
        setCacheInfo({
          cached: data.cacheInfo.cached || false,
          age: data.cacheInfo.cacheAge || 0,
          expiresIn: data.cacheInfo.cacheExpiresIn || 600
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Clear cache and force refresh
  const forceRefreshStats = async () => {
    try {
      // Clear cache via API
      await fetch('/api/blog/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'clearCache' })
      });
      
      // Fetch fresh data
      await fetchStats(true);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCreateNewPost = () => {
    router.push("/blog/admin/posts/new");
  };

  const handleViewAllPosts = () => {
    router.push("/blog/admin/post");
  };

  const handleRefreshData = () => {
    fetchStats(true);
  };

  const handleForceRefresh = () => {
    forceRefreshStats();
  };

  const statsData = [
    {
      title: "Total Posts",
      value: stats?.overview.totalPosts.toString() || "0",
      icon: FileText,
      change: `${stats?.overview.publishedPosts || 0} published`,
      subtext: `${stats?.overview.draftPosts || 0} drafts`,
      color: "text-blue-600"
    },
    {
      title: "Total Comments",
      value: stats?.overview.totalComments.toLocaleString() || "0",
      icon: MessageSquare,
      change: "User interactions",
      subtext: `${stats?.overview.avgCommentsPerPost || 0} avg per post`,
      color: "text-green-600"
    },
    {
      title: "Total Views",
      value: stats?.overview.totalViews.toLocaleString() || "0",
      icon: Eye,
      change: "All time traffic",
      subtext: `${stats?.overview.avgViewsPerPost || 0} avg per post`,
      color: "text-purple-600"
    },
    {
      title: "Engagement Rate",
      value: stats?.overview.engagementRate || "0%",
      icon: TrendingUp,
      change: "Comments per view",
      subtext: "Higher is better",
      color: "text-amber-600"
    },
    {
      title: "Active Authors",
      value: stats?.overview.totalAuthors.toString() || "0",
      icon: Users,
      change: "Content contributors",
      subtext: "Team members",
      color: "text-indigo-600"
    },
    {
      title: "Content Growth",
      value: stats?.overview.contentGrowth || "0%",
      icon: BarChart,
      change: "vs last week",
      subtext: `${stats?.timeline.postsLast7Days || 0} posts this week`,
      color: "text-emerald-600"
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with cache info */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard Overview</h1>
            <p className="text-muted-foreground">
              Welcome to the Zidwell Blog content management system.
            </p>
            {cacheInfo && (
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Timer className="w-3 h-3" />
                <span>
                  {cacheInfo.cached ? `Cached • ` : ''}
                  Refreshes in {Math.max(0, cacheInfo.expiresIn)}s
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="gap-2"
            >
              {isRefreshing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={handleForceRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              Clear Cache
            </Button>
            <Button onClick={handleCreateNewPost} className="bg-[#C29307] hover:bg-yellow-600 gap-2">
              <Plus className="w-4 h-4" />
              New Post
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statsData.map((stat) => (
            <Card key={stat.title} className="hover:shadow-sm transition-shadow hover:border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Two-column layout for Recent Posts and Popular Posts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Posts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Posts</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Latest articles from your blog
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleViewAllPosts}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                          <div className="h-3 bg-muted rounded w-24 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="h-6 bg-muted rounded w-20 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : stats?.recentPosts && stats.recentPosts.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentPosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0 hover:bg-muted/50 px-2 rounded-lg transition-colors cursor-pointer"
                      onClick={() => router.push(`/blog/admin/posts/${post.id}/edit`)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {post.featured_image ? (
                          <img
                            src={post.featured_image}
                            alt={post.title}
                            className="w-12 h-12 rounded object-cover flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium line-clamp-1 text-sm md:text-base">
                            {post.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{post.author_name || "Unknown Author"}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {post.created_at ? format(new Date(post.created_at), 'MMM d') : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                            post.is_published
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                          }`}
                        >
                          {post.is_published ? "Live" : "Draft"}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.view_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {post.comment_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg mb-2">No posts yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start creating content for your blog
                  </p>
                  <Button onClick={handleCreateNewPost}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Post
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Popular Posts */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Popular Posts</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Most viewed articles this month
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div className="space-y-2 w-full">
                        <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                        <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
                      </div>
                      <div className="h-6 bg-muted rounded w-16 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : stats?.popularPosts && stats.popularPosts.length > 0 ? (
                <div className="space-y-4">
                  {stats.popularPosts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0 hover:bg-muted/50 px-2 rounded-lg transition-colors cursor-pointer"
                      onClick={() => router.push(`/blog/admin/posts/${post.id}/edit`)}
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium line-clamp-2 text-sm md:text-base">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.view_count?.toLocaleString() || 0} views
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {post.comment_count || 0} comments
                          </span>
                        </div>
                      </div>
                      <TrendingUpIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg mb-2">No popular posts</h3>
                  <p className="text-muted-foreground">
                    Views data will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Categories Overview */}
        {stats?.categories && stats.categories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Categories Overview</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Post distribution by category
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stats.categories.slice(0, 8).map((category) => (
                  <div 
                    key={category.name} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/blog/admin/categories`)}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{category.name}</h4>
                      <p className="text-sm text-muted-foreground">{category.count} posts</p>
                    </div>
                    <div className="ml-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {category.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {stats.categories.length > 8 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/blog/admin/categories')}
                  >
                    View all {stats.categories.length} categories
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Top Performing Posts */}
        {stats?.topPerformingPosts && stats.topPerformingPosts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Posts</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Best engagement (views + comments)
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topPerformingPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0 hover:bg-muted/50 px-2 rounded-lg transition-colors cursor-pointer"
                    onClick={() => router.push(`/blog/admin/posts/${post.id}/edit`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium line-clamp-1 text-sm md:text-base">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Engagement: {post.engagement_score}</span>
                          <span>•</span>
                          <span>{post.view_count} views</span>
                          <span>•</span>
                          <span>{post.comment_count} comments</span>
                        </div>
                      </div>
                    </div>
                    <TrendingUpIcon className="w-4 h-4 text-green-600" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;