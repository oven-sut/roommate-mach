import { useMemo, useState } from "react";
import { TextInput, View } from "react-native";
import { Check, Search } from "lucide-react-native";
import { C } from "../theme/colors";
import { s } from "../theme/styles";
import { F } from "../theme/typography";
import { Sheet } from "./Sheet";
import { MotionPressable, Txt } from "./ui";

export type PickerOption = { value: string; label: string };

/**
 * Bottom-sheet single-select. Long lists (majors) get a search box; short ones
 * (gender) skip it, so the sheet does not look like a form for four choices.
 */
export function OptionPicker({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
  searchable,
}: {
  visible: boolean;
  title: string;
  options: PickerOption[];
  value?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  /** Defaults to on once the list passes ten entries. */
  searchable?: boolean;
}) {
  const [query, setQuery] = useState("");
  const showSearch = searchable ?? options.length > 10;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((o) => o.label.toLowerCase().includes(needle));
  }, [options, query]);

  return (
    <Sheet visible={visible} onClose={onClose} height={0.75}>
      <Txt role="h2">{title}</Txt>

      {showSearch ? (
        <View style={[s.input, s.row, { gap: 10 }]}>
          <Search size={18} color={C.faint} strokeWidth={1.8} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="…"
            placeholderTextColor={C.faint}
            style={{
              flex: 1,
              fontFamily: F.regular,
              fontSize: 15,
              color: C.ink,
              padding: 0,
            }}
          />
        </View>
      ) : null}

      <View style={{ gap: 2 }}>
        {filtered.map((option) => {
          const active = option.value === value;
          return (
            <MotionPressable
              key={option.value}
              pressedScale={0.99}
              onPress={() => {
                onSelect(option.value);
                setQuery("");
                onClose();
              }}
              style={[
                s.rowBetween,
                {
                  paddingVertical: 16,
                  paddingHorizontal: 4,
                  borderBottomWidth: 1,
                  borderBottomColor: C.line,
                },
              ]}
            >
              <Txt
                role="body"
                style={active ? { color: C.primary, fontFamily: F.bold } : null}
              >
                {option.label}
              </Txt>
              {active ? (
                <Check size={20} color={C.primary} strokeWidth={2.4} />
              ) : null}
            </MotionPressable>
          );
        })}
        {filtered.length === 0 ? (
          <Txt role="small" style={{ paddingVertical: 24, textAlign: "center" }}>
            —
          </Txt>
        ) : null}
      </View>
    </Sheet>
  );
}
