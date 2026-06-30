import "server-only";

import { google, type calendar_v3 } from "googleapis";
import { parseCalendarTaskTitle, type CleaningTask } from "@/lib/tasks";

export type ConfiguredCalendar = {
  calendarName: string;
  calendarId: string;
};

export type CalendarTaskResult = {
  tasks: CleaningTask[];
  warnings: string[];
  isConfiguredFallback: boolean;
};

const dayNames: CleaningTask["day"][] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function parseGoogleCalendars(value?: string): ConfiguredCalendar[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separatorIndex = entry.indexOf(":");

      if (separatorIndex === -1) {
        return null;
      }

      const calendarName = entry.slice(0, separatorIndex).trim();
      const calendarId = entry.slice(separatorIndex + 1).trim();

      if (!calendarName || !calendarId) {
        return null;
      }

      return { calendarName, calendarId };
    })
    .filter((calendar): calendar is ConfiguredCalendar => Boolean(calendar));
}

export function getTodayRange(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export function getWeekRange(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());

  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  return { start, end };
}

function getCalendarClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    return null;
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  });

  return google.calendar({ version: "v3", auth });
}

function formatTime(value: string, isAllDay: boolean) {
  if (isAllDay) {
    return "All day";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getDateOnly(value: string) {
  return value.includes("T") ? value.slice(0, 10) : value;
}

function normalizeCalendarEvent(
  event: calendar_v3.Schema$Event,
  calendar: ConfiguredCalendar,
): CleaningTask | null {
  const sourceTitle = event.summary?.trim();
  const googleEventId = event.id;
  const eventStart = event.start?.dateTime ?? event.start?.date;

  if (!sourceTitle || !googleEventId || !eventStart) {
    return null;
  }

  const isAllDay = Boolean(event.start?.date);
  const eventEnd = event.end?.dateTime ?? event.end?.date ?? eventStart;
  const parsedTitle = parseCalendarTaskTitle(sourceTitle);
  const startDate = new Date(isAllDay ? `${eventStart}T00:00:00` : eventStart);
  const date = getDateOnly(eventStart);

  return {
    id: `${calendar.calendarName}:${googleEventId}:${eventStart}`,
    googleEventId,
    calendarName: calendar.calendarName,
    calendarId: calendar.calendarId,
    sourceTitle,
    taskTitle: parsedTitle.taskTitle,
    title: parsedTitle.taskTitle,
    assignedTo: parsedTitle.assignedTo,
    start: eventStart,
    end: eventEnd,
    date,
    isAllDay,
    dueLabel: formatTime(eventStart, isAllDay),
    dateLabel: formatDate(isAllDay ? `${eventStart}T00:00:00` : eventStart),
    day: dayNames[startDate.getDay()],
    status: "pending",
    durationMinutes: 0,
  };
}

export async function getCalendarTasks(
  start: Date,
  end: Date,
): Promise<CalendarTaskResult> {
  const configuredCalendars = parseGoogleCalendars(
    process.env.GOOGLE_CALENDARS,
  );
  const calendarClient = getCalendarClient();

  if (configuredCalendars.length === 0 || !calendarClient) {
    return {
      tasks: [],
      warnings: [
        "Google Calendar is not configured yet, so no calendar tasks are shown.",
      ],
      isConfiguredFallback: true,
    };
  }

  const results = await Promise.allSettled(
    configuredCalendars.map(async (configuredCalendar) => {
      const response = await calendarClient.events.list({
        calendarId: configuredCalendar.calendarId,
        singleEvents: true,
        orderBy: "startTime",
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
      });

      return {
        calendar: configuredCalendar,
        events: response.data.items ?? [],
      };
    }),
  );

  const warnings: string[] = [];
  const tasks: CleaningTask[] = [];

  results.forEach((result, index) => {
    const configuredCalendar = configuredCalendars[index];

    if (result.status === "rejected") {
      warnings.push(
        `${configuredCalendar.calendarName} calendar could not be loaded.`,
      );
      return;
    }

    result.value.events.forEach((event) => {
      const task = normalizeCalendarEvent(event, result.value.calendar);

      if (task) {
        tasks.push(task);
      }
    });
  });

  tasks.sort(
    (firstTask, secondTask) =>
      new Date(firstTask.start).getTime() -
      new Date(secondTask.start).getTime(),
  );

  return { tasks, warnings, isConfiguredFallback: false };
}
