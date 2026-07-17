import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/themed-view';
import { DeviceConnection } from '@/components/device-connection';

export default function HomeScreen() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <DeviceConnection />
      </SafeAreaView>
    </ThemedView>
  );
}
