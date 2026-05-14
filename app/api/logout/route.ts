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
    const cookiesToClear = [
      "sb-access-token",
      "sb-refresh-token", 
      "verified",
      "sb-client-session",
      "sb-login-time"
    ];
    
    cookiesToClear.forEach(cookieName => {
      res.cookies.set(cookieName, "", { 
        path: "/", 
        maxAge: 0,
        httpOnly: cookieName !== "sb-client-session" && cookieName !== "sb-login-time",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    });

    console.log("✅ Logout successful, cookies cleared");
    
    return res;
  } catch (error) {
    console.error("Logout error:", error);
    
    const res = NextResponse.json(
      { 
        success: true, 
        message: "Logged out",
        warning: "Error during server logout, but session cleared"
      },
      { status: 200 }
    );

    // Still clear cookies on error
    const cookiesToClear = [
      "sb-access-token",
      "sb-refresh-token", 
      "verified",
      "sb-client-session",
      "sb-login-time"
    ];
    
    cookiesToClear.forEach(cookieName => {
      res.cookies.set(cookieName, "", { path: "/", maxAge: 0 });
    });

    return res;
  }
}