# 🚀 Guía de Despliegue de Producción

Este documento contiene las instrucciones precisas para desplegar e implementar tanto la **Aplicación Web (Vite + React)** como la **Aplicación Móvil (Expo React Native)** de nuestro sistema.

---

## 🌐 1. Despliegue Web con Vercel

La aplicación web está optimizada para funcionar como una **Sugerencia de SPA (Single Page Application)**. Hemos creado un archivo de configuración `/vercel.json` en la raíz para habilitar redirecciones limpias y URL amigables.

### Pasos para desplegar:

#### Opción A: Despliegue con un Clic (GitHub Integration - Recomendado)
1. Sube el código de este repositorio a tu cuenta de **GitHub**, **GitLab** o **Bitbucket**.
2. Ve al panel de control de [Vercel](https://vercel.com/) e inicia sesión.
3. Haz clic en **"Add New"** > **"Project"**.
4. Importa tu repositorio desde tu proveedor de Git.
5. Configura los siguientes parámetros en el panel de Vercel:
   - **Framework Preset**: `Vite` (lo detectará automáticamente).
   - **Root Directory**: `./` (la carpeta raíz del proyecto).
   - **Build Command**: `vite build` o `npm run build`.
   - **Output Directory**: `dist`.
6. Despliega las siguientes **Variables de Entorno (Environment Variables)** en el paso 4 si deseas integrar base de datos persistente:
   - `VITE_SUPABASE_URL`: Tu Endpoint URL de Supabase.
   - `VITE_SUPABASE_ANON_KEY`: Tu clave anónima pública de Supabase.
   - `VITE_USE_SUPABASE`: `true` (para activar la sincronización automática).
7. Haz clic en **"Deploy"** y Vercel te proporcionará un subdominio público SSL seguro (ej. `mi-app-pos.vercel.app`).

#### Opción B: Despliegue mediante Vercel CLI (Línea de Comandos)
Si prefieres desplegar directamente desde tu terminal local sin pasar por Git:
```bash
# 1. Instalar Vercel CLI globalmente
npm install -g vercel

# 2. Iniciar sesión en Vercel
vercel login

# 3. Lanzar configuración y despliegue del proyecto
vercel
```
Sigue el asistente interactivo asignando el directorio principal y listo. Para subir los cambios a producción directamente, utiliza:
```bash
vercel --prod
```

---

## 📱 2. Despliegue y Construcción de la App Móvil (`pos-mobile`)

La aplicación móvil se desarrolló utilizando **Expo Engine & React Native**, lo que facilita el proceso de compilación nativa para Android (`.apk` / `.aab`) y iOS (`.ipa`) con **EAS (Expo Application Services)**.

### Requisitos previos:
Navega a la carpeta de la app móvil en tu terminal local:
```bash
cd pos-mobile
```

### Configuración de EAS Build (Compilación en la Nube de Expo)

1. **Instalar EAS CLI de manera global:**
   ```bash
   npm install -g eas-cli
   ```
2. **Iniciar sesión en tu cuenta de Expo (Crea una si no tienes en [expo.dev](https://expo.dev)):**
   ```bash
   eas login
   ```
3. **Inicializar y vincular tu proyecto a tu cuenta Expo:**
   ```bash
   eas project:init
   ```
4. **Configurar los flujos de compilación (Bajo demanda generará un archivo `eas.json`):**
   ```bash
   eas build:configure
   ```

### Canales de Despliegue e Instalación

#### Para probar en Android de manera inmediata (Generar archivo APK):
Si quieres entregar un archivo ejecutable APK directamente para instalar en terminales de meseros o cocineros, compila una versión de desarrollo interna:
```bash
eas build --platform android --profile preview
```
*Esto generará un enlace público en tu dashboard de expo para descargar e instalar el archivo `.apk` de prueba física de inmediato en cualquier dispositivo Android.*

#### Para publicar en Google Play Store (Producción):
```bash
eas build --platform android --profile production
```
*Este comando generará el archivo `.aab` (Android App Bundle) optimizado para Play Console junto con las firmas y almacén de llaves generados automáticamente de forma segura por los servidores de Expo.*

#### Para publicar en Apple App Store (iOS):
*Nota: Se requiere una cuenta de Apple Developer para compilar para producción iOS.*
```bash
eas build --platform ios --profile production
```

---

## 🛠️ 3. Ejecución Local para Desarrollo

Si necesitas correr todo el sistema de manera integrada en tu máquina local:

### 🖥️ Iniciar Sitio Web (Consola Administrativa, POS de Salón & Cocina KDS)
```bash
# Instalar dependencias globales del proyecto
npm install

# Correr servidor local de desarrollo interactivo
npm run dev
```
Accede desde tu navegador a `http://localhost:3000`.

### 📱 Iniciar Emulador de App Móvil
```bash
# Ir al proyecto móvil
cd pos-mobile

# Instalar dependencias 
npm install

# Iniciar servidor Expo bundler
npm run start
```
- Presiona `a` para abrir el compilador e instalar en el emulador de Android.
- Presiona `i` para abrir en el simulador de iOS.
- Escanea el código QR desde tu smartphone real con la app **Expo Go** (disponible en App Store y Google Play) para ver y probar la app de inmediato en tiempo real con recarga caliente integrada.

---

## 🗃️ 4. Sincronización con Supabase & Tiempo Real (Web & Móvil)

Nuestra suite soporta tanto almacenamiento temporal inteligente local en el navegador como sincronización de base de datos **PostgreSQL de Supabase** con actualización inmediata bidireccional en tiempo real (**Supabase Realtime Channels**).

### A. Habilitar la replicación de tablas en Supabase
Para que Supabase empuje cambios a través de Websockets en tiempo real, debes activar la replicación de las tablas `orders` y `tables`:
1. Ve a tu panel de **Supabase**.
2. Entra en **Database** -> **Replication**.
3. En la replicación `supabase_realtime`, haz clic en **"Source"** (o cambia el switch) de las tablas **`orders`** y **`tables`** para activarlas en tiempo real.

---

## ⚡ 5. Configuración de Notificaciones Push & Realtime en la App Móvil (`pos-mobile`)

Para habilitar la sincronización en la app nativa y enviar notificaciones inmediatamente cuando la cocina despache una orden:

### Paso 1: Instalar dependencias necesarias en la app móvil
Ejecuta esto desde la terminal de la carpeta `pos-mobile`:
```bash
cd pos-mobile
npx expo install @supabase/supabase-js expo-notifications expo-device
```

### Paso 2: Crear el cliente de Supabase en Móvil
Crea un archivo llamado `src/services/supabaseMobile.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-anon-key-de-supabase';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Paso 3: Configurar Notificaciones Push y Supabase Realtime en `App.tsx`
Reemplaza el archivo central `/pos-mobile/App.tsx` con el siguiente código que solicita permisos para notificaciones del dispositivo en primer/segundo plano y se suscribe en tiempo real a las comandas de cocina:

```typescript
import { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './src/services/supabaseMobile';
import LoginScreen from './src/screens/LoginScreen';
import POSScreen from './src/screens/POSScreen';

// Configurar comportamiento para albergar notificaciones de alerta mientras la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  // 1. Registro para Notificaciones Push Nativas
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) setExpoPushToken(token);
    });

    // Listener para recibir notificaciones mientras la app está en primer plano
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificación recibida en vivo:', notification);
    });

    // Listener cuando el usuario hace clic en la notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Interacción con Notificación:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // 2. Escuchar cambios de Supabase Realtime sobre Comandas despachadas
  useEffect(() => {
    // Escucha inserciones de nuevas comandas o cambios de estado
    const channel = supabase
      .channel('mobile-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async (payload) => {
        console.log('Comanda actualizada en base:', payload);
        
        // Si la comanda cambió de estado, alertamos al mesero/tablet
        if (payload.eventType === 'UPDATE') {
          const order = payload.new;
          if (order.status === 'en_preparacion' || order.status === 'entregada') {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '👨‍🍳 Alerta de Cocina KDS',
                body: `La comanda de la Mesa "${order.table_name || 'Mesa'}" está lista o en preparación!`,
                data: { orderId: order.id },
              },
              trigger: null, // Envío inmediato local
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      {isLoggedIn ? (
        <POSScreen onLogout={() => setIsLoggedIn(false)} />
      ) : (
        <LoginScreen onLogin={() => setIsLoggedIn(true)} />
      )}
    </>
  );
}

// Función auxiliar para obtener permisos del Sistema Operativo
async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default KDS Channel',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('No se otorgaron permisos de notificación!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Expo Push Token del dispositivo:', token);
  } else {
    console.log('Debe probar las notificaciones push en un dispositivo móvil real.');
  }

  return token;
}
```
