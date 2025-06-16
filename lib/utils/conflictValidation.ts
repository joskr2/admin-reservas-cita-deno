import {
  getAppointmentRepository,
  getRoomRepository,
  getUserRepository,
} from "../database/index.ts";
import type { Appointment, Room } from "../../types/index.ts";

export interface ConflictResult {
  hasConflicts: boolean;
  conflicts: ConflictDetail[];
}

export interface ConflictDetail {
  type: "room" | "psychologist" | "patient" | "time_overlap";
  message: string;
  conflictingAppointment?: Appointment;
  details?: Record<string, unknown>;
}

export interface AlternativeSuggestion {
  type: "alternative_room" | "alternative_time";
  roomId?: string;
  roomName?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  message: string;
  urgency: "low" | "medium" | "high";
}

/**
 * Verifica si existe un solapamiento ESTRICTO de tiempo entre dos citas
 * Una cita de 10:35-11:17 bloquea completamente ese rango.
 * Solo se permite reservar desde 11:18 en adelante o antes de 10:35.
 */
function hasTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string,
): boolean {
  const parseTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };

  const start1Minutes = parseTime(start1);
  const end1Minutes = parseTime(end1);
  const start2Minutes = parseTime(start2);
  const end2Minutes = parseTime(end2);

  // VALIDACIÓN ESTRICTA:
  // Hay conflicto si hay cualquier solapamiento de tiempo
  // Ejemplo: 10:35-11:17 vs 11:00-12:00 = CONFLICTO
  // Ejemplo: 10:35-11:17 vs 11:17-12:00 = CONFLICTO (mismo minuto de fin/inicio)
  // Ejemplo: 10:35-11:17 vs 11:18-12:00 = SIN CONFLICTO

  // Caso 1: La nueva cita comienza antes de que termine la existente
  // Y la nueva cita termina después de que comience la existente
  const hasOverlap = start1Minutes < end2Minutes && end1Minutes > start2Minutes;

  // Caso 2: Verificar que no haya solapamiento exacto en los límites
  // Si una termina exactamente cuando otra comienza, NO es conflicto
  const exactlyAdjacent = end1Minutes === start2Minutes ||
    end2Minutes === start1Minutes;

  return hasOverlap && !exactlyAdjacent;
}

/**
 * Verifica conflictos de una nueva cita
 */
