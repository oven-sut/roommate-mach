import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  AlertTriangle,
  Ban,
  Camera,
  Check,
  Mic,
  MoreVertical,
  Send,
  User,
  UserX,
} from "lucide-react-native";
import { Avatar } from "../../components/Avatar";
import { Button, Chevron, Chip, Field, MotionPressable, Txt } from "../../components/ui";
import { CenterModal } from "../../components/Sheet";
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

const REPORT_REASONS = [
  {
    value: "ส่งข้อความก่อกวน / ข่มขู่ (Harassment or Spam)",
    label: { th: "ข้อความก่อกวน / ข่มขู่", en: "Harassment or Spam" },
  },
  {
    value: "พฤติกรรมไม่เหมาะสม (Inappropriate behavior)",
    label: { th: "พฤติกรรมไม่เหมาะสม", en: "Inappropriate behavior" },
  },
  {
    value: "รูปภาพหรือโปรไฟล์ไม่เหมาะสม (Inappropriate Profile)",
    label: { th: "โปรไฟล์ไม่เหมาะสม", en: "Inappropriate profile" },
  },
  {
    value: "บัญชีปลอม / แอบอ้าง (Fake Account)",
    label: { th: "บัญชีปลอม / แอบอ้าง", en: "Fake Account" },
  },
  {
    value: "อื่นๆ (Other)",
    label: { th: "อื่นๆ", en: "Other" },
  },
];

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
  const { t, language } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scroller = useRef<ScrollView>(null);
  const initialScrollDone = useRef(false);
  const sendingRef = useRef(false);
  sendingRef.current = sending;

  const conversationId = appState.activeConversationId;
  const [name, setName] = useState<string>(appState.activeConversationName || "Chat");
  const [photo, setPhoto] = useState<string | undefined>(
    appState.activeConversationPhoto ?? undefined,
  );
  const [otherUserId, setOtherUserId] = useState<string | undefined>(
    appState.activeProfile?.id,
  );
  const [matchScore, setMatchScore] = useState<number | undefined>(
    appState.activeProfile?.score,
  );

  // Moderation state
  const [showMenu, setShowMenu] = useState(false);
  const [activeModal, setActiveModal] = useState<"unmatch" | "block" | "report" | null>(null);
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0].value);
  const [detailsText, setDetailsText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(appState.activeConversationName || "Chat");
    setPhoto(appState.activeConversationPhoto ?? undefined);
    if (appState.activeProfile?.id) {
      setOtherUserId(appState.activeProfile.id);
    }
    if (typeof appState.activeProfile?.score === "number") {
      setMatchScore(appState.activeProfile.score);
    }

    if (conversationId) {
      api<any[]>("/api/conversations")
        .then((data) => {
          const conv = data?.find((c) => c.id === conversationId);
          if (conv?.other?.profile?.photos?.[0]) {
            appState.activeConversationPhoto = conv.other.profile.photos[0];
            setPhoto(conv.other.profile.photos[0]);
          }
          if (conv?.other?.displayName) {
            appState.activeConversationName = conv.other.displayName;
            setName(conv.other.displayName);
          }
          if (conv?.other?.id) {
            setOtherUserId(conv.other.id);
            if (conv?.other?.profile) {
              appState.activeProfile = {
                id: conv.other.id,
                displayName: conv.other.displayName || conv.other.profile.name || "User",
                conversationId: conversationId ?? undefined,
                ...conv.other.profile,
              };
            }
          }
          const sVal = conv?.score ?? conv?.match?.score ?? conv?.other?.score;
          if (typeof sVal === "number") {
            setMatchScore(sVal);
            if (appState.activeProfile) {
              appState.activeProfile.score = sVal;
            }
          }
        })
        .catch(() => undefined);
    }
  }, [conversationId]);

  useEffect(() => {
    if (otherUserId && matchScore === undefined) {
      api<any[]>("/api/matches")
        .then((matches) => {
          const m = matches?.find(
            (item) => item.other?.id === otherUserId || item.otherUserId === otherUserId,
          );
          if (typeof m?.score === "number") {
            setMatchScore(m.score);
            if (appState.activeProfile) {
              appState.activeProfile.score = m.score;
            }
          }
        })
        .catch(() => undefined);
    }
  }, [otherUserId, matchScore]);

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

      if (otherUserId) {
        api<MatchProfile>(`/api/users/${otherUserId}`)
          .then((fullData) => {
            if (typeof fullData?.score === "number") {
              setMatchScore(fullData.score);
              if (appState.activeProfile) {
                appState.activeProfile.score = fullData.score;
                if (fullData.breakdown) {
                  appState.activeProfile.breakdown = fullData.breakdown;
                }
              }
            }
          })
          .catch(() => undefined);
      }
    } catch {
      // A dropped poll is not worth interrupting the thread for.
    }
  }, [conversationId, otherUserId]);

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

  useEffect(() => {
    if (messages.length > 0) {
      const animated = initialScrollDone.current;
      const t = setTimeout(() => {
        scroller.current?.scrollToEnd({ animated });
        initialScrollDone.current = true;
      }, 50);
      return () => clearTimeout(t);
    }
  }, [messages]);

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

  const handleConfirmUnmatch = async () => {
    if (!otherUserId) {
      go("messages");
      return;
    }
    try {
      setBusy(true);
      await api(`/api/matches/user/${otherUserId}`, { method: "DELETE" });
      setActiveModal(null);
      Alert.alert(
        language === "th" ? "ยกเลิกการจับคู่" : "Unmatched",
        language === "th"
          ? "ลบออกจากรายการแมตช์เรียบร้อยแล้ว"
          : "Removed from your matches list",
      );
      go("messages");
    } catch (reason) {
      Alert.alert(
        t("somethingWrong"),
        reason instanceof Error ? reason.message : t("retry"),
      );
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmBlock = async () => {
    if (!otherUserId) {
      go("messages");
      return;
    }
    try {
      setBusy(true);
      if (otherUserId && !appState.blockedList.some((b) => b.id === otherUserId)) {
        appState.blockedList.push({
          id: otherUserId,
          displayName: name,
          profile: photo ? { photos: [photo] } : undefined,
        });
      }
      await api(`/api/blocks/${otherUserId}`, { method: "POST" }).catch(() => undefined);
      setActiveModal(null);
      Alert.alert(
        language === "th" ? "บล็อกผู้ใช้เรียบร้อย" : "User Blocked",
        language === "th"
          ? "ระบบจะไม่แสดงโปรไฟล์และข้อความของกันและกันอีก"
          : "User has been blocked",
      );
      go("messages");
    } catch (reason) {
      Alert.alert(
        t("somethingWrong"),
        reason instanceof Error ? reason.message : t("retry"),
      );
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmReport = async () => {
    if (!otherUserId) {
      go("messages");
      return;
    }
    try {
      setBusy(true);
      await api(`/api/reports/${otherUserId}`, {
        method: "POST",
        body: JSON.stringify({
          reason: selectedReason,
          details: detailsText.trim() || `รายงานผู้ใช้ ${name} จากห้องแชท`,
        }),
      });
      setActiveModal(null);
      Alert.alert(
        language === "th" ? "ส่งรายงานเรียบร้อย" : "Report Submitted",
        language === "th"
          ? "ทีมผู้ดูแลจะทำการตรวจสอบเรื่องที่คุณรายงานโดยเร็วที่สุด"
          : "The admin team will review your report shortly.",
      );
    } catch (reason) {
      Alert.alert(
        t("somethingWrong"),
        reason instanceof Error ? reason.message : t("retry"),
      );
    } finally {
      setBusy(false);
    }
  };

  const displayScore = matchScore ?? appState.activeProfile?.score;

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
          <View style={[s.rowBetween, { height: 68, gap: 10 }]}>
            <MotionPressable
              onPress={() => go("messages")}
              pressedScale={0.9}
              hitSlop={10}
              accessibilityLabel="Back"
            >
              <Chevron direction="left" size={12} color={C.ink} weight={2.4} />
            </MotionPressable>

            <Avatar name={name} uri={photo} size={48} />

            <View style={{ flex: 1, gap: 2 }}>
              <Txt role="h3" style={{ fontSize: 16 }} numberOfLines={1}>
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

            <View style={[s.row, { gap: 6 }]}>
              {typeof displayScore === "number" ? (
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: C.green,
                    backgroundColor: C.greenSoft,
                  }}
                >
                  <Txt
                    style={{ fontFamily: F.bold, fontSize: 13, color: C.green }}
                  >
                    {Math.round(displayScore)}%
                  </Txt>
                </View>
              ) : null}

              {/* Chat Options / Moderation Menu */}
              <MotionPressable
                onPress={() => setShowMenu(true)}
                pressedScale={0.88}
                hitSlop={10}
                style={s.iconBtn}
                accessibilityLabel="Options"
              >
                <MoreVertical size={20} color={C.ink} strokeWidth={2} />
              </MotionPressable>
            </View>
          </View>
        </View>

        <View style={s.divider} />

        <ScrollView
          ref={scroller}
          onContentSizeChange={() =>
            scroller.current?.scrollToEnd({ animated: initialScrollDone.current })
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

        {/* Header Action Menu */}
        <CenterModal visible={showMenu} onClose={() => setShowMenu(false)}>
          <Txt role="h2" style={{ textAlign: "center", marginBottom: 4 }}>
            {language === "th" ? "จัดการการสนทนา" : "Chat Options"}
          </Txt>

          <MotionPressable
            onPress={() => {
              setShowMenu(false);
              go("profile");
            }}
            pressedScale={0.98}
            style={[s.row, { gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderColor: C.line }]}
          >
            <User size={20} color={C.primary} strokeWidth={1.8} />
            <Txt role="body" style={{ flex: 1, fontFamily: F.semibold }}>
              {language === "th" ? "ดูโปรไฟล์" : "View Profile"}
            </Txt>
            <Chevron direction="right" size={8} />
          </MotionPressable>

          <MotionPressable
            onPress={() => {
              setShowMenu(false);
              setActiveModal("report");
            }}
            pressedScale={0.98}
            style={[s.row, { gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderColor: C.line }]}
          >
            <AlertTriangle size={20} color={C.primary} strokeWidth={1.8} />
            <Txt role="body" style={{ flex: 1, fontFamily: F.semibold }}>
              {language === "th" ? "รายงานพฤติกรรมไม่เหมาะสม" : "Report Behavior"}
            </Txt>
            <Chevron direction="right" size={8} />
          </MotionPressable>

          <MotionPressable
            onPress={() => {
              setShowMenu(false);
              setActiveModal("unmatch");
            }}
            pressedScale={0.98}
            style={[s.row, { gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderColor: C.line }]}
          >
            <UserX size={20} color={C.primary} strokeWidth={1.8} />
            <Txt role="body" style={{ flex: 1, fontFamily: F.semibold }}>
              {language === "th" ? "ยกเลิกการจับคู่" : "Unmatch"}
            </Txt>
            <Chevron direction="right" size={8} />
          </MotionPressable>

          <MotionPressable
            onPress={() => {
              setShowMenu(false);
              setActiveModal("block");
            }}
            pressedScale={0.98}
            style={[s.row, { gap: 12, paddingVertical: 12 }]}
          >
            <Ban size={20} color={C.primary} strokeWidth={1.8} />
            <Txt role="body" style={{ flex: 1, fontFamily: F.semibold, color: C.primary }}>
              {language === "th" ? "บล็อกผู้ใช้" : "Block User"}
            </Txt>
            <Chevron direction="right" size={8} />
          </MotionPressable>

          <Button
            tone="outline"
            style={{ height: 44, marginTop: 8 }}
            onPress={() => setShowMenu(false)}
          >
            {language === "th" ? "ปิด" : "Close"}
          </Button>
        </CenterModal>

        {/* Unmatch Confirmation Modal */}
        <CenterModal visible={activeModal === "unmatch"} onClose={() => !busy && setActiveModal(null)}>
          <Txt role="h2" style={{ textAlign: "center" }}>
            {language === "th" ? "ยกเลิกการจับคู่?" : "Unmatch User?"}
          </Txt>
          <Txt role="body" style={{ color: C.muted, textAlign: "center" }}>
            {language === "th"
              ? `คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจับคู่กับ ${name}?`
              : `Are you sure you want to unmatch with ${name}?`}
          </Txt>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
            <Button
              tone="outline"
              style={{ flex: 1, height: 46 }}
              onPress={() => setActiveModal(null)}
              disabled={busy}
            >
              {language === "th" ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button
              tone="wine"
              style={{ flex: 1, height: 46 }}
              onPress={handleConfirmUnmatch}
              loading={busy}
            >
              {language === "th" ? "ยืนยันยกเลิก" : "Unmatch"}
            </Button>
          </View>
        </CenterModal>

        {/* Block Confirmation Modal */}
        <CenterModal visible={activeModal === "block"} onClose={() => !busy && setActiveModal(null)}>
          <Txt role="h2" style={{ textAlign: "center" }}>
            {language === "th" ? "บล็อกผู้ใช้?" : "Block User?"}
          </Txt>
          <Txt role="body" style={{ color: C.muted, textAlign: "center" }}>
            {language === "th"
              ? `คุณแน่ใจหรือไม่ว่าต้องการบล็อก ${name}? ระบบจะซ่อนโปรไฟล์และซ่อนการสนทนา`
              : `Are you sure you want to block ${name}?`}
          </Txt>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
            <Button
              tone="outline"
              style={{ flex: 1, height: 46 }}
              onPress={() => setActiveModal(null)}
              disabled={busy}
            >
              {language === "th" ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button
              tone="wine"
              style={{ flex: 1, height: 46 }}
              onPress={handleConfirmBlock}
              loading={busy}
            >
              {language === "th" ? "ยืนยันบล็อก" : "Block"}
            </Button>
          </View>
        </CenterModal>

        {/* Report Details Modal */}
        <CenterModal visible={activeModal === "report"} onClose={() => !busy && setActiveModal(null)}>
          <Txt role="h2" style={{ textAlign: "center" }}>
            {language === "th" ? "รายงานพฤติกรรมไม่เหมาะสม" : "Report Behavior"}
          </Txt>
          <Txt role="small" style={{ color: C.muted, textAlign: "center", marginBottom: 4 }}>
            {language === "th"
              ? `โปรดเลือกเหตุผลและระบุรายละเอียดเพื่อรายงาน ${name}`
              : `Please select a reason and describe the issue regarding ${name}`}
          </Txt>

          <Txt role="label" style={{ marginTop: 6 }}>
            {language === "th" ? "เหตุผลการรายงาน" : "Reason"}
          </Txt>
          <View style={{ flexWrap: "wrap", flexDirection: "row", gap: 6, marginVertical: 4 }}>
            {REPORT_REASONS.map((r) => (
              <Chip
                key={r.value}
                active={selectedReason === r.value}
                onPress={() => setSelectedReason(r.value)}
                size="sm"
              >
                {r.label[language]}
              </Chip>
            ))}
          </View>

          <Field
            label={language === "th" ? "รายละเอียดเพิ่มเติม" : "Additional details"}
            placeholder={language === "th" ? "พิมพ์อธิบายสิ่งที่เกิดขึ้นเพิ่มเติม..." : "Explain what happened..."}
            value={detailsText}
            onChangeText={setDetailsText}
            multiline
            style={{ marginTop: 6 }}
          />

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <Button
              tone="outline"
              style={{ flex: 1, height: 46 }}
              onPress={() => setActiveModal(null)}
              disabled={busy}
            >
              {language === "th" ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button
              tone="wine"
              style={{ flex: 1, height: 46 }}
              onPress={handleConfirmReport}
              loading={busy}
            >
              {language === "th" ? "ส่งรายงาน" : "Submit"}
            </Button>
          </View>
        </CenterModal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
