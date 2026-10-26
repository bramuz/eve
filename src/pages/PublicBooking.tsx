import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';
import {
  createPublicBooking,
  getAvailability,
  getBookingProfile,
  getTakenSlots,
  formatTime12,
  splitAmPm,
  type BookingProfile
} from '../firebase/booking';

export const PublicBooking = () => {
  const { uid = '' } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BookingProfile | null>(null);
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [taken, setTaken] = useState<Record<string, string[]>>({});
  const [dateKey, setDateKey] = useState('');
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ dateKey: string; time: string } | null>(null);

  const load = async () => {
    try {
      const p = await getBookingProfile(uid);
      setProfile(p);
      if (p?.enabled) {
        const [a, t] = await Promise.all([getAvailability(uid), getTakenSlots(uid)]);
        setAvailability(a);
        setTaken(t);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const openDays = useMemo(() => {
    const now = new Date();
    const todayKey = format(now, 'yyyy-MM-dd');
    const nowTime = format(now, 'HH:mm');
    const limit = format(addDays(now, 90), 'yyyy-MM-dd');
    return Object.keys(availability)
      .filter((k) => k >= todayKey && k <= limit)
      .map((k) => ({
        key: k,
        times: availability[k].filter(
          (t) => !(taken[k] ?? []).includes(t) && (k > todayKey || t > nowTime)
        )
      }))
      .filter((d) => d.times.length > 0)
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [availability, taken]);

  const selectedDay = openDays.find((d) => d.key === dateKey);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!dateKey || !time) return setError('Elige un día y una hora');
    if (name.trim().length < 2) return setError('Escribe tu nombre');
    if (phone.replace(/\D/g, '').length < 7) return setError('Escribe un teléfono válido');

    if (service.trim().length < 2) return setError('Escribe el procedimiento que deseas');

    setSubmitting(true);
    try {
      await createPublicBooking({
        uid,
        dateKey,
        time,
        clientName: name.trim().slice(0, 100),
        clientPhone: phone.trim().slice(0, 30),
        service: service.trim().slice(0, 100),
        notes: '',
        whatsappConsent: consent
      });
      setDone({ dateKey, time });
    } catch {
      setError('Ese horario ya no está disponible. Elige otro.');
      setTime('');
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  const inputCls =
    'w-full px-3 py-2 rounded-xl border border-warm-300 bg-white text-warm-900';

  return (
    <div className="min-h-screen bg-warm-50 p-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow p-5 space-y-5">
        {!profile || !profile.enabled ? (
          <p className="text-center text-warm-700">Las reservas no están disponibles por el momento.</p>
        ) : done ? (
          <div className="text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto" />
            <h1 className="text-xl font-bold text-warm-900">¡Cita agendada!</h1>
            <p className="text-warm-700 capitalize">
              {format(new Date(`${done.dateKey}T00:00:00`), "EEEE d 'de' MMMM", { locale: es })} a las {formatTime12(done.time)}
            </p>
            <p className="text-sm text-warm-600">{profile.businessName} confirmará contigo si es necesario.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <h1 className="text-xl font-bold text-warm-900 text-center">
              {profile.businessName || 'Agenda tu cita'}
            </h1>

            {openDays.length === 0 ? (
              <p className="text-center text-warm-600">No hay horarios disponibles por ahora.</p>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium text-warm-700 mb-2">Elige el día</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {openDays.map((d) => {
                      const date = new Date(`${d.key}T00:00:00`);
                      return (
                        <button
                          type="button"
                          key={d.key}
                          onClick={() => {
                            setDateKey(d.key);
                            setTime('');
                          }}
                          className={`flex-shrink-0 w-16 py-2 rounded-xl border text-center text-xs ${
                            d.key === dateKey
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white text-warm-700 border-warm-300'
                          }`}
                        >
                          <div className="uppercase">{format(date, 'EEE', { locale: es })}</div>
                          <div className="text-lg font-bold">{format(date, 'd')}</div>
                          <div>{format(date, 'MMM', { locale: es })}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedDay && (
                  <div>
                    <p className="text-sm font-medium text-warm-700 mb-2">Elige la hora</p>
                    {([['Mañana (AM)', splitAmPm(selectedDay.times).am], ['Tarde y noche (PM)', splitAmPm(selectedDay.times).pm]] as const)
                      .filter(([, group]) => group.length > 0)
                      .map(([label, group]) => (
                        <div key={label} className="mb-3">
                          <p className="text-xs font-semibold uppercase text-warm-500 mb-1">{label}</p>
                          <div className="grid grid-cols-3 gap-2">
                            {group.map((t) => (
                              <button
                                type="button"
                                key={t}
                                onClick={() => setTime(t)}
                                className={`py-1.5 rounded-lg text-sm border ${
                                  t === time
                                    ? 'bg-primary-600 text-white border-primary-600'
                                    : 'bg-white text-warm-700 border-warm-300'
                                }`}
                              >
                                {formatTime12(t)}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                <input className={inputCls} placeholder="Tu nombre" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
                <input className={inputCls} placeholder="Tu teléfono / WhatsApp" type="tel" value={phone} maxLength={30} onChange={(e) => setPhone(e.target.value)} />
                <input
                  className={inputCls}
                  placeholder="Procedimiento que deseas realizar"
                  list="booking-services"
                  maxLength={100}
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                />
                <datalist id="booking-services">
                  {profile.services.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>

                <label className="flex items-start gap-2 text-sm text-warm-700">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>Acepto recibir la confirmación y el recordatorio de mi cita por WhatsApp.</span>
                </label>

                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" fullWidth loading={submitting}>
                  Confirmar cita
                </Button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
