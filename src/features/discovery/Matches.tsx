import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Heart, X } from "lucide-react-native";
import { Avatar } from "../../components/Avatar";
import { ScoreRing } from "../../components/ScoreRing";
import { BottomNav } from "../../components/BottomNav";
import { LogoTile, MotionPressable, Txt } from "../../components/ui";
import { useI18n } from "../../i18n";
import { api, appState } from "../../services/api";
import { C, G } from "../../theme/colors";
import { GUTTER, MAX_WIDTH, NAV_HEIGHT, s, shadow } from "../../theme/styles";
import { F } from "../../theme/typography";
import type { MatchProfile } from "../../types/models";
import type { Screen } from "../../types/navigation";
import { MAJOR_OPTIONS, labelFor } from "../profile/profile.content";
import { relativeTime } from "./discovery.content";
import { openChatWith } from "./open-chat";

type MatchRow = {
  id: string;
  score?: number;
  createdAt?: string;
  conversationId?: string;
  other?: MatchProfile;
};

type LikeRow = {
  id: string;
  fromId: string;
  score?: number;
  createdAt?: string;
  from?: MatchProfile;
};

/** Section heading with the count badge the design puts on the right. */
function SectionHead({ label, count }: { label: string; count: number }) {
  const { t } = useI18n();
  return (
    <View style={[s.rowBetween, { marginTop: 4 }]}>
      <Txt role="eyebrow" style={{ fontSize: 13 }}>
        {label}
      </Txt>
      <View
        style={{
          paddingHorizontal: 18,
          paddingVertical: 9,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: C.line,
          backgroundColor: C.card,
        }}
      >
        <Txt style={{ fontFamily: F.bold, fontSize: 14, color: C.ink }}>
          {count} {t("totalSuffix")}
        </Txt>
      </View>
    </View>
  );
}

/** Small crimson pill button that opens a chat. */
function ChatButton({ onPress }: { onPress: () => void }) {
  const { t } = useI18n();
  return (
    <MotionPressable onPress={onPress} pressedScale={0.93} style={shadow(1)}>
      <LinearGradient
        colors={[...G.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          paddingHorizontal: 22,
          paddingVertical: 12,
          borderRadius: 11,
        }}
      >
        <Txt style={{ fontFamily: F.bold, fontSize: 14, color: C.white }}>
          {t("chat")}
        </Txt>
      </LinearGradient>
    </MotionPressable>
  );
}

/** Avatar wrapped in its compatibility ring, as the match rows show it. */
function RingedAvatar({
  person,
  score,
}: {
  person?: MatchProfile;
  score?: number;
}) {
  return (
    <View style={{ width: 62, height: 62, alignItems: "center", justifyContent: "center" }}>
      <ScoreRing
        score={score}
        size={62}
        thickness={4}
        label=" "
        style={{ position: "absolute" }}
      />
      <Avatar
        name={person?.displayName}
        uri={person?.profile?.photos?.[0]}
        size={48}
      />
    </View>
  );
}

/**
 * The Match tab: confirmed matches on top, people who liked you underneath.
 * Combining them means the "like you" queue is never more than a scroll away,
 * which is where the design puts the strongest call to action.
 */
