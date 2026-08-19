import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Settings as SettingsIcon, ShieldCheck } from "lucide-react-native";
import { Avatar } from "../../components/Avatar";
import { BottomNav } from "../../components/BottomNav";
import { Toggle } from "../../components/Toggle";
import {
  Button,
  Chevron,
  LogoTile,
  MotionPressable,
  Txt,
} from "../../components/ui";
import { useI18n } from "../../i18n";
import { api, appState, populateProfileDraft } from "../../services/api";
import { C, G } from "../../theme/colors";
import { GUTTER, MAX_WIDTH, NAV_HEIGHT, s } from "../../theme/styles";
import { F } from "../../theme/typography";
import type { Me } from "../../types/models";
import type { Screen } from "../../types/navigation";
import { fromApiAnswers } from "../questionnaire/questionnaire.content";
import {
  MAJOR_OPTIONS,
  PROPERTY_TYPES,
  PROPERTY_TYPE_KEYS,
  ROOMMATE_GENDERS,
  ROOMMATE_GENDER_KEYS,
  ROOM_TYPES,
  ROOM_TYPE_KEYS,
  ZONES,
  ZONE_KEYS,
  labelFor,
} from "./profile.content";

/** Tappable settings-style row with a title, subtitle and chevron. */
function NavRow({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <MotionPressable
      onPress={onPress}
      pressedScale={0.99}
      style={[s.card, s.rowBetween, { gap: 12 }]}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Txt role="h3" style={{ fontSize: 17 }}>
          {title}
        </Txt>
        {subtitle ? <Txt role="small">{subtitle}</Txt> : null}
      </View>
      <Chevron direction="right" size={9} />
    </MotionPressable>
  );
}

/**
 * Profile strength: one fifth per filled-in signal. Deliberately simple and
 * explainable — the hint tells the user which one is missing.
 */
