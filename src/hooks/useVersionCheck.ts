import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Hook para detectar nuevas versiones de la aplicación
 * Verifica periódicamente si hay cambios en el index.html
 * Si detecta cambios, recarga la página automáticamente
 */
export const useVersionCheck = () => {
  useEffect(() => {
    // Guardar el hash inicial del HTML
    let initialHash = '';
    let updateToastId: string | number | undefined;

    const reloadPage = async () => {
      // Limpiar el cache del navegador
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        } catch (error) {
          console.error('Error limpiando cache:', error);
        }
      }

      // Recargar la página sin usar caché
      window.location.reload();
    };

    const checkVersion = async () => {
      try {
        // Hacer fetch del index.html con cache busting
        const response = await fetch(`/index.html?t=${Date.now()}`, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        const html = await response.text();
        
        // Generar un hash simple del contenido
        const currentHash = btoa(html).substring(0, 50);

        if (!initialHash) {
          initialHash = currentHash;
          return;
        }

        // Si el hash cambió, hay una nueva versión
        if (currentHash !== initialHash) {
          console.log('🔄 Nueva versión detectada');
          
          // Mostrar notificación con opción de recargar
          updateToastId = toast.info('Nueva versión disponible', {
            description: 'Se recargará automáticamente en 5 segundos',
            duration: 5000,
            action: {
              label: 'Recargar ahora',
              onClick: () => {
                reloadPage();
              }
            }
          });

          // Recargar automáticamente después de 5 segundos
          setTimeout(() => {
            reloadPage();
          }, 5000);
        }
      } catch (error) {
        console.error('Error verificando versión:', error);
      }
    };

    // Verificar versión cada 5 minutos
    const interval = setInterval(checkVersion, 5 * 60 * 1000);

    // Verificar también cuando la ventana recupera el foco
    const handleFocus = () => {
      checkVersion();
    };

    window.addEventListener('focus', handleFocus);

    // Verificar al montar (después de 10 segundos para no interferir con la carga inicial)
    const initialCheckTimeout = setTimeout(() => {
      checkVersion();
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialCheckTimeout);
      window.removeEventListener('focus', handleFocus);
      if (updateToastId) {
        toast.dismiss(updateToastId);
      }
    };
  }, []);
};
