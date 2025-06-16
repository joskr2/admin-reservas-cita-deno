import { type AppointmentStatus } from "../../types/index.ts";

export function getStatusColor(status: AppointmentStatus): string {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "scheduled":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "in_progress":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "completed":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    case "cancelled":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
}

export function getStatusText(status: AppointmentStatus): string {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "scheduled":
      return "Programada";
    case "in_progress":
      return "En Progreso";
    case "completed":
      return "Completada";
    case "cancelled":
      return "Cancelada";
    default:
      return "Desconocido";
  }
}

export function getNextStatuses(
  currentStatus: AppointmentStatus,
): AppointmentStatus[] {
  switch (currentStatus) {
    case "pending":
      return ["scheduled", "cancelled"];
    case "scheduled":
      return ["in_progress", "cancelled"];
    case "in_progress":
      return ["completed", "cancelled"];
    case "completed":
      return [];
    case "cancelled":
      return [];
    default:
      return [];
  }
}
