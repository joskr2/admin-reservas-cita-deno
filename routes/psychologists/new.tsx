import type { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { hash } from "../../lib/crypto.ts";

import type { AppState, User } from "../../types/index.ts";
import { getUserRepository } from "../../lib/database/index.ts";
import { Input } from "../../components/ui/Input.tsx";
import { Button } from "../../components/ui/Button.tsx";
import { Select } from "../../components/ui/Select.tsx";
import { Textarea } from "../../components/ui/Textarea.tsx";
import { Icon } from "../../components/ui/Icon.tsx";
import SpecialtySelector from "../../islands/SpecialtySelector.tsx";

interface NewPsychologistData {
  error?: string;
  success?: boolean;
  formData?: {
    name: string;
    email: string;
    role: string;
    dni: string;
    specialty: string;
    customSpecialty: string;
    licenseNumber: string;
    phone: string;
    education: string;
    experienceYears: string;
    bio: string;
  };
}

export const handler: Handlers<NewPsychologistData, AppState> = {
  GET(_req, ctx) {
    const user = ctx.state.user;
    if (!user || user.role !== "superadmin") {
      return new Response("", {
        status: 302,
        headers: { Location: "/psychologists" },
      });
    }

    return ctx.render({});
  },

  async POST(req, ctx) {
    const user = ctx.state.user;
    if (!user || user.role !== "superadmin") {
      return new Response("", {
        status: 302,
        headers: { Location: "/psychologists" },
      });
    }

    const form = await req.formData();
    const name = form.get("name")?.toString() || "";
    const email = form.get("email")?.toString() || "";
    const password = form.get("password")?.toString() || "";
    const role = form.get("role")?.toString() || "psychologist";
    const dni = form.get("dni")?.toString() || "";
    const specialty = form.get("specialty")?.toString() || "";
    const customSpecialty = form.get("customSpecialty")?.toString() || "";
    const licenseNumber = form.get("licenseNumber")?.toString() || "";
    const phone = form.get("phone")?.toString() || "";
    const education = form.get("education")?.toString() || "";
    const experienceYears = form.get("experienceYears")?.toString() || "";
    const bio = form.get("bio")?.toString() || "";

    // Validaciones básicas
    if (!name || !email || !password || !dni || !specialty) {
      return ctx.render({
        error: "Nombre, email, contraseña, DNI y especialidad son obligatorios",
        formData: {
          name,
          email,
          role,
          dni,
          specialty,
          customSpecialty,
          licenseNumber,
          phone,
          education,
          experienceYears,
          bio,
        },
      });
    }

    if (password.length < 8) {
      return ctx.render({
        error: "La contraseña debe tener al menos 8 caracteres",
        formData: {
          name,
          email,
          role,
          dni,
          specialty,
          customSpecialty,
          licenseNumber,
          phone,
          education,
          experienceYears,
          bio,
        },
      });
    }

    // Validar DNI (7-30 caracteres, solo números y letras)
    const dniRegex = /^[A-Za-z0-9]{7,30}$/;
    if (!dniRegex.test(dni)) {
      return ctx.render({
        error: "El DNI debe tener entre 7 y 30 caracteres alfanuméricos",
        formData: {
          name,
          email,
          role,
          dni,
          specialty,
          customSpecialty,
          licenseNumber,
          phone,
          education,
          experienceYears,
          bio,
        },
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ctx.render({
        error: "El formato del email no es válido",
        formData: {
          name,
          email,
          role,
          dni,
          specialty,
          customSpecialty,
          licenseNumber,
          phone,
          education,
          experienceYears,
          bio,
        },
      });
    }

    // Validar que si specialty es "Otra", debe haber customSpecialty
    if (specialty === "Otra" && !customSpecialty.trim()) {
      return ctx.render({
        error: "Debe especificar la especialidad personalizada",
        formData: {
          name,
          email,
          role,
          dni,
          specialty,
          customSpecialty,
          licenseNumber,
          phone,
          education,
          experienceYears,
          bio,
        },
      });
    }

    // Validar años de experiencia si se proporciona
    let experienceYearsNum: number | undefined = undefined;
    if (experienceYears.trim()) {
      experienceYearsNum = parseInt(experienceYears);
      if (
        isNaN(experienceYearsNum) ||
        experienceYearsNum < 0 ||
        experienceYearsNum > 50
      ) {
        return ctx.render({
          error: "Los años de experiencia deben ser un número entre 0 y 50",
          formData: {
            name,
            email,
            role,
            dni,
            specialty,
            customSpecialty,
            licenseNumber,
            phone,
            education,
            experienceYears,
            bio,
          },
        });
      }
    }

    try {
      const userRepository = getUserRepository();

      // Verificar si el email ya existe
      const existingUser = await userRepository.getUserByEmail(email);
      if (existingUser) {
        return ctx.render({
          error: "Ya existe un usuario con este email",
          formData: {
            name,
            email,
            role,
            dni,
            specialty,
            customSpecialty,
            licenseNumber,
            phone,
            education,
            experienceYears,
            bio,
          },
        });
      }

      // Crear hash de la contraseña
      const hashedPassword = await hash(password);

      // Crear el nuevo psicólogo
      const newPsychologist: User = {
        id: crypto.randomUUID(),
        email,
        name,
        role: role as "psychologist" | "superadmin",
        passwordHash: hashedPassword,
        isActive: true,
        createdAt: new Date().toISOString(),
        dni: dni || undefined,
        specialty: specialty || undefined,
        customSpecialty:
          specialty === "Otra" && customSpecialty ? customSpecialty : undefined,
        licenseNumber: licenseNumber || undefined,
        phone: phone || undefined,
        education: education || undefined,
        experienceYears: experienceYearsNum,
        bio: bio || undefined,
      };

      const success = await userRepository.create(newPsychologist);

      if (!success) {
        return ctx.render({
          error: "Error al crear el psicólogo",
          formData: {
            name,
            email,
            role,
            dni,
            specialty,
            customSpecialty,
            licenseNumber,
            phone,
            education,
            experienceYears,
            bio,
          },
        });
      }

      return new Response("", {
        status: 302,
        headers: { Location: "/psychologists?success=created" },
      });
    } catch (error) {
      console.error("Error creating psychologist:", error);
      return ctx.render({
        error: "Error interno del servidor",
        formData: {
          name,
          email,
          role,
          dni,
          specialty,
          customSpecialty,
          licenseNumber,
          phone,
          education,
          experienceYears,
          bio,
        },
      });
    }
  },
};

export default function NewPsychologistPage({
  data,
}: PageProps<NewPsychologistData>) {
  const { error, formData } = data || {};

  return (
    <>
      <Head>
        <title>Nuevo Psicólogo - Horizonte Clínica</title>
        <meta
          name="description"
          content="Crear un nuevo psicólogo en el sistema"
        />
      </Head>

      <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <Icon name="arrow-left" className="w-4 h-4 mx-2 rotate-180" />
                <span class="text-gray-900 dark:text-white">
                  Nuevo Psicólogo
                </span>
              </li>
            </ol>
          </nav>

          {/* Header */}
          <div class="mb-8">
            <div class="flex items-center gap-3 mb-4">
              <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Icon
                  name="user-plus"
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                />
              </div>
              <div>
                <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                  Nuevo Psicólogo
                </h1>
                <p class="text-gray-600 dark:text-gray-300">
                  Agrega un nuevo psicólogo al sistema de la clínica
                </p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-lg font-medium text-gray-900 dark:text-white">
                Información del Psicólogo
              </h2>
              <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Completa todos los campos para crear el nuevo psicólogo
              </p>
            </div>

            <form method="POST" class="p-6 space-y-6">
              {error && (
                <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div class="flex items-center">
                    <Icon
                      name="x"
                      className="w-5 h-5 text-red-400 dark:text-red-300 mr-2"
                    />
                    <span class="text-red-800 dark:text-red-200 text-sm font-medium">
                      {error}
                    </span>
                  </div>
                </div>
              )}

              {/* Información básica */}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Icon name="user" className="w-4 h-4 inline mr-2" />
                    Nombre Completo *
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData?.name || ""}
                    placeholder="Ej: Dr. Juan Pérez"
                    required
                    class="w-full"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Icon name="file-text" className="w-4 h-4 inline mr-2" />
                    DNI/Pasaporte *
                  </label>
                  <Input
                    type="text"
                    name="dni"
                    value={formData?.dni || ""}
                    placeholder="12345678 o AB123456789"
                    required
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
                    <Icon name="mail" className="w-4 h-4 inline mr-2" />
                    Email *
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData?.email || ""}
                    placeholder="juan.perez@horizonteclinica.com"
                    required
                    class="w-full"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Icon name="lock" className="w-4 h-4 inline mr-2" />
                    Contraseña *
                  </label>
                  <Input
                    type="password"
                    name="password"
                    placeholder="Mínimo 8 caracteres"
                    required
                    class="w-full"
                  />
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    La contraseña debe tener al menos 8 caracteres
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Icon name="shield" className="w-4 h-4 inline mr-2" />
                    Rol
                  </label>
                  <Select
                    name="role"
                    value={formData?.role || "psychologist"}
                    class="w-full"
                  >
                    <option value="psychologist">Psicólogo</option>
                    <option value="superadmin">Super Administrador</option>
                  </Select>
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
                      <Icon name="briefcase" className="w-4 h-4 inline mr-2" />
                      Especialidad *
                    </label>
                    <SpecialtySelector
                      name="specialty"
                      value={formData?.specialty || ""}
                      customValue={formData?.customSpecialty || ""}
                      required
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Icon name="file-text" className="w-4 h-4 inline mr-2" />
                      Número de Licencia
                    </label>
                    <Input
                      type="text"
                      name="licenseNumber"
                      value={formData?.licenseNumber || ""}
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
                      value={formData?.phone || ""}
                      placeholder="+56 9 1234 5678"
                      class="w-full"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Icon name="calendar" className="w-4 h-4 inline mr-2" />
                      Años de Experiencia
                    </label>
                    <Input
                      type="number"
                      name="experienceYears"
                      value={formData?.experienceYears || ""}
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
                      value={formData?.education || ""}
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
                      value={formData?.bio || ""}
                      placeholder="Breve descripción de la experiencia profesional, enfoques terapéuticos, etc."
                      class="w-full"
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Información sobre roles */}
              <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Información sobre los roles:
                </h3>
                <ul class="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>
                    <strong>Psicólogo:</strong> Puede gestionar sus propias
                    citas y ver el directorio de otros psicólogos
                  </li>
                  <li>
                    <strong>Super Administrador:</strong> Acceso completo al
                    sistema, puede gestionar todos los psicólogos y
                    configuraciones
                  </li>
                </ul>
              </div>

              {/* Botones de acción */}
              <div class="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <a
                  href="/psychologists"
                  class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </a>
                <Button type="submit" variant="primary" class="px-6 py-2">
                  <Icon
                    name="user-plus"
                    className="w-4 h-4 mr-2 filter brightness-0 invert"
                    disableAutoFilter
                  />
                  Crear Psicólogo
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
