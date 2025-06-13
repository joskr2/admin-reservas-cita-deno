import { type FreshContext, type PageProps } from "$fresh/server.ts";
import { type AppState, type Room } from "../../types/index.ts";
import { getRoomRepository } from "../../lib/database/index.ts";
import { Icon } from "../../components/ui/Icon.tsx";
import { Button } from "../../components/ui/Button.tsx";
import RoomToggleButton from "../../islands/RoomToggleButton.tsx";
import RoomFilters from "../../islands/RoomFilters.tsx";

interface RoomsPageData {
  rooms: Room[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filters: {
    search?: string;
    status?: string;
    type?: string;
  };
  success?: string | null;
}

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "5");
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "";
  const type = url.searchParams.get("type") || "";
  const success = url.searchParams.get("success");

  try {
    const roomRepository = getRoomRepository();
    let allRooms = await roomRepository.getAll();

    // Aplicar filtros
    if (search) {
      const searchLower = search.toLowerCase();
      allRooms = allRooms.filter(
        (room) =>
          room.name.toLowerCase().includes(searchLower) ||
          room.id.toLowerCase().includes(searchLower) ||
          (room.description &&
            room.description.toLowerCase().includes(searchLower))
      );
    }

    if (status) {
      const isAvailable = status === "available";
      allRooms = allRooms.filter((room) => room.isAvailable === isAvailable);
    }

    if (type) {
      allRooms = allRooms.filter((room) => room.roomType === type);
    }

    const totalCount = allRooms.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const rooms = allRooms.slice(startIndex, startIndex + limit);

    return ctx.render({
      rooms,
      totalCount,
      currentPage: page,
      totalPages,
      filters: { search, status, type },
      success,
    });
  } catch (error) {
    console.error("Error loading rooms:", error);
    return ctx.render({
      rooms: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 1,
      filters: {},
      success: null,
    });
  }
}

