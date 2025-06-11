// Tipos centralizados para la aplicación Horizonte Clínica

// === TIPOS BASE ===
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt?: string;
}

// === TIPOS DE USUARIO ===
export type UserRole = "superadmin" | "psychologist";

export interface User {
  email: string;
  passwordHash: string;
  role: UserRole;
  name?: string; // Nombre completo del usuario
  createdAt: string;
  isActive?: boolean;
}

export interface UserProfile {
  email: string;
  role: UserRole;
  name?: string; // Nombre completo del usuario
  createdAt: string;
  isActive?: boolean;
}

export interface SessionUser {
  email: string;
  role: UserRole;
  name?: string; // Nombre completo del usuario
}

// === TIPOS DE SALAS ===
export type RoomId = "A" | "B" | "C" | "D" | "E";

export interface Room {
  id: RoomId;
  name: string;
  isAvailable: boolean;
  equipment?: string[];
}

// === TIPOS DE CITAS ===
export type AppointmentStatus =
  | "pending"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Appointment {
  id: string;
  psychologistEmail: string;
  psychologistName?: string; // Nombre del psicólogo para mostrar
  patientName: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  roomId: RoomId; // Sala de atención asignada
  status: AppointmentStatus;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

// === TIPOS DE ESTADO DE LA APLICACIÓN ===
export interface AppState {
  user: SessionUser | null;
}

// === TIPOS DE RESPUESTA API ===
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// === TIPOS DE FORMULARIOS ===
export interface LoginForm {
  email: string;
  password: string;
}

export interface CreateUserForm {
  email: string;
  password: string;
  name?: string; // Nombre completo
  role: UserRole;
}

export interface CreateAppointmentForm {
  patientName: string;
  psychologistEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  roomId: RoomId;
}

// === TIPOS DE COMPONENTES ===
export interface HeaderProps {
  currentPath?: string;
  user?: SessionUser | null;
  showBackButton?: boolean;
  title?: string;
}

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string; // Nombre del icono del componente Icon
  colorClass?: string;
}

// === TIPOS DE DATOS DEL DASHBOARD ===
export interface DashboardData {
  totalUsers: number;
  totalPsychologists: number;
  totalAppointments: number;
}

// === TIPOS DE CLAVES KV ===
export type KVUserKey = ["users", string];
export type KVUserByRoleKey = ["users_by_role", UserRole, string];
export type KVAppointmentKey = ["appointments", string];
export type KVAppointmentByPsychologistKey = [
  "appointments_by_psychologist",
  string,
  string,
];
export type KVSessionKey = ["sessions", string];
export type KVRoomKey = ["rooms", RoomId];

// === TIPOS DE UTILIDADES ===
export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// === TIPOS DE TEMA ===
export type Theme = "light" | "dark";

// === TIPOS DE ICONOS ===
export interface IconProps {
  name: string;
  size?: number;
  className?: string;
}
