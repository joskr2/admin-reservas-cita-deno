import { useState } from "preact/hooks";
import { type User } from "../types/index.ts";
import { Button } from "../components/ui/Button.tsx";
import { Input } from "../components/ui/Input.tsx";
import { Select } from "../components/ui/Select.tsx";
import { Icon } from "../components/ui/Icon.tsx";

interface AppointmentFiltersProps {
  psychologists: User[];
  currentUser: User;
  filters: {
    psychologistEmail?: string;
    status?: string;
    searchId?: string;
  };
}

function AppointmentFilters({
  psychologists,
  currentUser,
  filters,
}: AppointmentFiltersProps) {
  const [searchId, setSearchId] = useState(filters.searchId || "");

  const buildFilterUrl = (newFilters: Partial<typeof filters>) => {
    const params = new URLSearchParams();

    const finalFilters = { ...filters, ...newFilters };

    if (finalFilters.psychologistEmail) {
      params.set("psychologist", finalFilters.psychologistEmail);
    }
    if (finalFilters.status) {
      params.set("status", finalFilters.status);
    }
    if (finalFilters.searchId) {
      params.set("searchId", finalFilters.searchId);
    }

    return `/appointments?${params.toString()}`;
  };

  const handlePsychologistChange = (e: Event) => {
    const value = (e.target as HTMLSelectElement).value;
    globalThis.location.href = buildFilterUrl({
      psychologistEmail: value || undefined,
    });
  };

  const handleStatusChange = (e: Event) => {
    const value = (e.target as HTMLSelectElement).value;
    globalThis.location.href = buildFilterUrl({
      status: value || undefined,
    });
  };

  const handleSearchSubmit = (e: Event) => {
    e.preventDefault();
    globalThis.location.href = buildFilterUrl({
      searchId: searchId || undefined,
    });
  };

  const clearSearch = () => {
    setSearchId("");
    globalThis.location.href = buildFilterUrl({
      searchId: undefined,
    });
  };

  return (
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-2">
          <Icon
            name="eye"
            size={20}
            className="text-blue-600 dark:text-blue-400"
          />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Filtros de Búsqueda
          </h3>
        </div>
        {(filters.psychologistEmail || filters.status || filters.searchId) && (
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Filtros activos
          </span>
        )}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Filtro por psicólogo (solo superadmin) */}
        {currentUser.role === "superadmin" && (
          <div class="space-y-2">
            <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Icon name="user-cog" size={16} className="text-gray-500" />
              <span>Psicólogo</span>
            </label>
            <Select
              value={filters.psychologistEmail || ""}
              onChange={handlePsychologistChange}
              class="w-full"
            >
              <option value="">Todos los psicólogos</option>
              {psychologists.map((psychologist) => (
                <option key={psychologist.email} value={psychologist.email}>
                  {psychologist.name || psychologist.email}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Filtro por estado */}
        <div class="space-y-2">
          <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Icon name="circle" size={16} className="text-gray-500" />
            <span>Estado de la Cita</span>
          </label>
          <Select
            value={filters.status || ""}
            onChange={handleStatusChange}
            class="w-full"
          >
            <option value="">Todos los estados</option>
            <option value="pending">🟡 Pendiente</option>
            <option value="scheduled">🔵 Programada</option>
            <option value="in_progress">🟣 En Progreso</option>
            <option value="completed">🟢 Completada</option>
            <option value="cancelled">🔴 Cancelada</option>
          </Select>
        </div>

        {/* Búsqueda por ID (solo superadmin) */}
        {currentUser.role === "superadmin" && (
          <div class="space-y-2 md:col-span-2 lg:col-span-1">
            <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <span>Buscar por ID</span>
            </label>
            <form class="relative" onSubmit={handleSearchSubmit}>
              <div class="relative">
                <Input
                  type="text"
                  placeholder="Ej: abc123..."
                  value={searchId}
                  onInput={(e) =>
                    setSearchId((e.target as HTMLInputElement).value)
                  }
                  class="w-full pl-10 pr-20 py-3 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200 bg-gray-50 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600"
                />
                <Icon
                  name="hash"
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <div class="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  {searchId && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      class="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Limpiar búsqueda"
                    >
                      <Icon name="x" size={14} />
                    </button>
                  )}
                  <button
                    type="submit"
                    class="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm hover:shadow-md"
                    title="Buscar"
                  >
                    <Icon name="eye" size={14} />
                  </button>
                </div>
              </div>
            </form>
            <p class="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
              <Icon name="file-digit" size={12} />
              <span>Busca por ID completo o parcial de la cita</span>
            </p>
          </div>
        )}
      </div>

      {/* Limpiar filtros */}
      {(filters.psychologistEmail || filters.status || filters.searchId) && (
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Icon name="check" size={16} className="text-green-500" />
              <span>
                {[
                  filters.psychologistEmail && "Psicólogo",
                  filters.status && "Estado",
                  filters.searchId && "ID",
                ]
                  .filter(Boolean)
                  .join(", ")}{" "}
                filtrado
                {[
                  filters.psychologistEmail,
                  filters.status,
                  filters.searchId,
                ].filter(Boolean).length > 1
                  ? "s"
                  : ""}
              </span>
            </div>
            <Button
              href="/appointments"
              variant="outline"
              size="sm"
              class="flex items-center space-x-2"
            >
              <Icon name="x" size={14} />
              <span>Limpiar todos los filtros</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentFilters;
