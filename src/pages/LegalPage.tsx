import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
import { LEGAL_DOCUMENTS, LEGAL_OPERATOR } from '../legal/documents';
import { LegalFooter } from '../components/layout/LegalFooter';

export const LegalPage = () => {
  const { pathname } = useLocation();
  const document = pathname.endsWith('/privacidad')
    ? LEGAL_DOCUMENTS.privacy
    : LEGAL_DOCUMENTS.terms;

  return (
    <main className="min-h-screen bg-warm-50 px-4 py-8 dark:bg-warm-900">
      <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm dark:bg-warm-800 sm:p-10">
        <Link
          to="/register"
          className="mb-6 inline-flex items-center gap-2 text-sm text-primary-700 hover:underline dark:text-primary-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
          Stetik · Versión {document.version}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-warm-900 dark:text-white">
          {document.title}
        </h1>

        <div className="mt-6 rounded-2xl border border-blue-300 bg-blue-50 p-4 text-blue-950 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-100">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Documento informativo; requiere revisión jurídica</p>
              <p className="mt-1 text-sm">
                Responsable: {LEGAL_OPERATOR.name} ({LEGAL_OPERATOR.identification}); domicilio:
                {' '}{LEGAL_OPERATOR.address}; correo: {LEGAL_OPERATOR.privacyEmail}. Confirma que
                los datos sean correctos y que el domicilio sea apropiado para publicación. Solicita
                revisión jurídica colombiana antes de tratar estos textos como definitivos.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-7">
          {document.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold text-warm-900 dark:text-white">
                {section.title}
              </h2>
              <div className="mt-2 space-y-3 text-sm leading-7 text-warm-700 dark:text-warm-200">
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>

        <LegalFooter />
      </article>
    </main>
  );
};
