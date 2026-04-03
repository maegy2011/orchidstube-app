import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!existingUser) {
      // Don't reveal whether the email exists for security
      return NextResponse.json({
        message: "If an account with this email exists, a reset link has been generated.",
      });
    }

    // Delete any existing tokens for this email
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, normalizedEmail));

    // Generate a secure token (96 hex chars from 3 UUIDs)
    const token = `${crypto.randomUUID()}${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");

    // Token expires in 1 hour
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    // Store the token
    await db.insert(verificationTokens).values({
      identifier: normalizedEmail,
      token,
      expires,
    });

    // In development, return the reset URL directly.
    // In production, this would be sent via email.
    const isDev = process.env.NODE_ENV !== "production";
    const resetUrl = `/auth/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(normalizedEmail)}`;

    return NextResponse.json({
      message: isDev
        ? "Reset link generated successfully."
        : "If an account with this email exists, a reset link has been sent to your email.",
      ...(isDev && { resetUrl, email: normalizedEmail, expiresAt: expires.toISOString() }),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
