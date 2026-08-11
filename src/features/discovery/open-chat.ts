import { api, appState } from "../../services/api";
import type { Conversation } from "../../types/models";
import type { Screen } from "../../types/navigation";

/**
 * Opens the chat room for a match.
 *
 * The backend creates a conversation alongside the match, but older matches
 * predate that, so we ask for one to be created and fall back to scanning the
 * conversation list before giving up and showing the inbox.
 */
export async function openChatWith(
  {
    matchId,
    userId,
    name,
    conversationId,
  }: {
    matchId?: string;
    userId?: string;
    name?: string;
    conversationId?: string;
  },
  go: (screen: Screen) => void,
) {
  appState.activeConversationName = name || "Chat";

  if (conversationId) {
    appState.activeConversationId = conversationId;
    go("chat");
    return;
  }

  try {
    const created = await api<Conversation>("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ matchId, userId }),
    });
    if (created?.id) {
      appState.activeConversationId = created.id;
      go("chat");
      return;
    }
  } catch {
    // Fall through to the lookup below.
  }

  try {
    const all = await api<Conversation[]>("/api/conversations");
    const found = all.find(
      (c) => c.displayName === name || c.name === name,
    );
    if (found?.id) {
      appState.activeConversationId = found.id;
      go("chat");
      return;
    }
  } catch {
    // Nothing more to try.
  }

  appState.activeConversationId = null;
  go("messages");
}
