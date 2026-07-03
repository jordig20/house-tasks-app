"use client";

import { useState } from "react";
import { UserAvatar } from "@/components/user-avatar";
import type { CleaningTask, HouseUser } from "@/lib/tasks";
import {
  getUserColorClass,
  userColorOptions,
  type UserColorId,
} from "@/lib/users";

type UsersResponse = {
  users?: HouseUser[];
  message?: string;
};

export function UserColorPicker({
  user,
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
  const [isSaving, setIsSaving] = useState(false);

  async function handleColorChange(color: UserColorId) {
    setIsSaving(true);
    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, color }),
    });
    const result = (await response.json()) as UsersResponse;
    const nextUsers = result.users ?? [];
    const updatedUser = nextUsers.find((nextUser) => nextUser.id === user.id);

    setIsSaving(false);
    setIsOpen(false);

    if (response.ok && result.users) {
      onUsersChange?.(result.users);
    }

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
                  disabled={isSaving}
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
