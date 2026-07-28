import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Ban,
  Bell,
  ChevronRight,
  Eye,
  Globe,
  KeyRound,
  LogOut,
  Mail,
  MessageSquare,
  Search,
  Send,
  User,
} from "lucide-react-native";
import { Card, Header, ScreenShell } from "../components/ui";
import { LanguageToggle, useI18n } from "../i18n";
import { api, appState } from "../services/api";
import { C } from "../theme/colors";
import { s } from "../theme/styles";
import type { Screen } from "../types/navigation";

import { BottomNav } from "./discovery";

const serifFont = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "serif",
});

export function Messages({ go }: { go: (x: Screen) => void }) {
  const { t } = useI18n();
  const [conversations, setConversations] = useState<any[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api("/api/conversations")
      .then(setConversations)
      .catch((e) => Alert.alert("Messages", e.message));
  }, []);

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

export function Settings({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();
  const [toggles, setToggles] = useState([true, true, false, false]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    api("/api/me")
      .then((me) => {
        const p = me.notificationPrefs ?? {};
        setEmail(me.email || "");
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

  const handleLogout = () => {
    Alert.alert(
      language === "th" ? "ออกจากระบบ" : "Log Out",
      language === "th" ? "คุณต้องการออกจากระบบใช่หรือไม่?" : "Are you sure you want to log out?",
      [
        { text: language === "th" ? "ยกเลิก" : "Cancel", style: "cancel" },
        {
          text: language === "th" ? "ออกจากระบบ" : "Log Out",
          style: "destructive",
          onPress: () => go("login"),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={settingStyles.safeArea}>
      <ScrollView contentContainerStyle={settingStyles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={settingStyles.headerRow}>
          <Pressable style={settingStyles.backButton} onPress={() => go("myprofile")}>
            <ArrowLeft size={18} color="#463826" strokeWidth={2.2} />
          </Pressable>
          <Text style={settingStyles.headerTitle}>
            {language === "th" ? "การตั้งค่า" : "Settings"}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Language Selector */}
        <View style={settingStyles.sectionCard}>
          <View style={[settingStyles.rowBetween, { borderBottomWidth: 0 }]}>
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <Globe size={16} color="#463826" />
                <Text style={settingStyles.rowTitle}>
                  {language === "th" ? "สลับภาษาแอป" : "App Language"}
                </Text>
              </View>
              <Text style={settingStyles.rowSub}>
                {language === "th" ? "ภาษาไทย (TH) / English (EN)" : "Thai (TH) / English (EN)"}
              </Text>
            </View>
            <LanguageToggle />
          </View>
        </View>

        {/* Account Info */}
        <View style={settingStyles.sectionCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <User size={16} color="#463826" />
            <Text style={settingStyles.sectionTitle}>
              {language === "th" ? "ข้อมูลบัญชีผู้ใช้" : "Account Information"}
            </Text>
          </View>

          <View style={settingStyles.rowBetween}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Mail size={15} color="#8D7C75" />
              <Text style={settingStyles.rowTitle}>{language === "th" ? "อีเมลประจำตัว" : "Registered Email"}</Text>
            </View>
            <Text style={settingStyles.rowSub}>{email || "student@sut.ac.th"}</Text>
          </View>

          <Pressable style={[settingStyles.rowBetween, { borderBottomWidth: 0 }]} onPress={() => Alert.alert("Password", "Feature enabled in next update")}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <KeyRound size={15} color="#8D7C75" />
              <Text style={settingStyles.rowTitle}>{language === "th" ? "เปลี่ยนรหัสผ่าน" : "Change Password"}</Text>
            </View>
            <ChevronRight size={16} color="#8D7C75" />
          </Pressable>
        </View>

        {/* Notification Preferences */}
        <View style={settingStyles.sectionCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Bell size={16} color="#463826" />
            <Text style={settingStyles.sectionTitle}>
              {language === "th" ? "การตั้งค่าการแจ้งเตือน" : "Notification Preferences"}
            </Text>
          </View>

          <View style={settingStyles.rowBetween}>
            <Text style={settingStyles.rowTitle}>{language === "th" ? "คู่แมตช์ใหม่" : "New Matches"}</Text>
            <Switch
              value={toggles[0]}
              trackColor={{ true: "#C64338", false: "#EADCD3" }}
              onValueChange={(v) => updateToggle(0, v)}
            />
          </View>

          <View style={settingStyles.rowBetween}>
            <Text style={settingStyles.rowTitle}>{language === "th" ? "ข้อความแชทใหม่" : "New Messages"}</Text>
            <Switch
              value={toggles[1]}
              trackColor={{ true: "#C64338", false: "#EADCD3" }}
              onValueChange={(v) => updateToggle(1, v)}
            />
          </View>

          <View style={[settingStyles.rowBetween, { borderBottomWidth: 0 }]}>
            <Text style={settingStyles.rowTitle}>{language === "th" ? "คนที่ถูกใจโปรไฟล์คุณ" : "Likes You"}</Text>
            <Switch
              value={toggles[2]}
              trackColor={{ true: "#C64338", false: "#EADCD3" }}
              onValueChange={(v) => updateToggle(2, v)}
            />
          </View>
        </View>

        {/* Privacy */}
        <View style={settingStyles.sectionCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Eye size={16} color="#463826" />
            <Text style={settingStyles.sectionTitle}>
              {language === "th" ? "ความเป็นส่วนตัว" : "Privacy & Visibility"}
            </Text>
          </View>

          <View style={settingStyles.rowBetween}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={settingStyles.rowTitle}>
                {language === "th" ? "ซ่อนโปรไฟล์จากการค้นหา" : "Hide Profile from Discovery"}
              </Text>
              <Text style={settingStyles.rowSub}>
                {language === "th" ? "จะไม่แสดงโปรไฟล์ให้รูมเมทคนอื่นเห็น" : "Your card won't appear to others"}
              </Text>
            </View>
            <Switch
              value={toggles[3]}
              trackColor={{ true: "#C64338", false: "#EADCD3" }}
              onValueChange={(v) => updateToggle(3, v)}
            />
          </View>

          <Pressable style={[settingStyles.rowBetween, { borderBottomWidth: 0 }]} onPress={() => go("requests")}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ban size={15} color="#8D7C75" />
              <Text style={settingStyles.rowTitle}>{language === "th" ? "ผู้ใช้ที่บล็อก" : "Blocked Users"}</Text>
            </View>
            <ChevronRight size={16} color="#8D7C75" />
          </Pressable>
        </View>

        {/* Logout Button */}
        <Pressable style={settingStyles.logoutBtn} onPress={handleLogout}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <LogOut size={18} color="#FFFFFF" />
            <Text style={settingStyles.logoutBtnText}>
              {language === "th" ? "ออกจากระบบ" : "Log Out"}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const settingStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FEFCFA",
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FAF6F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  backChevron: {
    fontSize: 18,
    color: "#463826",
    fontWeight: "bold",
  },
  headerTitle: {
    fontFamily: serifFont,
    fontSize: 22,
    fontWeight: "bold",
    color: "#463826",
  },
  sectionCard: {
    backgroundColor: "#FAF6F0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  sectionTitle: {
    fontFamily: serifFont,
    fontSize: 15,
    fontWeight: "bold",
    color: "#463826",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE8E1",
  },
  rowTitle: {
    fontFamily: serifFont,
    fontSize: 14,
    fontWeight: "600",
    color: "#463826",
  },
  rowSub: {
    fontFamily: serifFont,
    fontSize: 12,
    color: "#8D7C75",
    marginTop: 2,
  },
  logoutBtn: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#C64338",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    shadowColor: "#C64338",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  logoutBtnText: {
    fontFamily: serifFont,
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});
