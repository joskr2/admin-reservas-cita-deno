import { getAppointmentRepository, getRoomRepository, getUserRepository } from "../database/index.ts";
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
 * Verifica si existe un solapamiento de tiempo entre dos citas
 */
function hasTimeOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const parseTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const start1Minutes = parseTime(start1);
  const end1Minutes = parseTime(end1);
  const start2Minutes = parseTime(start2);
  const end2Minutes = parseTime(end2);

  // Verificar solapamiento: una cita comienza antes de que termine la otra
  return (start1Minutes < end2Minutes && end1Minutes > start2Minutes);
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
  excludeAppointmentId?: string
): Promise<ConflictResult> {
  const appointmentRepository = getAppointmentRepository();
  const conflicts: ConflictDetail[] = [];

  try {
    // Obtener todas las citas existentes para la fecha
    const existingAppointments = await appointmentRepository.getAppointmentsByDate(date);
    
    for (const appointment of existingAppointments) {
      // Excluir la cita actual si se está editando
      if (excludeAppointmentId && appointment.id === excludeAppointmentId) {
        continue;
      }

      // Verificar si hay solapamiento de tiempo
      const appointmentStart = appointment.startTime || appointment.appointmentTime;
      const appointmentEnd = appointment.endTime || appointment.appointmentTime;
      
      if (!hasTimeOverlap(startTime, endTime, appointmentStart, appointmentEnd)) {
        continue; // No hay solapamiento de tiempo, no puede haber conflicto
      }

      // Conflicto de sala
      if (appointment.roomId === roomId) {
        conflicts.push({
          type: "room",
          message: `La sala ya está ocupada en este horario por una cita con ${appointment.patientName}`,
          conflictingAppointment: appointment,
          details: {
            conflictTime: `${appointmentStart} - ${appointmentEnd}`,
            conflictingPatient: appointment.patientName,
            conflictingPsychologist: appointment.psychologistName || appointment.psychologistEmail,
          }
        });
      }

      // Conflicto de psicólogo
      if (appointment.psychologistEmail === psychologistEmail) {
        conflicts.push({
          type: "psychologist",
          message: `El psicólogo ya tiene una cita programada en este horario con ${appointment.patientName}`,
          conflictingAppointment: appointment,
          details: {
            conflictTime: `${appointmentStart} - ${appointmentEnd}`,
            conflictingPatient: appointment.patientName,
            conflictingRoom: appointment.roomName || `Sala ${appointment.roomId}`,
          }
        });
      }

      // Conflicto de paciente (mismo paciente no puede tener citas simultáneas)
      if (appointment.patientName.toLowerCase() === patientName.toLowerCase()) {
        conflicts.push({
          type: "patient",
          message: `El paciente ${patientName} ya tiene una cita programada en este horario`,
          conflictingAppointment: appointment,
          details: {
            conflictTime: `${appointmentStart} - ${appointmentEnd}`,
            conflictingPsychologist: appointment.psychologistName || appointment.psychologistEmail,
            conflictingRoom: appointment.roomName || `Sala ${appointment.roomId}`,
          }
        });
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };

  } catch (error) {
    console.error("Error checking appointment conflicts:", error);
    return {
      hasConflicts: true,
      conflicts: [{
        type: "time_overlap",
        message: "Error al verificar conflictos. Por favor, inténtelo nuevamente.",
        details: { error: error instanceof Error ? error.message : String(error) }
      }]
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
  originalRoomId: string
): Promise<AlternativeSuggestion[]> {
  const roomRepository = getRoomRepository();
  const appointmentRepository = getAppointmentRepository();
  const suggestions: AlternativeSuggestion[] = [];

  try {
    // 1. Buscar salas alternativas en el mismo horario
    const allRooms = await roomRepository.getAll();
    const availableRooms = await roomRepository.getAvailableRooms(
      originalDate,
      originalStartTime
    );

    for (const room of availableRooms) {
      if (room.id !== originalRoomId) {
        const roomConflict = await checkAppointmentConflicts(
          originalDate,
          originalStartTime,
          originalEndTime,
          psychologistEmail,
          room.id,
          "" // No verificar conflicto de paciente para sugerencias de sala
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
            urgency: "medium"
          });
        }
      }
    }

    // 2. Buscar horarios alternativos en la misma sala
    const timeSlots = generateTimeSlots();
    
    for (const slot of timeSlots) {
      // Saltar el horario original
      if (slot.startTime === originalStartTime) continue;

      const timeConflict = await checkAppointmentConflicts(
        originalDate,
        slot.startTime,
        slot.endTime,
        psychologistEmail,
        originalRoomId,
        "" // No verificar conflicto de paciente para sugerencias
      );

      if (!timeConflict.hasConflicts) {
        // Calcular qué tan cerca está del horario original
        const originalMinutes = parseTimeToMinutes(originalStartTime);
        const slotMinutes = parseTimeToMinutes(slot.startTime);
        const diffMinutes = Math.abs(originalMinutes - slotMinutes);
        
        const urgency: "low" | "medium" | "high" = 
          diffMinutes <= 60 ? "high" : 
          diffMinutes <= 120 ? "medium" : "low";

        const originalRoom = allRooms.find(r => r.id === originalRoomId);
        
        suggestions.push({
          type: "alternative_time",
          roomId: originalRoomId,
          roomName: originalRoom?.name || `Sala ${originalRoomId}`,
          date: originalDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
          message: `${slot.startTime} - ${slot.endTime} en ${originalRoom?.name || `Sala ${originalRoomId}`}`,
          urgency
        });

        // Limitar sugerencias de tiempo para evitar sobrecarga
        if (suggestions.filter(s => s.type === "alternative_time").length >= 5) {
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
          ""
        );

        if (!adjacentConflict.hasConflicts) {
          const originalRoom = allRooms.find(r => r.id === originalRoomId);
          
          suggestions.push({
            type: "alternative_time",
            roomId: originalRoomId,
            roomName: originalRoom?.name || `Sala ${originalRoomId}`,
            date: adjacentDate,
            startTime: originalStartTime,
            endTime: originalEndTime,
            message: `${formatDate(adjacentDate)} en ${originalRoom?.name || `Sala ${originalRoomId}`}`,
            urgency: "low"
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
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endHour = hour + Math.floor(slotDuration / 60);
    const endMinute = (slotDuration % 60);
    const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    
    slots.push({ startTime, endTime });
  }

  return slots;
}

/**
 * Convierte tiempo en formato HH:MM a minutos
 */
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
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
    adjacentDates.push(nextDate.toISOString().split('T')[0]);

    // Día anterior (solo si es futuro)
    const prevDate = new Date(date);
    prevDate.setDate(date.getDate() - i);
    if (prevDate >= new Date()) {
      adjacentDates.push(prevDate.toISOString().split('T')[0]);
    }
  }

  return adjacentDates.sort();
}

/**
 * Formatea fecha para mostrar al usuario
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}