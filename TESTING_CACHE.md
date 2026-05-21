# 🧪 Comandos de Testing - Problema de Caché

Este archivo contiene comandos útiles para probar y verificar que las soluciones de caché funcionan correctamente.

## 📦 Comandos de Build

### Build normal
```bash
npm run build
```

### Build con análisis de tamaño
```bash
npm run build -- --mode production
```

### Preview local del build
```bash
npm run build
npm run preview
```

## 🚀 Comandos de Despliegue

### Despliegue completo (build + deploy)
```bash
npm run deploy
```

### Solo deploy (sin build)
```bash
firebase deploy --only hosting
```

### Deploy con específico de proyecto
```bash
firebase deploy --only hosting --project tu-proyecto-id
```

## 🧹 Comandos de Limpieza

### Limpiar node_modules y reinstalar
```bash
rm -rf node_modules package-lock.json
npm install
```

### Limpiar dist y rebuildar
```bash
rm -rf dist
npm run build
```

### Limpiar cache de Vite
```bash
rm -rf node_modules/.vite
npm run dev
```

### Limpiar todo
```bash
rm -rf node_modules dist node_modules/.vite .firebase
npm install
npm run build
```

## 🔍 Testing de Caché

### 1. Test local con servidor HTTP simple
```bash
# Construir
npm run build

# Servir con Python (si está instalado)
cd dist
python -m http.server 8000

# O con Node http-server (instalar globalmente)
npx http-server dist -p 8000
```

### 2. Verificar headers de caché
```bash
# Con curl
curl -I http://localhost:8000/index.html

# Deberías ver:
# Cache-Control: no-cache, no-store, must-revalidate
```

### 3. Test de versiones diferentes

#### Terminal 1:
```bash
# Build inicial
npm run build
npm run preview
```

#### Terminal 2 (después de abrir la app):
```bash
# Hacer un cambio (ej: cambiar un texto en App.tsx)
# Build nuevo
npm run build
# El preview se actualiza automáticamente
```

#### En el navegador:
- Espera 5 minutos o cambia de pestaña y vuelve
- Deberías ver un toast "Nueva versión disponible"
- La app se recarga automáticamente

## 📊 Verificación en DevTools

### Chrome DevTools
```
1. Presiona F12
2. Ve a Network
3. Marca "Disable cache"
4. Recarga (Ctrl+R)
5. Verifica que:
   - index.html viene del servidor (no de cache)
   - Los archivos .js tienen hashes únicos
```

### Verificar Service Workers
```
1. F12 > Application > Service Workers
2. No debería haber service workers activos
3. Si hay, hacer "Unregister"
```

## 🎯 Checklist de Verificación

Después de cada despliegue, verifica:

- [ ] Los archivos JS tienen hashes nuevos y únicos
- [ ] El index.html NO tiene hash (siempre index.html)
- [ ] La versión en package.json se incrementó
- [ ] Los headers de caché están configurados en Firebase
- [ ] La app detecta nuevas versiones automáticamente

## 🐛 Debugging

### Si la app sigue mostrando versión vieja:

1. **Hard Reload en el navegador**
   - Chrome/Edge: `Ctrl + Shift + R` o `Ctrl + F5`
   - Firefox: `Ctrl + Shift + R`
   - Safari: `Cmd + Option + R`

2. **Limpiar caché del navegador**
   - Chrome: `Ctrl + Shift + Delete` > Seleccionar "Cached images and files"
   - O abrir en modo incógnito

3. **Verificar que el build se desplegó**
   ```bash
   # Ver archivos en Firebase
   firebase hosting:channel:list
   
   # Ver logs
   firebase hosting:sites:list
   ```

4. **Verificar el código en producción**
   ```
   1. Abre DevTools (F12)
   2. Sources > Ver archivos JS
   3. Busca un cambio reciente que hiciste
   4. Si no está, el despliegue no se completó
   ```

5. **Verificar headers en producción**
   ```bash
   curl -I https://tu-dominio.com/index.html
   ```

## 💡 Tips

- **Siempre haz build antes de deploy**: `npm run deploy` ya lo hace automáticamente
- **Versiona tus releases**: Incrementa la versión en package.json con cada despliegue importante
- **Comunica las actualizaciones**: Avisa a tus usuarios cuando hagas cambios importantes
- **Monitorea errores**: Usa Firebase Analytics o Sentry para detectar problemas

## 🔗 Enlaces Útiles

- [Vite Build Options](https://vitejs.dev/config/build-options.html)
- [Firebase Hosting Cache Control](https://firebase.google.com/docs/hosting/full-config#headers)
- [MDN - Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)

---

**Última actualización**: $(date)
