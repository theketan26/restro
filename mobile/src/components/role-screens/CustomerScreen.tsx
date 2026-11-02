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

interface CustomerScreenProps {
  device: DiscoveredDevice;
  onDisconnect: () => void;
}

interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}

interface CartItem extends Item {
  quantity: number;
}

export function CustomerScreen({ device, onDisconnect }: CustomerScreenProps) {
  const theme = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tableNumber, setTableNumber] = useState('Table 4');
  const [cartAnimationKey, setCartAnimationKey] = useState(0);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await httpClient.get(`${device.base_url}/api/items`);
      if (res.data?.data?.items) {
        const fetchedItems: Item[] = res.data.data.items;
        setItems(fetchedItems);

        const cats = Array.from(new Set(fetchedItems.map((i) => i.category))).filter(Boolean);
        setCategories(['All', ...cats]);
      }
    } catch (e) {
      console.error('Failed to load menu', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [device.base_url]);

  const addToCart = (item: Item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setCartAnimationKey((prev) => prev + 1);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i));
      }
      return prev.filter((i) => i.id !== itemId);
    });
    setCartAnimationKey((prev) => prev + 1);
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const placeCustomerOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart.');
      return;
    }

    setSubmitting(true);
    try {
      const now = Date.now();
      const tokenId = `token-${now}`;
      const orderId = `order-${now}`;

      await httpClient.post(`${device.base_url}/api/order-tokens`, {
        id: tokenId,
        table_number: tableNumber,
        status: 'pending',
        created_at: now,
      });

      await httpClient.post(`${device.base_url}/api/orders`, {
        id: orderId,
        token_id: tokenId,
        table_number: tableNumber,
        items: cart.map((i) => ({
          item_id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          note: null,
        })),
        created_at: now,
      });

      setPlacedOrder({
        id: orderId,
        table: tableNumber,
        total: totalAmount,
        itemCount: cart.reduce((sum, i) => sum + i.quantity, 0),
        status: 'Order Sent to Kitchen',
      });
      setCart([]);
      Alert.alert('Order Placed!', `Your order has been sent to the kitchen for ${tableNumber}.`);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems =
    activeCategory === 'All' ? items : items.filter((i) => i.category === activeCategory);

  const userName = device.user_name || 'Valued Customer';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.headerInfo}>
          <Text style={[styles.userName, { color: theme.text }]}>{userName}</Text>
          <View style={[styles.roleBadge, { backgroundColor: theme.primary }]}>
            <Text style={styles.roleBadgeText}>CUSTOMER</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.disconnectButton} onPress={onDisconnect}>
          <Text style={styles.disconnectText}>Disconnect</Text>
        </TouchableOpacity>
      </View>

      {/* Active Order Tracker */}
      {placedOrder && (
        <View style={[styles.trackerCard, { backgroundColor: theme.secondaryLight, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.trackerTitle}>Active Order Status</Text>
            <Text style={styles.trackerStatus}>{placedOrder.status}</Text>
            <Text style={[styles.trackerSub, { color: theme.textSecondary }]}>
              {tableNumber} • {placedOrder.itemCount} items • ${placedOrder.total.toFixed(2)}
            </Text>
          </View>
          <AnimatedSymbol
            name="fork.knife"
            fallbackName="restaurant"
            size={36}
            tintColor="#FE7F2D"
            animationSpec={{ effect: { type: 'pulse' }, repeating: true }}
            style={{ marginLeft: 16 }}
          />
        </View>
      )}

      {/* Menu Categories */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <AnimatedSymbol
          name="menucard"
          fallbackName="list"
          size={20}
          tintColor={theme.text}
        />
        <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Digital Menu</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.catChip,
              { backgroundColor: theme.card, borderColor: theme.border },
              activeCategory === cat && { backgroundColor: theme.primary, borderColor: theme.primary },
            ]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.catChipText, { color: theme.text }, activeCategory === cat && styles.catChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Items List */}
      {loading ? (
        <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
      ) : filteredItems.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No items available in this category.</Text>
      ) : (
        filteredItems.map((item) => (
          <View key={item.id} style={[styles.menuCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>{item.name}</Text>
              <Text style={[styles.menuDesc, { color: theme.textSecondary }]}>{item.description || item.category}</Text>
              <Text style={styles.menuPrice}>${item.price.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Cart Drawer Bar */}
      {cart.length > 0 && (
        <View style={styles.cartBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <AnimatedSymbol
              key={`cart-icon-${cartAnimationKey}`}
              name="cart.fill"
              fallbackName="cart"
              size={24}
              tintColor="#FFFFFF"
              animationSpec={{ effect: { type: 'bounce' } }}
            />
            <View>
              <Text style={styles.cartBarCount}>
                {cart.reduce((s, i) => s + i.quantity, 0)} Items Added
              </Text>
              <Text style={styles.cartBarTotal}>Total: ${totalAmount.toFixed(2)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={placeCustomerOrder} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.checkoutBtnText}>Place Order</Text>}
          </TouchableOpacity>
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
    paddingBottom: 60,
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
    backgroundColor: '#0A2947',
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
  trackerCard: {
    backgroundColor: '#FFF2E6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFC094',
  },
  trackerTitle: {
    fontSize: 12,
    color: '#CB6624',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  trackerStatus: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FE7F2D',
    marginTop: 2,
  },
  trackerSub: {
    fontSize: 13,
    color: '#4F6371',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#071313',
    marginBottom: 10,
  },
  categoriesScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  catChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D3D4C0',
  },
  catChipActive: {
    backgroundColor: '#0A2947',
    borderColor: '#0A2947',
  },
  catChipText: {
    color: '#071313',
    fontWeight: '600',
    fontSize: 13,
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  emptyText: {
    color: '#4F6371',
    fontSize: 14,
    marginVertical: 10,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D3D4C0',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#071313',
  },
  menuDesc: {
    fontSize: 12,
    color: '#4F6371',
    marginTop: 2,
  },
  menuPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FE7F2D',
    marginTop: 6,
  },
  addBtn: {
    backgroundColor: '#FE7F2D',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  cartBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0A2947',
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
  },
  cartBarCount: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  cartBarTotal: {
    color: '#FE7F2D',
    fontSize: 17,
    fontWeight: '800',
  },
  checkoutBtn: {
    backgroundColor: '#FE7F2D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
