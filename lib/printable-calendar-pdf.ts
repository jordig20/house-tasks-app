import { jsPDF } from "jspdf";
import type { CleaningTask } from "@/lib/tasks";

export type PrintablePdfUser = {
  id: string;
  name: string;
  role: "admin" | "member";
  color?: string;
};

export type PrintablePdfInput = {
  monthLabel: string;
  monthStart: string;
  days: {
    dateKey: string;
    dayNumber: number;
    isCurrentMonth: boolean;
    tasks: CleaningTask[];
  }[];
  users: PrintablePdfUser[];
};

type Palette = {
  background: [number, number, number];
  sheet: [number, number, number];
  hairline: [number, number, number];
  weekday: [number, number, number];
  weekdayText: [number, number, number];
  text: [number, number, number];
  muted: [number, number, number];
  taskCard: [number, number, number];
  taskBorder: [number, number, number];
  accent: [number, number, number];
  unassigned: [number, number, number];
};

const palette: Palette = {
  background: [241, 245, 249],
  sheet: [255, 255, 255],
  hairline: [203, 213, 225],
  weekday: [15, 23, 42],
  weekdayText: [255, 255, 255],
  text: [2, 6, 23],
  muted: [100, 116, 139],
  taskCard: [248, 250, 252],
  taskBorder: [226, 232, 240],
  accent: [8, 145, 178],
  unassigned: [148, 163, 184],
};

const colorSwatches: Record<string, [number, number, number]> = {
  red: [239, 68, 68],
  pink: [236, 72, 153],
  purple: [168, 85, 247],
  indigo: [99, 102, 241],
  blue: [59, 130, 246],
  teal: [20, 184, 166],
  green: [34, 197, 94],
  amber: [245, 158, 11],
  orange: [249, 115, 22],
  brown: [120, 53, 15],
};

const pageSize = "a4" as const;
const pageOrientation = "l" as const;

const margin = 10;
const sheetInset = 4;
const titleHeight = 14;
const weekdayHeight = 7;
const cellPadding = 1.6;

function getColor(user: PrintablePdfUser): [number, number, number] {
  if (user.color && colorSwatches[user.color]) {
    return colorSwatches[user.color];
  }

  if (user.role === "admin") {
    return palette.weekday;
  }

  return colorSwatches.blue;
}

type AssigneeInfo = {
  name: string;
  color: [number, number, number];
};

function getAssignees(
  task: CleaningTask,
  users: PrintablePdfUser[],
  usersById: Map<string, PrintablePdfUser>,
): AssigneeInfo[] {
  if (task.assignedUserIds.length === 0) {
    return [];
  }

  return task.assignedUserIds.map((userId, index) => {
    const user = usersById.get(userId);
    return {
      name: user?.name ?? task.assignedTo[index] ?? "Assigned",
      color: user ? getColor(user) : palette.unassigned,
    };
  });
}

function truncate(doc: jsPDF, text: string, maxWidth: number) {
  const lines = doc.splitTextToSize(text, maxWidth);
  const firstLine = lines[0] ?? "";

  if (lines.length <= 1) {
    return firstLine;
  }

  return `${firstLine.replace(/\s+$/, "")}…`;
}

function drawHeader(doc: jsPDF, monthLabel: string, monthStart: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...palette.accent);
  doc.text("540A CLEANING · HOUSEHOLD CALENDAR", margin, margin + 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...palette.text);
  doc.text(monthLabel, margin, margin + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...palette.muted);
  doc.text("Household schedule", pageWidth - margin, margin + 12, { align: "right" });

  doc.setDrawColor(...palette.text);
  doc.setLineWidth(0.5);
  doc.line(margin, margin + titleHeight, pageWidth - margin, margin + titleHeight);
  doc.setTextColor(...palette.muted);
  doc.setFontSize(8);
  doc.text(monthStart, margin, margin + titleHeight + 4);
}

function drawWeekdayRow(
  doc: jsPDF,
  sheetLeft: number,
  gridTop: number,
  columnWidth: number,
) {
  const weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  doc.setFillColor(...palette.weekday);
  doc.rect(sheetLeft, gridTop, columnWidth * 7, weekdayHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...palette.weekdayText);

  weekdays.forEach((weekday, index) => {
    const x = sheetLeft + columnWidth * index + columnWidth / 2;
    doc.text(weekday, x, gridTop + weekdayHeight / 2 + 1.5, { align: "center" });
  });
}

function drawTaskCard(
  doc: jsPDF,
  cardX: number,
  cardY: number,
  cardWidth: number,
  task: CleaningTask,
  assignees: AssigneeInfo[],
) {
  doc.setFillColor(...palette.taskCard);
  doc.setDrawColor(...palette.taskBorder);
  doc.setLineWidth(0.1);
  doc.roundedRect(cardX, cardY, cardWidth, 11.5, 1, 1, "FD");

  const titleMaxWidth = cardWidth - 2.8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...palette.text);
  doc.text(truncate(doc, task.title, titleMaxWidth), cardX + 1.4, cardY + 4);

  const swatchY = cardY + 6.5;
  let swatchX = cardX + 1.4;
  const assigneeMaxWidth = cardWidth - (swatchX - cardX) - 4;

  if (assignees.length === 0) {
    doc.setFillColor(...palette.unassigned);
    doc.circle(swatchX + 0.9, swatchY + 0.9, 0.9, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...palette.muted);
    doc.text("Unassigned", swatchX + 2.4, swatchY + 1.6);
  } else {
    const inline = assignees.slice(0, 3);
    inline.forEach((assignee) => {
      doc.setFillColor(...assignee.color);
      doc.circle(swatchX + 0.9, swatchY + 0.9, 0.9, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...palette.muted);
      const name = truncate(doc, assignee.name, assigneeMaxWidth);
      doc.text(name, swatchX + 2.4, swatchY + 1.6);
      swatchX += doc.getTextWidth(name) + 4;
    });

    if (assignees.length > inline.length) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...palette.muted);
      doc.text(`+${assignees.length - inline.length}`, swatchX, swatchY + 1.6);
    }
  }
}

