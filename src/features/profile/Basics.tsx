import * as ImagePicker from "expo-image-picker";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "../../i18n";
import { api, appState, formatImageUri, populateProfileDraft } from "../../services/api";
import { toImageDataUri } from "../../services/media";
import type { ProfileDraft } from "../../types/models";
import type { Screen } from "../../types/navigation";
import { dropdownStyles, housingStyles, serifFont } from "./basics.styles";

export function Basics({
  screen,
  go,
}: {
  screen: "basics" | "housing";
  go: (x: Screen) => void;
}) {
  const housing = screen === "housing";
  const { language } = useI18n();
  const [, rerender] = useState(0);
  const [activeModal, setActiveModal] = useState<"gender" | "major" | null>(null);
  const [majorSearch, setMajorSearch] = useState("");

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

  const set = <K extends keyof ProfileDraft>(
    key: K,
    value: ProfileDraft[K],
  ) => {
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
    if (!result.canceled && result.assets?.[0]) {
      const picked = toImageDataUri(result.assets[0]);
      if (!picked.ok) {
        Alert.alert("Photo", picked.reason);
        return;
      }
      const current = appState.profileDraft.photos || [];
      const newPhotos = [...current];
      newPhotos[index] = picked.dataUri;
      set("photos", newPhotos.filter(Boolean));
    }
  };

  const proceed = async () => {
    if (!housing) {
      if (appState.profileDraft.displayName)
        await api("/api/me", {
          method: "PATCH",
          body: JSON.stringify({ displayName: appState.profileDraft.displayName }),
        });
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          ...appState.profileDraft,
          age: Number(appState.profileDraft.age) || null,
        }),
      }).catch(() => undefined);
      go("housing");
      return;
    }
    try {
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          ...appState.profileDraft,
          age: Number(appState.profileDraft.age) || null,
        }),
      });
      if (appState.profileDraft.completed) {
        go("myprofile");
      } else {
        go("intro");
      }
    } catch (e) {
      Alert.alert("Profile", e instanceof Error ? e.message : "Unable to save");
    }
  };

  const roomTypeOptions = [
    { value: "Single", label: { en: "Single", th: "ห้องเดี่ยว" } },
    { value: "Double", label: { en: "Double", th: "ห้องคู่" } },
    { value: "Either", label: { en: "Either", th: "แบบไหนก็ได้" } },
  ];

  const roommateGenderOptions = [
    { value: "Same gender", label: { en: "Same Gender", th: "เพศเดียวกัน" } },
    { value: "Any", label: { en: "Any", th: "ได้ทุกเพศ" } },
    { value: "Non-binary friendly", label: { en: "Non-binary friendly", th: "ยินดีรับ Non-binary" } },
  ];

  const genderOptions = [
    { value: "ชาย", label: { th: "ชาย (Male)", en: "Male" } },
    { value: "หญิง", label: { th: "หญิง (Female)", en: "Female" } },
    { value: "LGBTQ+", label: { th: "LGBTQ+", en: "LGBTQ+" } },
    { value: "ไม่ระบุ", label: { th: "ไม่ระบุ", en: "Prefer not to say" } },
  ];

  const majorOptions = [
    { value: "วิศวกรรมคอมพิวเตอร์", label: { th: "วิศวกรรมคอมพิวเตอร์", en: "Computer Engineering" } },
    { value: "วิศวกรรมเคมี", label: { th: "วิศวกรรมเคมี", en: "Chemical Engineering" } },
    { value: "วิศวกรรมโยธา", label: { th: "วิศวกรรมโยธา", en: "Civil Engineering" } },
    { value: "วิศวกรรมไฟฟ้า", label: { th: "วิศวกรรมไฟฟ้า", en: "Electrical Engineering" } },
    { value: "วิศวกรรมเครื่องกล", label: { th: "วิศวกรรมเครื่องกล", en: "Mechanical Engineering" } },
    { value: "วิศวกรรมอุตสาหการ", label: { th: "วิศวกรรมอุตสาหการ", en: "Industrial Engineering" } },
    { value: "วิศวกรรมสิ่งแวดล้อม", label: { th: "วิศวกรรมสิ่งแวดล้อม", en: "Environmental Engineering" } },
    { value: "วิศวกรรมโทรคมนาคม", label: { th: "วิศวกรรมโทรคมนาคม", en: "Telecommunication Engineering" } },
    { value: "วิศวกรรมขนส่งและโลจิสติกส์", label: { th: "วิศวกรรมขนส่งและโลจิสติกส์", en: "Logistics Engineering" } },
    { value: "วิศวกรรมเกษตรและอาหาร", label: { th: "วิศวกรรมเกษตรและอาหาร", en: "Agricultural & Food Eng." } },
    { value: "เทคโนโลยีสารสนเทศ", label: { th: "เทคโนโลยีสารสนเทศ", en: "Information Technology" } },
    { value: "เทคโนโลยีการจัดการ", label: { th: "เทคโนโลยีการจัดการ", en: "Management Technology" } },
    { value: "วิทยาการคอมพิวเตอร์", label: { th: "วิทยาการคอมพิวเตอร์", en: "Computer Science" } },
    { value: "แพทยศาสตร์", label: { th: "แพทยศาสตร์", en: "Medicine" } },
    { value: "พยาบาลศาสตร์", label: { th: "พยาบาลศาสตร์", en: "Nursing" } },
    { value: "ทันตแพทยศาสตร์", label: { th: "ทันตแพทยศาสตร์", en: "Dentistry" } },
    { value: "สาธารณสุขศาสตร์", label: { th: "สาธารณสุขศาสตร์", en: "Public Health" } },
    { value: "เทคโนโลยีการเกษตร", label: { th: "เทคโนโลยีการเกษตร", en: "Agricultural Technology" } },
    { value: "เทคโนโลยีอาหาร", label: { th: "เทคโนโลยีอาหาร", en: "Food Technology" } },
    { value: "นิเทศศาสตร์ดิจิทัล", label: { th: "นิเทศศาสตร์ดิจิทัล", en: "Digital Communication" } },
    { value: "บริหารธุรกิจ / บัญชี", label: { th: "บริหารธุรกิจ / บัญชี", en: "Business / Accounting" } },
  ];

  const basicsStyles = StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: "#FEFCFA",
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 60,
    },
    title: {
      fontFamily: serifFont,
      fontSize: 30,
      fontWeight: "bold",
      color: "#5C3A21",
      marginBottom: 4,
    },
    subtitle: {
      fontFamily: serifFont,
      fontSize: 15,
      color: "#8D7C75",
      marginBottom: 24,
    },
    photoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 28,
      gap: 12,
    },
    photoBoxMain: {
      width: 78,
      height: 78,
      borderRadius: 18,
      backgroundColor: "#FED266",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    photoBoxDashed: {
      width: 78,
      height: 78,
      borderRadius: 18,
      borderWidth: 1.5,
      borderStyle: "dashed",
      borderColor: "#D29F9A",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#FEFCFA",
    },
    photoImage: {
      width: "100%",
      height: "100%",
      borderRadius: 18,
    },
    avatarLetter: {
      fontFamily: serifFont,
      fontSize: 32,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    plusIcon: {
      fontSize: 24,
      color: "#D29F9A",
      fontWeight: "300",
    },
    cameraBadge: {
      position: "absolute",
      bottom: -4,
      right: -4,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "#BF3D3C",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: "#FEFCFA",
    },
    cameraText: {
      color: "#FFFFFF",
      fontSize: 11,
    },
    photoText: {
      fontFamily: serifFont,
      fontSize: 13,
      color: "#8D7C75",
      marginLeft: 4,
    },
    row: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    fieldContainer: {
      flexDirection: "column",
    },
    fieldLabel: {
      fontFamily: serifFont,
      fontSize: 13,
      fontWeight: "bold",
      color: "#8D7C75",
      marginBottom: 8,
    },
    fieldInput: {
      height: 48,
      borderWidth: 1,
      borderColor: "#EADEC9",
      borderRadius: 10,
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 16,
      fontFamily: serifFont,
      fontSize: 14,
      color: "#4D3E35",
    },
    fieldInputMultiline: {
      height: 96,
      paddingTop: 12,
      paddingBottom: 12,
      textAlignVertical: "top",
    },
    dropdownInput: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingRight: 10,
    },
    dropdownText: {
      fontFamily: serifFont,
      fontSize: 14,
      color: "#463826",
      flex: 1,
    },
    dropdownPlaceholder: {
      color: "#BCAFA8",
    },
    dropdownChevron: {
      fontSize: 13,
      color: "#8D7C75",
      marginLeft: 4,
    },
    controlSection: {
      marginBottom: 20,
    },
    controlLabel: {
      fontFamily: serifFont,
      fontSize: 13,
      fontWeight: "bold",
      color: "#8D7C75",
      marginBottom: 10,
    },
    segmentControl: {
      flexDirection: "row",
      backgroundColor: "#EAECEF",
      borderRadius: 10,
      padding: 4,
    },
    segmentButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
    },
    segmentButtonSelected: {
      backgroundColor: "#FFFFFF",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    segmentText: {
      fontFamily: serifFont,
      fontSize: 14,
      color: "#74675E",
    },
    segmentTextSelected: {
      fontWeight: "bold",
      color: "#BF3D3C",
    },
    genderRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    genderButton: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#EADEC9",
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    genderButtonSelected: {
      backgroundColor: "#FADBD8",
      borderColor: "#EC7063",
    },
    genderText: {
      fontFamily: serifFont,
      fontSize: 13,
      color: "#74675E",
    },
    genderTextSelected: {
      fontWeight: "bold",
      color: "#BF3D3C",
    },
    continueButton: {
      height: 52,
      borderRadius: 10,
      backgroundColor: "#BF3D3C",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
    },
    continueButtonText: {
      fontFamily: serifFont,
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
    },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 16,
    },
    footerText: {
      fontFamily: serifFont,
      fontSize: 12,
      color: "#8D7C75",
    },
    footerLink: {
      fontFamily: serifFont,
      fontSize: 12,
      fontWeight: "bold",
      color: "#BF3D3C",
      textDecorationLine: "underline",
    },
  });

  const renderContent = () => {
    if (housing) {
      const budgetPresets = [
        { min: 1500, max: 3000, label: { th: "1,500 – 3,000 ฿", en: "1,500 – 3,000 ฿" }, sub: { th: "เน้นประหยัด", en: "Budget friendly" } },
        { min: 3000, max: 5000, label: { th: "3,000 – 5,000 ฿", en: "3,000 – 5,000 ฿" }, sub: { th: "ยอดนิยม", en: "Popular" } },
        { min: 5000, max: 8000, label: { th: "5,000 – 8,000 ฿", en: "5,000 – 8,000 ฿" }, sub: { th: "หอหรู / แอร์", en: "Premium / AC" } },
        { min: 0, max: 15000, label: { th: "ยืดหยุ่น / ไม่จำกัดงบ", en: "Flexible / Any" }, sub: { th: "ตามตกลง", en: "Flexible" } },
      ];

      const currentMin = appState.profileDraft.budgetMin ?? 2500;
      const currentMax = appState.profileDraft.budgetMax ?? 4500;

      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#FEFCFA" }}>
          <ScrollView
            contentContainerStyle={basicsStyles.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Navigation / Header */}
            <View style={housingStyles.headerRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={housingStyles.backButton}
                onPress={() => go("basics")}
              >
                <Text style={housingStyles.backChevron}>←</Text>
              </Pressable>
              <Text style={housingStyles.headerTitle}>
                {language === "th" ? "หอพักและการศึกษา" : "Housing & Study"}
              </Text>
            </View>

            <Text style={basicsStyles.subtitle}>
              {language === "th"
                ? "เลือกข้อมูลหอพักที่ต้องการเพื่อช่วยจับคู่เพื่อนร่วมห้องที่ลงตัว"
                : "Set your housing and budget preferences to find the best match"}
            </Text>

            {/* Section 1: Academic Year */}
            <View style={housingStyles.sectionCard}>
              <Text style={housingStyles.sectionTitle}>
                🎓 {language === "th" ? "ชั้นปีการศึกษา" : "Academic Year"}
              </Text>
              <View style={housingStyles.yearGrid}>
                {[
                  { year: 1, label: { th: "ปี 1", en: "Year 1" } },
                  { year: 2, label: { th: "ปี 2", en: "Year 2" } },
                  { year: 3, label: { th: "ปี 3", en: "Year 3" } },
                  { year: 4, label: { th: "ปี 4+", en: "Year 4+" } },
                ].map((y) => {
                  const isSelected = appState.profileDraft.year === y.year;
                  return (
                    <Pressable
                      key={y.year}
                      style={[
                        housingStyles.yearChip,
                        isSelected && housingStyles.yearChipSelected,
                      ]}
                      onPress={() => set("year", y.year)}
                    >
                      <Text
                        style={[
                          housingStyles.yearText,
                          isSelected && housingStyles.yearTextSelected,
                        ]}
                      >
                        {y.label[language]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Section 2: Preferred Zone */}
            <View style={housingStyles.sectionCard}>
              <Text style={housingStyles.sectionTitle}>
                📍 {language === "th" ? "โซนหอพักที่ต้องการ" : "Preferred Zone"}
              </Text>
              <View style={housingStyles.zoneGrid}>
                {[
                  { id: "Gate 1", label: { th: "ประตู 1", en: "Gate 1" }, icon: "🚪" },
                  { id: "Gate 4", label: { th: "ประตู 4", en: "Gate 4" }, icon: "🛣" },
                  { id: "On Campus", label: { th: "ในมหาวิทยาลัย", en: "On Campus" }, icon: "🏫" },
                  { id: "Suranaree Rd.", label: { th: "ถนนสุรนารี", en: "Suranaree Rd." }, icon: "🏢" },
                ].map((z) => {
                  const isSelected = appState.profileDraft.zone === z.id;
                  return (
                    <Pressable
                      key={z.id}
                      style={[
                        housingStyles.zoneCard,
                        isSelected && housingStyles.zoneCardSelected,
                      ]}
                      onPress={() => set("zone", z.id)}
                    >
                      <Text style={housingStyles.zoneIcon}>{z.icon}</Text>
                      <Text
                        style={[
                          housingStyles.zoneLabel,
                          isSelected && housingStyles.zoneLabelSelected,
                        ]}
                      >
                        {z.label[language]}
                      </Text>
                      {isSelected ? <Text style={housingStyles.zoneBadge}>✓</Text> : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Section 3: Monthly Budget */}
            <View style={housingStyles.sectionCard}>
              <View style={housingStyles.sectionHeaderRow}>
                <Text style={housingStyles.sectionTitle}>
                  💰 {language === "th" ? "ช่วงงบประมาณต่อเดือน" : "Monthly Budget"}
                </Text>
                <Text style={housingStyles.budgetValueText}>
                  ฿{currentMin.toLocaleString()} – ฿{currentMax.toLocaleString()}
                </Text>
              </View>

              <View style={housingStyles.budgetGrid}>
                {budgetPresets.map((preset, idx) => {
                  const isSelected =
                    appState.profileDraft.budgetMin === preset.min &&
                    appState.profileDraft.budgetMax === preset.max;
                  return (
                    <Pressable
                      key={idx}
                      style={[
                        housingStyles.budgetChip,
                        isSelected && housingStyles.budgetChipSelected,
                      ]}
                      onPress={() => {
                        set("budgetMin", preset.min);
                        set("budgetMax", preset.max);
                      }}
                    >
                      <Text
                        style={[
                          housingStyles.budgetChipLabel,
                          isSelected && housingStyles.budgetChipLabelSelected,
                        ]}
                      >
                        {preset.label[language]}
                      </Text>
                      <Text
                        style={[
                          housingStyles.budgetChipSub,
                          isSelected && housingStyles.budgetChipSubSelected,
                        ]}
                      >
                        {preset.sub[language]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Save & Continue Button */}
            <Pressable style={basicsStyles.continueButton} onPress={proceed}>
              <Text style={basicsStyles.continueButtonText}>
                {language === "th" ? "บันทึกและไปต่อ ➔" : "Save & Continue ➔"}
              </Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FEFCFA" }}>
        <ScrollView
          contentContainerStyle={basicsStyles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Navigation / Header */}
          <View style={housingStyles.headerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={housingStyles.backButton}
              onPress={() => go(appState.profileDraft.completed ? "myprofile" : "authChoice")}
            >
              <ArrowLeft size={18} color="#463826" strokeWidth={2.2} />
            </Pressable>
            <Text style={housingStyles.headerTitle}>
              {language === "th" ? "เกี่ยวกับคุณ" : "About you"}
            </Text>
            <View style={{ width: 38 }} />
          </View>

          <Text style={basicsStyles.subtitle}>
            {language === "th" ? "ข้อมูลนี้จะแสดงบนการ์ดจับคู่ของคุณ" : "This appears on your match card"}
          </Text>

          {/* Photo slots */}
          <View style={basicsStyles.photoRow}>
            <Pressable style={basicsStyles.photoBoxMain} onPress={() => changePhoto(0)}>
              {formatImageUri(appState.profileDraft.photos[0]) ? (
                <Image source={{ uri: formatImageUri(appState.profileDraft.photos[0]) }} style={basicsStyles.photoImage} />
              ) : (
                <Text style={basicsStyles.avatarLetter}>
                  {(appState.profileDraft.displayName && appState.profileDraft.displayName[0]?.toUpperCase()) || "N"}
                </Text>
              )}
              <View style={basicsStyles.cameraBadge}>
                <Text style={basicsStyles.cameraText}>📷</Text>
              </View>
            </Pressable>

            <Pressable style={basicsStyles.photoBoxDashed} onPress={() => changePhoto(1)}>
              {formatImageUri(appState.profileDraft.photos[1]) ? (
                <Image source={{ uri: formatImageUri(appState.profileDraft.photos[1]) }} style={basicsStyles.photoImage} />
              ) : (
                <Text style={basicsStyles.plusIcon}>+</Text>
              )}
            </Pressable>

            <Pressable style={basicsStyles.photoBoxDashed} onPress={() => changePhoto(2)}>
              {formatImageUri(appState.profileDraft.photos[2]) ? (
                <Image source={{ uri: formatImageUri(appState.profileDraft.photos[2]) }} style={basicsStyles.photoImage} />
              ) : (
                <Text style={basicsStyles.plusIcon}>+</Text>
              )}
            </Pressable>

            <Text style={basicsStyles.photoText}>
              {language === "th" ? "1-3 รูปภาพ" : "1-3 photos"}
            </Text>
          </View>

          {/* Full Name & Age */}
          <View style={basicsStyles.row}>
            <View style={{ flex: 2.2 }}>
              <Text style={basicsStyles.fieldLabel}>{language === "th" ? "ชื่อ-นามสกุล" : "Full Name"}</Text>
              <TextInput
                value={appState.profileDraft.displayName}
                onChangeText={(v) => set("displayName", v)}
                placeholder={language === "th" ? "นภัส ศรีสวัสดิ์" : "Jedwadud Jadwaded"}
                placeholderTextColor="#BCAFA8"
                style={basicsStyles.fieldInput}
              />
            </View>
            <View style={{ flex: 0.9 }}>
              <Text style={basicsStyles.fieldLabel}>{language === "th" ? "อายุ" : "Age"}</Text>
              <TextInput
                value={appState.profileDraft.age}
                onChangeText={(v) => set("age", v)}
                placeholder="19"
                placeholderTextColor="#BCAFA8"
                keyboardType="numeric"
                maxLength={2}
                style={basicsStyles.fieldInput}
              />
            </View>
          </View>

          {/* Major & Gender */}
          <View style={basicsStyles.row}>
            <View style={{ flex: 1.4 }}>
              <Text style={basicsStyles.fieldLabel}>{language === "th" ? "สาขา" : "Major"}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose major"
                style={[basicsStyles.fieldInput, basicsStyles.dropdownInput]}
                onPress={() => {
                  setMajorSearch("");
                  setActiveModal("major");
                }}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    basicsStyles.dropdownText,
                    !appState.profileDraft.major && basicsStyles.dropdownPlaceholder,
                  ]}
                >
                  {appState.profileDraft.major || (language === "th" ? "เลือกสาขา" : "Select major")}
                </Text>
                <Text style={basicsStyles.dropdownChevron}>▾</Text>
              </Pressable>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={basicsStyles.fieldLabel}>{language === "th" ? "เพศ" : "Gender"}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Choose gender"
                style={[basicsStyles.fieldInput, basicsStyles.dropdownInput]}
                onPress={() => setActiveModal("gender")}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    basicsStyles.dropdownText,
                    !appState.profileDraft.gender && basicsStyles.dropdownPlaceholder,
                  ]}
                >
                  {appState.profileDraft.gender || (language === "th" ? "เลือกเพศ" : "Select gender")}
                </Text>
                <Text style={basicsStyles.dropdownChevron}>▾</Text>
              </Pressable>
            </View>
          </View>

          {/* Short Bio */}
          <View style={{ marginBottom: 20 }}>
            <Text style={basicsStyles.fieldLabel}>{language === "th" ? "แนะนำตัวสั้น ๆ" : "Short Bio"}</Text>
            <TextInput
              value={appState.profileDraft.bio}
              onChangeText={(v) => set("bio", v)}
              placeholder="-----------------"
              placeholderTextColor="#BCAFA8"
              multiline
              style={[basicsStyles.fieldInput, basicsStyles.fieldInputMultiline]}
            />
          </View>

          {/* Room Type */}
          <View style={basicsStyles.controlSection}>
            <Text style={basicsStyles.controlLabel}>{language === "th" ? "ประเภทห้อง" : "Room Type"}</Text>
            <View style={basicsStyles.segmentControl}>
              {roomTypeOptions.map((opt) => {
                const isSelected = appState.profileDraft.roomType?.toLowerCase() === opt.value.toLowerCase();
                return (
                  <Pressable
                    key={opt.value}
                    style={[
                      basicsStyles.segmentButton,
                      isSelected && basicsStyles.segmentButtonSelected,
                    ]}
                    onPress={() => set("roomType", opt.value)}
                  >
                    <Text
                      style={[
                        basicsStyles.segmentText,
                        isSelected && basicsStyles.segmentTextSelected,
                      ]}
                    >
                      {opt.label[language]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Roommate Gender Preference */}
          <View style={basicsStyles.controlSection}>
            <Text style={basicsStyles.controlLabel}>
              {language === "th" ? "เพศของรูมเมทที่ต้องการ" : "Roommate Gender Preference"}
            </Text>
            <View style={basicsStyles.genderRow}>
              {roommateGenderOptions.map((opt) => {
                const isSelected = appState.profileDraft.roommateGender?.toLowerCase() === opt.value.toLowerCase();
                return (
                  <Pressable
                    key={opt.value}
                    style={[
                      basicsStyles.genderButton,
                      isSelected && basicsStyles.genderButtonSelected,
                    ]}
                    onPress={() => set("roommateGender", opt.value)}
                  >
                    <Text
                      style={[
                        basicsStyles.genderText,
                        isSelected && basicsStyles.genderTextSelected,
                      ]}
                    >
                      {opt.label[language]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Continue button */}
          <Pressable style={basicsStyles.continueButton} onPress={proceed}>
            <Text style={basicsStyles.continueButtonText}>
              {language === "th" ? "ดำเนินการต่อ" : "Continue"}
            </Text>
          </Pressable>

          {/* Footer link */}
          <View style={basicsStyles.footer}>
            <Text style={basicsStyles.footerText}>
              {language === "th" ? "ยังไม่มีบัญชี? " : "New here? "}
            </Text>
            <Pressable onPress={() => go("signup")}>
              <Text style={basicsStyles.footerLink}>
                {language === "th" ? "สมัครสมาชิก" : "Sign Up"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Dropdown Selection Modal */}
        <Modal
          visible={activeModal !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setActiveModal(null)}
        >
          <Pressable
            style={dropdownStyles.modalBackdrop}
            onPress={() => setActiveModal(null)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={dropdownStyles.modalContainer}
            >
              <Pressable style={dropdownStyles.modalContent} onPress={(e) => e.stopPropagation()}>
                {/* Header */}
                <View style={dropdownStyles.modalHeader}>
                  <Text style={dropdownStyles.modalTitle}>
                    {activeModal === "gender"
                      ? language === "th" ? "เลือกเพศ" : "Select Gender"
                      : language === "th" ? "เลือกสาขาการศึกษา" : "Select Major"}
                  </Text>
                  <Pressable
                    style={dropdownStyles.closeButton}
                    onPress={() => setActiveModal(null)}
                  >
                    <Text style={dropdownStyles.closeText}>✕</Text>
                  </Pressable>
                </View>

                {/* Search Input for Major */}
                {activeModal === "major" ? (
                  <View style={dropdownStyles.searchContainer}>
                    <TextInput
                      value={majorSearch}
                      onChangeText={setMajorSearch}
                      placeholder={language === "th" ? "🔍 ค้นหาสาขา หรือพิมพ์สาขาของคุณ..." : "🔍 Search or type major..."}
                      placeholderTextColor="#A49A8E"
                      style={dropdownStyles.searchInput}
                    />
                  </View>
                ) : null}

                {/* Options List */}
                <ScrollView style={dropdownStyles.optionsList} showsVerticalScrollIndicator={false}>
                  {activeModal === "gender" ? (
                    <View style={dropdownStyles.listContainer}>
                      {genderOptions.map((opt) => {
                        const isSelected = appState.profileDraft.gender === opt.value;
                        return (
                          <Pressable
                            key={opt.value}
                            style={[
                              dropdownStyles.listItem,
                              isSelected && dropdownStyles.itemSelected,
                            ]}
                            onPress={() => {
                              set("gender", opt.value);
                              setActiveModal(null);
                            }}
                          >
                            <Text
                              style={[
                                dropdownStyles.itemText,
                                isSelected && dropdownStyles.itemTextSelected,
                              ]}
                            >
                              {opt.label[language]}
                            </Text>
                            {isSelected ? <Text style={dropdownStyles.checkMark}>✓</Text> : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={dropdownStyles.listContainer}>
                      {majorSearch.trim() ? (
                        <Pressable
                          style={[dropdownStyles.listItem, dropdownStyles.customItem]}
                          onPress={() => {
                            set("major", majorSearch.trim());
                            setActiveModal(null);
                          }}
                        >
                          <Text style={dropdownStyles.customItemText}>
                            ➕ {language === "th" ? `ใช้สาขา "${majorSearch.trim()}"` : `Use "${majorSearch.trim()}"`}
                          </Text>
                        </Pressable>
                      ) : null}

                      {majorOptions
                        .filter((opt) => {
                          if (!majorSearch.trim()) return true;
                          const q = majorSearch.toLowerCase();
                          return (
                            opt.label.th.toLowerCase().includes(q) ||
                            opt.label.en.toLowerCase().includes(q)
                          );
                        })
                        .map((opt) => {
                          const isSelected = appState.profileDraft.major === opt.value;
                          return (
                            <Pressable
                              key={opt.value}
                              style={[
                                dropdownStyles.listItem,
                                isSelected && dropdownStyles.itemSelected,
                              ]}
                              onPress={() => {
                                set("major", opt.value);
                                setActiveModal(null);
                              }}
                            >
                              <Text
                                style={[
                                  dropdownStyles.itemText,
                                  isSelected && dropdownStyles.itemTextSelected,
                                ]}
                              >
                                {opt.label[language]}
                              </Text>
                              {isSelected ? <Text style={dropdownStyles.checkMark}>✓</Text> : null}
                            </Pressable>
                          );
                        })}
                    </View>
                  )}
                </ScrollView>
              </Pressable>
            </KeyboardAvoidingView>
          </Pressable>
        </Modal>
      </SafeAreaView>
    );
  };

  return renderContent();
}

