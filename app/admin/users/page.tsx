import { AppShell } from "@/components/app-shell";
import { CalendarSyncCard } from "@/components/calendar-sync-card";
import { UsersAdmin } from "./users-admin";

export const dynamic = "force-dynamic";

export default function UsersPage() {
  return (
    <AppShell eyebrow="Admin" title="540A house members" requireAdmin>
      <CalendarSyncCard />
      <UsersAdmin />
    </AppShell>
  );
}
