import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Settings } from "lucide-react-native";
import { Slider } from "../../components/Slider";
import { Button, Field } from "../../components/ui";
import { api } from "../../services/api";
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
  { key: "cleanliness" as const, label: "Cleanliness" },
  { key: "sleep" as const, label: "Sleep schedule" },
  { key: "guests" as const, label: "Guests & social" },
  { key: "temperature" as const, label: "Temp & study" },
];

export function Config({ go }: { go: (x: Screen) => void }) {
  const [config, setConfig] = useState<AdminConfig>(DEFAULTS);
  const [saving, setSaving] = useState(false);

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

  const save = async () => {
    if (total !== 100) {
      Alert.alert("Match weights", `Weights must total 100% (currently ${total}%).`);
      return;
    }
    try {
      setSaving(true);
      await api("/api/admin/config", {
        method: "PUT",
        body: JSON.stringify(config),
      });
      Alert.alert("Success", "Configuration saved successfully.");
    } catch (reason) {
      Alert.alert(
        "Configuration",
        reason instanceof Error ? reason.message : "Unable to save",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout currentScreen="config" go={go}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Settings size={20} color="#8B1E1E" />
          <Text style={styles.cardTitle}>System Configuration</Text>
        </View>

        <Text style={styles.sectionLabel}>Allowed Email Domains</Text>
        <Field
          value={config.emailDomains}
          onChangeText={(value) =>
            setConfig((current) => ({ ...current, emailDomains: value }))
          }
          placeholder="g.sut.ac.th, sut.ac.th"
          autoCapitalize="none"
        />

        <View style={styles.weightHeaderRow}>
          <Text style={styles.sectionLabel}>Match Score Algorithm Weights</Text>
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
              <Text style={styles.weightLabel}>{row.label}</Text>
              <Text style={styles.weightValueText}>{config.weights[row.key]}%</Text>
            </View>
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

        <Button onPress={save} loading={saving} style={{ marginTop: 16 }}>
          Save Configuration
        </Button>
      </View>
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
    fontSize: 15,
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
    marginBottom: 6,
  },
  weightLabel: {
    fontFamily: F.medium,
    fontSize: 14,
    color: "#111827",
  },
  weightValueText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: "#8B1E1E",
  },
});
