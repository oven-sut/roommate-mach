import { useEffect, useState } from "react";
import { View } from "react-native";
import { useI18n } from "../../i18n";
import { appState } from "../../services/api";
import { OptionPicker } from "../../components/OptionPicker";
import { RangeSlider, Slider } from "../../components/Slider";
import { Segmented } from "../../components/Segmented";
import { Sheet } from "../../components/Sheet";
import {
  Button,
  Chevron,
  Chip,
  Field,
  MotionPressable,
  SectionLabel,
  Txt,
} from "../../components/ui";
import { C } from "../../theme/colors";
import { s } from "../../theme/styles";
import { F } from "../../theme/typography";
import { MAJOR_OPTIONS, labelFor } from "../profile/profile.content";
import {
  BUDGET_MAX,
  BUDGET_MIN,
  BUDGET_STEP,
  MUST_MATCH,
  YEAR_BANDS,
} from "./discovery.content";

export type FeedFilters = typeof appState.feedFilters;

const DEFAULTS: FeedFilters = {
  yearBand: "everyone",
  major: "",
  budgetMin: 3500,
  budgetMax: 6000,
  mustMatch: [],
  minScore: 25,
};

function money(value: number) {
  return value.toLocaleString("en-US");
}

/**
 * Discover filters, presented as a sheet over the deck.
 *
 * Edits are held locally and only committed on Apply, so dismissing the sheet
 * leaves the current results alone.
 */
export function Filters({
  visible,
  onClose,
  onApply,
}: {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FeedFilters) => void;
}) {
  const { t, language } = useI18n();
  const [draft, setDraft] = useState<FeedFilters>({ ...appState.feedFilters });
  const [majorPicker, setMajorPicker] = useState(false);

  // The sheet stays mounted behind the feed, so its draft has to be re-seeded
  // each time it opens — otherwise edits abandoned last time (or a "Reset all"
  // that was never applied) would still be showing.
  useEffect(() => {
    if (visible) setDraft({ ...appState.feedFilters });
  }, [visible]);

  const patch = (changes: Partial<FeedFilters>) =>
    setDraft((current) => ({ ...current, ...changes }));

  const toggleMustMatch = (value: string) =>
    patch({
      mustMatch: draft.mustMatch.includes(value)
        ? draft.mustMatch.filter((v) => v !== value)
        : [...draft.mustMatch, value],
    });

  return (
    <>
      <Sheet visible={visible} onClose={onClose} height={0.86}>
        <View style={s.rowBetween}>
          <Txt role="h1" style={{ fontSize: 24 }}>
            {t("filters")}
          </Txt>
          <MotionPressable
            onPress={() => setDraft({ ...DEFAULTS })}
            hitSlop={10}
          >
            <Txt role="link" style={{ fontSize: 15 }}>
              {t("resetAll")}
            </Txt>
          </MotionPressable>
        </View>

        <SectionLabel>{t("showMe")}</SectionLabel>
        <Segmented
          size="sm"
          options={YEAR_BANDS.map((band) => ({
            value: band.value,
            label: t(band.key),
          }))}
          value={draft.yearBand}
          onChange={(value) => patch({ yearBand: value })}
        />

        <SectionLabel>{t("major")}</SectionLabel>
        <Field
          value={
            draft.major ? labelFor(MAJOR_OPTIONS, draft.major, language) : t("anyOption")
          }
          onPress={() => setMajorPicker(true)}
          right={<Chevron direction="down" size={8} />}
        />

        <View style={[s.card, { gap: 0 }]}>
          <View style={s.rowBetween}>
            <Txt role="h3" style={{ fontSize: 15 }}>
              {t("budget")}{" "}
              <Txt role="tiny">({t("perMonth")})</Txt>
            </Txt>
            <Txt style={{ fontFamily: F.bold, fontSize: 14, color: C.ink }}>
              {money(draft.budgetMin)} - {money(draft.budgetMax)}
            </Txt>
          </View>
          <RangeSlider
            min={BUDGET_MIN}
            max={BUDGET_MAX}
            step={BUDGET_STEP}
            low={draft.budgetMin}
            high={draft.budgetMax}
            onChange={(low, high) => patch({ budgetMin: low, budgetMax: high })}
            labels={[money(BUDGET_MIN), money(BUDGET_MAX)]}
          />
        </View>

        <SectionLabel>{t("mustMatchOn")}</SectionLabel>
        <View style={[s.wrap, { rowGap: 12 }]}>
          {MUST_MATCH.map((item) => (
            <Chip
              key={item.value}
              active={draft.mustMatch.includes(item.value)}
              onPress={() => toggleMustMatch(item.value)}
            >
              {t(item.key)}
            </Chip>
          ))}
        </View>

        <View style={[s.card, { gap: 0 }]}>
          <View style={s.rowBetween}>
            <Txt role="h3" style={{ fontSize: 15 }}>
              {t("minMatchScore")}
            </Txt>
            <Txt style={{ fontFamily: F.bold, fontSize: 14, color: C.ink }}>
              {draft.minScore}%
            </Txt>
          </View>
          <Slider
            min={25}
            max={95}
            step={5}
            value={draft.minScore}
            onChange={(value) => patch({ minScore: value })}
            labels={["25%", "50%", "75%", "95%"]}
          />
        </View>

        <Button
          style={{ marginTop: 8 }}
          onPress={() => {
            appState.feedFilters = draft;
            onApply(draft);
            onClose();
          }}
        >
          {t("apply")}
        </Button>
      </Sheet>

      <OptionPicker
        visible={majorPicker}
        title={t("major")}
        value={draft.major}
        options={[
          { value: "", label: t("anyOption") },
          ...MAJOR_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label[language],
          })),
        ]}
        onSelect={(value) => patch({ major: value })}
        onClose={() => setMajorPicker(false)}
      />
    </>
  );
}
