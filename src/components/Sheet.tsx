import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C } from "../theme/colors";
import { MAX_WIDTH, GUTTER, shadow } from "../theme/styles";

/**
 * Bottom sheet with a dimmed backdrop. The filters panel is the main consumer;
 * it slides up over the discover screen rather than replacing it, so the user
 * keeps their place in the deck.
 */
export function Sheet({
  visible,
  onClose,
  children,
  /** Fraction of screen height the sheet occupies. */
  height = 0.82,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number;
}) {
  const slide = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get("window").height;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: visible ? 280 : 200,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "rgba(38,22,16,.45)",
          opacity: slide,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>

      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: screenHeight * height,
            backgroundColor: C.bg,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            overflow: "hidden",
            transform: [
              {
                translateY: slide.interpolate({
                  inputRange: [0, 1],
                  outputRange: [screenHeight * height, 0],
                }),
              },
            ],
          },
          shadow(3),
        ]}
      >
        <SafeAreaView edges={["bottom"]} style={{ flex: 1 }}>
          <View
            style={{
              width: 44,
              height: 5,
              borderRadius: 3,
              backgroundColor: C.line,
              alignSelf: "center",
              marginTop: 12,
            }}
          />
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: GUTTER,
              paddingTop: 18,
              paddingBottom: 28,
              gap: 16,
              width: "100%",
              maxWidth: MAX_WIDTH,
              alignSelf: "center",
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

/** Centred modal card — the time picker and confirmation dialogs. */
export function CenterModal({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(38,22,16,.4)",
          alignItems: "center",
          justifyContent: "center",
          padding: GUTTER,
        }}
      >
        {/* Swallow taps inside the card so they don't dismiss it. */}
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            {
              width: "100%",
              maxWidth: 380,
              backgroundColor: C.card,
              borderRadius: 24,
              padding: 22,
              gap: 16,
            },
            shadow(3),
          ]}
        >
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
