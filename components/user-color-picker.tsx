"use client";

import { useState, type FormEvent } from "react";
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
  showPinForm = false,
  onPinChange,
}: {
  user: HouseUser | Pick<HouseUser, "id" | "name" | "role" | "color">;
  tasks?: Pick<CleaningTask, "assignedTo">[];
  size?: "sm" | "md" | "lg";
  align?: "left" | "right";
  description?: string;
  onUserChange?: (user: Pick<HouseUser, "id" | "name" | "role" | "color">) => void;
  onUsersChange?: (users: HouseUser[]) => void;
  showPinForm?: boolean;
  onPinChange?: (pin: string) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pin, setPin] = useState("");
  const [pinMessage, setPinMessage] = useState("");

  function isFourDigitPin(value: string) {
    return /^\d{4}$/.test(value);
  }

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

  async function handlePinSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isFourDigitPin(pin) || !onPinChange) {
      setPinMessage("Enter a 4-digit PIN.");
      return;
    }

    setIsSaving(true);
    setPinMessage("");

    try {
      await onPinChange(pin);
      setPin("");
      setPinMessage("PIN updated.");
    } catch (error) {
      setPinMessage(error instanceof Error ? error.message : "PIN update failed.");
    } finally {
      setIsSaving(false);
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
          className={`absolute top-[calc(100%+0.75rem)] z-30 w-80 max-w-[calc(100vw-2rem)] rounded-3xl border border-slate-200 bg-white p-3 text-left shadow-soft ${align === "right" ? "right-0" : "left-0"}`}
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

          {showPinForm ? (
            <form className="mt-4 border-t border-slate-100 pt-4" onSubmit={handlePinSubmit}>
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                PIN
              </p>
              <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                <input
                  className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold tracking-[0.3em] outline-none focus:border-roof-600"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="0000"
                  type="password"
                  value={pin}
                  onChange={(event) => {
                    setPin(event.target.value.replace(/\D/g, ""));
                    setPinMessage("");
                  }}
                />
                <button
                  className="rounded-full bg-roof-800 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!isFourDigitPin(pin) || isSaving}
                  type="submit"
                >
                  Save
                </button>
              </div>
              {pinMessage ? (
                <p className="mt-2 text-xs font-bold text-slate-600">
                  {pinMessage}
                </p>
              ) : null}
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
