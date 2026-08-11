import { Image, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ShieldCheck } from "lucide-react-native";
import { useI18n } from "../../i18n";
import { formatImageUri } from "../../services/api";
import { ScoreRing } from "../../components/ScoreRing";
import { MotionPressable, Tag, Txt } from "../../components/ui";
import { C, G } from "../../theme/colors";
import { s, shadow } from "../../theme/styles";
import { F } from "../../theme/typography";
import type { MatchProfile } from "../../types/models";
import { cardTags, describe, isVerified, nameAndAge } from "./discovery.content";

/**
 * The swipeable profile card.
 *
 * When the student has no photo the card falls back to the crimson gradient
 * with an oversized ghost initial, which is how every mockup in the design
 * board renders — a photo simply overlays it.
 */
export function DiscoverCard({
  person,
  onPress,
  showScore = true,
  dimmed = false,
}: {
  person: MatchProfile;
  onPress?: () => void;
  showScore?: boolean;
  /** Renders the darkened state used while a like animates. */
  dimmed?: boolean;
}) {
  const { t, language } = useI18n();
  const photo = formatImageUri(person.profile?.photos?.[0]);
  const initial = (person.displayName?.trim()[0] ?? "?").toUpperCase();
  const tags = cardTags(person);

  return (
    <MotionPressable
      onPress={onPress}
      pressedScale={0.985}
      accessibilityRole="button"
      accessibilityLabel={nameAndAge(person)}
      style={[{ flex: 1, borderRadius: 24, overflow: "hidden" }, shadow(2)]}
    >
      <LinearGradient
        colors={[...G.card]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ flex: 1, padding: 20, justifyContent: "flex-end" }}
      >
        {photo ? (
          <Image
            source={{ uri: photo }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            resizeMode="cover"
          />
        ) : (
          <Txt
            style={{
              position: "absolute",
              alignSelf: "center",
              top: "34%",
              fontSize: 168,
              lineHeight: 190,
              color: "rgba(255,255,255,.18)",
              fontFamily: F.bold,
            }}
          >
            {initial}
          </Txt>
        )}

        {/* Scrim keeps the name legible over a photo. */}
        {photo ? (
          <LinearGradient
            colors={["rgba(60,20,14,0)", "rgba(60,20,14,.78)"]}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "55%",
            }}
          />
        ) : null}

        {dimmed ? (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(74,20,26,.55)",
            }}
          />
        ) : null}

        <View
          style={{
            position: "absolute",
            top: 18,
            left: 18,
            right: 18,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          {isVerified(person) ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,.6)",
                backgroundColor: "rgba(255,255,255,.16)",
              }}
            >
              <ShieldCheck size={13} color="#9BE3B0" strokeWidth={2.2} />
              <Txt
                style={{ fontFamily: F.semibold, fontSize: 11, color: C.white }}
              >
                {t("verified")}
              </Txt>
            </View>
          ) : (
            <View />
          )}

          {showScore && typeof person.score === "number" ? (
            <ScoreRing score={person.score} size={62} thickness={7} />
          ) : null}
        </View>

        <Txt
          style={{
            position: "absolute",
            alignSelf: "center",
            top: "48%",
            fontFamily: F.regular,
            fontSize: 15,
            color: "rgba(255,255,255,.85)",
          }}
        >
          {t("tapCardExpand")} ›
        </Txt>

        <View style={{ gap: 10 }}>
          <Txt style={{ fontFamily: F.bold, fontSize: 28, color: C.white }}>
            {nameAndAge(person)}
          </Txt>
          <Txt
            style={{
              fontFamily: F.semibold,
              fontSize: 13,
              color: "rgba(255,255,255,.92)",
            }}
          >
            {describe(person, language, t)}
          </Txt>
          <View style={[s.wrap, { rowGap: 8 }]}>
            {tags.map((tag) => (
              <Tag key={tag} tone="onDark">
                {tag}
              </Tag>
            ))}
          </View>
        </View>
      </LinearGradient>
    </MotionPressable>
  );
}
