import React, { useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Alert, Animated, Image, Pressable, SafeAreaView, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { Button, Card, Chip, Field, Header, Logo, Progress, ScreenShell } from "../components/ui";
import { api, appState, saveToken } from "../services/api";
import { C } from "../theme/colors";
import { s } from "../theme/styles";
import type { Screen } from "../types/navigation";

export function AuthChoice({ go }: { go: (x: Screen) => void }) {
  return (
    <LinearGradient
      colors={["#70152E", "#8D1E32", "#B82F2D", "#D74825"]}
      locations={[0, 0.38, 0.7, 1]}
      start={{ x: 0.16, y: 0 }}
      end={{ x: 0.84, y: 1 }}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", width: "100%" }}>
        <View style={{ transform: [{ scale: 1.2 }], marginBottom: 60 }}>
          <Logo />
        </View>
        
        <Pressable 
          style={{
            width: "80%",
            backgroundColor: "rgba(255,255,255,0.25)",
            paddingVertical: 18,
            borderRadius: 8,
            marginBottom: 20,
            alignItems: "center"
          }}
          onPress={() => go("login")}
        >
          <Text style={{ color: "#fff", fontFamily: "NotoSansThai_700Bold", fontSize: 16 }}>Login</Text>
        </Pressable>

        <Pressable 
          style={{
            width: "80%",
            backgroundColor: "rgba(255,255,255,0.25)",
            paddingVertical: 18,
            borderRadius: 8,
            alignItems: "center"
          }}
          onPress={() => go("signup")}
        >
          <Text style={{ color: "#fff", fontFamily: "NotoSansThai_700Bold", fontSize: 16 }}>Register</Text>
        </Pressable>
      </View>

      <Text style={{
        color: "rgba(255,255,255,0.8)",
        fontSize: 10,
        fontFamily: "NotoSansThai_700Bold",
        letterSpacing: 1,
        position: "absolute",
        bottom: 40
      }}>
        SURANAREE UNIVERSITY OF TECHNOLOGY
      </Text>
    </LinearGradient>
  );
}

export function Auth({
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

export function Verify({ go }: { go: (x: Screen) => void }) {
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

export function Basics({
  screen,
  go,
}: {
  screen: "basics" | "housing";
  go: (x: Screen) => void;
}) {
  const housing = screen === "housing";
  const [, rerender] = useState(0);
  const set = (key: string, value: any) => {
    appState.profileDraft[key] = value;
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
      set("photos", [...appState.profileDraft.photos, value].slice(0, 3));
    }
  };
  const proceed = async () => {
    if (!housing) {
      if (appState.profileDraft.displayName)
        await api("/api/me", {
          method: "PATCH",
          body: JSON.stringify({ displayName: appState.profileDraft.displayName }),
        });
      go("housing");
      return;
    }
    try {
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          ...appState.profileDraft,
          age: Number(appState.profileDraft.age) || null,
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
              {appState.profileDraft.photos[0] ? (
                <Image
                  source={{ uri: appState.profileDraft.photos[0] }}
                  style={s.photoImage}
                />
              ) : (
                <Text style={s.avatarLetter}>N</Text>
              )}
            </View>
            <Pressable style={s.photoAdd} onPress={addPhoto}>
              {appState.profileDraft.photos[1] ? (
                <Image
                  source={{ uri: appState.profileDraft.photos[1] }}
                  style={s.photoImage}
                />
              ) : (
                <Text>＋</Text>
              )}
            </Pressable>
            <Pressable style={s.photoAdd} onPress={addPhoto}>
              {appState.profileDraft.photos[2] ? (
                <Image
                  source={{ uri: appState.profileDraft.photos[2] }}
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
                value={appState.profileDraft.displayName}
                onChangeText={(v) => set("displayName", v)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="AGE"
                placeholder="19"
                value={appState.profileDraft.age}
                onChangeText={(v) => set("age", v)}
              />
            </View>
          </View>
          <View style={s.two}>
            <View style={{ flex: 1 }}>
              <Field
                label="MAJOR"
                placeholder="Computer Eng."
                value={appState.profileDraft.major}
                onChangeText={(v) => set("major", v)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="GENDER"
                placeholder="Male"
                value={appState.profileDraft.gender}
                onChangeText={(v) => set("gender", v)}
              />
            </View>
          </View>
          <Field
            label="SHORT BIO"
            placeholder="Coffee-powered CS student. Quiet on weekdays, board games on weekends ✌"
            value={appState.profileDraft.bio}
            onChangeText={(v) => set("bio", v)}
          />
          <Text style={s.label}>ROOM TYPE</Text>
          <View style={s.segment}>
            {["Single", "Double", "Either"].map((x) => (
              <Chip
                key={x}
                active={appState.profileDraft.roomType === x}
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
                active={appState.profileDraft.roommateGender === x}
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
                active={appState.profileDraft.year === x}
                onPress={() => set("year", x)}
              >{`Year ${x === 4 ? "4+" : x}`}</Chip>
            ))}
          </View>
          <Text style={s.label}>PREFERRED ZONE (LOCATION)</Text>
          <View style={s.wrap}>
            {["Gate 1", "Gate 4", "In-campus", "Suranaree Road"].map((x) => (
              <Chip
                key={x}
                active={appState.profileDraft.zone === x}
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

