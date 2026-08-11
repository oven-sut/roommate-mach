import { Image, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { C, G } from "../theme/colors";
import { F } from "../theme/typography";
import { formatImageUri } from "../services/api";

/** Stable per-person gradient so the same initial isn't always the same colour. */
const PALETTES = [
  ["#F5A623", "#E8862F"],
  ["#C4503F", "#8E2340"],
  ["#4A6FA5", "#3B4E86"],
  ["#2E9E5B", "#1F7A47"],
  ["#B5568F", "#8A3A6E"],
] as const;

function paletteFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

/**
 * Circular avatar. Falls back to the first letter of the name on a gradient
 * when there is no photo — which is the state most of the design mockups show.
 */
export function Avatar({
  name,
  uri,
  size = 52,
  ring,
  style,
}: {
  name?: string;
  uri?: string;
  size?: number;
  /** Draws a coloured ring around the avatar (used by the match list). */
  ring?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const source = formatImageUri(uri);
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  const colors = name ? paletteFor(name) : G.avatar;

  const border = ring
    ? { borderWidth: 3, borderColor: ring }
    : null;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: C.line,
        },
        border,
        style,
      ]}
    >
      {source ? (
        <Image
          source={{ uri: source }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={[...colors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: F.bold,
              fontSize: size * 0.42,
              color: C.white,
            }}
          >
            {initial}
          </Text>
        </LinearGradient>
      )}
    </View>
  );
}
