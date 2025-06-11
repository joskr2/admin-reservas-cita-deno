import type { Handlers, PageProps } from "$fresh/server.ts";

import type { AppState, UserProfile } from "../../../../types/index.ts";
import Header from "../../../../islands/Header.tsx";
import { Button } from "../../../../components/ui/Button.tsx";
import Footer from "../../../../components/layout/Footer.tsx";
import { Icon } from "../../../../components/ui/Icon.tsx";

// Data passed from handler to component
interface Data {
  profile?: UserProfile;
  error?: string;
}

export const handler: Handlers<Data, AppState> = {
  // --- SHOW CONFIRMATION PAGE (SERVER-SIDE) ---
  async GET(_req, ctx) {
    // Only superadmins can access this page
    if (ctx.state.user?.role !== "superadmin") {
      return new Response(null, {
        status: 307,
        headers: { Location: "/dashboard" },
      });
    }

    const { email } = ctx.params;

    // A user cannot delete themselves
    if (ctx.state.user.email === email) {
      return ctx.render({ error: "No puedes eliminar tu propio perfil." });
    }

    const kv = await Deno.openKv();
    const userEntry = await kv.get(["users", email]);
    kv.close();

    if (!userEntry.value) {
      // If user doesn't exist, redirect back to profiles list
      return new Response(null, {
        status: 303,
        headers: { Location: "/profiles" },
      });
    }

    const user = userEntry.value as UserProfile & { passwordHash: string };
    const profile: UserProfile = {
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      isActive: user.isActive,
    };

    return ctx.render({ profile });
  },

  // --- HANDLE DELETION (SERVER-SIDE) ---
  async POST(_req, ctx) {
    if (ctx.state.user?.role !== "superadmin") {
      return new Response("Unauthorized", { status: 401 });
    }

    const { email } = ctx.params;

    // Double-check to prevent self-deletion
    if (ctx.state.user.email === email) {
      return ctx.render({
        error: "Acción no permitida: no puedes eliminar tu propio perfil.",
      });
    }

    const kv = await Deno.openKv();
    const userEntry = await kv.get<UserProfile & { passwordHash: string }>([
      "users",
      email,
    ]);

    if (!userEntry.value) {
      kv.close();
      return ctx.render({
        error: "El perfil que intentas eliminar ya no existe.",
      });
    }

    // Use an atomic operation to ensure data consistency
    const res = await kv
      .atomic()
      .delete(["users", email])
      .delete(["users_by_role", userEntry.value.role, email])
      .commit();

    kv.close();

    if (!res.ok) {
      return ctx.render({
        error: "Error al eliminar el perfil de la base de datos.",
      });
    }

    // Redirect back to the profiles list
    return new Response(null, {
      status: 303,
      headers: { Location: "/profiles" },
    });
  },
};

export default function DeleteProfilePage({ data }: PageProps<Data>) {
  const { profile, error } = data;

  return (
    <div class="flex flex-col min-h-screen">
      <Header />
      <main class="flex-grow bg-gray-50 dark:bg-gray-900">
        <div class="mx-auto max-w-2xl py-12 px-4 sm:px-6 lg:px-8">
          <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8">
            <div class="text-center">
              <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                <Icon
                  name="file-warning"
                  size={24}
                  className="text-red-600 dark:text-red-400"
                />
              </div>
              <h1 class="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                Eliminar Perfil
              </h1>
            </div>

            {error && (
              <div
                class="mt-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4"
                role="alert"
              >
                <p class="font-bold">Advertencia</p>
                <p>{error}</p>
              </div>
            )}

            {profile && (
              <div class="mt-6">
                <p class="text-center text-sm text-gray-500 dark:text-gray-400">
                  ¿Estás seguro de que deseas eliminar permanentemente el
                  siguiente perfil? Esta acción no se puede deshacer.
                </p>
                <div class="mt-4 bg-gray-100 dark:bg-gray-700/50 p-4 rounded-md space-y-2">
                  <div>
                    <span class="font-semibold text-gray-800 dark:text-gray-200">
                      Email:
                    </span>
                    <span class="ml-2 text-gray-600 dark:text-gray-300">
                      {profile.email}
                    </span>
                  </div>
                  <div>
                    <span class="font-semibold text-gray-800 dark:text-gray-200">
                      Rol:
                    </span>
                    <span class="ml-2 text-gray-600 dark:text-gray-300">
                      {profile.role}
                    </span>
                  </div>
                </div>

                <form method="POST" class="mt-8 flex justify-center gap-x-4">
                  <a
                    href="/profiles"
                    class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </a>
                  <Button type="submit" variant="danger">
                    <Icon name="trash-2" size={20} className="mr-2" />
                    Sí, eliminar perfil
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
