/// <reference lib="deno.unstable" />
import { type FreshContext, type PageProps } from "$fresh/server.ts";
import { type AppState } from "../types/index.ts";
import { Icon } from "../components/ui/Icon.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Input } from "../components/ui/Input.tsx";
import { getUserByEmail } from "../lib/kv.ts";

export async function handler(req: Request, ctx: FreshContext<AppState>) {
  if (req.method === "GET") {
    // Si ya está autenticado, redirigir al dashboard
    if (ctx.state.user) {
      return new Response(null, {
        status: 307,
        headers: { Location: "/dashboard" },
      });
    }
    return ctx.render({});
  }

  if (req.method === "POST") {
    const formData = await req.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      return ctx.render({
        error: "Email y contraseña son requeridos",
      });
    }

    const kv = await Deno.openKv();

    try {
      const user = await getUserByEmail(email);

      if (!user) {
        return ctx.render({
          error: "Credenciales inválidas",
        });
      }

      // Verificar contraseña con bcrypt
      const { compare } = await import(
        "https://deno.land/x/bcrypt@v0.4.1/mod.ts"
      );
      const isValidPassword = await compare(password, user.passwordHash);

      if (!isValidPassword) {
        return ctx.render({
          error: "Credenciales inválidas",
        });
      }

      // Crear sesión
      const sessionId = crypto.randomUUID();
      const sessionKey = ["sessions", sessionId];
      const userKey = ["users", email];

      await kv.set(sessionKey, userKey, { expireIn: 7 * 24 * 60 * 60 * 1000 }); // 7 días

      const headers = new Headers();
      headers.set(
        "Set-Cookie",
        `auth_session=${sessionId}; HttpOnly; Path=/; Max-Age=${
          7 * 24 * 60 * 60
        }`,
      );
      headers.set("Location", "/dashboard");

      return new Response(null, {
        status: 307,
        headers,
      });
    } finally {
      await kv.close();
    }
  }

  return new Response("Method not allowed", { status: 405 });
}

export default function LoginPage({
  data,
}: PageProps<{ error?: string }, AppState>) {
  const { error } = data || {};

  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full">
        {/* Card Container */}
        <div class="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8 space-y-8">
          {/* Header Section */}
          <div class="text-center">
            <div class="mx-auto h-16 w-16 flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-6">
              <Icon
                name="heart-handshake"
                size={32}
                className="text-white filter brightness-0 invert"
              />
            </div>
            <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Horizonte Clínica
            </h1>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Iniciar Sesión
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Accede a tu cuenta para gestionar tu consulta
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <Icon
                    name="file-warning"
                    size={20}
                    className="text-red-500 dark:text-red-400"
                  />
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                    Error de autenticación
                  </h3>
                  <p class="mt-1 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form method="POST" class="space-y-6">
            <div class="space-y-5">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Correo electrónico
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Icon
                      name="mail"
                      size={20}
                      className="text-gray-400 dark:text-gray-500"
                    />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="pl-10 pr-3 h-12 text-base"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Contraseña
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Icon
                      name="lock"
                      size={20}
                      className="text-gray-400 dark:text-gray-500"
                    />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="pl-10 pr-3 h-12 text-base"
                    placeholder="Tu contraseña"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div class="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
              >
                <Icon
                  name="login"
                  size={20}
                  className="mr-2 text-white filter brightness-0 invert"
                />
                Iniciar Sesión
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div class="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Sistema de gestión psicológica seguro y confiable
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div class="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
            Credenciales de demostración:
          </h3>
          <div class="text-xs text-blue-700 dark:text-blue-300 space-y-3">
            <div class="bg-white dark:bg-blue-800/30 rounded p-2">
              <p class="font-semibold text-blue-900 dark:text-blue-100">
                Super Administrador:
              </p>
              <p>
                <strong>Email:</strong> admin@horizonte.com
              </p>
              <p>
                <strong>Contraseña:</strong> password123
              </p>
            </div>
            <div class="bg-white dark:bg-blue-800/30 rounded p-2">
              <p class="font-semibold text-blue-900 dark:text-blue-100">
                Psicólogo 1:
              </p>
              <p>
                <strong>Email:</strong> psicologo1@horizonte.com
              </p>
              <p>
                <strong>Contraseña:</strong> password123
              </p>
            </div>
            <div class="bg-white dark:bg-blue-800/30 rounded p-2">
              <p class="font-semibold text-blue-900 dark:text-blue-100">
                Psicólogo 2:
              </p>
              <p>
                <strong>Email:</strong> psicologo2@horizonte.com
              </p>
              <p>
                <strong>Contraseña:</strong> password123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
