/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import type {
  Appointment,
  KVAppointmentByPsychologistKey,
  KVAppointmentKey,
} from "../../../types/index.ts";
import type { IAppointmentRepository } from "../interfaces.ts";
import { BaseRepository } from "./base.ts";

export class AppointmentRepository extends BaseRepository<Appointment, string>
  implements IAppointmentRepository {
  protected keyPrefix = ["appointments"];

  protected override getEntityId(entity: Appointment): string {
    return entity.id;
  }

  protected override validate(entity: Appointment): boolean {
    return super.validate(entity) &&
      typeof entity.id === "string" &&
      entity.id.length > 0 &&
      typeof entity.psychologistEmail === "string" &&
      entity.psychologistEmail.length > 0 &&
      typeof entity.appointmentDate === "string" &&
      typeof entity.appointmentTime === "string";
  }

  public override async create(appointment: Appointment): Promise<boolean> {
    if (!this.validate(appointment)) {
      console.warn("Invalid appointment data provided to create:", appointment);
      return false;
    }

    try {
      const kv = await this.getKv();

      // Usar transacciones atómicas para mantener consistencia
      const result = await kv
        .atomic()
        .set(["appointments", appointment.id] as KVAppointmentKey, appointment)
        .set([
          "appointments_by_psychologist",
          appointment.psychologistEmail,
          appointment.id,
        ] as KVAppointmentByPsychologistKey, appointment)
        .commit();

      return result.ok;
    } catch (error) {
      console.error("Error creating appointment:", error);
      return false;
    }
  }

  public async getAppointmentsByPsychologist(
    email: string,
  ): Promise<Appointment[]> {
    if (typeof email !== "string" || !email) {
      console.warn(
        "Invalid email provided to getAppointmentsByPsychologist:",
        email,
      );
      return [];
    }

    try {
      const kv = await this.getKv();
      const appointments: Appointment[] = [];
      const entries = kv.list({
        prefix: ["appointments_by_psychologist", email],
      });

      for await (const entry of entries) {
        if (entry.value && typeof entry.value === "object") {
          appointments.push(entry.value as Appointment);
        }
      }

      return this.sortAppointmentsByDateTime(appointments);
    } catch (error) {
      console.error(
        `Error getting appointments by psychologist ${email}:`,
        error,
      );
      return [];
    }
  }

  public async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    if (typeof date !== "string" || !date) {
      console.warn("Invalid date provided to getAppointmentsByDate:", date);
      return [];
    }

    try {
      const allAppointments = await this.getAll();
      const appointmentsOnDate = allAppointments.filter(
        (appointment) => appointment.appointmentDate === date,
      );

      return this.sortAppointmentsByDateTime(appointmentsOnDate);
    } catch (error) {
      console.error(`Error getting appointments by date ${date}:`, error);
      return [];
    }
  }

  public async getAppointmentsByStatus(status: string): Promise<Appointment[]> {
    if (typeof status !== "string" || !status) {
      console.warn(
        "Invalid status provided to getAppointmentsByStatus:",
        status,
      );
      return [];
    }

    try {
      const allAppointments = await this.getAll();
      const appointmentsWithStatus = allAppointments.filter(
        (appointment) => appointment.status === status,
      );

      return this.sortAppointmentsByDateTime(appointmentsWithStatus);
    } catch (error) {
      console.error(`Error getting appointments by status ${status}:`, error);
      return [];
    }
  }

  public override async getAll(): Promise<Appointment[]> {
    try {
      const kv = await this.getKv();
      const appointments: Appointment[] = [];
      const iter = kv.list<Appointment>({ prefix: ["appointments"] });

      for await (const entry of iter) {
        // Solo las citas principales, no los índices
        if (entry.key.length === 2) {
          appointments.push(entry.value);
        }
      }

      return this.sortAppointmentsByDateTime(appointments);
    } catch (error) {
      console.error("Error getting all appointments:", error);
      return [];
    }
  }

  public override async update(
    id: string,
    updates: Partial<Appointment>,
  ): Promise<boolean> {
    try {
      const kv = await this.getKv();
      const current = await kv.get<Appointment>(
        ["appointments", id] as KVAppointmentKey,
      );

      if (!current.value) return false;

      const updated = { ...current.value, ...updates };

      // Si cambió el psicólogo, actualizar índices
      if (
        updates.psychologistEmail &&
        updates.psychologistEmail !== current.value.psychologistEmail
      ) {
        const result = await kv
          .atomic()
          .set(["appointments", id] as KVAppointmentKey, updated)
          .delete([
            "appointments_by_psychologist",
            current.value.psychologistEmail,
            id,
          ] as KVAppointmentByPsychologistKey)
          .set([
            "appointments_by_psychologist",
            updates.psychologistEmail,
            id,
          ] as KVAppointmentByPsychologistKey, updated)
          .commit();

        return result.ok;
      }

      return await super.update(id, updates);
    } catch (error) {
      console.error(`Error updating appointment ${id}:`, error);
      return false;
    }
  }

  public override async delete(id: string): Promise<boolean> {
    try {
      const appointment = await this.getById(id);
      if (!appointment) return false;

      const kv = await this.getKv();
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
    } catch (error) {
      console.error(`Error deleting appointment ${id}:`, error);
      return false;
    }
  }

  private sortAppointmentsByDateTime(
    appointments: Appointment[],
  ): Appointment[] {
    return appointments.sort((a, b) => {
      const dateTimeA = new Date(`${a.appointmentDate} ${a.appointmentTime}`)
        .getTime();
      const dateTimeB = new Date(`${b.appointmentDate} ${b.appointmentTime}`)
        .getTime();
      return dateTimeA - dateTimeB;
    });
  }
}
