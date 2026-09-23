/**
 * Weather helpers for the home-page widget. Data comes from Open-Meteo (free, no key, no
 * cookies), fetched from the visitor's browser: no backend involved.
 */

export type Sky = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';

/** WMO weather code → French label + icon family (https://open-meteo.com/en/docs). */
export function describe(code: number): { label: string; sky: Sky } {
  const table: Record<number, [string, Sky]> = {
    0: ['Ciel dégagé', 'clear'],
    1: ['Peu nuageux', 'partly'],
    2: ['Partiellement nuageux', 'partly'],
    3: ['Couvert', 'cloudy'],
    45: ['Brouillard', 'fog'],
    48: ['Brouillard givrant', 'fog'],
    51: ['Bruine légère', 'drizzle'],
    53: ['Bruine', 'drizzle'],
    55: ['Bruine forte', 'drizzle'],
    56: ['Bruine verglaçante', 'drizzle'],
    57: ['Bruine verglaçante', 'drizzle'],
    61: ['Pluie faible', 'rain'],
    63: ['Pluie', 'rain'],
    65: ['Pluie forte', 'rain'],
    66: ['Pluie verglaçante', 'rain'],
    67: ['Pluie verglaçante', 'rain'],
    71: ['Neige faible', 'snow'],
    73: ['Neige', 'snow'],
    75: ['Neige forte', 'snow'],
    77: ['Grains de neige', 'snow'],
    80: ['Averses', 'rain'],
    81: ['Averses', 'rain'],
    82: ['Averses violentes', 'rain'],
    85: ['Averses de neige', 'snow'],
    86: ['Averses de neige', 'snow'],
    95: ['Orage', 'storm'],
    96: ['Orage avec grêle', 'storm'],
    99: ['Orage avec grêle', 'storm'],
  };
  const [label, sky] = table[code] ?? ['—', 'cloudy'];
  return { label, sky };
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

/** 262° → "O" */
export function compass(deg: number): string {
  return COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8]!;
}

/**
 * Rough convective cloud-base estimate from the temperature / dew-point spread
 * (≈ 400 ft per °C), rounded to 100 ft. Indicative only.
 */
export function cloudBaseFt(tempC: number, dewPointC: number): number {
  return Math.max(0, Math.round(((tempC - dewPointC) * 400) / 100) * 100);
}

/** Metres → "> 10 km" / "6 km" / "800 m" */
export function formatVisibility(m: number): string {
  if (m >= 10_000) return '> 10 km';
  if (m >= 1_000) return `${Math.round(m / 1000)} km`;
  return `${Math.round(m / 100) * 100} m`;
}

/** "2026-09-23T19:40" + minutes → "20:10" (Open-Meteo returns local times with timezone set). */
export function hhmm(isoLocal: string, addMinutes = 0): string {
  const [h, m] = isoLocal.slice(11, 16).split(':').map(Number) as [number, number];
  const total = (h * 60 + m + addMinutes + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function knotsToKmh(kt: number): number {
  return Math.round(kt * 1.852);
}

export function forecastUrl(lat: number, lon: number): string {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'dew_point_2m',
      'weather_code',
      'is_day',
      'visibility',
      'pressure_msl',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
    ].join(','),
    hourly: 'temperature_2m,weather_code,is_day,precipitation_probability',
    daily: 'temperature_2m_max,temperature_2m_min,sunrise,sunset',
    wind_speed_unit: 'kn',
    timezone: 'Europe/Paris',
    forecast_days: '2',
    forecast_hours: '7',
  }).toString();
  return url.href;
}
