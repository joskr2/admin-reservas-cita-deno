// Database helper functions for Deno KV
import type {
  Appointment,
  KVAppointmentByPsychologistKey,
  KVAppointmentKey,
  KVSessionKey,
  KVUserByRoleKey,
  KVUserKey,
  Room,
  RoomId,
  User,
  UserProfile,
} from "../types/index.ts";

let kv: Deno.Kv | null = null;

/**
 * Get or create a KV instance
 */
export async function getKv(): Promise<Deno.Kv> {
  if (!kv) {
    kv = await Deno.openKv();
  }
  return kv;
}

/**
 * Close the KV connection
 */
export function closeKv(): void {
  if (kv) {
    kv.close();
    kv = null;
  }
}

// User-related functions
export async function getUserByEmail(email: string): Promise<User | null> {
  const kv = await getKv();
  const result = await kv.get<User>(["users", email] as KVUserKey);
  return result.value;
}

export async function createUser(user: User): Promise<boolean> {
  const kv = await getKv();
  const result = await kv
    .atomic()
    .set(["users", user.email] as KVUserKey, user)
    .set(
      ["users_by_role", user.role, user.email] as KVUserByRoleKey,
      user.email,
    )
    .commit();
  return result.ok;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const kv = await getKv();
  const users: UserProfile[] = [];
  const iter = kv.list<User>({ prefix: ["users"] });

  for await (const entry of iter) {
    const user = entry.value as User;
    users.push({
      email: user.email,
      role: user.role,
      name: user.name,
      createdAt: user.createdAt,
      isActive: user.isActive,
    });
  }

  return users.sort((a, b) =>
    (a.name || a.email).localeCompare(b.name || b.email)
  );
}

export async function getUsersByRole(role: string): Promise<UserProfile[]> {
  const kv = await getKv();
  const users: UserProfile[] = [];
  const iter = kv.list<string>({ prefix: ["users_by_role", role] });

  for await (const entry of iter) {
    const email = entry.value;
    const user = await getUserByEmail(email);
    if (user) {
      users.push({
        email: user.email,
        role: user.role,
        name: user.name,
        createdAt: user.createdAt,
        isActive: user.isActive,
      });
    }
  }

  return users.sort((a, b) =>
    (a.name || a.email).localeCompare(b.name || b.email)
  );
}

export async function updateUser(
  email: string,
  updates: Partial<User>,
): Promise<boolean> {
  const existingUser = await getUserByEmail(email);
  if (!existingUser) return false;

  const updatedUser = { ...existingUser, ...updates };
  const kv = await getKv();
  const result = await kv.set(["users", email] as KVUserKey, updatedUser);
  return result.ok;
}

export async function deleteUser(email: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  if (!user) return false;

  const kv = await getKv();
  const result = await kv
    .atomic()
    .delete(["users", email] as KVUserKey)
    .delete(["users_by_role", user.role, email] as KVUserByRoleKey)
    .commit();
  return result.ok;
}

// Appointment-related functions
export async function createAppointment(
  appointment: Appointment,
): Promise<boolean> {
  const kv = await getKv();
  const result = await kv
    .atomic()
    .set(["appointments", appointment.id] as KVAppointmentKey, appointment)
    .set(
      [
        "appointments_by_psychologist",
        appointment.psychologistEmail,
        appointment.id,
      ] as KVAppointmentByPsychologistKey,
      appointment,
    )
    .commit();
  return result.ok;
}

export async function getAppointmentById(
  id: string,
): Promise<Appointment | null> {
  const kv = await getKv();
  const result = await kv.get<Appointment>([
    "appointments",
    id,
  ] as KVAppointmentKey);
  return result.value;
}

export async function getAppointmentsByPsychologist(
  email: string,
): Promise<Appointment[]> {
  const kv = await getKv();
  const appointments: Appointment[] = [];
  const entries = kv.list({ prefix: ["appointments_by_psychologist", email] });

  for await (const entry of entries) {
    const appointmentKey = entry.value as unknown as Deno.KvKey;
    const appointmentResult = await kv.get<Appointment>(appointmentKey);
    if (appointmentResult.value) {
      appointments.push(appointmentResult.value);
    }
  }
  return appointments;
}

export async function getAllAppointments(): Promise<Appointment[]> {
  const kv = await getKv();
  const appointments: Appointment[] = [];
  const iter = kv.list<Appointment>({ prefix: ["appointments"] });

  for await (const entry of iter) {
    if (entry.key.length === 2) {
      // Solo las citas principales, no los índices
      appointments.push(entry.value as Appointment);
    }
  }

  return appointments.sort(
    (a, b) =>
      new Date(a.appointmentDate + " " + a.appointmentTime).getTime() -
      new Date(b.appointmentDate + " " + b.appointmentTime).getTime(),
  );
}

