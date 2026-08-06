import { Search } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { BottomNav } from "../../components/BottomNav";
import { Card, Header, ScreenShell } from "../../components/ui";
import { useI18n } from "../../i18n";
import { api, appState } from "../../services/api";
import { C } from "../../theme/colors";
import { s } from "../../theme/styles";
import type { Screen } from "../../types/navigation";

export function Messages({ go }: { go: (x: Screen) => void }) {
  const { t } = useI18n();
  const [conversations, setConversations] = useState<any[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api("/api/conversations")
      .then(setConversations)
      .catch((e) => Alert.alert("Messages", e.message));
  }, []);

  const openConversation = (c: any) => {
    appState.activeConversationId = c.id;
    appState.activeConversationName = c.other?.displayName ?? "Chat";
    go("chat");
  };

  const visible = conversations.filter((c) =>
    c.other?.displayName?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <ScreenShell>
      <Header title={t("messages")} right={`${conversations.length} chats`} />
      <View style={{ position: "relative", marginBottom: 12 }}>
        <TextInput
          style={[s.input, { paddingLeft: 40 }]}
          placeholder="Search conversations..."
          placeholderTextColor={C.muted}
          value={query}
          onChangeText={setQuery}
        />
        <View style={{ position: "absolute", left: 12, top: 14 }}>
          <Search size={18} color="#8D7C75" />
        </View>
      </View>
      {visible.map((c) => (
        <Pressable key={c.id} onPress={() => openConversation(c)}>
          <Card>
            <View style={s.personRow}>
              <View style={s.avatar}>
                <Text style={s.avatarLetter}>
                  {c.other?.displayName?.[0] ?? "R"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{c.other?.displayName ?? "Roomie"}</Text>
                <Text style={s.muted}>
                  {c.messages?.[0]?.text ?? "Start a conversation"}
                </Text>
              </View>
              <Text style={s.muted}>
                {new Date(c.updatedAt).toLocaleDateString()}
              </Text>
            </View>
          </Card>
        </Pressable>
      ))}
      {!conversations.length && (
        <Card>
          <Text style={s.centerMuted}>
            Your matched conversations will appear here.
          </Text>
        </Card>
      )}
      <BottomNav screen="messages" go={go} />
    </ScreenShell>
  );
}
