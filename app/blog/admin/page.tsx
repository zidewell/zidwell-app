
"use client";

import AdminLayout from "@/app/components/blog-components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"; 
import { Button } from "@/app/components/ui/button";
import { FileText, MessageSquare, Eye, TrendingUp, Plus, Calendar, Users, BarChart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBlog } from "@/app/context/BlogContext";
import { format } from "date-fns";

const AdminDashboard = () => {
  const router = useRouter();
  const { stats, isLoading: blogLoading, refreshStats } = useBlog();

  const statsData = [
    {
      title: "Total Posts",
      value: stats?.totalPosts.toString() || "0",
      icon: FileText,
      change: "+12%",
      subtext: `${stats?.publishedPosts || 0} published, ${stats?.draftPosts || 0} drafts`
    },
    {
      title: "Total Comments",
      value: stats?.totalComments.toString() || "0",
      icon: MessageSquare,
      change: "+5 this week",
      subtext: "Across all posts"
    },
    {
      title: "Page Views",
      value: stats?.totalViews.toString() || "0",
      icon: Eye,
      change: "+12% vs last week",
      subtext: "Last 30 days"
    },
    {
      title: "Engagement Rate",
      value: "4.2%", // This would need separate API
      icon: TrendingUp,
      change: "+0.5% vs last week",
      subtext: "Avg. time on page"
    },
    {
      title: "Active Authors",
      value: stats?.totalAuthors.toString() || "0",
      icon: Users,
      change: "+2 this month",
      subtext: "Content contributors"
    },
    {
      title: "Content Growth",
      value: "+12%", // Calculated from recent posts
      icon: BarChart,
      change: "vs last week",
      subtext: "New posts created"
    }
  ];

  const handleCreateNewPost = () => {
    router.push("/blog/admin/posts/new");
  };

  const handleViewAllPosts = () => {
    router.push("/blog/admin/posts");
  };

  const handleRefreshData = () => {
    refreshStats();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard Overview</h1>
            <p className="text-muted-foreground">
              Welcome to the Zidwell Blog content management system.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefreshData}
              disabled={blogLoading}
            >
              Refresh Data
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
            <Card key={stat.title} className="hover:shadow-sm transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
              </CardContent>
            </Card>
          ))}
        </div>

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
            {blogLoading ? (
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
                    className="flex items-center justify-between py-3 border-b border-border last:border-0 hover:bg-muted/50 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {post.featured_image && (
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium line-clamp-1 text-sm md:text-base">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{post.author?.name || "Unknown Author"}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {post.created_at ? format(new Date(post.created_at), 'MMM d, yyyy') : 'No date'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                        post.is_published
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                      }`}
                    >
                      {post.is_published ? "Published" : "Draft"}
                    </span>
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
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;