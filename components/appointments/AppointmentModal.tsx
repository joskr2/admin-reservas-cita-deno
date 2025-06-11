import { Icon } from "../ui/Icon.tsx";
import { Badge } from "../ui/Badge.tsx";
import { Button } from "../ui/Button.tsx";
import Modal from "../ui/Modal.tsx";
import type { Appointment, AppointmentStatus } from "../../types/index.ts";

interface AppointmentModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: string;
  currentUserEmail?: string;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (appointment: Appointment) => void;
  onStatusChange?: (
    appointment: Appointment,
    newStatus: AppointmentStatus
  ) => void;
}

export default function AppointmentModal({
  appointment,
  isOpen,
  onClose,
  currentUserRole = "psychologist",
  currentUserEmail = "",
  onEdit,
  onDelete,
  onStatusChange,
}: AppointmentModalProps) {
  if (!appointment) return null;

  const getStatusColor = (status: AppointmentStatus): string => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "in_progress":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const canEdit = () => {
    return (
      currentUserRole === "superadmin" ||
      (currentUserRole === "psychologist" &&
        appointment.psychologistEmail === currentUserEmail)
    );
  };

  const canDelete = () => {
    return currentUserRole === "superadmin";
  };

  const canChangeStatus = () => {
    return (
      currentUserRole === "superadmin" ||
      (currentUserRole === "psychologist" &&
        appointment.psychologistEmail === currentUserEmail)
    );
  };

  const getAvailableStatusTransitions = (): AppointmentStatus[] => {
    switch (appointment.status) {
      case "pending":
        return ["scheduled", "cancelled"];
      case "scheduled":
        return ["in_progress", "completed", "cancelled"];
      case "in_progress":
        return ["completed", "cancelled"];
      case "completed":
        return []; // No se puede cambiar desde completada
      case "cancelled":
        return ["scheduled"]; // Solo se puede reprogramar
      default:
        return [];
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div class="p-6">
        {/* Header */}
        <div class="flex items-start justify-between mb-6">
          <div class="flex-1">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Detalles de la Cita
            </h2>
            <div class="flex items-center space-x-2">
              <Badge className={getStatusColor(appointment.status)}>
                {getStatusText(appointment.status)}
              </Badge>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                ID: {appointment.id}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            title="Cerrar modal"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <Icon name="x" size={24} />
          </button>
        </div>

        {/* Información principal */}
        <div class="space-y-4 mb-6">
          {/* Paciente */}
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Icon
                  name="user"
                  size={20}
                  className="text-blue-600 dark:text-blue-400"
                />
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                Paciente
              </p>
              <p class="text-lg text-gray-700 dark:text-gray-300">
                {appointment.patientName}
              </p>
            </div>
          </div>

          {/* Psicólogo */}
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Icon
                  name="user-cog"
                  size={20}
                  className="text-green-600 dark:text-green-400"
                />
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                Psicólogo
              </p>
              <p class="text-lg text-gray-700 dark:text-gray-300">
                {appointment.psychologistEmail}
              </p>
            </div>
          </div>

          {/* Fecha y hora */}
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <Icon
                  name="calendar"
                  size={20}
                  className="text-purple-600 dark:text-purple-400"
                />
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                Fecha y Hora
              </p>
              <p class="text-lg text-gray-700 dark:text-gray-300">
                {formatDate(appointment.appointmentDate)}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {formatTime(appointment.appointmentTime)}
              </p>
            </div>
          </div>

          {/* Sala */}
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                <Icon
                  name="briefcase"
                  size={20}
                  className="text-orange-600 dark:text-orange-400"
                />
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                Sala
              </p>
              <p class="text-lg text-gray-700 dark:text-gray-300">
                {appointment.roomId}
              </p>
            </div>
          </div>

          {/* Notas */}
          {appointment.notes && (
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 mt-1">
                <div class="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Icon
                    name="file-digit"
                    size={20}
                    className="text-gray-600 dark:text-gray-400"
                  />
                </div>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Observaciones
                </p>
                <p class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  {appointment.notes}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Cambio de estado rápido */}
        {canChangeStatus() && getAvailableStatusTransitions().length > 0 && (
          <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p class="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Cambiar Estado
            </p>
            <div class="flex flex-wrap gap-2">
              {getAvailableStatusTransitions().map((status) => (
                <button
                  key={status}
                  onClick={() => onStatusChange?.(appointment, status)}
                  class={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${getStatusColor(
                    status
                  )} hover:opacity-80`}
                >
                  {getStatusText(status)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div class="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>

          {canEdit() && (
            <Button variant="outline" onClick={() => onEdit?.(appointment)}>
              <Icon name="edit" size={16} className="mr-2" />
              Editar
            </Button>
          )}

          {canDelete() && (
            <Button variant="danger" onClick={() => onDelete?.(appointment)}>
              <Icon name="trash-2" size={16} className="mr-2" />
              Eliminar
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
