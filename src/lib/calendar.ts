export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end?: Date;
}

export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const base = 'https://calendar.google.com/calendar/render';
  const params = new URLSearchParams();

  params.set('action', 'TEMPLATE');
  params.set('text', event.title);
  if (event.description) params.set('details', event.description);
  if (event.location) params.set('location', event.location);

  const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const start = formatDate(event.start);
  const end = event.end ? formatDate(event.end) : formatDate(new Date(event.start.getTime() + 60 * 60 * 1000));

  params.set('dates', `${start}/${end}`);

  return `${base}?${params.toString()}`;
}

export function generateICS(event: CalendarEvent): string {
  const formatDateICS = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const now = formatDateICS(new Date());
  const start = formatDateICS(event.start);
  const end = event.end ? formatDateICS(event.end) : formatDateICS(new Date(event.start.getTime() + 60 * 60 * 1000));

  const uid = `${Date.now()}@listtobuy.app`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ListToBuy//Calendar Event//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
    event.location ? `LOCATION:${event.location}` : '',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}
