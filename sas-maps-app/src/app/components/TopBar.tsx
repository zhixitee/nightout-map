"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import styles from "./TopBar.module.css";

interface TopBarProps {
  onSearch: (query: string, lat: number, lng: number) => void;
  userLocation: { lat: number; lng: number } | null;
}

export default function TopBar({ onSearch, userLocation }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !userLocation) return;

    setIsSearching(true);
    try {
      const geocoder = new (window as any).google.maps.Geocoder();
      geocoder.geocode({ address: searchQuery }, (results: any[], status: any) => {
        setIsSearching(false);
        if (status === "OK" && results[0]) {
          const location = results[0].geometry.location;
          onSearch(searchQuery, location.lat(), location.lng());
          setSearchQuery("");
          setSearchResults([]);
        }
      });
    } catch (err) {
      console.error("Search error:", err);
      setIsSearching(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setIsProfileOpen(false);
  };

  return (
    <div className={styles.topBarContainer}>
      <div className={styles.topBarContent}>
        {/* Left: Search Bar */}
        <div className={styles.searchSection}>
          <form onSubmit={handleSearch} className={styles.searchBox}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" width="20" height="20">
              <path fill="#5f6368" d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z"/>
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search Google Maps"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
              >
                ✕
              </button>
            )}
          </form>
        </div>

        {/* Right: Profile and Controls */}
        <div className={styles.controlsSection}>
          <button className={styles.controlButton} title="Layers">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="#5f6368" d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
          </button>

          <div className={styles.profileContainer} ref={profileRef}>
            <button
              className={styles.profileButton}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              title={user ? user.email : "Guest"}
            >
              <div className={styles.profileIcon}>
                {user ? (
                  <span className={styles.userInitial}>
                    {user.email?.[0].toUpperCase()}
                  </span>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#5f6368" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                )}
              </div>
            </button>

            {isProfileOpen && (
              <div className={styles.profileMenu}>
                <div className={styles.profileInfo}>
                  <div className={styles.profileBig}>
                    {user ? (
                      <span className={styles.userInitialBig}>
                        {user.email?.[0].toUpperCase()}
                      </span>
                    ) : (
                      <svg viewBox="0 0 24 24" width="32" height="32">
                        <path fill="white" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className={styles.profileEmail}>{user?.email || "Guest User"}</p>
                    <p className={styles.profileStatus}>
                      {user ? "✓ Logged in" : "Not signed in"}
                    </p>
                  </div>
                </div>

                <div className={styles.divider} />

                {user ? (
                  <>
                    <Link href="/profile" className={styles.menuItem}>
                      👤 View Profile
                    </Link>
                    <button onClick={handleLogout} className={styles.logoutItem}>
                      🚪 Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className={styles.menuItem}>
                      🔑 Sign In
                    </Link>
                    <Link href="/auth/signup" className={styles.menuItem}>
                      ✍️ Sign Up
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
