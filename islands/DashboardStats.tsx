import StatsCard from "../components/dashboard/StatsCard.tsx";
import type { DashboardData } from "../types/index.ts";

export default function DashboardStats({
  totalUsers,
  totalPsychologists,
  totalAppointments,
  totalPatients,
  totalRooms,
  availableRooms,
}: DashboardData) {
  return (
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <div class="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-1">
        <StatsCard
          title="Usuarios Totales"
          value={totalUsers}
          icon="users"
          colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300"
        />
      </div>
      <div class="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-1">
        <StatsCard
          title="Psicólogos Activos"
          value={totalPsychologists}
          icon="user-cog"
          colorClass="bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300"
        />
      </div>
      <div class="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-1">
        <StatsCard
          title="Pacientes"
          value={totalPatients}
          icon="user"
          colorClass="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300"
        />
      </div>
      <div class="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-1">
        <StatsCard
          title="Citas Agendadas"
          value={totalAppointments}
          icon="calendar"
          colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300"
        />
      </div>
      <div class="col-span-1 sm:col-span-2 lg:col-span-1 xl:col-span-1">
        <StatsCard
          title="Total Salas"
          value={totalRooms}
          icon="briefcase"
          colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300"
        />
      </div>
      <div class="col-span-1 sm:col-span-2 lg:col-span-1 xl:col-span-1">
        <StatsCard
          title="Salas Disponibles"
          value={availableRooms}
          icon="check"
          colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300"
        />
      </div>
    </div>
  );
}
