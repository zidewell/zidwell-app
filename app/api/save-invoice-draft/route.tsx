import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createNewDraft(body: any) {
  console.log('Creating new draft');
  
  const orderReference = `DRAFT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const publicToken = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const { data: invoiceData, error: invoiceError } = await supabase
    .from('invoices')
    .insert([
      {
        user_id: body.userId,
        invoice_id: body.invoice_id,
        order_reference: orderReference,
        business_name: body.business_name,
        business_logo: body.business_logo,
        from_email: body.initiator_email,
        from_name: body.initiator_name,
        client_name: body.signee_name,
        client_email: body.signee_email,
        client_phone: body.clientPhone,
        bill_to: body.bill_to,
        issue_date: body.issue_date,
        customer_note: body.customer_note,
        message: body.message,
        total_amount: body.total_amount,
        subtotal: body.total_amount,
        fee_amount: 0,
        payment_type: body.payment_type,
        fee_option: body.fee_option,
        status: 'draft',
        redirect_url: body.redirect_url,
        target_quantity: body.target_quantity,
        allow_multiple_payments: body.payment_type === 'multiple',
        payment_link: '',
        signing_link: '',
        public_token: publicToken,
        is_draft: true,
      }
    ])
    .select()
    .single();

  if (invoiceError) {
    console.error('Invoice insert error:', invoiceError);
    throw invoiceError;
  }

  if (body.invoice_items && body.invoice_items.length > 0) {
    const invoiceItems = body.invoice_items.map((item: any) => ({
      invoice_id: invoiceData.id,
      item_description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_amount: item.total,
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);

    if (itemsError) {
      console.error('Invoice items insert error:', itemsError);
    }
  }

  return invoiceData;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Draft payload received');

    const invoiceData = await createNewDraft(body);

    return NextResponse.json({ 
      success: true, 
      invoiceId: invoiceData.id,
      message: 'Draft saved successfully' 
    });
  } catch (error: any) {
    console.error('Error saving draft:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save draft' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log('Draft update payload received:', { 
      invoice_id: body.invoice_id,
      status: body.status 
    });

    const { data: existingInvoice, error: fetchError } = await supabase
      .from('invoices')
      .select('id, invoice_id, status, is_draft')
      .eq('invoice_id', body.invoice_id)
      .single();

    if (fetchError || !existingInvoice) {
      console.log('Invoice not found, creating new one');
      const invoiceData = await createNewDraft(body);
      
      return NextResponse.json({ 
        success: true, 
        invoiceId: invoiceData.id,
        message: 'Draft created successfully' 
      });
    }

    console.log('Found existing invoice:', existingInvoice);

    const updateData: any = {
      business_name: body.business_name,
      business_logo: body.business_logo,
      from_email: body.initiator_email,
      from_name: body.initiator_name,
      client_name: body.signee_name,
      client_email: body.signee_email,
      client_phone: body.clientPhone,
      bill_to: body.bill_to,
      issue_date: body.issue_date,
      customer_note: body.customer_note,
      message: body.message,
      total_amount: body.total_amount,
      subtotal: body.total_amount,
      payment_type: body.payment_type,
      fee_option: body.fee_option,
      redirect_url: body.redirect_url,
      target_quantity: body.target_quantity,
      allow_multiple_payments: body.payment_type === 'multiple',
      updated_at: new Date().toISOString(),
    };

    if (body.status && body.status !== 'draft') {
      updateData.status = body.status;
      updateData.is_draft = false;
      
      if (body.status === 'unpaid') {
        updateData.order_reference = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        updateData.public_token = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        updateData.signing_link = `/invoice/${body.invoice_id}`;
        updateData.payment_link = `/pay/${body.invoice_id}`;
        
        if (body.fee_option === 'customer') {
          const feeAmount = Math.min(body.total_amount * 0.03, 2000);
          updateData.fee_amount = feeAmount;
          updateData.subtotal = body.total_amount - feeAmount;
        }
      }
    }

    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('invoice_id', body.invoice_id)
      .select()
      .single();

    if (updateError) {
      console.error('Invoice update error:', updateError);
      throw updateError;
    }

    if (body.invoice_items && body.invoice_items.length > 0) {
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', updatedInvoice.id);

      if (deleteError) {
        console.error('Error deleting old invoice items:', deleteError);
      }

      const invoiceItems = body.invoice_items.map((item: any) => ({
        invoice_id: updatedInvoice.id,
        item_description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_amount: item.total,
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) {
        console.error('Invoice items insert error:', itemsError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      invoiceId: updatedInvoice.id,
      invoice_id: body.invoice_id,
      signingLink: updateData.signing_link,
      message: body.status === 'draft' ? 'Draft updated successfully' : 'Invoice sent successfully'
    });
  } catch (error: any) {
    console.error('Error updating draft:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update draft' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const invoice_id = searchParams.get('invoice_id');

    if (!invoice_id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('id, invoice_id, status, is_draft')
      .eq('invoice_id', invoice_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ exists: false });
      }
      throw error;
    }

    return NextResponse.json({ 
      exists: true,
      invoice_id: invoice.invoice_id,
      status: invoice.status,
      is_draft: invoice.is_draft
    });
  } catch (error: any) {
    console.error('Error checking invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check invoice' },
      { status: 500 }
    );
  }
}