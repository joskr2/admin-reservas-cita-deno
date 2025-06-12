/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import type { IDashboardService, IUserRepository, IAppointmentRepository, IRoomRepository } from "../interfaces.ts";

// Service siguiendo el principio de responsabilidad única
export class DashboardService implements IDashboardService {
  constructor(
    private userRepository: IUserRepository,
    private appointmentRepository: IAppointmentRepository,
    private roomRepository: IRoomRepository
  ) {}

  public async getStats(): Promise<{
    totalUsers: number;
    totalPsychologists: number;
    totalAppointments: number;
    totalRooms: number;
    availableRooms: number;
  }> {
    try {
      // Ejecutar consultas en paralelo para mejor rendimiento
      const [users, appointments, rooms] = await Promise.all([
        this.userRepository.getAllUsersAsProfiles(),
        this.appointmentRepository.getAll(),
        this.roomRepository.getAll(),
      ]);

      return {
        totalUsers: users.length,
        totalPsychologists: users.filter((u) => u.role === "psychologist").length,
        totalAppointments: appointments.length,
        totalRooms: rooms.length,
        availableRooms: rooms.filter((r) => r.isAvailable).length,
      };
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      
      // Retornar estadísticas vacías en caso de error
      return {
        totalUsers: 0,
        totalPsychologists: 0,
        totalAppointments: 0,
        totalRooms: 0,
        availableRooms: 0,
      };
    }
  }

  public async getRecentAppointments(limit = 10): Promise<Array<{
    id: string;
    patientName: string;
    psychologistEmail: string;
    appointmentDate: string;
    appointmentTime: string;
    status: string;
  }>> {
    try {
      const appointments = await this.appointmentRepository.getAll();
      
      // Ordenar por fecha/hora más reciente y limitar
      const recentAppointments = appointments
        .sort((a, b) => {
          const dateTimeA = new Date(`${a.appointmentDate} ${a.appointmentTime}`).getTime();
          const dateTimeB = new Date(`${b.appointmentDate} ${b.appointmentTime}`).getTime();
          return dateTimeB - dateTimeA; // Orden descendente
        })
        .slice(0, limit);

      return recentAppointments.map(appointment => ({
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

      appointments.forEach(appointment => {
        statusCounts[appointment.status] = (statusCounts[appointment.status] || 0) + 1;
      });

      return statusCounts;
    } catch (error) {
      console.error("Error getting appointments by status:", error);
      return {};
    }
  }

  public async getMonthlyAppointmentTrend(): Promise<Array<{ month: string; count: number }>> {
    try {
      const appointments = await this.appointmentRepository.getAll();
      const monthCounts: Record<string, number> = {};

      appointments.forEach(appointment => {
        const date = new Date(appointment.appointmentDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
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
}