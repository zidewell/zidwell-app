// app/api/users-verification/bvn/route.js
import { NextResponse } from 'next/server';
import prembly from '@api/prembly';

export async function POST(request) {
  try {
    const body = await request.json();
    const { number } = body;

    // Validate input
    if (!number) {
      return NextResponse.json(
        {
          success: false,
          message: 'BVN number is required',
          error: 'Missing required field: number'
        },
        { status: 400 }
      );
    }

    // Make the API call using the SDK
    const response = await prembly.bvnBasic(
      { number: number },
      { 'x-api-key': process.env.PREMBLY_SECRET_KEY }
    );

    return NextResponse.json({
      success: true,
      data: response.data,
      raw_response: response
    });

  } catch (error) {
    console.error('BVN Verification Error:', error.message);
    
    return NextResponse.json(
      {
        success: false,
        message: 'BVN verification failed',
        error: error.message
      },
      { status: 500 }
    );
  }
}