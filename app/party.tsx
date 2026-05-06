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
import { CompanionCard } from "@/components/CompanionCard";
import { BloodDivider } from "@/components/BloodDivider";

export default function PartyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, addCompanionToParty, removeCompanionFromParty } = useGame();

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const unlockedCompanions = state.companions.filter((c) => c.unlocked);
  const partyFull = state.activeParty.length >= 3;

  const handleToggle = (id: string) => {
    if (state.activeParty.includes(id)) {
      removeCompanionFromParty(id);
    } else {
      addCompanionToParty(id);
    }
  };

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
            <Text style={[styles.title, { color: colors.foreground }]}>PARTY</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              SELECT UP TO 3 COMPANIONS
            </Text>
          </View>
        </View>

        <BloodDivider color={colors.blood} />

        <View style={styles.partySlots}>
          {[0, 1, 2].map((i) => {
            const cid = state.activeParty[i];
            const comp = state.companions.find((c) => c.id === cid);
            return (
              <View
                key={i}
                style={[
                  styles.partySlot,
                  {
                    backgroundColor: comp ? colors.accent + "33" : colors.secondary,
                    borderColor: comp ? colors.primary : colors.border,
                  },
                ]}
              >
                {comp ? (
                  <>
                    <Text style={[styles.slotName, { color: colors.foreground }]}>
                      {comp.name}
                    </Text>
                    <Text style={[styles.slotRole, { color: colors.primary }]}>
                      {comp.archetype}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.slotEmpty, { color: colors.mutedForeground }]}>
                    OPEN SLOT
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          AVAILABLE HUNTERS — {unlockedCompanions.length} RECRUITED
        </Text>

        {unlockedCompanions.map((comp) => (
          <CompanionCard
            key={comp.id}
            companion={comp}
            inParty={state.activeParty.includes(comp.id)}
            partyFull={partyFull}
            onToggle={handleToggle}
          />
        ))}

        {state.companions.filter((c) => !c.unlocked).length > 0 && (
          <>
            <BloodDivider color={colors.blood} />
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              LOCKED HUNTERS — COMPLETE MISSIONS TO RECRUIT
            </Text>
            {state.companions
              .filter((c) => !c.unlocked)
              .map((comp) => (
                <View
                  key={comp.id}
                  style={[
                    styles.lockedCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Feather name="lock" size={14} color={colors.mutedForeground} />
                  <View>
                    <Text style={[styles.lockedName, { color: colors.mutedForeground }]}>
                      {comp.name}
                    </Text>
                    <Text style={[styles.lockedRole, { color: colors.border }]}>
                      {comp.archetype}
                    </Text>
                  </View>
                </View>
              ))}
          </>
        )}
      </ScrollView>
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
  partySlots: {
    flexDirection: "row",
    gap: 8,
  },
  partySlot: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  slotName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    textAlign: "center",
  },
  slotRole: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  slotEmpty: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    letterSpacing: 2,
  },
  sectionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  lockedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
  },
  lockedName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  lockedRole: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
});
