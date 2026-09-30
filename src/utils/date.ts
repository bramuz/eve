/**
 * Devuelve una fecha en formato YYYY-MM-DD usando la zona horaria LOCAL.
 *
 * Evita el bug de `new Date().toISOString().split('T')[0]`, que usa UTC y
 * puede devolver el día siguiente en zonas horarias detrás de UTC
 * (ej. Colombia UTC-5 después de las 7 PM).
 */
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
