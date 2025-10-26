import { UserPreferences } from './Preferences';
import styles from './PreferencesDisplay.module.css';

interface PreferencesDisplayProps {
  preferences: UserPreferences;
}

export default function PreferencesDisplay({ preferences }: PreferencesDisplayProps) {
  const formatKey = (key: string) => {
    return key.replace(/([A-Z])/g, ' $1')
      .split('-').join(' ')
      .replace(/^\w/, c => c.toUpperCase());
  };

  const formatValue = (value: string) => {
    return value.split('-').join(' ')
      .replace(/^\w/, c => c.toUpperCase());
  };

  return (
    <div className={styles.preferencesDisplay}>
      {Object.entries(preferences).map(([key, value]) => (
        <div key={key} className={styles.preferenceItem}>
          <span className={styles.preferenceLabel}>{formatKey(key)}:</span>
          <span className={styles.preferenceValue}>{formatValue(value)}</span>
        </div>
      ))}
    </div>
  );
}