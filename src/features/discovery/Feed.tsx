import {
  Bell,
  Flame,
  Heart,
  MapPin,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomNav } from "../../components/BottomNav";
import { useI18n } from "../../i18n";
import { api, appState, formatImageUri } from "../../services/api";
import type { Screen } from "../../types/navigation";
import { feedStyles, serifFont } from "./discovery.styles";

/** Start fetching the next batch once this few cards remain. */
const PREFETCH_THRESHOLD = 5;

export function Feed({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();
  const [people, setPeople] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);

  useEffect(() => {
    loadPage(true);
  }, []);

  // NOTE: this always requests page 1 — `/api/discover` accepts a `page` query
  // parameter that is never sent, so "load more" re-fetches the same batch and
  // the de-duplication below then concludes there is nothing left. Preserved
  // as-is during the file split; fixing it is a separate change.
  const loadPage = async (isInitial = false) => {
    if (!hasMore && !isInitial) return;
    if (isInitial) setLoading(true);
    else setFetchingMore(true);

    try {
      const data = await api(`/api/discover`);
      setPeople((prev) => {
        const newItems = data.filter(
          (d: any) => !prev.some((p) => p.id === d.id),
        );
        if (!isInitial && newItems.length === 0) setHasMore(false);
        if (isInitial && data.length === 0) setHasMore(false);
        return isInitial ? data : [...prev, ...newItems];
      });
      if (isInitial) setIndex(0);
    } catch (e: any) {
      Alert.alert("Discover", e.message);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  };

  const person = people[index];

  const swipe = async (decision: "LIKE" | "PASS") => {
    if (!person) return;
    try {
      const result = await api(`/api/swipes/${person.id}`, {
        method: "POST",
        body: JSON.stringify({ decision }),
      });
      const nextIndex = index + 1;
      setIndex(nextIndex);
      if (result.matched) go("match");

      if (
        hasMore &&
        !fetchingMore &&
        nextIndex >= people.length - PREFETCH_THRESHOLD
      ) {
        loadPage(false);
      }
    } catch (e) {
      Alert.alert(
        "Unable to save",
        e instanceof Error ? e.message : "Please try again",
      );
    }
  };

  const photo = formatImageUri(person?.profile?.photos?.[0]);

  return (
    <SafeAreaView style={feedStyles.safeArea}>
      <View style={feedStyles.container}>
        <View style={feedStyles.topBar}>
          <Text style={feedStyles.appTitle}>
            {language === "th" ? "ค้นหารูมเมท" : "Discover Roommates"}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter profiles"
            style={feedStyles.filterBtn}
            onPress={() => go("filters")}
          >
            <SlidersHorizontal size={16} color="#463826" />
            <Text style={feedStyles.filterBtnText}>
              {language === "th" ? "ตัวกรอง" : "Filters"}
            </Text>
          </Pressable>
        </View>

        <View style={feedStyles.quickRow}>
          <Pressable style={feedStyles.quickPill} onPress={() => go("requests")}>
            <Heart size={15} color="#C64338" fill="#C64338" />
            <Text style={feedStyles.quickPillText}>
              {language === "th" ? "คนที่ถูกใจคุณ" : "Liked You"}
            </Text>
          </Pressable>

          <Pressable
            style={feedStyles.quickPill}
            onPress={() => go("notifications")}
          >
            <Bell size={15} color="#C64338" />
            <Text style={feedStyles.quickPillText}>
              {language === "th" ? "การแจ้งเตือน" : "Notifications"}
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color="#C64338" />
            <Text
              style={{ marginTop: 12, fontFamily: serifFont, color: "#8D7C75" }}
            >
              {language === "th"
                ? "กำลังค้นหารูมเมทที่เหมาะกับคุณ…"
                : "Searching for compatible roommates…"}
            </Text>
          </View>
        ) : person ? (
          <>
            <Pressable
              style={feedStyles.cardContainer}
              onPress={() => {
                appState.activeProfile = person;
                go("profile");
              }}
            >
              {photo ? (
                <Image source={{ uri: photo }} style={feedStyles.cardImage} />
              ) : (
                <View style={feedStyles.cardAvatarFallback}>
                  <Text style={feedStyles.cardAvatarLetter}>
                    {person.displayName?.[0]?.toUpperCase() ?? "R"}
                  </Text>
                </View>
              )}

              <View style={feedStyles.verifiedBadge}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <ShieldCheck size={14} color="#4ADE80" />
                  <Text style={feedStyles.verifiedText}>
                    {person.verification?.status === "VERIFIED"
                      ? language === "th"
                        ? "ยืนยันตัวตนแล้ว"
                        : "Verified Student"
                      : language === "th"
                        ? "นักศึกษา SUT"
                        : "SUT Student"}
                  </Text>
                </View>
              </View>

              <View style={feedStyles.scoreBadge}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Flame size={14} color="#C64338" fill="#C64338" />
                  <Text style={feedStyles.scoreText}>
                    {person.score ?? 85}% Match
                  </Text>
                </View>
              </View>

              <View style={feedStyles.cardOverlay}>
                <Text style={feedStyles.cardName}>
                  {person.displayName}, {person.profile?.age ?? "19"}
                </Text>
                <Text style={feedStyles.cardDetails}>
                  {person.profile?.major ?? "SUT Student"}
                  {person.profile?.year
                    ? ` · ${
                        language === "th"
                          ? `ปี ${person.profile.year}`
                          : `Year ${person.profile.year}`
                      }`
                    : ""}
                  {person.profile?.roomType
                    ? ` · ${person.profile.roomType}`
                    : ""}
                </Text>

                <View style={feedStyles.chipsRow}>
                  <View style={feedStyles.cardChip}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Sparkles size={12} color="#FFFFFF" />
                      <Text style={feedStyles.cardChipText}>
                        {language === "th" ? "เข้ากันได้ดี" : "High Match"}
                      </Text>
                    </View>
                  </View>
                  {person.profile?.zone ? (
                    <View style={feedStyles.cardChip}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <MapPin size={12} color="#FFFFFF" />
                        <Text style={feedStyles.cardChipText}>
                          {person.profile.zone}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                <Text style={feedStyles.tapHint}>
                  {language === "th"
                    ? "👆 แตะที่การ์ดเพื่อดูโปรไฟล์ฉบับเต็ม"
                    : "👆 Tap card to view full profile"}
                </Text>
              </View>
            </Pressable>

            <View style={feedStyles.actionsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Pass profile"
                style={feedStyles.btnPass}
                onPress={() => swipe("PASS")}
              >
                <X size={26} color="#74675E" strokeWidth={2.5} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Superlike profile"
                style={feedStyles.btnSuper}
                onPress={() => swipe("LIKE")}
              >
                <Star size={24} color="#D97706" fill="#F59E0B" />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Like profile"
                style={feedStyles.btnLike}
                onPress={() => swipe("LIKE")}
              >
                <Heart size={28} color="#FFFFFF" fill="#FFFFFF" />
              </Pressable>
            </View>
          </>
        ) : fetchingMore ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color="#C64338" />
            <Text
              style={{ marginTop: 12, fontFamily: serifFont, color: "#8D7C75" }}
            >
              {language === "th"
                ? "กำลังโหลดโปรไฟล์เพิ่มเติม…"
                : "Loading more profiles…"}
            </Text>
          </View>
        ) : (
          <View style={feedStyles.emptyBox}>
            <View style={{ marginBottom: 12 }}>
              <Sparkles size={44} color="#C64338" />
            </View>
            <Text style={feedStyles.emptyTitle}>
              {language === "th"
                ? "ดูโปรไฟล์ทั้งหมดครบแล้ว!"
                : "You're all caught up!"}
            </Text>
            <Text style={feedStyles.emptySub}>
              {language === "th"
                ? "ระบบจะแจ้งเตือนเมื่อมีเพื่อนร่วมห้องใหม่ ๆ ที่เข้ากับคุณสมัครลงทะเบียน"
                : "New compatible roommates will appear here as soon as they sign up."}
            </Text>
            <Pressable
              style={feedStyles.refreshBtn}
              onPress={() => loadPage(true)}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <RotateCcw size={16} color="#FFFFFF" />
                <Text style={feedStyles.refreshBtnText}>
                  {language === "th" ? "โหลดโปรไฟล์อีกครั้ง" : "Refresh Feed"}
                </Text>
              </View>
            </Pressable>
          </View>
        )}
      </View>

      <BottomNav screen="feed" go={go} />
    </SafeAreaView>
  );
}
