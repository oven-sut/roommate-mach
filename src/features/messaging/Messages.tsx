import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";
import { Avatar } from "../../components/Avatar";
import { BottomNav } from "../../components/BottomNav";
import { LogoTile, MotionPressable, Txt } from "../../components/ui";
import { useI18n } from "../../i18n";
import { api, appState } from "../../services/api";
import { C } from "../../theme/colors";
import { GUTTER, MAX_WIDTH, NAV_HEIGHT, s, shadow } from "../../theme/styles";
import { F } from "../../theme/typography";
import type { Screen } from "../../types/navigation";
import { relativeTime } from "../discovery/discovery.content";

type Row = {
  id: string;
  updatedAt?: string;
  unread?: number;
  other?: { id?: string; displayName?: string; profile?: { photos?: string[] } };
  messages?: { text?: string; senderId?: string }[];
};

/** Conversation inbox. */
export function Messages({ go }: { go: (x: Screen) => void }) {
  const { t } = useI18n();
  const [conversations, setConversations] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Row[]>("/api/conversations")
      .then((data) => setConversations(data ?? []))
      .catch(() => setConversations([]))
      .finally(() => setLoading(false));
  }, []);

  const open = (row: Row) => {
    appState.activeConversationId = row.id;
    appState.activeConversationName = row.other?.displayName ?? "Chat";
    go("chat");
  };

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? conversations.filter((c) =>
        c.other?.displayName?.toLowerCase().includes(needle),
      )
    : conversations;

  return (
    <>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View
          style={{
            flex: 1,
            width: "100%",
            maxWidth: MAX_WIDTH,
            alignSelf: "center",
            paddingHorizontal: GUTTER,
          }}
        >
          <View style={[s.row, { gap: 14, height: 60 }]}>
            <LogoTile />
            <Txt role="h1">{t("messageTab")}</Txt>
          </View>

          <View style={[s.input, s.row, { gap: 10, marginBottom: 16 }]}>
            <Search size={18} color={C.faint} strokeWidth={1.8} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("searchConversations")}
              placeholderTextColor={C.faint}
              style={{
                flex: 1,
                fontFamily: F.regular,
                fontSize: 15,
                color: C.ink,
                padding: 0,
              }}
            />
          </View>

          {loading ? (
            <View style={[s.flex, s.center]}>
              <ActivityIndicator color={C.primary} size="large" />
            </View>
          ) : visible.length === 0 ? (
            <View style={[s.flex, s.center, { gap: 8 }]}>
              <Txt role="h3">{t("noConversations")}</Txt>
              <Txt role="small">{t("sayHi")}</Txt>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingBottom: NAV_HEIGHT + 30 }}
            >
              {visible.map((row) => {
                const unread = row.unread ?? 0;
                const last = row.messages?.[0];
                const mine = last?.senderId === appState.currentUserId;
                const preview = last?.text
                  ? `${mine ? "You : " : ""}${last.text}`
                  : t("sayHi");

                return (
                  <MotionPressable
                    key={row.id}
                    onPress={() => open(row)}
                    pressedScale={0.99}
                    style={[
                      s.card,
                      s.row,
                      {
                        gap: 14,
                        paddingVertical: 16,
                        // Unread threads get a crimson spine on the left edge.
                        borderLeftWidth: unread > 0 ? 5 : 1,
                        borderLeftColor: unread > 0 ? C.primary : C.line,
                      },
                      shadow(1),
                    ]}
                  >
                    <Avatar
                      name={row.other?.displayName}
                      uri={row.other?.profile?.photos?.[0]}
                      size={54}
                    />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Txt role="h3" style={{ fontSize: 17 }}>
                        {row.other?.displayName ?? "—"}
                      </Txt>
                      <Txt role="small" numberOfLines={1}>
                        {preview}
                      </Txt>
                    </View>

                    {unread > 0 ? (
                      <View
                        style={{
                          minWidth: 30,
                          height: 30,
                          paddingHorizontal: 8,
                          borderRadius: 15,
                          backgroundColor: C.primary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Txt
                          style={{
                            fontFamily: F.bold,
                            fontSize: 13,
                            color: C.white,
                          }}
                        >
                          {unread}
                        </Txt>
                      </View>
                    ) : (
                      <Txt role="small">{relativeTime(row.updatedAt)}</Txt>
                    )}
                  </MotionPressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>

      <BottomNav active="messages" go={go} />
    </>
  );
}
