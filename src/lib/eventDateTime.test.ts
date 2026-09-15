import { describe, expect, it } from 'vitest';
import { dateTimeLocalInZone, eventDateKey, eventTimeZone, zonedDateTimeToIso } from './eventDateTime';

describe('eventDateTime', () => {
  it('converte 20:00 de São Luís para o instante UTC correto', () => {
    expect(zonedDateTimeToIso('2026-10-10T20:00', 'America/Fortaleza'))
      .toBe('2026-10-10T23:00:00.000Z');
  });

  it('mantém o horário de parede ao reabrir o evento no dashboard', () => {
    expect(dateTimeLocalInZone('2026-10-10T23:00:00.000Z', 'America/Fortaleza'))
      .toBe('2026-10-10T20:00');
  });

  it('deriva fuso e dia local a partir da UF', () => {
    const event = { startDate: '2026-10-11T02:00:00.000Z', locationUf: 'MA' };
    expect(eventTimeZone(event)).toBe('America/Fortaleza');
    expect(eventDateKey(event)).toBe('2026-10-10');
  });
});
