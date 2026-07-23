import { StatusBar } from "expo-status-bar";
import {
  NotoSansThai_400Regular,
  NotoSansThai_600SemiBold,
  NotoSansThai_700Bold,
  NotoSansThai_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/noto-sans-thai";
import React, { useEffect, useState, useRef } from "react";
import * as ImagePicker from "expo-image-picker";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  Platform,
  Animated,
} from "react-native";

const C = {
  bg: "#FCF9F7",
  card: "#FFFFFF",
  ink: "#24171A",
  muted: "#A58F91",
  line: "#EDDED8",
  orange: "#FF5B25",
  amber: "#FFAD20",
  wine: "#8F1938",
  red: "#B52D4D",
  green: "#31A76E",
  pink: "#FFF0F3",
};
type Screen =
  | "splash"
  | "welcome1"
  | "welcome2"
  | "welcome3"
  | "login"
  | "signup"
  | "forgot"
  | "verify"
  | "basics"
  | "housing"
  | "intro"
  | "q1"
  | "q2"
  | "q3"
  | "q4"
  | "q5"
  | "q6"
  | "summary"
  | "feed"
  | "filters"
  | "matches"
  | "match"
  | "requests"
  | "profile"
  | "notifications"
  | "report"
  | "myprofile"
  | "messages"
  | "chat"
  | "settings"
  | "adminLogin"
  | "dashboard"
  | "users"
  | "config";
const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === "android" ? "http://10.0.2.2:8888" : "http://localhost:8888")
).replace(/\/$/, "");
let accessToken =
  Platform.OS === "web" && typeof localStorage !== "undefined"
    ? localStorage.getItem("roomie_token")
    : null;
let activeConversationId: string | null = null;
let activeConversationName = "Chat";
let currentUserId: string | null = null;
let activeProfile: any = null;
const profileDraft: any = {
  displayName: "",
  age: "",
  major: "",
  gender: "",
  bio: "",
  year: 1,
  roomType: "Single",
  roommateGender: "Same gender",
  zone: "Gate 1",
  budgetMin: 2500,
  budgetMax: 4500,
  photos: [],
};
async function api(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      Array.isArray(data.message)
        ? data.message[0]
        : data.message || "Request failed",
    );
  return data;
}
function saveToken(token: string | null) {
  accessToken = token;
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    token
      ? localStorage.setItem("roomie_token", token)
      : localStorage.removeItem("roomie_token");
  }
}

const next: Partial<Record<Screen, Screen>> = {
  splash: "welcome1",
  welcome1: "welcome2",
  welcome2: "welcome3",
  welcome3: "login",
  signup: "verify",
  verify: "basics",
  basics: "housing",
  housing: "intro",
  intro: "q1",
  q1: "q2",
  q2: "q3",
  q3: "q4",
  q4: "q5",
  q5: "q6",
  q6: "summary",
  summary: "feed",
};

