import { LoginScreen } from "@/components/login-screen";
import { getStoredHouseUsers } from "@/lib/user-store";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const users = await getStoredHouseUsers();

  return <LoginScreen users={users} />;
}
