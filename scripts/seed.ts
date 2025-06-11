import { hash } from "@felix/bcrypt";
import { type Appointment, type AppointmentStatus } from "../types/index.ts";

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
  {
    email: "carlos.mendoza@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dr. Carlos Mendoza (Legacy)",
  },
  {
    email: "laura.jimenez@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dra. Laura Jiménez (Legacy)",
  },
];

// Define sample appointments to be seeded
const appointmentsToSeed = [
  {
    id: crypto.randomUUID(),
    patientName: "María González",
    psychologistEmail: "psicologo1@horizonte.com",
    psychologistName: "Dr. Carlos Mendoza",
    appointmentDate: "2024-12-15",
    appointmentTime: "10:00",
    status: "pending" as AppointmentStatus,
    notes: "Primera consulta - evaluación inicial",
  },
  {
    id: crypto.randomUUID(),
    patientName: "Juan Pérez",
    psychologistEmail: "psicologo2@horizonte.com",
    psychologistName: "Dra. Laura Jiménez",
    appointmentDate: "2024-12-16",
    appointmentTime: "14:30",
    status: "scheduled" as AppointmentStatus,
    notes: "Seguimiento de terapia cognitiva",
  },
  {
    id: crypto.randomUUID(),
    patientName: "Ana Rodríguez",
    psychologistEmail: "psicologo1@horizonte.com",
    psychologistName: "Dr. Carlos Mendoza",
    appointmentDate: "2024-12-17",
    appointmentTime: "09:00",
    status: "in_progress" as AppointmentStatus,
    notes: "Sesión de terapia familiar",
  },
  {
    id: crypto.randomUUID(),
    patientName: "Carlos López",
    psychologistEmail: "psicologo2@horizonte.com",
    psychologistName: "Dra. Laura Jiménez",
    appointmentDate: "2024-12-14",
    appointmentTime: "16:00",
    status: "completed" as AppointmentStatus,
    notes: "Evaluación psicológica completada",
  },
  {
    id: crypto.randomUUID(),
    patientName: "Sofia Martínez",
    psychologistEmail: "psicologo1@horizonte.com",
    psychologistName: "Dr. Carlos Mendoza",
    appointmentDate: "2024-12-18",
    appointmentTime: "11:30",
    status: "cancelled" as AppointmentStatus,
    notes: "Cancelada por el paciente",
  },
];

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");
  const kv = await Deno.openKv();

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
      .set(["users_by_role", role, email], userRecord)
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
        `- Appointment for '${appointmentData.patientName}' already exists. Skipping.`
      );
      continue;
    }

    const appointment: Appointment = {
      ...appointmentData,
      createdAt: new Date().toISOString(),
    };

    // Save the appointment
    const result = await kv
      .atomic()
      .set(["appointments", appointment.id], appointment)
      .commit();

    if (result.ok) {
      console.log(
        `✅ Appointment for '${appointment.patientName}' created successfully!`
      );
    } else {
      console.error(
        `❌ Failed to create appointment for '${appointment.patientName}'.`
      );
    }
  }

  await kv.close();
  console.log("🌱 Database seeding finished.");
}

// This allows the script to be run directly from the command line
if (import.meta.main) {
  await seedDatabase();
}
