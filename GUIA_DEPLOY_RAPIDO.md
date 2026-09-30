# 🚀 Guía Rápida - Deploy con Auto-actualización

## ⚡ Deploy Rápido (Lo más común)

```bash
# Compilar y desplegar (incluye generación de version.json)
npm run deploy
```

Este comando hace:
1. ✅ Compila TypeScript
2. ✅ Build de Vite con hashes únicos
3. ✅ Genera `version.json` automáticamente
4. ✅ Despliega a Firebase Hosting

## 🔍 Verificar el Deploy

### 1. Verificar que el build se completó:
```bash
# Debería ver:
✅ version.json generado exitosamente
📦 Versión: [timestamp]-[hash]
```

### 2. Verificar que el archivo existe localmente:
```bash
# Windows PowerShell:
Get-Content dist/version.json

# Linux/Mac:
cat dist/version.json
```

Debería ver algo como:
```json
{
  "version": "1717459200000-abc123",
  "buildDate": "2026-06-03T10:30:00.000Z",
  "timestamp": 1717459200000
}
```

### 3. Verificar en producción (después del deploy):
```bash
# Abre en tu navegador:
https://tu-app.web.app/version.json

# O desde terminal:
curl https://tu-app.web.app/version.json
```

## 🧪 Probar la Auto-actualización

### Prueba Completa:
1. **Deploy inicial**:
   ```bash
   npm run deploy
   ```

2. **Abre la app en el navegador**:
   - Presiona F12 para abrir DevTools
   - Ve a la pestaña "Console"
   - Deberías ver: `📦 Versión actual: [tu-version]`

3. **Haz un cambio pequeño** (ej: cambiar un texto):
   ```typescript
   // En algún archivo .tsx
   <h1>Mi App v2</h1>
   ```

4. **Deploy de nuevo**:
   ```bash
   npm run deploy
   ```

5. **Observa en el navegador original**:
   - En máximo 2 minutos verás: `🆕 Nueva versión detectada!`
   - Notificación: "Nueva versión disponible - Actualizando..."
   - La página se recargará automáticamente
   - Verás tus cambios sin hacer Ctrl+F5

## ⏱️ Tiempos de Verificación

| Evento | Tiempo |
|--------|--------|
| Primera verificación | 5 segundos después de cargar |
| Verificación periódica | Cada 2 minutos |
| Al enfocar la pestaña | Inmediato |
| Al restaurar internet | Inmediato |
| Recarga después de detectar | 2 segundos |

## 🎯 Comandos Disponibles

```bash
# Solo build (sin deploy)
npm run build

# Build + Deploy de Hosting
npm run deploy

# Build + Deploy completo (Hosting + Firestore rules)
npm run deploy:full

# Desarrollo local
npm run dev

# Preview del build
npm run preview
```

## 🔧 Forzar Actualización Inmediata

Si necesitas que un usuario específico actualice inmediatamente:

### Opción 1: Limpiar caché desde DevTools
1. F12 → Application
2. Clear storage
3. Clear site data
4. Recargar

### Opción 2: Recarga forzada
```bash
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

### Opción 3: Desde la consola
```javascript
// En DevTools Console:
localStorage.clear();
caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
location.reload();
```

## 📊 Monitoreo

### Ver logs en producción:
```javascript
// En DevTools Console de la app en producción:

// Ver versión actual
localStorage.getItem('app_current_version');

// Ver último hash de script
localStorage.getItem('app_script_hash');

// Los logs de verificación aparecen automáticamente:
// 🔍 Iniciando verificación de versión...
// 📦 Versión actual: ...
// 🆕 Nueva versión detectada! (cuando hay cambios)
```

## ⚠️ Troubleshooting

### El version.json no se genera:
```bash
# Ejecutar manualmente
node generate-version.cjs

# Verificar que existe
ls dist/version.json
```

### La app no detecta cambios:
1. Verificar en producción: `https://tu-app.web.app/version.json`
2. Verificar que el timestamp cambió
3. Esperar 2 minutos o recargar manualmente
4. Revisar Console por errores

### Error al ejecutar el script:
```bash
# Si falla con permisos (Linux/Mac):
chmod +x generate-version.cjs

# Si Node.js no está instalado:
node --version  # Debería mostrar v18+
```

## 📱 Probar en Móvil

1. Deploy la app: `npm run deploy`
2. Abre en móvil: `https://tu-app.web.app`
3. Deja la pestaña abierta en segundo plano
4. Haz cambios y redeploy
5. Vuelve a la pestaña del móvil
6. Debería detectar y recargar automáticamente

## ✅ Checklist Pre-Deploy

- [ ] Todos los cambios están guardados
- [ ] `npm run build` funciona sin errores
- [ ] `version.json` se genera en `dist/`
- [ ] Firebase está configurado
- [ ] Tienes permisos de deploy
- [ ] Has probado localmente: `npm run preview`

## 🎉 ¡Listo!

Ahora cada vez que hagas:
```bash
npm run deploy
```

Tus usuarios obtendrán la actualización automáticamente en máximo 2 minutos sin hacer nada. 🚀

---

**Tip Pro**: Durante desarrollo activo, puedes reducir el intervalo de verificación editando `VERSION_CHECK_INTERVAL` en `useVersionCheck.ts`, pero recuerda aumentarlo de nuevo antes del deploy final para no sobrecargar el servidor.
