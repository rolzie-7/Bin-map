import { StyleSheet } from 'react-native';
import Map from '@/components/Map';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

import React, { useEffect, useState } from 'react'
import { ScrollView } from 'react-native';
import { supabase } from '../../scripts/supabase'

export default function HomeScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase.from('Bins').select('*');
      if (error) console.error(error);
      else setItems(data);
      setLoading(false);
    };

    fetchItems();
  }, []);
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
        <ThemedText type="title">🗺️ Bin Map - BUT BINMAP NO LONGER!</ThemedText>
          {!loading && items.length > 0 && <Map bins={items} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
