import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { Avatar } from "../../components/Avatar";
import {
  Button,
  Chevron,
  MotionPressable,
  ScreenShell,
  Txt,
} from "../../components/ui";
import { useI18n } from "../../i18n";
import { api } from "../../services/api";
import { C } from "../../theme/colors";
import { s } from "../../theme/styles";
import type { Screen } from "../../types/navigation";

type BlockedUser = {
  id: string;
  displayName?: string;
  profile?: { photos?: string[]; major?: string };
};

/** People the user has blocked, with a one-tap unblock. */
export function BlockedUsers({ go }: { go: (x: Screen) => void }) {
  const { t } = useI18n();
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<BlockedUser[]>("/api/blocks")
      .then((data) => setBlocked(data ?? []))
      .catch(() => setBlocked([]))
      .finally(() => setLoading(false));
  }, []);

  const unblock = async (userId: string) => {
    const previous = blocked;
    setBlocked((items) => items.filter((u) => u.id !== userId));
    try {
      await api(`/api/blocks/${userId}`, { method: "DELETE" });
    } catch (reason) {
      setBlocked(previous);
      Alert.alert(
        t("unblock"),
        reason instanceof Error ? reason.message : t("somethingWrong"),
      );
    }
  };

  return (
    <ScreenShell>
      <View style={[s.row, { gap: 16, height: 60 }]}>
        <MotionPressable
          onPress={() => go("settings")}
          pressedScale={0.9}
          style={s.iconBtn}
          accessibilityLabel="Back"
        >
          <Chevron direction="left" />
        </MotionPressable>
        <Txt role="h1">{t("blockedUsers")}</Txt>
      </View>

      {loading ? (
        <View style={[s.center, { paddingVertical: 60 }]}>
          <ActivityIndicator color={C.primary} />
        </View>
      ) : blocked.length === 0 ? (
        <View style={[s.card, s.center, { paddingVertical: 40 }]}>
          <Txt role="subtitle">{t("empty")}</Txt>
        </View>
      ) : (
        blocked.map((user) => (
          <View key={user.id} style={[s.card, s.row, { gap: 14 }]}>
            <Avatar
              name={user.displayName}
              uri={user.profile?.photos?.[0]}
              size={52}
            />
            <View style={{ flex: 1, gap: 3 }}>
              <Txt role="h3" style={{ fontSize: 16 }}>
                {user.displayName ?? "—"}
              </Txt>
              {user.profile?.major ? (
                <Txt role="small">{user.profile.major}</Txt>
              ) : null}
            </View>
            <Button
              tone="ghost"
              style={{ width: 116, height: 46 }}
              onPress={() => unblock(user.id)}
            >
              {t("unblock")}
            </Button>
          </View>
        ))
      )}
    </ScreenShell>
  );
}
