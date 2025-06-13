import { type FreshContext, type PageProps } from "$fresh/server.ts";
import {
  type AppState,
  type CreateRoomForm,
  type Room,
} from "../../types/index.ts";
import { getRoomRepository } from "../../lib/database/index.ts";
import { Icon } from "../../components/ui/Icon.tsx";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  if (req.method === "POST") {
    try {
      const formData = await req.formData();
      const roomRepository = getRoomRepository();

      const roomData: CreateRoomForm = {
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
        roomType: (() => {
          const roomType = formData.get("roomType") as string;
          if (!roomType || roomType === "") return undefined;
          return roomType as
            | "individual"
            | "family"
            | "group"
            | "evaluation"
            | "relaxation";
        })(),
        description: (formData.get("description") as string) || undefined,
      };

      // Validaciones
      if (!roomData.name) {
        return ctx.render({
          error: "El nombre de la sala es requerido",
          formData: roomData,
        });
      }

      // Crear la sala con UUID generado automáticamente
      const room: Room = {
        id: crypto.randomUUID(),
        name: roomData.name,
        isAvailable: roomData.isAvailable,
        equipment: roomData.equipment,
        capacity: roomData.capacity,
        roomType: roomData.roomType,
        description: roomData.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const success = await roomRepository.create(room);

      if (success) {
        return new Response("", {
          status: 302,
          headers: { Location: "/rooms?success=room_created" },
        });
      } else {
        return ctx.render({
          error: "Error al crear la sala",
          formData: roomData,
        });
      }
    } catch (error) {
      console.error("Error creating room:", error);
      return ctx.render({
        error: "Error interno del servidor",
        formData: null,
      });
    }
  }

  return ctx.render({ error: null, formData: null });
}

export default function NewRoomPage({
  data,
}: PageProps<
  { error: string | null; formData: CreateRoomForm | null },
  AppState
>) {
  const { error, formData } = data;

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
                <div class="md:col-span-2">
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
                    value={formData?.name || ""}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ej: Sala de Terapia Individual"
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
                    value={formData?.roomType || ""}
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="individual">Terapia Individual</option>
                    <option value="family">Terapia Familiar</option>
                    <option value="group">Terapia de Grupo</option>
                    <option value="evaluation">Evaluación</option>
                    <option value="relaxation">Relajación</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="capacity"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Capacidad
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    min="1"
                    max="20"
                    value={formData?.capacity || ""}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Número de personas"
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
                    value={formData?.equipment?.join(", ") || ""}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Ej: Sillón, Mesa, Lámpara (separar con comas)"
                  />
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Separe cada elemento con una coma
                  </p>
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
                    value={formData?.description || ""}
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Descripción adicional de la sala..."
                  />
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
                    <label
                      htmlFor="isAvailable"
                      class="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                    >
                      Sala disponible para uso
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end space-x-3">
              <a
                href="/rooms"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </a>
              <button
                type="submit"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Crear Sala
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
