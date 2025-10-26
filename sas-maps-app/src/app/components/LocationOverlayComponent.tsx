"use client";

import { PlaceDetails } from "./MapComponent";
import { useTheme } from "@/lib/ThemeContext";
import styles from "./LocationOverlayComponent.module.css";

type Props = {
  isLoading: boolean;
  details: PlaceDetails | null;
  onClose: () => void;
};

export default function LocationOverlay({ isLoading, details, onClose }: Props) {
  const { theme } = useTheme();
  
  return (
    <div 
      className={styles.locationOverlay}
      style={{
        color: 'var(--text-primary)',
        background: 'var(--card-bg)',
        backdropFilter: 'blur(10px)',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: theme === 'dark' 
          ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
          : '0 4px 12px rgba(0, 0, 0, 0.15)',
        border: '1px solid var(--card-border)',
      }}>
      
      
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          border: 'none',
          background: 'transparent',
          fontSize: '1.2rem',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          opacity: 0.7,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.7';
        }}
      >
        &times;
      </button>

      {isLoading && (
        <div>
          <h3>Loading details...</h3>
        </div>
      )}

      
      {!isLoading && details && (
        <div>
          
          {details.photoUrl && (
            <img
              src={details.photoUrl}
              alt={details.name}
              style={{
                width: '100%',
                height: '180px',
                objectFit: 'cover',
                borderRadius: '4px',
                marginBottom: '1rem',
              }}
            />
          )}

         
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            {details.name}
          </h3>
          
          
          {details.name !== details.address && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 0 }}>
              {details.address}
            </p>
          )}

          <div style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>
            
            {details.rating && (
              <p style={{ margin: '4px 0' }}>
                <strong>Rating:</strong> {details.rating.toFixed(1)} ★
              </p>
            )}

            
            {typeof details.price_level === 'number' && (
              <p style={{ margin: '4px 0' }}>
                <strong>Price:</strong> {details.price_level === 0 ? 'Free' : '$'.repeat(details.price_level)}
              </p>
            )}

          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--card-border)', margin: '1rem 0' }} />

          
        </div>
      )}
    </div>
  );
}