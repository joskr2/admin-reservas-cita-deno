import { useState, useEffect } from "preact/hooks";
import { Icon } from "../components/ui/Icon.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Input } from "../components/ui/Input.tsx";
import { Select } from "../components/ui/Select.tsx";
import PatientSearchSelect from "./PatientSearchSelect.tsx";
import type {
  UserProfile,
  Room,
  RoomId,
  AppointmentStatus,
} from "../types/index.ts";

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
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

interface FormData {
  patientName: string;
  psychologistEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  roomId: RoomId | "";
  status: AppointmentStatus;
  notes: string;
}

interface FormErrors {
  patientName?: string;
  psychologistEmail?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  roomId?: string;
  status?: string;
  notes?: string;
  general?: string;
}

export default function AppointmentForm({
  psychologists,
  rooms,
  currentUserRole = "psychologist",
  currentUserEmail = "",
  initialData,
  mode = "create",
  onSubmit,
  onCancel,
}: AppointmentFormProps) {
  const [formData, setFormData] = useState<FormData>({
    patientName: initialData?.patientName || "",
    psychologistEmail: initialData?.psychologistEmail || currentUserEmail,
    appointmentDate: initialData?.appointmentDate || "",
    appointmentTime: initialData?.appointmentTime || "",
    roomId: initialData?.roomId || "",
    status: initialData?.status || "pending",
    notes: initialData?.notes || "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<Room[]>(rooms);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Verificar disponibilidad de salas cuando cambian fecha/hora
  useEffect(() => {
    if (formData.appointmentDate && formData.appointmentTime) {
      checkRoomAvailability();
    }
  }, [formData.appointmentDate, formData.appointmentTime]);

  const checkRoomAvailability = async () => {
    setIsCheckingAvailability(true);
    try {
      const response = await fetch(
        `/api/rooms/available?date=${formData.appointmentDate}&time=${
          formData.appointmentTime
        }${initialData?.id ? `&exclude=${initialData.id}` : ""}`
      );

      if (response.ok) {
        const available = await response.json();
        setAvailableRooms(available);

        // Si la sala seleccionada ya no está disponible, limpiar selección
        if (
          formData.roomId &&
          !available.some((r: Room) => r.id === formData.roomId)
        ) {
          setFormData((prev: FormData) => ({ ...prev, roomId: "" }));
          setErrors((prev: FormErrors) => ({
            ...prev,
            roomId:
              "La sala seleccionada ya no está disponible en este horario",
          }));
        }
      }
    } catch (error) {
      console.error("Error checking room availability:", error);
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validar nombre del paciente
    if (!formData.patientName.trim()) {
      newErrors.patientName = "El nombre del paciente es requerido";
    } else if (formData.patientName.trim().length < 2) {
      newErrors.patientName = "El nombre debe tener al menos 2 caracteres";
    }

    // Validar psicólogo
    if (!formData.psychologistEmail) {
      newErrors.psychologistEmail = "Debe seleccionar un psicólogo";
    }

    // Validar fecha
    if (!formData.appointmentDate) {
      newErrors.appointmentDate = "La fecha es requerida";
    } else {
      const selectedDate = new Date(formData.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.appointmentDate =
          "No se pueden programar citas en fechas pasadas";
      }
    }

    // Validar hora
    if (!formData.appointmentTime) {
      newErrors.appointmentTime = "La hora es requerida";
    } else {
      const timeParts = formData.appointmentTime.split(":");
      const hours = parseInt(timeParts[0] || "0", 10);
      const minutes = parseInt(timeParts[1] || "0", 10);

      if (
        isNaN(hours) ||
        isNaN(minutes) ||
        hours < 8 ||
        hours > 18 ||
        (hours === 18 && minutes > 0)
      ) {
        newErrors.appointmentTime = "El horario debe estar entre 08:00 y 18:00";
      }
    }

    // Validar sala
    if (!formData.roomId) {
      newErrors.roomId = "Debe seleccionar una sala";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev: FormData) => ({ ...prev, [field]: value }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors((prev: FormErrors) => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePatientSelect = (patientName: string) => {
    handleInputChange("patientName", patientName);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const url =
        mode === "edit" && initialData?.id
          ? `/api/appointments/${initialData.id}/update`
          : "/api/appointments/create";

      const method = mode === "edit" ? "PUT" : "POST";

      const submitData = {
        ...formData,
        ...(mode === "edit" && initialData?.id ? { id: initialData.id } : {}),
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        if (onSubmit) {
          onSubmit(submitData);
        } else {
          // Redirigir a la lista de citas
          window.location.href = "/appointments";
        }
      } else {
        const errorData = await response.json();
        setErrors({ general: errorData.error || "Error al guardar la cita" });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrors({ general: "Error de conexión. Intente nuevamente." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) break; // No permitir después de 18:00
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        options.push(timeString);
      }
    }
    return options;
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      {/* Error general */}
      {errors.general && (
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div class="flex items-center">
            <Icon
              name="file-warning"
              size={20}
              className="text-red-600 dark:text-red-400 mr-2"
            />
            <p class="text-sm text-red-600 dark:text-red-400">
              {errors.general}
            </p>
          </div>
        </div>
      )}

      {/* Nombre del paciente */}
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nombre del Paciente *
        </label>
        <PatientSearchSelect
          name="patientName"
          value={formData.patientName}
          placeholder="Buscar o escribir nombre del paciente..."
          required
          onPatientSelect={handlePatientSelect}
        />
        {errors.patientName && (
          <p class="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.patientName}
          </p>
        )}
      </div>

      {/* Psicólogo */}
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Psicólogo *
        </label>
        <Select
          value={formData.psychologistEmail}
          onChange={(e) =>
            handleInputChange(
              "psychologistEmail",
              (e.target as HTMLSelectElement).value
            )
          }
          error={!!errors.psychologistEmail}
          disabled={currentUserRole === "psychologist"}
        >
          <option value="">Seleccionar psicólogo...</option>
          {psychologists.map((psychologist) => (
            <option key={psychologist.email} value={psychologist.email}>
              {psychologist.name || psychologist.email}
            </option>
          ))}
        </Select>
        {errors.psychologistEmail && (
          <p class="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.psychologistEmail}
          </p>
        )}
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
            value={formData.appointmentDate}
            onChange={(e) =>
              handleInputChange(
                "appointmentDate",
                (e.target as HTMLInputElement).value
              )
            }
            error={!!errors.appointmentDate}
            min={new Date().toISOString().split("T")[0]}
          />
          {errors.appointmentDate && (
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.appointmentDate}
            </p>
          )}
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hora *
          </label>
          <Select
            value={formData.appointmentTime}
            onChange={(e) =>
              handleInputChange(
                "appointmentTime",
                (e.target as HTMLSelectElement).value
              )
            }
            error={!!errors.appointmentTime}
          >
            <option value="">Seleccionar hora...</option>
            {generateTimeOptions().map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </Select>
          {errors.appointmentTime && (
            <p class="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.appointmentTime}
            </p>
          )}
        </div>
      </div>

      {/* Sala */}
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Sala *
          {isCheckingAvailability && (
            <span class="ml-2 text-xs text-blue-600 dark:text-blue-400">
              Verificando disponibilidad...
            </span>
          )}
        </label>
        <Select
          value={formData.roomId}
          onChange={(e) =>
            handleInputChange("roomId", (e.target as HTMLSelectElement).value)
          }
          error={!!errors.roomId}
          disabled={isCheckingAvailability}
        >
          <option value="">Seleccionar sala...</option>
          {availableRooms.map((room: Room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </Select>
        {errors.roomId && (
          <p class="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.roomId}
          </p>
        )}
        {availableRooms.length === 0 &&
          formData.appointmentDate &&
          formData.appointmentTime && (
            <p class="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
              No hay salas disponibles en este horario
            </p>
          )}
      </div>

      {/* Estado (solo en modo edición para superadmin) */}
      {mode === "edit" && currentUserRole === "superadmin" && (
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Estado
          </label>
          <Select
            value={formData.status}
            onChange={(e) =>
              handleInputChange(
                "status",
                (e.target as HTMLSelectElement).value as AppointmentStatus
              )
            }
          >
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
          value={formData.notes}
          onChange={(e) =>
            handleInputChange("notes", (e.target as HTMLTextAreaElement).value)
          }
          rows={3}
          class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 text-sm"
          placeholder="Observaciones adicionales sobre la cita..."
        />
      </div>

      {/* Botones */}
      <div class="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}

        <Button
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting || isCheckingAvailability}
        >
          <Icon name="check" size={16} className="mr-2" />
          {mode === "edit" ? "Actualizar Cita" : "Crear Cita"}
        </Button>
      </div>
    </form>
  );
}
