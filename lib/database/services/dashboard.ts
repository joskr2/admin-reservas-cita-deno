/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import type {
  IAppointmentRepository,
  IDashboardService,
  IPatientRepository,
  IRoomRepository,
  IUserRepository,
} from "../interfaces.ts";

// Service siguiendo el principio de responsabilidad única
export class DashboardService implements IDashboardService {
  constructor(
    private userRepository: IUserRepository,
    private patientRepository: IPatientRepository,
    private appointmentRepository: IAppointmentRepository,
    private roomRepository: IRoomRepository,
  ) {}

  public async getStats(): Promise<{
    totalUsers: number;
    totalPsychologists: number;
    totalAppointments: number;
    totalPatients: number;
    totalRooms: number;
    availableRooms: number;
    roomUtilization: number;
    availableTimeSlots: number;
    todayAppointments: number;
    upcomingAppointments: number;
  }> {
    try {
      // Ejecutar consultas en paralelo para mejor rendimiento
      const [users, patients, appointments, rooms] = await Promise.all([
        this.userRepository.getAllUsersAsProfiles(),
        this.patientRepository.getAllPatientsAsProfiles(),
        this.appointmentRepository.getAll(),
        this.roomRepository.getAll(),
      ]);

      // Calcular métricas adicionales
      const today = new Date().toISOString().split("T")[0];
      const nextWeek =
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split(
          "T",
        )[0];

      const todayAppointments = appointments.filter((apt) =>
        apt.appointmentDate === today
      ).length;
      const upcomingAppointments = appointments.filter((apt) =>
        apt.appointmentDate && today && nextWeek &&
        apt.appointmentDate >= today && apt.appointmentDate <= nextWeek
      ).length;

      // Calcular utilización de salas (citas hoy / total de salas disponibles)
      const availableRoomsCount = rooms.filter((r) => r.isAvailable).length;
      const roomUtilization = availableRoomsCount > 0
        ? Math.round((todayAppointments / availableRoomsCount) * 100)
        : 0;

      // Estimar franjas horarias disponibles (8am-6pm = 10 horas, cada cita 1 hora)
      const totalSlotsPerDay = availableRoomsCount * 10; // 10 horas por sala
      const availableTimeSlots = totalSlotsPerDay - todayAppointments;

      return {
        totalUsers: users.length,
        totalPsychologists: users.filter((u) =>
          u.role === "psychologist"
        ).length,
        totalAppointments: appointments.length,
        totalPatients: patients.length,
        totalRooms: rooms.length,
        availableRooms: availableRoomsCount,
        roomUtilization,
        availableTimeSlots: Math.max(0, availableTimeSlots),
        todayAppointments,
        upcomingAppointments,
      };
    } catch (error) {
      console.error("Error getting dashboard stats:", error);

      // Retornar estadísticas vacías en caso de error
      return {
        totalUsers: 0,
        totalPsychologists: 0,
        totalAppointments: 0,
        totalPatients: 0,
        totalRooms: 0,
        availableRooms: 0,
        roomUtilization: 0,
        availableTimeSlots: 0,
        todayAppointments: 0,
        upcomingAppointments: 0,
      };
    }
  }

  public async getRecentAppointments(limit = 10): Promise<
    Array<{
      id: string;
      patientName: string;
      psychologistEmail: string;
      appointmentDate: string;
      appointmentTime: string;
      status: string;
    }>
  > {
    try {
      const appointments = await this.appointmentRepository.getAll();

      // Ordenar por fecha/hora más reciente y limitar
      const recentAppointments = appointments
        .sort((a, b) => {
          const dateTimeA = new Date(
            `${a.appointmentDate} ${a.appointmentTime}`,
          ).getTime();
          const dateTimeB = new Date(
            `${b.appointmentDate} ${b.appointmentTime}`,
          ).getTime();
          return dateTimeB - dateTimeA; // Orden descendente
        })
        .slice(0, limit);

      return recentAppointments.map((appointment) => ({
        id: appointment.id,
        patientName: appointment.patientName,
        psychologistEmail: appointment.psychologistEmail,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        status: appointment.status,
      }));
    } catch (error) {
      console.error("Error getting recent appointments:", error);
      return [];
    }
  }

