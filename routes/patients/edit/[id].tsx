import type { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { Button } from "../../../components/ui/Button.tsx";
import { Input } from "../../../components/ui/Input.tsx";
import { Select } from "../../../components/ui/Select.tsx";
import { Icon } from "../../../components/ui/Icon.tsx";
import { getPatientRepository } from "../../../lib/database/index.ts";

import type { AppState, Patient } from "../../../types/index.ts";

interface EditPatientData {
  patient: Patient;
  error?: string;
  success?: boolean;
}

export const handler: Handlers<EditPatientData, AppState> = {
  async GET(_req, ctx) {
    const user = ctx.state.user;
    if (!user) {
      return new Response("", {
        status: 302,
        headers: { Location: "/auth/login" },
      });
    }

    const patientId = ctx.params.id;
    if (!patientId) {
      return new Response("", {
        status: 302,
        headers: { Location: "/patients" },
      });
    }

    try {
      const patientRepo = getPatientRepository();
      const patient = await patientRepo.getById(patientId);

      if (!patient) {
        return new Response("", {
          status: 302,
          headers: { Location: "/patients?error=not_found" },
        });
      }

      return ctx.render({
        patient,
      });
    } catch (error) {
      console.error("Error loading patient:", error);
      return new Response("", {
        status: 302,
        headers: { Location: "/patients?error=server_error" },
      });
    }
  },

  async POST(req, ctx) {
    const user = ctx.state.user;
    if (!user) {
      return new Response("", {
        status: 302,
        headers: { Location: "/auth/login" },
      });
    }

    const patientId = ctx.params.id;
    if (!patientId) {
      return new Response("", {
        status: 302,
        headers: { Location: "/patients" },
      });
    }

    const form = await req.formData();
    const name = form.get("name")?.toString() || "";
    const dni = form.get("dni")?.toString() || "";
    const email = form.get("email")?.toString() || "";
    const phone = form.get("phone")?.toString() || "";
    const dateOfBirth = form.get("dateOfBirth")?.toString() || "";
    const gender = form.get("gender")?.toString() || "";
    const address = form.get("address")?.toString() || "";
    const isActive = form.get("isActive") === "true";

    // Contacto de emergencia
    const emergencyName = form.get("emergencyName")?.toString() || "";
    const emergencyPhone = form.get("emergencyPhone")?.toString() || "";
    const emergencyRelationship =
      form.get("emergencyRelationship")?.toString() || "";

    // Información médica
    const medicalHistory = form.get("medicalHistory")?.toString() || "";
    const notes = form.get("notes")?.toString() || "";

    if (!name) {
      const patientRepo = getPatientRepository();
      const patient = await patientRepo.getById(patientId);

      return ctx.render({
        patient: patient!,
        error: "El nombre es obligatorio",
      });
    }

    try {
      const patientRepo = getPatientRepository();
      const existingPatient = await patientRepo.getById(patientId);

      if (!existingPatient) {
        return new Response("", {
          status: 302,
          headers: { Location: "/patients?error=not_found" },
        });
      }

      const updatedPatient: Patient = {
        ...existingPatient,
        name,
        dni: dni || undefined,
        email: email || undefined,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender: (gender as Patient["gender"]) || undefined,
        address: address || undefined,
        emergencyContact: emergencyName && emergencyPhone
          ? {
            name: emergencyName,
            phone: emergencyPhone,
            relationship: emergencyRelationship,
          }
          : undefined,
        medicalHistory: medicalHistory || undefined,
        notes: notes || undefined,
        isActive,
        updatedAt: new Date().toISOString(),
      };

      await patientRepo.update(patientId, updatedPatient);

      return new Response("", {
        status: 302,
        headers: { Location: "/patients?success=updated" },
      });
    } catch (error) {
      console.error("Error updating patient:", error);
      const patientRepo = getPatientRepository();
      const patient = await patientRepo.getById(patientId);

      return ctx.render({
        patient: patient!,
        error: "Error interno del servidor",
      });
    }
  },
};

export default function EditPatientPage({ data }: PageProps<EditPatientData>) {
  const { patient, error } = data;

  return (
    <>
      <Head>
        <title>Editar Paciente: {patient.name} - Horizonte Clínica</title>
        <meta
          name="description"
          content={`Editar información del paciente ${patient.name}`}
        />
      </Head>

      <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav class="mb-8">
            <ol class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <li>
                <a
                  href="/patients"
                  class="hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Pacientes
                </a>
              </li>
              <li class="flex items-center">
                <Icon
                  name="arrow-left"
                  className="w-4 h-4 mx-2 rotate-180 text-gray-500 dark:text-gray-400"
                />
                <span class="text-gray-900 dark:text-white">
                  Editar Paciente
                </span>
              </li>
            </ol>
          </nav>

          {/* Header */}
          <div class="mb-8">
            <div class="flex items-center gap-4 mb-6">
              <div class="h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                  Editar Paciente
                </h1>
                <p class="text-gray-600 dark:text-gray-400">
                  Modifica la información de {patient.name}
                </p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulario principal */}
            <div class="lg:col-span-2">
              <form method="POST" class="space-y-6">
                {error && (
                  <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div class="flex items-center">
                      <Icon name="x" className="w-5 h-5 text-red-400 mr-2" />
                      <span class="text-red-800 dark:text-red-400 text-sm font-medium">
                        {error}
                      </span>
                    </div>
                  </div>
                )}

                {/* Información personal */}
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 class="text-lg font-medium text-gray-900 dark:text-white">
                      Información Personal
                    </h2>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Datos básicos del paciente
                    </p>
                  </div>

                  <div class="p-6 space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Icon name="user" className="w-4 h-4 inline mr-2" />
                          Nombre Completo *
                        </label>
                        <Input
                          type="text"
                          name="name"
                          value={patient.name}
                          placeholder="Nombre completo del paciente"
                          required
                          class="w-full"
                        />
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Icon name="file-digit" className="w-4 h-4 inline mr-2" />
                          DNI
                        </label>
                        <Input
                          type="text"
                          name="dni"
                          value={patient.dni || ""}
                          placeholder="Documento Nacional de Identidad"
                          pattern="[A-Za-z0-9]{7,30}"
                          title="DNI debe tener entre 7 y 30 caracteres alfanuméricos"
                          class="w-full"
                        />
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Icon name="mail" className="w-4 h-4 inline mr-2" />
                          Email
                        </label>
                        <Input
                          type="email"
                          name="email"
                          value={patient.email || ""}
                          placeholder="correo@ejemplo.com"
                          class="w-full"
                        />
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Icon name="phone" className="w-4 h-4 inline mr-2" />
                          Teléfono
                        </label>
                        <Input
                          type="tel"
                          name="phone"
                          value={patient.phone || ""}
                          placeholder="+1 234 567 8900"
                          class="w-full"
                        />
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Icon
                            name="calendar"
                            className="w-4 h-4 inline mr-2"
                          />
                          Fecha de Nacimiento
                        </label>
                        <Input
                          type="date"
                          name="dateOfBirth"
                          value={patient.dateOfBirth || ""}
                          class="w-full"
                        />
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Icon name="users" className="w-4 h-4 inline mr-2" />
                          Género
                        </label>
                        <Select
                          name="gender"
                          value={patient.gender || ""}
                          class="w-full"
                        >
                          <option value="">Seleccionar género</option>
                          <option value="male">Masculino</option>
                          <option value="female">Femenino</option>
                          <option value="other">Otro</option>
                          <option value="prefer_not_say">
                            Prefiero no decir
                          </option>
                        </Select>
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Icon name="check" className="w-4 h-4 inline mr-2" />
                          Estado
                        </label>
                        <Select
                          name="isActive"
                          value={patient.isActive ? "true" : "false"}
                          class="w-full"
                        >
                          <option value="true">Activo</option>
                          <option value="false">Inactivo</option>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Icon name="map-pin" className="w-4 h-4 inline mr-2" />
                        Dirección
                      </label>
                      <Input
                        type="text"
                        name="address"
                        value={patient.address || ""}
                        placeholder="Dirección completa"
                        class="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Contacto de emergencia */}
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 class="text-lg font-medium text-gray-900 dark:text-white">
                      Contacto de Emergencia
                    </h2>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Persona a contactar en caso de emergencia
                    </p>
                  </div>

                  <div class="p-6 space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Icon name="user" className="w-4 h-4 inline mr-2" />
                          Nombre
                        </label>
                        <Input
                          type="text"
                          name="emergencyName"
                          value={patient.emergencyContact?.name || ""}
                          placeholder="Nombre del contacto"
                          class="w-full"
                        />
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Icon name="phone" className="w-4 h-4 inline mr-2" />
                          Teléfono
                        </label>
                        <Input
                          type="tel"
                          name="emergencyPhone"
                          value={patient.emergencyContact?.phone || ""}
                          placeholder="+1 234 567 8900"
                          class="w-full"
                        />
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Icon name="heart" className="w-4 h-4 inline mr-2" />
                          Relación
                        </label>
                        <Input
                          type="text"
                          name="emergencyRelationship"
                          value={patient.emergencyContact?.relationship || ""}
                          placeholder="Ej: Madre, Esposo, Hermano"
                          class="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información médica */}
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 class="text-lg font-medium text-gray-900 dark:text-white">
                      Información Médica
                    </h2>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Historial médico y notas adicionales
                    </p>
                  </div>

                  <div class="p-6 space-y-6">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Icon
                          name="heart-handshake"
                          className="w-4 h-4 inline mr-2"
                        />
                        Historial Médico
                      </label>
                      <textarea
                        name="medicalHistory"
                        rows={4}
                        value={patient.medicalHistory || ""}
                        placeholder="Historial médico relevante, alergias, medicamentos, etc."
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                      />
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Icon
                          name="file-text"
                          className="w-4 h-4 inline mr-2"
                        />
                        Notas Adicionales
                      </label>
                      <textarea
                        name="notes"
                        rows={4}
                        value={patient.notes || ""}
                        placeholder="Notas adicionales sobre el paciente"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div class="flex items-center justify-end gap-4 pt-6">
                  <a
                    href="/patients"
                    class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Cancelar
                  </a>
                  <Button type="submit" variant="primary" class="px-6 py-2">
                    <Icon
                      name="check"
                      className="w-4 h-4 mr-2 filter brightness-0 invert"
                      disableAutoFilter
                    />
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            </div>

            {/* Panel de información adicional */}
            <div class="space-y-6">
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Información del Sistema
                </h3>

                <div class="space-y-4">
                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                      ID del Paciente
                    </label>
                    <p class="text-sm text-gray-900 dark:text-gray-100 mt-1 font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      {patient.id}
                    </p>
                  </div>

                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Fecha de Registro
                    </label>
                    <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">
                      {new Date(patient.createdAt).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {patient.updatedAt && (
                    <div>
                      <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Última Actualización
                      </label>
                      <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">
                        {new Date(patient.updatedAt).toLocaleDateString(
                          "es-ES",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                  )}

                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Estado Actual
                    </label>
                    <div class="mt-1">
                      <span
                        class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          patient.isActive
                            ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400"
                            : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400"
                        }`}
                      >
                        {patient.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Acciones adicionales */}
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Acciones Adicionales
                </h3>

                <div class="space-y-3">
                  <a
                    href={`/patients/${patient.id}`}
                    class="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Icon name="eye" className="w-4 h-4 mr-2" />
                    Ver Detalles
                  </a>

                  <a
                    href={`/appointments/new?patient=${
                      encodeURIComponent(
                        patient.name,
                      )
                    }`}
                    class="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <Icon
                      name="calendar-plus"
                      className="w-4 h-4 mr-2 filter brightness-0 invert"
                      disableAutoFilter
                    />
                    Nueva Cita
                  </a>

                  <a
                    href={`/patients/delete/${patient.id}`}
                    class="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 dark:border-red-600 rounded-lg text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    <Icon name="trash-2" className="w-4 h-4 mr-2" />
                    Eliminar Paciente
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
