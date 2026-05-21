# ✅ Checklist de Configuración de Firebase para Google Sign-In

## IMPORTANTE: Verifica esto en Firebase Console

### 1. **Authorized Domains (Dominios Autorizados)**

Ve a Firebase Console → Authentication → Settings → Authorized domains

**Debes tener agregados:**
- ✅ `localhost` (para desarrollo)
- ✅ `tudominio.com` (tu dominio de Hostinger)
- ✅ `www.tudominio.com` (con www)
- ✅ `eve-da15f.firebaseapp.com` (tu authDomain de Firebase)

**Cómo agregar:**
1. Click en "Add domain"
2. Escribe tu dominio (ejemplo: `miapp.com`)
3. Click "Add"

---

### 2. **Google Sign-In habilitado**

Ve a Firebase Console → Authentication → Sign-in method

**Verifica:**
- ✅ Google debe estar **Enabled** (habilitado)
- ✅ Debe tener un email de soporte configurado

**Si no está habilitado:**
1. Click en "Google"
2. Toggle "Enable"
3. Selecciona un "Project support email"
4. Click "Save"

---

### 3. **OAuth Consent Screen (Google Cloud Console)**

Si el problema persiste, verifica la OAuth consent screen:

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona tu proyecto `eve-da15f`
3. Ve a "APIs & Services" → "OAuth consent screen"
4. Verifica que:
   - ✅ El estado sea "In production" o "Testing"
   - ✅ Los "Authorized domains" incluyan tu dominio
   - ✅ Tu email esté en "Test users" (si está en modo Testing)

---

### 4. **Verificar en el navegador móvil**

Para diagnosticar en móvil:

1. Abre tu app en el móvil
2. Abre las DevTools del navegador:
   - **Chrome Android**: `chrome://inspect` en tu PC
   - **Safari iOS**: Conecta el iPhone y usa Safari DevTools en Mac
3. Haz login con Google
4. Revisa la consola para errores

---

## 🐛 Errores comunes:

### Error: "unauthorized_client"
**Causa:** El dominio no está autorizado en Firebase
**Solución:** Agrega el dominio en Authorized Domains

### Error: "auth/popup-blocked"
**Causa:** Bloqueador de popups (solo desktop)
**Solución:** Normal, el redirect en móvil funciona bien

### Error: "auth/operation-not-allowed"
**Causa:** Google Sign-In no está habilitado
**Solución:** Habilita Google en Firebase Console

---

## 📱 Flujo correcto en móvil:

1. Usuario hace clic en "Continuar con Google"
2. La página completa redirige a `accounts.google.com`
3. Usuario selecciona su cuenta
4. Google redirige de vuelta a tu app
5. Firebase automáticamente detecta la autenticación
6. El usuario es redirigido al dashboard

**Si no funciona:** Revisa TODOS los puntos de arriba en Firebase Console.
