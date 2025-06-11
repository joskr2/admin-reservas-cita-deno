import { hash } from "@felix/bcrypt";
import {
  type Appointment,
  type AppointmentStatus,
  type Room,
  type RoomId,
  type User,
} from "../types/index.ts";
import { createUser, createAppointment } from "../lib/kv.ts";

// Define all users to be seeded
const usersToSeed = [
  {
    email: "admin@horizonte.com",
    password: "password123",
    role: "superadmin" as const,
    name: "Administrador Principal",
  },
  {
    email: "psicologo1@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dr. Carlos Mendoza",
  },
  {
    email: "psicologo2@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dra. Laura Jiménez",
  },
];

// Define rooms to be seeded
const roomsToSeed: Room[] = [
  {
    id: "A",
    name: "Sala A - Terapia Individual",
    isAvailable: true,
    equipment: [
      "Sillón reclinable",
      "Mesa auxiliar",
      "Lámpara de ambiente",
      "Caja de pañuelos",
    ],
  },
  {
    id: "B",
    name: "Sala B - Terapia Familiar",
    isAvailable: true,
    equipment: [
      "Sofá de 3 plazas",
      "Sillas individuales",
      "Mesa de centro",
      "Juegos familiares",
    ],
  },
  {
    id: "C",
    name: "Sala C - Terapia de Grupo",
    isAvailable: true,
    equipment: [
      "Círculo de 8 sillas",
      "Pizarra",
      "Proyector",
      "Sistema de audio",
    ],
  },
  {
    id: "D",
    name: "Sala D - Evaluación Psicológica",
    isAvailable: true,
    equipment: [
      "Escritorio",
      "Computadora",
      "Tests psicológicos",
      "Cronómetro",
    ],
  },
  {
    id: "E",
    name: "Sala E - Relajación y Mindfulness",
    isAvailable: true,
    equipment: [
      "Camilla de relajación",
      "Sistema de música",
      "Aromaterapia",
      "Mantas",
    ],
  },
];

