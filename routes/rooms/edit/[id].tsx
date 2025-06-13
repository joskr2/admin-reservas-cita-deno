import { type FreshContext, type PageProps } from "$fresh/server.ts";
import { type AppState, type Room, type RoomId } from "../../../types/index.ts";
import { getRoomRepository } from "../../../lib/database/index.ts";
import { Icon } from "../../../components/ui/Icon.tsx";

// Definir el tipo RoomType localmente
type RoomType = "individual" | "family" | "group" | "evaluation" | "relaxation";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  const roomId = ctx.params.id as RoomId;

  if (req.method === "POST") {
    try {
      const formData = await req.formData();
      const roomRepository = getRoomRepository();

      // Validar roomType
      const roomTypeValue = formData.get("roomType") as string;
      const validRoomTypes: RoomType[] = [
        "individual",
        "family",
        "group",
        "evaluation",
        "relaxation",
      ];
      const roomType: RoomType | undefined =
        roomTypeValue && validRoomTypes.includes(roomTypeValue as RoomType)
          ? (roomTypeValue as RoomType)
          : undefined;

      const roomData: Partial<Room> = {
        id: roomId,
        name: formData.get("name") as string,
        isAvailable: formData.get("isAvailable") === "true",
        equipment: formData.get("equipment")
          ? (formData.get("equipment") as string)
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        capacity: formData.get("capacity")
          ? parseInt(formData.get("capacity") as string)
          : undefined,
        roomType,
        description: (formData.get("description") as string) || undefined,
      };

      // Validaciones
      if (!roomData.name) {
        const room = await roomRepository.getById(roomId);
        return ctx.render({
          error: "El nombre de la sala es requerido",
          room: room || null,
        });
      }

      const success = await roomRepository.update(roomId, roomData);

      if (success) {
        return new Response("", {
          status: 302,
          headers: { Location: "/rooms" },
        });
      } else {
        const room = await roomRepository.getById(roomId);
        return ctx.render({
          error: "Error al actualizar la sala",
          room: room || null,
        });
      }
    } catch (error) {
      console.error("Error updating room:", error);
      const roomRepository = getRoomRepository();
      const room = await roomRepository.getById(roomId);
      return ctx.render({
        error: "Error interno del servidor",
        room: room || null,
      });
    }
  }

  // GET request
  try {
    const roomRepository = getRoomRepository();
    const room = await roomRepository.getById(roomId);

    if (!room) {
      return new Response("Sala no encontrada", { status: 404 });
    }

    return ctx.render({ error: null, room });
  } catch (error) {
    console.error("Error loading room:", error);
    return ctx.render({ error: "Error al cargar la sala", room: null });
  }
}

export default function EditRoomPage({
  data,
}: PageProps<{ error: string | null; room: Room | null }, AppState>) {
  const { error, room } = data;

  if (!room) {
    return (
      <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sala no encontrada
          </h1>
          <a href="/rooms" class="text-blue-600 hover:text-blue-800">
            Volver a la lista de salas
          </a>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main class="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Editar Sala {room.name}
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              Modificar la información de la sala
            </p>
          </div>

          {error && (
            <div class="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div class="flex">
                <Icon
                  name="alert-circle"
                  size={20}
                  className="text-red-500 mr-3 flex-shrink-0 mt-0.5"
                />
                <div>
                  <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                    Error
                  </h3>
                  <p class="mt-1 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form method="POST" class="space-y-6">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="id"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    ID de la Sala
                  </label>
                  <input
                    type="text"
                    id="id"
                    value={room.id}
                    disabled
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                  />
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    El ID de la sala no se puede modificar
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="name"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Nombre de la Sala *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={room.name}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ej: Sala A - Terapia Individual"
                  />
                </div>

                <div>
                  <label
                    htmlFor="roomType"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Tipo de Sala
                  </label>
                  <select
                    id="roomType"
                    name="roomType"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    value={room.roomType || ""}
                  >
                    <option value="">Seleccionar tipo</option>
                    <option
                      value="individual"
                      selected={room.roomType === "individual"}
                    >
                      Individual
                    </option>
                    <option
                      value="family"
                      selected={room.roomType === "family"}
                    >
                      Familiar
                    </option>
                    <option value="group" selected={room.roomType === "group"}>
                      Grupal
                    </option>
                    <option
                      value="evaluation"
                      selected={room.roomType === "evaluation"}
                    >
                      Evaluación
                    </option>
                    <option
                      value="relaxation"
                      selected={room.roomType === "relaxation"}
                    >
                      Relajación
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="capacity"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Capacidad (personas)
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    min="1"
                    max="20"
                    value={room.capacity || ""}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ej: 2"
                  />
                </div>

                <div class="md:col-span-2">
                  <label
                    htmlFor="description"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={room.description || ""}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Descripción opcional de la sala"
                  />
                </div>

                <div class="md:col-span-2">
                  <label
                    htmlFor="equipment"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Equipamiento
                  </label>
                  <input
                    type="text"
                    id="equipment"
                    name="equipment"
                    value={room.equipment?.join(", ") || ""}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Separar elementos con comas: Sillón, Mesa, Proyector"
                  />
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Separar cada elemento con comas
                  </p>
                </div>

                <div class="md:col-span-2">
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      id="isAvailable"
                      name="isAvailable"
                      value="true"
                      checked={room.isAvailable}
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="isAvailable"
                      class="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                    >
                      Sala disponible
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end gap-4">
              <a
                href="/rooms"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <Icon name="arrow-left" size={16} className="mr-2" />
                Cancelar
              </a>
              <button
                type="submit"
                class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
              >
                <Icon name="check" size={16} className="mr-2" />
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
