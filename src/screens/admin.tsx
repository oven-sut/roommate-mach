import React, { useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Alert, Animated, Image, Pressable, SafeAreaView, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { Button, Card, Chip, Field, Header, Logo, Progress, ScreenShell } from "../components/ui";
import { api, appState, saveToken } from "../services/api";
import { C } from "../theme/colors";
import { s } from "../theme/styles";
import type { Screen } from "../types/navigation";

export function AdminLogin({ go }: { go: (x: Screen) => void }) {
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
export function Dashboard({ go }: { go: (x: Screen) => void }) {
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
export function Users({ go }: { go: (x: Screen) => void }) {
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
export function Config({ go }: { go: (x: Screen) => void }) {
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

