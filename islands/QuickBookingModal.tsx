import { useState, useEffect } from "preact/hooks";
import { Icon } from "../components/ui/Icon.tsx";
import type { PatientProfile, Room } from "../types/index.ts";

interface QuickBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  time: string;
  roomId?: string | undefined;
  patients: PatientProfile[];
  rooms: Room[];
  psychologistEmail: string;
}

export default function QuickBookingModal({
  isOpen,
  onClose,
  date,
  time,
  roomId,
  patients,
  rooms,
  psychologistEmail: _psychologistEmail,
}: QuickBookingModalProps) {
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState(roomId || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPatientId("");
      setSelectedRoomId(roomId || "");
      setError("");
      setSuccess("");
      setSearchTerm("");
    }
  }, [isOpen, roomId]);

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour || "0");
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${minute || "00"} ${period}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Filtrar pacientes según el rol del usuario
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Filtrar salas disponibles
  const availableRooms = rooms.filter(room => room.isAvailable);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    if (!selectedPatientId) {
      setError("Por favor selecciona un paciente");
      return;
    }

    if (!selectedRoomId) {
      setError("Por favor selecciona una sala");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("date", date);
      formData.append("time", time);
      formData.append("roomId", selectedRoomId);
      formData.append("patientId", selectedPatientId);

      const response = await fetch("/api/appointments/quick-book", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          onClose();
          // Recargar la página para reflejar los cambios
          globalThis.location.reload();
        }, 2000);
      } else {
        setError(result.error || "Error al agendar la cita");
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[95vh] overflow-y-auto mx-2 sm:mx-4">
        {/* Header */}
        <div class="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Agendar Cita Rápida
          </h3>
          <button
            type="button"
            onClick={onClose}
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 sm:p-2"
          >
            <Icon name="x" size={24} />
          </button>
        </div>

        {/* Body */}
        <div class="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Appointment Details */}
          <div class="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <h4 class="font-medium text-blue-900 dark:text-blue-200 mb-2 text-sm sm:text-base">
              Detalles de la Cita
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-blue-800 dark:text-blue-300">
              <p><strong>Fecha:</strong> {formatDate(date)}</p>
              <p><strong>Hora:</strong> {formatTime(time)} - {formatTime(calculateEndTime(time))}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} class="space-y-4 sm:space-y-6">
            {/* Room Selection */}
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seleccionar Sala
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {availableRooms.map((room) => (
                  <label
                    key={room.id}
                    class={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedRoomId === room.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="room"
                      value={room.id}
                      checked={selectedRoomId === room.id}
                      onChange={(e) => setSelectedRoomId((e.target as HTMLInputElement).value)}
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div class="ml-3 flex-1">
                      <div class="font-medium text-gray-900 dark:text-white text-sm">
                        {room.name}
                      </div>
                      {room.description && (
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {room.description}
                        </div>
                      )}
                      <div class="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        Sala #{room.id}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              
              {availableRooms.length === 0 && (
                <div class="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                  No hay salas disponibles en este momento
                </div>
              )}
            </div>

            {/* Patient Search */}
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar Paciente
              </label>
              <div class="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
                  placeholder="Buscar por nombre o email..."
                  class="w-full px-3 py-2 pl-10 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <Icon name="search" size={18} className="absolute left-3 top-2.5 text-gray-400" />
              </div>
            </div>

            {/* Patient Selection */}
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seleccionar Paciente
              </label>
              <div class="max-h-48 sm:max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md">
                {filteredPatients.length === 0 ? (
                  <div class="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    <Icon name="user" size={32} className="mx-auto mb-2 text-gray-300" />
                    {searchTerm ? "No se encontraron pacientes" : "No hay pacientes disponibles"}
                  </div>
                ) : (
                  <div class="divide-y divide-gray-200 dark:divide-gray-600">
                    {filteredPatients.map((patient) => (
                      <label
                        key={patient.id}
                        class={`flex items-center p-3 sm:p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          selectedPatientId === patient.id ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="patient"
                          value={patient.id}
                          checked={selectedPatientId === patient.id}
                          onChange={(e) => setSelectedPatientId((e.target as HTMLInputElement).value)}
                          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 flex-shrink-0"
                        />
                        <div class="ml-3 flex-1 min-w-0">
                          <div class="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                            {patient.name}
                          </div>
                          {patient.email && (
                            <div class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                              {patient.email}
                            </div>
                          )}
                          {patient.dni && (
                            <div class="text-xs text-gray-500 dark:text-gray-400">
                              DNI: {patient.dni}
                            </div>
                          )}
                        </div>
                        {selectedPatientId === patient.id && (
                          <Icon name="check-circle" size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div class="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
                <div class="flex items-start">
                  <Icon name="alert-circle" size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div class="ml-3 flex-1">
                    <p class="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div class="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md">
                <div class="flex items-start">
                  <Icon name="check-circle" size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <div class="ml-3 flex-1">
                    <p class="text-sm text-green-800 dark:text-green-200">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div class="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                class="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !selectedPatientId || !selectedRoomId || success !== ""}
                class="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                {isLoading && (
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {isLoading ? "Agendando..." : "Agendar Cita"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function calculateEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHour = (hours || 0) + 1; // Sesiones de 1 hora por defecto
  return `${endHour.toString().padStart(2, '0')}:${(minutes || 0).toString().padStart(2, '0')}`;
}