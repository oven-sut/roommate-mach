import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff } from "lucide-react-native";
import { useI18n } from "../../i18n";
import { api } from "../../services/api";
import { Checkbox } from "../../components/Toggle";
import {
  Button,
  Field,
  LogoTile,
  MotionPressable,
  Txt,
} from "../../components/ui";
import { C } from "../../theme/colors";
import { GUTTER, MAX_WIDTH, s } from "../../theme/styles";
import { F } from "../../theme/typography";
import type { AuthenticatedUser } from "../../types/models";
import type { Screen } from "../../types/navigation";
import { getPasswordStrength } from "./password-strength";
import { sutIdToEmail } from "./sut-id";

/** Deep link Google returns to after the OAuth round trip. */
const googleRedirectUri = makeRedirectUri({
  native: "com.ovensut.roommatemach:/oauthredirect",
});

/** Eye toggle rendered inside password fields. */
function RevealToggle({
  hidden,
  onToggle,
}: {
  hidden: boolean;
  onToggle: () => void;
}) {
  const Icon = hidden ? EyeOff : Eye;
  return (
    <MotionPressable
      onPress={onToggle}
      pressedScale={0.85}
      hitSlop={10}
      accessibilityLabel={hidden ? "Show password" : "Hide password"}
    >
      <Icon size={21} color={C.muted} strokeWidth={1.8} />
    </MotionPressable>
  );
}

/**
 * Three-segment password meter. The design fills red → amber → green as the
 * score climbs, with the verdict spelled out beside it.
 */
function StrengthMeter({
  score,
  label,
  color,
  hint,
}: {
  score: number;
  label: string;
  color: string;
  hint: string;
}) {
  const filled = score >= 5 ? 3 : score >= 4 ? 2 : score >= 2 ? 1 : 0;
  const segmentColors = ["#C93A32", "#E9B23C", "#3FA45C"];

  return (
    <View style={{ gap: 8 }}>
      <View style={[s.row, { gap: 8 }]}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 3,
              backgroundColor: i < filled ? segmentColors[i] : "#EADFD4",
            }}
          />
        ))}
        <Txt style={{ fontFamily: F.bold, fontSize: 13, color }}>{label}</Txt>
      </View>
      <Txt role="tiny">{hint}</Txt>
    </View>
  );
}

/**
 * Login and sign-up. The design labels the identity field "SUT ID"; the
 * backend authenticates on email, so the entered ID is expanded to
 * `<id>@g.sut.ac.th` before it leaves the screen (a full address typed in is
 * passed through untouched).
 */
