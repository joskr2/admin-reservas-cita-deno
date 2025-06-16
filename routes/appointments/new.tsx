import { type FreshContext, type PageProps } from "$fresh/server.ts";
import {
  type Appointment,
  type AppState,
  type Patient,
  type Room,
  type RoomId,
  type UserProfile,
} from "../../types/index.ts";
import { Icon } from "../../components/ui/Icon.tsx";
import { Button } from "../../components/ui/Button.tsx";
import { Input } from "../../components/ui/Input.tsx";
import { Select } from "../../components/ui/Select.tsx";
import {
  createAppointment,
  getAllRooms,
  getAllUsers,
} from "../../lib/kv.ts";
import { getPatientRepository } from "../../lib/database/index.ts";
import PatientSelect from "../../islands/PatientSelect.tsx";
import Toast from "../../islands/Toast.tsx";
import { extractUserContext, logger } from "../../lib/logger.ts";
import {
  checkAppointmentConflicts,
} from "../../lib/utils/conflictValidation.ts";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  const requestId = ctx.state.requestId || "unknown";
  const userContext = extractUserContext(ctx.state.user);

  logger.info(
    "APPOINTMENTS_NEW",
    `Handler called with method: ${req.method}`,
    {
      method: req.method,
      url: req.url,
      user: ctx.state.user,
    },
    { requestId, ...userContext },
  );

  if (req.method === "GET") {
    const url = new URL(req.url);
    const autoFill = url.searchParams.get("autoFill") === "true";
    const prefilledData = autoFill
      ? {
        patientName: url.searchParams.get("patientName") || "",
        psychologistEmail: url.searchParams.get("psychologistEmail") || "",
        appointmentDate: url.searchParams.get("appointmentDate") || "",
        startTime: url.searchParams.get("startTime") || "",
        endTime: url.searchParams.get("endTime") || "",
        roomId: url.searchParams.get("roomId") || "",
        notes: url.searchParams.get("notes") || "",
      }
      : undefined;
    logger.debug(
      "APPOINTMENTS_NEW",
      "Processing GET request for new appointment form",
      {},
      { requestId, ...userContext },
    );
    const kv = await Deno.openKv();

    try {
      const users = await getAllUsers();
      let psychologists = users
        .filter((user) => user.role === "psychologist")
        .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));

      // Si es psicólogo, solo puede crear citas para sí mismo
      if (ctx.state.user?.role === "psychologist") {
        psychologists = psychologists.filter(
          (psychologist) => psychologist.email === ctx.state.user?.email,
        );
      }

      // Obtener todas las salas
      const rooms = await getAllRooms();

      // Obtener todos los pacientes
      const patientRepository = getPatientRepository();
      const patients = await patientRepository.getAll();

      return ctx.render({
        psychologists,
        rooms,
        patients,
        currentUserRole: ctx.state.user?.role,
        currentUserEmail: ctx.state.user?.email,
        formData: prefilledData,
      });
    } finally {
      await kv.close();
    }
  }

  if (req.method === "POST") {
    logger.info(
      "APPOINTMENTS_NEW",
      "Processing POST request for appointment creation",
      {},
      { requestId, ...userContext },
    );

    const formData = await req.formData();
    const patientName = formData.get("patientName")?.toString();
    const psychologistEmail = formData.get("psychologistEmail")?.toString();
    const appointmentDate = formData.get("appointmentDate")?.toString();
    const startTime = formData.get("startTime")?.toString();
    const endTime = formData.get("endTime")?.toString();
    const roomId = formData.get("roomId")?.toString() as RoomId;
    const notes = formData.get("notes")?.toString();

    logger.debug("APPOINTMENTS_NEW", "Form data extracted", {
      patientName,
      psychologistEmail,
      appointmentDate,
      startTime,
      endTime,
      roomId,
      notes,
      hasPatientName: !!patientName,
      hasPsychologistEmail: !!psychologistEmail,
      hasDate: !!appointmentDate,
      hasStartTime: !!startTime,
      hasEndTime: !!endTime,
      hasRoomId: !!roomId,
    }, { requestId, ...userContext });

    // Validación de permisos: psicólogos solo pueden crear citas para sí mismos
    if (
      ctx.state.user?.role === "psychologist" &&
      psychologistEmail !== ctx.state.user.email
    ) {
      logger.warn(
        "APPOINTMENTS_NEW",
        "Permission denied: psychologist trying to assign appointment to another psychologist",
        {
          currentUserEmail: ctx.state.user.email,
          requestedPsychologistEmail: psychologistEmail,
        },
        { requestId, ...userContext },
      );
      const kv = await Deno.openKv();
      try {
        const users = await getAllUsers();
        let psychologists = users
          .filter((user) => user.role === "psychologist")
          .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));

        psychologists = psychologists.filter(
          (psychologist) => psychologist.email === ctx.state.user?.email,
        );

        const rooms = await getAllRooms();

        // Obtener todos los pacientes
        const patientRepository = getPatientRepository();
        const patients = await patientRepository.getAll();

        return ctx.render({
          psychologists,
          rooms,
          patients,
          currentUserRole: ctx.state.user?.role,
          currentUserEmail: ctx.state.user?.email,
          error: "No tienes permisos para asignar citas a otros psicólogos",
        });
      } finally {
        await kv.close();
      }
    }

    if (
      !patientName ||
      !psychologistEmail ||
      !appointmentDate ||
      !startTime ||
      !endTime ||
      !roomId
    ) {
      logger.warn(
        "APPOINTMENTS_NEW",
        "Validation failed: missing required fields",
        {
          missingFields: {
            patientName: !patientName,
            psychologistEmail: !psychologistEmail,
            appointmentDate: !appointmentDate,
            startTime: !startTime,
            endTime: !endTime,
            roomId: !roomId,
          },
        },
        { requestId, ...userContext },
      );
      const kv = await Deno.openKv();
      try {
        const users = await getAllUsers();
        let psychologists = users
          .filter((user) => user.role === "psychologist")
          .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));

        // Si es psicólogo, solo puede crear citas para sí mismo
        if (ctx.state.user?.role === "psychologist") {
          psychologists = psychologists.filter(
            (psychologist) => psychologist.email === ctx.state.user?.email,
          );
        }

        const rooms = await getAllRooms();

        // Obtener todos los pacientes
        const patientRepository = getPatientRepository();
        const patients = await patientRepository.getAll();

        return ctx.render({
          psychologists,
          rooms,
          patients,
          currentUserRole: ctx.state.user?.role,
          currentUserEmail: ctx.state.user?.email,
          error: "Todos los campos son requeridos",
        });
      } finally {
        await kv.close();
      }
    }

    // Verificar conflictos antes de crear la cita
    const conflictCheck = await checkAppointmentConflicts(
      appointmentDate,
      startTime,
      endTime,
      psychologistEmail,
      roomId,
      patientName,
    );

    logger.debug("APPOINTMENTS_NEW", "Conflict check result", {
      hasConflicts: conflictCheck.hasConflicts,
      conflictTypes: conflictCheck.conflicts.map((c) => c.type),
      conflictDetails: conflictCheck.conflicts,
    }, { requestId, ...userContext });

    if (conflictCheck.hasConflicts) {
      logger.warn(
        "APPOINTMENTS_NEW",
        "Conflicts detected",
        {
          conflicts: conflictCheck.conflicts,
        },
        { requestId, ...userContext },
      );

      // Crear mensaje simple para el toast
      const firstConflict = conflictCheck.conflicts[0];
      let conflictMessage = "Horario ocupado";
      
      if (firstConflict?.type === "room" && firstConflict.conflictingAppointment) {
        const appointment = firstConflict.conflictingAppointment;
        const roomName = appointment.roomName || `Sala ${appointment.roomId}`;
        const psychologistName = appointment.psychologistName || appointment.psychologistEmail;
        const startTime = appointment.startTime || appointment.appointmentTime;
        const endTime = appointment.endTime || appointment.appointmentTime;
        
        conflictMessage = `${roomName} tomada por ${psychologistName}, desde las ${startTime}-${endTime}. Intenta otra fecha o sala.`;
      }

      const kv = await Deno.openKv();
      try {
        const users = await getAllUsers();
        let psychologists = users
          .filter((user) => user.role === "psychologist")
          .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));

        if (ctx.state.user?.role === "psychologist") {
          psychologists = psychologists.filter(
            (psychologist) => psychologist.email === ctx.state.user?.email,
          );
        }

        const rooms = await getAllRooms();
        const patientRepository = getPatientRepository();
        const patients = await patientRepository.getAll();

        return ctx.render({
          psychologists,
          rooms,
          patients,
          currentUserRole: ctx.state.user?.role,
          currentUserEmail: ctx.state.user?.email,
          conflictMessage,
          formData: {
            patientName,
            psychologistEmail,
            appointmentDate,
            startTime,
            endTime,
            roomId,
            notes,
          },
        });
      } finally {
        await kv.close();
      }
    }

    const kv = await Deno.openKv();

    try {
      // Obtener el nombre del psicólogo
      const psychologist = await getAllUsers().then((users) =>
        users.find((user) => user.email === psychologistEmail)
      );

      const appointmentData: Appointment = {
        id: crypto.randomUUID(),
        patientName,
        psychologistEmail,
        psychologistName: psychologist?.name || psychologist?.email ||
          undefined,
        appointmentDate,
        appointmentTime: startTime, // Mantener compatibilidad temporal
        startTime,
        endTime,
        roomId,
        status: "pending" as const,
        notes,
        createdAt: new Date().toISOString(),
      };

      logger.info(
        "APPOINTMENTS_NEW",
        "Attempting to create appointment",
        {
          appointmentId: appointmentData.id,
          patientName,
          psychologistEmail,
          psychologistName: appointmentData.psychologistName,
          appointmentDate,
          startTime,
          endTime,
          roomId,
        },
        { requestId, ...userContext },
      );

      const success = await createAppointment(appointmentData);

      logger.info("APPOINTMENTS_NEW", "Appointment creation result", {
        appointmentId: appointmentData.id,
        success,
      }, { requestId, ...userContext });

      if (success) {
        logger.info(
          "APPOINTMENTS_NEW",
          "Appointment created successfully, redirecting to appointments list",
          {
            appointmentId: appointmentData.id,
          },
          { requestId, ...userContext },
        );
        return new Response(null, {
          status: 303,
          headers: { Location: "/appointments" },
        });
      } else {
        logger.error("APPOINTMENTS_NEW", "Failed to create appointment", {
          appointmentId: appointmentData.id,
          appointmentData,
        }, { requestId, ...userContext });
        const users = await getAllUsers();
        let psychologists = users
          .filter((user) => user.role === "psychologist")
          .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));

        if (ctx.state.user?.role === "psychologist") {
          psychologists = psychologists.filter(
            (psychologist) => psychologist.email === ctx.state.user?.email,
          );
        }

        const rooms = await getAllRooms();

        // Obtener todos los pacientes
        const patientRepository = getPatientRepository();
        const patients = await patientRepository.getAll();

        return ctx.render({
          psychologists,
          rooms,
          patients,
          currentUserRole: ctx.state.user?.role,
          currentUserEmail: ctx.state.user?.email,
          error: "Error al crear la cita",
        });
      }
    } finally {
      await kv.close();
    }
  }

  // Caso inesperado - loggear para debug
  logger.error(
    "APPOINTMENTS_NEW",
    "Unexpected method or route reached end of handler",
    {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
    },
    { requestId, ...userContext },
  );

  return new Response("Method not allowed", { status: 405 });
}

