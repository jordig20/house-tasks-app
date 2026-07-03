import type { HouseUser } from "@/lib/tasks";

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
