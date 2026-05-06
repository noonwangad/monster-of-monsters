import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { Companion } from "@/context/GameContext";
import { StatBar } from "./StatBar";

interface CompanionCardProps {
  companion: Companion;
  inParty: boolean;
  partyFull: boolean;
  onToggle: (id: string) => void;
}

export function CompanionCard({
  companion,
  inParty,
  partyFull,
  onToggle,
}: CompanionCardProps) {
  const colors = useColors();
  const canAdd = inParty || !partyFull;

  const handlePress = () => {
    if (!canAdd) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle(companion.id);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: inParty
            ? colors.accent + "44"
            : colors.card,
          borderColor: inParty ? colors.primary : colors.border,
          opacity: !canAdd && !inParty ? 0.4 : pressed ? 0.8 : 1,
        },
      ]}
      testID={`companion-${companion.id}`}
    >
      <View style={styles.header}>
        <View style={styles.nameBlock}>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {companion.name}
          </Text>
          <Text style={[styles.archetype, { color: colors.primary }]}>
            {companion.archetype}
          </Text>
        </View>
        {inParty && (
          <Feather name="check-circle" size={18} color={colors.primary} />
        )}
      </View>

      <Text
        style={[styles.description, { color: colors.mutedForeground }]}
        numberOfLines={2}
      >
        {companion.description}
      </Text>

      <View style={[styles.abilityBox, { borderColor: colors.border }]}>
        <Text style={[styles.abilityName, { color: colors.clue }]}>
          {companion.ability}
        </Text>
        <Text style={[styles.abilityDesc, { color: colors.mutedForeground }]}>
          {companion.abilityDesc}
        </Text>
      </View>

      <StatBar label="HP" current={companion.hp} max={companion.maxHp} color={colors.primary} />
      <StatBar label="ST" current={companion.stamina} max={companion.maxStamina} color={colors.clue} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 4,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    gap: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  nameBlock: {
    gap: 1,
  },
  name: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  archetype: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
  },
  abilityBox: {
    borderTopWidth: 1,
    paddingTop: 6,
    marginTop: 2,
    gap: 2,
  },
  abilityName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1,
  },
  abilityDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
});
