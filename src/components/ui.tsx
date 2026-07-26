import React, { useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C } from "../theme/colors";
import { s } from "../theme/styles";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MotionPressable({
  pressedScale = 0.97,
  style,
  onPressIn,
  onPressOut,
  ...props
}: React.ComponentProps<typeof Pressable> & { pressedScale?: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const animateScale = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      stiffness: 260,
      damping: 22,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(event) => {
        animateScale(pressedScale);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateScale(1);
        onPressOut?.(event);
      }}
      style={(state) => [
        typeof style === "function" ? style(state) : style,
        { transform: [{ scale }] },
      ]}
    />
  );
}

export function Button({
  children,
  onPress,
  tone = "orange",
  outline = false,
}: {
  children: string;
  onPress?: () => void;
  tone?: "orange" | "wine" | "amber";
  outline?: boolean;
}) {
  const color =
    tone === "wine" ? C.wine : tone === "amber" ? C.amber : C.orange;
  const textColor = outline ? color : tone === "wine" ? "#FFF9F0" : C.ink;
  return (
    <MotionPressable
      onPress={onPress}
      style={[
        s.button,
        {
          backgroundColor: outline ? "transparent" : color,
          borderColor: color,
          borderWidth: outline ? 1 : 0,
          opacity: 1,
        },
      ]}
    >
      <Text style={[s.buttonText, { color: textColor }]}>{children}</Text>
    </MotionPressable>
  );
}
export function Header({
  title,
  back,
  onRight,
  right,
}: {
  title: string;
  back?: () => void;
  onRight?: () => void;
  right?: string;
}) {
  return (
    <View style={s.header}>
      {back ? (
        <MotionPressable onPress={back} style={s.iconBtn} pressedScale={0.9}>
          <Text style={s.back}>‹</Text>
        </MotionPressable>
      ) : (
        <View style={{ width: 38 }} />
      )}
      <Text style={s.headerTitle}>{title}</Text>
      {right ? (
        <MotionPressable
          onPress={onRight}
          style={s.pill}
          pressedScale={0.94}
        >
          <Text style={s.pillText}>{right}</Text>
        </MotionPressable>
      ) : (
        <View style={{ width: 38 }} />
      )}
    </View>
  );
}
export function Field({
  label,
  placeholder = "Type here...",
  small = false,
  value,
  onChangeText,
  secureTextEntry = false,
}: {
  label: string;
  placeholder?: string;
  small?: boolean;
  value?: string;
  onChangeText?: (v: string) => void;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={{ marginBottom: 15 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={label.includes("EMAIL") ? "none" : "sentences"}
        placeholder={placeholder}
        placeholderTextColor="#7F6C70"
        style={[s.input, small && { height: 46 }]}
      />
    </View>
  );
}
export function Chip({
  children,
  active = false,
  onPress,
}: {
  children: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <MotionPressable
      onPress={onPress}
      pressedScale={0.95}
      style={[s.chip, active && s.chipActive]}
    >
      <Text style={[s.chipText, active && s.chipTextActive]}>{children}</Text>
    </MotionPressable>
  );
}
export function Card({
  children,
  tint,
}: {
  children: React.ReactNode;
  tint?: string;
}) {
  return (
    <View style={[s.card, tint ? { backgroundColor: tint } : null]}>
      {children}
    </View>
  );
}
export function Progress({ step, total = 6 }: { step: number; total?: number }) {
  return (
    <>
      <View style={s.progressTop}>
        <Text style={s.progressCount}>
          {step} of {total}
        </Text>
      </View>
      <View style={s.track}>
        <View style={[s.fill, { width: `${(step / total) * 100}%` }]} />
      </View>
    </>
  );
}
export function ScreenShell({
  children,
  bottom = true,
}: {
  children: React.ReactNode;
  bottom?: boolean;
}) {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={[s.page, bottom && { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
        decelerationRate="normal"
        directionalLockEnabled
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Logo({ dark = false }: { dark?: boolean }) {
  const { width, height } = useWindowDimensions();
  const compact = width < 370 || height < 720;

  return (
    <View style={{ alignItems: "center" }}>
      <Image
        source={require("../../assets/logo.png")}
        style={[
          s.logoImage,
          compact && { width: 92, height: 92 },
          width >= 600 && { width: 132, height: 132 },
        ]}
        resizeMode="contain"
        accessibilityLabel="Roommate Match logo"
      />
      <Text
        style={[
          s.brand,
          compact && { fontSize: 24, lineHeight: 33, marginTop: 14 },
          width >= 600 && { fontSize: 32, lineHeight: 44 },
          dark && { color: C.ink },
        ]}
      >
        Roommate Match
      </Text>
    </View>
  );
}

