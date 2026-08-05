import { useEffect, useMemo, useRef, useState } from "react";
import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as ImagePicker from "expo-image-picker";
import * as WebBrowser from "expo-web-browser";
import {
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useI18n } from "../i18n";
import { api, appState, formatImageUri, populateProfileDraft } from "../services/api";
import type { AuthenticatedUser, ProfileDraft } from "../types/models";
import type { Screen } from "../types/navigation";

WebBrowser.maybeCompleteAuthSession();

const serif = "NotoSansThai_400Regular";
const serifFont = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "serif",
});
const googleRedirectUri = makeRedirectUri({
  native: "com.ovensut.roommatemach:/oauthredirect",
});

type PasswordStrength = {
  score: number;
  label: string;
  color: string;
  hint: string;
};

function getPasswordStrength(
  value: string,
  t: (key: string) => string,
): PasswordStrength {
  const password = value.trim();
  if (!password) {
    return {
      score: 0,
      label: t("weak"),
      color: "#C93A32",
      hint: t("pwdEmpty"),
    };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const simplePattern =
    /(.)\1{2,}|1234|2345|3456|4567|5678|6789|password|qwerty|admin|sut/i;
  if (simplePattern.test(password)) score = Math.max(0, score - 1);

  if (score >= 5) {
    return {
      score,
      label: t("strong"),
      color: "#2F9142",
      hint: t("pwdStrong"),
    };
  }
  if (score >= 4) {
    return {
      score,
      label: t("good"),
      color: "#4AAF55",
      hint: t("pwdGood"),
    };
  }
  if (score >= 2) {
    return {
      score,
      label: t("fair"),
      color: "#D98916",
      hint: t("pwdFair"),
    };
  }
  return {
    score,
    label: t("weak"),
    color: "#C93A32",
    hint: t("pwdWeak"),
  };
}

function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  secure = false,
  action,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secure?: boolean;
  action?: React.ReactNode;
}) {
  const [hidden, setHidden] = useState(secure);

  return (
    <View style={auth.fieldGroup}>
      <Text style={auth.fieldLabel}>{label}</Text>
      <View style={auth.field}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#74675E"
          secureTextEntry={secure && hidden}
          autoCapitalize="none"
          style={auth.fieldInput}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
            hitSlop={10}
            onPress={() => setHidden((current) => !current)}
          >
            <Text style={auth.eye}>{hidden ? "◉" : "⊘"}</Text>
          </Pressable>
        ) : null}
        {action}
      </View>
    </View>
  );
}

function AuthButton({
  children,
  onPress,
  disabled = false,
}: {
  children: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        auth.primaryButton,
        pressed && auth.primaryButtonPressed,
        disabled && auth.primaryButtonDisabled,
      ]}
    >
      <Text style={auth.primaryButtonText}>{children}</Text>
    </Pressable>
  );
}

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

