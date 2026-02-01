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
import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label"; 

export interface BlogCategory {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  post_count: number;
  created_at?: string;
  updated_at?: string;
}

const AdminCategories = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryDescription, setEditCategoryDescription] = useState("");
  
  // Fetch categories from API
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Category name is required");
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add category');
      }

      const newCategory = await response.json();
      setCategories([...categories, newCategory]);
      setNewCategoryName("");
      setNewCategoryDescription("");
      alert(`Category "${newCategoryName}" added successfully!`);
    } catch (error: any) {
      alert(error.message || 'Failed to add category');
      console.error('Error adding category:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) {
      return;
    }

    setIsDeleting(id);
    try {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete category');
      }

      setCategories(categories.filter(cat => cat.id !== id));
      alert(`Category "${name}" deleted successfully!`);
    } catch (error: any) {
      alert(error.message || 'Failed to delete category');
      console.error('Error deleting category:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEditCategory = async (id: string) => {
    if (!editCategoryName.trim()) {
      alert("Category name is required");
      return;
    }

    setIsEditing(id);
    try {
      const response = await fetch(`/api/categories?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editCategoryName.trim(),
          description: editCategoryDescription.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update category');
      }

      const updatedCategory = await response.json();
      setCategories(categories.map(cat => 
        cat.id === id ? updatedCategory : cat
      ));
      setIsEditing(null);
      alert(`Category updated successfully!`);
    } catch (error: any) {
      alert(error.message || 'Failed to update category');
      console.error('Error updating category:', error);
    } finally {
      setIsEditing(null);
    }
  };

  const openEditDialog = (category: BlogCategory) => {
    setIsEditing(category.id);
    setEditCategoryName(category.name);
    setEditCategoryDescription(category.description || "");
  };

  const closeEditDialog = () => {
    setIsEditing(null);
    setEditCategoryName("");
    setEditCategoryDescription("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Categories</h1>
            <p className="text-muted-foreground">
              Manage blog categories
            </p>
          </div>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category-description">Description</Label>
                  <Input
                    id="category-description"
                    placeholder="Enter category description..."
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full bg-[#C29307] text-white hover:bg-[#C29307]/90"
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
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Posts</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                      {searchQuery ? "No categories found" : "No categories yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.slug}
                      </TableCell>
                      <TableCell>{category.post_count}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog open={isEditing === category.id} onOpenChange={(open) => !open && closeEditDialog()}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => openEditDialog(category)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Category</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-category-name">Category Name *</Label>
                                  <Input
                                    id="edit-category-name"
                                    placeholder="Enter category name..."
                                    value={editCategoryName}
                                    onChange={(e) => setEditCategoryName(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-category-description">Description</Label>
                                  <Input
                                    id="edit-category-description"
                                    placeholder="Enter category description..."
                                    value={editCategoryDescription}
                                    onChange={(e) => setEditCategoryDescription(e.target.value)}
                                  />
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogClose>
                                  <Button
                                    className="bg-[#C29307] text-white hover:bg-[#C29307]/90"
                                    onClick={() => handleEditCategory(category.id)}
                                    disabled={!editCategoryName.trim()}
                                  >
                                    Save Changes
                                  </Button>
                                </DialogFooter>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteCategory(category.id, category.name)}
                            disabled={isDeleting === category.id}
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
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCategories;