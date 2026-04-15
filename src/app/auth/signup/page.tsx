"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { SignUpForm } from "./components/SignUpForm";

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="size-8 animate-spin text-red-600" />
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