export async function updateAppointment(
  id: string,
  updates: Partial<Appointment>,
): Promise<boolean> {
  const kv = await getKv();
  const current = await kv.get<Appointment>([
    "appointments",
    id,
  ] as KVAppointmentKey);
  if (!current.value) return false;

  const updated = { ...current.value, ...updates };
  const result = await kv.set(
    ["appointments", id] as KVAppointmentKey,
    updated,
  );

  // Si cambió el psicólogo, actualizar índices
  if (
    updates.psychologistEmail &&
    updates.psychologistEmail !== current.value.psychologistEmail
  ) {
    await kv.delete([
      "appointments_by_psychologist",
      current.value.psychologistEmail,
      id,
    ]);
    await kv.set(
      ["appointments_by_psychologist", updates.psychologistEmail, id],
      id,
    );
  }

  return result.ok;
}

export async function deleteAppointment(id: string): Promise<boolean> {
  const kv = await getKv();
  const appointment = await getAppointmentById(id);
  if (!appointment) return false;

  const result = await kv
    .atomic()
    .delete(["appointments", id] as KVAppointmentKey)
    .delete([
      "appointments_by_psychologist",
      appointment.psychologistEmail,
      id,
    ] as KVAppointmentByPsychologistKey)
    .commit();
  return result.ok;
}

// Room-related functions
export async function initializeRooms(): Promise<void> {
  const kv = await getKv();
  const rooms: Room[] = [
    {
      id: "A",
      name: "Sala A - Terapia Individual",
      isAvailable: true,
      equipment: ["Sillón", "Mesa", "Lámpara"],
    },
    {
      id: "B",
      name: "Sala B - Terapia Familiar",
      isAvailable: true,
      equipment: ["Sofá", "Sillas", "Mesa de centro"],
    },
    {
      id: "C",
      name: "Sala C - Terapia de Grupo",
      isAvailable: true,
      equipment: ["Círculo de sillas", "Pizarra"],
    },
    {
      id: "D",
      name: "Sala D - Evaluación",
      isAvailable: true,
      equipment: ["Escritorio", "Computadora", "Tests"],
    },
    {
      id: "E",
      name: "Sala E - Relajación",
      isAvailable: true,
      equipment: ["Camilla", "Música", "Aromaterapia"],
    },
  ];

  for (const room of rooms) {
    const existing = await kv.get(["rooms", room.id]);
    if (!existing.value) {
      await kv.set(["rooms", room.id], room);
    }
  }
}

export async function getAllRooms(): Promise<Room[]> {
  const kv = await getKv();
  const rooms: Room[] = [];
  const iter = kv.list<Room>({ prefix: ["rooms"] });

  for await (const entry of iter) {
    rooms.push(entry.value as Room);
  }

  return rooms.sort((a, b) => a.id.localeCompare(b.id));
}

export async function getRoomById(id: RoomId): Promise<Room | null> {
  const kv = await getKv();
  const result = await kv.get(["rooms", id]);
  return result.value as Room | null;
}

export async function updateRoomAvailability(
  id: RoomId,
  isAvailable: boolean,
): Promise<boolean> {
  const kv = await getKv();
  const room = await getRoomById(id);
  if (!room) return false;

  const updatedRoom = { ...room, isAvailable };
  const result = await kv.set(["rooms", id], updatedRoom);
  return result.ok;
}

export async function getAvailableRooms(
  date: string,
  time: string,
  excludeAppointmentId?: string,
): Promise<Room[]> {
  const allRooms = await getAllRooms();
  const appointments = await getAllAppointments();

  // Filtrar citas en la misma fecha y hora
  const conflictingAppointments = appointments.filter(
    (apt) =>
      apt.appointmentDate === date &&
      apt.appointmentTime === time &&
      apt.status !== "cancelled" &&
      apt.id !== excludeAppointmentId,
  );

  const occupiedRoomIds = conflictingAppointments.map((apt) => apt.roomId);

  return allRooms.filter(
    (room) => room.isAvailable && !occupiedRoomIds.includes(room.id),
  );
}

// Session management
export async function createSession(
  sessionId: string,
  userEmail: string,
): Promise<void> {
  const session = {
    userEmail,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
  };
  const kv = await getKv();
  await kv.set(["sessions", sessionId] as KVSessionKey, session);
}

export async function getSession(
  sessionId: string,
): Promise<{ userEmail: string } | null> {
  const kv = await getKv();
  const result = await kv.get(["sessions", sessionId] as KVSessionKey);
  const session = result.value as {
    userEmail: string;
    expiresAt: string;
  } | null;

  if (!session) return null;

  // Verificar si la sesión ha expirado
  if (new Date(session.expiresAt) < new Date()) {
    await kv.delete(["sessions", sessionId] as KVSessionKey);
    return null;
  }

  return { userEmail: session.userEmail };
}

export async function deleteSession(sessionId: string): Promise<void> {
  const kv = await getKv();
  await kv.delete(["sessions", sessionId] as KVSessionKey);
}

// Dashboard functions
export async function getDashboardStats(): Promise<{
  totalUsers: number;
  totalPsychologists: number;
  totalAppointments: number;
  totalRooms: number;
  availableRooms: number;
}> {
  const users = await getAllUsers();
  const appointments = await getAllAppointments();
  const rooms = await getAllRooms();

  return {
    totalUsers: users.length,
    totalPsychologists: users.filter((u) => u.role === "psychologist").length,
    totalAppointments: appointments.length,
    totalRooms: rooms.length,
    availableRooms: rooms.filter((r) => r.isAvailable).length,
  };
}
