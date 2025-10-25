"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function CallbackPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Wait for auth to be initialized
    if (!loading) {
      // If user is authenticated, redirect to home
      if (user) {
        router.push("/");
      } else {
        // If no user, redirect to login
        router.push("/auth/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div>
        <h1>Processing your sign-in...</h1>
        <p>Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
}
