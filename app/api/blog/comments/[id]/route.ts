import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseBlog = createClient(
  process.env.BLOG_SUPABASE_URL!,
  process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    
    const body = await request.json();
    const { is_approved } = body;

    if (typeof is_approved !== 'boolean') {
      return NextResponse.json(
        { error: 'is_approved must be a boolean' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseBlog
      .from('blog_comments')
      .update({ 
        is_approved,
        updated_at: new Date().toISOString()
      })
      .eq('id', id) // Fixed: Changed from params.id to id
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json(
        { error: 'Failed to update comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Comment ${is_approved ? 'approved' : 'rejected'} successfully`,
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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    const { error } = await supabaseBlog
      .from('blog_comments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}