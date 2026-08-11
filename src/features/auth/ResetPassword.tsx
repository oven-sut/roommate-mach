import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, Lock, Mail } from "lucide-react-native";
import { useI18n } from "../../i18n";
import { api } from "../../services/api";
import {
  Button,
  Chevron,
  Field,
  MotionPressable,
  Txt,
} from "../../components/ui";
import { C } from "../../theme/colors";
import { GUTTER, MAX_WIDTH, s } from "../../theme/styles";
import { F } from "../../theme/typography";
import type { Screen } from "../../types/navigation";
import { sutIdToEmail } from "./sut-id";

/** Seconds before the OTP can be requested again. */
const RESEND_SECONDS = 60;

/** Small filled button that sits inside a field's trailing slot. */
function InlineButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <MotionPressable
      onPress={onPress}
      disabled={disabled}
      pressedScale={0.94}
      style={{
        backgroundColor: C.blue,
        borderRadius: 9,
        paddingHorizontal: 14,
        height: 38,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Txt
        style={{ fontFamily: F.bold, fontSize: 12, color: C.white }}
        numberOfLines={2}
      >
        {label}
      </Txt>
    </MotionPressable>
  );
}

/**
 * Password reset, walked in three states on one screen: request a code,
 * verify it, then choose a new password. Keeping them on one screen mirrors
 * the design, where the fields stay visible and only the CTA changes.
 */
export function ResetPassword({ go }: { go: (screen: Screen) => void }) {
  const { t } = useI18n();

  const [sutId, setSutId] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const entrance = useRef(new Animated.Value(0)).current;
  const email = sutIdToEmail(sutId);

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 460,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(
      () => setCountdown((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [countdown]);

  const sendOtp = async () => {
    if (!sutId.trim()) {
      setError("Please enter your SUT ID or email");
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
      setCountdown(RESEND_SECONDS);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to send OTP");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      setError("Please enter the code sent to your email");
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
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Invalid or expired code",
      );
    } finally {
      setBusy(false);
    }
  };

  const submitPassword = async () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    try {
      setBusy(true);
      setError("");
      await api("/auth/reset-password-otp", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      go("login");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to reset password",
      );
    } finally {
      setBusy(false);
    }
  };

  const canContinue = otpVerified
    ? password.length >= 8 && password === confirm
    : otpSent && otp.trim().length > 0;

  const onContinue = otpVerified ? submitPassword : verifyOtp;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.flex}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            width: "100%",
            maxWidth: MAX_WIDTH,
            alignSelf: "center",
            paddingHorizontal: GUTTER,
            paddingBottom: 30,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[s.row, { gap: 16, height: 64 }]}>
            <MotionPressable
              onPress={() => go("login")}
              pressedScale={0.9}
              style={s.iconBtn}
              accessibilityLabel={t("backToLogin")}
            >
              <Chevron direction="left" />
            </MotionPressable>
            <Txt role="h2">{t("resetPassword")}</Txt>
          </View>

          <Animated.View
            style={{
              opacity: entrance,
              transform: [
                {
                  translateY: entrance.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
              gap: 18,
            }}
          >
            <View style={{ alignItems: "center", gap: 14, marginVertical: 30 }}>
              <View
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 24,
                  backgroundColor: C.pinkDeep,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Lock size={34} color={C.primary} strokeWidth={2} />
              </View>
              <Txt role="h2">{t("resetYourPassword")}</Txt>
              <Txt role="subtitle" style={{ textAlign: "center" }}>
                {t("resetSub")}
              </Txt>
            </View>

            <Field
              label={t("emailOrCell")}
              placeholder={t("emailOrCellHint")}
              value={sutId}
              onChangeText={setSutId}
              autoCapitalize="none"
              editable={!otpVerified}
              right={
                <InlineButton
                  label={
                    countdown > 0
                      ? `${t("sendOtp")}\n(${countdown} s)`
                      : t("sendOtp")
                  }
                  onPress={sendOtp}
                  disabled={busy || countdown > 0 || otpVerified}
                />
              }
            />

            <Field
              label={t("enterOtpLabel")}
              placeholder={t("enterOtpLabel")}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              editable={otpSent && !otpVerified}
              right={
                otpVerified ? (
                  <View style={[s.row, { gap: 6 }]}>
                    <Check size={18} color={C.green} strokeWidth={2.6} />
                    <Txt
                      style={{ fontFamily: F.bold, fontSize: 12, color: C.green }}
                    >
                      {t("otpVerified")}
                    </Txt>
                  </View>
                ) : (
                  <InlineButton
                    label={t("submit")}
                    onPress={verifyOtp}
                    disabled={busy || !otpSent}
                  />
                )
              }
            />

            {otpVerified ? (
              <>
                <Field
                  label={t("newPassword")}
                  placeholder={t("enterPassword")}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Field
                  label={t("confirmPassword")}
                  placeholder={t("confirmYourPassword")}
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </>
            ) : null}

            {error ? (
              <View
                style={{ backgroundColor: C.pink, borderRadius: 12, padding: 14 }}
              >
                <Txt role="small" style={{ color: C.primaryDark }}>
                  {error}
                </Txt>
              </View>
            ) : null}

            <Button onPress={onContinue} disabled={!canContinue} loading={busy}>
              {t("continue")}
            </Button>

            <View
              style={{
                backgroundColor: "#FDF8E9",
                borderRadius: 14,
                paddingHorizontal: 18,
                paddingVertical: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Mail size={20} color={C.primary} strokeWidth={1.8} />
              <Txt role="small" style={{ flex: 1, color: C.muted }}>
                {t("didntGetIt")}{" "}
                <Txt style={{ fontFamily: F.bold, color: C.ink, fontSize: 13 }}>
                  {`0:${String(countdown).padStart(2, "0")}`}
                </Txt>
              </Txt>
            </View>

            <View style={{ flex: 1, minHeight: 24 }} />

            <View style={[s.row, { justifyContent: "center", gap: 6 }]}>
              <Txt role="small">{t("rememberedIt")}</Txt>
              <MotionPressable onPress={() => go("login")} hitSlop={8}>
                <Txt role="link">{t("backToLogin")}</Txt>
              </MotionPressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
