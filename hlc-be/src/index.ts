import { createServer } from "node:http";
import { config } from "./config.js";
import { checkAppointmentDatabase, closeAppointmentDatabase } from "./db/appointment-client.js";
import { checkDatabase, closeDatabase, isDatabaseAuthError } from "./db/client.js";
import { applyCors } from "./lib/cors.js";
import { HttpError, sendJson } from "./lib/http.js";
import {
  appointmentAvailabilityRoute,
  appointmentTrackingRoute,
  appointmentTypesRoute,
  bookingRoute,
} from "./routes/bookings.js";
import { chatRoute } from "./routes/chat.js";
import { repairTrackingRoute } from "./routes/repairs.js";

const server = createServer(async (request, response) => {
  const requestId = request.headers["x-request-id"]?.toString() || crypto.randomUUID();
  response.setHeader("X-Request-Id", requestId);
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "no-referrer");

  if (applyCors(request, response)) return;

  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

    if (request.method === "GET" && url.pathname === "/") {
      sendJson(response, 200, {
        service: "hlc-be",
        status: "ok",
        version: "0.1.0",
        endpoints: [
          "GET /health",
          "POST /v1/chat",
          "GET /v1/appointments/types",
          "GET /v1/appointments/availability",
          "POST /v1/appointments",
          "POST /v1/appointments/track",
          "POST /v1/repairs/track",
        ],
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/health") {
      await Promise.all([checkDatabase(), checkAppointmentDatabase()]);
      sendJson(response, 200, {
        status: "ok",
        service: "hlc-be",
        database: "connected",
        appointmentDatabase: "connected",
        provider: config.chatProvider,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/v1/chat") {
      await chatRoute(request, response);
      return;
    }

    if (request.method === "GET" && url.pathname === "/v1/appointments/types") {
      await appointmentTypesRoute(request, response);
      return;
    }

    if (request.method === "GET" && url.pathname === "/v1/appointments/availability") {
      await appointmentAvailabilityRoute(request, response, url);
      return;
    }

    if (
      request.method === "POST" &&
      (url.pathname === "/v1/appointments" || url.pathname === "/v1/bookings")
    ) {
      await bookingRoute(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/v1/appointments/track") {
      await appointmentTrackingRoute(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/v1/repairs/track") {
      await repairTrackingRoute(request, response);
      return;
    }

    sendJson(response, 404, { error: "Route not found", requestId });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof HttpError ? error.message : "Internal server error";
    const code = error instanceof HttpError ? error.code : undefined;

    if (!(error instanceof HttpError)) console.error(`[${requestId}]`, error);
    sendJson(response, status, { error: message, ...(code ? { code } : {}), requestId });
  }
});

server.on("clientError", (_error, socket) => {
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

const startServer = async (): Promise<void> => {
  try {
    await Promise.all([checkDatabase(), checkAppointmentDatabase()]);
  } catch (error) {
    if (isDatabaseAuthError(error)) {
      console.error("Database authentication failed.");
      console.error(
        "Verify TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in hlc-be/.env and ensure the token was created for that exact Turso database.",
      );
      process.exit(1);
    }

    console.error("Database connection check failed (chat/repair Turso or appointment MySQL). ");
    console.error(error);
    process.exit(1);
  }

  server.listen(config.port, config.host, () => {
    console.log(`hlc-be listening on http://${config.host}:${config.port}`);
    console.log(`Allowed origins: ${config.allowedOrigins.join(", ")}`);
  });
};

void startServer();

const shutdown = (signal: string): void => {
  console.log(`${signal} received, closing server`);
  server.close(async (error) => {
    closeDatabase();
    await closeAppointmentDatabase();
    if (error) {
      console.error(error);
      process.exit(1);
    }
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
