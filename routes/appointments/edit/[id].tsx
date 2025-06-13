import { type FreshContext, type PageProps } from "$fresh/server.ts";
import {
  type Appointment,
  type AppState,
  type Room,
  type RoomId,
  type UserProfile,
} from "../../../types/index.ts";
import { Icon } from "../../../components/ui/Icon.tsx";
import {
  getAllRooms,
  getAllUsers,
  getAvailableRooms,
} from "../../../lib/kv.ts";
import AppointmentFormValidator from "../../../islands/AppointmentFormValidator.tsx";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  const appointmentId = ctx.params.id;

  if (!appointmentId) {
    return new Response("ID de cita requerido", { status: 400 });
  }

  const kv = await Deno.openKv();

  try {
    // Obtener la cita
    const appointmentEntry = await kv.get(["appointments", appointmentId]);

    if (!appointmentEntry.value) {
      return new Response("Cita no encontrada", { status: 404 });
    }

    const appointment = appointmentEntry.value as Appointment;

    // Verificar permisos: psicólogos solo pueden editar sus propias citas
    if (
      ctx.state.user?.role === "psychologist" &&
      appointment.psychologistEmail !== ctx.state.user.email
    ) {
      return new Response("No tienes permisos para editar esta cita", {
        status: 403,
      });
    }

    // Obtener lista de psicólogos
    const users = await getAllUsers();
    const psychologists = users.filter((user) => user.role === "psychologist");

    // Si es psicólogo, solo mostrar su propio perfil
    const filteredPsychologists =
      ctx.state.user?.role === "psychologist"
        ? psychologists.filter((p) => p.email === ctx.state.user?.email)
        : psychologists;

    // Obtener todas las salas
    const rooms = await getAllRooms();

    // Si es POST, procesar la actualización
    if (req.method === "POST") {
      const formData = await req.formData();
      const patientName = formData.get("patientName")?.toString();
      const psychologistEmail = formData.get("psychologistEmail")?.toString();
      const appointmentDate = formData.get("appointmentDate")?.toString();
      const appointmentTime = formData.get("appointmentTime")?.toString();
      const roomId = formData.get("roomId")?.toString() as RoomId;
      const notes = formData.get("notes")?.toString();

      // Validación de permisos en POST: psicólogos solo pueden asignarse a sí mismos
      if (
        ctx.state.user?.role === "psychologist" &&
        psychologistEmail !== ctx.state.user.email
      ) {
        return ctx.render({
          appointment,
          psychologists: filteredPsychologists,
          rooms,
          currentUserRole: ctx.state.user?.role,
          currentUserEmail: ctx.state.user?.email,
          error: "No tienes permisos para asignar citas a otros psicólogos",
        });
      }

      if (
        !patientName ||
        !psychologistEmail ||
        !appointmentDate ||
        !appointmentTime ||
        !roomId
      ) {
        return ctx.render({
          appointment,
          psychologists: filteredPsychologists,
          rooms,
          currentUserRole: ctx.state.user?.role,
          currentUserEmail: ctx.state.user?.email,
          error: "Todos los campos son requeridos",
        });
      }

      // Verificar disponibilidad de la sala (excluyendo la cita actual)
      const availableRooms = await getAvailableRooms(
        appointmentDate,
        appointmentTime,
        appointmentId
      );
      const isRoomAvailable =
        availableRooms.some((room) => room.id === roomId) ||
        appointment.roomId === roomId;

      if (!isRoomAvailable) {
        return ctx.render({
          appointment,
          psychologists: filteredPsychologists,
          rooms,
          currentUserRole: ctx.state.user?.role,
          currentUserEmail: ctx.state.user?.email,
          error: "La sala seleccionada no está disponible en esa fecha y hora",
        });
      }

      // Buscar el nombre del psicólogo
      const psychologist = psychologists.find(
        (p) => p.email === psychologistEmail
      );

      const updatedAppointment: Appointment = {
        ...appointment,
        patientName,
        psychologistEmail,
        psychologistName:
          psychologist?.name || psychologist?.email || undefined,
        appointmentDate,
        appointmentTime,
        roomId,
        notes,
        updatedAt: new Date().toISOString(),
      };

      // Actualizar en la base de datos
      const result = await kv
        .atomic()
        .check(appointmentEntry)
        .set(["appointments", appointmentId], updatedAppointment)
        .commit();

      if (result.ok) {
        return new Response("", {
          status: 302,
          headers: { Location: "/appointments" },
        });
      } else {
        return ctx.render({
          appointment,
          psychologists: filteredPsychologists,
          rooms,
          currentUserRole: ctx.state.user?.role,
          currentUserEmail: ctx.state.user?.email,
          error: "Error al actualizar la cita",
        });
      }
    }

    return ctx.render({
      appointment,
      psychologists: filteredPsychologists,
      rooms,
      currentUserRole: ctx.state.user?.role,
      currentUserEmail: ctx.state.user?.email,
    });
  } finally {
    await kv.close();
  }
}

