import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDeviceConnection } from '@/hooks/use-device-connection';
import { useTheme } from '@/hooks/use-theme';

interface DeviceScreenProps {
  onBack?: () => void;
}

export default function DeviceScreen({ onBack }: DeviceScreenProps = {}) {
  const router = useRouter();
  const { connectedDevice, disconnect } = useDeviceConnection();
  const theme = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    Alert.alert('Disconnected', 'Disconnected from desktop terminal');
    if (onBack) {
      onBack();
    } else {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={[styles.backButtonText, { color: theme.primary }]}>‹ Settings</Text>
        </TouchableOpacity>

        <Text style={[styles.pageTitle, { color: theme.text }]}>Master Device</Text>

        {connectedDevice ? (
          <>
            {/* Status Card */}
            <View style={styles.statusCard}>
              <View style={styles.statusDot} />
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>Connected & Active</Text>
                <Text style={styles.statusSub}>Paired with {connectedDevice.master_name || connectedDevice.name}</Text>
              </View>
            </View>

            {/* Device Details Card */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.cardHeaderTitle, { color: theme.text }]}>Terminal Information</Text>

              <View style={[styles.detailRow, { borderBottomColor: theme.backgroundElement }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Master Name</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{connectedDevice.master_name || connectedDevice.name}</Text>
              </View>

              <View style={[styles.detailRow, { borderBottomColor: theme.backgroundElement }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>IP Address</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{connectedDevice.ip_address}</Text>
              </View>

              <View style={[styles.detailRow, { borderBottomColor: theme.backgroundElement }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Port</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{connectedDevice.port}</Text>
              </View>

              <View style={[styles.detailRow, { borderBottomColor: theme.backgroundElement }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Base URL</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{connectedDevice.base_url}</Text>
              </View>

              <View style={[styles.detailRow, { borderBottomColor: theme.backgroundElement }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Device Type</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{connectedDevice.device_type}</Text>
              </View>

              <View style={styles.detailRowNoBorder}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>App Version</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{connectedDevice.version}</Text>
              </View>
            </View>

            {/* User Session Info Card */}
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.cardHeaderTitle, { color: theme.text }]}>Authenticated Session</Text>

              <View style={[styles.detailRow, { borderBottomColor: theme.backgroundElement }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>User Name</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{connectedDevice.user_name || 'N/A'}</Text>
              </View>

              <View style={[styles.detailRow, { borderBottomColor: theme.backgroundElement }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Email</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{connectedDevice.user_email || 'N/A'}</Text>
              </View>

              <View style={styles.detailRowNoBorder}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Role</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>
                    {(connectedDevice.user_role || 'USER').toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Disconnect Action */}
            <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
              <Text style={styles.disconnectButtonText}>Disconnect Device</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Device Connected</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Your mobile is currently not connected to any desktop terminal. Scan or add a device on the home screen to connect.
            </Text>
            <TouchableOpacity style={[styles.connectNavButton, { backgroundColor: theme.primary }]} onPress={() => router.replace('/')}>
              <Text style={styles.connectNavButtonText}>Go to Connection Screen</Text>
            </TouchableOpacity>
          </View>
        )}
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingVertical: 4,
    paddingRight: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 16,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16A34A',
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15803D',
  },
  statusSub: {
    fontSize: 12,
    color: '#166534',
    marginTop: 2,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  detailRowNoBorder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  roleBadge: {
    backgroundColor: '#FE7F2D',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  disconnectButton: {
    backgroundColor: '#DC2626',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  disconnectButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  emptyCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  connectNavButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  connectNavButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
