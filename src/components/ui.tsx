import React from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { C } from "../theme/colors";
import { s } from "../theme/styles";

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
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        {
          backgroundColor: outline ? "transparent" : color,
          borderColor: color,
          borderWidth: outline ? 1 : 0,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      <Text style={[s.buttonText, outline && { color }]}>{children}</Text>
    </Pressable>
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
        <Pressable onPress={back} style={s.iconBtn}>
          <Text style={s.back}>‹</Text>
        </Pressable>
      ) : (
        <View style={{ width: 38 }} />
      )}
      <Text style={s.headerTitle}>{title}</Text>
      {right ? (
        <Pressable onPress={onRight} style={s.pill}>
          <Text style={s.pillText}>{right}</Text>
        </Pressable>
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
        placeholderTextColor="#B9A8AA"
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
    <Pressable onPress={onPress} style={[s.chip, active && s.chipActive]}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{children}</Text>
    </Pressable>
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
        accessibilityLabel="SUT Roommate Matcher logo"
      />
      <Text
        style={[
          s.brand,
          compact && { fontSize: 24, lineHeight: 33, marginTop: 14 },
          width >= 600 && { fontSize: 32, lineHeight: 44 },
          dark && { color: C.ink },
        ]}
      >
        SUT Roommate{`\n`}Matcher
      </Text>
    </View>
  );
}

