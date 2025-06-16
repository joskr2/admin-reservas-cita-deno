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
import {
  getAppointmentRepository,
  getPatientRepository,
  getRoomRepository,
  getUserRepository,
} from "../lib/database/index.ts";

// Define all users to be seeded
interface UserSeedData {
  email: string;
  password: string;
  role: "superadmin" | "admin" | "psychologist";
  name: string;
  dni: string;
  specialty?: string;
  customSpecialty?: string;
  licenseNumber?: string;
  phone?: string;
  education?: string;
  experienceYears?: number;
  bio?: string;
}

const usersToSeed: UserSeedData[] = [
  {
    email: "admin@horizonte.com",
    password: "password123",
    role: "superadmin" as const,
    name: "Administrador Principal",
    dni: "12345678A",
  },
  {
    email: "admin2@horizonte.com",
    password: "password123",
    role: "admin" as const,
    name: "María Elena Vásquez",
    dni: "87654321B",
  },
  {
    email: "admin3@horizonte.com",
    password: "password123",
    role: "admin" as const,
    name: "Roberto Díaz",
    dni: "11223344C",
  },
  {
    email: "psicologo1@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dr. Carlos Mendoza",
    dni: "98765432D",
    specialty: "Psicología Clínica",
    licenseNumber: "PSI-001-2020",
    phone: "+56912345001",
    education:
      "Psicólogo, Universidad de Chile (2015)\nMagíster en Psicología Clínica, Universidad Católica (2018)",
    experienceYears: 8,
    bio:
      "Especialista en terapia cognitivo-conductual con amplia experiencia en el tratamiento de trastornos de ansiedad y depresión.",
  },
  {
    email: "psicologo2@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dra. Laura Jiménez",
    dni: "45678901E",
    specialty: "Psicología Familiar",
    licenseNumber: "PSI-002-2019",
    phone: "+56912345002",
    education:
      "Psicóloga, Universidad Diego Portales (2014)\nEspecialización en Terapia Familiar Sistémica (2017)",
    experienceYears: 9,
    bio:
      "Terapeuta familiar sistémica con enfoque en resolución de conflictos familiares y terapia de pareja.",
  },
  {
    email: "psicologo3@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dr. Miguel Herrera",
    dni: "23456789F",
    specialty: "Neuropsicología",
    licenseNumber: "PSI-003-2018",
    phone: "+56912345003",
    education:
      "Psicólogo, Universidad de Concepción (2013)\nMagíster en Neuropsicología Clínica, Universidad de Barcelona (2016)",
    experienceYears: 10,
    bio:
      "Neuropsicólogo especializado en evaluación y rehabilitación cognitiva en adultos y adultos mayores.",
  },
  {
    email: "psicologo4@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dra. Patricia Ruiz",
    dni: "34567890G",
    specialty: "Psicología Infantil",
    licenseNumber: "PSI-004-2020",
    phone: "+56912345004",
    education:
      "Psicóloga, Universidad Alberto Hurtado (2016)\nDiplomado en Psicología Infantil y Adolescente (2019)",
    experienceYears: 7,
    bio:
      "Psicóloga infantil especializada en trastornos del desarrollo y problemas de conducta en niños y adolescentes.",
  },
  {
    email: "psicologo5@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dr. Fernando Castro",
    dni: "56789012H",
    specialty: "Psicología del Trauma",
    licenseNumber: "PSI-005-2017",
    phone: "+56912345005",
    education:
      "Psicólogo, Universidad de Valparaíso (2012)\nCertificación en EMDR y Terapia del Trauma (2018)",
    experienceYears: 11,
    bio:
      "Especialista en trastorno de estrés postraumático y terapia EMDR, con experiencia en víctimas de violencia.",
  },
  {
    email: "psicologo6@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dra. Carmen Morales",
    dni: "67890123I",
    specialty: "Psicología de Pareja",
    licenseNumber: "PSI-006-2019",
    phone: "+56912345006",
    education:
      "Psicóloga, Universidad Católica (2015)\nFormación en Terapia de Pareja Emotivo-Focalizada (2018)",
    experienceYears: 8,
    bio:
      "Terapeuta de pareja especializada en terapia emotivo-focalizada y resolución de conflictos de pareja.",
  },
  {
    email: "psicologo7@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dr. Andrés Vargas",
    dni: "78901234J",
    specialty: "Psicología de Grupos",
    licenseNumber: "PSI-007-2018",
    phone: "+56912345007",
    education:
      "Psicólogo, Universidad de la Frontera (2014)\nEspecialización en Psicoterapia Grupal (2017)",
    experienceYears: 9,
    bio:
      "Psicoterapeuta grupal con experiencia en grupos de apoyo y terapia de habilidades sociales.",
  },
  {
    email: "psicologo8@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dra. Silvia Ortega",
    dni: "89012345K",
    specialty: "Psicología Organizacional",
    licenseNumber: "PSI-008-2020",
    phone: "+56912345008",
    education:
      "Psicóloga, Universidad de los Andes (2016)\nMBA con mención en Recursos Humanos (2019)",
    experienceYears: 7,
    bio:
      "Psicóloga organizacional especializada en bienestar laboral, liderazgo y manejo del estrés ocupacional.",
  },
  {
    email: "psicologo9@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dr. Rafael Peña",
    dni: "90123456L",
    specialty: "Psicología Cognitivo-Conductual",
    licenseNumber: "PSI-009-2017",
    phone: "+56912345009",
    education:
      "Psicólogo, Universidad Mayor (2013)\nCertificación en Terapia Cognitivo-Conductual (2016)",
    experienceYears: 10,
    bio:
      "Especialista en terapia cognitivo-conductual para trastornos de ansiedad, depresión y fobias específicas.",
  },
  {
    email: "psicologo10@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
    name: "Dra. Mónica Guerrero",
    dni: "01234567M",
    specialty: "Otra",
    customSpecialty: "Psicología Deportiva",
    licenseNumber: "PSI-010-2019",
    phone: "+56912345010",
    education:
      "Psicóloga, Universidad San Sebastián (2015)\nDiplomado en Psicología del Deporte (2018)",
    experienceYears: 8,
    bio:
      "Psicóloga deportiva especializada en rendimiento atlético, motivación y manejo de la presión competitiva.",
  },
];

