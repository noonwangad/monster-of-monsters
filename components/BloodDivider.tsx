import React from "react";
import { View, StyleSheet } from "react-native";

interface BloodDividerProps {
  color?: string;
}

export function BloodDivider({ color = "#8b0000" }: BloodDividerProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: color }]} />
      <View style={[styles.drip1, { backgroundColor: color }]} />
      <View style={[styles.drip2, { backgroundColor: color }]} />
      <View style={[styles.drip3, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 14,
    position: "relative",
    marginVertical: 4,
  },
  line: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  drip1: {
    position: "absolute",
    top: 2,
    left: "20%",
    width: 3,
    height: 10,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  drip2: {
    position: "absolute",
    top: 2,
    left: "50%",
    width: 4,
    height: 7,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  drip3: {
    position: "absolute",
    top: 2,
    left: "75%",
    width: 2,
    height: 12,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
});
