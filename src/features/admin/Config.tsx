import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AlertTriangle, Calculator, CheckCircle, HelpCircle, Settings } from "lucide-react-native";
import { Slider } from "../../components/Slider";
import { Button, Field, Txt } from "../../components/ui";
import { CenterModal } from "../../components/Sheet";
import { useI18n } from "../../i18n";
import { api } from "../../services/api";
import { C } from "../../theme/colors";
import { F } from "../../theme/typography";
import type { Screen } from "../../types/navigation";
import { AdminLayout } from "./AdminLayout";

type AdminConfig = {
  emailDomains: string;
  weights: {
    cleanliness: number;
    sleep: number;
    guests: number;
    temperature: number;
  };
};

const DEFAULTS: AdminConfig = {
  emailDomains: "g.sut.ac.th, sut.ac.th",
  weights: { cleanliness: 25, sleep: 25, guests: 25, temperature: 25 },
};

const WEIGHT_ROWS = [
  {
    key: "cleanliness" as const,
    label: "Cleanliness (ความสะอาดและระเบียบ)",
    icon: "🧹",
    desc: "ระดับความสะอาดและระเบียบวินัยในห้อง",
  },
  {
    key: "sleep" as const,
    label: "Sleep schedule (เวลาเข้านอนและตื่นนอน)",
    icon: "🌙",
    desc: "ความสอดคล้องของช่วงเวลานอนและตื่น",
  },
  {
    key: "guests" as const,
    label: "Guests & social (การพาเพื่อนมาและค้างคืน)",
    icon: "👥",
    desc: "ความถี่การรับแขกและการอนุญาตค้างคืน",
  },
  {
    key: "temperature" as const,
    label: "Temp & study (อุณหภูมิแอร์และสถานที่เรียน)",
    icon: "❄️",
    desc: "อุณหภูมิแอร์ที่ชอบ และระดับความเงียบในการอ่านหนังสือ",
  },
];

