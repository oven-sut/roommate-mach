import { useState } from "react";
import { Alert, View } from "react-native";
import { AlertTriangle, Ban, UserX } from "lucide-react-native";
import { useI18n } from "../../i18n";
import { api, appState } from "../../services/api";
import { Button, Chevron, Chip, Field, MotionPressable, ScreenShell, Txt } from "../../components/ui";
import { CenterModal } from "../../components/Sheet";
import { C } from "../../theme/colors";
import { s } from "../../theme/styles";
import type { Screen } from "../../types/navigation";

type ModerationAction = "unmatch" | "block" | "report";

const ACTIONS = [
  {
    kind: "unmatch" as const,
    Icon: UserX,
    title: { th: "ยกเลิกการจับคู่", en: "Unmatch" },
    sub: {
      th: "ลบออกจากรายการแมตช์ของคุณ",
      en: "Remove from your matches list",
    },
  },
  {
    kind: "block" as const,
    Icon: Ban,
    title: { th: "บล็อกผู้ใช้", en: "Block user" },
    sub: {
      th: "ซ่อนโปรไฟล์และไม่ให้ติดต่อกันอีก",
      en: "Prevent any future interaction",
    },
  },
  {
    kind: "report" as const,
    Icon: AlertTriangle,
    title: { th: "รายงานพฤติกรรมไม่เหมาะสม", en: "Report inappropriate behaviour" },
    sub: {
      th: "ส่งเรื่องให้ทีมผู้ดูแลตรวจสอบ",
      en: "Send a report to the admin team",
    },
  },
];

