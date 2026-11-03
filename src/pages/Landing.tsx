import { Link, Navigate } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  Check,
  CreditCard,
  Link2,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Users,
  Wallet
} from 'lucide-react';
import {
  FREE_CLIENT_LIMIT,
  PREMIUM_PRICE_LABEL,
  SEMIANNUAL_MONTHLY_LABEL,
  SEMIANNUAL_SAVINGS_LABEL,
  SEMIANNUAL_TOTAL_LABEL
} from '../config/plans';
import { SUPPORT_EMAIL } from '../config/support';
import { LegalFooter } from '../components/layout/LegalFooter';
import { useAuth } from '../context/AuthContext';
import { OpenInBrowserBanner } from '../components/auth/OpenInBrowserBanner';

const FEATURES = [
  {
    icon: Link2,
    title: 'Tus clientes reservan solos',
    text: 'Compartes tu link por WhatsApp o Instagram y te agendan en los horarios que tú tienes libres.'
  },
  {
    icon: MessageCircle,
    title: 'Avisos por WhatsApp',
    text: 'A tu cliente le llega la confirmación y un recordatorio el día antes. Menos citas perdidas.'
  },
  {
    icon: CalendarDays,
    title: 'Agenda clara',
    text: 'Ves tu semana o tu mes de un vistazo y bloqueas los días que no trabajas.'
  },
  {
    icon: Wallet,
    title: 'Cobros y deudas',
    text: 'Registras servicios, abonos y descuentos. Sabes cuánto ganaste y quién te debe.'
  },
  {
    icon: Users,
    title: 'Historial de cada cliente',
    text: 'Datos, servicios, notas, fotos de antes y después y consentimientos en un solo lugar.'
  },
  {
    icon: Bell,
    title: 'Desde tu celular',
    text: 'Funciona en el navegador del celular o el computador. No tienes que instalar nada.'
  }
];

const STEPS = [
  { title: 'Crea tu cuenta gratis', text: 'Con tu correo, en menos de un minuto.' },
  { title: 'Configura tus horarios', text: 'Dinos qué días y horas atiendes.' },
  { title: 'Comparte tu link', text: 'Tus clientes eligen su hora y tú recibes el aviso.' }
];

const TRUST = [
  { icon: MapPin, title: 'Hecho en Colombia', text: 'Precios en pesos y soporte en español.' },
  { icon: CreditCard, title: 'Pagos con Mercado Pago', text: 'Nunca vemos ni guardamos los datos de tu tarjeta.' },
  { icon: ShieldCheck, title: 'Tus datos protegidos', text: 'Tratamos tus datos según la Ley 1581 de Colombia.' },
  { icon: Lock, title: 'Cancelas cuando quieras', text: 'Sin permanencia. Y puedes borrar tu cuenta desde la app.' }
];

const FAQ = [
  {
    q: '¿Tengo que pagar para empezar?',
    a: `No. El plan gratis no pide tarjeta y te deja manejar hasta ${FREE_CLIENT_LIMIT} clientes. Pasas a Premium solo si lo necesitas.`
  },
  {
    q: '¿Mis clientes tienen que descargar algo?',
    a: 'No. Abren tu link desde WhatsApp o Instagram, eligen el servicio y la hora, y listo.'
  },
  {
    q: '¿Desde qué número llegan los WhatsApp?',
    a: 'Desde el número oficial de Stetik, con el nombre de tu negocio en el mensaje. Solo se envían a clientes que aceptan recibirlos.'
  },
  {
    q: '¿Cómo cancelo Premium?',
    a: 'En la app, en Planes > Cancelar renovación. No se hacen más cobros y conservas Premium hasta el final del periodo pagado.'
  }
];

const PrimaryCta = ({ className = '' }: { className?: string }) => (
  <Link
    to="/register"
    className={`inline-flex items-center justify-center rounded-2xl bg-primary-600 px-6 py-3.5 text-base font-semibold text-white shadow-glow transition-colors hover:bg-primary-700 ${className}`}
  >
    Crear mi cuenta gratis
  </Link>
);

