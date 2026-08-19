import React, { useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heart, House } from "lucide-react-native";
import { C, G } from "../theme/colors";
import { NAV_HEIGHT, s, shadow } from "../theme/styles";
import { F, T } from "../theme/typography";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Pressable that springs down on touch. Used everywhere a tap should feel
 * physical; `pressedScale` is dialled per element size (small controls need a
 * shallower dip to avoid looking twitchy).
 */
export function MotionPressable({
  pressedScale = 0.97,
  style,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: React.ComponentProps<typeof Pressable> & { pressedScale?: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const [pressed, setPressed] = useState(false);

  const animate = (toValue: number) =>
    Animated.spring(scale, {
      toValue,
      stiffness: 280,
      damping: 20,
      mass: 0.6,
      useNativeDriver: true,
    }).start();

  // The style must reach the animated component as an array, never as a
  // function: `Animated.createAnimatedComponent` flattens the style prop, and
  // flattening a function yields nothing — which silently strips every style
  // off the element. Function styles are resolved here instead.
  const resolved =
    typeof style === "function" ? style({ pressed }) : style;

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPressIn={(e) => {
        setPressed(true);
        if (!disabled) animate(pressedScale);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        animate(1);
        onPressOut?.(e);
      }}
      style={[
        resolved,
        { transform: [{ scale }] },
        disabled ? { opacity: 0.45 } : null,
      ]}
    />
  );
}

/* ------------------------------------------------------------------ text */

type TextRole = keyof typeof T;

/**
 * Text bound to a named role from the type scale.
 *
 * `role` shadows React Native's ARIA `role` prop deliberately — every string in
 * this app is styled by design role, and the ARIA escape hatch is
 * `accessibilityRole`, which remains available.
 */
export function Txt({
  role = "body",
  style,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Text>, "role"> & { role?: TextRole }) {
  return (
    <Text {...props} style={[T[role], style]}>
      {children}
    </Text>
  );
}

/* ---------------------------------------------------------------- button */

export function Button({
  children,
  onPress,
  tone = "primary",
  disabled = false,
  loading = false,
  style,
}: {
  children: string;
  onPress?: () => void;
  /** `primary` is the crimson CTA, `wine` the deeper finish/submit variant. */
  tone?: "primary" | "wine" | "outline" | "ghost" | "blue";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const inactive = disabled || loading;
  const base: ViewStyle = {
    height: 58,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  };

  if (tone === "outline" || tone === "ghost") {
    const isOutline = tone === "outline";
    return (
      <MotionPressable
        onPress={onPress}
        disabled={inactive}
        style={[
          base,
          {
            borderWidth: isOutline ? 1.5 : 0,
            borderColor: C.primary,
            backgroundColor: isOutline ? "transparent" : C.pink,
          },
          style,
        ]}
      >
        <Txt role="button" style={{ color: C.primary }}>
          {children}
        </Txt>
      </MotionPressable>
    );
  }

  if (tone === "blue") {
    return (
      <MotionPressable
        onPress={onPress}
        disabled={inactive}
        style={[base, { backgroundColor: C.blue, height: 46 }, style]}
      >
        <Txt role="button" style={{ fontSize: 14 }}>
          {children}
        </Txt>
      </MotionPressable>
    );
  }

  const colors = tone === "wine" ? G.hero : G.primary;
  return (
    <MotionPressable
      onPress={onPress}
      disabled={inactive}
      style={[base, shadow(2), style]}
    >
      <LinearGradient
        colors={[...colors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[base, { width: "100%" }]}
      >
        <Txt role="button">{children}</Txt>
      </LinearGradient>
    </MotionPressable>
  );
}

/* ----------------------------------------------------------------- field */

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  multiline,
  maxLength,
  editable = true,
  right,
  error,
  style,
  onPress,
}: {
  label?: string;
  value?: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
  autoCapitalize?: React.ComponentProps<typeof TextInput>["autoCapitalize"];
  multiline?: boolean;
  /** Caps the input length, e.g. a fixed-length verification code. */
  maxLength?: number;
  editable?: boolean;
  /** Trailing adornment rendered inside the input frame. */
  right?: React.ReactNode;
  error?: string;
  style?: StyleProp<ViewStyle>;
  /** When set the field renders as a tappable value (dropdowns, pickers). */
  onPress?: () => void;
}) {
  const [focused, setFocused] = useState(false);

  const frame = (
    <View
      style={[
        s.input,
        s.rowBetween,
        multiline && s.inputMultiline,
        focused && s.inputFocused,
        error ? { borderColor: C.primary } : null,
        { paddingRight: right ? 12 : 16 },
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.faint}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        maxLength={maxLength}
        editable={editable && !onPress}
        pointerEvents={onPress ? "none" : "auto"}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          // Without a zero floor the input's intrinsic content width can push
          // a side-by-side field row wider than its column.
          minWidth: 0,
          fontFamily: F.regular,
          fontSize: 15,
          color: C.ink,
          padding: 0,
          height: "100%",
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
      {right}
    </View>
  );

  return (
    <View style={[s.field, { minWidth: 0 }, style]}>
      {label ? <Txt role="label">{label}</Txt> : null}
      {onPress ? (
        <MotionPressable onPress={onPress} pressedScale={0.99}>
          {frame}
        </MotionPressable>
      ) : (
        frame
      )}
      {error ? (
        <Txt role="small" style={{ color: C.primary }}>
          {error}
        </Txt>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ chip */

/** Pill-shaped multi/single select used across the questionnaire and filters. */
export function Chip({
  children,
  active = false,
  onPress,
  size = "md",
}: {
  children: string;
  active?: boolean;
  onPress?: () => void;
  size?: "sm" | "md";
}) {
  return (
    <MotionPressable
      onPress={onPress}
      pressedScale={0.94}
      style={{
        paddingHorizontal: size === "sm" ? 12 : 16,
        paddingVertical: size === "sm" ? 7 : 11,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? C.pinkBorder : C.line,
        backgroundColor: active ? C.pink : C.card,
      }}
    >
      <Text
        style={{
          fontFamily: active ? F.semibold : F.regular,
          fontSize: size === "sm" ? 12 : 14,
          color: active ? C.primary : C.ink,
        }}
      >
        {children}
      </Text>
    </MotionPressable>
  );
}

/** Small read-only tag — the lifestyle signature and card badges. */
export function Tag({
  children,
  tone = "pink",
  style,
}: {
  children: React.ReactNode;
  tone?: "pink" | "outline" | "onDark";
  style?: StyleProp<ViewStyle>;
}) {
  const palette = {
    pink: { bg: C.pink, border: C.pinkBorder, text: C.primary },
    outline: { bg: "transparent", border: C.line, text: C.muted },
    onDark: {
      bg: "rgba(255,255,255,.16)",
      border: "rgba(255,255,255,.5)",
      text: C.white,
    },
  }[tone];

  return (
    <View
      style={[
        {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: palette.bg,
        },
        style,
      ]}
    >
      <Text style={{ fontFamily: F.semibold, fontSize: 11, color: palette.text }}>
        {children}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ card */

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <MotionPressable onPress={onPress} pressedScale={0.99} style={[s.card, style]}>
        {children}
      </MotionPressable>
    );
  }
  return <View style={[s.card, style]}>{children}</View>;
}

/** Warm informational strip with a leading icon. */
export function NoteCard({
  icon,
  children,
  tone = "warm",
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  tone?: "warm" | "pink";
}) {
  return (
    <View style={tone === "pink" ? s.noteCardPink : s.noteCard}>
      {icon ? <View style={{ paddingTop: 1 }}>{icon}</View> : null}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

/** All-caps section heading used by Filters and Settings. */
export function SectionLabel({
  children,
  style,
}: {
  children: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Txt role="eyebrow" style={[{ marginTop: 6 }, style]}>
      {children}
    </Txt>
  );
}

/* ---------------------------------------------------------------- shells */

/**
 * Standard scrolling screen. `bottomInset` leaves room for the tab bar; screens
 * with a pinned footer button pass their own padding instead.
 */
export function ScreenShell({
  children,
  bottomInset = false,
  extraBottom = 32,
  scroll = true,
  style,
}: {
  children: React.ReactNode;
  bottomInset?: boolean;
  extraBottom?: number;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const paddingBottom = (bottomInset ? NAV_HEIGHT : 0) + extraBottom;

  if (!scroll) {
    return (
      <SafeAreaView style={[s.safe, style]} edges={["top"]}>
        <View style={[s.page, { flex: 1, paddingBottom }]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, style]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[s.page, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Rounded app-icon tile — the little house mark used as a screen sigil. */
export function LogoTile({
  size = 46,
  radius = 15,
}: {
  size?: number;
  radius?: number;
}) {
  return (
    <LinearGradient
      colors={[...G.logo]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[s.logoTile, { width: size, height: size, borderRadius: radius }]}
    >
      <HouseMark size={size * 0.52} />
    </LinearGradient>
  );
}

/**
 * The brand glyph: an outlined house with a solid heart in the doorway.
 * Composed from two lucide icons so both shapes stay crisp at any size.
 */
export function HouseMark({
  size = 24,
  color = "#F6E0B8",
  heart = "#E5484D",
}: {
  size?: number;
  color?: string;
  heart?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <House size={size} color={color} strokeWidth={1.6} />
      <Heart
        size={size * 0.3}
        color={heart}
        fill={heart}
        style={{ position: "absolute", bottom: size * 0.14 }}
      />
    </View>
  );
}

/** Screen header: app tile + title on the left, optional action on the right. */
export function TitleBar({
  title,
  right,
  onBack,
}: {
  title: string;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <View style={[s.rowBetween, { height: 60 }]}>
      <View style={[s.row, { gap: 14 }]}>
        {onBack ? (
          <MotionPressable onPress={onBack} pressedScale={0.9} style={s.iconBtn}>
            <Chevron direction="left" />
          </MotionPressable>
        ) : (
          <LogoTile />
        )}
        <Txt role="h1">{title}</Txt>
      </View>
      {right}
    </View>
  );
}

/** Chevron drawn from a rotated border so it matches the serif line weight. */
export function Chevron({
  direction = "right",
  size = 10,
  color = C.muted,
  weight = 2,
}: {
  direction?: "left" | "right" | "up" | "down";
  size?: number;
  color?: string;
  weight?: number;
}) {
  const rotate = {
    left: "45deg",
    right: "-135deg",
    up: "135deg",
    down: "-45deg",
  }[direction];

  return (
    <View
      style={{
        width: size,
        height: size,
        borderLeftWidth: weight,
        borderBottomWidth: weight,
        borderColor: color,
        transform: [{ rotate }],
        marginRight: direction === "right" ? size * 0.3 : 0,
        marginLeft: direction === "left" ? size * 0.3 : 0,
      }}
    />
  );
}
