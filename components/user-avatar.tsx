import type { HouseUser } from "@/lib/tasks";

const avatarColors = {
  admin: "bg-sage-700 text-white",
  member: "bg-white text-sage-700 ring-1 ring-sage-200",
};

export function UserAvatar({ user, size = "md" }: { user: Pick<HouseUser, "name" | "role">; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-14 w-14 text-xl" : size === "sm" ? "h-9 w-9 text-sm" : "h-11 w-11 text-base";

  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full font-black shadow-sm ${sizeClass} ${avatarColors[user.role]}`}>
      {user.name.slice(0, 1)}
    </div>
  );
}
