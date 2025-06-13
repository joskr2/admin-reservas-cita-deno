import { useState } from "preact/hooks";
import { type AppointmentStatus } from "../types/index.ts";
import {
  getNextStatuses,
  getStatusColor,
  getStatusText,
} from "../lib/utils/appointmentUtils.ts";

interface AppointmentStatusSelectorProps {
  appointmentId: string;
  currentStatus: AppointmentStatus;
}

export default function AppointmentStatusSelector({
  appointmentId,
  currentStatus,
}: AppointmentStatusSelectorProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const availableStatuses = getNextStatuses(currentStatus);

  // Función para obtener solo el color del texto (sin fondo)
  const getStatusTextColor = (status: AppointmentStatus): string => {
    switch (status) {
      case "pending":
        return "text-yellow-700 dark:text-yellow-400";
      case "scheduled":
        return "text-blue-700 dark:text-blue-400";
      case "in_progress":
        return "text-purple-700 dark:text-purple-400";
      case "completed":
        return "text-green-700 dark:text-green-400";
      case "cancelled":
        return "text-red-700 dark:text-red-400";
      default:
        return "text-gray-700 dark:text-gray-400";
    }
  };

  const handleStatusChange = async (newStatus: AppointmentStatus) => {
    if (confirm(`¿Cambiar estado a "${getStatusText(newStatus)}"?`)) {
      setIsUpdating(true);
      setShowMobileModal(false);
      try {
        const response = await fetch(
          `/api/appointments/${appointmentId}/update`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: newStatus,
            }),
          }
        );

        if (response.ok) {
          globalThis.location.reload();
        } else {
          alert("Error al actualizar el estado");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Error al actualizar el estado");
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleSelectChange = async (e: Event) => {
    const target = e.target as HTMLSelectElement;
    const newStatus = target.value as AppointmentStatus;

    if (newStatus !== currentStatus) {
      await handleStatusChange(newStatus);
    }
  };

  // Obtener colores base del estado actual
  const statusColorClass = getStatusColor(currentStatus);

  return (
    <>
      {/* Versión Desktop - Select normal */}
      <div class="hidden sm:block relative w-auto min-w-[140px]">
        <select
          value={currentStatus}
          onChange={handleSelectChange}
          disabled={isUpdating}
          title="Cambiar estado de la cita"
          class={`
            appearance-none cursor-pointer
            px-3 py-2 pr-10
            text-sm font-medium
            border border-gray-300 dark:border-gray-600 rounded-lg
            bg-transparent
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-all duration-200
            w-full
            ${getStatusTextColor(currentStatus)}
            ${
              isUpdating
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-gray-400 dark:hover:border-gray-500"
            }
          `}
        >
          <option value={currentStatus} class="bg-white text-gray-900 py-2">
            {getStatusText(currentStatus)}
          </option>
          {availableStatuses
            .filter((status) => status !== currentStatus)
            .map((status) => (
              <option
                key={status}
                value={status}
                class="bg-white text-gray-900 py-2 hover:bg-gray-50"
              >
                {getStatusText(status)}
              </option>
            ))}
        </select>

        {/* Icono de dropdown */}
        <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            class="h-4 w-4 text-current opacity-70"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {/* Indicador de carga desktop */}
        {isUpdating && (
          <div class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-md">
            <div class="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Versión Mobile - Botón que abre modal */}
      <div class="sm:hidden">
        <button
          type="button"
          onClick={() => setShowMobileModal(true)}
          disabled={isUpdating}
          class={`
            w-full px-3 py-2 text-sm font-medium rounded-lg
            border border-transparent
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-all duration-200
            ${statusColorClass}
            ${
              isUpdating
                ? "opacity-50 cursor-not-allowed"
                : "hover:shadow-md active:scale-95"
            }
          `}
        >
          <div class="flex items-center justify-between">
            <span>{getStatusText(currentStatus)}</span>
            {isUpdating ? (
              <div class="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
            ) : (
              <svg
                class="h-4 w-4 text-current opacity-70"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </div>
        </button>
      </div>

      {/* Modal para móvil */}
      {showMobileModal && (
        <div class="fixed inset-0 z-50 sm:hidden">
          {/* Overlay */}
          <div
            class="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileModal(false)}
          ></div>

          {/* Modal content */}
          <div class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-xl shadow-xl">
            <div class="p-4">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  Cambiar Estado
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMobileModal(false)}
                  title="Cerrar modal"
                  class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg
                    class="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div class="space-y-2">
                {/* Estado actual */}
                <div
                  class={`p-3 rounded-lg border-2 border-blue-500 ${statusColorClass}`}
                >
                  <div class="flex items-center justify-between">
                    <span class="font-medium">
                      {getStatusText(currentStatus)}
                    </span>
                    <span class="text-xs opacity-75">Estado actual</span>
                  </div>
                </div>

                {/* Estados disponibles */}
                {availableStatuses
                  .filter((status) => status !== currentStatus)
                  .map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatusChange(status)}
                      class={`w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${getStatusColor(
                        status
                      )}`}
                    >
                      <span class="font-medium">{getStatusText(status)}</span>
                    </button>
                  ))}
              </div>

              <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  type="button"
                  onClick={() => setShowMobileModal(false)}
                  class="w-full px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
