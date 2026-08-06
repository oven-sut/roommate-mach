import { Pressable, Text, View } from "react-native";
import { Button, Field, Logo, ScreenShell } from "../../components/ui";
import { s } from "../../theme/styles";
import type { Screen } from "../../types/navigation";

/**
 * Not reachable from `App.tsx` — the `adminLogin` screen renders the regular
 * `Auth` form instead, and this one's fields are not wired to anything. Kept
 * as-is rather than deleted during the file split.
 */
export function AdminLogin({ go }: { go: (x: Screen) => void }) {
  return (
    <ScreenShell>
      <View style={s.adminHero}>
        <Logo dark />
        <Text style={s.bigTitle}>Admin Portal</Text>
        <Text style={s.centerMuted}>Roommate Match</Text>
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
