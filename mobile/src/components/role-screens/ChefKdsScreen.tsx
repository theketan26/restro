import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { DiscoveredDevice } from '../../services/device-discovery';
import { httpClient } from '../../infrastructure/http/axios-client';
import { useTheme } from '../../hooks/use-theme';
import { AnimatedSymbol } from '../ui/animated-symbol';

interface ChefKdsScreenProps {
  device: DiscoveredDevice;
  onDisconnect: () => void;
}

interface OrderItem {
  item_id: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
}

interface Order {
  id: string;
  token_id: string;
  table_number: string;
  items: OrderItem[];
  created_at: number;
}

interface OrderToken {
  id: string;
  table_number: string;
  status: string;
  chef_name?: string;
  chef_status?: string;
}

export function ChefKdsScreen({ device, onDisconnect }: ChefKdsScreenProps) {
  const theme = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tokens, setTokens] = useState<OrderToken[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKitchenData = async () => {
    try {
      setLoading(true);
      const [ordersRes, tokensRes] = await Promise.allSettled([
        httpClient.get(`${device.base_url}/api/orders`),
        httpClient.get(`${device.base_url}/api/order-tokens`),
      ]);

      if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value.data?.data)) {
        setOrders(ordersRes.value.data.data);
      }
      if (tokensRes.status === 'fulfilled' && Array.isArray(tokensRes.value.data?.data)) {
        setTokens(tokensRes.value.data.data);
      }
    } catch (e) {
      console.error('Failed to fetch kitchen orders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenData();
    const interval = setInterval(fetchKitchenData, 5000);
    return () => clearInterval(interval);
  }, [device.base_url]);

  const updateOrderStatus = async (tokenId: string, nextStatus: string) => {
    try {
      const chefName = device.user_name || 'Chef';
      await httpClient.put(`${device.base_url}/api/order-tokens/${tokenId}`, {
        chef_name: chefName,
        chef_status: nextStatus,
      });
      fetchKitchenData();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update order status');
    }
  };

  const userName = device.user_name || 'Chef';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.headerInfo}>
          <Text style={[styles.userName, { color: theme.text }]}>{userName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>CHEF KDS</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.disconnectButton} onPress={onDisconnect}>
          <Text style={styles.disconnectText}>Disconnect</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AnimatedSymbol
            name="cookingbag.fill"
            fallbackLibrary="MaterialCommunityIcons"
            fallbackName="chef-hat"
            size={20}
            tintColor={theme.text}
          />
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Kitchen Orders</Text>
        </View>
        <TouchableOpacity onPress={fetchKitchenData}>
          <Text style={[styles.refreshText, { color: theme.primaryTeal }]}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
      ) : orders.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No incoming orders for kitchen.</Text>
        </View>
      ) : (
        orders.map((ord) => {
          const matchingToken = tokens.find((t) => t.id === ord.token_id);
          const currentStatus = matchingToken?.chef_status || matchingToken?.status || 'Pending';

          return (
            <View key={ord.id} style={[styles.orderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.orderCardHeader}>
                <View style={[styles.tableBadge, { backgroundColor: theme.primary }]}>
                  <Text style={styles.tableBadgeText}>{ord.table_number}</Text>
                </View>
                <View style={[styles.statusTag, currentStatus === 'Ready' && styles.statusReady]}>
                  <Text style={styles.statusText}>{currentStatus.toUpperCase()}</Text>
                </View>
              </View>

              <View style={[styles.itemsList, { borderBottomColor: theme.backgroundElement }]}>
                {ord.items.map((it, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemQty}>{it.quantity}x</Text>
                    <Text style={[styles.itemName, { color: theme.text }]}>{it.name}</Text>
                  </View>
                ))}
              </View>

              {/* Action Toggles */}
              <View style={styles.statusActionsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, currentStatus === 'Preparing' && styles.actionBtnActive, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}
                  onPress={() => updateOrderStatus(ord.token_id, 'Preparing')}
                >
                  <AnimatedSymbol
                    name="hourglass.badge.arrow.recurse"
                    fallbackName="hourglass-outline"
                    size={14}
                    tintColor={currentStatus === 'Preparing' ? '#FFFFFF' : '#215E61'}
                    animationSpec={currentStatus === 'Preparing' ? { effect: { type: 'pulse' }, repeating: true } : undefined}
                  />
                  <Text style={[styles.actionBtnText, currentStatus === 'Preparing' && { color: '#FFFFFF' }]}>Preparing</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtnReady, currentStatus === 'Ready' && styles.actionBtnActiveReady, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}
                  onPress={() => updateOrderStatus(ord.token_id, 'Ready')}
                >
                  <AnimatedSymbol
                    name="checkmark.circle"
                    fallbackName="checkmark-circle-outline"
                    size={14}
                    tintColor={currentStatus === 'Ready' ? '#FFFFFF' : '#215E61'}
                    animationSpec={currentStatus === 'Ready' ? { effect: { type: 'bounce' } } : undefined}
                  />
                  <Text style={[styles.actionBtnTextReady, currentStatus === 'Ready' && { color: '#FFFFFF' }]}>Mark Ready</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D3D4C0',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#071313',
  },
  roleBadge: {
    backgroundColor: '#FE7F2D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  disconnectButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  disconnectText: {
    color: '#991B1B',
    fontWeight: '700',
    fontSize: 12,
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
  },
  refreshText: {
    color: '#215E61',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D3D4C0',
  },
  emptyText: {
    color: '#4F6371',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#D3D4C0',
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tableBadge: {
    backgroundColor: '#0A2947',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tableBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  statusTag: {
    backgroundColor: '#E9EDF1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusReady: {
    backgroundColor: '#DCFCE7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#071313',
  },
  itemsList: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E9EDF1',
  },
  itemRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  itemQty: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FE7F2D',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#071313',
  },
  statusActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#E9EDF1',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionBtnActive: {
    backgroundColor: '#215E61',
  },
  actionBtnText: {
    color: '#071313',
    fontWeight: '700',
    fontSize: 13,
  },
  actionBtnReady: {
    flex: 1,
    backgroundColor: '#FE7F2D',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionBtnActiveReady: {
    backgroundColor: '#15803D',
  },
  actionBtnTextReady: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
