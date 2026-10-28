import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Chrome } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { LegalFooter } from '../components/layout/LegalFooter';
import { recordLegalAcceptance } from '../legal/acceptance';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  confirmAdult: boolean;
  acceptLegal: boolean;
}

export const Register = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signInGoogle, signOut, currentUser } = useAuth();
  const [registrationFlow, setRegistrationFlow] = useState(false);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<RegisterForm>();

  const password = useWatch({ control, name: 'password' });
  const confirmedAdult = useWatch({ control, name: 'confirmAdult' });
  const acceptedLegal = useWatch({ control, name: 'acceptLegal' });

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

    const { user, error: signUpError } = await signUp(
      data.email,
      data.password,
      data.name
    );

    if (signUpError) {
      setError('Error al crear la cuenta. Por favor, intenta con otro email.');
    } else if (user) {
      try {
        await recordLegalAcceptance(user.uid, 'email', data.confirmAdult);
        navigate('/dashboard');
      } catch (acceptanceError) {
        console.error('No se pudo registrar la aceptación legal:', acceptanceError);
        await signOut();
        setError('La cuenta se creó, pero no pudimos guardar tu aceptación. Inicia sesión para completarla.');
      }
    }
    setRegistrationFlow(false);
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    if (!confirmedAdult || !acceptedLegal) {
      setError('Confirma que eres mayor de edad y acepta los documentos para continuar.');
      return;
    }

    setLoading(true);
    setError('');
    setRegistrationFlow(true);

    const result = await signInGoogle();

    if (result.error) {
      setError(result.error);
    } else if (result.user) {
      try {
        await recordLegalAcceptance(result.user.uid, 'google', true);
        navigate('/dashboard');
      } catch (acceptanceError) {
        console.error('No se pudo registrar la aceptación legal:', acceptanceError);
        await signOut();
        setError('No pudimos guardar tu aceptación. Inténtalo de nuevo.');
      }
    }
    setRegistrationFlow(false);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Stetik
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Tu espacio personalizado para gestionar tu negocio
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
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
              helperText="Lo usaremos para personalizar tu espacio de trabajo."
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

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
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

            <Input
              label="Confirmar contraseña"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-5 h-5" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Debes confirmar la contraseña',
                validate: (value) =>
                  value === password || 'Las contraseñas no coinciden'
              })}
            />

            <div className="space-y-3 pt-1 text-sm text-gray-700 dark:text-gray-300">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-primary-600"
                  {...register('confirmAdult', { required: 'Debes confirmar que tienes 18 años o más' })}
                />
                <span>Confirmo que tengo 18 años o más.</span>
              </label>
              {errors.confirmAdult && (
                <p className="text-xs text-red-600">{errors.confirmAdult.message}</p>
              )}

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-primary-600"
                  {...register('acceptLegal', { required: 'Debes aceptar los documentos para crear una cuenta' })}
                />
                <span>
                  He leído y acepto los{' '}
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
              Crear Cuenta
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
          <Button
            type="button"
            variant="secondary"
            fullWidth
            icon={<Chrome className="w-5 h-5" />}
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            Continuar con Google
          </Button>

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
      </motion.div>
    </div>
  );
};
