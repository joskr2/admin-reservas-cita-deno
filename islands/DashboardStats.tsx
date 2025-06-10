import StatsCard from "../components/dashboard/StatsCard.tsx";
import { LuUsers, LuCalendar, LuBriefcase } from "@preact-icons/lu";

interface DashboardStatsProps {
  totalUsers: number;
  totalPsychologists: number;
  totalAppointments: number;
}

export default function DashboardStats({
  totalUsers,
  totalPsychologists,
  totalAppointments,
}: DashboardStatsProps) {
  return (
    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <StatsCard
        title="Usuarios Totales"
        value={totalUsers}
        icon={<LuUsers size={24} />}
        colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300"
      />
      <StatsCard
        title="Psicólogos Activos"
        value={totalPsychologists}
        icon={<LuBriefcase size={24} />}
        colorClass="bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300"
      />
      <StatsCard
        title="Citas Agendadas"
        value={totalAppointments}
        icon={<LuCalendar size={24} />}
        colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300"
      />
    </div>
  );
}
