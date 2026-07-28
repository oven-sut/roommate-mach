import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowRight,
  Bell,
  Flame,
  Heart,
  MapPin,
  MessageCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  User,
  Users,
  X,
} from "lucide-react-native";
import { useI18n } from "../i18n";
import { api, appState, formatImageUri } from "../services/api";
import type { Screen } from "../types/navigation";

const serifFont = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "serif",
});

export function BottomNav({
  screen,
  go,
}: {
  screen: Screen;
  go: (x: Screen) => void;
}) {
  const { language } = useI18n();

  const navItems = [
    { id: "feed", Icon: Search, label: { th: "ค้นหา", en: "Discover" } },
    { id: "matches", Icon: Heart, label: { th: "คู่แมตช์", en: "Matches" } },
    { id: "messages", Icon: MessageCircle, label: { th: "ข้อความ", en: "Messages" } },
    { id: "myprofile", Icon: User, label: { th: "โปรไฟล์", en: "Profile" } },
  ];

  return (
    <View style={feedStyles.navContainer}>
      {navItems.map((item) => {
        const isActive = screen === item.id;
        const Icon = item.Icon;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={item.label[language === "th" ? "th" : "en"]}
            style={feedStyles.navItem}
            onPress={() => go(item.id as Screen)}
          >
            <Icon
              size={22}
              color={isActive ? "#C64338" : "#8D7C75"}
              fill={isActive && (item.id === "matches" || item.id === "myprofile") ? "#C64338" : "none"}
              strokeWidth={isActive ? 2.2 : 1.8}
            />
            <Text
              style={[
                feedStyles.navText,
                isActive && feedStyles.navTextActive,
              ]}
            >
              {item.label[language === "th" ? "th" : "en"]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

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

      if (hasMore && !fetchingMore && nextIndex >= people.length - 5) {
        loadPage(false);
      }
    } catch (e) {
      Alert.alert(
        "Unable to save",
        e instanceof Error ? e.message : "Please try again",
      );
    }
  };

  return (
    <SafeAreaView style={feedStyles.safeArea}>
      <View style={feedStyles.container}>
        {/* Header Bar */}
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

        {/* Quick Links Pill Bar */}
        <View style={feedStyles.quickRow}>
          <Pressable
            style={feedStyles.quickPill}
            onPress={() => go("requests")}
          >
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

        {/* Swiping Profile Card Container */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#C64338" />
            <Text style={{ marginTop: 12, fontFamily: serifFont, color: "#8D7C75" }}>
              {language === "th" ? "กำลังค้นหารูมเมทที่เหมาะกับคุณ…" : "Searching for compatible roommates…"}
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
              {formatImageUri(person.profile?.photos?.[0]) ? (
                <Image
                  source={{ uri: formatImageUri(person.profile?.photos?.[0]) }}
                  style={feedStyles.cardImage}
                />
              ) : (
                <View style={feedStyles.cardAvatarFallback}>
                  <Text style={feedStyles.cardAvatarLetter}>
                    {person.displayName?.[0]?.toUpperCase() ?? "R"}
                  </Text>
                </View>
              )}

              {/* Verified Badge */}
              <View style={feedStyles.verifiedBadge}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <ShieldCheck size={14} color="#4ADE80" />
                  <Text style={feedStyles.verifiedText}>
                    {person.verification?.status === "VERIFIED"
                      ? language === "th" ? "ยืนยันตัวตนแล้ว" : "Verified Student"
                      : language === "th" ? "นักศึกษา SUT" : "SUT Student"}
                  </Text>
                </View>
              </View>

              {/* Match Score Badge */}
              <View style={feedStyles.scoreBadge}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Flame size={14} color="#C64338" fill="#C64338" />
                  <Text style={feedStyles.scoreText}>{person.score ?? 85}% Match</Text>
                </View>
              </View>

              {/* Bottom Card Profile Overlay */}
              <View style={feedStyles.cardOverlay}>
                <Text style={feedStyles.cardName}>
                  {person.displayName}, {person.profile?.age ?? "19"}
                </Text>
                <Text style={feedStyles.cardDetails}>
                  {person.profile?.major ?? "SUT Student"}
                  {person.profile?.year ? ` · ${language === "th" ? `ปี ${person.profile.year}` : `Year ${person.profile.year}`}` : ""}
                  {person.profile?.roomType ? ` · ${person.profile.roomType}` : ""}
                </Text>

                <View style={feedStyles.chipsRow}>
                  <View style={feedStyles.cardChip}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Sparkles size={12} color="#FFFFFF" />
                      <Text style={feedStyles.cardChipText}>
                        {language === "th" ? "เข้ากันได้ดี" : "High Match"}
                      </Text>
                    </View>
                  </View>
                  {person.profile?.zone ? (
                    <View style={feedStyles.cardChip}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <MapPin size={12} color="#FFFFFF" />
                        <Text style={feedStyles.cardChipText}>{person.profile.zone}</Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                <Text style={feedStyles.tapHint}>
                  {language === "th" ? "👆 แตะที่การ์ดเพื่อดูโปรไฟล์ฉบับเต็ม" : "👆 Tap card to view full profile"}
                </Text>
              </View>
            </Pressable>

            {/* Action Buttons Row */}
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
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#C64338" />
            <Text style={{ marginTop: 12, fontFamily: serifFont, color: "#8D7C75" }}>
              {language === "th" ? "กำลังโหลดโปรไฟล์เพิ่มเติม…" : "Loading more profiles…"}
            </Text>
          </View>
        ) : (
          <View style={feedStyles.emptyBox}>
            <View style={{ marginBottom: 12 }}>
              <Sparkles size={44} color="#C64338" />
            </View>
            <Text style={feedStyles.emptyTitle}>
              {language === "th" ? "ดูโปรไฟล์ทั้งหมดครบแล้ว!" : "You're all caught up!"}
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
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

export function Filters({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();
  return (
    <SafeAreaView style={feedStyles.safeArea}>
      <View style={feedStyles.container}>
        <View style={feedStyles.topBar}>
          <Text style={feedStyles.appTitle}>
            {language === "th" ? "ตัวกรองค้นหา" : "Search Filters"}
          </Text>
          <Pressable onPress={() => go("feed")}>
            <X size={24} color="#7F232D" strokeWidth={2.5} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={filterStyles.sectionCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <Users size={18} color="#463826" />
              <Text style={filterStyles.sectionTitle}>
                {language === "th" ? "เพศของรูมเมท" : "Roommate Gender"}
              </Text>
            </View>
            <View style={filterStyles.pillsRow}>
              {[
                { label: { th: "ผู้หญิง", en: "Female" }, active: false },
                { label: { th: "ผู้ชาย", en: "Male" }, active: true },
                { label: { th: "ทุกคน", en: "Everyone" }, active: false },
              ].map((item, idx) => (
                <Pressable
                  key={idx}
                  style={[
                    filterStyles.pill,
                    item.active && filterStyles.pillActive,
                  ]}
                >
                  <Text
                    style={[
                      filterStyles.pillText,
                      item.active && filterStyles.pillTextActive,
                    ]}
                  >
                    {item.label[language === "th" ? "th" : "en"]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={filterStyles.sectionCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <MapPin size={18} color="#463826" />
              <Text style={filterStyles.sectionTitle}>
                {language === "th" ? "โซนหอพักที่ต้องการ" : "Preferred Zone"}
              </Text>
            </View>
            <View style={filterStyles.pillsRow}>
              {[
                { label: { th: "ประตู 1", en: "Gate 1" }, active: true },
                { label: { th: "ประตู 4", en: "Gate 4" }, active: false },
                { label: { th: "ในมหาวิทยาลัย", en: "On Campus" }, active: false },
                { label: { th: "ทุกโซน", en: "Any Zone" }, active: false },
              ].map((item, idx) => (
                <Pressable
                  key={idx}
                  style={[
                    filterStyles.pill,
                    item.active && filterStyles.pillActive,
                  ]}
                >
                  <Text
                    style={[
                      filterStyles.pillText,
                      item.active && filterStyles.pillTextActive,
                    ]}
                  >
                    {item.label[language === "th" ? "th" : "en"]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={filterStyles.sectionCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <Flame size={18} color="#C64338" />
              <Text style={filterStyles.sectionTitle}>
                {language === "th" ? "คะแนนความเข้ากันได้ขั้นต่ำ" : "Minimum Match Score"}
              </Text>
            </View>
            <View style={filterStyles.scoreRow}>
              <Text style={filterStyles.scoreValueText}>70%+ Match</Text>
            </View>
          </View>

          <Pressable style={feedStyles.refreshBtn} onPress={() => go("feed")}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={feedStyles.refreshBtnText}>
                {language === "th" ? "บันทึกตัวกรอง" : "Apply Filters"}
              </Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </View>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export function PersonRow({
  p,
  action,
  onPress,
}: {
  p: string[];
  action: string;
  onPress?: () => void;
}) {
  return (
    <View style={personRowStyles.rowCard}>
      <View style={personRowStyles.avatarBox}>
        <Text style={personRowStyles.avatarLetter}>{p[0]?.[0]?.toUpperCase() ?? "R"}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={personRowStyles.nameText}>
          {p[0]} · {p[1]}
        </Text>
        <Text style={personRowStyles.subText}>{p[2]}</Text>
      </View>
      <Pressable style={personRowStyles.actionBtn} onPress={onPress}>
        <Text style={personRowStyles.actionBtnText}>{action}</Text>
      </Pressable>
    </View>
  );
}

export function Matches({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    api("/api/matches")
      .then(setMatches)
      .catch((e) => Alert.alert("Matches", e.message));
  }, []);

  return (
    <SafeAreaView style={feedStyles.safeArea}>
      <View style={feedStyles.container}>
        <View style={feedStyles.topBar}>
          <Text style={feedStyles.appTitle}>
            {language === "th" ? "คู่แมตช์ของคุณ" : "Your Matches"}
          </Text>
          <Pressable onPress={() => go("requests")}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Heart size={16} color="#C64338" fill="#C64338" />
              <Text style={feedStyles.filterBtnText}>
                {matches.length} {language === "th" ? "แมตช์" : "Matches"}
              </Text>
            </View>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {matches.map((m) => {
            const other = m.other;
            return (
              <PersonRow
                key={m.id}
                p={[
                  other?.displayName ?? "รูมเมท",
                  `${m.score ?? 90}% Match`,
                  other?.profile?.major ?? "นักศึกษา SUT",
                ]}
                action={language === "th" ? "แชท 💬" : "Chat 💬"}
                onPress={() => go("messages")}
              />
            );
          })}

          {!matches.length && (
            <View style={feedStyles.emptyBox}>
              <View style={{ marginBottom: 12 }}>
                <Heart size={44} color="#C64338" fill="#FEEAE6" />
              </View>
              <Text style={feedStyles.emptyTitle}>
                {language === "th" ? "ยังไม่มีคู่แมตช์ในขณะนี้" : "No matches yet"}
              </Text>
              <Text style={feedStyles.emptySub}>
                {language === "th"
                  ? "กดถูกใจโปรไฟล์ที่สนใจ เมื่ออีกฝ่ายถูกใจตอบ ระบบจะจับคู่ทันที!"
                  : "Like profiles in the discover feed. When they like you back, matches will appear here!"}
              </Text>
              <Pressable style={feedStyles.refreshBtn} onPress={() => go("feed")}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={feedStyles.refreshBtnText}>
                    {language === "th" ? "ไปค้นหารูมเมท" : "Go to Discover"}
                  </Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </View>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
      <BottomNav screen="matches" go={go} />
    </SafeAreaView>
  );
}

export function Match({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();

  return (
    <SafeAreaView style={matchStyles.page}>
      <View style={matchStyles.container}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Sparkles size={20} color="#C64338" />
          <Text style={matchStyles.eyebrow}>
            {language === "th" ? "ถูกใจกันทั้งคู่!" : "It's a Match!"}
          </Text>
        </View>
        <Text style={matchStyles.title}>
          {language === "th" ? "จับคู่สำเร็จ!" : "Match Successful!"}
        </Text>

        <View style={matchStyles.avatarsRow}>
          <View style={matchStyles.avatarCircle}>
            <Text style={matchStyles.avatarText}>YOU</Text>
          </View>
          <View style={matchStyles.scoreChip}>
            <Text style={matchStyles.scoreChipText}>92% Match</Text>
          </View>
          <View style={[matchStyles.avatarCircle, { backgroundColor: "#FFF0BB", borderColor: "#FFD477" }]}>
            <Text style={[matchStyles.avatarText, { color: "#7F232D" }]}>SUT</Text>
          </View>
        </View>

        <Text style={matchStyles.copyText}>
          {language === "th"
            ? "คุณและคู่แมตช์มีความเข้ากันได้สูงถึง 92% ทั้งเรื่องเวลานอน ความสะอาด และระดับความสงบ!"
            : "You both liked each other — 92% compatible on sleep, cleanliness & quiet hours!"}
        </Text>

        <Pressable style={feedStyles.refreshBtn} onPress={() => go("messages")}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <MessageCircle size={18} color="#FFFFFF" />
            <Text style={feedStyles.refreshBtnText}>
              {language === "th" ? "เริ่มแชทเลย" : "Start Chatting"}
            </Text>
          </View>
        </Pressable>

        <Pressable style={matchStyles.secondaryBtn} onPress={() => go("feed")}>
          <Text style={matchStyles.secondaryBtnText}>
            {language === "th" ? "ค้นหาต่อ ➔" : "Keep Swiping ➔"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export function Requests({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();
  const [likes, setLikes] = useState<any[]>([]);

  useEffect(() => {
    api("/api/likes")
      .then(setLikes)
      .catch((e) => Alert.alert("Likes", e.message));
  }, []);

  const likeBack = async (id: string) => {
    const result = await api(`/api/swipes/${id}`, {
      method: "POST",
      body: JSON.stringify({ decision: "LIKE" }),
    });
    setLikes((items) => items.filter((item) => item.fromId !== id));
    if (result.matched) go("match");
  };

  return (
    <SafeAreaView style={feedStyles.safeArea}>
      <View style={feedStyles.container}>
        <View style={feedStyles.topBar}>
          <Text style={feedStyles.appTitle}>
            {language === "th" ? "คนที่ถูกใจคุณ" : "People Who Liked You"}
          </Text>
          <Pressable onPress={() => go("feed")}>
            <X size={24} color="#7F232D" strokeWidth={2.5} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {likes.map((x) => (
            <PersonRow
              key={x.id}
              p={[
                x.from.displayName,
                language === "th" ? "ถูกใจโปรไฟล์คุณ" : "Liked your profile",
                x.from.profile?.major ?? "SUT Student",
              ]}
              action={language === "th" ? "ถูกใจกลับ ❤️" : "Like Back ❤️"}
              onPress={() => likeBack(x.fromId)}
            />
          ))}

          {!likes.length && (
            <View style={feedStyles.emptyBox}>
              <View style={{ marginBottom: 12 }}>
                <Heart size={44} color="#C64338" fill="#FEEAE6" />
              </View>
              <Text style={feedStyles.emptyTitle}>
                {language === "th" ? "ยังไม่มีคนที่ถูกใจคุณในขณะนี้" : "No likes yet"}
              </Text>
              <Text style={feedStyles.emptySub}>
                {language === "th"
                  ? "เมื่อมีเพื่อนนักศึกษาถูกใจโปรไฟล์ของคุณ จะปรากฏขึ้นที่นี่เพื่อกดถูกใจกลับ"
                  : "When students like your profile, they will appear here!"}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
      <BottomNav screen="matches" go={go} />
    </SafeAreaView>
  );
}

const feedStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FEFCFA",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  appTitle: {
    fontFamily: serifFont,
    fontSize: 24,
    fontWeight: "bold",
    color: "#463826",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF6F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EADCD3",
    gap: 6,
  },
  filterBtnText: {
    fontFamily: serifFont,
    fontSize: 13,
    fontWeight: "600",
    color: "#463826",
  },
  quickRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  quickPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF6F0",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EADCD3",
    gap: 6,
  },
  quickPillText: {
    fontFamily: serifFont,
    fontSize: 13,
    fontWeight: "600",
    color: "#463826",
  },
  cardContainer: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: "#FAF6F0",
    borderWidth: 1,
    borderColor: "#EADCD3",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  cardAvatarFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F0CDBF",
    alignItems: "center",
    justifyContent: "center",
  },
  cardAvatarLetter: {
    fontFamily: serifFont,
    fontSize: 72,
    fontWeight: "bold",
    color: "#7F232D",
  },
  verifiedBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scoreBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#FFF0BB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFD477",
  },
  scoreText: {
    fontFamily: serifFont,
    fontSize: 13,
    fontWeight: "bold",
    color: "#7F232D",
  },
  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "rgba(30, 20, 15, 0.78)",
  },
  cardName: {
    fontFamily: serifFont,
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  cardDetails: {
    fontFamily: serifFont,
    fontSize: 13,
    color: "#EADCD3",
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  cardChip: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cardChipText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  tapHint: {
    fontFamily: serifFont,
    fontSize: 11,
    color: "#D6C6B8",
    textAlign: "center",
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingVertical: 16,
  },
  btnPass: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#EADCD3",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  btnSuper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF0BB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFD477",
  },
  btnLike: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#C64338",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C64338",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FAF6F0",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EADCD3",
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: serifFont,
    fontSize: 20,
    fontWeight: "bold",
    color: "#463826",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: serifFont,
    fontSize: 14,
    color: "#74675E",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  refreshBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#C64338",
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshBtnText: {
    fontFamily: serifFont,
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  navContainer: {
    flexDirection: "row",
    height: 64,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EADCD3",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  navText: {
    fontFamily: serifFont,
    fontSize: 11,
    color: "#8D7C75",
    fontWeight: "500",
    marginTop: 3,
  },
  navTextActive: {
    color: "#C64338",
    fontWeight: "bold",
  },
});

const filterStyles = StyleSheet.create({
  sectionCard: {
    backgroundColor: "#FAF6F0",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  sectionTitle: {
    fontFamily: serifFont,
    fontSize: 15,
    fontWeight: "bold",
    color: "#463826",
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  pillActive: {
    backgroundColor: "#FFF0BB",
    borderColor: "#FFD477",
  },
  pillText: {
    fontFamily: serifFont,
    fontSize: 13,
    fontWeight: "600",
    color: "#463826",
  },
  pillTextActive: {
    color: "#7F232D",
    fontWeight: "bold",
  },
  scoreRow: {
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  scoreValueText: {
    fontFamily: serifFont,
    fontSize: 18,
    fontWeight: "bold",
    color: "#C64338",
  },
});

const personRowStyles = StyleSheet.create({
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF6F0",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EADCD3",
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F0CDBF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarLetter: {
    fontFamily: serifFont,
    fontSize: 20,
    fontWeight: "bold",
    color: "#7F232D",
  },
  nameText: {
    fontFamily: serifFont,
    fontSize: 15,
    fontWeight: "bold",
    color: "#463826",
  },
  subText: {
    fontFamily: serifFont,
    fontSize: 12,
    color: "#8D7C75",
  },
  actionBtn: {
    backgroundColor: "#C64338",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnText: {
    fontFamily: serifFont,
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});

const matchStyles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#FEFCFA",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontFamily: serifFont,
    fontSize: 16,
    fontWeight: "bold",
    color: "#C64338",
  },
  title: {
    fontFamily: serifFont,
    fontSize: 32,
    fontWeight: "bold",
    color: "#463826",
    marginBottom: 24,
  },
  avatarsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0CDBF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#EADCD3",
  },
  avatarText: {
    fontFamily: serifFont,
    fontSize: 18,
    fontWeight: "bold",
    color: "#7F232D",
  },
  scoreChip: {
    backgroundColor: "#C64338",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: -12,
    zIndex: 10,
  },
  scoreChipText: {
    fontFamily: serifFont,
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  copyText: {
    fontFamily: serifFont,
    fontSize: 15,
    color: "#74675E",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  secondaryBtn: {
    marginTop: 14,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontFamily: serifFont,
    fontSize: 14,
    fontWeight: "bold",
    color: "#7F232D",
  },
});
