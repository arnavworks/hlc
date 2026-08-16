import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { ChatContext, ChatRole } from "../../contracts/chat.js";
import { db } from "../client.js";
import { conversations, messages, type Conversation } from "../schema.js";

export const getOrCreateConversation = async (
  sessionId: string,
  context?: ChatContext,
): Promise<Conversation> => {
  const now = new Date().toISOString();
  const [conversation] = await db
    .insert(conversations)
    .values({
      id: randomUUID(),
      sessionId,
      businessName: context?.businessName,
      pageUrl: context?.pageUrl,
      pageTitle: context?.pageTitle,
    })
    .onConflictDoUpdate({
      target: conversations.sessionId,
      set: {
        ...(context?.businessName ? { businessName: context.businessName } : {}),
        ...(context?.pageUrl ? { pageUrl: context.pageUrl } : {}),
        ...(context?.pageTitle ? { pageTitle: context.pageTitle } : {}),
        updatedAt: now,
      },
    })
    .returning();

  if (!conversation) {
    const existing = await db.query.conversations.findFirst({
      where: eq(conversations.sessionId, sessionId),
    });
    if (!existing) throw new Error("Unable to create or retrieve conversation");
    return existing;
  }

  return conversation;
};

export const addMessage = async (
  conversationId: string,
  role: ChatRole,
  content: string,
): Promise<void> => {
  await db.insert(messages).values({
    id: randomUUID(),
    conversationId,
    role,
    content,
  });
};
