import { Icon } from "../ui/Icon.tsx";
import { Badge } from "../ui/Badge.tsx";
import type { Appointment, AppointmentStatus } from "../../types/index.ts";

interface RecentActivityProps {
  appointments: Appointment[];
  maxItems?: number;
  showHeader?: boolean;
}

interface ActivityItem {
  id: string;
  type: "appointment_created" | "appointment_updated" | "appointment_completed";
  title: string;
  description: string;
  timestamp: string;
  status?: AppointmentStatus;
  icon: string;
  iconColor: string;
}

export default function RecentActivity({
  appointments,
  maxItems = 5,
  showHeader = true,
}: RecentActivityProps) {
  // Convertir citas en elementos de actividad
  const getActivityItems = (): ActivityItem[] => {
    const items: ActivityItem[] = [];

    // Agregar citas recientes (creadas en los últimos días)
    const recentAppointments = appointments
      .filter((apt) => {
        const createdDate = new Date(apt.createdAt);
        const daysDiff =
          (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7; // Últimos 7 días
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, maxItems);

    recentAppointments.forEach((apt) => {
      // Actividad de creación
      items.push({
        id: `created-${apt.id}`,
        type: "appointment_created",
        title: "Nueva cita programada",
        description: `Cita con ${apt.patientName} para el ${new Date(
          apt.appointmentDate
        ).toLocaleDateString("es-ES")}`,
        timestamp: apt.createdAt,
        status: apt.status,
        icon: "calendar-plus",
        iconColor: "text-green-600",
      });

      // Actividad de cambios de estado (si hay historial)
      if (apt.statusHistory && apt.statusHistory.length > 0) {
        const lastStatusChange =
          apt.statusHistory[apt.statusHistory.length - 1];
        if (lastStatusChange) {
          items.push({
            id: `updated-${apt.id}-${lastStatusChange.changedAt}`,
            type: "appointment_updated",
            title: "Estado de cita actualizado",
            description: `Cita con ${apt.patientName} cambió a ${getStatusText(
              lastStatusChange.status
            )}`,
            timestamp: lastStatusChange.changedAt,
            status: lastStatusChange.status,
            icon: "activity",
            iconColor: getStatusIconColor(lastStatusChange.status),
          });
        }
      }

      // Actividad de completado
      if (apt.status === "completed") {
        items.push({
          id: `completed-${apt.id}`,
          type: "appointment_completed",
          title: "Cita completada",
          description: `Sesión con ${apt.patientName} finalizada exitosamente`,
          timestamp: apt.updatedAt || apt.createdAt,
          status: apt.status,
          icon: "check",
          iconColor: "text-blue-600",
        });
      }
    });

    // Ordenar por timestamp y limitar
    return items
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, maxItems);
  };

  const getStatusText = (status: AppointmentStatus): string => {
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
  };

  const getStatusIconColor = (status: AppointmentStatus): string => {
    switch (status) {
      case "pending":
        return "text-yellow-600";
      case "scheduled":
        return "text-blue-600";
      case "in_progress":
        return "text-purple-600";
      case "completed":
        return "text-green-600";
      case "cancelled":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const formatRelativeTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Hace un momento";
    if (diffInMinutes < 60)
      return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? "s" : ""}`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
      return `Hace ${diffInHours} hora${diffInHours > 1 ? "s" : ""}`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7)
      return `Hace ${diffInDays} día${diffInDays > 1 ? "s" : ""}`;

    return date.toLocaleDateString("es-ES");
  };

  const activityItems = getActivityItems();

  if (activityItems.length === 0) {
    return (
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {showHeader && (
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Icon
              name="activity"
              size={20}
              className="mr-2 text-gray-600 dark:text-gray-400"
            />
            Actividad Reciente
          </h3>
        )}
        <div class="text-center py-8">
          <Icon
            name="activity"
            size={48}
            className="mx-auto text-gray-300 dark:text-gray-600 mb-4"
          />
          <p class="text-gray-500 dark:text-gray-400">
            No hay actividad reciente
          </p>
        </div>
      </div>
    );
  }

  return (
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {showHeader && (
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Icon
              name="activity"
              size={20}
              className="mr-2 text-gray-600 dark:text-gray-400"
            />
            Actividad Reciente
          </h3>
          <a
            href="/appointments"
            class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Ver todas las citas →
          </a>
        </div>
      )}

      <div class="space-y-4">
        {activityItems.map((item) => (
          <div
            key={item.id}
            class="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            {/* Icono */}
            <div class="flex-shrink-0">
              <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Icon name={item.icon} size={16} className={item.iconColor} />
              </div>
            </div>

            {/* Contenido */}
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {item.title}
                </p>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  {formatRelativeTime(item.timestamp)}
                </span>
              </div>
              <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {item.description}
              </p>
              {item.status && (
                <div class="mt-2">
                  <Badge variant={item.status} size="sm">
                    {getStatusText(item.status)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {activityItems.length === maxItems && (
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <a
            href="/appointments"
            class="block text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Ver más actividad
          </a>
        </div>
      )}
    </div>
  );
}
