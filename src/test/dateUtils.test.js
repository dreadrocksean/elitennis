import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  pad,
  toDateKey,
  toMonthKey,
  MONTHS,
  DOW,
  buildMonthGrid,
  formatTime,
  formatDateLong,
  isSameDay,
  isBeforeLeadTime,
  zonedTimeToMs,
  zonedDateKey,
} from '../lib/dateUtils';

describe('pad', () => {
  it('pads single digits', () => {
    expect(pad(3)).toBe('03');
    expect(pad(12)).toBe('12');
  });
});

describe('toDateKey / toMonthKey', () => {
  it('formats a date in local time', () => {
    const d = new Date(2026, 6, 4); // Jul 4 2026
    expect(toDateKey(d)).toBe('2026-07-04');
    expect(toMonthKey(d)).toBe('2026-07');
  });
});

describe('constants', () => {
  it('has 12 months and 7 days', () => {
    expect(MONTHS).toHaveLength(12);
    expect(DOW).toHaveLength(7);
    expect(MONTHS[0]).toBe('January');
    expect(DOW[0]).toBe('Sun');
  });
});

describe('buildMonthGrid', () => {
  it('builds a 42-cell grid with leading and trailing days', () => {
    // July 2026: Jul 1 is a Wednesday (getDay()===3)
    const grid = buildMonthGrid(2026, 6);
    expect(grid).toHaveLength(42);
    // 3 leading days from June
    expect(grid[0].inMonth).toBe(false);
    expect(grid[3].inMonth).toBe(true);
    expect(grid[3].date.getDate()).toBe(1);
    // trailing days belong to next month
    expect(grid[41].inMonth).toBe(false);
  });

  it('handles a month starting on Sunday (no leading days)', () => {
    // Feb 2026 starts on Sunday (getDay()===0)
    const grid = buildMonthGrid(2026, 1);
    expect(grid[0].inMonth).toBe(true);
    expect(grid[0].date.getDate()).toBe(1);
  });
});

describe('formatTime', () => {
  it('formats AM, PM, noon and midnight', () => {
    expect(formatTime('09:00')).toBe('9:00 AM');
    expect(formatTime('16:30')).toBe('4:30 PM');
    expect(formatTime('12:00')).toBe('12:00 PM');
    expect(formatTime('00:00')).toBe('12:00 AM');
  });
});

describe('formatDateLong', () => {
  it('pretty-prints a date key', () => {
    expect(formatDateLong('2026-07-06')).toBe('Mon, Jul 6');
  });
});

describe('isSameDay', () => {
  it('compares calendar days', () => {
    expect(isSameDay(new Date(2026, 6, 4, 9), new Date(2026, 6, 4, 23))).toBe(true);
    expect(isSameDay(new Date(2026, 6, 4), new Date(2026, 6, 5))).toBe(false);
  });
});

describe('zonedTimeToMs', () => {
  it('treats slot times as Central regardless of the runner timezone', () => {
    // CDT (UTC-5) in summer: 4:00 PM Central === 21:00 UTC.
    expect(zonedTimeToMs('2026-07-10', '16:00')).toBe(Date.UTC(2026, 6, 10, 21, 0));
    // CST (UTC-6) in winter: 4:00 PM Central === 22:00 UTC.
    expect(zonedTimeToMs('2026-12-16', '16:00')).toBe(Date.UTC(2026, 11, 16, 22, 0));
  });
});

describe('zonedDateKey', () => {
  it('maps an instant to the calendar day it falls on in Central', () => {
    // 02:00 UTC is still the previous evening (21:00) in Central.
    expect(zonedDateKey(new Date('2026-07-04T02:00:00Z'))).toBe('2026-07-03');
    expect(zonedDateKey(new Date('2026-07-04T18:00:00Z'))).toBe('2026-07-04');
  });

  it('defaults to the current instant', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-04T18:00:00Z'));
    expect(zonedDateKey()).toBe('2026-07-04');
    vi.useRealTimers();
  });
});

describe('isBeforeLeadTime', () => {
  afterEach(() => vi.useRealTimers());

  it('returns true when slot is sooner than the lead window', () => {
    const now = new Date(2026, 6, 4, 8, 0);
    // slot at 10:00 same day, lead 12h -> too soon
    expect(isBeforeLeadTime('2026-07-04', '10:00', 12, now)).toBe(true);
  });

  it('returns false when slot is far enough ahead', () => {
    const now = new Date(2026, 6, 4, 8, 0);
    expect(isBeforeLeadTime('2026-07-06', '10:00', 12, now)).toBe(false);
  });

  it('defaults now to the current time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 4, 8, 0));
    expect(isBeforeLeadTime('2026-07-04', '09:00', 12)).toBe(true);
  });
});
