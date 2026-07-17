import React, { useState } from 'react';
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
import { useDeviceDiscovery } from '../hooks/use-device-discovery';
import { DiscoveredDevice } from '../services/device-discovery';

interface DeviceItemProps {
  device: DiscoveredDevice;
  onPress: (device: DiscoveredDevice) => void;
  onRemove: (deviceId: string) => void;
}

/**
 * Component to display a single discovered device
 */
function DeviceItem({ device, onPress, onRemove }: DeviceItemProps) {
  return (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => onPress(device)}
    >
      <View style={styles.deviceContent}>
        <Text style={styles.deviceName}>{device.name}</Text>
        <Text style={styles.deviceInfo}>{device.ip_address}:{device.port}</Text>
        <Text style={styles.deviceType}>{device.device_type}</Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => onRemove(device.id)}
      >
        <Text style={styles.removeButtonText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

interface DeviceDiscoveryProps {
  onDeviceSelected?: (device: DiscoveredDevice) => void;
}

/**
 * Main device discovery component
 */
export function DeviceDiscovery({ onDeviceSelected }: DeviceDiscoveryProps) {
  const {
    devices,
    isScanning,
    error,
    localIp,
    startScan,
    addDevice,
    clearError,
    removeDevice,
  } = useDeviceDiscovery();

  const [manualIp, setManualIp] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const handleAddManualDevice = async () => {
    if (!manualIp.trim()) {
      Alert.alert('Error', 'Please enter an IP address');
      return;
    }

    await addDevice(manualIp);
    setManualIp('');
    setShowManualInput(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover Devices</Text>
        {localIp && <Text style={styles.localIp}>Your IP: {localIp}</Text>}
      </View>

      {/* Error message */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.errorDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Control buttons */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, isScanning && styles.buttonDisabled]}
          onPress={startScan}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>🔍 Scan Network</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowManualInput(!showManualInput)}
        >
          <Text style={styles.buttonText}>➕ Add Device</Text>
        </TouchableOpacity>
      </View>

      {/* Manual IP input */}
      {showManualInput && (
        <View style={styles.manualInputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter device IP (e.g., 192.168.1.100)"
            value={manualIp}
            onChangeText={setManualIp}
            keyboardType="decimal-pad"
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddManualDevice}
          >
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Devices list */}
      {devices.length > 0 ? (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DeviceItem
              device={item}
              onPress={onDeviceSelected || (() => {})}
              onRemove={removeDevice}
            />
          )}
          style={styles.list}
        />
      ) : !isScanning ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No devices discovered yet
          </Text>
          <Text style={styles.emptyStateHint}>
            Tap "Scan Network" to search for devices on your WiFi
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  localIp: {
    fontSize: 12,
    color: '#888',
  },
  errorBanner: {
    backgroundColor: '#fee',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#c33',
    fontSize: 14,
    flex: 1,
  },
  errorDismiss: {
    fontSize: 18,
    color: '#c33',
    marginLeft: 8,
  },
  controls: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  manualInputContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  deviceItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  deviceContent: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  deviceInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  deviceType: {
    fontSize: 11,
    color: '#999',
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#c33',
    fontSize: 18,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
