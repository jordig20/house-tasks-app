"use client";

import type { HouseUser } from "@/lib/tasks";
import { storageKeys } from "@/lib/tasks";

export type LoggedInUser = Omit<HouseUser, "pin"> & {
  mustChangePin?: boolean;
  mustAddEmail?: boolean;
};

export function saveLoggedInUser(user: LoggedInUser) {
  window.localStorage.setItem(storageKeys.currentUser, JSON.stringify(user));
}

export function getUserRequestHeaders(user: Pick<LoggedInUser, "id"> | null): Record<string, string> {
  return user ? { "x-house-user-id": user.id } : {};
}

export function getLoggedInUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = window.localStorage.getItem(storageKeys.currentUser);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as LoggedInUser;
  } catch {
    window.localStorage.removeItem(storageKeys.currentUser);
    return null;
  }
}

export function clearLoggedInUser() {
  window.localStorage.removeItem(storageKeys.currentUser);
}
