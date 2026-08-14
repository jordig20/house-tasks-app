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
  border: [number, number, number];
  text: [number, number, number];
  muted: [number, number, number];
  accent: [number, number, number];
};

const basePalette: Palette = {
  background: [255, 255, 255],
  border: [30, 41, 59],
  text: [2, 6, 23],
  muted: [100, 116, 139],
  accent: [8, 145, 178],
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

function getColor(user: PrintablePdfUser): [number, number, number] {
  if (user.color && colorSwatches[user.color]) {
    return colorSwatches[user.color];
  }

  if (user.role === "admin") {
    return [15, 23, 42];
  }

  return colorSwatches.blue;
}

function findAssigneeLabel(
  task: CleaningTask,
  users: PrintablePdfUser[],
): string {
  const usersById = new Map(users.map((user) => [user.id, user]));

  if (task.assignedUserIds.length === 0) {
    return "Unassigned";
  }

  return task.assignedUserIds
    .map((userId, index) => {
      const user = usersById.get(userId);
      return user?.name ?? task.assignedTo[index] ?? "Assigned";
    })
    .join(" & ");
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
  const margin = 8;
  const headerHeight = 18;
  const weekdayHeight = 8;
  const gridTop = margin + headerHeight + weekdayHeight;
  const gridHeight = pageHeight - gridTop - margin;
  const usableWidth = pageWidth - margin * 2;
  const columnWidth = usableWidth / 7;
  const weekCount = Math.max(1, Math.round(days.length / 7));
  const rowHeight = gridHeight / weekCount;

  doc.setFillColor(...basePalette.background);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...basePalette.accent);
  doc.text("540A CLEANING · HOUSEHOLD CALENDAR", margin, margin + 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...basePalette.text);
  doc.text(monthLabel, margin, margin + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...basePalette.muted);
  doc.text(monthStart, pageWidth - margin, margin + 12, { align: "right" });

  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  doc.setFillColor(...basePalette.border);
  doc.rect(margin, margin + headerHeight, usableWidth, weekdayHeight, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  weekdays.forEach((weekday, index) => {
    const x = margin + columnWidth * index + columnWidth / 2;
    doc.text(weekday, x, margin + headerHeight + 5, { align: "center" });
  });

  doc.setDrawColor(...basePalette.border);
  doc.setLineWidth(0.2);

  for (let row = 0; row <= weekCount; row += 1) {
    const y = gridTop + row * rowHeight;
    doc.line(margin, y, margin + usableWidth, y);
  }

  for (let column = 0; column <= 7; column += 1) {
    const x = margin + columnWidth * column;
    doc.line(x, gridTop, x, gridTop + rowHeight * weekCount);
  }

  doc.setTextColor(...basePalette.text);

  days.forEach((day, index) => {
    const weekRow = Math.floor(index / 7);
    const columnIndex = index % 7;
    const cellX = margin + columnWidth * columnIndex;
    const cellY = gridTop + rowHeight * weekRow;
    const inset = 1.5;
    const dayX = cellX + inset;
    const dayY = cellY + 5;

    if (!day.isCurrentMonth) {
      doc.setTextColor(...basePalette.muted);
      doc.setFont("helvetica", "normal");
    } else {
      doc.setTextColor(...basePalette.text);
      doc.setFont("helvetica", "bold");
    }

    doc.setFontSize(10);
    doc.text(String(day.dayNumber), dayX, dayY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...basePalette.text);

    const taskTop = dayY + 1;
    const maxLines = Math.max(0, Math.floor((rowHeight - (taskTop - cellY) - inset) / 6));
    const visibleTasks = day.tasks.slice(0, maxLines);

    visibleTasks.forEach((task, taskIndex) => {
      const lineY = taskTop + taskIndex * 6;
      const lineX = dayX;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...basePalette.text);
      doc.text(doc.splitTextToSize(task.title, columnWidth - inset * 2 - 1)[0] ?? "", lineX, lineY);

      const assignee = findAssigneeLabel(task, users);
      const swatchColor = users.find((user) =>
        task.assignedUserIds.includes(user.id),
      )
        ? getColor(users.find((user) => task.assignedUserIds.includes(user.id)) as PrintablePdfUser)
        : basePalette.muted;

      doc.setFillColor(...swatchColor);
      doc.rect(lineX, lineY + 1.2, 1.6, 1.6, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(...basePalette.muted);
      doc.text(
        doc.splitTextToSize(assignee, columnWidth - inset * 2 - 3)[0] ?? "",
        lineX + 2.4,
        lineY + 2.6,
      );
    });

    if (day.tasks.length > visibleTasks.length) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(...basePalette.muted);
      doc.text(
        `+${day.tasks.length - visibleTasks.length} more`,
        dayX,
        cellY + rowHeight - 1,
      );
    }
  });

  return doc;
}
