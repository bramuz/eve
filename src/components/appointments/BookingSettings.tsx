import { useEffect, useMemo, useState } from 'react';
import { addDays, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Loading } from '../ui/Loading';
import type { Appointment } from '../../types';
import {
  getAvailability,
  getBookingLink,
  getBookingProfile,
  getTakenSlots,
  formatTime12,
  splitAmPm,
  saveBookingProfile,
  saveDayAvailability
} from '../../firebase/booking';

const DAYS_AHEAD = 45;
const START_HOUR = 6;
const END_HOUR = 22;
const INTERVALS = [15, 20, 30, 45, 60, 90, 120];

const buildSlots = (minutes: number) => {
  const slots: string[] = [];
  for (let m = START_HOUR * 60; m < END_HOUR * 60; m += minutes) {
    slots.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  return slots;
};

interface Props {
  appointments: Appointment[];
}

export const BookingSettings = ({ appointments }: Props) => {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid ?? '';

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingDay, setSavingDay] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [slotMinutes, setSlotMinutes] = useState(60);
  const [servicesText, setServicesText] = useState('');
  const [availability, setAvailability] = useState<Record<string, string[]>>({});
  const [taken, setTaken] = useState<Record<string, string[]>>({});
  const [selectedKey, setSelectedKey] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [edits, setEdits] = useState<Record<string, string[]>>({});
  const draft = edits[selectedKey] ?? availability[selectedKey] ?? [];
  const setDraft = (update: string[] | ((d: string[]) => string[])) =>
    setEdits((prev) => {
      const current = prev[selectedKey] ?? availability[selectedKey] ?? [];
      return { ...prev, [selectedKey]: typeof update === 'function' ? update(current) : update };
    });

  const days = useMemo(
    () => Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(new Date(), i)),
    []
  );
  const slots = useMemo(() => buildSlots(slotMinutes), [slotMinutes]);

  // Horarios ocupados por citas (online o creadas a mano) en el día elegido.
  const busy = useMemo(() => {
    const set = new Set<string>(taken[selectedKey] ?? []);
    const day = new Date(`${selectedKey}T00:00:00`);
    appointments.forEach((a) => {
      if (isSameDay(a.date.toDate(), day)) set.add(a.time);
    });
    return set;
  }, [appointments, taken, selectedKey]);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const [profile, avail, locks] = await Promise.all([
          getBookingProfile(uid),
          getAvailability(uid),
          getTakenSlots(uid)
        ]);
        if (profile) {
          setBusinessName(profile.businessName);
          setEnabled(profile.enabled);
          setSlotMinutes(profile.slotMinutes);
          setServicesText(profile.services.join(', '));
        } else {
          setBusinessName(currentUser?.displayName ?? '');
        }
        setAvailability(avail);
        setTaken(locks);
      } catch {
        toast.error('No se pudo cargar la configuración de reservas');
      } finally {
        setLoading(false);
      }
    })();
  }, [uid, currentUser]);

  const link = getBookingLink(uid);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await saveBookingProfile({
        userId: uid,
        businessName: businessName.trim().slice(0, 100),
        enabled,
        slotMinutes,
        services: servicesText.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 30)
      });
      toast.success('Configuración guardada');
    } catch {
      toast.error('No se pudo guardar la configuración');
    } finally {
      setSavingProfile(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(link);
    toast.success('Link copiado');
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({ title: businessName || 'Agenda tu cita', url: link }).catch(() => undefined);
    } else {
      await copyLink();
    }
  };

  const toggleSlot = (t: string) => {
    if (busy.has(t)) return;
    setDraft((d) => (d.includes(t) ? d.filter((x) => x !== t) : [...d, t]));
  };

  const fillWorkday = () => setDraft(slots.filter((t) => t >= '09:00' && t < '18:00' && !busy.has(t)));

  const persistDay = async (keys: string[], times: string[]) => {
    setSavingDay(true);
    try {
      await Promise.all(keys.map((k) => saveDayAvailability(uid, k, times)));
      setAvailability((prev) => {
        const next = { ...prev };
        keys.forEach((k) => {
          if (times.length) next[k] = [...times].sort();
          else delete next[k];
        });
        return next;
      });
      setEdits((prev) => {
        const next = { ...prev };
        keys.forEach((k) => delete next[k]);
        return next;
      });
      toast.success(times.length ? 'Disponibilidad guardada' : 'Día bloqueado');
    } catch {
      toast.error('No se pudo guardar la disponibilidad');
    } finally {
      setSavingDay(false);
    }
  };

  const repeatWeeks = async () => {
    const base = new Date(`${selectedKey}T00:00:00`);
    const keys = [1, 2, 3, 4].map((w) => format(addDays(base, w * 7), 'yyyy-MM-dd'));
    await persistDay(keys, draft);
  };

  if (loading) return <Loading />;

  const inputCls =
    'w-full px-3 py-2 rounded-xl border border-warm-300 dark:border-warm-600 bg-white dark:bg-warm-800 text-warm-900 dark:text-white';

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-sm text-warm-600 dark:text-warm-300">
          Envía este link a tus clientes. Solo verán los días y horas que dejes disponibles.
        </p>
        <div className="flex gap-2">
          <input readOnly value={link} className={inputCls} onFocus={(e) => e.target.select()} />
          <Button size="sm" variant="secondary" onClick={copyLink} icon={<Copy className="w-4 h-4" />}>
            Copiar
          </Button>
          <Button size="sm" onClick={shareLink} icon={<Share2 className="w-4 h-4" />}>
            Enviar
          </Button>
        </div>

        <input
          className={inputCls}
          placeholder="Nombre que verán tus clientes"
          value={businessName}
          maxLength={100}
          onChange={(e) => setBusinessName(e.target.value)}
        />
        <input
          className={inputCls}
          placeholder="Sugerencias de procedimientos (separados por coma, opcional)"
          value={servicesText}
          onChange={(e) => setServicesText(e.target.value)}
        />
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-warm-800 dark:text-warm-200">
            Duración de cada cita
            <select
              className={inputCls + ' !w-auto'}
              value={slotMinutes}
              onChange={(e) => setSlotMinutes(Number(e.target.value))}
            >
              {INTERVALS.map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-warm-800 dark:text-warm-200">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            Aceptar reservas
          </label>
        </div>
        <Button size="sm" loading={savingProfile} onClick={saveProfile}>
          Guardar configuración
        </Button>
        <p className="text-xs text-warm-500">
          Si cambias la duración, revisa y vuelve a guardar los horarios de cada día.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold text-warm-900 dark:text-white">Días y horarios disponibles</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {days.map((d) => {
            const key = format(d, 'yyyy-MM-dd');
            const open = (availability[key]?.length ?? 0) > 0;
            const active = key === selectedKey;
            return (
              <button
                key={key}
                onClick={() => setSelectedKey(key)}
                className={`flex-shrink-0 w-16 py-2 rounded-xl border text-center text-xs ${
                  active
                    ? 'border-primary-600 ring-2 ring-primary-300'
                    : 'border-warm-200 dark:border-warm-700'
                } ${open ? 'bg-green-100 text-green-800' : 'bg-warm-100 dark:bg-warm-800 text-warm-600'}`}
              >
                <div className="uppercase">{format(d, 'EEE', { locale: es })}</div>
                <div className="text-lg font-bold">{format(d, 'd')}</div>
                <div>{open ? 'Abierto' : 'Cerrado'}</div>
              </button>
            );
          })}
        </div>

        <p className="text-sm font-medium text-warm-800 dark:text-warm-200 capitalize">
          {format(new Date(`${selectedKey}T00:00:00`), "EEEE d 'de' MMMM", { locale: es })}
        </p>
        {([['Mañana (AM)', splitAmPm(slots).am], ['Tarde y noche (PM)', splitAmPm(slots).pm]] as const).map(
          ([label, group]) => (
            <div key={label} className="space-y-2">
              <p className="text-xs font-semibold uppercase text-warm-500">{label}</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {group.map((t) => {
                  const isBusy = busy.has(t);
                  const on = draft.includes(t);
                  return (
                    <button
                      key={t}
                      disabled={isBusy}
                      onClick={() => toggleSlot(t)}
                      className={`py-1.5 rounded-lg text-sm border ${
                        isBusy
                          ? 'bg-red-100 text-red-700 border-red-300 cursor-not-allowed line-through'
                          : on
                          ? 'bg-green-600 text-white border-green-700 font-semibold shadow-sm'
                          : 'bg-white dark:bg-warm-800 text-warm-500 dark:text-warm-400 border-warm-300 dark:border-warm-600'
                      }`}
                      title={isBusy ? 'Ocupado por una cita' : on ? 'Disponible para reservar' : 'No disponible'}
                    >
                      {on && !isBusy && '✓ '}
                      {formatTime12(t)}
                    </button>
                  );
                })}
              </div>
            </div>
          )
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-warm-600 dark:text-warm-300">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-600 inline-block" /> Disponible para reservar
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-white border border-warm-300 inline-block" /> No disponible
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block" /> Ya tiene cita
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" loading={savingDay} onClick={() => persistDay([selectedKey], draft)}>
            Guardar día
          </Button>
          <Button size="sm" variant="secondary" onClick={fillWorkday}>
            Horario 9–18
          </Button>
          <Button size="sm" variant="secondary" disabled={savingDay} onClick={repeatWeeks}>
            Repetir 4 semanas
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={savingDay}
            onClick={() => persistDay([selectedKey], [])}
          >
            Bloquear día
          </Button>
        </div>
      </section>
    </div>
  );
};
