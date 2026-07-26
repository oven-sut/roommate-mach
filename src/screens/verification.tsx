import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "../i18n";
import { api } from "../services/api";
import type { Screen } from "../types/navigation";

type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";
type VerificationPhase =
  | "idle"
  | "selected"
  | "pending"
  | "reviewPassed"
  | "verified";
type StepState = "done" | "active" | "todo";

type MeResponse = {
  verification?: {
    status?: VerificationStatus;
  } | null;
};

const serif = "NotoSansThai_400Regular";

const palette = {
  background: "#FFFDFC",
  card: "#FFFFFF",
  hero: "#FFFCF3",
  ink: "#463826",
  muted: "#A49A8E",
  red: "#C64338",
  wine: "#B53C3C",
  deepWine: "#7F232D",
  peach: "#F1CFC1",
  peachButton: "#F0CDBF",
  green: "#5BBB61",
  paleGreen: "#D1EAC9",
  amber: "#FFD477",
  paleAmber: "#FFF0BB",
  gray: "#D9D9D9",
  border: "#EEE8E1",
  line: "#D5D5D2",
} as const;

function HomeIcon() {
  return (
    <View style={styles.homeIcon}>
      <View style={styles.homeRoof} />
      <View style={styles.homeBody}>
        <View style={styles.homeDoor} />
      </View>
    </View>
  );
}

function CameraIcon({ color }: { color: string }) {
  return (
    <View style={styles.cameraIcon}>
      <View style={[styles.cameraTop, { borderColor: color }]} />
      <View style={[styles.cameraBody, { borderColor: color }]}>
        <View style={[styles.cameraLens, { borderColor: color }]} />
      </View>
    </View>
  );
}

function CheckIcon({
  color = "#FFFFFF",
  size = 19,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Text
      accessible={false}
      style={[styles.checkIcon, { color, fontSize: size, lineHeight: size + 2 }]}
    >
      ✓
    </Text>
  );
}

function ShieldIcon() {
  return (
    <View style={styles.shield}>
      <Text style={styles.shieldCheck}>✓</Text>
    </View>
  );
}

function StepMarker({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <View style={[styles.stepMarker, styles.stepDone]}>
        <CheckIcon size={15} />
      </View>
    );
  }

  if (state === "active") {
    return (
      <View style={[styles.stepMarker, styles.stepActiveOuter]}>
        <View style={styles.stepActiveInner} />
      </View>
    );
  }

  return <View style={[styles.stepMarker, styles.stepTodo]} />;
}

function Connector({ state }: { state: "done" | "active" | "todo" }) {
  if (state === "active") {
    return (
      <LinearGradient
        colors={[palette.green, palette.amber]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.connector}
      />
    );
  }

  return (
    <View
      style={[
        styles.connector,
        { backgroundColor: state === "done" ? palette.green : palette.line },
      ]}
    />
  );
}

function VerificationTimeline({ phase }: { phase: VerificationPhase }) {
  const { t } = useI18n();
  const steps: [StepState, StepState, StepState] =
    phase === "idle"
      ? ["active", "todo", "todo"]
      : phase === "selected" || phase === "pending"
        ? ["done", "active", "todo"]
        : phase === "reviewPassed"
          ? ["done", "done", "active"]
          : ["done", "done", "done"];
  const firstConnector =
    phase === "idle"
      ? "todo"
      : phase === "selected" || phase === "pending"
        ? "active"
        : "done";
  const secondConnector =
    phase === "reviewPassed"
      ? "active"
      : phase === "verified"
        ? "done"
        : "todo";
  const activeIndex =
    phase === "idle"
      ? 0
      : phase === "selected" || phase === "pending"
        ? 1
        : 2;

  return (
    <View style={styles.timeline}>
      <View style={styles.timelineRail}>
        <View style={styles.markerSlot}>
          <StepMarker state={steps[0]} />
        </View>
        <Connector state={firstConnector} />
        <View style={styles.markerSlot}>
          <StepMarker state={steps[1]} />
        </View>
        <Connector state={secondConnector} />
        <View style={styles.markerSlot}>
          <StepMarker state={steps[2]} />
        </View>
      </View>
      <View style={styles.stepLabels}>
        <Text
          style={[
            styles.stepLabel,
            activeIndex === 0 && styles.stepLabelActive,
          ]}
        >
          {t("uploaded")}
        </Text>
        <Text
          style={[
            styles.stepLabel,
            activeIndex === 1 && styles.stepLabelActive,
          ]}
        >
          {t("adminReview")}
        </Text>
        <Text
          style={[
            styles.stepLabel,
            activeIndex === 2 && styles.stepLabelActive,
          ]}
        >
          {t("verified")}
        </Text>
      </View>
    </View>
  );
}

