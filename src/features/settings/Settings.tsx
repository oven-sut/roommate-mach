import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { LogOut } from "lucide-react-native";
import { CenterModal } from "../../components/Sheet";
import { Toggle } from "../../components/Toggle";
import {
  Button,
  Chevron,
  Field,
  MotionPressable,
  ScreenShell,
  SectionLabel,
  Txt,
} from "../../components/ui";
import { LanguageToggle, useI18n } from "../../i18n";
import { api } from "../../services/api";
import { C } from "../../theme/colors";
import { s } from "../../theme/styles";
import type { Me } from "../../types/models";
import type { Screen } from "../../types/navigation";

type Prefs = {
  matches: boolean;
  messages: boolean;
  likes: boolean;
  /** Mirrors the design's "Hide me from Discover" switch, not `discoverable`. */
  hidden: boolean;
};

const DEFAULT_PREFS: Prefs = {
  matches: true,
  messages: true,
  likes: false,
  hidden: false,
};

/** A row inside one of the grouped setting cards. */
function Row({
  label,
  value,
  onPress,
  right,
  last = false,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  last?: boolean;
}) {
  const content = (
    <View
      style={[
        s.rowBetween,
        {
          paddingVertical: 18,
          gap: 12,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: C.line,
        },
      ]}
    >
      <Txt role="body" style={{ flex: 1 }}>
        {label}
      </Txt>
      {value ? (
        <Txt role="small" numberOfLines={1} style={{ maxWidth: 190 }}>
          {value}
        </Txt>
      ) : null}
      {right ?? (onPress ? <Chevron direction="right" size={8} /> : null)}
    </View>
  );

  if (!onPress) return content;
  return (
    <MotionPressable onPress={onPress} pressedScale={0.995}>
      {content}
    </MotionPressable>
  );
}

/** Card grouping a set of rows under an all-caps label. */
function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SectionLabel>{label}</SectionLabel>
      <View style={[s.card, { paddingVertical: 0, gap: 0 }]}>{children}</View>
    </>
  );
}

/** Account, notification and privacy settings. */
export function Settings({ go }: { go: (x: Screen) => void }) {
  const { t, language } = useI18n();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [email, setEmail] = useState("");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Me>("/api/me")
      .then((me) => {
        const p = me?.notificationPrefs ?? {};
        setEmail(me?.email ?? "");
        setPrefs({
          matches: p.matches !== false,
          messages: p.messages !== false,
          likes: p.likes === true,
          hidden: me?.discoverable === false,
        });
      })
      .catch(() => undefined);
  }, []);

  const update = async (patch: Partial<Prefs>) => {
    const merged = { ...prefs, ...patch };
    setPrefs(merged);
    try {
      const body =
        "hidden" in patch
          ? { discoverable: !merged.hidden }
          : {
              notificationPrefs: {
                matches: merged.matches,
                messages: merged.messages,
                likes: merged.likes,
              },
            };
      await api("/api/me", { method: "PATCH", body: JSON.stringify(body) });
    } catch (reason) {
      setPrefs(prefs);
      Alert.alert(
        t("settingTitle"),
        reason instanceof Error ? reason.message : t("somethingWrong"),
      );
    }
  };

  const changePassword = async () => {
    if (next.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (next !== confirm) {
      setError("Passwords do not match");
      return;
    }
    try {
      setBusy(true);
      setError("");
      await api("/api/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword: current, password: next }),
      });
      setPasswordOpen(false);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : t("somethingWrong"),
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      t("logout"),
      language === "th"
        ? "คุณต้องการออกจากระบบใช่หรือไม่?"
        : "Are you sure you want to log out?",
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("logout"),
          style: "destructive",
          onPress: () => go("login"),
        },
      ],
    );
  };

  return (
    <>
      <ScreenShell>
        <View style={[s.rowBetween, { height: 60 }]}>
          <View style={[s.row, { gap: 16 }]}>
            <MotionPressable
              onPress={() => go("myprofile")}
              pressedScale={0.9}
              style={s.iconBtn}
              accessibilityLabel="Back"
            >
              <Chevron direction="left" />
            </MotionPressable>
            <Txt role="h1">{t("settingTitle")}</Txt>
          </View>
          <LanguageToggle />
        </View>

        <Group label={t("account")}>
          <Row label={t("email")} value={email} onPress={() => undefined} />
          <Row
            label={t("changePassword")}
            onPress={() => setPasswordOpen(true)}
            last
          />
        </Group>

        <Group label={t("notifications")}>
          <Row
            label={t("newMatches")}
            right={
              <Toggle
                value={prefs.matches}
                onChange={(v) => update({ matches: v })}
                accessibilityLabel={t("newMatches")}
              />
            }
          />
          <Row
            label={t("messageNotif")}
            right={
              <Toggle
                value={prefs.messages}
                onChange={(v) => update({ messages: v })}
                accessibilityLabel={t("messageNotif")}
              />
            }
          />
          <Row
            label={t("likesYou")}
            last
            right={
              <Toggle
                value={prefs.likes}
                onChange={(v) => update({ likes: v })}
                accessibilityLabel={t("likesYou")}
              />
            }
          />
        </Group>

        <Group label={t("privacy")}>
          <Row
            label={t("hideDiscover")}
            right={
              <Toggle
                value={prefs.hidden}
                onChange={(v) => update({ hidden: v })}
                accessibilityLabel={t("hideDiscover")}
              />
            }
          />
          <Row label={t("blockUsers")} onPress={() => go("blocked")} />
          <Row label={t("search")} onPress={() => go("search")} />
          <Row
            label={t("downloadData")}
            last
            onPress={() =>
              Alert.alert(t("downloadData"), t("pleaseWait"))
            }
          />
        </Group>

        <Group label={t("support")}>
          <Row label={t("helpFaq")} onPress={() => go("terms")} />
          <Row label={t("privacyPolicy")} onPress={() => go("privacy")} />
          <Row label={t("reportProblem")} last onPress={() => go("report")} />
        </Group>

        <MotionPressable
          onPress={confirmLogout}
          pressedScale={0.98}
          style={{
            height: 58,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: C.primary,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            marginTop: 10,
          }}
        >
          <LogOut size={20} color={C.primary} strokeWidth={2} />
          <Txt role="button" style={{ color: C.primary }}>
            {t("logout")}
          </Txt>
        </MotionPressable>
      </ScreenShell>

      <CenterModal
        visible={passwordOpen}
        onClose={() => setPasswordOpen(false)}
      >
        <Txt role="h2">{t("changePassword")}</Txt>
        <Field
          label={t("password")}
          value={current}
          onChangeText={setCurrent}
          secureTextEntry
          autoCapitalize="none"
        />
        <Field
          label={t("newPassword")}
          value={next}
          onChangeText={setNext}
          secureTextEntry
          autoCapitalize="none"
        />
        <Field
          label={t("confirmPassword")}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoCapitalize="none"
          error={error || undefined}
        />
        <View style={[s.row, { gap: 12 }]}>
          <Button
            tone="outline"
            style={{ flex: 1 }}
            onPress={() => setPasswordOpen(false)}
          >
            {t("cancel")}
          </Button>
          <Button style={{ flex: 1 }} loading={busy} onPress={changePassword}>
            {t("save")}
          </Button>
        </View>
      </CenterModal>
    </>
  );
}
