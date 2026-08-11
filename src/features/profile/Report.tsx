import { useState } from "react";
import { Alert, View } from "react-native";
import { AlertTriangle, Ban, UserX } from "lucide-react-native";
import { useI18n } from "../../i18n";
import { api, appState } from "../../services/api";
import { Chevron, MotionPressable, ScreenShell, Txt } from "../../components/ui";
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

/** Moderation actions for the profile currently being viewed. */
export function Report({ go }: { go: (x: Screen) => void }) {
  const { t, language } = useI18n();
  const [busy, setBusy] = useState(false);
  const target = appState.activeProfile;

  const act = async (kind: ModerationAction) => {
    const targetId = target?.id;
    if (!targetId) {
      go("matches");
      return;
    }

    try {
      setBusy(true);
      if (kind === "unmatch") {
        await api(`/api/matches/user/${targetId}`, { method: "DELETE" });
      }
      if (kind === "block") {
        await api(`/api/blocks/${targetId}`, { method: "POST" });
      }
      if (kind === "report") {
        await api(`/api/reports/${targetId}`, {
          method: "POST",
          body: JSON.stringify({
            reason: "Inappropriate behavior",
            details: "Submitted from profile",
          }),
        });
      }
      go("matches");
    } catch (reason) {
      Alert.alert(
        t("somethingWrong"),
        reason instanceof Error ? reason.message : t("retry"),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenShell>
      <View style={[s.row, { gap: 16, height: 60 }]}>
        <MotionPressable
          onPress={() => go("profile")}
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
          onPress={() => act(kind)}
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
    </ScreenShell>
  );
}
