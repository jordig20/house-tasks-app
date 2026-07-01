import {
  adminUser,
  getUserIdFromName,
  storageKeys,
  type CleaningTask,
  type HouseUser,
} from "@/lib/tasks";

export const defaultMemberPin = "0000";
export const userColorOptions = [
  {
    id: "cream",
    label: "Cream",
    className: "bg-cream-100 text-roof-800 ring-cream-200",
  },
  {
    id: "roof",
    label: "Roof",
    className: "bg-roof-800 text-white ring-roof-800",
  },
  {
    id: "olive",
    label: "Olive",
    className: "bg-olive-100 text-olive-700 ring-olive-600/20",
  },
  {
    id: "sage",
    label: "Sage",
    className: "bg-sage-100 text-sage-700 ring-sage-500/20",
  },
  {
    id: "terracotta",
    label: "Clay",
    className: "bg-terracotta text-white ring-terracotta",
  },
  {
    id: "coral",
    label: "Coral",
    className: "bg-coral text-roof-800 ring-coral",
  },
  {
    id: "slate",
    label: "Slate",
    className: "bg-slate-100 text-slate-700 ring-slate-200",
  },
] as const;

export type UserColorId = (typeof userColorOptions)[number]["id"];

export function getUserColorClass(color?: string, role?: HouseUser["role"]) {
  if (role === "admin") {
    return "bg-roof-800 text-white ring-roof-800";
  }

  return (
    userColorOptions.find((option) => option.id === color)?.className ??
    userColorOptions[0].className
  );
}

export function getAssigneeNamesFromTasks(
  tasks: Pick<CleaningTask, "assignedTo">[],
) {
  const names = new Map<string, string>();

  tasks.forEach((task) => {
    task.assignedTo.forEach((name) => {
      const trimmedName = name.trim();

      if (trimmedName) {
        names.set(trimmedName.toLowerCase(), trimmedName);
      }
    });
  });

  return Array.from(names.values()).sort((firstName, secondName) =>
    firstName.localeCompare(secondName),
  );
}

export function createUserFromName(name: string): HouseUser {
  return {
    id: getUserIdFromName(name),
    name,
    role: "member",
    pin: defaultMemberPin,
    color: "cream",
  };
}

export function mergeUsersWithTaskAssignees(
  existingUsers: HouseUser[],
  tasks: Pick<CleaningTask, "assignedTo">[],
) {
  const usersByName = new Map(
    existingUsers.map((user) => [user.name.toLowerCase(), user]),
  );
  const usersById = new Map(existingUsers.map((user) => [user.id, user]));
  const mergedUsers = [...existingUsers];

  getAssigneeNamesFromTasks(tasks).forEach((name) => {
    if (usersByName.has(name.toLowerCase())) {
      return;
    }

    const newUser = createUserFromName(name);
    let uniqueId = newUser.id;
    let suffix = 2;

    while (usersById.has(uniqueId)) {
      uniqueId = `${newUser.id}-${suffix}`;
      suffix += 1;
    }

    const uniqueUser = { ...newUser, id: uniqueId };
    usersById.set(uniqueUser.id, uniqueUser);
    usersByName.set(uniqueUser.name.toLowerCase(), uniqueUser);
    mergedUsers.push(uniqueUser);
  });

  return mergedUsers.sort((firstUser, secondUser) => {
    if (firstUser.role !== secondUser.role) {
      return firstUser.role === "admin" ? -1 : 1;
    }

    return firstUser.name.localeCompare(secondUser.name);
  });
}

export function getInitialHouseUsers(
  tasks: Pick<CleaningTask, "assignedTo">[] = [],
) {
  return mergeUsersWithTaskAssignees([adminUser], tasks);
}

function readStoredUsers() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUsers = window.localStorage.getItem(storageKeys.users);

  if (!storedUsers) {
    return null;
  }

  try {
    return JSON.parse(storedUsers) as HouseUser[];
  } catch {
    window.localStorage.removeItem(storageKeys.users);
    return null;
  }
}

export function saveHouseUsers(users: HouseUser[]) {
  window.localStorage.setItem(storageKeys.users, JSON.stringify(users));
}

export function getHouseUsers(tasks: Pick<CleaningTask, "assignedTo">[] = []) {
  const storedUsers = readStoredUsers();
  const adminPin =
    storedUsers?.find(
      (user) =>
        user.id === adminUser.id ||
        (user.role === "admin" && user.id === "jordi"),
    )?.pin ?? adminUser.pin;
  const assignableNames = new Set(
    getAssigneeNamesFromTasks(tasks).map((name) => name.toLowerCase()),
  );
  const storedCalendarUsers = (storedUsers ?? []).filter((user) => {
    if (user.role === "admin") {
      return false;
    }

    if (assignableNames.size === 0) {
      return true;
    }

    return assignableNames.has(user.name.toLowerCase());
  });
  const baseUsers = [{ ...adminUser, pin: adminPin }, ...storedCalendarUsers];
  const mergedUsers = mergeUsersWithTaskAssignees(baseUsers, tasks).map(
    (user) => ({
      ...user,
      color: user.color ?? "cream",
    }),
  );

  if (typeof window !== "undefined") {
    saveHouseUsers(mergedUsers);
  }

  return mergedUsers;
}

export function updateUserPin(
  userId: string,
  pin: string,
  tasks: Pick<CleaningTask, "assignedTo">[] = [],
) {
  const users = getHouseUsers(tasks).map((user) =>
    user.id === userId ? { ...user, pin } : user,
  );
  saveHouseUsers(users);
  return users;
}

function getAssignmentGroupForUser(
  userId: string,
  tasks: Pick<CleaningTask, "assignedTo">[] = [],
) {
  const userName = userId.toLowerCase();
  const matchingPair = tasks.find((task) => {
    const assignedUserIds = task.assignedTo.map(getUserIdFromName);

    return assignedUserIds.length > 1 && assignedUserIds.includes(userName);
  });

  if (!matchingPair) {
    return [userId];
  }

  return matchingPair.assignedTo.map(getUserIdFromName);
}

export function updateUserColor(
  userId: string,
  color: UserColorId,
  tasks: Pick<CleaningTask, "assignedTo">[] = [],
) {
  const groupUserIds = new Set(getAssignmentGroupForUser(userId, tasks));
  const users = getHouseUsers(tasks).map((user) =>
    groupUserIds.has(user.id) ? { ...user, color } : user,
  );
  saveHouseUsers(users);

  if (typeof window !== "undefined") {
    const storedUser = window.localStorage.getItem(storageKeys.currentUser);

    if (storedUser) {
      try {
        const currentUser = JSON.parse(storedUser) as Omit<HouseUser, "pin">;

        if (groupUserIds.has(currentUser.id)) {
          window.localStorage.setItem(
            storageKeys.currentUser,
            JSON.stringify({ ...currentUser, color }),
          );
        }
      } catch {
        window.localStorage.removeItem(storageKeys.currentUser);
      }
    }
  }

  return users;
}
