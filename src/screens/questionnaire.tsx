import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { Button, Card, Chip, Header, Progress, ScreenShell } from "../components/ui";
import { api, appState } from "../services/api";
import { C } from "../theme/colors";
import { s } from "../theme/styles";
import type { Screen } from "../types/navigation";

const next: Partial<Record<Screen, Screen>> = {
  splash: "welcome1",
  welcome1: "welcome2",
  welcome2: "welcome3",
  welcome3: "authChoice",
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

type QuestionData = { id: string; key: string; step: number; title: string; sub: string; groups: { label: string; items: string[]; active: number[] }[]; note?: string };
type AnswerData = { questionId: string; selections: string[][] };

export function Intro({ go }: { go: (x: Screen) => void }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadQuestionnaire = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const [me, qsData] = await Promise.all([
        api<{ answers?: AnswerData[] }>("/api/me"),
        api<QuestionData[]>("/api/questionnaire"),
      ]);
      if (!Array.isArray(qsData) || qsData.length === 0) {
        throw new Error("No questionnaire is available yet");
      }
      appState.questions = Object.fromEntries(
        qsData.map((question) => [question.key, question]),
      );
      const saved: Record<string, string[][]> = {};
      me.answers?.forEach((answer) => {
        const question = qsData.find((item) => item.id === answer.questionId);
        if (question) saved[question.key] = answer.selections;
      });
      appState.questionnaireDraft = Object.fromEntries(
        qsData.map((question) => {
          const savedGroups = saved[question.key];
          const mappedActive = question.groups.map((group, groupIndex) => {
            const savedItems = savedGroups?.[groupIndex];
            if (!savedItems?.length) return [...group.active];
            return savedItems
              .map((item) => group.items.indexOf(item))
              .filter((index) => index !== -1);
          });
          return [question.key, mappedActive];
        }),
      );
    } catch (reason) {
      appState.questions = null;
      appState.questionnaireDraft = null;
      setLoadError(
        reason instanceof Error
          ? reason.message
          : "Unable to load questionnaire",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestionnaire();
  }, []);

  if (loading) {
    return (
      <ScreenShell>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={C.orange} />
        </View>
      </ScreenShell>
    );
  }

  if (loadError) {
    return (
      <ScreenShell>
        <View style={s.introCenter}>
          <Text style={s.bigTitle}>Unable to load questionnaire</Text>
          <Text style={s.centerMuted}>{loadError}</Text>
        </View>
        <Button onPress={loadQuestionnaire}>Try Again</Button>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <Progress step={0} total={4} />
      <View style={s.introCenter}>
        <Text style={s.heart}>♡</Text>
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
export function Question({ screen, go }: { screen: Screen; go: (x: Screen) => void }) {
  const d = appState.questions?.[screen] as QuestionData;
  if (!appState.questionnaireDraft) {
    appState.questionnaireDraft = Object.fromEntries(Object.values(appState.questions || {}).map((v) => {
      const q = v as QuestionData;
      return [q.key, q.groups.map((g) => [...g.active])];
    }));
  }
  const [, rerender] = useState(0);
  if (!d) {
    return (
      <ScreenShell>
        <Header title="" back={() => go("intro")} />
        <View style={s.introCenter}>
          <Text style={s.bigTitle}>Question unavailable</Text>
          <Text style={s.centerMuted}>
            The questionnaire data is incomplete or could not be loaded.
          </Text>
        </View>
        <Button onPress={() => go("intro")}>Back to questionnaire</Button>
      </ScreenShell>
    );
  }
  const toggle = (group: number, item: number) => {
    const active = appState.questionnaireDraft?.[screen]?.[group] as number[];
    if (appState.questionnaireDraft && appState.questionnaireDraft[screen]) {
      appState.questionnaireDraft[screen][group] = active.includes(item)
        ? active.filter((x: number) => x !== item)
        : [...active, item];
    }
    rerender((x) => x + 1);
  };
  const proceed = async () => {
    if (screen === "q6") {
      try {
        const answers = Object.fromEntries(
          Object.values(appState.questions || {}).map((value) => {
            const q = value as QuestionData;
            return [
              q.key,
              q.groups.map((g, gi: number) =>
                g.items.filter((_, i: number) => appState.questionnaireDraft?.[q.key]?.[gi]?.includes(i)),
              ),
            ];
          }),
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
      {d.groups.map((g, gi: number) => (
        <View key={g.label + gi} style={{ marginTop: 22 }}>
          <Text style={s.label}>{g.label}</Text>
          <Card>
            <View style={s.wrap}>
              {g.items.map((x, i: number) => (
                <Chip
                  key={x}
                  active={appState.questionnaireDraft?.[screen]?.[gi]?.includes(i) ?? false}
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

export function Summary({ go }: { go: (x: Screen) => void }) {
  const complete = async () => {
    try {
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          ...appState.profileDraft,
          age: Number(appState.profileDraft.age) || null,
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
        Looking good, {appState.profileDraft.displayName || "Roomie"} ✓
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
          {appState.profileDraft.displayName || "Roomie"}, {appState.profileDraft.age || "–"} ·{" "}
          {appState.profileDraft.major || "SUT Student"}
        </Text>
        <Text style={s.muted}>
          {appState.profileDraft.bio || "Looking for a compatible roommate."}
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

