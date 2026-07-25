import { useEffect, useState } from "react";
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
import { api, appState } from "../services/api";
import { C } from "../theme/colors";
import { s } from "../theme/styles";
import type { AuthenticatedUser, ProfileDraft } from "../types/models";
import type { Screen } from "../types/navigation";

WebBrowser.maybeCompleteAuthSession();

const serif = Platform.select({ ios: "Georgia", default: "serif" });

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
          placeholderTextColor="#9D9187"
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
  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const googleAndroidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const [googleRequest, googleResponse, promptGoogleAsync] =
    Google.useIdTokenAuthRequest({
      webClientId: googleWebClientId,
      androidClientId: googleAndroidClientId ?? googleWebClientId,
      iosClientId: googleIosClientId ?? googleWebClientId,
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
    <Pressable onPress={() => go(screen)} style={auth.footerLink}>
      <Text style={auth.footerMuted}>
        {prompt} <Text style={auth.footerAccent}>{action}</Text>
      </Text>
    </Pressable>
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
              <Text style={auth.forgotHeaderTitle}>Reset password</Text>
            </View>

            <View style={auth.resetHero}>
              <Animated.View style={[auth.lockTile, emblemStyle]}>
                <View style={auth.lockShackle} />
                <View style={auth.lockBody}>
                  <View style={auth.lockKeyhole} />
                </View>
              </Animated.View>
              <Text style={auth.resetTitle}>Reset your password</Text>
              <Text style={auth.resetDescription}>
                Enter your SUT email and we’ll send you a{"\n"}
                secure reset link. It expires in 15 minutes.
              </Text>
            </View>

            <AuthField
              label="SUT Email or ID"
              placeholder="Enter your SUT email or OTP"
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
                        ? "Sending..."
                        : "Send OTP"}
                  </Text>
                </Pressable>
              }
            />

            <AuthField
              label="Enter OTP"
              placeholder="Enter OTP"
              value={otp}
              onChangeText={setOtp}
              action={
                <Pressable style={auth.inlineButton}>
                  <Text style={auth.inlineButtonText}>Submit</Text>
                </Pressable>
              }
            />

            {error ? <Text style={auth.error}>{error}</Text> : null}
            <AuthButton onPress={() => go("login")}>Continue</AuthButton>

            <View style={auth.resendCard}>
              <Text style={auth.mailIcon}>✉</Text>
              <Text style={auth.resendText}>
                Didn’t get it? Check spam, or resend in{" "}
                {otpSent ? `0:${String(countdown).padStart(2, "0")}` : "0:00"}
              </Text>
            </View>

            {footer("Remembered it?", "Back to Log In", "login")}
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
                {login ? "Welcome back" : "Create account"}
              </Text>
              <Text style={auth.subtitle}>
                {login
                  ? "Log in to keep matching"
                  : "Only SUT students can join"}
              </Text>
            </View>
          </View>

          {!login ? (
            <>
              <AuthField
                label="First name"
                placeholder="Enter your first name"
                value={firstName}
                onChangeText={setFirstName}
              />
              <AuthField
                label="Last name"
                placeholder="Enter your last name"
                value={lastName}
                onChangeText={setLastName}
              />
            </>
          ) : null}

          <AuthField
            label="SUT ID"
            placeholder="B67xxxxx"
            value={sutId}
            onChangeText={setSutId}
          />
          <AuthField
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secure
          />

          {!login ? (
            <>
              <View style={auth.passwordStrength}>
                <View style={[auth.strengthBar, { backgroundColor: "#E42D2D" }]} />
                <View style={[auth.strengthBar, { backgroundColor: "#FFA800" }]} />
                <View style={[auth.strengthBar, { backgroundColor: "#4AAF55" }]} />
                <Text style={auth.perfect}>Perfect</Text>
              </View>
              <AuthField
                label="Confirm password"
                placeholder="Confirm your password"
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
                <Text style={auth.optionText}>Remember me</Text>
              </Pressable>
              <Pressable onPress={() => go("forgot")}>
                <Text style={auth.forgotLink}>Forgot password?</Text>
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
                I agree to the <Text style={auth.termsLink}>Terms</Text> and{" "}
                <Text style={auth.termsLink}>Privacy Policy</Text>, and confirm
                {"\n"}I’m a current SUT student.
              </Text>
            </Pressable>
          )}

          {error ? <Text style={auth.error}>{error}</Text> : null}
          <AuthButton onPress={submitAuth} disabled={busy}>
            {busy ? "Please wait..." : "Continue"}
          </AuthButton>

          {login ? (
            <>
              <View style={auth.divider}>
                <View style={auth.dividerLine} />
                <Text style={auth.dividerText}>or continue with</Text>
                <View style={auth.dividerLine} />
              </View>
              <View style={auth.socialRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Google"
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
                    {googleBusy ? "Signing in..." : "Google"}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : null}

          {footer(
            login ? "New here?" : "Already have an account?",
            login ? "Sign Up" : "Log in",
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
    color: "#8E8176",
    fontFamily: serif,
    fontSize: 15,
    marginTop: 2,
  },
  fieldGroup: { marginBottom: 10 },
  fieldLabel: {
    color: "#91857B",
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
    color: "#4C4035",
    fontFamily: serif,
    fontSize: 12,
    paddingVertical: 0,
  },
  eye: { color: "#80715F", fontSize: 18, paddingHorizontal: 8 },
  passwordStrength: {
    height: 12,
    marginTop: -4,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  strengthBar: { height: 4, flex: 1, borderRadius: 3 },
  perfect: {
    width: 49,
    color: "#378B3B",
    fontFamily: serif,
    fontSize: 11,
    textAlign: "right",
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
  termsLink: { color: "#C72F2F" },
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
  },
  footerMuted: { color: "#AA9A8E", fontFamily: serif, fontSize: 11 },
  footerAccent: { color: "#C62828", fontWeight: "700" },
  loginOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 1,
    marginBottom: 39,
    paddingHorizontal: 4,
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  optionText: { color: "#A39488", fontFamily: serif, fontSize: 11 },
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
  dividerText: { color: "#A6988C", fontFamily: serif, fontSize: 11 },
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
    color: "#75695F",
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
    color: "#8D8075",
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
    color: "#C95D5A",
    fontFamily: serif,
    fontSize: 11,
  },
});

export function Verify({ go }: { go: (x: Screen) => void }) {
  const [document, setDocument] = useState<string | null>(null);
  const choose = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.65,
      base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setDocument(
        asset.base64
          ? `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`
          : asset.uri,
      );
    }
  };
  const submit = async () => {
    if (!document)
      return Alert.alert("Student ID", "Please choose a photo first.");
    try {
      await api("/api/verification", {
        method: "POST",
        body: JSON.stringify({ documentUrl: document }),
      });
      go("basics");
    } catch (e) {
      Alert.alert(
        "Unable to submit",
        e instanceof Error ? e.message : "Please try again",
      );
    }
  };
  return (
    <ScreenShell>
      <Header title="Verify your student ID" back={() => go("signup")} />
      <Text style={s.centerMuted}>Required before you can match</Text>
      <View style={s.upload}>
        <Text style={{ fontSize: 30 }}>▣</Text>
        <Text style={s.title}>
          {document ? "SUT ID selected" : "Upload your SUT ID card"}
        </Text>
        <Text style={s.muted}>JPG or PNG · both sides · max 10 MB</Text>
        <View style={{ width: 160, marginTop: 15 }}>
          <Button outline onPress={choose}>
            Choose Photo
          </Button>
        </View>
      </View>
      <Card>
        <Text style={s.title}>Verification status</Text>
        <Chip active>{document ? "Ready to submit" : "Pending upload"}</Chip>
        <View style={s.verifySteps}>
          <Text style={{ color: document ? C.green : C.muted }}>
            ● Uploaded
          </Text>
          <Text style={{ color: C.amber }}>● Admin review</Text>
          <Text style={s.muted}>● Verified</Text>
        </View>
      </Card>
      <Text style={s.note}>
        ♧ Your ID is used only for verification and is deleted after approval.
      </Text>
      <Button tone="wine" onPress={submit}>
        Submit for Review
      </Button>
    </ScreenShell>
  );
}

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
        title={housing ? "Housing & Education" : "About you"}
        back={() => go(housing ? "basics" : "verify")}
      />
      <Text style={s.muted}>
        {housing
          ? "More details to help us match you"
          : "This appears on your match card"}
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
                label="FULL NAME"
                placeholder="Napat Srisawat"
                value={appState.profileDraft.displayName}
                onChangeText={(v) => set("displayName", v)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="AGE"
                placeholder="19"
                value={appState.profileDraft.age}
                onChangeText={(v) => set("age", v)}
              />
            </View>
          </View>
          <View style={s.two}>
            <View style={{ flex: 1 }}>
              <Field
                label="MAJOR"
                placeholder="Computer Eng."
                value={appState.profileDraft.major}
                onChangeText={(v) => set("major", v)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="GENDER"
                placeholder="Male"
                value={appState.profileDraft.gender}
                onChangeText={(v) => set("gender", v)}
              />
            </View>
          </View>
          <Field
            label="SHORT BIO"
            placeholder="Coffee-powered CS student. Quiet on weekdays, board games on weekends ✌"
            value={appState.profileDraft.bio}
            onChangeText={(v) => set("bio", v)}
          />
          <Text style={s.label}>ROOM TYPE</Text>
          <View style={s.segment}>
            {["Single", "Double", "Either"].map((x) => (
              <Chip
                key={x}
                active={appState.profileDraft.roomType === x}
                onPress={() => set("roomType", x)}
              >
                {x}
              </Chip>
            ))}
          </View>
          <Text style={s.label}>ROOMMATE GENDER PREFERENCE</Text>
          <View style={s.wrap}>
            {["Same gender", "Any", "Non-binary friendly"].map((x) => (
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
          <Text style={s.label}>YEAR</Text>
          <View style={s.segment}>
            {[1, 2, 3, 4].map((x) => (
              <Chip
                key={x}
                active={appState.profileDraft.year === x}
                onPress={() => set("year", x)}
              >{`Year ${x === 4 ? "4+" : x}`}</Chip>
            ))}
          </View>
          <Text style={s.label}>PREFERRED ZONE (LOCATION)</Text>
          <View style={s.wrap}>
            {["Gate 1", "Gate 4", "In-campus", "Suranaree Road"].map((x) => (
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
        {housing ? "Save & Continue" : "Continue"}
      </Button>
    </ScreenShell>
  );
}

