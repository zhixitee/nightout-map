"use client";

import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import Link from "next/link";
import styles from "./Navigation.module.css";
import { usePathname } from "next/navigation";
import { useState } from "react";
import PlacesSearch from "../components/PlacesComponent";
import type { PlaceData } from "../components/PlacesComponent";

export default function Navigation() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [showSearchUI, setShowSearchUI] = useState(false);

  const center = {lat: 55.862422, lng: -4.256248};
  const radius = 5000;
  const type = "bar";

  const handlePlacesFetched = (places: PlaceData[]) => {
    console.log("Fetched places:", places);
  };

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
        <div className={styles.leftSection}>
          {pathname !== "/" && (
            <Link href="/" className={styles.homeLink}>
              <svg
                className={styles.homeIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9,22 9,12 15,12 15,22" />
              </svg>
              <span className={styles.homeText}>Home</span>
            </Link>
          )}
          <div className={styles.searchSection}>
            <button
              onClick={() => setShowSearchUI(true)}
              disabled={showSearchUI}
              className={styles.showPlacesButton}
            >
              Show Places Search
            </button>
            {showSearchUI && (
              <div className={styles.placesSearch}>
                <PlacesSearch
                  center={center}
                  radius={radius}
                  type={type}
                  onPlacesFetched={handlePlacesFetched}
                  onClose={() => setShowSearchUI(false)}
                />
              </div>
            )}
          </div>
        </div>

        <button onClick={toggleTheme} className={styles.themeToggle}>
          {theme === 'light' ? (
            <svg className={styles.themeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
          ) : (
            <svg className={styles.themeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </button>

        <div className={styles.userSection}>
          {user ? (
            <div className={styles.userMenu}>
              <Link href="/profile" className={styles.userAvatar}>
                {user.email?.charAt(0).toUpperCase() || "U"}
              </Link>
              <div className={styles.userDropdown}>
                <div className={styles.userEmail}>{user.email}</div>
                <Link href="/profile" className={styles.profileLink}>
                  View Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className={styles.signOutButton}
                >
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
