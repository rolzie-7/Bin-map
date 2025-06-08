import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions, StyleSheet, TouchableOpacity, } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { supabase } from '../scripts/supabase.ts';

import generalIconUrl from '../assets/images/general.png';
import recycleIconUrl from '../assets/images/recycling.png';
import foodWasteIconUrl from '../assets/images/FoodWaste.png';

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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Adjust these deltas to control zoom level
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = 0.01;

// Fallback center if no bins are loaded yet
const DEFAULT_REGION: Region = {
  latitude: 51.4979053,
  longitude: -0.1784239,
  latitudeDelta: LATITUDE_DELTA,
  longitudeDelta: LONGITUDE_DELTA,
};

export default function MapNative() {
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);

  const [showCapacity, setShowCapacity] = useState(false);
  // to show and hide the capacity message
  

  // Load bin data from Supabase on mount
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from<Bin>('Bins')
        .select('*');
      if (error) {
        console.error('Error fetching bins:', error);
      } else if (data && data.length > 0) {
        setBins(data);

        // Center the map on the first bin
        const first = data[0];
        setRegion({
          latitude: first.Latitude,
          longitude: first.Longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });
      }
      setLoading(false);
    })();
  }, []);

  // Handler for when the map has finished rendering
  const onMapReady = () => {
    console.log('Map is ready.');
  };

  // Handler for when the user pans or zooms and the viewport settles
  const onRegionChangeComplete = (newRegion: Region) => {
    console.log('Map moved to:', newRegion);
    // You could update state or fetch new data here if needed
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading map…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        onMapReady={onMapReady}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {bins.map(bin => {
          // Pick the correct icon based on bin type
          let iconImage = generalIconUrl;
          if (bin.isFoodWaste) {
            iconImage = foodWasteIconUrl;
          } else if (bin.isRecycle) {
            iconImage = recycleIconUrl;
          }

          return (
            <Marker
              key={bin.id}
              coordinate={{
                latitude: bin.Latitude,
                longitude: bin.Longitude,
              }}
              title={bin.Type ?? 'Bin'}
              description={bin.Desc}
              // The `image` prop accepts a local require/import
              image={iconImage}

              // when user press, show the capacity message
              onPress = {() => setShowCapacity(true)}
            />
          );
        })}
      </MapView>

      {showCapacity && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>
            Current capacity is: <Text style={{ fontWeight: 'bold' }}>full</Text>
          </Text>
          <TouchableOpacity
            onPress={() => setShowCapacity(false)}
            style={styles.closeButtonTouchable}
          >
            <Text style={styles.closeButton}>×</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    position: 'absolute',
    bottom: 20, // adjust as needed
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderColor: '#666',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  messageText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  closeButtonTouchable: {
    marginLeft: 12,
    padding: 4,
  },
  closeButton: {
    fontSize: 18,
    color: '#333',
  },
});