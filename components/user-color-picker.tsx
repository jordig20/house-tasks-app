"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
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
  description,
  onUserChange,
  onUsersChange,
  showPinForm = false,
  onPinChange,
}: {
  user: HouseUser | Pick<HouseUser, "id" | "name" | "role" | "color">;
  tasks?: Pick<CleaningTask, "assignedTo">[];
  size?: "sm" | "md" | "lg";
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

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

  const modal = isOpen
    ? createPortal(
        <div className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-slate-950/55 px-4 py-[max(1rem,env(safe-area-inset-top))] backdrop-blur-sm">
          <button
            type="button"
            className="fixed inset-0 cursor-default"
            aria-label="Close profile settings"
            onClick={() => setIsOpen(false)}
          />
          <section
            className="relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[2rem] border border-white/20 bg-white p-5 text-left shadow-[0_30px_90px_rgba(15,23,42,0.35)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`profile-settings-${user.id}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar user={user} size="lg" />
                <div className="min-w-0">
                  <h2 id={`profile-settings-${user.id}`} className="truncate font-display text-xl font-bold text-slate-950">
                    {user.name}
                  </h2>
                  <p className="font-ui text-sm font-bold capitalize text-slate-500">
                    {user.role}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-full bg-slate-100 px-3 py-2 font-ui text-xs font-black text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-5 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <p className="font-ui text-xs font-black uppercase tracking-wide text-slate-500">
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
                      className={`flex h-11 items-center justify-center rounded-full font-ui text-sm font-black ring-2 transition hover:scale-105 ${getUserColorClass(color.id, user.role)} ${isSelected ? "ring-slate-950" : "ring-transparent"}`}
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

            {showPinForm ? (
              <form className="mt-4 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100" onSubmit={handlePinSubmit}>
                <p className="font-ui text-xs font-black uppercase tracking-wide text-slate-500">
                  PIN
                </p>
                <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                  <input
                    className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold tracking-[0.3em] outline-none focus:border-slate-950"
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
                    className="rounded-full bg-slate-950 px-4 py-2 font-ui text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
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
          </section>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        className="rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        aria-expanded={isOpen}
        aria-label={`Edit ${user.name}'s color`}
        title="Edit color"
      >
        <UserAvatar user={user} size={size} />
      </button>
      {modal}
    </div>
  );
}
