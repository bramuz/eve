import { Link } from 'react-router-dom';

export const LegalFooter = () => (
  <footer className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
    <Link className="underline hover:text-primary-600" to="/legal/terminos">
      Términos y condiciones
    </Link>
    <Link className="underline hover:text-primary-600" to="/legal/privacidad">
      Política de privacidad
    </Link>
  </footer>
);
