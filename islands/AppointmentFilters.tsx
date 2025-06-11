import { useState } from "preact/hooks";
import { type AppointmentStatus, type UserProfile } from "../types/index.ts";
import { Button } from "../components/ui/Button.tsx";
import { Icon } from "../components/ui/Icon.tsx";

interface AppointmentFiltersProps {
  psychologists: UserProfile[];
  currentUser: UserProfile | null;
  filters: {
    search?: string;
    status?: AppointmentStatus;
    psychologist?: string;
    date?: string;
  };
}

function AppointmentFilters({
  psychologists: _psychologists,
  currentUser: _currentUser,
  filters,
}: AppointmentFiltersProps) {
  const [search, setSearch] = useState(filters.search || "");
  const [psychologist, setPsychologist] = useState(filters.psychologist || "");
  const [date, _setDate] = useState(filters.date || "");

  const buildFilterUrl = (newFilters: Partial<typeof filters>) => {
    const params = new URLSearchParams();

    const finalFilters = { ...filters, ...newFilters };

    if (finalFilters.search) {
      params.set("search", finalFilters.search);
    }
    if (finalFilters.status) {
      params.set("status", finalFilters.status);
    }
    if (finalFilters.psychologist) {
      params.set("psychologist", finalFilters.psychologist);
    }
    if (finalFilters.date) {
      params.set("date", finalFilters.date);
    }

    return `/appointments?${params.toString()}`;
  };

  const handleStatusChange = (e: Event) => {
    const value = (e.target as HTMLSelectElement).value;
    globalThis.location.href = buildFilterUrl({
      status: (value as AppointmentStatus) || undefined,
    });
  };

  const handleSearchSubmit = (e: Event) => {
    e.preventDefault();
    const newFilters: Partial<typeof filters> = { ...filters };
    if (search) {
      newFilters.search = search;
    } else {
      delete newFilters.search;
    }
    globalThis.location.href = buildFilterUrl(newFilters);
  };

  const handlePsychologistSubmit = (e: Event) => {
    e.preventDefault();
    const newFilters: Partial<typeof filters> = { ...filters };
    if (psychologist) {
      newFilters.psychologist = psychologist;
    } else {
      delete newFilters.psychologist;
    }
    globalThis.location.href = buildFilterUrl(newFilters);
  };

  const handleDateChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    const newFilters: Partial<typeof filters> = { ...filters };
    if (value) {
      newFilters.date = value;
    } else {
      delete newFilters.date;
    }
    globalThis.location.href = buildFilterUrl(newFilters);
  };

  const clearSearch = () => {
    setSearch("");
    const newFilters: Partial<typeof filters> = { ...filters };
    delete newFilters.search;
    globalThis.location.href = buildFilterUrl(newFilters);
  };

  const clearPsychologist = () => {
    setPsychologist("");
    const newFilters: Partial<typeof filters> = { ...filters };
    delete newFilters.psychologist;
    globalThis.location.href = buildFilterUrl(newFilters);
  };

  return (
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-2">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Filtros de Búsqueda
          </h3>
        </div>
        {(filters.search ||
          filters.status ||
          filters.psychologist ||
          filters.date) && (
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            Filtros activos
          </span>
        )}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Búsqueda general */}
        <div class="space-y-2">
          <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Icon name="hash" className="h-4 w-4 text-gray-500" />
            <span>Buscar</span>
          </label>
          <form onSubmit={handleSearchSubmit}>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon name="hash" className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Paciente, psicólogo o ID..."
                value={search}
                onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
              {search && (
                <button
                  type="button"
                  onClick={clearSearch}
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500"
                  title="Limpiar búsqueda"
                >
                  <Icon name="x" className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Filtro por estado */}
        <div class="space-y-2">
          <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Icon name="circle" className="h-4 w-4 text-gray-500" />
            <span>Estado</span>
          </label>
          <select
            value={filters.status || ""}
            onChange={handleStatusChange}
            title="Filtrar por estado de cita"
            aria-label="Filtrar por estado de cita"
            class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="pending">🟡 Pendiente</option>
            <option value="scheduled">🔵 Programada</option>
            <option value="in_progress">🟣 En Progreso</option>
            <option value="completed">🟢 Completada</option>
            <option value="cancelled">🔴 Cancelada</option>
          </select>
        </div>

        {/* Filtro por psicólogo */}
        <div class="space-y-2">
          <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Icon name="user-cog" className="h-4 w-4 text-gray-500" />
            <span>Psicólogo</span>
          </label>
          <form onSubmit={handlePsychologistSubmit}>
            <div class="relative">
              <input
                type="text"
                placeholder="Email del psicólogo..."
                value={psychologist}
                onInput={(e) =>
                  setPsychologist((e.target as HTMLInputElement).value)
                }
                class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              />
              {psychologist && (
                <button
                  type="button"
                  onClick={clearPsychologist}
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500"
                  title="Limpiar filtro"
                >
                  <Icon name="x" className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Filtro por fecha */}
        <div class="space-y-2">
          <label class="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Icon name="calendar" className="h-4 w-4 text-gray-500" />
            <span>Fecha</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            title="Filtrar por fecha de cita"
            aria-label="Filtrar por fecha de cita"
            class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>
      </div>

      {/* Limpiar filtros */}
      {(filters.search ||
        filters.status ||
        filters.psychologist ||
        filters.date) && (
        <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Icon name="check" className="h-4 w-4 text-green-500" />
              <span>
                Filtros aplicados:{" "}
                {[
                  filters.search && "Búsqueda",
                  filters.status && "Estado",
                  filters.psychologist && "Psicólogo",
                  filters.date && "Fecha",
                ]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => (globalThis.location.href = "/appointments")}
              class="inline-flex items-center gap-1"
            >
              <Icon name="x" className="h-3 w-3" />
              Limpiar Filtros
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentFilters;
