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

    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;

    // Transform database fields to match frontend naming
    const transformedEntries = entries?.map(entry => ({
      id: entry.id,
      date: entry.date,
      type: entry.type,
      amount: entry.amount,
      categoryId: entry.category_id, // Transform category_id → categoryId
      note: entry.note,
      journalType: entry.journal_type, // Transform journal_type → journalType
      createdAt: entry.created_at, // Transform created_at → createdAt
      user_id: entry.user_id
    })) || [];

    return NextResponse.json(transformedEntries);
  } catch (error) {
    console.error('Error fetching entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...entryData } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Transform frontend fields to match database naming
    const entry = {
      date: entryData.date,
      type: entryData.type,
      amount: entryData.amount,
      category_id: entryData.categoryId, // Transform categoryId → category_id
      note: entryData.note || null,
      journal_type: entryData.journalType, // Transform journalType → journal_type
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('journal_entries')
      .insert([entry])
      .select()
      .single();

    if (error) throw error;

    // Transform response back to frontend naming
    const transformedData = {
      id: data.id,
      date: data.date,
      type: data.type,
      amount: data.amount,
      categoryId: data.category_id,
      note: data.note,
      journalType: data.journal_type,
      createdAt: data.created_at,
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Error creating entry:', error);
    return NextResponse.json(
      { error: 'Failed to create entry' },
      { status: 500 }
    );
  }
}