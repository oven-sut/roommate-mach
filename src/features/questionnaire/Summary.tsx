import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useI18n } from "../../i18n";
import { appState } from "../../services/api";
import { Avatar } from "../../components/Avatar";
import { Button, ScreenShell, Tag, Txt } from "../../components/ui";
import { C, G } from "../../theme/colors";
import { s, shadow } from "../../theme/styles";
import { F } from "../../theme/typography";
import { MAJOR_OPTIONS, labelFor } from "../profile/profile.content";
import type { Screen } from "../../types/navigation";
import { currentAnswers, lifestyleTags } from "./questionnaire.content";

/**
 * Closing step of onboarding: a preview of the card other students will see,
 * plus the five lifestyle signals that feed the match score.
 */
export function Summary({ go }: { go: (x: Screen) => void }) {
  const { t, language } = useI18n();
  const draft = appState.profileDraft;
  const answers = currentAnswers(appState.questionnaireDraft);
  const tags = lifestyleTags(answers);

  const firstName = draft.displayName.trim().split(" ")[0] || "";
  const major = draft.major ? labelFor(MAJOR_OPTIONS, draft.major, language) : "";
  const meta = [draft.age, major].filter(Boolean).join(" - ");

  return (
    <ScreenShell extraBottom={28}>
      <View style={[s.track, { marginTop: 12 }]}>
        <LinearGradient
          colors={[...G.amber]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: "100%", height: "100%" }}
        />
      </View>

      <View style={{ gap: 6, alignItems: "center", marginTop: 6 }}>
        <Txt role="h1" style={{ fontSize: 24, textAlign: "center" }}>
          {t("summaryTitle")}
          {firstName ? `, ${firstName}` : ""}
        </Txt>
        <Txt role="subtitle" style={{ textAlign: "center" }}>
          {t("summarySub")}
        </Txt>
      </View>

      {/* Match-card preview */}
      <View
        style={[
          {
            borderRadius: 20,
            backgroundColor: C.card,
            overflow: "hidden",
            marginTop: 8,
          },
          shadow(2),
        ]}
      >
        <LinearGradient
          colors={["#C4472C", "#E2762F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 96,
            paddingHorizontal: 18,
            paddingTop: 16,
            flexDirection: "row",
            // Without this the pills stretch to the banner height.
            alignItems: "flex-start",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <Tag tone="onDark" style={{ backgroundColor: C.white }}>
            <Txt style={{ fontFamily: F.bold, fontSize: 11, color: C.primary }}>
              {draft.propertyType}
            </Txt>
          </Tag>
          <Tag tone="onDark" style={{ backgroundColor: C.white }}>
            <Txt style={{ fontFamily: F.bold, fontSize: 11, color: C.primary }}>
              {draft.roomType}
            </Txt>
          </Tag>
        </LinearGradient>

        <View style={{ paddingHorizontal: 18, paddingBottom: 20 }}>
          <Avatar
            name={draft.displayName}
            uri={draft.photos?.[0]}
            size={78}
            style={{ marginTop: -40, borderWidth: 4, borderColor: C.card }}
          />
          <Txt role="h2" style={{ marginTop: 14 }}>
            {draft.displayName || "—"}
            {meta ? `, ${meta}` : ""}
          </Txt>
          {draft.bio ? (
            <Txt role="small" style={{ marginTop: 6 }} numberOfLines={2}>
              {draft.bio}
            </Txt>
          ) : null}
        </View>
      </View>

      {/* Lifestyle signature */}
      <View style={s.card}>
        <Txt role="h3">{t("lifestyleSignature")}</Txt>
        <View style={[s.wrap, { rowGap: 10, marginTop: 4 }]}>
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </View>
        <Txt role="tiny" style={{ marginTop: 8, lineHeight: 18 }}>
          {t("signatureNote")}
        </Txt>
      </View>

      <View style={{ flex: 1, minHeight: 20 }} />

      <View style={{ gap: 12 }}>
        <Button onPress={() => go("feed")}>{t("completeProfile")}</Button>
        <Txt role="small" style={{ textAlign: "center" }}>
          {t("nextFirstMatches")}
        </Txt>
      </View>
    </ScreenShell>
  );
}
