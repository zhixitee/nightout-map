"use client";
import { useState } from 'react';
import { UserPreferences, defaultPreferences } from './Preferences';
import { createClient } from '@supabase/supabase-js';
import styles from './PreferencesSetUp.module.css';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PreferencesFormProps {
    initialPreferences?: UserPreferences;
    userEmail: string;
    onUpdate: (prefs: UserPreferences) => void;
}

export default function PreferencesForm({ initialPreferences, userEmail, onUpdate }: PreferencesFormProps) {
    const [preferences, setPreferences] = useState<UserPreferences>(
        initialPreferences || defaultPreferences
    );
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { error } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: userEmail,
                    preferences: preferences
                });

            if (error) throw error;
            onUpdate(preferences);
        } catch (error) {
            console.error('Error saving preferences:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.preferencesForm}>
            <div className={styles.formGroup}>
                <label htmlFor="partySize">Party Size</label>
                <select
                    id="partySize"
                    value={preferences.partySize}
                    onChange={(e) => setPreferences({
                        ...preferences,
                        partySize: e.target.value as UserPreferences['partySize']
                    })}
                >
                    <option value="solo">Solo</option>
                    <option value="couple">Couple</option>
                    <option value="small-group">Small Group (3-6)</option>
                    <option value="large-group">Large Group (7+)</option>
                </select>
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="vibeType">Preferred Vibe</label>
                <select
                    id="vibeType"
                    value={preferences.vibeType}
                    onChange={(e) => setPreferences({
                        ...preferences,
                        vibeType: e.target.value as UserPreferences['vibeType']
                    })}
                >
                    <option value="chill">Chill</option>
                    <option value="moderate">Moderate</option>
                    <option value="lively">Lively</option>
                    <option value="party">Party</option>
                </select>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="priceRange">Price Range</label>
                <select
                    id="priceRange"
                    value={preferences.priceRange}
                    onChange={(e) => setPreferences({
                        ...preferences,
                        priceRange: e.target.value as UserPreferences['priceRange']
                    })}
                >
                    <option value="budget">Budget (£0~£10pp)</option>
                    <option value="moderate">Moderate (£10~£25pp)</option>
                    <option value="high-end">High End (£25~£50pp)</option>
                    <option value="luxury">Luxury (£50pp~)</option>
                </select>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="musicPreference">Music Preference</label>
                <select
                    id="musicPreference"
                    value={preferences.musicPreference}
                    onChange={(e) => setPreferences({
                        ...preferences,
                        musicPreference: e.target.value as UserPreferences['musicPreference']
                    })}
                >
                    <option value="live-music">Live Music</option>
                    <option value="dj">DJ</option>
                    <option value="background-music">Background Music</option>
                    <option value="quiet">Quiet</option>
                </select>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="venueType">Venue Type</label>
                <select
                    id="venueType"
                    value={preferences.venueType}
                    onChange={(e) => setPreferences({
                        ...preferences,
                        venueType: e.target.value as UserPreferences['venueType']
                    })}
                >
                    <option value="food-and-drink">Food and Drink</option>
                    <option value="entretainment">Entretainment</option>
                    <option value="sport">Sport</option>
                </select>
            </div>
            

            

            <button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Preferences'}
            </button>
        </form>
    );
}