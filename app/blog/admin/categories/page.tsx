"use client"
import { useState, useEffect } from "react";
import AdminLayout from "@/app/components/blog-components/admin/AdminLayout"; 
import { Button } from "@/app/components/ui/button"; 
import { Input } from "@/app/components/ui/input"; 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Plus, Search, Edit, Trash2, Loader2, RefreshCw, AlertCircle, Hash, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/app/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Label } from "@/app/components/ui/label"; 
import { Badge } from "@/app/components/ui/badge";
import { toast } from "sonner";
import { useBlog } from "@/app/context/BlogContext";

export interface BlogCategory {
  id: string; // Generated ID from category name
  name: string;
  slug: string;
  post_count: number;
}

const AdminCategories = () => {
  const { posts, refreshPosts } = useBlog();
  const [searchQuery, setSearchQuery] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<BlogCategory | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<BlogCategory | null>(null);
  
  // Helper function to generate slug
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-")
      .trim();
  };

  // Extract categories from posts
  const extractCategoriesFromPosts = (): BlogCategory[] => {
    const categoryMap = new Map<string, number>();
    
    posts.forEach(post => {
      if (post.categories && Array.isArray(post.categories)) {
        post.categories.forEach((category: string) => {
          if (category && typeof category === 'string' && category.trim()) {
            const categoryName = category.trim();
            const count = categoryMap.get(categoryName) || 0;
            categoryMap.set(categoryName, count + 1);
          }
        });
      }
    });

    // Convert to array
    return Array.from(categoryMap.entries()).map(([name, post_count]) => ({
      id: `generated-${generateSlug(name)}`,
      name,
      slug: generateSlug(name),
      post_count
    })).sort((a, b) => b.post_count - a.post_count); // Sort by post count
  };

  // Fetch categories from posts
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      // Refresh posts to get latest data
      await refreshPosts();
      
      // Extract categories from posts
      const extractedCategories = extractCategoriesFromPosts();
      setCategories(extractedCategories);
      
      console.log(`Extracted ${extractedCategories.length} categories from ${posts.length} posts`);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error(error.message || 'Failed to load categories');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Update categories when posts change
  useEffect(() => {
    if (posts.length > 0 && !isLoading) {
      const extractedCategories = extractCategoriesFromPosts();
      setCategories(extractedCategories);
    }
  }, [posts]);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    const categoryName = newCategoryName.trim();
    const slug = generateSlug(categoryName);

    // Check if category already exists
    if (categories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
      toast.error(`Category "${categoryName}" already exists`);
      return;
    }

    setIsAdding(true);
    try {
      // In a real implementation, you would update posts with this new category
      // For now, we'll just add it locally
      const newCategory: BlogCategory = {
        id: `generated-${slug}`,
        name: categoryName,
        slug: slug,
        post_count: 0
      };

      setCategories(prev => [newCategory, ...prev]);
      setNewCategoryName("");
      toast.success(`Category "${categoryName}" added! Note: You need to assign it to posts.`);
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast.error(error.message || 'Failed to add category');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCategory = async (category: BlogCategory) => {
    setIsDeleting(category.id);
    try {
      // Remove category from all posts that have it
      // In a real implementation, you would update all posts that have this category
      // For now, we'll just remove it locally
      setCategories(prev => prev.filter(cat => cat.id !== category.id));
      
      toast.success(`Category "${category.name}" removed locally. Note: You need to remove it from posts manually.`);
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.message || 'Failed to delete category');
    } finally {
      setIsDeleting(null);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleEditCategory = async () => {
    if (!categoryToEdit || !editCategoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    const oldCategoryName = categoryToEdit.name;
    const newCategoryName = editCategoryName.trim();
    const newSlug = generateSlug(newCategoryName);

    // Check if new name already exists (excluding current)
    if (categories.some(cat => 
      cat.id !== categoryToEdit.id && 
      cat.name.toLowerCase() === newCategoryName.toLowerCase()
    )) {
      toast.error(`Category "${newCategoryName}" already exists`);
      return;
    }

    setIsEditing(categoryToEdit.id);
    try {
      // Update category name in all posts
      // In a real implementation, you would update all posts
      // For now, we'll just update it locally
      setCategories(prev => prev.map(cat => 
        cat.id === categoryToEdit.id 
          ? { ...cat, name: newCategoryName, slug: newSlug }
          : cat
      ));
      
      setEditCategoryName("");
      setCategoryToEdit(null);
      setEditDialogOpen(false);
      toast.success(`Category renamed from "${oldCategoryName}" to "${newCategoryName}". Note: Update posts manually.`);
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast.error(error.message || 'Failed to update category');
    } finally {
      setIsEditing(null);
    }
  };

  const openEditDialog = (category: BlogCategory) => {
    setCategoryToEdit(category);
    setEditCategoryName(category.name);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (category: BlogCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const stats = {
    total: categories.length,
    withPosts: categories.filter(cat => cat.post_count > 0).length,
    withoutPosts: categories.filter(cat => cat.post_count === 0).length,
    totalPosts: categories.reduce((sum, cat) => sum + cat.post_count, 0)
  };

  // Get posts for a specific category
  const getPostsForCategory = (categoryName: string) => {
    return posts.filter(post => 
      post.categories && 
      Array.isArray(post.categories) && 
      post.categories.some((cat: string) => cat.trim() === categoryName)
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Categories Management</h1>
            <p className="text-muted-foreground">
              Manage categories extracted from posts ({categories.length} total)
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCategories}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span className="ml-2">Refresh</span>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-[#C29307] text-white hover:bg-[#C29307]/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="category-name">Category Name *</Label>
                    <Input
                      id="category-name"
                      placeholder="Enter category name..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground">
                      This category will need to be manually added to posts.
                    </p>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      className="bg-[#C29307] text-white hover:bg-[#C29307]/90"
                      onClick={handleAddCategory}
                      disabled={isAdding || !newCategoryName.trim()}
                    >
                      {isAdding ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Category"
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Categories</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Hash className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">With Posts</p>
                <p className="text-2xl font-bold text-green-600">{stats.withPosts}</p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Empty Categories</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.withoutPosts}</p>
              </div>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Posts</p>
                <p className="text-2xl font-bold text-blue-600">{posts.length}</p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search categories by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading categories from posts...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Posts</TableHead>
                  <TableHead>Posts List</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                      {searchQuery ? "No categories found" : "No categories found in posts"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => {
                    const categoryPosts = getPostsForCategory(category.name);
                    
                    return (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span>{category.name}</span>
                            {category.post_count === 0 && (
                              <Badge variant="outline" className="text-xs">
                                Empty
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <code className="text-xs bg-muted px-2 py-1 rounded">{category.slug}</code>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={category.post_count > 0 ? "default" : "secondary"}
                            className={
                              category.post_count > 0 
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : ""
                            }
                          >
                            {category.post_count}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {categoryPosts.length > 0 ? (
                            <div className="max-w-[250px]">
                              <div className="flex flex-wrap gap-1">
                                {categoryPosts.slice(0, 3).map(post => (
                                  <Badge key={post.id} variant="outline" className="text-xs">
                                    {post.title.length > 20 ? post.title.substring(0, 20) + '...' : post.title}
                                  </Badge>
                                ))}
                                {categoryPosts.length > 3 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{categoryPosts.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-sm">No posts</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openEditDialog(category)}
                              title="Edit category name"
                              disabled={isEditing === category.id}
                            >
                              {isEditing === category.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Edit className="w-4 h-4" />
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => openDeleteDialog(category)}
                              disabled={isDeleting === category.id}
                              title="Delete category"
                            >
                              {isDeleting === category.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
        
     
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">New Category Name *</Label>
              <Input
                id="edit-category-name"
                placeholder="Enter new category name..."
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Note: You will need to manually update this category name in all posts.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setEditDialogOpen(false);
                setCategoryToEdit(null);
                setEditCategoryName("");
              }}>
                Cancel
              </Button>
              <Button
                className="bg-[#C29307] text-white hover:bg-[#C29307]/90"
                onClick={handleEditCategory}
                disabled={!editCategoryName.trim() || !categoryToEdit}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete category "{categoryToDelete?.name}"? 
              {categoryToDelete && categoryToDelete.post_count > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-destructive font-medium">
                    Warning: This category is used in {categoryToDelete.post_count} post(s)!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You will need to manually remove this category from all posts that use it.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete)}
              disabled={!!isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminCategories;