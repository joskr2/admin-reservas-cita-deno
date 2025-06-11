import { hash } from "@felix/bcrypt";
import {
  type Appointment,
  type AppointmentStatus,
  type Room,
  type RoomId,
} from "../types/index.ts";

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
const appointmentsToSeed = [
  {
    id: crypto.randomUUID(),
    patientName: "María González",
    psychologistEmail: "psicologo1@horizonte.com",
    psychologistName: "Dr. Carlos Mendoza",
    appointmentDate: "2024-12-20",
    appointmentTime: "10:00",
    roomId: "A" as RoomId,
    status: "pending" as AppointmentStatus,
    notes: "Primera consulta - evaluación inicial",
  },
  {
    id: crypto.randomUUID(),
    patientName: "Juan Pérez",
    psychologistEmail: "psicologo2@horizonte.com",
    psychologistName: "Dra. Laura Jiménez",
    appointmentDate: "2024-12-21",
    appointmentTime: "14:30",
    roomId: "B" as RoomId,
    status: "scheduled" as AppointmentStatus,
    notes: "Seguimiento de terapia cognitiva",
  },
  {
    id: crypto.randomUUID(),
    patientName: "Ana Rodríguez",
    psychologistEmail: "psicologo1@horizonte.com",
    psychologistName: "Dr. Carlos Mendoza",
    appointmentDate: "2024-12-22",
    appointmentTime: "09:00",
    roomId: "C" as RoomId,
    status: "scheduled" as AppointmentStatus,
    notes: "Sesión de terapia familiar",
  },
  {
    id: crypto.randomUUID(),
    patientName: "Carlos López",
    psychologistEmail: "psicologo2@horizonte.com",
    psychologistName: "Dra. Laura Jiménez",
    appointmentDate: "2024-12-23",
    appointmentTime: "16:00",
    roomId: "D" as RoomId,
    status: "pending" as AppointmentStatus,
    notes: "Evaluación psicológica",
  },
  {
    id: crypto.randomUUID(),
    patientName: "Sofia Martínez",
    psychologistEmail: "psicologo1@horizonte.com",
    psychologistName: "Dr. Carlos Mendoza",
    appointmentDate: "2024-12-24",
    appointmentTime: "11:30",
    roomId: "E" as RoomId,
    status: "pending" as AppointmentStatus,
    notes: "Sesión de relajación y mindfulness",
  },
  {
    id: crypto.randomUUID(),
    patientName: "Roberto Silva",
    psychologistEmail: "psicologo2@horizonte.com",
    psychologistName: "Dra. Laura Jiménez",
    appointmentDate: "2024-12-26",
    appointmentTime: "15:00",
    roomId: "A" as RoomId,
    status: "scheduled" as AppointmentStatus,
    notes: "Terapia cognitivo-conductual",
  },
];

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");
  const kv = await Deno.openKv();

  // Seed rooms first
  console.log("🏢 Seeding rooms...");
  for (const room of roomsToSeed) {
    // Check if the room already exists
    const existingRoom = await kv.get(["rooms", room.id]);
    if (existingRoom.value) {
      console.log(`- Room '${room.id}' already exists. Skipping.`);
      continue;
    }

    const result = await kv.set(["rooms", room.id], room);

    if (result.ok) {
      console.log(`✅ Room '${room.id} - ${room.name}' created successfully!`);
    } else {
      console.error(`❌ Failed to create room '${room.id}'.`);
    }
  }

  // Seed users
  console.log("👥 Seeding users...");
  for (const userData of usersToSeed) {
    const { email, password, role, name } = userData;

    // Check if the user already exists to prevent overwriting
    const existingUser = await kv.get(["users", email]);
    if (existingUser.value) {
      console.log(`- User '${email}' already exists. Skipping.`);
      continue;
    }

    // Hash the password securely
    const passwordHash = await hash(password);

    const userRecord = {
      email: email,
      passwordHash: passwordHash,
      role: role,
      name: name,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    // Atomically set the user and index it by role
    const result = await kv
      .atomic()
      .set(["users", email], userRecord)
      .set(["users_by_role", role, email], email) // Guardar solo el email en el índice
      .commit();

    if (result.ok) {
      console.log(`✅ User '${email}' (${role}) created successfully!`);
    } else {
      console.error(`❌ Failed to create user '${email}'.`);
    }
  }

  // Seed appointments
  console.log("📅 Seeding appointments...");
  for (const appointmentData of appointmentsToSeed) {
    // Check if the appointment already exists
    const existingAppointment = await kv.get([
      "appointments",
      appointmentData.id,
    ]);
    if (existingAppointment.value) {
      console.log(
        `- Appointment for '${appointmentData.patientName}' already exists. Skipping.`,
      );
      continue;
    }

    const appointment: Appointment = {
      ...appointmentData,
      createdAt: new Date().toISOString(),
    };

    // Save the appointment with psychologist index
    const result = await kv
      .atomic()
      .set(["appointments", appointment.id], appointment)
      .set(
        [
          "appointments_by_psychologist",
          appointment.psychologistEmail,
          appointment.id,
        ],
        appointment.id,
      )
      .commit();

    if (result.ok) {
      console.log(
        `✅ Appointment for '${appointment.patientName}' in room ${appointment.roomId} created successfully!`,
      );
    } else {
      console.error(
        `❌ Failed to create appointment for '${appointment.patientName}'.`,
      );
    }
  }

  await kv.close();
  console.log("🌱 Database seeding finished.");
  console.log("\n📋 Summary:");
  console.log(`- ${roomsToSeed.length} rooms available (A, B, C, D, E)`);
  console.log(`- ${usersToSeed.length} users created`);
  console.log(`- ${appointmentsToSeed.length} sample appointments created`);
  console.log("\n🔑 Login credentials:");
  console.log("- Superadmin: admin@horizonte.com / password123");
  console.log("- Psicólogo 1: psicologo1@horizonte.com / password123");
  console.log("- Psicólogo 2: psicologo2@horizonte.com / password123");
}

// This allows the script to be run directly from the command line
if (import.meta.main) {
  await seedDatabase();
}
