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
  Platform,
  Modal,
  Dimensions
} from 'react-native';
import { 
  mobileApi, 
  isSupabaseActive, 
  Product, 
  CartItem, 
  RestaurantTable, 
  RestaurantOrder, 
  RestaurantOrderItem,
  JournalEntry
} from '../services/api';

const WINDOW_HEIGHT = Dimensions.get('window').height;

const WAITERS = [
  { id: 'w-1', name: 'Andrés Reynoso', status: 'Activo', pin: '1111' },
  { id: 'w-2', name: 'Clarissa Mateo', status: 'Activo', pin: '2222' },
  { id: 'w-3', name: 'Dahiana Santana', status: 'Activo', pin: '3333' }
];

interface MobileNotification {
  id: string;
  timestamp: string;
  message: string;
  type: 'kit_ready' | 'call_waiter' | 'ask_bill';
  read: boolean;
  tableId?: string;
  tableName?: string;
}

export default function POSScreen({ onLogout }: { onLogout: () => void }) {
  // Navigation & Waiter Session
  const [currentWaiter, setCurrentWaiter] = useState<typeof WAITERS[0] | null>(null);
  const [pinWaiter, setPinWaiter] = useState<typeof WAITERS[0] | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [isPinVisible, setIsPinVisible] = useState(false);

  // General app state
  // 'login' | 'tables' | 'menu' | 'cart' | 'checkout' | 'success'
  const [activeScreen, setActiveScreen] = useState<'login' | 'tables' | 'menu' | 'cart' | 'checkout' | 'success'>('login');
  const [waiterHomeTab, setWaiterHomeTab] = useState<'tables' | 'quick'>('tables');

  // Tables and Orders DB lists
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);

  // Cart operations
  const [mobileCart, setMobileCart] = useState<{ product: Product; qty: number; notes: string }[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Checkout inputs
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  const [cashReceived, setCashReceived] = useState(0);

  // Notifications Drawer
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // System actions loading
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load everything on start
  const loadWorkspaceData = async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    try {
      const [prodsData, tablesData, ordersData] = await Promise.all([
        mobileApi.getProducts(),
        mobileApi.getTables(),
        mobileApi.getOrders()
      ]);
      setProducts(prodsData);
      setTables(tablesData);
      setOrders(ordersData);
    } catch (err) {
      console.warn('Error loading sync lists:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  // Sync / Poll system for real-time simulator behavior
  useEffect(() => {
    const timer = setInterval(() => {
      loadWorkspaceData(true);
    }, 10000); // sync database silently every 10 seconds

    return () => clearInterval(timer);
  }, []);

  // Monitor kitchen updates
  const [knownCookingStatus, setKnownCookingStatus] = useState<{ [id: string]: string }>({});
  useEffect(() => {
    if (orders.length === 0) return;

    const newStatuses: { [id: string]: string } = {};
    const localNotifs: MobileNotification[] = [];

    orders.forEach(order => {
      newStatuses[order.id] = order.status;
      const cached = knownCookingStatus[order.id];
      if (cached && cached !== order.status) {
        if (order.status === 'entregada') {
          localNotifs.push({
            id: `kit-${order.id}-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            message: `Cocina: ¡Comanda de la ${order.tableName} lista para servir! 🍳🛎️`,
            type: 'kit_ready',
            read: false,
            tableId: order.tableId,
            tableName: order.tableName
          });
        }
      }
    });

    if (localNotifs.length > 0) {
      setNotifications(prev => [...localNotifs, ...prev]);
      Alert.alert('🛎️ ¡Plato Listo!', localNotifs[0].message);
    }

    setKnownCookingStatus(newStatuses);
  }, [orders]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadWorkspaceData(true);
  };

  // Waitstaff Login Handlers
  const openPinPrompt = (waiter: typeof WAITERS[0]) => {
    setPinWaiter(waiter);
    setPinInput('');
    setIsPinVisible(true);
  };

  const verifyPin = () => {
    if (!pinWaiter) return;
    if (pinInput === pinWaiter.pin) {
      setCurrentWaiter(pinWaiter);
      setIsPinVisible(false);
      setActiveScreen('tables');
    } else {
      Alert.alert('PIN Incorrecto', 'El código ingresado no concuerda.');
      setPinInput('');
    }
  };

  const handleSelectTable = (table: RestaurantTable) => {
    setSelectedTable(table);
    // Find active order
    const tableActiveOrder = orders.find(o => o.tableId === table.id && o.status !== 'cobrada');
    if (tableActiveOrder) {
      // Reconstruct cart
      const cardRecon = tableActiveOrder.items.map(item => {
        const prodMatch = products.find(p => p.id === item.productId || p.name === item.name) || {
          id: item.productId,
          name: item.name,
          price: item.price,
          stock: 99,
          sku: 'REST',
          category: 'Platos'
        };
        return {
          product: prodMatch,
          qty: item.quantity,
          notes: item.notes || ''
        };
      });
      setMobileCart(cardRecon);
    } else {
      setMobileCart([]);
    }
    setActiveScreen('menu');
  };

  // Catalog operations
  const addToCart = (product: Product) => {
    setMobileCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1, notes: '' }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setMobileCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.qty + delta;
          if (newQty <= 0) return null;
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(Boolean) as { product: Product; qty: number; notes: string }[];
    });
  };

  const updateNotes = (productId: string, notes: string) => {
    setMobileCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, notes } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setMobileCart(prev => prev.filter(item => item.product.id !== productId));
  };

  // Calculations
  const subtotal = mobileCart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
  const tax = subtotal * 0.18; // 18% ITBIS
  const total = subtotal + tax;

  // Process comanda/order to kitchen
  const handleSendToKitchen = async () => {
    if (!selectedTable || mobileCart.length === 0) return;

    setIsLoading(true);
    try {
      const activeOrder = orders.find(o => o.tableId === selectedTable.id && o.status !== 'cobrada');
      
      const orderItems: RestaurantOrderItem[] = mobileCart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.qty,
        price: item.product.price,
        notes: item.notes || undefined
      }));

      if (activeOrder) {
        // Update existing order
        const updatedObj = {
          items: orderItems,
          subtotal,
          taxes: tax,
          total,
          waiterName: currentWaiter?.name || 'Mesero Móvil'
        };
        await mobileApi.updateOrder(activeOrder.id, updatedObj);
      } else {
        // Create fresh order
        const orderId = `ord-${Date.now().toString().slice(-6)}`;
        const newOrder: RestaurantOrder = {
          id: orderId,
          tableId: selectedTable.id,
          tableName: selectedTable.name,
          items: orderItems,
          status: 'pendiente',
          subtotal,
          taxes: tax,
          total,
          waiterName: currentWaiter?.name || 'Mesero Móvil',
          createdAt: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: false })}`
        };
        await mobileApi.createOrder(newOrder);
        // Set table as occupied
        await mobileApi.updateTable(selectedTable.id, {
          status: 'ocupada',
          currentOrderId: orderId
        });
      }

      // Success sync
      await loadWorkspaceData(true);
      Alert.alert('Comanda Sincronizada', 'Comanda guardada y enviada a cocina principal.');
      setActiveScreen('tables');
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo reportar la comanda: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Payment Transition
  const handleProceedToCheckout = () => {
    setCashReceived(Math.ceil(total / 50) * 50); // Set rounded cash suggestions
    setActiveScreen('checkout');
  };

  // Transaction checkout final bookkeeping and invoicing
  const handleProcessCheckout = async () => {
    if (!selectedTable) return;
    const activeOrderObj = orders.find(o => o.tableId === selectedTable.id && o.status !== 'cobrada');
    if (!activeOrderObj) return;

    setIsLoading(true);
    try {
      // 1. Log Invoice to Invoices table
      const billingMethod = paymentMethod === 'efectivo' ? 'Efectivo en Caja' : 'Tarjeta / Electrónico';
      const invRes = await mobileApi.createInvoice(
        mobileCart.map(c => ({ ...c.product, quantity: c.qty })),
        total,
        billingMethod
      );

      // 2. Clear table and mark active order as paid
      await mobileApi.updateOrder(activeOrderObj.id, { status: 'cobrada' });
      await mobileApi.updateTable(selectedTable.id, { status: 'libre', currentOrderId: null });

      // 3. Post Ledger General Accounting Double Entry for Alegra ERP standards
      const accountToDebit = paymentMethod === 'efectivo' ? '1101' : '1103'; // General cash vs. banks
      const doubleEntry: JournalEntry = {
        id: `as-pos-mob-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: `Facturación POS Móvil - Mesa ${selectedTable.name} (Tkt: #${activeOrderObj.id.replace('ord-', '')})`,
        reference: 'POS-MOB',
        lines: [
          { accountCode: accountToDebit, debit: total, credit: 0 },
          { accountCode: '4102', debit: 0, credit: subtotal }, // Sales Revenue Account
          { accountCode: '2105', debit: 0, credit: tax } // ITBIS Taxes Accrued
        ]
      };
      await mobileApi.createJournalEntry(doubleEntry);

      // 4. Update Product Stock live
      for (const cartObj of mobileCart) {
        const targetStock = cartObj.product.stock - cartObj.qty;
        await mobileApi.updateProductStock(cartObj.product.id, Math.max(0, targetStock));
      }

      // Success
      await loadWorkspaceData(true);
      setActiveScreen('success');
    } catch (e: any) {
      Alert.alert('Error cobrando servicio', e.message || 'No se pudo procesar la transacción.');
    } finally {
      setIsLoading(false);
    }
  };

  // Printing receipts simulated action
  const handleChoosePrinterLayout = () => {
    Alert.alert(
      'Imprimir Factura',
      'Formatos Alegra de impresión local:',
      [
        { text: 'Ticket 80mm Térmico', onPress: () => Alert.alert('Impresora POS', 'Ticket fiscal enviado a la impresora del salón.') },
        { text: 'PDF Factura Completo', onPress: () => Alert.alert('Impresora Oficina', 'Comprobante fiscal listo para guardar/enviar.') },
        { text: 'Pre-cuenta Comensal', onPress: () => Alert.alert('Pre-Cuenta', 'Detalle de servicio enviado a mesa.') },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  // Reset Cart
  const handleExitService = () => {
    setMobileCart([]);
    setSelectedTable(null);
    setActiveScreen('tables');
  };

  // Local notifications read trigger
  const markNotifRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setIsNotifOpen(false);
  };

  // Categories list
  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))].filter(Boolean);

  // Filter items in catalog views
  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                        p.sku.toLowerCase().includes(productSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      {currentWaiter && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.waiterBadge}>
              <Text style={styles.waiterChar}>{currentWaiter.name.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.waiterName} numberOfLines={1}>{currentWaiter.name}</Text>
              <View style={styles.syncIndicator}>
                <View style={[styles.indicatorLight, { backgroundColor: isSupabaseActive() ? '#10b981' : '#f59e0b' }]} />
                <Text style={styles.indicatorText}>
                  {isSupabaseActive() ? 'Sincronizado' : 'Modo Local'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setIsNotifOpen(true)} style={styles.iconBtn}>
              <Text style={styles.iconEmoji}>🔔</Text>
              {notifications.filter(n => !n.read).length > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{notifications.filter(n => !n.read).length}</Text>
                </View>
              )}
            </TouchableOpacity>

            {mobileCart.length > 0 && activeScreen === 'menu' && (
              <TouchableOpacity onPress={() => setActiveScreen('cart')} style={styles.iconBtn}>
                <Text style={styles.iconEmoji}>🛒</Text>
                <View style={[styles.notifBadge, { backgroundColor: '#ef4444' }]}>
                  <Text style={styles.notifBadgeText}>
                    {mobileCart.reduce((sum, item) => sum + item.qty, 0)}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              onPress={() => {
                setCurrentWaiter(null);
                setActiveScreen('login');
              }}
              style={styles.exitBtn}
            >
              <Text style={styles.exitBtnText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Screen view renderer */}
      <View style={styles.mainContent}>
        {/* VIEW 1: Waitstaff login screen */}
        {activeScreen === 'login' && (
          <View style={styles.loginContainer}>
            <View style={styles.loginLogoFrame}>
              <Text style={styles.loginLogoText}>📱</Text>
            </View>
            <Text style={styles.loginTitle}>Punto de Venta Móvil</Text>
            <Text style={styles.loginSub}>Alegra+ POS • República Dominicana</Text>

            <View style={styles.waitersBox}>
              <Text style={styles.waitersLabel}>Seleccione Camarero para Acceder:</Text>
              {WAITERS.map(waiter => (
                <TouchableOpacity 
                  key={waiter.id}
                  onPress={() => openPinPrompt(waiter)}
                  style={styles.waiterButton}
                >
                  <Text style={styles.waiterButtonLabel}>{waiter.name}</Text>
                  <Text style={styles.waiterButtonSub}>Pin: {waiter.pin}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={onLogout} style={styles.systemLogoutLink}>
              <Text style={styles.systemLogoutLinkText}>Cerrar Sesión Administradora</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* VIEW 2: Multi-tab layout (Tables / Quick POS) */}
        {activeScreen === 'tables' && (
          <View style={styles.tabScreenContainer}>
            {/* Tab Controllers */}
            <View style={styles.tabHeader}>
              <TouchableOpacity 
                style={[styles.tabButton, waiterHomeTab === 'tables' && styles.tabButtonActive]}
                onPress={() => setWaiterHomeTab('tables')}
              >
                <Text style={[styles.tabButtonText, waiterHomeTab === 'tables' && styles.tabButtonTextActive]}>🏛 Salón (Mesas)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, waiterHomeTab === 'quick' && styles.tabButtonActive]}
                onPress={() => setWaiterHomeTab('quick')}
              >
                <Text style={[styles.tabButtonText, waiterHomeTab === 'quick' && styles.tabButtonTextActive]}>⚡ POS Rápido</Text>
              </TouchableOpacity>
            </View>

            {waiterHomeTab === 'tables' ? (
              <ScrollView 
                style={styles.scrollList}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#2563eb']} />}
              >
                <View style={styles.tablesHeaderRow}>
                  <Text style={styles.sectionHeaderTitle}>Mesas del Restaurante ({tables.length})</Text>
                  <TouchableOpacity onPress={() => loadWorkspaceData(false)}>
                    <Text style={styles.syncSmallText}>Sincronizar 🔄</Text>
                  </TouchableOpacity>
                </View>

                {isLoading && tables.length === 0 ? (
                  <View style={styles.centeredSizer}>
                    <ActivityIndicator size="large" color="#2563eb" />
                    <Text style={styles.loadingText}>Sincronizando mesas...</Text>
                  </View>
                ) : (
                  <View style={styles.tablesGrid}>
                    {tables.map(table => {
                      const activeOrderObj = orders.find(o => o.tableId === table.id && o.status !== 'cobrada');
                      
                      let cardBorder = '#e2e8f0';
                      let cardBg = '#ffffff';
                      let statusText = 'LIBRE';
                      let statusBg = '#e2e8f0';
                      let statusColor = '#475569';
                      let orderValue = '';

                      if (activeOrderObj) {
                        orderValue = `RD$ ${activeOrderObj.total.toFixed(0)}`;
                        if (activeOrderObj.status === 'pendiente') {
                          cardBorder = '#2563eb';
                          cardBg = '#eff6ff';
                          statusText = 'PENDIENTE';
                          statusBg = '#dbeafe';
                          statusColor = '#2563eb';
                        } else if (activeOrderObj.status === 'en_preparacion') {
                          cardBorder = '#d97706';
                          cardBg = '#fffbeb';
                          statusText = 'COCINANDO';
                          statusBg = '#fef3c7';
                          statusColor = '#d97706';
                        } else if (activeOrderObj.status === 'entregada') {
                          cardBorder = '#10b981';
                          cardBg = '#ecfdf5';
                          statusText = 'SERVIDO';
                          statusBg = '#d1fae5';
                          statusColor = '#10b981';
                        }
                      }

                      return (
                        <TouchableOpacity 
                          key={table.id}
                          style={[styles.tableCard, { borderColor: cardBorder, backgroundColor: cardBg }]}
                          onPress={() => handleSelectTable(table)}
                        >
                          <View>
                            <Text style={styles.tableCardName}>{table.name}</Text>
                            <Text style={styles.tableCardCap}>Cap: {table.capacity} pers</Text>
                          </View>
                          <View style={styles.tableCardBottomRow}>
                            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                              <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusText}</Text>
                            </View>
                            {orderValue ? (
                              <Text style={styles.tableCardVal}>{orderValue}</Text>
                            ) : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            ) : (
              <ScrollView 
                style={styles.scrollList}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={['#2563eb']} />}
              >
                <View style={styles.counterControlHeader}>
                  <Text style={styles.sectionHeaderTitle}>Órdenes Directas (Para Llevar)</Text>
                  
                  <TouchableOpacity
                    style={styles.quickOrderBtn}
                    onPress={() => {
                      const quickId = `pos-quick-${Date.now().toString().slice(-4)}`;
                      const quickTable: RestaurantTable = {
                        id: quickId,
                        name: `Mostrador #${Date.now().toString().slice(-3)}`,
                        status: 'ocupada',
                        capacity: 1
                      };
                      setSelectedTable(quickTable);
                      setMobileCart([]);
                      setActiveScreen('menu');
                    }}
                  >
                    <Text style={styles.quickOrderBtnText}>+ NUEVA ORDEN RÁPIDA</Text>
                  </TouchableOpacity>
                </View>

                {orders.filter(o => o.tableId.startsWith('pos-quick-') && o.status !== 'cobrada').length === 0 ? (
                  <View style={styles.emptyCounterBox}>
                    <Text style={styles.emptyText}>No hay órdenes de mostrador pendientes.</Text>
                    <Text style={styles.emptySubText}>Presiona el botón de arriba para abrir una venta directa rápida.</Text>
                  </View>
                ) : (
                  <View style={styles.counterList}>
                    {orders.filter(o => o.tableId.startsWith('pos-quick-') && o.status !== 'cobrada').map(order => (
                      <View key={order.id} style={styles.counterItem}>
                        <View style={styles.counterItemInfo}>
                          <Text style={styles.counterItemTitle}>{order.tableName}</Text>
                          <Text style={styles.counterItemSub}>
                            {order.items.reduce((s, i) => s + i.quantity, 0)} platos • RD$ {order.total.toFixed(0)} • {order.status.toUpperCase()}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.counterOpenBtn}
                          onPress={() => {
                            setSelectedTable({
                              id: order.tableId,
                              name: order.tableName,
                              status: 'ocupada',
                              capacity: 1
                            });
                            const itemsRecon = order.items.map(item => {
                              const matchObj = products.find(p => p.id === item.productId || p.name === item.name) || {
                                id: item.productId,
                                name: item.name,
                                price: item.price,
                                stock: 99,
                                sku: 'REST',
                                category: 'Platos'
                              };
                              return {
                                product: matchObj,
                                qty: item.quantity,
                                notes: item.notes || ''
                              };
                            });
                            setMobileCart(itemsRecon);
                            setActiveScreen('menu');
                          }}
                        >
                          <Text style={styles.counterOpenBtnText}>ABRIR</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        )}

        {/* VIEW 3: Product Catalog Menu Screen */}
        {activeScreen === 'menu' && (
          <View style={styles.catalogScreenContainer}>
            {/* Context Breadcrumb Sub-NavBar */}
            <View style={styles.catalogSubNav}>
              <TouchableOpacity onPress={handleExitService} style={styles.backBtnPill}>
                <Text style={styles.backBtnPillText}>⬅ VOLVER MAS DETALLES</Text>
              </TouchableOpacity>
              <View style={styles.activeMesaBadge}>
                <Text style={styles.activeMesaBadgeText}>{selectedTable?.name}</Text>
              </View>
            </View>

            {/* Keyword Search Section */}
            <View style={styles.searchBox}>
              <TextInput
                style={styles.searchCatalogInput}
                placeholder="Buscar bebida o plato..."
                value={productSearch}
                onChangeText={setProductSearch}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Horizontal Scroll categories */}
            <View style={styles.categoriesContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesSlider}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.categoryPillLabel, selectedCategory === cat && styles.categoryPillLabelActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* List items scrollable catalog */}
            {isLoading && products.length === 0 ? (
              <View style={styles.centeredSizer}>
                <ActivityIndicator size="small" color="#2563eb" />
              </View>
            ) : (
              <FlatList
                data={filteredProducts}
                keyExtractor={item => item.id}
                renderItem={({ item }) => {
                  const qtyCart = mobileCart.find(c => c.product.id === item.id)?.qty || 0;

                  return (
                    <View style={styles.catalogCell}>
                      <View style={styles.catalogCellDetails}>
                        <Text style={styles.catalogCellName} numberOfLines={2}>{item.name}</Text>
                        <Text style={styles.catalogCellPrice}>RD$ {item.price.toFixed(0)}</Text>
                      </View>

                      {qtyCart > 0 ? (
                        <View style={styles.catalogCellActionsGrid}>
                          <TouchableOpacity onPress={() => updateCartQty(item.id, -1)} style={styles.adjusterBtn}>
                            <Text style={styles.adjusterBtnText}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.adjusterValueText}>{qtyCart}</Text>
                          <TouchableOpacity onPress={() => updateCartQty(item.id, 1)} style={styles.adjusterBtn}>
                            <Text style={styles.adjusterBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity onPress={() => addToCart(item)} style={styles.addToCartBtn}>
                          <Text style={styles.addToCartBtnLabel}>+ AÑADIR</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                }}
                contentContainerStyle={styles.catalogListScroll}
                ListEmptyComponent={
                  <View style={styles.centeredSizer}>
                    <Text style={styles.emptyText}>No hay productos que coincidan en esta categoría.</Text>
                  </View>
                }
              />
            )}

            {/* Bottom floating cart drawer */}
            {mobileCart.length > 0 && (
              <View style={styles.floatingCheckoutDrawer}>
                <View style={styles.floatingCheckoutTitleBlock}>
                  <Text style={styles.floatingCheckoutLabel}>TOTAL COMANDA</Text>
                  <Text style={styles.floatingCheckoutAmt}>RD$ {total.toLocaleString('es-DO', { minimumFractionDigits: 0 })}</Text>
                </View>

                <View style={styles.floatingDrawerActions}>
                  <TouchableOpacity onPress={() => setActiveScreen('cart')} style={styles.floatShowCartBtn}>
                    <Text style={styles.floatShowCartBtnText}>VER {mobileCart.reduce((sum, i) => sum + i.qty, 0)} ITEMS</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSendToKitchen} style={styles.floatSendKitchenBtn}>
                    <Text style={styles.floatSendKitchenBtnText}>MANDAR COCINA</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* VIEW 4: Item Modifiers & Notes (Cart details view) */}
        {activeScreen === 'cart' && (
          <View style={styles.cartDetailScreen}>
            <View style={styles.catalogSubNav}>
              <TouchableOpacity onPress={() => setActiveScreen('menu')} style={styles.backBtnPill}>
                <Text style={styles.backBtnPillText}>⬅ MENÚ DETALLE</Text>
              </TouchableOpacity>
              <Text style={styles.cartTitleCustom}>Modificar Comanda</Text>
            </View>

            <ScrollView style={styles.modifiersListScroll} contentContainerStyle={styles.modifiersListContainer}>
              {mobileCart.map(item => (
                <View key={item.product.id} style={styles.modifierCard}>
                  <View style={styles.modifierCardLabelRow}>
                    <View style={styles.flexShrink}>
                      <Text style={styles.modifierCardName}>{item.product.name}</Text>
                      <Text style={styles.modifierCardPrice}>RD$ {item.product.price} c/u</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFromCart(item.product.id)} style={styles.modifierCardDeleteBtn}>
                      <Text style={styles.modifierCardDeleteBtnLabel}>Quitar</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modifierItemBottomCtrl}>
                    <Text style={styles.noteLabel}>Cantidad:</Text>
                    <View style={styles.innerQtyContainer}>
                      <TouchableOpacity onPress={() => updateCartQty(item.product.id, -1)} style={styles.innerQtyBtn}>
                        <Text style={styles.innerQtyChar}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.innerQtyVal}>{item.qty}</Text>
                      <TouchableOpacity onPress={() => updateCartQty(item.product.id, 1)} style={styles.innerQtyBtn}>
                        <Text style={styles.innerQtyChar}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.modifierNoteBlock}>
                    <Text style={styles.noteLabel}>Instrucciones de Cocina / Notas:</Text>
                    <TextInput
                      style={styles.chefNoteInput}
                      placeholder="Ej. Término medio, sin aderezo, con hielo..."
                      value={item.notes}
                      onChangeText={(val) => updateNotes(item.product.id, val)}
                      placeholderTextColor="#a0aec0"
                    />
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Calculations summaries */}
            <View style={styles.calculationsTotalsBox}>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Subtotal Neto:</Text>
                <Text style={styles.calcValue}>RD$ {subtotal.toFixed(0)}</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>ITBIS Estatal (18%):</Text>
                <Text style={styles.calcValue}>RD$ {tax.toFixed(0)}</Text>
              </View>
              <View style={[styles.calcRow, styles.calcRowTotal]}>
                <Text style={styles.calcLabelTotal}>TOTAL COMANDA:</Text>
                <Text style={styles.calcValueTotal}>RD$ {total.toFixed(0)}</Text>
              </View>

              <View style={styles.submitCartActionsRow}>
                <TouchableOpacity onPress={handleSendToKitchen} style={styles.submitKitchenBtn}>
                  <Text style={styles.submitKitchenBtnLabel}>👩‍🍳 ENVIAR COCINA</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleProceedToCheckout} style={styles.submitCashierBtn}>
                  <Text style={styles.submitCashierBtnLabel}>💵 COBRAR POS</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* VIEW 5: Checkout Cashier screen */}
        {activeScreen === 'checkout' && (
          <View style={styles.checkoutScreenContainer}>
            <View style={styles.catalogSubNav}>
              <TouchableOpacity onPress={() => setActiveScreen('cart')} style={styles.backBtnPill}>
                <Text style={styles.backBtnPillText}>⬅ EDITAR COMANDA</Text>
              </TouchableOpacity>
              <Text style={styles.cartTitleCustom}>Alegra Pasarela Cobro</Text>
            </View>

            <ScrollView contentContainerStyle={styles.checkoutDashboardScroll}>
              <View style={styles.invoiceTicketContainer}>
                <Text style={styles.fiscalTicketLabel}>COMPROBANTE FISCAL POS</Text>
                <View style={styles.ticketDivider} />

                <View style={styles.ticketLine}>
                  <Text style={styles.ticketLineLabel}>Subtotal:</Text>
                  <Text style={styles.ticketLineValue}>RD$ {subtotal.toFixed(2)}</Text>
                </View>

                <View style={styles.ticketLine}>
                  <Text style={styles.ticketLineLabel}>ITBIS Accrued (18%):</Text>
                  <Text style={styles.ticketLineValue}>RD$ {tax.toFixed(2)}</Text>
                </View>

                <View style={styles.ticketLineTotal}>
                  <Text style={styles.ticketLineLabelTotal}>Monto Líquido:</Text>
                  <Text style={styles.ticketLineValueTotal}>RD$ {total.toFixed(2)}</Text>
                </View>
              </View>

              {/* Payment selector */}
              <View style={styles.paymentChannelFrame}>
                <Text style={styles.checkoutFieldLabel}>MÉTODO DE COBRO / CANAL:</Text>
                <View style={styles.methodChannelBox}>
                  <TouchableOpacity 
                    style={[styles.methodBtn, paymentMethod === 'efectivo' && styles.methodBtnActive]}
                    onPress={() => setPaymentMethod('efectivo')}
                  >
                    <Text style={[styles.methodBtnLabel, paymentMethod === 'efectivo' && styles.methodBtnLabelActive]}>💵 Efectivo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.methodBtn, paymentMethod === 'tarjeta' && styles.methodBtnActive]}
                    onPress={() => setPaymentMethod('tarjeta')}
                  >
                    <Text style={[styles.methodBtnLabel, paymentMethod === 'tarjeta' && styles.methodBtnLabelActive]}>💳 Tarjeta</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.methodBtn, paymentMethod === 'transferencia' && styles.methodBtnActive]}
                    onPress={() => setPaymentMethod('transferencia')}
                  >
                    <Text style={[styles.methodBtnLabel, paymentMethod === 'transferencia' && styles.methodBtnLabelActive]}>🏦 Pop/BHD</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Cash devuelta inputs */}
              {paymentMethod === 'efectivo' && (
                <View style={styles.cashFormSection}>
                  <View style={styles.cashHeaderRow}>
                    <Text style={styles.checkoutFieldLabel}>EFECTIVO RECIBIDO (RD$):</Text>
                    {cashReceived > total && (
                      <Text style={styles.cashChangePill}>Devuelta: RD$ {(cashReceived - total).toFixed(0)}</Text>
                    )}
                  </View>
                  <TextInput
                    style={styles.cashInputAmountField}
                    keyboardType="numeric"
                    value={String(cashReceived || '')}
                    onChangeText={(val) => setCashReceived(Number(val) || 0)}
                  />
                </View>
              )}

              <TouchableOpacity 
                style={[styles.submitCompleteCheckoutBtn, isLoading && styles.checkoutButtonDisabled]}
                onPress={handleProcessCheckout}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitCompleteCheckoutBtnText}>COMPLETAR TRANSACCIÓN COBRADA</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* VIEW 6: Success fully billed transaction screen */}
        {activeScreen === 'success' && (
          <View style={styles.successScreenContainer}>
            <View style={styles.successOuterCirc}>
              <View style={styles.successInnerCirc}>
                <Text style={styles.successIconCheck}>✓</Text>
              </View>
            </View>

            <Text style={styles.successMainTitle}>¡Factura Cobrada Exitosamente!</Text>
            <Text style={styles.successSubDesc}>
              Comprobante de cobro debidamente timbrado con el ITBIS asentado e integrado en tiempo real al software Alegra ERP.
            </Text>

            <View style={styles.successBillingLedgerCard}>
              <View style={styles.successLedgerLine}>
                <Text style={styles.successLedgerLabel}>Total Registrado:</Text>
                <Text style={styles.successLedgerValue}>RD$ {total.toFixed(2)}</Text>
              </View>
              <View style={styles.successLedgerLine}>
                <Text style={styles.successLedgerLabel}>Monto de Impuestos:</Text>
                <Text style={styles.successLedgerValueSub}>RD$ {tax.toFixed(2)}</Text>
              </View>
              <View style={[styles.successLedgerLine, { borderTopWidth: 1, borderColor: '#f1f5f9', paddingTop: 6, marginTop: 4 }]}>
                <Text style={styles.successLedgerLabelMini}>ID Registro Diario:</Text>
                <Text style={styles.successLedgerLabelMini}>#as-pos-mob</Text>
              </View>
            </View>

            <View style={styles.successActionButtonsBlock}>
              <TouchableOpacity onPress={handleChoosePrinterLayout} style={styles.successPrintBtn}>
                <Text style={styles.successPrintBtnText}>🖨 IMPRIMIR COMPROBANT TAX (Varios formatos)</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleExitService} style={styles.successDoneBackBtn}>
                <Text style={styles.successDoneBackBtnText}>REGRESAR AL SALÓN</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* MODAL 1: Pin unlock prompt */}
      <Modal
        visible={isPinVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPinVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pinContentModal}>
            <Text style={styles.pinModalTitle}>Pin de Seguridad Camarero</Text>
            <Text style={styles.pinModalSub}>Mesero: {pinWaiter?.name || ''}</Text>

            <TextInput
              style={styles.pinInputField}
              placeholder="Digite PIN (Ej. 1111)"
              secureTextEntry={true}
              keyboardType="numeric"
              maxLength={4}
              value={pinInput}
              onChangeText={setPinInput}
              placeholderTextColor="#cbd5e0"
            />

            <View style={styles.pinModalActions}>
              <TouchableOpacity onPress={() => setIsPinVisible(false)} style={[styles.modalBtnCancel, styles.modBtn]}>
                <Text style={styles.modalCancelLabel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={verifyPin} style={[styles.modalBtnOk, styles.modBtn]}>
                <Text style={styles.modalOkLabel}>Desbloquear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Sliding bottom notifications alerts drawer */}
      <Modal
        visible={isNotifOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsNotifOpen(false)}
      >
        <View style={styles.notificationOverlay}>
          <TouchableOpacity style={styles.notifOverlayCloser} onPress={() => setIsNotifOpen(false)} />
          <View style={styles.notificationDrawerBody}>
            <View style={styles.notifDrawerHeader}>
              <Text style={styles.notifDrawerTitle}>🔔 Centro de Alertas Recibidas</Text>
              <TouchableOpacity onPress={() => setIsNotifOpen(false)} style={styles.notifDrawerCloseBtn}>
                <Text style={styles.notifDrawerCloseLabel}>X</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.notifListContainer}>
              {notifications.length === 0 ? (
                <View style={styles.emptyNotifsFrame}>
                  <Text style={styles.emptyText}>No hay alertas activas en cocina o salón.</Text>
                  <Text style={styles.emptySubText}>Cuando un plato se complete en cocina, se te notificará al instante en este puerto táctil.</Text>
                </View>
              ) : (
                notifications.map(notif => (
                  <View 
                    key={notif.id}
                    style={[styles.notifCard, notif.read ? styles.notifCardRead : styles.notifCardUnread]}
                  >
                    <View style={styles.notifCardTop}>
                      <Text style={styles.notifTime}>{notif.timestamp}</Text>
                      {!notif.read && (
                        <TouchableOpacity style={styles.markReadBtn} onPress={() => markNotifRead(notif.id)}>
                          <Text style={styles.markReadText}>Leído ✓</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.notifMsg}>{notif.message}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity onPress={clearAllNotifications} style={styles.clearAllNotifsBtn}>
              <Text style={styles.clearAllNotifsLabel}>LIMPIAR HISTORIAL ALERTAS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    flex: 1,
  },
  waiterBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  waiterChar: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  waiterName: {
    color: '#ffffff',
    fontSize: 14,
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
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconEmoji: {
    fontSize: 14,
  },
  notifBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#003B6F',
  },
  notifBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  exitBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  exitBtnText: {
    color: '#fecaca',
    fontWeight: 'bold',
    fontSize: 10,
  },
  mainContent: {
    flex: 1,
  },
  // VIEW 1: Waitstaff login styles
  loginContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#F4F7FB',
  },
  loginLogoFrame: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#003B6F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loginLogoText: {
    fontSize: 32,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
  },
  loginSub: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    textAlign: 'center',
  },
  waitersBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 350,
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  waitersLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 15,
  },
  waiterButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waiterButtonLabel: {
    color: '#1e293b',
    fontWeight: 'bold',
    fontSize: 14,
  },
  waiterButtonSub: {
    color: '#2563eb',
    fontWeight: '800',
    fontSize: 11,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  systemLogoutLink: {
    marginTop: 30,
  },
  systemLogoutLinkText: {
    fontSize: 13,
    color: '#64748b',
    textDecorationLine: 'underline',
  },
  // VIEW 2: General tabbed tables styles
  tabScreenContainer: {
    flex: 1,
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 5,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#f1f5f9',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#003B6F',
  },
  scrollList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  tablesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  syncSmallText: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 25,
  },
  tableCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    height: 105,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  tableCardName: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 14,
  },
  tableCardCap: {
    color: '#64748b',
    fontSize: 10.5,
    marginTop: 2,
  },
  tableCardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
  },
  tableCardVal: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#1e293b',
  },
  // COUNTER RÁPIDO ON HOLD
  counterControlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 12,
  },
  quickOrderBtn: {
    backgroundColor: '#003B6F',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickOrderBtnText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '900',
  },
  emptyCounterBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 45,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 10.5,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
  counterList: {
    paddingBottom: 25,
  },
  counterItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterItemInfo: {
    flex: 1,
    marginRight: 10,
  },
  counterItemTitle: {
    fontWeight: 'bold',
    color: '#1e293b',
    fontSize: 13,
  },
  counterItemSub: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
  },
  counterOpenBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  counterOpenBtnText: {
    fontSize: 9.5,
    fontWeight: '905',
    color: '#003B6F',
  },
  // VIEW 3: Catalog Styles
  catalogScreenContainer: {
    flex: 1,
  },
  catalogSubNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtnPill: {
    paddingVertical: 4,
  },
  backBtnPillText: {
    color: '#2563eb',
    fontSize: 10.5,
    fontWeight: '900',
  },
  activeMesaBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  activeMesaBadgeText: {
    color: '#1e40af',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchBox: {
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    paddingBottom: 8,
  },
  searchCatalogInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 8 : 6,
    fontSize: 13,
    color: '#0f172a',
  },
  categoriesContainer: {
    backgroundColor: '#ffffff',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  categoriesSlider: {
    paddingHorizontal: 12,
    gap: 6,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  categoryPillActive: {
    backgroundColor: '#003B6F',
  },
  categoryPillLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  categoryPillLabelActive: {
    color: '#ffffff',
  },
  catalogListScroll: {
    padding: 12,
    paddingBottom: 110,
  },
  catalogCell: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catalogCellDetails: {
    flex: 1,
    marginRight: 10,
  },
  catalogCellName: {
    fontWeight: 'bold',
    color: '#1e293b',
    fontSize: 12.5,
  },
  catalogCellPrice: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#2563eb',
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  addToCartBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addToCartBtnLabel: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  catalogCellActionsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  adjusterBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjusterBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  adjusterValueText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1e293b',
    minWidth: 14,
    textAlign: 'center',
  },
  // Floating bottom catalog drawer
  floatingCheckoutDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0f172a',
    borderTopWidth: 2,
    borderTopColor: '#312e81',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  floatingCheckoutTitleBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  floatingCheckoutLabel: {
    color: '#94a3b8',
    fontSize: 8.5,
    fontWeight: '900',
  },
  floatingCheckoutAmt: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '900',
  },
  floatingDrawerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  floatShowCartBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  floatShowCartBtnText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '900',
  },
  floatSendKitchenBtn: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  floatSendKitchenBtnText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '900',
  },
  // VIEW 4: Modifier Cart Drawer styles
  cartDetailScreen: {
    flex: 1,
  },
  cartTitleCustom: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modifiersListScroll: {
    flex: 1,
  },
  modifiersListContainer: {
    padding: 12,
    paddingBottom: 25,
  },
  modifierCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  modifierCardLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modifierCardName: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modifierCardPrice: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  modifierCardDeleteBtn: {
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modifierCardDeleteBtnLabel: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modifierItemBottomCtrl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    marginTop: 8,
  },
  innerQtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  innerQtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerQtyChar: {
    fontSize: 12,
    color: '#475569',
    fontWeight: 'bold',
  },
  innerQtyVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modifierNoteBlock: {
    marginTop: 10,
  },
  noteLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 4,
  },
  chefNoteInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'web' ? 6 : 4,
    fontSize: 11,
    color: '#1e293b',
  },
  calculationsTotalsBox: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  calcRowTotal: {
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    paddingTop: 6,
    marginTop: 4,
    marginBottom: 12,
  },
  calcLabel: {
    fontSize: 10.5,
    color: '#64748b',
  },
  calcValue: {
    fontSize: 10.5,
    color: '#1e293b',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  calcLabelTotal: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#003B6F',
  },
  calcValueTotal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#2563eb',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  submitCartActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  submitKitchenBtn: {
    flex: 1,
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitKitchenBtnLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  submitCashierBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitCashierBtnLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  // VIEW 5: Checkout screen style properties
  checkoutScreenContainer: {
    flex: 1,
  },
  checkoutDashboardScroll: {
    padding: 12,
    paddingBottom: 35,
  },
  invoiceTicketContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 15,
  },
  fiscalTicketLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#334155',
    alignSelf: 'center',
    letterSpacing: 2,
    marginBottom: 10,
  },
  ticketDivider: {
    borderBottomWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  ticketLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ticketLineLabel: {
    fontSize: 11,
    color: '#475569',
  },
  ticketLineValue: {
    fontSize: 11,
    color: '#0f172a',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  ticketLineTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    paddingTop: 10,
    marginTop: 6,
  },
  ticketLineLabelTotal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#003B6F',
  },
  ticketLineValueTotal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2563eb',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  paymentChannelFrame: {
    marginTop: 15,
  },
  checkoutFieldLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#475569',
    marginBottom: 6,
  },
  methodChannelBox: {
    flexDirection: 'row',
    gap: 6,
  },
  methodBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  methodBtnActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  methodBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  methodBtnLabelActive: {
    color: '#2563eb',
  },
  cashFormSection: {
    marginTop: 15,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
  },
  cashHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cashChangePill: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#10b981',
  },
  cashInputAmountField: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 10 : 6,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  submitCompleteCheckoutBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitCompleteCheckoutBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  // VIEW 6: Success fully billed styles
  successScreenContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successOuterCirc: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successInnerCirc: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconCheck: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  successMainTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  successSubDesc: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  successBillingLedgerCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 14,
    width: '100%',
    maxWidth: 280,
    marginTop: 20,
  },
  successLedgerLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  successLedgerLabel: {
    color: '#94a3b8',
    fontSize: 10,
  },
  successLedgerValue: {
    color: '#60a5fa',
    fontSize: 11,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  successLedgerValueSub: {
    color: '#cbd5e1',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  successLedgerLabelMini: {
    color: '#475569',
    fontSize: 9,
  },
  successActionButtonsBlock: {
    width: '100%',
    maxWidth: 280,
    marginTop: 24,
    gap: 8,
  },
  successPrintBtn: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  successPrintBtnText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontWeight: '900',
  },
  successDoneBackBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  successDoneBackBtnText: {
    color: '#cbd5e1',
    fontSize: 9.5,
    fontWeight: '900',
  },
  // MODALS GENERAL WORK
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  pinContentModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  pinModalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  pinModalSub: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 4,
    fontWeight: 'bold',
  },
  pinInputField: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginVertical: 16,
    width: '100%',
  },
  pinModalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  modalCancelLabel: {
    color: '#475569',
    fontSize: 11.5,
    fontWeight: '700',
  },
  modalBtnOk: {
    backgroundColor: '#2563eb',
  },
  modalOkLabel: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  // NOTIFICATIONS SLIDING DRAWER
  notificationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  notifOverlayCloser: {
    flex: 1,
  },
  notificationDrawerBody: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: WINDOW_HEIGHT * 0.75,
  },
  notifDrawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 10,
    marginBottom: 10,
  },
  notifDrawerTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#f59e0b',
  },
  notifDrawerCloseBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDrawerCloseLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: 'bold',
  },
  notifListContainer: {
    paddingBottom: 15,
  },
  emptyNotifsFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 45,
  },
  notifCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  notifCardUnread: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderColor: '#2563eb',
  },
  notifCardRead: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: '#1e293b',
  },
  notifCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 8.5,
    color: '#64748b',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  markReadBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    borderRadius: 4,
  },
  markReadText: {
    color: '#60a5fa',
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  notifMsg: {
    fontSize: 10.5,
    color: '#cbd5e1',
    lineHeight: 14,
  },
  clearAllNotifsBtn: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  clearAllNotifsLabel: {
    color: '#f87171',
    fontSize: 9.5,
    fontWeight: '900',
  },
  centeredSizer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 8,
  },
  flexShrink: {
    flex: 1,
  },
});