export async function checkAppointmentConflicts(
  date: string,
  startTime: string,
  endTime: string,
  psychologistEmail: string,
  roomId: string,
  patientName: string,
  excludeAppointmentId?: string,
): Promise<ConflictResult> {
  const appointmentRepository = getAppointmentRepository();
  const conflicts: ConflictDetail[] = [];

  try {
    // Obtener todas las citas existentes para la fecha
    const existingAppointments = await appointmentRepository
      .getAppointmentsByDate(date);

    for (const appointment of existingAppointments) {
      // Excluir la cita actual si se está editando
      if (excludeAppointmentId && appointment.id === excludeAppointmentId) {
        continue;
      }

      // Obtener horarios de la cita existente
      const appointmentStart = appointment.startTime ||
        appointment.appointmentTime;
      const appointmentEnd = appointment.endTime || appointment.appointmentTime;

      // Verificar si hay solapamiento ESTRICTO de tiempo
      const timeOverlap = hasTimeOverlap(
        startTime,
        endTime,
        appointmentStart,
        appointmentEnd,
      );

      if (!timeOverlap) {
        continue; // No hay solapamiento de tiempo, no puede haber conflicto
      }

      // CONFLICTO DE SALA - CRÍTICO
      if (appointment.roomId === roomId) {
        const roomName = appointment.roomName || `Sala ${appointment.roomId}`;
        conflicts.push({
          type: "room",
          message:
            `${roomName} está ocupada de ${appointmentStart} a ${appointmentEnd} por una cita con ${appointment.patientName}. Tu horario (${startTime}-${endTime}) se solapa con esta reserva.`,
          conflictingAppointment: appointment,
          details: {
            requestedTime: `${startTime} - ${endTime}`,
            conflictTime: `${appointmentStart} - ${appointmentEnd}`,
            conflictingPatient: appointment.patientName,
            conflictingPsychologist: appointment.psychologistName ||
              appointment.psychologistEmail,
            roomName: roomName,
            nextAvailableTime: calculateNextAvailableTime(appointmentEnd),
          },
        });
      }

      // CONFLICTO DE PSICÓLOGO - CRÍTICO
      if (appointment.psychologistEmail === psychologistEmail) {
        const psychologistName = appointment.psychologistName ||
          appointment.psychologistEmail;
        const roomName = appointment.roomName || `Sala ${appointment.roomId}`;
        conflicts.push({
          type: "psychologist",
          message:
            `${psychologistName} ya tiene una cita de ${appointmentStart} a ${appointmentEnd} con ${appointment.patientName} en ${roomName}. No puede atender dos citas simultáneamente.`,
          conflictingAppointment: appointment,
          details: {
            requestedTime: `${startTime} - ${endTime}`,
            conflictTime: `${appointmentStart} - ${appointmentEnd}`,
            conflictingPatient: appointment.patientName,
            conflictingRoom: roomName,
            psychologistName: psychologistName,
            nextAvailableTime: calculateNextAvailableTime(appointmentEnd),
          },
        });
      }

      // CONFLICTO DE PACIENTE - CRÍTICO
      if (appointment.patientName.toLowerCase() === patientName.toLowerCase()) {
        const psychologistName = appointment.psychologistName ||
          appointment.psychologistEmail;
        const roomName = appointment.roomName || `Sala ${appointment.roomId}`;
        conflicts.push({
          type: "patient",
          message:
            `${patientName} ya tiene una cita programada de ${appointmentStart} a ${appointmentEnd} con ${psychologistName} en ${roomName}. Un paciente no puede tener citas simultáneas.`,
          conflictingAppointment: appointment,
          details: {
            requestedTime: `${startTime} - ${endTime}`,
            conflictTime: `${appointmentStart} - ${appointmentEnd}`,
            conflictingPsychologist: psychologistName,
            conflictingRoom: roomName,
            nextAvailableTime: calculateNextAvailableTime(appointmentEnd),
          },
        });
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
    };
  } catch (error) {
    console.error("Error checking appointment conflicts:", error);
    return {
      hasConflicts: true,
      conflicts: [{
        type: "time_overlap",
        message:
          "Error al verificar conflictos. Por favor, inténtelo nuevamente.",
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      }],
    };
  }
}

/**
 * Genera sugerencias alternativas cuando hay conflictos
 */
export async function generateAlternativeSuggestions(
  originalDate: string,
  originalStartTime: string,
  originalEndTime: string,
  psychologistEmail: string,
  originalRoomId: string,
): Promise<AlternativeSuggestion[]> {
  const roomRepository = getRoomRepository();
  const appointmentRepository = getAppointmentRepository();
  const suggestions: AlternativeSuggestion[] = [];

  try {
    // 1. Buscar salas alternativas en el mismo horario
    const allRooms = await roomRepository.getAll();
    const availableRooms = await roomRepository.getAvailableRooms(
      originalDate,
      originalStartTime,
    );

    for (const room of availableRooms) {
      if (room.id !== originalRoomId) {
        const roomConflict = await checkAppointmentConflicts(
          originalDate,
          originalStartTime,
          originalEndTime,
          psychologistEmail,
          room.id,
          "", // No verificar conflicto de paciente para sugerencias de sala
        );

        if (!roomConflict.hasConflicts) {
          suggestions.push({
            type: "alternative_room",
            roomId: room.id,
            roomName: room.name,
            date: originalDate,
            startTime: originalStartTime,
            endTime: originalEndTime,
            message: `Usar ${room.name} en el mismo horario`,
            urgency: "medium",
          });
        }
      }
    }

    // 2. Buscar horarios alternativos en la misma sala
    const timeSlots = generateIntelligentTimeSlots(
      originalStartTime,
      originalEndTime,
    );

    for (const slot of timeSlots) {
      // Saltar el horario original
      if (
        slot.startTime === originalStartTime && slot.endTime === originalEndTime
      ) continue;

      const timeConflict = await checkAppointmentConflicts(
        originalDate,
        slot.startTime,
        slot.endTime,
        psychologistEmail,
        originalRoomId,
        "", // No verificar conflicto de paciente para sugerencias
      );

      if (!timeConflict.hasConflicts) {
        // Calcular qué tan cerca está del horario original
        const originalMinutes = parseTimeToMinutes(originalStartTime);
        const slotMinutes = parseTimeToMinutes(slot.startTime);
        const diffMinutes = Math.abs(originalMinutes - slotMinutes);

        const urgency: "low" | "medium" | "high" = diffMinutes <= 30
          ? "high" // Muy cerca (30 min o menos)
          : diffMinutes <= 90
          ? "medium" // Moderadamente cerca (1.5 horas)
          : "low"; // Más lejos

        const originalRoom = allRooms.find((r) => r.id === originalRoomId);
        const timeDiff = diffMinutes === 0
          ? "mismo horario"
          : diffMinutes < 60
          ? `${diffMinutes} min diferencia`
          : `${Math.round(diffMinutes / 60)} h diferencia`;

        suggestions.push({
          type: "alternative_time",
          roomId: originalRoomId,
          roomName: originalRoom?.name || `Sala ${originalRoomId}`,
          date: originalDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
          message: `${slot.startTime} - ${slot.endTime} en ${
            originalRoom?.name || `Sala ${originalRoomId}`
          } (${timeDiff})`,
          urgency,
        });

        // Limitar sugerencias de tiempo para evitar sobrecarga
        if (
          suggestions.filter((s) => s.type === "alternative_time").length >= 5
        ) {
          break;
        }
      }
    }

    // 3. Buscar en días adyacentes si no hay opciones el mismo día
    if (suggestions.length === 0) {
      const adjacentDates = getAdjacentDates(originalDate, 3);

      for (const adjacentDate of adjacentDates) {
        const adjacentConflict = await checkAppointmentConflicts(
          adjacentDate,
          originalStartTime,
          originalEndTime,
          psychologistEmail,
          originalRoomId,
          "",
        );

        if (!adjacentConflict.hasConflicts) {
          const originalRoom = allRooms.find((r) => r.id === originalRoomId);

          suggestions.push({
            type: "alternative_time",
            roomId: originalRoomId,
            roomName: originalRoom?.name || `Sala ${originalRoomId}`,
            date: adjacentDate,
            startTime: originalStartTime,
            endTime: originalEndTime,
            message: `${formatDate(adjacentDate)} en ${
              originalRoom?.name || `Sala ${originalRoomId}`
            }`,
            urgency: "low",
          });

          if (suggestions.length >= 3) break;
        }
      }
    }

    // Ordenar por urgencia y tiempo
    return suggestions.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    }).slice(0, 6); // Máximo 6 sugerencias
  } catch (error) {
    console.error("Error generating alternative suggestions:", error);
    return [];
  }
}

