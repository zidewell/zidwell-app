// app/api/users-verification/cac/route.js
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  try {
    const body = await request.json();
    const { rc_number, company_type = 'RC' } = body;

    if (!rc_number) {
      return NextResponse.json(
        {
          success: false,
          message: 'RC number is required',
          error: 'Missing required field: rc_number'
        },
        { status: 400 }
      );
    }

    const options = {
      method: 'POST',
      url: 'https://api.prembly.com/verification/cac',
      headers: {
        accept: 'application/json',
        'x-api-key': process.env.PREMBLY_SECRET_KEY,
        'content-type': 'application/json'
      },
      data: {
        rc_number: rc_number,
        company_type: company_type
      }
    };

    const response = await axios.request(options);

    return NextResponse.json({
      success: true,
      data: response.data,
      raw_response: response.data
    });

  } catch (error) {
    console.error('CAC Verification Error:', error.response?.data || error.message);
    
    return NextResponse.json(
      {
        success: false,
        message: 'CAC verification failed',
        error: error.response?.data || error.message
      },
      { status: error.response?.status || 500 }
    );
  }
}