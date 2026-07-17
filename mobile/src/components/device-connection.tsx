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
import Modal from './Modal';
import { useDeviceConnection } from '../hooks/use-device-connection';
import { DiscoveredDevice } from '../services/device-discovery';

function DeviceItem({
  device,
  connected,
  onSelect,
}: {
  device: DiscoveredDevice;
  connected: boolean;
  onSelect: (device: DiscoveredDevice) => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.deviceItem,
        connected && styles.connectedDeviceItem,
      ]}
      onPress={() => onSelect(device)}
    >
      <View style={styles.deviceContent}>
        <Text style={styles.deviceName}>{device.master_name || device.name}</Text>
        <Text style={styles.deviceInfo}>{device.ip_address}</Text>
        <Text style={styles.deviceType}>{device.device_type}</Text>
      </View>
      <View style={styles.deviceBadge}>
        <Text style={styles.deviceBadgeText}>{connected ? 'Connected' : 'Connect'}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function DeviceConnection() {
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Devices</Text>
        <TouchableOpacity
          style={styles.scanButton}
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
        <View style={styles.connectedCard}>
          <Text style={styles.connectedTitle}>Connected to</Text>
          <Text style={styles.connectedName}>{connectedDevice.master_name || connectedDevice.name}</Text>
          <Text style={styles.connectedInfo}>{connectedDevice.ip_address}</Text>
          <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.connectedCardEmpty}>
          <Text style={styles.connectedTitle}>No device connected</Text>
          <Text style={styles.connectedInfo}>Select a device to connect.</Text>
        </View>
      )}

      <Modal visible={showEmailModal} onRequestClose={() => { setShowEmailModal(false); setSelectedForAuth(null); }}>
        <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Authenticate</Text>
        <Text style={{ marginBottom: 12 }}>Enter the email registered on the desktop to request access.</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 12 }}
        />
        {modalError ? (
          <View style={{ backgroundColor: '#fee2e2', padding: 10, borderRadius: 8, marginBottom: 12 }}>
            <Text style={{ color: '#991b1b' }}>{modalError}</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          <TouchableOpacity onPress={() => { setShowEmailModal(false); setSelectedForAuth(null); setModalError(null); }} style={{ padding: 10 }}>
            <Text>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={submitAuthRequest} style={{ backgroundColor: '#007AFF', padding: 10, borderRadius: 8 }}>
            {isRequesting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff' }}>Request</Text>}
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
          placeholder="Add device IP"
          style={styles.manualInput}
          keyboardType="decimal-pad"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddDevice}>
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
              <Text style={styles.emptyText}>No devices found yet.</Text>
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
    backgroundColor: '#f5f5f5',
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
    color: '#111',
  },
  scanButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  connectedCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  connectedCardEmpty: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  connectedTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  connectedName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  connectedInfo: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  disconnectButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  disconnectButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#991b1b',
  },
  manualContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  addButton: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingHorizontal: 16,
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
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  connectedDeviceItem: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  deviceContent: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  deviceInfo: {
    color: '#6b7280',
    marginTop: 4,
  },
  deviceType: {
    color: '#9ca3af',
    marginTop: 4,
    fontSize: 12,
  },
  deviceBadge: {
    backgroundColor: '#007AFF',
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
    color: '#6b7280',
  },
});
