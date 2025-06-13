import { type FreshContext } from "$fresh/server.ts";
import { type AppState } from "../../../types/index.ts";
import { getPatientRepository } from "../../../lib/database/index.ts";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  const patientId = ctx.params.id;
  
  if (!patientId) {
    return new Response(JSON.stringify({ error: "ID de paciente requerido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Manejar CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
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
    return handleGet(patientId);
  } else if (req.method === "PUT") {
    return handlePut(req, patientId);
  } else if (req.method === "DELETE") {
    return handleDelete(patientId);
  } else {
    return new Response("Method not allowed", { status: 405 });
  }
}

async function handleGet(patientId: string) {
  try {
    const patientRepository = getPatientRepository();
    const patient = await patientRepository.getById(patientId);

    if (!patient) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Paciente no encontrado",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        patient: patient,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching patient:", error);
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

async function handlePut(req: Request, patientId: string) {
  try {
    let updateData;

    // Intentar parsear JSON con manejo de errores
    try {
      updateData = await req.json();
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

    const patientRepository = getPatientRepository();
    
    // Verificar que el paciente existe
    const existingPatient = await patientRepository.getById(patientId);
    if (!existingPatient) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Paciente no encontrado",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Actualizar el paciente
    const success = await patientRepository.update(patientId, {
      ...updateData,
      updatedAt: new Date().toISOString(),
    });

    if (success) {
      const updatedPatient = await patientRepository.getById(patientId);
      return new Response(
        JSON.stringify({
          success: true,
          patient: updatedPatient,
        }),
        {
          status: 200,
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
          error: "Error al actualizar el paciente",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error updating patient:", error);
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

async function handleDelete(patientId: string) {
  try {
    const patientRepository = getPatientRepository();
    
    // Verificar que el paciente existe
    const existingPatient = await patientRepository.getById(patientId);
    if (!existingPatient) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Paciente no encontrado",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const success = await patientRepository.delete(patientId);

    if (success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Paciente eliminado exitosamente",
        }),
        {
          status: 200,
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
          error: "Error al eliminar el paciente",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error deleting patient:", error);
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