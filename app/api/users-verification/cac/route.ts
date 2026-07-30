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
    const result = response.data;

    // Extract business verification data
    const businessInfo = result.data && result.data.length > 0 ? result.data[0] : null;
    
    const verificationData = {
      status: result.status,
      reference: result.reference_id || result.verification?.reference,
      verification_id: result.verification?.verification_id,
      account_verified: result.account_verified,
      is_sandbox: result.is_sandbox,
      // Business data
      business_info: businessInfo ? {
        company_name: businessInfo.company_name,
        company_address: businessInfo.company_address,
        entity_type: businessInfo.entity_type,
        company_status: businessInfo.company_status,
        registration_date: businessInfo.registrationDate,
        rc_number: businessInfo.rc_number,
        directors: businessInfo.directors || [],
        company_id: businessInfo.company_id,
        branch_address: businessInfo.branchAddress,
        email_address: businessInfo.email_address,
        lga: businessInfo.lga,
        city: businessInfo.city,
        state: businessInfo.state,
        postcode: businessInfo.postcode,
        // Full data for reference
        full_data: businessInfo
      } : null,
      // Verification metadata
      verification_provider: 'prembly',
      verification_reference: result.reference_id || result.verification?.reference,
      verification_status: result.verification_status || result.status ? 'VERIFIED' : 'FAILED',
      cac_verified: result.account_verified === true || result.status === true,
      raw_response: result
    };

    return NextResponse.json({
      success: true,
      data: verificationData,
      raw_response: result
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