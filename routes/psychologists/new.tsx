import type { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { hash } from "@felix/bcrypt";

import type { AppState, User } from "../../types/index.ts";
import { getUserRepository } from "../../lib/database/index.ts";
import { Input } from "../../components/ui/Input.tsx";
import { Button } from "../../components/ui/Button.tsx";
import { Select } from "../../components/ui/Select.tsx";
import { Textarea } from "../../components/ui/Textarea.tsx";
import { Icon } from "../../components/ui/Icon.tsx";

interface NewPsychologistData {
  error?: string;
  success?: boolean;
  formData?: {
    name: string;
    email: string;
    role: string;
    specialty: string;
    licenseNumber: string;
    phone: string;
    education: string;
    experience: string;
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
    const specialty = form.get("specialty")?.toString() || "";
    const licenseNumber = form.get("licenseNumber")?.toString() || "";
    const phone = form.get("phone")?.toString() || "";
    const education = form.get("education")?.toString() || "";
    const experience = form.get("experience")?.toString() || "";
    const bio = form.get("bio")?.toString() || "";

    // Validaciones básicas
    if (!name || !email || !password || !specialty) {
      return ctx.render({
        error: "Nombre, email, contraseña y especialidad son obligatorios",
        formData: { name, email, role, specialty, licenseNumber, phone, education, experience, bio },
      });
    }

    if (password.length < 8) {
      return ctx.render({
        error: "La contraseña debe tener al menos 8 caracteres",
        formData: { name, email, role, specialty, licenseNumber, phone, education, experience, bio },
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ctx.render({
        error: "El formato del email no es válido",
        formData: { name, email, role, specialty, licenseNumber, phone, education, experience, bio },
      });
    }

    try {
      const userRepository = getUserRepository();

      // Verificar si el email ya existe
      const existingUser = await userRepository.getUserByEmail(email);
      if (existingUser) {
        return ctx.render({
          error: "Ya existe un usuario con este email",
          formData: { name, email, role, specialty, licenseNumber, phone, education, experience, bio },
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
        specialty: specialty || undefined,
        licenseNumber: licenseNumber || undefined,
        phone: phone || undefined,
        education: education || undefined,
        experience: experience || undefined,
        bio: bio || undefined,
      };

      const success = await userRepository.create(newPsychologist);
      
      if (!success) {
        return ctx.render({
          error: "Error al crear el psicólogo",
          formData: { name, email, role, specialty, licenseNumber, phone, education, experience, bio },
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
        formData: { name, email, role, specialty, licenseNumber, phone, education, experience, bio },
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

      <div class="min-h-screen bg-gray-50">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav class="mb-8">
            <ol class="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <a href="/psychologists" class="hover:text-gray-700">
                  Psicólogos
                </a>
              </li>
              <li class="flex items-center">
                <Icon name="arrow-left" className="w-4 h-4 mx-2 rotate-180" />
                <span class="text-gray-900">Nuevo Psicólogo</span>
              </li>
            </ol>
          </nav>

          {/* Header */}
          <div class="mb-8">
            <div class="flex items-center gap-3 mb-4">
              <div class="p-2 bg-blue-100 rounded-lg">
                <Icon name="user-plus" className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 class="text-3xl font-bold text-gray-900">
                  Nuevo Psicólogo
                </h1>
                <p class="text-gray-600">
                  Agrega un nuevo psicólogo al sistema de la clínica
                </p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-lg font-medium text-gray-900">
                Información del Psicólogo
              </h2>
              <p class="text-sm text-gray-600 mt-1">
                Completa todos los campos para crear el nuevo psicólogo
              </p>
            </div>

            <form method="POST" class="p-6 space-y-6">
              {error && (
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div class="flex items-center">
                    <Icon name="x" className="w-5 h-5 text-red-400 mr-2" />
                    <span class="text-red-800 text-sm font-medium">
                      {error}
                    </span>
                  </div>
                </div>
              )}

              {/* Información básica */}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
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
                  <label class="block text-sm font-medium text-gray-700 mb-2">
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
                  <label class="block text-sm font-medium text-gray-700 mb-2">
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
                  <p class="text-xs text-gray-500 mt-1">
                    La contraseña debe tener al menos 8 caracteres
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
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
              <div class="border-t border-gray-200 pt-6 mb-8">
                <h3 class="text-lg font-medium text-gray-900 mb-4">
                  Información Profesional
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      <Icon name="briefcase" className="w-4 h-4 inline mr-2" />
                      Especialidad *
                    </label>
                    <Select
                      name="specialty"
                      value={formData?.specialty || ""}
                      required
                      class="w-full"
                    >
                      <option value="">Seleccionar especialidad</option>
                      <option value="Psicología Clínica">Psicología Clínica</option>
                      <option value="Psicología Cognitivo-Conductual">Psicología Cognitivo-Conductual</option>
                      <option value="Psicología Familiar">Psicología Familiar</option>
                      <option value="Psicología Infantil">Psicología Infantil</option>
                      <option value="Neuropsicología">Neuropsicología</option>
                      <option value="Psicología de Pareja">Psicología de Pareja</option>
                      <option value="Psicología de Grupos">Psicología de Grupos</option>
                      <option value="Psicología del Trauma">Psicología del Trauma</option>
                      <option value="Psicología Organizacional">Psicología Organizacional</option>
                      <option value="Otra">Otra</option>
                    </Select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
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
                    <label class="block text-sm font-medium text-gray-700 mb-2">
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
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      <Icon name="calendar" className="w-4 h-4 inline mr-2" />
                      Experiencia
                    </label>
                    <Input
                      type="text"
                      name="experience"
                      value={formData?.experience || ""}
                      placeholder="Ej: 5 años"
                      class="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Formación y biografía */}
              <div class="border-t border-gray-200 pt-6 mb-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">
                  Formación Académica y Biografía
                </h3>
                <div class="space-y-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      <Icon name="graduation-cap" className="w-4 h-4 inline mr-2" />
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
                    <label class="block text-sm font-medium text-gray-700 mb-2">
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
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 class="text-sm font-medium text-blue-900 mb-2">
                  Información sobre los roles:
                </h3>
                <ul class="text-sm text-blue-800 space-y-1">
                  <li>
                    <strong>Psicólogo:</strong>{" "}
                    Puede gestionar sus propias citas y ver el directorio de
                    otros psicólogos
                  </li>
                  <li>
                    <strong>Super Administrador:</strong>{" "}
                    Acceso completo al sistema, puede gestionar todos los
                    psicólogos y configuraciones
                  </li>
                </ul>
              </div>

              {/* Botones de acción */}
              <div class="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                <a
                  href="/psychologists"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
