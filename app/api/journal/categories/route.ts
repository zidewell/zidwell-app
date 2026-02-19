// app/api/journal/categories/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data: categories, error } = await supabase
      .from('journal_categories')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform database fields to match frontend naming
    const transformedCategories = categories?.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      type: cat.type,
      isCustom: cat.is_custom,
      user_id: cat.user_id
    })) || [];

    return NextResponse.json(transformedCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...categoryData } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!categoryData.name || !categoryData.icon || !categoryData.type) {
      return NextResponse.json(
        { error: 'Name, icon, and type are required' },
        { status: 400 }
      );
    }

    // Check if category with same name already exists for this user
    const { data: existingCategory } = await supabase
      .from('journal_categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', categoryData.name)
      .maybeSingle();

    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 400 }
      );
    }

    const category = {
      name: categoryData.name,
      icon: categoryData.icon,
      type: categoryData.type,
      id: crypto.randomUUID(),
      user_id: userId,
      is_custom: true,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('journal_categories')
      .insert([category])
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A category with this name already exists' },
          { status: 400 }
        );
      }
      throw error;
    }

    // Transform response back to frontend naming
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
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}