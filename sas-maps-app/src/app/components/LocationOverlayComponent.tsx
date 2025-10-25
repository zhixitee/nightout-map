"use client";

type Props = {
  location: { lat: number; lng: number };
  onClose: () => void;
};


export default function MyCustomInfoBox({ location, onClose }: Props) {
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
          cursor: 'pointer' 
        }}
      >
        &times;
      </button>

      <h3>Selected Location</h3>
      <p>Custom Content.</p>
      <ul>
        <li>Latitude: {location.lat.toFixed(5)}</li>
        <li>Longitude: {location.lng.toFixed(5)}</li>
      </ul>
    </div>
  );
}