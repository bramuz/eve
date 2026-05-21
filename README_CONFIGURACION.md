# Configuración de Firebase para Eve

La aplicación puede tardar en cargar si Firebase no está configurado correctamente. Sigue estos pasos:

## 1. Configurar Reglas de Firestore (MUY IMPORTANTE)

**Este es el problema principal cuando se queda "Guardando..." o no carga los datos**

Ve a [Firebase Console](https://console.firebase.google.com/project/eve-da15f/firestore/rules) → Firestore Database → **Reglas**

Reemplaza TODO el contenido con estas reglas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir operaciones en citas del usuario autenticado
    match /appointments/{appointmentId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Permitir operaciones en clientes del usuario autenticado
    match /clients/{clientId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Permitir operaciones en pagos del usuario autenticado
    match /payments/{paymentId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

**¡IMPORTANTE!** Después de pegar las reglas, haz clic en **"Publicar"** en la parte superior.

### Verificar que las reglas se aplicaron:

1. Ve a la pestaña "Reglas" en Firestore
2. Deberías ver `rules_version = '2';` al inicio
3. La fecha de publicación debe ser reciente

## 2. Habilitar Autenticación

Ve a Firebase Console → Authentication → Sign-in method

Habilita:
- ✅ Email/Password
- ✅ Google (opcional)

## 3. Crear Base de Datos Firestore

1. Ve a Firebase Console → Firestore Database
2. Clic en "Crear base de datos"
3. Selecciona "Modo de producción" (luego cambiarás las reglas)
4. Elige la ubicación más cercana (ej: us-central1)

## 4. Verificar Variables de Entorno

Asegúrate que tu archivo `.env` tenga todas las credenciales:

```
VITE_FIREBASE_API_KEY=AIzaSyBxduosM7nMnLJCXoohUtFuGA7YlCsBy1I
VITE_FIREBASE_AUTH_DOMAIN=eve-da15f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=eve-da15f
VITE_FIREBASE_STORAGE_BUCKET=eve-da15f.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=895726666797
VITE_FIREBASE_APP_ID=1:895726666797:web:c6bcf9cd7c7aa177f7e4a4
```

## 5. Reiniciar el Servidor

Después de hacer cambios:

```bash
# Detener el servidor (Ctrl+C)
npm run dev
```

## Solución de Problemas

### La página tarda mucho en cargar
- **Causa**: Firestore no tiene reglas configuradas
- **Solución**: Configura las reglas de seguridad (paso 1)

### Error: "Missing or insufficient permissions"
- **Causa**: Las reglas de Firestore son muy restrictivas
- **Solución**: Verifica que las reglas permitan acceso con autenticación

### Error: "Network error"  
- **Causa**: Firestore no está creado en el proyecto
- **Solución**: Crea la base de datos Firestore (paso 3)

### La autenticación no funciona
- **Causa**: Email/Password no está habilitado
- **Solución**: Habilita el método de autenticación (paso 2)

## Optimizaciones de Rendimiento

Para mejorar la velocidad de carga:

1. **Índices de Firestore**: Firebase creará índices automáticamente cuando sea necesario
2. **Caché del navegador**: Los datos se cachean localmente después de la primera carga
3. **Lazy Loading**: Los componentes se cargan solo cuando son necesarios

## Acceso a la Aplicación

Una vez configurado todo:
- URL: http://localhost:5173/
- Crea tu primera cuenta desde la página de registro
- Las citas solo son visibles para el usuario que las creó
