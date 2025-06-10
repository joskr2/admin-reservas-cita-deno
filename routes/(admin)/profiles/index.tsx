import type { Handlers, PageProps } from "$fresh/server.ts";

import type { AppState } from "../../_middleware.ts";
import Header from "../../../islands/Header.tsx";
import Footer from "../../../components/layout/Footer.tsx";

// Define the shape of a user profile
interface Profile {
  email: string;
  role: "superadmin" | "psychologist";
  createdAt: string;
}

// Define the data that the handler will pass to the component
interface Data {
  profiles: Profile[];
}

export const handler: Handlers<Data, AppState> = {
  async GET(_req, ctx) {
    // Optional: Add a check to ensure only superadmins can access this page
    if (ctx.state.user?.role !== "superadmin") {
      // Redirect non-admins to the dashboard or show an error
      return new Response(null, {
        status: 307,
        headers: { Location: "/dashboard" },
      });
    }

    const kv = await Deno.openKv();
    const profiles: Profile[] = [];

    // Use kv.list to iterate over all users
    const userEntries = kv.list({ prefix: ["users"] });
    for await (const entry of userEntries) {
      profiles.push(entry.value as Profile);
    }
    kv.close();

    // Sort profiles, maybe by creation date or email
    profiles.sort((a, b) => a.email.localeCompare(b.email));

    return ctx.render({ profiles });
  },
};

export default function ProfilesPage({ data }: PageProps<Data>) {
  const { profiles } = data;

  return (
    <div class="flex flex-col min-h-screen">
      <Header />
      <main class="flex-grow bg-gray-50 dark:bg-gray-900">
        <div class="mx-auto max-w-7xl py-12 px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div class="sm:flex sm:items-center sm:justify-between pb-8 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h1 class="text-3xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
                Gestión de Perfiles
              </h1>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Administra los perfiles de los psicólogos y administradores del
                sistema.
              </p>
            </div>
            <div class="mt-4 sm:mt-0 sm:ml-4">
              <a
                href="/profiles/new" // This will be the route for the creation form
                class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:ring-offset-gray-800"
              >
                <img
                  src="/icons/user-plus.svg"
                  alt="Nuevo perfil"
                  width="20"
                  height="20"
                  class="mr-2"
                />
                Crear Nuevo Perfil
              </a>
            </div>
          </div>

          {/* Profiles Table */}
          <div class="mt-8 flow-root">
            <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table class="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th
                        scope="col"
                        class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-0"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Rol
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Fecha de Creación
                      </th>
                      <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-0">
                        <span class="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
                    {profiles.map((profile) => (
                      <tr key={profile.email}>
                        <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-0">
                          {profile.email}
                        </td>
                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                          <span
                            class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              profile.role === "superadmin"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            }`}
                          >
                            {profile.role === "superadmin"
                              ? "Superadministrador"
                              : "Psicólogo"}
                          </span>
                        </td>
                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                          {new Date(profile.createdAt).toLocaleDateString(
                            "es-PE"
                          )}
                        </td>
                        <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                          <div class="flex items-center justify-end gap-x-4">
                            <a
                              href={`/profiles/edit/${encodeURIComponent(
                                profile.email
                              )}`}
                              class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200"
                            >
                              <img
                                src="/icons/file-digit.svg"
                                alt="Editar"
                                width="20"
                                height="20"
                              />
                              <span class="sr-only">, {profile.email}</span>
                            </a>
                            <a
                              href={`/profiles/delete/${encodeURIComponent(
                                profile.email
                              )}`}
                              class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                            >
                              <img
                                src="/icons/trash-2.svg"
                                alt="Eliminar"
                                width="20"
                                height="20"
                              />
                              <span class="sr-only">, {profile.email}</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
