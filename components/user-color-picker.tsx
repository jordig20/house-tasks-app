"use client";

import { useState } from "react";
import { UserAvatar } from "@/components/user-avatar";
import type { CleaningTask, HouseUser } from "@/lib/tasks";
import {
  getUserColorClass,
  updateUserColor,
  userColorOptions,
  type UserColorId,
} from "@/lib/users";

export function UserColorPicker({
  user,
  tasks = [],
  size = "md",
  align = "right",
  description,
  onUserChange,
  onUsersChange,
}: {
  user: HouseUser | Pick<HouseUser, "id" | "name" | "role" | "color">;
  tasks?: Pick<CleaningTask, "assignedTo">[];
  size?: "sm" | "md" | "lg";
  align?: "left" | "right";
  description?: string;
  onUserChange?: (user: Pick<HouseUser, "id" | "name" | "role" | "color">) => void;
  onUsersChange?: (users: HouseUser[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  function handleColorChange(color: UserColorId) {
    const nextUsers = updateUserColor(user.id, color, tasks);
    const updatedUser = nextUsers.find((nextUser) => nextUser.id === user.id);

    setIsOpen(false);
    onUsersChange?.(nextUsers);

    if (updatedUser) {
      onUserChange?.(updatedUser);
    }
  }

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        className="rounded-full focus:outline-none focus:ring-2 focus:ring-roof-800/30"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        aria-expanded={isOpen}
        aria-label={`Edit ${user.name}'s color`}
        title="Edit color"
      >
        <UserAvatar user={user} size={size} />
      </button>

      {isOpen ? (
        <div
          className={`absolute top-[calc(100%+0.75rem)] z-30 w-72 rounded-3xl border border-slate-200 bg-white p-3 text-left shadow-soft ${align === "right" ? "right-0" : "left-0"}`}
        >
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            Color
          </p>
          {description ? (
            <p className="mt-1 text-xs font-bold text-slate-600">
              {description}
            </p>
          ) : null}
          <div className="mt-3 grid grid-cols-5 gap-2">
            {userColorOptions.map((color) => {
              const isSelected = user.color === color.id;

              return (
                <button
                  key={color.id}
                  type="button"
                  className={`flex h-10 items-center justify-center rounded-full text-sm font-black ring-2 transition hover:scale-105 ${getUserColorClass(color.id, user.role)} ${isSelected ? "ring-roof-800" : "ring-transparent"}`}
                  onClick={() => handleColorChange(color.id)}
                  aria-label={`Set color to ${color.label}`}
                  title={color.label}
                >
                  {user.name.slice(0, 1)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
