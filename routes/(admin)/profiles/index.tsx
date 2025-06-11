import { type FreshContext, type PageProps } from "$fresh/server.ts";
import { type AppState, type UserProfile } from "../../../types/index.ts";
import { Icon } from "../../../components/ui/Icon.tsx";
import { getAllUsers } from "../../../lib/kv.ts";

export async function handler(_req: Request, ctx: FreshContext<AppState>) {
  const kv = await Deno.openKv();

  try {
    const users = await getAllUsers();
    const profiles: UserProfile[] = users.map((user) => ({
      email: user.email,
      role: user.role,
      name: user.name,
      createdAt: user.createdAt,
      isActive: user.isActive,
    }));

    return ctx.render({ profiles });
  } finally {
    await kv.close();
  }
}

export default function ProfilesPage({
  data,
}: PageProps<{ profiles: UserProfile[] }, AppState>) {
  const { profiles } = data;

  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <div class="sm:flex sm:items-center">
            <div class="sm:flex-auto">
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                Gestión de Perfiles
              </h1>
              <p class="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Administra los usuarios del sistema y sus perfiles.
              </p>
            </div>
            <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
              <a
                href="/(admin)/profiles/new"
                class="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <Icon name="user-plus" className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </a>
            </div>
          </div>

          <div class="mt-8 flow-root">
            <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <table class="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th
                          scope="col"
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Usuario
                        </th>
                        <th
                          scope="col"
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Rol
                        </th>
                        <th
                          scope="col"
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Estado
                        </th>
                        <th
                          scope="col"
                          class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          Fecha de Creación
                        </th>
                        <th scope="col" class="relative px-6 py-3">
                          <span class="sr-only">Acciones</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {profiles.length === 0
                        ? (
                          <tr>
                            <td
                              colSpan={5}
                              class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                            >
                              No hay usuarios registrados
                            </td>
                          </tr>
                        )
                        : (
                          profiles.map((profile) => (
                            <tr
                              key={profile.email}
                              class="hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                  <Icon
                                    name="user"
                                    className="h-5 w-5 text-gray-400 mr-3"
                                  />
                                  <div>
                                    <div class="text-sm font-medium text-gray-900 dark:text-white">
                                      {profile.name || profile.email}
                                    </div>
                                    {profile.name && (
                                      <div class="text-sm text-gray-500 dark:text-gray-400">
                                        {profile.email}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap">
                                <span
                                  class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    profile.role === "superadmin"
                                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  }`}
                                >
                                  {profile.role === "superadmin"
                                    ? "Administrador"
                                    : "Psicólogo"}
                                </span>
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap">
                                <span
                                  class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    profile.isActive !== false
                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  }`}
                                >
                                  {profile.isActive !== false
                                    ? "Activo"
                                    : "Inactivo"}
                                </span>
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {new Date(profile.createdAt).toLocaleDateString(
                                  "es-ES",
                                )}
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <a
                                  href={`/(admin)/profiles/edit/${
                                    encodeURIComponent(
                                      profile.email,
                                    )
                                  }`}
                                  class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                                  title="Editar perfil"
                                >
                                  <Icon name="user-cog" className="h-4 w-4" />
                                </a>
                                <a
                                  href={`/(admin)/profiles/delete/${
                                    encodeURIComponent(
                                      profile.email,
                                    )
                                  }`}
                                  class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  title="Eliminar perfil"
                                >
                                  <Icon name="trash-2" className="h-4 w-4" />
                                </a>
                              </td>
                            </tr>
                          ))
                        )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
