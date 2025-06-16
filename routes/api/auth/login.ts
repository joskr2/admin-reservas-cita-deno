/// <reference lib="deno.unstable" />
import { Handlers } from "$fresh/server.ts";
import { getKv } from "../../../lib/kv.ts";
import { compare } from "../../../lib/crypto.ts";
import { setCookie } from "$std/http/cookie.ts";
import type { User } from "../../../types/index.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const { email, password } = await req.json();

      if (!email || !password) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Email y contraseña son requeridos",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Buscar usuario en la base de datos
      const kv = await getKv();
      const userResult = await kv.get(["users", email]);

      if (!userResult.value) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Credenciales inválidas",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const user = userResult.value as User;

      // Verificar contraseña
      const isValidPassword = await compare(password, user.passwordHash);

      if (!isValidPassword) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Credenciales inválidas",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Crear sesión
      const sessionId = crypto.randomUUID();
      await kv.set(
        ["sessions", sessionId],
        { userEmail: email },
        { expireIn: 7 * 24 * 60 * 60 * 1000 }
      );

      // Crear respuesta con cookie y datos del usuario
      const response = new Response(
        JSON.stringify({
          success: true,
          user: {
            email: user.email,
            name: user.name,
            role: user.role,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );

      setCookie(response.headers, {
        name: "auth_session",
        value: sessionId,
        maxAge: 7 * 24 * 60 * 60, // 7 días
        httpOnly: true,
        secure: Deno.env.get("DENO_ENV") === "production",
        sameSite: "Lax",
        path: "/",
      });

      return response;
    } catch (error) {
      console.error("Login API error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Error interno del servidor",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};
