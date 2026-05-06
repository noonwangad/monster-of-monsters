import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface StatBarProps {
  label: string;
  current: number;
  max: number;
  color?: string;
  height?: number;
}

export function StatBar({ label, current, max, color, height = 8 }: StatBarProps) {
  const colors = useColors();
  const barColor = color ?? colors.primary;
  const pct = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  const anim = useRef(new Animated.Value(pct)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [pct, anim]);

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[styles.track, { height, backgroundColor: colors.secondary, borderRadius: 2 }]}>
        <Animated.View
          style={[styles.fill, { width, height, backgroundColor: barColor, borderRadius: 2 }]}
        />
      </View>
      <Text style={[styles.value, { color: colors.foreground }]}>
        {current}/{max}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 2,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    width: 24,
    letterSpacing: 1,
  },
  track: {
    flex: 1,
    overflow: "hidden",
  },
  fill: {},
  value: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    width: 44,
    textAlign: "right",
  },
});
