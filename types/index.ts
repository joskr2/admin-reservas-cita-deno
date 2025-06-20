// Tipos centralizados para la aplicación Horizonte Clínica

// === TIPOS BASE ===
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt?: string | undefined;
}

// === TIPOS DE USUARIO ===
export type UserRole = "superadmin" | "admin" | "psychologist";

export interface User {
  id: string; // ID único generado (UUID)
  email: string;
  passwordHash: string;
  role: UserRole;
  name?: string | undefined; // Nombre completo del usuario
  createdAt: string;
  isActive?: boolean | undefined;
  // Campos específicos para psicólogos
  dni?: string | undefined; // Documento Nacional de Identidad (7-30 caracteres)
  specialty?: string | undefined; // Especialidad del psicólogo
  customSpecialty?: string | undefined; // Especialidad personalizada cuando selecciona "Otra"
  licenseNumber?: string | undefined; // Número de licencia profesional
  phone?: string | undefined; // Teléfono de contacto
  education?: string | undefined; // Formación académica
  experienceYears?: number | undefined; // Años de experiencia (número)
  bio?: string | undefined; // Biografía o descripción profesional
}

export interface UserProfile {
  id: string; // ID único generado (UUID)
  email: string;
  role: UserRole;
  name?: string | undefined; // Nombre completo del usuario
  createdAt: string;
  isActive?: boolean | undefined;
  // Campos específicos para psicólogos
  dni?: string | undefined;
  specialty?: string | undefined;
  customSpecialty?: string | undefined;
  licenseNumber?: string | undefined;
  phone?: string | undefined;
  education?: string | undefined;
  experienceYears?: number | undefined;
  bio?: string | undefined;
}

export interface SessionUser {
  id: string; // ID único generado (UUID)
  email: string;
  role: UserRole;
  name?: string | undefined; // Nombre completo del usuario
}

// === TIPOS DE PACIENTES ===
export interface Patient extends BaseEntity {
  name: string;
  dni?: string | undefined; // Documento Nacional de Identidad (7-30 caracteres)
  email?: string | undefined;
  phone?: string | undefined;
  dateOfBirth?: string | undefined; // YYYY-MM-DD
  gender?: "male" | "female" | "other" | "prefer_not_say" | undefined;
  address?: string | undefined;
  emergencyContact?:
    | {
      name: string;
      phone: string;
      relationship: string;
    }
    | undefined;
  medicalHistory?: string | undefined;
  notes?: string | undefined;
  isActive: boolean;
}

export interface PatientProfile {
  id: string;
  name: string;
  dni?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  isActive: boolean;
  createdAt: string;
}

export interface CreatePatientForm {
  name: string;
  dni?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  dateOfBirth?: string | undefined;
  gender?: "male" | "female" | "other" | "prefer_not_say" | undefined;
  address?: string | undefined;
  emergencyContact?:
    | {
      name: string;
      phone: string;
      relationship: string;
    }
    | undefined;
  medicalHistory?: string | undefined;
  notes?: string | undefined;
}

// === TIPOS DE SALAS ===
export type RoomId = string; // Cambiado de letras A-Z a string para UUIDs

export interface Room extends BaseEntity {
  id: RoomId;
  name: string;
  isAvailable: boolean;
  equipment: string[];
  capacity?: number | undefined;
  roomType?:
    | "individual"
    | "family"
    | "group"
    | "evaluation"
    | "relaxation"
    | undefined;
  description?: string | undefined;
}

export interface CreateRoomForm {
  name: string;
  isAvailable: boolean;
  equipment: string[];
  capacity?: number | undefined;
  roomType?:
    | "individual"
    | "family"
    | "group"
    | "evaluation"
    | "relaxation"
    | undefined;
  description?: string | undefined;
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
  appointmentTime: string; // HH:MM - DEPRECATED: use startTime instead
  startTime: string; // HH:MM - Hora de inicio de la cita
  endTime: string; // HH:MM - Hora de fin de la cita
  roomId: RoomId; // Sala de atención asignada
  roomName?: string | undefined; // Nombre de la sala para mostrar
  status: AppointmentStatus;
  statusHistory?: AppointmentStatusHistory[] | undefined; // Historial de cambios
  createdAt: string;
  updatedAt?: string | undefined;
  notes?: string | undefined;
}

// === TIPOS DE ESTADO DE LA APLICACIÓN ===
export interface AppState {
  user: SessionUser | null;
  requestId?: string | undefined;
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
  appointmentTime: string; // DEPRECATED: use startTime instead
  startTime: string;
  endTime: string;
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
  totalPatients: number;
  totalRooms: number;
  availableRooms: number;
  // Nuevas métricas específicas para salas y horarios
  roomUtilization: number; // Porcentaje de uso de salas
  availableTimeSlots: number; // Franjas horarias disponibles hoy
  todayAppointments: number; // Citas programadas para hoy
  upcomingAppointments: number; // Citas próximas (próximos 7 días)
}

// === TIPOS DE CLAVES KV ===
export type KVUserKey = ["users", string]; // Mantener por email para compatibilidad
export type KVUserByIdKey = ["users_by_id", string]; // Nueva clave por ID
export type KVUserByRoleKey = ["users_by_role", UserRole, string];
export type KVPatientKey = ["patients", string]; // Por ID
export type KVPatientByNameKey = ["patients_by_name", string, string]; // Por nombre para búsquedas
export type KVAppointmentKey = ["appointments", string];
export type KVAppointmentByPsychologistKey = [
  "appointments_by_psychologist",
  string,
  string,
];
export type KVAppointmentByPatientKey = [
  "appointments_by_patient",
  string,
  string,
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
