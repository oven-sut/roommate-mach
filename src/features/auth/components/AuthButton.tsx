import { Pressable, Text } from "react-native";
import { auth } from "../auth.styles";

export function AuthButton({
  children,
  onPress,
  disabled = false,
}: {
  children: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        auth.primaryButton,
        pressed && auth.primaryButtonPressed,
        disabled && auth.primaryButtonDisabled,
      ]}
    >
      <Text style={auth.primaryButtonText}>{children}</Text>
    </Pressable>
  );
}