export function Auth({
  mode,
  go,
  onAuth,
}: {
  mode: "login" | "signup";
  go: (x: Screen) => void;
  onAuth: (
    token: string,
    user: AuthenticatedUser,
    remember?: boolean,
  ) => void;
}) {
  const { t } = useI18n();
  const login = mode === "login";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sutId, setSutId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");
  const [emailTaken, setEmailTaken] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const entrance = useRef(new Animated.Value(0)).current;
  const strength = useMemo(
    () => getPasswordStrength(password, t),
    [password, t],
  );
  const email = sutIdToEmail(sutId);

  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  // EAS does not upload the gitignored local .env file. The provider hook
  // requires a non-empty client ID during render, so keep the screen alive and
  // let signInWithGoogle surface the configuration message instead.
  const fallbackClientId = "google-sign-in-not-configured";
  const [googleRequest, googleResponse, promptGoogleAsync] =
    Google.useIdTokenAuthRequest({
      webClientId: googleWebClientId ?? fallbackClientId,
      androidClientId:
        googleAndroidClientId ?? googleWebClientId ?? fallbackClientId,
      iosClientId: googleIosClientId ?? googleWebClientId ?? fallbackClientId,
      redirectUri: googleRedirectUri,
      selectAccount: true,
    });

  useEffect(() => {
    entrance.setValue(0);
    Animated.timing(entrance, {
      toValue: 1,
      duration: 460,
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
      googleResponse.authentication?.idToken ?? googleResponse.params.id_token;
    if (!idToken) {
      setGoogleBusy(false);
      setError("Google did not return an identity token");
      return;
    }

    api<{ access_token: string; user: AuthenticatedUser }>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    })
      .then((result) => onAuth(result.access_token, result.user, true))
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to sign in with Google",
        ),
      )
      .finally(() => setGoogleBusy(false));
  }, [googleResponse, onAuth]);

  /** Debounced availability check so the user is not told at submit time. */
  useEffect(() => {
    if (mode !== "signup" || !sutId.trim()) {
      setEmailTaken(false);
      return;
    }
    const target = sutIdToEmail(sutId);
    const timer = setTimeout(async () => {
      try {
        setCheckingEmail(true);
        const result = await api<{ exists: boolean }>(
          `/auth/check-email?email=${encodeURIComponent(target)}`,
        );
        setEmailTaken(result.exists);
      } catch {
        // A failed lookup is not worth interrupting the form for; submit will
        // surface the conflict if there is one.
      } finally {
        setCheckingEmail(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [sutId, mode]);

  const signInWithGoogle = async () => {
    const platformClientId = Platform.select({
      ios: googleIosClientId ?? googleWebClientId,
      android: googleAndroidClientId ?? googleWebClientId,
      default: googleWebClientId,
    });

    if (!platformClientId) {
      setError("Google sign-in is not configured. Add a Google client ID to .env.");
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
        reason instanceof Error ? reason.message : "Unable to open Google sign-in",
      );
    }
  };

  const submit = async () => {
    try {
      setBusy(true);
      setError("");
      if (!sutId.trim()) throw new Error("Please enter your SUT ID");
      if (!password) throw new Error("Please enter your password");
      if (!login) {
        if (emailTaken) throw new Error("This SUT ID is already registered");
        if (strength.score < 2) throw new Error("Please use a stronger password");
        if (password !== confirm) throw new Error("Passwords do not match");
        if (!accepted)
          throw new Error("Please accept the Terms and Privacy Policy");
      }

      const result = await api<{
        access_token: string;
        user: AuthenticatedUser;
      }>(`/auth/${login ? "login" : "register"}`, {
        method: "POST",
        body: JSON.stringify(
          login
            ? { email, password }
            : {
                displayName: `${firstName} ${lastName}`.trim(),
                email,
                password,
                sutId: sutId.trim(),
              },
        ),
      });
      // Signing up always persists; only the login form offers the choice.
      onAuth(result.access_token, result.user, login ? remember : true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to continue");
    } finally {
      setBusy(false);
    }
  };

  const entranceStyle = {
    opacity: entrance,
    transform: [
      {
        translateY: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
    ],
  };

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
            paddingTop: 26,
            paddingBottom: 32,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[{ gap: 18 }, entranceStyle]}>
            <View style={[s.row, { gap: 16, marginBottom: 8 }]}>
              <LogoTile size={56} radius={17} />
              <View style={{ flex: 1 }}>
                <Txt role="h1">
                  {login ? t("welcomeBack") : t("createAccount")}
                </Txt>
                <Txt role="subtitle">
                  {login ? t("loginSub") : t("signupSub")}
                </Txt>
              </View>
            </View>

            {!login ? (
              <>
                <Field
                  label={t("firstName")}
                  placeholder={t("enterFirstName")}
                  value={firstName}
                  onChangeText={setFirstName}
                />
                <Field
                  label={t("lastName")}
                  placeholder={t("enterLastName")}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </>
            ) : null}

            <Field
              label={t("sutId")}
              placeholder={t("sutIdHint")}
              value={sutId}
              onChangeText={setSutId}
              autoCapitalize="none"
              error={
                !login && emailTaken
                  ? "This SUT ID is already registered"
                  : undefined
              }
            />
            {!login && checkingEmail ? <Txt role="tiny">…</Txt> : null}

            <Field
              label={t("password")}
              placeholder={t("enterPassword")}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              right={
                <RevealToggle
                  hidden={!showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
              }
            />

            {!login ? (
              <>
                <StrengthMeter
                  score={strength.score}
                  label={strength.label}
                  color={strength.color}
                  hint={strength.hint}
                />
                <Field
                  label={t("confirmPassword")}
                  placeholder={t("confirmYourPassword")}
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  right={
                    <RevealToggle
                      hidden={!showConfirm}
                      onToggle={() => setShowConfirm((v) => !v)}
                    />
                  }
                />
              </>
            ) : null}

            {login ? (
              <View style={[s.rowBetween, { marginTop: 4 }]}>
                <View style={[s.row, { gap: 12 }]}>
                  <Checkbox
                    value={remember}
                    onChange={setRemember}
                    accessibilityLabel={t("rememberMe")}
                  />
                  <Txt role="body" style={{ color: C.muted }}>
                    {t("rememberMe")}
                  </Txt>
                </View>
                <MotionPressable onPress={() => go("forgot")} hitSlop={10}>
                  <Txt role="link">{t("forgotPassword")}</Txt>
                </MotionPressable>
              </View>
            ) : (
              <View style={[s.row, { gap: 12, alignItems: "flex-start" }]}>
                <Checkbox value={accepted} onChange={setAccepted} />
                <Txt role="small" style={{ flex: 1, color: C.muted }}>
                  {t("termsAgreePrefix")}{" "}
                  <Txt
                    role="small"
                    style={{ color: C.primary, fontFamily: F.bold }}
                    onPress={() => go("terms")}
                  >
                    {t("terms")}
                  </Txt>{" "}
                  {t("and")}{" "}
                  <Txt
                    role="small"
                    style={{ color: C.primary, fontFamily: F.bold }}
                    onPress={() => go("privacy")}
                  >
                    {t("privacyPolicy")}
                  </Txt>
                  , {t("sutConfirm")}
                </Txt>
              </View>
            )}

            {error ? (
              <View
                style={{
                  backgroundColor: C.pink,
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <Txt role="small" style={{ color: C.primaryDark }}>
                  {error}
                </Txt>
              </View>
            ) : null}

            <Button onPress={submit} loading={busy} style={{ marginTop: 8 }}>
              {busy ? t("pleaseWait") : t("continue")}
            </Button>

            {login ? (
              <>
                <View style={[s.row, { gap: 14, marginVertical: 10 }]}>
                  <View style={[s.divider, { flex: 1 }]} />
                  <Txt role="small">{t("orContinueWith")}</Txt>
                  <View style={[s.divider, { flex: 1 }]} />
                </View>

                <MotionPressable
                  accessibilityRole="button"
                  accessibilityLabel={t("continueGoogle")}
                  disabled={!googleRequest || googleBusy}
                  onPress={signInWithGoogle}
                  style={{
                    alignSelf: "center",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingHorizontal: 34,
                    height: 54,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: C.lineStrong,
                    backgroundColor: C.card,
                  }}
                >
                  <Txt style={{ fontFamily: F.bold, fontSize: 19, color: C.ink }}>
                    G
                  </Txt>
                  <Txt role="h3">{googleBusy ? t("pleaseWait") : "Google"}</Txt>
                </MotionPressable>
              </>
            ) : null}

            <View style={{ flex: 1, minHeight: 30 }} />

            <View
              style={[s.row, { justifyContent: "center", gap: 6, marginTop: 20 }]}
            >
              <Txt role="small">
                {login ? t("newHere") : t("alreadyAccount")}
              </Txt>
              <MotionPressable
                onPress={() => go(login ? "signup" : "login")}
                hitSlop={8}
              >
                <Txt role="link">{login ? t("signUp") : t("logInAction")}</Txt>
              </MotionPressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
