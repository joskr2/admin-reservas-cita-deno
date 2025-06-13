import { type FreshContext, type PageProps } from "$fresh/server.ts";
import { type AppState, type CreateRoomForm, type RoomId } from "../../types/index.ts";
import { getRoomRepository } from "../../lib/database/index.ts";
import { Icon } from "../../components/ui/Icon.tsx";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  if (req.method === "POST") {
    try {
      const formData = await req.formData();
      const roomRepository = getRoomRepository();

      const roomData: CreateRoomForm = {
        id: formData.get("id") as RoomId,
        name: formData.get("name") as string,
        isAvailable: formData.get("isAvailable") === "true",
        equipment: formData.get("equipment") 
          ? (formData.get("equipment") as string).split(",").map(item => item.trim()).filter(Boolean)
          : [],
        capacity: formData.get("capacity") 
          ? parseInt(formData.get("capacity") as string)
          : undefined,
        roomType: (formData.get("roomType") as string) || undefined,
        description: (formData.get("description") as string) || undefined,
      };

      // Validaciones
      if (!roomData.id || !roomData.name) {
        return ctx.render({ 
          error: "ID y nombre de la sala son requeridos",
          formData: roomData
        });
      }

      // Verificar si ya existe una sala con ese ID
      const existingRoom = await roomRepository.getById(roomData.id);
      if (existingRoom) {
        return ctx.render({ 
          error: "Ya existe una sala con ese ID",
          formData: roomData
        });
      }

      const success = await roomRepository.create({
        ...roomData,
        id: roomData.id,
        name: roomData.name,
        isAvailable: roomData.isAvailable,
        equipment: roomData.equipment,
        capacity: roomData.capacity,
        roomType: roomData.roomType as any,
        description: roomData.description,
      });

      if (success) {
        return new Response("", {
          status: 302,
          headers: { Location: "/rooms" },
        });
      } else {
        return ctx.render({ 
          error: "Error al crear la sala",
          formData: roomData
        });
      }
    } catch (error) {
      console.error("Error creating room:", error);
      return ctx.render({ 
        error: "Error interno del servidor",
        formData: null
      });
    }
  }

  return ctx.render({ error: null, formData: null });
}

export default function NewRoomPage({
  data,
}: PageProps<{ error: string | null; formData: CreateRoomForm | null }, AppState>) {
  const { error, formData } = data;

  const availableRoomIds: RoomId[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main class="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Nueva Sala
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              Crear una nueva sala de terapia
            </p>
          </div>

          {error && (
            <div class="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div class="flex">
                <Icon name="alert-circle" size={20} className="text-red-500 mr-3 flex-shrink-0 mt-0.5" />
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
                  <label htmlFor="id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ID de la Sala *
                  </label>
                  <select
                    id="id"
                    name="id"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    value={formData?.id || ""}
                  >
                    <option value="">Seleccionar ID</option>
                    {availableRoomIds.map(id => (
                      <option key={id} value={id}>{id}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de la Sala *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData?.name || ""}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ej: Sala A - Terapia Individual"
                  />
                </div>

                <div>
                  <label htmlFor="roomType" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Sala
                  </label>
                  <select
                    id="roomType"
                    name="roomType"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    value={formData?.roomType || ""}
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="individual">Individual</option>
                    <option value="family">Familiar</option>
                    <option value="group">Grupal</option>
                    <option value="evaluation">Evaluación</option>
                    <option value="relaxation">Relajación</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="capacity" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Capacidad (personas)
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    min="1"
                    max="20"
                    value={formData?.capacity || ""}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ej: 2"
                  />
                </div>

                <div class="md:col-span-2">
                  <label htmlFor="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData?.description || ""}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Descripción opcional de la sala"
                  />
                </div>

                <div class="md:col-span-2">
                  <label htmlFor="equipment" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Equipamiento
                  </label>
                  <input
                    type="text"
                    id="equipment"
                    name="equipment"
                    value={formData?.equipment?.join(", ") || ""}
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
                      checked={formData?.isAvailable !== false}
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isAvailable" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
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
                Crear Sala
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}