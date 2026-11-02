import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { DiscoveredDevice } from '../../services/device-discovery';
import { httpClient } from '../../infrastructure/http/axios-client';
import { useTheme } from '../../hooks/use-theme';

interface AdminDashboardProps {
  device: DiscoveredDevice;
  onDisconnect: () => void;
}

export function AdminDashboard({ device, onDisconnect }: AdminDashboardProps) {
  const theme = useTheme();
  const [stats, setStats] = useState({
    itemCount: 0,
    orderCount: 0,
    connectedDevicesCount: 0,
    loading: true,
  });

  const fetchStats = async () => {
    try {
      setStats((prev) => ({ ...prev, loading: true }));
      const [itemsRes, ordersRes, devicesRes] = await Promise.allSettled([
        httpClient.get(`${device.base_url}/api/items`),
        httpClient.get(`${device.base_url}/api/orders`),
        httpClient.get(`${device.base_url}/api/device/connected`),
      ]);

      let items = 0;
      if (itemsRes.status === 'fulfilled' && itemsRes.value.data?.data) {
        items = itemsRes.value.data.data.total_unfiltered || itemsRes.value.data.data.items?.length || 0;
      }

      let orders = 0;
      if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value.data?.data)) {
        orders = ordersRes.value.data.data.length;
      }

      let devCount = 0;
      if (devicesRes.status === 'fulfilled' && Array.isArray(devicesRes.value.data?.data)) {
        devCount = devicesRes.value.data.data.length;
      }

      setStats({
        itemCount: items,
        orderCount: orders,
        connectedDevicesCount: devCount,
        loading: false,
      });
    } catch (e) {
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchStats();
  }, [device.base_url]);

  const userRole = device.user_role ? device.user_role.toUpperCase() : 'ADMIN';
  const userName = device.user_name || 'Admin User';
  const userEmail = device.user_email || 'admin@stackrise.local';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      {/* Header Card */}
      <View style={[styles.headerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.userInfoRow}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: theme.text }]}>{userName}</Text>
            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{userEmail}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{userRole}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.disconnectButton} onPress={onDisconnect}>
          <Text style={styles.disconnectText}>Disconnect Device</Text>
        </TouchableOpacity>
      </View>

      {/* Connected Master Device Banner */}
      <View style={[styles.deviceCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Connected Terminal</Text>
        <Text style={[styles.masterName, { color: theme.text }]}>{device.master_name || device.name}</Text>
        <Text style={[styles.deviceAddress, { color: theme.textSecondary }]}>IP: {device.ip_address} • Version: {device.version}</Text>
      </View>

      {/* Analytics & Stats */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Dashboard Overview</Text>
        <TouchableOpacity onPress={fetchStats}>
          <Text style={[styles.refreshText, { color: theme.primaryTeal }]}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {stats.loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
      ) : (
        <View style={styles.gridContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>{stats.orderCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Orders</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>{stats.itemCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Menu Items</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>{stats.connectedDevicesCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Active Devices</Text>
          </View>
        </View>
      )}

      {/* Admin Actions */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Management Controls</Text>
      <View style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity style={styles.actionRow} onPress={fetchStats}>
          <Text style={[styles.actionTitle, { color: theme.text }]}>System Diagnostics</Text>
          <Text style={[styles.actionSub, { color: theme.textSecondary }]}>Check real-time network and server health</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.backgroundElement }]} />
        <TouchableOpacity style={styles.actionRow} onPress={fetchStats}>
          <Text style={[styles.actionTitle, { color: theme.text }]}>Device Connections</Text>
          <Text style={[styles.actionSub, { color: theme.textSecondary }]}>Monitor active paired mobile terminals</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3E5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D3D4C0',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0A2947',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#071313',
  },
  userEmail: {
    fontSize: 13,
    color: '#4F6371',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#FE7F2D',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 6,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  disconnectButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  disconnectText: {
    color: '#991B1B',
    fontWeight: '700',
    fontSize: 14,
  },
  deviceCard: {
    backgroundColor: '#E9EDF1',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C8D2DE',
  },
  sectionLabel: {
    fontSize: 12,
    color: '#4F6371',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  masterName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#071313',
    marginTop: 4,
  },
  deviceAddress: {
    fontSize: 12,
    color: '#4F6371',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#071313',
    marginBottom: 12,
  },
  refreshText: {
    color: '#215E61',
    fontWeight: '700',
    fontSize: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D3D4C0',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A2947',
  },
  statLabel: {
    fontSize: 11,
    color: '#4F6371',
    marginTop: 4,
    fontWeight: '600',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D3D4C0',
  },
  actionRow: {
    paddingVertical: 8,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#071313',
  },
  actionSub: {
    fontSize: 12,
    color: '#4F6371',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E9EDF1',
    marginVertical: 6,
  },
});
