import type { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { Button } from "../../../components/ui/Button.tsx";
import { Input } from "../../../components/ui/Input.tsx";
import { Select } from "../../../components/ui/Select.tsx";
import { Textarea } from "../../../components/ui/Textarea.tsx";
import { Icon } from "../../../components/ui/Icon.tsx";
import SpecialtySelector from "../../../islands/SpecialtySelector.tsx";

import type { AppState, UserProfile } from "../../../types/index.ts";
import { getUserRepository } from "../../../lib/database/index.ts";

interface EditPsychologistData {
  psychologist: UserProfile;
  error?: string;
  success?: boolean;
}

export const handler: Handlers<EditPsychologistData, AppState> = {
  async GET(_req, ctx) {
    const user = ctx.state.user;
    if (!user || user.role !== "superadmin") {
      return new Response("", {
        status: 302,
        headers: { Location: "/psychologists" },
      });
    }

    const id = ctx.params.id;
    if (!id) {
      return new Response("", {
        status: 302,
        headers: { Location: "/psychologists" },
      });
    }

    try {
      const userRepository = getUserRepository();
      const psychologist = await userRepository.getUserById(id);

      if (!psychologist) {
        return new Response("", {
          status: 302,
          headers: { Location: "/psychologists?error=not_found" },
        });
      }

      return ctx.render({
        psychologist: psychologist as UserProfile,
      });
    } catch (error) {
      console.error("Error loading psychologist:", error);
      return new Response("", {
        status: 302,
        headers: { Location: "/psychologists?error=server_error" },
      });
    }
  },

  async POST(req, ctx) {
    const user = ctx.state.user;
    if (!user || user.role !== "superadmin") {
      return new Response("", {
        status: 302,
        headers: { Location: "/psychologists" },
      });
    }

    const id = ctx.params.id;
    if (!id) {
      return new Response("", {
        status: 302,
        headers: { Location: "/psychologists" },
      });
    }

    const form = await req.formData();
    const name = form.get("name")?.toString() || "";
    const role = form.get("role")?.toString() || "psychologist";
    const isActive = form.get("isActive") === "true";
    const dni = form.get("dni")?.toString() || "";
    const specialty = form.get("specialty")?.toString() || "";
    const customSpecialty = form.get("customSpecialty")?.toString() || "";
    const licenseNumber = form.get("licenseNumber")?.toString() || "";
    const phone = form.get("phone")?.toString() || "";
    const education = form.get("education")?.toString() || "";
    const experienceYears = form.get("experienceYears")?.toString() || "";
    const bio = form.get("bio")?.toString() || "";

    const userRepository = getUserRepository();

    // Validaciones
    if (!name || !specialty) {
      const psychologist = await userRepository.getUserById(id);
      return ctx.render({
        psychologist: psychologist as UserProfile,
        error: "El nombre y la especialidad son obligatorios",
      });
    }

    // Validar DNI si se proporciona
    if (dni && !/^[A-Za-z0-9]{7,30}$/.test(dni)) {
      const psychologist = await userRepository.getUserById(id);
      return ctx.render({
        psychologist: psychologist as UserProfile,
        error: "El DNI debe tener entre 7 y 30 caracteres alfanuméricos",
      });
    }

    // Validar especialidad personalizada
    if (specialty === "Otra" && !customSpecialty.trim()) {
      const psychologist = await userRepository.getUserById(id);
      return ctx.render({
        psychologist: psychologist as UserProfile,
        error: "Debe especificar la especialidad personalizada",
      });
    }

    // Validar años de experiencia
    let experienceYearsNum: number | undefined = undefined;
    if (experienceYears.trim()) {
      experienceYearsNum = parseInt(experienceYears);
      if (
        isNaN(experienceYearsNum) || experienceYearsNum < 0 ||
        experienceYearsNum > 50
      ) {
        const psychologist = await userRepository.getUserById(id);
        return ctx.render({
          psychologist: psychologist as UserProfile,
          error: "Los años de experiencia deben ser un número entre 0 y 50",
        });
      }
    }

    try {
      const existingUser = await userRepository.getUserById(id);

      if (!existingUser) {
        return new Response("", {
          status: 302,
          headers: { Location: "/psychologists?error=not_found" },
        });
      }

      const updates = {
        name,
        role: role as "psychologist" | "superadmin",
        isActive,
        specialty: specialty || undefined,
        licenseNumber: licenseNumber || undefined,
        phone: phone || undefined,
        education: education || undefined,
        dni: dni || undefined,
        customSpecialty: (specialty === "Otra" && customSpecialty)
          ? customSpecialty
          : undefined,
        experienceYears: experienceYearsNum,
        bio: bio || undefined,
      };

      const success = await userRepository.update(existingUser.email, updates);

      if (!success) {
        return ctx.render({
          psychologist: existingUser as UserProfile,
          error: "Error al actualizar el psicólogo",
        });
      }

      return new Response("", {
        status: 302,
        headers: { Location: "/psychologists?success=updated" },
      });
    } catch (error) {
      console.error("Error updating psychologist:", error);
      const psychologist = await userRepository.getUserById(id);

      return ctx.render({
        psychologist: psychologist as UserProfile,
        error: "Error interno del servidor",
      });
    }
  },
};

export default function EditPsychologistPage({
  data,
}: PageProps<EditPsychologistData>) {
  const { psychologist, error } = data;

  return (
    <>
      <Head>
        <title>Editar Psicólogo: {psychologist.name} - Horizonte Clínica</title>
        <meta
          name="description"
          content={`Editar información del psicólogo ${psychologist.name}`}
        />
      </Head>

      <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav class="mb-8">
            <ol class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <li>
                <a
                  href="/psychologists"
                  class="hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Psicólogos
                </a>
              </li>
              <li class="flex items-center">
                <Icon
                  name="arrow-left"
                  className="w-4 h-4 mx-2 rotate-180 text-gray-500 dark:text-gray-400"
                />
                <span class="text-gray-900 dark:text-white">
                  Editar Psicólogo
                </span>
              </li>
            </ol>
          </nav>

          {/* Header */}
          <div class="mb-8">
            <div class="flex items-center gap-4 mb-6">
              <div class="h-16 w-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span class="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {psychologist.name?.charAt(0).toUpperCase() ||
                    psychologist.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                  Editar Psicólogo
                </h1>
                <p class="text-gray-600 dark:text-gray-400">
                  Modifica la información de{" "}
                  {psychologist.name || psychologist.email}
                </p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulario principal */}
            <div class="lg:col-span-2">
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 class="text-lg font-medium text-gray-900 dark:text-white">
                    Información del Psicólogo
                  </h2>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Actualiza los datos del psicólogo en el sistema
                  </p>
                </div>

                <form method="POST" class="p-6 space-y-6">
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

                  <div class="space-y-6">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Icon name="user" className="w-4 h-4 inline mr-2" />
                        Nombre Completo
                      </label>
                      <Input
                        type="text"
                        name="name"
                        value={psychologist.name || ""}
                        placeholder="Nombre completo del psicólogo"
                        required
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
                        value={psychologist.email}
                        disabled
                        class="w-full bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      />
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        El email no se puede modificar
                      </p>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Icon name="shield" className="w-4 h-4 inline mr-2" />
                        Rol
                      </label>
                      <Select
                        name="role"
                        value={psychologist.role}
                        class="w-full"
                      >
                        <option value="psychologist">Psicólogo</option>
                        <option value="superadmin">Super Administrador</option>
                      </Select>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Icon
                          name="file-text"
                          className="w-4 h-4 inline mr-2"
                        />
                        DNI/Pasaporte
                      </label>
                      <Input
                        type="text"
                        name="dni"
                        value={psychologist.dni || ""}
                        placeholder="12345678 o AB123456789"
                        class="w-full"
                        pattern="[A-Za-z0-9]{7,30}"
                        title="Documento Nacional de Identidad (7-30 caracteres alfanuméricos)"
                      />
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        DNI o pasaporte (7-30 caracteres alfanuméricos)
                      </p>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Icon name="check" className="w-4 h-4 inline mr-2" />
                        Estado
                      </label>
                      <Select
                        name="isActive"
                        value={psychologist.isActive ? "true" : "false"}
                        class="w-full"
                      >
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                      </Select>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Los psicólogos inactivos no pueden acceder al sistema
                      </p>
                    </div>
                  </div>

                  {/* Información profesional */}
                  <div class="border-t border-gray-200 dark:border-gray-700 pt-6 mb-8">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Información Profesional
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Icon
                            name="briefcase"
                            className="w-4 h-4 inline mr-2"
                          />
                          Especialidad
                        </label>
                        <SpecialtySelector
                          name="specialty"
                          value={psychologist.specialty || ""}
                          customValue={psychologist.customSpecialty || ""}
                          class="w-full"
                        />
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Icon
                            name="file-text"
                            className="w-4 h-4 inline mr-2"
                          />
                          Número de Licencia
                        </label>
                        <Input
                          type="text"
                          name="licenseNumber"
                          value={psychologist.licenseNumber || ""}
                          placeholder="Ej: PSI-12345"
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
                          value={psychologist.phone || ""}
                          placeholder="+56 9 1234 5678"
                          class="w-full"
                        />
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Icon
                            name="calendar"
                            className="w-4 h-4 inline mr-2"
                          />
                          Años de Experiencia
                        </label>
                        <Input
                          type="number"
                          name="experienceYears"
                          value={psychologist.experienceYears?.toString() || ""}
                          placeholder="5"
                          min="0"
                          max="50"
                          class="w-full"
                        />
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Número de años de experiencia profesional (0-50)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Formación y biografía */}
                  <div class="border-t border-gray-200 dark:border-gray-700 pt-6 mb-6">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Formación Académica y Biografía
                    </h3>
                    <div class="space-y-6">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Icon
                            name="graduation-cap"
                            className="w-4 h-4 inline mr-2"
                          />
                          Formación Académica
                        </label>
                        <Textarea
                          name="education"
                          value={psychologist.education || ""}
                          placeholder="Ej: Psicólogo, Universidad de Chile (2018)&#10;Magíster en Psicología Clínica, Universidad Católica (2020)"
                          class="w-full"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Icon name="user" className="w-4 h-4 inline mr-2" />
                          Biografía Profesional
                        </label>
                        <Textarea
                          name="bio"
                          value={psychologist.bio || ""}
                          placeholder="Breve descripción de la experiencia profesional, enfoques terapéuticos, etc."
                          class="w-full"
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div class="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <a
                      href="/psychologists"
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
            </div>

            {/* Panel de información adicional */}
            <div class="space-y-6">
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Información Adicional
                </h3>

                <div class="space-y-4">
                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Fecha de Creación
                    </label>
                    <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">
                      {new Date(psychologist.createdAt).toLocaleDateString(
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

                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Última Actualización
                    </label>
                    <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">
                      No disponible
                    </p>
                  </div>

                  <div>
                    <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Estado Actual
                    </label>
                    <div class="mt-1">
                      <span
                        class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          psychologist.isActive
                            ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400"
                            : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400"
                        }`}
                      >
                        {psychologist.isActive ? "Activo" : "Inactivo"}
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
                    href={`/psychologists/delete/${psychologist.email}`}
                    class="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 dark:border-red-600 rounded-lg text-sm font-medium text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    <Icon name="trash-2" className="w-4 h-4 mr-2" />
                    Eliminar Psicólogo
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
