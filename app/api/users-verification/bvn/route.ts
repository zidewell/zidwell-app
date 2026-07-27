// app/api/users-verification/bvn/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  try {
    const body = await request.json();
    const { number } = body;

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

    const options = {
      method: 'POST',
      url: 'https://api.prembly.com/verification/bvn_validation',
      headers: {
        accept: 'application/json',
        'x-api-key': process.env.PREMBLY_SECRET_KEY,
        'content-type': 'application/json'
      },
      data: { number: number }
    };

    const response = await axios.request(options);

    return NextResponse.json({
      success: true,
      data: response.data,
      raw_response: response.data
    });

  } catch (error) {
    console.error('BVN Verification Error:', error.response?.data || error.message);
    
    return NextResponse.json(
      {
        success: false,
        message: 'BVN verification failed',
        error: error.response?.data || error.message
      },
      { status: error.response?.status || 500 }
    );
  }
}