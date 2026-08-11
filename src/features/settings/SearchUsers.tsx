import { useEffect, useState } from "react";
import { Alert, TextInput, View } from "react-native";
import { Search } from "lucide-react-native";
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
import { F } from "../../theme/typography";
import type { Screen } from "../../types/navigation";

/** Wait this long after the last keystroke before querying. */
const DEBOUNCE_MS = 300;
/** The API returns nothing below this length, so do not bother asking. */
const MIN_QUERY_LENGTH = 2;

type Result = {
  id: string;
  displayName?: string;
  isBlocked?: boolean;
  profile?: { photos?: string[]; major?: string };
};

/** Find a specific student in order to block or unblock them. */
export function SearchUsers({ go }: { go: (x: Screen) => void }) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < MIN_QUERY_LENGTH) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      api<Result[]>(`/api/users/search?q=${encodeURIComponent(term)}`)
        .then((data) => setResults(data ?? []))
        .catch(() => setResults([]));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const toggleBlock = async (user: Result) => {
    const nextBlocked = !user.isBlocked;
    setResults((items) =>
      items.map((item) =>
        item.id === user.id ? { ...item, isBlocked: nextBlocked } : item,
      ),
    );
    try {
      await api(nextBlocked ? "/api/users/block" : "/api/users/unblock", {
        method: "POST",
        body: JSON.stringify({ userId: user.id }),
      });
    } catch (reason) {
      setResults((items) =>
        items.map((item) =>
          item.id === user.id ? { ...item, isBlocked: !nextBlocked } : item,
        ),
      );
      Alert.alert(
        t("block"),
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
        <Txt role="h1">{t("search")}</Txt>
      </View>

      <View style={[s.input, s.row, { gap: 10 }]}>
        <Search size={18} color={C.faint} strokeWidth={1.8} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("search")}
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

      {results.map((user) => (
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
            tone={user.isBlocked ? "ghost" : "outline"}
            style={{ width: 110, height: 46 }}
            onPress={() => toggleBlock(user)}
          >
            {user.isBlocked ? t("unblock") : t("block")}
          </Button>
        </View>
      ))}

      {query.trim().length >= MIN_QUERY_LENGTH && results.length === 0 ? (
        <View style={[s.card, s.center, { paddingVertical: 34 }]}>
          <Txt role="subtitle">{t("empty")}</Txt>
        </View>
      ) : null}
    </ScreenShell>
  );
}
