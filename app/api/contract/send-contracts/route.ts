// app/api/send-contract/route.ts
import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { transporter } from "@/lib/node-mailer";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh, createAuthResponse } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const response = NextResponse.json(
      { error: "Please login to access transactions", logout: true },
      { status: 401 }
    );
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    let body: any = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = await req.json();
    }

    const userId = body.userId;
    if (userId !== user.id) {
      return NextResponse.json({ success: false, error: "Unauthorized: User ID mismatch" }, { status: 403 });
    }

    const contractTitle = body.contract_title || body.contractTitle || "Untitled Contract";
    const contractContent = body.contract_content || body.contractContent || body.contract_text || "";
    const contractText = contractContent;
    const receiverEmail = body.receiver_email || body.receiverEmail || body.signee_email || "";
    const receiverName = body.receiver_name || body.receiverName || body.signee_name || "";
    const receiverPhone = body.receiver_phone || body.receiverPhone || body.phone_number || "";
    const isDraft = body.is_draft || body.isDraft || false;
    const includeLawyerSignature = body.include_lawyer_signature || body.includeLawyerSignature || false;
    const creatorName = body.creator_name || body.creatorName || "";
    const creatorSignature = body.creator_signature || body.creatorSignature || "";
    const ageConsent = body.age_consent || body.ageConsent || false;
    const termsConsent = body.terms_consent || body.termsConsent || false;
    const contractIdFromBody = body.contract_id || body.contractId || "";
    const contractDate = body.contract_date || body.contractDate || new Date().toISOString().split("T")[0];
    const paymentTermsContent = body.payment_terms || body.paymentTerms || "";
    const paymentTerms = paymentTermsContent;

    const token = uuidv4();
    const baseUrl = process.env.NODE_ENV === "development" ? process.env.NEXT_PUBLIC_DEV_URL : process.env.NEXT_PUBLIC_BASE_URL;
    const signingLink = !isDraft ? `${baseUrl}/sign-contract/${token}` : null;

    const metadata: any = {
      lawyer_signature: includeLawyerSignature,
      base_fee: 10,
      lawyer_fee: includeLawyerSignature ? 10000 : 0,
      total_fee: includeLawyerSignature ? 10010 : 10,
      creator_name: creatorName,
      creator_signature: creatorSignature || null,
      creator_signature_exists: creatorSignature ? true : false,
      age_consent: ageConsent,
      terms_consent: termsConsent,
      contract_id: contractIdFromBody,
      contract_date: contractDate,
      payment_terms: paymentTerms,
      contract_html: contractContent,
    };

    if (body.metadata?.attachments) {
      metadata.attachments = body.metadata.attachments;
      metadata.attachment_count = body.metadata.attachment_count || 0;
    }

    if (body.metadata?.base_fee) metadata.base_fee = body.metadata.base_fee;
    if (body.metadata?.lawyer_fee) metadata.lawyer_fee = body.metadata.lawyer_fee;
    if (body.metadata?.total_fee) metadata.total_fee = body.metadata.total_fee;

    let existingDraft = null;
    let result: any;

    if (!isDraft && contractIdFromBody) {
      const { data: draftById } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", contractIdFromBody)
        .eq("user_id", userId)
        .eq("is_draft", true)
        .single();

      if (draftById) existingDraft = draftById;

      if (!existingDraft) {
        const { data: draftsWithContractId } = await supabase
          .from("contracts")
          .select("*")
          .eq("user_id", userId)
          .eq("is_draft", true)
          .contains("metadata", { contract_id: contractIdFromBody })
          .single();

        if (draftsWithContractId) existingDraft = draftsWithContractId;
      }
    }

    if (!existingDraft && !isDraft && receiverEmail) {
      const { data: draftData } = await supabase
        .from("contracts")
        .select("*")
        .eq("user_id", userId)
        .eq("signee_email", receiverEmail)
        .eq("contract_title", contractTitle)
        .eq("is_draft", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (draftData && draftData.length > 0) existingDraft = draftData[0];
    }

    const now = new Date().toISOString();

    if (existingDraft && !isDraft) {
      const updateData: any = {
        contract_title: contractTitle,
        contract_text: contractText,
        signee_email: receiverEmail,
        signee_name: receiverName,
        phone_number: receiverPhone,
        status: "pending",
        token: token,
        signing_link: signingLink,
        is_draft: false,
        metadata: metadata,
        age_consent: ageConsent,
        terms_consent: termsConsent,
        include_lawyer_signature: includeLawyerSignature,
        creator_name: creatorName,
        creator_signature: creatorSignature,
        updated_at: now,
        sent_at: now,
      };

      const { data: updatedContract, error: updateError } = await supabase
        .from("contracts")
        .update(updateData)
        .eq("id", existingDraft.id)
        .select()
        .single();

      if (updateError) throw updateError;
      result = updatedContract;
    } else {
      const contractData: any = {
        user_id: userId,
        token: token,
        contract_title: contractTitle,
        contract_text: contractText,
        initiator_email: body.initiator_email || body.initiatorEmail || "",
        initiator_name: body.initiator_name || body.initiatorName || "",
        signee_email: receiverEmail,
        signee_name: receiverName,
        phone_number: receiverPhone,
        status: isDraft ? "draft" : "pending",
        signing_link: signingLink,
        is_draft: isDraft,
        metadata: metadata,
        age_consent: ageConsent,
        terms_consent: termsConsent,
        contract_type: body.contract_type || "custom",
        include_lawyer_signature: includeLawyerSignature,
        creator_name: creatorName,
        creator_signature: creatorSignature,
        created_at: now,
        updated_at: now,
      };

      if (!isDraft) contractData.sent_at = now;

      const { data: newContract, error: insertError } = await supabase
        .from("contracts")
        .insert([contractData])
        .select()
        .single();

      if (insertError) throw insertError;
      result = newContract;
    }

    const headerImageUrl = `${baseUrl}/zidwell-header.png`;
    const footerImageUrl = `${baseUrl}/zidwell-footer.png`;

    if (!isDraft && receiverEmail) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: receiverEmail,
          subject: `Contract for Signature: ${contractTitle}`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .content { padding: 40px; }
    .btn { background: #FDC020; color: #191919; padding: 12px 24px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <img src="${headerImageUrl}" style="width: 100%;" />
    <div class="content">
      <h2 style="color: #111827;">Contract for Signature: ${contractTitle}</h2>
      <p style="color: #4b5563;">Hello ${receiverName},</p>
      <p style="color: #4b5563;">You have received a contract from ${creatorName || "the contract creator"}.</p>
      <div style="margin: 20px 0;">
        <a href="${signingLink}" class="btn" style="background-color: #FDC020; color: #191919;">Review & Sign Contract</a>
      </div>
    </div>
    <img src="${footerImageUrl}" style="width: 100%;" />
  </div>
</body>
</html>`,
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }
    }

    const responseData = {
      success: true,
      message: isDraft ? "Draft saved successfully" : "Contract sent successfully",
      contractId: result.id,
      token: result.token,
      signingLink: result.signing_link,
      verificationCode: result.verification_code,
      isDraft,
      isUpdate: !!existingDraft,
    };

    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error processing contract:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const response = NextResponse.json({ error: "Please login to access transactions", logout: true }, { status: 401 });
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const contractId = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!contractId || !userId || userId !== user.id) {
      return NextResponse.json({ success: false, error: "Contract ID and User ID are required" }, { status: 400 });
    }

    await supabase.from("contracts").delete().eq("id", contractId).eq("user_id", userId);

    const responseData = { success: true, message: "Contract deleted successfully" };
    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error deleting contract:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { user, newTokens } = await isAuthenticatedWithRefresh(req);

  if (!user) {
    const response = NextResponse.json({ error: "Please login to access transactions", logout: true }, { status: 401 });
    if (newTokens) return createAuthResponse(await response.json(), newTokens);
    return response;
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const draftOnly = searchParams.get("draftOnly") === "true";

    if (!userId || userId !== user.id) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    let query = supabase.from("contracts").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (draftOnly) query = query.eq("is_draft", true);

    const { data, error } = await query;
    if (error) throw error;

    const contracts = data?.map((contract) => ({
      id: contract.id,
      contract_id: contract.metadata?.contract_id || contract.id,
      contract_title: contract.contract_title,
      contract_content: contract.contract_text,
      contract_text: contract.contract_text,
      contract_type: contract.contract_type || "custom",
      receiver_name: contract.signee_name || "",
      receiver_email: contract.signee_email || "",
      signee_name: contract.signee_name || "",
      signee_email: contract.signee_email || "",
      receiver_phone: contract.phone_number || "",
      phone_number: contract.phone_number || "",
      age_consent: contract.age_consent || false,
      terms_consent: contract.terms_consent || false,
      status: contract.status || "draft",
      user_id: contract.user_id,
      token: contract.token,
      verification_code: contract.verification_code,
      created_at: contract.created_at,
      updated_at: contract.updated_at,
      is_draft: contract.is_draft || false,
      include_lawyer_signature: contract.include_lawyer_signature || false,
      creator_name: contract.creator_name || "",
      creator_signature: contract.creator_signature || "",
      metadata: contract.metadata || {},
    })) || [];

    const responseData = { success: true, contracts, drafts: draftOnly ? contracts : [], count: contracts.length };
    if (newTokens) return createAuthResponse(responseData, newTokens);
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}