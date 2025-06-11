/// <reference lib="deno.unstable" />
import { type PageProps, type FreshContext } from "$fresh/server.ts";
import {
  type AppState,
  type LoginForm,
  type ApiResponse,
} from "../types/index.ts";
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

      // Verificar contraseña (en un caso real usarías bcrypt)
      const encoder = new TextEncoder();
      const data = encoder.encode(password + "salt");
      const hash = await crypto.subtle.digest("SHA-256", data);
      const hashedPassword = Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (hashedPassword !== user.passwordHash) {
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
        `session=${sessionId}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}`
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
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <div class="mx-auto h-12 w-12 flex items-center justify-center">
            <Icon name="logo" className="h-12 w-12 text-indigo-600" />
          </div>
          <h2 class="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
            Iniciar Sesión
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Accede a tu cuenta de Horizonte Clínica
          </p>
        </div>

        <form class="mt-8 space-y-6" method="POST">
          <div class="space-y-4">
            <div>
              <label htmlFor="email" class="sr-only">
                Correo electrónico
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="mail" className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="pl-10"
                  placeholder="Correo electrónico"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" class="sr-only">
                Contraseña
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="lock" className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="pl-10"
                  placeholder="Contraseña"
                />
              </div>
            </div>
          </div>

          {error && (
            <div class="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <Icon name="file-warning" className="h-5 w-5 text-red-400" />
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                    Error de autenticación
                  </h3>
                  <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="group relative w-full flex justify-center"
            >
              <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                <Icon
                  name="login"
                  className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400"
                />
              </span>
              Iniciar Sesión
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
