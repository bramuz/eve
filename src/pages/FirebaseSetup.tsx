import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';

export const FirebaseSetup = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <Card className="max-w-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Firebase no configurado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Para usar la aplicación Eve, necesitas configurar Firebase
          </p>
        </div>

        <Alert variant="warning" className="mb-6">
          Las variables de entorno de Firebase no están configuradas. Sigue los pasos a continuación para configurar tu proyecto.
        </Alert>

        <div className="space-y-4 text-left">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Paso 1: Crear un proyecto en Firebase
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>
                Ve a{' '}
                <a
                  href="https://console.firebase.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline inline-flex items-center gap-1"
                >
                  Firebase Console
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Crea un nuevo proyecto</li>
              <li>Habilita Authentication (Email/Password y Google)</li>
              <li>Crea una base de datos Firestore</li>
              <li>Agrega una aplicación web y copia las credenciales</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Paso 2: Configurar variables de entorno
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Edita el archivo <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">.env</code> en la raíz del proyecto:
            </p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Paso 3: Reiniciar el servidor
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Después de configurar las variables, reinicia el servidor de desarrollo:
            </p>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm mt-2">
              npm run dev
            </pre>
          </div>

          <Alert variant="info">
            <strong>Nota:</strong> Puedes encontrar instrucciones detalladas en el archivo{' '}
            <code className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">README_EVE.md</code>
          </Alert>
        </div>
      </Card>
    </div>
  );
};