const WhatsAppPreview = () => (
  <div className="mx-auto w-full max-w-sm rounded-[2rem] border-8 border-warm-900 bg-[#efe7de] p-4 shadow-float dark:border-warm-700">
    <div className="mb-4 flex items-center gap-3 rounded-xl bg-white/80 p-2.5">
      <img src="/favicon.svg" alt="" className="h-9 w-9 rounded-lg" />
      <div className="text-left">
        <p className="text-sm font-semibold text-warm-900">Stetik</p>
        <p className="text-xs text-warm-500">Cuenta de empresa</p>
      </div>
    </div>
    <div className="space-y-3 text-left text-sm text-warm-900">
      <div className="max-w-[90%] rounded-xl rounded-tl-none bg-white p-3 shadow-sm">
        Hola Laura, tu cita con <strong>Nails by Caro</strong> quedó confirmada para el jueves, 12 de
        noviembre a las 3:00 PM. Servicio: Manicure semipermanente. Si necesitas cambiarla,
        comunícate con tu profesional.
        <p className="mt-1 text-right text-[10px] text-warm-400">10:24 a. m.</p>
      </div>
      <div className="max-w-[90%] rounded-xl rounded-tl-none bg-white p-3 shadow-sm">
        Hola Laura, te recordamos tu cita con <strong>Nails by Caro</strong> para el jueves, 12 de
        noviembre a las 3:00 PM. ¿Confirmas tu asistencia?
        <div className="mt-2 grid grid-cols-2 gap-2 border-t border-warm-100 pt-2 text-center text-xs font-semibold text-sky-600">
          <span>Confirmo</span>
          <span>No puedo asistir</span>
        </div>
      </div>
    </div>
  </div>
);

