import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Camera, Plus } from "lucide-react-native";
import { useI18n } from "../../i18n";
import { api, appState, formatImageUri, populateProfileDraft } from "../../services/api";
import { toImageDataUri } from "../../services/media";
import { OptionPicker } from "../../components/OptionPicker";
import { Segmented } from "../../components/Segmented";
import {
  Button,
  Chevron,
  Chip,
  Field,
  MotionPressable,
  ScreenShell,
  Txt,
} from "../../components/ui";
import { C, G } from "../../theme/colors";
import { s, shadow } from "../../theme/styles";
import { F } from "../../theme/typography";
import type { ProfileDraft } from "../../types/models";
import type { Screen } from "../../types/navigation";
import {
  GENDER_OPTIONS,
  MAJOR_OPTIONS,
  PROPERTY_TYPES,
  PROPERTY_TYPE_KEYS,
  ROOMMATE_GENDERS,
  ROOMMATE_GENDER_KEYS,
  ROOM_TYPES,
  ROOM_TYPE_KEYS,
  labelFor,
} from "./profile.content";

const PHOTO_SLOTS = 3;

/** One square in the photo strip: a filled thumbnail or a dashed add target. */
function PhotoSlot({
  uri,
  initial,
  index,
  onPress,
}: {
  uri?: string;
  initial: string;
  index: number;
  onPress: () => void;
}) {
  const size = 84;
  const source = formatImageUri(uri);

  if (!source && index > 0) {
    return (
      <MotionPressable
        onPress={onPress}
        pressedScale={0.94}
        accessibilityLabel={`Add photo ${index + 1}`}
        style={{
          width: size,
          height: size,
          borderRadius: 20,
          borderWidth: 1.6,
          borderStyle: "dashed",
          borderColor: C.pinkBorder,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Plus size={24} color={C.pinkBorder} strokeWidth={2.2} />
      </MotionPressable>
    );
  }

  return (
    <MotionPressable
      onPress={onPress}
      pressedScale={0.94}
      accessibilityLabel={`Change photo ${index + 1}`}
      style={{ width: size, height: size }}
    >
      {source ? (
        <Image
          source={{ uri: source }}
          style={{ width: size, height: size, borderRadius: 20 }}
        />
      ) : (
        <LinearGradient
          colors={[...G.avatar]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: size,
            height: size,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Txt style={{ fontFamily: F.bold, fontSize: 34, color: C.white }}>
            {initial}
          </Txt>
        </LinearGradient>
      )}
      <View
        style={[
          {
            position: "absolute",
            right: -4,
            bottom: -4,
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: C.primary,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: C.bg,
          },
          shadow(1),
        ]}
      >
        <Camera size={14} color={C.white} strokeWidth={2.2} />
      </View>
    </MotionPressable>
  );
}

/**
 * "About you" — the single profile-setup form the redesign collapsed the old
 * two-step basics/housing flow into. Everything here is what a match card shows.
 */
export function Basics({ go }: { go: (x: Screen) => void }) {
  const { t, language } = useI18n();
  const [, rerender] = useState(0);
  const [picker, setPicker] = useState<"gender" | "major" | null>(null);
  const [saving, setSaving] = useState(false);

  const draft = appState.profileDraft;

  useEffect(() => {
    let mounted = true;
    api("/api/me")
      .then((me) => {
        if (!mounted || !me) return;
        populateProfileDraft(me);
        rerender((x) => x + 1);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  const set = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    appState.profileDraft[key] = value;
    rerender((x) => x + 1);
  };

  const changePhoto = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.6,
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return;

    const picked = toImageDataUri(result.assets[0]);
    if (!picked.ok) {
      Alert.alert("Photo", picked.reason);
      return;
    }
    // Write into the chosen slot rather than compacting, so picking slot 2
    // before slot 1 does not silently move the photo to the front.
    const photos = [...(draft.photos ?? [])];
    while (photos.length <= index) photos.push("");
    photos[index] = picked.dataUri;
    set("photos", photos);
  };

  const save = async () => {
    if (!draft.displayName.trim()) {
      Alert.alert(t("aboutYou"), t("enterYourName"));
      return;
    }
    try {
      setSaving(true);
      await api("/api/me", {
        method: "PATCH",
        body: JSON.stringify({ displayName: draft.displayName }),
      }).catch(() => undefined);

      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          ...draft,
          photos: (draft.photos ?? []).filter(Boolean),
          age: Number(draft.age) || null,
        }),
      });

      go(draft.completed ? "myprofile" : "intro");
    } catch (reason) {
      Alert.alert(
        t("aboutYou"),
        reason instanceof Error ? reason.message : t("somethingWrong"),
      );
    } finally {
      setSaving(false);
    }
  };

  const initial = (draft.displayName.trim()[0] ?? "?").toUpperCase();

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.flex}
      >
        <ScreenShell extraBottom={40}>
          <View style={{ gap: 4, marginTop: 20 }}>
            <Txt role="h1">{t("aboutYou")}</Txt>
            <Txt role="subtitle">{t("aboutYouSub")}</Txt>
          </View>

          <View style={[s.row, { gap: 14, marginTop: 6 }]}>
            {Array.from({ length: PHOTO_SLOTS }).map((_, index) => (
              <PhotoSlot
                key={index}
                index={index}
                initial={initial}
                uri={draft.photos?.[index]}
                onPress={() => changePhoto(index)}
              />
            ))}
            <Txt role="small" style={{ marginLeft: 2 }}>
              {t("photosHint")}
            </Txt>
          </View>

          <View style={[s.row, { gap: 12, alignItems: "flex-start" }]}>
            <Field
              style={{ flex: 1 }}
              label={t("fullName")}
              placeholder={t("enterYourName")}
              value={draft.displayName}
              onChangeText={(v) => set("displayName", v)}
            />
            <Field
              style={{ width: 96 }}
              label={t("age")}
              placeholder={t("yourAge")}
              value={draft.age}
              onChangeText={(v) => set("age", v.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
            />
          </View>

          <View style={[s.row, { gap: 12, alignItems: "flex-start" }]}>
            <Field
              style={{ flex: 1.35 }}
              label={t("major")}
              placeholder={t("chooseMajor")}
              value={
                draft.major
                  ? labelFor(MAJOR_OPTIONS, draft.major, language)
                  : ""
              }
              onPress={() => setPicker("major")}
              right={<Chevron direction="down" size={8} />}
            />
            <Field
              style={{ flex: 1 }}
              label={t("gender")}
              placeholder={t("yourGender")}
              value={
                draft.gender
                  ? labelFor(GENDER_OPTIONS, draft.gender, language)
                  : ""
              }
              onPress={() => setPicker("gender")}
              right={<Chevron direction="down" size={8} />}
            />
          </View>

          <Field
            label={t("shortBio")}
            placeholder={t("bioPlaceholder")}
            value={draft.bio}
            onChangeText={(v) => set("bio", v)}
            multiline
          />

          <View style={{ gap: 10 }}>
            <Txt role="label">{t("roomType")}</Txt>
            <Segmented
              options={ROOM_TYPES.map((value, i) => ({
                value,
                label: t(ROOM_TYPE_KEYS[i]),
              }))}
              value={draft.roomType}
              onChange={(v) => set("roomType", v)}
            />
          </View>

          <View style={{ gap: 10 }}>
            <Txt role="label">{t("propertyType")}</Txt>
            <Segmented
              size="sm"
              options={PROPERTY_TYPES.map((value, i) => ({
                value,
                label: t(PROPERTY_TYPE_KEYS[i]),
              }))}
              value={draft.propertyType}
              onChange={(v) => set("propertyType", v)}
            />
          </View>

          <View style={{ gap: 12 }}>
            <Txt role="label">{t("roommateGenderPref")}</Txt>
            <View style={s.wrap}>
              {ROOMMATE_GENDERS.map((value, i) => (
                <Chip
                  key={value}
                  active={draft.roommateGender === value}
                  onPress={() => set("roommateGender", value)}
                >
                  {t(ROOMMATE_GENDER_KEYS[i])}
                </Chip>
              ))}
            </View>
          </View>

          <Button onPress={save} loading={saving} style={{ marginTop: 14 }}>
            {t("continue")}
          </Button>

          {!draft.completed ? (
            <View style={[s.row, { justifyContent: "center", gap: 6 }]}>
              <Txt role="small">{t("newHere")}</Txt>
              <MotionPressable onPress={() => go("signup")} hitSlop={8}>
                <Txt role="link">{t("signUp")}</Txt>
              </MotionPressable>
            </View>
          ) : null}
        </ScreenShell>
      </KeyboardAvoidingView>

      <OptionPicker
        visible={picker === "major"}
        title={t("chooseMajor")}
        options={MAJOR_OPTIONS.map((o) => ({
          value: o.value,
          label: o.label[language],
        }))}
        value={draft.major}
        onSelect={(v) => set("major", v)}
        onClose={() => setPicker(null)}
      />
      <OptionPicker
        visible={picker === "gender"}
        title={t("gender")}
        options={GENDER_OPTIONS.map((o) => ({
          value: o.value,
          label: o.label[language],
        }))}
        value={draft.gender}
        onSelect={(v) => set("gender", v)}
        onClose={() => setPicker(null)}
      />
    </>
  );
}
