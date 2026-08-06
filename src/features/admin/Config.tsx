import { Text, View } from "react-native";
import { Button, Card, Chip, Header, ScreenShell } from "../../components/ui";
import { s } from "../../theme/styles";
import type { Screen } from "../../types/navigation";

/**
 * Static placeholder copy — this screen is not wired to
 * `GET/PUT /api/admin/config` yet, so nothing here is editable.
 */
const MATCH_WEIGHTS: [string, string][] = [
  ["Cleanliness", "25%"],
  ["Sleep Schedule", "20%"],
  ["Noise & Chores", "15%"],
];

export function Config({ go }: { go: (x: Screen) => void }) {
  return (
    <ScreenShell>
      <Header title="Configurations" back={() => go("dashboard")} />
      <Text style={s.bigTitleLeft}>Universities</Text>
      <Card>
        <Text style={s.title}>Suranaree Univ.</Text>
        <Text style={s.muted}>@g.sut.ac.th, @sut.ac.th</Text>
        <Button outline tone="wine">
          Edit Domains
        </Button>
      </Card>
      <Button outline tone="wine">
        ＋ Add University
      </Button>
      <Text style={s.bigTitleLeft}>Match Weights</Text>
      {MATCH_WEIGHTS.map(([label, weight]) => (
        <Card key={label}>
          <View style={s.rowBetween}>
            <Text style={s.title}>{label}</Text>
            <Chip>{weight}</Chip>
          </View>
        </Card>
      ))}
      <Button outline tone="wine">
        ＋ Add Question
      </Button>
    </ScreenShell>
  );
}
