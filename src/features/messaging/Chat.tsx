import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Camera, Check, Mic, Send } from "lucide-react-native";
import { Avatar } from "../../components/Avatar";
import { Chevron, MotionPressable, Txt } from "../../components/ui";
import { useI18n } from "../../i18n";
import { api, appState } from "../../services/api";
import { C, G } from "../../theme/colors";
import { GUTTER, MAX_WIDTH, s, shadow } from "../../theme/styles";
import { F } from "../../theme/typography";
import type { Message } from "../../types/models";
import type { Screen } from "../../types/navigation";

/**
 * How often the thread is re-fetched. There is no realtime transport yet, so
 * new messages arrive on this interval; polling stops while a send is in
 * flight to avoid the optimistic message flickering.
 */
const POLL_INTERVAL_MS = 4000;

function clockTime(iso?: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** One message bubble; outgoing messages are amber and right-aligned. */
function Bubble({ message, mine }: { message: Message; mine: boolean }) {
  const body = message.text ?? message.body ?? "";
  return (
    <View
      style={[
        {
          alignSelf: mine ? "flex-end" : "flex-start",
          maxWidth: "78%",
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: mine ? C.amber : C.card,
          gap: 4,
        },
        shadow(1),
      ]}
    >
      <Txt
        style={{
          fontFamily: F.semibold,
          fontSize: 15,
          color: mine ? C.white : C.ink,
        }}
      >
        {body}
      </Txt>
      <View style={[s.row, { gap: 4, alignSelf: "flex-end" }]}>
        <Txt
          style={{
            fontFamily: F.regular,
            fontSize: 10,
            color: mine ? "rgba(255,255,255,.85)" : C.faint,
          }}
        >
          {clockTime(message.createdAt)}
        </Txt>
        {mine ? (
          <Check
            size={12}
            color={message.readAt ? C.white : "rgba(255,255,255,.6)"}
            strokeWidth={3}
          />
        ) : null}
      </View>
    </View>
  );
}

/** A single conversation thread. */
export function Chat({ go }: { go: (x: Screen) => void }) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scroller = useRef<ScrollView>(null);
  const sendingRef = useRef(false);
  sendingRef.current = sending;

  const conversationId = appState.activeConversationId;
  const name = appState.activeConversationName;

  const load = useCallback(async () => {
    if (!conversationId || sendingRef.current) return;
    try {
      const data = await api<Message[]>(
        `/api/conversations/${conversationId}/messages`,
      );
      setMessages(data ?? []);

      // Looking at the thread is what "read" means; clearing the badge here
      // keeps the inbox count honest and gives the sender their read tick.
      const hasUnread = (data ?? []).some(
        (message) => message.senderId !== appState.currentUserId && !message.readAt,
      );
      if (hasUnread) {
        await api(`/api/conversations/${conversationId}/read`, {
          method: "PATCH",
        }).catch(() => undefined);
      }
    } catch {
      // A dropped poll is not worth interrupting the thread for.
    }
  }, [conversationId]);

  useEffect(() => {
    load();
    let timer = setInterval(load, POLL_INTERVAL_MS);

    // Polling a thread nobody is looking at wastes the phone's battery and the
    // server's time, so it stops while the app is backgrounded.
    const subscription = AppState.addEventListener("change", (state) => {
      clearInterval(timer);
      if (state === "active") {
        load();
        timer = setInterval(load, POLL_INTERVAL_MS);
      }
    });

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [load]);

  const send = async () => {
    const body = text.trim();
    if (!conversationId || !body) return;
    setText("");
    try {
      setSending(true);
      const message = await api<Message>(
        `/api/conversations/${conversationId}/messages`,
        { method: "POST", body: JSON.stringify({ text: body }) },
      );
      setMessages((items) => [...items, message]);
    } catch {
      setText(body);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.flex}
      >
        <View
          style={{
            width: "100%",
            maxWidth: MAX_WIDTH,
            alignSelf: "center",
            paddingHorizontal: GUTTER,
          }}
        >
          <View style={[s.rowBetween, { height: 68, gap: 12 }]}>
            <MotionPressable
              onPress={() => go("messages")}
              pressedScale={0.9}
              hitSlop={10}
              accessibilityLabel="Back"
            >
              <Chevron direction="left" size={12} color={C.ink} weight={2.4} />
            </MotionPressable>

            <Avatar name={name} size={52} />

            <View style={{ flex: 1, gap: 2 }}>
              <Txt role="h3" style={{ fontSize: 17 }}>
                {name}
              </Txt>
              <View style={[s.row, { gap: 6 }]}>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: C.green,
                  }}
                />
                <Txt style={{ fontFamily: F.regular, fontSize: 12, color: C.green }}>
                  {t("online")}
                </Txt>
              </View>
            </View>

            {typeof appState.activeProfile?.score === "number" ? (
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: C.green,
                  backgroundColor: C.greenSoft,
                }}
              >
                <Txt
                  style={{ fontFamily: F.bold, fontSize: 13, color: C.green }}
                >
                  {Math.round(appState.activeProfile.score)}%
                </Txt>
              </View>
            ) : null}
          </View>
        </View>

        <View style={s.divider} />

        <ScrollView
          ref={scroller}
          onContentSizeChange={() =>
            scroller.current?.scrollToEnd({ animated: true })
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            width: "100%",
            maxWidth: MAX_WIDTH,
            alignSelf: "center",
            paddingHorizontal: GUTTER,
            paddingVertical: 20,
            gap: 14,
          }}
        >
          <Txt role="tiny" style={{ textAlign: "center" }}>
            {messages.length === 0 ? t("sayHi") : ""}
          </Txt>
          {messages.map((message) => (
            <Bubble
              key={message.id}
              message={message}
              mine={message.senderId === appState.currentUserId}
            />
          ))}
        </ScrollView>

        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: C.card }}>
          <View
            style={{
              width: "100%",
              maxWidth: MAX_WIDTH,
              alignSelf: "center",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingHorizontal: GUTTER,
              paddingVertical: 12,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: C.line,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Camera size={19} color={C.muted} strokeWidth={1.8} />
            </View>

            <TextInput
              value={text}
              onChangeText={setText}
              onSubmitEditing={send}
              placeholder={t("messagePlaceholder")}
              placeholderTextColor={C.faint}
              style={{
                flex: 1,
                height: 46,
                borderRadius: 23,
                borderWidth: 1,
                borderColor: C.line,
                paddingHorizontal: 18,
                fontFamily: F.regular,
                fontSize: 15,
                color: C.ink,
              }}
            />

            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: C.line,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Mic size={19} color={C.muted} strokeWidth={1.8} />
            </View>

            <MotionPressable
              onPress={send}
              disabled={!text.trim() || sending}
              pressedScale={0.88}
              accessibilityLabel="Send"
              style={[{ borderRadius: 24 }, shadow(2)]}
            >
              <LinearGradient
                colors={[...G.amber]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Send size={20} color={C.white} strokeWidth={2} />
              </LinearGradient>
            </MotionPressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
