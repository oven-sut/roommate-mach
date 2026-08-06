import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { Button, Card, Header, ScreenShell } from "../../components/ui";
import { api, saveToken } from "../../services/api";
import { C } from "../../theme/colors";
import { s } from "../../theme/styles";
import type { Screen } from "../../types/navigation";

type Stats = {
  members: number;
  active: number;
  matches: number;
  messages: number;
  reports: number;
};

const EMPTY_STATS: Stats = {
  members: 0,
  active: 0,
  matches: 0,
  messages: 0,
  reports: 0,
};

/** Colour per stat tile, in the order the tiles are rendered. */
const STAT_COLORS = [C.orange, C.green, C.wine, C.amber];

export function Dashboard({ go }: { go: (x: Screen) => void }) {
  const [d, setD] = useState<Stats>(EMPTY_STATS);

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
            <Text style={[s.statNum, { color: STAT_COLORS[i] }]}>
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
