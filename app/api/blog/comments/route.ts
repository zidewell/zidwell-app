import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseBlog = createClient(
  process.env.BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY!
);


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const postId = searchParams.get('postId') || 'all';
    const offset = (page - 1) * limit;

    let query = supabaseBlog
      .from('blog_comments')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Filter by post if not "all"
    if (postId && postId !== 'all') {
      query = query.eq('post_id', postId);
    }

    // Apply pagination
    const { data: comments, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    // Handle null values from schema
    const processedComments = (comments || []).map(comment => ({
      ...comment,
      user_name: comment.user_name || 'Anonymous',
      user_email: comment.user_email || 'No email',
      is_approved: comment.is_approved || false
    }));

    return NextResponse.json({ 
      success: true,
      comments: processedComments,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new comment (admin can create comments if needed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { post_id, content, user_name, user_email } = body;

    // Validate required fields
    if (!post_id || !content) {
      return NextResponse.json(
        { success: false, error: 'Post ID and content are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseBlog
      .from('blog_comments')
      .insert({
        post_id,
        content: content.trim(),
        user_name: user_name?.trim() || null,
        user_email: user_email?.trim() || null,
        is_approved: true // Admin created comments are auto-approved
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Comment created successfully',
      comment: data 
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}