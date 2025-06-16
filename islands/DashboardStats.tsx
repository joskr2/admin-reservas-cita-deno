import StatsCard from "../components/dashboard/StatsCard.tsx";
import type { DashboardData } from "../types/index.ts";

interface DashboardStatsProps extends DashboardData {
  userRole: string;
}

export default function DashboardStats({
  totalUsers,
  totalPsychologists,
  totalAppointments,
  totalPatients,
  totalRooms,
  availableRooms,
  roomUtilization,
  availableTimeSlots,
  todayAppointments,
  upcomingAppointments,
  userRole,
}: DashboardStatsProps) {
  if (userRole === "superadmin") {
    // Vista para superadmin - estadísticas globales
    return (
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Usuarios Totales"
          value={totalUsers}
          icon="users"
          colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300"
        />
        <StatsCard
          title="Psicólogos Activos"
          value={totalPsychologists}
          icon="user-cog"
          colorClass="bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300"
        />
        <StatsCard
          title="Total Pacientes"
          value={totalPatients}
          icon="user"
          colorClass="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300"
        />
        <StatsCard
          title="Citas del Sistema"
          value={totalAppointments}
          icon="calendar"
          colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300"
        />
        <StatsCard
          title="Salas Disponibles"
          value={availableRooms}
          icon="briefcase"
          colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300"
        />
        <StatsCard
          title={`Uso de Salas (${roomUtilization}%)`}
          value={`${roomUtilization}%`}
          icon="activity"
          colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300"
        />
      </div>
    );
  }

  // Vista para psicólogos - estadísticas personales
  return (
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatsCard
        title="Mis Citas Totales"
        value={totalAppointments}
        icon="calendar"
        colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300"
      />
      <StatsCard
        title="Mis Pacientes"
        value={totalPatients}
        icon="user"
        colorClass="bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300"
      />
      <StatsCard
        title="Citas Hoy"
        value={todayAppointments}
        icon="calendar-plus"
        colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300"
      />
      <StatsCard
        title="Próximas Citas"
        value={upcomingAppointments}
        icon="clock"
        colorClass="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-300"
      />
      <StatsCard
        title="Salas Disponibles"
        value={availableRooms}
        icon="briefcase"
        colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300"
      />
      <StatsCard
        title="Horas Libres Hoy"
        value={availableTimeSlots}
        icon="check"
        colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300"
      />
    </div>
  );
}
