import { useState } from "react";
import { Alert, Image, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Heart, MessageCircle, MoreVertical, ShieldCheck, X } from "lucide-react-native";
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
import type { Screen } from "../../types/navigation";
import { BREAKDOWN_ROWS, cardTags, isVerified } from "../discovery/discovery.content";
import { openChatWith } from "../discovery/open-chat";
import { MAJOR_OPTIONS, labelFor } from "./profile.content";

/** One labelled bar in the "Why X%?" breakdown. */
function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={s.rowBetween}>
        <Txt role="h3" style={{ fontSize: 15 }}>
          {label}
        </Txt>
        <Txt style={{ fontFamily: F.bold, fontSize: 14, color: C.amber }}>
          {Math.round(value)}%
        </Txt>
      </View>
      <View style={[s.track, { height: 6 }]}>
        <LinearGradient
          colors={[...G.amber]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: "100%" }}
        />
      </View>
    </View>
  );
}

/**
 * Read-only view of another student's profile, reached by tapping a discover
 * card or a match row. Whether it ends in "Message" or in like/pass buttons
 * depends on whether the two have already matched.
 */
export function Profile({ go }: { go: (x: Screen) => void }) {
  const { t, language } = useI18n();
  const person = appState.activeProfile;
  const [busy, setBusy] = useState(false);

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

  const photo = formatImageUri(person.profile?.photos?.[0]);
  const initial = (person.displayName?.trim()[0] ?? "?").toUpperCase();
  const firstName = person.displayName?.trim().split(" ")[0] ?? "";
  const matched = Boolean(person.matchedAt || person.conversationId);
  const breakdown = person.breakdown;

  const metaLine = [
    person.profile?.major
      ? labelFor(MAJOR_OPTIONS, person.profile.major, language)
      : null,
    person.profile?.year ? `${t("year")} ${person.profile.year}` : null,
    person.profile?.roomType ? `${person.profile.roomType} room` : null,
    person.profile?.budgetMin && person.profile?.budgetMax
      ? `THB${person.profile.budgetMin.toLocaleString()} - ${person.profile.budgetMax.toLocaleString()}`
      : null,
  ]
    .filter(Boolean)
    .join(" - ");

  const respond = async (decision: "LIKE" | "PASS") => {
    if (!person.id) return;
    try {
      setBusy(true);
      const result = await api<{ matched?: boolean }>(
        `/api/swipes/${person.id}`,
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
        {/* Hero */}
        <LinearGradient
          colors={[...G.hero]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={{ height: 300, justifyContent: "center" }}
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
                onPress={() => go(matched ? "matches" : "feed")}
                pressedScale={0.9}
                accessibilityLabel="Back"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Chevron direction="left" color={C.white} />
              </MotionPressable>

              <MotionPressable
                onPress={() => go("report")}
                pressedScale={0.9}
                accessibilityLabel={t("report")}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MoreVertical size={20} color={C.white} strokeWidth={2} />
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
          {/* Name row, with the score ring straddling the hero edge. */}
          <View style={[s.rowBetween, { marginTop: 18, alignItems: "flex-start" }]}>
            <View style={[s.row, { gap: 12, flex: 1, flexWrap: "wrap" }]}>
              <Txt role="h1" style={{ fontSize: 24 }}>
                {person.displayName ?? "—"}
                {person.profile?.age ? `, ${person.profile.age}` : ""}
              </Txt>
              {isVerified(person) ? (
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
              score={person.score}
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

          {person.profile?.bio ? (
            <Txt role="bodyMuted">“{person.profile.bio}”</Txt>
          ) : null}

          {breakdown ? (
            <View style={[s.card, { gap: 18 }]}>
              <Txt role="h2" style={{ fontSize: 18 }}>
                {t("whyScore")}{" "}
                {typeof person.score === "number"
                  ? `${Math.round(person.score)}%`
                  : ""}
                ?
              </Txt>
              {BREAKDOWN_ROWS.map((row) => {
                const value = breakdown[row.key];
                if (typeof value !== "number") return null;
                return (
                  <BreakdownRow key={row.key} label={t(row.labelKey)} value={value} />
                );
              })}
            </View>
          ) : null}

          <View style={[s.wrap, { rowGap: 12 }]}>
            {cardTags(person).map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </View>

          {matched ? (
            <Button
              onPress={() =>
                openChatWith(
                  {
                    userId: person.id,
                    name: person.displayName,
                    conversationId: person.conversationId,
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
