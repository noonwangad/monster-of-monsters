import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

interface VHSFilterProps {
  children: React.ReactNode;
  intensity?: number;
}

export function VHSFilter({ children, intensity = 1 }: VHSFilterProps) {
  const scanAnim = useRef(new Animated.Value(0)).current;
  const noiseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(scanAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(noiseAnim, {
          toValue: 1,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(noiseAnim, {
          toValue: 0,
          duration: 80,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scanAnim, noiseAnim]);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 820],
  });

  const noiseOpacity = noiseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.04 * intensity],
  });

  return (
    <View style={styles.container}>
      {children}
      <Animated.View
        style={[
          styles.scanLine,
          {
            transform: [{ translateY }],
            opacity: 0.08 * intensity,
          },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.noiseOverlay, { opacity: noiseOpacity }]}
        pointerEvents="none"
      />
      <View style={[styles.vignette]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#ffffff",
  },
  noiseOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ff0000",
  },
  vignette: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
  },
});
