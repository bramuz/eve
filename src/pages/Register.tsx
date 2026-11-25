import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { LegalFooter } from '../components/layout/LegalFooter';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { recordLegalAcceptance, trackSignUp } from '../legal/acceptance';
import { trackCustomEvent, trackEvent } from '../analytics/metaPixel';
import { TRIAL_DAYS } from '../config/plans';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  acceptLegal: boolean;
}

const errorCode = (error: string) => error.match(/auth\/[a-z-]+/)?.[0] ?? 'desconocido';

// La cuenta ya existe cuando se guarda la aceptación: si la función tarda en arrancar o
// falla, se reintenta una vez y, si aún falla, el panel la vuelve a pedir. Nunca se pierde el registro.
const saveAcceptance = async (uid: string, method: 'email' | 'google') => {
  try {
    await recordLegalAcceptance(uid, method, true);
  } catch (firstError) {
    console.warn('[Register] Reintentando guardar la aceptación:', firstError);
    try {
      await recordLegalAcceptance(uid, method, true);
    } catch (secondError) {
      console.error('No se pudo registrar la aceptación legal:', secondError);
      trackCustomEvent('SignUpAcceptanceError');
    }
  }
};

const signUpErrorMessage = (error: string) => {
  if (error.includes('email-already-in-use')) return 'Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.';
  if (error.includes('invalid-email')) return 'El correo no es válido. Revísalo e inténtalo de nuevo.';
  if (error.includes('weak-password')) return 'La contraseña es muy débil. Usa al menos 6 caracteres.';
  if (error.includes('network-request-failed')) return 'No hay conexión. Revisa tu internet e inténtalo de nuevo.';
  return 'No pudimos crear la cuenta. Inténtalo de nuevo en unos minutos.';
};

export const Register = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, signInGoogle, currentUser } = useAuth();
  const [registrationFlow, setRegistrationFlow] = useState(false);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<RegisterForm>();

  const acceptedLegal = useWatch({ control, name: 'acceptLegal' });

  useEffect(() => trackCustomEvent('ViewRegister'), []);

  // Auto-redirect if user is already logged in
  useEffect(() => {
    if (currentUser && !registrationFlow) {
      console.log('[Register] User detected, redirecting to dashboard:', currentUser.email);
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate, registrationFlow]);

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError('');
    setRegistrationFlow(true);
    trackCustomEvent('SignUpStarted', { method: 'email' });

    await trackSignUp((async () => {
      const { user, error: signUpError } = await signUp(
        data.email,
        data.password,
        data.name
      );

      if (signUpError) {
        console.error('[Register] signUp error:', signUpError);
        setError(signUpErrorMessage(signUpError));
        trackCustomEvent('SignUpError', { method: 'email', code: errorCode(signUpError) });
      } else if (user) {
        trackEvent('CompleteRegistration', { method: 'email' });
        await saveAcceptance(user.uid, 'email');
        navigate('/dashboard');
      }
    })());
    setRegistrationFlow(false);
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    if (!acceptedLegal) {
      setError('Marca la casilla de mayoría de edad y aceptación de documentos para continuar.');
      return;
    }

    setLoading(true);
    setError('');
    setRegistrationFlow(true);
    trackCustomEvent('SignUpStarted', { method: 'google' });

    await trackSignUp((async () => {
      const result = await signInGoogle();

      if (result.error) {
        setError(result.error);
        trackCustomEvent('SignUpError', { method: 'google', code: errorCode(result.error) });
      } else if (result.user) {
        trackEvent('CompleteRegistration', { method: 'google' });
        await saveAcceptance(result.user.uid, 'google');
        navigate('/dashboard');
      }
    })());
    setRegistrationFlow(false);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Stetik
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {TRIAL_DAYS} días con todo Premium gratis. Sin tarjeta.
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Crear Cuenta
          </h2>

          {error && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Tu nombre completo"
              type="text"
              placeholder="¿Cómo te llamas?"
              icon={<User className="w-5 h-5" />}
              error={errors.name?.message}
              {...register('name', {
                required: 'El nombre es requerido',
                minLength: {
                  value: 3,
                  message: 'El nombre debe tener al menos 3 caracteres'
                }
              })}
            />

            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              icon={<Mail className="w-5 h-5" />}
              error={errors.email?.message}
              {...register('email', {
                required: 'El email es requerido',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido'
                }
              })}
            />

            <div>
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                icon={<Lock className="w-5 h-5" />}
                error={errors.password?.message}
                {...register('password', {
                  required: 'La contraseña es requerida',
                  minLength: {
                    value: 6,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                  }
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="mt-1 flex items-center gap-1 text-xs font-medium text-primary-600"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              </button>
            </div>

            <div className="space-y-3 pt-1 text-left text-sm text-gray-700 dark:text-gray-300">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-primary-600"
                  {...register('acceptLegal', { required: 'Marca esta casilla para crear tu cuenta' })}
                />
                <span>
                  Tengo 18 años o más y acepto los{' '}
                  <Link className="font-medium text-primary-600 underline" to="/legal/terminos" target="_blank">
                    Términos y condiciones
                  </Link>{' '}
                  y la{' '}
                  <Link className="font-medium text-primary-600 underline" to="/legal/privacidad" target="_blank">
                    Política de tratamiento de datos personales
                  </Link>.
                </span>
              </label>
              {errors.acceptLegal && (
                <p className="text-xs text-red-600">{errors.acceptLegal.message}</p>
              )}
            </div>

            <Button type="submit" fullWidth loading={loading}>
              Crear mi cuenta gratis
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
                O continúa con
              </span>
            </div>
          </div>

          {/* Google Sign In */}
          <GoogleSignInButton label="Continuar con Google" onClick={handleGoogleSignIn} disabled={loading} />

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            ¿Ya tienes cuenta?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
        <LegalFooter />
      </div>
    </div>
  );
};
