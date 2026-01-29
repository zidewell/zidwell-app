// /app/api/contract/saved-signature/route.ts
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

    console.log('GET /api/contract/saved-signature - Fetching saved signature for user:', userId);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get the user's saved signature
    const { data, error } = await supabase
      .from('user_signatures')
      .select('signature_data')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No signature found
        console.log('No saved signature found for user:', userId);
        return NextResponse.json({ 
          success: true, 
          signature: null,
          message: 'No saved signature found'
        });
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to load signature',
          details: error.message 
        },
        { status: 500 }
      );
    }

    console.log('Saved signature found for user:', userId);
    return NextResponse.json({ 
      success: true, 
      signature: data.signature_data,
      message: 'Signature loaded successfully'
    });
  } catch (error) {
    console.error('Error loading signature:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, signature } = body;

    console.log('POST /api/contract/saved-signature - Saving signature for user:', userId);

    if (!userId || !signature) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User ID and signature are required' 
        },
        { status: 400 }
      );
    }

    // Validate signature format (should be a data URL)
    if (!signature.startsWith('data:image/')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid signature format. Expected data URL.' 
        },
        { status: 400 }
      );
    }

    // Upsert (update or insert) the signature
    const { data, error } = await supabase
      .from('user_signatures')
      .upsert({
        user_id: userId,
        signature_data: signature,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to save signature',
          details: error.message 
        },
        { status: 500 }
      );
    }

    console.log('Signature saved successfully for user:', userId);
    return NextResponse.json({ 
      success: true, 
      message: 'Signature saved successfully',
      data: {
        user_id: data.user_id,
        updated_at: data.updated_at
      }
    });
  } catch (error) {
    console.error('Error saving signature:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, signature } = body;

    console.log('PUT /api/contract/saved-signature - Updating signature for user:', userId);

    if (!userId || !signature) {
      return NextResponse.json(
        { 
          success: false,
          error: 'User ID and signature are required for update' 
        },
        { status: 400 }
      );
    }

    // Validate signature format (should be a data URL)
    if (!signature.startsWith('data:image/')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid signature format. Expected data URL.' 
        },
        { status: 400 }
      );
    }

    // First check if the signature exists
    const { data: existingData, error: checkError } = await supabase
      .from('user_signatures')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing signature:', checkError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to check existing signature',
          details: checkError.message 
        },
        { status: 500 }
      );
    }

    // If no signature exists, return error - use POST to create instead
    if (checkError?.code === 'PGRST116') {
      return NextResponse.json(
        { 
          success: false,
          error: 'No existing signature found. Use POST to create a new signature first.',
          message: 'No signature to update'
        },
        { status: 404 }
      );
    }

    // Update the signature
    const { data, error } = await supabase
      .from('user_signatures')
      .update({
        signature_data: signature,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to update signature',
          details: error.message 
        },
        { status: 500 }
      );
    }

    console.log('Signature updated successfully for user:', userId);
    return NextResponse.json({ 
      success: true, 
      message: 'Signature updated successfully',
      data: {
        user_id: data.user_id,
        updated_at: data.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating signature:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS (if needed)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}