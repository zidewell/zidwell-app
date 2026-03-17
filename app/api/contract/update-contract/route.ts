import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(req: NextRequest) {
  return handleUpdate(req);
}

export async function POST(req: NextRequest) {
  return handleUpdate(req);
}

async function handleUpdate(req: NextRequest) {
  try {
    let data;
    
    try {
      data = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { 
          message: "Invalid request body",
          error: "Failed to parse JSON"
        },
        { status: 400 }
      );
    }

    console.log("Update contract request data:", data);

    if (!data.id) {
      return NextResponse.json(
        { 
          message: "Contract ID is required",
          receivedData: data 
        },
        { status: 400 }
      );
    }

    // Prepare update data based on your exact schema
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Map frontend field names to your database column names
    if (data.contract_title !== undefined) updateData.contract_title = data.contract_title;
    if (data.contract_text !== undefined) updateData.contract_text = data.contract_text;
    
    // Note: You don't have contract_content column, only contract_text
    
    // Receiver fields - map to your signee columns
    if (data.receiver_name !== undefined) updateData.signee_name = data.receiver_name;
    if (data.receiver_email !== undefined) updateData.signee_email = data.receiver_email;
    
    // For phone - you have phone_number column
    if (data.receiver_phone !== undefined) {
      // Convert to numeric if needed
      const phoneNum = parseFloat(data.receiver_phone.replace(/\D/g, ''));
      if (!isNaN(phoneNum)) {
        updateData.phone_number = phoneNum;
      }
    }
    
    // Consent fields
    if (data.age_consent !== undefined) updateData.age_consent = data.age_consent;
    if (data.terms_consent !== undefined) updateData.terms_consent = data.terms_consent;
    
    // Status
    if (data.status !== undefined) updateData.status = data.status;
    
    // Lawyer signature
    if (data.include_lawyer_signature !== undefined) updateData.include_lawyer_signature = data.include_lawyer_signature;
    
    // Creator fields
    if (data.creator_name !== undefined) updateData.creator_name = data.creator_name;
    if (data.creator_signature !== undefined) updateData.creator_signature = data.creator_signature;
    
    // If you want to update initiator_name when creator_name is set
    if (data.creator_name !== undefined) updateData.initiator_name = data.creator_name;

 

    // Try to update by different identifier fields
    let updatedContract = null;
    let error = null;

    // Strategy 1: Update by UUID (id field)
    const result1 = await supabase
      .from("contracts")
      .update(updateData)
      .eq("id", data.id)
      .select()
      .single();

    if (!result1.error && result1.data) {
      updatedContract = result1.data;
      console.log("✅ Updated by ID:", data.id);
    } else {
      error = result1.error;
      console.log("❌ Not found by ID:", data.id);
      
      // Strategy 2: Update by token
      console.log("Trying to update by token...");
      const result2 = await supabase
        .from("contracts")
        .update(updateData)
        .eq("token", data.id)
        .select()
        .single();
        
      if (!result2.error && result2.data) {
        updatedContract = result2.data;
        console.log("✅ Updated by token:", data.id);
      } else {
        error = result2.error;
        console.log("❌ Not found by token:", data.id);
      }
    }

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        { 
          message: "Failed to update contract",
          error: error.message,
          code: error.code,
          details: error.details
        },
        { status: 500 }
      );
    }

    if (!updatedContract) {
      return NextResponse.json(
        { 
          message: "Contract not found",
          searchedId: data.id,
          triedFields: ['id', 'token']
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Contract updated successfully",
      contract: updatedContract
    });

  } catch (error) {
    console.error("Unexpected error in update-contract:", error);
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}