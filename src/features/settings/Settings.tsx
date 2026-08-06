import {
  ArrowLeft,
  Ban,
  Bell,
  ChevronRight,
  Eye,
  Globe,
  KeyRound,
  LogOut,
  Mail,
  Search,
  User,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LanguageToggle, useI18n } from "../../i18n";
import { api } from "../../services/api";
import type { Screen } from "../../types/navigation";
import { settingStyles } from "./settings.styles";

/** Index of each switch in the `toggles` array. */
const MATCHES = 0;
const MESSAGES = 1;
const LIKES = 2;
const HIDE_PROFILE = 3;

export function Settings({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();
  const [toggles, setToggles] = useState([true, true, false, false]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    api("/api/me")
      .then((me) => {
        const p = me.notificationPrefs ?? {};
        setEmail(me.email || "");
        setToggles([
          p.matches !== false,
          p.messages !== false,
          p.likes === true,
          !me.discoverable,
        ]);
      })
      .catch((e) => Alert.alert("Settings", e.message));
  }, []);

  const updateToggle = async (idx: number, value: boolean) => {
    const next = toggles.map((x, j) => (j === idx ? value : x));
    setToggles(next);
    try {
      // The privacy switch reads as "hide me", so it is the inverse of the
      // `discoverable` flag the API stores.
      const body =
        idx === HIDE_PROFILE
          ? { discoverable: !value }
          : {
              notificationPrefs: {
                matches: next[MATCHES],
                messages: next[MESSAGES],
                likes: next[LIKES],
              },
            };
      await api("/api/me", { method: "PATCH", body: JSON.stringify(body) });
    } catch (e) {
      Alert.alert("Settings", e instanceof Error ? e.message : "Unable to save");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      language === "th" ? "ออกจากระบบ" : "Log Out",
      language === "th"
        ? "คุณต้องการออกจากระบบใช่หรือไม่?"
        : "Are you sure you want to log out?",
      [
        { text: language === "th" ? "ยกเลิก" : "Cancel", style: "cancel" },
        {
          text: language === "th" ? "ออกจากระบบ" : "Log Out",
          style: "destructive",
          onPress: () => go("login"),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={settingStyles.safeArea}>
      <ScrollView
        contentContainerStyle={settingStyles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={settingStyles.headerRow}>
          <Pressable
            style={settingStyles.backButton}
            onPress={() => go("myprofile")}
          >
            <ArrowLeft size={18} color="#463826" strokeWidth={2.2} />
          </Pressable>
          <Text style={settingStyles.headerTitle}>
            {language === "th" ? "การตั้งค่า" : "Settings"}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={settingStyles.sectionCard}>
          <View style={[settingStyles.rowBetween, { borderBottomWidth: 0 }]}>
            <View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 2,
                }}
              >
                <Globe size={16} color="#463826" />
                <Text style={settingStyles.rowTitle}>
                  {language === "th" ? "สลับภาษาแอป" : "App Language"}
                </Text>
              </View>
              <Text style={settingStyles.rowSub}>
                {language === "th"
                  ? "ภาษาไทย (TH) / English (EN)"
                  : "Thai (TH) / English (EN)"}
              </Text>
            </View>
            <LanguageToggle />
          </View>
        </View>

        <View style={settingStyles.sectionCard}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 12,
            }}
          >
            <User size={16} color="#463826" />
            <Text style={settingStyles.sectionTitle}>
              {language === "th" ? "ข้อมูลบัญชีผู้ใช้" : "Account Information"}
            </Text>
          </View>

          <View style={settingStyles.rowBetween}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Mail size={15} color="#8D7C75" />
              <Text style={settingStyles.rowTitle}>
                {language === "th" ? "อีเมลประจำตัว" : "Registered Email"}
              </Text>
            </View>
            <Text style={settingStyles.rowSub}>
              {email || "student@sut.ac.th"}
            </Text>
          </View>

          <Pressable
            style={[settingStyles.rowBetween, { borderBottomWidth: 0 }]}
            onPress={() =>
              Alert.alert("Password", "Feature enabled in next update")
            }
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <KeyRound size={15} color="#8D7C75" />
              <Text style={settingStyles.rowTitle}>
                {language === "th" ? "เปลี่ยนรหัสผ่าน" : "Change Password"}
              </Text>
            </View>
            <ChevronRight size={16} color="#8D7C75" />
          </Pressable>
        </View>

        <View style={settingStyles.sectionCard}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 12,
            }}
          >
            <Bell size={16} color="#463826" />
            <Text style={settingStyles.sectionTitle}>
              {language === "th"
                ? "การตั้งค่าการแจ้งเตือน"
                : "Notification Preferences"}
            </Text>
          </View>

          <View style={settingStyles.rowBetween}>
            <Text style={settingStyles.rowTitle}>
              {language === "th" ? "คู่แมตช์ใหม่" : "New Matches"}
            </Text>
            <Switch
              value={toggles[MATCHES]}
              trackColor={{ true: "#C64338", false: "#EADCD3" }}
              onValueChange={(v) => updateToggle(MATCHES, v)}
            />
          </View>

          <View style={settingStyles.rowBetween}>
            <Text style={settingStyles.rowTitle}>
              {language === "th" ? "ข้อความแชทใหม่" : "New Messages"}
            </Text>
            <Switch
              value={toggles[MESSAGES]}
              trackColor={{ true: "#C64338", false: "#EADCD3" }}
              onValueChange={(v) => updateToggle(MESSAGES, v)}
            />
          </View>

          <View style={[settingStyles.rowBetween, { borderBottomWidth: 0 }]}>
            <Text style={settingStyles.rowTitle}>
              {language === "th" ? "คนที่ถูกใจโปรไฟล์คุณ" : "Likes You"}
            </Text>
            <Switch
              value={toggles[LIKES]}
              trackColor={{ true: "#C64338", false: "#EADCD3" }}
              onValueChange={(v) => updateToggle(LIKES, v)}
            />
          </View>
        </View>

        <View style={settingStyles.sectionCard}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 12,
            }}
          >
            <Eye size={16} color="#463826" />
            <Text style={settingStyles.sectionTitle}>
              {language === "th" ? "ความเป็นส่วนตัว" : "Privacy & Visibility"}
            </Text>
          </View>

          <View style={settingStyles.rowBetween}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={settingStyles.rowTitle}>
                {language === "th"
                  ? "ซ่อนโปรไฟล์จากการค้นหา"
                  : "Hide Profile from Discovery"}
              </Text>
              <Text style={settingStyles.rowSub}>
                {language === "th"
                  ? "จะไม่แสดงโปรไฟล์ให้รูมเมทคนอื่นเห็น"
                  : "Your card won't appear to others"}
              </Text>
            </View>
            <Switch
              value={toggles[HIDE_PROFILE]}
              trackColor={{ true: "#C64338", false: "#EADCD3" }}
              onValueChange={(v) => updateToggle(HIDE_PROFILE, v)}
            />
          </View>

          <Pressable
            style={settingStyles.rowBetween}
            onPress={() => go("search")}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Search size={15} color="#8D7C75" />
              <Text style={settingStyles.rowTitle}>
                {language === "th" ? "ค้นหาผู้ใช้" : "Search Users"}
              </Text>
            </View>
            <ChevronRight size={16} color="#8D7C75" />
          </Pressable>

          <Pressable
            style={[settingStyles.rowBetween, { borderBottomWidth: 0 }]}
            onPress={() => go("blocked")}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Ban size={15} color="#8D7C75" />
              <Text style={settingStyles.rowTitle}>
                {language === "th" ? "ผู้ใช้ที่บล็อก" : "Blocked Users"}
              </Text>
            </View>
            <ChevronRight size={16} color="#8D7C75" />
          </Pressable>
        </View>

        <Pressable style={settingStyles.logoutBtn} onPress={handleLogout}>
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
          >
            <LogOut size={18} color="#FFFFFF" />
            <Text style={settingStyles.logoutBtnText}>
              {language === "th" ? "ออกจากระบบ" : "Log Out"}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
