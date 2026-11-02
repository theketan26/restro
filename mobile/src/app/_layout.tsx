import * as SplashScreen from 'expo-splash-screen';
import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { QueryProvider } from '@/components/query-provider';
import { ThemeModeProvider } from '@/context/ThemeContext';
import { useDeviceConnection } from '@/hooks/use-device-connection';

SplashScreen.preventAutoHideAsync();

function DebugConnectionToggle() {
  const { connectedDevice, disconnect, connectMock } = useDeviceConnection();

  const handleToggle = async () => {
    if (connectedDevice) {
      await disconnect();
    } else {
      await connectMock();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.debugButton,
        { backgroundColor: connectedDevice ? '#10B981' : '#EF4444' }
      ]}
      onPress={handleToggle}
      activeOpacity={0.8}
    >
      <Text style={styles.debugButtonText}>
        {connectedDevice ? '🔌 Connected (Toggle)' : '🔌 Disconnected (Toggle)'}
      </Text>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  return (
    <ThemeModeProvider>
      <QueryProvider>
        <AnimatedSplashOverlay />
        <AppTabs />
        <DebugConnectionToggle />
      </QueryProvider>
    </ThemeModeProvider>
  );
}

const styles = StyleSheet.create({
  debugButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 9999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
