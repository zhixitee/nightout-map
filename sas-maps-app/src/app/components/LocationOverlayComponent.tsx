"use client";

import { PlaceDetails } from "./MapComponent";

type Props = {
  isLoading: boolean;
  details: PlaceDetails | null;
  onClose: () => void;
};

export default function MyCustomInfoBox({ isLoading, details, onClose }: Props) {
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 10,
      color: 'black',
      background: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      width: '300px',
      maxHeight: 'calc(100vh - 40px)',
      overflowY: 'auto',
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
          color: 'black',
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

         
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>
            {details.name}
          </h3>
          
          
          {details.name !== details.address && (
            <p style={{ fontSize: '0.9rem', color: '#555', marginTop: 0 }}>
              {details.address}
            </p>
          )}

          <div style={{ marginTop: '1rem' }}>
            
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

          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '1rem 0' }} />

          
        </div>
      )}
    </div>
  );
}