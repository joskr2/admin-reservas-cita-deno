import { type FreshContext } from "$fresh/server.ts";
import {
  type AppState,
  type AppointmentStatus,
  type Appointment,
} from "../../../../types/index.ts";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const appointmentId = ctx.params.id;
  if (!appointmentId) {
    return new Response(
      JSON.stringify({ success: false, error: "ID de cita requerido" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return new Response(
        JSON.stringify({ success: false, error: "Estado requerido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validar que el estado sea válido
    const validStatuses: AppointmentStatus[] = [
      "pending",
      "scheduled",
      "in_progress",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ success: false, error: "Estado inválido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const kv = await Deno.openKv();

    try {
      // Obtener la cita actual
      const appointmentEntry = await kv.get(["appointments", appointmentId]);

      if (!appointmentEntry.value) {
        return new Response(
          JSON.stringify({ success: false, error: "Cita no encontrada" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      const appointment = appointmentEntry.value as Appointment;

      // Actualizar el estado
      const updatedAppointment = {
        ...appointment,
        status: status,
        updatedAt: new Date().toISOString(),
      };

      // Guardar la cita actualizada
      const result = await kv
        .atomic()
        .check(appointmentEntry)
        .set(["appointments", appointmentId], updatedAppointment)
        .commit();

      if (!result.ok) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Error al actualizar la cita",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Estado actualizado correctamente",
          data: updatedAppointment,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } finally {
      await kv.close();
    }
  } catch (error) {
    console.error("Error updating appointment:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
