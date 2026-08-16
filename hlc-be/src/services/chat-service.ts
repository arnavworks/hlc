import type { ChatAction, ChatRequest, ChatResponse } from "../contracts/chat.js";

const APPOINTMENT_URL = "https://heartlandcomputer.com/appointment";

const response = (reply: string, actions: ChatAction[] = []): Pick<ChatResponse, "reply" | "actions"> => ({
  reply,
  ...(actions.length > 0 ? { actions } : {}),
});

/**
 * Temporary deterministic provider. Replace this function with an AI provider,
 * CRM workflow, or booking service without changing the HTTP route contract.
 */
export const answerChat = async (input: ChatRequest): Promise<Pick<ChatResponse, "reply" | "actions">> => {
  const message = input.message.toLowerCase();

  if (/book|appointment|schedule|demo/.test(message)) {
    return response("Absolutely. Choose a time that works for you and our team will take it from there.", [
      { label: "Open appointment calendar", url: APPOINTMENT_URL, type: "calendar" },
    ]);
  }

  if (/track|repair status|status of/.test(message)) {
    return response("You can check your repair with the tracking number from your repair sheet or confirmation email.", [
      { label: "Enter repair tracking number", type: "tracking" },
    ]);
  }

  if (/hour|open|close/.test(message)) {
    return response("Heartland is open Monday through Saturday from 10:00 AM to 6:00 PM, and closed Sunday.");
  }

  if (/location|address|where/.test(message)) {
    return response("We have two locations: 13812 Manderson Circle in Omaha and 1924 West Broadway in Council Bluffs.");
  }

  if (/repair|service|fix|virus|data|laptop|desktop|phone|tablet|network/.test(message)) {
    return response("We repair laptops, desktops, phones, and tablets, and also provide virus removal, data recovery, networking, business IT, custom PCs, and remote support. What device is giving you trouble?");
  }

  return response("Thanks for reaching out. I can help with services, locations, hours, appointments, and repair tracking. What would you like to know?");
};
