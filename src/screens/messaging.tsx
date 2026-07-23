import React, { useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Alert, Animated, Image, Pressable, SafeAreaView, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { Button, Card, Chip, Field, Header, Logo, Progress, ScreenShell } from "../components/ui";
import { api, appState, saveToken } from "../services/api";
import { C } from "../theme/colors";
import { s } from "../theme/styles";
import type { Screen } from "../types/navigation";

import { BottomNav } from "./discovery";
export function Messages({ go }: { go: (x: Screen) => void }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  useEffect(() => {
    api("/api/conversations")
      .then(setConversations)
      .catch((e) => Alert.alert("Messages", e.message));
  }, []);
  return (
    <ScreenShell>
      <Header title="Messages" right={`${conversations.length} chats`} />
      <TextInput
        style={s.input}
        placeholder="Search conversations..."
        placeholderTextColor={C.muted}
        value={query}
        onChangeText={setQuery}
      />
      {conversations
        .filter((c) =>
          c.other?.displayName?.toLowerCase().includes(query.toLowerCase()),
        )
        .map((c) => (
          <Pressable
            key={c.id}
            onPress={() => {
              appState.activeConversationId = c.id;
              appState.activeConversationName = c.other?.displayName ?? "Chat";
              go("chat");
            }}
          >
            <Card>
              <View style={s.personRow}>
                <View style={s.avatar}>
                  <Text style={s.avatarLetter}>
                    {c.other?.displayName?.[0] ?? "R"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>
                    {c.other?.displayName ?? "Roomie"}
                  </Text>
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
    const timer = setInterval(load, 4000);
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
        <Text style={s.matchDate}>Messages are stored securely</Text>
        {messages.map((m) => {
          const mine = m.senderId === appState.currentUserId;
          return (
            <View key={m.id} style={mine ? s.bubbleOut : s.bubbleIn}>
              <Text style={{ color: mine ? "#fff" : C.ink }}>{m.text}</Text>
              <Text style={{ fontSize: 9, color: mine ? "#FFE4D8" : C.muted }}>
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
        <Text style={{ fontSize: 22 }}>▣</Text>
        <TextInput
          style={[s.input, { height: 48, flex: 1 }]}
          placeholder="Message..."
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
        />
        <Pressable style={s.send} onPress={send}>
          <Text style={{ color: "#fff" }}>➤</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export function Settings({ go }: { go: (x: Screen) => void }) {
  const [toggles, setToggles] = useState([true, true, false, false]);
  const [email, setEmail] = useState("");
  useEffect(() => {
    api("/api/me")
      .then((me) => {
        const p = me.notificationPrefs ?? {};
        setEmail(me.email);
        setToggles([
          p.matches !== false,
          p.messages !== false,
          p.likes === true,
          !me.discoverable,
        ]);
      })
      .catch((e) => Alert.alert("Settings", e.message));
  }, []);
  const updateToggle = async (idx: number, value: boolean) => {
    const next = toggles.map((x, j) => (j === idx ? value : x));
    setToggles(next);
    try {
      if (idx === 3)
        await api("/api/me", {
          method: "PATCH",
          body: JSON.stringify({ discoverable: !value }),
        });
      else
        await api("/api/me", {
          method: "PATCH",
          body: JSON.stringify({
            notificationPrefs: {
              matches: next[0],
              messages: next[1],
              likes: next[2],
            },
          }),
        });
    } catch (e) {
      Alert.alert(
        "Settings",
        e instanceof Error ? e.message : "Unable to save",
      );
    }
  };
  const rows = [
    ["ACCOUNT", "Email", email],
    ["", "Change password", "›"],
    ["NOTIFICATIONS", "New matches", "toggle"],
    ["", "Messages", "toggle"],
    ["", "Likes you", "toggle"],
    ["PRIVACY", "Hide me from Discover", "toggle"],
    ["", "Blocked users", "1 ›"],
    ["", "Download my data", "›"],
    ["SUPPORT", "Help centre & FAQ", "›"],
    ["", "Report a problem", "›"],
  ];
  let ti = 0;
  return (
    <ScreenShell>
      <Header title="Settings" back={() => go("myprofile")} />
      {rows.map((r, i) => {
        const idx = r[2] === "toggle" ? ti++ : -1;
        return (
          <View key={i}>
            {r[0] ? <Text style={s.sectionLabel}>{r[0]}</Text> : null}
            <View style={s.settingRow}>
              <Text>{r[1]}</Text>
              {idx >= 0 ? (
                <Switch
                  value={toggles[idx]}
                  trackColor={{ true: C.orange, false: "#E9DEDA" }}
                  onValueChange={(v) => updateToggle(idx, v)}
                />
              ) : (
                <Text style={s.muted}>{r[2]}</Text>
              )}
            </View>
          </View>
        );
      })}
      <Button outline tone="wine" onPress={() => go("login")}>
        ↪ Log Out
      </Button>
    </ScreenShell>
  );
}

