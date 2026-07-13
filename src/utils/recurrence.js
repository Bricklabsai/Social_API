"""Utilities for expanding and describing flexible recurring schedules."""

export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAYS_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const WEEK_OF_MONTH_OPTIONS = [
  { value: 1, label: 'First' },
  { value: 2, label: 'Second' },
  { value: 3, label: 'Third' },
  { value: 4, label: 'Fourth' },
  { value: -1, label: 'Last' },
];

/** Pad YYYY-MM-DD */
export const toDateKey = (year, monthIndex, day) => {
  const m = String(monthIndex + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

/**
 * Get the date (1-31) for the n-th weekday in a month.
 * weekday: 0=Sun ... 6=Sat
 * nth: 1-4 or -1 (last)
 */
export const getNthWeekdayDate = (year, monthIndex, weekday, nth) => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const matches = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    if (new Date(year, monthIndex, day).getDay() === weekday) {
      matches.push(day);
    }
  }
  if (!matches.length) return null;
  if (nth === -1) return matches[matches.length - 1];
  return matches[nth - 1] || null;
};

export const describeRecurringSchedule = (schedule) => {
  const time = schedule.time_utc || '09:00';
  const frequency = schedule.frequency || 'weekly';
  const days = schedule.days_of_week || [];

  if (frequency === 'monthly_weekday') {
    const weekday = days[0] ?? 1;
    const nth = schedule.week_of_month ?? 1;
    const nthLabel =
      WEEK_OF_MONTH_OPTIONS.find((o) => o.value === nth)?.label || 'First';
    return `${nthLabel} ${DAYS_LONG[weekday]} of every month at ${time} UTC`;
  }

  const dayLabels = days.map((d) => DAYS_SHORT[d]).filter(Boolean);
  if (dayLabels.length === 0) return `Every week at ${time} UTC`;
  if (dayLabels.length === 7) return `Every day at ${time} UTC`;
  return `Every ${dayLabels.join(', ')} at ${time} UTC`;
};

/**
 * Expand active recurring schedules into calendar events for a given month.
 * Returns { dateKey, schedule, kind: 'recurring' }[]
 */
export const expandRecurringForMonth = (schedules, year, monthIndex) => {
  const events = [];
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  (schedules || []).forEach((schedule) => {
    if (schedule.is_active === false) return;
    const frequency = schedule.frequency || 'weekly';
    const days = schedule.days_of_week || [];

    if (frequency === 'monthly_weekday') {
      const weekday = days[0];
      if (weekday == null) return;
      const day = getNthWeekdayDate(
        year,
        monthIndex,
        weekday,
        schedule.week_of_month ?? 1
      );
      if (!day) return;
      events.push({
        dateKey: toDateKey(year, monthIndex, day),
        schedule,
        kind: 'recurring',
      });
      return;
    }

    // weekly (default)
    for (let day = 1; day <= daysInMonth; day += 1) {
      const dow = new Date(year, monthIndex, day).getDay();
      if (days.includes(dow)) {
        events.push({
          dateKey: toDateKey(year, monthIndex, day),
          schedule,
          kind: 'recurring',
        });
      }
    }
  });

  return events;
};