// Define sample appointments to be seeded
const appointmentsToSeed: Appointment[] = [
  {
    id: "apt-001-2024-12-15",
    psychologistEmail: "psicologo1@horizonte.com",
    psychologistName: "Dr. Carlos Mendoza",
    patientName: "María González",
    appointmentDate: "2024-12-15",
    appointmentTime: "09:00",
    roomId: "A" as RoomId,
    status: "scheduled" as AppointmentStatus,
    statusHistory: [
      {
        status: "pending" as AppointmentStatus,
        changedAt: "2024-12-01T08:00:00.000Z",
        notes: "Cita creada por el sistema",
      },
      {
        status: "scheduled" as AppointmentStatus,
        changedAt: "2024-12-02T10:30:00.000Z",
        changedBy: "psicologo1@horizonte.com",
        notes: "Cita confirmada por el Dr. Carlos Mendoza",
      },
    ],
    createdAt: "2024-12-01T08:00:00.000Z",
    updatedAt: "2024-12-02T10:30:00.000Z",
    notes: "Primera consulta - evaluación inicial",
  },
  {
    id: "apt-002-2024-12-15",
    psychologistEmail: "psicologo2@horizonte.com",
    psychologistName: "Dra. Laura Jiménez",
    patientName: "Carlos Rodríguez",
    appointmentDate: "2024-12-15",
    appointmentTime: "10:30",
    roomId: "B" as RoomId,
    status: "in_progress" as AppointmentStatus,
    statusHistory: [
      {
        status: "pending" as AppointmentStatus,
        changedAt: "2024-12-01T09:15:00.000Z",
        notes: "Cita creada por el sistema",
      },
      {
        status: "scheduled" as AppointmentStatus,
        changedAt: "2024-12-02T14:20:00.000Z",
        changedBy: "psicologo2@horizonte.com",
        notes: "Cita programada por la Dra. Laura Jiménez",
      },
      {
        status: "in_progress" as AppointmentStatus,
        changedAt: "2024-12-15T10:30:00.000Z",
        changedBy: "psicologo2@horizonte.com",
        notes: "Sesión iniciada - terapia cognitivo-conductual",
      },
    ],
    createdAt: "2024-12-01T09:15:00.000Z",
    updatedAt: "2024-12-15T10:30:00.000Z",
    notes: "Seguimiento de ansiedad - sesión 3",
  },
  {
    id: "apt-003-2024-12-16",
    psychologistEmail: "psicologo1@horizonte.com",
    psychologistName: "Dr. Carlos Mendoza",
    patientName: "Ana Martínez",
    appointmentDate: "2024-12-16",
    appointmentTime: "14:00",
    roomId: "C" as RoomId,
    status: "completed" as AppointmentStatus,
    statusHistory: [
      {
        status: "pending" as AppointmentStatus,
        changedAt: "2024-11-28T16:45:00.000Z",
        notes: "Cita creada por el sistema",
      },
      {
        status: "scheduled" as AppointmentStatus,
        changedAt: "2024-11-29T11:00:00.000Z",
        changedBy: "psicologo1@horizonte.com",
        notes: "Cita confirmada para terapia familiar",
      },
      {
        status: "in_progress" as AppointmentStatus,
        changedAt: "2024-12-16T14:00:00.000Z",
        changedBy: "psicologo1@horizonte.com",
        notes: "Sesión iniciada - terapia familiar",
      },
      {
        status: "completed" as AppointmentStatus,
        changedAt: "2024-12-16T15:00:00.000Z",
        changedBy: "psicologo1@horizonte.com",
        notes: "Sesión completada exitosamente - excelente progreso",
      },
    ],
    createdAt: "2024-11-28T16:45:00.000Z",
    updatedAt: "2024-12-16T15:00:00.000Z",
    notes: "Terapia familiar - resolución de conflictos",
  },
  {
    id: "apt-004-2024-12-17",
    psychologistEmail: "psicologo2@horizonte.com",
    psychologistName: "Dra. Laura Jiménez",
    patientName: "Pedro Sánchez",
    appointmentDate: "2024-12-17",
    appointmentTime: "11:15",
    roomId: "A" as RoomId,
    status: "cancelled" as AppointmentStatus,
    statusHistory: [
      {
        status: "pending" as AppointmentStatus,
        changedAt: "2024-12-03T12:30:00.000Z",
        notes: "Cita creada por el sistema",
      },
      {
        status: "scheduled" as AppointmentStatus,
        changedAt: "2024-12-04T09:45:00.000Z",
        changedBy: "psicologo2@horizonte.com",
        notes: "Cita programada para evaluación psicológica",
      },
      {
        status: "cancelled" as AppointmentStatus,
        changedAt: "2024-12-16T18:20:00.000Z",
        changedBy: "psicologo2@horizonte.com",
        notes: "Cancelada por emergencia familiar del paciente",
      },
    ],
    createdAt: "2024-12-03T12:30:00.000Z",
    updatedAt: "2024-12-16T18:20:00.000Z",
    notes: "Evaluación psicológica - cancelada por motivos familiares",
  },
  {
    id: "apt-005-2024-12-18",
    psychologistEmail: "psicologo1@horizonte.com",
    psychologistName: "Dr. Carlos Mendoza",
    patientName: "Josué Patricio",
    appointmentDate: "2024-12-18",
    appointmentTime: "16:30",
    roomId: "D" as RoomId,
    status: "pending" as AppointmentStatus,
    statusHistory: [
      {
        status: "pending" as AppointmentStatus,
        changedAt: "2024-12-10T13:15:00.000Z",
        notes: "Cita creada - pendiente de confirmación",
      },
    ],
    createdAt: "2024-12-10T13:15:00.000Z",
    notes: "Consulta de seguimiento - manejo del estrés laboral",
  },
  {
    id: "apt-006-2024-12-19",
    psychologistEmail: "psicologo2@horizonte.com",
    psychologistName: "Dra. Laura Jiménez",
    patientName: "Sofía López",
    appointmentDate: "2024-12-19",
    appointmentTime: "08:45",
    roomId: "E" as RoomId,
    status: "scheduled" as AppointmentStatus,
    statusHistory: [
      {
        status: "pending" as AppointmentStatus,
        changedAt: "2024-12-05T15:20:00.000Z",
        notes: "Cita creada por el sistema",
      },
      {
        status: "scheduled" as AppointmentStatus,
        changedAt: "2024-12-06T10:10:00.000Z",
        changedBy: "psicologo2@horizonte.com",
        notes: "Cita confirmada para terapia de pareja",
      },
    ],
    createdAt: "2024-12-05T15:20:00.000Z",
    updatedAt: "2024-12-06T10:10:00.000Z",
    notes: "Terapia de pareja - primera sesión",
  },
];

