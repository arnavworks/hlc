import type { IncomingMessage, ServerResponse } from "node:http";
import { config } from "../config.js";

export const applyCors = (request: IncomingMessage, response: ServerResponse): boolean => {
  const origin = request.headers.origin?.replace(/\/$/, "");
  const isAllowed = origin !== undefined && config.allowedOrigins.includes(origin);

  if (isAllowed) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }

  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  response.setHeader("Access-Control-Max-Age", "86400");

  if (request.method === "OPTIONS") {
    response.writeHead(isAllowed ? 204 : 403);
    response.end();
    return true;
  }

  return false;
};
