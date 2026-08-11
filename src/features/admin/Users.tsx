import { useCallback, useEffect, useState } from "react";
import { Alert, TextInput, View } from "react-native";
import { Search } from "lucide-react-native";
import {
  Button,
  Chevron,
  MotionPressable,
  ScreenShell,
  Tag,
  Txt,
} from "../../components/ui";
import { api } from "../../services/api";
import { C } from "../../theme/colors";
import { s } from "../../theme/styles";
import { F } from "../../theme/typography";
import type { Screen } from "../../types/navigation";

type AdminUser = {
  id: string;
  displayName?: string;
  email?: string;
  role?: string;
  suspended?: boolean;
  verification?: { status?: string };
  _count?: { reportsReceived?: number };
};

/** User moderation: search, suspend, and approve student verifications. */
export function Users({ go }: { go: (x: Screen) => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api<AdminUser[]>("/api/admin/users");
      setUsers(data ?? []);
    } catch (reason) {
      Alert.alert(
        "Users",
        reason instanceof Error ? reason.message : "Unable to load",
      );
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const suspend = async (id: string, value: boolean) => {
    await api(`/api/admin/users/${id}/suspend`, {
      method: "PATCH",
      body: JSON.stringify({ suspended: value }),
    }).catch(() => undefined);
    load();
  };

  const verify = async (id: string) => {
    await api(`/api/admin/users/${id}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ status: "VERIFIED" }),
    }).catch(() => undefined);
    load();
  };

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? users.filter((u) =>
        `${u.displayName ?? ""}${u.email ?? ""}`.toLowerCase().includes(needle),
      )
    : users;

  return (
    <ScreenShell>
      <View style={[s.row, { gap: 16, height: 60 }]}>
        <MotionPressable
          onPress={() => go("dashboard")}
          pressedScale={0.9}
          style={s.iconBtn}
          accessibilityLabel="Back"
        >
          <Chevron direction="left" />
        </MotionPressable>
        <Txt role="h1" style={{ fontSize: 22 }}>
          Users & reports
        </Txt>
      </View>

      <View style={[s.input, s.row, { gap: 10 }]}>
        <Search size={18} color={C.faint} strokeWidth={1.8} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search name or email…"
          placeholderTextColor={C.faint}
          autoCapitalize="none"
          style={{
            flex: 1,
            fontFamily: F.regular,
            fontSize: 15,
            color: C.ink,
            padding: 0,
          }}
        />
      </View>

      {visible.map((user) => {
        const reports = user._count?.reportsReceived ?? 0;
        return (
          <View
            key={user.id}
            style={[
              s.card,
              reports > 0
                ? { backgroundColor: C.pink, borderColor: C.pinkBorder }
                : null,
            ]}
          >
            <View style={s.rowBetween}>
              <Txt role="h3" style={{ flex: 1 }}>
                {user.displayName ?? "—"}
              </Txt>
              {user.suspended ? <Tag>Suspended</Tag> : null}
            </View>
            <Txt role="small">
              {user.email} · {user.role}
            </Txt>
            {reports > 0 ? (
              <Txt role="small" style={{ color: C.primary }}>
                {reports} report{reports === 1 ? "" : "s"}
              </Txt>
            ) : null}

            <Button
              tone="outline"
              style={{ height: 48 }}
              onPress={() => suspend(user.id, !user.suspended)}
            >
              {user.suspended ? "Unsuspend account" : "Suspend account"}
            </Button>
            {user.verification?.status === "PENDING" ? (
              <Button
                tone="ghost"
                style={{ height: 48 }}
                onPress={() => verify(user.id)}
              >
                Verify student
              </Button>
            ) : null}
          </View>
        );
      })}
    </ScreenShell>
  );
}