async function seedDatabase() {
  const kv = await Deno.openKv();

  try {
    console.log("🌱 Iniciando proceso de seed...");

    // Clear existing data
    console.log("🧹 Limpiando datos existentes...");

    // Delete all existing users
    const existingUsers = kv.list({ prefix: ["users"] });
    for await (const entry of existingUsers) {
      await kv.delete(entry.key);
    }

    // Delete all existing users_by_role indexes
    const existingUsersByRole = kv.list({ prefix: ["users_by_role"] });
    for await (const entry of existingUsersByRole) {
      await kv.delete(entry.key);
    }

    // Delete all existing sessions
    const existingSessions = kv.list({ prefix: ["sessions"] });
    for await (const entry of existingSessions) {
      await kv.delete(entry.key);
    }

    // Delete all existing appointments
    const existingAppointments = kv.list({ prefix: ["appointments"] });
    for await (const entry of existingAppointments) {
      await kv.delete(entry.key);
    }

    // Delete all existing appointments_by_psychologist indexes
    const existingAppointmentsByPsychologist = kv.list({
      prefix: ["appointments_by_psychologist"],
    });
    for await (const entry of existingAppointmentsByPsychologist) {
      await kv.delete(entry.key);
    }

    // Delete all existing rooms
    const existingRooms = kv.list({ prefix: ["rooms"] });
    for await (const entry of existingRooms) {
      await kv.delete(entry.key);
    }

    // Seed users using the createUser function to ensure proper indexing
    console.log("👥 Creando usuarios...");
    for (const userSeed of usersToSeed) {
      const passwordHash = await hash(userSeed.password);
      const userData: User = {
        email: userSeed.email,
        passwordHash,
        role: userSeed.role,
        name: userSeed.name,
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      const success = await createUser(userData);
      if (success) {
        console.log(
          `   ✅ Usuario creado: ${userSeed.name} (${userSeed.email})`
        );
      } else {
        console.log(`   ❌ Error creando usuario: ${userSeed.email}`);
      }
    }

    // Seed rooms
    console.log("🏠 Creando salas...");
    for (const room of roomsToSeed) {
      await kv.set(["rooms", room.id], room);
      console.log(`   ✅ Sala creada: ${room.name}`);
    }

    // Seed appointments using the createAppointment function to ensure proper indexing
    console.log("📅 Creando citas...");
    for (const appointment of appointmentsToSeed) {
      const success = await createAppointment(appointment);
      if (success) {
        console.log(
          `   ✅ Cita creada: ${appointment.patientName} - ${appointment.appointmentDate} ${appointment.appointmentTime}`
        );
      } else {
        console.log(`   ❌ Error creando cita: ${appointment.id}`);
      }
    }

    console.log("\n🎉 ¡Seed completado exitosamente!");
    console.log("\n📊 Resumen:");
    console.log(`   👥 Usuarios: ${usersToSeed.length}`);
    console.log(`   🏠 Salas: ${roomsToSeed.length}`);
    console.log(`   📅 Citas: ${appointmentsToSeed.length}`);

    console.log("\n🔑 Credenciales de acceso:");
    for (const user of usersToSeed) {
      console.log(`   ${user.name}: ${user.email} / password123`);
    }
  } catch (error) {
    console.error("❌ Error durante el seed:", error);
    throw error;
  } finally {
    await kv.close();
  }
}

// Execute seeding if this script is run directly
if (import.meta.main) {
  await seedDatabase();
}
