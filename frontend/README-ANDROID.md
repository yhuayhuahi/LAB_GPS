# QSY Ventas para Android

La carpeta `android/` contiene la aplicación nativa Capacitor. No es necesario reescribir React: Capacitor empaqueta el frontend existente como APK.

## Antes de generar una APK

1. Conectar el backend a una URL visible para el teléfono.
   - Producción: `https://api.tu-dominio.pe/api/v1`.
   - Prueba por Wi-Fi: la IPv4 LAN de la PC, por ejemplo `http://192.168.1.50:3000/api/v1`.
2. Crear `frontend/.env.production.local` con:

```env
VITE_API_BASE=https://api.tu-dominio.pe/api/v1
```

No se debe usar `localhost`: dentro del teléfono apunta al propio teléfono, no a la PC.

## Generar APK de prueba

En PowerShell, desde `frontend`:

```powershell
npm run build
npx cap sync android
cd android
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
.\gradlew.bat assembleDebug
```

El archivo se genera en:

```text
android\app\build\outputs\apk\debug\app-debug.apk
```

## Alternativa con Android Studio

1. Abrir Android Studio.
2. Seleccionar **Open** y abrir `frontend/android`.
3. Esperar la sincronización de Gradle.
4. Ir a **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
5. Copiar `app-debug.apk` al celular e instalarlo permitiendo la instalación desde esa aplicación de archivos.

Para publicar a usuarios reales se debe crear una APK/AAB firmada con una clave de QSY y usar la URL HTTPS del VPS.
