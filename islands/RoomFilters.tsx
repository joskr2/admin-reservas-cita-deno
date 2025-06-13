import { useState } from "preact/hooks";
import { Button } from "../components/ui/Button.tsx";
import { Icon } from "../components/ui/Icon.tsx";

interface RoomFiltersProps {
  filters: {
    search?: string;
    status?: string;
    type?: string;
  };
}

export default function RoomFilters({ filters }: RoomFiltersProps) {
  const [search, setSearch] = useState(filters.search || "");

  const buildUrl = (params: Record<string, string | number | undefined>) => {
    const url = new URL(
      "/rooms",
      globalThis.location?.origin || "http://localhost:8000",
    );
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, value.toString());
      }
    });
    return url.pathname + url.search;
  };

  return (
    <div class="mb-8">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-2">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Filtros de Búsqueda
            </h3>
          </div>
          {(filters.search || filters.status || filters.type) && (
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Filtros activos
            </span>
          )}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda general */}
          <div class="space-y-2">
            <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Icon name="briefcase" className="h-4 w-4 text-gray-500" />
              <span>Buscar Sala</span>
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="briefcase" className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Nombre, ID o descripción..."
                value={search}
                onInput={(e) => {
                  const value = (e.target as HTMLInputElement).value;
                  setSearch(value);
                  const url = buildUrl({
                    ...filters,
                    search: value || undefined,
                    page: 1,
                  });
                  globalThis.location.href = url;
                }}
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    const url = buildUrl({
                      ...filters,
                      search: undefined,
                      page: 1,
                    });
                    globalThis.location.href = url;
                  }}
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500"
                  title="Limpiar búsqueda"
                >
                  <Icon name="x" className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filtro por estado */}
          <div class="space-y-2">
            <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Icon name="activity" className="h-4 w-4 text-gray-500" />
              <span>Estado</span>
            </label>
            <select
              value={filters.status || ""}
              onChange={(e) => {
                const value = (e.target as HTMLSelectElement).value;
                const url = buildUrl({
                  ...filters,
                  status: value || undefined,
                  page: 1,
                });
                globalThis.location.href = url;
              }}
              title="Filtrar por estado de disponibilidad"
              aria-label="Filtrar por estado de disponibilidad"
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="available">✅ Disponible</option>
              <option value="unavailable">❌ No disponible</option>
            </select>
          </div>

          {/* Filtro por tipo */}
          <div class="space-y-2">
            <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Icon name="hash" className="h-4 w-4 text-gray-500" />
              <span>Tipo</span>
            </label>
            <select
              value={filters.type || ""}
              onChange={(e) => {
                const value = (e.target as HTMLSelectElement).value;
                const url = buildUrl({
                  ...filters,
                  type: value || undefined,
                  page: 1,
                });
                globalThis.location.href = url;
              }}
              title="Filtrar por tipo de sala"
              aria-label="Filtrar por tipo de sala"
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Todos los tipos</option>
              <option value="individual">👤 Individual</option>
              <option value="family">👨‍👩‍👧‍👦 Familiar</option>
              <option value="group">👥 Grupal</option>
              <option value="evaluation">📋 Evaluación</option>
              <option value="relaxation">🧘 Relajación</option>
            </select>
          </div>
        </div>

        {/* Limpiar filtros */}
        {(filters.search || filters.status || filters.type) && (
          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Icon name="check" className="h-4 w-4 text-green-500" />
                <span>
                  Filtros aplicados: {[
                    filters.search && "Búsqueda",
                    filters.status && "Estado",
                    filters.type && "Tipo",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => (globalThis.location.href = "/rooms")}
                class="inline-flex items-center gap-1"
              >
                <Icon name="x" className="h-3 w-3" />
                Limpiar Filtros
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
