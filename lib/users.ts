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
    id: "red",
    label: "Red",
    className: "bg-material-red-100 text-material-red-700 ring-material-red-500/30",
  },
  {
    id: "pink",
    label: "Pink",
    className: "bg-material-pink-100 text-material-pink-700 ring-material-pink-500/30",
  },
  {
    id: "purple",
    label: "Purple",
    className: "bg-material-purple-100 text-material-purple-700 ring-material-purple-500/30",
  },
  {
    id: "indigo",
    label: "Indigo",
    className: "bg-material-indigo-100 text-material-indigo-700 ring-material-indigo-500/30",
  },
  {
    id: "blue",
    label: "Blue",
    className: "bg-material-blue-100 text-material-blue-700 ring-material-blue-500/30",
  },
  {
    id: "teal",
    label: "Teal",
    className: "bg-material-teal-100 text-material-teal-700 ring-material-teal-500/30",
  },
  {
    id: "green",
    label: "Green",
    className: "bg-material-green-100 text-material-green-700 ring-material-green-500/30",
  },
  {
    id: "amber",
    label: "Amber",
    className: "bg-material-amber-100 text-material-amber-700 ring-material-amber-500/30",
  },
  {
    id: "orange",
    label: "Orange",
    className: "bg-material-orange-100 text-material-orange-700 ring-material-orange-500/30",
  },
  {
    id: "brown",
    label: "Brown",
    className: "bg-material-brown-100 text-material-brown-700 ring-material-brown-500/30",
  },
] as const;

export type UserColorId = (typeof userColorOptions)[number]["id"];

export function getUserColorClass(color?: string, role?: HouseUser["role"]) {
  const colorClass = userColorOptions.find(
    (option) => option.id === color,
  )?.className;

  if (colorClass) {
    return colorClass;
  }

  if (role === "admin") {
    return "bg-roof-800 text-white ring-roof-800";
  }

  return userColorOptions.find((option) => option.id === "blue")?.className ?? userColorOptions[0].className;
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
    color: "blue",
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
      color: user.color ?? (user.role === "admin" ? undefined : "blue"),
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