  public async getAppointmentsByStatus(): Promise<Record<string, number>> {
    try {
      const appointments = await this.appointmentRepository.getAll();
      const statusCounts: Record<string, number> = {};

      appointments.forEach((appointment) => {
        statusCounts[appointment.status] =
          (statusCounts[appointment.status] || 0) + 1;
      });

      return statusCounts;
    } catch (error) {
      console.error("Error getting appointments by status:", error);
      return {};
    }
  }

  public async getMonthlyAppointmentTrend(): Promise<
    Array<{ month: string; count: number }>
  > {
    try {
      const appointments = await this.appointmentRepository.getAll();
      const monthCounts: Record<string, number> = {};

      appointments.forEach((appointment) => {
        const date = new Date(appointment.appointmentDate);
        const monthKey = `${date.getFullYear()}-${
          String(date.getMonth() + 1).padStart(2, "0")
        }`;
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      });

      return Object.entries(monthCounts)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
      console.error("Error getting monthly appointment trend:", error);
      return [];
    }
  }

  public async getPsychologistStats(psychologistEmail: string): Promise<{
    totalUsers: number;
    totalPsychologists: number;
    totalAppointments: number;
    totalPatients: number;
    totalRooms: number;
    availableRooms: number;
    roomUtilization: number;
    availableTimeSlots: number;
    todayAppointments: number;
    upcomingAppointments: number;
  }> {
    try {
      // Obtener solo los datos específicos del psicólogo
      const [psychologistAppointments, allPatients, rooms] = await Promise.all([
        this.appointmentRepository.getAppointmentsByPsychologist(
          psychologistEmail,
        ),
        this.patientRepository.getAllPatientsAsProfiles(),
        this.roomRepository.getAll(),
      ]);

      // Filtrar pacientes que tienen citas con este psicólogo
      const patientNamesWithAppointments = new Set(
        psychologistAppointments.map((apt) => apt.patientName),
      );
      const psychologistPatients = allPatients.filter((patient) =>
        patientNamesWithAppointments.has(patient.name)
      );

      // Calcular métricas de tiempo
      const today = new Date().toISOString().split("T")[0];
      const nextWeek =
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split(
          "T",
        )[0];

      const todayAppointments = psychologistAppointments.filter((apt) =>
        apt.appointmentDate === today
      ).length;
      const upcomingAppointments = psychologistAppointments.filter((apt) =>
        apt.appointmentDate && today && nextWeek &&
        apt.appointmentDate >= today && apt.appointmentDate <= nextWeek
      ).length;

      // Métricas de salas (globales pero útiles para el psicólogo)
      const availableRoomsCount = rooms.filter((r) =>
        r.isAvailable
      ).length;
      const roomUtilization = availableRoomsCount > 0
        ? Math.round((todayAppointments / availableRoomsCount) * 100)
        : 0;

      // Franjas horarias disponibles específicas para este psicólogo
      // Asumiendo jornada de 8 horas (8am-4pm) para cálculo más realista por psicólogo
      const psychologistWorkHours = 8;
      const availableTimeSlots = psychologistWorkHours - todayAppointments;

      return {
        totalUsers: 1, // Solo el psicólogo mismo
        totalPsychologists: 1, // Solo él mismo
        totalAppointments: psychologistAppointments.length,
        totalPatients: psychologistPatients.length,
        totalRooms: rooms.length,
        availableRooms: availableRoomsCount,
        roomUtilization,
        availableTimeSlots: Math.max(0, availableTimeSlots),
        todayAppointments,
        upcomingAppointments,
      };
    } catch (error) {
      console.error(
        `Error getting psychologist stats for ${psychologistEmail}:`,
        error,
      );

      // Retornar estadísticas vacías en caso de error
      return {
        totalUsers: 0,
        totalPsychologists: 0,
        totalAppointments: 0,
        totalPatients: 0,
        totalRooms: 0,
        availableRooms: 0,
        roomUtilization: 0,
        availableTimeSlots: 0,
        todayAppointments: 0,
        upcomingAppointments: 0,
      };
    }
  }
}
