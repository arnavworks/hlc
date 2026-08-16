export type ChatRole = "user" | "assistant";

export interface ChatHistoryItem {
  role: ChatRole;
  content: string;
}

export interface ChatContext {
  businessName?: string;
  pageUrl?: string;
  pageTitle?: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  history?: ChatHistoryItem[];
  context?: ChatContext;
}

export type ChatActionType = "arrow" | "calendar" | "phone" | "tracking";

export interface ChatAction {
  label: string;
  url?: string;
  type?: ChatActionType;
}

export interface ChatResponse {
  reply: string;
  actions?: ChatAction[];
  sessionId: string;
}
