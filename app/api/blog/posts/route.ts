import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Define types for better TypeScript support
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  categories: string[];
  tags: string[];
  featured_image: string | null;
  audio_file: string | null;
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  comment_count: number;
  likes_count: number;
  author_id: string;
  author_name: string | null;
  author_avatar: string | null;
  author_bio: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface FormattedPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  audio_file: string | null;
  categories: string[];
  tags: string[];
  is_published: boolean;
  is_featured: boolean;
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
}

const supabaseBlog = createClient(
  process.env.BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const authorId = searchParams.get("authorId");
    const published = searchParams.get("published");
    const sortBy = searchParams.get("sort_by") || "created_at";
    const sortOrder = searchParams.get("sort_order") || "desc";

    // Single post by ID
    if (id) {
      const { data: post, error } = await supabaseBlog
        .from("blog_posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }

      return NextResponse.json(formatPost(post));
    }

    // Single post by slug
    if (slug) {
      let query = supabaseBlog
        .from("blog_posts")
        .select("*")
        .eq("slug", slug);
      
      // Only filter by published if specifically requested
      if (published === 'true') {
        query = query.eq("is_published", true);
      }

      const { data: post, error } = await query.single();

      if (error) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }

      return NextResponse.json(formatPost(post));
    }

    // Build query for multiple posts
    let query = supabaseBlog
      .from("blog_posts")
      .select("*", { count: "exact" });

    // Apply filters
    if (category) {
      query = query.contains("categories", [category]);
    }

    if (tag) {
      query = query.contains("tags", [tag]);
    }

    if (authorId) {
      query = query.eq("author_id", authorId);
    }

    if (published === 'true') {
      query = query.eq("is_published", true);
    } else if (published === 'false') {
      query = query.eq("is_published", false);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: posts, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format posts
    const formattedPosts = posts.map(formatPost);

    return NextResponse.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const excerpt = formData.get("excerpt") as string;
    const categories = JSON.parse(formData.get("categories") as string || "[]");
    const tags = JSON.parse(formData.get("tags") as string || "[]");
    const authorId = formData.get("authorId") as string;
    const authorName = formData.get("authorName") as string;
    const authorAvatar = formData.get("authorAvatar") as string;
    const authorBio = formData.get("authorBio") as string;
    const isPublished = formData.get("isPublished") === "true";
    
    // Check for featured image - could be file or URL
    const featuredImageFile = formData.get("featuredImage") as File | null;
    const featuredImageUrl = formData.get("featuredImageUrl") as string;
    const audioFile = formData.get("audioFile") as File | null;

    if (!title || !content || !authorId) {
      return NextResponse.json(
        { error: "Title, content, and authorId are required" },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-")
      .trim();

    let featuredImageFinalUrl = null;
    let audioFileUrl = null;

    // Handle featured image - CASE 1: File upload from device
    if (featuredImageFile && featuredImageFile.size > 0) {
      console.log("POST - Processing uploaded image file:", {
        name: featuredImageFile.name,
        type: featuredImageFile.type,
        size: featuredImageFile.size
      });

      try {
        const fileExt = featuredImageFile.name.split('.').pop();
        const fileName = `${slug}-${Date.now()}.${fileExt}`;
        const filePath = `featured-images/${fileName}`;

        const { error: uploadError } = await supabaseBlog
          .storage
          .from('blog-images')
          .upload(filePath, featuredImageFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          return NextResponse.json(
            { error: "Failed to upload image: " + uploadError.message },
            { status: 500 }
          );
        }

        // Get public URL from Supabase
        const { data: { publicUrl } } = supabaseBlog
          .storage
          .from('blog-images')
          .getPublicUrl(filePath);

        featuredImageFinalUrl = publicUrl;
        console.log("POST - Image uploaded successfully, URL:", featuredImageFinalUrl);
      } catch (error) {
        console.error("Error in image upload:", error);
        return NextResponse.json(
          { error: "Failed to process image upload" },
          { status: 500 }
        );
      }
    } 
    // Handle featured image - CASE 2: HTTPS URL provided
    else if (featuredImageUrl && featuredImageUrl.startsWith('http')) {
      console.log("POST - Using provided image URL:", featuredImageUrl);
      featuredImageFinalUrl = featuredImageUrl;
    }

    // Upload audio file to Supabase Storage
    if (audioFile && audioFile.size > 0) {
      console.log("POST - Processing uploaded audio file:", {
        name: audioFile.name,
        type: audioFile.type,
        size: audioFile.size
      });

      try {
        const fileExt = audioFile.name.split('.').pop();
        const fileName = `${slug}-audio-${Date.now()}.${fileExt}`;
        const filePath = `audio-files/${fileName}`;

        const { error: uploadError } = await supabaseBlog
          .storage
          .from('blog-images')
          .upload(filePath, audioFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("Error uploading audio:", uploadError);
          return NextResponse.json(
            { error: "Failed to upload audio: " + uploadError.message },
            { status: 500 }
          );
        }

        const { data: { publicUrl } } = supabaseBlog
          .storage
          .from('blog-images')
          .getPublicUrl(filePath);

        audioFileUrl = publicUrl;
        console.log("POST - Audio uploaded successfully, URL:", audioFileUrl);
      } catch (error) {
        console.error("Error in audio upload:", error);
        return NextResponse.json(
          { error: "Failed to process audio upload" },
          { status: 500 }
        );
      }
    }

    const postData = {
      title,
      slug,
      content,
      excerpt: excerpt || null,
      categories: Array.isArray(categories) ? categories : [],
      tags: Array.isArray(tags) ? tags : [],
      featured_image: featuredImageFinalUrl,
      audio_file: audioFileUrl,
      is_published: isPublished || false,
      is_featured: false,
      author_id: authorId,
      author_name: authorName || "Unknown Author",
      author_avatar: authorAvatar || null,
      author_bio: authorBio || null,
      view_count: 0,
      likes_count: 0,
      comment_count: 0,
      published_at: isPublished ? new Date().toISOString() : null
    };

    console.log("POST - Inserting post with data:", {
      ...postData,
      featured_image: postData.featured_image ? "URL present" : "null",
      audio_file: postData.audio_file ? "URL present" : "null"
    });

    const { data: post, error } = await supabaseBlog
      .from("blog_posts")
      .insert([postData])
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(formatPost(post), { status: 201 });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    
    // Log all form data keys for debugging
    console.log("PUT - Form data keys received:", Array.from(formData.keys()));
    
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const excerpt = formData.get("excerpt") as string;
    const categories = JSON.parse(formData.get("categories") as string || "[]");
    const tags = JSON.parse(formData.get("tags") as string || "[]");
    const authorName = formData.get("authorName") as string;
    const authorAvatar = formData.get("authorAvatar") as string;
    const authorBio = formData.get("authorBio") as string;
    const isPublished = formData.get("isPublished") === "true";
    
    // Check for featured image - could be file or URL
    const featuredImageFile = formData.get("featuredImage") as File | null;
    const featuredImageUrl = formData.get("featuredImageUrl") as string;
    
    // Check for audio file
    const audioFile = formData.get("audioFile") as File | null;

    // Get existing post to check for files to delete
    const { data: existingPost, error: fetchError } = await supabaseBlog
      .from("blog_posts")
      .select("featured_image, audio_file, slug, published_at")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching existing post:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch existing post" },
        { status: 500 }
      );
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Generate slug from title if title is provided
    let slug = existingPost?.slug;
    if (title) {
      updateData.title = title;
      slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/--+/g, "-")
        .trim();
      updateData.slug = slug;
    }
    
    if (content) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (categories) updateData.categories = categories;
    if (tags) updateData.tags = tags;
    if (authorName) updateData.author_name = authorName;
    if (authorAvatar !== undefined) updateData.author_avatar = authorAvatar;
    if (authorBio !== undefined) updateData.author_bio = authorBio;
    
    if (isPublished !== undefined) {
      updateData.is_published = isPublished;
      // Only set published_at if it's being published now and wasn't published before
      if (isPublished && !existingPost?.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    // Handle featured image - CASE 1: New file upload from device
    if (featuredImageFile && featuredImageFile.size > 0) {
      console.log("PUT - Processing new uploaded image file:", {
        name: featuredImageFile.name,
        type: featuredImageFile.type,
        size: featuredImageFile.size
      });

      try {
        // Delete old image from storage if it exists and was uploaded to Supabase
        if (existingPost?.featured_image && existingPost.featured_image.includes(process.env.BLOG_SUPABASE_URL!)) {
          const oldPath = extractPathFromUrl(existingPost.featured_image);
          if (oldPath) {
            console.log("PUT - Deleting old image:", oldPath);
            await supabaseBlog.storage
              .from('blog-images')
              .remove([oldPath]);
          }
        }

        // Upload new image
        const fileExt = featuredImageFile.name.split('.').pop();
        const fileName = `${slug || 'post'}-${Date.now()}.${fileExt}`;
        const filePath = `featured-images/${fileName}`;

        const { error: uploadError } = await supabaseBlog
          .storage
          .from('blog-images')
          .upload(filePath, featuredImageFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabaseBlog
          .storage
          .from('blog-images')
          .getPublicUrl(filePath);

        updateData.featured_image = publicUrl;
        console.log("PUT - New image uploaded, URL:", publicUrl);
      } catch (error) {
        console.error("Error uploading image:", error);
        return NextResponse.json(
          { error: "Failed to upload image" },
          { status: 500 }
        );
      }
    } 
    // Handle featured image - CASE 2: HTTPS URL provided
    else if (featuredImageUrl && featuredImageUrl.startsWith('http')) {
      console.log("PUT - Using provided image URL:", featuredImageUrl);
      
      // If there was an old Supabase image, delete it
      if (existingPost?.featured_image && existingPost.featured_image.includes(process.env.BLOG_SUPABASE_URL!)) {
        const oldPath = extractPathFromUrl(existingPost.featured_image);
        if (oldPath) {
          console.log("PUT - Deleting old Supabase image:", oldPath);
          await supabaseBlog.storage
            .from('blog-images')
            .remove([oldPath]);
        }
      }
      
      updateData.featured_image = featuredImageUrl;
    }
    // Handle featured image - CASE 3: No image provided (remove image)
    else if (!featuredImageFile && !featuredImageUrl) {
      console.log("PUT - Removing featured image");
      
      // Delete old image from storage if it exists
      if (existingPost?.featured_image && existingPost.featured_image.includes(process.env.BLOG_SUPABASE_URL!)) {
        const oldPath = extractPathFromUrl(existingPost.featured_image);
        if (oldPath) {
          console.log("PUT - Deleting old Supabase image:", oldPath);
          await supabaseBlog.storage
            .from('blog-images')
            .remove([oldPath]);
        }
      }
      updateData.featured_image = null;
    }
    // If none of the above, keep existing featured_image (no change)

    // Handle audio file - similar logic
    if (audioFile && audioFile.size > 0) {
      console.log("PUT - Processing new uploaded audio file:", {
        name: audioFile.name,
        type: audioFile.type,
        size: audioFile.size
      });

      try {
        // Delete old audio if exists and was uploaded to Supabase
        if (existingPost?.audio_file && existingPost.audio_file.includes(process.env.BLOG_SUPABASE_URL!)) {
          const oldPath = extractPathFromUrl(existingPost.audio_file);
          if (oldPath) {
            console.log("PUT - Deleting old audio:", oldPath);
            await supabaseBlog.storage
              .from('blog-images')
              .remove([oldPath]);
          }
        }

        // Upload new audio
        const fileExt = audioFile.name.split('.').pop();
        const fileName = `${slug || 'post'}-audio-${Date.now()}.${fileExt}`;
        const filePath = `audio-files/${fileName}`;

        const { error: uploadError } = await supabaseBlog
          .storage
          .from('blog-images')
          .upload(filePath, audioFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabaseBlog
          .storage
          .from('blog-images')
          .getPublicUrl(filePath);

        updateData.audio_file = publicUrl;
        console.log("PUT - New audio uploaded, URL:", publicUrl);
      } catch (error) {
        console.error("Error uploading audio:", error);
        return NextResponse.json(
          { error: "Failed to upload audio" },
          { status: 500 }
        );
      }
    } else if (!audioFile) {
      // No audio file provided, remove it
      if (existingPost?.audio_file && existingPost.audio_file.includes(process.env.BLOG_SUPABASE_URL!)) {
        const oldPath = extractPathFromUrl(existingPost.audio_file);
        if (oldPath) {
          console.log("PUT - Deleting old audio:", oldPath);
          await supabaseBlog.storage
            .from('blog-images')
            .remove([oldPath]);
        }
      }
      updateData.audio_file = null;
    }

    console.log("PUT - Updating post with data:", {
      ...updateData,
      featured_image: updateData.featured_image ? "URL present" : "null",
      audio_file: updateData.audio_file ? "URL present" : "null"
    });

    const { data: post, error } = await supabaseBlog
      .from("blog_posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(formatPost(post));

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Accept both camelCase and snake_case
    if (body.view_count !== undefined) updateData.view_count = body.view_count;
    if (body.viewCount !== undefined) updateData.view_count = body.viewCount;
    
    if (body.likes_count !== undefined) updateData.likes_count = body.likes_count;
    if (body.likesCount !== undefined) updateData.likes_count = body.likesCount;
    
    if (body.comment_count !== undefined) updateData.comment_count = body.comment_count;
    if (body.commentCount !== undefined) updateData.comment_count = body.commentCount;
    
    if (body.is_published !== undefined || body.isPublished !== undefined) {
      const isPublished = body.is_published !== undefined ? body.is_published : body.isPublished;
      updateData.is_published = isPublished;
      if (isPublished) {
        updateData.published_at = new Date().toISOString();
      }
    }

    const { data: post, error } = await supabaseBlog
      .from("blog_posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(formatPost(post));

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Get post to delete associated files
    const { data: post } = await supabaseBlog
      .from("blog_posts")
      .select("featured_image, audio_file")
      .eq("id", id)
      .single();

    // Delete associated files from storage
    if (post) {
      const filesToDelete = [];
      
      if (post.featured_image && post.featured_image.includes(process.env.BLOG_SUPABASE_URL!)) {
        const imagePath = extractPathFromUrl(post.featured_image);
        if (imagePath) filesToDelete.push(imagePath);
      }
      
      if (post.audio_file && post.audio_file.includes(process.env.BLOG_SUPABASE_URL!)) {
        const audioPath = extractPathFromUrl(post.audio_file);
        if (audioPath) filesToDelete.push(audioPath);
      }
      
      if (filesToDelete.length > 0) {
        console.log("DELETE - Deleting files:", filesToDelete);
        await supabaseBlog.storage
          .from('blog-images')
          .remove(filesToDelete);
      }
    }

    const { error } = await supabaseBlog
      .from("blog_posts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Post deleted successfully" 
    });

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to format post data
function formatPost(post: any): FormattedPost {
  // Ensure image URL is properly formatted
  let featuredImage = post.featured_image;
  if (featuredImage && !featuredImage.startsWith('http')) {
    // If it's a relative path from Supabase storage
    if (featuredImage.startsWith('/storage/v1/')) {
      featuredImage = `${process.env.BLOG_SUPABASE_URL}${featuredImage}`;
    } else if (!featuredImage.startsWith('blob:')) {
      // For local development or other relative paths
      const baseUrl = process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://zidwell.com";
      featuredImage = `${baseUrl}${featuredImage.startsWith('/') ? '' : '/'}${featuredImage}`;
    }
  }

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    featured_image: featuredImage,
    audio_file: post.audio_file,
    categories: post.categories || [],
    tags: post.tags || [],
    is_published: post.is_published,
    is_featured: post.is_featured || false,
    author_id: post.author_id,
    author: {
      id: post.author_id,
      name: post.author_name || "Unknown Author",
      avatar: post.author_avatar,
      bio: post.author_bio
    },
    published_at: post.published_at,
    created_at: post.created_at,
    updated_at: post.updated_at,
    view_count: post.view_count || 0,
    likes_count: post.likes_count || 0,
    comments_count: post.comment_count || 0
  };
}

// Helper function to extract file path from Supabase URL
function extractPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // The path is after /storage/v1/object/public/blog-images/
    const bucketIndex = pathParts.indexOf('blog-images');
    if (bucketIndex !== -1 && bucketIndex + 1 < pathParts.length) {
      return pathParts.slice(bucketIndex + 1).join('/');
    }
    return null;
  } catch {
    return null;
  }
}