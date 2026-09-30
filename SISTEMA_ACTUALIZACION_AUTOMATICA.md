# 🔄 Sistema de Actualización Automática

## Descripción
Sistema robusto para detectar y aplicar automáticamente nuevas versiones de la aplicación, eliminando problemas de caché del navegador.

## ✨ Características

### 1. **Detección Automática de Versiones**
- ✅ Verifica cada **2 minutos** si hay una nueva versión
- ✅ Verifica cuando el usuario vuelve a la pestaña
- ✅ Verifica cuando se restablece la conexión a internet
- ✅ Verifica cuando la página se vuelve visible

### 2. **Múltiples Métodos de Verificación**
- **Primario**: Archivo `version.json` generado en cada build
- **Secundario**: Análisis de hashes en `index.html`
- **Fallback**: Detección de cambios en archivos JavaScript

### 3. **Recarga Inteligente**
- 🗑️ Limpia automáticamente todo el caché del navegador
- 🔄 Recarga la página forzando descarga desde el servidor
- ⚡ Recarga en **2 segundos** después de detectar cambios
- 📢 Muestra notificación al usuario antes de recargar

## 🚀 Cómo Funciona

### Durante el Build:
1. Vite compila la aplicación con hashes únicos en archivos
2. Script `generate-version.cjs` crea `version.json` con timestamp único
3. Firebase Hosting sirve los archivos con headers de caché apropiados

### En Runtime:
1. La app carga con la versión actual
2. Hook `useVersionCheck` verifica periódicamente `version.json`
3. Si detecta cambio de versión → Limpia caché → Recarga página
4. Usuario obtiene automáticamente la última versión

## 📦 Archivos Involucrados

### Nuevos Archivos:
- `generate-version.cjs` - Script que genera version.json
- `generate-version.mjs` - Versión ES Module del script
- `dist/version.json` - Archivo de versión (generado automáticamente)

### Archivos Modificados:
- `src/hooks/useVersionCheck.ts` - Hook mejorado
- `package.json` - Script de build actualizado
- `firebase.json` - Headers de caché optimizados
- `vite.config.ts` - Configuración de hashes (ya existía)

## 🔧 Configuración

### Headers de Caché en Firebase:
```json
{
  "/index.html": "no-cache, no-store, must-revalidate",
  "/version.json": "no-cache, no-store, must-revalidate",
  "**/*.js|css": "public, max-age=31536000, immutable"
}
```

### Intervalos de Verificación:
- **Verificación periódica**: Cada 2 minutos
- **Verificación al enfocar**: Inmediata
- **Primera verificación**: 5 segundos después de cargar

## 🎯 Comandos

### Desarrollo:
```bash
npm run dev
```

### Build con versionado:
```bash
npm run build
```

### Deploy completo:
```bash
npm run deploy
# Incluye: build + generate-version + firebase deploy
```

### Deploy completo (Hosting + Firestore):
```bash
npm run deploy:full
```

## 🔍 Verificación Manual

### Ver versión actual en consola:
```javascript
// Abre DevTools (F12) y ejecuta:
localStorage.getItem('app_current_version')
```

### Forzar verificación:
```javascript
// En la consola del navegador:
window.location.reload()
// O presiona Ctrl+Shift+R (recarga forzada)
```

### Ver archivo de versión:
```
https://tu-dominio.web.app/version.json
```

## 📊 Flujo de Actualización

```
┌─────────────────────────────────────┐
│  Usuario tiene versión v1.0         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Desarrollador hace deploy v2.0     │
│  - npm run build                    │
│  - generate-version.cjs crea        │
│    version.json con timestamp       │
│  - firebase deploy                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  useVersionCheck verifica (2 min)   │
│  - Fetch /version.json?t=timestamp  │
│  - Compara versiones                │
└──────────────┬──────────────────────┘
               │
               ▼ (Versión diferente)
┌─────────────────────────────────────┐
│  Sistema de actualización:          │
│  1. Muestra notificación            │
│  2. Limpia caché del navegador      │
│  3. Espera 2 segundos               │
│  4. Recarga página                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Usuario obtiene versión v2.0       │
│  ✅ Sin necesidad de Ctrl+F5        │
└─────────────────────────────────────┘
```

## 🐛 Solución de Problemas

### La página no se actualiza automáticamente:
1. Verifica que `version.json` existe en `/dist/`
2. Revisa la consola del navegador por errores
3. Verifica los headers de Firebase: `firebase deploy --only hosting`
4. Limpia manualmente: Ctrl+Shift+R o DevTools → Application → Clear storage

### El build falla:
```bash
# Verifica que el script existe
ls generate-version.cjs

# Verifica permisos (Linux/Mac)
chmod +x generate-version.cjs
```

### Version.json no se genera:
```bash
# Ejecuta manualmente después del build
npm run build
node generate-version.cjs
```

### Usuarios reportan versión antigua:
1. Verifica el deploy: `firebase hosting:channel:list`
2. Limpia CDN de Firebase (puede tardar minutos)
3. Pide al usuario limpiar caché: Ctrl+Shift+R

## 📈 Mejores Prácticas

### ✅ Hacer:
- Deploy frecuente durante desarrollo activo
- Probar en diferentes navegadores
- Verificar que version.json se genera correctamente
- Monitorear la consola por errores de versión

### ❌ Evitar:
- Cambiar los intervalos de verificación a menos de 1 minuto
- Modificar los headers de caché sin entender el impacto
- Desactivar la limpieza de caché
- Hacer deploy sin ejecutar build completo

## 🔐 Seguridad

- ✅ `version.json` solo contiene timestamp público
- ✅ No expone información sensible
- ✅ No afecta autenticación o datos del usuario
- ✅ Limpieza de caché es segura (solo archivos estáticos)

## 📝 Notas Adicionales

### Compatibilidad:
- ✅ Todos los navegadores modernos
- ✅ Chrome, Firefox, Safari, Edge
- ✅ Móviles (iOS/Android)
- ⚠️ IE11 no soportado (API de Caché)

### Performance:
- **Impacto mínimo**: Verificación es ~1KB cada 2 minutos
- **Sin bloqueo**: No afecta la carga inicial
- **Eficiente**: Solo recarga cuando hay cambios reales

### Eventos Monitoreados:
1. `focus` - Cuando el usuario vuelve a la pestaña
2. `online` - Cuando se restablece internet
3. `visibilitychange` - Cuando la página es visible
4. `interval` - Cada 2 minutos

---

## 🎉 Resultado

Con este sistema, tus usuarios **SIEMPRE** tendrán la última versión de tu aplicación sin necesidad de:
- ❌ Limpiar caché manualmente
- ❌ Usar Ctrl+F5
- ❌ Cerrar y reabrir el navegador
- ❌ Desinstalar/reinstalar la app

**Todo es automático y transparente** ✨

---

**Última actualización**: 3 de junio de 2026  
**Versión del sistema**: 2.0.0
