import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "../../components/ui";
import { useI18n } from "../../i18n";
import { C } from "../../theme/colors";
import type { Screen } from "../../types/navigation";
import { legalCopy, type LegalScreen } from "./legal.content";

export function Legal({
  screen,
  go,
}: {
  screen: LegalScreen;
  go: (screen: Screen) => void;
}) {
  const { language, t } = useI18n();
  const copy = legalCopy[screen];

  return (
    <SafeAreaView style={styles.safe}>
      <Header title={t(copy.title)} back={() => go("signup")} />
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Text style={styles.updated}>{t(copy.updated)}</Text>
        </View>
        <Text style={styles.intro}>{t("legalIntro")}</Text>
        {copy.sections.map((section) => (
          <View key={section.heading.en} style={styles.section}>
            <Text style={styles.heading}>{section.heading[language]}</Text>
            <Text style={styles.body}>{section.body[language]}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  page: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 34,
    gap: 14,
  },
  updated: {
    color: C.muted,
    fontFamily: "NotoSansThai_600SemiBold",
    fontSize: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  intro: {
    color: C.ink,
    fontFamily: "NotoSansThai_400Regular",
    fontSize: 13,
    lineHeight: 21,
  },
  section: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    backgroundColor: C.card,
    padding: 15,
    gap: 7,
  },
  heading: {
    color: C.ink,
    fontFamily: "NotoSansThai_800ExtraBold",
    fontSize: 15,
  },
  body: {
    color: "#5F4D50",
    fontFamily: "NotoSansThai_400Regular",
    fontSize: 12,
    lineHeight: 20,
  },
});