/**
 * Genera slots de tiempo disponibles para sugerencias
 */
function generateTimeSlots(): Array<{ startTime: string; endTime: string }> {
  const slots = [];
  const startHour = 8; // 8:00 AM
  const endHour = 18; // 6:00 PM
  const slotDuration = 60; // 60 minutos por slot

  for (let hour = startHour; hour < endHour; hour++) {
    const startTime = `${hour.toString().padStart(2, "0")}:00`;
    const endHour = hour + Math.floor(slotDuration / 60);
    const endMinute = slotDuration % 60;
    const endTime = `${endHour.toString().padStart(2, "0")}:${
      endMinute.toString().padStart(2, "0")
    }`;

    slots.push({ startTime, endTime });
  }

  return slots;
}

/**
 * Genera slots de tiempo inteligentes basados en el horario original solicitado
 * Preserva la duración original y sugiere horarios cercanos
 */
function generateIntelligentTimeSlots(
  originalStartTime: string,
  originalEndTime: string,
): Array<{ startTime: string; endTime: string }> {
  const slots = [];

  // Calcular duración de la cita original
  const originalStartMinutes = parseTimeToMinutes(originalStartTime);
  const originalEndMinutes = parseTimeToMinutes(originalEndTime);
  const duration = originalEndMinutes - originalStartMinutes;

  const startHour = 8; // 8:00 AM
  const endHour = 18; // 6:00 PM
  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;

  // Generar slots cada 15 minutos desde las 8:00 hasta las 18:00
  for (
    let currentMinutes = startMinutes;
    currentMinutes + duration <= endMinutes;
    currentMinutes += 15
  ) {
    const startHour = Math.floor(currentMinutes / 60);
    const startMin = currentMinutes % 60;
    const startTime = `${startHour.toString().padStart(2, "0")}:${
      startMin.toString().padStart(2, "0")
    }`;

    const endTotalMinutes = currentMinutes + duration;
    const endHour = Math.floor(endTotalMinutes / 60);
    const endMin = endTotalMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, "0")}:${
      endMin.toString().padStart(2, "0")
    }`;

    slots.push({ startTime, endTime });
  }

  // Ordenar por proximidad al horario original
  return slots.sort((a, b) => {
    const aDistance = Math.abs(
      parseTimeToMinutes(a.startTime) - originalStartMinutes,
    );
    const bDistance = Math.abs(
      parseTimeToMinutes(b.startTime) - originalStartMinutes,
    );
    return aDistance - bDistance;
  });
}

/**
 * Calcula el próximo horario disponible después de un conflicto
 */
function calculateNextAvailableTime(endTime: string): string {
  const [hours, minutes] = endTime.split(":").map(Number);
  let nextMinutes = (minutes || 0) + 1;
  let nextHours = hours || 0;

  if (nextMinutes >= 60) {
    nextMinutes = 0;
    nextHours += 1;
  }

  return `${nextHours.toString().padStart(2, "0")}:${
    nextMinutes.toString().padStart(2, "0")
  }`;
}

/**
 * Convierte tiempo en formato HH:MM a minutos
 */
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Obtiene fechas adyacentes para sugerencias
 */
function getAdjacentDates(originalDate: string, days: number): string[] {
  const date = new Date(originalDate);
  const adjacentDates = [];

  for (let i = 1; i <= days; i++) {
    // Día siguiente
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + i);
    const nextDateString = nextDate.toISOString().split("T")[0];
    if (nextDateString) adjacentDates.push(nextDateString);

    // Día anterior (solo si es futuro)
    const prevDate = new Date(date);
    prevDate.setDate(date.getDate() - i);
    if (prevDate >= new Date()) {
      const prevDateString = prevDate.toISOString().split("T")[0];
      if (prevDateString) adjacentDates.push(prevDateString);
    }
  }

  return adjacentDates.sort();
}

/**
 * Formatea fecha para mostrar al usuario
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
