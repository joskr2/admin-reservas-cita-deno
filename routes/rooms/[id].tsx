import { type FreshContext, type PageProps } from "$fresh/server.ts";
import { type AppState, type Room, type RoomId } from "../../types/index.ts";
import { getRoomRepository } from "../../lib/database/index.ts";
import { Icon } from "../../components/ui/Icon.tsx";
import DeleteRoomButton from "../../islands/DeleteRoomButton.tsx";

export async function handler(_req: Request, ctx: FreshContext<AppState>) {
  const roomId = ctx.params.id as RoomId;

  try {
    const roomRepository = getRoomRepository();
    const room = await roomRepository.getById(roomId);

    if (!room) {
      return new Response("Sala no encontrada", { status: 404 });
    }

    return ctx.render({ room });
  } catch (error) {
    console.error("Error loading room:", error);
    return ctx.render({ error: "Error al cargar la sala", room: null });
  }
}

export default function RoomDetailsPage({
  data,
}: PageProps<{ room: Room | null; error?: string }, AppState>) {
  const { room, error } = data;

  if (error || !room) {
    return (
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div class="text-center">
          <Icon
            name="alert-circle"
            size={48}
            className="text-red-500 mx-auto mb-4"
          />
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {error || "Sala no encontrada"}
          </h1>
          <a
            href="/rooms"
            class="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Icon name="arrow-left" size={16} className="mr-2" />
            Volver a la lista de salas
          </a>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          {/* Header */}
          <div class="mb-8">
            {/* Título y descripción */}
            <div class="mb-4 sm:mb-6">
              <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                <Icon
                  name="briefcase"
                  className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-600 flex-shrink-0"
                />
                <span class="break-words">Sala {room.name}</span>
              </h1>
              <p class="mt-2 text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-400">
                Detalles de la sala de atención
              </p>
            </div>

            {/* Botones de acción */}
            <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 w-full">
              <a
                href="/rooms"
                class="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-xs sm:text-sm font-medium min-h-[40px] w-full sm:w-auto"
              >
                <Icon
                  name="arrow-left"
                  size={14}
                  className="mr-1.5 sm:mr-2 flex-shrink-0"
                />
                <span class="truncate">Volver a Salas</span>
              </a>
              <a
                href={`/rooms/edit/${room.id}`}
                class="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-xs sm:text-sm min-h-[40px] w-full sm:w-auto"
              >
                <Icon
                  name="edit"
                  size={14}
                  className="mr-1.5 sm:mr-2 flex-shrink-0"
                />
                <span class="truncate">Editar Sala</span>
              </a>
            </div>
          </div>

          {/* Información principal */}
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información básica */}
            <div class="lg:col-span-2 flex flex-col">
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex-1 flex flex-col">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Información General
                </h2>

                <div class="flex-1 flex flex-col justify-between">
                  <dl class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                        ID de la Sala
                      </dt>
                      <dd class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                        {room.id}
                      </dd>
                    </div>

                    <div>
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Nombre
                      </dt>
                      <dd class="mt-1 text-lg text-gray-900 dark:text-white">
                        {room.name}
                      </dd>
                    </div>

                    {room.roomType && (
                      <div>
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Tipo de Sala
                        </dt>
                        <dd class="mt-1">
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {room.roomType === "individual" && "Individual"}
                            {room.roomType === "family" && "Familiar"}
                            {room.roomType === "group" && "Grupal"}
                            {room.roomType === "evaluation" && "Evaluación"}
                            {room.roomType === "relaxation" && "Relajación"}
                          </span>
                        </dd>
                      </div>
                    )}

                    {room.capacity && (
                      <div>
                        <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Capacidad
                        </dt>
                        <dd class="mt-1 text-lg text-gray-900 dark:text-white">
                          {room.capacity} personas
                        </dd>
                      </div>
                    )}

                    <div class="sm:col-span-2">
                      <dt class="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Estado
                      </dt>
                      <dd class="mt-1">
                        <span
                          class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            room.isAvailable
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          <Icon
                            name={room.isAvailable ? "check" : "x"}
                            size={12}
                            className="mr-1"
                          />
                          {room.isAvailable ? "Disponible" : "No disponible"}
                        </span>
                      </dd>
                    </div>
                  </dl>

                  {room.description && (
                    <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Descripción
                      </h3>
                      <p class="text-gray-900 dark:text-white leading-relaxed">
                        {room.description}
                      </p>
                    </div>
                  )}

                  {/* Información adicional para llenar espacio si es necesario */}
                  <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                      Información del Sistema
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span class="text-gray-500 dark:text-gray-400">
                          Creada:
                        </span>
                        <span class="ml-2 text-gray-900 dark:text-white">
                          {new Date(room.createdAt).toLocaleDateString(
                            "es-ES",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </span>
                      </div>
                      {room.updatedAt && (
                        <div>
                          <span class="text-gray-500 dark:text-gray-400">
                            Actualizada:
                          </span>
                          <span class="ml-2 text-gray-900 dark:text-white">
                            {new Date(room.updatedAt).toLocaleDateString(
                              "es-ES",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel lateral */}
            <div class="space-y-6 flex flex-col">
              {/* Equipamiento */}
              {room.equipment && room.equipment.length > 0 && (
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex-1">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Icon name="briefcase" size={20} />
                    Equipamiento
                  </h3>
                  <ul class="space-y-2">
                    {room.equipment.map((item, index) => (
                      <li
                        key={index}
                        class="flex items-center text-gray-700 dark:text-gray-300"
                      >
                        <Icon
                          name="check"
                          size={16}
                          className="text-green-500 mr-2 flex-shrink-0"
                        />
                        <span class="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                  {room.equipment.length === 0 && (
                    <p class="text-gray-500 dark:text-gray-400 text-sm italic">
                      No hay equipamiento registrado
                    </p>
                  )}
                </div>
              )}

              {/* Acciones rápidas */}
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Acciones
                </h3>
                <div class="space-y-3">
                  <a
                    href={`/rooms/edit/${room.id}`}
                    class="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    <Icon name="edit" size={16} className="mr-2" />
                    Editar Sala
                  </a>

                  <DeleteRoomButton roomId={room.id} roomName={room.name} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
