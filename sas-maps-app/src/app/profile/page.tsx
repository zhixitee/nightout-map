"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

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
            {/* Add preferences controls here in the future */}
            <p className={styles.comingSoon}>Preferences settings coming soon</p>
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