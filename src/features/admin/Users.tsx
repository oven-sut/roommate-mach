import { useEffect, useState } from "react";
import { Alert, Text, TextInput } from "react-native";
import { Button, Card, Header, ScreenShell } from "../../components/ui";
import { api } from "../../services/api";
import { C } from "../../theme/colors";
import { s } from "../../theme/styles";
import type { Screen } from "../../types/navigation";

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

  const verify = async (id: string) => {
    await api(`/api/admin/users/${id}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ status: "VERIFIED" }),
    });
    await load();
  };

  const visible = users.filter((u) =>
    (u.displayName + u.email).toLowerCase().includes(query.toLowerCase()),
  );

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
      {visible.map((u) => (
        <Card key={u.id} tint={u._count?.reportsReceived ? C.pink : undefined}>
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
          <Button outline tone="wine" onPress={() => suspend(u.id, !u.suspended)}>
            {u.suspended ? "Unsuspend Account" : "Suspend Account"}
          </Button>
          {u.verification?.status === "PENDING" ? (
            <Button outline tone="wine" onPress={() => verify(u.id)}>
              Verify Student
            </Button>
          ) : null}
        </Card>
      ))}
    </ScreenShell>
  );
}
