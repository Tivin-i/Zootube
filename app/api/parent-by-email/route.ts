import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET /api/parent-by-email?email=xxx - Look up parent by email
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Create a Supabase admin client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Look up user by email using admin API
    const { data: userData, error: userError } =
      await supabase.auth.admin.listUsers();

    if (userError) {
      console.error("Error looking up parent:", userError);
      return NextResponse.json(
        { error: "Failed to look up parent" },
        { status: 500 }
      );
    }

    // Find user with matching email (case-insensitive)
    const parent = userData.users?.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    );

    if (!parent) {
      return NextResponse.json(
        { error: "No parent account found with this email" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      parentId: parent.id,
      email: parent.email,
    });
  } catch (error: any) {
    console.error("Error in GET /api/parent-by-email:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
