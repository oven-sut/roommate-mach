import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { Button, LogoTile, ScreenShell, Tag, Txt } from "../../components/ui";
import { api, resetAppState, saveToken } from "../../services/api";
import { C } from "../../theme/colors";
import { s } from "../../theme/styles";
import { F } from "../../theme/typography";
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

/** Accent colour per tile, in render order. */
const TILE_COLORS = [C.orange, C.green, C.wine, C.amber];

/** Admin overview: headline counts plus links into the moderation tools. */
export function Dashboard({ go }: { go: (x: Screen) => void }) {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);

  useEffect(() => {
    api<Stats>("/api/admin/dashboard")
      .then((data) => setStats({ ...EMPTY_STATS, ...data }))
      .catch((reason) => {
        saveToken(null);
        resetAppState();
        Alert.alert(
          "Admin",
          reason instanceof Error ? reason.message : "Session expired",
        );
        go("login");
      });
  }, [go]);

  const tiles: [number, string][] = [
    [stats.members, "Members"],
    [stats.active, "Active now"],
    [stats.matches, "Matches"],
    [stats.messages, "Messages"],
  ];

  return (
    <ScreenShell>
      <View style={[s.rowBetween, { height: 60 }]}>
        <View style={[s.row, { gap: 14 }]}>
          <LogoTile />
          <Txt role="h1">Dashboard</Txt>
        </View>
        <Tag tone="outline">ADMIN</Tag>
      </View>

      <View style={[s.wrap, { rowGap: 12 }]}>
        {tiles.map(([value, label], index) => (
          <View
            key={label}
            style={[
              s.card,
              {
                width: "47.5%",
                minHeight: 110,
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              },
            ]}
          >
            <Txt
              style={{
                fontFamily: F.bold,
                fontSize: 30,
                color: TILE_COLORS[index],
              }}
            >
              {value}
            </Txt>
            <Txt role="small">{label}</Txt>
          </View>
        ))}
      </View>

      <View style={[s.card, s.rowBetween]}>
        <View style={{ gap: 4 }}>
          <Txt role="h3">Reported users</Txt>
          <Txt role="small">{stats.reports} pending review</Txt>
        </View>
        <Txt style={{ fontFamily: F.bold, fontSize: 22, color: C.primary }}>
          {stats.reports}
        </Txt>
      </View>

      <Txt role="h3" style={{ marginTop: 6 }}>
        Quick actions
      </Txt>
      <Button tone="outline" onPress={() => go("users")}>
        Manage users & reports
      </Button>
      <Button tone="outline" onPress={() => go("config")}>
        System configuration
      </Button>
      <Button
        tone="ghost"
        onPress={() => {
          saveToken(null);
          resetAppState();
          go("login");
        }}
      >
        Log out
      </Button>
    </ScreenShell>
  );
}
