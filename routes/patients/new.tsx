import { type FreshContext, type PageProps } from "$fresh/server.ts";
import {
  type AppState,
  type CreatePatientForm,
  type Patient,
} from "../../types/index.ts";
import { getPatientRepository } from "../../lib/database/index.ts";
import { Icon } from "../../components/ui/Icon.tsx";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  if (req.method === "POST") {
    try {
      const formData = await req.formData();

      const patientData: CreatePatientForm = {
        name: formData.get("name") as string,
        email: formData.get("email") as string || undefined,
        phone: formData.get("phone") as string || undefined,
        dateOfBirth: formData.get("dateOfBirth") as string || undefined,
        gender: formData.get("gender") as
          | "male"
          | "female"
          | "other"
          | "prefer_not_say" || undefined,
        address: formData.get("address") as string || undefined,
        medicalHistory: formData.get("medicalHistory") as string || undefined,
        notes: formData.get("notes") as string || undefined,
      };

      // Validaciones básicas
      if (!patientData.name || patientData.name.trim().length === 0) {
        return ctx.render({ error: "El nombre es requerido" });
      }

      // Crear contacto de emergencia si se proporciona información
      const emergencyName = formData.get("emergencyName") as string;
      const emergencyPhone = formData.get("emergencyPhone") as string;
      const emergencyRelationship = formData.get(
        "emergencyRelationship",
      ) as string;

      if (emergencyName && emergencyPhone && emergencyRelationship) {
        patientData.emergencyContact = {
          name: emergencyName,
          phone: emergencyPhone,
          relationship: emergencyRelationship,
        };
      }

      const patient: Patient = {
        id: crypto.randomUUID(),
        ...patientData,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const patientRepository = getPatientRepository();
      const success = await patientRepository.create(patient);

      if (success) {
        return new Response("", {
          status: 302,
          headers: { Location: "/patients" },
        });
      } else {
        return ctx.render({ error: "Error al crear el paciente" });
      }
    } catch (error) {
      console.error("Error creating patient:", error);
      return ctx.render({ error: "Error interno del servidor" });
    }
  }

  return ctx.render({});
}

export default function NewPatientPage({
  data,
}: PageProps<{ error?: string }, AppState>) {
  const { error } = data || {};

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="mb-8">
            <div class="flex items-center mb-4">
              <a
                href="/patients"
                class="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Icon name="arrow-left" size={20} className="mr-2" />
                Volver a Pacientes
              </a>
            </div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              Nuevo Paciente
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              Ingresa los datos del paciente
            </p>
          </div>

          {error && (
            <div class="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div class="flex">
                <Icon name="x" size={20} className="text-red-400 mr-3" />
                <div class="text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              </div>
            </div>
          )}

          <div class="bg-white dark:bg-gray-800 shadow rounded-lg">
            <form method="POST" class="px-6 py-6 space-y-6">
              {/* Informacion Personal */}
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Información Personal
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Ingresa el nombre completo"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Fecha de Nacimiento
                    </label>
                    <input
                      title="Fecha de Nacimiento"
                      placeholder="Fecha de Nacimiento"
                      type="date"
                      name="dateOfBirth"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Género
                    </label>
                    <select
                      title="Género"
                      name="gender"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="male">Masculino</option>
                      <option value="female">Femenino</option>
                      <option value="other">Otro</option>
                      <option value="prefer_not_say">Prefiero no decir</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Información de Contacto */}
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Información de Contacto
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="email@ejemplo.com"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="+1234567890"
                    />
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dirección
                    </label>
                    <textarea
                      name="address"
                      rows={3}
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Dirección completa"
                    >
                    </textarea>
                  </div>
                </div>
              </div>

              {/* Contacto de Emergencia */}
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Contacto de Emergencia
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      name="emergencyName"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Nombre del contacto"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="emergencyPhone"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="+1234567890"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Relación
                    </label>
                    <input
                      type="text"
                      name="emergencyRelationship"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="ej. Padre, Madre, Hermano/a"
                    />
                  </div>
                </div>
              </div>

              {/* Información Médica */}
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Información Médica
                </h3>
                <div class="space-y-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Historial Médico
                    </label>
                    <textarea
                      name="medicalHistory"
                      rows={4}
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Condiciones médicas relevantes, medicamentos, alergias, etc."
                    >
                    </textarea>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notas Adicionales
                    </label>
                    <textarea
                      name="notes"
                      rows={3}
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Información adicional relevante"
                    >
                    </textarea>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div class="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <a
                  href="/patients"
                  class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </a>
                <button
                  type="submit"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                >
                  Crear Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
