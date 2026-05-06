import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useGame } from "@/context/GameContext";
import { BloodDivider } from "@/components/BloodDivider";

export default function BestiaryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state } = useGame();

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const hiddenMonsterList = Object.entries(state.hiddenMonsters);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 10, paddingBottom: botPad + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.foreground }]}>BESTIARY</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              CATALOGUED ENTITIES
            </Text>
          </View>
        </View>

        <BloodDivider color={colors.blood} />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          BOSS MONSTERS
        </Text>

        {state.missions.map((m) => (
          <View
            key={m.id}
            style={[
              styles.entryCard,
              {
                backgroundColor: m.completed ? colors.card : colors.secondary,
                borderColor: m.completed ? colors.primary : colors.border,
                opacity: m.unlocked ? 1 : 0.4,
              },
            ]}
          >
            <View style={styles.entryHeader}>
              <View style={styles.entryTitle}>
                <Text style={[styles.bossName, { color: m.completed ? colors.foreground : colors.mutedForeground }]}>
                  {m.completed ? m.bossName : "??? UNKNOWN ???"}
                </Text>
                <Text style={[styles.missionRef, { color: colors.mutedForeground }]}>
                  {m.title} — {m.location}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: m.completed ? colors.blood : colors.border },
                ]}
              >
                <Text style={[styles.statusText, { color: m.completed ? colors.foreground : colors.mutedForeground }]}>
                  {m.completed ? "KILLED" : m.unlocked ? "ACTIVE" : "LOCKED"}
                </Text>
              </View>
            </View>
            {m.completed && (
              <Text style={[styles.bossDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                {m.bossDescription}
              </Text>
            )}
          </View>
        ))}

        <BloodDivider color={colors.blood} />

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          HIDDEN ENTITIES — {hiddenMonsterList.length} UNLOCKED
        </Text>

        {hiddenMonsterList.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <Feather name="eye-off" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.mutedForeground }]}>
              No entities catalogued
            </Text>
            <Text style={[styles.emptyText, { color: colors.border }]}>
              Collect 8 clues in a mission to reveal hidden monsters
            </Text>
          </View>
        ) : (
          hiddenMonsterList.map(([missionId, monster]) => (
            <View
              key={missionId}
              style={[styles.hiddenCard, { backgroundColor: colors.accent + "22", borderColor: colors.accent }]}
            >
              <View style={styles.entryHeader}>
                <View>
                  <Text style={[styles.hiddenName, { color: colors.primary }]}>
                    {monster.name}
                  </Text>
                  <Text style={[styles.hiddenType, { color: colors.mutedForeground }]}>
                    {monster.type}
                  </Text>
                </View>
                <View style={styles.statBlock}>
                  <StatPill label="HP" value={`${monster.hp}`} colors={colors} />
                  <StatPill label="DMG" value={`${monster.damage}`} colors={colors} />
                </View>
              </View>
              <Text style={[styles.hiddenDesc, { color: colors.mutedForeground }]}>
                {monster.description}
              </Text>
              <View style={styles.weakRow}>
                <Text style={[styles.weakLabel, { color: colors.clue }]}>WEAK TO: </Text>
                <Text style={[styles.weakValues, { color: colors.foreground }]}>
                  {monster.weaknesses.join(", ")}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function StatPill({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statPillLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statPillValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingTop: 6,
  },
  backBtn: { padding: 4 },
  headerText: { gap: 2 },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    letterSpacing: 2,
  },
  sectionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  entryCard: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    gap: 8,
  },
  entryHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  entryTitle: { flex: 1, gap: 2, paddingRight: 10 },
  bossName: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  missionRef: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
  },
  statusText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    letterSpacing: 1.5,
  },
  bossDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    borderWidth: 1,
    borderRadius: 4,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  hiddenCard: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    gap: 8,
  },
  hiddenName: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    letterSpacing: 1,
  },
  hiddenType: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    letterSpacing: 1.5,
  },
  hiddenDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
  },
  weakRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  weakLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1,
  },
  weakValues: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    flex: 1,
  },
  statBlock: {
    flexDirection: "row",
    gap: 8,
  },
  statPill: {
    alignItems: "center",
    gap: 1,
  },
  statPillLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    letterSpacing: 1,
  },
  statPillValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
});
