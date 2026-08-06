import { ArrowLeft, Search } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "../../i18n";
import { api } from "../../services/api";
import { C } from "../../theme/colors";
import { s } from "../../theme/styles";
import type { Screen } from "../../types/navigation";
import { settingStyles } from "./settings.styles";

/** Wait this long after the last keystroke before querying. */
const DEBOUNCE_MS = 300;
/** The API returns nothing below this length, so do not bother asking. */
const MIN_QUERY_LENGTH = 2;

export function SearchUsers({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < MIN_QUERY_LENGTH) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      api(`/api/users/search?q=${encodeURIComponent(term)}`)
        .then(setResults)
        .catch((e) => Alert.alert("Search", e.message));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const toggleBlock = async (u: any) => {
    try {
      await api(u.isBlocked ? "/api/users/unblock" : "/api/users/block", {
        method: "POST",
        body: JSON.stringify({ userId: u.id }),
      });
      setResults((items) =>
        items.map((item) =>
          item.id === u.id ? { ...item, isBlocked: !item.isBlocked } : item,
        ),
      );
    } catch (e) {
      Alert.alert("Block", e instanceof Error ? e.message : "Unable to update");
    }
  };

  return (
    <SafeAreaView style={settingStyles.safeArea}>
      <ScrollView
        contentContainerStyle={settingStyles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={settingStyles.headerRow}>
          <Pressable
            style={settingStyles.backButton}
            onPress={() => go("settings")}
          >
            <ArrowLeft size={18} color="#463826" strokeWidth={2.2} />
          </Pressable>
          <Text style={settingStyles.headerTitle}>
            {language === "th" ? "ค้นหาผู้ใช้" : "Search Users"}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={{ position: "relative", marginBottom: 16 }}>
          <TextInput
            style={[s.input, { paddingLeft: 40 }]}
            placeholder={
              language === "th"
                ? "ค้นหาชื่อ, อีเมล, สาขา..."
                : "Search name, email, major..."
            }
            placeholderTextColor={C.muted}
            value={query}
            onChangeText={setQuery}
          />
          <View style={{ position: "absolute", left: 12, top: 14 }}>
            <Search size={18} color="#8D7C75" />
          </View>
        </View>

        <View style={settingStyles.sectionCard}>
          {results.map((u) => (
            <View key={u.id} style={settingStyles.rowBetween}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={settingStyles.rowTitle}>{u.displayName}</Text>
                <Text style={settingStyles.rowSub}>{u.profile?.major}</Text>
              </View>
              <Pressable onPress={() => toggleBlock(u)} hitSlop={8}>
                <Text
                  style={
                    u.isBlocked
                      ? settingStyles.unblockAction
                      : settingStyles.blockAction
                  }
                >
                  {u.isBlocked
                    ? language === "th"
                      ? "ปลดบล็อก"
                      : "Unblock"
                    : language === "th"
                      ? "บล็อก"
                      : "Block"}
                </Text>
              </Pressable>
            </View>
          ))}
          {!results.length ? (
            <Text
              style={[
                settingStyles.rowSub,
                { textAlign: "center", paddingVertical: 12 },
              ]}
            >
              {query.trim().length < MIN_QUERY_LENGTH
                ? language === "th"
                  ? "พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหา"
                  : "Type at least 2 characters to search"
                : language === "th"
                  ? "ไม่พบผู้ใช้"
                  : "No users found"}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
