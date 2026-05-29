/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Smartphone, 
  ShoppingCart, 
  Search, 
  Plus, 
  Check, 
  Wifi, 
  Battery, 
  Signal, 
  Copy, 
  Code, 
  CheckCircle, 
  Package, 
  Info 
} from 'lucide-react';
import { Product } from '../types';

interface POSMobileSimulatorProps {
  products: Product[];
}

export default function POSMobileSimulator({ products }: POSMobileSimulatorProps) {
  const [mobileCart, setMobileCart] = useState<{ product: Product; qty: number }[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeScreen, setActiveScreen] = useState<'catalog' | 'cart' | 'success'>('catalog');

  const mobileProducts = products;

  const addProductToMobileCart = (prod: Product) => {
    const existing = mobileCart.find(i => i.product.id === prod.id);
    if (existing) {
      setMobileCart(mobileCart.map(i => i.product.id === prod.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setMobileCart([...mobileCart, { product: prod, qty: 1 }]);
    }
  };

  const clearMobileCart = () => {
    setMobileCart([]);
    setActiveScreen('catalog');
  };

  const checkoutMobileOrder = () => {
    setActiveScreen('success');
  };

  const subtotal = mobileCart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  // Actual React Native complete code template
  const reactNativeCode = `/**
 * Alegra Clone POS - Mobile Screen in React Native
 * Language: TypeScript
 * Built with: React Native + Expo + Tailwind (NativeWind) & React Context
 */

import React, { useState, useContext } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView, 
  Alert 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
}

export default function MobilePOSApp() {
  const [cart, setCart] = useState<{ id: string; name: string; qty: number; price: number }[]>([]);
  const [search, setSearch] = useState('');

  const productsList: Product[] = [
    { id: '1', name: 'Mofongo con Chicharrón', price: 450.00, sku: 'REST-001' },
    { id: '2', name: 'Refresco Cola Regular', price: 80.00, sku: 'REST-007' },
    { id: '3', name: 'Hamburguesa Artesanal', price: 480.00, sku: 'REST-004' },
  ];

  const handleAddToCart = (item: Product) => {
    const exists = cart.find(c => c.id === item.id);
    if (exists) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { id: item.id, name: item.name, qty: 1, price: item.price }]);
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleFinalizeCheckout = () => {
    Alert.alert(
      "Factura Procesada exitosamente",
      \`Total cobrado: $ \${totalAmount * 1.18} (Incl. ITBIS 18%)\`,
      [{ text: "Aceptar", onPress: () => setCart([]) }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {/* Cabecera Móvil */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alegra POS Móvil 📱</Text>
        <Text style={styles.headerSubtitle}>Sincronización Local & Supabase</Text>
      </View>

      {/* Grid de productos */}
      <View style={styles.body}>
        <FlatList
          data={productsList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <View>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>\${item.price.toFixed(2)}</Text>
              </View>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => handleAddToCart(item)}
              >
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      {/* Franja del carrito inferior */}
      {cart.length > 0 && (
        <View style={styles.cartFooter}>
          <Text style={styles.totalText}>Total: \${(totalAmount * 1.18).toFixed(2)}</Text>
          <TouchableOpacity 
            style={styles.checkoutBtn}
            onPress={handleFinalizeCheckout}
          >
            <Text style={styles.checkoutBtnText}>COBRAR</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1128' },
  header: { padding: 20, backgroundColor: '#ff6600', borderBottomWidth: 1, borderColor: '#e05900' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 12, color: '#fdd' },
  body: { flex: 1, padding: 15 },
  productCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 10 
  },
  productName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  productPrice: { fontSize: 13, color: '#ff6600', fontWeight: 'bold', marginTop: 4 },
  addButton: { backgroundColor: '#ff6600', width: 35, height: 35, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cartFooter: { padding: 20, borderTopWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  checkoutBtn: { backgroundColor: '#03c03c', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  checkoutBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});`;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(reactNativeCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6" id="pos-mobile-screen">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-alegra-secondary font-display flex items-center gap-2">
            <Smartphone size={22} className="text-alegra-primary" />
            POS Móvil & Simulador React Native
          </h1>
          <p className="text-sm text-gray-500">
            Prueba el POS Restaurante directo en la versión móvil simulada e inspecciona el código base React Native estructurado.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 p-2.5 rounded-lg text-xs leading-relaxed max-w-sm hidden md:flex">
          <Info size={16} className="shrink-0" />
          <p>La vista interactiva simula el comportamiento de compilaciones en dispositivos iOS / Android.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Simulated phone viewport */}
        <div className="lg:col-span-5 flex justify-center" id="phone-container">
          
          {/* Physical Phone Frame Design using CSS */}
          <div className="relative w-76 sm:w-82 h-[640px] bg-slate-900 rounded-[44px] shadow-2xl p-3 border-4 border-slate-750 flex flex-col overflow-hidden">
            
            {/* Phone notch bar */}
            <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 flex justify-between items-center px-8 z-50 text-white text-[10px] select-none">
              <span className="font-semibold font-mono">12:10</span>
              <div className="w-18 h-4.5 bg-black rounded-b-xl absolute left-1/2 -translate-x-1/2 top-0"></div>
              <div className="flex items-center gap-1 opacity-80">
                <Signal size={10} />
                <Wifi size={10} />
                <Battery size={11} />
              </div>
            </div>

            {/* Inner App Container Content */}
            <div className="flex-1 bg-slate-950 rounded-[35px] overflow-hidden flex flex-col relative pt-5 text-white">
              
              {/* Internal app navbar */}
              <div className="bg-blue-600 p-4 pt-5 pb-3 border-b border-blue-700 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold font-display uppercase tracking-wider text-white">Alegra POS Móvil</h3>
                  <p className="text-[8px] text-blue-100 font-medium">Restaurante Rápido</p>
                </div>
                <button 
                  onClick={() => setActiveScreen(activeScreen === 'catalog' ? 'cart' : 'catalog')}
                  className="relative p-1.5 hover:bg-white/10 rounded-full transition-all cursor-pointer"
                >
                  <ShoppingCart size={15} />
                  {mobileCart.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-white text-blue-605 font-extrabold text-[8px] px-1.5 py-0.5 rounded-full shadow-md animate-bounce" style={{ color: '#2563eb' }}>
                      {mobileCart.reduce((acc, i) => acc + i.qty, 0)}
                    </span>
                  )}
                </button>
              </div>

              {/* Screens router */}
              {activeScreen === 'catalog' && (
                <div className="p-3 flex-1 overflow-y-auto space-y-3 flex flex-col justify-between">
                  {/* Internal product listing */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Menú del Día</p>
                    <div className="space-y-2">
                      {mobileProducts.map(p => (
                        <div 
                          key={p.id}
                          className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center"
                        >
                          <div className="truncate max-w-[150px]">
                            <h4 className="text-[11px] font-extrabold text-white truncate">{p.name}</h4>
                            <p className="text-[9px] text-blue-400 font-mono mt-0.5">${p.price.toFixed(0)}</p>
                          </div>
                          <button
                            onClick={() => addProductToMobileCart(p)}
                            className="bg-blue-600 text-white hover:bg-blue-700 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs cursor-pointer shadow-sm transition-all"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick summary strip on catalog */}
                  {mobileCart.length > 0 && (
                    <div className="bg-blue-600 p-3 rounded-xl flex items-center justify-between text-xs font-bold animate-fade-in">
                      <span>Total: ${total.toFixed(0)}</span>
                      <button 
                        onClick={() => setActiveScreen('cart')}
                        className="bg-white text-blue-600 px-3 py-1 rounded text-[10px] font-extrabold select-none cursor-pointer"
                      >
                        REVISAR PEDIDO
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeScreen === 'cart' && (
                <div className="p-3 flex-1 flex flex-col justify-between overflow-y-auto">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Tu Carrito Móvil</p>
                      <button 
                        onClick={clearMobileCart}
                        className="text-[9px] text-red-400 hover:underline cursor-pointer"
                      >
                        Vaciar
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                      {mobileCart.length === 0 ? (
                        <p className="text-xs text-center text-gray-500 py-10">Agrega productos para facturar</p>
                      ) : (
                        mobileCart.map((item, idx) => (
                          <div key={idx} className="bg-slate-900 p-2.5 rounded-lg flex items-center justify-between text-[11px]">
                            <div>
                              <span className="font-bold block text-white truncate max-w-[130px]">{item.product.name}</span>
                              <span className="text-gray-400 font-mono text-[10px]">${item.product.price} x {item.qty}</span>
                            </div>
                            <span className="font-bold text-blue-400 font-mono">${(item.product.price * item.qty).toFixed(0)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Calculations total mobile */}
                  {mobileCart.length > 0 && (
                    <div className="space-y-2 border-t border-dashed border-slate-800 pt-3">
                      <div className="text-[10px] text-gray-400 space-y-1 font-mono">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ITBIS (18%):</span>
                          <span>${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-extrabold text-blue-400 pt-1.5 border-t border-slate-850 mt-1.5">
                          <span>Total General:</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setActiveScreen('catalog')}
                          className="bg-slate-800 hover:bg-slate-755 text-gray-300 font-semibold py-2 rounded-lg cursor-pointer"
                        >
                          Atrás
                        </button>
                        <button
                          type="button"
                          onClick={checkoutMobileOrder}
                          className="bg-emerald-600 hover:bg-emerald-750 text-white font-extrabold py-2 rounded-lg flex justify-center items-center gap-1 cursor-pointer"
                        >
                          <Check size={11} /> COBRAR POS
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeScreen === 'success' && (
                <div className="p-4 flex-1 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in bg-slate-950">
                  <div className="p-4.5 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/30 animate-pulse">
                    <CheckCircle size={32} />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-white font-display">Factura Cobrada Exitosamente</h4>
                    <p className="text-[10px] text-gray-400 mt-1.5">Comprobante y Asiento contable sincronizados con el nodo central ERP.</p>
                  </div>
                  <div className="bg-slate-900 px-4 py-2 rounded-lg font-mono text-[10px] border border-slate-800 text-gray-300">
                    <p>Monto: ${total.toFixed(2)}</p>
                    <p className="mt-0.5">IVA/ITBIS: ${tax.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={clearMobileCart}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-6 py-2 rounded-lg transition-all shadow-md cursor-pointer"
                  >
                    Nueva venta móvil
                  </button>
                </div>
              )}
            </div>

            {/* Simulated home indicator line */}
            <div className="w-24 h-1 bg-white/40 rounded-full mx-auto mt-2"></div>
          </div>
        </div>

        {/* Right column: Copiable React Native Code documentation */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4 text-xs font-sans text-gray-700" id="mobile-code-card">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-alegra-secondary font-display flex items-center gap-1.5">
                <Code size={18} className="text-blue-600" />
                Flujo Tecnológico de React Native (TSX)
              </h2>
              <p className="text-[11px] text-gray-400">Implementación real para compilar terminales de cobro POS en Android y iOS</p>
            </div>
            <button
              onClick={handleCopyToClipboard}
              className="bg-slate-100/80 hover:bg-slate-100 border border-gray-200 text-gray-600 text-[10px] font-semibold tracking-wider px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
            >
              <Copy size={12} className={copiedCode ? 'text-emerald-500' : ''} />
              {copiedCode ? 'Copiado!' : 'Copiar Código'}
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50/60 p-3.5 border border-blue-100 rounded-lg text-blue-800 flex items-start gap-2 text-[11px] leading-relaxed">
              <Package size={16} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Alegra POS Sincronizado</span>: Utilizando el cliente de Supabase JS se puede hacer un canal en tiempo real para sincronizar pedidos tomados por los camareros del restaurante directamente a la comandera de la cocina y el POS central de caja en menos de 100ms.
              </div>
            </div>

            {/* Code container scroll */}
            <div className="max-h-[350px] overflow-y-auto rounded-lg border border-gray-150 bg-slate-900/95 font-mono text-[9px] p-4 text-gray-300 leading-normal scrollbar-thin">
              <pre>{reactNativeCode}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