// Define rooms to be seeded
const roomsToSeed: Room[] = [
  {
    id: crypto.randomUUID(),
    name: "Sala A - Terapia Individual",
    isAvailable: true,
    equipment: [
      "Sillón reclinable",
      "Mesa auxiliar",
      "Lámpara de ambiente",
      "Caja de pañuelos",
    ],
    roomType: "individual",
    description:
      "Sala diseñada para sesiones de terapia individual con ambiente cálido y privado",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Sala B - Terapia Familiar",
    isAvailable: true,
    equipment: [
      "Sofá de 3 plazas",
      "Sillas individuales",
      "Mesa de centro",
      "Juegos familiares",
    ],
    roomType: "family",
    description: "Espacio amplio y cómodo para terapia familiar y de pareja",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Sala C - Terapia de Grupo",
    isAvailable: true,
    equipment: [
      "Círculo de 8 sillas",
      "Pizarra",
      "Proyector",
      "Sistema de audio",
    ],
    roomType: "group",
    description:
      "Sala configurada para sesiones grupales con capacidad para 8 personas",
    capacity: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Sala D - Evaluación Psicológica",
    isAvailable: true,
    equipment: [
      "Escritorio",
      "Computadora",
      "Tests psicológicos",
      "Cronómetro",
    ],
    roomType: "evaluation",
    description:
      "Sala equipada para evaluaciones psicológicas y neuropsicológicas",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Sala E - Relajación y Mindfulness",
    isAvailable: true,
    equipment: [
      "Camilla de relajación",
      "Sistema de música",
      "Aromaterapia",
      "Mantas",
    ],
    roomType: "relaxation",
    description: "Espacio tranquilo para técnicas de relajación y mindfulness",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Sala F - Terapia Cognitivo-Conductual",
    isAvailable: true,
    equipment: [
      "Mesa de trabajo",
      "Sillas cómodas",
      "Pizarra interactiva",
      "Material didáctico",
    ],
    roomType: "individual",
    description:
      "Sala especializada para terapia cognitivo-conductual con material didáctico",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Sala G - Neuropsicología",
    isAvailable: true,
    equipment: [
      "Computadora especializada",
      "Tests neuropsicológicos",
      "Cronómetro digital",
      "Cámara de observación",
    ],
    roomType: "evaluation",
    description: "Sala especializada para evaluaciones neuropsicológicas",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Sala H - Terapia de Pareja",
    isAvailable: true,
    equipment: [
      "Sofá de 2 plazas",
      "Sillones individuales",
      "Mesa redonda",
      "Sistema de grabación",
    ],
    roomType: "family",
    description: "Sala diseñada específicamente para terapia de pareja",
    capacity: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Sala I - Terapia Infantil",
    isAvailable: true,
    equipment: [
      "Juguetes terapéuticos",
      "Mesa pequeña",
      "Sillas infantiles",
      "Material de arte",
    ],
    roomType: "individual",
    description:
      "Sala adaptada para terapia infantil con mobiliario y materiales apropiados",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Sala J - Rehabilitación",
    isAvailable: true,
    equipment: [
      "Equipo de biofeedback",
      "Colchonetas",
      "Pelotas terapéuticas",
      "Espejos",
    ],
    roomType: "individual",
    description: "Sala equipada para rehabilitación cognitiva y física",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Sala K - Consulta Psiquiátrica",
    isAvailable: true,
    equipment: [
      "Escritorio médico",
      "Camilla de exploración",
      "Tensiómetro",
      "Balanza médica",
    ],
    roomType: "evaluation",
    description: "Sala médica para consultas psiquiátricas",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    name: "Sala L - Sala de Espera VIP",
    isAvailable: true,
    equipment: [
      "Sofás de lujo",
      "Mesa de café",
      "Revistas especializadas",
      "Sistema de climatización",
    ],
    roomType: "relaxation",
    description: "Sala de espera premium para pacientes VIP",
    capacity: 6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Función para generar fechas aleatorias
function getRandomDate(startDate: Date, endDate: Date): string {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const randomTime = start + Math.random() * (end - start);
  return new Date(randomTime).toISOString().split("T")[0] as string;
}

// Función para generar horas aleatorias
function getRandomTime(): string {
  const hours = Math.floor(Math.random() * 10) + 8; // 8 AM a 5 PM
  const minutes = Math.random() < 0.5 ? "00" : "30";
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

// Listas de nombres de pacientes
const patientNames = [
  "María González",
  "Carlos Rodríguez",
  "Ana Martínez",
  "Pedro Sánchez",
  "Josué Patricio",
  "Sofía López",
  "Diego Fernández",
  "Carmen Ruiz",
  "Alberto Díaz",
  "Lucía Morales",
  "Francisco Herrera",
  "Elena Vargas",
  "Roberto Castro",
  "Isabel Ortega",
  "Manuel Peña",
  "Patricia Guerrero",
  "Jorge Méndez",
  "Claudia Vega",
  "Raúl Jiménez",
  "Mónica Silva",
  "Alejandro Torres",
  "Beatriz Ramos",
  "Gabriel Flores",
  "Cristina Aguilar",
  "Esteban Romero",
  "Verónica Núñez",
  "Andrés Contreras",
  "Natalia Herrera",
  "Luis Paredes",
  "Carolina Medina",
  "Fernando Ríos",
  "Adriana Soto",
  "Ignacio Valdés",
  "Valentina Cruz",
  "Mateo Espinoza",
  "Camila Rojas",
  "Sebastián Muñoz",
  "Daniela Campos",
  "Nicolás Parra",
  "Fernanda Reyes",
  "Emilio Santander",
  "Constanza Navarrete",
  "Tomás Olivares",
  "Francisca Bravo",
  "Joaquín Sáez",
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
  "Consulta de adicciones",
];

// Función para generar citas
function generateAppointments(roomIds: RoomId[]): Appointment[] {
  const appointments: Appointment[] = [];
  const startDate = new Date("2024-11-01");
  const endDate = new Date("2025-01-31");
  const psychologists = usersToSeed.filter(
    (user) => user.role === "psychologist",
  );
  const statuses: AppointmentStatus[] = [
    "pending",
    "scheduled",
    "in_progress",
    "completed",
    "cancelled",
  ];

  // Generar 150 citas (reducido para testing más rápido)
  for (let i = 1; i <= 150; i++) {
    const psychologist =
      psychologists[Math.floor(Math.random() * psychologists.length)]!;
    const patient =
      patientNames[Math.floor(Math.random() * patientNames.length)]!;
    const appointmentDate = getRandomDate(startDate, endDate);
    const appointmentTime = getRandomTime();
    const room = roomIds[Math.floor(Math.random() * roomIds.length)]!;
    const status = statuses[Math.floor(Math.random() * statuses.length)]!;
    const therapy =
      therapyTypes[Math.floor(Math.random() * therapyTypes.length)]!;

    const createdAt = new Date(appointmentDate);
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));

    const statusHistory: AppointmentStatusHistory[] = [
      {
        status: "pending" as AppointmentStatus,
        changedAt: createdAt.toISOString(),
        notes: "Cita creada por el sistema",
      },
    ];

    let updatedAt = createdAt.toISOString();

    if (status !== "pending") {
      const scheduledAt = new Date(createdAt);
      scheduledAt.setDate(
        scheduledAt.getDate() + Math.floor(Math.random() * 3) + 1,
      );
      statusHistory.push({
        status: "scheduled" as AppointmentStatus,
        changedAt: scheduledAt.toISOString(),
        changedBy: psychologist.email,
        notes: `Cita confirmada por ${psychologist.name}`,
      });
      updatedAt = scheduledAt.toISOString();

      if (status === "in_progress" || status === "completed") {
        const inProgressAt = new Date(
          appointmentDate + "T" + appointmentTime + ":00.000Z",
        );
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
        cancelledAt.setDate(
          cancelledAt.getDate() - Math.floor(Math.random() * 2) + 1,
        );
        statusHistory.push({
          status: "cancelled" as AppointmentStatus,
          changedAt: cancelledAt.toISOString(),
          changedBy: psychologist.email,
          notes: "Cancelada por motivos del paciente",
        });
        updatedAt = cancelledAt.toISOString();
      }
    }

    const appointment: Appointment = {
      id: crypto.randomUUID(),
      psychologistEmail: psychologist.email,
      psychologistName: psychologist.name,
      patientName: patient,
      appointmentDate,
      appointmentTime,
      startTime: appointmentTime,
      endTime: `${parseInt(appointmentTime.split(':')[0]!) + 1}:${appointmentTime.split(':')[1]}`,
      roomId: room,
      status,
      statusHistory,
      createdAt: createdAt.toISOString(),
      updatedAt,
      notes: therapy,
    };

    appointments.push(appointment);
  }

  return appointments;
}

// Datos de pacientes expandidos para mejor testing
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
      relationship: "Esposo",
    },
    medicalHistory: "Historial de ansiedad generalizada",
    notes:
      "Paciente colaboradora, responde bien a terapia cognitivo-conductual",
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
      relationship: "Madre",
    },
    medicalHistory: "Trastorno de pánico, episodios depresivos leves",
    notes: "Requiere seguimiento constante, mejoría progresiva",
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
      relationship: "Hermano",
    },
    medicalHistory: "Terapia familiar en curso, conflictos de pareja",
    notes: "Excelente disposición al cambio, comprometida con el proceso",
  },
  {
    name: "Pedro Sánchez",
    email: "pedro.sanchez@email.com",
    phone: "+56945678901",
    dateOfBirth: "1982-05-12",
    gender: "male" as const,
    address: "Los Pinos 321, La Serena",
    emergencyContact: {
      name: "Isabel Sánchez",
      phone: "+56976543210",
      relationship: "Esposa",
    },
    medicalHistory: "Trastorno obsesivo-compulsivo",
    notes: "Paciente muy motivado, excelente adherencia al tratamiento",
  },
  {
    name: "Sofía López",
    email: "sofia.lopez@email.com",
    phone: "+56956789012",
    dateOfBirth: "1995-09-28",
    gender: "female" as const,
    address: "Av. Libertad 654, Antofagasta",
    emergencyContact: {
      name: "Luis López",
      phone: "+56965432109",
      relationship: "Padre",
    },
    medicalHistory: "Trastorno de la alimentación en recuperación",
    notes: "Progreso notable, requiere monitoreo nutricional",
  },
  {
    name: "Diego Fernández",
    email: "diego.fernandez@email.com",
    phone: "+56967890123",
    dateOfBirth: "1988-12-03",
    gender: "male" as const,
    address: "Calle Nueva 987, Temuco",
    emergencyContact: {
      name: "Carmen Fernández",
      phone: "+56954321098",
      relationship: "Hermana",
    },
    medicalHistory: "Trastorno de estrés postraumático",
    notes: "Trauma laboral, respondiendo bien a EMDR",
  },
];

