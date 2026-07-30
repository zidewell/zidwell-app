// app/api/onboarding/complete/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import bank78AccountService from '@/lib/bank78/bank78AccountService';
import { getNombaToken } from '@/lib/nomba'; 

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  // Track what has been created for rollback
  let createdRecords = {
    businessId: null,
    userId: null,
    bvnSaved: false,
  };
  
  try {
    const body = await request.json();
    
    console.log('📥 Onboarding complete request:', {
      userId: body.userId,
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      purpose: body.purpose,
      bvn: body.bvn ? 'present' : 'missing',
      transactionPin: body.transactionPin ? 'present' : 'missing',
      hasBusiness: !!body.business,
    });

    const {
      userId,
      fullName,
      email,
      phone,
      purpose,
      bvn,
      transactionPin,
      business,
      faceMatchData,
    } = body;

    // ✅ Validation
    const missingFields = [];
    if (!userId) missingFields.push('userId');
    if (!fullName) missingFields.push('fullName');
    if (!email) missingFields.push('email');
    if (!bvn) missingFields.push('bvn');
    if (!transactionPin) missingFields.push('transactionPin');

    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          missing: missingFields,
          message: `The following fields are required: ${missingFields.join(', ')}`
        },
        { status: 400 }
      );
    }

    if (!/^\d{4}$/.test(transactionPin)) {
      console.error('❌ Invalid PIN format:', transactionPin);
      return NextResponse.json(
        { error: 'Transaction PIN must be exactly 4 digits' },
        { status: 400 }
      );
    }

    if (!bvn || bvn.length !== 11) {
      console.error('❌ Invalid BVN format:', bvn?.length);
      return NextResponse.json(
        { error: 'Valid 11-digit BVN is required' },
        { status: 400 }
      );
    }

    // 1. Verify BVN with Prembly
    console.log('🔐 Verifying BVN with Prembly...');
    let bvnResult, bvnData;
    try {
      const bvnResponse = await axios.post(
        'https://api.prembly.com/verification/bvn_validation',
        { number: bvn },
        {
          headers: {
            accept: 'application/json',
            'x-api-key': process.env.PREMBLY_SECRET_KEY,
            'content-type': 'application/json'
          },
          timeout: 30000,
        }
      );

      if (!bvnResponse.data.status) {
        console.error('❌ BVN verification failed:', bvnResponse.data);
        return NextResponse.json(
          { error: 'BVN verification failed: ' + (bvnResponse.data.message || 'Invalid BVN') },
          { status: 400 }
        );
      }

      bvnResult = bvnResponse.data;
      bvnData = bvnResult.data || {};
      console.log('✅ BVN verified successfully for:', bvnData.firstName, bvnData.lastName);
    } catch (error) {
      console.error('❌ BVN verification error:', error);
      return NextResponse.json(
        { error: 'BVN verification failed: ' + error.message },
        { status: 400 }
      );
    }

    // Extract verification metadata
    const verificationReference = bvnResult.reference_id || bvnResult.verification?.reference;
    const verificationId = bvnResult.verification?.verification_id;
    const verificationStatus = bvnResult.verification_status || (bvnResult.status ? 'VERIFIED' : 'FAILED');

    // 2. Verify name and date of birth match
    const nameMatches = bvnData.firstName && fullName.toLowerCase().includes(bvnData.firstName.toLowerCase());
    const dobMatches = bvnData.dateOfBirth && business?.dateOfBirth && 
      new Date(bvnData.dateOfBirth).getTime() === new Date(business.dateOfBirth).getTime();

    // 3. Get user's current data
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingUserError) {
      console.error('❌ Failed to fetch existing user:', existingUserError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    const userPhone = phone || existingUser?.phone || '';

    // 4. ✅ FIRST: Save BVN data to user (so Bank78 has the BVN data)
    console.log('📤 Saving BVN data to user...');
    
    const initialUpdateData = {
      bvn_data: bvnData,
      bvn_verification: 'verified',
      transaction_pin: await bcrypt.hash(transactionPin, 10),
      pin_set: true,
      verification_step: 1,
      encrypted_bvn: bvn,
      verification_logs: [
        {
          provider: 'prembly',
          type: 'bvn',
          request_payload: { bvn },
          response_payload: bvnResult,
          status: verificationStatus,
          verified_at: new Date().toISOString(),
          reference: verificationReference,
          verification_id: verificationId
        }
      ]
    };

    const { error: initialUpdateError } = await supabase
      .from('users')
      .update(initialUpdateData)
      .eq('id', userId);

    if (initialUpdateError) {
      console.error('❌ Failed to save BVN data:', initialUpdateError);
      return NextResponse.json(
        { error: 'Failed to save BVN data: ' + initialUpdateError.message },
        { status: 500 }
      );
    }

    createdRecords.bvnSaved = true;
    console.log('✅ BVN data saved to user');

    // 5. Handle business verification and create business record
    let isRegisteredBusiness = false;
    let businessData = null;
    let cacVerificationData = null;
    let directorVerified = false;

    if (purpose === 'business' && business) {
      if (business.cacNumber && business.cacNumber.trim().length > 0) {
        try {
          console.log('🔐 Verifying CAC with Prembly:', business.cacNumber);
          
          const cacResponse = await axios.post(
            'https://api.prembly.com/verification/cac',
            {
              rc_number: business.cacNumber,
              company_type: 'RC'
            },
            {
              headers: {
                accept: 'application/json',
                'x-api-key': process.env.PREMBLY_SECRET_KEY,
                'content-type': 'application/json'
              },
              timeout: 30000,
            }
          );

          if (cacResponse.data.status && cacResponse.data.data && cacResponse.data.data.length > 0) {
            const cacResult = cacResponse.data;
            const cacData = cacResult.data[0];
            const cacVerificationRef = cacResult.reference_id || cacResult.verification?.reference;
            const cacVerificationId = cacResult.verification?.verification_id;
            
            isRegisteredBusiness = true;
            
            const companyActive = cacData.company_status === 'ACTIVE' || cacData.company_status === 'active';
            
            const directors = cacData.directors || [];
            const userIsDirector = directors.some((director: any) => {
              const directorName = `${director.firstname} ${director.otherName || ''} ${director.surname || ''}`.trim();
              return directorName.toLowerCase().includes(fullName.toLowerCase()) ||
                     director.firstname?.toLowerCase().includes(fullName.split(' ')[0]?.toLowerCase());
            });

            directorVerified = userIsDirector;

            cacVerificationData = {
              cac_verified: true,
              company_name: cacData.company_name,
              rc_number: cacData.rc_number,
              company_status: cacData.company_status,
              company_active: companyActive,
              director_verified: directorVerified,
              authorized_representative_verified: directorVerified,
              verification_reference: cacVerificationRef,
              verification_id: cacVerificationId,
              verified_at: new Date().toISOString(),
              full_data: cacData
            };

            // Create business record
            const businessInsert = {
              user_id: userId,
              business_name: cacData.company_name || business.businessName,
              business_address: cacData.company_address || business.businessAddress || '',
              cac_number: business.cacNumber,
              is_registered: true,
              verification_status: 'verified',
              cac_data: cacData,
              business_type: cacData.entity_type || business.businessType || '',
              business_category: business.businessCategory || '',
              business_description: business.businessDescription || '',
              business_email: business.businessEmail || '',
              business_phone: business.businessPhone || '',
              business_website: business.businessWebsite || '',
              map_url: business.mapUrl || '',
              registration_date: cacData.registrationDate || null,
              cac_verified: true,
              company_name: cacData.company_name,
              rc_number: cacData.rc_number,
              company_status: cacData.company_status,
              director_verified: directorVerified,
              authorized_representative_verified: directorVerified,
              verification_reference: cacVerificationRef,
              verification_id: cacVerificationId,
              verified_at: new Date().toISOString(),
              business_kyc_completed: companyActive && directorVerified,
              verification_logs: [
                {
                  provider: 'prembly',
                  type: 'cac',
                  request_payload: { rc_number: business.cacNumber },
                  response_payload: cacResult,
                  status: cacResult.verification_status || 'VERIFIED',
                  verified_at: new Date().toISOString(),
                  reference: cacVerificationRef,
                  verification_id: cacVerificationId
                }
              ],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            const { data: bizData, error: bizError } = await supabase
              .from('businesses')
              .insert(businessInsert)
              .select()
              .single();

            if (!bizError) {
              businessData = bizData;
              createdRecords.businessId = bizData.id;
              console.log('✅ CAC verified for business:', cacData.company_name);
            } else {
              console.error('❌ Failed to create business record:', bizError);
              // ROLLBACK: Remove BVN data from user
              await rollbackBvnData(userId);
              return NextResponse.json(
                { error: 'Failed to create business record: ' + bizError.message },
                { status: 500 }
              );
            }
          } else {
            console.warn('⚠️ CAC verification failed - creating unregistered business');
            isRegisteredBusiness = false;
            businessData = await createUnregisteredBusiness(userId, business);
            if (businessData) createdRecords.businessId = businessData.id;
          }
        } catch (cacError) {
          console.error('❌ CAC verification error:', cacError);
          isRegisteredBusiness = false;
          businessData = await createUnregisteredBusiness(userId, business);
          if (businessData) createdRecords.businessId = businessData.id;
        }
      } else {
        console.log('📋 No CAC number provided - creating unregistered business');
        isRegisteredBusiness = false;
        businessData = await createUnregisteredBusiness(userId, business);
        if (businessData) createdRecords.businessId = businessData.id;
      }
    }

    // 6. ✅ CREATE BANK78 ACCOUNTS (BVN data is now saved)
    console.log('📤 Creating accounts...');
    let bank78Accounts = null;
    
    if (isRegisteredBusiness || purpose !== 'business') {
      // Create Bank78 accounts
      try {
        console.log('📤 Creating Bank78 accounts for user:', userId);
        bank78Accounts = await bank78AccountService.createUserAccounts(userId);
        console.log('✅ Bank78 accounts created successfully');
      } catch (accountError) {
        console.error('❌ Bank78 account creation error:', accountError);
        
        // ✅ ROLLBACK: Delete business record if created
        await rollbackAll(createdRecords, userId);
        
        return NextResponse.json(
          { 
            error: 'Account creation failed', 
            message: accountError.message,
            details: 'Please check your Bank78 configuration and try again. Make sure your API keys and client credentials are correct.',
            status: 'bank78_error'
          },
          { status: 500 }
        );
      }
    } else {
      // Unregistered business - create Nomba account
      try {
        console.log('📤 Creating Nomba account for unregistered business:', userId);
        const nombaResult = await createNombaWallet(userId, existingUser);
        if (nombaResult) {
          console.log('✅ Nomba account created successfully');
        }
      } catch (nombaError) {
        console.error('❌ Nomba account creation error:', nombaError);
        
        // ✅ ROLLBACK: Delete business record if created
        await rollbackAll(createdRecords, userId);
        
        return NextResponse.json(
          { 
            error: 'Nomba account creation failed', 
            message: nombaError.message,
            status: 'nomba_error'
          },
          { status: 500 }
        );
      }
    }

    // 7. ✅ FINALLY: Complete user verification
    console.log('📤 Finalizing user verification...');
    
    const finalUpdateData = {
      verification_step: 6,
      identity_verified: true,
      kyc_level: isRegisteredBusiness ? 'business_verified' : 'personal_verified',
      verified_at: new Date().toISOString(),
      verification_provider: 'prembly',
      verification_reference: verificationReference,
      verification_id: verificationId,
      verification_status: verificationStatus,
      face_match_verified: !!faceMatchData?.verified,
      dob_verified: dobMatches,
      name_verified: nameMatches,
      verification_completed: true,
      ...(userPhone && { phone: userPhone })
    };

    if (isRegisteredBusiness && businessData) {
      finalUpdateData.is_business_registered = true;
      finalUpdateData.business_verified = true;
    }

    const { data: userData, error: finalUpdateError } = await supabase
      .from('users')
      .update(finalUpdateData)
      .eq('id', userId)
      .select()
      .single();

    if (finalUpdateError) {
      console.error('❌ Final update error:', finalUpdateError);
      await rollbackAll(createdRecords, userId);
      return NextResponse.json(
        { error: 'Failed to finalize verification: ' + finalUpdateError.message },
        { status: 500 }
      );
    }

    console.log('✅ User verification finalized:', userId);

    // 8. Prepare response
    const responseData = {
      success: true,
      message: 'Verification complete and account activated',
      user: userData,
      business: businessData,
      wallet_type: bank78Accounts ? 'bank78' : (isRegisteredBusiness ? 'bank78' : 'nomba'),
      verification_summary: {
        identity_verified: true,
        kyc_level: isRegisteredBusiness ? 'business_verified' : 'personal_verified',
        verified_at: new Date().toISOString(),
        verification_provider: 'prembly',
        verification_reference: verificationReference,
        verification_id: verificationId,
        verification_status: 'VERIFIED',
        face_match_verified: !!faceMatchData?.verified,
        name_verified: nameMatches,
        dob_verified: dobMatches,
        business_verified: isRegisteredBusiness,
        cac_verified: isRegisteredBusiness,
        director_verified: directorVerified,
        company_active: cacVerificationData?.company_active || false
      }
    };

    if (bank78Accounts) {
      responseData.bank78 = {
        personal: {
          accountNumber: bank78Accounts.personalAccount?.account_number,
          accountName: bank78Accounts.personalAccount?.account_name,
          bankName: bank78Accounts.personalAccount?.bank_name
        },
        business: bank78Accounts.businessAccount ? {
          accountNumber: bank78Accounts.businessAccount.account_number,
          accountName: bank78Accounts.businessAccount.account_name,
          bankName: bank78Accounts.businessAccount.bank_name
        } : null
      };
    } else if (userData.wallet_id) {
      responseData.nomba = {
        accountNumber: userData.bank_account_number || userData.wallet_id,
        accountName: userData.bank_account_name || userData.full_name,
        bankName: userData.bank_name || 'Wema Bank'
      };
    }

    if (businessData) {
      responseData.business = businessData;
    }

    console.log('✅ Onboarding completed successfully for user:', userId);
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Onboarding error:', error);
    await rollbackAll(createdRecords, body?.userId);
    
    return NextResponse.json(
      { 
        error: 'Onboarding failed', 
        message: error.message || 'An unexpected error occurred',
        details: error.stack
      },
      { status: 500 }
    );
  }
}

/**
 * Rollback BVN data from user
 */
async function rollbackBvnData(userId) {
  try {
    console.log('🔄 Rolling back BVN data for user:', userId);
    await supabase
      .from('users')
      .update({
        bvn_data: null,
        bvn_verification: 'not_submitted',
        encrypted_bvn: null,
        verification_logs: [],
        pin_set: false,
        transaction_pin: null,
        verification_step: 0,
      })
      .eq('id', userId);
    console.log('✅ BVN data rolled back');
  } catch (error) {
    console.error('❌ Rollback error:', error);
  }
}

/**
 * Rollback all created records
 */
async function rollbackAll(createdRecords, userId) {
  // Delete business record if created
  if (createdRecords.businessId) {
    console.log('🔄 Rolling back business record...');
    try {
      await supabase
        .from('businesses')
        .delete()
        .eq('id', createdRecords.businessId);
      console.log('✅ Business record rolled back');
    } catch (rollbackError) {
      console.error('❌ Rollback error:', rollbackError);
    }
  }
  
  // Remove BVN data if saved
  if (createdRecords.bvnSaved && userId) {
    await rollbackBvnData(userId);
  }
}

/**
 * Create an unregistered business record
 */
async function createUnregisteredBusiness(userId, businessData) {
  try {
    console.log('📤 Creating unregistered business record for user:', userId);
    
    const businessInsert = {
      user_id: userId,
      business_name: businessData.businessName || 'Unnamed Business',
      business_address: businessData.businessAddress || '',
      cac_number: null,
      is_registered: false,
      verification_status: 'pending',
      business_type: businessData.businessType || '',
      business_category: businessData.businessCategory || '',
      business_description: businessData.businessDescription || '',
      business_email: businessData.businessEmail || '',
      business_phone: businessData.businessPhone || '',
      business_website: businessData.businessWebsite || '',
      map_url: businessData.mapUrl || '',
      business_kyc_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: bizData, error: bizError } = await supabase
      .from('businesses')
      .insert(businessInsert)
      .select()
      .single();

    if (bizError) {
      console.error('❌ Unregistered business insert error:', bizError);
      return null;
    }

    console.log('✅ Unregistered business created:', bizData.id);
    return bizData;
  } catch (error) {
    console.error('❌ Failed to create unregistered business:', error);
    return null;
  }
}

/**
 * Create a Nomba wallet for unregistered businesses
 * ✅ Uses your existing getNombaToken function
 */
async function createNombaWallet(userId, userData) {
  try {
    console.log('📤 Creating Nomba wallet for user:', userId);
    
    // ✅ Use your existing token function
    const token = await getNombaToken();
    console.log('✅ Nomba token obtained');

    const response = await fetch(`${process.env.NOMBA_URL}/v1/accounts/virtual`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accountId': process.env.NOMBA_ACCOUNT_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountName: userData.full_name,
        accountRef: userId,
        bvn: userData.bvn_data?.bvn
      })
    });

    const wallet = await response.json();

    if (!response.ok || !wallet?.data) {
      console.error('❌ Nomba wallet creation failed:', wallet);
      throw new Error(wallet.message || 'Failed to create Nomba wallet');
    }

    console.log('✅ Nomba wallet created:', wallet.data.accountRef);

    // Update user with Nomba wallet details
    await supabase
      .from('users')
      .update({
        wallet_id: wallet.data.accountRef,
        bank_name: wallet.data.bankName,
        bank_account_number: wallet.data.bankAccountNumber,
        bank_account_name: wallet.data.bankAccountName,
        wallet_provider: 'nomba',
        primary_provider: 'nomba',
        wallet_updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    return wallet.data;
  } catch (error) {
    console.error('❌ Nomba wallet creation error:', error);
    throw new Error('Failed to create Nomba wallet: ' + error.message);
  }
}