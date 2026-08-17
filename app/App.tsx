import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ReportScreen from './ReportScreen';
import MapScreen from './MapScreen';

type Screen = 'report' | 'map';

export default function App() {
  const [screen, setScreen] = useState<Screen>('report');

  return (
    <View style={styles.app}>
      <View style={styles.content}>{screen === 'report' ? <ReportScreen /> : <MapScreen />}</View>

      <View style={styles.tabBar}>
        <Pressable style={styles.tab} onPress={() => setScreen('report')}>
          <Text style={[styles.tabText, screen === 'report' && styles.tabTextActive]}>Report</Text>
        </Pressable>
        <Pressable style={styles.tab} onPress={() => setScreen('map')}>
          <Text style={[styles.tabText, screen === 'map' && styles.tabTextActive]}>Map</Text>
        </Pressable>
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  tabTextActive: {
    color: '#2f6fed',
  },
});