export const Landing = () => {
  // No espera a Firebase: la página se ve al instante y, si hay sesión, va al panel.
  const { currentUser } = useAuth();
  if (currentUser) return <Navigate to="/dashboard" replace />;

  return (
  <div className="min-h-screen bg-warm-50 text-left text-warm-900 dark:bg-warm-900 dark:text-white">
    <header className="sticky top-0 z-10 border-b border-warm-200/70 bg-warm-50/90 backdrop-blur dark:border-warm-800 dark:bg-warm-900/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="h-8 w-8" />
          <span className="font-display text-xl font-bold">Stetik</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-xl px-3 py-2 text-sm font-medium text-warm-700 hover:bg-warm-100 dark:text-warm-200 dark:hover:bg-warm-800"
          >
            Entrar
          </Link>
          <Link
            to="/register"
            className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Empezar gratis
          </Link>
        </div>
      </div>
    </header>

    <main>
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <OpenInBrowserBanner />
      </div>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
        <div className="text-center md:text-left">
          <p className="mb-3 inline-block rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
            Para profesionales de la belleza y el bienestar
          </p>
          <h1 className="m-0 text-warm-900 dark:text-white font-display text-4xl font-bold leading-tight sm:text-5xl">
            Tu agenda se llena sola y tus clientes no se olvidan de la cita
          </h1>
          <p className="mt-4 text-lg text-warm-600 dark:text-warm-300">
            Stetik organiza tus citas, clientes y cobros. Tus clientes reservan con tu link y reciben
            la confirmación y el recordatorio por WhatsApp.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row md:justify-start">
            <PrimaryCta className="w-full sm:w-auto" />
            <Link
              to="/login"
              className="text-sm font-medium text-warm-600 underline-offset-4 hover:underline dark:text-warm-300"
            >
              Ya tengo cuenta
            </Link>
          </div>
          <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-warm-600 dark:text-warm-300 md:justify-start">
            {['Gratis para empezar', 'Sin tarjeta', 'Sin instalar nada'].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-primary-600" /> {item}
              </li>
            ))}
          </ul>
        </div>
        <WhatsAppPreview />
      </section>

      {/* Funciones */}
      <section className="bg-white py-14 dark:bg-warm-800/50">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="m-0 text-center text-warm-900 dark:text-white font-display text-3xl font-bold">Todo tu negocio en un solo lugar</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-warm-600 dark:text-warm-300">
            Deja el cuaderno y los mensajes sueltos. Así trabajas con Stetik:
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-warm-200 p-5 dark:border-warm-700">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-warm-600 dark:text-warm-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="m-0 text-center text-warm-900 dark:text-white font-display text-3xl font-bold">Empiezas en 3 pasos</h2>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-2xl bg-white p-5 shadow-soft dark:bg-warm-800">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-warm-600 dark:text-warm-300">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Precios */}
      <section id="precios" className="bg-white py-14 dark:bg-warm-800/50">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="m-0 text-center text-warm-900 dark:text-white font-display text-3xl font-bold">Precios claros, sin sorpresas</h2>
          <p className="mt-3 text-center text-warm-600 dark:text-warm-300">
            Empieza gratis. Pasa a Premium cuando tu agenda crezca.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="flex flex-col rounded-2xl border border-warm-200 p-6 dark:border-warm-700">
              <h3 className="text-lg font-semibold">Gratis</h3>
              <p className="mt-2 text-3xl font-bold">$0</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-warm-700 dark:text-warm-300">
                <li className="flex gap-2"><Check className="h-4 w-4 flex-shrink-0 text-primary-600" />Hasta {FREE_CLIENT_LIMIT} clientes</li>
                <li className="flex gap-2"><Check className="h-4 w-4 flex-shrink-0 text-primary-600" />Agenda de los próximos 7 días</li>
                <li className="flex gap-2"><Check className="h-4 w-4 flex-shrink-0 text-primary-600" />Cobros, notas e historial</li>
              </ul>
            </div>
            <div className="flex flex-col rounded-2xl border-2 border-primary-500 p-6">
              <h3 className="text-lg font-semibold">Premium mensual</h3>
              <p className="mt-2 text-3xl font-bold text-primary-600">{PREMIUM_PRICE_LABEL}</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-warm-700 dark:text-warm-300">
                <li className="flex gap-2"><Check className="h-4 w-4 flex-shrink-0 text-primary-600" />Clientes ilimitados</li>
                <li className="flex gap-2"><Check className="h-4 w-4 flex-shrink-0 text-primary-600" />Link de reservas online</li>
                <li className="flex gap-2"><Check className="h-4 w-4 flex-shrink-0 text-primary-600" />Avisos y recordatorios por WhatsApp</li>
                <li className="flex gap-2"><Check className="h-4 w-4 flex-shrink-0 text-primary-600" />Agenda sin límite de semanas</li>
              </ul>
            </div>
            <div className="relative flex flex-col rounded-2xl border-2 border-primary-600 bg-primary-50 p-6 dark:bg-primary-900/20">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold text-white">
                Ahorras {SEMIANNUAL_SAVINGS_LABEL}
              </span>
              <h3 className="text-lg font-semibold">Premium 6 meses</h3>
              <p className="mt-2 text-3xl font-bold text-primary-600">{SEMIANNUAL_MONTHLY_LABEL}</p>
              <p className="mt-1 text-sm text-warm-600 dark:text-warm-300">
                Se cobra {SEMIANNUAL_TOTAL_LABEL} cada 6 meses
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-warm-700 dark:text-warm-300">
                <li className="flex gap-2"><Check className="h-4 w-4 flex-shrink-0 text-primary-600" />Todo lo de Premium mensual</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Confianza */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map(({ icon: Icon, title, text }) => (
            <div key={title} className="text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gold-300/40 text-warm-800 dark:text-gold-300">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-warm-600 dark:text-warm-300">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Preguntas */}
      <section className="bg-white py-14 dark:bg-warm-800/50">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="m-0 text-center text-warm-900 dark:text-white font-display text-3xl font-bold">Preguntas frecuentes</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group rounded-2xl border border-warm-200 p-4 dark:border-warm-700">
                <summary className="cursor-pointer list-none font-semibold marker:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {q}
                    <span className="text-primary-600 transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-2 text-sm text-warm-600 dark:text-warm-300">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Cierre */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="m-0 text-warm-900 dark:text-white font-display text-3xl font-bold">Prueba Stetik hoy, gratis</h2>
        <p className="mt-3 text-warm-600 dark:text-warm-300">
          En unos minutos tienes tu link de reservas listo para compartir.
        </p>
        <PrimaryCta className="mt-7" />
      </section>
    </main>

    <footer className="border-t border-warm-200 px-4 py-8 text-center text-sm text-warm-600 dark:border-warm-800 dark:text-warm-400">
      <p className="flex items-center justify-center gap-2">
        <Mail className="h-4 w-4" /> ¿Dudas? Escríbenos a{' '}
        <a className="font-medium text-primary-600 hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </a>
      </p>
      <LegalFooter />
      <p className="mt-4 text-xs">© {new Date().getFullYear()} Stetik · Bello, Antioquia, Colombia</p>
    </footer>
  </div>
);
};
