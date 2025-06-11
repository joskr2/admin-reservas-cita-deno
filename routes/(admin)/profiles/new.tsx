import type { Handlers, PageProps } from "$fresh/server.ts";
import { hash } from "@felix/bcrypt";

import type { AppState } from "../../../types/index.ts";
import { Input } from "../../../components/ui/Input.tsx";
import { Button } from "../../../components/ui/Button.tsx";
import { Select } from "../../../components/ui/Select.tsx";

// Data interface for passing errors from handler to component
interface Data {
  error?: string;
}

export const handler: Handlers<Data, AppState> = {
  // Protect this route, only superadmins can create users
  GET(_req, ctx) {
    if (ctx.state.user?.role !== "superadmin") {
      return new Response(null, {
        status: 307,
        headers: { Location: "/dashboard" },
      });
    }
    return ctx.render();
  },

  // Handle the form submission to create a new profile
  async POST(req, ctx) {
    if (ctx.state.user?.role !== "superadmin") {
      return new Response("Unauthorized", { status: 401 });
    }

    const form = await req.formData();
    const name = form.get("name")?.toString();
    const email = form.get("email")?.toString();
    const password = form.get("password")?.toString();
    const role = form.get("role")?.toString() as "psychologist" | "superadmin";

    // --- Validation ---
    if (!name || !email || !password || !role) {
      return ctx.render({ error: "Todos los campos son requeridos." });
    }
    if (password.length < 8) {
      return ctx.render({
        error: "La contraseña debe tener al menos 8 caracteres.",
      });
    }

    const kv = await Deno.openKv();
    const existingUser = await kv.get(["users", email]);

    if (existingUser.value) {
      kv.close();
      return ctx.render({ error: `El email '${email}' ya está en uso.` });
    }

    // --- User Creation ---
    const passwordHash = await hash(password);
    const newUser = {
      name,
      email,
      passwordHash,
      role,
      createdAt: new Date().toISOString(),
    };

    const commitResult = await kv
      .atomic()
      .set(["users", email], newUser)
      .set(["users_by_role", role, email], newUser)
      .commit();

    kv.close();

    if (!commitResult.ok) {
      return ctx.render({
        error: "No se pudo guardar el perfil en la base de datos.",
      });
    }

    // Redirect to the profiles list on success
    return new Response(null, {
      status: 303,
      headers: { Location: "/profiles" },
    });
  },
};

export default function NewProfilePage({ data }: PageProps<Data>) {
  return (
    <div class="mx-auto max-w-2xl py-12 px-4 sm:px-6 lg:px-8">
      <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Crear Nuevo Perfil
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Rellena los datos para registrar un nuevo usuario en el sistema.
        </p>

        <form method="POST" class="space-y-6">
          {data?.error && (
            <div
              class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
              role="alert"
            >
              <p class="font-bold">Error</p>
              <p>{data.error}</p>
            </div>
          )}

          <div>
            <label
              for="name"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Nombre Completo
            </label>
            <div class="mt-1">
              <Input type="text" name="name" id="name" required />
            </div>
          </div>

          <div>
            <label
              for="email"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Correo Electrónico
            </label>
            <div class="mt-1">
              <Input type="email" name="email" id="email" required />
            </div>
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Contraseña
            </label>
            <div class="mt-1">
              <Input type="password" name="password" id="password" required />
              <p class="mt-2 text-xs text-gray-500">Mínimo 8 caracteres.</p>
            </div>
          </div>

          <div>
            <label
              for="role"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Rol del Usuario
            </label>
            <div class="mt-1">
              <Select name="role" id="role">
                <option value="psychologist">Psicólogo</option>
                <option value="superadmin">Superadministrador</option>
              </Select>
            </div>
          </div>

          <div class="flex justify-end gap-4 pt-4">
            <a
              href="/profiles"
              class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancelar
            </a>
            <Button type="submit">Crear Perfil</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
