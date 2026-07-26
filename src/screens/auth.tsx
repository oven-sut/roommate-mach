import { useEffect, useMemo, useState } from "react";
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
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRef } from "react";
import { Button, Card, Chip, Field, Header, ScreenShell } from "../components/ui";
import { useI18n } from "../i18n";
import { api, appState } from "../services/api";
import { s } from "../theme/styles";
import type { AuthenticatedUser, ProfileDraft } from "../types/models";
import type { Screen } from "../types/navigation";

WebBrowser.maybeCompleteAuthSession();

const serif = "NotoSansThai_400Regular";
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

  const email = sutId.includes("@") ? sutId : `${sutId}@g.sut.ac.th`;

  const submitAuth = async () => {
    try {
      setBusy(true);
      setError("");
      if (!sutId.trim()) throw new Error("Please enter your SUT ID");
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
      await api("/auth/forgot-password", {
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
                Enter your SUT email and we’ll send you a{"\n"}
                secure reset link. It expires in 15 minutes.
              </Text>
            </View>

            <AuthField
              label="อีเมล SUT หรือรหัสนักศึกษา"
              placeholder="กรอกอีเมล SUT หรือ OTP"
              value={sutId}
              onChangeText={setSutId}
              action={
                <Pressable
                  onPress={sendOtp}
                  disabled={busy || countdown > 0}
                  style={auth.inlineButton}
                >
                  <Text style={auth.inlineButtonText}>
                    {countdown > 0
                      ? `Send OTP\n(1.3 s)     in 0:${String(countdown).padStart(2, "0")}`
                      : busy
                        ? "กำลังส่ง..."
                        : "ส่ง OTP"}
                  </Text>
                </Pressable>
              }
            />

            <AuthField
              label="กรอก OTP"
              placeholder="กรอก OTP"
              value={otp}
              onChangeText={setOtp}
              action={
                <Pressable style={auth.inlineButton}>
                  <Text style={auth.inlineButtonText}>ส่ง</Text>
                </Pressable>
              }
            />

            {error ? <Text style={auth.error}>{error}</Text> : null}
            <AuthButton onPress={() => go("login")}>ดำเนินการต่อ</AuthButton>

            <View style={auth.resendCard}>
              <Text style={auth.mailIcon}>✉</Text>
              <Text style={auth.resendText}>
                Didn’t get it? Check spam, or resend in{" "}
                {otpSent ? `0:${String(countdown).padStart(2, "0")}` : "0:00"}
              </Text>
            </View>

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
  const [, rerender] = useState(0);
  const set = <K extends keyof ProfileDraft>(
    key: K,
    value: ProfileDraft[K],
  ) => {
    appState.profileDraft[key] = value;
    rerender((x) => x + 1);
  };
  const addPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.65,
      base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const value = asset.base64
        ? `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`
        : asset.uri;
      set("photos", [...appState.profileDraft.photos, value].slice(0, 3));
    }
  };
  const proceed = async () => {
    if (!housing) {
      if (appState.profileDraft.displayName)
        await api("/api/me", {
          method: "PATCH",
          body: JSON.stringify({ displayName: appState.profileDraft.displayName }),
        });
      go("housing");
      return;
    }
    try {
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          ...appState.profileDraft,
          age: Number(appState.profileDraft.age) || null,
          completed: false,
        }),
      });
      go("intro");
    } catch (e) {
      Alert.alert("Profile", e instanceof Error ? e.message : "Unable to save");
    }
  };
  return (
    <ScreenShell>
      <Header
        title={housing ? "หอพักและการศึกษา" : "เกี่ยวกับคุณ"}
        back={() => go(housing ? "basics" : "verify")}
      />
      <Text style={s.muted}>
        {housing
          ? "ข้อมูลเพิ่มเติมเพื่อช่วยให้ระบบจับคู่ได้แม่นขึ้น"
          : "ข้อมูลนี้จะแสดงบนการ์ดจับคู่ของคุณ"}
      </Text>
      {!housing ? (
        <>
          <View style={s.photos}>
            <View style={s.photoMain}>
              {appState.profileDraft.photos[0] ? (
                <Image
                  source={{ uri: appState.profileDraft.photos[0] }}
                  style={s.photoImage}
                />
              ) : (
                <Text style={s.avatarLetter}>N</Text>
              )}
            </View>
            <Pressable style={s.photoAdd} onPress={addPhoto}>
              {appState.profileDraft.photos[1] ? (
                <Image
                  source={{ uri: appState.profileDraft.photos[1] }}
                  style={s.photoImage}
                />
              ) : (
                <Text>＋</Text>
              )}
            </Pressable>
            <Pressable style={s.photoAdd} onPress={addPhoto}>
              {appState.profileDraft.photos[2] ? (
                <Image
                  source={{ uri: appState.profileDraft.photos[2] }}
                  style={s.photoImage}
                />
              ) : (
                <Text>＋</Text>
              )}
            </Pressable>
          </View>
          <View style={s.two}>
            <View style={{ flex: 2 }}>
              <Field
                label="ชื่อ-นามสกุล"
                placeholder="นภัส ศรีสวัสดิ์"
                value={appState.profileDraft.displayName}
                onChangeText={(v) => set("displayName", v)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="อายุ"
                placeholder="19"
                value={appState.profileDraft.age}
                onChangeText={(v) => set("age", v)}
              />
            </View>
          </View>
          <View style={s.two}>
            <View style={{ flex: 1 }}>
              <Field
                label="สาขา"
                placeholder="วิศวกรรมคอมพิวเตอร์"
                value={appState.profileDraft.major}
                onChangeText={(v) => set("major", v)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="เพศ"
                placeholder="ชาย"
                value={appState.profileDraft.gender}
                onChangeText={(v) => set("gender", v)}
              />
            </View>
          </View>
          <Field
            label="แนะนำตัวสั้น ๆ"
            placeholder="Coffee-powered CS student. Quiet on weekdays, board games on weekends ✌"
            value={appState.profileDraft.bio}
            onChangeText={(v) => set("bio", v)}
          />
          <Text style={s.label}>ประเภทห้อง</Text>
          <View style={s.segment}>
            {["ห้องเดี่ยว", "ห้องคู่", "แบบไหนก็ได้"].map((x) => (
              <Chip
                key={x}
                active={appState.profileDraft.roomType === x}
                onPress={() => set("roomType", x)}
              >
                {x}
              </Chip>
            ))}
          </View>
          <Text style={s.label}>เพศของรูมเมทที่ต้องการ</Text>
          <View style={s.wrap}>
            {["เพศเดียวกัน", "ได้ทุกเพศ", "ยินดีรับ Non-binary"].map((x) => (
              <Chip
                key={x}
                active={appState.profileDraft.roommateGender === x}
                onPress={() => set("roommateGender", x)}
              >
                {x}
              </Chip>
            ))}
          </View>
        </>
      ) : (
        <>
          <Text style={s.label}>ชั้นปี</Text>
          <View style={s.segment}>
            {[1, 2, 3, 4].map((x) => (
              <Chip
                key={x}
                active={appState.profileDraft.year === x}
                onPress={() => set("year", x)}
              >{`ปี ${x === 4 ? "4+" : x}`}</Chip>
            ))}
          </View>
          <Text style={s.label}>โซนที่ต้องการ</Text>
          <View style={s.wrap}>
            {["ประตู 1", "ประตู 4", "ในมหาวิทยาลัย", "ถนนสุรนารี"].map((x) => (
              <Chip
                key={x}
                active={appState.profileDraft.zone === x}
                onPress={() => set("zone", x)}
              >
                {x}
              </Chip>
            ))}
          </View>
          <Text style={s.label}>BUDGET (฿ / MONTH)</Text>
          <Card>
            <Text style={s.link}>2,500 – 4,500</Text>
            <View style={s.slider}>
              <View style={s.sliderOn} />
            </View>
          </Card>
        </>
      )}
      <Button onPress={proceed}>
        {housing ? "บันทึกและไปต่อ" : "ดำเนินการต่อ"}
      </Button>
    </ScreenShell>
  );
}

