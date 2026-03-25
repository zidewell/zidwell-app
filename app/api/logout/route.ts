// pages/api/logout.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("🔵 Logout API called");
    
    // Create response with success message
    const res = NextResponse.json(
      { 
        success: true, 
        message: "Logged out successfully" 
      },
      { status: 200 }
    );

    // Clear HTTP-only cookies with proper settings
    res.cookies.set("sb-access-token", "", { 
      path: "/", 
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    
    res.cookies.set("sb-refresh-token", "", { 
      path: "/", 
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    
    res.cookies.set("verified", "", { 
      path: "/", 
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    console.log("✅ Logout successful, cookies cleared");
    
    return res;
  } catch (error) {
    console.error("Logout error:", error);
    
    // Even on error, try to return a success response
    // because we still want to clear client-side state
    const res = NextResponse.json(
      { 
        success: true, 
        message: "Logged out",
        warning: "Error during server logout, but session cleared"
      },
      { status: 200 }
    );

    // Still clear cookies
    res.cookies.set("sb-access-token", "", { path: "/", maxAge: 0 });
    res.cookies.set("sb-refresh-token", "", { path: "/", maxAge: 0 });
    res.cookies.set("verified", "", { path: "/", maxAge: 0 });

    return res;
  }
}