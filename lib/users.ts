import {
  adminUser,
  storageKeys,
  type CleaningTask,
  type HouseUser,
} from "@/lib/tasks";

export const defaultMemberPin = "0000";

function slugifyUserName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
    id: slugifyUserName(name),
    name,
    role: "member",
    pin: defaultMemberPin,
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
  const storedCalendarUsers = (storedUsers ?? []).filter(
    (user) =>
      user.role !== "admin" && assignableNames.has(user.name.toLowerCase()),
  );
  const baseUsers = [{ ...adminUser, pin: adminPin }, ...storedCalendarUsers];
  const mergedUsers = mergeUsersWithTaskAssignees(baseUsers, tasks);

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
