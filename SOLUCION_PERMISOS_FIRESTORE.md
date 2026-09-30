# 🔒 Solución: Actualizar Reglas de Firestore

## ⚠️ El Problema
El error indica que las reglas de Firestore en tu proyecto de Firebase Console no coinciden con el código local. La colección `clientConsents` no está reconocida en las reglas publicadas.

## ✅ Solución (Paso a Paso)

### Paso 1: Acceder a Firebase Console
1. Ve a: https://console.firebase.google.com/
2. Selecciona tu proyecto **EVE**

### Paso 2: Ir a Firestore Rules
1. En el menú izquierdo, haz clic en **Firestore Database**
2. Cliquea en la pestaña **Rules** (a la derecha, junto a "Data")

### Paso 3: Copiar las Nuevas Reglas
1. Abre el archivo: `FIRESTORE_RULES_ACTUALIZAR.txt` (está en la raíz del proyecto)
2. Copia TODO el contenido

### Paso 4: Pegar en Firebase
1. En Firebase Console, en la pestaña Rules:
   - Selecciona TODO el contenido actual (Ctrl+A)
   - Elimina el contenido
   - Pega el contenido del archivo `FIRESTORE_RULES_ACTUALIZAR.txt`

### Paso 5: Publicar
1. Cliquea el botón **"Publish"** (verde, arriba a la derecha)
2. Espera a que se actualice (2-5 segundos)
3. Deberías ver un mensaje de éxito: "Rules updated successfully"

### Paso 6: Probar
1. Vuelve a la app
2. Intenta guardar un consentimiento nuevamente
3. ¡Debe funcionar ahora! ✅

---

## 📋 Qué Hace la Regla Nueva

La regla para `clientConsents` permite:
- **Crear**: Solo si el `userId` en los datos coincide con tu UID autenticado
- **Leer**: Solo si el `userId` en el documento es tu UID
- **Actualizar/Eliminar**: Solo si eres el propietario

```firestore
match /clientConsents/{consentId} {
  allow read: if request.auth != null && request.auth.uid == resource.data.userId;
  allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
  allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
}
```

---

## 🆘 Si Sigue Sin Funcionar

1. **Verifica que estés autenticado**: 
   - Asegúrate de estar logueado en la app
   
2. **Revisa la consola del navegador**:
   - Abre DevTools (F12)
   - Ve a la pestaña "Console"
   - Busca mensajes de error

3. **Intenta incógnito**:
   - Abre la app en una pestaña incógnita
   - A veces el cache causa problemas

4. **Recarga la página**:
   - Presiona Ctrl+Shift+R (reload completo)
   - O vacía el cache

5. **Verifica que Firebase esté configurado correctamente**:
   - Ve a `src/firebase/config.ts`
   - Asegúrate de que los datos de Firebase sean correctos

---

## 📄 Reglas en el Proyecto

Las reglas están en:
- **Local**: `firestore.rules` (por si necesitas referencia)
- **Copia actualizada**: `FIRESTORE_RULES_ACTUALIZAR.txt`

**¡Una vez actualices las reglas en Firebase Console, todo debe funcionar! 🚀**
