import { useMemo, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  PanResponder,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { ChevronRight } from "lucide-react-native";
import { C } from "../theme/colors";
import { shadow } from "../theme/styles";
import { F } from "../theme/typography";

const KNOB = 56;
const PAD = 5;

/**
 * Drag-to-confirm control. Used for "swipe to enter" on the splash and
 * "Slide to start matching" on the feed — both are deliberate one-way actions
 * that should not fire on an accidental tap.
 *
 * The knob springs back unless the drag clears `threshold` of the track.
 */
export function SlideAction({
  label,
  onComplete,
  tone = "light",
  threshold = 0.62,
  style,
}: {
  label: string;
  onComplete: () => void;
  /** `light` sits on cream backgrounds, `onDark` on the wine splash. */
  tone?: "light" | "onDark";
  threshold?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const x = useRef(new Animated.Value(0)).current;
  const done = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const palette =
    tone === "onDark"
      ? {
          track: "rgba(255,255,255,.22)",
          knob: "#F6F0E4",
          icon: C.inkNavy,
          text: "rgba(255,255,255,.9)",
        }
      : {
          track: "#F1E7DC",
          knob: C.primary,
          icon: C.white,
          text: C.ink,
        };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 4,
        onPanResponderMove: (_e, g) => {
          const max = Math.max(0, widthRef.current - KNOB - PAD * 2);
          x.setValue(Math.min(max, Math.max(0, g.dx)));
        },
        onPanResponderRelease: (_e, g) => {
          const max = Math.max(1, widthRef.current - KNOB - PAD * 2);
          if (g.dx >= max * threshold && !done.current) {
            done.current = true;
            Animated.timing(x, {
              toValue: max,
              duration: 140,
              useNativeDriver: true,
            }).start(() => onCompleteRef.current());
            return;
          }
          Animated.spring(x, {
            toValue: 0,
            stiffness: 220,
            damping: 22,
            useNativeDriver: true,
          }).start();
        },
      }),
    [threshold, x],
  );

  const travel = Math.max(1, width - KNOB - PAD * 2);

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => {
        widthRef.current = e.nativeEvent.layout.width;
        setWidth(e.nativeEvent.layout.width);
      }}
      style={[
        {
          height: KNOB + PAD * 2,
          borderRadius: (KNOB + PAD * 2) / 2,
          backgroundColor: palette.track,
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Animated.Text
        style={{
          textAlign: "center",
          fontFamily: F.semibold,
          fontSize: 16,
          color: palette.text,
          paddingLeft: KNOB * 0.5,
          opacity: x.interpolate({
            inputRange: [0, travel * 0.7],
            outputRange: [1, 0],
            extrapolate: "clamp",
          }),
        }}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>

      <Animated.View
        {...responder.panHandlers}
        style={[
          {
            position: "absolute",
            left: PAD,
            width: KNOB,
            height: KNOB,
            borderRadius: KNOB / 2,
            backgroundColor: palette.knob,
            alignItems: "center",
            justifyContent: "center",
            transform: [{ translateX: x }],
          },
          shadow(2),
        ]}
      >
        <ChevronRight size={26} color={palette.icon} strokeWidth={2.4} />
      </Animated.View>
    </View>
  );
}

/** Static progress dots for the welcome carousel. */
export function Dots({ index, total }: { index: number; total: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 7, justifyContent: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === index ? 22 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === index ? "#9A7A3C" : "#D6C4A8",
          }}
        />
      ))}
    </View>
  );
}

/** Fallback text row so the component file always exports something visible. */
export function SlideHint({ children }: { children: string }) {
  return (
    <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.faint }}>
      {children}
    </Text>
  );
}
