import { useEffect, useRef, useState } from "react";
import { Animated, LayoutChangeEvent, Pressable, Text, View } from "react-native";
import { C } from "../theme/colors";
import { shadow } from "../theme/styles";
import { F } from "../theme/typography";

export type SegmentOption<V extends string> = { value: V; label: string };

/**
 * iOS-style segmented control on a cool grey track. The white thumb slides
 * between options rather than cross-fading, which reads as one control instead
 * of several buttons.
 */
export function Segmented<V extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: readonly SegmentOption<V>[];
  value: V | null;
  onChange: (v: V) => void;
  size?: "sm" | "md";
}) {
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options.some((o) => o.value === value);
  const slide = useRef(new Animated.Value(index)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: index,
      stiffness: 220,
      damping: 24,
      mass: 0.8,
      useNativeDriver: true,
    }).start();
  }, [index, slide]);

  const padding = 4;
  const height = size === "sm" ? 44 : 54;
  const thumbWidth =
    width > 0 ? (width - padding * 2) / options.length : 0;

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={{
        flexDirection: "row",
        backgroundColor: C.segment,
        borderRadius: 14,
        padding,
        height,
      }}
    >
      {selected && thumbWidth > 0 ? (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: padding,
              left: padding,
              width: thumbWidth,
              height: height - padding * 2,
              borderRadius: 11,
              backgroundColor: C.card,
              transform: [
                {
                  translateX: slide.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, thumbWidth],
                  }),
                },
              ],
            },
            shadow(1),
          ]}
        />
      ) : null}

      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text
              style={{
                fontFamily: active ? F.bold : F.semibold,
                fontSize: size === "sm" ? 13 : 15,
                color: active ? C.primary : C.muted,
              }}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