export function Config({ go }: { go: (x: Screen) => void }) {
  const { language } = useI18n();
  const [config, setConfig] = useState<AdminConfig>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  // Custom modal alert state (replaces browser default window.alert)
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    visible: false,
    type: "error",
    title: "",
    message: "",
  });

  useEffect(() => {
    api<Partial<AdminConfig>>("/api/admin/config")
      .then((data) =>
        setConfig({
          emailDomains: data?.emailDomains ?? DEFAULTS.emailDomains,
          weights: { ...DEFAULTS.weights, ...(data?.weights ?? {}) },
        }),
      )
      .catch(() => undefined);
  }, []);

  const total = WEIGHT_ROWS.reduce(
    (sum, row) => sum + config.weights[row.key],
    0,
  );

  // Live simulation calculation example:
  const simClean = Math.round(100 * (config.weights.cleanliness / 100));
  const simSleep = Math.round(80 * (config.weights.sleep / 100));
  const simGuests = Math.round(60 * (config.weights.guests / 100));
  const simTemp = Math.round(50 * (config.weights.temperature / 100));
  const simTotal = simClean + simSleep + simGuests + simTemp;

  const save = async () => {
    if (total !== 100) {
      const reasonText =
        total > 100
          ? `ไม่สามารถบันทึกได้เนื่องจากผลรวมค่าน้ำหนักเกิน 100% (ปัจจุบันรวมได้ ${total}%)\n\nกรุณาปรับลดค่าน้ำหนักลงให้รวมกันได้ 100% พอดี`
          : `ไม่สามารถบันทึกได้เนื่องจากผลรวมค่าน้ำหนักยังไม่ครบ 100% (ปัจจุบันรวมได้ ${total}%)\n\nกรุณาเพิ่มค่าน้ำหนักขึ้นให้รวมกันได้ 100% พอดี`;

      setAlertModal({
        visible: true,
        type: "error",
        title: "ไม่สามารถบันทึกการตั้งค่าได้",
        message: reasonText,
      });
      return;
    }

    try {
      setSaving(true);
      await api("/api/admin/config", {
        method: "PUT",
        body: JSON.stringify(config),
      });

      setAlertModal({
        visible: true,
        type: "success",
        title: "บันทึกการตั้งค่าสำเร็จ",
        message:
          "ระบบได้บันทึกค่าน้ำหนักเรียบร้อยแล้ว อัลกอริทึมจะเริ่มใช้ค่าน้ำหนักชุดใหม่นี้ในการคำนวณคะแนนจับคู่ของผู้ใช้ทุกคนทันที",
      });
    } catch (reason) {
      setAlertModal({
        visible: true,
        type: "error",
        title: "ไม่สามารถบันทึกได้",
        message:
          reason instanceof Error ? reason.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout currentScreen="config" go={go}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Settings size={20} color="#8B1E1E" />
          <Text style={styles.cardTitle}>ตั้งค่าระบบ (System Configuration)</Text>
        </View>

        <Text style={styles.sectionLabel}>โดเมนอีเมลที่อนุญาต (Allowed Email Domains)</Text>
        <Field
          value={config.emailDomains}
          onChangeText={(value) =>
            setConfig((current) => ({ ...current, emailDomains: value }))
          }
          placeholder="g.sut.ac.th, sut.ac.th"
          autoCapitalize="none"
        />

        <View style={styles.weightHeaderRow}>
          <Text style={styles.sectionLabel}>ค่าน้ำหนักอัลกอริทึมคะแนนจับคู่ (Match Score Weights)</Text>
          <Text
            style={[
              styles.totalWeightText,
              { color: total === 100 ? "#10B981" : "#EF4444" },
            ]}
          >
            {total}% / 100%
          </Text>
        </View>

        {WEIGHT_ROWS.map((row) => (
          <View key={row.key} style={styles.weightBox}>
            <View style={styles.weightRowBetween}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 16 }}>{row.icon}</Text>
                <Text style={styles.weightLabel}>{row.label}</Text>
              </View>
              <Text style={styles.weightValueText}>{config.weights[row.key]}%</Text>
            </View>
            <Text style={styles.weightDesc}>{row.desc}</Text>
            <Slider
              min={0}
              max={60}
              step={5}
              value={config.weights[row.key]}
              onChange={(value) =>
                setConfig((current) => ({
                  ...current,
                  weights: { ...current.weights, [row.key]: value },
                }))
              }
              labels={["0%", "60%"]}
            />
          </View>
        ))}

        {/* Informational Callout Card - Easy to understand concept (Bottom) */}
        <View style={styles.infoBox}>
          <View style={styles.infoTitleRow}>
            <HelpCircle size={18} color="#1E40AF" />
            <Text style={styles.infoTitle}>💡 วิธีคิดคะแนนจับคู่ (Match Score Concept)</Text>
          </View>
          <Text style={styles.infoText}>
            • <Text style={{ fontFamily: F.bold }}>ค่าน้ำหนัก (%)</Text> คือระดับความสำคัญของแต่ละหมวดที่แอดมินกำหนด (ทั้ง 4 หมวดรวมกันต้องได้ 100% พอดี)
          </Text>
          <Text style={styles.infoText}>
            • <Text style={{ fontFamily: F.bold }}>คะแนนสุทธิ</Text> คิดจากนำ "% ความตรงกันของคู่ผู้ใช้" ในแต่ละหมวด คูณกับ "% น้ำหนักความสำคัญ" แล้วนำคะแนนทั้ง 4 หมวดมารวมกัน
          </Text>
        </View>

        {/* Live Simulation Card - Clean structured breakdown (Bottom) */}
        <View style={styles.simBox}>
          <View style={styles.infoTitleRow}>
            <Calculator size={18} color="#047857" />
            <Text style={styles.simTitle}>🧮 ตัวอย่างการคำนวณจริง (Live Simulation)</Text>
          </View>
          <Text style={styles.simDesc}>
            สมมติผู้ใช้ 2 คนมีความตรงกันดังนี้ (ความสะอาด 100%, นอน 80%, แขก 60%, อุณหภูมิ 50%):
          </Text>
          <View style={styles.simGrid}>
            <View style={styles.simRowItem}>
              <Text style={styles.simItemLabel}>🧹 ความสะอาด (ตรงกัน 100%)</Text>
              <Text style={styles.simItemMath}>100% × {config.weights.cleanliness}% = <Text style={{ fontFamily: F.bold, color: "#047857" }}>+{simClean}%</Text></Text>
            </View>
            <View style={styles.simRowItem}>
              <Text style={styles.simItemLabel}>🌙 เวลานอน (ตรงกัน 80%)</Text>
              <Text style={styles.simItemMath}>80% × {config.weights.sleep}% = <Text style={{ fontFamily: F.bold, color: "#047857" }}>+{simSleep}%</Text></Text>
            </View>
            <View style={styles.simRowItem}>
              <Text style={styles.simItemLabel}>👥 การรับแขก (ตรงกัน 60%)</Text>
              <Text style={styles.simItemMath}>60% × {config.weights.guests}% = <Text style={{ fontFamily: F.bold, color: "#047857" }}>+{simGuests}%</Text></Text>
            </View>
            <View style={styles.simRowItem}>
              <Text style={styles.simItemLabel}>❄️ อุณหภูมิ (ตรงกัน 50%)</Text>
              <Text style={styles.simItemMath}>50% × {config.weights.temperature}% = <Text style={{ fontFamily: F.bold, color: "#047857" }}>+{simTemp}%</Text></Text>
            </View>
          </View>
          <View style={styles.simResultBadge}>
            <Text style={styles.simResultLabel}>คะแนนแมตช์รวมของคู่นี้ (Total Score):</Text>
            <View style={styles.scorePill}>
              <Text style={styles.simResultValue}>{simClean} + {simSleep} + {simGuests} + {simTemp} = {simTotal}%</Text>
            </View>
          </View>
        </View>

        <Button onPress={save} loading={saving} style={{ marginTop: 8 }}>
          บันทึกการตั้งค่าระบบ (Save Configuration)
        </Button>
      </View>

      {/* Custom Styled Modal Dialog (no default browser window.alert pop-up) */}
      <CenterModal
        visible={alertModal.visible}
        onClose={() => setAlertModal((prev) => ({ ...prev, visible: false }))}
      >
        <View style={{ alignItems: "center", gap: 12, paddingVertical: 6 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: alertModal.type === "success" ? "#ECFDF5" : "#FEF2F2",
              borderWidth: 1,
              borderColor: alertModal.type === "success" ? "#A7F3D0" : "#FCA5A5",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {alertModal.type === "success" ? (
              <CheckCircle size={32} color="#047857" strokeWidth={2} />
            ) : (
              <AlertTriangle size={32} color="#DC2626" strokeWidth={2} />
            )}
          </View>

          <Txt role="h2" style={{ textAlign: "center", fontSize: 18 }}>
            {alertModal.title}
          </Txt>

          <Txt
            role="body"
            style={{
              color: C.muted,
              textAlign: "center",
              lineHeight: 20,
              fontSize: 14,
            }}
          >
            {alertModal.message}
          </Txt>

          <Button
            tone={alertModal.type === "success" ? "wine" : "outline"}
            style={{ width: "100%", height: 46, marginTop: 10 }}
            onPress={() => setAlertModal((prev) => ({ ...prev, visible: false }))}
          >
            {language === "th" ? "ตกลง" : "OK"}
          </Button>
        </View>
      </CenterModal>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  cardTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    color: "#111827",
  },
  sectionLabel: {
    fontFamily: F.bold,
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
    marginTop: 10,
  },
  weightHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  totalWeightText: {
    fontFamily: F.bold,
    fontSize: 16,
  },
  infoBox: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    padding: 14,
    marginVertical: 12,
    gap: 6,
  },
  infoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: "#1E40AF",
  },
  infoText: {
    fontFamily: F.regular,
    fontSize: 13,
    color: "#1E3A8A",
    lineHeight: 18,
  },
  formulaCallout: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  formulaText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: "#1E40AF",
    lineHeight: 18,
  },
  simBox: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  simTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: "#047857",
  },
  simDesc: {
    fontFamily: F.regular,
    fontSize: 12,
    color: "#065F46",
  },
  simGrid: {
    gap: 6,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  simRowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  simItemLabel: {
    fontFamily: F.semibold,
    fontSize: 12,
    color: "#065F46",
  },
  simItemMath: {
    fontFamily: F.regular,
    fontSize: 12,
    color: "#047857",
  },
  simResultBadge: {
    marginTop: 4,
    gap: 6,
  },
  simResultLabel: {
    fontFamily: F.bold,
    fontSize: 13,
    color: "#065F46",
  },
  scorePill: {
    backgroundColor: "#D1FAE5",
    borderWidth: 1,
    borderColor: "#10B981",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  simResultValue: {
    fontFamily: F.bold,
    fontSize: 16,
    color: "#047857",
  },
  weightBox: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  weightRowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  weightLabel: {
    fontFamily: F.semibold,
    fontSize: 14,
    color: "#111827",
  },
  weightDesc: {
    fontFamily: F.regular,
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 8,
  },
  weightValueText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: "#8B1E1E",
  },
});
