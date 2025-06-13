import { useState } from "preact/hooks";
import {
  type Appointment,
  type AppointmentStatus,
  type AppointmentStatusHistory,
} from "../types/index.ts";
import { Icon } from "../components/ui/Icon.tsx";
import { Button } from "../components/ui/Button.tsx";
import Modal from "../components/ui/Modal.tsx";
import {
  getStatusColor,
  getStatusText,
} from "../lib/utils/appointmentUtils.ts";

interface AppointmentDetailsModalProps {
  appointment: Appointment;
  isCompact?: boolean;
}

export default function AppointmentDetailsModal({
  appointment,
  isCompact = false,
}: AppointmentDetailsModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Crear historial completo incluyendo el estado actual si no existe
  const fullHistory: AppointmentStatusHistory[] = [
    // Estado inicial (creación)
    {
      status: "pending" as AppointmentStatus,
      changedAt: appointment.createdAt,
      notes: "Cita creada",
    },
    // Historial existente
    ...(appointment.statusHistory || []),
    // Estado actual si no está en el historial
    ...(appointment.statusHistory?.some((h) => h.status === appointment.status)
      ? []
      : [
          {
            status: appointment.status,
            changedAt: appointment.updatedAt || appointment.createdAt,
            notes: "Estado actual",
          },
        ]),
  ].sort(
    (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime()
  );

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Botón para abrir modal */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        class="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
        title="Ver detalles de la cita"
      >
        <Icon name="eye" size={isCompact ? 12 : 14} className="text-current" />
      </button>

      {/* Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Detalles de la Cita"
        size="lg"
      >
        <div class="space-y-6">
          {/* Información principal de la cita */}
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Información General
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                  ID: {appointment.id}
                </p>
              </div>
              <div class="flex items-center">
                <span
                  class={`inline-flex px-3 py-1.5 text-sm font-medium rounded-full ${getStatusColor(
                    appointment.status
                  )}`}
                >
                  {getStatusText(appointment.status)}
                </span>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-3">
                <div class="flex items-center space-x-3">
                  <Icon
                    name="user"
                    size={18}
                    className="text-blue-600 dark:text-blue-400"
                  />
                  <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Paciente
                    </p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {appointment.patientName}
                    </p>
                  </div>
                </div>

                <div class="flex items-center space-x-3">
                  <Icon
                    name="user-cog"
                    size={18}
                    className="text-green-600 dark:text-green-400"
                  />
                  <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Psicólogo
                    </p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {appointment.psychologistName ||
                        appointment.psychologistEmail}
                    </p>
                  </div>
                </div>

                <div class="flex items-center space-x-3">
                  <Icon
                    name="briefcase"
                    size={18}
                    className="text-purple-600 dark:text-purple-400"
                  />
                  <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Sala
                    </p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      Sala {appointment.roomId}
                    </p>
                  </div>
                </div>
              </div>

              <div class="space-y-3">
                <div class="flex items-center space-x-3">
                  <Icon
                    name="calendar"
                    size={18}
                    className="text-orange-600 dark:text-orange-400"
                  />
                  <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Fecha
                    </p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(appointment.appointmentDate).toLocaleDateString(
                        "es-ES",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>

                <div class="flex items-center space-x-3">
                  <Icon
                    name="clock"
                    size={18}
                    className="text-red-600 dark:text-red-400"
                  />
                  <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Hora
                    </p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {formatTime(`2000-01-01T${appointment.appointmentTime}`)}
                    </p>
                  </div>
                </div>

                <div class="flex items-center space-x-3">
                  <Icon
                    name="activity"
                    size={18}
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Creada
                    </p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDateTime(appointment.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {appointment.notes && (
              <div class="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Observaciones
                </p>
                <p class="text-sm text-gray-700 dark:text-gray-300">
                  {appointment.notes}
                </p>
              </div>
            )}
          </div>

          {/* Historial de estados */}
          <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Icon
                name="activity"
                size={20}
                className="mr-2 text-gray-600 dark:text-gray-400"
              />
              Historial de Estados
            </h3>

            <div class="space-y-4 max-h-64 overflow-y-auto">
              {fullHistory.map((historyItem, index) => (
                <div
                  key={`${historyItem.status}-${historyItem.changedAt}-${index}`}
                  class="flex items-start space-x-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  {/* Timeline indicator */}
                  <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                    {index + 1}
                  </div>

                  {/* Content */}
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-2">
                      <span
                        class={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          historyItem.status
                        )}`}
                      >
                        {getStatusText(historyItem.status)}
                      </span>
                      <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {formatTime(historyItem.changedAt)}
                      </span>
                    </div>

                    <p class="text-sm text-gray-700 dark:text-gray-300 mb-1">
                      <strong>{getStatusText(historyItem.status)}</strong> -{" "}
                      {appointment.psychologistName ||
                        appointment.psychologistEmail}{" "}
                      con {appointment.patientName} en Sala {appointment.roomId}
                    </p>

                    {historyItem.notes && (
                      <p class="text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-700 p-2 rounded mt-2">
                        💬 {historyItem.notes}
                      </p>
                    )}

                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      📅 {formatDateTime(historyItem.changedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones rápidas */}
          <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center space-x-3">
              <a href={`/appointments/edit/${appointment.id}`}>
                <Button variant="primary" leftIcon="edit" size="sm">
                  Editar Cita
                </Button>
              </a>
              <a href={`/appointments/${appointment.id}`}>
                <Button variant="secondary" leftIcon="eye" size="sm">
                  Ver Completa
                </Button>
              </a>
            </div>

            <Button
              type="button"
              onClick={() => setIsOpen(false)}
              variant="outline"
              size="sm"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
