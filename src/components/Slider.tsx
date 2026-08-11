import { useCallback, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  PanResponder,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { C, G } from "../theme/colors";
import { shadow } from "../theme/styles";
import { F } from "../theme/typography";

const TRACK_HEIGHT = 6;
const THUMB = 22;

function Thumb({ left }: { left: number }) {
  return (
    <View
      style={[
        {
          position: "absolute",
          left: left - THUMB / 2,
          top: TRACK_HEIGHT / 2 - THUMB / 2,
          width: THUMB,
          height: THUMB,
          borderRadius: THUMB / 2,
          backgroundColor: C.card,
          borderWidth: 4,
          borderColor: C.amber,
        },
        shadow(1),
      ]}
    />
  );
}

/** Evenly spaced captions rendered under a track ("never · monthly · weekly"). */
function Ticks({ labels }: { labels: readonly string[] }) {
  return (
    <View style={{ flexDirection: "row", marginTop: 12 }}>
      {labels.map((label, i) => (
        <Text
          key={`${label}-${i}`}
          style={{
            flex: 1,
            fontFamily: F.regular,
            fontSize: 12,
            color: C.muted,
            textAlign:
              i === 0 ? "left" : i === labels.length - 1 ? "right" : "center",
          }}
        >
          {label}
        </Text>
      ))}
    </View>
  );
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Single-value slider snapped to whole steps.
 *
 * The gesture works off absolute touch position rather than accumulated deltas
 * so tapping anywhere on the track jumps straight there, which is what the
 * design's wide 0–5 / 0–8 scales expect.
 */
export function Slider({
  min = 0,
  max = 5,
  step = 1,
  value,
  onChange,
  labels,
  style,
}: {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  /** Captions under the track. Two labels render as end-caps. */
  labels?: readonly string[];
  style?: StyleProp<ViewStyle>;
}) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const toValue = useCallback(
    (x: number) => {
      const w = widthRef.current;
      if (w <= 0) return min;
      const ratio = clamp(x / w, 0, 1);
      const raw = min + ratio * (max - min);
      return clamp(Math.round(raw / step) * step, min, max);
    },
    [min, max, step],
  );

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) =>
          onChangeRef.current(toValue(e.nativeEvent.locationX)),
        onPanResponderMove: (_e, gesture) =>
          onChangeRef.current(toValue(gesture.moveX - offsetRef.current)),
      }),
    [toValue],
  );

  // Page X of the track's left edge, needed because gestures report page
  // coordinates while `locationX` is only reliable on the initial touch.
  const offsetRef = useRef(0);
  const trackRef = useRef<View>(null);

  const ratio = max === min ? 0 : (value - min) / (max - min);
  const fillWidth = width * ratio;

  return (
    <View style={style}>
      <View
        ref={trackRef}
        {...responder.panHandlers}
        onLayout={(e: LayoutChangeEvent) => {
          const w = e.nativeEvent.layout.width;
          widthRef.current = w;
          setWidth(w);
          trackRef.current?.measureInWindow((x) => {
            offsetRef.current = x;
          });
        }}
        style={{ paddingVertical: 14, justifyContent: "center" }}
      >
        <View
          style={{
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
            backgroundColor: "#E7E1DA",
          }}
        >
          {fillWidth > 0 ? (
            <LinearGradient
              colors={[...G.amber]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: fillWidth,
                height: TRACK_HEIGHT,
                borderRadius: TRACK_HEIGHT / 2,
              }}
            />
          ) : null}
          <Thumb left={fillWidth} />
        </View>
      </View>
      {labels?.length ? <Ticks labels={labels} /> : null}
    </View>
  );
}

/**
 * Two-thumb range slider used for sleep/wake windows and the budget filter.
 * Whichever thumb is nearer the touch takes the drag, and the pair cannot
 * cross — the low thumb stops one step below the high one.
 */
export function RangeSlider({
  min = 0,
  max = 10,
  step = 1,
  low,
  high,
  onChange,
  labels,
  style,
}: {
  min?: number;
  max?: number;
  step?: number;
  low: number;
  high: number;
  onChange: (low: number, high: number) => void;
  labels?: readonly string[];
  style?: StyleProp<ViewStyle>;
}) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const offsetRef = useRef(0);
  const trackRef = useRef<View>(null);
  const activeThumb = useRef<"low" | "high">("low");

  const stateRef = useRef({ low, high });
  stateRef.current = { low, high };
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const toValue = useCallback(
    (x: number) => {
      const w = widthRef.current;
      if (w <= 0) return min;
      const ratio = clamp(x / w, 0, 1);
      return clamp(
        Math.round((min + ratio * (max - min)) / step) * step,
        min,
        max,
      );
    },
    [min, max, step],
  );

  const apply = useCallback(
    (x: number) => {
      const next = toValue(x);
      const { low: lo, high: hi } = stateRef.current;
      if (activeThumb.current === "low") {
        onChangeRef.current(Math.min(next, hi - step), hi);
      } else {
        onChangeRef.current(lo, Math.max(next, lo + step));
      }
    },
    [step, toValue],
  );

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          const x = e.nativeEvent.locationX;
          const touched = toValue(x);
          const { low: lo, high: hi } = stateRef.current;
          activeThumb.current =
            Math.abs(touched - lo) <= Math.abs(touched - hi) ? "low" : "high";
          apply(x);
        },
        onPanResponderMove: (_e, gesture) =>
          apply(gesture.moveX - offsetRef.current),
      }),
    [apply, toValue],
  );

  const span = max - min || 1;
  const lowX = width * ((low - min) / span);
  const highX = width * ((high - min) / span);

  return (
    <View style={style}>
      <View
        ref={trackRef}
        {...responder.panHandlers}
        onLayout={(e: LayoutChangeEvent) => {
          const w = e.nativeEvent.layout.width;
          widthRef.current = w;
          setWidth(w);
          trackRef.current?.measureInWindow((x) => {
            offsetRef.current = x;
          });
        }}
        style={{ paddingVertical: 14, justifyContent: "center" }}
      >
        <View
          style={{
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
            backgroundColor: "#E7E1DA",
          }}
        >
          <LinearGradient
            colors={[...G.amber]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              position: "absolute",
              left: lowX,
              width: Math.max(0, highX - lowX),
              height: TRACK_HEIGHT,
              borderRadius: TRACK_HEIGHT / 2,
            }}
          />
          <Thumb left={lowX} />
          <Thumb left={highX} />
        </View>
      </View>
      {labels?.length ? <Ticks labels={labels} /> : null}
    </View>
  );
}
