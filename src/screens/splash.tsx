import React, { useEffect, useMemo, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  Animated,
  PanResponder,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Logo } from "../components/ui";
import { C } from "../theme/colors";
import { s } from "../theme/styles";

const KNOB_SIZE = 70;
const TRACK_PADDING = 5;

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const { width, height } = useWindowDimensions();
  const compact = width < 370 || height < 720;
  const logoOp = useRef(new Animated.Value(0)).current;
  const logoTy = useRef(new Animated.Value(30)).current;
  const textOp = useRef(new Animated.Value(0)).current;
  const dragX = useRef(new Animated.Value(0)).current;
  const maxTravel = useRef(0);
  const completed = useRef(false);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOp, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoTy, {
          toValue: 0,
          bounciness: 12,
          speed: 10,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOp, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoOp, logoTy, textOp]);

  useEffect(() => {
    const knobSize = compact ? 56 : KNOB_SIZE;
    maxTravel.current = Math.max(
      0,
      trackWidth - knobSize - TRACK_PADDING * 2,
    );
    dragX.setValue(0);
  }, [compact, dragX, trackWidth]);

  const finish = () => {
    if (completed.current) return;
    completed.current = true;
    Animated.timing(dragX, {
      toValue: maxTravel.current,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onComplete();
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !completed.current,
        onMoveShouldSetPanResponder: (_, gesture) =>
          !completed.current && Math.abs(gesture.dx) > 2,
        onPanResponderMove: (_, gesture) => {
          dragX.setValue(
            Math.max(0, Math.min(gesture.dx, maxTravel.current)),
          );
        },
        onPanResponderRelease: (_, gesture) => {
          const position = Math.max(
            0,
            Math.min(gesture.dx, maxTravel.current),
          );
          if (
            maxTravel.current > 0 &&
            position >= maxTravel.current * 0.78
          ) {
            finish();
            return;
          }
          Animated.spring(dragX, {
            toValue: 0,
            speed: 18,
            bounciness: 7,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          if (completed.current) return;
          Animated.spring(dragX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [dragX],
  );

  return (
    <LinearGradient
      colors={["#70152E", "#8D1E32", "#B82F2D", "#D74825"]}
      locations={[0, 0.38, 0.7, 1]}
      start={{ x: 0.16, y: 0 }}
      end={{ x: 0.84, y: 1 }}
      style={s.splash}
    >
      <SafeAreaView style={local.safe}>
        <View style={local.hero}>
          <Animated.View
            style={{
              opacity: logoOp,
              transform: [{ translateY: logoTy }],
              alignItems: "center",
            }}
          >
            <Logo />
          </Animated.View>

          <Animated.Text style={[s.splashTag, { opacity: textOp }]}>
            Find your people. Share your space.
          </Animated.Text>
        </View>

        <Animated.View
          style={[
            local.sliderArea,
            compact && local.sliderAreaCompact,
            { opacity: textOp },
          ]}
        >
          <Text style={local.hint}>SLIDE TO CONTINUE</Text>
          <View
            style={[local.track, compact && local.trackCompact]}
            onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
          >
            <Animated.View
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel="Slide to continue"
              accessibilityHint="Drag the arrow to the right to enter the app"
              style={[
                local.knob,
                compact && local.knobCompact,
                { transform: [{ translateX: dragX }] },
              ]}
              {...panResponder.panHandlers}
            >
              <Text style={[local.arrow, compact && local.arrowCompact]}>›</Text>
            </Animated.View>
          </View>
        </Animated.View>

        <Animated.Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[local.university, { opacity: textOp }]}
        >
          SURANAREE UNIVERSITY OF TECHNOLOGY
        </Animated.Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

const local = StyleSheet.create({
  safe: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  hero: {
    flex: 1,
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderArea: {
    width: "82%",
    maxWidth: 350,
    alignItems: "center",
    marginBottom: 28,
  },
  sliderAreaCompact: { width: "88%", marginBottom: 18 },
  hint: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: "NotoSansThai_600SemiBold",
    fontSize: 10,
    letterSpacing: 1.7,
    marginBottom: 10,
  },
  track: {
    width: "100%",
    height: 80,
    padding: TRACK_PADDING,
    borderRadius: 40,
    justifyContent: "center",
    backgroundColor: "#D58D7D",
  },
  trackCompact: { height: 66, borderRadius: 33 },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF8E7",
    shadowColor: "#511323",
    shadowOpacity: 0.22,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  knobCompact: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  arrow: {
    color: "#222944",
    fontSize: 48,
    lineHeight: 52,
    fontFamily: "NotoSansThai_700Bold",
    marginTop: -4,
  },
  arrowCompact: { fontSize: 40, lineHeight: 44 },
  university: {
    width: "100%",
    maxWidth: 430,
    marginBottom: 20,
    textAlign: "center",
    color: "#FFF1D6",
    fontFamily: "NotoSansThai_700Bold",
    fontSize: 10,
    letterSpacing: 0.8,
  },
});
