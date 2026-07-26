import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Card,
  Chip,
  Field,
  Header,
  MotionPressable,
  ScreenShell,
} from "../components/ui";
import { useI18n } from "../i18n";
import { api, appState } from "../services/api";
import { C } from "../theme/colors";
import { s } from "../theme/styles";
import type { Screen } from "../types/navigation";

export function BottomNav({
  screen,
  go,
}: {
  screen: Screen;
  go: (x: Screen) => void;
}) {
  const { t } = useI18n();
  return (
    <View style={s.nav}>
      {[
        ["⌂", "Home", "feed"],
        ["♡", "Matches", "matches"],
        ["▱", "Messages", "messages"],
        ["♙", "Profile", "myprofile"],
      ].map(([ic, l, x]) => (
        <MotionPressable
          key={l}
          onPress={() => go(x as Screen)}
          style={s.navItem}
          pressedScale={0.9}
        >
          <Text style={[s.navIcon, screen === x && { color: C.orange }]}>
            {ic}
          </Text>
          <Text style={[s.navText, screen === x && { color: C.orange }]}>
            {x === "feed"
              ? t("discover")
              : x === "matches"
                ? t("matches")
                : x === "messages"
                  ? t("messages")
                  : t("profile")}
          </Text>
        </MotionPressable>
      ))}
    </View>
  );
}
export function Feed({ go }: { go: (x: Screen) => void }) {
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
      
      setPeople(prev => {
        const newItems = data.filter((d: any) => !prev.some(p => p.id === d.id));
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
    <ScreenShell>
      <Header title="ค้นหารูมเมท" right="☷" onRight={() => go("filters")} />
      <View style={s.quickLinks}>
        <Pressable onPress={() => go("requests")}>
          <Text style={s.link}>♥ คนที่ถูกใจคุณ</Text>
        </Pressable>
        <Pressable onPress={() => go("notifications")}>
          <Text style={s.link}>♧ การแจ้งเตือน</Text>
        </Pressable>
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={C.orange} size="large" />
        </View>
      ) : person ? (
        <>
          <MotionPressable
            onPress={() => {
              appState.activeProfile = person;
              go("profile");
            }}
            pressedScale={0.985}
          >
            <View style={s.profileCard}>
              <View style={s.verified}>
                <Text style={{ color: "#fff" }}>
                  ♧{" "}
                  {person.verification?.status === "VERIFIED"
                    ? "ยืนยันแล้ว"
                    : "นักศึกษา"}
                </Text>
              </View>
              <View style={s.score}>
                <Text style={s.scoreText}>{person.score}%</Text>
              </View>
              <Text style={s.ghost}>{person.displayName?.[0] ?? "R"}</Text>
              <View style={s.profileCopy}>
                <Text style={s.profileName}>
                  {person.displayName}, {person.profile?.age ?? "–"}
                </Text>
                <Text style={{ color: "#fff" }}>
                  {person.profile?.major ?? "SUT Student"} · Year{" "}
                  {person.profile?.year ?? "–"} · wants{" "}
                  {person.profile?.roomType ?? "Any"} room
                </Text>
                <View style={s.wrap}>
                  <Chip>เข้ากันได้</Chip>
                  <Chip>{person.profile?.zone ?? "ทุกโซน"}</Chip>
                </View>
              </View>
            </View>
          </MotionPressable>
          <Text style={s.tap}>tap card to expand ↑</Text>
          <View style={s.actions}>
            <MotionPressable
              onPress={() => swipe("PASS")}
              style={s.reject}
              pressedScale={0.88}
            >
              <Text style={{ fontSize: 30, color: C.muted }}>×</Text>
            </MotionPressable>
            <MotionPressable
              onPress={() => swipe("LIKE")}
              style={s.like}
              pressedScale={0.88}
            >
              <Text style={{ fontSize: 28, color: C.ink }}>♥</Text>
            </MotionPressable>
          </View>
        </>
      ) : fetchingMore ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={C.orange} size="large" />
          <Text style={[s.muted, { marginTop: 16 }]}>กำลังหารูมเมทเพิ่มเติม...</Text>
        </View>
      ) : (
        <Card>
          <Text style={s.bigTitle}>You’re all caught up</Text>
          <Text style={s.centerMuted}>
            โปรไฟล์ที่เข้ากันได้จะปรากฏที่นี่เมื่อมีคนใหม่
          </Text>
        </Card>
      )}
      <BottomNav screen="feed" go={go} />
    </ScreenShell>
  );
}
export function Filters({ go }: { go: (x: Screen) => void }) {
  return (
    <ScreenShell>
      <View style={s.filterBackdrop} />
      <View style={s.sheet}>
        <View style={s.handle} />
        <View style={s.rowBetween}>
          <Text style={s.title}>ตัวกรอง</Text>
          <Text style={s.link}>รีเซ็ตทั้งหมด</Text>
        </View>
        <Text style={s.label}>แสดงผล</Text>
        <View style={s.segment}>
          <Chip>ผู้หญิง</Chip>
          <Chip active>ผู้ชาย</Chip>
          <Chip>ทุกคน</Chip>
        </View>
        <Field label="สาขา" placeholder="ทุกสำนักวิชา" />
        <Text style={s.label}>BUDGET (฿ / MONTH)</Text>
        <Card>
          <Text style={[s.link, { textAlign: "right" }]}>2,500 – 4,500</Text>
          <View style={s.slider}>
            <View style={s.sliderOn} />
          </View>
        </Card>
        <Text style={s.label}>ต้องเข้ากันเรื่อง</Text>
        <View style={s.wrap}>
          <Chip active>เวลานอน</Chip>
          <Chip active>ความสะอาด</Chip>
          <Chip>แขก</Chip>
          <Chip>อุณหภูมิแอร์</Chip>
        </View>
        <Text style={s.label}>คะแนนเข้ากันขั้นต่ำ</Text>
        <Card>
          <View style={s.slider}>
            <View style={[s.sliderOn, { width: "70%" }]} />
          </View>
          <View style={s.rowBetween}>
            <Text style={s.muted}>50%</Text>
            <Text style={s.tinyOrange}>70%+</Text>
            <Text style={s.muted}>95%</Text>
          </View>
        </Card>
        <Button onPress={() => go("feed")}>ใช้ตัวกรอง · 23 คน</Button>
      </View>
    </ScreenShell>
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
    <Card>
      <View style={s.personRow}>
        <View style={s.avatar}>
          <Text style={s.avatarLetter}>{p[0][0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>
            {p[0]} · {p[1]}
          </Text>
          <Text style={s.muted}>{p[2]}</Text>
        </View>
        <Pressable
          onPress={onPress}
          style={[
            s.smallAction,
            (action === "Chat" || action === "แชท") && {
              backgroundColor: C.orange,
            },
          ]}
        >
          <Text
            style={{
              color: action === "Chat" || action === "แชท" ? C.ink : C.wine,
              fontFamily: "NotoSansThai_700Bold",
            }}
          >
            {action}
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}
export function Matches({ go }: { go: (x: Screen) => void }) {
  const [matches, setMatches] = useState<any[]>([]);
  useEffect(() => {
    api("/api/matches")
      .then(setMatches)
      .catch((e) => Alert.alert("Matches", e.message));
  }, []);
  return (
    <ScreenShell>
      <Header
        title="แมตช์ของคุณ"
        right={`${matches.length} ทั้งหมด`}
        onRight={() => go("requests")}
      />
      <Text style={s.label}>ใหม่สัปดาห์นี้</Text>
      {matches.map((m) => {
        const other = m.other;
        return (
          <PersonRow
            key={m.id}
            p={[
              other?.displayName ?? "รูมเมท",
              `${m.score}%`,
              other?.profile?.major ?? "นักศึกษา SUT",
            ]}
            action="แชท"
            onPress={() => go("messages")}
          />
        );
      })}
      {!matches.length && (
        <Card>
          <Text style={s.centerMuted}>ยังไม่มีแมตช์ ลองค้นหาต่อได้เลย</Text>
        </Card>
      )}
      <BottomNav screen="matches" go={go} />
    </ScreenShell>
  );
}
export function Match({ go }: { go: (x: Screen) => void }) {
  return (
    <SafeAreaView style={s.matchPage}>
      <Text style={s.matchEyebrow}>ถูกใจกันทั้งคู่</Text>
      <Text style={s.matchTitle}>จับคู่{`\n`}สำเร็จ!</Text>
      <View style={s.matchAvatars}>
        <View style={s.matchAvatar}>
          <Text style={s.avatarLetter}>N</Text>
        </View>
        <View style={s.matchScore}>
          <Text>88%</Text>
        </View>
        <View style={[s.matchAvatar, { backgroundColor: C.orange }]}>
          <Text style={s.avatarLetter}>ม</Text>
        </View>
      </View>
      <Text style={s.matchCopy}>
        You and Mind liked each other — 88% compatible on sleep, cleanliness &
        quiet hours.
      </Text>
      <Button tone="amber" onPress={() => go("chat")}>
        เริ่มแชท
      </Button>
      <Button outline tone="amber" onPress={() => go("feed")}>
        ค้นหาต่อ
      </Button>
    </SafeAreaView>
  );
}
export function Requests({ go }: { go: (x: Screen) => void }) {
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
    <ScreenShell>
      <Header title="คนที่ถูกใจคุณ" right={`${likes.length} ใหม่`} />
      <Text style={s.muted}>
        นักศึกษาเหล่านี้ถูกใจคุณแล้ว กดถูกใจกลับเพื่อจับคู่ทันที
      </Text>
      {likes.map((x) => (
        <PersonRow
          key={x.id}
          p={[
            x.from.displayName,
            "ถูกใจคุณ",
            x.from.profile?.major ?? "นักศึกษา SUT",
          ]}
          action="ถูกใจ"
          onPress={() => likeBack(x.fromId)}
        />
      ))}
      <Card tint="#FFF7DF">
        <Text style={s.note}>
          Liking back creates a match and opens chat immediately — no waiting.
        </Text>
      </Card>
      <BottomNav screen="matches" go={go} />
    </ScreenShell>
  );
}