export default function RoomsPage({
  data,
}: PageProps<RoomsPageData, AppState>) {
  const { rooms, totalCount, currentPage, totalPages, filters, success } = data;

  const buildUrl = (params: Record<string, string | number | undefined>) => {
    const url = new URL(
      "/rooms",
      globalThis.location?.origin || "http://localhost:8000"
    );
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, value.toString());
      }
    });
    return url.pathname + url.search;
  };

  const getPaginationPages = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

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
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      family:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      group:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      evaluation:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      relaxation:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    };
    return type
      ? typeColors[type] ||
          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
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

          {/* Header */}
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
              <a href="/rooms/new">
                <Button variant="primary" leftIcon="plus">
                  Nueva Sala
                </Button>
              </a>
            </div>
          </div>

          {/* Filtros */}
          <RoomFilters filters={filters} />

          {/* Lista de salas */}
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {rooms.map((room) => (
              <div
                key={room.id}
                class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col h-full"
              >
                <div class="p-4 sm:p-6 flex flex-col flex-1">
                  {/* Header de la tarjeta */}
                  <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center min-w-0 flex-1">
                      <div
                        class={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-lg flex-shrink-0 ${
                          room.isAvailable ? "bg-blue-500" : "bg-gray-500"
                        }`}
                      >
                        {room.name.charAt(0)}
                      </div>
                      <div class="ml-3 min-w-0 flex-1">
                        <h3 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {room.name}
                        </h3>
                        <span
                          class={`inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                            room.isAvailable
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {room.isAvailable ? "Disponible" : "Ocupada"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contenido principal */}
                  <div class="flex-1 flex flex-col justify-between">
                    <div class="space-y-3">
                      {/* ID de Sala */}
                      <div>
                        <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          ID de Sala
                        </h4>
                        <p class=" text-gray-900 dark:text-gray-100 font-mono bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                          {room.id}
                        </p>
                      </div>

                      {/* Tipo y Capacidad en una fila */}
                      <div class="grid grid-cols-2 gap-3">
                        {room.roomType && (
                          <div>
                            <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                              Tipo
                            </h4>
                            <span
                              class={`inline-flex px-2 py-1 text-xs font-medium rounded ${getRoomTypeColor(
                                room.roomType
                              )}`}
                            >
                              {getRoomTypeLabel(room.roomType)}
                            </span>
                          </div>
                        )}

                        {room.capacity && (
                          <div>
                            <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                              Capacidad
                            </h4>
                            <p class="text-sm text-gray-900 dark:text-gray-100 flex items-center">
                              <Icon
                                name="users"
                                size={14}
                                className="mr-1 text-gray-400"
                              />
                              {room.capacity}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Descripción */}
                      {room.description && (
                        <div>
                          <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            Descripción
                          </h4>
                          <p class="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {room.description}
                          </p>
                        </div>
                      )}

                      {/* Equipamiento */}
                      {room.equipment && room.equipment.length > 0 && (
                        <div>
                          <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                            Equipamiento
                          </h4>
                          <div class="flex flex-wrap gap-1">
                            {room.equipment.slice(0, 2).map((item, index) => (
                              <span
                                key={index}
                                class="inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                              >
                                {item}
                              </span>
                            ))}
                            {room.equipment.length > 2 && (
                              <span class="inline-flex px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                                +{room.equipment.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Fecha de creación */}
                      <div>
                        <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
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

                    {/* Footer de la tarjeta */}
                    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <a
                            href={`/rooms/${room.id}`}
                            title="Ver detalles"
                            class="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                          >
                            <Icon name="eye" size={16} />
                          </a>
                          <a
                            href={`/rooms/edit/${room.id}`}
                            title="Editar"
                            class="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                          >
                            <Icon name="edit" size={16} />
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
                {totalCount === 0
                  ? "No hay salas configuradas"
                  : "No se encontraron salas"}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-6">
                {totalCount === 0
                  ? "Las salas se inicializan automáticamente al cargar la aplicación."
                  : "Intenta ajustar los filtros para encontrar las salas que buscas."}
              </p>
              {totalCount > 0 && (
                <a
                  href="/rooms"
                  class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors"
                >
                  <Icon name="x" size={16} className="mr-2" />
                  Limpiar filtros
                </a>
              )}
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div class="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              {/* Información de resultados - Móvil */}
              <div class="sm:hidden text-center mb-4">
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  Página {currentPage} de {totalPages}
                </span>
                <div class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {totalCount} salas en total
                </div>
              </div>

              {/* Paginación móvil - Solo botones anterior/siguiente y página actual */}
              <div class="sm:hidden flex items-center justify-between">
                <a
                  href={
                    currentPage > 1
                      ? buildUrl({ ...filters, page: currentPage - 1 })
                      : "#"
                  }
                  class={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage > 1
                      ? "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                      : "text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <Icon name="arrow-left" size={16} className="mr-1" />
                  Anterior
                </a>

                <div class="flex items-center space-x-1">
                  {/* Solo mostrar página actual y adyacentes en móvil */}
                  {currentPage > 1 && (
                    <a
                      href={buildUrl({
                        ...filters,
                        page: currentPage - 1,
                      })}
                      class="px-2 py-1 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {currentPage - 1}
                    </a>
                  )}

                  <span class="px-3 py-1 rounded bg-blue-600 text-white text-sm font-medium">
                    {currentPage}
                  </span>

                  {currentPage < totalPages && (
                    <a
                      href={buildUrl({
                        ...filters,
                        page: currentPage + 1,
                      })}
                      class="px-2 py-1 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {currentPage + 1}
                    </a>
                  )}
                </div>

                <a
                  href={
                    currentPage < totalPages
                      ? buildUrl({ ...filters, page: currentPage + 1 })
                      : "#"
                  }
                  class={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentPage < totalPages
                      ? "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                      : "text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  Siguiente
                  <Icon
                    name="arrow-left"
                    size={16}
                    className="ml-1 rotate-180"
                  />
                </a>
              </div>

              {/* Paginación desktop - Versión completa */}
              <div class="hidden sm:flex items-center justify-between">
                <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    Mostrando {(currentPage - 1) * 5 + 1} -{" "}
                    {Math.min(currentPage * 5, totalCount)} de {totalCount}{" "}
                    salas
                  </span>
                </div>

                <div class="flex items-center space-x-1">
                  {/* Botón anterior */}
                  <a
                    href={
                      currentPage > 1
                        ? buildUrl({ ...filters, page: currentPage - 1 })
                        : "#"
                    }
                    class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage > 1
                        ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    Anterior
                  </a>

                  {/* Números de página */}
                  {getPaginationPages().map((page, index) => (
                    <span key={index}>
                      {page === "..." ? (
                        <span class="px-3 py-2 text-gray-400 dark:text-gray-600">
                          ...
                        </span>
                      ) : (
                        <a
                          href={buildUrl({ ...filters, page })}
                          class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                        >
                          {page}
                        </a>
                      )}
                    </span>
                  ))}

                  {/* Botón siguiente */}
                  <a
                    href={
                      currentPage < totalPages
                        ? buildUrl({ ...filters, page: currentPage + 1 })
                        : "#"
                    }
                    class={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage < totalPages
                        ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    Siguiente
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
