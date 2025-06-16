import { type FreshContext } from "$fresh/server.ts";
import { getAppointmentRepository, getPatientRepository } from "../../../lib/database/index.ts";
import { logger, extractUserContext } from "../../../lib/logger.ts";
import type { AppState } from "../../../types/index.ts";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const requestId = ctx.state.requestId || 'unknown';
  const userContext = extractUserContext(ctx.state.user);

  const currentUser = ctx.state.user;
  if (!currentUser) {
    await logger.warn('QUICK_BOOK_API', 'Unauthenticated user attempted quick booking', {
      url: req.url,
    }, { requestId });
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const formData = await req.formData();
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const roomId = formData.get("roomId") as string;
    const patientId = formData.get("patientId") as string;

    await logger.info('QUICK_BOOK_API', 'Quick booking request received', {
      date,
      time,
      roomId,
      patientId,
      userRole: currentUser.role,
      userEmail: currentUser.email,
    }, { requestId, ...userContext });

    if (!date || !time || !roomId || !patientId) {
      await logger.warn('QUICK_BOOK_API', 'Missing required fields for quick booking', {
        date: !!date,
        time: !!time,
        roomId: !!roomId,
        patientId: !!patientId,
      }, { requestId, ...userContext });
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Faltan campos requeridos: fecha, hora, sala y paciente" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const appointmentRepository = getAppointmentRepository();
    const patientRepository = getPatientRepository();

    // Verificar que el paciente existe
    const patient = await patientRepository.getById(patientId);
    if (!patient) {
      await logger.warn('QUICK_BOOK_API', 'Patient not found for quick booking', {
        patientId,
      }, { requestId, ...userContext });
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Paciente no encontrado" 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verificar que el horario esté disponible
    const existingAppointments = await appointmentRepository.getAppointmentsByDate(date);
    const conflictingAppointment = existingAppointments.find(apt => 
      (apt.startTime === time || apt.appointmentTime === time) && apt.roomId === roomId
    );

    if (conflictingAppointment) {
      await logger.warn('QUICK_BOOK_API', 'Time slot conflict detected', {
        date,
        time,
        roomId,
        conflictingAppointmentId: conflictingAppointment.id,
      }, { requestId, ...userContext });
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: "El horario ya está ocupado" 
      }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generar nueva cita
    const appointmentId = crypto.randomUUID();
    const endTime = calculateEndTime(time);

    const newAppointment = {
      id: appointmentId,
      psychologistEmail: currentUser.email,
      psychologistName: currentUser.name || currentUser.email,
      patientName: patient.name,
      patientId: patient.id,
      appointmentDate: date,
      appointmentTime: time, // Mantener compatibilidad
      startTime: time,
      endTime: endTime,
      roomId: roomId,
      status: "scheduled" as const,
      notes: "", // Valor vacío como se solicita
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await logger.debug('QUICK_BOOK_API', 'Creating new appointment', {
      appointmentId,
      appointment: newAppointment,
    }, { requestId, ...userContext });

    const success = await appointmentRepository.create(newAppointment);
    
    if (!success) {
      await logger.error('QUICK_BOOK_API', 'Failed to create appointment', {
        appointmentId,
      }, { requestId, ...userContext });
      
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Error al crear la cita en la base de datos" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    await logger.info('QUICK_BOOK_API', 'Appointment created successfully', {
      appointmentId: newAppointment.id,
      patientName: newAppointment.patientName,
      date: newAppointment.appointmentDate,
      time: newAppointment.startTime,
      roomId: newAppointment.roomId,
    }, { requestId, ...userContext });

    return new Response(JSON.stringify({ 
      success: true, 
      appointment: newAppointment,
      message: `Cita agendada exitosamente para ${patient.name} el ${formatDate(date)} a las ${formatTime(time)}`
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    await logger.error('QUICK_BOOK_API', 'Error creating quick appointment', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { requestId, ...userContext });

    return new Response(JSON.stringify({ 
      success: false, 
      error: "Error interno del servidor" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

function calculateEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHour = (hours || 0) + 1; // Sesiones de 1 hora por defecto
  return `${endHour.toString().padStart(2, '0')}:${(minutes || 0).toString().padStart(2, '0')}`;
}

function formatTime(time: string): string {
  const [hour, minute] = time.split(':');
  const hourNum = parseInt(hour || "0");
  const period = hourNum >= 12 ? 'PM' : 'AM';
  const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
  return `${displayHour}:${minute || "00"} ${period}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}