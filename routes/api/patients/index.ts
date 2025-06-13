import { type FreshContext } from "$fresh/server.ts";
import { type AppState, type Patient } from "../../../types/index.ts";
import { getPatientRepository } from "../../../lib/database/index.ts";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  // Manejar CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
      },
    });
  }

  // Verificar autenticación
  const currentUser = ctx.state.user;
  if (!currentUser) {
    return new Response(JSON.stringify({ error: "No autenticado" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "GET") {
    return handleGet(ctx);
  } else if (req.method === "POST") {
    return handlePost(req, ctx);
  } else {
    return new Response("Method not allowed", { status: 405 });
  }
}

async function handleGet(ctx: FreshContext<AppState>) {
  try {
    const patientRepository = getPatientRepository();
    const patients = await patientRepository.getAll();

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
    console.error("Error fetching patients:", error);
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

async function handlePost(req: Request, ctx: FreshContext<AppState>) {
  try {
    let patientData;

    // Intentar parsear JSON con manejo de errores
    try {
      patientData = await req.json();
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "JSON inválido",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validar campos requeridos
    if (!patientData.name) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "El nombre del paciente es requerido",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const patientRepository = getPatientRepository();

    // Crear la entidad Patient completa
    const newPatient: Patient = {
      id: crypto.randomUUID(),
      name: patientData.name,
      email: patientData.email || undefined,
      phone: patientData.phone || undefined,
      dateOfBirth: patientData.dateOfBirth || undefined,
      gender: patientData.gender || undefined,
      address: patientData.address || undefined,
      emergencyContact: patientData.emergencyContact || undefined,
      medicalHistory: patientData.medicalHistory || undefined,
      notes: patientData.notes || undefined,
      isActive: patientData.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const success = await patientRepository.create(newPatient);

    if (success) {
      return new Response(
        JSON.stringify({
          success: true,
          patient: newPatient,
        }),
        {
          status: 201,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Error al crear el paciente",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error creating patient:", error);
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