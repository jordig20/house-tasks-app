"use client";

import type { HouseUser } from "@/lib/tasks";
import { mockUsers, storageKeys } from "@/lib/tasks";

export type LoggedInUser = Omit<HouseUser, "pin">;

function toLoggedInUser(user: HouseUser): LoggedInUser {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
  };
}

export function validateMockLogin(userId: string, pin: string) {
  const user = mockUsers.find((candidate) => candidate.id === userId);

  if (!user || user.pin !== pin) {
    return null;
  }

  return toLoggedInUser(user);
}

export function saveLoggedInUser(user: LoggedInUser) {
  window.localStorage.setItem(storageKeys.currentUser, JSON.stringify(user));
}

export function getLoggedInUser() {
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
