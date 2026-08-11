import { Text, View } from "react-native";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react-native";
import { C } from "../theme/colors";
import { F } from "../theme/typography";
import { MotionPressable } from "./ui";

/**
 * One column of the range picker: the selected option sits between its two
 * neighbours so the user can see what stepping will land on.
 */
function Column({
  options,
  index,
  onChange,
}: {
  options: readonly string[];
  index: number;
  onChange: (next: number) => void;
}) {
  const step = (delta: number) => {
    const next = index + delta;
    if (next >= 0 && next < options.length) onChange(next);
  };

  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <MotionPressable
        onPress={() => step(-1)}
        disabled={index === 0}
        pressedScale={0.85}
        hitSlop={10}
        accessibilityLabel="Previous"
      >
        <ChevronUp size={22} color={C.muted} strokeWidth={2.4} />
      </MotionPressable>

      <View
        style={{
          width: 96,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: C.line,
          backgroundColor: C.card,
          paddingVertical: 8,
          alignItems: "center",
        }}
      >
        <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.faint }}>
          {options[index - 1] ?? " "}
        </Text>
        <Text
          style={{
            fontFamily: F.bold,
            fontSize: 17,
            color: C.ink,
            paddingVertical: 3,
            borderBottomWidth: 1.5,
            borderColor: C.ink,
          }}
        >
          {options[index]}
        </Text>
        <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.faint }}>
          {options[index + 1] ?? " "}
        </Text>
      </View>

      <MotionPressable
        onPress={() => step(1)}
        disabled={index === options.length - 1}
        pressedScale={0.85}
        hitSlop={10}
        accessibilityLabel="Next"
      >
        <ChevronDown size={22} color={C.muted} strokeWidth={2.4} />
      </MotionPressable>
    </View>
  );
}

/**
 * Two stepper columns for picking a from–to range, matching the questionnaire's
 * "I usually sleep at" dialog. The end index is kept above the start so the
 * range can never invert.
 */
export function RangeStepper({
  options,
  from,
  to,
  onChange,
}: {
  options: readonly string[];
  from: number;
  to: number;
  onChange: (from: number, to: number) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <Column
        options={options}
        index={from}
        onChange={(next) => onChange(next, Math.max(next + 1, to))}
      />
      <ChevronRight size={22} color={C.muted} strokeWidth={2.4} />
      <Column
        options={options}
        index={to}
        onChange={(next) => onChange(Math.min(from, next - 1), next)}
      />
    </View>
  );
}