function computeStrength(draft: typeof appState.profileDraft) {
  const photos = (draft.photos ?? []).filter(Boolean).length;
  const checks = [
    photos >= 1,
    photos >= 3,
    Boolean(draft.displayName && draft.age),
    Boolean(draft.major && draft.gender),
    Boolean(draft.bio),
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

/** The Profile tab: everything the user can edit about themselves. */
export function MyProfile({ go }: { go: (x: Screen) => void }) {
  const { t, language } = useI18n();
  const [, rerender] = useState(0);
  const [discoverable, setDiscoverable] = useState(true);
  const [lastTaken, setLastTaken] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  const draft = appState.profileDraft;

  /** The translated label for a stored value, or "" when it is unset. */
  const labelOf = (
    values: readonly string[],
    keys: readonly string[],
    current?: string,
  ) => {
    const index = values.indexOf(current ?? "");
    return index === -1 ? "" : t(keys[index]);
  };

  const budget =
    draft.budgetMin && draft.budgetMax
      ? `${draft.budgetMin.toLocaleString("en-US")} - ${draft.budgetMax.toLocaleString("en-US")}`
      : "";

  const HOUSING_ROWS = [
    { key: "roomType", value: labelOf(ROOM_TYPES, ROOM_TYPE_KEYS, draft.roomType) },
    {
      key: "propertyType",
      value: labelOf(PROPERTY_TYPES, PROPERTY_TYPE_KEYS, draft.propertyType),
    },
    {
      key: "roommateGenderPref",
      value: labelOf(ROOMMATE_GENDERS, ROOMMATE_GENDER_KEYS, draft.roommateGender),
    },
    { key: "preferredZone", value: labelOf(ZONES, ZONE_KEYS, draft.zone) },
    { key: "monthlyBudget", value: budget },
  ];


  const load = useCallback(async () => {
    try {
      const me = await api<Me>("/api/me");
      populateProfileDraft(me);
      setVerified(me?.verification?.status === "VERIFIED");
      // `discoverable` lives on the account, not inside the profile.
      if (typeof me?.discoverable === "boolean") {
        setDiscoverable(me.discoverable);
      }
      rerender((x) => x + 1);
    } catch {
      // Keep whatever the draft already holds.
    }

    try {
      const stored = await api<{
        answers?: Record<string, string[][]>;
        updatedAt?: string;
      }>("/api/questionnaire");
      if (stored?.answers) {
        appState.questionnaireDraft = fromApiAnswers(stored.answers);
      }
      setLastTaken(stored?.updatedAt ?? null);
    } catch {
      // No questionnaire saved yet.
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleDiscoverable = async (nextValue: boolean) => {
    setDiscoverable(nextValue);
    try {
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({ ...draft, discoverable: nextValue }),
      });
    } catch {
      setDiscoverable(!nextValue);
    }
  };

  const strength = computeStrength(draft);
  const photoCount = (draft.photos ?? []).filter(Boolean).length;
  const major = draft.major ? labelFor(MAJOR_OPTIONS, draft.major, language) : "";
  const takenLabel = lastTaken
    ? new Date(lastTaken).toLocaleDateString(
        language === "th" ? "th-TH" : "en-GB",
        { day: "numeric", month: "short" },
      )
    : null;

  return (
    <>
      <SafeAreaView style={s.safe} edges={["top"]}>
        <View
          style={{
            flex: 1,
            width: "100%",
            maxWidth: MAX_WIDTH,
            alignSelf: "center",
            paddingHorizontal: GUTTER,
          }}
        >
          <View style={[s.rowBetween, { height: 60 }]}>
            <View style={[s.row, { gap: 14 }]}>
              <LogoTile />
              <Txt role="h1">{t("profile")}</Txt>
            </View>
            <MotionPressable
              onPress={() => go("settings")}
              pressedScale={0.9}
              style={s.iconBtn}
              accessibilityLabel={t("settingTitle")}
            >
              <SettingsIcon size={20} color={C.ink} strokeWidth={1.9} />
            </MotionPressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 14, paddingBottom: NAV_HEIGHT + 30 }}
          >
            {/* Identity */}
            <View style={[s.card, s.row, { gap: 16 }]}>
              <Avatar
                name={draft.displayName}
                uri={draft.photos?.[0]}
                size={72}
              />
              <View style={{ flex: 1, gap: 5 }}>
                <Txt role="h2" style={{ fontSize: 19 }}>
                  {draft.displayName || "—"}
                  {draft.age ? `, ${draft.age}` : ""}
                </Txt>
                <Txt role="small">
                  {[major, draft.year ? `${t("year")} ${draft.year}` : ""]
                    .filter(Boolean)
                    .join("   ")}
                </Txt>
                {verified ? (
                  <View
                    style={{
                      alignSelf: "flex-start",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 11,
                      paddingVertical: 5,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: C.green,
                      backgroundColor: C.greenSoft,
                    }}
                  >
                    <ShieldCheck size={12} color={C.green} strokeWidth={2.2} />
                    <Txt
                      style={{
                        fontFamily: F.semibold,
                        fontSize: 11,
                        color: C.green,
                      }}
                    >
                      {t("verified")}
                    </Txt>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Strength */}
            <View style={s.card}>
              <View style={s.rowBetween}>
                <Txt role="h3" style={{ fontSize: 17 }}>
                  {t("profileStrength")}
                </Txt>
                <Txt style={{ fontFamily: F.bold, fontSize: 17, color: C.amber }}>
                  {strength}%
                </Txt>
              </View>
              <View style={[s.track, { marginTop: 4 }]}>
                <LinearGradient
                  colors={[...G.amber]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: `${strength}%`, height: "100%" }}
                />
              </View>
              {strength < 100 ? (
                <Txt role="small">{t("strengthHint")}</Txt>
              ) : null}
            </View>

            <NavRow
              title={t("photosRow")}
              subtitle={`${photoCount} of 3 ${t("uploadedCount")}`}
              onPress={() => go("basics")}
            />
            <NavRow
              title={t("basicsBio")}
              subtitle={t("basicsBioSub")}
              onPress={() => go("basics")}
            />
            {verified ? null : (
              <NavRow
                title={t("verifyRow")}
                subtitle={t("verifyRowSub")}
                onPress={() => go("verify")}
              />
            )}

            {/* Housing preferences: filled in on "About you", shown here so
                the answers are visible without reopening the form. */}
            <View style={s.card}>
              <View style={s.rowBetween}>
                <Txt role="h3" style={{ fontSize: 17 }}>
                  {t("housingPrefs")}
                </Txt>
                <MotionPressable onPress={() => go("basics")} hitSlop={10}>
                  <Txt role="link" style={{ fontSize: 14 }}>
                    {t("edit")}
                  </Txt>
                </MotionPressable>
              </View>
              {HOUSING_ROWS.map(({ key, value }) => (
                <View key={key} style={s.rowBetween}>
                  <Txt role="small">{t(key)}</Txt>
                  <Txt
                    role="body"
                    style={{ fontSize: 14, maxWidth: "60%" }}
                    numberOfLines={1}
                  >
                    {value || "—"}
                  </Txt>
                </View>
              ))}
            </View>

            {/* Questionnaire */}
            <View
              style={[
                s.card,
                s.rowBetween,
                {
                  backgroundColor: "#FDEFEE",
                  borderColor: C.pinkBorder,
                  gap: 14,
                },
              ]}
            >
              <View style={{ flex: 1, gap: 5 }}>
                <Txt role="h3" style={{ fontSize: 17, color: C.primaryDark }}>
                  {t("lifestyleQuestionnaire")}
                </Txt>
                <Txt role="small" style={{ color: C.primaryDark }}>
                  {takenLabel
                    ? `${t("lastTaken")} ${takenLabel} · ${t("affectsScores")}`
                    : t("neverTaken")}
                </Txt>
              </View>
              <Button
                tone="ghost"
                style={{ width: 108, height: 48 }}
                onPress={() => go("intro")}
              >
                {t("retake")}
              </Button>
            </View>

            {/* Visibility */}
            <View style={[s.card, s.rowBetween, { gap: 14 }]}>
              <View style={{ flex: 1, gap: 5 }}>
                <Txt role="h3" style={{ fontSize: 17 }}>
                  {t("accountStatus")}
                </Txt>
                <Txt role="small">
                  {discoverable ? t("activeVisible") : t("hiddenFromDiscover")}
                </Txt>
              </View>
              <Toggle
                value={discoverable}
                onChange={toggleDiscoverable}
                accessibilityLabel={t("accountStatus")}
              />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>

      <BottomNav active="myprofile" go={go} />
    </>
  );
}
