import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDeviceConnection } from '@/hooks/use-device-connection';
import { useTheme } from '@/hooks/use-theme';
import GeneralSettingsScreen from './general-settings';
import DeviceScreen from './device';

import { DeviceConnection } from '@/components/device-connection';
import { AnimatedSymbol } from '@/components/ui/animated-symbol';

export default function SettingsScreen() {
  const router = useRouter();
  const { connectedDevice } = useDeviceConnection();
  const theme = useTheme();

  const [activeView, setActiveView] = useState<'menu' | 'general' | 'device'>('menu');

  if (!connectedDevice) {
    return <DeviceConnection />;
  }

  if (activeView === 'general') {
    return <GeneralSettingsScreen onBack={() => setActiveView('menu')} />;
  }

  if (activeView === 'device') {
    return <DeviceScreen onBack={() => setActiveView('menu')} />;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Settings</Text>

        {/* System Settings Section */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>App Configuration</Text>

        <View style={[styles.optionsCard, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: 16 }]}>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => {
              setActiveView('general');
              try { router.push('/general-settings'); } catch (e) {}
            }}
          >
            <View style={[styles.iconCircle, { backgroundColor: theme.backgroundElement }]}>
              <AnimatedSymbol
                name="gearshape.fill"
                fallbackName="settings"
                size={22}
                tintColor={theme.primary}
                animationSpec={{ effect: { type: 'bounce' } }}
              />
            </View>

            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>General Settings</Text>
              <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
                Theme preferences, light/dark mode, app customization
              </Text>
            </View>

            <Text style={[styles.arrowIcon, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Connectivity Section */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>Terminal & Connectivity</Text>

        <View style={[styles.optionsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => {
              setActiveView('device');
              try { router.push('/device'); } catch (e) {}
            }}
          >
            <View style={[styles.iconCircle, { backgroundColor: theme.backgroundElement }]}>
              <AnimatedSymbol
                name="desktopcomputer"
                fallbackName="desktop"
                size={22}
                tintColor={theme.primary}
                animationSpec={{ effect: { type: 'bounce' } }}
              />
            </View>

            <View style={styles.optionContent}>
              <View style={styles.optionTitleRow}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>Master Device</Text>
                {connectedDevice ? (
                  <View style={styles.connectedBadge}>
                    <Text style={styles.connectedBadgeText}>Connected</Text>
                  </View>
                ) : (
                  <View style={styles.disconnectedBadge}>
                    <Text style={styles.disconnectedBadgeText}>Not Connected</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
                View connected desktop terminal details, IP address, and status
              </Text>
            </View>

            <Text style={[styles.arrowIcon, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  optionsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconText: {
    fontSize: 20,
  },
  optionContent: {
    flex: 1,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  connectedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  connectedBadgeText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700',
  },
  disconnectedBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  disconnectedBadgeText: {
    color: '#991B1B',
    fontSize: 10,
    fontWeight: '700',
  },
  optionSubtitle: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  arrowIcon: {
    fontSize: 24,
    fontWeight: '300',
    marginLeft: 10,
  },
});
