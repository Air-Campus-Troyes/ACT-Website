import { describe as suite, expect, it } from 'vitest';
import {
  cloudBaseFt,
  compass,
  describe,
  forecastUrl,
  formatVisibility,
  hhmm,
  knotsToKmh,
} from '../../src/lib/weather';

suite('weather helpers', () => {
  it('maps WMO codes to labels and icon families, with a fallback', () => {
    expect(describe(0)).toEqual({ label: 'Ciel dégagé', sky: 'clear' });
    expect(describe(95).sky).toBe('storm');
    expect(describe(1234)).toEqual({ label: '—', sky: 'cloudy' });
  });

  it('converts degrees to French compass points', () => {
    expect(compass(0)).toBe('N');
    expect(compass(262)).toBe('O');
    expect(compass(225)).toBe('SO');
    expect(compass(359)).toBe('N');
    expect(compass(-45)).toBe('NO');
  });

  it('estimates cloud base from the temperature / dew point spread', () => {
    expect(cloudBaseFt(15.3, 7.8)).toBe(3000);
    expect(cloudBaseFt(10, 10)).toBe(0);
    expect(cloudBaseFt(5, 6)).toBe(0);
  });

  it('formats visibility like a briefing', () => {
    expect(formatVisibility(40_360)).toBe('> 10 km');
    expect(formatVisibility(6_400)).toBe('6 km');
    expect(formatVisibility(750)).toBe('800 m');
  });

  it('adds minutes to local times, wrapping around midnight', () => {
    expect(hhmm('2026-09-23T19:40')).toBe('19:40');
    expect(hhmm('2026-09-23T19:40', 30)).toBe('20:10');
    expect(hhmm('2026-09-24T00:10', -30)).toBe('23:40');
    expect(hhmm('2026-09-23T23:50', 30)).toBe('00:20');
  });

  it('converts knots to km/h', () => {
    expect(knotsToKmh(10)).toBe(19);
  });

  it('asks Open-Meteo for knots in Paris time', () => {
    const url = new URL(forecastUrl(48.33, 4.02));
    expect(url.searchParams.get('wind_speed_unit')).toBe('kn');
    expect(url.searchParams.get('timezone')).toBe('Europe/Paris');
    expect(url.searchParams.get('current')).toContain('dew_point_2m');
  });
});
