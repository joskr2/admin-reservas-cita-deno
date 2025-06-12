/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

// Factory Pattern para crear instancias de repositorios y servicios
// Dependency Injection para mantener bajo acoplamiento

import { DatabaseConnection } from "./connection.ts";
import { UserRepository } from "./repositories/user.ts";
import { AppointmentRepository } from "./repositories/appointment.ts";
import { RoomRepository } from "./repositories/room.ts";
import { SessionRepository } from "./repositories/session.ts";
import { DashboardService } from "./services/dashboard.ts";

import type {
  IDatabaseConnection,
  IUserRepository,
  IAppointmentRepository,
  IRoomRepository,
  ISessionRepository,
  IDashboardService,
} from "./interfaces.ts";

// Factory class siguiendo el patrón Singleton para las instancias de repositorios
export class DatabaseFactory {
  private static instance: DatabaseFactory;
  private connection: IDatabaseConnection;
  private userRepository?: IUserRepository;
  private appointmentRepository?: IAppointmentRepository;
  private roomRepository?: IRoomRepository;
  private sessionRepository?: ISessionRepository;
  private dashboardService?: IDashboardService;

  private constructor() {
    this.connection = DatabaseConnection.getInstance();
  }

  public static getInstance(): DatabaseFactory {
    if (!DatabaseFactory.instance) {
      DatabaseFactory.instance = new DatabaseFactory();
    }
    return DatabaseFactory.instance;
  }

  public getUserRepository(): IUserRepository {
    if (!this.userRepository) {
      this.userRepository = new UserRepository(this.connection);
    }
    return this.userRepository;
  }

  public getAppointmentRepository(): IAppointmentRepository {
    if (!this.appointmentRepository) {
      this.appointmentRepository = new AppointmentRepository(this.connection);
    }
    return this.appointmentRepository;
  }

  public getRoomRepository(): IRoomRepository {
    if (!this.roomRepository) {
      this.roomRepository = new RoomRepository(this.getAppointmentRepository());
    }
    return this.roomRepository;
  }

  public getSessionRepository(): ISessionRepository {
    if (!this.sessionRepository) {
      this.sessionRepository = new SessionRepository(this.connection);
    }
    return this.sessionRepository;
  }

  public getDashboardService(): IDashboardService {
    if (!this.dashboardService) {
      this.dashboardService = new DashboardService(
        this.getUserRepository(),
        this.getAppointmentRepository(),
        this.getRoomRepository()
      );
    }
    return this.dashboardService;
  }

  public getConnection(): IDatabaseConnection {
    return this.connection;
  }

  // Método para limpiar todas las instancias (útil para testing)
  public reset(): void {
    this.connection.close();
    this.userRepository = undefined;
    this.appointmentRepository = undefined;
    this.roomRepository = undefined;
    this.sessionRepository = undefined;
    this.dashboardService = undefined;
  }
}

// Funciones de conveniencia para acceso directo (mantiene compatibilidad con API existente)
export const dbFactory = DatabaseFactory.getInstance();

// Re-export de interfaces para facilitar imports
export type {
  IDatabaseConnection,
  IUserRepository,
  IAppointmentRepository,
  IRoomRepository,
  ISessionRepository,
  IDashboardService,
} from "./interfaces.ts";

// Funciones de conveniencia que mantienen la API existente
export const getUserRepository = () => dbFactory.getUserRepository();
export const getAppointmentRepository = () => dbFactory.getAppointmentRepository();
export const getRoomRepository = () => dbFactory.getRoomRepository();
export const getSessionRepository = () => dbFactory.getSessionRepository();
export const getDashboardService = () => dbFactory.getDashboardService();
export const getConnection = () => dbFactory.getConnection();

// Función para inicializar datos por defecto
export async function initializeDatabase(): Promise<void> {
  try {
    const roomRepository = getRoomRepository();
    await roomRepository.initializeDefaultRooms();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

// Función para cerrar todas las conexiones
export function closeDatabase(): void {
  try {
    dbFactory.reset();
    console.log("Database connections closed");
  } catch (error) {
    console.error("Error closing database:", error);
  }
}