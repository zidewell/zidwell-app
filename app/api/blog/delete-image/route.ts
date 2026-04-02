// app/api/blog/delete-image/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

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

// Allowed domains for production
const ALLOWED_DOMAINS = ['zidwell.com', 'www.zidwell.com'];
const ALLOWED_ORIGINS = ['https://zidwell.com', 'https://www.zidwell.com'];

// Local development patterns
const LOCALHOST_PATTERNS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
];

function isAllowedRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");
  
  // Check if running in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Allow localhost in development
  if (isDevelopment) {
    // Check if origin is localhost
    if (origin) {
      const isLocalhost = LOCALHOST_PATTERNS.some(pattern => 
        origin.toLowerCase().includes(pattern)
      );
      if (isLocalhost) return true;
    }
    
    // Check if host is localhost
    if (host) {
      const isLocalhost = LOCALHOST_PATTERNS.some(pattern => 
        host.toLowerCase().includes(pattern)
      );
      if (isLocalhost) return true;
    }
    
    // Check if referer is localhost
    if (referer) {
      const isLocalhost = LOCALHOST_PATTERNS.some(pattern => 
        referer.toLowerCase().includes(pattern)
      );
      if (isLocalhost) return true;
    }
  }
  
  // Production checks
  // Check origin
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }
  
  // Check referer
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (ALLOWED_DOMAINS.includes(refererUrl.hostname)) {
        return true;
      }
    } catch (e) {
      // Invalid referer URL
    }
  }
  
  // Check host
  if (host && ALLOWED_DOMAINS.includes(host)) {
    return true;
  }
  
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Check if request is from allowed domain
    if (!isAllowedRequest(request)) {
      console.warn(`Blocked unauthorized request to delete-image endpoint from: ${request.headers.get("origin") || request.headers.get("host")}`);
      return NextResponse.json(
        { 
          error: "Unauthorized", 
          message: "Access denied. This endpoint can only be accessed from zidwell.com" 
        },
        { status: 403 }
      );
    }
    
    const { imageUrl, postId } = await request.json();
    
    if (!imageUrl || !postId) {
      return NextResponse.json(
        { error: "Image URL and Post ID are required" },
        { status: 400 }
      );
    }
    
    // Extract file path from Supabase URL
    let filePath = null;
    try {
      const urlObj = new URL(imageUrl);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.indexOf('blog-images');
      if (bucketIndex !== -1 && bucketIndex + 1 < pathParts.length) {
        filePath = pathParts.slice(bucketIndex + 1).join('/');
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid image URL format" },
        { status: 400 }
      );
    }
    
    // Delete from storage if it's a Supabase URL
    if (filePath && imageUrl.includes(process.env.BLOG_SUPABASE_URL!)) {
      const { error: deleteError } = await supabaseBlog.storage
        .from('blog-images')
        .remove([filePath]);
      
      if (deleteError) {
        console.error("Storage delete error:", deleteError);
        return NextResponse.json(
          { error: deleteError.message },
          { status: 500 }
        );
      }
    }
    
    // Update database to remove image reference
    const { error: updateError } = await supabaseBlog
      .from("blog_posts")
      .update({ featured_image: null })
      .eq("id", postId);
    
    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Image deleted successfully" 
    });
    
  } catch (error) {
    console.error("Delete image error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}