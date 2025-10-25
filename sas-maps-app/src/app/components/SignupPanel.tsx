"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import styles from "./SignupPanel.module.css";

export default function SignupPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      router.push("/auth/login?message=Check your email to confirm your account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Google sign-up failed";
      if (errorMsg.includes("not enabled") || errorMsg.includes("validation_failed")) {
        setError(
          "Google OAuth not yet configured. Use email/password to sign up, then you can link Google later. " +
          "See GOOGLE_OAUTH_SETUP.md for setup instructions."
        );
      } else {
        setError(errorMsg);
      }
    }
  };

  return (
    <div className={styles.panel}>
      <h2>Get Started</h2>
      <p>Join NightOut to find the best spots near you</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            required
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Creating..." : "Sign Up"}
        </button>
      </form>

      <div className={styles.divider}>
        <span>or</span>
      </div>

      <button onClick={handleGoogleSignUp} className={styles.googleButton}>
        <svg className={styles.googleIcon} viewBox="0 0 24 24" width="18" height="18">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign up with Google
      </button>

      <p className={styles.link}>
        Already have an account? <a href="/auth/login">Sign in</a>
      </p>
    </div>
  );
}
