import { useEffect, useState } from "react";
import { Alert, Platform, Share, View } from "react-native";
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
import { api, resetAppState, saveToken } from "../../services/api";
import { C } from "../../theme/colors";
import { s } from "../../theme/styles";
import { F } from "../../theme/typography";
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const resetModalState = () => {
    setPasswordOpen(false);
    setStep(1);
    setCurrent("");
    setNext("");
    setConfirm("");
    setOtp("");
    setOtpSent(false);
    setOtpVerified(false);
    setCountdown(0);
    setError("");
  };

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(
      () => setCountdown((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [countdown]);

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

  const sendChangePasswordOtp = async () => {
    if (!email) {
      setError("Email is missing");
      return;
    }
    try {
      setBusy(true);
      setError("");
      await api("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setOtpSent(true);
      setCountdown(60);
    } catch (reason) {
      const msg = reason instanceof Error ? reason.message : "Unable to send OTP";
      if (msg.includes("just sent") || msg.includes("wait a moment")) {
        setOtpSent(true);
        setError("เพิ่งส่งรหัส OTP ไปเมื่อครู่ สามารถนำรหัสใน Backend Log มากรอกได้เลยครับ");
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const verifyChangePasswordOtp = async () => {
    if (!otp.trim()) {
      setError("Please enter the 6-digit OTP code");
      return;
    }
    try {
      setBusy(true);
      setError("");
      await api("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp: otp.trim() }),
      });
      setOtpVerified(true);
      setStep(2); // Automatically jump to Step 2: Change Password
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Invalid or expired code",
      );
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    if (!otpVerified) {
      setError("กรุณายืนยันรหัส OTP ก่อน");
      return;
    }
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
      setStep(3); // Jump to Step 3: Success Notification
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : t("somethingWrong"),
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmLogout = () => {
    const doLogout = () => {
      saveToken(null);
      resetAppState();
      go("authChoice");
    };

    if (Platform.OS === "web") {
      const ok = window.confirm(
        language === "th"
          ? "คุณต้องการออกจากระบบใช่หรือไม่?"
          : "Are you sure you want to log out?"
      );
      if (ok) {
        doLogout();
      }
      return;
    }

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
          onPress: doLogout,
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
          <Row label={t("blockUsers")} last onPress={() => go("blocked")} />
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
        onClose={resetModalState}
      >
        {step === 1 ? (
          <>
            <Txt role="h2">ขั้นตอนที่ 1: ยืนยันตัวตนด้วย OTP</Txt>

            <Field
              label="อีเมลที่จะรับ OTP"
              value={email}
              editable={false}
              right={
                <Button
                  tone="blue"
                  style={{ height: 36, paddingHorizontal: 10 }}
                  disabled={busy || otpVerified || countdown > 0}
                  onPress={sendChangePasswordOtp}
                >
                  {countdown > 0
                    ? `ส่ง OTP (${countdown}s)`
                    : otpSent
                    ? "ส่ง OTP อีกครั้ง"
                    : "ส่ง OTP"}
                </Button>
              }
            />

            {otpSent ? (
              <View
                style={{
                  backgroundColor: "#E0F2FE",
                  borderColor: "#3B82F6",
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 10,
                }}
              >
                <Txt role="small" style={{ color: "#1D4ED8", textAlign: "center" }}>
                  📨 ส่งรหัส OTP 6 หลักเรียบร้อย (ดูรหัสได้ใน Backend Console Log)
                </Txt>
              </View>
            ) : null}

            <Field
              label="รหัส OTP (6 หลัก)"
              placeholder="กรอกรหัส OTP 6 หลัก"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              editable={!otpVerified}
            />

            {error ? (
              <Txt role="small" style={{ color: C.primary, textAlign: "center" }}>
                {error}
              </Txt>
            ) : null}

            <View style={[s.row, { gap: 12, marginTop: 6 }]}>
              <Button tone="outline" style={{ flex: 1 }} onPress={resetModalState}>
                {t("cancel")}
              </Button>
              <Button
                style={{ flex: 1 }}
                disabled={busy || !otpSent || !otp.trim()}
                loading={busy}
                onPress={verifyChangePasswordOtp}
              >
                ถัดไป (ยืนยัน OTP)
              </Button>
            </View>
          </>
        ) : step === 2 ? (
          <>
            <Txt role="h2">ขั้นตอนที่ 2: ตั้งรหัสผ่านใหม่</Txt>

            <View
              style={{
                backgroundColor: "#D1FAE5",
                borderColor: "#10B981",
                borderWidth: 1,
                borderRadius: 12,
                padding: 10,
              }}
            >
              <Txt role="small" style={{ color: "#047857", textAlign: "center", fontFamily: F.bold }}>
                ✓ ยืนยันรหัส OTP สำเร็จแล้ว กรุณากรอกรหัสผ่านใหม่
              </Txt>
            </View>

            <Field
              label={t("password")}
              placeholder="รหัสผ่านปัจจุบัน"
              value={current}
              onChangeText={setCurrent}
              secureTextEntry
              autoCapitalize="none"
            />
            <Field
              label={t("newPassword")}
              placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
              value={next}
              onChangeText={setNext}
              secureTextEntry
              autoCapitalize="none"
            />
            <Field
              label={t("confirmPassword")}
              placeholder="ยืนยันรหัสผ่านใหม่"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
              error={error || undefined}
            />

            {error ? (
              <Txt role="small" style={{ color: C.primary, textAlign: "center" }}>
                {error}
              </Txt>
            ) : null}

            <View style={[s.row, { gap: 12, marginTop: 6 }]}>
              <Button tone="outline" style={{ flex: 1 }} onPress={() => setStep(1)}>
                ย้อนกลับ
              </Button>
              <Button style={{ flex: 1 }} loading={busy} onPress={changePassword}>
                บันทึกรหัสผ่านใหม่
              </Button>
            </View>
          </>
        ) : (
          /* Step 3: Success Notification */
          <View style={{ alignItems: "center", gap: 16, paddingVertical: 10 }}>
            <View
              style={{
                width: 68,
                height: 68,
                borderRadius: 34,
                backgroundColor: "#D1FAE5",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Txt style={{ fontSize: 32 }}>🎉</Txt>
            </View>

            <Txt role="h2" style={{ color: C.green, textAlign: "center" }}>
              เปลี่ยนรหัสผ่านสำเร็จ!
            </Txt>

            <Txt role="body" style={{ textAlign: "center", color: C.muted }}>
              รหัสผ่านใหม่ของคุณได้รับการบันทึกและอัปเดตเรียบร้อยแล้ว
            </Txt>

            <Button style={{ width: "100%", marginTop: 8 }} onPress={resetModalState}>
              ตกลง (เรียบร้อย)
            </Button>
          </View>
        )}
      </CenterModal>

    </>
  );
}
