import type { HouseUser } from "@/lib/tasks";
import { getUserColorClass } from "@/lib/users";

export function UserAvatar({
  user,
  size = "md",
}: {
  user: Pick<HouseUser, "name" | "role" | "color">;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "h-14 w-14 text-xl" : size === "sm" ? "h-9 w-9 text-sm" : "h-11 w-11 text-base";

  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full font-black shadow-sm ring-1 ${sizeClass} ${getUserColorClass(user.color, user.role)}`}>
      {user.name.slice(0, 1)}
    </div>
  );
}
