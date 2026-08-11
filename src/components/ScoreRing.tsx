import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { C } from "../theme/colors";
import { shadow } from "../theme/styles";
import { F } from "../theme/typography";

/**
 * The compatibility dial: a grey ring overpainted with an amber arc for the
 * score, with the percentage in the middle. Used on discover cards, match rows
 * and the match-profile hero.
 */
export function ScoreRing({
  score,
  size = 62,
  thickness = 7,
  label,
  textColor = C.wine,
  style,
}: {
  /** 0–100. A missing score renders the ring empty with an em dash. */
  score?: number | null;
  size?: number;
  thickness?: number;
  /** Overrides the centre text; defaults to `score%`. */
  label?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const pct = typeof score === "number" ? Math.max(0, Math.min(100, score)) : 0;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const id = `score-${size}-${thickness}`;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <View
        style={[
          {
            position: "absolute",
            width: size - thickness * 2,
            height: size - thickness * 2,
            borderRadius: size,
            backgroundColor: C.card,
          },
          shadow(1),
        ]}
      />
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFC93C" />
            <Stop offset="1" stopColor="#E8862F" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#DFD8D0"
          strokeWidth={thickness}
          fill="none"
        />
        {pct > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${id})`}
            strokeWidth={thickness}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${(circumference * pct) / 100} ${circumference}`}
            // Start the arc at 12 o'clock instead of 3.
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <Text
        style={{
          fontFamily: F.bold,
          fontSize: size * 0.25,
          color: textColor,
        }}
      >
        {label ?? (typeof score === "number" ? `${Math.round(pct)}%` : "–")}
      </Text>
    </View>
  );
}
