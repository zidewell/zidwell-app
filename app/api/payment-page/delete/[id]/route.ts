import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthenticatedWithRefresh } from "@/lib/auth-check-api";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check authentication
    const { user, newTokens } = await isAuthenticatedWithRefresh(req);
    
    if (!user) {
      return NextResponse.json(
        { error: "Please login to delete a page", logout: true },
        { status: 401 }
      );
    }

    // Check if page exists and belongs to user
    const { data: page, error: pageError } = await supabase
      .from("payment_pages")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (pageError || !page) {
      return NextResponse.json(
        { error: "Payment page not found" },
        { status: 404 }
      );
    }

    if (page.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to delete this page" },
        { status: 403 }
      );
    }

    // Delete the page
    const { error: deleteError } = await supabase
      .from("payment_pages")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting page:", deleteError);
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Payment page deleted successfully",
    });

    if (newTokens) {
      // Add token refresh logic if needed
    }
    
    return response;
  } catch (error: any) {
    console.error("Delete page error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}