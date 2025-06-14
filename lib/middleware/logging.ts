/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import type { FreshContext } from "$fresh/server.ts";
import { logger, generateRequestId, extractUserContext } from "../logger.ts";
import type { AppState } from "../../types/index.ts";

// Extender el AppState para incluir el requestId
declare module "../../types/index.ts" {
  interface AppState {
    requestId?: string;
  }
}

export async function loggingMiddleware(req: Request, ctx: FreshContext<AppState>) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  // Agregar requestId al contexto
  ctx.state.requestId = requestId;
  
  // Obtener información del usuario si está disponible
  const userContext = extractUserContext(ctx.state.user);
  
  // Log de la request entrante
  await logger.logRequest(req, requestId, userContext);
  
  // Si es un POST con form data, loggear los datos del form
  if (req.method === "POST" && req.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
    try {
      // Clonar la request para poder leer el body sin consumirlo
      const clonedReq = req.clone();
      const formData = await clonedReq.formData();
      const url = new URL(req.url);
      
      await logger.logFormSubmission(
        formData, 
        url.pathname, 
        req.method, 
        requestId, 
        userContext
      );
    } catch (error) {
      await logger.warn('MIDDLEWARE', 'Failed to log form data', { error: error.message }, { requestId, ...userContext });
    }
  }
  
  // Procesar la request
  let response: Response;
  try {
    response = await ctx.next();
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log del error
    await logger.error('REQUEST_ERROR', `Unhandled error processing request`, {
      error: error.message,
      stack: error.stack,
      duration,
    }, { requestId, ...userContext });
    
    // Crear response de error
    response = new Response("Internal Server Error", { status: 500 });
  }
  
  const duration = Date.now() - startTime;
  
  // Log de la response
  await logger.logResponse(response, requestId, duration, userContext);
  
  // Si la response es una redirección, loggear la URL de destino
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (location) {
      await logger.info('REDIRECT', `Redirecting to: ${location}`, {
        from: new URL(req.url).pathname,
        to: location,
        status: response.status,
      }, { requestId, ...userContext });
    }
  }
  
  // Si hay un error HTTP, loggear detalles adicionales
  if (response.status >= 400) {
    await logger.warn('HTTP_ERROR', `HTTP ${response.status} ${response.statusText}`, {
      url: req.url,
      method: req.method,
      status: response.status,
      statusText: response.statusText,
    }, { requestId, ...userContext });
  }
  
  return response;
}