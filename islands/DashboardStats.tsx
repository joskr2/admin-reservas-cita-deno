import StatsCard from "../components/dashboard/StatsCard.tsx";
import type { DashboardData } from "../types/index.ts";

export default function DashboardStats({
  totalUsers,
  totalPsychologists,
  totalAppointments,
}: DashboardData) {
  return (
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <StatsCard
        title="Usuarios Totales"
        value={totalUsers}
        icon="users"
        colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300"
      />
      <StatsCard
        title="Psicólogos Activos"
        value={totalPsychologists}
        icon="briefcase"
        colorClass="bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300"
      />
      <StatsCard
        title="Citas Agendadas"
        value={totalAppointments}
        icon="calendar"
        colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300"
      />
    </div>
  );
}
