import { type FreshContext } from "$fresh/server.ts";
import { type Appointment, type AppState } from "../../../../types/index.ts";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  if (req.method !== "DELETE") {
    return new Response("Method not allowed", { status: 405 });
  }

  const appointmentId = ctx.params.id;

  if (!appointmentId) {
    return new Response(JSON.stringify({ error: "ID de cita requerido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const kv = await Deno.openKv();

  try {
    // Obtener la cita
    const appointmentEntry = await kv.get(["appointments", appointmentId]);

    if (!appointmentEntry.value) {
      return new Response(JSON.stringify({ error: "Cita no encontrada" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const appointment = appointmentEntry.value as Appointment;

    // Verificar permisos: psicólogos solo pueden eliminar sus propias citas
    if (
      ctx.state.user?.role === "psychologist" &&
      appointment.psychologistEmail !== ctx.state.user.email
    ) {
      return new Response(
        JSON.stringify({ error: "No tienes permisos para eliminar esta cita" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // Eliminar la cita
    const result = await kv
      .atomic()
      .check(appointmentEntry)
      .delete(["appointments", appointmentId])
      .commit();

    if (result.ok) {
      return new Response(
        JSON.stringify({ message: "Cita eliminada correctamente" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Error al eliminar la cita" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  } finally {
    await kv.close();
  }
}