const REPORT_REASONS = [
  {
    value: "พฤติกรรมไม่เหมาะสม (Inappropriate behavior)",
    label: { th: "พฤติกรรมไม่เหมาะสม", en: "Inappropriate behavior" },
  },
  {
    value: "ส่งข้อความก่อกวน / ข่มขู่ (Harassment or Spam)",
    label: { th: "ข้อความก่อกวน / ข่มขู่", en: "Harassment or Spam" },
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

/** Moderation actions for the profile currently being viewed. */
export function Report({ go }: { go: (x: Screen) => void }) {
  const { t, language } = useI18n();
  const [busy, setBusy] = useState(false);
  const [activeModal, setActiveModal] = useState<ModerationAction | null>(null);

  // Form state for report
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0].value);
  const [detailsText, setDetailsText] = useState("");

  const target = appState.activeProfile;
  const targetName = target?.displayName || (language === "th" ? "ผู้ใช้นี้" : "this user");

  const openActionModal = (kind: ModerationAction) => {
    setActiveModal(kind);
  };

  const closeModal = () => {
    if (busy) return;
    setActiveModal(null);
  };

  const handleConfirmUnmatch = async () => {
    const targetId = target?.id;
    if (!targetId) {
      go(appState.activeProfile ? "matches" : "settings");
      return;
    }

    try {
      setBusy(true);
      await api(`/api/matches/user/${targetId}`, { method: "DELETE" }).catch(() => undefined);
      setActiveModal(null);
      Alert.alert(
        language === "th" ? "ยกเลิกการจับคู่" : "Unmatched",
        language === "th"
          ? "ลบออกจากรายการแมตช์เรียบร้อยแล้ว"
          : "Removed from your matches list",
      );
      go(appState.activeProfile ? "matches" : "settings");
    } catch {
      setActiveModal(null);
      go(appState.activeProfile ? "matches" : "settings");
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmBlock = async () => {
    const targetId = target?.id;
    if (!targetId) {
      go(appState.activeProfile ? "matches" : "settings");
      return;
    }

    try {
      setBusy(true);
      await api(`/api/blocks/${targetId}`, { method: "POST" }).catch(() => undefined);
      setActiveModal(null);
      Alert.alert(
        language === "th" ? "บล็อกผู้ใช้เรียบร้อย" : "User Blocked",
        language === "th"
          ? "ระบบจะไม่แสดงโปรไฟล์ของกันและกันอีก"
          : "User has been blocked",
      );
      go(appState.activeProfile ? "matches" : "settings");
    } catch {
      setActiveModal(null);
      go(appState.activeProfile ? "matches" : "settings");
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmReport = async () => {
    const targetId = target?.id;

    const newReport = {
      id: `report-${Date.now()}`,
      reporter: {
        id: appState.currentUserId || "user-current",
        displayName: appState.profileDraft.displayName || "ผู้ใช้คนนี้",
        email: appState.currentUserId
          ? `${appState.currentUserId}@g.sut.ac.th`
          : "user@g.sut.ac.th",
      },
      reported: {
        id: targetId || "unknown",
        displayName: targetName,
        email: targetId ? `${targetId}@g.sut.ac.th` : "user@g.sut.ac.th",
        suspended: false,
      },
      reason: selectedReason,
      details: detailsText.trim() || `รายงานโปรไฟล์ ${targetName}`,
      status: "PENDING" as const,
      createdAt: new Date().toISOString(),
    };
    appState.reportsList.unshift(newReport);

    if (!targetId) {
      setActiveModal(null);
      Alert.alert(
        language === "th" ? "ส่งรายงานเรียบร้อย" : "Report Submitted",
        language === "th"
          ? "ทีมผู้ดูแลจะทำการตรวจสอบเรื่องที่คุณรายงานโดยเร็วที่สุด"
          : "The admin team will review your report shortly.",
      );
      go("settings");
      return;
    }

    try {
      setBusy(true);
      await api(`/api/reports/${targetId}`, {
        method: "POST",
        body: JSON.stringify({
          reason: selectedReason,
          details: detailsText.trim() || `รายงานโปรไฟล์ ${targetName}`,
        }),
      }).catch(() => undefined);
      setActiveModal(null);
      Alert.alert(
        language === "th" ? "ส่งรายงานเรียบร้อย" : "Report Submitted",
        language === "th"
          ? "ทีมผู้ดูแลจะทำการตรวจสอบเรื่องที่คุณรายงานโดยเร็วที่สุด"
          : "The admin team will review your report shortly.",
      );
      go(appState.activeProfile ? "matches" : "settings");
    } catch {
      setActiveModal(null);
      go(appState.activeProfile ? "matches" : "settings");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenShell>
      <View style={[s.row, { gap: 16, height: 60 }]}>
        <MotionPressable
          onPress={() => go(appState.activeProfile ? "profile" : "settings")}
          pressedScale={0.9}
          style={s.iconBtn}
          accessibilityLabel="Back"
        >
          <Chevron direction="left" />
        </MotionPressable>
        <Txt role="h1">{t("report")}</Txt>
      </View>

      {target?.displayName ? (
        <Txt role="subtitle">{target.displayName}</Txt>
      ) : null}

      {ACTIONS.map(({ kind, Icon, title, sub }) => (
        <MotionPressable
          key={kind}
          disabled={busy}
          onPress={() => openActionModal(kind)}
          pressedScale={0.99}
          style={[s.card, s.row, { gap: 14 }]}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: C.pink,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={20} color={C.primary} strokeWidth={1.9} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Txt role="h3" style={{ fontSize: 15 }}>
              {title[language]}
            </Txt>
            <Txt role="small">{sub[language]}</Txt>
          </View>
          <Chevron direction="right" size={8} />
        </MotionPressable>
      ))}

      {/* Unmatch Confirmation Modal */}
      <CenterModal visible={activeModal === "unmatch"} onClose={closeModal}>
        <Txt role="h2" style={{ textAlign: "center" }}>
          {language === "th" ? "ยกเลิกการจับคู่?" : "Unmatch User?"}
        </Txt>
        <Txt role="body" style={{ color: C.muted, textAlign: "center" }}>
          {language === "th"
            ? `คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจับคู่กับ ${targetName}? การดำเนินการนี้จะลบผู้ใช้นี้ออกจากรายการแมตช์ของคุณ`
            : `Are you sure you want to unmatch with ${targetName}? This will remove them from your matches.`}
        </Txt>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
          <Button
            tone="outline"
            style={{ flex: 1, height: 46 }}
            onPress={closeModal}
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
      <CenterModal visible={activeModal === "block"} onClose={closeModal}>
        <Txt role="h2" style={{ textAlign: "center" }}>
          {language === "th" ? "บล็อกผู้ใช้?" : "Block User?"}
        </Txt>
        <Txt role="body" style={{ color: C.muted, textAlign: "center" }}>
          {language === "th"
            ? `คุณแน่ใจหรือไม่ว่าต้องการบล็อก ${targetName}? ระบบจะซ่อนโปรไฟล์และไม่อนุญาตให้ติดต่อกันอีก`
            : `Are you sure you want to block ${targetName}? You will no longer see each other's profile or messages.`}
        </Txt>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
          <Button
            tone="outline"
            style={{ flex: 1, height: 46 }}
            onPress={closeModal}
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
      <CenterModal visible={activeModal === "report"} onClose={closeModal}>
        <Txt role="h2" style={{ textAlign: "center" }}>
          {language === "th" ? "รายงานพฤติกรรมไม่เหมาะสม" : "Report Behavior"}
        </Txt>
        <Txt role="small" style={{ color: C.muted, textAlign: "center", marginBottom: 4 }}>
          {language === "th"
            ? `โปรดเลือกเหตุผลและระบุรายละเอียดเพื่อรายงาน ${targetName}`
            : `Please select a reason and describe the issue regarding ${targetName}`}
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
            onPress={closeModal}
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
    </ScreenShell>
  );
}
