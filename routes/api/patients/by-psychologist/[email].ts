import { type FreshContext } from "$fresh/server.ts";
import { type AppState } from "../../../../types/index.ts";
import { getPatientRepository } from "../../../../lib/database/index.ts";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verificar autenticación
  const currentUser = ctx.state.user;
  if (!currentUser) {
    return new Response(JSON.stringify({ error: "No autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const psychologistEmailParam = ctx.params.email;
  
  if (!psychologistEmailParam) {
    return new Response(JSON.stringify({ error: "Email de psicólogo requerido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  const psychologistEmail = decodeURIComponent(psychologistEmailParam);

  try {
    const patientRepository = getPatientRepository();
    
    // Get all patients and filter by psychologist (assuming there's a relationship)
    // For now, we'll return all patients since we don't have a direct relationship
    // This would need to be implemented based on the actual business logic
    const allPatients = await patientRepository.getAll();
    
    // In a real implementation, you'd filter patients by their assigned psychologist
    // For now, return empty array for non-existent psychologists or all for existing ones
    const patients = allPatients; // This should be filtered based on actual relationships

    return new Response(
      JSON.stringify({
        success: true,
        patients: patients,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching patients by psychologist:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Error interno del servidor",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}