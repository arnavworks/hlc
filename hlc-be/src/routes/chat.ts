import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ChatHistoryItem, ChatRequest } from "../contracts/chat.js";
import { addMessage, getOrCreateConversation } from "../db/repositories/conversations.js";
import { HttpError, readJson, sendJson } from "../lib/http.js";
import { answerChat } from "../services/chat-service.js";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const validHistory = (value: unknown): value is ChatHistoryItem[] =>
  value === undefined ||
  (Array.isArray(value) &&
    value.length <= 30 &&
    value.every(
      (item) =>
        isRecord(item) &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.length <= 4_000,
    ));

const parseChatRequest = (body: unknown): ChatRequest => {
  if (!isRecord(body)) throw new HttpError(400, "Request body must be an object");
  if (typeof body.message !== "string" || body.message.trim().length === 0) {
    throw new HttpError(400, "message is required");
  }
  if (body.message.length > 800) throw new HttpError(400, "message cannot exceed 800 characters");
  if (body.sessionId !== undefined && typeof body.sessionId !== "string") {
    throw new HttpError(400, "sessionId must be a string");
  }
  if (!validHistory(body.history)) throw new HttpError(400, "history has an invalid format");

  return {
    message: body.message.trim(),
    ...(typeof body.sessionId === "string" ? { sessionId: body.sessionId } : {}),
    ...(Array.isArray(body.history) ? { history: body.history as ChatHistoryItem[] } : {}),
    ...(isRecord(body.context)
      ? {
          context: {
            ...(typeof body.context.businessName === "string" ? { businessName: body.context.businessName } : {}),
            ...(typeof body.context.pageUrl === "string" ? { pageUrl: body.context.pageUrl } : {}),
            ...(typeof body.context.pageTitle === "string" ? { pageTitle: body.context.pageTitle } : {}),
          },
        }
      : {}),
  };
};

export const chatRoute = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
  const input = parseChatRequest(await readJson(request));
  const sessionId = input.sessionId || randomUUID();
  const conversation = await getOrCreateConversation(sessionId, input.context);

  await addMessage(conversation.id, "user", input.message);
  const result = await answerChat(input);
  await addMessage(conversation.id, "assistant", result.reply);

  sendJson(response, 200, {
    ...result,
    sessionId,
  });
};
