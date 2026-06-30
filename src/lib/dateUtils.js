// Lightweight date helpers (local-timezone, no external tz handling needed
// for a single-coach local business).

export const pad = (n) => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' for a Date in local time. */
export const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** 'YYYY-MM' month key. */
export const toMonthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Build a 6-row calendar grid (array of Date) for a given month. */
export const buildMonthGrid = (year, month) => {
  const first = new Date(year, month, 1);
  const startDay = first.getDay(); // 0=Sun
  const grid = [];
  // Leading days from previous month
  for (let i = startDay - 1; i >= 0; i--) {
    grid.push({ date: new Date(year, month, -i), inMonth: false });
  }
  // Current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push({ date: new Date(year, month, d), inMonth: true });
  }
  // Trailing to fill 6 rows (42 cells)
  let next = 1;
  while (grid.length < 42) {
    grid.push({ date: new Date(year, month + 1, next++), inMonth: false });
  }
  return grid;
};

/** Format 'HH:mm' (24h) to '4:00 PM'. */
export const formatTime = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${pad(m)} ${period}`;
};

/** Pretty date: 'Mon, Jul 6'. */
export const formatDateLong = (dateKey) => {
  const [y, mo, d] = dateKey.split('-').map(Number);
  const date = new Date(y, mo - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export const isSameDay = (a, b) => toDateKey(a) === toDateKey(b);

// The business runs on Central time. Slot times are bare 'HH:mm' wall-clock in
// this zone, so we interpret them in Central regardless of the visitor's own
// timezone (a Denver visitor still sees/books Central times).
const TIMEZONE = 'America/Chicago';

/**
 * Wall-clock `dateKey` + `hhmm` interpreted in Central time -> UTC epoch ms.
 * DST-correct: derives Central's offset at that instant via Intl, so it's right
 * from any visitor's browser.
 */
export const zonedTimeToMs = (dateKey, hhmm) => {
  const [y, mo, d] = dateKey.split('-').map(Number);
  const [h, m] = hhmm.split(':').map(Number);
  const naiveUtc = Date.UTC(y, mo - 1, d, h, m);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const map = {};
  for (const p of dtf.formatToParts(new Date(naiveUtc))) map[p.type] = p.value;
  const wallAsUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour) % 24, // some ICU builds emit '24' for midnight
    Number(map.minute),
    Number(map.second),
  );
  return naiveUtc - (wallAsUtc - naiveUtc);
};

/** 'YYYY-MM-DD' for the given instant, as it falls on the calendar in Central. */
export const zonedDateKey = (now = new Date()) => {
  const map = {};
  for (const p of new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now))
    map[p.type] = p.value;
  return `${map.year}-${map.month}-${map.day}`;
};

/** Is the slot too soon given leadHours of required notice (Central time)? */
export const isBeforeLeadTime = (dateKey, hhmm, leadHours, now = new Date()) =>
  zonedTimeToMs(dateKey, hhmm) - now.getTime() < leadHours * 3600 * 1000;
