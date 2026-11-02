import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { DiscoveredDevice } from '../../services/device-discovery';
import { httpClient } from '../../infrastructure/http/axios-client';
import { useTheme } from '../../hooks/use-theme';
import { AnimatedSymbol } from '../ui/animated-symbol';

interface WaiterScreenProps {
  device: DiscoveredDevice;
  onDisconnect: () => void;
}

interface Item {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface SelectedItem extends Item {
  quantity: number;
}

export function WaiterScreen({ device, onDisconnect }: WaiterScreenProps) {
  const theme = useTheme();
  const [selectedTable, setSelectedTable] = useState('Table 1');
  const [items, setItems] = useState<Item[]>([]);
  const [cart, setCart] = useState<SelectedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await httpClient.get(`${device.base_url}/api/items`);
      if (res.data?.data?.items) {
        setItems(res.data.data.items);
      }
    } catch (e) {
      console.error('Failed to load menu items', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [device.base_url]);

  const addToCart = (item: Item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i));
      }
      return prev.filter((i) => i.id !== itemId);
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const submitOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Order', 'Add items to the order before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const now = Date.now();
      const tokenId = `token-${now}`;
      const orderId = `order-${now}`;

      // create order token first
      await httpClient.post(`${device.base_url}/api/order-tokens`, {
        id: tokenId,
        table_number: selectedTable,
        status: 'pending',
        created_at: now,
      });

      // create order
      await httpClient.post(`${device.base_url}/api/orders`, {
        id: orderId,
        token_id: tokenId,
        table_number: selectedTable,
        items: cart.map((i) => ({
          item_id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          note: null,
        })),
        created_at: now,
      });

      Alert.alert('Order Submitted', `Order for ${selectedTable} sent to Kitchen KDS.`);
      setCart([]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to submit order to desktop terminal.');
    } finally {
      setSubmitting(false);
    }
  };

  const tables = ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Table 6'];
  const userName = device.user_name || 'Waiter';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.headerInfo}>
          <Text style={[styles.userName, { color: theme.text }]}>{userName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>WAITER POS</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.disconnectButton} onPress={onDisconnect}>
          <Text style={styles.disconnectText}>Disconnect</Text>
        </TouchableOpacity>
      </View>

      {/* Table Selector */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <AnimatedSymbol
          name="tablecells"
          fallbackName="grid"
          size={18}
          tintColor={theme.text}
        />
        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Select Table</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tablesScroll}>
        {tables.map((tbl) => (
          <TouchableOpacity
            key={tbl}
            style={[
              styles.tableChip,
              { backgroundColor: theme.card, borderColor: theme.border },
              selectedTable === tbl && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setSelectedTable(tbl)}
          >
            <Text style={[styles.tableChipText, { color: theme.text }, selectedTable === tbl && styles.tableChipTextSelected]}>
              {tbl}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Cart Summary */}
      <View style={[styles.cartCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <AnimatedSymbol
            name="bag.fill"
            fallbackName="basket"
            size={18}
            tintColor={theme.text}
          />
          <Text style={[styles.cartHeaderTitle, { color: theme.text, marginBottom: 0 }]}>Current Order - {selectedTable}</Text>
        </View>
        {cart.length === 0 ? (
          <Text style={[styles.emptyCartText, { color: theme.textSecondary }]}>No items added to current order.</Text>
        ) : (
          cart.map((item) => (
            <View key={item.id} style={[styles.cartRow, { borderBottomColor: theme.backgroundElement }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cartItemName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.cartItemPrice, { color: theme.textSecondary }]}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
              <View style={styles.quantityRow}>
                <TouchableOpacity onPress={() => removeFromCart(item.id)} style={[styles.qtyButton, { backgroundColor: theme.backgroundElement }]}>
                  <Text style={[styles.qtyButtonText, { color: theme.text }]}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.qtyText, { color: theme.text }]}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => addToCart(item)} style={[styles.qtyButton, { backgroundColor: theme.backgroundElement }]}>
                  <Text style={[styles.qtyButtonText, { color: theme.text }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {cart.length > 0 && (
          <View style={[styles.cartFooter, { borderTopColor: theme.backgroundElement }]}>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.text }]}>Total:</Text>
              <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={[styles.submitButton, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }]} onPress={submitOrder} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <AnimatedSymbol
                    name="paperplane.fill"
                    fallbackName="paper-plane"
                    size={16}
                    tintColor="#FFFFFF"
                    animationSpec={{ effect: { type: 'bounce' } }}
                  />
                  <Text style={styles.submitButtonText}>Send Order to Kitchen</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Menu Items Grid */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 10 }}>
        <AnimatedSymbol
          name="menucard"
          fallbackName="list"
          size={18}
          tintColor={theme.text}
        />
        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Menu Catalog</Text>
      </View>
      {loading ? (
        <ActivityIndicator color="#0A2947" style={{ marginVertical: 20 }} />
      ) : items.length === 0 ? (
        <Text style={styles.emptyCartText}>No menu items found on server.</Text>
      ) : (
        <View style={styles.itemsGrid}>
          {items.map((item) => (
            <TouchableOpacity key={item.id} style={styles.menuItemCard} onPress={() => addToCart(item)}>
              <Text style={styles.menuItemName}>{item.name}</Text>
              <Text style={styles.menuItemCategory}>{item.category}</Text>
              <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
              <View style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Add</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
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
    backgroundColor: '#215E61',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#071313',
    marginBottom: 10,
  },
  tablesScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tableChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D3D4C0',
  },
  tableChipSelected: {
    backgroundColor: '#0A2947',
    borderColor: '#0A2947',
  },
  tableChipText: {
    color: '#071313',
    fontWeight: '600',
  },
  tableChipTextSelected: {
    color: '#FFFFFF',
  },
  cartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D3D4C0',
  },
  cartHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#071313',
    marginBottom: 10,
  },
  emptyCartText: {
    color: '#4F6371',
    fontSize: 13,
    fontStyle: 'italic',
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E9EDF1',
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#071313',
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#4F6371',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyButton: {
    backgroundColor: '#E9EDF1',
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#071313',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#071313',
  },
  cartFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E9EDF1',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#071313',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FE7F2D',
  },
  submitButton: {
    backgroundColor: '#FE7F2D',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  menuItemCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D3D4C0',
  },
  menuItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#071313',
  },
  menuItemCategory: {
    fontSize: 11,
    color: '#4F6371',
    marginTop: 2,
  },
  menuItemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A2947',
    marginTop: 6,
  },
  addButton: {
    backgroundColor: '#0A2947',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
