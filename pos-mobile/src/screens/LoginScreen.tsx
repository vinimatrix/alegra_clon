import React, { useState, useEffect } from 'react';
import { 
  StyleSheet as RNStyleSheet, 
  View as RNView, 
  Text as RNText, 
  TextInput as RNTextInput, 
  TouchableOpacity as RNTouchableOpacity, 
  KeyboardAvoidingView as RNKeyboardAvoidingView, 
  Platform as RNPlatform,
  ActivityIndicator as RNActivityIndicator,
  Modal as RNModal,
  ScrollView as RNScrollView,
  Alert as RNAlert
} from 'react-native';
import { supabase, getSupabaseConfig, reinitializeSupabase } from '../services/supabaseClient';
import { isSupabaseActive } from '../services/api';

export default function LoginScreen({ onLogin }: { onLogin: (userEmail?: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Database configuration state
  const [config, setConfig] = useState(getSupabaseConfig());
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(config.url === 'https://placeholder.supabase.co' ? '' : config.url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(config.key === 'placeholder_key' ? '' : config.key);
  const [useSupabase, setUseSupabase] = useState(config.use);

  // Sync state when config changes or component mounts
  useEffect(() => {
    const activeConfig = getSupabaseConfig();
    setConfig(activeConfig);
    setSupabaseUrlInput(activeConfig.url === 'https://placeholder.supabase.co' ? '' : activeConfig.url);
    setSupabaseKeyInput(activeConfig.key === 'placeholder_key' ? '' : activeConfig.key);
    setUseSupabase(activeConfig.use);
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Por favor ingresa correo y contraseña.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    const isDbActive = isSupabaseActive();

    if (isDbActive) {
      try {
        console.log('🔑 Intento de login Supabase en móvil:', email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data?.user) {
          setSuccessMessage('¡Sesión iniciada con éxito!');
          setTimeout(() => {
            onLogin(data.user.email);
          }, 1000);
        }
      } catch (err: any) {
        console.warn('Error logins Supabase en móvil:', err);
        let msg = err.message || 'Error de conexión con Supabase.';
        if (msg.includes('Invalid login credentials')) {
          msg = 'Credenciales inválidas. Comprueba tu correo o contraseña.';
        }
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Mock Bypass Offline Mode if DB is local or inactive
      console.log('⚡ Login en modo offline / Demo');
      setTimeout(() => {
        setIsLoading(false);
        onLogin(email);
      }, 800);
    }
  };

  const handleSaveConfig = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('alegra_supabase_url', supabaseUrlInput.trim());
        localStorage.setItem('alegra_supabase_key', supabaseKeyInput.trim());
        localStorage.setItem('alegra_supabase_use', useSupabase ? 'true' : 'false');
      }
      
      reinitializeSupabase();
      const freshConfig = getSupabaseConfig();
      setConfig(freshConfig);
      setShowConfigModal(false);
      
      const active = isSupabaseActive();
      
      if (RNPlatform.OS === 'web') {
        if (typeof window !== 'undefined') {
          RNAlert.alert(
            'Guardado', 
            `Configuración guardada. Modo actual: ${active ? 'Supabase Nube' : 'Punto de Venta Local'}. La página se recargará para aplicar los cambios.`
          );
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      } else {
        RNAlert.alert(
          'Configuración Guardada',
          `Modo de Base de datos establecido: ${active ? 'Nube Supabase' : 'Offline / Memoria'}`
        );
      }
    } catch (e: any) {
      setErrorMessage('Error guardando configuración: ' + e.message);
    }
  };

  const handleBypassOffline = () => {
    setErrorMessage('');
    onLogin('demo@alegra.com');
  };

  return (
    <RNKeyboardAvoidingView 
      style={styles.container}
      behavior={RNPlatform.OS === 'ios' ? 'padding' : 'height'}
    >
      <RNScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <RNView style={styles.formContainer}>
          
          {/* Header Indicator */}
          <RNView style={styles.dbIndicatorWrapper}>
            <RNView style={[styles.dbDot, { backgroundColor: isSupabaseActive() ? '#10b981' : '#f59e0b' }]} />
            <RNText style={styles.dbIndicatorText}>
              Base de Datos: {isSupabaseActive() ? 'Nube Supabase' : 'Offline / Demo Local'}
            </RNText>
            <RNTouchableOpacity 
              onPress={() => setShowConfigModal(true)} 
              style={styles.settingsPill}
              activeOpacity={0.7}
            >
              <RNText style={styles.settingsPillText}>⚙️ Conexión</RNText>
            </RNTouchableOpacity>
          </RNView>

          <RNView style={styles.logoContainer}>
            <RNView style={styles.logoSquare}>
              <RNView style={styles.logoInnerSquare} />
            </RNView>
            <RNText style={styles.logoText}>Alegra+ POS</RNText>
          </RNView>

          <RNText style={styles.title}>Iniciar Sesión</RNText>
          <RNText style={styles.subtitle}>
            {isSupabaseActive() 
              ? 'Usa tu usuario registrado en Supabase para entrar al POS Móvil' 
              : 'Ingresa cualquier correo para explorar en modo Demo offline'}
          </RNText>

          {errorMessage ? (
            <RNView style={styles.errorBox}>
              <RNText style={styles.errorText}>⚠️ {errorMessage}</RNText>
            </RNView>
          ) : null}

          {successMessage ? (
            <RNView style={styles.successBox}>
              <RNText style={styles.successText}>✅ {successMessage}</RNText>
            </RNView>
          ) : null}

          <RNTextInput
            style={styles.input}
            placeholder="Correo Electrónico"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          <RNTextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />

          <RNTouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <RNActivityIndicator size="small" color="#ffffff" />
            ) : (
              <RNText style={styles.buttonText}>Entrar al Punto de Venta</RNText>
            )}
          </RNTouchableOpacity>

          {isSupabaseActive() && (
            <RNTouchableOpacity style={styles.bypassLink} onPress={handleBypassOffline}>
              <RNText style={styles.bypassLinkText}>Entrar en Modo Offline (Demo local)</RNText>
            </RNTouchableOpacity>
          )}
        </RNView>
      </RNScrollView>

      {/* Connection Config Modal */}
      <RNModal
        visible={showConfigModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConfigModal(false)}
      >
        <RNView style={styles.modalOverlay}>
          <RNView style={styles.modalContent}>
            <RNText style={styles.modalTitle}>Configurar Conexión</RNText>
            <RNText style={styles.modalSub}>
              Enlaza este Punto de Venta Móvil con tu servidor o base de datos en la nube.
            </RNText>

            <RNText style={styles.label}>URL de Supabase:</RNText>
            <RNTextInput
              style={styles.modalInput}
              placeholder="https://xxxx.supabase.co"
              placeholderTextColor="#9ca3af"
              value={supabaseUrlInput}
              onChangeText={setSupabaseUrlInput}
              autoCapitalize="none"
            />

            <RNText style={styles.label}>Clave Pública (Anon Key):</RNText>
            <RNTextInput
              style={styles.modalInput}
              placeholder="eyJhbGciOi..."
              placeholderTextColor="#9ca3af"
              value={supabaseKeyInput}
              onChangeText={setSupabaseKeyInput}
              autoCapitalize="none"
              secureTextEntry={true}
            />

            <RNText style={styles.label}>Estado de conexión:</RNText>
            <RNView style={styles.checkboxContainer}>
              <RNTouchableOpacity 
                style={[styles.checkbox, useSupabase && styles.checkboxChecked]} 
                onPress={() => setUseSupabase(!useSupabase)}
              >
                {useSupabase && <RNText style={styles.checkMark}>✓</RNText>}
              </RNTouchableOpacity>
              <RNText style={styles.checkboxLabel}>Habilitar sincronización con Supabase</RNText>
            </RNView>

            <RNView style={styles.modalActions}>
              <RNTouchableOpacity 
                style={[styles.modalButton, styles.cancelBtn]} 
                onPress={() => setShowConfigModal(false)}
              >
                <RNText style={styles.cancelBtnText}>Cancelar</RNText>
              </RNTouchableOpacity>
              <RNTouchableOpacity 
                style={[styles.modalButton, styles.saveBtn]} 
                onPress={handleSaveConfig}
              >
                <RNText style={styles.saveBtnText}>Guardar</RNText>
              </RNTouchableOpacity>
            </RNView>
          </RNView>
        </RNView>
      </RNModal>
    </RNKeyboardAvoidingView>
  );
}

const styles = RNStyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  dbIndicatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1.5,
    elevation: 2,
  },
  dbDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dbIndicatorText: {
    fontSize: 11,
    color: '#4b5563',
    fontWeight: '600',
    marginRight: 10,
  },
  settingsPill: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  settingsPillText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  logoSquare: {
    width: 44,
    height: 44,
    backgroundColor: '#003B6F',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInnerSquare: {
    width: 22,
    height: 22,
    backgroundColor: '#2563eb',
    borderRadius: 6,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#003B6F',
    marginLeft: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 13,
    fontWeight: '500',
  },
  successBox: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  successText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 16,
    color: '#1f2937',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bypassLink: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 10,
  },
  bypassLinkText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: 450,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 20,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#334155',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: 'bold',
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: '#2563eb',
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