const auth = StyleSheet.create({
  flex: { flex: 1 },
  animatedContent: { flexGrow: 1 },
  safe: { flex: 1, backgroundColor: "#FEFCFA" },
  page: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 68,
    paddingBottom: 28,
  },
  loginPage: { paddingTop: 40 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 17,
    marginBottom: 33,
  },
  loginTitleRow: { marginLeft: 74, marginBottom: 43 },
  logoTile: {
    width: 58,
    height: 58,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B83A31",
  },
  houseIcon: { color: "#FFF8DA", fontSize: 28, lineHeight: 31 },
  title: {
    color: "#42362A",
    fontFamily: serif,
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: "#63564D",
    fontFamily: serif,
    fontSize: 15,
    marginTop: 2,
  },
  fieldGroup: { marginBottom: 10 },
  fieldLabel: {
    color: "#6C5F56",
    fontFamily: serif,
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 7,
  },
  field: {
    height: 45,
    borderWidth: 1,
    borderColor: "#E8DFC8",
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    paddingLeft: 15,
    paddingRight: 7,
    flexDirection: "row",
    alignItems: "center",
  },
  fieldInput: {
    flex: 1,
    color: "#2E241D",
    fontFamily: serif,
    fontSize: 12,
    paddingVertical: 0,
  },
  eye: { color: "#80715F", fontSize: 18, paddingHorizontal: 8 },
  passwordStrength: {
    height: 12,
    marginTop: -4,
    marginBottom: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  strengthBar: { height: 4, flex: 1, borderRadius: 3 },
  strengthLabel: {
    width: 54,
    color: "#378B3B",
    fontFamily: serif,
    fontSize: 11,
    textAlign: "right",
  },
  strengthHint: {
    color: "#6C5F56",
    fontFamily: serif,
    fontSize: 10.5,
    lineHeight: 15,
    marginBottom: 12,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 1,
    marginBottom: 18,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#D9CDBF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#CC402E", borderColor: "#CC402E" },
  checkmark: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  termsText: {
    flex: 1,
    color: "#9B8C81",
    fontFamily: serif,
    fontSize: 11,
    lineHeight: 19,
  },
  termsLink: { color: "#C72F2F", textDecorationLine: "underline" },
  primaryButton: {
    height: 51,
    borderRadius: 8,
    backgroundColor: "#BF3D3C",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 5,
  },
  primaryButtonPressed: { opacity: 0.72 },
  primaryButtonDisabled: { opacity: 0.58 },
  primaryButtonText: {
    color: "#FFF9F0",
    fontFamily: serif,
    fontSize: 15,
    fontWeight: "700",
  },
  error: {
    color: "#B42336",
    fontFamily: serif,
    fontSize: 12,
    marginBottom: 10,
  },
  footerLink: {
    marginTop: "auto",
    paddingTop: 50,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  footerMuted: { color: "#77685E", fontFamily: serif, fontSize: 11 },
  footerAccent: {
    color: "#C62828",
    fontFamily: "NotoSansThai_700Bold",
    fontSize: 11,
    textDecorationLine: "underline",
  },
  loginOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 1,
    marginBottom: 39,
    paddingHorizontal: 4,
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  optionText: { color: "#685A50", fontFamily: serif, fontSize: 11 },
  forgotLink: {
    color: "#D00000",
    fontFamily: serif,
    fontWeight: "700",
    fontSize: 11,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginTop: 41,
    marginBottom: 39,
  },
  dividerLine: { height: 1, flex: 1, backgroundColor: "#BFB9B4" },
  dividerText: { color: "#74675E", fontFamily: serif, fontSize: 11 },
  socialRow: { flexDirection: "row", gap: 14 },
  socialButton: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: "#E7DDC7",
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  socialButtonPressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  socialButtonDisabled: { opacity: 0.55 },
  googleIcon: {
    color: "#766F66",
    fontSize: 20,
    fontWeight: "700",
  },
  socialText: {
    color: "#4F443C",
    fontFamily: serif,
    fontSize: 15,
    fontWeight: "700",
  },
  forgotPage: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 78,
    paddingBottom: 28,
  },
  forgotHeader: { flexDirection: "row", alignItems: "center", gap: 13 },
  backButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: "#E3DAC6",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { color: "#776C61", fontSize: 29, lineHeight: 30 },
  forgotHeaderTitle: {
    color: "#40352A",
    fontFamily: serif,
    fontSize: 18,
    fontWeight: "700",
  },
  resetHero: { alignItems: "center", marginTop: 82, marginBottom: 25 },
  lockTile: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: "#F6CBC5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  lockShackle: {
    width: 15,
    height: 14,
    borderWidth: 2,
    borderColor: "#D84634",
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginBottom: -2,
  },
  lockBody: {
    width: 23,
    height: 19,
    borderWidth: 2,
    borderColor: "#D84634",
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  lockKeyhole: {
    width: 3,
    height: 6,
    borderRadius: 2,
    backgroundColor: "#D84634",
  },
  resetTitle: {
    color: "#493C30",
    fontFamily: serif,
    fontSize: 18,
    fontWeight: "700",
  },
  resetDescription: {
    color: "#61554C",
    fontFamily: serif,
    fontSize: 11,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 7,
  },
  inlineButton: {
    minWidth: 64,
    height: 31,
    paddingHorizontal: 8,
    borderRadius: 5,
    backgroundColor: "#477AAF",
    alignItems: "center",
    justifyContent: "center",
  },
  inlineButtonText: {
    color: "#FFFFFF",
    fontFamily: serif,
    fontSize: 8,
    fontWeight: "700",
    textAlign: "center",
  },
  resendCard: {
    height: 53,
    borderWidth: 1,
    borderColor: "#E9DFC7",
    borderRadius: 14,
    backgroundColor: "#FFFDF4",
    marginHorizontal: 3,
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 25,
    gap: 14,
  },
  mailIcon: { color: "#F08B7B", fontSize: 21 },
  resendText: {
    flex: 1,
    color: "#8E4B49",
    fontFamily: serif,
    fontSize: 11,
  },
});

export function Basics({
  screen,
  go,
}: {
  screen: "basics" | "housing";
  go: (x: Screen) => void;
}) {
  const housing = screen === "housing";
  const { language } = useI18n();
  const [, rerender] = useState(0);
  const [activeModal, setActiveModal] = useState<"gender" | "major" | null>(null);
  const [majorSearch, setMajorSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    api("/api/me")
      .then((me) => {
        if (!mounted || !me) return;
        populateProfileDraft(me);
        rerender((x) => x + 1);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  const set = <K extends keyof ProfileDraft>(
    key: K,
    value: ProfileDraft[K],
  ) => {
    appState.profileDraft[key] = value;
    rerender((x) => x + 1);
  };

  const changePhoto = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.6,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const value = asset.base64
        ? `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`
        : asset.uri;
      const current = appState.profileDraft.photos || [];
      const newPhotos = [...current];
      newPhotos[index] = value;
      set("photos", newPhotos.filter(Boolean));
    }
  };

  const proceed = async () => {
    if (!housing) {
      if (appState.profileDraft.displayName)
        await api("/api/me", {
          method: "PATCH",
          body: JSON.stringify({ displayName: appState.profileDraft.displayName }),
        });
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          ...appState.profileDraft,
          age: Number(appState.profileDraft.age) || null,
        }),
      }).catch(() => undefined);
      go("housing");
      return;
    }
    try {
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          ...appState.profileDraft,
          age: Number(appState.profileDraft.age) || null,
        }),
      });
      if (appState.profileDraft.completed) {
        go("myprofile");
      } else {
        go("intro");
      }
    } catch (e) {
      Alert.alert("Profile", e instanceof Error ? e.message : "Unable to save");
    }
  };

  const roomTypeOptions = [
    { value: "Single", label: { en: "Single", th: "ห้องเดี่ยว" } },
    { value: "Double", label: { en: "Double", th: "ห้องคู่" } },
    { value: "Either", label: { en: "Either", th: "แบบไหนก็ได้" } },
  ];

  const roommateGenderOptions = [
    { value: "Same gender", label: { en: "Same Gender", th: "เพศเดียวกัน" } },
    { value: "Any", label: { en: "Any", th: "ได้ทุกเพศ" } },
    { value: "Non-binary friendly", label: { en: "Non-binary friendly", th: "ยินดีรับ Non-binary" } },
  ];

  const genderOptions = [
    { value: "ชาย", label: { th: "ชาย (Male)", en: "Male" } },
    { value: "หญิง", label: { th: "หญิง (Female)", en: "Female" } },
    { value: "LGBTQ+", label: { th: "LGBTQ+", en: "LGBTQ+" } },
    { value: "ไม่ระบุ", label: { th: "ไม่ระบุ", en: "Prefer not to say" } },
  ];

  const majorOptions = [
    { value: "วิศวกรรมคอมพิวเตอร์", label: { th: "วิศวกรรมคอมพิวเตอร์", en: "Computer Engineering" } },
    { value: "วิศวกรรมเคมี", label: { th: "วิศวกรรมเคมี", en: "Chemical Engineering" } },
    { value: "วิศวกรรมโยธา", label: { th: "วิศวกรรมโยธา", en: "Civil Engineering" } },
    { value: "วิศวกรรมไฟฟ้า", label: { th: "วิศวกรรมไฟฟ้า", en: "Electrical Engineering" } },
    { value: "วิศวกรรมเครื่องกล", label: { th: "วิศวกรรมเครื่องกล", en: "Mechanical Engineering" } },
    { value: "วิศวกรรมอุตสาหการ", label: { th: "วิศวกรรมอุตสาหการ", en: "Industrial Engineering" } },
    { value: "วิศวกรรมสิ่งแวดล้อม", label: { th: "วิศวกรรมสิ่งแวดล้อม", en: "Environmental Engineering" } },
    { value: "วิศวกรรมโทรคมนาคม", label: { th: "วิศวกรรมโทรคมนาคม", en: "Telecommunication Engineering" } },
    { value: "วิศวกรรมขนส่งและโลจิสติกส์", label: { th: "วิศวกรรมขนส่งและโลจิสติกส์", en: "Logistics Engineering" } },
    { value: "วิศวกรรมเกษตรและอาหาร", label: { th: "วิศวกรรมเกษตรและอาหาร", en: "Agricultural & Food Eng." } },
    { value: "เทคโนโลยีสารสนเทศ", label: { th: "เทคโนโลยีสารสนเทศ", en: "Information Technology" } },
    { value: "เทคโนโลยีการจัดการ", label: { th: "เทคโนโลยีการจัดการ", en: "Management Technology" } },
    { value: "วิทยาการคอมพิวเตอร์", label: { th: "วิทยาการคอมพิวเตอร์", en: "Computer Science" } },
    { value: "แพทยศาสตร์", label: { th: "แพทยศาสตร์", en: "Medicine" } },
    { value: "พยาบาลศาสตร์", label: { th: "พยาบาลศาสตร์", en: "Nursing" } },
    { value: "ทันตแพทยศาสตร์", label: { th: "ทันตแพทยศาสตร์", en: "Dentistry" } },
    { value: "สาธารณสุขศาสตร์", label: { th: "สาธารณสุขศาสตร์", en: "Public Health" } },
    { value: "เทคโนโลยีการเกษตร", label: { th: "เทคโนโลยีการเกษตร", en: "Agricultural Technology" } },
    { value: "เทคโนโลยีอาหาร", label: { th: "เทคโนโลยีอาหาร", en: "Food Technology" } },
    { value: "นิเทศศาสตร์ดิจิทัล", label: { th: "นิเทศศาสตร์ดิจิทัล", en: "Digital Communication" } },
    { value: "บริหารธุรกิจ / บัญชี", label: { th: "บริหารธุรกิจ / บัญชี", en: "Business / Accounting" } },
  ];

  const basicsStyles = StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: "#FEFCFA",
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 60,
    },
    title: {
      fontFamily: serifFont,
      fontSize: 30,
      fontWeight: "bold",
      color: "#5C3A21",
      marginBottom: 4,
    },
    subtitle: {
      fontFamily: serifFont,
      fontSize: 15,
      color: "#8D7C75",
      marginBottom: 24,
    },
    photoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 28,
      gap: 12,
    },
    photoBoxMain: {
      width: 78,
      height: 78,
      borderRadius: 18,
      backgroundColor: "#FED266",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    photoBoxDashed: {
      width: 78,
      height: 78,
      borderRadius: 18,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: "#D29F9A",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#FEFCFA",
    },
    photoImage: {
      width: "100%",
      height: "100%",
      borderRadius: 18,
    },
    avatarLetter: {
      fontFamily: serifFont,
      fontSize: 32,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    plusIcon: {
      fontSize: 24,
      color: "#D29F9A",
      fontWeight: "300",
    },
    cameraBadge: {
      position: "absolute",
      bottom: -4,
      right: -4,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "#BF3D3C",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: "#FEFCFA",
    },
    cameraText: {
      color: "#FFFFFF",
      fontSize: 11,
    },
    photoText: {
      fontFamily: serifFont,
      fontSize: 13,
      color: "#8D7C75",
      marginLeft: 4,
    },
    row: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    fieldContainer: {
      flexDirection: "column",
    },
    fieldLabel: {
      fontFamily: serifFont,
      fontSize: 13,
      fontWeight: "bold",
      color: "#8D7C75",
      marginBottom: 8,
    },
    fieldInput: {
      height: 48,
      borderWidth: 1,
      borderColor: "#EADEC9",
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 16,
      fontFamily: serifFont,
      fontSize: 14,
      color: "#4D3E35",
    },
    fieldInputMultiline: {
      height: 96,
      paddingTop: 12,
      paddingBottom: 12,
      textAlignVertical: "top",
    },
    dropdownInput: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingRight: 10,
    },
    dropdownText: {
      fontFamily: serifFont,
      fontSize: 14,
      color: "#463826",
      flex: 1,
    },
    dropdownPlaceholder: {
      color: "#BCAFA8",
    },
    dropdownChevron: {
      fontSize: 13,
      color: "#8D7C75",
      marginLeft: 4,
    },
    controlSection: {
      marginBottom: 20,
    },
    controlLabel: {
      fontFamily: serifFont,
      fontSize: 13,
      fontWeight: "bold",
      color: "#8D7C75",
      marginBottom: 10,
    },
    segmentControl: {
      flexDirection: "row",
      backgroundColor: "#EAECEF",
      borderRadius: 10,
      padding: 4,
    },
    segmentButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
    },
    segmentButtonSelected: {
      backgroundColor: "#FFFFFF",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    segmentText: {
      fontFamily: serifFont,
      fontSize: 14,
      color: "#74675E",
    },
    segmentTextSelected: {
      fontWeight: "bold",
      color: "#BF3D3C",
    },
    genderRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    genderButton: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#EADEC9",
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    genderButtonSelected: {
      backgroundColor: "#FADBD8",
      borderColor: "#EC7063",
    },
    genderText: {
      fontFamily: serifFont,
      fontSize: 13,
      color: "#74675E",
    },
    genderTextSelected: {
      fontWeight: "bold",
      color: "#BF3D3C",
    },
    continueButton: {
      height: 52,
      borderRadius: 10,
      backgroundColor: "#BF3D3C",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
    },
    continueButtonText: {
      fontFamily: serifFont,
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
    },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 16,
    },
    footerText: {
      fontFamily: serifFont,
      fontSize: 12,
      color: "#8D7C75",
    },
    footerLink: {
      fontFamily: serifFont,
      fontSize: 12,
      fontWeight: "bold",
      color: "#BF3D3C",
      textDecorationLine: "underline",
    },
  });

  const renderContent = () => {
    if (housing) {
      const budgetPresets = [
        { min: 1500, max: 3000, label: { th: "1,500 – 3,000 ฿", en: "1,500 – 3,000 ฿" }, sub: { th: "เน้นประหยัด", en: "Budget friendly" } },
        { min: 3000, max: 5000, label: { th: "3,000 – 5,000 ฿", en: "3,000 – 5,000 ฿" }, sub: { th: "ยอดนิยม", en: "Popular" } },
        { min: 5000, max: 8000, label: { th: "5,000 – 8,000 ฿", en: "5,000 – 8,000 ฿" }, sub: { th: "หอหรู / แอร์", en: "Premium / AC" } },
        { min: 0, max: 15000, label: { th: "ยืดหยุ่น / ไม่จำกัดงบ", en: "Flexible / Any" }, sub: { th: "ตามตกลง", en: "Flexible" } },
      ];

      const currentMin = appState.profileDraft.budgetMin ?? 2500;
      const currentMax = appState.profileDraft.budgetMax ?? 4500;

      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#FEFCFA" }}>
          <ScrollView
            contentContainerStyle={basicsStyles.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Navigation / Header */}
            <View style={housingStyles.headerRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={housingStyles.backButton}
                onPress={() => go("basics")}
              >
                <Text style={housingStyles.backChevron}>←</Text>
              </Pressable>
              <Text style={housingStyles.headerTitle}>
                {language === "th" ? "หอพักและการศึกษา" : "Housing & Study"}
              </Text>
            </View>

            <Text style={basicsStyles.subtitle}>
              {language === "th"
                ? "เลือกข้อมูลหอพักที่ต้องการเพื่อช่วยจับคู่เพื่อนร่วมห้องที่ลงตัว"
                : "Set your housing and budget preferences to find the best match"}
            </Text>

            {/* Section 1: Academic Year */}
            <View style={housingStyles.sectionCard}>
              <Text style={housingStyles.sectionTitle}>
                🎓 {language === "th" ? "ชั้นปีการศึกษา" : "Academic Year"}
              </Text>
              <View style={housingStyles.yearGrid}>
                {[
                  { year: 1, label: { th: "ปี 1", en: "Year 1" } },
                  { year: 2, label: { th: "ปี 2", en: "Year 2" } },
                  { year: 3, label: { th: "ปี 3", en: "Year 3" } },
                  { year: 4, label: { th: "ปี 4+", en: "Year 4+" } },
                ].map((y) => {
                  const isSelected = appState.profileDraft.year === y.year;
                  return (
                    <Pressable
                      key={y.year}
                      style={[
                        housingStyles.yearChip,
                        isSelected && housingStyles.yearChipSelected,
                      ]}
                      onPress={() => set("year", y.year)}
                    >
                      <Text
                        style={[
                          housingStyles.yearText,
                          isSelected && housingStyles.yearTextSelected,
                        ]}
                      >
                        {y.label[language]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Section 2: Preferred Zone */}
            <View style={housingStyles.sectionCard}>
              <Text style={housingStyles.sectionTitle}>
                📍 {language === "th" ? "โซนหอพักที่ต้องการ" : "Preferred Zone"}
              </Text>
              <View style={housingStyles.zoneGrid}>
                {[
                  { id: "Gate 1", label: { th: "ประตู 1", en: "Gate 1" }, icon: "🚪" },
                  { id: "Gate 4", label: { th: "ประตู 4", en: "Gate 4" }, icon: "🛣" },
                  { id: "On Campus", label: { th: "ในมหาวิทยาลัย", en: "On Campus" }, icon: "🏫" },
                  { id: "Suranaree Rd.", label: { th: "ถนนสุรนารี", en: "Suranaree Rd." }, icon: "🏢" },
                ].map((z) => {
                  const isSelected = appState.profileDraft.zone === z.id;
                  return (
                    <Pressable
                      key={z.id}
                      style={[
                        housingStyles.zoneCard,
                        isSelected && housingStyles.zoneCardSelected,
                      ]}
                      onPress={() => set("zone", z.id)}
                    >
                      <Text style={housingStyles.zoneIcon}>{z.icon}</Text>
                      <Text
                        style={[
                          housingStyles.zoneLabel,
                          isSelected && housingStyles.zoneLabelSelected,
                        ]}
                      >
                        {z.label[language]}
                      </Text>
                      {isSelected ? <Text style={housingStyles.zoneBadge}>✓</Text> : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Section 3: Monthly Budget */}
            <View style={housingStyles.sectionCard}>
              <View style={housingStyles.sectionHeaderRow}>
                <Text style={housingStyles.sectionTitle}>
                  💰 {language === "th" ? "ช่วงงบประมาณต่อเดือน" : "Monthly Budget"}
                </Text>
                <Text style={housingStyles.budgetValueText}>
                  ฿{currentMin.toLocaleString()} – ฿{currentMax.toLocaleString()}
                </Text>
              </View>

              <View style={housingStyles.budgetGrid}>
                {budgetPresets.map((preset, idx) => {
                  const isSelected =
                    appState.profileDraft.budgetMin === preset.min &&
                    appState.profileDraft.budgetMax === preset.max;
                  return (
                    <Pressable
                      key={idx}
                      style={[
                        housingStyles.budgetChip,
                        isSelected && housingStyles.budgetChipSelected,
                      ]}
                      onPress={() => {
                        set("budgetMin", preset.min);
                        set("budgetMax", preset.max);
                      }}
                    >
                      <Text
                        style={[
                          housingStyles.budgetChipLabel,
                          isSelected && housingStyles.budgetChipLabelSelected,
                        ]}
                      >
                        {preset.label[language]}
                      </Text>
                      <Text
                        style={[
                          housingStyles.budgetChipSub,
                          isSelected && housingStyles.budgetChipSubSelected,
                        ]}
                      >
                        {preset.sub[language]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Save & Continue Button */}
            <Pressable style={basicsStyles.continueButton} onPress={proceed}>
              <Text style={basicsStyles.continueButtonText}>
                {language === "th" ? "บันทึกและไปต่อ ➔" : "Save & Continue ➔"}
              </Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FEFCFA" }}>
        <ScrollView
          contentContainerStyle={basicsStyles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Navigation / Header */}
          <View style={housingStyles.headerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={housingStyles.backButton}
              onPress={() => go(appState.profileDraft.completed ? "myprofile" : "authChoice")}
            >
              <ArrowLeft size={18} color="#463826" strokeWidth={2.2} />
            </Pressable>
            <Text style={housingStyles.headerTitle}>
              {language === "th" ? "เกี่ยวกับคุณ" : "About you"}
            </Text>
            <View style={{ width: 38 }} />
          </View>

          <Text style={basicsStyles.subtitle}>
            {language === "th" ? "ข้อมูลนี้จะแสดงบนการ์ดจับคู่ของคุณ" : "This appears on your match card"}
          </Text>

          {/* Photo slots */}
          <View style={basicsStyles.photoRow}>
            <Pressable style={basicsStyles.photoBoxMain} onPress={() => changePhoto(0)}>
              {formatImageUri(appState.profileDraft.photos[0]) ? (
                <Image source={{ uri: formatImageUri(appState.profileDraft.photos[0]) }} style={basicsStyles.photoImage} />
              ) : (
                <Text style={basicsStyles.avatarLetter}>
                  {(appState.profileDraft.displayName && appState.profileDraft.displayName[0]?.toUpperCase()) || "N"}
                </Text>
              )}
              <View style={basicsStyles.cameraBadge}>
                <Text style={basicsStyles.cameraText}>📷</Text>
              </View>
            </Pressable>

            <Pressable style={basicsStyles.photoBoxDashed} onPress={() => changePhoto(1)}>
              {formatImageUri(appState.profileDraft.photos[1]) ? (
                <Image source={{ uri: formatImageUri(appState.profileDraft.photos[1]) }} style={basicsStyles.photoImage} />
              ) : (
                <Text style={basicsStyles.plusIcon}>+</Text>
              )}
            </Pressable>

            <Pressable style={basicsStyles.photoBoxDashed} onPress={() => changePhoto(2)}>
              {formatImageUri(appState.profileDraft.photos[2]) ? (
                <Image source={{ uri: formatImageUri(appState.profileDraft.photos[2]) }} style={basicsStyles.photoImage} />
              ) : (
                <Text style={basicsStyles.plusIcon}>+</Text>
              )}
            </Pressable>

            <Text style={basicsStyles.photoText}>
              {language === "th" ? "1-3 รูปภาพ" : "1-3 photos"}
            </Text>
          </View>

          {/* Full Name & Age */}
          <View style={basicsStyles.row}>
            <View style={{ flex: 2.2 }}>
              <Text style={basicsStyles.fieldLabel}>{language === "th" ? "ชื่อ-นามสกุล" : "Full Name"}</Text>
              <TextInput
                value={appState.profileDraft.displayName}
                onChangeText={(v) => set("displayName", v)}
                placeholder={language === "th" ? "นภัส ศรีสวัสดิ์" : "Jedwadud Jadwaded"}
                placeholderTextColor="#BCAFA8"
                style={basicsStyles.fieldInput}
              />
            </View>
            <View style={{ flex: 0.9 }}>
              <Text style={basicsStyles.fieldLabel}>{language === "th" ? "อายุ" : "Age"}</Text>
              <TextInput
                value={appState.profileDraft.age}
                onChangeText={(v) => set("age", v)}
                placeholder="19"
                placeholderTextColor="#BCAFA8"
                keyboardType="numeric"
                maxLength={2}
                style={basicsStyles.fieldInput}
              />
            </View>
          </View>

          {/* Major & Gender */}
          <View style={basicsStyles.row}>
            <View style={{ flex: 1.4 }}>
              <Text style={basicsStyles.fieldLabel}>{language === "th" ? "สาขา" : "Major"}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose major"
                style={[basicsStyles.fieldInput, basicsStyles.dropdownInput]}
                onPress={() => {
                  setMajorSearch("");
                  setActiveModal("major");
                }}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    basicsStyles.dropdownText,
                    !appState.profileDraft.major && basicsStyles.dropdownPlaceholder,
                  ]}
                >
                  {appState.profileDraft.major || (language === "th" ? "เลือกสาขา" : "Select major")}
                </Text>
                <Text style={basicsStyles.dropdownChevron}>▾</Text>
              </Pressable>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={basicsStyles.fieldLabel}>{language === "th" ? "เพศ" : "Gender"}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose gender"
                style={[basicsStyles.fieldInput, basicsStyles.dropdownInput]}
                onPress={() => setActiveModal("gender")}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    basicsStyles.dropdownText,
                    !appState.profileDraft.gender && basicsStyles.dropdownPlaceholder,
                  ]}
                >
                  {appState.profileDraft.gender || (language === "th" ? "เลือกเพศ" : "Select gender")}
                </Text>
                <Text style={basicsStyles.dropdownChevron}>▾</Text>
              </Pressable>
            </View>
          </View>

          {/* Short Bio */}
          <View style={{ marginBottom: 20 }}>
            <Text style={basicsStyles.fieldLabel}>{language === "th" ? "แนะนำตัวสั้น ๆ" : "Short Bio"}</Text>
            <TextInput
              value={appState.profileDraft.bio}
              onChangeText={(v) => set("bio", v)}
              placeholder="-----------------"
              placeholderTextColor="#BCAFA8"
              multiline
              style={[basicsStyles.fieldInput, basicsStyles.fieldInputMultiline]}
            />
          </View>

          {/* Room Type */}
          <View style={basicsStyles.controlSection}>
            <Text style={basicsStyles.controlLabel}>{language === "th" ? "ประเภทห้อง" : "Room Type"}</Text>
            <View style={basicsStyles.segmentControl}>
              {roomTypeOptions.map((opt) => {
                const isSelected = appState.profileDraft.roomType?.toLowerCase() === opt.value.toLowerCase();
                return (
                  <Pressable
                    key={opt.value}
                    style={[
                      basicsStyles.segmentButton,
                      isSelected && basicsStyles.segmentButtonSelected,
                    ]}
                    onPress={() => set("roomType", opt.value)}
                  >
                    <Text
                      style={[
                        basicsStyles.segmentText,
                        isSelected && basicsStyles.segmentTextSelected,
                      ]}
                    >
                      {opt.label[language]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Roommate Gender Preference */}
          <View style={basicsStyles.controlSection}>
            <Text style={basicsStyles.controlLabel}>
              {language === "th" ? "เพศของรูมเมทที่ต้องการ" : "Roommate Gender Preference"}
            </Text>
            <View style={basicsStyles.genderRow}>
              {roommateGenderOptions.map((opt) => {
                const isSelected = appState.profileDraft.roommateGender?.toLowerCase() === opt.value.toLowerCase();
                return (
                  <Pressable
                    key={opt.value}
                    style={[
                      basicsStyles.genderButton,
                      isSelected && basicsStyles.genderButtonSelected,
                    ]}
                    onPress={() => set("roommateGender", opt.value)}
                  >
                    <Text
                      style={[
                        basicsStyles.genderText,
                        isSelected && basicsStyles.genderTextSelected,
                      ]}
                    >
                      {opt.label[language]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Continue button */}
          <Pressable style={basicsStyles.continueButton} onPress={proceed}>
            <Text style={basicsStyles.continueButtonText}>
              {language === "th" ? "ดำเนินการต่อ" : "Continue"}
            </Text>
          </Pressable>

          {/* Footer link */}
          <View style={basicsStyles.footer}>
            <Text style={basicsStyles.footerText}>
              {language === "th" ? "ยังไม่มีบัญชี? " : "New here? "}
            </Text>
            <Pressable onPress={() => go("signup")}>
              <Text style={basicsStyles.footerLink}>
                {language === "th" ? "สมัครสมาชิก" : "Sign Up"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Dropdown Selection Modal */}
        <Modal
          visible={activeModal !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setActiveModal(null)}
        >
          <Pressable
            style={dropdownStyles.modalBackdrop}
            onPress={() => setActiveModal(null)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={dropdownStyles.modalContainer}
            >
              <Pressable style={dropdownStyles.modalContent} onPress={(e) => e.stopPropagation()}>
                {/* Header */}
                <View style={dropdownStyles.modalHeader}>
                  <Text style={dropdownStyles.modalTitle}>
                    {activeModal === "gender"
                      ? language === "th" ? "เลือกเพศ" : "Select Gender"
                      : language === "th" ? "เลือกสาขาการศึกษา" : "Select Major"}
                  </Text>
                  <Pressable
                    style={dropdownStyles.closeButton}
                    onPress={() => setActiveModal(null)}
                  >
                    <Text style={dropdownStyles.closeText}>✕</Text>
                  </Pressable>
                </View>

                {/* Search Input for Major */}
                {activeModal === "major" ? (
                  <View style={dropdownStyles.searchContainer}>
                    <TextInput
                      value={majorSearch}
                      onChangeText={setMajorSearch}
                      placeholder={language === "th" ? "🔍 ค้นหาสาขา หรือพิมพ์สาขาของคุณ..." : "🔍 Search or type major..."}
                      placeholderTextColor="#A49A8E"
                      style={dropdownStyles.searchInput}
                    />
                  </View>
                ) : null}

                {/* Options List */}
                <ScrollView style={dropdownStyles.optionsList} showsVerticalScrollIndicator={false}>
                  {activeModal === "gender" ? (
                    <View style={dropdownStyles.listContainer}>
                      {genderOptions.map((opt) => {
                        const isSelected = appState.profileDraft.gender === opt.value;
                        return (
                          <Pressable
                            key={opt.value}
                            style={[
                              dropdownStyles.listItem,
                              isSelected && dropdownStyles.itemSelected,
                            ]}
                            onPress={() => {
                              set("gender", opt.value);
                              setActiveModal(null);
                            }}
                          >
                            <Text
                              style={[
                                dropdownStyles.itemText,
                                isSelected && dropdownStyles.itemTextSelected,
                              ]}
                            >
                              {opt.label[language]}
                            </Text>
                            {isSelected ? <Text style={dropdownStyles.checkMark}>✓</Text> : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={dropdownStyles.listContainer}>
                      {majorSearch.trim() ? (
                        <Pressable
                          style={[dropdownStyles.listItem, dropdownStyles.customItem]}
                          onPress={() => {
                            set("major", majorSearch.trim());
                            setActiveModal(null);
                          }}
                        >
                          <Text style={dropdownStyles.customItemText}>
                            ➕ {language === "th" ? `ใช้สาขา "${majorSearch.trim()}"` : `Use "${majorSearch.trim()}"`}
                          </Text>
                        </Pressable>
                      ) : null}

                      {majorOptions
                        .filter((opt) => {
                          if (!majorSearch.trim()) return true;
                          const q = majorSearch.toLowerCase();
                          return (
                            opt.label.th.toLowerCase().includes(q) ||
                            opt.label.en.toLowerCase().includes(q)
                          );
                        })
                        .map((opt) => {
                          const isSelected = appState.profileDraft.major === opt.value;
                          return (
                            <Pressable
                              key={opt.value}
                              style={[
                                dropdownStyles.listItem,
                                isSelected && dropdownStyles.itemSelected,
                              ]}
                              onPress={() => {
                                set("major", opt.value);
                                setActiveModal(null);
                              }}
                            >
                              <Text
                                style={[
                                  dropdownStyles.itemText,
                                  isSelected && dropdownStyles.itemTextSelected,
                                ]}
                              >
                                {opt.label[language]}
                              </Text>
                              {isSelected ? <Text style={dropdownStyles.checkMark}>✓</Text> : null}
                            </Pressable>
                          );
                        })}
                    </View>
                  )}
                </ScrollView>
              </Pressable>
            </KeyboardAvoidingView>
          </Pressable>
        </Modal>
      </SafeAreaView>
    );
  };

  return renderContent();
}

const dropdownStyles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
    maxHeight: "80%",
  },
  modalContent: {
    backgroundColor: "#FFFDFC",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    maxHeight: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE8E1",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#463826",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F4ECE4",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 14,
    color: "#7F232D",
    fontWeight: "600",
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: "#FAF6F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: "#EADCD3",
    fontSize: 14,
    color: "#463826",
  },
  optionsList: {
    maxHeight: 340,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingVertical: 8,
  },
  ageChip: {
    width: 58,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FAF6F0",
    borderWidth: 1,
    borderColor: "#EADCD3",
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    backgroundColor: "#C64338",
    borderColor: "#C64338",
  },
  ageChipText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#463826",
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
  listContainer: {
    gap: 6,
    paddingVertical: 4,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "#FAF6F0",
    borderWidth: 1,
    borderColor: "transparent",
  },
  itemSelected: {
    backgroundColor: "#FFF0BB",
    borderColor: "#FFD477",
  },
  itemText: {
    fontSize: 15,
    color: "#463826",
    fontWeight: "500",
  },
  itemTextSelected: {
    fontWeight: "700",
    color: "#7F232D",
  },
  checkMark: {
    fontSize: 16,
    color: "#C64338",
    fontWeight: "bold",
  },
  customItem: {
    backgroundColor: "#FEEAE6",
    borderColor: "#F0CDBF",
  },
  customItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#C64338",
  },
});

const housingStyles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FAF6F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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
    marginBottom: 12,
  },
  yearGrid: {
    flexDirection: "row",
    gap: 8,
  },
  yearChip: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EADCD3",
    alignItems: "center",
    justifyContent: "center",
  },
  yearChipSelected: {
    backgroundColor: "#C64338",
    borderColor: "#C64338",
  },
  yearText: {
    fontFamily: serifFont,
    fontSize: 14,
    fontWeight: "600",
    color: "#463826",
  },
  yearTextSelected: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  zoneGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  zoneCard: {
    width: "48%",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EADCD3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
  },
  zoneCardSelected: {
    backgroundColor: "#FFF0BB",
    borderColor: "#FFD477",
  },
  zoneIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  zoneLabel: {
    fontFamily: serifFont,
    fontSize: 13,
    fontWeight: "600",
    color: "#463826",
    flex: 1,
  },
  zoneLabelSelected: {
    fontWeight: "bold",
    color: "#7F232D",
  },
  zoneBadge: {
    position: "absolute",
    top: 6,
    right: 8,
    fontSize: 13,
    color: "#C64338",
    fontWeight: "bold",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  budgetValueText: {
    fontFamily: serifFont,
    fontSize: 14,
    fontWeight: "bold",
    color: "#C64338",
  },
  budgetGrid: {
    gap: 8,
  },
  budgetChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  budgetChipSelected: {
    backgroundColor: "#FFF0BB",
    borderColor: "#FFD477",
  },
  budgetChipLabel: {
    fontFamily: serifFont,
    fontSize: 14,
    fontWeight: "600",
    color: "#463826",
  },
  budgetChipLabelSelected: {
    fontWeight: "bold",
    color: "#7F232D",
  },
  budgetChipSub: {
    fontFamily: serifFont,
    fontSize: 12,
    color: "#8D7C75",
  },
  budgetChipSubSelected: {
    color: "#C64338",
    fontWeight: "bold",
  },
});

