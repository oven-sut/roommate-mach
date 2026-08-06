import { MessageSquare, Send } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "../../components/ui";
import { api, appState } from "../../services/api";
import { C } from "../../theme/colors";
import { s } from "../../theme/styles";
import type { Screen } from "../../types/navigation";

/**
 * How often the thread is re-fetched. There is no realtime transport yet —
 * see the Socket.IO note in the backend README — so new messages arrive on
 * this interval.
 */
const POLL_INTERVAL_MS = 4000;

export function Chat({ go }: { go: (x: Screen) => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  const load = () =>
    appState.activeConversationId
      ? api(`/api/conversations/${appState.activeConversationId}/messages`)
          .then(setMessages)
          .catch((e) => Alert.alert("Chat", e.message))
      : Promise.resolve();

  useEffect(() => {
    void load();
    const timer = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const send = async () => {
    if (!appState.activeConversationId || !text.trim()) return;
    const message = await api(
      `/api/conversations/${appState.activeConversationId}/messages`,
      { method: "POST", body: JSON.stringify({ text }) },
    );
    setMessages((items) => [...items, message]);
    setText("");
  };

  return (
    <SafeAreaView style={s.safe}>
      <Header
        title={appState.activeConversationName}
        back={() => go("messages")}
        right="Chat"
      />
      <Text style={s.online}>● Matched conversation</Text>
      <View style={s.chatBody}>
        <Text style={s.matchDate}>ข้อความถูกจัดเก็บอย่างปลอดภัย</Text>
        {messages.map((m) => {
          const mine = m.senderId === appState.currentUserId;
          return (
            <View key={m.id} style={mine ? s.bubbleOut : s.bubbleIn}>
              <Text style={{ color: C.ink }}>{m.text}</Text>
              <Text style={{ fontSize: 9, color: mine ? "#4F3F42" : C.muted }}>
                {new Date(m.createdAt).toLocaleTimeString()}
              </Text>
            </View>
          );
        })}
        {!messages.length && (
          <Text style={s.centerMuted}>
            Say hello to your new roommate match 👋
          </Text>
        )}
      </View>
      <View style={s.composer}>
        <MessageSquare size={22} color="#8D7C75" />
        <TextInput
          style={[s.input, { height: 48, flex: 1 }]}
          placeholder="Message..."
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
        />
        <Pressable style={s.send} onPress={send}>
          <Send size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
