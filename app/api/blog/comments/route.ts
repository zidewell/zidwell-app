import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseBlog = createClient(
  process.env.BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY!
);


// Cache configuration
const CACHE_DURATION = 60; // 60 seconds
const memoryCache = new Map<string, { data: any; timestamp: number }>();

function getCacheKey(postId: string, page: number, limit: number) {
  return `comments:${postId}:${page}:${limit}`;
}

function isCacheValid(timestamp: number) {
  return Date.now() - timestamp < CACHE_DURATION * 1000;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching comments for post:', postId, 'page:', page);

    const { data: comments, error } = await supabaseBlog
      .from('blog_comments')
      .select('*')
      .eq('post_id', postId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    console.log('Comments fetched:', comments?.length || 0);

    // Transform data to match frontend interface
    const transformedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      author: {
        id: comment.user_email || 'anonymous',
        name: comment.user_name || 'Anonymous',
        avatar: null,
        isZidwellUser: false
      },
      createdAt: comment.created_at,
      user_name: comment.user_name,
      user_email: comment.user_email,
      is_approved: comment.is_approved
    }));

    return NextResponse.json({ 
      success: true,
      comments: transformedComments 
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, content, user_name, user_email } = body;

    console.log('Creating comment:', { postId, user_name });

    // Validate required fields
    if (!postId || !content || !user_name || !user_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.trim().length < 1 || content.trim().length > 2000) {
      return NextResponse.json(
        { error: 'Comment must be between 1 and 2000 characters' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Insert comment into database
    const { data, error } = await supabaseBlog
      .from('blog_comments')
      .insert({
        post_id: postId,
        content: content.trim(),
        user_name: user_name.trim(),
        user_email: user_email.trim(),
        is_approved: true
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    console.log('Comment created successfully:', data.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Comment submitted for moderation',
      comment: data 
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}