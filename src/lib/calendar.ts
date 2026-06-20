// Build calendar URLs/files so users can add a proposed task meeting
// to their own Google / Apple / Outlook calendar. No OAuth required.

export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  /** Start time. */
  start: Date;
  /** Duration in minutes. Defaults to 60. */
  durationMinutes?: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Format a Date as YYYYMMDDTHHmmssZ (UTC) for calendar URLs / ICS. */
const formatUtc = (d: Date): string =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
    d.getUTCHours(),
  )}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

const endDate = (e: CalendarEvent): Date =>
  new Date(e.start.getTime() + (e.durationMinutes ?? 60) * 60 * 1000);

/** Google Calendar "create event" template URL. */
export function googleCalendarUrl(e: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${formatUtc(e.start)}/${formatUtc(endDate(e))}`,
  });
  if (e.description) params.set('details', e.description);
  if (e.location) params.set('location', e.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const escapeIcs = (s: string): string =>
  s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');

/** Build an .ics file body for Apple Calendar / Outlook. */
export function buildIcs(e: CalendarEvent): string {
  const uid = `${formatUtc(e.start)}-${Math.random().toString(36).slice(2, 10)}@taskfy`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Taskfy//Tasks//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatUtc(new Date())}`,
    `DTSTART:${formatUtc(e.start)}`,
    `DTEND:${formatUtc(endDate(e))}`,
    `SUMMARY:${escapeIcs(e.title)}`,
  ];
  if (e.description) lines.push(`DESCRIPTION:${escapeIcs(e.description)}`);
  if (e.location) lines.push(`LOCATION:${escapeIcs(e.location)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

/** Trigger an .ics download in the browser. */
export function downloadIcs(filename: string, e: CalendarEvent): void {
  const blob = new Blob([buildIcs(e)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