function Button({
  children,
  onPress,
  tone = "orange",
  outline = false,
}: {
  children: string;
  onPress?: () => void;
  tone?: "orange" | "wine" | "amber";
  outline?: boolean;
}) {
  const color =
    tone === "wine" ? C.wine : tone === "amber" ? C.amber : C.orange;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        {
          backgroundColor: outline ? "transparent" : color,
          borderColor: color,
          borderWidth: outline ? 1 : 0,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      <Text style={[s.buttonText, outline && { color }]}>{children}</Text>
    </Pressable>
  );
}
function Header({
  title,
  back,
  onRight,
  right,
}: {
  title: string;
  back?: () => void;
  onRight?: () => void;
  right?: string;
}) {
  return (
    <View style={s.header}>
      {back ? (
        <Pressable onPress={back} style={s.iconBtn}>
          <Text style={s.back}>‹</Text>
        </Pressable>
      ) : (
        <View style={{ width: 38 }} />
      )}
      <Text style={s.headerTitle}>{title}</Text>
      {right ? (
        <Pressable onPress={onRight} style={s.pill}>
          <Text style={s.pillText}>{right}</Text>
        </Pressable>
      ) : (
        <View style={{ width: 38 }} />
      )}
    </View>
  );
}
function Field({
  label,
  placeholder = "Type here...",
  small = false,
  value,
  onChangeText,
  secureTextEntry = false,
}: {
  label: string;
  placeholder?: string;
  small?: boolean;
  value?: string;
  onChangeText?: (v: string) => void;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={{ marginBottom: 15 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={label.includes("EMAIL") ? "none" : "sentences"}
        placeholder={placeholder}
        placeholderTextColor="#B9A8AA"
        style={[s.input, small && { height: 46 }]}
      />
    </View>
  );
}
function Chip({
  children,
  active = false,
  onPress,
}: {
  children: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipActive]}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{children}</Text>
    </Pressable>
  );
}
function Card({
  children,
  tint,
}: {
  children: React.ReactNode;
  tint?: string;
}) {
  return (
    <View style={[s.card, tint ? { backgroundColor: tint } : null]}>
      {children}
    </View>
  );
}
function Progress({ step, total = 6 }: { step: number; total?: number }) {
  return (
    <>
      <View style={s.progressTop}>
        <Text style={s.progressCount}>
          {step} of {total}
        </Text>
      </View>
      <View style={s.track}>
        <View style={[s.fill, { width: `${(step / total) * 100}%` }]} />
      </View>
    </>
  );
}
function ScreenShell({
  children,
  bottom = true,
}: {
  children: React.ReactNode;
  bottom?: boolean;
}) {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={[s.page, bottom && { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <View style={{ alignItems: "center" }}>
      <View style={[s.logo, dark && { backgroundColor: C.wine }]}>
        <Text style={s.logoText}>⌂</Text>
      </View>
      <Text style={[s.brand, dark && { color: C.ink }]}>
        SUT Roommate{`\n`}Matcher
      </Text>
    </View>
  );
}

const onboarding = [
  {
    screen: "welcome1" as Screen,
    title: "Build your lifestyle profile",
    sub: "Answer a fun 4-part questionnaire — sleep, cleanliness, guests, and study habits.",
    art: "Ploy, 19\nFood Technology\nNight Owl   Spotless",
  },
  {
    screen: "welcome2" as Screen,
    title: "Get high-compatibility matches",
    sub: "Our score compares 20+ lifestyle signals so you only meet people who fit how you live.",
    art: "88%",
  },
  {
    screen: "welcome3" as Screen,
    title: "Connect & chat safely",
    sub: "Every account is verified with an SUT student ID before anyone can chat.",
    art: "Hi! Saw we’re 92% 👋\n\nDorm 17? Let’s talk!",
  },
];

function Welcome({ screen, go }: { screen: Screen; go: (x: Screen) => void }) {
  const d = onboarding.find((x) => x.screen === screen)!;
  return (
    <ScreenShell bottom={false}>
      <View style={s.welcomeArt}>
        <Text style={screen === "welcome2" ? s.scoreArt : s.artText}>
          {d.art}
        </Text>
      </View>
      <Text style={s.bigTitle}>{d.title}</Text>
      <Text style={s.centerMuted}>{d.sub}</Text>
      <View style={s.dots}>
        <View style={[s.dot, screen === "welcome1" && s.dotOn]} />
        <View style={[s.dot, screen === "welcome2" && s.dotOn]} />
        <View style={[s.dot, screen === "welcome3" && s.dotOn]} />
      </View>
      <View style={s.rowBetween}>
        <Pressable onPress={() => go("login")}>
          <Text style={s.muted}>Skip</Text>
        </Pressable>
        <View style={{ width: 110 }}>
          <Button onPress={() => go(next[screen]!)}>
            {screen === "welcome3" ? "Get Started" : "Next"}
          </Button>
        </View>
      </View>
    </ScreenShell>
  );
}

function Auth({
  mode,
  go,
  onAuth,
}: {
  mode: "login" | "signup" | "forgot";
  go: (x: Screen) => void;
  onAuth: (token: string, user: any) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async () => {
    try {
      setBusy(true);
      setError("");
      if (!email.trim()) throw new Error("Please enter your email");
      if (mode === "forgot") {
        const d = await api("/auth/forgot-password", {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        Alert.alert(
          "Reset requested",
          d.resetToken
            ? `Development reset token: ${d.resetToken}`
            : "Please check your email.",
        );
        return;
      }
      if (mode === "signup" && password !== confirm)
        throw new Error("Passwords do not match");
      const d = await api(`/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        body: JSON.stringify(
          mode === "login"
            ? { email, password }
            : { displayName: name, email, password },
        ),
      });
      onAuth(d.access_token, d.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to continue");
    } finally {
      setBusy(false);
    }
  };
  if (mode === "forgot")
    return (
      <ScreenShell>
        <Header title="" back={() => go("login")} />
        <View style={s.authHero}>
          <View style={s.lock}>
            <Text style={{ fontSize: 28 }}>♙</Text>
          </View>
          <Text style={s.bigTitle}>Reset your password</Text>
          <Text style={s.centerMuted}>
            Enter your SUT email and we'll send you a secure reset link.
          </Text>
        </View>
        <Field
          label="SUT EMAIL"
          placeholder="b6627416@g.sut.ac.th"
          value={email}
          onChangeText={setEmail}
        />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <Button onPress={submit}>
          {busy ? "Sending..." : "Send Reset Link"}
        </Button>
        <Card tint="#FFF5DB">
          <Text style={s.note}>
            ✉ Check your inbox and spam folder. The link expires in 15 minutes.
          </Text>
        </Card>
        <Pressable onPress={() => go("login")}>
          <Text style={s.bottomLink}>Remembered it? Back to Log In</Text>
        </Pressable>
      </ScreenShell>
    );
  const login = mode === "login";
  return (
    <ScreenShell>
      <View style={s.authTitleRow}>
        <View style={s.miniLogo}>
          <Text style={{ color: "#fff" }}>⌂</Text>
        </View>
        <View>
          <Text style={s.title}>
            {login ? "Welcome back" : "Create account"}
          </Text>
          <Text style={s.muted}>
            {login ? "Log in to keep matching" : "Only SUT students can join"}
          </Text>
        </View>
      </View>
      {!login && (
        <Field
          label="FULL NAME"
          placeholder="Napat Srisawat"
          value={name}
          onChangeText={setName}
        />
      )}
      <Field
        label="SUT EMAIL"
        placeholder="b662xxxx@g.sut.ac.th"
        value={email}
        onChangeText={setEmail}
      />
      <Field
        label="PASSWORD"
        placeholder="••••••••••"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {!login && (
        <>
          <View style={s.strength}>
            <View style={s.strengthOn} />
            <View style={s.strengthMid} />
            <View style={s.strengthOff} />
            <Text style={s.tinyOrange}>Good</Text>
          </View>
          <Field
            label="CONFIRM PASSWORD"
            placeholder="••••••••••"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />
        </>
      )}
      {login ? (
        <View style={s.rowBetween}>
          <Text style={s.muted}>Your session stays signed in</Text>
          <Pressable onPress={() => go("forgot")}>
            <Text style={s.link}>Forgot password?</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={s.note}>
          ☑ I agree to the Terms and Privacy Policy, and confirm I’m a current
          SUT student.
        </Text>
      )}
      {error ? <Text style={s.error}>{error}</Text> : null}
      <Button onPress={submit}>
        {busy ? "Please wait..." : login ? "Log In" : "Create Account"}
      </Button>
      <Pressable onPress={() => go(login ? "signup" : "login")}>
        <Text style={s.bottomLink}>
          {login ? "New here?  Sign Up" : "Already have an account?  Log in"}
        </Text>
      </Pressable>
      {login && (
        <Pressable onPress={() => go("adminLogin")}>
          <Text style={[s.bottomLink, { marginTop: 16, color: C.muted }]}>
            Admin portal
          </Text>
        </Pressable>
      )}
    </ScreenShell>
  );
}

function Verify({ go }: { go: (x: Screen) => void }) {
  const [document, setDocument] = useState<string | null>(null);
  const choose = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.65,
      base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setDocument(
        asset.base64
          ? `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`
          : asset.uri,
      );
    }
  };
  const submit = async () => {
    if (!document)
      return Alert.alert("Student ID", "Please choose a photo first.");
    try {
      await api("/api/verification", {
        method: "POST",
        body: JSON.stringify({ documentUrl: document }),
      });
      go("basics");
    } catch (e) {
      Alert.alert(
        "Unable to submit",
        e instanceof Error ? e.message : "Please try again",
      );
    }
  };
  return (
    <ScreenShell>
      <Header title="Verify your student ID" back={() => go("signup")} />
      <Text style={s.centerMuted}>Required before you can match</Text>
      <View style={s.upload}>
        <Text style={{ fontSize: 30 }}>▣</Text>
        <Text style={s.title}>
          {document ? "SUT ID selected" : "Upload your SUT ID card"}
        </Text>
        <Text style={s.muted}>JPG or PNG · both sides · max 10 MB</Text>
        <View style={{ width: 160, marginTop: 15 }}>
          <Button outline onPress={choose}>
            Choose Photo
          </Button>
        </View>
      </View>
      <Card>
        <Text style={s.title}>Verification status</Text>
        <Chip active>{document ? "Ready to submit" : "Pending upload"}</Chip>
        <View style={s.verifySteps}>
          <Text style={{ color: document ? C.green : C.muted }}>
            ● Uploaded
          </Text>
          <Text style={{ color: C.amber }}>● Admin review</Text>
          <Text style={s.muted}>● Verified</Text>
        </View>
      </Card>
      <Text style={s.note}>
        ♧ Your ID is used only for verification and is deleted after approval.
      </Text>
      <Button tone="wine" onPress={submit}>
        Submit for Review
      </Button>
    </ScreenShell>
  );
}

function Basics({
  screen,
  go,
}: {
  screen: "basics" | "housing";
  go: (x: Screen) => void;
}) {
  const housing = screen === "housing";
  const [, rerender] = useState(0);
  const set = (key: string, value: any) => {
    profileDraft[key] = value;
    rerender((x) => x + 1);
  };
  const addPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.65,
      base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const value = asset.base64
        ? `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`
        : asset.uri;
      set("photos", [...profileDraft.photos, value].slice(0, 3));
    }
  };
  const proceed = async () => {
    if (!housing) {
      if (profileDraft.displayName)
        await api("/api/me", {
          method: "PATCH",
          body: JSON.stringify({ displayName: profileDraft.displayName }),
        });
      go("housing");
      return;
    }
    try {
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          ...profileDraft,
          age: Number(profileDraft.age) || null,
          completed: false,
        }),
      });
      go("intro");
    } catch (e) {
      Alert.alert("Profile", e instanceof Error ? e.message : "Unable to save");
    }
  };
  return (
    <ScreenShell>
      <Header
        title={housing ? "Housing & Education" : "About you"}
        back={() => go(housing ? "basics" : "verify")}
      />
      <Text style={s.muted}>
        {housing
          ? "More details to help us match you"
          : "This appears on your match card"}
      </Text>
      {!housing ? (
        <>
          <View style={s.photos}>
            <View style={s.photoMain}>
              {profileDraft.photos[0] ? (
                <Image
                  source={{ uri: profileDraft.photos[0] }}
                  style={s.photoImage}
                />
              ) : (
                <Text style={s.avatarLetter}>N</Text>
              )}
            </View>
            <Pressable style={s.photoAdd} onPress={addPhoto}>
              {profileDraft.photos[1] ? (
                <Image
                  source={{ uri: profileDraft.photos[1] }}
                  style={s.photoImage}
                />
              ) : (
                <Text>＋</Text>
              )}
            </Pressable>
            <Pressable style={s.photoAdd} onPress={addPhoto}>
              {profileDraft.photos[2] ? (
                <Image
                  source={{ uri: profileDraft.photos[2] }}
                  style={s.photoImage}
                />
              ) : (
                <Text>＋</Text>
              )}
            </Pressable>
          </View>
          <View style={s.two}>
            <View style={{ flex: 2 }}>
              <Field
                label="FULL NAME"
                placeholder="Napat Srisawat"
                value={profileDraft.displayName}
                onChangeText={(v) => set("displayName", v)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="AGE"
                placeholder="19"
                value={profileDraft.age}
                onChangeText={(v) => set("age", v)}
              />
            </View>
          </View>
          <View style={s.two}>
            <View style={{ flex: 1 }}>
              <Field
                label="MAJOR"
                placeholder="Computer Eng."
                value={profileDraft.major}
                onChangeText={(v) => set("major", v)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="GENDER"
                placeholder="Male"
                value={profileDraft.gender}
                onChangeText={(v) => set("gender", v)}
              />
            </View>
          </View>
          <Field
            label="SHORT BIO"
            placeholder="Coffee-powered CS student. Quiet on weekdays, board games on weekends ✌"
            value={profileDraft.bio}
            onChangeText={(v) => set("bio", v)}
          />
          <Text style={s.label}>ROOM TYPE</Text>
          <View style={s.segment}>
            {["Single", "Double", "Either"].map((x) => (
              <Chip
                key={x}
                active={profileDraft.roomType === x}
                onPress={() => set("roomType", x)}
              >
                {x}
              </Chip>
            ))}
          </View>
          <Text style={s.label}>ROOMMATE GENDER PREFERENCE</Text>
          <View style={s.wrap}>
            {["Same gender", "Any", "Non-binary friendly"].map((x) => (
              <Chip
                key={x}
                active={profileDraft.roommateGender === x}
                onPress={() => set("roommateGender", x)}
              >
                {x}
              </Chip>
            ))}
          </View>
        </>
      ) : (
        <>
          <Text style={s.label}>YEAR</Text>
          <View style={s.segment}>
            {[1, 2, 3, 4].map((x) => (
              <Chip
                key={x}
                active={profileDraft.year === x}
                onPress={() => set("year", x)}
              >{`Year ${x === 4 ? "4+" : x}`}</Chip>
            ))}
          </View>
          <Text style={s.label}>PREFERRED ZONE (LOCATION)</Text>
          <View style={s.wrap}>
            {["Gate 1", "Gate 4", "In-campus", "Suranaree Road"].map((x) => (
              <Chip
                key={x}
                active={profileDraft.zone === x}
                onPress={() => set("zone", x)}
              >
                {x}
              </Chip>
            ))}
          </View>
          <Text style={s.label}>BUDGET (฿ / MONTH)</Text>
          <Card>
            <Text style={s.link}>2,500 – 4,500</Text>
            <View style={s.slider}>
              <View style={s.sliderOn} />
            </View>
          </Card>
        </>
      )}
      <Button onPress={proceed}>
        {housing ? "Save & Continue" : "Continue"}
      </Button>
    </ScreenShell>
  );
}

const qs: Record<
  string,
  {
    step: number;
    title: string;
    sub: string;
    groups: { label: string; items: string[]; active: number[] }[];
    note?: string;
  }
> = {
  q1: {
    step: 1,
    title: "Sleep & wake",
    sub: "Drag the handles to your usual range",
    groups: [
      { label: "☾  I usually sleep at", items: ["23:00 – 00:30"], active: [0] },
      { label: "☀  I usually wake at", items: ["07:00 – 08:00"], active: [0] },
    ],
    note: "Based on your answers you’ll get the Night Owl tag on your card.",
  },
  q2: {
    step: 2,
    title: "Cleanliness",
    sub: "Pick every habit that sounds like you",
    groups: [
      {
        label: "",
        items: [
          "Spotless",
          "Tidy-ish",
          "Organized chaos",
          "Dishes same day",
          "Weekly deep clean",
          "Laundry piles up",
          "Shoes off inside",
          "Shared chore chart",
        ],
        active: [0, 3, 6],
      },
      {
        label: "How much does a clean room matter?",
        items: ["4/5"],
        active: [0],
      },
    ],
    note: "Cleanliness is weighted 25% of your match score.",
  },
  q3: {
    step: 3,
    title: "Guests & social life",
    sub: "Set your comfort zone for visitors",
    groups: [
      {
        label: "ALLOW OVERNIGHT GUESTS?",
        items: ["Yes", "Sometimes", "No"],
        active: [1],
      },
      {
        label: "GUESTS I’M OKAY WITH",
        items: ["Close friends", "Study group", "Partner", "Family", "Anyone"],
        active: [0, 1, 3],
      },
      {
        label: "MY SOCIAL BATTERY",
        items: ["Homebody", "Balanced", "Social hub"],
        active: [1],
      },
    ],
  },
  q4: {
    step: 4,
    title: "Temperature & study",
    sub: "Last one — the room environment",
    groups: [
      {
        label: "AC TEMPERATURE AT NIGHT",
        items: ["22–24°", "25–26°", "27°+"],
        active: [1],
      },
      { label: "Quiet hours matter to me", items: ["5/5"], active: [0] },
      {
        label: "I MOSTLY STUDY",
        items: ["In room", "Library", "Cafe / out"],
        active: [0],
      },
    ],
  },
  q5: {
    step: 5,
    title: "Habits & Pets",
    sub: "Be honest about your lifestyle",
    groups: [
      { label: "SMOKING", items: ["Yes", "No", "Outside only"], active: [1] },
      {
        label: "ALCOHOL / DRINKING",
        items: ["Often", "Socially", "Never"],
        active: [1],
      },
      {
        label: "PETS IN THE ROOM",
        items: ["Love them", "Have a pet", "Allergic/No"],
        active: [0],
      },
    ],
  },
  q6: {
    step: 6,
    title: "Chores & Noise",
    sub: "Living together smoothly",
    groups: [
      {
        label: "CLEANING DUTIES",
        items: ["Split equally", "Take turns", "Do my own"],
        active: [0],
      },
      { label: "Noise tolerance", items: ["Moderate"], active: [0] },
    ],
  },
};
function Intro({ go }: { go: (x: Screen) => void }) {
  return (
    <ScreenShell>
      <Progress step={0} total={4} />
      <View style={s.introCenter}>
        <View style={s.heart}>♡</View>
        <Text style={s.bigTitle}>Let's find how you live</Text>
        <Text style={s.centerMuted}>
          4 quick categories power your match score. Be honest — it’s how we
          find your fit.
        </Text>
        <View style={[s.wrap, { justifyContent: "center" }]}>
          <Chip>☾ Sleep & wake</Chip>
          <Chip>✦ Cleanliness</Chip>
          <Chip>♙ Guests</Chip>
          <Chip>☀ Temp & study</Chip>
        </View>
      </View>
      <Button onPress={() => go("q1")}>Start Questionnaire</Button>
    </ScreenShell>
  );
}
function Question({ screen, go }: { screen: Screen; go: (x: Screen) => void }) {
  const d = qs[screen];
  const [, rerender] = useState(0);
  const toggle = (group: number, item: number) => {
    const active = d.groups[group].active;
    d.groups[group].active = active.includes(item)
      ? active.filter((x) => x !== item)
      : [...active, item];
    rerender((x) => x + 1);
  };
  const proceed = async () => {
    if (screen === "q6") {
      try {
        const answers = Object.fromEntries(
          Object.entries(qs).map(([key, value]) => [
            key,
            value.groups.map((g) =>
              g.items.filter((_, i) => g.active.includes(i)),
            ),
          ]),
        );
        await api("/api/questionnaire", {
          method: "PUT",
          body: JSON.stringify({ answers, completed: true }),
        });
      } catch (e) {
        Alert.alert(
          "Unable to save",
          e instanceof Error ? e.message : "Please try again",
        );
        return;
      }
    }
    go(next[screen]!);
  };
  return (
    <ScreenShell>
      <Header
        title=""
        back={() =>
          go(screen === "q1" ? "intro" : (`q${d.step - 1}` as Screen))
        }
      />
      <Progress step={d.step} />
      <Text style={s.bigTitleLeft}>{d.title}</Text>
      <Text style={s.muted}>{d.sub}</Text>
      {d.groups.map((g, gi) => (
        <View key={g.label + gi} style={{ marginTop: 22 }}>
          <Text style={s.label}>{g.label}</Text>
          <Card>
            <View style={s.wrap}>
              {g.items.map((x, i) => (
                <Chip
                  key={x}
                  active={g.active.includes(i)}
                  onPress={() => toggle(gi, i)}
                >
                  {x}
                </Chip>
              ))}
            </View>
            {g.items.length === 1 && (
              <View style={s.slider}>
                <View style={[s.sliderOn, { width: "72%" }]} />
              </View>
            )}
          </Card>
        </View>
      ))}
      {d.note && (
        <Card tint={screen === "q1" ? C.pink : "#FFF7DF"}>
          <Text style={s.note}>{d.note}</Text>
        </Card>
      )}
      <Button
        tone={screen === "q4" || screen === "q6" ? "wine" : "orange"}
        onPress={proceed}
      >
        {screen === "q6"
          ? "Finish Questionnaire"
          : screen === "q4"
            ? "Finish — See My Summary"
            : "Continue"}
      </Button>
    </ScreenShell>
  );
}

function Summary({ go }: { go: (x: Screen) => void }) {
  const complete = async () => {
    try {
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          ...profileDraft,
          age: Number(profileDraft.age) || null,
          completed: true,
        }),
      });
      go("feed");
    } catch (e) {
      Alert.alert(
        "Unable to complete profile",
        e instanceof Error ? e.message : "Please try again",
      );
    }
  };
  return (
    <ScreenShell>
      <Progress step={6} />
      <Text style={s.bigTitle}>
        Looking good, {profileDraft.displayName || "Roomie"} ✓
      </Text>
      <Text style={s.centerMuted}>
        Here’s the profile your matches will see
      </Text>
      <Card>
        <View style={s.cover} />
        <View style={s.avatarFloat}>
          <Text style={s.avatarLetter}>N</Text>
        </View>
        <Text style={s.title}>
          {profileDraft.displayName || "Roomie"}, {profileDraft.age || "–"} ·{" "}
          {profileDraft.major || "SUT Student"}
        </Text>
        <Text style={s.muted}>
          {profileDraft.bio || "Looking for a compatible roommate."}
        </Text>
      </Card>
      <Card>
        <Text style={s.title}>Your lifestyle signature</Text>
        <View style={s.wrap}>
          <Chip active>Night Owl 23:00–00:30</Chip>
          <Chip active>Spotless 4/5</Chip>
          <Chip active>Guests: sometimes</Chip>
          <Chip active>AC 25–26°</Chip>
          <Chip active>Quiet hours 5/5</Chip>
        </View>
        <Text style={s.note}>
          These 5 signals + 15+ answers are compared with every profile to
          compute your match %.
        </Text>
      </Card>
      <Button onPress={complete}>Complete Profile</Button>
    </ScreenShell>
  );
}

function BottomNav({
  screen,
  go,
}: {
  screen: Screen;
  go: (x: Screen) => void;
}) {
  return (
    <View style={s.nav}>
      {[
        ["⌂", "Home", "feed"],
        ["♡", "Matches", "matches"],
        ["▱", "Messages", "messages"],
        ["♙", "Profile", "myprofile"],
      ].map(([ic, l, x]) => (
        <Pressable key={l} onPress={() => go(x as Screen)} style={s.navItem}>
          <Text style={[s.navIcon, screen === x && { color: C.orange }]}>
            {ic}
          </Text>
          <Text style={[s.navText, screen === x && { color: C.orange }]}>
            {l}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
function Feed({ go }: { go: (x: Screen) => void }) {
  const [people, setPeople] = useState<any[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api("/api/discover")
      .then(setPeople)
      .catch((e) => Alert.alert("Discover", e.message))
      .finally(() => setLoading(false));
  }, []);
  const person = people[index];
  const swipe = async (decision: "LIKE" | "PASS") => {
    if (!person) return;
    try {
      const result = await api(`/api/swipes/${person.id}`, {
        method: "POST",
        body: JSON.stringify({ decision }),
      });
      setIndex((i) => i + 1);
      if (result.matched) go("match");
    } catch (e) {
      Alert.alert(
        "Unable to save",
        e instanceof Error ? e.message : "Please try again",
      );
    }
  };
  return (
    <ScreenShell>
      <Header title="⌂  Discover" right="☷" onRight={() => go("filters")} />
      <View style={s.quickLinks}>
        <Pressable onPress={() => go("requests")}>
          <Text style={s.link}>♥ Likes you</Text>
        </Pressable>
        <Pressable onPress={() => go("notifications")}>
          <Text style={s.link}>♧ Notifications</Text>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator color={C.orange} />
      ) : person ? (
        <>
          <Pressable
            onPress={() => {
              activeProfile = person;
              go("profile");
            }}
          >
            <View style={s.profileCard}>
              <View style={s.verified}>
                <Text style={{ color: "#fff" }}>
                  ♧{" "}
                  {person.verification?.status === "VERIFIED"
                    ? "Verified"
                    : "Student"}
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
                  <Chip>Compatible</Chip>
                  <Chip>{person.profile?.zone ?? "Any zone"}</Chip>
                </View>
              </View>
            </View>
          </Pressable>
          <Text style={s.tap}>tap card to expand ↑</Text>
          <View style={s.actions}>
            <Pressable onPress={() => swipe("PASS")} style={s.reject}>
              <Text style={{ fontSize: 30, color: C.muted }}>×</Text>
            </Pressable>
            <Pressable onPress={() => swipe("LIKE")} style={s.like}>
              <Text style={{ fontSize: 28, color: "#fff" }}>♥</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <Card>
          <Text style={s.bigTitle}>You’re all caught up</Text>
          <Text style={s.centerMuted}>
            New compatible profiles will appear here.
          </Text>
        </Card>
      )}
      <BottomNav screen="feed" go={go} />
    </ScreenShell>
  );
}
function Filters({ go }: { go: (x: Screen) => void }) {
  return (
    <ScreenShell>
      <View style={s.filterBackdrop} />
      <View style={s.sheet}>
        <View style={s.handle} />
        <View style={s.rowBetween}>
          <Text style={s.title}>Filters</Text>
          <Text style={s.link}>Reset all</Text>
        </View>
        <Text style={s.label}>SHOW ME</Text>
        <View style={s.segment}>
          <Chip>Women</Chip>
          <Chip active>Men</Chip>
          <Chip>Everyone</Chip>
        </View>
        <Field label="MAJOR" placeholder="Any faculty" />
        <Text style={s.label}>BUDGET (฿ / MONTH)</Text>
        <Card>
          <Text style={[s.link, { textAlign: "right" }]}>2,500 – 4,500</Text>
          <View style={s.slider}>
            <View style={s.sliderOn} />
          </View>
        </Card>
        <Text style={s.label}>MUST MATCH ON</Text>
        <View style={s.wrap}>
          <Chip active>Sleep schedule</Chip>
          <Chip active>Cleanliness</Chip>
          <Chip>Guests</Chip>
          <Chip>AC temp</Chip>
        </View>
        <Text style={s.label}>MINIMUM MATCH SCORE</Text>
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
        <Button onPress={() => go("feed")}>Apply Filters · 23 people</Button>
      </View>
    </ScreenShell>
  );
}

const people = [
  ["Ploy", "92%", "Food Tech · matched 2h ago"],
  ["Mind", "88%", "Mechatronics · matched today"],
  ["Tan", "81%", "Civil Eng. · chatting"],
  ["Baitoey", "78%", "IT · chatting"],
];
function PersonRow({
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
            action === "Chat" && { backgroundColor: C.orange },
          ]}
        >
          <Text
            style={{
              color: action === "Chat" ? "#fff" : C.wine,
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
function Matches({ go }: { go: (x: Screen) => void }) {
  const [matches, setMatches] = useState<any[]>([]);
  useEffect(() => {
    api("/api/matches")
      .then(setMatches)
      .catch((e) => Alert.alert("Matches", e.message));
  }, []);
  return (
    <ScreenShell>
      <Header
        title="Your Matches"
        right={`${matches.length} total`}
        onRight={() => go("requests")}
      />
      <Text style={s.label}>NEW THIS WEEK</Text>
      {matches.map((m) => {
        const other = m.other;
        return (
          <PersonRow
            key={m.id}
            p={[
              other?.displayName ?? "Roomie",
              `${m.score}%`,
              other?.profile?.major ?? "SUT student",
            ]}
            action="Chat"
            onPress={() => go("messages")}
          />
        );
      })}
      {!matches.length && (
        <Card>
          <Text style={s.centerMuted}>No matches yet. Keep discovering!</Text>
        </Card>
      )}
      <BottomNav screen="matches" go={go} />
    </ScreenShell>
  );
}
function Match({ go }: { go: (x: Screen) => void }) {
  return (
    <SafeAreaView style={s.matchPage}>
      <Text style={s.matchEyebrow}>RECIPROCAL LIKE</Text>
      <Text style={s.matchTitle}>It's a{`\n`}Match!</Text>
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
        Start Chat
      </Button>
      <Button outline tone="amber" onPress={() => go("feed")}>
        Keep Discovering
      </Button>
    </SafeAreaView>
  );
}
function Requests({ go }: { go: (x: Screen) => void }) {
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
      <Header title="Likes You" right={`${likes.length} new`} />
      <Text style={s.muted}>
        These students already liked you. Like back to match instantly.
      </Text>
      {likes.map((x) => (
        <PersonRow
          key={x.id}
          p={[
            x.from.displayName,
            "Liked you",
            x.from.profile?.major ?? "SUT student",
          ]}
          action="Like"
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
function Profile({ go }: { go: (x: Screen) => void }) {
  const p = activeProfile;
  return (
    <ScreenShell>
      <Header title="" back={() => go("matches")} />
      <View style={[s.cover, { height: 210, backgroundColor: C.red }]} />
      <View style={[s.score, { top: 190, right: 22 }]}>
        <Text style={s.scoreText}>{p?.score ?? 92}%</Text>
      </View>
      <Text style={s.title}>
        {p?.displayName ?? "Roomie"}, {p?.profile?.age ?? "–"}{" "}
        <Text style={{ color: C.green }}>
          {p?.verification?.status === "VERIFIED"
            ? "✓ Verified"
            : "SUT Student"}
        </Text>
      </Text>
      <Text style={s.muted}>
        {p?.profile?.major ?? "SUT Student"} · Year {p?.profile?.year ?? "–"} ·{" "}
        {p?.profile?.roomType ?? "Any"} room · ฿{p?.profile?.budgetMin ?? 0}–
        {p?.profile?.budgetMax ?? 0}
      </Text>
      <Text style={s.note}>
        “{p?.profile?.bio ?? "Looking for a compatible roommate."}”
      </Text>
      <Card>
        <Text style={s.title}>Why {p?.score ?? 92}%?</Text>
        {[
          ["Sleep & Wake", "96%"],
          ["Cleanliness", "94%"],
          ["Guests & social", "88%"],
          ["Temp & study", "90%"],
        ].map((x) => (
          <View key={x[0]} style={{ marginTop: 10 }}>
            <View style={s.rowBetween}>
              <Text>{x[0]}</Text>
              <Text style={s.tinyOrange}>{x[1]}</Text>
            </View>
            <View style={s.track}>
              <View style={[s.fill, { width: x[1] as `${number}%` }]} />
            </View>
          </View>
        ))}
      </Card>
      <View style={s.wrap}>
        <Chip active>Sleeps 23:30</Chip>
        <Chip active>Spotless 5/5</Chip>
        <Chip active>Guests: sometimes</Chip>
        <Chip active>AC 25°</Chip>
      </View>
      <Button onPress={() => go("messages")}>♧ Open Messages</Button>
      <Pressable onPress={() => go("report")}>
        <Text style={s.bottomLink}>Report or block</Text>
      </Pressable>
    </ScreenShell>
  );
}

function Notifications({ go }: { go: (x: Screen) => void }) {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    api("/api/notifications")
      .then(setItems)
      .catch((e) => Alert.alert("Notifications", e.message));
  }, []);
  return (
    <ScreenShell>
      <Header
        title="Notifications"
        right={`${items.filter((x) => !x.readAt).length} new`}
      />
      {items.length ? (
        items.map((x, i) => (
          <Pressable
            key={x.id}
            onPress={async () => {
              await api(`/api/notifications/${x.id}/read`, { method: "PATCH" });
              setItems((a) =>
                a.map((n) =>
                  n.id === x.id
                    ? { ...n, readAt: new Date().toISOString() }
                    : n,
                ),
              );
            }}
          >
            <Card>
              <View style={s.personRow}>
                <View
                  style={[
                    s.notifyIcon,
                    {
                      backgroundColor:
                        x.type === "match"
                          ? C.green
                          : x.type === "like"
                            ? C.orange
                            : "#EFE5E1",
                    },
                  ]}
                >
                  <Text
                    style={{
                      color:
                        x.type === "match" || x.type === "like"
                          ? "#fff"
                          : C.ink,
                    }}
                  >
                    {x.type === "match" ? "✓" : x.type === "like" ? "♥" : "♧"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{x.title}</Text>
                  <Text style={s.muted}>{x.body}</Text>
                </View>
                {!x.readAt ? <Text style={s.tinyOrange}>New</Text> : null}
              </View>
            </Card>
          </Pressable>
        ))
      ) : (
        <Card>
          <Text style={s.centerMuted}>No notifications yet</Text>
        </Card>
      )}
    </ScreenShell>
  );
}
function Report({ go }: { go: (x: Screen) => void }) {
  const act = async (kind: "unmatch" | "block" | "report") => {
    if (!activeProfile?.id) return go("matches");
    try {
      if (kind === "unmatch")
        await api(`/api/matches/user/${activeProfile.id}`, {
          method: "DELETE",
        });
      if (kind === "block")
        await api(`/api/blocks/${activeProfile.id}`, { method: "POST" });
      if (kind === "report")
        await api(`/api/reports/${activeProfile.id}`, {
          method: "POST",
          body: JSON.stringify({
            reason: "Inappropriate behavior",
            details: "Submitted from profile",
          }),
        });
      Alert.alert(
        "Done",
        kind === "report"
          ? "Report sent to the admin team."
          : "Your preference has been updated.",
      );
      go("matches");
    } catch (e) {
      Alert.alert(
        "Unable to continue",
        e instanceof Error ? e.message : "Please try again",
      );
    }
  };
  return (
    <ScreenShell>
      <View style={[s.cover, { height: 180, backgroundColor: "#4A252B" }]} />
      <View style={s.sheet}>
        <View style={s.handle} />
        <Text style={[s.bigTitle, { marginTop: 5 }]}>Report or Block</Text>
        <Text style={s.centerMuted}>We won't tell them you did this.</Text>
        {[
          ["Unmatch", "Remove them from your matches"],
          ["Block User", "They won't be able to see or contact you"],
          ["Report User", "Inappropriate behavior, spam, or fake profile"],
        ].map((x, i) => (
          <Pressable
            key={x[0]}
            onPress={() =>
              act(i === 0 ? "unmatch" : i === 1 ? "block" : "report")
            }
          >
            <Card tint={i === 0 ? "#FFF7DF" : C.pink}>
              <Text style={[s.title, { color: C.wine }]}>{x[0]}</Text>
              <Text style={s.muted}>{x[1]}</Text>
            </Card>
          </Pressable>
        ))}
        <Button outline tone="wine" onPress={() => go("profile")}>
          Cancel
        </Button>
      </View>
    </ScreenShell>
  );
}

function MyProfile({ go }: { go: (x: Screen) => void }) {
  return (
    <ScreenShell>
      <Header title="My Profile" right="☷" onRight={() => go("settings")} />
      <Card>
        <View style={s.personRow}>
          <View style={[s.avatar, { width: 66, height: 66, borderRadius: 33 }]}>
            <Text style={s.avatarLetter}>N</Text>
          </View>
          <View>
            <Text style={s.title}>Napat Srisawat, 19</Text>
            <Text style={s.muted}>Computer Engineering · Year 2</Text>
            <Text style={{ color: C.green }}>✓ SUT Verified</Text>
          </View>
        </View>
      </Card>
      <Card>
        <View style={s.rowBetween}>
          <Text style={s.title}>Profile strength</Text>
          <Text style={s.tinyOrange}>85%</Text>
        </View>
        <View style={s.track}>
          <View style={[s.fill, { width: "85%" }]} />
        </View>
        <Text style={s.muted}>
          Add a 3rd photo to reach 100% and get seen more.
        </Text>
      </Card>
      {[
        ["Photos", "2 of 3 uploaded"],
        ["Basics & bio", "Name, major, room type, preference"],
        [
          "Lifestyle questionnaire",
          "Last taken 12 Jun · affects all match scores",
        ],
        ["Account status", "Active · visible in Discover"],
      ].map((x, i) => (
        <Pressable key={x[0]} onPress={() => i === 2 && go("intro")}>
          <Card tint={i === 2 ? "#FFF7F3" : undefined}>
            <View style={s.rowBetween}>
              <View>
                <Text style={s.title}>{x[0]}</Text>
                <Text style={s.muted}>{x[1]}</Text>
              </View>
              <Text style={s.link}>{i === 2 ? "Retake" : "›"}</Text>
            </View>
          </Card>
        </Pressable>
      ))}
      <BottomNav screen="myprofile" go={go} />
    </ScreenShell>
  );
}
function Messages({ go }: { go: (x: Screen) => void }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  useEffect(() => {
    api("/api/conversations")
      .then(setConversations)
      .catch((e) => Alert.alert("Messages", e.message));
  }, []);
  return (
    <ScreenShell>
      <Header title="Messages" right={`${conversations.length} chats`} />
      <TextInput
        style={s.input}
        placeholder="Search conversations..."
        placeholderTextColor={C.muted}
        value={query}
        onChangeText={setQuery}
      />
      {conversations
        .filter((c) =>
          c.other?.displayName?.toLowerCase().includes(query.toLowerCase()),
        )
        .map((c) => (
          <Pressable
            key={c.id}
            onPress={() => {
              activeConversationId = c.id;
              activeConversationName = c.other?.displayName ?? "Chat";
              go("chat");
            }}
          >
            <Card>
              <View style={s.personRow}>
                <View style={s.avatar}>
                  <Text style={s.avatarLetter}>
                    {c.other?.displayName?.[0] ?? "R"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>
                    {c.other?.displayName ?? "Roomie"}
                  </Text>
                  <Text style={s.muted}>
                    {c.messages?.[0]?.text ?? "Start a conversation"}
                  </Text>
                </View>
                <Text style={s.muted}>
                  {new Date(c.updatedAt).toLocaleDateString()}
                </Text>
              </View>
            </Card>
          </Pressable>
        ))}
      {!conversations.length && (
        <Card>
          <Text style={s.centerMuted}>
            Your matched conversations will appear here.
          </Text>
        </Card>
      )}
      <BottomNav screen="messages" go={go} />
    </ScreenShell>
  );
}
function Chat({ go }: { go: (x: Screen) => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const load = () =>
    activeConversationId
      ? api(`/api/conversations/${activeConversationId}/messages`)
          .then(setMessages)
          .catch((e) => Alert.alert("Chat", e.message))
      : Promise.resolve();
  useEffect(() => {
    void load();
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, []);
  const send = async () => {
    if (!activeConversationId || !text.trim()) return;
    const message = await api(
      `/api/conversations/${activeConversationId}/messages`,
      { method: "POST", body: JSON.stringify({ text }) },
    );
    setMessages((items) => [...items, message]);
    setText("");
  };
  return (
    <SafeAreaView style={s.safe}>
      <Header
        title={activeConversationName}
        back={() => go("messages")}
        right="Chat"
      />
      <Text style={s.online}>● Matched conversation</Text>
      <View style={s.chatBody}>
        <Text style={s.matchDate}>Messages are stored securely</Text>
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <View key={m.id} style={mine ? s.bubbleOut : s.bubbleIn}>
              <Text style={{ color: mine ? "#fff" : C.ink }}>{m.text}</Text>
              <Text style={{ fontSize: 9, color: mine ? "#FFE4D8" : C.muted }}>
                {new Date(m.createdAt).toLocaleTimeString()}
              </Text>
            </View>
          );
        })}
        {!messages.length && (
          <Text style={s.centerMuted}>
            Say hello to your new roommate match 👋
          </Text>
        )}
      </View>
      <View style={s.composer}>
        <Text style={{ fontSize: 22 }}>▣</Text>
        <TextInput
          style={[s.input, { height: 48, flex: 1 }]}
          placeholder="Message..."
          value={text}
          onChangeText={setText}
          onSubmitEditing={send}
        />
        <Pressable style={s.send} onPress={send}>
          <Text style={{ color: "#fff" }}>➤</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Settings({ go }: { go: (x: Screen) => void }) {
  const [toggles, setToggles] = useState([true, true, false, false]);
  const [email, setEmail] = useState("");
  useEffect(() => {
    api("/api/me")
      .then((me) => {
        const p = me.notificationPrefs ?? {};
        setEmail(me.email);
        setToggles([
          p.matches !== false,
          p.messages !== false,
          p.likes === true,
          !me.discoverable,
        ]);
      })
      .catch((e) => Alert.alert("Settings", e.message));
  }, []);
  const updateToggle = async (idx: number, value: boolean) => {
    const next = toggles.map((x, j) => (j === idx ? value : x));
    setToggles(next);
    try {
      if (idx === 3)
        await api("/api/me", {
          method: "PATCH",
          body: JSON.stringify({ discoverable: !value }),
        });
      else
        await api("/api/me", {
          method: "PATCH",
          body: JSON.stringify({
            notificationPrefs: {
              matches: next[0],
              messages: next[1],
              likes: next[2],
            },
          }),
        });
    } catch (e) {
      Alert.alert(
        "Settings",
        e instanceof Error ? e.message : "Unable to save",
      );
    }
  };
  const rows = [
    ["ACCOUNT", "Email", email],
    ["", "Change password", "›"],
    ["NOTIFICATIONS", "New matches", "toggle"],
    ["", "Messages", "toggle"],
    ["", "Likes you", "toggle"],
    ["PRIVACY", "Hide me from Discover", "toggle"],
    ["", "Blocked users", "1 ›"],
    ["", "Download my data", "›"],
    ["SUPPORT", "Help centre & FAQ", "›"],
    ["", "Report a problem", "›"],
  ];
  let ti = 0;
  return (
    <ScreenShell>
      <Header title="Settings" back={() => go("myprofile")} />
      {rows.map((r, i) => {
        const idx = r[2] === "toggle" ? ti++ : -1;
        return (
          <View key={i}>
            {r[0] ? <Text style={s.sectionLabel}>{r[0]}</Text> : null}
            <View style={s.settingRow}>
              <Text>{r[1]}</Text>
              {idx >= 0 ? (
                <Switch
                  value={toggles[idx]}
                  trackColor={{ true: C.orange, false: "#E9DEDA" }}
                  onValueChange={(v) => updateToggle(idx, v)}
                />
              ) : (
                <Text style={s.muted}>{r[2]}</Text>
              )}
            </View>
          </View>
        );
      })}
      <Button outline tone="wine" onPress={() => go("login")}>
        ↪ Log Out
      </Button>
    </ScreenShell>
  );
}

function AdminLogin({ go }: { go: (x: Screen) => void }) {
  return (
    <ScreenShell>
      <View style={s.adminHero}>
        <Logo dark />
        <Text style={s.bigTitle}>Admin Portal</Text>
        <Text style={s.centerMuted}>SUT Roommate Matcher</Text>
      </View>
      <Field label="ADMIN EMAIL" placeholder="admin@sut.ac.th" />
      <Field label="PASSWORD" placeholder="••••••••" />
      <Button tone="wine" onPress={() => go("dashboard")}>
        Login to Dashboard
      </Button>
      <Pressable onPress={() => go("login")}>
        <Text style={s.bottomLink}>Back to member login</Text>
      </Pressable>
    </ScreenShell>
  );
}
function Dashboard({ go }: { go: (x: Screen) => void }) {
  const [d, setD] = useState<any>({
    members: 0,
    active: 0,
    matches: 0,
    messages: 0,
    reports: 0,
  });
  useEffect(() => {
    api("/api/admin/dashboard")
      .then(setD)
      .catch((e) => {
        saveToken(null);
        Alert.alert("Admin", e.message);
        go("login");
      });
  }, []);
  return (
    <ScreenShell>
      <Header title="Dashboard" right="Admin" />
      <View style={s.grid}>
        {[
          [d.members, "Members"],
          [d.active, "Active Now"],
          [d.matches, "Matches"],
          [d.messages, "Messages"],
        ].map((x, i) => (
          <View style={s.stat} key={String(x[1])}>
            <Text
              style={[
                s.statNum,
                { color: [C.orange, C.green, C.wine, C.amber][i] },
              ]}
            >
              {String(x[0])}
            </Text>
            <Text style={s.muted}>{String(x[1])}</Text>
          </View>
        ))}
      </View>
      <Card>
        <View style={s.rowBetween}>
          <View>
            <Text style={s.title}>Reported Users</Text>
            <Text style={s.muted}>{d.reports} pending review</Text>
          </View>
          <Text style={s.tinyOrange}>{d.reports}</Text>
        </View>
      </Card>
      <Text style={s.title}>Quick Actions</Text>
      <Button outline tone="wine" onPress={() => go("users")}>
        Manage Users & Reports
      </Button>
      <Button outline tone="wine" onPress={() => go("config")}>
        System Configs
      </Button>
      <Button
        outline
        tone="wine"
        onPress={() => {
          saveToken(null);
          go("login");
        }}
      >
        Log Out
      </Button>
    </ScreenShell>
  );
}
function Users({ go }: { go: (x: Screen) => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const load = () =>
    api("/api/admin/users")
      .then(setUsers)
      .catch((e) => Alert.alert("Users", e.message));
  useEffect(() => {
    void load();
  }, []);
  const suspend = async (id: string, value: boolean) => {
    await api(`/api/admin/users/${id}/suspend`, {
      method: "PATCH",
      body: JSON.stringify({ suspended: value }),
    });
    await load();
  };
  return (
    <ScreenShell>
      <Header title="Users & Reports" back={() => go("dashboard")} />
      <TextInput
        style={s.input}
        placeholder="Search name or email..."
        placeholderTextColor={C.muted}
        value={query}
        onChangeText={setQuery}
      />
      {users
        .filter((u) =>
          (u.displayName + u.email).toLowerCase().includes(query.toLowerCase()),
        )
        .map((u) => (
          <Card
            key={u.id}
            tint={u._count?.reportsReceived ? C.pink : undefined}
          >
            <Text style={s.title}>
              {u.displayName}
              {u.suspended ? " (Suspended)" : ""}
            </Text>
            <Text style={s.muted}>
              {u.email} · {u.role}
            </Text>
            {u._count?.reportsReceived ? (
              <Text style={{ color: C.red }}>
                {u._count.reportsReceived} report(s)
              </Text>
            ) : null}
            <Button
              outline
              tone="wine"
              onPress={() => suspend(u.id, !u.suspended)}
            >
              {u.suspended ? "Unsuspend Account" : "Suspend Account"}
            </Button>
            {u.verification?.status === "PENDING" ? (
              <Button
                outline
                tone="wine"
                onPress={async () => {
                  await api(`/api/admin/users/${u.id}/verify`, {
                    method: "PATCH",
                    body: JSON.stringify({ status: "VERIFIED" }),
                  });
                  await load();
                }}
              >
                Verify Student
              </Button>
            ) : null}
          </Card>
        ))}
    </ScreenShell>
  );
}
function Config({ go }: { go: (x: Screen) => void }) {
  return (
    <ScreenShell>
      <Header title="Configurations" back={() => go("dashboard")} />
      <Text style={s.bigTitleLeft}>Universities</Text>
      <Card>
        <Text style={s.title}>Suranaree Univ.</Text>
        <Text style={s.muted}>@g.sut.ac.th, @sut.ac.th</Text>
        <Button outline tone="wine">
          Edit Domains
        </Button>
      </Card>
      <Button outline tone="wine">
        ＋ Add University
      </Button>
      <Text style={s.bigTitleLeft}>Match Weights</Text>
      {[
        ["Cleanliness", "25%"],
        ["Sleep Schedule", "20%"],
        ["Noise & Chores", "15%"],
      ].map((x) => (
        <Card key={x[0]}>
          <View style={s.rowBetween}>
            <Text style={s.title}>{x[0]}</Text>
            <Chip>{x[1]}</Chip>
          </View>
        </Card>
      ))}
      <Button outline tone="wine">
        ＋ Add Question
      </Button>
    </ScreenShell>
  );
}

function SplashScreen() {
  const logoOp = useRef(new Animated.Value(0)).current;
  const logoTy = useRef(new Animated.Value(30)).current;
  const textOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOp, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(logoTy, { toValue: 0, bounciness: 12, speed: 10, useNativeDriver: true }),
      ]),
      Animated.timing(textOp, { toValue: 1, duration: 600, useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <View style={s.splash}>
      <Animated.View style={{ opacity: logoOp, transform: [{ translateY: logoTy }], alignItems: "center" }}>
        <Logo />
      </Animated.View>
      <Animated.Text style={[s.splashTag, { opacity: textOp }]}>
        Find your people. Share your space.
      </Animated.Text>
      <Animated.Text style={[s.university, { opacity: textOp }]}>
        SURANAREE UNIVERSITY OF TECHNOLOGY
      </Animated.Text>
    </View>
  );
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId ?? "";
    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    } catch (e) {
      console.log("Failed to generate token", e);
    }
  } else {
    console.log("Must use physical device for Push Notifications");
  }
  return token;
}

function AppContent() {
  const [screen, setScreen] = useState<Screen>("splash");
  useEffect(() => {
    if (screen !== "splash") return;
    const t = setTimeout(async () => {
      if (accessToken) {
        try {
          const me = await api("/api/me");
          currentUserId = me.id;
          
          registerForPushNotificationsAsync().then((token) => {
            if (token) {
              api("/api/me", {
                method: "PATCH",
                body: JSON.stringify({ pushToken: token }),
              }).catch(console.error);
            }
          });

          setScreen(
            me.role === "ADMIN"
              ? "dashboard"
              : me.profile?.completed
                ? "feed"
                : "verify",
          );
        } catch {
          saveToken(null);
          setScreen("welcome1");
        }
      } else setScreen("welcome1");
    }, 800);
    return () => clearTimeout(t);
  }, [screen]);
  const go = (x: Screen) => setScreen(x);
  const onAuth = (token: string, user: any) => {
    saveToken(token);
    currentUserId = user.id;
    setScreen(user.role === "ADMIN" ? "dashboard" : "verify");
  };
  if (screen === "splash") return <SplashScreen />;
  if (screen.startsWith("welcome")) return <Welcome screen={screen} go={go} />;
  if (screen === "login" || screen === "signup" || screen === "forgot")
    return <Auth mode={screen} go={go} onAuth={onAuth} />;
  if (screen === "verify") return <Verify go={go} />;
  if (screen === "basics" || screen === "housing")
    return <Basics screen={screen} go={go} />;
  if (screen === "intro") return <Intro go={go} />;
  if (/^q[1-6]$/.test(screen)) return <Question screen={screen} go={go} />;
  if (screen === "summary") return <Summary go={go} />;
  if (screen === "feed") return <Feed go={go} />;
  if (screen === "filters") return <Filters go={go} />;
  if (screen === "matches") return <Matches go={go} />;
  if (screen === "match") return <Match go={go} />;
  if (screen === "requests") return <Requests go={go} />;
  if (screen === "profile") return <Profile go={go} />;
  if (screen === "notifications") return <Notifications go={go} />;
  if (screen === "report") return <Report go={go} />;
  if (screen === "myprofile") return <MyProfile go={go} />;
  if (screen === "messages") return <Messages go={go} />;
  if (screen === "chat") return <Chat go={go} />;
  if (screen === "settings")
    return (
      <Settings
        go={(x) => {
          if (x === "login") saveToken(null);
          go(x);
        }}
      />
    );
  if (screen === "adminLogin")
    return <Auth mode="login" go={go} onAuth={onAuth} />;
  if (screen === "dashboard") return <Dashboard go={go} />;
  if (screen === "users") return <Users go={go} />;
  return <Config go={go} />;
}
export default function App() {
  const [loaded] = useFonts({
    NotoSansThai_400Regular,
    NotoSansThai_600SemiBold,
    NotoSansThai_700Bold,
    NotoSansThai_800ExtraBold,
  });
  if (!loaded)
    return (
      <View style={s.loading}>
        <ActivityIndicator color={C.orange} />
      </View>
    );
  return (
    <>
      <StatusBar style="dark" />
      <AppContent />
    </>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
  },
  page: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingTop: 18,
    gap: 14,
  },
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.wine,
  },
  logo: {
    width: 66,
    height: 66,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,.13)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.3)",
  },
  logoText: { fontSize: 38, color: C.amber },
  brand: {
    fontFamily: "NotoSansThai_800ExtraBold",
    fontSize: 28,
    lineHeight: 40,
    textAlign: "center",
    color: "#fff",
    marginTop: 24,
  },
  splashTag: { color: "#F5C9CA", marginTop: 12 },
  university: {
    position: "absolute",
    bottom: 34,
    color: "#E8AAA8",
    fontSize: 9,
    letterSpacing: 2,
  },
  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontFamily: "NotoSansThai_800ExtraBold",
    fontSize: 20,
    color: C.ink,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  back: { fontSize: 28, color: C.wine, lineHeight: 30 },
  pill: {
    borderWidth: 1,
    borderColor: C.orange,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  pillText: {
    fontSize: 11,
    color: C.orange,
    fontFamily: "NotoSansThai_700Bold",
  },
  title: { fontFamily: "NotoSansThai_700Bold", fontSize: 16, color: C.ink },
  bigTitle: {
    fontFamily: "NotoSansThai_800ExtraBold",
    fontSize: 24,
    lineHeight: 32,
    textAlign: "center",
    color: C.ink,
  },
  bigTitleLeft: {
    fontFamily: "NotoSansThai_800ExtraBold",
    fontSize: 23,
    color: C.ink,
    marginTop: 8,
  },
  muted: {
    color: C.muted,
    fontFamily: "NotoSansThai_400Regular",
    fontSize: 12,
  },
  centerMuted: {
    color: C.muted,
    fontFamily: "NotoSansThai_400Regular",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
  },
  label: {
    fontFamily: "NotoSansThai_700Bold",
    fontSize: 11,
    letterSpacing: 0.8,
    color: C.muted,
    marginBottom: 7,
  },
  link: { color: C.orange, fontFamily: "NotoSansThai_700Bold", fontSize: 12 },
  note: {
    fontFamily: "NotoSansThai_400Regular",
    fontSize: 11,
    lineHeight: 18,
    color: "#826B6D",
  },
  tinyOrange: {
    color: C.orange,
    fontFamily: "NotoSansThai_700Bold",
    fontSize: 11,
  },
  error: {
    color: "#B42336",
    backgroundColor: "#FFF0F3",
    padding: 10,
    borderRadius: 10,
    fontFamily: "NotoSansThai_600SemiBold",
  },
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  buttonText: {
    fontFamily: "NotoSansThai_800ExtraBold",
    fontSize: 14,
    color: "#fff",
  },
  input: {
    height: 54,
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    fontFamily: "NotoSansThai_400Regular",
    color: C.ink,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#48262B",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    gap: 7,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quickLinks: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 18,
  },
  two: { flexDirection: "row", gap: 10 },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  segment: {
    flexDirection: "row",
    backgroundColor: "#F0E7E3",
    borderRadius: 12,
    padding: 3,
    marginBottom: 18,
  },
  chip: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#fff",
  },
  chipActive: { borderColor: C.orange, backgroundColor: "#FFF8F4" },
  chipText: {
    fontSize: 10,
    color: "#715E60",
    fontFamily: "NotoSansThai_600SemiBold",
  },
  chipTextActive: { color: C.orange },
  welcomeArt: {
    height: 410,
    borderRadius: 20,
    backgroundColor: "#FFE8D8",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  artText: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
    lineHeight: 25,
    color: C.ink,
    transform: [{ rotate: "-3deg" }],
  },
  scoreArt: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 10,
    borderColor: C.amber,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 24,
    color: C.wine,
    fontFamily: "NotoSansThai_800ExtraBold",
  },
  dots: { flexDirection: "row", justifyContent: "center", gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.line },
  dotOn: { width: 18, backgroundColor: C.orange },
  authTitleRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  miniLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  strength: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: -10,
    marginBottom: 12,
  },
  strengthOn: { height: 4, flex: 1, backgroundColor: C.orange },
  strengthMid: { height: 4, flex: 1, backgroundColor: C.amber },
  strengthOff: { height: 4, flex: 1, backgroundColor: C.line },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 12,
  },
  line: { height: 1, backgroundColor: C.line, flex: 1 },
  bottomLink: {
    textAlign: "center",
    marginTop: "auto",
    paddingTop: 25,
    color: C.orange,
    fontFamily: "NotoSansThai_700Bold",
    fontSize: 12,
  },
  authHero: { alignItems: "center", gap: 10, marginVertical: 45 },
  lock: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: "#FFF0E8",
    alignItems: "center",
    justifyContent: "center",
    color: C.orange,
  },
  upload: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#E8B9A5",
    borderRadius: 16,
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  verifySteps: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  photos: { flexDirection: "row", gap: 8, marginTop: 8 },
  photoMain: {
    width: 76,
    height: 76,
    borderRadius: 18,
    backgroundColor: C.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  photoImage: { width: "100%", height: "100%", borderRadius: 16 },
  photoAdd: {
    width: 70,
    height: 76,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#E8B9A5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    fontSize: 22,
    color: "#fff",
    fontFamily: "NotoSansThai_700Bold",
  },
  slider: {
    height: 7,
    borderRadius: 4,
    backgroundColor: "#EADFDA",
    marginVertical: 12,
  },
  sliderOn: {
    height: 7,
    width: "68%",
    borderRadius: 4,
    backgroundColor: C.orange,
  },
  progressTop: { alignItems: "flex-end" },
  progressCount: { color: C.muted, fontSize: 11 },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#EADFDA",
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 3, backgroundColor: C.orange },
  introCenter: {
    flex: 1,
    minHeight: 530,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  heart: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: C.orange,
    color: "#fff",
    fontSize: 40,
    textAlign: "center",
    textAlignVertical: "center",
  },
  cover: { height: 95, backgroundColor: "#DD4425", borderRadius: 14 },
  avatarFloat: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.amber,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -34,
    borderWidth: 3,
    borderColor: "#fff",
  },
  nav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: C.line,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 9,
  },
  navItem: { alignItems: "center", width: 70 },
  navIcon: { fontSize: 21, color: C.muted },
  navText: { fontSize: 9, color: C.muted },
  profileCard: {
    height: 515,
    borderRadius: 22,
    backgroundColor: C.wine,
    padding: 18,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  verified: {
    position: "absolute",
    top: 18,
    left: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fff",
    padding: 5,
  },
  score: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#fff",
    borderWidth: 7,
    borderColor: C.amber,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  scoreText: {
    fontSize: 15,
    color: C.wine,
    fontFamily: "NotoSansThai_800ExtraBold",
  },
  ghost: {
    position: "absolute",
    fontSize: 170,
    color: "rgba(255,255,255,.08)",
    alignSelf: "center",
    top: 150,
  },
  profileCopy: { gap: 7 },
  profileName: {
    fontSize: 25,
    color: "#fff",
    fontFamily: "NotoSansThai_800ExtraBold",
  },
  tap: { textAlign: "center", color: C.muted },
  actions: { flexDirection: "row", justifyContent: "center", gap: 18 },
  reject: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  like: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: C.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBackdrop: { height: 140, borderRadius: 18, backgroundColor: "#4A252B" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: C.bg,
    paddingTop: 12,
    gap: 13,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D8C7C1",
    alignSelf: "center",
  },
  personRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.wine,
    alignItems: "center",
    justifyContent: "center",
  },
  smallAction: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.line,
  },
  matchPage: {
    flex: 1,
    backgroundColor: "#78122D",
    padding: 22,
    justifyContent: "center",
    gap: 16,
  },
  matchEyebrow: {
    color: C.amber,
    letterSpacing: 2,
    textAlign: "center",
    fontFamily: "NotoSansThai_700Bold",
  },
  matchTitle: {
    fontSize: 40,
    lineHeight: 48,
    color: "#fff",
    textAlign: "center",
    fontFamily: "NotoSansThai_800ExtraBold",
  },
  matchAvatars: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  matchAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.amber,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: C.amber,
  },
  matchScore: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: C.amber,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    marginHorizontal: -8,
  },
  matchCopy: {
    color: "#F5D4DA",
    textAlign: "center",
    lineHeight: 21,
    marginVertical: 12,
  },
  notifyIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  online: { textAlign: "center", color: C.green, fontSize: 11, marginTop: -12 },
  chatBody: { flex: 1, backgroundColor: "#F8F2EE", padding: 18, gap: 12 },
  matchDate: { textAlign: "center", color: C.muted, fontSize: 10 },
  bubbleIn: {
    alignSelf: "flex-start",
    maxWidth: "75%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 13,
  },
  bubbleOut: {
    alignSelf: "flex-end",
    maxWidth: "78%",
    backgroundColor: C.orange,
    borderRadius: 14,
    padding: 13,
  },
  voice: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    color: C.orange,
  },
  composer: {
    height: 74,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    color: C.muted,
    fontSize: 10,
    fontFamily: "NotoSansThai_700Bold",
    marginTop: 10,
  },
  settingRow: {
    height: 55,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  adminHero: { minHeight: 420, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: {
    width: "48%",
    height: 100,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  statNum: { fontSize: 25, fontFamily: "NotoSansThai_800ExtraBold" },
});
