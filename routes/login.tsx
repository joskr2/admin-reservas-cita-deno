/// <reference lib="deno.unstable" />
import type { Handlers, PageProps } from "$fresh/server.ts";
import { setCookie } from "$std/http/cookie.ts";
import { verify } from "@felix/bcrypt";

import Header from "../components/layout/Header.tsx";
import { Input } from "../components/ui/Input.tsx";
import { Button } from "../components/ui/Button.tsx";
import Footer from "../components/layout/Footer.tsx";

// Interface for the data passed from the handler to the component
interface Data {
  error?: string;
}

export const handler: Handlers<Data> = {
  // --- FORM SUBMISSION LOGIC (SERVER-SIDE) ---
  async POST(req, ctx) {
    const form = await req.formData();
    const email = form.get("email")?.toString();
    const password = form.get("password")?.toString();

    if (!email || !password) {
      return ctx.render({ error: "Email y contraseña son requeridos." });
    }

    const kv = await Deno.openKv();
    const userEntry = await kv.get(["users", email]);
    kv.close();

    if (!userEntry.value) {
      return ctx.render({ error: "Credenciales incorrectas." });
    }

    const user = userEntry.value as {
      passwordHash: string;
      [key: string]: unknown;
    };
    const isPasswordValid = await verify(password, user.passwordHash);

    if (!isPasswordValid) {
      return ctx.render({ error: "Credenciales incorrectas." });
    }

    // --- Session Management ---
    const sessionId = crypto.randomUUID();
    const sessionExpiry = 3 * 24 * 60 * 60 * 1000; // 3 days

    const kvSession = await Deno.openKv();
    await kvSession.set(["sessions", sessionId], userEntry.key, {
      expireIn: sessionExpiry,
    });
    kvSession.close();

    const headers = new Headers();
    setCookie(headers, {
      name: "auth_session",
      value: sessionId,
      path: "/",
      httpOnly: true,
      secure: false, // Set to false for local HTTP testing if needed
      sameSite: "Lax",
      expires: new Date(Date.now() + sessionExpiry),
    });

    // Redirect to dashboard on successful login
    headers.set("location", "/dashboard");
    return new Response(null, {
      status: 303, // See Other: standard for redirecting after a POST
      headers,
    });
  },
};

// --- PAGE RENDERING LOGIC (SERVER-SIDE) ---
export default function LoginPage({ data }: PageProps<Data>) {
  return (
    <div class="flex flex-col min-h-screen">
      <Header />
      <main class="flex-grow flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
        <div class="w-full max-w-md">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
              Iniciar Sesión
            </h2>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Ingresa a tu cuenta para continuar.
            </p>
          </div>

          {/* Simple Form - No client-side JS needed for submission */}
          <form method="POST" class="space-y-6">
            {data?.error && (
              <div
                class="bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/20 dark:border-red-500 dark:text-red-300 px-4 py-3 rounded-md text-sm"
                role="alert"
              >
                {data.error}
              </div>
            )}

            <div class="relative">
              <img
                src="/icons/mail.svg"
                alt="Email"
                width="20"
                height="20"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                type="email"
                name="email"
                placeholder="Correo electrónico"
                required
                class="pl-10"
              />
            </div>

            <div class="relative">
              <img
                src="/icons/lock.svg"
                alt="Contraseña"
                width="20"
                height="20"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                type="password"
                name="password"
                placeholder="Contraseña"
                required
                class="pl-10"
              />
            </div>

            <div>
              <Button type="submit" class="w-full flex justify-center">
                <img
                  src="/icons/login.svg"
                  alt="Ingresar"
                  width="20"
                  height="20"
                  class="mr-2"
                />
                Ingresar
              </Button>
            </div>
            <div class="text-xs text-center text-gray-500 dark:text-gray-400 space-y-1">
              <p>Para probar (después de ejecutar `deno task seed`):</p>
              <p>
                Usuario:{" "}
                <code class="font-mono bg-gray-200 dark:bg-gray-700 p-1 rounded">
                  admin@horizonte.com
                </code>
              </p>
              <p>
                Contraseña:{" "}
                <code class="font-mono bg-gray-200 dark:bg-gray-700 p-1 rounded">
                  password123
                </code>
              </p>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
