// app/api/journal/categories/[id]/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/journal/categories/[id] - Get a specific category
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    // ✅ Correctly await params
    const id = (await params).id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data: category, error } = await supabase
      .from('journal_categories')
      .select('*')
      .eq('id', id)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    const transformedCategory = {
      id: category.id,
      name: category.name,
      icon: category.icon,
      type: category.type,
      isCustom: category.is_custom,
      user_id: category.user_id
    };

    return NextResponse.json(transformedCategory);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

// PUT /api/journal/categories/[id] - Update a category
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { userId, ...updates } = body;
    
    // ✅ Correctly await params
    const id = (await params).id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!updates.name || !updates.icon || !updates.type) {
      return NextResponse.json(
        { error: 'Name, icon, and type are required' },
        { status: 400 }
      );
    }

    // First verify the category exists and check permissions
    const { data: existingCategory, error: fetchError } = await supabase
      .from('journal_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Check if user has permission to edit this category
    if (existingCategory.user_id !== userId && existingCategory.user_id !== null) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this category' },
        { status: 403 }
      );
    }

    // If this is a system category (user_id is null), create a user copy instead
    if (existingCategory.user_id === null) {
      // Check if user already has a custom version with the same name
      const { data: userCopy } = await supabase
        .from('journal_categories')
        .select('id')
        .eq('user_id', userId)
        .eq('name', updates.name)
        .maybeSingle();

      if (userCopy) {
        // Update the existing user copy instead
        const { data: updatedData, error: updateError } = await supabase
          .from('journal_categories')
          .update({
            name: updates.name,
            icon: updates.icon,
            type: updates.type
          })
          .eq('id', userCopy.id)
          .select()
          .single();

        if (updateError) {
          if (updateError.code === '23505') {
            return NextResponse.json(
              { error: 'A category with this name already exists' },
              { status: 400 }
            );
          }
          throw updateError;
        }

        const transformedData = {
          id: updatedData.id,
          name: updatedData.name,
          icon: updatedData.icon,
          type: updatedData.type,
          isCustom: updatedData.is_custom,
          user_id: updatedData.user_id
        };

        return NextResponse.json(transformedData);
      }

      // Create new custom category
      const newCategory = {
        name: updates.name,
        icon: updates.icon,
        type: updates.type,
        id: crypto.randomUUID(),
        user_id: userId,
        is_custom: true,
        created_at: new Date().toISOString()
      };

      const { data: newData, error: insertError } = await supabase
        .from('journal_categories')
        .insert([newCategory])
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          return NextResponse.json(
            { error: 'A category with this name already exists' },
            { status: 400 }
          );
        }
        throw insertError;
      }

      const transformedData = {
        id: newData.id,
        name: newData.name,
        icon: newData.icon,
        type: newData.type,
        isCustom: newData.is_custom,
        user_id: newData.user_id
      };

      return NextResponse.json(transformedData);
    }

    // Check for name conflicts (only for custom categories)
    if (updates.name && existingCategory.user_id === userId) {
      const { data: nameConflict } = await supabase
        .from('journal_categories')
        .select('id')
        .eq('user_id', userId)
        .eq('name', updates.name)
        .neq('id', id)
        .maybeSingle();

      if (nameConflict) {
        return NextResponse.json(
          { error: 'A category with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update existing custom category
    const updateData = {
      name: updates.name,
      icon: updates.icon,
      type: updates.type
    };

    const { data, error } = await supabase
      .from('journal_categories')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A category with this name already exists' },
          { status: 400 }
        );
      }
      throw error;
    }

    const transformedData = {
      id: data.id,
      name: data.name,
      icon: data.icon,
      type: data.type,
      isCustom: data.is_custom,
      user_id: data.user_id
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

// DELETE /api/journal/categories/[id] - Delete a category
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    // ✅ Correctly await params
    const id = (await params).id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // First verify the category exists and belongs to the user
    const { data: existingCategory, error: fetchError } = await supabase
      .from('journal_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Check if user owns this category
    if (existingCategory.user_id !== userId) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this category' },
        { status: 403 }
      );
    }

    // Check if category is custom
    if (!existingCategory.is_custom) {
      return NextResponse.json(
        { error: 'Cannot delete system categories' },
        { status: 400 }
      );
    }

    // Check if category is being used in any entries
    const { data: entriesUsingCategory, error: entriesError } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (entriesError) throw entriesError;

    if (entriesUsingCategory && entriesUsingCategory.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category that is being used in entries. Please reassign or delete the entries first.' },
        { status: 400 }
      );
    }

    // Delete the category
    const { error } = await supabase
      .from('journal_categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

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