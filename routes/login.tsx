/// <reference lib="deno.unstable" />
import { type PageProps } from "$fresh/server.ts";
import { Icon } from "../components/ui/Icon.tsx";
import { Button } from "../components/ui/Button.tsx";
import { Input } from "../components/ui/Input.tsx";
import { getKv } from "../lib/kv.ts";
import { Handlers } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { Card } from "../components/ui/Card.tsx";
import { setCookie } from "$std/http/cookie.ts";
import { compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import type { AppState, User } from "../types/index.ts";
import { extractUserContext, logger } from "../lib/logger.ts";

interface LoginData {
  email?: string | undefined;
  password?: string | undefined;
  error?: string | undefined;
}

export const handler: Handlers<LoginData, AppState> = {
  async GET(req, ctx) {
    const requestId = ctx.state.requestId || "unknown";
    const userContext = extractUserContext(ctx.state.user);

    await logger.debug("LOGIN", "GET request for login page", {
      url: req.url,
      userAgent: req.headers.get("user-agent"),
    }, { requestId, ...userContext });

    // Simplemente renderizar la página de login
    // El middleware ya maneja las redirecciones si el usuario está autenticado
    return ctx.render({});
  },

  async POST(req, ctx) {
    const requestId = ctx.state.requestId || "unknown";
    const userContext = extractUserContext(ctx.state.user);

    await logger.info("LOGIN", "Processing login attempt", {
      url: req.url,
      userAgent: req.headers.get("user-agent"),
    }, { requestId, ...userContext });

    const form = await req.formData();
    const email = form.get("email")?.toString();
    const password = form.get("password")?.toString();

    await logger.debug("LOGIN", "Login form data extracted", {
      hasEmail: !!email,
      hasPassword: !!password,
      email: email || "missing",
    }, { requestId });

    if (!email || !password) {
      await logger.warn(
        "LOGIN",
        "Login validation failed: missing credentials",
        {
          hasEmail: !!email,
          hasPassword: !!password,
        },
        { requestId },
      );

      return ctx.render({
        email,
        error: "Email y contraseña son requeridos",
      });
    }

    try {
      // Buscar usuario en la base de datos
      const kv = await getKv();

      await logger.debug("LOGIN", "Looking up user in database", {
        email,
      }, { requestId });

      const userResult = await kv.get(["users", email]);

      if (!userResult.value) {
        await logger.warn("LOGIN", "Login failed: user not found", {
          email,
        }, { requestId });

        return ctx.render({
          email,
          error: "Credenciales inválidas",
        });
      }

      const user = userResult.value as User;

      await logger.debug("LOGIN", "User found, verifying password", {
        email,
        userId: user.id,
        userRole: user.role,
      }, { requestId });

      // Verificar contraseña
      const isValidPassword = await compare(password, user.passwordHash);

      if (!isValidPassword) {
        await logger.warn("LOGIN", "Login failed: invalid password", {
          email,
          userId: user.id,
        }, { requestId });

        return ctx.render({
          email,
          error: "Credenciales inválidas",
        });
      }

      // Crear sesión simple (en producción usar JWT)
      const sessionId = crypto.randomUUID();

      await logger.debug("LOGIN", "Creating user session", {
        email,
        userId: user.id,
        sessionId: sessionId.substring(0, 8) + "...",
      }, { requestId });

      await kv.set(
        ["sessions", sessionId],
        { userEmail: email },
        { expireIn: 7 * 24 * 60 * 60 * 1000 },
      );

      // Crear respuesta con cookie
      const response = new Response("", {
        status: 302,
        headers: { Location: "/dashboard" },
      });

      setCookie(response.headers, {
        name: "auth_session",
        value: sessionId,
        maxAge: 7 * 24 * 60 * 60, // 7 días
        httpOnly: true,
        secure: Deno.env.get("DENO_ENV") === "production",
        sameSite: "Lax",
        path: "/",
      });

      await logger.info("LOGIN", "Login successful, redirecting to dashboard", {
        email,
        userId: user.id,
        userRole: user.role,
        sessionId: sessionId.substring(0, 8) + "...",
      }, { requestId, userId: user.id, userRole: user.role });

      return response;
    } catch (error) {
      await logger.error("LOGIN", "Login error occurred", {
        email,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }, { requestId });

      return ctx.render({
        email,
        error: "Error interno del servidor",
      });
    }
  },
};

export default function Login({ data }: PageProps<LoginData>) {
  return (
    <>
      <Head>
        <title>Iniciar Sesión - Horizonte Clínica</title>
        <meta
          name="description"
          content="Accede a tu cuenta de Horizonte Clínica"
        />
      </Head>

      <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
          {/* Logo y título */}
          <div class="text-center">
            <div class="mx-auto h-16 w-16 flex items-center justify-center bg-blue-600 rounded-full shadow-lg">
              <Icon name="heart-handshake" className="h-8 w-8 text-white" />
            </div>
            <h2 class="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
              Horizonte Clínica
            </h2>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Inicia sesión en tu cuenta
            </p>
          </div>

          {/* Formulario de login */}
          <Card class="p-8 shadow-xl">
            <form method="POST" class="space-y-6">
              {data?.error && (
                <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {data.error}
                </div>
              )}

              <div class="space-y-4">
                {/* Campo Email con icono */}
                <div class="relative">
                  <label
                    htmlFor="email"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
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
                      required
                      hasLeftIcon
                      placeholder="tu@email.com"
                      value={data?.email || ""}
                      class="block w-full"
                    />
                  </div>
                </div>

                {/* Campo Contraseña con icono */}
                <div class="relative">
                  <label
                    htmlFor="password"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
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
                      required
                      hasLeftIcon
                      placeholder="••••••••"
                      class="block w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Botón de envío */}
              <div>
                <Button
                  type="submit"
                  variant="primary"
                  class="w-full flex justify-center py-3 px-4 text-sm font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Icon name="login" className="h-4 w-4 mr-2" />
                  Iniciar Sesión
                </Button>
              </div>
            </form>

            {/* Información adicional */}
            <div class="mt-6 text-center">
              <p class="text-xs text-gray-500 dark:text-gray-400">
                ¿Problemas para acceder? Contacta al administrador del sistema
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
