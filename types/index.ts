// Tipos centralizados para la aplicación Horizonte Clínica

// === TIPOS BASE ===
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt?: string | undefined;
}

// === TIPOS DE USUARIO ===
export type UserRole = "superadmin" | "psychologist";

export interface User {
  email: string;
  passwordHash: string;
  role: UserRole;
  name?: string | undefined; // Nombre completo del usuario
  createdAt: string;
  isActive?: boolean | undefined;
}

export interface UserProfile {
  email: string;
  role: UserRole;
  name?: string | undefined; // Nombre completo del usuario
  createdAt: string;
  isActive?: boolean | undefined;
}

export interface SessionUser {
  email: string;
  role: UserRole;
  name?: string | undefined; // Nombre completo del usuario
}

// === TIPOS DE SALAS ===
export type RoomId = "A" | "B" | "C" | "D" | "E";

export interface Room {
  id: RoomId;
  name: string;
  isAvailable: boolean;
  equipment?: string[] | undefined;
}

// === TIPOS DE CITAS ===
export type AppointmentStatus =
  | "pending"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

// Nuevo: Historial de cambios de estado
export interface AppointmentStatusHistory {
  status: AppointmentStatus;
  changedAt: string; // ISO string
  changedBy?: string | undefined; // Email del usuario que hizo el cambio
  notes?: string | undefined; // Notas del cambio
}

export interface Appointment {
  id: string;
  psychologistEmail: string;
  psychologistName?: string | undefined; // Nombre del psicólogo para mostrar
  patientName: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  roomId: RoomId; // Sala de atención asignada
  status: AppointmentStatus;
  statusHistory?: AppointmentStatusHistory[] | undefined; // Historial de cambios
  createdAt: string;
  updatedAt?: string | undefined;
  notes?: string | undefined;
}

// === TIPOS DE ESTADO DE LA APLICACIÓN ===
export interface AppState {
  user: SessionUser | null;
}

// === TIPOS DE RESPUESTA API ===
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T | undefined;
  error?: string | undefined;
  message?: string | undefined;
}

// === TIPOS DE FORMULARIOS ===
export interface LoginForm {
  email: string;
  password: string;
}

export interface CreateUserForm {
  email: string;
  password: string;
  name?: string | undefined; // Nombre completo
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
  currentPath?: string | undefined;
  user?: SessionUser | null | undefined;
  showBackButton?: boolean | undefined;
  title?: string | undefined;
}

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string; // Nombre del icono del componente Icon
  colorClass?: string | undefined;
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
  string
];
export type KVSessionKey = ["sessions", string];
export type KVRoomKey = ["rooms", RoomId];

// === TIPOS DE UTILIDADES ===
export interface PaginationParams {
  page: number;
  limit: number;
  search?: string | undefined;
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
  size?: number | undefined;
  className?: string | undefined;
}

// Nuevo: Filtros de búsqueda para citas
export interface AppointmentFilters {
  psychologistEmail?: string | undefined;
  patientName?: string | undefined;
  appointmentId?: string | undefined; // Solo para superadmin
  status?: AppointmentStatus | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  roomId?: RoomId | undefined;
}
