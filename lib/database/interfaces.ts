/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import type {
  Appointment,
  Room,
  RoomId,
  User,
  UserProfile,
} from "../../types/index.ts";

// Interface Segregation Principle (I) - Interfaces específicas para cada responsabilidad

export interface IDatabaseConnection {
  getInstance(): Promise<Deno.Kv>;
  close(): void;
}

export interface IRepository<T, K = string> {
  create(entity: T): Promise<boolean>;
  getById(id: K): Promise<T | null>;
  getAll(): Promise<T[]>;
  update(id: K, updates: Partial<T>): Promise<boolean>;
  delete(id: K): Promise<boolean>;
}

export interface IUserRepository extends IRepository<User, string> {
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  getUsersByRole(role: string): Promise<UserProfile[]>;
  getAllUsersAsProfiles(): Promise<UserProfile[]>;
}

export interface IAppointmentRepository extends IRepository<Appointment, string> {
  getAppointmentsByPsychologist(email: string): Promise<Appointment[]>;
  getAppointmentsByDate(date: string): Promise<Appointment[]>;
  getAppointmentsByStatus(status: string): Promise<Appointment[]>;
}

export interface IRoomRepository extends IRepository<Room, RoomId> {
  updateAvailability(id: RoomId, isAvailable: boolean): Promise<boolean>;
  getAvailableRooms(date: string, time: string, excludeAppointmentId?: string): Promise<Room[]>;
  initializeDefaultRooms(): Promise<void>;
}

export interface ISessionRepository {
  createSession(sessionId: string, userEmail: string): Promise<void>;
  getSession(sessionId: string): Promise<{ userEmail: string } | null>;
  deleteSession(sessionId: string): Promise<void>;
  cleanExpiredSessions(): Promise<void>;
}

export interface IDashboardService {
  getStats(): Promise<{
    totalUsers: number;
    totalPsychologists: number;
    totalAppointments: number;
    totalRooms: number;
    availableRooms: number;
  }>;
}