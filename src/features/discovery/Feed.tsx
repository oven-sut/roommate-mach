import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Heart, SlidersHorizontal, X } from "lucide-react-native";
import { BottomNav } from "../../components/BottomNav";
import { SlideAction } from "../../components/SlideAction";
import {
  Button,
  LogoTile,
  MotionPressable,
  Txt,
} from "../../components/ui";
import { useI18n } from "../../i18n";
import { api, appState } from "../../services/api";
import { C, G } from "../../theme/colors";
import { GUTTER, MAX_WIDTH, NAV_HEIGHT, s, shadow } from "../../theme/styles";
import type { MatchProfile } from "../../types/models";
import type { Screen } from "../../types/navigation";
import { DiscoverCard } from "./DiscoverCard";
import { Filters, type FeedFilters } from "./Filters";

/** Start fetching the next batch once this few cards remain. */
const PREFETCH_THRESHOLD = 5;

/** Turns the stored filter state into `/api/discover` query parameters. */
function toQuery(filters: FeedFilters, page: number): string {
  const params = new URLSearchParams({ page: String(page) });
  if (filters.yearBand !== "everyone") params.set("yearBand", filters.yearBand);
  if (filters.major) params.set("major", filters.major);
  params.set("budgetMin", String(filters.budgetMin));
  params.set("budgetMax", String(filters.budgetMax));
  params.set("minScore", String(filters.minScore));
  if (filters.mustMatch.length) {
    params.set("mustMatch", filters.mustMatch.join(","));
  }
  return params.toString();
}

/** Circular action button under the deck. */
function ActionButton({
  kind,
  onPress,
}: {
  kind: "pass" | "like";
  onPress: () => void;
}) {
  const like = kind === "like";
  const size = like ? 74 : 64;

  const inner = like ? (
    <LinearGradient
      colors={[...G.amber]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Heart size={30} color={C.white} fill={C.white} />
    </LinearGradient>
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: C.card,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <X size={27} color={C.muted} strokeWidth={2.2} />
    </View>
  );

  return (
    <MotionPressable
      onPress={onPress}
      pressedScale={0.88}
      accessibilityRole="button"
      accessibilityLabel={like ? "Like" : "Pass"}
      style={[{ borderRadius: size / 2 }, shadow(2)]}
    >
      {inner}
    </MotionPressable>
  );
}

/**
 * The discover deck.
 *
 * The design gates the first swipe behind a "Slide to start matching" control;
 * once pulled, the like/pass buttons replace it for the rest of the session.
 */
export function Feed({ go }: { go: (x: Screen) => void }) {
  const { t } = useI18n();
  const [people, setPeople] = useState<MatchProfile[]>([]);
  const [index, setIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [started, setStarted] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [liking, setLiking] = useState(false);

  const cardAnim = useRef(new Animated.Value(1)).current;

  const load = useCallback(
    async (isInitial: boolean, filters = appState.feedFilters) => {
      if (isInitial) setLoading(true);
      else setFetchingMore(true);

      const nextPage = isInitial ? 1 : page + 1;
      try {
        const data = await api<MatchProfile[]>(
          `/api/discover?${toQuery(filters, nextPage)}`,
        );
        setPage(nextPage);
        setPeople((prev) => {
          if (isInitial) {
            setHasMore(data.length > 0);
            return data;
          }
          const fresh = data.filter((d) => !prev.some((p) => p.id === d.id));
          if (fresh.length === 0) setHasMore(false);
          return [...prev, ...fresh];
        });
        if (isInitial) setIndex(0);
      } catch (reason) {
        Alert.alert(
          t("discover"),
          reason instanceof Error ? reason.message : t("somethingWrong"),
        );
      } finally {
        setLoading(false);
        setFetchingMore(false);
      }
    },
    [page, t],
  );

  useEffect(() => {
    load(true);
    // Only on mount: later refreshes go through Apply in the filter sheet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const person = people[index];

  const advance = () => {
    const nextIndex = index + 1;
    cardAnim.setValue(0.94);
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    setIndex(nextIndex);
    if (hasMore && !fetchingMore && nextIndex >= people.length - PREFETCH_THRESHOLD) {
      load(false);
    }
  };

  const swipe = async (decision: "LIKE" | "PASS") => {
    if (!person?.id) return;
    if (decision === "LIKE") setLiking(true);

    try {
      const result = await api<{ matched?: boolean }>(
        `/api/swipes/${person.id}`,
        { method: "POST", body: JSON.stringify({ decision }) },
      );
      if (result.matched) {
        appState.activeProfile = person;
        go("match");
        return;
      }
      advance();
    } catch (reason) {
      Alert.alert(
        t("somethingWrong"),
        reason instanceof Error ? reason.message : t("retry"),
      );
    } finally {
      setLiking(false);
    }
  };

  const openProfile = () => {
    if (!person) return;
    appState.activeProfile = person;
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
            paddingBottom: NAV_HEIGHT + 8,
          }}
        >
          <View style={[s.rowBetween, { height: 60 }]}>
            <View style={[s.row, { gap: 14 }]}>
              <LogoTile />
              <Txt role="h1">{t("discover")}</Txt>
            </View>
            <MotionPressable
              onPress={() => setFiltersOpen(true)}
              pressedScale={0.9}
              style={s.iconBtn}
              accessibilityLabel={t("filters")}
            >
              <SlidersHorizontal size={19} color={C.ink} strokeWidth={1.9} />
            </MotionPressable>
          </View>

          {loading ? (
            <View style={[s.flex, s.center]}>
              <ActivityIndicator color={C.primary} size="large" />
            </View>
          ) : person ? (
            <>
              <Animated.View
                style={{ flex: 1, transform: [{ scale: cardAnim }] }}
              >
                <DiscoverCard
                  person={person}
                  onPress={openProfile}
                  dimmed={liking}
                />
              </Animated.View>

              <View style={{ paddingTop: 20, minHeight: 96 }}>
                {started ? (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 26,
                    }}
                  >
                    <ActionButton kind="pass" onPress={() => swipe("PASS")} />
                    <ActionButton kind="like" onPress={() => swipe("LIKE")} />
                  </View>
                ) : (
                  <SlideAction
                    label={t("slideToMatch")}
                    onComplete={() => setStarted(true)}
                  />
                )}
              </View>
            </>
          ) : (
            <View style={[s.flex, s.center, { gap: 14, paddingHorizontal: 20 }]}>
              <Txt role="h2" style={{ textAlign: "center" }}>
                {t("noMoreProfiles")}
              </Txt>
              <Txt role="subtitle" style={{ textAlign: "center" }}>
                {t("noMoreProfilesSub")}
              </Txt>
              <Button
                tone="outline"
                style={{ width: 200, marginTop: 8 }}
                onPress={() => setFiltersOpen(true)}
              >
                {t("filters")}
              </Button>
            </View>
          )}
        </View>
      </SafeAreaView>

      <BottomNav active="feed" go={go} />

      <Filters
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onApply={(filters) => load(true, filters)}
      />
    </>
  );
}
