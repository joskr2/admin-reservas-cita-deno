import { Icon } from "../ui/Icon.tsx";
import { Button } from "../ui/Button.tsx";
import { Input } from "../ui/Input.tsx";
import { Select } from "../ui/Select.tsx";
import type {
  AppointmentStatus,
  Room,
  RoomId,
  UserProfile,
} from "../../types/index.ts";

interface AppointmentFormProps {
  psychologists: UserProfile[];
  rooms: Room[];
  currentUserRole?: string;
  currentUserEmail?: string;
  initialData?: {
    id?: string;
    patientName?: string;
    psychologistEmail?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    roomId?: RoomId;
    status?: AppointmentStatus;
    notes?: string;
  };
  mode?: "create" | "edit";
  error?: string;
  action?: string;
  method?: string;
}

export default function AppointmentForm({
  psychologists,
  rooms,
  currentUserRole = "psychologist",
  currentUserEmail = "",
  initialData,
  mode = "create",
  error,
  action = "/api/appointments/create",
  method = "POST",
}: AppointmentFormProps) {
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) break; // No permitir después de 18:00
        const timeString = `${hour.toString().padStart(2, "0")}:${
          minute
            .toString()
            .padStart(2, "0")
        }`;
        options.push(timeString);
      }
    }
    return options;
  };

  return (
    <form method={method} action={action} class="space-y-6">
      {/* Error general */}
      {error && (
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div class="flex items-center">
            <Icon
              name="file-warning"
              size={20}
              className="text-red-600 dark:text-red-400 mr-2"
            />
            <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* ID oculto para edición */}
      {mode === "edit" && initialData?.id && (
        <input type="hidden" name="id" value={initialData.id} />
      )}

      {/* Nombre del paciente */}
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nombre del Paciente *
        </label>
        <Input
          type="text"
          name="patientName"
          value={initialData?.patientName || ""}
          placeholder="Nombre completo del paciente"
          required
        />
      </div>

      {/* Psicólogo */}
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Psicólogo *
        </label>
        <Select
          name="psychologistEmail"
          value={initialData?.psychologistEmail || currentUserEmail}
          disabled={currentUserRole === "psychologist"}
          required
        >
          <option value="">Seleccionar psicólogo...</option>
          {psychologists.map((psychologist) => (
            <option key={psychologist.email} value={psychologist.email}>
              {psychologist.name || psychologist.email}
            </option>
          ))}
        </Select>
        {currentUserRole === "psychologist" && (
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Como psicólogo, solo puedes crear citas para ti mismo
          </p>
        )}
      </div>

      {/* Fecha y hora */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fecha *
          </label>
          <Input
            type="date"
            name="appointmentDate"
            value={initialData?.appointmentDate || ""}
            min={new Date().toISOString().split("T")[0]}
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hora *
          </label>
          <Select
            name="appointmentTime"
            value={initialData?.appointmentTime || ""}
            required
          >
            <option value="">Seleccionar hora...</option>
            {generateTimeOptions().map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Sala */}
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Sala *
        </label>
        <Select name="roomId" value={initialData?.roomId || ""} required>
          <option value="">Seleccionar sala...</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Estado (solo en modo edición para superadmin) */}
      {mode === "edit" && currentUserRole === "superadmin" && (
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Estado
          </label>
          <Select name="status" value={initialData?.status || "pending"}>
            <option value="pending">Pendiente</option>
            <option value="scheduled">Programada</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completada</option>
            <option value="cancelled">Cancelada</option>
          </Select>
        </div>
      )}

      {/* Notas */}
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Observaciones
        </label>
        <textarea
          name="notes"
          rows={3}
          class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 text-sm"
          placeholder="Observaciones adicionales sobre la cita..."
        >
          {initialData?.notes || ""}
        </textarea>
      </div>

      {/* Botones */}
      <div class="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        <a
          href="/appointments"
          class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Cancelar
        </a>

        <Button type="submit">
          <Icon name="check" size={16} className="mr-2" />
          {mode === "edit" ? "Actualizar Cita" : "Crear Cita"}
        </Button>
      </div>
    </form>
  );
}
