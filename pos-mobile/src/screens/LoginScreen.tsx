import React, { useState } from 'react';
import { StyleSheet as RNStyleSheet, View as RNView, Text as RNText, TextInput as RNTextInput, TouchableOpacity as RNTouchableOpacity, KeyboardAvoidingView as RNKeyboardAvoidingView, Platform as RNPlatform } from 'react-native';

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // In a real app, you would authenticate with Supabase/NestJS here.
    if (email && password) {
      onLogin();
    }
  };

  return (
    <RNKeyboardAvoidingView 
      style={styles.container}
      behavior={RNPlatform.OS === 'ios' ? 'padding' : 'height'}
    >
      <RNView style={styles.formContainer}>
        <RNView style={styles.logoContainer}>
          <RNView style={styles.logoSquare}>
            <RNView style={styles.logoInnerSquare} />
          </RNView>
          <RNText style={styles.logoText}>Alegra+ POS</RNText>
        </RNView>

        <RNText style={styles.title}>Iniciar Sesión</RNText>
        <RNText style={styles.subtitle}>Ingresa tus credenciales para continuar al Punto de Venta</RNText>

        <RNTextInput
          style={styles.input}
          placeholder="Correo Electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <RNTextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <RNTouchableOpacity style={styles.button} onPress={handleLogin}>
          <RNText style={styles.buttonText}>Entrar</RNText>
        </RNTouchableOpacity>

        <RNTouchableOpacity style={styles.forgotPassword}>
          <RNText style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</RNText>
        </RNTouchableOpacity>
      </RNView>
    </RNKeyboardAvoidingView>
  );
}

const styles = RNStyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  logoSquare: {
    width: 40,
    height: 40,
    backgroundColor: '#003B6F',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInnerSquare: {
    width: 20,
    height: 20,
    backgroundColor: '#2563eb',
    borderRadius: 4,
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
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPassword: {
    marginTop: 20,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  }
});
