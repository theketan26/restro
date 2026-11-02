import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { DeviceConnection } from '@/components/device-connection';
import { useDeviceConnection } from '@/hooks/use-device-connection';
import { useTheme } from '@/hooks/use-theme';
import { AdminDashboard } from '@/components/role-screens/AdminDashboard';
import { WaiterScreen } from '@/components/role-screens/WaiterScreen';
import { ChefKdsScreen } from '@/components/role-screens/ChefKdsScreen';
import { CustomerScreen } from '@/components/role-screens/CustomerScreen';

export default function HomeScreen() {
  const { connectedDevice, disconnect } = useDeviceConnection();
  const theme = useTheme();

  const renderRoleScreen = () => {
    if (!connectedDevice) {
      return <DeviceConnection />;
    }

    const role = (connectedDevice.user_role || '').toLowerCase().trim();

    switch (role) {
      case 'admin':
      case 'manager':
        return <AdminDashboard device={connectedDevice} onDisconnect={disconnect} />;
      case 'waiter':
        return <WaiterScreen device={connectedDevice} onDisconnect={disconnect} />;
      case 'chef':
        return <ChefKdsScreen device={connectedDevice} onDisconnect={disconnect} />;
      case 'customer':
        return <CustomerScreen device={connectedDevice} onDisconnect={disconnect} />;
      default:
        return <AdminDashboard device={connectedDevice} onDisconnect={disconnect} />;
    }
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        {renderRoleScreen()}
      </SafeAreaView>
    </ThemedView>
  );
}
