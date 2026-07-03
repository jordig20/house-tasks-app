import { HomeGate } from "@/components/home-gate";
import { getStoredHouseUsers } from "@/lib/user-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const users = await getStoredHouseUsers();

  return <HomeGate users={users} />;
}
