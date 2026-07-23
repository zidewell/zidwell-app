// app/api/users-verification/business/route.js
import { NextResponse } from 'next/server';
import identityradar from '@api/identityradar';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      business_name,
      business_number,
      business_country = 'NG',
      media_report = false,
      director_aml = true,
      fatf_check = false
    } = body;

    if (!business_name || !business_number) {
      return NextResponse.json(
        {
          success: false,
          message: 'Business name and number are required',
          error: 'Missing required fields: business_name, business_number'
        },
        { status: 400 }
      );
    }

    // Set API key
    identityradar.auth(process.env.PREMBLY_SECRET_KEY);

    // Make the API call using the SDK
    const response = await identityradar.gettingStartedWithYourApi({
      business_name: business_name,
      business_number: parseInt(business_number.toString()),
      business_country: business_country,
      media_report: media_report,
      director_aml: director_aml,
      fatf_check: fatf_check
    });

    return NextResponse.json({
      success: true,
      data: response.data,
      raw_response: response
    });

  } catch (error) {
    console.error('Business Screening Error:', error.message);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Business screening failed',
        error: error.message
      },
      { status: 500 }
    );
  }
}