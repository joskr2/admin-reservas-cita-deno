import { type FreshContext, type PageProps } from "$fresh/server.ts";
import { type AppState, type Room } from "../../types/index.ts";
import { getRoomRepository } from "../../lib/database/index.ts";
import { Icon } from "../../components/ui/Icon.tsx";
import RoomToggleButton from "../../islands/RoomToggleButton.tsx";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  try {
    const roomRepository = getRoomRepository();
    const rooms = await roomRepository.getAll();

    // Detectar mensaje de éxito
    const url = new URL(req.url);
    const success = url.searchParams.get("success");

    return ctx.render({ rooms, success });
  } catch (error) {
    console.error("Error loading rooms:", error);
    return ctx.render({ rooms: [] });
  }
}

export default function RoomsPage({
  data,
}: PageProps<{ rooms: Room[]; success?: string | null }, AppState>) {
  const { rooms, success } = data;

  const getRoomTypeLabel = (type?: string) => {
    const typeLabels: Record<string, string> = {
      individual: "Individual",
      family: "Familiar",
      group: "Grupal",
      evaluation: "Evaluación",
      relaxation: "Relajación",
    };
    return type ? typeLabels[type] || type : "No especificado";
  };

  const getRoomTypeColor = (type?: string) => {
    const typeColors: Record<string, string> = {
      individual:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      family:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      group:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      evaluation:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      relaxation:
        "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    };
    return type
      ? typeColors[type] ||
          "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          {/* Mensaje de éxito */}
          {success && (
            <div class="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div class="flex items-center">
                <Icon name="check" size={20} className="text-green-500 mr-3" />
                <div>
                  <h3 class="text-sm font-medium text-green-800 dark:text-green-200">
                    Operación exitosa
                  </h3>
                  <p class="text-sm text-green-700 dark:text-green-300 mt-1">
                    {success}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                Gestión de Salas
              </h1>
              <p class="mt-2 text-gray-600 dark:text-gray-400">
                Administra las salas de terapia y su disponibilidad
              </p>
            </div>
            <div class="mt-4 sm:mt-0 flex gap-3">
              <a
                href="/rooms/new"
                class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
              >
                <Icon name="plus" size={20} className="mr-2" />
                Nueva Sala
              </a>
            </div>
          </div>

          {/* Estadísticas */}
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div class="flex items-center">
                <Icon
                  name="briefcase"
                  size={24}
                  className="text-blue-500 mr-3"
                />
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Salas
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {rooms.length}
                  </p>
                </div>
              </div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div class="flex items-center">
                <Icon name="check" size={24} className="text-green-500 mr-3" />
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Disponibles
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {rooms.filter((r) => r.isAvailable).length}
                  </p>
                </div>
              </div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div class="flex items-center">
                <Icon name="x" size={24} className="text-red-500 mr-3" />
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    No Disponibles
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {rooms.filter((r) => !r.isAvailable).length}
                  </p>
                </div>
              </div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div class="flex items-center">
                <Icon
                  name="activity"
                  size={24}
                  className="text-purple-500 mr-3"
                />
                <div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tasa de Ocupación
                  </p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white">
                    {rooms.length > 0
                      ? Math.round(
                          (rooms.filter((r) => !r.isAvailable).length /
                            rooms.length) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de salas */}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div
                key={room.id}
                class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col h-full"
              >
                <div class="p-6 flex flex-col flex-1">
                  {/* Header de la tarjeta */}
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center">
                      <div
                        class={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg ${
                          room.isAvailable ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        {room.name.charAt(0)}
                      </div>
                      <div class="ml-3">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                          {room.name}
                        </h3>
                        <span
                          class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            room.isAvailable
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {room.isAvailable ? "Disponible" : "Ocupada"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contenido principal - flex-1 para ocupar espacio disponible */}
                  <div class="flex-1 flex flex-col justify-between">
                    <div class="space-y-3">
                      {/* Información básica siempre visible */}
                      <div>
                        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          ID de Sala
                        </h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {room.id}
                        </p>
                      </div>

                      {room.roomType && (
                        <div>
                          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tipo
                          </h4>
                          <span
                            class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoomTypeColor(
                              room.roomType
                            )}`}
                          >
                            {getRoomTypeLabel(room.roomType)}
                          </span>
                        </div>
                      )}

                      {room.capacity && (
                        <div>
                          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Capacidad
                          </h4>
                          <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                            <Icon name="users" size={14} className="mr-1" />
                            {room.capacity} personas
                          </p>
                        </div>
                      )}

                      {room.description && (
                        <div>
                          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Descripción
                          </h4>
                          <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {room.description}
                          </p>
                        </div>
                      )}

                      {room.equipment && room.equipment.length > 0 && (
                        <div>
                          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Equipamiento
                          </h4>
                          <div class="flex flex-wrap gap-1">
                            {room.equipment.slice(0, 3).map((item, index) => (
                              <span
                                key={index}
                                class="inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                              >
                                {item}
                              </span>
                            ))}
                            {room.equipment.length > 3 && (
                              <span class="inline-flex px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                                +{room.equipment.length - 3} más
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Información adicional para consistencia */}
                      <div>
                        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Creada
                        </h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(room.createdAt).toLocaleDateString(
                            "es-ES",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Footer de la tarjeta - siempre al final */}
                    <div class="mt-6 flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div class="flex items-center gap-3">
                        <a
                          href={`/rooms/${room.id}`}
                          class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-950 rounded-md transition-colors"
                          title="Ver detalles"
                        >
                          <Icon name="eye" size={14} className="mr-1" />
                          Ver
                        </a>
                        <a
                          href={`/rooms/edit/${room.id}`}
                          class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/50 hover:bg-yellow-100 dark:hover:bg-yellow-950 rounded-md transition-colors"
                          title="Editar"
                        >
                          <Icon name="edit" size={14} className="mr-1" />
                          Editar
                        </a>
                      </div>
                      <RoomToggleButton
                        roomId={room.id}
                        isAvailable={room.isAvailable}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {rooms.length === 0 && (
            <div class="text-center py-12">
              <Icon
                name="briefcase"
                size={48}
                className="mx-auto text-gray-400 mb-4"
              />
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay salas configuradas
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-6">
                Las salas se inicializan automáticamente al cargar la
                aplicación.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
