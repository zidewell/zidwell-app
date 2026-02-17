import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, ...updates } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Transform frontend fields to database naming
    const dbUpdates: any = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.type !== undefined) dbUpdates.type = updates.type;

    // First, check if the category exists and belongs to the user
    const { data: existingCategory, error: checkError } = await supabase
      .from('journal_categories')
      .select('id, user_id, is_custom')
      .eq('id', id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking category:', checkError);
      return NextResponse.json(
        { error: 'Failed to verify category' },
        { status: 500 }
      );
    }

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update this category
    if (existingCategory.user_id !== userId && existingCategory.user_id !== null) {
      return NextResponse.json(
        { error: 'You do not have permission to update this category' },
        { status: 403 }
      );
    }

    // Don't allow editing of system categories (is_custom = false)
    if (!existingCategory.is_custom) {
      return NextResponse.json(
        { error: 'System categories cannot be edited' },
        { status: 403 }
      );
    }

    // Check if trying to update name that might conflict with existing category
    if (updates.name) {
      const { data: existingName, error: nameCheckError } = await supabase
        .from('journal_categories')
        .select('id')
        .eq('user_id', userId)
        .eq('name', updates.name)
        .neq('id', id)
        .maybeSingle();

      if (nameCheckError) {
        console.error('Error checking name:', nameCheckError);
      } else if (existingName) {
        return NextResponse.json(
          { error: 'A category with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Perform the update
    const { data, error } = await supabase
      .from('journal_categories')
      .update(dbUpdates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Update error:', error);
      
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A category with this name already exists' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to update category: ' + error.message },
        { status: 500 }
      );
    }

    // If no data returned, something went wrong
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Category was not updated' },
        { status: 404 }
      );
    }

    // Transform response back to frontend naming
    const transformedData = {
      id: data[0].id,
      name: data[0].name,
      icon: data[0].icon,
      type: data[0].type,
      isCustom: data[0].is_custom,
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // First check if category exists and belongs to user
    const { data: existingCategory, error: checkError } = await supabase
      .from('journal_categories')
      .select('id, user_id, is_custom, name')
      .eq('id', id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking category:', checkError);
      return NextResponse.json(
        { error: 'Failed to verify category' },
        { status: 500 }
      );
    }

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this category
    if (existingCategory.user_id !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this category' },
        { status: 403 }
      );
    }

    // Don't allow deletion of system categories
    if (!existingCategory.is_custom) {
      return NextResponse.json(
        { error: 'System categories cannot be deleted' },
        { status: 403 }
      );
    }

    // Check if category has associated journal entries
    const { data: entries, error: entriesError } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (entriesError) {
      console.error('Error checking entries:', entriesError);
      // Continue with deletion even if check fails
    }

    if (entries && entries.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category that has associated journal entries' },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from('journal_categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete category: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Category deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}