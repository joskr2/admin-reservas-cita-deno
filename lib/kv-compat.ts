/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

// Archivo de compatibilidad que mantiene la API existente
// usando la nueva arquitectura SOLID internamente

import {
  getUserRepository,
  getAppointmentRepository,
  getRoomRepository,
  getSessionRepository,
  getDashboardService,
  getConnection,
} from "./database/index.ts";

import type {
  Appointment,
  Room,
  RoomId,
  User,
  UserProfile,
} from "../types/index.ts";

// Re-export de la conexión con la API existente
export async function getKv(): Promise<Deno.Kv> {
  return await getConnection().getInstance();
}

export function closeKv(): void {
  getConnection().close();
}

// User-related functions (mantienen la misma API)
export async function getUserByEmail(email: string): Promise<User | null> {
  return await getUserRepository().getUserByEmail(email);
}

export async function getUserById(id: string): Promise<User | null> {
  return await getUserRepository().getUserById(id);
}

export async function createUser(user: User): Promise<boolean> {
  return await getUserRepository().create(user);
}

export async function getAllUsers(): Promise<UserProfile[]> {
  return await getUserRepository().getAllUsersAsProfiles();
}

export async function getUsersByRole(role: string): Promise<UserProfile[]> {
  return await getUserRepository().getUsersByRole(role);
}

export async function updateUser(email: string, updates: Partial<User>): Promise<boolean> {
  return await getUserRepository().update(email, updates);
}

export async function deleteUser(email: string): Promise<boolean> {
  return await getUserRepository().delete(email);
}

// Appointment-related functions (mantienen la misma API)
export async function createAppointment(appointment: Appointment): Promise<boolean> {
  return await getAppointmentRepository().create(appointment);
}

export async function getAppointmentById(id: string): Promise<Appointment | null> {
  return await getAppointmentRepository().getById(id);
}

export async function getAppointmentsByPsychologist(email: string): Promise<Appointment[]> {
  return await getAppointmentRepository().getAppointmentsByPsychologist(email);
}

export async function getAllAppointments(): Promise<Appointment[]> {
  return await getAppointmentRepository().getAll();
}

export async function updateAppointment(id: string, updates: Partial<Appointment>): Promise<boolean> {
  return await getAppointmentRepository().update(id, updates);
}

export async function deleteAppointment(id: string): Promise<boolean> {
  return await getAppointmentRepository().delete(id);
}

// Room-related functions (mantienen la misma API)
export async function initializeRooms(): Promise<void> {
  return await getRoomRepository().initializeDefaultRooms();
}

export async function getAllRooms(): Promise<Room[]> {
  return await getRoomRepository().getAll();
}

export async function getRoomById(id: RoomId): Promise<Room | null> {
  return await getRoomRepository().getById(id);
}

export async function updateRoomAvailability(id: RoomId, isAvailable: boolean): Promise<boolean> {
  return await getRoomRepository().updateAvailability(id, isAvailable);
}

export async function getAvailableRooms(
  date: string,
  time: string,
  excludeAppointmentId?: string
): Promise<Room[]> {
  return await getRoomRepository().getAvailableRooms(date, time, excludeAppointmentId);
}

// Session management (mantienen la misma API)
export async function createSession(sessionId: string, userEmail: string): Promise<void> {
  return await getSessionRepository().createSession(sessionId, userEmail);
}

export async function getSession(sessionId: string): Promise<{ userEmail: string } | null> {
  return await getSessionRepository().getSession(sessionId);
}

export async function deleteSession(sessionId: string): Promise<void> {
  return await getSessionRepository().deleteSession(sessionId);
}

// Dashboard functions (mantienen la misma API)
export async function getDashboardStats(): Promise<{
  totalUsers: number;
  totalPsychologists: number;
  totalAppointments: number;
  totalRooms: number;
  availableRooms: number;
}> {
  return await getDashboardService().getStats();
}