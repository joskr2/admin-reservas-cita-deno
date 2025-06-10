import type { Handlers, PageProps } from "$fresh/server.ts";
import Footer from "../../../../components/layout/Footer.tsx";
import Header from "../../../../components/layout/Header.tsx";
import { Button } from "../../../../components/ui/Button.tsx";
import { Input } from "../../../../components/ui/Input.tsx";
import { Select } from "../../../../components/ui/Select.tsx";

import type { AppState } from "../../../_middleware.ts";

interface Profile {
  email: string;
  role: "superadmin" | "psychologist";
}

// Data passed from handler to component
interface Data {
  profile: Profile;
  error?: string;
}

export const handler: Handlers<Data, AppState> = {
  // --- SHOW EDIT FORM (SERVER-SIDE) ---
  async GET(_req, ctx) {
    if (ctx.state.user?.role !== "superadmin") {
      return new Response(null, {
        status: 307,
        headers: { Location: "/dashboard" },
      });
    }

    const { email } = ctx.params;
    const kv = await Deno.openKv();
    const userEntry = await kv.get<Profile>(["users", email]);
    kv.close();

    if (!userEntry.value) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/profiles" },
      });
    }

    return ctx.render({ profile: userEntry.value });
  },

  // --- HANDLE EDIT SUBMISSION (SERVER-SIDE) ---
  async POST(req, ctx) {
    if (ctx.state.user?.role !== "superadmin") {
      return new Response("Unauthorized", { status: 401 });
    }

    const { email } = ctx.params;
    const form = await req.formData();
    const newRole = form.get("role")?.toString() as Profile["role"];

    if (!newRole || !["superadmin", "psychologist"].includes(newRole)) {
      // Re-fetch profile to render the page again with an error
      const kv = await Deno.openKv();
      const userEntry = await kv.get<Profile>(["users", email]);
      kv.close();
      if (!userEntry.value) {
        return ctx.render({
          profile: { email, role: "psychologist" },
          error: "Rol no válido.",
        });
      }
      return ctx.render({ profile: userEntry.value, error: "Rol no válido." });
    }

    const kv = await Deno.openKv();
    const userEntry = await kv.get<Profile>(["users", email]);
    const oldRole = userEntry.value?.role;

    // --- CRITICAL VALIDATION: Prevent removing the last superadmin ---
    if (oldRole === "superadmin" && newRole === "psychologist") {
      const adminIterator = kv.list({
        prefix: ["users_by_role", "superadmin"],
      });
      let adminCount = 0;
      for await (const _ of adminIterator) {
        adminCount++;
      }
      if (adminCount <= 1) {
        kv.close();
        return ctx.render({
          profile: userEntry.value ?? { email, role: "psychologist" },
          error:
            "No se puede eliminar el último superadministrador del sistema.",
        });
      }
    }

    // --- Update user in an atomic transaction ---
    const updatedProfile = { ...userEntry.value, role: newRole };

    if (!oldRole) {
      kv.close();
      return ctx.render({
        profile: userEntry.value ?? { email, role: "psychologist" },
        error: "El rol anterior no está definido.",
      });
    }

    const res = await kv
      .atomic()
      .check(userEntry) // Ensure the entry hasn't changed since we read it
      .delete(["users_by_role", oldRole, email])
      .set(["users", email], updatedProfile)
      .set(["users_by_role", newRole, email], updatedProfile)
      .commit();

    kv.close();

    if (!res.ok) {
      return ctx.render({
        profile: userEntry.value ?? { email, role: "psychologist" },
        error: "Error al actualizar el perfil.",
      });
    }

    // Redirect back to profiles list on success
    return new Response(null, {
      status: 303,
      headers: { Location: "/profiles" },
    });
  },
};

export default function EditProfilePage({ data }: PageProps<Data>) {
  const { profile, error } = data;

  return (
    <div class="flex flex-col min-h-screen">
      <Header />
      <main class="flex-grow bg-gray-50 dark:bg-gray-900">
        <div class="mx-auto max-w-2xl py-12 px-4 sm:px-6 lg:px-8">
          <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8">
            <div class="flex items-center gap-4 mb-6">
              <img
                src="/icons/user-cog.svg"
                alt="Editar perfil"
                width="32"
                height="32"
                class="text-indigo-600 dark:text-indigo-400"
              />
              <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                  Editar Perfil
                </h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Modifica los detalles del usuario.
                </p>
              </div>
            </div>

            <form method="POST" class="space-y-6">
              {error && (
                <div
                  class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
                  role="alert"
                >
                  <p class="font-bold">Error</p>
                  <p>{error}</p>
                </div>
              )}

              <div>
                <label
                  for="email"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Correo Electrónico (no editable)
                </label>
                <div class="mt-1">
                  <Input
                    type="email"
                    name="email"
                    id="email"
                    value={profile.email}
                    disabled // Email should not be editable
                    class="bg-gray-100 dark:bg-gray-900"
                  />
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
                    <option
                      value="psychologist"
                      selected={profile.role === "psychologist"}
                    >
                      Psicólogo
                    </option>
                    <option
                      value="superadmin"
                      selected={profile.role === "superadmin"}
                    >
                      Superadministrador
                    </option>
                  </Select>
                </div>
              </div>

              <div class="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <a
                  href="/profiles"
                  class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Cancelar
                </a>
                <Button type="submit">Guardar Cambios</Button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