function drawDay(
  doc: jsPDF,
  cellX: number,
  cellY: number,
  columnWidth: number,
  rowHeight: number,
  day: PrintablePdfInput["days"][number],
  assigneesByTask: Map<string, AssigneeInfo[]>,
) {
  doc.setDrawColor(...palette.hairline);
  doc.setLineWidth(0.1);
  doc.setFillColor(...palette.sheet);
  doc.rect(cellX, cellY, columnWidth, rowHeight, "F");

  const dayX = cellX + cellPadding;
  const dayY = cellY + 5;

  doc.setFont("helvetica", day.isCurrentMonth ? "bold" : "normal");
  doc.setFontSize(11);
  doc.setTextColor(...(day.isCurrentMonth ? palette.text : palette.muted));
  doc.text(String(day.dayNumber), dayX, dayY);

  const availableHeight = rowHeight - (dayY - cellY) - cellPadding;
  const cardHeight = 11.5;
  const cardGap = 1.2;
  const maxCards = Math.max(0, Math.floor((availableHeight + cardGap) / (cardHeight + cardGap)));
  const visibleTasks = day.tasks.slice(0, maxCards);
  const cardTop = dayY + 2;

  visibleTasks.forEach((task, index) => {
    drawTaskCard(
      doc,
      cellX + cellPadding,
      cardTop + index * (cardHeight + cardGap),
      columnWidth - cellPadding * 2,
      task,
      assigneesByTask.get(task.id) ?? [],
    );
  });

  if (day.tasks.length > visibleTasks.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...palette.muted);
    doc.text(
      `+${day.tasks.length - visibleTasks.length} more`,
      dayX,
      cellY + rowHeight - cellPadding,
    );
  }
}

export function buildPrintableCalendarPdf({
  monthLabel,
  monthStart,
  days,
  users,
}: PrintablePdfInput): jsPDF {
  const doc = new jsPDF({ orientation: pageOrientation, unit: "mm", format: pageSize });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFillColor(...palette.background);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  const sheetLeft = margin + sheetInset;
  const sheetTop = margin + titleHeight + 6;
  const sheetWidth = pageWidth - margin * 2 - sheetInset * 2;
  const sheetHeight = pageHeight - sheetTop - margin - sheetInset;

  doc.setFillColor(...palette.sheet);
  doc.setDrawColor(...palette.hairline);
  doc.setLineWidth(0.2);
  doc.roundedRect(sheetLeft, sheetTop, sheetWidth, sheetHeight, 2, 2, "FD");

  drawHeader(doc, monthLabel, monthStart);

  const gridTop = sheetTop + 2;
  const gridBottom = sheetTop + sheetHeight - 2;
  const usableGridWidth = sheetWidth - 4;
  const columnWidth = usableGridWidth / 7;
  drawWeekdayRow(doc, sheetLeft + 2, gridTop, columnWidth);

  const rowsTop = gridTop + weekdayHeight;
  const rowsHeight = gridBottom - rowsTop;
  const weekCount = Math.max(1, Math.round(days.length / 7));
  const rowHeight = rowsHeight / weekCount;

  const usersById = new Map(users.map((user) => [user.id, user]));
  const assigneesByTask = new Map<string, AssigneeInfo[]>();
  const allTasks = new Map<string, CleaningTask>();

  days.forEach((day) => {
    day.tasks.forEach((task) => {
      allTasks.set(task.id, task);
      if (!assigneesByTask.has(task.id)) {
        assigneesByTask.set(task.id, getAssignees(task, users, usersById));
      }
    });
  });

  const gridLeft = sheetLeft + 2;

  for (let column = 0; column <= 7; column += 1) {
    const x = gridLeft + columnWidth * column;
    doc.setDrawColor(...palette.hairline);
    doc.setLineWidth(0.1);
    doc.line(x, rowsTop, x, rowsTop + rowHeight * weekCount);
  }

  days.forEach((day, index) => {
    const weekRow = Math.floor(index / 7);
    const columnIndex = index % 7;
    const cellX = gridLeft + columnWidth * columnIndex;
    const cellY = rowsTop + rowHeight * weekRow;
    drawDay(doc, cellX, cellY, columnWidth, rowHeight, day, assigneesByTask);
  });

  for (let row = 0; row <= weekCount; row += 1) {
    const y = rowsTop + row * rowHeight;
    doc.setDrawColor(...palette.hairline);
    doc.setLineWidth(0.1);
    doc.line(gridLeft, y, gridLeft + columnWidth * 7, y);
  }

  doc.setDrawColor(...palette.text);
  doc.setLineWidth(0.4);
  doc.line(margin, margin + titleHeight, pageWidth - margin, margin + titleHeight);

  return doc;
}
