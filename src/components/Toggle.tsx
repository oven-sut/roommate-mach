import { useEffect, useRef } from "react";
import { Animated, Pressable } from "react-native";
import { C } from "../theme/colors";
import { shadow } from "../theme/styles";

const WIDTH = 56;
const HEIGHT = 32;
const KNOB = 26;

/** Pill switch used throughout Settings and the profile hub. */
export function Toggle({
  value,
  onChange,
  disabled = false,
  accessibilityLabel,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: value ? 1 : 0,
      stiffness: 260,
      damping: 22,
      mass: 0.6,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  return (
    <Pressable
      onPress={() => !disabled && onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View
        style={{
          width: WIDTH,
          height: HEIGHT,
          borderRadius: HEIGHT / 2,
          padding: 3,
          backgroundColor: anim.interpolate({
            inputRange: [0, 1],
            outputRange: ["#CFC7BF", "#EE7A6B"],
          }),
        }}
      >
        <Animated.View
          style={[
            {
              width: KNOB,
              height: KNOB,
              borderRadius: KNOB / 2,
              backgroundColor: C.card,
              transform: [
                {
                  translateX: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, WIDTH - KNOB - 6],
                  }),
                },
              ],
            },
            shadow(1),
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

/** Square checkbox with a tick — the terms and "remember me" controls. */
export function Checkbox({
  value,
  onChange,
  accessibilityLabel,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={{
        width: 24,
        height: 24,
        borderRadius: 7,
        borderWidth: value ? 0 : 1.5,
        borderColor: C.lineStrong,
        backgroundColor: value ? C.primary : C.card,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {value ? (
        // Tick drawn from a rotated corner so it matches the design's weight.
        <Animated.View
          style={{
            width: 6,
            height: 11,
            borderRightWidth: 2.4,
            borderBottomWidth: 2.4,
            borderColor: C.white,
            transform: [{ rotate: "45deg" }],
            marginTop: -2,
          }}
        />
      ) : null}
    </Pressable>
  );
}