// Define sample appointments to be seeded - se generarán después de crear las salas
let appointmentsToSeed: Appointment[] = [];

/**
 * Función para verificar y mostrar el estado actual de la base de datos
 */
async function checkDatabaseStatus(kv: Deno.Kv): Promise<void> {
  console.log("📊 Estado actual de la base de datos:");

  const prefixes = [
    ["users"],
    ["rooms"],
    ["patients"],
    ["appointments"],
    ["sessions"],
  ];

  for (const prefix of prefixes) {
    const entries = kv.list({ prefix });
    let count = 0;
    for await (const _entry of entries) {
      count++;
    }
    console.log(`   ${prefix[0]}: ${count} registros`);
  }
}

/**
 * Función para crear datos de testing específicos
 */
async function createTestData(_kv: Deno.Kv): Promise<void> {
  console.log("🧪 Creando datos específicos para testing...");

  // Crear usuario de testing para las pruebas automatizadas
  const userRepo = getUserRepository();
  const testUser: User = {
    id: "test-user-id",
    email: "test@horizonte.com",
    passwordHash: await hash("password123"),
    role: "superadmin",
    name: "Usuario de Prueba",
    createdAt: new Date().toISOString(),
    isActive: true,
    dni: "TEST123456",
    specialty: "Psicología Clínica",
    licenseNumber: "PSI-TEST-001",
    phone: "+56900000000",
    education: "Universidad de Prueba",
    experienceYears: 5,
    bio:
      "Usuario creado específicamente para pruebas automatizadas del sistema.",
  };

  await userRepo.create(testUser);
  console.log("   ✅ Usuario de testing creado");

  // Crear algunos pacientes con datos predecibles para testing
  const patientRepo = getPatientRepository();
  const testPatients = [
    {
      id: "test-patient-1",
      name: "Paciente Test 1",
      email: "test.patient1@email.com",
      phone: "+56900000001",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "test-patient-2",
      name: "Paciente Test 2",
      email: "test.patient2@email.com",
      phone: "+56900000002",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const patient of testPatients) {
    await patientRepo.create(patient as Patient);
    console.log(`   ✅ ${patient.name} creado para testing`);
  }
}

async function seedDatabase() {
  const kv = await Deno.openKv();

  try {
    console.log("🌱 Iniciando proceso de seed...");

    // Mostrar estado actual
    await checkDatabaseStatus(kv);

    // Clear existing data using repository pattern where possible
    console.log("\n🧹 Limpiando datos existentes...");

    // Clean up using repositories
    const userRepo = getUserRepository();
    const patientRepo = getPatientRepository();
    const roomRepo = getRoomRepository();
    const appointmentRepo = getAppointmentRepository();

    // Get all existing data and delete
    const existingUsers = await userRepo.getAll();
    for (const user of existingUsers) {
      await userRepo.delete(user.id);
    }

    const existingPatients = await patientRepo.getAll();
    for (const patient of existingPatients) {
      await patientRepo.delete(patient.id);
    }

    const existingRooms = await roomRepo.getAll();
    for (const room of existingRooms) {
      await roomRepo.delete(room.id);
    }

    const existingAppointments = await appointmentRepo.getAll();
    for (const appointment of existingAppointments) {
      await appointmentRepo.delete(appointment.id);
    }

    // Clean up any remaining direct KV entries that might not be handled by repositories
    const kvPrefixes = [
      ["users_by_role"],
      ["sessions"],
      ["appointments_by_psychologist"],
    ];

    for (const prefix of kvPrefixes) {
      const entries = kv.list({ prefix });
      for await (const entry of entries) {
        await kv.delete(entry.key);
      }
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
        dni: userSeed.dni,
        specialty: userSeed.specialty,
        customSpecialty: userSeed.customSpecialty,
        licenseNumber: userSeed.licenseNumber,
        phone: userSeed.phone,
        education: userSeed.education,
        experienceYears: userSeed.experienceYears,
        bio: userSeed.bio,
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

    // Seed rooms using repository
    console.log("🏠 Creando salas...");
    const createdRoomIds: RoomId[] = [];
    for (const room of roomsToSeed) {
      const success = await roomRepo.create(room);
      if (success) {
        createdRoomIds.push(room.id);
        console.log(`   ✅ Sala creada: ${room.name}`);
      } else {
        console.log(`   ❌ Error creando sala: ${room.name}`);
      }
    }

    // Seed patients using repository
    console.log("👤 Creando pacientes...");
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

    // Generar citas usando los IDs reales de las salas creadas
    console.log("📅 Generando citas...");
    appointmentsToSeed = generateAppointments(createdRoomIds);

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

    // Create specific test data
    await createTestData(kv);

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
