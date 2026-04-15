import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email, password } = body;

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: "Token, email, and new password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find and validate the token
    const [existingToken] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, normalizedEmail),
          eq(verificationTokens.token, token)
        )
      )
      .limit(1);

    if (!existingToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    // Check token expiration
    if (existingToken.expires && new Date(existingToken.expires) < new Date()) {
      // Clean up expired token
      await db
        .delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, normalizedEmail),
            eq(verificationTokens.token, token)
          )
        );
      return NextResponse.json(
        { error: "This reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Find the user
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json(
        { error: "No account found with this email address." },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, existingUser.id));

    // Delete the used token
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, normalizedEmail),
          eq(verificationTokens.token, token)
        )
      );

    return NextResponse.json({
      message: "Password has been reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
