// Database helper functions for Deno KV
import type {
  User,
  Appointment,
  KVUserKey,
  KVUserByRoleKey,
  KVAppointmentKey,
  KVAppointmentByPsychologistKey,
  KVSessionKey,
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
    .set(["users_by_role", user.role, user.email] as KVUserByRoleKey, user)
    .commit();
  return result.ok;
}

export async function getAllUsers(): Promise<User[]> {
  const kv = await getKv();
  const users: User[] = [];
  const entries = kv.list<User>({ prefix: ["users"] });
  for await (const entry of entries) {
    users.push(entry.value);
  }
  return users;
}

// Appointment-related functions
export async function createAppointment(
  appointment: Appointment
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
      appointment
    )
    .commit();
  return result.ok;
}

export async function getAppointmentById(
  id: string
): Promise<Appointment | null> {
  const kv = await getKv();
  const result = await kv.get<Appointment>([
    "appointments",
    id,
  ] as KVAppointmentKey);
  return result.value;
}

export async function getAppointmentsByPsychologist(
  email: string
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
  const entries = kv.list<Appointment>({ prefix: ["appointments"] });
  for await (const entry of entries) {
    appointments.push(entry.value);
  }
  return appointments;
}

export async function updateAppointment(
  id: string,
  updates: Partial<Appointment>
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
    updated
  );
  return result.ok;
}

// Session management
export async function createSession(
  sessionId: string,
  userKey: Deno.KvKey,
  expiresIn: number
): Promise<boolean> {
  const kv = await getKv();
  const result = await kv.set(
    ["sessions", sessionId] as KVSessionKey,
    userKey,
    {
      expireIn: expiresIn,
    }
  );
  return result.ok;
}

export async function getSession(
  sessionId: string
): Promise<Deno.KvKey | null> {
  const kv = await getKv();
  const result = await kv.get(["sessions", sessionId] as KVSessionKey);
  return result.value as Deno.KvKey | null;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const kv = await getKv();
  await kv.delete(["sessions", sessionId] as KVSessionKey);
}
