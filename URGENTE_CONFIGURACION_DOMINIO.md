# 🔴 URGENTE: Configura esto en Firebase Console AHORA

## Problema actual:
El usuario se autentica en Google desde el celular, pero al regresar a la app se queda en el login sin entrar.

## Causa probable:
Tu dominio de Hostinger NO está autorizado en Firebase Console.

---

## ✅ SOLUCIÓN - Sigue estos pasos EXACTAMENTE:

### 1. Abre Firebase Console
Ve a: https://console.firebase.google.com/project/eve-da15f

### 2. Ve a Authentication
Click en "Authentication" en el menú lateral

### 3. Ve a Settings
Click en la pestaña "Settings" (arriba)

### 4. Busca "Authorized domains"
Desplázate hasta ver la sección "Authorized domains"

### 5. Agrega tu dominio de Hostinger
Click en el botón "Add domain" y agrega:

**IMPORTANTE: Reemplaza con TU dominio real:**

```
tuapp.hostinger.com
```

O si tienes dominio propio:
```
tudominio.com
www.tudominio.com
```

### 6. Verifica que tengas TODOS estos dominios:

- ✅ localhost (ya debería estar)
- ✅ eve-da15f.firebaseapp.com (ya debería estar)
- ✅ **TU DOMINIO DE HOSTINGER** ← ESTE ES CRÍTICO

---

## 🔍 Cómo saber cuál es tu dominio:

1. Abre tu app en Hostinger
2. Mira la URL en el navegador
3. Ese es el dominio que debes agregar (sin http:// ni https://)

Ejemplos:
- `eve.hostinger.com` ← Agrega esto
- `miapp.com` ← Agrega esto
- `www.miapp.com` ← Agrega esto también

---

## ⚠️ DESPUÉS de agregar el dominio:

1. Guarda los cambios en Firebase
2. Espera 5 minutos (propagación)
3. Prueba de nuevo en el celular
4. Abre la consola del navegador móvil para ver los logs

---

## 📱 Cómo ver logs en móvil:

### Android Chrome:
1. Conecta el celular por USB a tu PC
2. En Chrome PC abre: `chrome://inspect`
3. Selecciona tu dispositivo
4. Abre tu app en el celular
5. Verás los logs en la PC

### iPhone Safari:
1. Conecta el iPhone a una Mac
2. Abre Safari en Mac
3. Ve a Develop → [Tu iPhone] → [Tu sitio]
4. Verás la consola

---

## 🐛 Qué buscar en los logs:

Deberías ver estos mensajes después de regresar de Google:

```
[AuthProvider] ✅ Redirect result found! User: tu@email.com
[AuthProvider] Auth state changed. User: tu@email.com
[Login] User detected, redirecting to dashboard: tu@email.com
```

Si ves:
```
❌ Redirect result error: auth/unauthorized-domain
```

**Entonces el dominio NO está autorizado en Firebase.**

---

## 💡 Si aún no funciona:

Mándame:
1. La URL exacta de tu app en Hostinger
2. Una captura de pantalla de "Authorized domains" en Firebase
3. Los logs de la consola del navegador móvil
