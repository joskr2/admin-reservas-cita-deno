import type { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

import type { AppState, UserProfile } from "../../../types/index.ts";
import { Button } from "../../../components/ui/Button.tsx";
import { Icon } from "../../../components/ui/Icon.tsx";

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

    const { id } = ctx.params;

    // A user cannot delete themselves
    if (ctx.state.user.id === id) {
      return ctx.render({ error: "No puedes eliminar tu propio perfil." });
    }

    const kv = await Deno.openKv();
    const userEntry = await kv.get(["users_by_id", id as string]);
    kv.close();

    if (!userEntry.value) {
      // If user doesn't exist, redirect back to profiles list
      return new Response(null, {
        status: 303,
        headers: { Location: "/psychologists" },
      });
    }

    const user = userEntry.value as UserProfile & { passwordHash: string };
    const profile: UserProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
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

    const { id } = ctx.params;

    // Double-check to prevent self-deletion
    if (ctx.state.user.id === id) {
      return ctx.render({
        error: "Acción no permitida: no puedes eliminar tu propio perfil.",
      });
    }

    const kv = await Deno.openKv();
    const userEntry = await kv.get<UserProfile & { passwordHash: string }>([
      "users_by_id",
      id as string,
    ]);

    if (!userEntry.value) {
      kv.close();
      return ctx.render({
        error: "El perfil que intentas eliminar ya no existe.",
      });
    }

    const user = userEntry.value;

    // Use an atomic operation to ensure data consistency
    const res = await kv
      .atomic()
      .delete(["users", user.email]) // Eliminar por email
      .delete(["users_by_id", id as string]) // Eliminar por ID
      .delete(["users_by_role", user.role, user.email])
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
      headers: { Location: "/psychologists" },
    });
  },
};

export default function DeleteProfilePage({ data }: PageProps<Data>) {
  const { profile, error } = data;

  return (
    <>
      <Head>
        <title>
          Eliminar Perfil - {profile?.name || profile?.email || "Usuario"}{" "}
          - Horizonte Clínica
        </title>
        <meta
          name="description"
          content="Confirmar eliminación de perfil de usuario"
        />
      </Head>

      <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header con navegación */}
          <div class="mb-8">
            <div class="flex items-center space-x-4 mb-4">
              <a
                href="/psychologists"
                class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <Icon name="arrow-left" className="h-4 w-4 mr-1" />
                Volver a Psicólogos
              </a>
            </div>
          </div>

          {/* Contenido principal */}
          <div class="max-w-2xl mx-auto">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header de advertencia */}
              <div class="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-8 py-6">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="h-12 w-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                      <Icon
                        name="file-warning"
                        size={24}
                        className="text-red-600 dark:text-red-400"
                      />
                    </div>
                  </div>
                  <div class="ml-4">
                    <h1 class="text-2xl font-bold text-red-900 dark:text-red-200">
                      Eliminar Perfil
                    </h1>
                    <p class="text-red-700 dark:text-red-300 mt-1">
                      Esta acción no se puede deshacer
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenido */}
              <div class="px-8 py-6">
                {error && (
                  <div class="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div class="flex items-center">
                      <Icon
                        name="file-warning"
                        className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2"
                      />
                      <div>
                        <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Advertencia
                        </h3>
                        <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          {error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {profile && (
                  <>
                    <div class="text-center mb-6">
                      <p class="text-gray-600 dark:text-gray-400 text-lg">
                        ¿Estás seguro de que deseas eliminar permanentemente el
                        siguiente perfil?
                      </p>
                    </div>

                    {/* Información del perfil */}
                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-6">
                      <div class="flex items-center space-x-4 mb-4">
                        <div class="h-16 w-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {(profile.name || profile.email)
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                            {profile.name || "Sin nombre"}
                          </h3>
                          <p class="text-gray-600 dark:text-gray-400">
                            {profile.email}
                          </p>
                        </div>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex items-center space-x-2">
                          <Icon
                            name="shield"
                            className="h-4 w-4 text-gray-500"
                          />
                          <span class="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Rol:</strong> {profile.role === "superadmin"
                              ? "👑 Superadministrador"
                              : "👨‍⚕️ Psicólogo"}
                          </span>
                        </div>
                        <div class="flex items-center space-x-2">
                          <Icon
                            name="calendar"
                            className="h-4 w-4 text-gray-500"
                          />
                          <span class="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Creado:</strong>{" "}
                            {new Date(profile.createdAt).toLocaleDateString(
                              "es-ES",
                            )}
                          </span>
                        </div>
                        <div class="flex items-center space-x-2">
                          <Icon
                            name="activity"
                            className="h-4 w-4 text-gray-500"
                          />
                          <span class="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Estado:</strong> {profile.isActive !== false
                              ? "✅ Activo"
                              : "❌ Inactivo"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Advertencia adicional */}
                    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                      <div class="flex items-start space-x-3">
                        <Icon
                          name="file-warning"
                          className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5"
                        />
                        <div class="text-sm">
                          <h4 class="font-medium text-red-800 dark:text-red-200 mb-1">
                            Consecuencias de la eliminación:
                          </h4>
                          <ul class="text-red-700 dark:text-red-300 space-y-1">
                            <li>• El usuario no podrá acceder al sistema</li>
                            <li>• Se perderá toda la información del perfil</li>
                            <li>
                              • Las citas asociadas pueden verse afectadas
                            </li>
                            <li>• Esta acción es irreversible</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div class="flex items-center justify-center space-x-4">
                      <a
                        href="/psychologists"
                        class="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <Icon name="x" className="h-4 w-4 mr-2" />
                        Cancelar
                      </a>
                      <form method="POST" class="inline">
                        <Button
                          type="submit"
                          variant="danger"
                          class="inline-flex items-center px-6 py-3"
                        >
                          <Icon name="trash-2" className="h-4 w-4 mr-2" />
                          Sí, eliminar perfil
                        </Button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
