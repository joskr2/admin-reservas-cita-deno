/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import type {
  Appointment,
  KVAppointmentByPsychologistKey,
  KVAppointmentKey,
} from "../../../types/index.ts";
import type { IAppointmentRepository } from "../interfaces.ts";
import { BaseRepository } from "./base.ts";
import { logger, getErrorDetails, getKvResultDetails } from "../../logger.ts";

export class AppointmentRepository extends BaseRepository<Appointment, string>
  implements IAppointmentRepository {
  protected keyPrefix = ["appointments"];

  protected override getEntityId(entity: Appointment): string {
    return entity.id;
  }

  protected override validate(entity: Appointment): boolean {
    // Basic validation from parent
    if (!super.validate(entity)) {
      return false;
    }

    // Required fields
    if (!entity.id || typeof entity.id !== "string" || entity.id.length === 0) {
      return false;
    }

    if (!entity.psychologistEmail || typeof entity.psychologistEmail !== "string" || entity.psychologistEmail.length === 0) {
      return false;
    }

    if (!entity.appointmentDate || typeof entity.appointmentDate !== "string") {
      return false;
    }

    // Time validation - require either old appointmentTime OR new startTime/endTime
    const hasOldTimeFormat = entity.appointmentTime && typeof entity.appointmentTime === "string";
    const hasNewTimeFormat = entity.startTime && typeof entity.startTime === "string" && 
                              entity.endTime && typeof entity.endTime === "string";

    if (!hasOldTimeFormat && !hasNewTimeFormat) {
      return false;
    }

    // If using new format, validate time logic
    if (hasNewTimeFormat) {
      const startTime = entity.startTime;
      const endTime = entity.endTime;
      
      // Basic time format validation (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        return false;
      }

      // Validate that start time is before end time
      const startTimeParts = startTime.split(':').map(Number);
      const endTimeParts = endTime.split(':').map(Number);
      
      if (startTimeParts.length !== 2 || endTimeParts.length !== 2) {
        return false;
      }
      
      const startHour = startTimeParts[0];
      const startMin = startTimeParts[1];
      const endHour = endTimeParts[0];
      const endMin = endTimeParts[1];
      
      if (startHour === undefined || startMin === undefined || endHour === undefined || endMin === undefined) {
        return false;
      }
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        return false;
      }
    }

    return true;
  }

  public override async create(appointment: Appointment): Promise<boolean> {
    await logger.debug('DATABASE', 'Attempting to create appointment', {
      appointmentId: appointment.id,
      patientName: appointment.patientName,
      psychologistEmail: appointment.psychologistEmail,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
    });

    if (!this.validate(appointment)) {
      await logger.error('DATABASE', 'Invalid appointment data provided to create', { appointment });
      return false;
    }

    try {
      const kv = await this.getKv();

      await logger.debug('DATABASE', 'Starting atomic transaction for appointment creation', {
        appointmentId: appointment.id,
        keys: [
          ["appointments", appointment.id],
          ["appointments_by_psychologist", appointment.psychologistEmail, appointment.id]
        ]
      });

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

      const resultDetails = getKvResultDetails(result);
      await logger.info('DATABASE', 'Appointment creation transaction result', {
        appointmentId: appointment.id,
        success: resultDetails.ok,
        versionstamp: resultDetails.versionstamp,
      });

      return result.ok;
    } catch (error) {
      const errorDetails = getErrorDetails(error);
      await logger.error('DATABASE', 'Error creating appointment', {
        appointmentId: appointment.id,
        error: errorDetails.message,
        stack: errorDetails.stack,
      });
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
