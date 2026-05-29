import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, SafeAreaView, TextInput, Alert, ScrollView } from 'react-native';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

const MOCK_PRODUCTS: Product[] = [
  { id: 'p-01', name: 'Mofongo con Chicharrón', price: 450.00, stock: 120 },
  { id: 'p-02', name: 'Pechuga de Pollo a la Plancha', price: 390.00, stock: 95 },
  { id: 'p-03', name: 'Mofongo de Camarones al Ajillo', price: 650.00, stock: 45 },
  { id: 'p-04', name: 'Hamburguesa Artesanal "La Criolla"', price: 480.00, stock: 80 },
  { id: 'p-05', name: 'Cerveza Presidente Grande', price: 230.00, stock: 350 },
  { id: 'p-06', name: 'Limonada Natural Imperial', price: 125.00, stock: 500 },
  { id: 'p-07', name: 'Refresco Cola Regular', price: 80.00, stock: 420 },
  { id: 'p-08', name: 'Audífonos Bluetooth Wireless Pro', price: 1800.00, stock: 24 },
  { id: 'p-09', name: 'Cargador Rápido USB-C 20W', price: 750.00, stock: 8 },
  { id: 'p-10', name: 'Termo de Acero Inoxidable 1L', price: 1200.00, stock: 45 },
  { id: 'p-11', name: 'Café de Especialidad Molido (1lb)', price: 420.00, stock: 68 },
];

export default function POSScreen({ onLogout }: { onLogout: () => void }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = MOCK_PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
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

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Carrito Vacío', 'Agrega productos antes de facturar.');
      return;
    }
    Alert.alert(
      'Factura Creada', 
      `Total cobrado: $${totalAmount.toFixed(2)}`,
      [{ text: 'OK', onPress: () => setCart([]) }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoSquare} />
          <Text style={styles.headerTitle}>Alegra+ POS</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Product Catalog */}
        <View style={styles.catalogSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <FlatList
            data={filteredProducts}
            keyExtractor={item => item.id}
            numColumns={2}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.productCard} onPress={() => addToCart(item)}>
                <View style={styles.productImagePlaceholder} />
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                <Text style={styles.productStock}>Stock: {item.stock}</Text>
              </TouchableOpacity>
            )}
            columnWrapperStyle={styles.row}
          />
        </View>

        {/* Cart Section */}
        <View style={styles.cartSection}>
          <Text style={styles.cartTitle}>Carrito ({cart.reduce((sum, item) => sum + item.quantity, 0)})</Text>
          
          <ScrollView style={styles.cartList}>
            {cart.map(item => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  <Text style={styles.cartItemQty}>{item.quantity} x ${item.price.toFixed(2)}</Text>
                </View>
                <Text style={styles.cartItemTotal}>${(item.quantity * item.price).toFixed(2)}</Text>
                <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            ))}
            {cart.length === 0 && (
              <Text style={styles.emptyCartText}>No hay productos en el carrito</Text>
            )}
          </ScrollView>

          <View style={styles.checkoutSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total a Pagar</Text>
              <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
              <Text style={styles.checkoutButtonText}>Cobrar y Facturar</Text>
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
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoSquare: {
    width: 24,
    height: 24,
    backgroundColor: '#2563eb',
    borderRadius: 6,
    marginRight: 10,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  catalogSection: {
    flex: 2,
    padding: 15,
    borderRightWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: '#ffffff',
    width: '48%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productImagePlaceholder: {
    height: 80,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    marginBottom: 10,
  },
  productName: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  productPrice: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  productStock: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
  cartSection: {
    flex: 1.2,
    backgroundColor: '#ffffff',
    padding: 15,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  cartList: {
    flex: 1,
  },
  emptyCartText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 40,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontWeight: 'bold',
    color: '#374151',
    fontSize: 13,
  },
  cartItemQty: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },
  cartItemTotal: {
    fontWeight: 'bold',
    color: '#1f2937',
    width: 60,
    textAlign: 'right',
  },
  removeButton: {
    width: 24,
    height: 24,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  removeButtonText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 12,
  },
  checkoutSection: {
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  checkoutButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
