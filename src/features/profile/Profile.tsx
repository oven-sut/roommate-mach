import { useEffect, useState } from "react";
import { Alert, Image, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import {
  Heart,
  Home,
  MapPin,
  MessageCircle,
  MoreVertical,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from "lucide-react-native";
import { ScoreRing } from "../../components/ScoreRing";
import {
  Button,
  Chevron,
  MotionPressable,
  Tag,
  Txt,
} from "../../components/ui";
import { useI18n } from "../../i18n";
import { api, appState, formatImageUri } from "../../services/api";
import { C, G } from "../../theme/colors";
import { GUTTER, MAX_WIDTH, s, shadow } from "../../theme/styles";
import { F } from "../../theme/typography";
import type { MatchProfile } from "../../types/models";
import type { Screen } from "../../types/navigation";
import { cardTags, isVerified } from "../discovery/discovery.content";
import { openChatWith } from "../discovery/open-chat";
import { MAJOR_OPTIONS, labelFor } from "./profile.content";

const DETAILED_BREAKDOWN_CONFIG = [
  {
    key: "sleep" as const,
    labelKey: "catSleep",
    icon: "🌙",
    sub: { th: "เวลาเข้านอนและตื่นนอน", en: "Sleep & wake schedule" },
  },
  {
    key: "cleanliness" as const,
    labelKey: "catClean",
    icon: "🧹",
    sub: { th: "ความสะอาดและระเบียบวินัย", en: "Cleanliness & order" },
  },
  {
    key: "guests" as const,
    labelKey: "catGuests",
    icon: "👥",
    sub: { th: "การรับแขกและการค้างคืน", en: "Guests & visitors" },
  },
  {
    key: "temperature" as const,
    labelKey: "catTemp",
    icon: "❄️",
    sub: { th: "อุณหภูมิแอร์และบรรยากาศการเรียน", en: "AC temp & study space" },
  },
] as const;

/** One labelled bar in the "Why X%?" breakdown. */
function BreakdownRow({
  icon,
  label,
  sub,
  value,
}: {
  icon: string;
  label: string;
  sub?: string;
  value: number;
}) {
  return (
    <View style={{ gap: 8, paddingVertical: 4 }}>
      <View style={s.rowBetween}>
        <View style={[s.row, { gap: 10 }]}>
          <Txt style={{ fontSize: 20 }}>{icon}</Txt>
          <View style={{ gap: 2 }}>
            <Txt role="h3" style={{ fontSize: 15 }}>
              {label}
            </Txt>
            {sub ? (
              <Txt role="small" style={{ color: C.muted, fontSize: 11 }}>
                {sub}
              </Txt>
            ) : null}
          </View>
        </View>
        <Txt style={{ fontFamily: F.bold, fontSize: 16, color: C.amber }}>
          {Math.round(value)}%
        </Txt>
      </View>
      <View style={[s.track, { height: 8, borderRadius: 4 }]}>
        <LinearGradient
          colors={[...G.amber]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: `${Math.max(5, Math.min(100, value))}%`,
            height: "100%",
            borderRadius: 4,
          }}
        />
      </View>
    </View>
  );
}

/** Read-only view of another student's profile. */
export function Profile({ go }: { go: (x: Screen) => void }) {
  const { t, language } = useI18n();
  const [person, setPerson] = useState<MatchProfile | null>(appState.activeProfile);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const targetId = appState.activeProfile?.id;
    if (targetId) {
      setPerson(appState.activeProfile);
      api<MatchProfile>(`/api/users/${targetId}`)
        .then((fullData) => {
          if (fullData) {
            const mergedProfile = {
              ...appState.activeProfile?.profile,
              ...(appState.activeProfile as any),
              ...fullData.profile,
            };
            const merged: MatchProfile = {
              ...appState.activeProfile,
              ...fullData,
              profile: mergedProfile,
              breakdown: fullData.breakdown || appState.activeProfile?.breakdown,
              tags: fullData.tags || appState.activeProfile?.tags,
              score: fullData.score ?? appState.activeProfile?.score,
            };
            appState.activeProfile = merged;
            setPerson(merged);
          }
        })
        .catch(() => undefined);
    }
  }, []);

  if (!person) {
    return (
      <SafeAreaView style={[s.safe, s.center]}>
        <Txt role="subtitle">{t("empty")}</Txt>
        <Button style={{ width: 200, marginTop: 18 }} onPress={() => go("feed")}>
          {t("discover")}
        </Button>
      </SafeAreaView>
    );
  }

  // Normalize profile object
  const profile = person.profile ?? {
    photos: (person as any).photos,
    major: (person as any).major,
    year: (person as any).year,
    roomType: (person as any).roomType,
    propertyType: (person as any).propertyType,
    zone: (person as any).zone,
    budgetMin: (person as any).budgetMin,
    budgetMax: (person as any).budgetMax,
    bio: (person as any).bio,
    age: (person as any).age,
  };

  const activePerson: MatchProfile = {
    ...person,
    profile,
    displayName: person.displayName ?? "—",
    score: person.score ?? appState.activeProfile?.score,
    breakdown: person.breakdown ?? appState.activeProfile?.breakdown,
    tags: person.tags?.length ? person.tags : cardTags({ ...person, profile }),
  };

  const photo = formatImageUri(activePerson.profile?.photos?.[0]);
  const initial = (activePerson.displayName?.trim()[0] ?? "?").toUpperCase();
  const firstName = activePerson.displayName?.trim().split(" ")[0] ?? "";
  const matched = Boolean(
    activePerson.matchedAt || activePerson.conversationId || appState.activeConversationId,
  );

  const overallScore = typeof activePerson.score === "number" ? Math.round(activePerson.score) : 80;
  const safeBreakdown = {
    sleep: activePerson.breakdown?.sleep ?? overallScore,
    cleanliness: activePerson.breakdown?.cleanliness ?? Math.min(100, overallScore + 2),
    guests: activePerson.breakdown?.guests ?? Math.max(40, overallScore - 4),
    temperature: activePerson.breakdown?.temperature ?? Math.min(100, overallScore + 1),
  };

  const metaLine = [
    activePerson.profile?.major
      ? labelFor(MAJOR_OPTIONS, activePerson.profile.major, language)
      : null,
    activePerson.profile?.year ? `${t("year")} ${activePerson.profile.year}` : null,
    activePerson.profile?.roomType ? `${activePerson.profile.roomType} room` : null,
    activePerson.profile?.propertyType,
    activePerson.profile?.zone,
    activePerson.profile?.budgetMin && activePerson.profile?.budgetMax
      ? `THB${activePerson.profile.budgetMin.toLocaleString()} - ${activePerson.profile.budgetMax.toLocaleString()}`
      : null,
  ]
    .filter(Boolean)
    .join(" - ");

  const respond = async (decision: "LIKE" | "PASS") => {
    if (!activePerson.id) return;
    try {
      setBusy(true);
      const result = await api<{ matched?: boolean }>(
        `/api/swipes/${activePerson.id}`,
        { method: "POST", body: JSON.stringify({ decision }) },
      );
      if (result.matched) {
        go("match");
        return;
      }
      go("feed");
    } catch (reason) {
      Alert.alert(
        t("somethingWrong"),
        reason instanceof Error ? reason.message : t("retry"),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={s.safe}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Hero Image */}
        <LinearGradient
          colors={[...G.hero]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={{ height: 320, justifyContent: "center" }}
        >
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
              resizeMode="cover"
            />
          ) : (
            <Txt
              style={{
                textAlign: "center",
                fontSize: 130,
                lineHeight: 150,
                fontFamily: F.bold,
                color: "rgba(255,255,255,.2)",
              }}
            >
              {initial}
            </Txt>
          )}

          <SafeAreaView
            edges={["top"]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              paddingHorizontal: GUTTER,
            }}
          >
            <View style={[s.rowBetween, { height: 56 }]}>
              <MotionPressable
                onPress={() => go(matched ? "chat" : "feed")}
                pressedScale={0.9}
                accessibilityLabel="Back"
                style={[
                  {
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: C.card,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  shadow(2),
                ]}
              >
                <Chevron direction="left" color={C.ink} />
              </MotionPressable>

              <MotionPressable
                onPress={() => go("report")}
                pressedScale={0.9}
                accessibilityLabel={t("report")}
                style={[
                  {
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: C.card,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  shadow(2),
                ]}
              >
                <MoreVertical size={22} color={C.ink} strokeWidth={2.4} />
              </MotionPressable>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View
          style={{
            width: "100%",
            maxWidth: MAX_WIDTH,
            alignSelf: "center",
            paddingHorizontal: GUTTER,
            gap: 18,
          }}
        >
          {/* Name & Score Ring */}
          <View style={[s.rowBetween, { marginTop: 18, alignItems: "flex-start" }]}>
            <View style={[s.row, { gap: 12, flex: 1, flexWrap: "wrap" }]}>
              <Txt role="h1" style={{ fontSize: 24 }}>
                {activePerson.displayName ?? "—"}
                {activePerson.profile?.age ? `, ${activePerson.profile.age}` : ""}
              </Txt>
              {isVerified(activePerson) ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: C.green,
                    backgroundColor: C.greenSoft,
                  }}
                >
                  <ShieldCheck size={13} color={C.green} strokeWidth={2.2} />
                  <Txt
                    style={{ fontFamily: F.semibold, fontSize: 11, color: C.green }}
                  >
                    {t("verified")}
                  </Txt>
                </View>
              ) : null}
            </View>

            <ScoreRing
              score={activePerson.score}
              size={76}
              thickness={9}
              style={[{ marginTop: -62 }, shadow(2)]}
            />
          </View>

          {metaLine ? (
            <Txt role="h3" style={{ fontSize: 13, color: C.muted }}>
              {metaLine}
            </Txt>
          ) : null}

          {activePerson.profile?.bio ? (
            <Txt role="bodyMuted">“{activePerson.profile.bio}”</Txt>
          ) : null}

          {/* Detailed Score Breakdown Card */}
          <View style={[s.card, { gap: 16 }]}>
            <View style={[s.row, { gap: 8 }]}>
              <Sparkles size={20} color={C.amber} />
              <Txt role="h2" style={{ fontSize: 18 }}>
                {t("whyScore")}{" "}
                {typeof activePerson.score === "number"
                  ? `${Math.round(activePerson.score)}%`
                  : `${overallScore}%`}
                ?
              </Txt>
            </View>
            {DETAILED_BREAKDOWN_CONFIG.map(({ key, labelKey, icon, sub }) => {
              const val = safeBreakdown[key];
              return (
                <BreakdownRow
                  key={key}
                  icon={icon}
                  label={t(labelKey)}
                  sub={sub[language]}
                  value={val}
                />
              );
            })}
          </View>

          {/* Lifestyle Signature Tags Card */}
          <View style={[s.card, { gap: 12 }]}>
            <Txt role="h3" style={{ fontSize: 15 }}>
              {language === "th" ? "สไตล์การดำเนินชีวิต (Lifestyle Tags)" : "Lifestyle Signature"}
            </Txt>
            <View style={[s.wrap, { rowGap: 10, gap: 8 }]}>
              {cardTags(activePerson).map((tag, idx) => (
                <Tag key={`${tag}-${idx}`}>{tag}</Tag>
              ))}
            </View>
          </View>

          {/* Room Preferences Card */}
          {(activePerson.profile?.roomType ||
            activePerson.profile?.zone ||
            activePerson.profile?.budgetMin) ? (
            <View style={[s.card, { gap: 14 }]}>
              <Txt role="h3" style={{ fontSize: 15 }}>
                {language === "th" ? "เงื่อนไขที่พักอาศัย (Housing Preferences)" : "Housing Preferences"}
              </Txt>
              <View style={{ gap: 10 }}>
                {activePerson.profile?.roomType ? (
                  <View style={[s.row, { gap: 10 }]}>
                    <Home size={18} color={C.primary} />
                    <Txt role="body" style={{ fontSize: 14 }}>
                      {language === "th" ? "รูปแบบห้อง:" : "Room:"}{" "}
                      <Txt style={{ fontFamily: F.semibold }}>{activePerson.profile.roomType}</Txt>
                    </Txt>
                  </View>
                ) : null}

                {activePerson.profile?.zone ? (
                  <View style={[s.row, { gap: 10 }]}>
                    <MapPin size={18} color={C.primary} />
                    <Txt role="body" style={{ fontSize: 14 }}>
                      {language === "th" ? "โซนหอพัก:" : "Zone:"}{" "}
                      <Txt style={{ fontFamily: F.semibold }}>{activePerson.profile.zone}</Txt>
                    </Txt>
                  </View>
                ) : null}

                {activePerson.profile?.budgetMin && activePerson.profile?.budgetMax ? (
                  <View style={[s.row, { gap: 10 }]}>
                    <Wallet size={18} color={C.primary} />
                    <Txt role="body" style={{ fontSize: 14 }}>
                      {language === "th" ? "งบประมาณ:" : "Budget:"}{" "}
                      <Txt style={{ fontFamily: F.semibold }}>
                        THB{activePerson.profile.budgetMin.toLocaleString()} - {activePerson.profile.budgetMax.toLocaleString()}
                      </Txt>
                    </Txt>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* Action CTA */}
          {matched ? (
            <Button
              onPress={() =>
                openChatWith(
                  {
                    userId: activePerson.id,
                    name: activePerson.displayName,
                    photo: activePerson.profile?.photos?.[0],
                    conversationId: activePerson.conversationId || appState.activeConversationId || undefined,
                  },
                  go,
                )
              }
              style={{ marginTop: 8 }}
            >
              {`${t("messagePrefix")} ${firstName}`.trim()}
            </Button>
          ) : (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 26,
                marginTop: 8,
              }}
            >
              <MotionPressable
                onPress={() => respond("PASS")}
                disabled={busy}
                pressedScale={0.88}
                accessibilityLabel="Pass"
                style={[
                  {
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: C.card,
                    borderWidth: 1,
                    borderColor: C.line,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  shadow(2),
                ]}
              >
                <X size={26} color={C.muted} strokeWidth={2.2} />
              </MotionPressable>

              <MotionPressable
                onPress={() => respond("LIKE")}
                disabled={busy}
                pressedScale={0.88}
                accessibilityLabel="Like"
                style={[{ borderRadius: 37 }, shadow(2)]}
              >
                <LinearGradient
                  colors={[...G.amber]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 74,
                    height: 74,
                    borderRadius: 37,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Heart size={30} color={C.white} fill={C.white} />
                </LinearGradient>
              </MotionPressable>
            </View>
          )}

          {matched ? (
            <MotionPressable
              onPress={() => go("messages")}
              style={[s.row, { justifyContent: "center", gap: 8, marginTop: 4 }]}
            >
              <MessageCircle size={16} color={C.muted} strokeWidth={1.8} />
              <Txt role="small">{t("messageTab")}</Txt>
            </MotionPressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
