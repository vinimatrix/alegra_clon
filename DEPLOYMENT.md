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

## 🗃️ 4. Sincronización con Supabase (Opcional - Backend persistente)

Nuestra suite soporta tanto almacenamiento temporal inteligente local en el navegador como sincronización persistente mediante una base de datos Postgres de Supabase.

1. Crea un proyecto gratuito en [Supabase](https://supabase.com/).
2. Copia tus variables de conexión `API URL` y `Anon Key`.
3. Agrégalas en el panel web ingresando a **Ajustes** dentro del sistema, o declarándolas como variables de entorno al desplegar para que todos tus meseros y tablets KDS de cocina trabajen coordinados con el mismo inventario y órdenes de mesa en tiempo real.
