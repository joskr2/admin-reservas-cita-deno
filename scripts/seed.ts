import { hash } from "@felix/bcrypt";
import {
  type Appointment,
  type AppointmentStatus,
  type AppointmentStatusHistory,
  type Patient,
  type Room,
  type RoomId,
  type User,
} from "../types/index.ts";
import { createAppointment, createUser } from "../lib/kv.ts";
import { PatientRepository } from "../lib/database/repositories/patient.ts";

// Define all users to be seeded
const usersToSeed = [
  {
    email: "admin@horizonte.com",
    password: "password123",
    role: "superadmin" as const,
    name: "Administrador Principal",
  },
  {
    email: "admin2@horizonte.com",
    password: "password123",
    role: "admin" as const,
    name: "María Elena Vásquez",
  },
  {
    email: "admin3@horizonte.com",
    password: "password123",
    role: "admin" as const,
    name: "Roberto Díaz",
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
    email: "psicologo3@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dr. Miguel Herrera",
  },
  {
    email: "psicologo4@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dra. Patricia Ruiz",
  },
  {
    email: "psicologo5@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dr. Fernando Castro",
  },
  {
    email: "psicologo6@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dra. Carmen Morales",
  },
  {
    email: "psicologo7@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dr. Andrés Vargas",
  },
  {
    email: "psicologo8@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dra. Silvia Ortega",
  },
  {
    email: "psicologo9@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dr. Rafael Peña",
  },
  {
    email: "psicologo10@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dra. Mónica Guerrero",
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
  {
    id: "F",
    name: "Sala F - Terapia Cognitivo-Conductual",
    isAvailable: true,
    equipment: [
      "Mesa de trabajo",
      "Sillas cómodas",
      "Pizarra interactiva",
      "Material didáctico",
    ],
  },
  {
    id: "G",
    name: "Sala G - Neuropsicología",
    isAvailable: true,
    equipment: [
      "Computadora especializada",
      "Tests neuropsicológicos",
      "Cronómetro digital",
      "Cámara de observación",
    ],
  },
  {
    id: "H",
    name: "Sala H - Terapia de Pareja",
    isAvailable: true,
    equipment: [
      "Sofá de 2 plazas",
      "Sillones individuales",
      "Mesa redonda",
      "Sistema de grabación",
    ],
  },
  {
    id: "I",
    name: "Sala I - Terapia Infantil",
    isAvailable: true,
    equipment: [
      "Juguetes terapéuticos",
      "Mesa pequeña",
      "Sillas infantiles",
      "Material de arte",
    ],
  },
  {
    id: "J",
    name: "Sala J - Rehabilitación",
    isAvailable: true,
    equipment: [
      "Equipo de biofeedback",
      "Colchonetas",
      "Pelotas terapéuticas",
      "Espejos",
    ],
  },
  {
    id: "K",
    name: "Sala K - Consulta Psiquiátrica",
    isAvailable: true,
    equipment: [
      "Escritorio médico",
      "Camilla de exploración",
      "Tensiómetro",
      "Balanza médica",
    ],
  },
  {
    id: "L",
    name: "Sala L - Sala de Espera VIP",
    isAvailable: true,
    equipment: [
      "Sofás de lujo",
      "Mesa de café",
      "Revistas especializadas",
      "Sistema de climatización",
    ],
  },
];

// Función para generar fechas aleatorias
function getRandomDate(startDate: Date, endDate: Date): string {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const randomTime = start + Math.random() * (end - start);
  return new Date(randomTime).toISOString().split('T')[0] as string;
}

// Función para generar horas aleatorias
function getRandomTime(): string {
  const hours = Math.floor(Math.random() * 10) + 8; // 8 AM a 5 PM
  const minutes = Math.random() < 0.5 ? '00' : '30';
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

// Listas de nombres de pacientes
const patientNames = [
  "María González", "Carlos Rodríguez", "Ana Martínez", "Pedro Sánchez", "Josué Patricio",
  "Sofía López", "Diego Fernández", "Carmen Ruiz", "Alberto Díaz", "Lucía Morales",
  "Francisco Herrera", "Elena Vargas", "Roberto Castro", "Isabel Ortega", "Manuel Peña",
  "Patricia Guerrero", "Jorge Méndez", "Claudia Vega", "Raúl Jiménez", "Mónica Silva",
  "Alejandro Torres", "Beatriz Ramos", "Gabriel Flores", "Cristina Aguilar", "Esteban Romero",
  "Verónica Núñez", "Andrés Contreras", "Natalia Herrera", "Luis Paredes", "Carolina Medina",
  "Fernando Ríos", "Adriana Soto", "Ignacio Valdés", "Valentina Cruz", "Mateo Espinoza",
  "Camila Rojas", "Sebastián Muñoz", "Daniela Campos", "Nicolás Parra", "Fernanda Reyes",
  "Emilio Santander", "Constanza Navarrete", "Tomás Olivares", "Francisca Bravo", "Joaquín Sáez"
];

// Listas de tipos de terapia/consulta
const therapyTypes = [
  "Primera consulta - evaluación inicial",
  "Seguimiento de ansiedad",
  "Terapia familiar - resolución de conflictos",
  "Evaluación psicológica",
  "Consulta de seguimiento - manejo del estrés laboral",
  "Terapia de pareja",
  "Terapia cognitivo-conductual",
  "Terapia de grupo - habilidades sociales",
  "Consulta neuropsicológica",
  "Terapia infantil - problemas de conducta",
  "Rehabilitación cognitiva",
  "Consulta psiquiátrica",
  "Terapia de relajación y mindfulness",
  "Evaluación de coeficiente intelectual",
  "Terapia ocupacional",
  "Consulta de duelo y pérdida",
  "Terapia para trastornos alimentarios",
  "Manejo de fobias específicas",
  "Terapia para trastorno bipolar",
  "Consulta de adicciones"
];

// Función para generar citas
function generateAppointments(): Appointment[] {
  const appointments: Appointment[] = [];
  const startDate = new Date('2024-11-01');
  const endDate = new Date('2025-01-31');
  const psychologists = usersToSeed.filter(user => user.role === 'psychologist');
  const rooms: RoomId[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  const statuses: AppointmentStatus[] = ["pending", "scheduled", "in_progress", "completed", "cancelled"];

  // Generar 200 citas
  for (let i = 1; i <= 200; i++) {
    const psychologist = psychologists[Math.floor(Math.random() * psychologists.length)]!;
    const patient = patientNames[Math.floor(Math.random() * patientNames.length)]!;
    const appointmentDate = getRandomDate(startDate, endDate);
    const appointmentTime = getRandomTime();
    const room = rooms[Math.floor(Math.random() * rooms.length)]!;
    const status = statuses[Math.floor(Math.random() * statuses.length)]!;
    const therapy = therapyTypes[Math.floor(Math.random() * therapyTypes.length)]!;
    
    const createdAt = new Date(appointmentDate);
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));
    
    const statusHistory: AppointmentStatusHistory[] = [
      {
        status: "pending" as AppointmentStatus,
        changedAt: createdAt.toISOString(),
        notes: "Cita creada por el sistema",
      }
    ];

    let updatedAt = createdAt.toISOString();

    if (status !== "pending") {
      const scheduledAt = new Date(createdAt);
      scheduledAt.setDate(scheduledAt.getDate() + Math.floor(Math.random() * 3) + 1);
      statusHistory.push({
        status: "scheduled" as AppointmentStatus,
        changedAt: scheduledAt.toISOString(),
        changedBy: psychologist.email,
        notes: `Cita confirmada por ${psychologist.name}`,
      });
      updatedAt = scheduledAt.toISOString();

      if (status === "in_progress" || status === "completed") {
        const inProgressAt = new Date(appointmentDate + 'T' + appointmentTime + ':00.000Z');
        statusHistory.push({
          status: "in_progress" as AppointmentStatus,
          changedAt: inProgressAt.toISOString(),
          changedBy: psychologist.email,
          notes: "Sesión iniciada",
        });
        updatedAt = inProgressAt.toISOString();

        if (status === "completed") {
          const completedAt = new Date(inProgressAt);
          completedAt.setHours(completedAt.getHours() + 1);
          statusHistory.push({
            status: "completed" as AppointmentStatus,
            changedAt: completedAt.toISOString(),
            changedBy: psychologist.email,
            notes: "Sesión completada exitosamente",
          });
          updatedAt = completedAt.toISOString();
        }
      }

      if (status === "cancelled") {
        const cancelledAt = new Date(appointmentDate);
        cancelledAt.setDate(cancelledAt.getDate() - Math.floor(Math.random() * 2) + 1);
        statusHistory.push({
          status: "cancelled" as AppointmentStatus,
          changedAt: cancelledAt.toISOString(),
          changedBy: psychologist.email,
          notes: "Cancelada por motivos del paciente",
        });
        updatedAt = cancelledAt.toISOString();
      }
    }

    appointments.push({
      id: `apt-${i.toString().padStart(3, '0')}-${appointmentDate}`,
      psychologistEmail: psychologist.email,
      psychologistName: psychologist.name,
      patientName: patient,
      appointmentDate,
      appointmentTime,
      roomId: room,
      status,
      statusHistory,
      createdAt: createdAt.toISOString(),
      updatedAt: status === "pending" ? undefined : updatedAt,
      notes: therapy,
    });
  }

  return appointments;
}

// Datos de pacientes
const patientsData = [
  {
    name: "María González",
    email: "maria.gonzalez@email.com",
    phone: "+56912345678",
    dateOfBirth: "1985-03-15",
    gender: "female" as const,
    address: "Av. Principal 123, Santiago",
    emergencyContact: {
      name: "Carlos González",
      phone: "+56987654321",
      relationship: "Esposo"
    },
    medicalHistory: "Historial de ansiedad generalizada",
    notes: "Paciente colaboradora, responde bien a terapia cognitivo-conductual"
  },
  {
    name: "Carlos Rodríguez",
    email: "carlos.rodriguez@email.com", 
    phone: "+56923456789",
    dateOfBirth: "1990-07-22",
    gender: "male" as const,
    address: "Calle Secundaria 456, Valparaíso",
    emergencyContact: {
      name: "Ana Rodríguez",
      phone: "+56998765432",
      relationship: "Madre"
    },
    medicalHistory: "Trastorno de pánico, episodios depresivos leves",
    notes: "Requiere seguimiento constante, mejoría progresiva"
  },
  {
    name: "Ana Martínez",
    email: "ana.martinez@email.com",
    phone: "+56934567890", 
    dateOfBirth: "1978-11-08",
    gender: "female" as const,
    address: "Pasaje Los Álamos 789, Concepción",
    emergencyContact: {
      name: "Pedro Martínez",
      phone: "+56987654323",
      relationship: "Hermano"
    },
    medicalHistory: "Terapia familiar en curso, conflictos de pareja",
    notes: "Excelente disposición al cambio, comprometida con el proceso"
  }
];

// Define sample appointments to be seeded
const appointmentsToSeed: Appointment[] = generateAppointments();

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
        id: crypto.randomUUID(),
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
          `   ✅ Usuario creado: ${userSeed.name} (${userSeed.email})`,
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

    // Seed patients
    console.log("👤 Creando pacientes...");
    const patientRepo = new PatientRepository();
    for (const patientData of patientsData) {
      const patient: Patient = {
        id: crypto.randomUUID(),
        ...patientData,
        createdAt: new Date().toISOString(),
        isActive: true,
      };
      
      const success = await patientRepo.create(patient);
      if (success) {
        console.log(`   ✅ Paciente creado: ${patient.name}`);
      } else {
        console.log(`   ❌ Error creando paciente: ${patient.name}`);
      }
    }

    // Seed appointments using the createAppointment function to ensure proper indexing
    console.log("📅 Creando citas...");
    for (const appointment of appointmentsToSeed) {
      const success = await createAppointment(appointment);
      if (success) {
        console.log(
          `   ✅ Cita creada: ${appointment.patientName} - ${appointment.appointmentDate} ${appointment.appointmentTime}`,
        );
      } else {
        console.log(`   ❌ Error creando cita: ${appointment.id}`);
      }
    }

    console.log("\n🎉 ¡Seed completado exitosamente!");
    console.log("\n📊 Resumen:");
    console.log(`   👥 Usuarios: ${usersToSeed.length}`);
    console.log(`   🏠 Salas: ${roomsToSeed.length}`);
    console.log(`   👤 Pacientes: ${patientsData.length}`);
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
