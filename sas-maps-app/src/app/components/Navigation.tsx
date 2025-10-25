"use client";

import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import styles from "./Navigation.module.css";

export default function Navigation() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.navContent}>
        <Link href="/" className={styles.homeLink}>
          <svg className={styles.homeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
          <span className={styles.homeText}>Home</span>
        </Link>

        <div className={styles.userSection}>
          {user ? (
            <div className={styles.userMenu}>
              <div className={styles.userAvatar}>
                {user.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className={styles.userDropdown}>
                <div className={styles.userEmail}>{user.email}</div>
                <button onClick={handleSignOut} className={styles.signOutButton}>
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Link href="/auth/login" className={styles.loginButton}>
                Login
              </Link>
              <Link href="/auth/signup" className={styles.signupButton}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}