import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { DiscoveredDevice } from '../services/device-discovery';
import {
  sendMessageToDevice,
  sendDataToDevice,
  syncUserDataWithDevice,
} from '../services/data-exchange';

interface DataExchangeProps {
  device: DiscoveredDevice;
  deviceId: string;
  onClose?: () => void;
}

/**
 * Component for exchanging data with a discovered device
 */
export function DataExchange({ device, deviceId, onClose }: DataExchangeProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setIsSending(true);
    try {
      const response = await sendMessageToDevice(
        device.base_url,
        deviceId,
        message
      );

      setResult(response?.message || 'Message sent successfully');
      setMessage('');

      // Clear result after 3 seconds
      setTimeout(() => setResult(null), 3000);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to send message'
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSyncUserData = async () => {
    setIsSending(true);
    try {
      const userData = {
        timestamp: new Date().toISOString(),
        sync_type: 'full_sync',
        data: {
          // Add your user data here
          placeholder: 'Add your user data here',
        },
      };

      const response = await syncUserDataWithDevice(
        device.base_url,
        deviceId,
        userData
      );

      setResult(response?.message || 'Data synced successfully');

      // Clear result after 3 seconds
      setTimeout(() => setResult(null), 3000);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to sync data'
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Device header */}
      <View style={styles.deviceHeader}>
        <View>
          <Text style={styles.deviceName}>{device.name}</Text>
          <Text style={styles.deviceInfo}>
            {device.ip_address}:{device.port}
          </Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Result message */}
      {result && (
        <View style={styles.resultBanner}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      )}

      {/* Message sending section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Send Message</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter message to send"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          editable={!isSending}
        />
        <TouchableOpacity
          style={[styles.button, isSending && styles.buttonDisabled]}
          onPress={handleSendMessage}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>📤 Send Message</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Data sync section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Synchronization</Text>
        <Text style={styles.sectionDescription}>
          Sync user data and preferences with this device
        </Text>
        <TouchableOpacity
          style={[styles.button, isSending && styles.buttonDisabled]}
          onPress={handleSyncUserData}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>🔄 Sync User Data</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Info section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Device ID:</Text>
          <Text style={styles.infoValue}>{device.id}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Type:</Text>
          <Text style={styles.infoValue}>{device.device_type}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Version:</Text>
          <Text style={styles.infoValue}>{device.version}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>URL:</Text>
          <Text style={styles.infoValue}>{device.base_url}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  deviceHeader: {
    backgroundColor: '#007AFF',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  deviceInfo: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    fontSize: 24,
    color: '#fff',
  },
  resultBanner: {
    backgroundColor: '#d4edda',
    padding: 12,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  resultText: {
    color: '#155724',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  button: {
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 12,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
});
