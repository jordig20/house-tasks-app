"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { UserAvatar } from "@/components/user-avatar";
import { getLoggedInUser, getUserRequestHeaders } from "@/lib/auth";
import type { HouseUser } from "@/lib/tasks";
import {
  getUserColorClass,
  userColorOptions,
  type UserColorId,
} from "@/lib/users";

type UsersResponse = {
  users?: Pick<HouseUser, "id" | "name" | "role" | "color">[];
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
  showEmailForm = false,
  onEmailChange,
  onEmailPreferencesChange,
  forceOpen = false,
  pinReminder,
  emailReminder,
  onClose,
}: {
  user: HouseUser | Pick<HouseUser, "id" | "name" | "role" | "color" | "email" | "emailRemindersEnabled" | "eveningRemindersEnabled">;
  size?: "sm" | "md" | "lg";
  description?: string;
  onUserChange?: (user: Pick<HouseUser, "id" | "name" | "role" | "color">) => void;
  onUsersChange?: (users: Pick<HouseUser, "id" | "name" | "role" | "color">[]) => void;
  showPinForm?: boolean;
  onPinChange?: (pin: string, currentPin: string) => Promise<void>;
  showEmailForm?: boolean;
  onEmailChange?: (email: string, currentPin: string) => Promise<void>;
  onEmailPreferencesChange?: (preferences: {
    emailRemindersEnabled?: boolean;
    eveningRemindersEnabled?: boolean;
  }, currentPin: string) => Promise<void>;
  forceOpen?: boolean;
  pinReminder?: string;
  emailReminder?: string;
  onClose?: () => void;
}) {
  const [isManuallyOpen, setIsManuallyOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pin, setPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [pinMessage, setPinMessage] = useState("");
  const [email, setEmail] = useState(user.email ?? "");
  const [emailMessage, setEmailMessage] = useState("");
  const [colorMessage, setColorMessage] = useState("");
  const isOpen = forceOpen || isManuallyOpen;

  function closeModal() {
    setIsManuallyOpen(false);
    onClose?.();
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsManuallyOpen(false);
        onClose?.();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  function isFourDigitPin(value: string) {
    return /^\d{4}$/.test(value);
  }

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleColorChange(color: UserColorId) {
    const currentUser = getLoggedInUser();
    const pinProof = window.prompt("Enter your PIN to confirm this color change.");

    if (!pinProof) {
      setColorMessage("PIN is required to change color.");
      return;
    }

    setIsSaving(true);
    setColorMessage("");

    try {
      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getUserRequestHeaders(currentUser) },
        body: JSON.stringify({
          userId: user.id,
          color,
          ...(currentUser?.role === "admin" ? { actorPin: pinProof } : { currentPin: pinProof }),
        }),
      });
      const result = (await response.json()) as UsersResponse;
      const nextUsers = result.users ?? [];
      const updatedUser = nextUsers.find((nextUser) => nextUser.id === user.id);

      if (!response.ok || !result.users) {
        throw new Error(result.message ?? "Color update failed.");
      }

      onUsersChange?.(result.users);

      if (updatedUser) {
        onUserChange?.({ ...user, color: updatedUser.color });
      }

      setIsManuallyOpen(false);
    } catch (error) {
      setColorMessage(error instanceof Error ? error.message : "Color update failed.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePinSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isFourDigitPin(pin) || !onPinChange) {
      setPinMessage("Enter a 4-digit PIN.");
      return;
    }

    if (pin === "0000") {
      setPinMessage("Choose a private PIN instead of 0000.");
      return;
    }

    if (!isFourDigitPin(currentPin)) {
      setPinMessage("Enter your current PIN to confirm this change.");
      return;
    }

    setIsSaving(true);
    setPinMessage("");

    try {
      await onPinChange(pin, currentPin);
      setPin("");
      setCurrentPin("");
      setPinMessage("PIN updated.");
      setIsManuallyOpen(false);
    } catch (error) {
      setPinMessage(error instanceof Error ? error.message : "PIN update failed.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail) || !onEmailChange) {
      setEmailMessage("Enter a valid email address.");
      return;
    }

    if (!isFourDigitPin(currentPin)) {
      setEmailMessage("Enter your current PIN to confirm this change.");
      return;
    }

    setIsSaving(true);
    setEmailMessage("");

    try {
      await onEmailChange(normalizedEmail, currentPin);
      setEmail(normalizedEmail);
      setEmailMessage("Email saved.");
    } catch (error) {
      setEmailMessage(error instanceof Error ? error.message : "Email update failed.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEmailPreferenceChange(
    preferences: Parameters<NonNullable<typeof onEmailPreferencesChange>>[0],
  ) {
    if (!onEmailPreferencesChange) {
      return;
    }

    if (!isFourDigitPin(currentPin)) {
      setEmailMessage("Enter your current PIN to confirm this change.");
      return;
    }

    setIsSaving(true);
    setEmailMessage("");

    try {
      await onEmailPreferencesChange(preferences, currentPin);
    } catch (error) {
      setEmailMessage(error instanceof Error ? error.message : "Email settings update failed.");
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
            onClick={closeModal}
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
                onClick={closeModal}
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
              {colorMessage ? (
                <p className="mt-2 text-xs font-bold text-slate-600">
                  {colorMessage}
                </p>
              ) : null}
            </div>

            {showPinForm ? (
              <form className="mt-4 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100" onSubmit={handlePinSubmit}>
                <p className="font-ui text-xs font-black uppercase tracking-wide text-slate-500">
                  PIN
                </p>
                {pinReminder ? (
                  <p className="mt-2 rounded-2xl bg-amber-100 px-3 py-2 text-sm font-bold text-amber-950 ring-1 ring-amber-200">
                    {pinReminder}
                  </p>
                ) : null}
                <div className="mt-2 space-y-2">
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold tracking-[0.3em] outline-none focus:border-slate-950"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="Current PIN"
                    type="password"
                    value={currentPin}
                    onChange={(event) => {
                      setCurrentPin(event.target.value.replace(/\D/g, ""));
                      setPinMessage("");
                    }}
                  />
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <input
                      className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold tracking-[0.3em] outline-none focus:border-slate-950"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="New PIN"
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
                </div>
                {pinMessage ? (
                  <p className="mt-2 text-xs font-bold text-slate-600">
                    {pinMessage}
                  </p>
                ) : null}
              </form>
            ) : null}

            {showEmailForm ? (
              <form className="mt-4 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100" onSubmit={handleEmailSubmit}>
                <p className="font-ui text-xs font-black uppercase tracking-wide text-slate-500">
                  Email reminders
                </p>
                {emailReminder ? (
                  <p className="mt-2 rounded-2xl bg-cyan-100 px-3 py-2 text-sm font-bold text-cyan-950 ring-1 ring-cyan-200">
                    {emailReminder}
                  </p>
                ) : null}
                <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                  <input
                    className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-slate-950"
                    inputMode="email"
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setEmailMessage("");
                    }}
                  />
                  <button
                    className="rounded-full bg-slate-950 px-4 py-2 font-ui text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!isValidEmail(email.trim()) || isSaving}
                    type="submit"
                  >
                    Save
                  </button>
                </div>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold tracking-[0.3em] outline-none focus:border-slate-950"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Current PIN"
                  type="password"
                  value={currentPin}
                  onChange={(event) => {
                    setCurrentPin(event.target.value.replace(/\D/g, ""));
                    setEmailMessage("");
                  }}
                />
                <div className="mt-3 space-y-2">
                  <label className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
                    <span>Morning task emails</span>
                    <input
                      checked={user.emailRemindersEnabled ?? true}
                      disabled={isSaving}
                      type="checkbox"
                      onChange={(event) =>
                        handleEmailPreferenceChange({
                          emailRemindersEnabled: event.target.checked,
                        })
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
                    <span>Evening pending follow-up</span>
                    <input
                      checked={user.eveningRemindersEnabled ?? true}
                      disabled={isSaving || !(user.emailRemindersEnabled ?? true)}
                      type="checkbox"
                      onChange={(event) =>
                        handleEmailPreferenceChange({
                          eveningRemindersEnabled: event.target.checked,
                        })
                      }
                    />
                  </label>
                </div>
                {emailMessage ? (
                  <p className="mt-2 text-xs font-bold text-slate-600">
                    {emailMessage}
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
        onClick={() => {
          if (isOpen) {
            closeModal();
            return;
          }

          setIsManuallyOpen(true);
        }}
        aria-expanded={isOpen}
        aria-label={`Edit ${user.name}'s profile settings`}
        title="Edit profile settings"
      >
        <UserAvatar user={user} size={size} />
      </button>
      {modal}
    </div>
  );
}
