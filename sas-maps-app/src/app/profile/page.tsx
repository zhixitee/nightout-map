"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";
import { UserPreferences, defaultPreferences } from "./Preferences";
import { createClient } from "@supabase/supabase-js";
import PreferencesDisplay from "./PreferencesDisplay";
import PreferencesSetUp from "./PreferencesSetUp";
import styles from "./profile.module.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isEditingPreferences, setIsSettingPreferences] = useState(false);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);
  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("preferences")
        .eq("user_id", user?.email)
        .single();
      if (error) throw error;
      setPreferences(data?.preferences || null);
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };


  // Redirect to login if not authenticated
  if (!loading && !user) {
    router.push("/auth/login");
    return null;
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner} />
        <p>Loading profile...</p>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileHeader}>
        <div className={styles.profileAvatar}>
          {user?.email?.[0].toUpperCase()}
        </div>
        <h1 className={styles.profileName}>Your Profile</h1>
      </div>

      <div className={styles.profileContent}>
        <section className={styles.profileSection}>
          <h2>Account Information</h2>
          <div className={styles.profileInfo}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Email</span>
              <span className={styles.value}>{user?.email}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Account Created</span>
              <span className={styles.value}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </section>

        <section className={styles.profileSection}>
          <h2>Preferences</h2>

          <div className={styles.preferencesList}>
            {isEditingPreferences ? (
              <PreferencesSetUp
                initialPreferences={preferences || undefined}
                userEmail={user!.email!}
                onUpdate={(newPrefs) => {
                  setPreferences(newPrefs);
                  setIsSettingPreferences(false);
                }}
              />
            ) : (
              <>
                {preferences ? (
                  <PreferencesDisplay preferences={preferences} />
                ) : (<p>No preferences set.</p>)}
                <button
                  onClick={() => setIsSettingPreferences(true)}
                  className={styles.editPreferencesButton}
                >
                  {preferences ? 'Edit Preferences' : 'Set Preferences'}
                </button>
              </>
            )}
            {/* Add preferences controls here in the future */}
            <p className={styles.comingSoon}>Preferences</p>
          </div>
        </section>

        <section className={styles.profileSection}>
          <h2>Saved Places</h2>
          <div className={styles.savedPlaces}>
            {/* Add saved places list here in the future */}
            <p className={styles.comingSoon}>Saved places feature coming soon</p>
          </div>
        </section>

        <div className={styles.actions}>
          <button onClick={handleSignOut} className={styles.signOutButton}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}