export function Matches({ go }: { go: (x: Screen) => void }) {
  const { t, language } = useI18n();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [likes, setLikes] = useState<LikeRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [matchData, likeData] = await Promise.all([
        api<MatchRow[]>("/api/matches").catch(() => []),
        api<LikeRow[]>("/api/likes").catch(() => []),
      ]);
      setMatches(matchData ?? []);
      setLikes(likeData ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const respond = async (like: LikeRow, decision: "LIKE" | "PASS") => {
    setLikes((items) => items.filter((item) => item.id !== like.id));
    try {
      const result = await api<{ matched?: boolean }>(
        `/api/swipes/${like.fromId}`,
        { method: "POST", body: JSON.stringify({ decision }) },
      );
      if (result.matched) {
        appState.activeProfile = like.from ?? null;
        go("match");
      } else {
        load();
      }
    } catch (reason) {
      Alert.alert(
        t("somethingWrong"),
        reason instanceof Error ? reason.message : t("retry"),
      );
      load();
    }
  };

  const meta = (person?: MatchProfile, createdAt?: string) => {
    const parts: string[] = [];
    const major = person?.profile?.major;
    if (major) parts.push(labelFor(MAJOR_OPTIONS, major, language));
    const when = relativeTime(createdAt);
    if (when) parts.push(`${t("matchedAgo")} ${when}`);
    return parts.join("  ·  ");
  };

  /**
   * `matchedAt`/`conversationId` come from the row, not the embedded profile —
   * without them the profile screen cannot tell a match from a stranger and
   * would offer like/pass instead of "Message".
   */
  const openProfile = (
    person: MatchProfile | undefined,
    score: number | undefined,
    match?: { createdAt?: string; conversationId?: string },
  ) => {
    if (!person) return;
    appState.activeProfile = {
      ...person,
      score: person.score ?? score,
      matchedAt: match?.createdAt ?? person.matchedAt,
      conversationId: match?.conversationId ?? person.conversationId,
    };
    go("profile");
  };

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
          <View style={[s.row, { gap: 14, height: 60 }]}>
            <LogoTile />
            <Txt role="h1">{t("matchTab")}</Txt>
          </View>

          {loading ? (
            <View style={[s.flex, s.center]}>
              <ActivityIndicator color={C.primary} size="large" />
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                gap: 14,
                paddingBottom: NAV_HEIGHT + 30,
              }}
            >
              <SectionHead label={t("yourMatches")} count={matches.length} />

              {matches.length === 0 ? (
                <View style={{ paddingVertical: 34, alignItems: "center" }}>
                  <Txt role="small">
                    {t("noOneNow")}{" "}
                    <Txt
                      role="small"
                      style={{ color: C.primary, fontFamily: F.bold }}
                      onPress={() => go("feed")}
                    >
                      {t("letsMatch")}
                    </Txt>
                  </Txt>
                </View>
              ) : (
                matches.map((match) => (
                  <View key={match.id} style={[s.card, s.row, { gap: 14 }]}>
                    <MotionPressable
                      onPress={() => openProfile(match.other, match.score, match)}
                      pressedScale={0.94}
                    >
                      <RingedAvatar person={match.other} score={match.score} />
                    </MotionPressable>

                    <View style={{ flex: 1, gap: 4 }}>
                      <Txt role="h3" style={{ fontSize: 17 }}>
                        {match.other?.displayName ?? "—"}
                        {match.other?.profile?.age
                          ? `, ${match.other.profile.age}`
                          : ""}
                        {typeof match.score === "number"
                          ? `  ·  ${Math.round(match.score)}%`
                          : ""}
                      </Txt>
                      <Txt role="small">{meta(match.other, match.createdAt)}</Txt>
                    </View>

                    <ChatButton
                      onPress={() =>
                        openChatWith(
                          {
                            matchId: match.id,
                            userId: match.other?.id,
                            name: match.other?.displayName,
                            conversationId: match.conversationId,
                          },
                          go,
                        )
                      }
                    />
                  </View>
                ))
              )}

              <View style={[s.divider, { marginVertical: 12 }]} />

              <SectionHead label={t("likeYouSection")} count={likes.length} />

              {likes.map((like) => (
                <View key={like.id} style={[s.card, s.row, { gap: 14 }]}>
                  <MotionPressable
                    onPress={() => openProfile(like.from, like.score)}
                    pressedScale={0.94}
                  >
                    <Avatar
                      name={like.from?.displayName}
                      uri={like.from?.profile?.photos?.[0]}
                      size={56}
                    />
                  </MotionPressable>

                  <View style={{ flex: 1, gap: 4 }}>
                    <Txt role="h3" style={{ fontSize: 17 }}>
                      {like.from?.displayName ?? "—"}
                      {like.from?.profile?.age
                        ? `, ${like.from.profile.age}`
                        : ""}
                      {typeof like.score === "number" ? "  ·  " : ""}
                      {typeof like.score === "number" ? (
                        <Txt style={{ fontFamily: F.bold, color: C.amber, fontSize: 17 }}>
                          {Math.round(like.score)}%
                        </Txt>
                      ) : null}
                    </Txt>
                    <Txt role="small">{meta(like.from, like.createdAt)}</Txt>
                  </View>

                  <View style={[s.row, { gap: 10 }]}>
                    <MotionPressable
                      onPress={() => respond(like, "PASS")}
                      pressedScale={0.88}
                      accessibilityLabel="Pass"
                      style={[
                        {
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: C.card,
                          borderWidth: 1,
                          borderColor: C.line,
                          alignItems: "center",
                          justifyContent: "center",
                        },
                        shadow(1),
                      ]}
                    >
                      <X size={19} color={C.muted} strokeWidth={2.2} />
                    </MotionPressable>

                    <MotionPressable
                      onPress={() => respond(like, "LIKE")}
                      pressedScale={0.88}
                      accessibilityLabel="Like back"
                      style={[{ borderRadius: 22 }, shadow(2)]}
                    >
                      <LinearGradient
                        colors={[...G.amber]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Heart size={20} color={C.white} fill={C.white} />
                      </LinearGradient>
                    </MotionPressable>
                  </View>
                </View>
              ))}

              {likes.length > 0 ? (
                <View
                  style={{
                    backgroundColor: C.cardWarm,
                    borderRadius: 16,
                    padding: 18,
                  }}
                >
                  <Txt role="small" style={{ textAlign: "center", color: C.ink }}>
                    {t("likeBackNote")}
                  </Txt>
                </View>
              ) : null}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>

      <BottomNav active="matches" go={go} />
    </>
  );
}
