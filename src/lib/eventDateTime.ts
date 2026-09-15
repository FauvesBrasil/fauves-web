const UF_TIMEZONES: Record<string, string> = {
  AC: 'America/Rio_Branco', AM: 'America/Manaus', RO: 'America/Porto_Velho',
  RR: 'America/Boa_Vista', MT: 'America/Cuiaba', MS: 'America/Campo_Grande',
  PA: 'America/Belem', AP: 'America/Belem', TO: 'America/Araguaina',
  MA: 'America/Fortaleza', PI: 'America/Fortaleza', CE: 'America/Fortaleza',
  RN: 'America/Fortaleza', PB: 'America/Fortaleza', PE: 'America/Recife',
  AL: 'America/Maceio', SE: 'America/Maceio', BA: 'America/Bahia',
};

export const timeZoneForUf = (uf?: string | null) => UF_TIMEZONES[String(uf || '').trim().toUpperCase()] || 'America/Sao_Paulo';

export const eventTimeZone = (event: any) => (
  event?.timezone
  || event?.timeZone
  || event?.registrationForm?.timezone
  || timeZoneForUf(event?.locationUf || event?.uf)
);

const datePartsInTimezone = (value: Date, timezone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(value);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || '0';
  return {
    date: `${read('year')}-${read('month')}-${read('day')}`,
    time: `${read('hour')}:${read('minute')}`,
    values: [read('year'), read('month'), read('day'), read('hour'), read('minute'), read('second')].map(Number),
  };
};

export const zonedDateTimeToIso = (value: string, timezone: string) => {
  if (!value) return '';
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(value)) return new Date(value).toISOString();
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return '';
  const desiredParts = match.slice(1, 7).map((part) => Number(part || 0));
  const desired = Date.UTC(desiredParts[0], desiredParts[1] - 1, desiredParts[2], desiredParts[3], desiredParts[4], desiredParts[5]);
  let guess = desired;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const shown = datePartsInTimezone(new Date(guess), timezone).values;
    guess += desired - Date.UTC(shown[0], shown[1] - 1, shown[2], shown[3], shown[4], shown[5]);
  }
  return new Date(guess).toISOString();
};

export const dateTimeLocalInZone = (value: string | Date | null | undefined, timezone: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = datePartsInTimezone(date, timezone);
  return `${parts.date}T${parts.time}`;
};

export const formatEventTime = (event: any) => new Intl.DateTimeFormat('pt-BR', {
  timeZone: eventTimeZone(event), hour: '2-digit', minute: '2-digit',
}).format(new Date(event.startDate));

export const eventDateKey = (event: any) => new Intl.DateTimeFormat('en-CA', {
  timeZone: eventTimeZone(event), year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date(event.startDate));