export default function EditAppointmentPage({
  data,
}: PageProps<
  {
    appointment: Appointment;
    psychologists: UserProfile[];
    rooms: Room[];
    currentUserRole?: string;
    currentUserEmail?: string;
    error?: string;
  },
  AppState
>) {
  const {
    appointment,
    psychologists,
    rooms,
    currentUserRole,
    currentUserEmail,
    error,
  } = data;

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="mb-8">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                  Editar Cita
                </h1>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Modifica la información de la cita
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

          {error && (
            <div class="mb-6 rounded-md bg-red-50 dark:bg-red-900/50 p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <Icon name="file-warning" className="h-5 w-5 text-red-400" />
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

          <div class="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-lg font-medium text-gray-900 dark:text-white">
                Información de la Cita
              </h2>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Estado actual:{" "}
                <span class="font-medium">{appointment.status}</span>
              </p>
            </div>

            <AppointmentFormValidator
              currentUserRole={currentUserRole || ""}
              currentUserEmail={currentUserEmail || ""}
              action=""
              method="POST"
            >
              <div class="p-6 space-y-6">
                {/* Nombre del Paciente */}
                <div>
                  <label
                    htmlFor="patientName"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    <Icon name="user" className="h-4 w-4 inline mr-2" />
                    Nombre del Paciente
                  </label>
                  <input
                    type="text"
                    id="patientName"
                    name="patientName"
                    value={appointment.patientName}
                    required
                    class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="Ingresa el nombre completo del paciente"
                  />
                </div>

                {/* Psicólogo */}
                <div>
                  <label
                    htmlFor="psychologistEmail"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    <Icon name="user-cog" className="h-4 w-4 inline mr-2" />
                    Psicólogo Asignado
                  </label>
                  <select
                    id="psychologistEmail"
                    name="psychologistEmail"
                    required
                    disabled={currentUserRole === "psychologist"}
                    class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 dark:disabled:bg-gray-600"
                  >
                    {currentUserRole === "superadmin" && (
                      <option value="">Selecciona un psicólogo</option>
                    )}
                    {psychologists.map((psychologist) => (
                      <option
                        key={psychologist.email}
                        value={psychologist.email}
                        selected={
                          psychologist.email === appointment.psychologistEmail
                        }
                      >
                        {psychologist.name || psychologist.email}
                      </option>
                    ))}
                  </select>
                  {currentUserRole === "psychologist" && (
                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Solo puedes editar tus propias citas
                    </p>
                  )}
                </div>

                {/* Fecha, Hora y Sala */}
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label
                      htmlFor="appointmentDate"
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      <Icon name="calendar" className="h-4 w-4 inline mr-2" />
                      Fecha
                    </label>
                    <input
                      type="date"
                      id="appointmentDate"
                      name="appointmentDate"
                      value={appointment.appointmentDate}
                      required
                      min={new Date().toISOString().split("T")[0]}
                      class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="appointmentTime"
                      class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      <Icon name="clock" className="h-4 w-4 inline mr-2" />
                      Hora
                    </label>
                    <input
                      type="time"
                      id="appointmentTime"
                      name="appointmentTime"
                      value={appointment.appointmentTime}
                      required
                      class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
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
                    <select
                      id="roomId"
                      name="roomId"
                      required
                      class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    >
                      <option value="">Seleccione una sala</option>
                      {rooms.map((room) => (
                        <option
                          key={room.id}
                          value={room.id}
                          selected={room.id === appointment.roomId}
                          disabled={
                            !room.isAvailable && room.id !== appointment.roomId
                          }
                        >
                          {room.name}{" "}
                          {!room.isAvailable &&
                            room.id !== appointment.roomId &&
                            "(No disponible)"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label
                    htmlFor="notes"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    <Icon name="file-digit" className="h-4 w-4 inline mr-2" />
                    Notas
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    value={appointment.notes || ""}
                    class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                    placeholder="Información adicional sobre la cita..."
                  />
                </div>

                {/* Botones */}
                <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <a
                    href="/appointments"
                    class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </a>
                  <button
                    type="submit"
                    class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Icon
                      name="check"
                      className="h-4 w-4 mr-2 filter brightness-0 invert"
                      disableAutoFilter
                    />
                    Actualizar Cita
                  </button>
                </div>
              </div>
            </AppointmentFormValidator>
          </div>
        </div>
      </main>
    </div>
  );
}
