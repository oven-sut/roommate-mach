import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { Slider } from "../../components/Slider";
import {
  Button,
  Chevron,
  Field,
  MotionPressable,
  ScreenShell,
  Txt,
} from "../../components/ui";
import { api } from "../../services/api";
import { C } from "../../theme/colors";
import { s } from "../../theme/styles";
import { F } from "../../theme/typography";
import type { Screen } from "../../types/navigation";

type AdminConfig = {
  /** Comma-separated email domains accounts may register from. */
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

/** System configuration: allowed email domains and match-score weighting. */
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
      go("dashboard");
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
    <ScreenShell>
      <View style={[s.row, { gap: 16, height: 60 }]}>
        <MotionPressable
          onPress={() => go("dashboard")}
          pressedScale={0.9}
          style={s.iconBtn}
          accessibilityLabel="Back"
        >
          <Chevron direction="left" />
        </MotionPressable>
        <Txt role="h1" style={{ fontSize: 22 }}>
          Configuration
        </Txt>
      </View>

      <Txt role="h3">Allowed email domains</Txt>
      <Field
        value={config.emailDomains}
        onChangeText={(value) =>
          setConfig((current) => ({ ...current, emailDomains: value }))
        }
        placeholder="g.sut.ac.th, sut.ac.th"
        autoCapitalize="none"
      />

      <View style={s.rowBetween}>
        <Txt role="h3">Match weights</Txt>
        <Txt
          style={{
            fontFamily: F.bold,
            fontSize: 15,
            color: total === 100 ? C.green : C.primary,
          }}
        >
          {total}%
        </Txt>
      </View>

      {WEIGHT_ROWS.map((row) => (
        <View key={row.key} style={[s.card, { gap: 0 }]}>
          <View style={s.rowBetween}>
            <Txt role="h3" style={{ fontSize: 15 }}>
              {row.label}
            </Txt>
            <Txt style={{ fontFamily: F.bold, fontSize: 14, color: C.ink }}>
              {config.weights[row.key]}%
            </Txt>
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

      <Button onPress={save} loading={saving} style={{ marginTop: 8 }}>
        Save configuration
      </Button>
    </ScreenShell>
  );
}
