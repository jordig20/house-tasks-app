"use client";

import type { HouseUser } from "@/lib/tasks";
import { storageKeys } from "@/lib/tasks";
import { getHouseUsers } from "@/lib/users";

export type LoggedInUser = Omit<HouseUser, "pin">;

function toLoggedInUser(user: HouseUser): LoggedInUser {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    color: user.color,
  };
}

export function validateLocalLogin(userId: string, pin: string) {
  const user = getHouseUsers().find((candidate) => candidate.id === userId);

  if (!user || user.pin !== pin) {
    return null;
  }

  return toLoggedInUser(user);
}

export function saveLoggedInUser(user: LoggedInUser) {
  window.localStorage.setItem(storageKeys.currentUser, JSON.stringify(user));
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
