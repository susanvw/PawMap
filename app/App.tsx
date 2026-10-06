import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import ReportScreen from './ReportScreen';
import MapScreen from './MapScreen';
import { colors } from './theme';

type Screen = 'report' | 'map';

const TABS: { key: Screen; label: string }[] = [
  { key: 'report', label: 'Report' },
  { key: 'map', label: 'Map' },
];

function Shell() {
  const [screen, setScreen] = useState<Screen>('report');
  const insets = useSafeAreaInsets();

  // Both screens stay mounted so the report form survives a trip to the map.
  return (
    <View style={styles.app}>
      <View style={[styles.content, screen !== 'report' && styles.hidden]}>
        <ReportScreen onViewMap={() => setScreen('map')} />
      </View>
      <View style={[styles.content, screen !== 'map' && styles.hidden]}>
        <MapScreen active={screen === 'map'} />
      </View>

      <View
        style={[styles.tabBar, { paddingBottom: insets.bottom }]}
        accessibilityRole="tablist"
      >
        {TABS.map((tab) => {
          const selected = screen === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={styles.tab}
              onPress={() => setScreen(tab.key)}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected }}
            >
              <Text style={[styles.tabText, selected && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Shell />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.background,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
  },
});