export function Verify({ go }: { go: (screen: Screen) => void }) {
  const { t } = useI18n();
  const [document, setDocument] = useState<string | null>(null);
  const [phase, setPhase] = useState<VerificationPhase>("idle");
  const [busy, setBusy] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const phaseAnimation = useRef(new Animated.Value(1)).current;
  const successAnimation = useRef(new Animated.Value(0)).current;
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;

    const syncStatus = async () => {
      try {
        const me = await api<MeResponse>("/api/me");
        if (!mounted) return;

        if (me.verification?.status === "VERIFIED") {
          setPhase((current) =>
            current === "reviewPassed" || current === "verified"
              ? current
              : "reviewPassed",
          );
        } else if (me.verification?.status === "PENDING") {
          setPhase((current) =>
            current === "selected" ? current : "pending",
          );
        } else if (me.verification?.status === "REJECTED") {
          setDocument(null);
          setPhase("idle");
        }
      } catch {
        // Keep the screen usable when status refresh is temporarily unavailable.
      }
    };

    void syncStatus();
    const pollTimer = setInterval(syncStatus, 6000);

    return () => {
      mounted = false;
      clearInterval(pollTimer);
    };
  }, []);

  useEffect(() => {
    phaseAnimation.setValue(0);
    Animated.timing(phaseAnimation, {
      toValue: 1,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [phase, phaseAnimation]);

  useEffect(() => {
    if (phase !== "reviewPassed") return;
    const timer = setTimeout(() => setPhase("verified"), 1200);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(
    () => () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    },
    [],
  );

  const choosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.65,
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
      Alert.alert("Student ID", "Please choose an image smaller than 10 MB.");
      return;
    }

    setDocument(
      asset.base64
        ? `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`
        : asset.uri,
    );
    setPhase("selected");
  };

  const submit = async () => {
    if (!document) {
      await choosePhoto();
      return;
    }

    setBusy(true);
    try {
      await api("/api/verification", {
        method: "POST",
        body: JSON.stringify({ documentUrl: document }),
      });
      setPhase("pending");
    } catch (error) {
      Alert.alert(
        "Unable to submit",
        error instanceof Error ? error.message : "Please try again",
      );
    } finally {
      setBusy(false);
    }
  };

  const showSuccess = () => {
    setSuccessVisible(true);
    successAnimation.setValue(0);
    Animated.spring(successAnimation, {
      toValue: 1,
      stiffness: 220,
      damping: 19,
      mass: 0.75,
      useNativeDriver: true,
    }).start();
    successTimer.current = setTimeout(() => go("basics"), 1050);
  };

  const handlePrimaryPress = () => {
    if (busy) return;
    if (phase === "idle") {
      void choosePhoto();
    } else if (phase === "selected") {
      void submit();
    } else if (phase === "verified") {
      showSuccess();
    } else if (phase === "reviewPassed") {
      setPhase("verified");
    } else {
      go("basics");
    }
  };

  const heroTitle =
    phase === "idle"
      ? t("uploadId")
      : phase === "reviewPassed"
        ? t("adminReviewPassed")
        : phase === "verified"
          ? t("verifiedPassed")
          : t("waitAdmin");
  const primaryLabel =
    phase === "selected"
      ? busy
        ? t("submitting")
        : t("submitReview")
      : t("continue");
  const isIdle = phase === "idle";
  const isVerified = phase === "verified";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => go("signup")}
            style={({ pressed }) => [
              styles.homeButton,
              pressed && styles.pressed,
            ]}
          >
            <LinearGradient
              colors={[palette.deepWine, "#BE442D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.homeGradient}
            >
              <HomeIcon />
            </LinearGradient>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>{t("verifyTitle")}</Text>
            <Text style={styles.headerSubtitle}>
              {t("verifyRequired")}
            </Text>
          </View>
        </View>

        <Animated.View
          style={[
            styles.hero,
            { borderColor: isIdle ? palette.red : palette.green },
            {
              opacity: phaseAnimation,
              transform: [
                {
                  scale: phaseAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.985, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.heroIcon,
              isIdle ? styles.heroIconIdle : styles.heroIconReady,
            ]}
          >
            {isVerified ? (
              <CheckIcon size={36} />
            ) : (
              <CameraIcon color={isIdle ? palette.red : palette.ink} />
            )}
          </View>
          <Text style={styles.heroTitle}>{heroTitle}</Text>
          {isIdle ? (
            <>
              <Text style={styles.heroHelper}>
                JPG or PNG - both side - max 10 MB
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void choosePhoto()}
                style={({ pressed }) => [
                  styles.chooseButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.chooseButtonText}>{t("choosePhoto")}</Text>
              </Pressable>
            </>
          ) : null}
        </Animated.View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>{t("verificationStatus")}</Text>
          <View style={styles.statusMeta}>
            <View style={styles.pendingPill}>
              <Text style={styles.pendingDot}>•</Text>
              <Text style={styles.pendingText}>{t("pendingReview")}</Text>
            </View>
            <Text style={styles.statusHint}>{t("usually24")}</Text>
          </View>
          <VerificationTimeline phase={phase} />
        </View>

        <View style={styles.privacyRow}>
          <ShieldIcon />
          <Text style={styles.privacyText}>
            your ID is used only for verification and is deleted after{"\n"}
            approval.
          </Text>
        </View>

        <View style={styles.bottom}>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={handlePrimaryPress}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
              busy && styles.primaryButtonBusy,
            ]}
          >
            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
          </Pressable>
          <View style={styles.loginRow}>
            <Text style={styles.loginMuted}>{t("alreadyAccount")} </Text>
            <Pressable onPress={() => go("login")} hitSlop={8}>
              <Text style={styles.loginLink}>{t("login")}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {successVisible ? (
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.successBackdrop,
            {
              opacity: successAnimation,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.successCard,
              {
                transform: [
                  { translateY: 13 },
                  {
                    scale: successAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.86, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.successCircle}>
              <CheckIcon size={52} />
            </View>
          </Animated.View>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.background,
  },
  page: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    paddingHorizontal: 30,
    paddingTop: 21,
    paddingBottom: 14,
  },
  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
  },
  homeButton: {
    width: 58,
    height: 58,
    borderRadius: 10,
    overflow: "hidden",
  },
  homeGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.82,
  },
  homeIcon: {
    width: 24,
    height: 24,
  },
  homeRoof: {
    position: "absolute",
    width: 13,
    height: 13,
    top: 2,
    left: 5.5,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderColor: "#FFF4D9",
    borderTopLeftRadius: 2,
    transform: [{ rotate: "45deg" }],
  },
  homeBody: {
    position: "absolute",
    width: 14,
    height: 12,
    top: 9,
    left: 5,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: "#FFF4D9",
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  homeDoor: {
    width: 4,
    height: 7,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: "#FFF4D9",
  },
  headerCopy: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  headerTitle: {
    color: palette.ink,
    fontFamily: serif,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#8F8579",
    fontFamily: serif,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  hero: {
    width: "100%",
    maxWidth: 325,
    height: 207,
    alignSelf: "center",
    marginTop: 38,
    borderWidth: 1.7,
    borderStyle: "dashed",
    borderRadius: 15,
    backgroundColor: palette.hero,
    alignItems: "center",
    justifyContent: "center",
  },
  heroIcon: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  heroIconIdle: {
    borderRadius: 11,
    backgroundColor: palette.peach,
  },
  heroIconReady: {
    borderRadius: 28,
    backgroundColor: palette.paleGreen,
  },
  cameraIcon: {
    width: 26,
    height: 23,
  },
  cameraTop: {
    position: "absolute",
    width: 10,
    height: 6,
    top: 0,
    left: 8,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  cameraBody: {
    position: "absolute",
    width: 25,
    height: 18,
    left: 0.5,
    bottom: 0,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraLens: {
    width: 8,
    height: 8,
    borderWidth: 2,
    borderRadius: 4,
  },
  checkIcon: {
    fontFamily: "NotoSansThai_700Bold",
    fontWeight: "700",
    textAlign: "center",
  },
  heroTitle: {
    color: palette.ink,
    fontFamily: serif,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "700",
    marginTop: 11,
    textAlign: "center",
  },
  heroHelper: {
    color: "#90877D",
    fontFamily: serif,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 2,
    textAlign: "center",
  },
  chooseButton: {
    width: 135,
    height: 30,
    marginTop: 13,
    borderRadius: 10,
    backgroundColor: palette.peachButton,
    alignItems: "center",
    justifyContent: "center",
  },
  chooseButtonText: {
    color: palette.red,
    fontFamily: serif,
    fontSize: 10,
    fontWeight: "700",
  },
  statusCard: {
    width: "100%",
    maxWidth: 325,
    height: 153,
    alignSelf: "center",
    marginTop: 22,
    paddingHorizontal: 20,
    paddingTop: 13,
    paddingBottom: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    shadowColor: "#463826",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  statusTitle: {
    color: palette.ink,
    fontFamily: serif,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
  },
  statusMeta: {
    height: 23,
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
  },
  pendingPill: {
    height: 20,
    minWidth: 101,
    paddingHorizontal: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ECA99E",
    backgroundColor: "#F7DDD8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingDot: {
    color: palette.red,
    fontSize: 12,
    marginRight: 5,
    lineHeight: 15,
  },
  pendingText: {
    color: palette.red,
    fontFamily: serif,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "600",
  },
  statusHint: {
    color: "#8F867A",
    fontFamily: serif,
    fontSize: 8.5,
    lineHeight: 12,
    marginLeft: 11,
  },
  timeline: {
    flex: 1,
    marginTop: 5,
  },
  timelineRail: {
    height: 34,
    paddingHorizontal: 35,
    flexDirection: "row",
    alignItems: "center",
  },
  markerSlot: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  stepMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  stepDone: {
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: palette.green,
  },
  stepActiveOuter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.paleAmber,
  },
  stepActiveInner: {
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: palette.amber,
  },
  stepTodo: {
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: palette.gray,
  },
  connector: {
    flex: 1,
    height: 2,
    marginHorizontal: -1,
  },
  stepLabels: {
    marginTop: 1,
    flexDirection: "row",
  },
  stepLabel: {
    flex: 1,
    color: palette.ink,
    fontFamily: serif,
    fontSize: 8.5,
    lineHeight: 11,
    textAlign: "center",
  },
  stepLabelActive: {
    color: palette.red,
    fontWeight: "700",
  },
  privacyRow: {
    width: "100%",
    maxWidth: 307,
    minHeight: 42,
    alignSelf: "center",
    marginTop: 32,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  shield: {
    width: 16,
    height: 17,
    marginTop: 4,
    borderWidth: 1.5,
    borderColor: "#9E9A92",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  shieldCheck: {
    color: "#8F8B83",
    fontFamily: "NotoSansThai_700Bold",
    fontSize: 9,
    lineHeight: 10,
    fontWeight: "700",
  },
  privacyText: {
    flex: 1,
    marginLeft: 11,
    color: "#AFA499",
    fontFamily: serif,
    fontSize: 10.5,
    lineHeight: 20,
  },
  bottom: {
    width: "100%",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: 24,
  },
  primaryButton: {
    width: "96%",
    maxWidth: 318,
    height: 52,
    borderRadius: 9,
    backgroundColor: palette.wine,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.9,
  },
  primaryButtonBusy: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#FFF8E9",
    fontFamily: serif,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },
  loginRow: {
    marginTop: 20,
    minHeight: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loginMuted: {
    color: "#A99E92",
    fontFamily: serif,
    fontSize: 10.5,
    lineHeight: 14,
  },
  loginLink: {
    color: palette.red,
    fontFamily: serif,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "700",
  },
  successBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    backgroundColor: "rgba(30, 27, 24, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  successCard: {
    width: "72%",
    maxWidth: 283,
    height: 228,
    borderRadius: 20,
    backgroundColor: palette.background,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#463826",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
    transform: [{ translateY: 13 }],
  },
  successCircle: {
    width: 79,
    height: 79,
    borderRadius: 40,
    backgroundColor: palette.green,
    alignItems: "center",
    justifyContent: "center",
  },
});
