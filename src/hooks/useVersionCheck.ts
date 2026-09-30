import { useEffect } from 'react';
import { toast } from 'sonner';

// Versión de build - se actualiza automáticamente en cada deploy
const BUILD_VERSION = '__BUILD_VERSION__';
const VERSION_CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutos
const INITIAL_CHECK_DELAY = 5000; // 5 segundos

/**
 * Hook para detectar nuevas versiones de la aplicación
 * Verifica periódicamente si hay una nueva versión desplegada
 * Si detecta cambios, recarga la página automáticamente
 */
export const useVersionCheck = () => {
  useEffect(() => {
    // No ejecutar el check de versión en modo desarrollo
    if (import.meta.env.DEV) {
      console.log('🔧 Modo desarrollo: check de versión deshabilitado');
      return;
    }

    let currentVersion = BUILD_VERSION;
    let isReloading = false;

    const reloadPage = async () => {
      if (isReloading) return;
      isReloading = true;

      console.log('🔄 Recargando aplicación con nueva versión...');

      // Limpiar el cache del navegador
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
          console.log('✅ Cache limpiado');
        } catch (error) {
          console.error('❌ Error limpiando cache:', error);
        }
      }

      // Limpiar localStorage de versión anterior
      try {
        localStorage.setItem('app_last_version', currentVersion);
      } catch (error) {
        console.error('Error guardando versión:', error);
      }

      // Recargar la página forzando descarga desde el servidor
      window.location.reload();
    };

    const checkVersion = async () => {
      if (isReloading) return;

      try {
        // Verificar usando version.json con cache busting
        const timestamp = Date.now();
        const response = await fetch(`/version.json?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        if (!response.ok) {
          // Si version.json no existe, usar método alternativo con index.html
          return checkVersionFallback();
        }

        const data = await response.json();
        const serverVersion = data.version;

        // Si es la primera verificación, guardar la versión
        if (currentVersion === '__BUILD_VERSION__') {
          currentVersion = serverVersion;
          localStorage.setItem('app_current_version', serverVersion);
          console.log('📦 Versión actual:', serverVersion);
          return;
        }

        // Comparar versiones
        if (serverVersion !== currentVersion) {
          console.log('🆕 Nueva versión detectada!');
          console.log('   Actual:', currentVersion);
          console.log('   Nueva:', serverVersion);

          // Mostrar notificación y recargar inmediatamente
          toast.success('Nueva versión disponible', {
            description: 'Actualizando aplicación...',
            duration: 2000
          });

          // Recargar después de 2 segundos
          setTimeout(() => {
            reloadPage();
          }, 2000);
        }
      } catch (error) {
        console.error('❌ Error verificando versión:', error);
        // Intentar método alternativo
        checkVersionFallback();
      }
    };

    const checkVersionFallback = async () => {
      try {
        // Método alternativo: verificar cambios en index.html
        const response = await fetch(`/index.html?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });

        const html = await response.text();
        
        // Extraer la versión de los scripts (buscar hash en los nombres de archivo)
        const scriptMatch = html.match(/assets\/index\.[a-zA-Z0-9]+\.js/);
        const newHash = scriptMatch ? scriptMatch[0] : '';

        const storedHash = localStorage.getItem('app_script_hash');

        if (!storedHash) {
          localStorage.setItem('app_script_hash', newHash);
          return;
        }

        if (newHash && newHash !== storedHash) {
          console.log('🆕 Cambio detectado en archivos');
          toast.success('Actualización disponible', {
            description: 'Recargando...',
            duration: 2000
          });
          
          setTimeout(() => {
            reloadPage();
          }, 2000);
        }
      } catch (error) {
        console.error('❌ Error en verificación alternativa:', error);
      }
    };

    // Verificar al recuperar el foco de la ventana
    const handleFocus = () => {
      console.log('👁️ Ventana enfocada, verificando actualizaciones...');
      checkVersion();
    };

    // Verificar cuando la conexión se restablece
    const handleOnline = () => {
      console.log('🌐 Conexión restablecida, verificando actualizaciones...');
      checkVersion();
    };

    // Verificar cuando la página se vuelve visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Página visible, verificando actualizaciones...');
        checkVersion();
      }
    };

    // Configurar listeners
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Verificar periódicamente
    const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

    // Primera verificación después del delay inicial
    const initialCheckTimeout = setTimeout(() => {
      console.log('🔍 Iniciando verificación de versión...');
      checkVersion();
    }, INITIAL_CHECK_DELAY);

    // Cleanup
    return () => {
      clearInterval(interval);
      clearTimeout(initialCheckTimeout);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};
