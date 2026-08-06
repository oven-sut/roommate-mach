import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { auth } from "../auth.styles";

export function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  secure = false,
  action,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secure?: boolean;
  action?: React.ReactNode;
}) {
  const [hidden, setHidden] = useState(secure);

  return (
    <View style={auth.fieldGroup}>
      <Text style={auth.fieldLabel}>{label}</Text>
      <View style={auth.field}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#74675E"
          secureTextEntry={secure && hidden}
          autoCapitalize="none"
          style={auth.fieldInput}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
            hitSlop={10}
            onPress={() => setHidden((current) => !current)}
          >
            <Text style={auth.eye}>{hidden ? "◉" : "⊘"}</Text>
          </Pressable>
        ) : null}
        {action}
      </View>
    </View>
  );
}