export default function NewAppointmentPage({
  data,
}: PageProps<
  {
    psychologists: UserProfile[];
    rooms: Room[];
    patients: Patient[];
    currentUserRole?: string;
    currentUserEmail?: string;
    error?: string;
    conflictMessage?: string;
    formData?: {
      patientName?: string;
      psychologistEmail?: string;
      appointmentDate?: string;
      startTime?: string;
      endTime?: string;
      roomId?: string;
      notes?: string;
    };
  },
  AppState
>) {
  const {
    psychologists,
    rooms,
    patients,
    currentUserRole,
    currentUserEmail,
    error,
    conflictMessage,
    formData,
  } = data || {
    psychologists: [],
    rooms: [],
    patients: [],
  };

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="mb-8">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                  Nueva Cita
                </h1>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Programa una nueva cita para un paciente
                </p>
              </div>
              <a
                href="/appointments"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Icon name="arrow-left" className="h-4 w-4 mr-2" />
                Volver a Citas
              </a>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-lg font-medium text-gray-900 dark:text-white">
                Información de la Cita
              </h2>
            </div>

            <form
              action="/appointments/new"
              method="POST"
            >
              <div class="px-6 py-4 space-y-6">
                {error && (
                  <div class="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
                    <div class="flex">
                      <div class="flex-shrink-0">
                        <Icon
                          name="file-warning"
                          className="h-5 w-5 text-red-400"
                        />
                      </div>
                      <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                          Error en el formulario
                        </h3>
                        <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                          {error}
                        </div>
                      </div>
                    </div>
                  </div>
                )}


                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="patientName"
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      <Icon name="user" className="h-4 w-4 inline mr-2" />
                      Paciente
                    </label>
                    <PatientSelect
                      patients={patients}
                      required
                      defaultValue={formData?.patientName}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="psychologistEmail"
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      <Icon name="user-cog" className="h-4 w-4 inline mr-2" />
                      Psicólogo Asignado
                    </label>
                    <Select
                      id="psychologistEmail"
                      name="psychologistEmail"
                      required
                      disabled={currentUserRole === "psychologist"}
                      value={currentUserRole === "psychologist"
                        ? currentUserEmail
                        : formData?.psychologistEmail || ""}
                    >
                      {currentUserRole === "superadmin" && (
                        <option value="">Seleccione un psicólogo</option>
                      )}
                      {psychologists.map((psychologist) => (
                        <option
                          key={psychologist.email}
                          value={psychologist.email}
                          selected={currentUserRole === "psychologist" &&
                            psychologist.email === currentUserEmail}
                        >
                          {psychologist.name || psychologist.email}
                        </option>
                      ))}
                    </Select>
                    {/* Campo oculto para asegurar que el valor se envíe cuando el select está deshabilitado */}
                    {currentUserRole === "psychologist" && (
                      <input
                        type="hidden"
                        name="psychologistEmail"
                        value={currentUserEmail}
                      />
                    )}
                    {currentUserRole === "psychologist" && (
                      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Las citas se asignarán automáticamente a tu perfil
                      </p>
                    )}
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div>
                    <label
                      htmlFor="appointmentDate"
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      <Icon name="calendar" className="h-4 w-4 inline mr-2" />
                      Fecha de la Cita
                    </label>
                    <Input
                      id="appointmentDate"
                      name="appointmentDate"
                      type="date"
                      required
                      min={new Date().toISOString().split("T")[0]}
                      value={formData?.appointmentDate || ""}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="startTime"
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      <Icon name="clock" className="h-4 w-4 inline mr-2" />
                      Hora de Inicio
                    </label>
                    <Input
                      id="startTime"
                      name="startTime"
                      type="time"
                      required
                      value={formData?.startTime || ""}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="endTime"
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      <Icon name="clock" className="h-4 w-4 inline mr-2" />
                      Hora de Fin
                    </label>
                    <Input
                      id="endTime"
                      name="endTime"
                      type="time"
                      required
                      value={formData?.endTime || ""}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="roomId"
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      <Icon name="briefcase" className="h-4 w-4 inline mr-2" />
                      Sala de Atención
                    </label>
                    <Select
                      id="roomId"
                      name="roomId"
                      required
                      value={formData?.roomId || ""}
                    >
                      <option value="">Seleccione una sala</option>
                      {rooms.map((room) => (
                        <option
                          key={room.id}
                          value={room.id}
                          disabled={!room.isAvailable}
                        >
                          {room.name} {!room.isAvailable && "(No disponible)"}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    <Icon name="file-digit" className="h-4 w-4 inline mr-2" />
                    Notas (Opcional)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="Información adicional sobre la cita..."
                    value={formData?.notes || ""}
                  />
                </div>

                <div class="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <a
                    href="/appointments"
                    class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </a>
                  <Button
                    type="submit"
                    variant="primary"
                    className="inline-flex items-center"
                  >
                    <Icon
                      name="calendar-plus"
                      className="h-4 w-4 mr-2 filter brightness-0 invert"
                      disableAutoFilter
                    />
                    Crear Cita
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
      
      {/* Toast para mostrar mensajes de conflicto */}
      {conflictMessage && (
        <Toast 
          message={conflictMessage}
          type="warning"
          duration={10000}
        />
      )}
    </div>
  );
}
