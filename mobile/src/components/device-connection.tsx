import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Modal from './Modal';
import { useDeviceConnection } from '../hooks/use-device-connection';
import { DiscoveredDevice } from '../services/device-discovery';

import { useTheme } from '../hooks/use-theme';
import { AnimatedSymbol } from './ui/animated-symbol';

function DeviceItem({
  device,
  connected,
  onSelect,
}: {
  device: DiscoveredDevice;
  connected: boolean;
  onSelect: (device: DiscoveredDevice) => void;
}) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.deviceItem,
        { backgroundColor: theme.card, borderColor: theme.border },
        connected && { borderColor: theme.primaryTeal, backgroundColor: theme.backgroundElement },
      ]}
      onPress={() => onSelect(device)}
    >
      <View style={styles.deviceContent}>
        <Text style={[styles.deviceName, { color: theme.text }]}>{device.master_name || device.name}</Text>
        <Text style={[styles.deviceInfo, { color: theme.textSecondary }]}>{device.ip_address}</Text>
        <Text style={[styles.deviceType, { color: theme.textSecondary }]}>{device.device_type}</Text>
      </View>
      <View style={[styles.deviceBadge, { backgroundColor: theme.secondary }]}>
        <Text style={styles.deviceBadgeText}>{connected ? 'Connected' : 'Connect'}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function DeviceConnection() {
  const router = useRouter();
  const theme = useTheme();
  const {
    devices,
    connectedDevice,
    isScanning,
    error,
    scanDevices,
    selectDevice,
    requestConnect,
    disconnect,
    addDevice,
  } = useDeviceConnection();

  const [manualIp, setManualIp] = useState('');

  useEffect(() => {
    scanDevices();
  }, [scanDevices]);

  const handleAddDevice = async () => {
    if (!manualIp.trim()) {
      Alert.alert('Error', 'Enter a device IP address');
      return;
    }

    await addDevice(manualIp.trim());
    setManualIp('');
  };

  const handleConnect = async (device: DiscoveredDevice) => {
    // open email modal for authentication
    setSelectedForAuth(device);
    setEmail('');
    setShowEmailModal(true);
  };

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedForAuth, setSelectedForAuth] = useState<DiscoveredDevice | null>(null);
  const [email, setEmail] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const deviceLabel = selectedForAuth?.master_name || selectedForAuth?.name || 'device';

  const submitAuthRequest = async () => {
    if (!selectedForAuth) return;
    if (!email.trim()) {
      Alert.alert('Error', 'Enter your email for authentication');
      return;
    }

    setModalError(null);
    setIsRequesting(true);
    const success = await requestConnect(selectedForAuth, email.trim());
    setIsRequesting(false);

    if (success) {
      setShowEmailModal(false);
      setSelectedForAuth(null);
      Alert.alert('Connected', `Connected to ${deviceLabel}`);
    } else {
      // keep modal open and show error message inside it
      setModalError(error ?? `Authentication for ${deviceLabel} was denied or timed out`);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    Alert.alert('Disconnected', 'Disconnected from current device');
  };

  const connectedDeviceId = useMemo(() => connectedDevice?.id, [connectedDevice]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[styles.title, { color: theme.text }]}>Available Devices</Text>
          {isScanning && (
            <AnimatedSymbol
              name="antenna.radiowaves.left.and.right"
              fallbackName="radio-outline"
              size={20}
              tintColor={theme.primaryTeal}
              animationSpec={{ effect: { type: 'pulse' }, repeating: true }}
            />
          )}
        </View>
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: theme.primary }]}
          onPress={scanDevices}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.scanButtonText}>Scan</Text>
          )}
        </TouchableOpacity>
      </View>

      {connectedDevice ? (
        <View style={[styles.connectedCard, { backgroundColor: theme.card, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.connectedTitle, { color: theme.textSecondary }]}>Connected to</Text>
            <Text style={[styles.connectedName, { color: theme.text }]}>{connectedDevice.master_name || connectedDevice.name}</Text>
            <Text style={[styles.connectedInfo, { color: theme.textSecondary }]}>{connectedDevice.ip_address}</Text>
            <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
          <AnimatedSymbol
            name="bolt.horizontal.circle.fill"
            fallbackName="link"
            size={48}
            tintColor="#10B981"
            animationSpec={{ effect: { type: 'bounce' } }}
            style={{ marginLeft: 16 }}
          />
        </View>
      ) : (
        <View style={[styles.connectedCardEmpty, { backgroundColor: theme.card, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.connectedTitle, { color: theme.textSecondary }]}>No device connected</Text>
            <Text style={[styles.connectedInfo, { color: theme.textSecondary, marginBottom: 0 }]}>Select a device to connect.</Text>
          </View>
          <AnimatedSymbol
            name="bolt.horizontal.circle"
            fallbackName="link-outline"
            size={48}
            tintColor="#EF4444"
            style={{ marginLeft: 16 }}
          />
        </View>
      )}

      <Modal visible={showEmailModal} onRequestClose={() => { setShowEmailModal(false); setSelectedForAuth(null); }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#071313', marginBottom: 8 }}>Authenticate</Text>
        <Text style={{ fontSize: 13, color: '#4F6371', marginBottom: 12 }}>Enter the email registered on the desktop to request access.</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#7C8994"
          keyboardType="email-address"
          style={{ borderWidth: 1, borderColor: '#D3D4C0', padding: 10, borderRadius: 8, marginBottom: 12, color: '#071313' }}
        />
        {modalError ? (
          <View style={{ backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, marginBottom: 12 }}>
            <Text style={{ color: '#991B1B' }}>{modalError}</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          <TouchableOpacity onPress={() => { setShowEmailModal(false); setSelectedForAuth(null); setModalError(null); }} style={{ padding: 10 }}>
            <Text style={{ color: '#4F6371', fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={submitAuthRequest} style={{ backgroundColor: '#0A2947', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 }}>
            {isRequesting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Request</Text>}
          </TouchableOpacity>
        </View>
      </Modal>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.manualContainer}>
        <TextInput
          value={manualIp}
          onChangeText={setManualIp}
          placeholder="Add device IP address"
          placeholderTextColor={theme.textSecondary}
          style={[styles.manualInput, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
          keyboardType="decimal-pad"
        />
        <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.primaryTeal }]} onPress={handleAddDevice}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <DeviceItem
            device={item}
            connected={item.id === connectedDeviceId}
            onSelect={handleConnect}
          />
        )}
        ListEmptyComponent={
          !isScanning ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No devices found on local network.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3E5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#071313',
  },
  scanButton: {
    backgroundColor: '#0A2947',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  connectedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D3D4C0',
  },
  connectedCardEmpty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D3D4C0',
  },
  connectedTitle: {
    fontSize: 14,
    color: '#4F6371',
    marginBottom: 8,
  },
  connectedName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#071313',
  },
  connectedInfo: {
    fontSize: 14,
    color: '#4F6371',
    marginBottom: 12,
  },
  disconnectButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  disconnectButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#991B1B',
  },
  manualContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#D3D4C0',
    color: '#071313',
  },
  addButton: {
    backgroundColor: '#215E61',
    borderRadius: 14,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 32,
  },
  deviceItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D3D4C0',
  },
  connectedDeviceItem: {
    borderColor: '#215E61',
    backgroundColor: '#E9EDF1',
  },
  deviceContent: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#071313',
  },
  deviceInfo: {
    color: '#4F6371',
    marginTop: 4,
  },
  deviceType: {
    color: '#7C8994',
    marginTop: 4,
    fontSize: 12,
  },
  deviceBadge: {
    backgroundColor: '#FE7F2D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  deviceBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#4F6371',
  },
});
