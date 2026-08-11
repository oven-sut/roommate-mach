import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import { Alert, Image, View } from "react-native";
import { Camera, Check, IdCard, ImageIcon, ShieldCheck } from "lucide-react-native";
import {
  Button,
  Chevron,
  MotionPressable,
  NoteCard,
  ScreenShell,
  Txt,
} from "../../components/ui";
import { useI18n } from "../../i18n";
import { api } from "../../services/api";
import { toImageDataUri } from "../../services/media";
import { C } from "../../theme/colors";
import { s } from "../../theme/styles";
import { F } from "../../theme/typography";
import type { Screen } from "../../types/navigation";

/** How often the server is asked whether an admin has reviewed the upload. */
const POLL_INTERVAL_MS = 8000;

type Phase = "idle" | "ready" | "pending" | "approved";

const STEPS = [
  { phase: "ready", key: "uploaded" },
  { phase: "pending", key: "adminReview" },
  { phase: "approved", key: "verified" },
] as const;

/** Three-dot progress strip across the top of the verification flow. */
function Stepper({ phase }: { phase: Phase }) {
  const { t } = useI18n();
  const reached = (target: Phase) => {
    const order: Phase[] = ["idle", "ready", "pending", "approved"];
    return order.indexOf(phase) >= order.indexOf(target);
  };

  return (
    <View style={[s.row, { justifyContent: "space-between", marginTop: 6 }]}>
      {STEPS.map((step) => {
        const on = reached(step.phase);
        return (
          <View key={step.key} style={{ alignItems: "center", flex: 1, gap: 8 }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: on ? C.primary : C.card,
                borderWidth: on ? 0 : 1.5,
                borderColor: C.line,
              }}
            >
              {on ? (
                <Check size={17} color={C.white} strokeWidth={2.6} />
              ) : null}
            </View>
            <Txt
              role="tiny"
              style={{ textAlign: "center", color: on ? C.ink : C.faint }}
            >
              {t(step.key).replace("\n", " ")}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Student ID verification. Not part of the default sign-up flow any more, but
 * reachable from the profile so a student can get the Verified badge.
 */
export function Verify({ go }: { go: (screen: Screen) => void }) {
  const { t } = useI18n();
  const [document, setDocument] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const me = await api<any>("/api/me");
      const status = me?.verification?.status;
      if (status === "APPROVED" || status === "VERIFIED") setPhase("approved");
      else if (status === "PENDING") setPhase("pending");
    } catch {
      // Leave the local phase alone if the check fails.
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (phase !== "pending") return;
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [phase, refresh]);

  const accept = (asset: ImagePicker.ImagePickerAsset) => {
    const picked = toImageDataUri(asset);
    if (!picked.ok) {
      Alert.alert(t("uploadId"), picked.reason);
      return;
    }
    setDocument(picked.dataUri);
    setPhase("ready");
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("uploadId"), "Camera permission is required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.75,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) accept(result.assets[0]);
  };

  const choosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.65,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) accept(result.assets[0]);
  };

  const submit = async () => {
    if (!document) return;
    try {
      setBusy(true);
      await api("/api/verification", {
        method: "POST",
        body: JSON.stringify({ documentUrl: document }),
      });
      setPhase("pending");
    } catch (reason) {
      Alert.alert(
        t("submitReview"),
        reason instanceof Error ? reason.message : t("somethingWrong"),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenShell>
      <View style={[s.row, { gap: 16, height: 60 }]}>
        <MotionPressable
          onPress={() => go("myprofile")}
          pressedScale={0.9}
          style={s.iconBtn}
          accessibilityLabel="Back"
        >
          <Chevron direction="left" />
        </MotionPressable>
        <Txt role="h1" style={{ fontSize: 22, flex: 1 }}>
          {t("verifyTitle")}
        </Txt>
      </View>

      <Txt role="subtitle">{t("verifyRequired")}</Txt>
      <Stepper phase={phase} />

      {phase === "approved" ? (
        <View style={[s.card, s.center, { paddingVertical: 40, gap: 14 }]}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: C.greenSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldCheck size={34} color={C.green} strokeWidth={2} />
          </View>
          <Txt role="h2">{t("verifiedPassed")}</Txt>
          <Button
            style={{ width: 220, marginTop: 8 }}
            onPress={() => go("myprofile")}
          >
            {t("continue")}
          </Button>
        </View>
      ) : (
        <>
          <MotionPressable
            onPress={choosePhoto}
            pressedScale={0.99}
            disabled={phase === "pending"}
            style={{
              borderWidth: 1.6,
              borderStyle: "dashed",
              borderColor: C.pinkBorder,
              borderRadius: 20,
              minHeight: 230,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              gap: 12,
            }}
          >
            {document ? (
              <Image
                source={{ uri: document }}
                style={{ width: "100%", height: 230 }}
                resizeMode="cover"
              />
            ) : (
              <>
                <IdCard size={40} color={C.pinkBorder} strokeWidth={1.6} />
                <Txt role="subtitle">{t("uploadId")}</Txt>
              </>
            )}
          </MotionPressable>

          {phase === "pending" ? (
            <NoteCard icon={<ShieldCheck size={20} color={C.muted} />}>
              <Txt role="h3" style={{ fontSize: 15 }}>
                {t("pendingReview")}
              </Txt>
              <Txt role="small">{t("usually24")}</Txt>
            </NoteCard>
          ) : (
            <>
              <View style={[s.row, { gap: 12 }]}>
                <MotionPressable
                  onPress={takePhoto}
                  pressedScale={0.97}
                  style={[
                    s.card,
                    s.center,
                    { flex: 1, paddingVertical: 20, gap: 8 },
                  ]}
                >
                  <Camera size={22} color={C.primary} strokeWidth={1.9} />
                  <Txt style={{ fontFamily: F.semibold, fontSize: 13 }}>
                    {t("choosePhoto")}
                  </Txt>
                </MotionPressable>

                <MotionPressable
                  onPress={choosePhoto}
                  pressedScale={0.97}
                  style={[
                    s.card,
                    s.center,
                    { flex: 1, paddingVertical: 20, gap: 8 },
                  ]}
                >
                  <ImageIcon size={22} color={C.primary} strokeWidth={1.9} />
                  <Txt style={{ fontFamily: F.semibold, fontSize: 13 }}>
                    {t("uploaded")}
                  </Txt>
                </MotionPressable>
              </View>

              <Button onPress={submit} disabled={!document} loading={busy}>
                {busy ? t("submitting") : t("submitReview")}
              </Button>
            </>
          )}
        </>
      )}
    </ScreenShell>
  );
}
