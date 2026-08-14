export const banffTimeZone = "America/Edmonton";

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
};

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: banffTimeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const dateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: banffTimeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function getPartsInBanff(date: Date, includeTime = false): DateParts {
  const parts = (includeTime ? dateTimeFormatter : dateKeyFormatter).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function getTimeZoneOffsetMs(date: Date) {
  const parts = getPartsInBanff(date, true);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour ?? 0,
    parts.minute ?? 0,
    parts.second ?? 0,
  );

  return asUtc - date.getTime();
}

function banffDateToUtcDate({ year, month, day }: DateParts) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day));
  const offset = getTimeZoneOffsetMs(utcGuess);

  return new Date(utcGuess.getTime() - offset);
}

function addDays(parts: DateParts, days: number): DateParts {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  date.setUTCDate(date.getUTCDate() + days);

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function getDateKeyFromParts(parts: DateParts) {
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");

  return `${parts.year}-${month}-${day}`;
}

export function getBanffDateKey(date = new Date()) {
  const parts = getPartsInBanff(date);

  return getDateKeyFromParts(parts);
}

export function getBanffTodayRange(now = new Date()) {
  const today = getPartsInBanff(now);
  const tomorrow = addDays(today, 1);

  return {
    start: banffDateToUtcDate(today),
    end: banffDateToUtcDate(tomorrow),
    dateKey: getBanffDateKey(now),
  };
}

export function getBanffWeekRange(now = new Date()) {
  const today = getPartsInBanff(now);
  const todayUtc = new Date(Date.UTC(today.year, today.month - 1, today.day));
  const weekStart = addDays(today, -todayUtc.getUTCDay());
  const weekEnd = addDays(weekStart, 7);

  return {
    start: banffDateToUtcDate(weekStart),
    end: banffDateToUtcDate(weekEnd),
    startKey: getBanffDateKey(banffDateToUtcDate(weekStart)),
    endKey: getBanffDateKey(banffDateToUtcDate(addDays(weekEnd, -1))),
  };
}

export function getBanffMonthRange(now = new Date()) {
  const today = getPartsInBanff(now);
  return getBanffMonthRangeFromKey(
    `${today.year}-${String(today.month).padStart(2, "0")}-01`,
  );
}

export function getBanffMonthRangeFromKey(monthStartKey: string) {
  const match = /^(\d{4})-(\d{2})-01$/.exec(monthStartKey);

  if (!match) {
    throw new Error("Month must use YYYY-MM-01 format.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (month < 1 || month > 12) {
    throw new Error("Month must use YYYY-MM-01 format.");
  }

  const monthStart: DateParts = {
    year,
    month,
    day: 1,
  };
  const nextMonthStartDate = new Date(
    Date.UTC(year, month, 1),
  );
  const nextMonthStart: DateParts = {
    year: nextMonthStartDate.getUTCFullYear(),
    month: nextMonthStartDate.getUTCMonth() + 1,
    day: 1,
  };
  const monthStartDate = new Date(
    Date.UTC(monthStart.year, monthStart.month - 1, monthStart.day),
  );
  const visibleStart = addDays(monthStart, -monthStartDate.getUTCDay());
  const nextMonthStartWeekday = nextMonthStartDate.getUTCDay();
  const visibleEnd = addDays(
    nextMonthStart,
    (7 - nextMonthStartWeekday) % 7,
  );

  return {
    start: banffDateToUtcDate(visibleStart),
    end: banffDateToUtcDate(visibleEnd),
    monthStartKey: getDateKeyFromParts(monthStart),
  };
}
