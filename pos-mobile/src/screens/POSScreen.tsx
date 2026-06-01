import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput, 
  Alert, 
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform
} from 'react-native';
import { mobileApi, isSupabaseActive, Product, CartItem } from '../services/api';

export default function POSScreen({ onLogout }: { onLogout: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');

  // Load products from active resource on mount
  const loadProducts = async (showQuietly = false) => {
    if (!showQuietly) setIsLoading(true);
    try {
      const data = await mobileApi.getProducts();
      setProducts(data);
    } catch (e) {
      console.warn('Error loading products in POS screen:', e);
      Alert.alert('Error', 'No se pudieron cargar los productos.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadProducts(true);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: Product) => {
    // Check if we have stock available
    const existing = cart.find(item => item.id === product.id);
    const currentQtyInCart = existing ? existing.quantity : 0;

    if (product.stock !== undefined && currentQtyInCart >= product.stock) {
      Alert.alert('Sin Stock', `No hay suficiente stock de "${product.name}" disponible.`);
      return;
    }

    setCart(prevCart => {
      if (existing) {
        return prevCart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          
          // Check stock
          if (delta > 0 && item.stock !== undefined && newQty > item.stock) {
            Alert.alert('Límite de Stock', `Has alcanzado el límite de inventario para ${item.name}.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Carrito Vacío', 'Agrega productos antes de facturar.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🛒 Procesando checkout en POS Móvil...');
      
      // 1. Create Invoice in Active Database (Supabase or Local)
      const invoice = await mobileApi.createInvoice(cart, totalAmount, paymentMethod);
      console.log('✅ Factura guardada:', invoice?.invoiceNumber || invoice?.id);

      // 2. Reduce Stock in Supabase/Local State for each item
      const stockUpdates = cart.map(async (item) => {
        const itemInProducts = products.find(p => p.id === item.id);
        const currentStock = itemInProducts ? itemInProducts.stock : item.stock;
        const newStock = Math.max(0, currentStock - item.quantity);
        
        // Update live database if connected
        await mobileApi.updateProductStock(item.id, newStock);
        
        return { id: item.id, newStock };
      });

      const updatedStocks = await Promise.all(stockUpdates);

      // 3. Update local products state to reflect the new stock values in real-time
      setProducts(prevProducts => {
        return prevProducts.map(p => {
          const update = updatedStocks.find(u => u.id === p.id);
          if (update) {
            return { ...p, stock: update.newStock };
          }
          return p;
        });
      });

      // Clear the cart
      setCart([]);
      
      // Success Notification
      Alert.alert(
        '¡Factura Creada con Éxito!', 
        `Número: ${invoice.invoiceNumber || 'POS-REG-M'}\nMétodo de pago: ${paymentMethod}\nTotal: $${totalAmount.toFixed(2)}\n\n${
          isSupabaseActive() 
            ? 'Los datos de venta e inventario se han sincronizado con tu base de datos central en Supabase.' 
            : 'Venta registrada localmente.'
        }`
      );
    } catch (e: any) {
      console.warn('Error en checkout del POS Móvil:', e);
      Alert.alert('Error al Facturar', e.message || 'No se pudo guardar la factura.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoSquare} />
          <View>
            <Text style={styles.headerTitle}>Alegra+ POS</Text>
            <View style={styles.syncIndicator}>
              <View style={[styles.indicatorLight, { backgroundColor: isSupabaseActive() ? '#10b981' : '#f59e0b' }]} />
              <Text style={styles.indicatorText}>
                {isSupabaseActive() ? 'Sincronizado' : 'Modo Offline'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => loadProducts(false)} style={styles.syncButton} disabled={isLoading}>
            <Text style={styles.syncButtonText}>🔄 Sincronizar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Product Catalog */}
        <View style={styles.catalogSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos por descripción..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />

          {isLoading && products.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Sincronizando catálogo...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={item => item.id}
              numColumns={2}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.productCard, item.stock <= 0 && styles.productCardOut]} 
                  onPress={() => addToCart(item)}
                  disabled={item.stock <= 0}
                >
                  <View style={styles.productBadge}>
                    <Text style={styles.badgeSku}>{item.sku || 'REF'}</Text>
                  </View>
                  <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                  <Text style={[
                    styles.productStock, 
                    item.stock <= 5 && styles.lowStockText,
                    item.stock <= 0 && styles.outStockText
                  ]}>
                    {item.stock > 0 ? `Stock: ${item.stock} uds` : '¡AGOTADO!'}
                  </Text>
                </TouchableOpacity>
              )}
              columnWrapperStyle={styles.row}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#2563eb']} />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No se encontraron productos</Text>
                </View>
              }
            />
          )}
        </View>

        {/* Cart Section */}
        <View style={styles.cartSection}>
          <Text style={styles.cartTitle}>Carrito ({cart.reduce((sum, item) => sum + item.quantity, 0)})</Text>
          
          <ScrollView style={styles.cartList}>
            {cart.map(item => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  <Text style={styles.cartItemQty}>${item.price.toFixed(2)} c/u</Text>
                  
                  {/* Quantity Controls */}
                  <View style={styles.qtyControls}>
                    <TouchableOpacity onPress={() => updateCartQty(item.id, -1)} style={styles.qtyBtn}>
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateCartQty(item.id, 1)} style={styles.qtyBtn}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.cartItemRight}>
                  <Text style={styles.cartItemTotal}>${(item.quantity * item.price).toFixed(2)}</Text>
                  <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeButton}>
                    <Text style={styles.removeButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {cart.length === 0 && (
              <View style={styles.emptyCartContainer}>
                <Text style={styles.emptyCartText}>No hay productos en el carrito</Text>
                <Text style={styles.emptyCartSub}>Haz clic en los productos para agregarlos</Text>
              </View>
            )}
          </ScrollView>

          {/* Payment Method Selector */}
          {cart.length > 0 && (
            <View style={styles.paymentSelector}>
              <Text style={styles.paymentTitle}>Forma de Pago:</Text>
              <View style={styles.paymentOptions}>
                {(['Efectivo', 'Tarjeta', 'Transferencia'] as const).map(method => (
                  <TouchableOpacity 
                    key={method}
                    onPress={() => setPaymentMethod(method)}
                    style={[styles.paymentBtn, paymentMethod === method && styles.paymentBtnSelected]}
                  >
                    <Text style={[styles.paymentBtnText, paymentMethod === method && styles.paymentBtnTextSelected]}>
                      {method === 'Efectivo' ? '💵 ' : method === 'Tarjeta' ? '💳 ' : '🏦 '}
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.checkoutSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total a Pagar</Text>
              <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.checkoutButton, (cart.length === 0 || isLoading) && styles.checkoutButtonDisabled]} 
              onPress={handleCheckout}
              disabled={cart.length === 0 || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.checkoutButtonText}>Cobrar y Facturar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  header: {
    backgroundColor: '#003B6F',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoSquare: {
    width: 25,
    height: 25,
    backgroundColor: '#2563eb',
    borderRadius: 6,
    marginRight: 10,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  syncIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  indicatorLight: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  indicatorText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncButton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  syncButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  logoutText: {
    color: '#fecaca',
    fontWeight: 'bold',
    fontSize: 11,
  },
  content: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
  },
  catalogSection: {
    flex: 1.8,
    padding: 12,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
    marginBottom: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: '#ffffff',
    width: '48%',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  productCardOut: {
    borderColor: '#fcd34d',
    backgroundColor: '#fafaf9',
    opacity: 0.8,
  },
  productBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0f2fe',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 8,
  },
  badgeSku: {
    color: '#0369a1',
    fontSize: 9,
    fontWeight: '700',
  },
  productName: {
    fontWeight: 'bold',
    color: '#1e293b',
    fontSize: 13,
    marginBottom: 4,
    height: 36,
  },
  productPrice: {
    color: '#2563eb',
    fontWeight: '800',
    fontSize: 15,
  },
  productStock: {
    fontSize: 10,
    color: '#475569',
    fontWeight: 'bold',
    marginTop: 4,
  },
  lowStockText: {
    color: '#d97706',
  },
  outStockText: {
    color: '#dc2626',
  },
  cartSection: {
    flex: Platform.OS === 'web' ? 1.2 : 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderTopWidth: Platform.OS === 'web' ? 0 : 1,
    borderTopColor: '#e2e8f0',
  },
  cartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 6,
  },
  cartList: {
    flex: 1,
    maxHeight: Platform.OS === 'web' ? undefined : 250,
  },
  emptyCartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 35,
  },
  emptyCartText: {
    alignSelf: 'center',
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCartSub: {
    alignSelf: 'center',
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 4,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  cartItemInfo: {
    flex: 1,
    marginRight: 10,
  },
  cartItemName: {
    fontWeight: 'bold',
    color: '#334155',
    fontSize: 13,
  },
  cartItemQty: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 1,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  qtyBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qtyBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  qtyValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    minWidth: 16,
    textAlign: 'center',
  },
  cartItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartItemTotal: {
    fontWeight: 'bold',
    color: '#0f172a',
    fontSize: 14,
    minWidth: 60,
    textAlign: 'right',
  },
  removeButton: {
    padding: 6,
    backgroundColor: '#fef2f2',
    borderRadius: 6,
  },
  removeButtonText: {
    fontSize: 12,
  },
  paymentSelector: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    marginBottom: 8,
  },
  paymentTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  paymentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  paymentBtnSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  paymentBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  paymentBtnTextSelected: {
    color: '#2563eb',
  },
  checkoutSection: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2563eb',
  },
  checkoutButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#475569',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
  }
});
