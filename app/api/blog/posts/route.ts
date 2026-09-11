import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

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
      persistSession: false,
    },
  }
);

// ─────────────────────────────────────────────────────────────
// ✅ FIX: Normalize MIME type so Supabase stores the right one
// ─────────────────────────────────────────────────────────────
function normalizeImageMime(file: File): string {
  const declared = (file.type || "").toLowerCase();

  // Browsers sometimes send image/jpg (invalid). Map to image/jpeg.
  if (declared === "image/jpg" || declared === "image/pjpeg") {
    return "image/jpeg";
  }

  // If the browser gave us a valid image/* type, trust it.
  if (declared.startsWith("image/")) {
    return declared;
  }

  // Otherwise infer from file extension.
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    avif: "image/avif",
    svg: "image/svg+xml",
  };
  return map[ext] || "image/jpeg";
}

// ✅ FIX: Safe extension extraction
function safeExtension(file: File, fallback = "jpg"): string {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!ext || ext.length > 5 || /[^a-z0-9]/.test(ext)) return fallback;
  return ext;
}

// ✅ FIX: Upload a File to Supabase without corrupting MIME type
async function uploadImageToSupabase(
  file: File,
  fileName: string
): Promise<{ publicUrl: string } | { error: string }> {
  try {
    const mime = normalizeImageMime(file);

    // ✅ FIX: Pass the File object directly — DO NOT convert to Buffer.
    // Supabase's client handles File/Blob/ArrayBuffer natively and
    // preserves the contentType correctly.
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseBlog.storage
      .from("blog-images")
      .upload(fileName, arrayBuffer, {
        contentType: mime,           // ✅ FIX: normalized MIME
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const {
      data: { publicUrl },
    } = supabaseBlog.storage.from("blog-images").getPublicUrl(fileName);

    return { publicUrl };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed" };
  }
}

// ✅ FIX: Upload an audio file (same principle, but no MIME normalization)
async function uploadAudioToSupabase(
  file: File,
  fileName: string
): Promise<{ publicUrl: string } | { error: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const mime = file.type || "audio/mpeg";

    const { error: uploadError } = await supabaseBlog.storage
      .from("blog-images")
      .upload(fileName, arrayBuffer, {
        contentType: mime,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const {
      data: { publicUrl },
    } = supabaseBlog.storage.from("blog-images").getPublicUrl(fileName);

    return { publicUrl };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed" };
  }
}

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

    if (slug) {
      let query = supabaseBlog.from("blog_posts").select("*").eq("slug", slug);
      if (published === "true") query = query.eq("is_published", true);

      const { data: post, error } = await query.single();
      if (error) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      return NextResponse.json(formatPost(post));
    }

    let query = supabaseBlog.from("blog_posts").select("*", { count: "exact" });

    if (category) query = query.contains("categories", [category]);
    if (tag) query = query.contains("tags", [tag]);
    if (authorId) query = query.eq("author_id", authorId);

    if (published === "true") query = query.eq("is_published", true);
    else if (published === "false") query = query.eq("is_published", false);

    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: posts, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      posts: posts.map(formatPost),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
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
    const categories = JSON.parse(
      (formData.get("categories") as string) || "[]"
    );
    const tags = JSON.parse((formData.get("tags") as string) || "[]");
    const authorId = formData.get("authorId") as string;
    const authorName = formData.get("authorName") as string;
    const authorAvatar = formData.get("authorAvatar") as string;
    const authorBio = formData.get("authorBio") as string;
    const isPublished = formData.get("isPublished") === "true";

    const featuredImageFile = formData.get("featuredImage") as File | null;
    const featuredImageUrl = formData.get("featuredImageUrl") as string;
    const audioFile = formData.get("audioFile") as File | null;

    if (!title || !content || !authorId) {
      return NextResponse.json(
        { error: "Title, content, and authorId are required" },
        { status: 400 }
      );
    }

    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-")
      .trim();

    let featuredImageFinalUrl: string | null = null;
    let audioFileUrl: string | null = null;

    // ✅ FIX: Featured image upload
    if (featuredImageFile && featuredImageFile.size > 0) {
      console.log("📸 POST - Uploading image:", featuredImageFile.name);

      const ext = safeExtension(featuredImageFile);
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileName = `featured-images/${slug}-${timestamp}-${randomString}.${ext}`;

      const result = await uploadImageToSupabase(featuredImageFile, fileName);
      if ("error" in result) {
        console.error("❌ Upload error:", result.error);
        return NextResponse.json(
          { error: "Failed to upload image: " + result.error },
          { status: 500 }
        );
      }

      featuredImageFinalUrl = result.publicUrl;
      console.log("✅ Image URL saved:", featuredImageFinalUrl);
    } else if (featuredImageUrl && featuredImageUrl.startsWith("http")) {
      console.log("📸 Using provided URL:", featuredImageUrl);
      featuredImageFinalUrl = featuredImageUrl;
    }

    // ✅ FIX: Audio upload
    if (audioFile && audioFile.size > 0) {
      const ext = safeExtension(audioFile, "mp3");
      const fileName = `audio-files/${slug}-${Date.now()}.${ext}`;

      const result = await uploadAudioToSupabase(audioFile, fileName);
      if ("publicUrl" in result) {
        audioFileUrl = result.publicUrl;
      } else {
        console.error("Audio upload failed:", result.error);
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
      published_at: isPublished ? new Date().toISOString() : null,
    };

    const { data: post, error } = await supabaseBlog
      .from("blog_posts")
      .insert([postData])
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Post saved, image in DB:", post.featured_image);

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

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const excerpt = formData.get("excerpt") as string;
    const categories = JSON.parse(
      (formData.get("categories") as string) || "[]"
    );
    const tags = JSON.parse((formData.get("tags") as string) || "[]");
    const authorName = formData.get("authorName") as string;
    const authorAvatar = formData.get("authorAvatar") as string;
    const authorBio = formData.get("authorBio") as string;
    const isPublished = formData.get("isPublished") === "true";

    const featuredImageFile = formData.get("featuredImage") as File | null;
    const featuredImageUrl = formData.get("featuredImageUrl") as string;
    const audioFile = formData.get("audioFile") as File | null;

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
      updated_at: new Date().toISOString(),
    };

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
      if (isPublished && !existingPost?.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }

    // ✅ FIX: New image upload in PUT
    if (featuredImageFile && featuredImageFile.size > 0) {
      console.log("📸 PUT - Uploading new image:", featuredImageFile.name);

      // Delete old image first
      if (
        existingPost?.featured_image &&
        existingPost.featured_image.includes(process.env.BLOG_SUPABASE_URL!)
      ) {
        const oldPath = extractPathFromUrl(existingPost.featured_image);
        if (oldPath) {
          await supabaseBlog.storage.from("blog-images").remove([oldPath]);
        }
      }

      const ext = safeExtension(featuredImageFile);
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileName = `featured-images/${slug || "post"}-${timestamp}-${randomString}.${ext}`;

      const result = await uploadImageToSupabase(featuredImageFile, fileName);
      if ("error" in result) {
        console.error("Error uploading image:", result.error);
        return NextResponse.json(
          { error: "Failed to upload image: " + result.error },
          { status: 500 }
        );
      }

      updateData.featured_image = result.publicUrl;
      console.log("✅ New image uploaded:", result.publicUrl);
    } else if (featuredImageUrl && featuredImageUrl.startsWith("http")) {
      console.log("📸 Using provided URL:", featuredImageUrl);

      if (
        existingPost?.featured_image &&
        existingPost.featured_image.includes(process.env.BLOG_SUPABASE_URL!)
      ) {
        const oldPath = extractPathFromUrl(existingPost.featured_image);
        if (oldPath) {
          await supabaseBlog.storage.from("blog-images").remove([oldPath]);
        }
      }

      updateData.featured_image = featuredImageUrl;
    } else if (!featuredImageFile && !featuredImageUrl) {
      console.log("📸 Removing featured image");

      if (
        existingPost?.featured_image &&
        existingPost.featured_image.includes(process.env.BLOG_SUPABASE_URL!)
      ) {
        const oldPath = extractPathFromUrl(existingPost.featured_image);
        if (oldPath) {
          await supabaseBlog.storage.from("blog-images").remove([oldPath]);
        }
      }
      updateData.featured_image = null;
    }

    // ✅ FIX: Audio upload in PUT
    if (audioFile && audioFile.size > 0) {
      if (
        existingPost?.audio_file &&
        existingPost.audio_file.includes(process.env.BLOG_SUPABASE_URL!)
      ) {
        const oldPath = extractPathFromUrl(existingPost.audio_file);
        if (oldPath) {
          await supabaseBlog.storage.from("blog-images").remove([oldPath]);
        }
      }

      const ext = safeExtension(audioFile, "mp3");
      const fileName = `audio-files/${slug || "post"}-${Date.now()}.${ext}`;

      const result = await uploadAudioToSupabase(audioFile, fileName);
      if ("publicUrl" in result) {
        updateData.audio_file = result.publicUrl;
      } else {
        console.error("Audio upload failed:", result.error);
      }
    } else if (!audioFile) {
      if (
        existingPost?.audio_file &&
        existingPost.audio_file.includes(process.env.BLOG_SUPABASE_URL!)
      ) {
        const oldPath = extractPathFromUrl(existingPost.audio_file);
        if (oldPath) {
          await supabaseBlog.storage.from("blog-images").remove([oldPath]);
        }
      }
      updateData.audio_file = null;
    }

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

    if (body.increment_view === true) {
      const { data: currentPost, error: fetchError } = await supabaseBlog
        .from("blog_posts")
        .select("view_count")
        .eq("id", id)
        .single();

      if (fetchError) {
        return NextResponse.json(
          { error: fetchError.message },
          { status: 500 }
        );
      }

      const newViewCount = (currentPost?.view_count || 0) + 1;

      const { data: post, error } = await supabaseBlog
        .from("blog_posts")
        .update({
          view_count: newViewCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(formatPost(post));
    }

    const updateData: any = { updated_at: new Date().toISOString() };

    if (body.view_count !== undefined) updateData.view_count = body.view_count;
    if (body.viewCount !== undefined) updateData.view_count = body.viewCount;
    if (body.likes_count !== undefined)
      updateData.likes_count = body.likes_count;
    if (body.likesCount !== undefined)
      updateData.likes_count = body.likesCount;
    if (body.comment_count !== undefined)
      updateData.comment_count = body.comment_count;
    if (body.commentCount !== undefined)
      updateData.comment_count = body.commentCount;

    if (
      body.is_published !== undefined ||
      body.isPublished !== undefined
    ) {
      const isPublished =
        body.is_published !== undefined ? body.is_published : body.isPublished;
      updateData.is_published = isPublished;
      if (isPublished && !body.published_at) {
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

    const { data: post } = await supabaseBlog
      .from("blog_posts")
      .select("featured_image, audio_file")
      .eq("id", id)
      .single();

    if (post) {
      const filesToDelete: string[] = [];

      if (
        post.featured_image &&
        post.featured_image.includes(process.env.BLOG_SUPABASE_URL!)
      ) {
        const imagePath = extractPathFromUrl(post.featured_image);
        if (imagePath) filesToDelete.push(imagePath);
      }

      if (
        post.audio_file &&
        post.audio_file.includes(process.env.BLOG_SUPABASE_URL!)
      ) {
        const audioPath = extractPathFromUrl(post.audio_file);
        if (audioPath) filesToDelete.push(audioPath);
      }

      if (filesToDelete.length > 0) {
        await supabaseBlog.storage.from("blog-images").remove(filesToDelete);
      }
    }

    const { error } = await supabaseBlog
      .from("blog_posts")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function formatPost(post: any): FormattedPost {
  let featuredImage = post.featured_image;

  if (featuredImage && !featuredImage.startsWith("http")) {
    if (featuredImage.startsWith("/storage/v1/")) {
      featuredImage = `${process.env.BLOG_SUPABASE_URL}${featuredImage}`;
    } else if (featuredImage.includes("featured-images/")) {
      featuredImage = `${process.env.BLOG_SUPABASE_URL}/storage/v1/object/public/blog-images/${featuredImage}`;
    } else if (!featuredImage.startsWith("blob:")) {
      const baseUrl =
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : "https://zidwell.com";
      featuredImage = `${baseUrl}${featuredImage.startsWith("/") ? "" : "/"}${featuredImage}`;
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
      bio: post.author_bio,
    },
    published_at: post.published_at,
    created_at: post.created_at,
    updated_at: post.updated_at,
    view_count: post.view_count || 0,
    likes_count: post.likes_count || 0,
    comments_count: post.comment_count || 0,
  };
}

function extractPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const bucketIndex = pathParts.indexOf("blog-images");
    if (bucketIndex !== -1 && bucketIndex + 1 < pathParts.length) {
      return pathParts.slice(bucketIndex + 1).join("/");
    }
    return null;
  } catch {
    return null;
  }
}