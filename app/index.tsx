import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { BloodDivider } from "@/components/BloodDivider";

const TAGLINE = "You are what hunts us.";

export default function MainMenu() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const titleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(titleAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [titleAnim, fadeAnim, pulseAnim]);

  const nav = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push(path as any);
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ImageBackground
        source={require("@/assets/images/vhs-bg.jpg")}
        style={styles.bgImage}
        imageStyle={styles.bgImageStyle}
        resizeMode="cover"
      />
      <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.72)" }]} />

      <View
        style={[
          styles.content,
          { paddingTop: topPad + 20, paddingBottom: botPad + 20 },
        ]}
      >
        <Animated.View
          style={[
            styles.titleBlock,
            {
              opacity: titleAnim,
              transform: [
                {
                  translateY: titleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={[styles.subtitle, { color: colors.primary }]}>
            A MONSTER OF
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            MONSTERS
          </Text>
          <BloodDivider color={colors.blood} />
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            {TAGLINE}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.menuBlock, { opacity: fadeAnim }]}>
          <MenuButton
            label="NEW HUNT"
            icon="crosshair"
            onPress={() => nav("/dossier/m1")}
            colors={colors}
            primary
          />
          <MenuButton
            label="CONTINUE"
            icon="play"
            onPress={() => nav("/vhs-shelf")}
            colors={colors}
          />
          <MenuButton
            label="PARTY"
            icon="users"
            onPress={() => nav("/party")}
            colors={colors}
          />
          <MenuButton
            label="BESTIARY"
            icon="book-open"
            onPress={() => nav("/bestiary")}
            colors={colors}
          />
        </Animated.View>

        <Animated.View style={[styles.footer, { opacity: pulseAnim }]}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            PRESS ANY KEY TO BEGIN
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

interface MenuButtonProps {
  label: string;
  icon: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  primary?: boolean;
}

function MenuButton({ label, icon, onPress, colors, primary }: MenuButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      testID={`menu-${label}`}
    >
      <Animated.View
        style={[
          styles.menuButton,
          {
            backgroundColor: primary ? colors.blood + "55" : colors.card,
            borderColor: primary ? colors.primary : colors.border,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Feather name={icon as any} size={16} color={primary ? colors.primary : colors.mutedForeground} />
        <Text
          style={[
            styles.menuLabel,
            { color: primary ? colors.foreground : colors.mutedForeground },
          ]}
        >
          {label}
        </Text>
        <Feather name="chevron-right" size={14} color={colors.border} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bgImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgImageStyle: {
    opacity: 0.35,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  titleBlock: {
    gap: 4,
  },
  subtitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 6,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 44,
    letterSpacing: 3,
    lineHeight: 52,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    letterSpacing: 1,
    fontStyle: "italic",
    marginTop: 6,
  },
  menuBlock: {
    gap: 8,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 4,
    borderWidth: 1,
    gap: 12,
  },
  menuLabel: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: 2,
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    letterSpacing: 2,
  },
});
