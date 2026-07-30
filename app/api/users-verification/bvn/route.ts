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
    const result = response.data;
    const bvnData = result.data || {};

    // ✅ Map the response to our frontend expected format
    const mappedData = {
      bvn: bvnData.bvn || number,
      firstName: bvnData.firstName || '',
      lastName: bvnData.lastName || '',
      middleName: bvnData.middleName || '',
      nameOnCard: bvnData.nameOnCard || '',
      dateOfBirth: bvnData.dateOfBirth || '',
      // ✅ CRITICAL: Map phoneNumber1 to phone
      phone: bvnData.phoneNumber1 || bvnData.phone || '',
      phoneNumber1: bvnData.phoneNumber1 || '',
      phoneNumber2: bvnData.phoneNumber2 || '',
      email: bvnData.email || '',
      gender: bvnData.gender || '',
      title: bvnData.title || '',
      nationality: bvnData.nationality || '',
      stateOfOrigin: bvnData.stateOfOrigin || '',
      lgaOfOrigin: bvnData.lgaOfOrigin || '',
      stateOfResidence: bvnData.stateOfResidence || '',
      lgaOfResidence: bvnData.lgaOfResidence || '',
      residentialAddress: bvnData.residentialAddress || '',
      enrollmentBank: bvnData.enrollmentBank || '',
      enrollmentBranch: bvnData.enrollmentBranch || '',
      registrationDate: bvnData.registrationDate || '',
      maritalStatus: bvnData.maritalStatus || '',
      levelOfAccount: bvnData.levelOfAccount || '',
      watchListed: bvnData.watchListed || 'False',
      base64Image: bvnData.base64Image || null,
      verification_status: result.verification_status || (result.status ? 'VERIFIED' : 'FAILED'),
      verification_reference: result.reference_id || result.verification?.reference,
      verification_id: result.verification?.verification_id,
      is_sandbox_mode: result.is_sandbox || false,
    };

    return NextResponse.json({
      success: true,
      data: mappedData,
      raw_response: result
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