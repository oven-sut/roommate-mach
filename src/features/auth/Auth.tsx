import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "../../i18n";
import { api } from "../../services/api";
import type { AuthenticatedUser } from "../../types/models";
import type { Screen } from "../../types/navigation";
import { auth } from "./auth.styles";
import { AuthButton } from "./components/AuthButton";
import { AuthField } from "./components/AuthField";
import { getPasswordStrength } from "./password-strength";

/** Deep link Google returns to after the OAuth round trip. */
const googleRedirectUri = makeRedirectUri({
  native: "com.ovensut.roommatemach:/oauthredirect",
});

export function Auth({
  mode,
  go,
  onAuth,
}: {
  mode: "login" | "signup" | "forgot";
  go: (x: Screen) => void;
  onAuth: (token: string, user: AuthenticatedUser) => void;
}) {
  const { t } = useI18n();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sutId, setSutId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");
  const entrance = useRef(new Animated.Value(0)).current;
  const passwordStrength = useMemo(
    () => getPasswordStrength(password, t),
    [password, t],
  );
  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const googleAndroidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  // EAS does not upload the gitignored local .env file. The provider hook
  // requires a non-empty client ID during render, so keep the screen alive
  // and let signInWithGoogle show the configuration message instead.
  const googleClientIdFallback = "google-sign-in-not-configured";
  const [googleRequest, googleResponse, promptGoogleAsync] =
    Google.useIdTokenAuthRequest({
      webClientId: googleWebClientId ?? googleClientIdFallback,
      androidClientId:
        googleAndroidClientId ?? googleWebClientId ?? googleClientIdFallback,
      iosClientId:
        googleIosClientId ?? googleWebClientId ?? googleClientIdFallback,
      redirectUri: googleRedirectUri,
      selectAccount: true,
    });

  useEffect(() => {
    entrance.setValue(0);
    Animated.timing(entrance, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance, mode]);

  useEffect(() => {
    if (googleResponse?.type !== "success") {
      if (googleResponse?.type === "error") {
        setGoogleBusy(false);
        setError(
          googleResponse.error?.message ?? "Google sign-in was unsuccessful",
        );
      }
      return;
    }

    const idToken =
      googleResponse.authentication?.idToken ??
      googleResponse.params.id_token;

    if (!idToken) {
      setGoogleBusy(false);
      setError("Google did not return an identity token");
      return;
    }

    api<{ access_token: string; user: AuthenticatedUser }>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    })
      .then((result) => onAuth(result.access_token, result.user))
      .catch((reason) => {
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to sign in with Google",
        );
      })
      .finally(() => setGoogleBusy(false));
  }, [googleResponse, onAuth]);

  const signInWithGoogle = async () => {
    const platformClientId = Platform.select({
      ios: googleIosClientId ?? googleWebClientId,
      android: googleAndroidClientId ?? googleWebClientId,
      default: googleWebClientId,
    });

    if (!platformClientId) {
      setError(
        "Google sign-in is not configured. Add a Google client ID to .env.",
      );
      return;
    }

    try {
      setError("");
      setGoogleBusy(true);
      const result = await promptGoogleAsync();
      if (result.type === "cancel" || result.type === "dismiss") {
        setGoogleBusy(false);
      }
    } catch (reason) {
      setGoogleBusy(false);
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to open Google sign-in",
      );
    }
  };

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(
      () => setCountdown((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [countdown]);

  const [emailTaken, setEmailTaken] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const email = sutId.includes("@") ? sutId : `${sutId}@g.sut.ac.th`;

  useEffect(() => {
    if (mode !== "signup" || !sutId.trim()) {
      setEmailTaken(false);
      return;
    }
    const targetEmail = sutId.includes("@") ? sutId.trim() : `${sutId.trim()}@g.sut.ac.th`;
    const timer = setTimeout(async () => {
      try {
        setCheckingEmail(true);
        const res = await api<{ exists: boolean }>(`/auth/check-email?email=${encodeURIComponent(targetEmail)}`);
        setEmailTaken(res.exists);
        if (res.exists) {
          setError("อีเมลนี้ถูกใช้งานแล้วในระบบ");
        } else if (error === "อีเมลนี้ถูกใช้งานแล้วในระบบ") {
          setError("");
        }
      } catch {
        // ignore
      } finally {
        setCheckingEmail(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [sutId, mode]);

  const submitAuth = async () => {
    try {
      setBusy(true);
      setError("");
      if (!sutId.trim()) throw new Error("Please enter your SUT ID");
      if (mode === "signup" && emailTaken)
        throw new Error("This email is already registered");
      if (mode === "signup" && passwordStrength.score < 2)
        throw new Error("Please use a stronger password");
      if (mode === "signup" && password !== confirm)
        throw new Error("Passwords do not match");
      if (mode === "signup" && !accepted)
        throw new Error("Please accept the Terms and Privacy Policy");
      const d = await api(`/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        body: JSON.stringify(
          mode === "login"
            ? { email, password }
            : {
                displayName: `${firstName} ${lastName}`.trim(),
                email,
                password,
                sutId,
              },
        ),
      });
      onAuth(d.access_token, d.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to continue");
    } finally {
      setBusy(false);
    }
  };

  const sendOtp = async () => {
    if (!sutId.trim()) {
      setError("Please enter your SUT email or ID");
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
      setCountdown(47);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to send OTP");
    } finally {
      setBusy(false);
    }
  };

  const verifyForgotOtp = async () => {
    if (!otp.trim()) {
      setError("Please enter the OTP sent to your email");
      return;
    }
    try {
      setBusy(true);
      setError("");
      await api("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });
      setOtpVerified(true);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Invalid or expired OTP",
      );
    } finally {
      setBusy(false);
    }
  };

  const submitNewPassword = async () => {
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      setBusy(true);
      setError("");
      await api("/auth/reset-password-otp", {
        method: "POST",
        body: JSON.stringify({ email, password: newPassword }),
      });
      Alert.alert(
        "สำเร็จ",
        "รีเซ็ตรหัสผ่านเรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่",
      );
      go("login");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to reset password",
      );
    } finally {
      setBusy(false);
    }
  };

  const footer = (prompt: string, action: string, screen: Screen) => (
    <View style={auth.footerLink}>
      <Text style={auth.footerMuted}>{prompt} </Text>
      <Pressable onPress={() => go(screen)} hitSlop={8}>
        <Text style={auth.footerAccent}>{action}</Text>
      </Pressable>
    </View>
  );

  const entranceStyle = {
    opacity: entrance,
    transform: [
      {
        translateY: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };

  const emblemStyle = {
    opacity: entrance,
    transform: [
      {
        scale: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [0.82, 1],
        }),
      },
    ],
  };

  if (mode === "forgot") {
    return (
      <SafeAreaView style={auth.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={auth.flex}
        >
          <ScrollView
            contentContainerStyle={auth.forgotPage}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={[auth.animatedContent, entranceStyle]}>
            <View style={auth.forgotHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to login"
                onPress={() => go("login")}
                style={auth.backButton}
              >
                <Text style={auth.backIcon}>‹</Text>
              </Pressable>
              <Text style={auth.forgotHeaderTitle}>รีเซ็ตรหัสผ่าน</Text>
            </View>

            <View style={auth.resetHero}>
              <Animated.View style={[auth.lockTile, emblemStyle]}>
                <View style={auth.lockShackle} />
                <View style={auth.lockBody}>
                  <View style={auth.lockKeyhole} />
                </View>
              </Animated.View>
              <Text style={auth.resetTitle}>รีเซ็ตรหัสผ่านของคุณ</Text>
              <Text style={auth.resetDescription}>
                {otpVerified
                  ? "Enter and confirm your new password below."
                  : otpSent
                    ? "Enter the OTP code we sent to your email.\nIt expires in 10 minutes."
                    : "Enter your SUT email and we’ll send you a\nverification OTP."}
              </Text>
            </View>

            {!otpSent ? (
              <AuthField
                label="อีเมล SUT หรือรหัสนักศึกษา"
                placeholder="กรอกอีเมล SUT"
                value={sutId}
                onChangeText={setSutId}
                action={
                  <Pressable
                    onPress={sendOtp}
                    disabled={busy}
                    style={auth.inlineButton}
                  >
                    <Text style={auth.inlineButtonText}>
                      {busy ? "กำลังส่ง..." : "ส่ง OTP"}
                    </Text>
                  </Pressable>
                }
              />
            ) : !otpVerified ? (
              <>
                <AuthField
                  label="กรอก OTP"
                  placeholder="กรอก OTP"
                  value={otp}
                  onChangeText={setOtp}
                  action={
                    <Pressable
                      onPress={verifyForgotOtp}
                      disabled={busy}
                      style={auth.inlineButton}
                    >
                      <Text style={auth.inlineButtonText}>
                        {busy ? "กำลังยืนยัน..." : "ยืนยัน"}
                      </Text>
                    </Pressable>
                  }
                />
                <View style={auth.resendCard}>
                  <Text style={auth.mailIcon}>✉</Text>
                  <Text style={auth.resendText}>
                    Didn’t get it? Check spam, or{" "}
                    {countdown > 0
                      ? `resend in 0:${String(countdown).padStart(2, "0")}`
                      : ""}
                  </Text>
                  {countdown <= 0 ? (
                    <Pressable onPress={sendOtp} disabled={busy} hitSlop={8}>
                      <Text style={auth.footerAccent}>ส่งอีกครั้ง</Text>
                    </Pressable>
                  ) : null}
                </View>
              </>
            ) : (
              <>
                <AuthField
                  label="รหัสผ่านใหม่"
                  placeholder="กรอกรหัสผ่านใหม่"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secure
                />
                <AuthField
                  label="ยืนยันรหัสผ่านใหม่"
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                  secure
                />
              </>
            )}

            {error ? <Text style={auth.error}>{error}</Text> : null}
            {otpVerified ? (
              <AuthButton onPress={submitNewPassword} disabled={busy}>
                {busy ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
              </AuthButton>
            ) : null}

            {footer(t("rememberedIt"), t("backToLogin"), "login")}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  const login = mode === "login";
  return (
    <SafeAreaView style={auth.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={auth.flex}
      >
        <ScrollView
          contentContainerStyle={[auth.page, login && auth.loginPage]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[auth.animatedContent, entranceStyle]}>
          <View style={[auth.titleRow, login && auth.loginTitleRow]}>
            {!login ? (
              <Animated.View style={[auth.logoTile, emblemStyle]}>
                <Text style={auth.houseIcon}>⌂</Text>
              </Animated.View>
            ) : null}
            <View>
              <Text style={auth.title}>
                {login ? t("welcomeBack") : t("createAccount")}
              </Text>
              <Text style={auth.subtitle}>
                {login
                  ? t("loginSub")
                  : t("signupSub")}
              </Text>
            </View>
          </View>
          {!login ? (
            <>
              <AuthField
                label={t("firstName")}
                placeholder={t("enterFirstName")}
                value={firstName}
                onChangeText={setFirstName}
              />
              <AuthField
                label={t("lastName")}
                placeholder={t("enterLastName")}
                value={lastName}
                onChangeText={setLastName}
              />
            </>
          ) : null}

          <AuthField
            label={t("sutId")}
            placeholder="B67xxxxx"
            value={sutId}
            onChangeText={setSutId}
          />
          {!login && checkingEmail ? (
            <Text style={[auth.footerMuted, { marginTop: -8, marginBottom: 8 }]}>
              กำลังตรวจสอบอีเมล...
            </Text>
          ) : null}
          <AuthField
            label={t("password")}
            placeholder={t("enterPassword")}
            value={password}
            onChangeText={setPassword}
            secure
          />

          {!login ? (
            <>
              <View style={auth.passwordStrength}>
                {[1, 2, 3, 4].map((level) => (
                  <View
                    key={level}
                    style={[
                      auth.strengthBar,
                      {
                        backgroundColor:
                          passwordStrength.score >= level
                            ? passwordStrength.color
                            : "#E5D9CD",
                      },
                    ]}
                  />
                ))}
                <Text style={[auth.strengthLabel, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
              <Text style={auth.strengthHint}>{passwordStrength.hint}</Text>
              <AuthField
                label={t("confirmPassword")}
                placeholder={t("confirmYourPassword")}
                value={confirm}
                onChangeText={setConfirm}
                secure
              />
            </>
          ) : null}

          {login ? (
            <View style={auth.loginOptions}>
              <Pressable
                onPress={() => setRemember((current) => !current)}
                style={auth.checkRow}
              >
                <View style={[auth.checkbox, remember && auth.checkboxChecked]}>
                  {remember ? <Text style={auth.checkmark}>✓</Text> : null}
                </View>
                <Text style={auth.optionText}>{t("rememberMe")}</Text>
              </Pressable>
              <Pressable onPress={() => go("forgot")}>
                <Text style={auth.forgotLink}>{t("forgotPassword")}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setAccepted((current) => !current)}
              style={auth.termsRow}
            >
              <View style={[auth.checkbox, accepted && auth.checkboxChecked]}>
                {accepted ? <Text style={auth.checkmark}>✓</Text> : null}
              </View>
              <Text style={auth.termsText}>
                {t("termsAgreePrefix")}{" "}
                <Text style={auth.termsLink} onPress={() => go("terms")}>
                  {t("terms")}
                </Text>{" "}
                {t("and")}{" "}
                <Text style={auth.termsLink} onPress={() => go("privacy")}>
                  {t("privacyPolicy")}
                </Text>
                , {t("sutConfirm")}
              </Text>
            </Pressable>
          )}

          {error ? <Text style={auth.error}>{error}</Text> : null}
          <AuthButton onPress={submitAuth} disabled={busy}>
            {busy ? t("pleaseWait") : t("continue")}
          </AuthButton>

          {login ? (
            <>
              <View style={auth.divider}>
                <View style={auth.dividerLine} />
                <Text style={auth.dividerText}>{t("orContinueWith")}</Text>
                <View style={auth.dividerLine} />
              </View>
              <View style={auth.socialRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("continueGoogle")}
                  disabled={!googleRequest || googleBusy}
                  onPress={signInWithGoogle}
                  style={({ pressed }) => [
                    auth.socialButton,
                    pressed && auth.socialButtonPressed,
                    (!googleRequest || googleBusy) &&
                      auth.socialButtonDisabled,
                  ]}
                >
                  <Text style={auth.googleIcon}>G</Text>
                  <Text style={auth.socialText}>
                    {googleBusy ? t("pleaseWait") : "Google"}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : null}

          {footer(
            login ? t("newHere") : t("alreadyAccount"),
            login ? t("signUp") : t("logInAction"),
            login ? "signup" : "login",
          )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

