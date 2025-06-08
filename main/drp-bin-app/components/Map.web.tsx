// MapWeb.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { supabase } from '../scripts/supabase.ts';

import generalIconUrl from '../assets/images/general.png';
import recycleIconUrl from '../assets/images/recycling.png';
import foodWasteIconUrl from '../assets/images/FoodWaste.png';

const MIN_ZOOM = 14;           // Only show/load markers at zoom ≥ 14
const INITIAL_ZOOM = 14;       // Initial zoom level if no geolocation
const INITIAL_CENTER = {       // Fallback center before we get user location
  lat: 51.4979053,
  lng: -0.1784239,
};

const containerStyle = {
  width: '100vw',
  height: '80vh',
};

type Bin = {
  id: string | number;
  Latitude: number;
  Longitude: number;
  Address: string;
  Type?: string;
  isRecycle: boolean;
  isGeneral: boolean;
  isFoodWaste: boolean;
  Desc: string;
};

export default function MapWeb() {
  const [bins, setBins] = useState<Bin[]>([]);
  const [showCapacity, setShowCapacity] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API || '',
  });

  // 1) On mount, ask for browser geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
      },
      error => {
        console.warn('Error getting user location:', error);
        // If user denies or error, we’ll just leave userLocation as null
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // 2) Whenever the map is ready AND we have userLocation, pan/zoom to it
  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;

    // If we already fetched userLocation before the map loaded,
    // pan/zoom here:
    if (userLocation) {
      map.panTo(userLocation);
      map.setZoom(INITIAL_ZOOM);
    }

    // Also trigger initial bin‐load based on the initial viewport:
    handleIdle();
  }, [userLocation]);

  // 3) When userLocation changes (after map has initialized), pan/zoom
  useEffect(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(INITIAL_ZOOM);
    }
  }, [userLocation]);

  // 4) Whenever the map “goes idle” (panning/zoom stops), load any bins in viewport
  const handleIdle = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;

    const zoom = map.getZoom() ?? 0;
    if (zoom < MIN_ZOOM) {
      setBins([]); // Clear markers if zoomed out
      return;
    }

    const bounds = map.getBounds();
    if (!bounds) return;

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    // Query only bins within this viewport
    const { data, error } = await supabase
      .from<Bin>('Bins')
      .select('*')
      .gte('Latitude', sw.lat())
      .lte('Latitude', ne.lat())
      .gte('Longitude', sw.lng())
      .lte('Longitude', ne.lng());

    if (error) {
      console.error('Error loading viewport bins:', error);
    } else {
      setBins(data || []);
    }
  }, []);

  if (!isLoaded) return <p>Loading map…</p>;
  if (loadError) return <div>Error loading map</div>;

  return (
    <div style={{ position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userLocation ?? INITIAL_CENTER}
        zoom={INITIAL_ZOOM}
        onLoad={onLoad}
        onIdle={handleIdle}
      >
        {/* Show a “You Are Here” marker if we have the location */}
        {userLocation && (
          <Marker
            position={userLocation}
            title="You are here"
            icon={{
              // You can replace this with any marker image or SVG you prefer
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new window.google.maps.Size(40, 40),
              anchor: new window.google.maps.Point(20, 40),
            }}
          />
        )}

        {/* Render all bins (if zoom ≥ MIN_ZOOM) */}
        {bins.map(bin => {
          let iconUrl = generalIconUrl.uri;
          if (bin.isFoodWaste) {
            iconUrl = foodWasteIconUrl.uri;
          } else if (bin.isRecycle) {
            iconUrl = recycleIconUrl.uri;
          }

          return (
            <Marker
              key={bin.id.toString()}
              position={{ lat: bin.Latitude, lng: bin.Longitude }}
              title={bin.Desc || 'Bin'}
              icon={{
                url: iconUrl,
                scaledSize: new window.google.maps.Size(40, 40),
                anchor: new window.google.maps.Point(20, 40),
              }}
              onClick={() => setShowCapacity(true)}
            />
          );
        })}
      </GoogleMap>

      {showCapacity && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            backgroundColor: '#fff',
            borderColor: '#666',
            borderWidth: 1,
            borderStyle: 'solid',
            borderRadius: 8,
            padding: 12,
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
          }}
        >
          <span style={{ flex: 1, fontSize: 16, color: '#333' }}>
            Current capacity is: <strong>full</strong>
          </span>
          <button
            onClick={() => setShowCapacity(false)}
            style={{
              marginLeft: 12,
              background: 'none',
              border: 'none',
              fontSize: 18,
              color: '#333',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
