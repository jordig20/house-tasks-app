import { AppShell } from "@/components/app-shell";
import { PrintableCalendarAdmin } from "./printable-calendar-admin";

export const dynamic = "force-dynamic";

export default function PrintableCalendarPage() {
  return (
    <AppShell
      eyebrow="Admin · Print"
      title="Household calendar"
      requireAdmin
      wide
    >
      <PrintableCalendarAdmin />
    </AppShell>
  );
}
