import React, { useEffect, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Alert, Animated, Image, Pressable, SafeAreaView, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { Button, Card, Chip, Field, Header, Logo, Progress, ScreenShell } from "../components/ui";
import { api, appState, saveToken } from "../services/api";
import { C } from "../theme/colors";
import { s } from "../theme/styles";
import type { Screen } from "../types/navigation";

export function SplashScreen() {
  const logoOp = useRef(new Animated.Value(0)).current;
  const logoTy = useRef(new Animated.Value(30)).current;
  const textOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOp, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(logoTy, { toValue: 0, bounciness: 12, speed: 10, useNativeDriver: true }),
      ]),
      Animated.timing(textOp, { toValue: 1, duration: 600, useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <View style={s.splash}>
      <Animated.View style={{ opacity: logoOp, transform: [{ translateY: logoTy }], alignItems: "center" }}>
        <Logo />
      </Animated.View>
      <Animated.Text style={[s.splashTag, { opacity: textOp }]}>
        Find your people. Share your space.
      </Animated.Text>
      <Animated.Text style={[s.university, { opacity: textOp }]}>
        SURANAREE UNIVERSITY OF TECHNOLOGY
      </Animated.Text>
    </View>
  );
}

